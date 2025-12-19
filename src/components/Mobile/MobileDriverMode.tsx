/**
 * MobileDriverMode Component (v3 - Future Sight)
 * 
 * "Driver Mode" mobile layout with Google Maps-style interaction.
 * Features:
 * - Clean professional top bar (no emojis)
 * - Map-to-List bidirectional interaction
 * - Swipeable bottom sheet with drag handle
 * - Zone selection updates bottom sheet content
 * - NEW: Time/Forecast Selector (Live Now | Next 24h | 7-Day)
 */

import React, { useState, useRef, useEffect } from 'react';
import type { WeatherData, DetailedForecast } from '../../services/weatherService';
import type { ClientProperty } from '../../config/clientProperties';
import type { ECForecastData } from '../../services/weatherCanadaService';
import { CLIENT_PROPERTIES } from '../../config/clientProperties';
import { getZoneStatus } from '../../utils/zoneStatusHelper';
import { ecIconToWmoCode } from '../../services/weatherCanadaService';

// SVG Icons (Professional, no emojis)
const SnowflakeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="15" y2="5" />
    <line x1="12" y1="2" x2="9" y2="5" />
    <line x1="12" y1="22" x2="15" y2="19" />
    <line x1="12" y1="22" x2="9" y2="19" />
    <line x1="2" y1="12" x2="5" y2="9" />
    <line x1="2" y1="12" x2="5" y2="15" />
    <line x1="22" y1="12" x2="19" y2="9" />
    <line x1="22" y1="12" x2="19" y2="15" />
  </svg>
);

const RefreshIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ChevronUpIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const MapPinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// View mode types
type ViewMode = 'overview' | 'zone-detail' | 'property-detail';

// Forecast view types for "Future Sight" feature
type ForecastView = 'live' | '24h' | '7day';

interface MobileDriverModeProps {
  // Weather data
  temperature: number | null;
  snowAccumulation: number; // Max impact across all zones
  avgSnow?: number; // Average snow across zones
  isSnowing: boolean;
  lastUpdated: string;

  // Property data
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;

  // Selection handlers
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  onRefresh: () => void;

  // Zone selection
  selectedZoneId: string | null;
  onSelectZone: (feature: any) => void;
  selectedFeature: any;
  onClearSelection: () => void; // NEW: Properly clear selection in parent

  // NEW: Forecast data for "Future Sight"
  forecast?: DetailedForecast | null;
  ecForecast?: ECForecastData | null;
}

/**
 * Professional Top Bar (60px) - Enhanced with Max Impact
 * Format: -9°C (Bold) | Max 0.6cm | Status Pill
 */
