/**
 * PropertyList Component
 * 
 * Shows client properties grouped by zone with expandable sections.
 * Each zone header shows the zone name with status color.
 * Sub-items are individual addresses that can be clicked to zoom on map.
 * 
 * Features:
 * - Grouped by zone with collapsible sections
 * - Zone header shows status color (Red/Orange/Green)
 * - Click address to zoom to that pin on map
 * - Shows property count per zone
 */

import React, { useState, useMemo } from 'react';
import { LocationIcon, SnowIcon } from '../Icons/Icons';
import type { WeatherData } from '../../services/weatherService';
import { CLIENT_PROPERTIES, getPropertiesGroupedByZone, type ClientProperty } from '../../config/clientProperties';
import { getZoneStatus } from '../../utils/zoneStatusHelper';

interface PropertyListProps {
    weatherData: Map<string, WeatherData>;
    geoJsonData: any;
    selectedPropertyId?: string | null;
    onSelectProperty: (property: ClientProperty) => void;
}

type FilterType = 'all' | 'commercial' | 'residential' | 'clear';

const PropertyList: React.FC<PropertyListProps> = ({
    weatherData,
    geoJsonData,
    selectedPropertyId,
    onSelectProperty
}) => {
    const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<FilterType>('all');

    // Find zone ID from zone name
    const getZoneIdFromName = (zoneName: string): string | undefined => {
        if (!geoJsonData?.features) return undefined;
        const feature = geoJsonData.features.find((f: any) => f.properties.name === zoneName);
        return feature?.properties.id;
    };

    // Group properties by zone and calculate status
    const zoneGroups = useMemo(() => {
        const grouped = getPropertiesGroupedByZone();
        const result: Array<{
            zoneName: string;
            properties: ClientProperty[];
            status: ReturnType<typeof getZoneStatus>;
            zoneId: string | undefined;
        }> = [];

        grouped.forEach((properties, zoneName) => {
            const zoneId = getZoneIdFromName(zoneName);
            const data = zoneId ? weatherData.get(zoneId) : undefined;
            const status = getZoneStatus(data);
            result.push({ zoneName, properties, status, zoneId });
        });

        // Sort by status level (high priority first), then alphabetically
        return result.sort((a, b) => {
            if (b.status.level !== a.status.level) {
                return b.status.level - a.status.level;
            }
            return a.zoneName.localeCompare(b.zoneName);
        });
    }, [weatherData, geoJsonData]);

    // Filter zones by status
    const filteredGroups = useMemo(() => {
        if (filter === 'all') return zoneGroups;
        if (filter === 'commercial') return zoneGroups.filter(g => g.status.level === 3);
        if (filter === 'residential') return zoneGroups.filter(g => g.status.level === 2);
        return zoneGroups.filter(g => g.status.level <= 1);
    }, [zoneGroups, filter]);

    // Count by status
    const counts = useMemo(() => ({
        commercial: zoneGroups.filter(g => g.status.level === 3).reduce((sum, g) => sum + g.properties.length, 0),
        residential: zoneGroups.filter(g => g.status.level === 2).reduce((sum, g) => sum + g.properties.length, 0),
        clear: zoneGroups.filter(g => g.status.level <= 1).reduce((sum, g) => sum + g.properties.length, 0),
        total: CLIENT_PROPERTIES.length
    }), [zoneGroups]);

    const toggleZone = (zoneName: string) => {
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

    // Handle zone header click - ONLY toggle expansion (no navigation)
    const handleZoneClick = (group: typeof zoneGroups[0]) => {
        // Only toggle expansion - clicking zone name doesn't navigate
        toggleZone(group.zoneName);
    };

    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '12px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
        }}>
            {/* Compact Summary Bar */}
            <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontWeight: 600,
                    marginRight: '4px'
                }}>
                    🏠 Properties ({counts.total})
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {counts.commercial > 0 && (
                        <button
                            onClick={() => setFilter(filter === 'commercial' ? 'all' : 'commercial')}
                            style={{
                                fontSize: '0.7rem',
                                backgroundColor: filter === 'commercial' ? '#dc2626' : '#fef2f2',
                                color: filter === 'commercial' ? 'white' : '#dc2626',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🔴 {counts.commercial}
                        </button>
                    )}
                    {counts.residential > 0 && (
                        <button
                            onClick={() => setFilter(filter === 'residential' ? 'all' : 'residential')}
                            style={{
                                fontSize: '0.7rem',
                                backgroundColor: filter === 'residential' ? '#d97706' : '#fffbeb',
                                color: filter === 'residential' ? 'white' : '#d97706',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🟠 {counts.residential}
                        </button>
                    )}
                    {counts.clear > 0 && (
                        <button
                            onClick={() => setFilter(filter === 'clear' ? 'all' : 'clear')}
                            style={{
                                fontSize: '0.7rem',
                                backgroundColor: filter === 'clear' ? '#16a34a' : '#f0fdf4',
                                color: filter === 'clear' ? 'white' : '#16a34a',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            🟢 {counts.clear}
                        </button>
                    )}
                </div>
                </div>
                {/* 24h Forecast Label */}
                <span style={{
                    fontSize: '0.6rem',
                    color: '#94a3b8',
                    fontStyle: 'italic'
                }}>
                    ❄️ 24h Forecast
                </span>
            </div>

            {/* Scrollable List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0
            }}>
                {filteredGroups.map(group => {
                    const isExpanded = expandedZones.has(group.zoneName);
                    const hasSelectedProperty = group.properties.some(p => p.id === selectedPropertyId);

                    return (
                        <div key={group.zoneName} style={{ marginBottom: '6px' }}>
                            {/* Zone Header - Click to expand AND navigate to zone on map */}
                            <div
                                onClick={() => handleZoneClick(group)}
                                style={{
                                    backgroundColor: hasSelectedProperty ? '#eff6ff' : '#f8fafc',
                                    borderLeft: `4px solid ${group.status.color}`,
                                    borderRight: hasSelectedProperty ? '3px solid #3b82f6' : 'none',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ 
                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                        fontSize: '0.7rem',
                                        color: '#64748b'
                                    }}>
                                        ▶
                                    </span>
                                    <LocationIcon size={14} color={group.status.color} />
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>
                                        {group.zoneName}
                                    </span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        color: '#94a3b8',
                                        backgroundColor: '#f1f5f9',
                                        padding: '2px 6px',
                                        borderRadius: '10px'
                                    }}>
                                        {group.properties.length}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.7rem',
                                        color: '#6b7280'
                                    }}>
                                        <SnowIcon size={10} color="#6b7280" />
                                        {group.status.snow24h.toFixed(1)}cm
                                    </span>
                                    <span style={{
                                        fontSize: '0.55rem',
                                        color: 'white',
                                        backgroundColor: group.status.color,
                                        padding: '2px 5px',
                                        borderRadius: '4px',
                                        fontWeight: 600
                                    }}>
                                        {group.status.label}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Properties */}
                            {isExpanded && (
                                <div style={{
                                    marginLeft: '16px',
                                    marginTop: '4px',
                                    borderLeft: `2px solid ${group.status.color}20`
                                }}>
                                    {group.properties.map(property => {
                                        const isSelected = property.id === selectedPropertyId;
                                        return (
                                            <div
                                                key={property.id}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent zone collapse
                                                    onSelectProperty(property);
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    marginLeft: '8px',
                                                    marginBottom: '2px',
                                                    backgroundColor: isSelected ? '#dbeafe' : 'white',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.8rem',
                                                    transition: 'all 0.2s',
                                                    border: isSelected ? '1px solid #3b82f6' : '1px solid transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        backgroundColor: group.status.color,
                                                        flexShrink: 0
                                                    }} />
                                                    <span style={{ color: '#374151' }}>{property.address}</span>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.6rem',
                                                    color: '#94a3b8',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {property.type}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PropertyList;
