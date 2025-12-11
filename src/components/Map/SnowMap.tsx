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

interface SnowMapProps {
    geoJsonData: any;
    weatherData: Map<string, WeatherData>;
    showRadar: boolean;
    onSelectNeighborhood: (feature: any) => void;
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
        // Order: Base Map (200) -> Districts (400) -> Radar (450) -> Labels (500)
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

// UNIFIED COLOR LOGIC - Based on 24h Snow Accumulation
// Level 0 (0-0.2cm): Green (Clear) - No label
// Level 1 (0.2-0.9cm): Green with "Trace" label - Salting/Watch
// Level 2 (1.0-4.9cm): Orange/Yellow - Residential Triggered
// Level 3 (>=5.0cm): Red/Alert - Commercial Triggered (High Priority)
const getColor = (data: WeatherData | undefined) => {
    if (!data) return '#22c55e'; // Default green
    
    const snow24h = data.snowAccumulation24h || 0;
    
    if (snow24h >= 5.0) return '#ef4444'; // Level 3: Red - Commercial
    if (snow24h >= 1.0) return '#f59e0b'; // Level 2: Orange - Residential  
    return '#22c55e'; // Level 0 & 1: Green (Clear/Trace)
};

// Get threshold level for labeling logic
const getSnowLevel = (snow24h: number): 0 | 1 | 2 | 3 => {
    if (snow24h >= 5.0) return 3; // Commercial
    if (snow24h >= 1.0) return 2; // Residential
    if (snow24h >= 0.2) return 1; // Trace/Salting
    return 0; // Clear
};

// District GeoJSON Layer with Custom Pane
const DistrictLayer: React.FC<{
    geoJsonData: any;
    weatherData: Map<string, WeatherData>;
    onSelectNeighborhood: (feature: any) => void;
}> = ({ geoJsonData, weatherData, onSelectNeighborhood }) => {
    const map = useMap();
    const layerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (!geoJsonData) return;

        if (layerRef.current) map.removeLayer(layerRef.current);

        const style = (feature: any): L.PathOptions => {
            const id = feature.properties.id;
            const data = weatherData.get(id);
            const color = getColor(data);

            return {
                fillColor: color,
                weight: 2,
                opacity: 1,
                color: 'rgba(255, 255, 255, 0.9)',
                fillOpacity: 0.35,
                pane: 'districtPane'
            };
        };

        const onEachFeature = (feature: any, layer: L.Layer) => {
            const id = feature.properties.id;
            const data = weatherData.get(id);

            // Labels based on 4-level snow threshold system
            // Level 0 (0-0.2cm): Green, NO label
            // Level 1 (0.2-0.9cm): Green, NO label (too cluttered)
            // Level 2 (1-4.9cm): Orange, show value (e.g., "2.5 cm")
            // Level 3 (>=5cm): Red, show value (e.g., "6.0 cm")
            if (layer instanceof L.Polygon && data && data.snowAccumulation24h !== undefined) {
                const snow24h = data.snowAccumulation24h;
                const level = getSnowLevel(snow24h);
                
                if (level === 2) {
                    // Level 2: Residential (orange) - show value
                    layer.bindTooltip(`${snow24h.toFixed(1)} cm`, {
                        permanent: true,
                        direction: "center",
                        className: "snow-label-residential",
                        pane: 'labelsPane'
                    });
                } else if (level === 3) {
                    // Level 3: Commercial (red) - show value with emphasis
                    layer.bindTooltip(`${snow24h.toFixed(1)} cm`, {
                        permanent: true,
                        direction: "center",
                        className: "snow-label-commercial",
                        pane: 'labelsPane'
                    });
                }
                // Level 0 & 1: No label (clear/trace zones - keeps map clean)
            }

            layer.on({
                click: () => onSelectNeighborhood(feature),
                mouseover: (e) => {
                    e.target.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.5 });
                    e.target.bringToFront();
                },
                mouseout: (e) => {
                    e.target.setStyle({ weight: 2, color: 'rgba(255, 255, 255, 0.9)', fillOpacity: 0.35 });
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
    }, [geoJsonData, weatherData, onSelectNeighborhood, map]);

    return null;
};

// Main SnowMap Component
const SnowMap: React.FC<SnowMapProps> = ({
    geoJsonData,
    weatherData,
    showRadar,
    onSelectNeighborhood
}) => {
    return (
        <MapContainer
            center={[49.8951, -97.1384]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
        >
            <CustomPanesSetup />

            {/* Layer 1: Light Base Map (CartoDB Positron) */}
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* Layer 2: RainViewer Radar (radarPane, zIndex: 400) */}
            <RainViewerRadar enabled={showRadar} />

            {/* Layer 3: District Polygons (districtPane, zIndex: 500) */}
            {geoJsonData && (
                <>
                    <DistrictLayer
                        geoJsonData={geoJsonData}
                        weatherData={weatherData}
                        onSelectNeighborhood={onSelectNeighborhood}
                    />
                    <MapRefocuser data={geoJsonData} />
                </>
            )}

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
