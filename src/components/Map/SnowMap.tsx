/**
 * SnowMap Component with RainViewer Radar Integration
 * 
 * Layer Stacking Order (Custom Panes):
 * 1. Base Map (default tilePane, zIndex: 200)
 * 2. Radar Pane (radarPane, zIndex: 400) - RainViewer animated radar
 * 3. District Pane (districtPane, zIndex: 500) - Winnipeg neighborhoods
 * 
 * RainViewer API: Free tier with attribution
 * Docs: https://www.rainviewer.com/api.html
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { WeatherData } from '../../services/weatherService';
import { CLIENT_PROPERTIES, type ClientProperty } from '../../config/clientProperties';
import { getZoneStatus, getZoneColor, getZoneLevel } from '../../utils/zoneStatusHelper';
import type { SyntheticZone } from '../../utils/syntheticZones';
import { isInOperationalArea } from '../../config/westernSector';

interface SnowMapProps {
    geoJsonData: any;
    weatherData: Map<string, WeatherData>;
    showRadar: boolean;
    onSelectNeighborhood: (feature: any) => void;
    mapRef?: React.MutableRefObject<L.Map | null>;
    selectedZoneId?: string | null; // Track selected zone for highlighting
    selectedPropertyId?: string | null; // Track selected property for highlighting
    onSelectProperty?: (property: ClientProperty) => void; // Property click handler
    syntheticZones?: SyntheticZone[]; // NEW: Bubble zones for orphan addresses
}

// RainViewer API Types
interface RainViewerFrame {
    time: number;
    path: string;
}

interface RainViewerData {
    radar: {
        past: RainViewerFrame[];
        nowcast: RainViewerFrame[];
    };
}

// Custom Panes Setup Component
const CustomPanesSetup: React.FC = () => {
    const map = useMap();

    useEffect(() => {
        // Create custom panes with specific z-index values
        // Order: Base Map (200) -> Districts (400) -> Radar (450) -> Labels (500) -> Markers (600)
        if (!map.getPane('districtPane')) {
            const districtPane = map.createPane('districtPane');
            districtPane.style.zIndex = '400';
            districtPane.style.pointerEvents = 'auto'; // Districts are clickable
        }

        if (!map.getPane('radarPane')) {
            const radarPane = map.createPane('radarPane');
            radarPane.style.zIndex = '450'; // Above districts, below labels
            radarPane.style.pointerEvents = 'none'; // Radar doesn't block clicks
        }

        if (!map.getPane('labelsPane')) {
            const labelsPane = map.createPane('labelsPane');
            labelsPane.style.zIndex = '500';
            labelsPane.style.pointerEvents = 'none';
        }

        // NEW: Markers pane with highest z-index for mobile visibility
        if (!map.getPane('markersPane')) {
            const markersPane = map.createPane('markersPane');
            markersPane.style.zIndex = '600'; // Above everything else
            markersPane.style.pointerEvents = 'auto'; // Markers are clickable
        }
    }, [map]);

    return null;
};

// Radar Timeline Slider Component
const RadarTimelineSlider: React.FC<{
    frames: RainViewerFrame[];
    currentFrame: number;
    onFrameChange: (frame: number) => void;
    radarLayers: L.TileLayer[];
    isPlaying: boolean;
    onPlayPauseToggle: () => void;
}> = ({ frames, currentFrame, onFrameChange, radarLayers, isPlaying, onPlayPauseToggle }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFrame = parseInt(e.target.value, 10);
        setIsDragging(true);
        
        // Pause animation when manually scrubbing
        if (isPlaying) {
            onPlayPauseToggle();
        }
        
        // Immediately update layer visibility
        radarLayers.forEach((layer, index) => {
            layer.setOpacity(index === newFrame ? 0.6 : 0);
        });
        
        onFrameChange(newFrame);
    };

    const handleSliderMouseUp = () => {
        setIsDragging(false);
    };

    const togglePlayPause = () => {
        onPlayPauseToggle();
    };

    const currentTime = frames[currentFrame]?.time
        ? new Date(frames[currentFrame].time * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
        : '--:--';

    const isForecast = currentFrame >= frames.length - 3;

    return (
        <div style={{
            position: 'absolute',
            bottom: '240px',
            left: '10px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            color: '#1f2937',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            zIndex: 1001,
            pointerEvents: 'auto',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.1)',
            minWidth: '200px'
        }}>
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>📡</span> Radar
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{currentTime}</span>
                    {isForecast && (
                        <span style={{ 
                            backgroundColor: '#dbeafe', 
                            color: '#2563eb', 
                            fontSize: '0.6rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontWeight: 600
                        }}>FORECAST</span>
                    )}
                </div>
            </div>

            {/* Timeline Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: isPlaying ? '#3b82f6' : '#e5e7eb',
                        color: isPlaying ? 'white' : '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Draggable Slider */}
                <input
                    type="range"
                    min={0}
                    max={frames.length - 1}
                    value={currentFrame}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderMouseUp}
                    onTouchEnd={handleSliderMouseUp}
                    style={{
                        flex: 1,
                        height: '6px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6',
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentFrame / (frames.length - 1)) * 100}%, #e5e7eb ${(currentFrame / (frames.length - 1)) * 100}%, #e5e7eb 100%)`,
                        borderRadius: '3px',
                        outline: 'none',
                        WebkitAppearance: 'none'
                    }}
                />
            </div>

            {/* Time Range Labels */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '6px',
                fontSize: '0.65rem',
                color: '#9ca3af'
            }}>
                <span>{frames[0]?.time ? new Date(frames[0].time * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                <span>Now</span>
                <span style={{ color: '#3b82f6' }}>+30min</span>
            </div>
        </div>
    );
};

