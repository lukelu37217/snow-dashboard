/**
 * Synthetic Zone Generator
 * 
 * Creates "Bubble Zones" for client addresses that fall outside
 * standard GeoJSON neighborhood boundaries.
 * 
 * Features:
 * - Generates circular polygon geometries (500m radius)
 * - Creates unique IDs for synthetic zones
 * - Provides weather data mapping for orphan addresses
 */

import { CLIENT_PROPERTIES, type ClientProperty } from '../config/clientProperties';

// Radius in degrees (approximately 500m at Winnipeg's latitude)
// 1 degree latitude ≈ 111km, so 500m ≈ 0.0045 degrees
const BUBBLE_RADIUS_DEG = 0.0045;
const CIRCLE_POINTS = 32; // Points to create circle polygon

export interface SyntheticZone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    properties: ClientProperty[];
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
}

/**
 * Generate a circular polygon geometry around a point
 */
const generateCirclePolygon = (lat: number, lng: number, radiusDeg: number = BUBBLE_RADIUS_DEG): number[][][] => {
    const coords: number[][] = [];
    
    for (let i = 0; i <= CIRCLE_POINTS; i++) {
        const angle = (i / CIRCLE_POINTS) * 2 * Math.PI;
        const circleLng = lng + radiusDeg * Math.cos(angle);
        const circleLat = lat + radiusDeg * Math.sin(angle);
        coords.push([circleLng, circleLat]); // GeoJSON uses [lng, lat] order
    }
    
    return [coords]; // Outer ring only
};

/**
 * Check if a point falls within any of the provided GeoJSON features
 */
const isPointInAnyPolygon = (lat: number, lng: number, features: any[]): boolean => {
    for (const feature of features) {
        if (pointInFeature(lat, lng, feature)) {
            return true;
        }
    }
    return false;
};

/**
 * Point-in-polygon check for a single feature
 */
const pointInFeature = (lat: number, lng: number, feature: any): boolean => {
    if (!feature?.geometry) return false;
    
    const geometry = feature.geometry;
    
    if (geometry.type === 'Polygon') {
        return isPointInRing(lng, lat, geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
        for (const poly of geometry.coordinates) {
            if (isPointInRing(lng, lat, poly[0])) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Ray casting algorithm for point-in-polygon
 */
const isPointInRing = (x: number, y: number, ring: number[][]): boolean => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

/**
 * Extract street name from address for synthetic zone naming
 */
const extractStreetName = (address: string): string => {
    // Remove house number and common suffixes
    const parts = address.replace(/^\d+\s+/, '').split(/\s+/);
    const streetParts = parts.filter(p => 
        !['st', 'st.', 'ave', 'ave.', 'blvd', 'blvd.', 'dr', 'dr.', 'cres', 'cres.', 'lane', 'close', 'bay', 'way', 'road', 'rd'].includes(p.toLowerCase())
    );
    return streetParts.slice(0, 2).join(' ') || parts[0] || 'Remote';
};

/**
 * Find all orphan properties (those not in any existing polygon)
 */
export const findOrphanProperties = (geoJsonFeatures: any[]): ClientProperty[] => {
    return CLIENT_PROPERTIES.filter(prop => 
        !isPointInAnyPolygon(prop.lat, prop.lng, geoJsonFeatures)
    );
};

/**
 * Generate synthetic zones for orphan properties
 * Groups nearby orphans into single bubbles
 */
export const generateSyntheticZones = (geoJsonFeatures: any[]): SyntheticZone[] => {
    const orphans = findOrphanProperties(geoJsonFeatures);
    
    if (orphans.length === 0) {
        console.log('📍 No orphan properties found - all addresses are within standard zones');
        return [];
    }
    
    console.log(`🔵 Found ${orphans.length} orphan properties outside city boundaries`);
    
    // Group orphans by proximity (within 1km of each other)
    const grouped: Map<string, ClientProperty[]> = new Map();
    const assigned = new Set<string>();
    
    for (const prop of orphans) {
        if (assigned.has(prop.id)) continue;
        
        // Find all orphans within ~1km of this one
        const nearby = orphans.filter(other => {
            if (assigned.has(other.id)) return false;
            const dist = Math.sqrt(
                Math.pow((prop.lat - other.lat) * 111, 2) + 
                Math.pow((prop.lng - other.lng) * 85, 2) // Adjusted for latitude
            );
            return dist < 1; // Within 1km
        });
        
        // Create group key based on street name
        const streetName = extractStreetName(prop.address);
        const groupKey = `bubble_${streetName.replace(/\s+/g, '_').toLowerCase()}_${grouped.size + 1}`;
        
        grouped.set(groupKey, nearby);
        nearby.forEach(p => assigned.add(p.id));
    }
    
    // Generate synthetic zones from groups
    const syntheticZones: SyntheticZone[] = [];
    
    grouped.forEach((props, key) => {
        // Calculate centroid of the group
        const avgLat = props.reduce((sum, p) => sum + p.lat, 0) / props.length;
        const avgLng = props.reduce((sum, p) => sum + p.lng, 0) / props.length;
        
        // Generate zone name from primary street
        const primaryStreet = extractStreetName(props[0].address);
        const zoneName = `${primaryStreet} Area`;
        
        syntheticZones.push({
            id: key,
            name: zoneName,
            lat: avgLat,
            lng: avgLng,
            properties: props,
            geometry: {
                type: 'Polygon',
                coordinates: generateCirclePolygon(avgLat, avgLng)
            }
        });
        
        console.log(`🔵 Created synthetic zone: "${zoneName}" with ${props.length} properties`);
    });
    
    return syntheticZones;
};

/**
 * Convert synthetic zones to GeoJSON features for map rendering
 */
export const syntheticZonesToGeoJSON = (zones: SyntheticZone[]): any[] => {
    return zones.map(zone => ({
        type: 'Feature',
        properties: {
            id: zone.id,
            name: zone.name,
            isSynthetic: true,
            propertyCount: zone.properties.length
        },
        geometry: zone.geometry
    }));
};

/**
 * Get all orphan property coordinates for weather API calls
 */
export const getOrphanCoordinates = (geoJsonFeatures: any[]): Array<{ id: string; lat: number; lon: number }> => {
    const orphans = findOrphanProperties(geoJsonFeatures);
    
    // Group by proximity and return centroids
    const syntheticZones = generateSyntheticZones(geoJsonFeatures);
    
    return syntheticZones.map(zone => ({
        id: zone.id,
        lat: zone.lat,
        lon: zone.lng
    }));
};
