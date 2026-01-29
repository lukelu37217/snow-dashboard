/**
 * AlertBanner Component
 *
 * Displays notification alerts at the top of the screen.
 * Features:
 * - Fixed position below header
 * - Auto-dismiss after timeout
 * - Manual dismiss button
 * - Color-coded by severity
 * - Stacks multiple alerts
 */

import React, { useEffect, useState } from 'react';
import { AlertIcon, CloseIcon, BlowingSnowIconUI, SnowIcon } from '../Icons';
import type { SnowAlert } from '../../services/notificationService';

interface AlertBannerProps {
  alerts: SnowAlert[];
  onDismiss: (alertId: string) => void;
  onDismissAll?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss, onDismissAll }) => {
  const [visibleAlerts, setVisibleAlerts] = useState<SnowAlert[]>([]);

  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  // Auto-dismiss non-urgent alerts after 30 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    visibleAlerts.forEach(alert => {
      if (!alert.urgent) {
        const timer = setTimeout(() => {
          onDismiss(alert.id);
        }, 30000);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [visibleAlerts, onDismiss]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getAlertStyle = (alert: SnowAlert): React.CSSProperties => {
    if (alert.level === 'commercial' || alert.urgent) {
      return {
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444',
        color: '#991b1b'
      };
    }
    return {
      backgroundColor: '#fffbeb',
      borderColor: '#f59e0b',
      color: '#92400e'
    };
  };

  const getIcon = (alert: SnowAlert) => {
    if (alert.type === 'drift_warning') {
      return <BlowingSnowIconUI size={20} color={alert.urgent ? '#ef4444' : '#f59e0b'} />;
    }
    if (alert.type === 'threshold_reached') {
      return <AlertIcon size={20} color={alert.urgent ? '#ef4444' : '#f59e0b'} />;
    }
    return <SnowIcon size={20} color={alert.urgent ? '#ef4444' : '#f59e0b'} />;
  };

  return (
    <div style={styles.container}>
      {visibleAlerts.length > 1 && onDismissAll && (
        <button
          onClick={onDismissAll}
          style={styles.dismissAllButton}
        >
          Dismiss All ({visibleAlerts.length})
        </button>
      )}

      {visibleAlerts.slice(0, 3).map(alert => (
        <div
          key={alert.id}
          style={{
            ...styles.alertItem,
            ...getAlertStyle(alert)
          }}
        >
          <div style={styles.iconWrapper}>
            {getIcon(alert)}
          </div>

          <div style={styles.content}>
            <div style={styles.title}>
              {alert.level === 'commercial' ? 'Commercial Alert' : 'Residential Alert'}
              {alert.type === 'drift_warning' && ' - Drift Warning'}
              {alert.type === 'forecast_warning' && ' - 24h Forecast'}
            </div>
            <div style={styles.message}>
              {alert.message}
            </div>
          </div>

          <button
            onClick={() => onDismiss(alert.id)}
            style={styles.closeButton}
            aria-label="Dismiss alert"
          >
            <CloseIcon size={16} color="#6b7280" />
          </button>
        </div>
      ))}

      {visibleAlerts.length > 3 && (
        <div style={styles.moreIndicator}>
          +{visibleAlerts.length - 3} more alerts
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: '70px', // Below header
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '90%',
    maxWidth: '600px',
    pointerEvents: 'none'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideDown 0.3s ease-out',
    pointerEvents: 'auto'
  },
  iconWrapper: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: '0.85rem',
    fontWeight: 700,
    marginBottom: '2px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  message: {
    fontSize: '0.8rem',
    opacity: 0.9,
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  closeButton: {
    flexShrink: 0,
    padding: '4px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  dismissAllButton: {
    alignSelf: 'flex-end',
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  moreIndicator: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#6b7280',
    backgroundColor: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
    fontFamily: 'Inter, system-ui, sans-serif'
  }
};

// Add keyframe animation via style injection
if (typeof document !== 'undefined') {
  const styleId = 'alert-banner-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default AlertBanner;
