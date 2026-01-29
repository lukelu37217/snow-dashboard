/**
 * Zone Status Helper
 * 
 * SINGLE SOURCE OF TRUTH for zone status calculation.
 * Both Sidebar and Map use this same function to ensure consistency.
 * 
 * Thresholds:
 * - Level 0 (Clear): < 0.2 cm - Green
 * - Level 1 (Trace): 0.2 - 0.9 cm - Green (with trace indicator)
 * - Level 2 (Residential): 1.0 - 4.9 cm - Orange/Yellow
 * - Level 3 (Commercial): >= 5.0 cm - Red
 */

import type { WeatherData } from '../services/weatherService';

export type ZoneLevel = 0 | 1 | 2 | 3;

export interface ZoneStatus {
    level: ZoneLevel;
    label: 'CLEAR' | 'TRACE' | 'RESIDENTIAL' | 'COMMERCIAL';
    color: string;
    needsAction: boolean;
    snow24h: number;
    pastSnow24h: number;
}

// Color constants - Muted palette for modern SaaS look
const COLORS = {
    GREEN: '#4ade80',   // Clear/Trace - softer green (was #22c55e)
    ORANGE: '#fb923c',  // Residential - warm orange (was #f59e0b)
    RED: '#f87171',     // Commercial - softer red (was #ef4444)
    GRAY: '#94a3b8'     // Non-service
};

/**
 * Get zone status from weather data
 * This is the SINGLE source of truth for status calculation
 * 
 * IMPORTANT: Uses PAST 24h snow (pastSnow24h) for status determination
 * This is what matters for snow removal dispatch decisions - what has 
 * actually fallen, not what is forecast.
 */
export function getZoneStatus(data: WeatherData | undefined): ZoneStatus {
    // Use PAST 24h snow for status - this is what determines dispatch needs
    const snow24h = data?.pastSnow24h || 0;
    const pastSnow24h = data?.pastSnow24h || 0;
    
    // Level 3: Commercial (>= 5 cm)
    if (snow24h >= 5.0) {
        return {
            level: 3,
            label: 'COMMERCIAL',
            color: COLORS.RED,
            needsAction: true,
            snow24h,
            pastSnow24h
        };
    }
    
    // Level 2: Residential (1 - 4.9 cm)
    if (snow24h >= 1.0) {
        return {
            level: 2,
            label: 'RESIDENTIAL',
            color: COLORS.ORANGE,
            needsAction: true,
            snow24h,
            pastSnow24h
        };
    }
    
    // Level 1: Trace (0.2 - 0.9 cm)
    if (snow24h >= 0.2) {
        return {
            level: 1,
            label: 'TRACE',
            color: COLORS.GREEN,
            needsAction: false,
            snow24h,
            pastSnow24h
        };
    }
    
    // Level 0: Clear (< 0.2 cm)
    return {
        level: 0,
        label: 'CLEAR',
        color: COLORS.GREEN,
        needsAction: false,
        snow24h,
        pastSnow24h
    };
}

/**
 * Get color for zone polygon
 */
export function getZoneColor(data: WeatherData | undefined): string {
    return getZoneStatus(data).color;
}

/**
 * Get status level (for sorting)
 */
export function getZoneLevel(data: WeatherData | undefined): ZoneLevel {
    return getZoneStatus(data).level;
}

/**
 * Check if zone needs action (Residential or Commercial)
 */
export function zoneNeedsAction(data: WeatherData | undefined): boolean {
    return getZoneStatus(data).needsAction;
}

/**
 * Debug helper - logs zone matching info
 */
export function debugZoneMatch(
    sidebarName: string,
    mapPolygonFound: boolean,
    sidebarStatus: ZoneStatus,
    mapStatus?: ZoneStatus
): void {
    const statusMatch = mapStatus ? sidebarStatus.level === mapStatus.level : 'N/A';
    console.log(
        `🔍 Zone Debug | "${sidebarName}" | ` +
        `Map Found: ${mapPolygonFound} | ` +
        `Sidebar: ${sidebarStatus.label} (${sidebarStatus.snow24h.toFixed(1)}cm) | ` +
        `Status Match: ${statusMatch}`
    );
}
