/**
 * Notification Service for Snow Dashboard
 *
 * Features:
 * - Service Worker registration for push notifications
 * - Browser Notification API fallback
 * - Alert threshold checking
 * - Deduplication (no repeat alerts within 1 hour)
 * - User preference persistence
 */

import type { WeatherData } from './weatherService';

// Alert types
export type AlertType = 'forecast_warning' | 'threshold_reached' | 'drift_warning';
export type AlertLevel = 'residential' | 'commercial';

export interface SnowAlert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  zone: string;
  zoneId: string;
  amount: number;
  timestamp: Date;
  message: string;
  urgent: boolean;
}

// Thresholds (cm)
const RESIDENTIAL_THRESHOLD = 1.0;
const COMMERCIAL_THRESHOLD = 5.0;
const DRIFT_WIND_THRESHOLD = 35; // km/h

// Deduplication window (1 hour)
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

// Storage keys
const STORAGE_KEY_ENABLED = 'snow-alerts-enabled';
const STORAGE_KEY_SENT = 'snow-alerts-sent';

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private sentAlerts: Map<string, Date> = new Map();
  private isEnabled: boolean = false;
  private onAlertCallbacks: ((alert: SnowAlert) => void)[] = [];

  constructor() {
    this.loadSentAlerts();
    this.loadPreferences();
  }

  /**
   * Initialize the notification service
   * Registers Service Worker and requests permission
   */
  async init(): Promise<boolean> {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Notifications not supported');
      return false;
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[NotificationService] Service Worker registered:', this.registration);
      } catch (error) {
        console.error('[NotificationService] Service Worker registration failed:', error);
      }
    }

    // Check existing permission
    if (Notification.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    return false;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.isEnabled = permission === 'granted';
    this.savePreferences();

    console.log('[NotificationService] Permission:', permission);
    return this.isEnabled;
  }

  /**
   * Check if notifications are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled && Notification.permission === 'granted';
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.savePreferences();
  }

  /**
   * Subscribe to alert events
   */
  onAlert(callback: (alert: SnowAlert) => void): () => void {
    this.onAlertCallbacks.push(callback);
    return () => {
      this.onAlertCallbacks = this.onAlertCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Check weather data for alert conditions
   * Returns alerts that should be shown
   */
  checkForAlerts(weatherData: Map<string, WeatherData>, zoneNames: Map<string, string>): SnowAlert[] {
    const alerts: SnowAlert[] = [];
    const now = new Date();

    weatherData.forEach((data, zoneId) => {
      const zoneName = zoneNames.get(zoneId) || zoneId;

      // Check for commercial threshold (5cm+)
      if (data.pastSnow24h >= COMMERCIAL_THRESHOLD) {
        const alertId = `commercial-${zoneId}`;
        if (!this.wasRecentlySent(alertId)) {
          alerts.push({
            id: alertId,
            type: 'threshold_reached',
            level: 'commercial',
            zone: zoneName,
            zoneId,
            amount: data.pastSnow24h,
            timestamp: now,
            message: `Commercial Alert: ${zoneName} - ${data.pastSnow24h.toFixed(1)}cm accumulated`,
            urgent: true
          });
        }
      }
      // Check for residential threshold (1cm+)
      else if (data.pastSnow24h >= RESIDENTIAL_THRESHOLD) {
        const alertId = `residential-${zoneId}`;
        if (!this.wasRecentlySent(alertId)) {
          alerts.push({
            id: alertId,
            type: 'threshold_reached',
            level: 'residential',
            zone: zoneName,
            zoneId,
            amount: data.pastSnow24h,
            timestamp: now,
            message: `Residential Alert: ${zoneName} - ${data.pastSnow24h.toFixed(1)}cm accumulated`,
            urgent: false
          });
        }
      }

      // Check for 24h forecast warning (commercial level expected)
      if (data.snowAccumulation24h >= COMMERCIAL_THRESHOLD) {
        const alertId = `forecast-commercial-${zoneId}`;
        if (!this.wasRecentlySent(alertId)) {
          alerts.push({
            id: alertId,
            type: 'forecast_warning',
            level: 'commercial',
            zone: zoneName,
            zoneId,
            amount: data.snowAccumulation24h,
            timestamp: now,
            message: `24h Forecast: ${zoneName} - ${data.snowAccumulation24h.toFixed(1)}cm expected`,
            urgent: false
          });
        }
      }

      // Check for drift risk
      if (data.driftRisk && (data.driftRisk.level === 'high' || data.driftRisk.level === 'moderate')) {
        const alertId = `drift-${data.driftRisk.level}-${zoneId}`;
        if (!this.wasRecentlySent(alertId) && data.windGusts >= DRIFT_WIND_THRESHOLD) {
          alerts.push({
            id: alertId,
            type: 'drift_warning',
            level: data.driftRisk.level === 'high' ? 'commercial' : 'residential',
            zone: zoneName,
            zoneId,
            amount: data.driftRisk.percent,
            timestamp: now,
            message: `Drift Warning: ${zoneName} - ${data.driftRisk.level} risk (${Math.round(data.windGusts)}km/h wind)`,
            urgent: data.driftRisk.level === 'high'
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Send a notification for an alert
   */
  async sendNotification(alert: SnowAlert): Promise<void> {
    if (!this.isEnabled) {
      console.log('[NotificationService] Notifications disabled, skipping');
      return;
    }

    // Mark as sent
    this.sentAlerts.set(alert.id, alert.timestamp);
    this.saveSentAlerts();

    // Notify callbacks (for in-app banner)
    this.onAlertCallbacks.forEach(cb => cb(alert));

    // Send browser notification
    const options: NotificationOptions = {
      body: alert.message,
      icon: '/snow-icon.png',
      badge: '/badge-icon.png',
      tag: alert.id,
      data: { zoneId: alert.zoneId },
      requireInteraction: alert.urgent
    };

    // Use Service Worker if available
    if (this.registration) {
      try {
        await this.registration.showNotification(
          alert.urgent ? 'Snow Alert' : 'Snow Forecast Update',
          options
        );
        console.log('[NotificationService] Notification sent via SW:', alert.id);
        return;
      } catch (error) {
        console.warn('[NotificationService] SW notification failed, using fallback:', error);
      }
    }

    // Fallback to direct Notification API
    try {
      new Notification(alert.urgent ? 'Snow Alert' : 'Snow Forecast Update', options);
      console.log('[NotificationService] Notification sent directly:', alert.id);
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
    }
  }

  /**
   * Process alerts - check for conditions and send notifications
   */
  async processAlerts(weatherData: Map<string, WeatherData>, zoneNames: Map<string, string>): Promise<SnowAlert[]> {
    const alerts = this.checkForAlerts(weatherData, zoneNames);

    for (const alert of alerts) {
      await this.sendNotification(alert);
    }

    return alerts;
  }

  /**
   * Check if an alert was recently sent
   */
  private wasRecentlySent(alertId: string): boolean {
    const sentTime = this.sentAlerts.get(alertId);
    if (!sentTime) return false;

    const elapsed = Date.now() - sentTime.getTime();
    return elapsed < ALERT_COOLDOWN_MS;
  }

  /**
   * Load sent alerts from localStorage
   */
  private loadSentAlerts(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SENT);
      if (stored) {
        const parsed = JSON.parse(stored) as [string, string][];
        this.sentAlerts = new Map(
          parsed.map(([id, timestamp]) => [id, new Date(timestamp)])
        );
        // Clean up old entries
        this.cleanupOldAlerts();
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to load sent alerts:', error);
    }
  }

  /**
   * Save sent alerts to localStorage
   */
  private saveSentAlerts(): void {
    try {
      const entries = Array.from(this.sentAlerts.entries()).map(
        ([id, date]) => [id, date.toISOString()]
      );
      localStorage.setItem(STORAGE_KEY_SENT, JSON.stringify(entries));
    } catch (error) {
      console.warn('[NotificationService] Failed to save sent alerts:', error);
    }
  }

  /**
   * Clean up alerts older than cooldown period
   */
  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - ALERT_COOLDOWN_MS;
    const toDelete: string[] = [];

    this.sentAlerts.forEach((date, id) => {
      if (date.getTime() < cutoff) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.sentAlerts.delete(id));

    if (toDelete.length > 0) {
      this.saveSentAlerts();
    }
  }

  /**
   * Load user preferences
   */
  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to load preferences:', error);
    }
  }

  /**
   * Save user preferences
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(this.isEnabled));
    } catch (error) {
      console.warn('[NotificationService] Failed to save preferences:', error);
    }
  }

  /**
   * Clear all sent alert history
   */
  clearHistory(): void {
    this.sentAlerts.clear();
    this.saveSentAlerts();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing
export { NotificationService };