// RainViewer Radar Layer Component
const RainViewerRadar: React.FC<{ enabled: boolean }> = ({ enabled }) => {
    const map = useMap();
    const radarLayersRef = useRef<L.TileLayer[]>([]);
    const [frames, setFrames] = useState<RainViewerFrame[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const handlePlayPauseToggle = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    // Color scheme: 2 = Universal Blue (matches Apple/Dark aesthetic)
    // Options: 1=Original, 2=Universal Blue, 3=TITAN, 4=TWC, 5=Meteored, 6=NEXRAD, 7=Rainbow, 8=Dark Sky
    const colorScheme = 2;
    const smoothing = 1; // Enable smooth radar rendering
    const snow = 1; // Show snow detection

    // Fetch RainViewer API data
    const fetchRadarData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data: RainViewerData = await response.json();

            // Combine ALL past frames (up to 6 hours / 36 frames) with nowcast for extended timeline
            // RainViewer typically provides 2-3 hours of past data, we take all available
            const allFrames = [
                ...data.radar.past,  // All available past frames (typically 12-15 frames)
                ...data.radar.nowcast.slice(0, 6)  // Up to 1 hour forecast
            ];

            setFrames(allFrames);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch RainViewer data:', error);
            setIsLoading(false);
        }
    }, []);

    // Initialize radar data
    useEffect(() => {
        if (enabled) {
            fetchRadarData();
            const refreshInterval = setInterval(fetchRadarData, 10 * 60 * 1000);
            return () => clearInterval(refreshInterval);
        }
    }, [enabled, fetchRadarData]);

    // Pre-load all radar frames
    useEffect(() => {
        if (!enabled || frames.length === 0) return;

        const radarPane = map.getPane('radarPane');
        if (!radarPane) return;

        // Clear existing layers
        radarLayersRef.current.forEach(layer => {
            if (map.hasLayer(layer)) map.removeLayer(layer);
        });
        radarLayersRef.current = [];

        // Create tile layers for each frame
        frames.forEach((frame, index) => {
            const layer = L.tileLayer(
                `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/${colorScheme}/${smoothing}_${snow}.png`,
                {
                    pane: 'radarPane',
                    opacity: index === 0 ? 0.6 : 0,
                    tileSize: 256,
                    className: 'radar-tile-layer',
                    maxZoom: 18,
                    maxNativeZoom: 15  // RainViewer max native, but upscale to 18
                }
            );
            layer.addTo(map);
            radarLayersRef.current.push(layer);
        });

        return () => {
            radarLayersRef.current.forEach(layer => {
                if (map.hasLayer(layer)) map.removeLayer(layer);
            });
            radarLayersRef.current = [];
        };
    }, [map, frames, enabled, colorScheme, smoothing, snow]);

    // Smooth animation loop - respects isPlaying state
    useEffect(() => {
        if (!enabled || frames.length === 0 || radarLayersRef.current.length === 0) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        // Stop animation when paused
        if (!isPlaying) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const frameDuration = 800; // ms per frame

        const animate = (timestamp: number) => {
            if (timestamp - lastFrameTimeRef.current >= frameDuration) {
                lastFrameTimeRef.current = timestamp;

                const currentLayer = radarLayersRef.current[currentFrame];
                const nextFrame = (currentFrame + 1) % frames.length;
                const nextLayer = radarLayersRef.current[nextFrame];

                if (currentLayer && nextLayer) {
                    // Smooth cross-fade
                    let fadeProgress = 0;
                    const fadeStep = () => {
                        fadeProgress += 0.15;
                        if (fadeProgress <= 1) {
                            currentLayer.setOpacity(0.6 * (1 - fadeProgress));
                            nextLayer.setOpacity(0.6 * fadeProgress);
                            requestAnimationFrame(fadeStep);
                        } else {
                            currentLayer.setOpacity(0);
                            nextLayer.setOpacity(0.6);
                        }
                    };
                    fadeStep();
                }

                setCurrentFrame(nextFrame);
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [enabled, frames, currentFrame, isPlaying]);

    // Cleanup when disabled
    useEffect(() => {
        if (!enabled) {
            radarLayersRef.current.forEach(layer => {
                if (map.hasLayer(layer)) map.removeLayer(layer);
            });
            radarLayersRef.current = [];
            setFrames([]);
            setCurrentFrame(0);
        }
    }, [enabled, map]);

    if (!enabled) return null;

    return (
        <>
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '70px',
                    left: '60px',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    color: '#1f2937',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    zIndex: 1001,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.1)'
                }}>
                    <div className="radar-spinner" />
                    Loading radar...
                </div>
            )}

            {!isLoading && frames.length > 0 && (
                <RadarTimelineSlider
                    frames={frames}
                    currentFrame={currentFrame}
                    onFrameChange={setCurrentFrame}
                    radarLayers={radarLayersRef.current}
                    isPlaying={isPlaying}
                    onPlayPauseToggle={handlePlayPauseToggle}
                />
            )}

            {/* RainViewer Attribution (Required) */}
            <div style={{
                position: 'absolute',
                bottom: '240px',
                right: '10px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#6b7280',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.6rem',
                zIndex: 1001,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
            }}>
                <a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}>
                    RainViewer
                </a>
            </div>
        </>
    );
};

