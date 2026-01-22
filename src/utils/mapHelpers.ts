/**
 * Map Interaction Helpers
 *
 * Utilities for smooth map interactions and animations
 */

import type { Map as LeafletMap } from 'leaflet';
import type { ClientProperty } from '../config/clientProperties';

/**
 * Fly to property with smooth animation
 */
export const flyToProperty = (
  map: LeafletMap | null,
  property: ClientProperty,
  options?: {
    zoom?: number;
    duration?: number; // seconds
    easeLinearity?: number;
  }
) => {
  if (!map) return;

  const defaultOptions = {
    zoom: 16,
    duration: 1.2,
    easeLinearity: 0.15 // Smoother easing
  };

  const flyOptions = { ...defaultOptions, ...options };

  map.flyTo(
    [property.lat, property.lon],
    flyOptions.zoom,
    {
      animate: true,
      duration: flyOptions.duration,
      easeLinearity: flyOptions.easeLinearity
    }
  );
};

/**
 * Fly to zone with bounds animation
 */
export const flyToZone = (
  map: LeafletMap | null,
  feature: any,
  options?: {
    padding?: [number, number];
    maxZoom?: number;
    duration?: number;
  }
) => {
  if (!map || !feature) return;

  const defaultOptions = {
    padding: [50, 50] as [number, number],
    maxZoom: 15,
    duration: 1.2
  };

  const flyOptions = { ...defaultOptions, ...options };

  // Extract bounds from feature geometry
  const bounds = getBoundsFromFeature(feature);
  if (!bounds) return;

  map.flyToBounds(bounds, {
    padding: flyOptions.padding,
    maxZoom: flyOptions.maxZoom,
    animate: true,
    duration: flyOptions.duration
  });
};

/**
 * Get bounds from GeoJSON feature
 */
const getBoundsFromFeature = (feature: any): [[number, number], [number, number]] | null => {
  if (!feature || !feature.geometry) return null;

  const coords = feature.geometry.coordinates;
  if (!coords || coords.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  // Handle different geometry types
  const flattenCoords = (c: any[]): void => {
    if (typeof c[0] === 'number') {
      // This is a coordinate pair [lon, lat]
      const [lon, lat] = c;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    } else {
      // Nested array, recurse
      c.forEach(flattenCoords);
    }
  };

  flattenCoords(coords);

  if (minLat === Infinity) return null;

  return [
    [minLat, minLon],
    [maxLat, maxLon]
  ];
};

/**
 * Smooth zoom with animation
 */
export const smoothZoom = (
  map: LeafletMap | null,
  zoomLevel: number,
  options?: {
    duration?: number;
  }
) => {
  if (!map) return;

  const duration = options?.duration ?? 0.8;

  map.setZoom(zoomLevel, {
    animate: true,
    duration
  });
};

/**
 * Reset map view to initial position
 */
export const resetMapView = (
  map: LeafletMap | null,
  initialCenter: [number, number],
  initialZoom: number
) => {
  if (!map) return;

  map.flyTo(initialCenter, initialZoom, {
    animate: true,
    duration: 1.0
  });
};

/**
 * Pulse animation for marker (using CSS)
 */
export const createPulseMarkerStyle = (color: string) => `
  @keyframes marker-pulse {
    0% {
      box-shadow: 0 0 0 0 ${color}80;
    }
    50% {
      box-shadow: 0 0 0 10px ${color}00;
    }
    100% {
      box-shadow: 0 0 0 0 ${color}00;
    }
  }

  .marker-pulse {
    animation: marker-pulse 1.5s ease-out infinite;
  }
`;

/**
 * Calculate appropriate zoom level based on distance
 */
export const calculateZoomLevel = (distance: number): number => {
  // distance in km
  if (distance < 0.5) return 17;  // Very close - street level
  if (distance < 1) return 16;    // Close - neighborhood
  if (distance < 2) return 15;    // Medium - area
  if (distance < 5) return 14;    // Far - district
  return 13;                       // Very far - city level
};

/**
 * Get distance between two points (Haversine formula)
 */
export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Batch property navigation (for route planning)
 */
export const flyThroughProperties = async (
  map: LeafletMap | null,
  properties: ClientProperty[],
  options?: {
    durationPerProperty?: number;
    zoom?: number;
  }
) => {
  if (!map || properties.length === 0) return;

  const duration = options?.durationPerProperty ?? 2;
  const zoom = options?.zoom ?? 16;

  for (const property of properties) {
    await new Promise<void>((resolve) => {
      flyToProperty(map, property, { zoom, duration });
      // Wait for animation to complete
      setTimeout(resolve, duration * 1000);
    });
  }
};
