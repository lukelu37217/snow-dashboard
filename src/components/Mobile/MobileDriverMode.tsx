/**
 * MobileDriverMode Component
 * 
 * "Driver Mode" mobile layout optimized for one-handed use.
 * Features:
 * - Floating top status bar (compact)
 * - Map always visible (100% background)
 * - Bottom sheet property list (swipeable)
 */

import React, { useState, useRef, useCallback } from 'react';
import type { WeatherData } from '../../services/weatherService';
import type { ClientProperty } from '../../config/clientProperties';
import { CLIENT_PROPERTIES } from '../../config/clientProperties';
import { getZoneStatus } from '../../utils/zoneStatusHelper';

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
 * Floating Status Header (60px)
 * Shows: Temp | Snow | Status Icon
 */
const FloatingStatusHeader: React.FC<{
    temperature: number | null;
    snowAccumulation: number;
    isSnowing: boolean;
    lastUpdated: string;
    onRefresh: () => void;
}> = ({ temperature, snowAccumulation, isSnowing: _isSnowing, lastUpdated: _lastUpdated, onRefresh }) => {
    const getStatusColor = () => {
        if (snowAccumulation >= 10) return '#ef4444'; // Red - Heavy
        if (snowAccumulation >= 5) return '#f59e0b';  // Amber - Moderate
        if (snowAccumulation >= 2) return '#3b82f6';  // Blue - Light
        return '#22c55e'; // Green - Clear
    };
    
    const getStatusText = () => {
        if (snowAccumulation >= 10) return '❄️ HEAVY';
        if (snowAccumulation >= 5) return '❄️ MOD';
        if (snowAccumulation >= 2) return '❄️ LIGHT';
        return '✓ CLEAR';
    };
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 2000,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        }}>
            {/* Temperature */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 800, 
                    color: '#1e293b',
                    lineHeight: 1
                }}>
                    {temperature !== null ? temperature.toFixed(0) : '--'}
                </span>
                <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>°C</span>
            </div>
            
            {/* Snow Accumulation */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                padding: '0 16px'
            }}>
                <span style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 800,
                    color: getStatusColor(),
                    lineHeight: 1
                }}>
                    {snowAccumulation.toFixed(1)}cm
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                    24h snow
                </span>
            </div>
            
            {/* Status Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{
                    backgroundColor: getStatusColor(),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                }}>
                    {getStatusText()}
                </span>
                
                {/* Refresh button */}
                <button
                    onClick={onRefresh}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                    aria-label="Refresh"
                >
                    🔄
                </button>
            </div>
        </div>
    );
};

/**
 * Property List Item - Larger, thumb-friendly
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
            padding: '16px 20px',
            backgroundColor: isSelected ? '#eff6ff' : 'white',
            border: 'none',
            borderBottom: '1px solid #e2e8f0',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.15s ease',
        }}
    >
        <div style={{ flex: 1, minWidth: 0 }}>
            {/* Address - Large font */}
            <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 700, 
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '4px'
            }}>
                {property.address}
            </div>
            {/* Zone name */}
            <div style={{ 
                fontSize: '0.8rem', 
                color: '#64748b',
            }}>
                {property.zone}
            </div>
        </div>
        
        {/* Status badge - Large */}
        <div style={{
            backgroundColor: status.color,
            color: 'white',
            padding: '10px 16px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.85rem',
            minWidth: '80px',
            textAlign: 'center',
            marginLeft: '12px',
            flexShrink: 0
        }}>
            {status.label}
        </div>
    </button>
);

/**
 * Bottom Sheet with Swipe Gesture Support
 */