// Map Bounds Refocuser
const MapRefocuser: React.FC<{ data: any }> = ({ data }) => {
    const map = useMap();
    useEffect(() => {
        if (data) {
            const geoJsonLayer = L.geoJSON(data);
            if (geoJsonLayer.getLayers().length > 0) {
                map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
            }
        }
    }, [data, map]);
    return null;
};

// UNIFIED COLOR LOGIC - Now uses zoneStatusHelper for consistency
// Level 0 (0-0.2cm): Green (Clear) - No label
// Level 1 (0.2-0.9cm): Green with "Trace" label - Salting/Watch
// Level 2 (1.0-4.9cm): Orange/Yellow - Residential Triggered
// Level 3 (>=5.0cm): Red/Alert - Commercial Triggered (High Priority)
const getColor = (data: WeatherData | undefined) => {
    return getZoneColor(data);
};

// Get threshold level for labeling logic - Now uses zoneStatusHelper
const getSnowLevel = (snow24h: number): 0 | 1 | 2 | 3 => {
    // Create mock data to use the unified helper
    const mockData = { snowAccumulation24h: snow24h } as WeatherData;
    return getZoneLevel(mockData);
};

/**
 * Point-in-Polygon Check using Ray Casting Algorithm
 * Returns true if point (lat, lng) is inside the polygon
 */
const isPointInPolygon = (lat: number, lng: number, polygon: number[][]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > lng) !== (yj > lng))
            && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

/**
 * Check if any client property point falls within a GeoJSON feature
 * Works with Polygon and MultiPolygon geometries
 */
