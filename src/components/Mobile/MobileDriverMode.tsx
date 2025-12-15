/**
 * MobileDriverMode Component (v2 - Professional)
 * 
 * "Driver Mode" mobile layout with Google Maps-style interaction.
 * Features:
 * - Clean professional top bar (no emojis)
 * - Map-to-List bidirectional interaction
 * - Swipeable bottom sheet with drag handle
 * - Zone selection updates bottom sheet content
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WeatherData } from '../../services/weatherService';
import type { ClientProperty } from '../../config/clientProperties';
import { CLIENT_PROPERTIES } from '../../config/clientProperties';
import { getZoneStatus } from '../../utils/zoneStatusHelper';

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

interface MobileDriverModeProps {
  // Weather data
  temperature: number | null;
  snowAccumulation: number;
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
}

/**
 * Professional Top Bar (60px) - No Emojis
 * Format: -9°C (Bold) | 0cm | Status Pill
 */
const TopStatusBar: React.FC<{
  temperature: number | null;
  snowAccumulation: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}> = ({ temperature, snowAccumulation, onRefresh, isRefreshing }) => {
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
      padding: '0 16px',
      zIndex: 2000,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb',
    }}>
      {/* Temperature */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ 
          fontSize: '1.75rem', 
          fontWeight: 700, 
          color: '#111827',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.02em'
        }}>
          {temperature !== null ? temperature.toFixed(0) : '--'}
        </span>
        <span style={{ 
          fontSize: '1rem', 
          color: '#6b7280', 
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          °C
        </span>
      </div>
      
      {/* Snow Accumulation */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '6px',
        padding: '0 12px'
      }}>
        <SnowflakeIcon size={16} color="#6b7280" />
        <span style={{ 
          fontSize: '1.1rem', 
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {snowAccumulation.toFixed(1)}cm
        </span>
      </div>
      
      {/* Status Pill + Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          backgroundColor: status.bg,
          color: status.color,
          padding: '6px 12px',
          borderRadius: '16px',
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.025em',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {status.label === 'CLEAR' ? (
            <CheckIcon size={12} color={status.color} />
          ) : (
            <SnowflakeIcon size={12} color={status.color} />
          )}
          {status.label}
        </span>
        
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            width: '36px',
            height: '36px',
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
          <RefreshIcon size={18} color="#6b7280" />
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
 * Zone Detail Card - Shown when a zone is selected on map
 */
const ZoneDetailCard: React.FC<{
  feature: any;
  weatherData: WeatherData | undefined;
  onClose: () => void;
  propertiesInZone: ClientProperty[];
  onSelectProperty: (property: ClientProperty) => void;
}> = ({ feature, weatherData, onClose, propertiesInZone, onSelectProperty }) => {
  const status = getZoneStatus(weatherData);
  
  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      {/* Zone header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            color: '#111827',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {feature.properties.name}
          </h3>
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {propertiesInZone.length} properties in this zone
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            color: '#374151',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          View All
        </button>
      </div>
      
      {/* Status badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: `${status.color}15`,
        color: status.color,
        padding: '8px 14px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '0.85rem',
        marginBottom: '16px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {status.needsAction ? <AlertIcon size={14} color={status.color} /> : <CheckIcon size={14} color={status.color} />}
        {status.label}
      </div>
      
      {/* Stats grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '14px', 
          borderRadius: '10px',
          textAlign: 'center' 
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: status.color,
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {status.snow24h.toFixed(1)}
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#6b7280', 
            marginTop: '2px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            cm forecast
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '14px', 
          borderRadius: '10px',
          textAlign: 'center' 
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: '#2563eb',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {status.pastSnow24h.toFixed(1)}
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#6b7280', 
            marginTop: '2px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            cm fallen
          </div>
        </div>
      </div>
      
      {/* Properties in zone */}
      {propertiesInZone.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: '10px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            Properties
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
                marginBottom: '8px',
                textAlign: 'left'
              }}
            >
              <MapPinIcon size={14} color="#6b7280" />
              <span style={{ 
                fontSize: '0.85rem', 
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
 * Bottom Sheet with professional drag handle
 */
const BottomSheet: React.FC<{
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  selectedFeature: any;
  onClearSelection: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}> = ({ 
  weatherData, 
  geoJsonData, 
  selectedPropertyId, 
  onSelectProperty, 
  selectedFeature,
  onClearSelection,
  viewMode,
  setViewMode
}) => {
  const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'half' | 'expanded'>(
    selectedFeature ? 'half' : 'collapsed'
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);
  
  // Auto-expand when zone is selected
  useEffect(() => {
    if (selectedFeature) {
      setSheetHeight('half');
      setViewMode('zone-detail');
    }
  }, [selectedFeature, setViewMode]);
  
  const heights = {
    collapsed: 20,
    half: 40,
    expanded: 85
  };
  
  const currentHeight = heights[sheetHeight];
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = currentHeight;
  }, [currentHeight]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(15, Math.min(90, dragStartHeight.current + deltaPercent));
    
    if (sheetRef.current) {
      sheetRef.current.style.height = `${newHeight}vh`;
    }
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const finalY = e.changedTouches[0].clientY;
    const deltaY = dragStartY.current - finalY;
    
    if (sheetRef.current) {
      const currentPercent = parseFloat(sheetRef.current.style.height);
      
      if (deltaY > 50 || currentPercent > 60) {
        setSheetHeight('expanded');
      } else if (deltaY < -50 || currentPercent < 30) {
        setSheetHeight('collapsed');
      } else {
        setSheetHeight('half');
      }
      
      sheetRef.current.style.height = '';
    }
  }, []);
  
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
    setSheetHeight('half');
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
      {/* Drag Handle - Professional design */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          padding: '12px 0 8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'grab',
          touchAction: 'none',
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottom: '1px solid #f3f4f6'
        }}
      >
        {/* Gray drag handle line */}
        <div style={{
          width: '36px',
          height: '4px',
          backgroundColor: '#d1d5db',
          borderRadius: '2px',
          marginBottom: '12px'
        }} />
        
        {/* Header content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 20px',
        }}>
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
          
          {/* Expand indicator */}
          <div style={{ 
            transform: sheetHeight === 'expanded' ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease',
            color: '#9ca3af'
          }}>
            <ChevronUpIcon size={20} color="#9ca3af" />
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Zone Detail View */}
        {viewMode === 'zone-detail' && selectedFeature ? (
          <ZoneDetailCard
            feature={selectedFeature}
            weatherData={weatherData.get(selectedFeature.properties.id)}
            onClose={handleClearAndShowAll}
            propertiesInZone={propertiesInZone}
            onSelectProperty={onSelectProperty}
          />
        ) : (
          /* Property List View */
          sortedProperties.map(property => (
            <PropertyListItem
              key={property.id}
              property={property}
              status={getPropertyStatus(property)}
              isSelected={property.id === selectedPropertyId}
              onSelect={() => onSelectProperty(property)}
            />
          ))
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
  weatherData,
  geoJsonData,
  selectedPropertyId,
  onSelectProperty,
  onRefresh,
  selectedZoneId: _selectedZoneId,
  onSelectZone: _onSelectZone,
  selectedFeature
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const handleClearSelection = () => {
    // This should trigger App.tsx to clear selectedFeature
    // For now, just reset view mode
    setViewMode('overview');
  };
  
  return (
    <>
      {/* Professional Top Status Bar */}
      <TopStatusBar
        temperature={temperature}
        snowAccumulation={snowAccumulation}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
      
      {/* Bottom Sheet */}
      <BottomSheet
        weatherData={weatherData}
        geoJsonData={geoJsonData}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={onSelectProperty}
        selectedFeature={selectedFeature}
        onClearSelection={handleClearSelection}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </>
  );
};

export default MobileDriverMode;