const DriverBottomSheet: React.FC<{
    weatherData: Map<string, WeatherData>;
    geoJsonData: any;
    selectedPropertyId: string | null;
    onSelectProperty: (property: ClientProperty) => void;
    selectedFeature: any;
}> = ({ weatherData, geoJsonData, selectedPropertyId, onSelectProperty, selectedFeature }) => {
    const [sheetHeight, setSheetHeight] = useState<'collapsed' | 'half' | 'expanded'>('half');
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef<number>(0);
    const dragStartHeight = useRef<number>(0);
    
    // Height percentages
    const heights = {
        collapsed: 15,  // Just handle visible
        half: 35,       // Default - shows summary
        expanded: 80    // Full list
    };
    
    const currentHeight = heights[sheetHeight];
    
    // Touch handlers for swipe
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        dragStartY.current = e.touches[0].clientY;
        dragStartHeight.current = currentHeight;
    }, [currentHeight]);
    
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const deltaY = dragStartY.current - e.touches[0].clientY;
        const deltaPercent = (deltaY / window.innerHeight) * 100;
        const newHeight = Math.max(15, Math.min(85, dragStartHeight.current + deltaPercent));
        
        if (sheetRef.current) {
            sheetRef.current.style.height = `${newHeight}vh`;
        }
    }, []);
    
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const finalY = e.changedTouches[0].clientY;
        const deltaY = dragStartY.current - finalY;
        const velocity = deltaY; // Simplified velocity
        
        // Determine target state based on position and velocity
        if (sheetRef.current) {
            const currentPercent = parseFloat(sheetRef.current.style.height);
            
            if (velocity > 50 || currentPercent > 55) {
                setSheetHeight('expanded');
            } else if (velocity < -50 || currentPercent < 25) {
                setSheetHeight('collapsed');
            } else {
                setSheetHeight('half');
            }
            
            // Reset to CSS-controlled height
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
    
    // Sort properties by urgency
    const sortedProperties = [...CLIENT_PROPERTIES].sort((a, b) => {
        const statusA = getPropertyStatus(a);
        const statusB = getPropertyStatus(b);
        return statusB.level - statusA.level; // Higher level = more urgent
    });
    
    // Get urgent count
    const urgentCount = sortedProperties.filter(p => getPropertyStatus(p).needsAction).length;
    
    return (
        <div
            ref={sheetRef}
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                height: `${currentHeight}vh`,
                backgroundColor: 'white',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
                zIndex: 1500,
                display: 'flex',
                flexDirection: 'column',
                transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
            }}
        >
            {/* Drag Handle */}
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
                    backgroundColor: 'white',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                }}
            >
                {/* Handle bar */}
                <div style={{
                    width: '48px',
                    height: '5px',
                    backgroundColor: '#cbd5e1',
                    borderRadius: '3px',
                    marginBottom: '12px'
                }} />
                
                {/* Summary header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0 20px',
                }}>
                    <div>
                        <span style={{ 
                            fontWeight: 800, 
                            fontSize: '1.1rem', 
                            color: '#1e293b' 
                        }}>
                            {urgentCount > 0 ? `⚠️ ${urgentCount} Urgent` : '✓ All Clear'}
                        </span>
                        <span style={{ 
                            fontSize: '0.85rem', 
                            color: '#64748b',
                            marginLeft: '12px'
                        }}>
                            {sortedProperties.length} properties
                        </span>
                    </div>
                    
                    {/* Expand/collapse indicator */}
                    <span style={{ 
                        fontSize: '1.2rem', 
                        color: '#94a3b8',
                        transform: sheetHeight === 'expanded' ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▲
                    </span>
                </div>
            </div>
            
            {/* Scrollable property list */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
            }}>
                {sortedProperties.map(property => (
                    <PropertyListItem
                        key={property.id}
                        property={property}
                        status={getPropertyStatus(property)}
                        isSelected={property.id === selectedPropertyId}
                        onSelect={() => onSelectProperty(property)}
                    />
                ))}
            </div>
            
            {/* Selected zone quick info (when collapsed) */}
            {sheetHeight === 'collapsed' && selectedFeature && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px 20px',
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        {selectedFeature.properties.name}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Main Driver Mode Component
 */
const MobileDriverMode: React.FC<MobileDriverModeProps> = ({
    temperature,
    snowAccumulation,
    isSnowing,
    lastUpdated,
    weatherData,
    geoJsonData,
    selectedPropertyId,
    onSelectProperty,
    onRefresh,
    selectedZoneId: _selectedZoneId,
    onSelectZone: _onSelectZone,
    selectedFeature: _selectedFeature
}) => {
    return (
        <>
            {/* Floating Status Header */}
            <FloatingStatusHeader
                temperature={temperature}
                snowAccumulation={snowAccumulation}
                isSnowing={isSnowing}
                lastUpdated={lastUpdated}
                onRefresh={onRefresh}
            />
            
            {/* Bottom Sheet Property List */}
            <DriverBottomSheet
                weatherData={weatherData}
                geoJsonData={geoJsonData}
                selectedPropertyId={selectedPropertyId}
                onSelectProperty={onSelectProperty}
                selectedFeature={_selectedFeature}
            />
        </>
    );
};

export default MobileDriverMode;