const featureContainsClientProperty = (feature: any): boolean => {
    if (!feature?.geometry) return false;
    
    const geometry = feature.geometry;
    
    for (const prop of CLIENT_PROPERTIES) {
        const lat = prop.lat;
        const lng = prop.lng;
        
        if (geometry.type === 'Polygon') {
            // GeoJSON coordinates are [lng, lat], so we check against [lng, lat] order
            const coords = geometry.coordinates[0]; // Outer ring
            if (isPointInPolygon(lng, lat, coords)) {
                return true;
            }
        } else if (geometry.type === 'MultiPolygon') {
            for (const poly of geometry.coordinates) {
                const coords = poly[0]; // Outer ring of each polygon
                if (isPointInPolygon(lng, lat, coords)) {
                    return true;
                }
            }
        }
    }
    return false;
};

// District GeoJSON Layer with Custom Pane - 3-TIER VISUAL HIERARCHY
// Tier 1: Service Zones (My Clients) - Full color, prominent, shows pins
// Tier 2: Context Zones (Western Sector) - Lighter fill, clickable with weather
// Tier 3: Outside Zones - Ghost/hidden, minimal interaction
const DistrictLayer: React.FC<{
    geoJsonData: any;
    weatherData: Map<string, WeatherData>;
    onSelectNeighborhood: (feature: any) => void;
    selectedZoneId?: string | null; // NEW: Track selected zone
}> = ({ geoJsonData, weatherData, onSelectNeighborhood, selectedZoneId }) => {
    const map = useMap();
    const layerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (!geoJsonData) return;

        if (layerRef.current) map.removeLayer(layerRef.current);

        // DYNAMIC SERVICE ZONE DETECTION
        // Pre-compute which zones contain client property pins (point-in-polygon)
        // This is cached per render to avoid recalculating for each feature
        const serviceZoneIds = new Set<string>();
        for (const feature of geoJsonData.features) {
            if (featureContainsClientProperty(feature)) {
                serviceZoneIds.add(feature.properties.id);
            }
        }
        console.log(`📍 Tier 1 Service Zones (with pins): ${serviceZoneIds.size}`);

        // Helper: Check if zone contains any client properties (DYNAMIC - geometry-based)
        const hasClientProperties = (featureId: string): boolean => {
            return serviceZoneIds.has(featureId);
        };

        const style = (feature: any): L.PathOptions => {
            const id = feature.properties.id;
            const isMyServiceZone = hasClientProperties(id); // Tier 1: Has client pins
            const isContextZone = isInOperationalArea(feature); // Tier 2: In Western Sector
            const isSelected = id === selectedZoneId;
            
            // Get weather data and color for all zones
            const data = weatherData.get(id);
            const color = getColor(data);
            
            // TIER 3: OUTSIDE ZONES (Not in Western Sector) - Ghost/hidden
            if (!isMyServiceZone && !isContextZone) {
                return {
                    fillColor: '#e5e7eb', // Neutral gray
                    weight: 0.3,
                    opacity: 0.2,
                    color: '#9ca3af',
                    fillOpacity: 0.05, // Almost invisible
                    pane: 'districtPane'
                };
            }
            
            // TIER 2: CONTEXT ZONES (In Western Sector, no clients) - Clickable but lighter
            if (!isMyServiceZone && isContextZone) {
                if (isSelected) {
                    return {
                        fillColor: color,
                        weight: 4,
                        opacity: 1,
                        color: '#06b6d4', // Cyan highlight
                        fillOpacity: 0.5,
                        pane: 'districtPane'
                    };
                }
                return {
                    fillColor: color,
                    weight: 1,
                    opacity: 0.6,
                    color: '#94a3b8', // Slate gray border
                    dashArray: '4, 4', // Dashed border to distinguish
                    fillOpacity: 0.25, // Lighter than service zones
                    pane: 'districtPane'
                };
            }
            
            // TIER 1: MY SERVICE ZONES (Active Territory) - Bright and prominent
            // SELECTED ZONE: Thick cyan glow border
            if (isSelected) {
                return {
                    fillColor: color,
                    weight: 5, // Extra thick for selected
                    opacity: 1,
                    color: '#06b6d4', // Cyan highlight
                    fillOpacity: 0.7, // More opaque when selected
                    pane: 'districtPane'
                };
            }

            // Normal SERVICE ZONE style - Bright and prominent
            return {
                fillColor: color,
                weight: 2, // Thick white border to pop
                opacity: 1,
                color: '#ffffff', // Solid white border
                fillOpacity: 0.6, // Solid, easy to see
                pane: 'districtPane'
            };
        };

        const onEachFeature = (feature: any, layer: L.Layer) => {
            const name = feature.properties.name;
            const id = feature.properties.id;
            const isMyServiceZone = hasClientProperties(id);
            const isContextZone = isInOperationalArea(feature);
            const data = weatherData.get(id);

            // TIER 3: OUTSIDE ZONES - No interaction (skip entirely)
            if (!isMyServiceZone && !isContextZone) {
                return;
            }

            // TIER 2: CONTEXT ZONES - Clickable with weather popup
            if (!isMyServiceZone && isContextZone) {
                // Tooltip shows zone name
                if (layer instanceof L.Polygon) {
                    layer.bindTooltip(name, {
                        permanent: false,
                        direction: "center",
                        className: "ghost-zone-label"
                    });
                }
                
                // CLICKABLE: Opens weather popup
                layer.on({
                    click: () => onSelectNeighborhood(feature),
                    mouseover: (e) => {
                        if (feature.properties.id !== selectedZoneId) {
                            e.target.setStyle({ 
                                fillOpacity: 0.4, 
                                weight: 2, 
                                color: '#64748b' 
                            });
                        }
                    },
                    mouseout: (e) => {
                        if (feature.properties.id === selectedZoneId) {
                            e.target.setStyle({ weight: 4, color: '#06b6d4', fillOpacity: 0.5 });
                        } else {
                            e.target.setStyle({ 
                                fillOpacity: 0.25, 
                                weight: 1, 
                                color: '#94a3b8',
                                dashArray: '4, 4'
                            });
                        }
                    }
                });
                return;
            }

            // TIER 1: SERVICE ZONES - Full interaction and labels
            // Labels based on 4-level snow threshold system
            if (layer instanceof L.Polygon && data && data.snowAccumulation24h !== undefined) {
                const snow24h = data.snowAccumulation24h;
                const level = getSnowLevel(snow24h);
                
                if (level === 2) {
                    layer.bindTooltip(`${snow24h.toFixed(1)} cm`, {
                        permanent: true,
                        direction: "center",
                        className: "snow-label-residential",
                        pane: 'labelsPane'
                    });
                } else if (level === 3) {
                    layer.bindTooltip(`${snow24h.toFixed(1)} cm`, {
                        permanent: true,
                        direction: "center",
                        className: "snow-label-commercial",
                        pane: 'labelsPane'
                    });
                }
            }

            layer.on({
                click: () => onSelectNeighborhood(feature),
                mouseover: (e) => {
                    if (feature.properties.id !== selectedZoneId) {
                        e.target.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.7 });
                    }
                    e.target.bringToFront();
                },
                mouseout: (e) => {
                    if (feature.properties.id === selectedZoneId) {
                        e.target.setStyle({ weight: 5, color: '#06b6d4', fillOpacity: 0.7 });
                    } else {
                        e.target.setStyle({ weight: 2, color: '#ffffff', fillOpacity: 0.6 });
                    }
                }
            });
        };

        layerRef.current = L.geoJSON(geoJsonData, {
            style,
            onEachFeature,
            pane: 'districtPane'
        }).addTo(map);

        return () => {
            if (layerRef.current) map.removeLayer(layerRef.current);
        };
    }, [geoJsonData, weatherData, onSelectNeighborhood, map, selectedZoneId]); // Added selectedZoneId

    return null;
};

