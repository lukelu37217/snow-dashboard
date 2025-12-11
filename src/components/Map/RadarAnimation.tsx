/**
 * Smooth Radar Animation Component
 * Preloads frames and uses CSS transitions for smooth playback
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface RadarAnimationProps {
    map: L.Map | null;
    isPlaying: boolean;
    geoMetAPI: string;
}

const RadarAnimation: React.FC<RadarAnimationProps> = ({ map, isPlaying, geoMetAPI }) => {
    const layersRef = useRef<L.TileLayer[]>([]);
    const currentIndexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Generate time frames (last 2 hours, every 10 minutes)
    const generateFrames = () => {
        const frames: string[] = [];
        const now = new Date();

        for (let i = 12; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 10 * 60 * 1000));
            const timestamp = time.toISOString().split('.')[0] + 'Z';
            frames.push(timestamp);
        }

        return frames;
    };

    // Preload all radar layers
    useEffect(() => {
        if (!map) return;

        setIsLoading(true);

        const frames = generateFrames();

        // Create all layers with opacity 0
        layersRef.current = frames.map((time, index) => {
            const layer = L.tileLayer.wms(geoMetAPI, {
                layers: 'RADAR_1KM_RSNO',
                format: 'image/png',
                transparent: true,
                opacity: 0,
                version: '1.3.0',
                time: time,
                crs: L.CRS.EPSG4326,
                attribution: 'Environment Canada'
            });

            layer.addTo(map);
            return layer;
        });

        // Show first frame
        if (layersRef.current.length > 0) {
            layersRef.current[0].setOpacity(0.6);
        }

        setIsLoading(false);

        // Cleanup on unmount
        return () => {
            layersRef.current.forEach(layer => {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            });
            layersRef.current = [];
        };
    }, [map, geoMetAPI]);

    // Animation loop with smooth transitions
    useEffect(() => {
        if (!isPlaying || layersRef.current.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            const layers = layersRef.current;
            const currentIndex = currentIndexRef.current;
            const nextIndex = (currentIndex + 1) % layers.length;

            // Smooth cross-fade between frames
            layers[currentIndex].setOpacity(0);
            layers[nextIndex].setOpacity(0.6);

            currentIndexRef.current = nextIndex;
        }, 500); // 500ms per frame

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying]);

    // Stop animation: show only latest frame
    useEffect(() => {
        if (!isPlaying && layersRef.current.length > 0) {
            layersRef.current.forEach((layer, index) => {
                if (index === layersRef.current.length - 1) {
                    layer.setOpacity(0.6); // Show last frame (most recent)
                } else {
                    layer.setOpacity(0);
                }
            });
            currentIndexRef.current = layersRef.current.length - 1;
        }
    }, [isPlaying]);

    if (isLoading) {
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                zIndex: 1000,
                fontSize: '0.9rem'
            }}>
                Loading radar frames...
            </div>
        );
    }

    return null;
};

export default RadarAnimation;
