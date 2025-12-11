/**
 * WindyMap Component
 * Integrates Windy.com Map Forecast API with our neighborhood polygons
 * 
 * IMPORTANT: Requires Windy API key from https://api.windy.com/keys
 * 
 * Free Testing tier includes:
 * - Model: GFS only
 * - Overlays: wind, temp, pressure (limited)
 * - Development use only
 * 
 * Professional tier (€990/year) includes:
 * - All models: GFS, ICON, NAM, AROME, GEOS5, CAMS, HRRR, ECMWF
 * - 40+ overlays including rain, snow, clouds, etc.
 * 
 * Windy logo must remain visible per Terms of Service
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { WeatherData } from '../../services/weatherService';

// Windy API types
declare global {
    interface Window {
        windyInit: (options: WindyOptions, callback: (api: WindyAPI) => void) => void;
        L: typeof L;
    }
}

interface WindyOptions {
    key: string;
    verbose?: boolean;
    lat: number;
    lon: number;
    zoom: number;
    overlay?: string;
    level?: string;
    timestamp?: number;
    hourFormat?: '12h' | '24h';
    graticule?: boolean;
    particlesAnim?: 'on' | 'off';
}

interface WindyAPI {
    map: L.Map;
    store: {
        get: (key: string) => any;
        set: (key: string, value: any) => void;
        getAllowed: (key: string) => string[];
        on: (key: string, callback: (value: any) => void) => void;
        off: (key: string, callback: (value: any) => void) => void;
    };
    picker: {
        open: (coords: { lat: number; lon: number }) => void;
        close: () => void;
        getParams: () => { lat: number; lon: number; values: any; overlay: string };
        on: (event: string, callback: (data: any) => void) => void;
    };
    broadcast: {
        on: (event: string, callback: (...args: any[]) => void) => void;
        fire: (event: string, ...args: any[]) => void;
    };
}

// Available overlays - Testing tier has limited options
// Full list for Professional: wind, gust, rainAccu, snowAccu, rain, snow, clouds, pressure, temp, rh, dewpoint, etc.
type OverlayType = 'wind' | 'temp' | 'pressure' | 'clouds' | 'rain' | 'snow';

interface WindyMapProps {
    geoJsonData: any;
    weatherData: Map<string, WeatherData>;
    onSelectNeighborhood: (feature: any) => void;
    apiKey: string;
    overlay?: OverlayType;
}

// UNIFIED COLOR LOGIC: Match alert panel priority system
const getColor = (data: WeatherData | undefined) => {
    if (!data || !data.snowRemoval) return '#22c55e'; // Green default
    if (data.snowRemoval.priority === 'high') return '#ef4444'; // Red - Critical
    if (data.snowRemoval.priority === 'medium') return '#f59e0b'; // Orange - Warning
    return '#22c55e'; // Green - No action needed
};

const WindyMap: React.FC<WindyMapProps> = ({
    geoJsonData,
    weatherData,
    onSelectNeighborhood,
    apiKey,
    overlay = 'wind'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const windyApiRef = useRef<WindyAPI | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentOverlay, setCurrentOverlay] = useState(overlay);

    // Load Windy scripts
    useEffect(() => {
        if (document.getElementById('windy-leaflet-script')) {
            return; // Already loaded
        }

        // Load Leaflet 1.4.0 (required by Windy)
        const leafletScript = document.createElement('script');
        leafletScript.id = 'windy-leaflet-script';
        leafletScript.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
        leafletScript.async = true;

        leafletScript.onload = () => {
            // Load Windy API after Leaflet
            const windyScript = document.createElement('script');
            windyScript.id = 'windy-api-script';
            windyScript.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
            windyScript.async = true;
            windyScript.onload = () => setIsLoaded(true);
            windyScript.onerror = () => setError('Failed to load Windy API');
            document.head.appendChild(windyScript);
        };

        leafletScript.onerror = () => setError('Failed to load Leaflet');
        document.head.appendChild(leafletScript);

        return () => {
            // Cleanup is tricky with Windy - it manages its own state
        };
    }, []);

    // Initialize Windy map
    useEffect(() => {
        if (!isLoaded || !containerRef.current || !window.windyInit) return;
        if (windyApiRef.current) return; // Already initialized

        const options: WindyOptions = {
            key: apiKey,
            verbose: false,
            lat: 49.8951,  // Winnipeg center
            lon: -97.1384,
            zoom: 11,
            overlay: currentOverlay,
        };

        try {
            window.windyInit(options, (api: WindyAPI) => {
                windyApiRef.current = api;
                const { map, store } = api;

                // Set initial overlay
                store.set('overlay', currentOverlay);

                // Add our GeoJSON polygons on top
                if (geoJsonData) {
                    addGeoJsonLayer(map);
                }
            });
        } catch (err) {
            setError('Failed to initialize Windy map');
            console.error('Windy init error:', err);
        }
    }, [isLoaded, apiKey]);

    // Update GeoJSON when data changes
    useEffect(() => {
        if (!windyApiRef.current || !geoJsonData) return;
        addGeoJsonLayer(windyApiRef.current.map);
    }, [geoJsonData, weatherData]);

    // Update overlay when prop changes
    useEffect(() => {
        if (!windyApiRef.current) return;
        windyApiRef.current.store.set('overlay', currentOverlay);
    }, [currentOverlay]);

    const addGeoJsonLayer = (map: L.Map) => {
        // Remove existing layer
        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
        }

        const style = (feature: any) => {
            const id = feature.properties.id;
            const data = weatherData.get(id);
            const color = getColor(data);

            return {
                fillColor: color,
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.6
            };
        };

        const onEachFeature = (feature: any, layer: L.Layer) => {
            const id = feature.properties.id;
            const data = weatherData.get(id);

            const snowfallLabel = data?.snowAccumulation24h
                ? `${data.snowAccumulation24h.toFixed(1)}cm`
                : '?';

            if (layer instanceof L.Polygon && data) {
                layer.bindTooltip(snowfallLabel, {
                    permanent: true,
                    direction: "center",
                    className: "snow-label"
                });
            }

            layer.on({
                click: () => onSelectNeighborhood(feature),
                mouseover: (e) => {
                    const target = e.target;
                    target.setStyle({
                        weight: 4,
                        color: '#333',
                        dashArray: '',
                        fillOpacity: 0.8
                    });
                    target.bringToFront();
                },
                mouseout: (e) => {
                    const target = e.target;
                    target.setStyle({
                        weight: 2,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.6
                    });
                }
            });
        };

        // Use window.L for Windy's Leaflet instance
        const L_instance = window.L || L;
        geoJsonLayerRef.current = L_instance.geoJSON(geoJsonData, {
            style,
            onEachFeature
        }).addTo(map);

        // Fit bounds to our data
        if (geoJsonLayerRef.current.getLayers().length > 0) {
            map.fitBounds(geoJsonLayerRef.current.getBounds(), { padding: [50, 50] });
        }
    };

    const handleOverlayChange = (newOverlay: string) => {
        setCurrentOverlay(newOverlay as any);
        if (windyApiRef.current) {
            windyApiRef.current.store.set('overlay', newOverlay);
        }
    };

    if (error) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>⚠️ {error}</span>
                <span style={{ fontSize: '0.9rem' }}>Please check your Windy API key</span>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            {/* Overlay Control Panel */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backdropFilter: 'blur(10px)',
                minWidth: '140px'
            }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Weather Layer
                </div>
                {[
                    { id: 'wind', label: '💨 Wind', desc: 'Wind speed & direction', free: true },
                    { id: 'temp', label: '🌡️ Temp', desc: 'Temperature', free: true },
                    { id: 'pressure', label: '📊 Pressure', desc: 'Atmospheric pressure', free: true },
                    { id: 'clouds', label: '☁️ Clouds', desc: 'Cloud cover (Pro)', free: false },
                    { id: 'rain', label: '🌧️ Rain', desc: 'Precipitation (Pro)', free: false },
                    { id: 'snow', label: '❄️ Snow', desc: 'Snowfall (Pro)', free: false },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleOverlayChange(item.id)}
                        title={item.desc}
                        style={{
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            fontWeight: currentOverlay === item.id ? 600 : 400,
                            color: currentOverlay === item.id ? '#fff' : item.free ? '#1f2937' : '#94a3b8',
                            backgroundColor: currentOverlay === item.id ? '#3b82f6' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                        }}
                    >
                        <span>{item.label}</span>
                        {!item.free && (
                            <span style={{
                                fontSize: '0.6rem',
                                backgroundColor: currentOverlay === item.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                color: currentOverlay === item.id ? '#fff' : '#64748b',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontWeight: 500
                            }}>PRO</span>
                        )}
                    </button>
                ))}
                <div style={{ 
                    marginTop: '8px', 
                    paddingTop: '8px', 
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.65rem', 
                    color: '#94a3b8',
                    textAlign: 'center'
                }}>
                    Powered by Windy.com
                </div>
            </div>

            {/* Loading Indicator */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1001,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '20px 30px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontWeight: 500, color: '#475569' }}>Loading Windy Map...</span>
                </div>
            )}

            {/* Windy Map Container - MUST have id="windy" */}
            <div
                id="windy"
                ref={containerRef}
                style={{ height: '100%', width: '100%' }}
            />

            {/* Inline keyframes for spinner */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                /* Ensure our polygons render above Windy layers */
                .leaflet-overlay-pane {
                    z-index: 450 !important;
                }
                .snow-label {
                    background: rgba(0, 0, 0, 0.7) !important;
                    border: none !important;
                    border-radius: 4px !important;
                    color: white !important;
                    font-weight: bold !important;
                    font-size: 11px !important;
                    padding: 2px 6px !important;
                }
                /* Windy Logo must remain visible per ToS */
                #windy-logo {
                    display: block !important;
                }
            `}</style>
        </div>
    );
};

export default WindyMap;