// Map Reference Exposer - exposes map instance to parent
const MapRefExposer: React.FC<{ mapRef?: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
    const map = useMap();
    useEffect(() => {
        if (mapRef) {
            mapRef.current = map;
        }
    }, [map, mapRef]);
    return null;
};

// Property Markers Layer - Displays pins for client addresses
const PropertyMarkersLayer: React.FC<{
    weatherData: Map<string, WeatherData>;
    geoJsonData: any;
    selectedPropertyId?: string | null;
    onSelectProperty?: (property: ClientProperty) => void;
}> = ({ weatherData, geoJsonData, selectedPropertyId, onSelectProperty }) => {
    const map = useMap();
    const markersRef = useRef<L.LayerGroup | null>(null);

    // Find zone ID from zone name
    const getZoneIdFromName = (zoneName: string): string | undefined => {
        if (!geoJsonData?.features) return undefined;
        const feature = geoJsonData.features.find((f: any) => f.properties.name === zoneName);
        return feature?.properties.id;
    };

    useEffect(() => {
        if (!map) return;

        // Remove existing markers
        if (markersRef.current) {
            map.removeLayer(markersRef.current);
        }

        // Create new layer group
        markersRef.current = L.layerGroup();

        // Add markers for each property
        CLIENT_PROPERTIES.forEach(property => {
            const zoneId = getZoneIdFromName(property.zone);
            const data = zoneId ? weatherData.get(zoneId) : undefined;
            const status = getZoneStatus(data);
            const isSelected = property.id === selectedPropertyId;

            // Create custom icon based on zone status color
            const iconHtml = `
                <div style="
                    width: ${isSelected ? '16px' : '12px'};
                    height: ${isSelected ? '16px' : '12px'};
                    background-color: ${status.color};
                    border: 2px solid ${isSelected ? '#06b6d4' : 'white'};
                    border-radius: 50%;
                    box-shadow: ${isSelected 
                        ? '0 0 8px rgba(6, 182, 212, 0.8), 0 2px 6px rgba(0,0,0,0.3)' 
                        : '0 2px 6px rgba(0,0,0,0.3)'};
                    cursor: pointer;
                    transition: all 0.2s;
                "></div>
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'property-marker',
                iconSize: [isSelected ? 20 : 16, isSelected ? 20 : 16],
                iconAnchor: [isSelected ? 10 : 8, isSelected ? 10 : 8]
            });

            // Use markersPane for higher z-index (fixes mobile visibility)
            const marker = L.marker([property.lat, property.lng], { 
                icon,
                pane: 'markersPane'
            });

            // Tooltip with address info
            marker.bindTooltip(`
                <div style="font-weight: 600; margin-bottom: 2px;">${property.address}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">${property.zone}</div>
                <div style="font-size: 0.7rem; color: ${status.color}; font-weight: 600;">${status.label}</div>
            `, {
                permanent: false,
                direction: 'top',
                offset: [0, -8],
                className: 'property-tooltip'
            });

            // Click handler
            marker.on('click', () => {
                if (onSelectProperty) {
                    onSelectProperty(property);
                }
            });

            markersRef.current?.addLayer(marker);
        });

        markersRef.current.addTo(map);

        return () => {
            if (markersRef.current) {
                map.removeLayer(markersRef.current);
            }
        };
    }, [map, weatherData, geoJsonData, selectedPropertyId, onSelectProperty]);

    return null;
};

// Synthetic Bubble Zones Layer - Displays circle zones for orphan addresses
const SyntheticZonesLayer: React.FC<{
    syntheticZones: SyntheticZone[];
    weatherData: Map<string, WeatherData>;
    onSelectNeighborhood: (feature: any) => void;
    selectedZoneId?: string | null;
}> = ({ syntheticZones, weatherData, onSelectNeighborhood, selectedZoneId }) => {
    const map = useMap();
    const layerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (!map || syntheticZones.length === 0) return;

        // Remove existing layer
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
        }

        // Convert synthetic zones to GeoJSON features
        const features = syntheticZones.map(zone => ({
            type: 'Feature' as const,
            properties: {
                id: zone.id,
                name: zone.name,
                isSynthetic: true,
                properties: zone.properties
            },
            geometry: zone.geometry
        }));

        const geoJsonData = {
            type: 'FeatureCollection',
            features
        };

        // Create GeoJSON layer with bubble zone styling
        layerRef.current = L.geoJSON(geoJsonData as any, {
            pane: 'districtPane',
            style: (feature) => {
                const zoneId = feature?.properties?.id;
                const data = zoneId ? weatherData.get(zoneId) : undefined;
                const status = getZoneStatus(data);
                const isSelected = zoneId === selectedZoneId;
                
                return {
                    fillColor: status.color,
                    fillOpacity: isSelected ? 0.55 : 0.35,
                    color: isSelected ? '#06b6d4' : status.color,
                    weight: isSelected ? 3 : 2,
                    opacity: isSelected ? 1 : 0.7,
                    dashArray: '6, 4' // Dashed border to distinguish synthetic zones
                };
            },
            onEachFeature: (feature, layer) => {
                // Add tooltip with zone name
                layer.bindTooltip(
                    `<div style="text-align:center;">
                        <div style="font-weight:600;margin-bottom:2px;">${feature.properties.name}</div>
                        <div style="font-size:0.7rem;color:#6b7280;">Remote Zone</div>
                    </div>`,
                    { 
                        permanent: false, 
                        direction: 'center',
                        className: 'snow-label-apple'
                    }
                );

                // Click handler
                layer.on('click', () => {
                    onSelectNeighborhood({
                        ...feature,
                        properties: {
                            ...feature.properties,
                            isSynthetic: true
                        }
                    });
                });

                // Hover effects
                layer.on('mouseover', () => {
                    (layer as L.Path).setStyle({
                        fillOpacity: 0.5,
                        weight: 3
                    });
                });
                layer.on('mouseout', () => {
                    const isSelected = feature.properties.id === selectedZoneId;
                    (layer as L.Path).setStyle({
                        fillOpacity: isSelected ? 0.55 : 0.35,
                        weight: isSelected ? 3 : 2
                    });
                });
            }
        }).addTo(map);

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
            }
        };
    }, [map, syntheticZones, weatherData, onSelectNeighborhood, selectedZoneId]);

    return null;
};

// Main SnowMap Component
const SnowMap: React.FC<SnowMapProps> = ({
    geoJsonData,
    weatherData,
    showRadar,
    onSelectNeighborhood,
    mapRef,
    selectedZoneId,
    selectedPropertyId,
    onSelectProperty,
    syntheticZones = []
}) => {
    return (
        <MapContainer
            center={[49.8951, -97.1384]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
        >
            <CustomPanesSetup />
            <MapRefExposer mapRef={mapRef} />

            {/* Layer 1: Light Base Map (CartoDB Positron) */}
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* Layer 2: RainViewer Radar (radarPane, zIndex: 400) */}
            <RainViewerRadar enabled={showRadar} />

            {/* Layer 3: District Polygons (districtPane, zIndex: 500) - FOCUS MODE */}
            {geoJsonData && (
                <>
                    <DistrictLayer
                        geoJsonData={geoJsonData}
                        weatherData={weatherData}
                        onSelectNeighborhood={onSelectNeighborhood}
                        selectedZoneId={selectedZoneId}
                    />
                    <MapRefocuser data={geoJsonData} />
                </>
            )}

            {/* Layer 3.5: Synthetic Bubble Zones (for orphan addresses) */}
            {syntheticZones.length > 0 && (
                <SyntheticZonesLayer
                    syntheticZones={syntheticZones}
                    weatherData={weatherData}
                    onSelectNeighborhood={onSelectNeighborhood}
                    selectedZoneId={selectedZoneId}
                />
            )}

            {/* Layer 4: Property Markers (Pins) */}
            <PropertyMarkersLayer
                weatherData={weatherData}
                geoJsonData={geoJsonData}
                selectedPropertyId={selectedPropertyId}
                onSelectProperty={onSelectProperty}
            />

            <style>{`
                .snow-label-apple {
                    background: rgba(255, 255, 255, 0.95) !important;
                    border: 1px solid rgba(0, 0, 0, 0.1) !important;
                    border-radius: 6px !important;
                    color: #1f2937 !important;
                    font-weight: 600 !important;
                    font-size: 11px !important;
                    padding: 4px 8px !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                .snow-label-apple::before { display: none !important; }
                .ghost-zone-label {
                    background: rgba(148, 163, 184, 0.9) !important;
                    border: none !important;
                    border-radius: 4px !important;
                    color: white !important;
                    font-weight: 500 !important;
                    font-size: 10px !important;
                    padding: 2px 6px !important;
                    box-shadow: none !important;
                }
                .ghost-zone-label::before { display: none !important; }
                .property-marker { background: transparent !important; border: none !important; }
                .property-tooltip {
                    background: rgba(255, 255, 255, 0.98) !important;
                    border: 1px solid rgba(0, 0, 0, 0.1) !important;
                    border-radius: 8px !important;
                    padding: 8px 12px !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                .property-tooltip::before { display: none !important; }
                .leaflet-container { background: #f8fafc; }
                .radar-tile-layer { transition: opacity 0.3s ease-out; }
                .radar-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(59, 130, 246, 0.3);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </MapContainer>
    );
};

export default SnowMap;
