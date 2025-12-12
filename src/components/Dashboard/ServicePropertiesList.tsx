/**
 * ServicePropertiesList Component
 * 
 * Shows ALL contracted service properties regardless of snow status.
 * Sorted by priority (Red > Orange > Green) then alphabetically.
 * 
 * Features:
 * - Compact summary bar at top (🔴 3 Commercial | 🟠 12 Residential | 🟢 20 Clear)
 * - Full-height scrollable list
 * - Selected zone highlighting
 * - Click to fly to zone on map
 */

import React, { useState } from 'react';
import { LocationIcon, SnowIcon } from '../Icons/Icons';
import type { WeatherData } from '../../services/weatherService';
import { getZoneStatus } from '../../utils/zoneStatusHelper';

interface ServiceProperty {
    id: string;
    name: string;
    data: WeatherData;
}

interface ServicePropertiesListProps {
    properties: ServiceProperty[];
    onSelect: (id: string) => void;
    selectedId?: string | null; // NEW: Track selected zone
}

// Filter types
type FilterType = 'all' | 'commercial' | 'residential' | 'clear';

const ServicePropertiesList: React.FC<ServicePropertiesListProps> = ({ properties, onSelect, selectedId }) => {
    const [filter, setFilter] = useState<FilterType>('all');
    
    if (properties.length === 0) {
        return null;
    }

    // Categorize by status using unified helper
    const commercial = properties.filter(p => getZoneStatus(p.data).level === 3);
    const residential = properties.filter(p => getZoneStatus(p.data).level === 2);
    const clear = properties.filter(p => getZoneStatus(p.data).level <= 1);
    
    // Apply filter
    const filteredProperties = filter === 'all' ? properties
        : filter === 'commercial' ? commercial
        : filter === 'residential' ? residential
        : clear;

    const renderPropertyCard = (property: ServiceProperty) => {
        const status = getZoneStatus(property.data);
        const isSelected = property.id === selectedId;

        return (
            <div
                key={property.id}
                onClick={() => onSelect(property.id)}
                style={{
                    backgroundColor: isSelected ? '#eff6ff' : 'white',
                    borderLeft: `4px solid ${status.color}`,
                    borderRight: isSelected ? '3px solid #3b82f6' : 'none',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(59,130,246,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                    marginBottom: '6px'
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.boxShadow = `0 4px 8px rgba(0,0,0,0.1)`;
                        e.currentTarget.style.transform = 'translateX(4px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LocationIcon size={14} color={status.color} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>
                            {property.name}
                        </span>
                    </div>
                    <span style={{
                        fontSize: '0.6rem',
                        color: 'white',
                        backgroundColor: status.color,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600
                    }}>
                        {status.label}
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '4px'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <SnowIcon size={12} color="#6b7280" />
                        {status.pastSnow24h.toFixed(1)}cm past 24h
                    </span>
                    <span>|</span>
                    <span>{status.snow24h.toFixed(1)}cm next 24h</span>
                </div>
            </div>
        );
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
            {/* Compact Summary Bar - Clickable Filters */}
            <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '10px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <span style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontWeight: 600,
                    marginRight: '4px'
                }}>
                    📋 My Properties ({properties.length})
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {commercial.length > 0 && (
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
                            🔴 {commercial.length}
                        </button>
                    )}
                    {residential.length > 0 && (
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
                            🟠 {residential.length}
                        </button>
                    )}
                    {clear.length > 0 && (
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
                            🟢 {clear.length}
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable List - Full Height */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0
            }}>
                {filteredProperties.map(renderPropertyCard)}
            </div>
        </div>
    );
};

export default ServicePropertiesList;