const TopStatusBar: React.FC<{
  temperature: number | null;
  snowAccumulation: number; // Max impact across all zones
  avgSnow: number; // Average snow
  onRefresh: () => void;
  isRefreshing?: boolean;
}> = ({ temperature, snowAccumulation, avgSnow, onRefresh, isRefreshing }) => {
  const getStatusConfig = () => {
    if (snowAccumulation >= 10) return { label: 'HEAVY', color: '#dc2626', bg: '#fef2f2' };
    if (snowAccumulation >= 5) return { label: 'MODERATE', color: '#d97706', bg: '#fffbeb' };
    if (snowAccumulation >= 2) return { label: 'LIGHT', color: '#2563eb', bg: '#eff6ff' };
    return { label: 'CLEAR', color: '#16a34a', bg: '#f0fdf4' };
  };
  
  const status = getStatusConfig();
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      zIndex: 2000,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb',
    }}>
      {/* Temperature */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: '#111827',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em'
        }}>
          {temperature !== null ? temperature.toFixed(0) : '--'}
        </span>
        <span style={{ 
          fontSize: '0.9rem', 
          color: '#6b7280', 
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          °C
        </span>
      </div>
      
      {/* Max Impact (24h) - Like desktop */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 8px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '4px'
        }}>
          <SnowflakeIcon size={14} color="#6b7280" />
          <span style={{ 
            fontSize: '1rem', 
            fontWeight: 700,
            color: snowAccumulation > 0 ? '#2563eb' : '#374151',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {snowAccumulation.toFixed(1)}cm
          </span>
        </div>
        <span style={{
          fontSize: '0.6rem',
          color: '#9ca3af',
          fontFamily: 'Inter, system-ui, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}>
          Max 24h
        </span>
      </div>
      
      {/* Status Pill + Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          backgroundColor: status.bg,
          color: status.color,
          padding: '5px 10px',
          borderRadius: '14px',
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.025em',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {status.label === 'CLEAR' ? (
            <CheckIcon size={11} color={status.color} />
          ) : (
            <SnowflakeIcon size={11} color={status.color} />
          )}
          {status.label}
        </span>
        
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          aria-label="Refresh data"
        >
          <RefreshIcon size={16} color="#6b7280" />
        </button>
      </div>
    </div>
  );
};

/**
 * Property List Item - Clean design
 */
const PropertyListItem: React.FC<{
  property: ClientProperty;
  status: ReturnType<typeof getZoneStatus>;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ property, status, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
      border: 'none',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background-color 0.15s ease',
    }}
  >
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        backgroundColor: `${status.color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <MapPinIcon size={16} color={status.color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ 
          fontSize: '0.95rem', 
          fontWeight: 600, 
          color: '#111827',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {property.address}
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          color: '#6b7280',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {property.zone}
        </div>
      </div>
    </div>
    
    {/* Status badge */}
    <div style={{
      backgroundColor: status.color,
      color: 'white',
      padding: '6px 12px',
      borderRadius: '6px',
      fontWeight: 600,
      fontSize: '0.75rem',
      minWidth: '70px',
      textAlign: 'center',
      marginLeft: '12px',
      flexShrink: 0,
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {status.label}
    </div>
  </button>
);

/**
 * Chevron Right Icon
 */
const ChevronRightIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Zone Accordion List - Grouped by zone like desktop
 */
const ZoneAccordionList: React.FC<{
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  onSelectZone: (feature: any) => void;
}> = ({ weatherData, geoJsonData, selectedPropertyId, onSelectProperty, onSelectZone }) => {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  
  // Group properties by zone
  const zoneGroups = React.useMemo(() => {
    const grouped = new Map<string, ClientProperty[]>();
    CLIENT_PROPERTIES.forEach(prop => {
      const existing = grouped.get(prop.zone) || [];
      existing.push(prop);
      grouped.set(prop.zone, existing);
    });
    
    // Convert to array with status info
    const result: Array<{
      zoneName: string;
      properties: ClientProperty[];
      status: ReturnType<typeof getZoneStatus>;
      zoneId: string | undefined;
      feature: any;
    }> = [];
    
    grouped.forEach((properties, zoneName) => {
      const feature = geoJsonData?.features?.find((f: any) => f.properties.name === zoneName);
      const zoneId = feature?.properties.id;
      const data = zoneId ? weatherData.get(zoneId) : undefined;
      const status = getZoneStatus(data);
      result.push({ zoneName, properties, status, zoneId, feature });
    });
    
    // Sort by status level (urgent first), then alphabetically
    return result.sort((a, b) => {
      if (b.status.level !== a.status.level) {
        return b.status.level - a.status.level;
      }
      return a.zoneName.localeCompare(b.zoneName);
    });
  }, [weatherData, geoJsonData]);
  
  const toggleZone = (zoneName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName);
      } else {
        newSet.add(zoneName);
      }
      return newSet;
    });
  };
  
  return (
    <div>
      {zoneGroups.map(group => {
        const isExpanded = expandedZones.has(group.zoneName);
        const hasSelectedProperty = group.properties.some(p => p.id === selectedPropertyId);
        
        return (
          <div key={group.zoneName}>
            {/* Zone Header - Clickable */}
            <button
              onClick={(e) => toggleZone(group.zoneName, e)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: hasSelectedProperty ? '#f0f9ff' : '#ffffff',
                borderLeft: `4px solid ${group.status.color}`,
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                {/* Expand indicator */}
                <span style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <ChevronRightIcon size={16} color="#9ca3af" />
                </span>
                
                {/* Zone icon */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: `${group.status.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPinIcon size={14} color={group.status.color} />
                </div>
                
                {/* Zone name and count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    {group.zoneName}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    {group.properties.length} properties
                  </div>
                </div>
              </div>
              
              {/* Snow amount & Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {group.status.snow24h.toFixed(1)}cm
                </span>
                <span style={{
                  backgroundColor: group.status.color,
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {group.status.label}
                </span>
                
                {/* Info button - opens zone detail */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (group.feature) {
                      onSelectZone(group.feature);
                    }
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label="View zone details"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
              </div>
            </button>
            
            {/* Expanded Properties */}
            {isExpanded && (
              <div style={{
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #f3f4f6'
              }}>
                {group.properties.map(property => {
                  const isSelected = property.id === selectedPropertyId;
                  return (
                    <button
                      key={property.id}
                      onClick={() => onSelectProperty(property)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px 12px 52px',
                        backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: group.status.color,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.85rem',
                        color: '#374151',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        flex: 1
                      }}>
                        {property.address}
                      </span>
                      <span style={{
                        fontSize: '0.6rem',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        fontFamily: 'Inter, system-ui, sans-serif'
                      }}>
                        {property.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Progress Bar Component - Like desktop
 */
const ProgressBar: React.FC<{
  current: number;
  threshold: number;
  label: string;
  color: string;
}> = ({ current, threshold, label, color }) => {
  const percentage = Math.min(100, (current / threshold) * 100);
  const remaining = Math.max(0, threshold - current);
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <span style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {label}
        </span>
        <span style={{ 
          fontSize: '0.75rem', 
          color: percentage >= 100 ? color : '#9ca3af',
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {remaining > 0 ? `${remaining.toFixed(1)}cm to trigger` : 'TRIGGERED'}
        </span>
      </div>
      <div style={{
        height: '6px',
        backgroundColor: '#e5e7eb',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

/**
 * Wind Icon
 */
const WindIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
  </svg>
);

/**
 * Zone Detail Card - Enhanced with Section A & B (Like Desktop)
 */
const ZoneDetailCard: React.FC<{
  feature: any;
  weatherData: WeatherData | undefined;
  onClose: () => void;
  propertiesInZone: ClientProperty[];
  onSelectProperty: (property: ClientProperty) => void;
  selectedPropertyId?: string | null;
  forecast?: DetailedForecast | null;
}> = ({ feature, weatherData, onClose, propertiesInZone, onSelectProperty, selectedPropertyId }) => {
  const status = getZoneStatus(weatherData);
  
  // Calculate snow removal data like desktop
  const pastSnow24h = weatherData?.pastSnow24h || 0;
  
  // Calculate drift risk based on wind gusts (high wind + snow = drift risk)
  const windGusts = weatherData?.windGusts || 0;
  const driftRisk = Math.min(100, Math.round((windGusts / 50) * 100 * (pastSnow24h > 0.2 ? 1 : 0.3)));
  
  // Expected additional snow (next 24h - past 24h)
  const expectedAdditional = Math.max(0, (weatherData?.snowAccumulation24h || 0) - pastSnow24h);
  
  // Thresholds
  const residentialTrigger = 1.0;
  const commercialTrigger = 5.0;
  
  // Decision context based on conditions
  const getDecisionContext = () => {
    if (pastSnow24h >= commercialTrigger) {
      return { text: 'Commercial trigger exceeded. Full deployment required.', urgent: true };
    }
    if (pastSnow24h >= residentialTrigger) {
      return { text: 'Residential trigger exceeded. Deploy residential crews.', urgent: true };
    }
    if (expectedAdditional >= 2) {
      return { text: 'Significant snow incoming. Prepare crews for deployment.', urgent: false };
    }
    if (driftRisk > 50) {
      return { text: 'High drift risk. Monitor for drifting even with low accumulation.', urgent: false };
    }
    return { text: 'Conditions clear. Monitor forecast for changes.', urgent: false };
  };
  
  const decision = getDecisionContext();
  
  return (
    <div style={{ padding: '0 16px 20px 16px' }}>
      {/* Zone header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.05rem', 
            fontWeight: 700, 
            color: '#111827',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {selectedPropertyId 
              ? propertiesInZone.find(p => p.id === selectedPropertyId)?.address || feature.properties.name
              : feature.properties.name}
          </h3>
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {selectedPropertyId ? feature.properties.name : `${propertiesInZone.length} properties`}
          </span>
        </div>
        {/* Back button - always shows, returns to all zones */}
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            color: '#374151',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>
            <ChevronRightIcon size={12} color="#6b7280" />
          </span>
          Back
        </button>
      </div>
      
      {/* SECTION A: Ground Reality - Like Desktop */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Ground Reality
          </span>
          <span style={{
            fontSize: '0.65rem',
            color: '#9ca3af',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Past 24 Hours
          </span>
        </div>
        
        {/* Big Snow Number */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: status.color,
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1
          }}>
            {pastSnow24h.toFixed(1)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            cm accumulated
          </div>
        </div>
        
        {/* Progress to Triggers */}
        <ProgressBar 
          current={pastSnow24h}
          threshold={residentialTrigger}
          label="Residential (1cm)"
          color="#f59e0b"
        />
        <ProgressBar 
          current={pastSnow24h}
          threshold={commercialTrigger}
          label="Commercial (5cm)"
          color="#dc2626"
        />
        
        {/* Status Badge */}
        <div style={{
          backgroundColor: `${status.color}15`,
          border: `1px solid ${status.color}30`,
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {status.needsAction ? <AlertIcon size={16} color={status.color} /> : <CheckIcon size={16} color={status.color} />}
          <div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: status.color,
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {status.label}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {pastSnow24h < residentialTrigger 
                ? `${(residentialTrigger - pastSnow24h).toFixed(1)}cm to Residential trigger`
                : pastSnow24h < commercialTrigger 
                  ? `${(commercialTrigger - pastSnow24h).toFixed(1)}cm to Commercial trigger`
                  : 'All triggers exceeded'}
            </div>
          </div>
        </div>
      </div>
      
      {/* SECTION B: Forecast - Like Desktop */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            The Forecast
          </span>
          <span style={{
            fontSize: '0.65rem',
            color: '#9ca3af',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Next 24 Hours
          </span>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          {/* Expected Additional */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: expectedAdditional > 0 ? '#2563eb' : '#16a34a',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              +{expectedAdditional.toFixed(1)}
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              cm incoming
            </div>
          </div>
          
          {/* Drift Risk */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: driftRisk > 50 ? '#d97706' : '#16a34a',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <WindIcon size={18} color={driftRisk > 50 ? '#d97706' : '#16a34a'} />
              {driftRisk}
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Drift Risk
            </div>
          </div>
        </div>
        
        {/* Snow Ends At - placeholder */}
        {expectedAdditional > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Snow Expected
            </span>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#111827',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Next 24h
            </span>
          </div>
        )}
      </div>
      
      {/* Decision Context - Like Desktop */}
      <div style={{
        backgroundColor: decision.urgent ? '#fef2f2' : '#f0fdf4',
        border: `1px solid ${decision.urgent ? '#fecaca' : '#bbf7d0'}`,
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          {decision.urgent ? (
            <AlertIcon size={16} color="#dc2626" />
          ) : (
            <CheckIcon size={16} color="#16a34a" />
          )}
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: decision.urgent ? '#991b1b' : '#166534',
              marginBottom: '2px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Decision Context
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: decision.urgent ? '#991b1b' : '#166534',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {decision.text}
            </div>
          </div>
        </div>
      </div>
      
      {/* Properties in zone */}
      {propertiesInZone.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: '8px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Properties in Zone
          </div>
          {propertiesInZone.map(property => (
            <button
              key={property.id}
              onClick={() => onSelectProperty(property)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: '#f9fafb',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '6px',
                textAlign: 'left'
              }}
            >
              <MapPinIcon size={14} color={status.color} />
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#374151',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                {property.address}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * iOS-Style Segmented Control for Forecast View
 */
const ForecastSegmentedControl: React.FC<{
  selectedView: ForecastView;
  onViewChange: (view: ForecastView) => void;
}> = ({ selectedView, onViewChange }) => {
  const options: { value: ForecastView; label: string }[] = [
    { value: 'live', label: 'Live Now' },
    { value: '24h', label: 'Next 24h' },
    { value: '7day', label: '7-Day' }
  ];
  
  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#f3f4f6',
      borderRadius: '10px',
      padding: '3px',
      margin: '0 16px 12px 16px',
    }}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onViewChange(option.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: selectedView === option.value ? '#ffffff' : 'transparent',
            color: selectedView === option.value ? '#111827' : '#6b7280',
            boxShadow: selectedView === option.value 
              ? '0 1px 3px rgba(0, 0, 0, 0.1)' 
              : 'none',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Clock Icon for hourly forecast
 */
const ClockIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * Calendar Icon for 7-day forecast
 */
const CalendarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/**
 * Get WMO Weather Icon as SVG
 */
const getWeatherIcon = (code: number | undefined, size: number = 24): React.ReactElement => {
  // Clear sky
  if (code === 0 || code === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#fbbf24">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" 
          stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  
  // Partly cloudy
  if (code === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="4" fill="#fbbf24" />
        <path d="M18 10h.01A5 5 0 1 1 8 13h10a3 3 0 0 0 0-3z" fill="#94a3b8" />
      </svg>
    );
  }
  
  // Cloudy
  if (code === 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h.01A5 5 0 1 1 8 13h10a3 3 0 0 0 0-3z" fill="#9ca3af" stroke="#6b7280" strokeWidth="1" />
      </svg>
    );
  }
  
  // Snow (71-77, 85-86)
  if ((code && code >= 71 && code <= 77) || code === 85 || code === 86) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h.01A5 5 0 1 1 8 13h10a3 3 0 0 0 0-3z" fill="#94a3b8" />
        <circle cx="8" cy="18" r="1" fill="#60a5fa" />
        <circle cx="12" cy="20" r="1" fill="#60a5fa" />
        <circle cx="16" cy="18" r="1" fill="#60a5fa" />
        <circle cx="10" cy="16" r="1" fill="#60a5fa" />
        <circle cx="14" cy="16" r="1" fill="#60a5fa" />
      </svg>
    );
  }
  
  // Rain (61-67, 80-82)
  if ((code && code >= 61 && code <= 67) || (code && code >= 80 && code <= 82)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M18 10h.01A5 5 0 1 1 8 13h10a3 3 0 0 0 0-3z" fill="#6b7280" />
        <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  
  // Default: Cloudy
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 10h.01A5 5 0 1 1 8 13h10a3 3 0 0 0 0-3z" fill="#9ca3af" stroke="#6b7280" strokeWidth="1" />
    </svg>
  );
};

/**
 * Hourly Forecast View - "Next 24h" Chart
 * Shows when big snow starts - driver can prepare truck
 */
const HourlyForecastView: React.FC<{
  forecast: DetailedForecast | null;
  ecForecast: ECForecastData | null;
}> = ({ forecast, ecForecast }) => {
  if (!forecast && !ecForecast) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <ClockIcon size={32} color="#d1d5db" />
        <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Loading forecast data...</p>
      </div>
    );
  }
  
  // Use Weather Canada data if available, otherwise Open-Meteo
  const useWeatherCanada = ecForecast && ecForecast.hourlyForecasts.length >= 24;
  
  // Prepare hourly data
  let hourlyData: { time: string; temp: number; snow: number; weatherCode?: number; precipChance?: number }[] = [];
  
  if (useWeatherCanada) {
    hourlyData = ecForecast!.hourlyForecasts.slice(0, 24).map(h => ({
      time: h.timestamp,
      temp: h.temperature,
      snow: h.condition.toLowerCase().includes('snow') ? (h.precipChance / 100) * 0.5 : 0,
      weatherCode: ecIconToWmoCode(h.iconCode),
      precipChance: h.precipChance
    }));
  } else if (forecast) {
    const currentHour = new Date().getHours();
    const startIndex = 24 + currentHour; // Account for past_days=1 offset
    hourlyData = forecast.hourly.time.slice(startIndex, startIndex + 24).map((t, i) => ({
      time: t,
      temp: forecast.hourly.temperature_2m[startIndex + i],
      snow: forecast.hourly.snowfall[startIndex + i] || 0,
      weatherCode: forecast.hourly.weather_code?.[startIndex + i]
    }));
  }
  
  // Find max snow for scaling
  const maxSnow = Math.max(...hourlyData.map(h => h.snow), 1);
  
  // Detect when significant snow starts
  const snowStartIndex = hourlyData.findIndex(h => h.snow >= 0.1);
  const snowStartTime = snowStartIndex >= 0 
    ? new Date(hourlyData[snowStartIndex].time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null;
  
  return (
    <div style={{ padding: '0 16px 20px 16px' }}>
      {/* Snow Alert Banner */}
      {snowStartTime && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <SnowflakeIcon size={20} color="#2563eb" />
          <div>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: '#1e40af',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Snow Expected at {snowStartTime}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#3b82f6',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              Prepare truck accordingly
            </div>
          </div>
        </div>
      )}
      
      {/* Horizontal Scroll Chart */}
      <div style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '10px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          minWidth: 'max-content'
        }}>
          {hourlyData.map((hour, i) => {
            const date = new Date(hour.time);
            const hourLabel = date.getHours();
            const timeStr = hourLabel === 0 ? '12AM' : hourLabel < 12 ? `${hourLabel}AM` : hourLabel === 12 ? '12PM' : `${hourLabel - 12}PM`;
            const isNow = i === 0;
            const hasSnow = hour.snow > 0.05;
            const barHeight = Math.max((hour.snow / maxSnow) * 50, hasSnow ? 4 : 0);
            
            return (
              <div
                key={hour.time}
                style={{
                  minWidth: '58px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 6px',
                  borderRadius: '12px',
                  backgroundColor: isNow ? '#f0fdf4' : 'transparent',
                  border: isNow ? '1px solid #bbf7d0' : '1px solid transparent'
                }}
              >
                {/* Time */}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: isNow ? 700 : 500,
                  color: isNow ? '#16a34a' : '#6b7280',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {isNow ? 'Now' : timeStr}
                </span>
                
                {/* Weather Icon */}
                <div style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                  {getWeatherIcon(hour.weatherCode, 24)}
                </div>
                
                {/* Temperature */}
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {Math.round(hour.temp)}°
                </span>
                
                {/* Snow Bar */}
                <div style={{
                  width: '20px',
                  height: '50px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {hasSnow && (
                    <div style={{
                      width: '100%',
                      height: `${barHeight}px`,
                      backgroundColor: hour.snow >= 0.5 ? '#3b82f6' : '#93c5fd',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.2s ease'
                    }} />
                  )}
                </div>
                
                {/* Snow Amount */}
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: hasSnow ? '#3b82f6' : '#d1d5db',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {hasSnow ? `${hour.snow.toFixed(1)}` : '0'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Heavy Snow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#93c5fd', borderRadius: '2px' }} />
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Light Snow</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 7-Day Forecast View - Weekly Overview
 * Shows which days will be heavy snow days
 */
const SevenDayForecastView: React.FC<{
  forecast: DetailedForecast | null;
}> = ({ forecast }) => {
  if (!forecast?.daily) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <CalendarIcon size={32} color="#d1d5db" />
        <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Loading 7-day forecast...</p>
      </div>
    );
  }
  
  const { daily } = forecast;
  
  return (
    <div style={{ padding: '0 16px 20px 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <CalendarIcon size={18} color="#6b7280" />
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          7-Day Snow Outlook
        </span>
      </div>
      
      {/* Daily List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {daily.time.slice(0, 7).map((dateStr, i) => {
          const date = new Date(dateStr + 'T00:00:00');
          const isToday = i === 0;
          const dayLabel = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const high = Math.round(daily.temperature_2m_max[i]);
          const low = Math.round(daily.temperature_2m_min[i]);
          const snowSum = daily.snowfall_sum[i] || 0;
          const weatherCode = daily.weather_code?.[i];
          
          // Determine snow severity
          const isHeavySnow = snowSum >= 5;
          const isModerateSnow = snowSum >= 2;
          const hasSnow = snowSum > 0;
          
          return (
            <div
              key={dateStr}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                backgroundColor: isHeavySnow ? '#fef2f2' : isModerateSnow ? '#fffbeb' : '#f9fafb',
                borderRadius: '10px',
                border: isHeavySnow ? '1px solid #fecaca' : isModerateSnow ? '1px solid #fde68a' : '1px solid #f3f4f6'
              }}
            >
              {/* Day */}
              <div style={{ width: '70px' }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isToday ? '#16a34a' : '#111827',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {dayLabel}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {dateLabel}
                </div>
              </div>
              
              {/* Weather Icon */}
              <div style={{ width: '36px', display: 'flex', justifyContent: 'center' }}>
                {getWeatherIcon(weatherCode, 28)}
              </div>
              
              {/* Temp Range */}
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                justifyContent: 'center'
              }}>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {high}°
                </span>
                <span style={{
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {low}°
                </span>
              </div>
              
              {/* Snow Amount */}
              <div style={{ 
                minWidth: '65px',
                textAlign: 'right'
              }}>
                {hasSnow ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: isHeavySnow ? '#dc2626' : isModerateSnow ? '#d97706' : '#3b82f6',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    <SnowflakeIcon size={12} color="white" />
                    {snowSum.toFixed(1)}cm
                  </div>
                ) : (
                  <span style={{
                    fontSize: '0.8rem',
                    color: '#9ca3af',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}>
                    No snow
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Heavy Snow Warning */}
      {daily.snowfall_sum.slice(0, 7).some(s => s >= 5) && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertIcon size={18} color="#dc2626" />
          <span style={{
            fontSize: '0.85rem',
            color: '#991b1b',
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Heavy snow day(s) ahead - Schedule extra crews
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Bottom Sheet with professional drag handle
 */
const BottomSheet: React.FC<{
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  onSelectZone: (feature: any) => void;
  selectedFeature: any;
  onClearSelection: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  // NEW: Forecast data
  forecast: DetailedForecast | null;
  ecForecast: ECForecastData | null;
}> = ({ 
  weatherData, 
  geoJsonData, 
  selectedPropertyId, 
  onSelectProperty,
  onSelectZone,
  selectedFeature,
  onClearSelection,
  viewMode,
  setViewMode,
  forecast,
  ecForecast
}) => {
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'list' | 'detail'>(
    'list' // Start with list view
  );
  const [forecastView, setForecastView] = useState<ForecastView>('live');
  const sheetRef = useRef<HTMLDivElement>(null);

  // Auto-expand to detail view when zone is selected
  useEffect(() => {
    if (selectedFeature) {
      setSheetHeight('detail'); // Show full details
      setViewMode('zone-detail');
    }
  }, [selectedFeature, setViewMode]);

  // Auto-expand when switching to forecast views
  useEffect(() => {
    if (forecastView !== 'live' && sheetHeight === 'collapsed') {
      setSheetHeight('detail'); // Show full forecast
    }
  }, [forecastView, sheetHeight]);

  // Fixed heights - no dragging needed
  const heights = {
    collapsed: 20,  // Just see map
    list: 50,       // List view with map visible
    detail: 90      // Full detail view
  } as const;

  const currentHeight = heights[sheetHeight];

  // Update map padding when sheet height changes
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container')?.parentElement as HTMLElement;
    if (mapContainer) {
      mapContainer.style.paddingBottom = `${currentHeight}vh`;
    }
  }, [currentHeight]);
  
  // Get property status helper
  const getPropertyStatus = (property: ClientProperty) => {
    const zoneFeature = geoJsonData?.features?.find((f: any) => f.properties.name === property.zone);
    if (zoneFeature) {
      const data = weatherData.get(zoneFeature.properties.id);
      return getZoneStatus(data);
    }
    return getZoneStatus(undefined);
  };
  
  // Get properties in selected zone
  const propertiesInZone = selectedFeature 
    ? CLIENT_PROPERTIES.filter(p => p.zone === selectedFeature.properties.name)
    : [];
  
  // Sort properties by urgency
  const sortedProperties = [...CLIENT_PROPERTIES].sort((a, b) => {
    const statusA = getPropertyStatus(a);
    const statusB = getPropertyStatus(b);
    return statusB.level - statusA.level;
  });
  
  const urgentCount = sortedProperties.filter(p => getPropertyStatus(p).needsAction).length;
  
  const handleClearAndShowAll = () => {
    onClearSelection();
    setViewMode('overview');
    setSheetHeight('list'); // Return to list view
    setForecastView('live'); // Reset to live view
  };
  
  return (
    <div
      ref={sheetRef}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: `${currentHeight}vh`,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Header - No drag handle, just visual indicator */}
      <div
        className="sheet-header"
        style={{
          padding: '12px 0 8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottom: '1px solid #f3f4f6',
          position: 'relative',
          zIndex: 10,
          minHeight: '80px'
        }}
      >
        {/* Visual indicator line (not draggable) */}
        <div
          style={{
            width: '36px',
            height: '4px',
            backgroundColor: '#d1d5db',
            borderRadius: '2px',
            marginBottom: '12px',
          }}
        />
        
        {/* Header content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {urgentCount > 0 ? (
              <>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertIcon size={14} color="#dc2626" />
                </div>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '0.95rem', 
                  color: '#111827',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {urgentCount} Urgent
                </span>
              </>
            ) : (
              <>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckIcon size={14} color="#16a34a" />
                </div>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '0.95rem', 
                  color: '#111827',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  All Clear
                </span>
              </>
            )}
            <span style={{ 
              fontSize: '0.85rem', 
              color: '#6b7280',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              · {sortedProperties.length} properties
            </span>
          </div>
          
          {/* Map button - collapses sheet and clears selection to show full map */}
          <button
            onClick={() => {
              setSheetHeight('collapsed');
              // If zone is selected, also clear it to show full map
              if (viewMode === 'zone-detail' || selectedFeature) {
                handleClearAndShowAll();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: sheetHeight === 'collapsed' && viewMode === 'overview' ? '#f0fdf4' : '#f9fafb',
              color: sheetHeight === 'collapsed' && viewMode === 'overview' ? '#16a34a' : '#374151',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Map
          </button>
        </div>
      </div>
      
      {/* Segmented Control - "Future Sight" */}
      <ForecastSegmentedControl 
        selectedView={forecastView} 
        onViewChange={setForecastView} 
      />
      
      {/* Content area - Pure scrolling, no drag conflicts */}
      <div
        className="bottom-sheet-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Forecast Views */}
        {forecastView === '24h' ? (
          <HourlyForecastView forecast={forecast} ecForecast={ecForecast} />
        ) : forecastView === '7day' ? (
          <SevenDayForecastView forecast={forecast} />
        ) : viewMode === 'zone-detail' && selectedFeature ? (
          /* Zone Detail View - Enhanced with Section A & B */
          <ZoneDetailCard
            feature={selectedFeature}
            weatherData={weatherData.get(selectedFeature.properties.id)}
            onClose={handleClearAndShowAll}
            propertiesInZone={propertiesInZone}
            onSelectProperty={onSelectProperty}
            selectedPropertyId={selectedPropertyId}
            forecast={forecast}
          />
        ) : (
          /* Zone Accordion List - Grouped by zone like desktop */
          <ZoneAccordionList
            weatherData={weatherData}
            geoJsonData={geoJsonData}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={onSelectProperty}
            onSelectZone={onSelectZone}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Main MobileDriverMode Component
 */
const MobileDriverMode: React.FC<MobileDriverModeProps> = ({
  temperature,
  snowAccumulation,
  avgSnow = 0,
  weatherData,
  geoJsonData,
  selectedPropertyId,
  onSelectProperty,
  onRefresh,
  selectedZoneId: _selectedZoneId,
  onSelectZone,
  selectedFeature,
  onClearSelection,
  forecast,
  ecForecast
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleClearSelection = () => {
    // FIXED: Properly clear parent state
    onClearSelection();
    setViewMode('overview');
  };
  
  return (
    <>
      {/* Professional Top Status Bar - Enhanced with Max Impact */}
      <TopStatusBar
        temperature={temperature}
        snowAccumulation={snowAccumulation}
        avgSnow={avgSnow}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      {/* Bottom Sheet - Now with zone accordion list */}
      <BottomSheet
        weatherData={weatherData}
        geoJsonData={geoJsonData}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={onSelectProperty}
        onSelectZone={onSelectZone}
        selectedFeature={selectedFeature}
        onClearSelection={handleClearSelection}
        viewMode={viewMode}
        setViewMode={setViewMode}
        forecast={forecast || null}
        ecForecast={ecForecast || null}
      />
    </>
  );
};

export default MobileDriverMode;
