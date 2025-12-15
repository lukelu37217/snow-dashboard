/**
 * Western Sector Configuration
 * 
 * Defines the "Active Operational Area" - the Red Box region
 * covering Western/South-Western Winnipeg where we operate.
 * 
 * All zones within this bounding box should be:
 * 1. Fetching weather data
 * 2. Clickable on the map
 * 3. Showing weather popup when clicked
 * 
 * This enables checking weather for neighboring zones (potential clients)
 * even if we don't have a contract there yet.
 * 
 * Last Updated: December 2024
 */

/**
 * Western Sector Bounding Box (The "Red Box")
 * Covers: Charleswood, St. James, Tuxedo, Headingley, Airport, etc.
 * 
 * Format: [South Lat, West Lng, North Lat, East Lng]
 */
export const WESTERN_SECTOR_BOUNDS = {
    south: 49.78,   // Southern boundary (below Whyte Ridge)
    west: -97.45,   // Western boundary (past Headingley)
    north: 49.95,   // Northern boundary (above Airport/Garden City)
    east: -97.10    // Eastern boundary (just past downtown)
};

/**
 * Check if a point (lat, lng) falls within the Western Sector
 */
export const isInWesternSector = (lat: number, lng: number): boolean => {
    return (
        lat >= WESTERN_SECTOR_BOUNDS.south &&
        lat <= WESTERN_SECTOR_BOUNDS.north &&
        lng >= WESTERN_SECTOR_BOUNDS.west &&
        lng <= WESTERN_SECTOR_BOUNDS.east
    );
};

/**
 * Check if a GeoJSON feature's centroid falls within the Western Sector
 */
export const isFeatureInWesternSector = (feature: any): boolean => {
    if (!feature?.geometry) return false;
    
    // Calculate centroid of the feature
    const geometry = feature.geometry;
    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;
    
    const processCoords = (coords: number[][]) => {
        coords.forEach(([lng, lat]) => {
            totalLat += lat;
            totalLng += lng;
            pointCount++;
        });
    };
    
    if (geometry.type === 'Polygon') {
        processCoords(geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((poly: number[][][]) => {
            processCoords(poly[0]);
        });
    }
    
    if (pointCount === 0) return false;
    
    const centroidLat = totalLat / pointCount;
    const centroidLng = totalLng / pointCount;
    
    return isInWesternSector(centroidLat, centroidLng);
};

/**
 * Named zones that should ALWAYS be included in the Western Sector
 * even if their centroid calculation is slightly off.
 * These are neighborhoods we explicitly want to monitor.
 */
export const WESTERN_SECTOR_ZONES: string[] = [
    // === CHARLESWOOD CLUSTER ===
    'Charleswood',
    'Ridgedale',
    'Ridgewood South',
    'Varsity View',
    'Westdale',
    'Eric Coy',
    'Assiniboine Park',
    'Marlton',
    'Linden Woods',
    'Linden Ridge',
    
    // === HEADINGLEY / FAR WEST ===
    'Headingley South',
    'Headingley North',
    'Deer Lodge',
    
    // === ST. JAMES / AIRPORT ===
    'St. James Industrial',
    'King Edward',
    'Airport',
    'Polo Park',
    'Sturgeon Creek',
    'Silver Heights',
    'Kirkfield',
    'Buchanan',
    'Heritage Park',
    'Booth',
    'Murray Industrial Park',
    'Crestview',
    'Westwood',
    
    // === TUXEDO / RIVER HEIGHTS ===
    'South Tuxedo',
    'Tuxedo',
    'River Heights',
    'Crescentwood',
    'Riverview',
    'Mathers',
    
    // === SOUTH ===
    'Whyte Ridge',
    'Pointe West',
    'Fort Richmond',
    'University of Manitoba',
    'Southdale',
    'Island Lakes',
    'Dakota Crossing',
    'Waverley Heights',
    'Waverley West A',
    'Waverley West B',
    'Richmond West',
    'Richmond Lakes',
    
    // === CENTRAL WEST ===
    'Bruce Park',
    'Shaughnessy Park',
    'Inkster',
    'Garden City',
    'Weston',
    'Brooklands',
    'West End',
    'Wolseley',
    'Sargent Park',
    
    // === NORTH WEST ===
    'The Maples',
    'Amber Trails',
    'Leila-McPhillips Triangle',
    'Meadows West',
    'Garden Grove',
];

/**
 * Check if a zone name is in the Western Sector
 */
export const isZoneInWesternSector = (zoneName: string): boolean => {
    return WESTERN_SECTOR_ZONES.includes(zoneName);
};

/**
 * Comprehensive check: Is this feature in our operational area?
 * Uses both name matching AND bounding box check
 */
export const isInOperationalArea = (feature: any): boolean => {
    const name = feature?.properties?.name;
    
    // First check by name (explicit list)
    if (name && isZoneInWesternSector(name)) {
        return true;
    }
    
    // Then check by bounding box (catches zones we might have missed)
    return isFeatureInWesternSector(feature);
};
