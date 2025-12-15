/**
 * Client Properties Configuration
 * 
 * Hardcoded list of client addresses with their zone mappings and coordinates.
 * Coordinates are geocoded or approximated to zone centers.
 * 
 * Last Updated: December 2024
 */

export interface ClientProperty {
    id: string;
    address: string;
    zone: string;
    lat: number;
    lng: number;
    type: 'residential' | 'commercial';
}

/**
 * All client service addresses with geocoded coordinates
 * Coordinates are approximate based on Winnipeg street locations
 */
export const CLIENT_PROPERTIES: ClientProperty[] = [
    // === CHARLESWOOD / RIDGEWOOD AREA ===
    { id: 'prop-001', address: '110 Ridgedale Cres', zone: 'Ridgewood South', lat: 49.8542, lng: -97.2845, type: 'residential' },
    { id: 'prop-002', address: '181 Ridgedale Cres', zone: 'Ridgewood South', lat: 49.8548, lng: -97.2853, type: 'residential' },
    { id: 'prop-003', address: '220 Ridgedale Cres', zone: 'Ridgewood South', lat: 49.8555, lng: -97.2861, type: 'residential' },
    { id: 'prop-004', address: '175 Ridgedale Cres', zone: 'Ridgewood South', lat: 49.8545, lng: -97.2850, type: 'residential' },
    { id: 'prop-005', address: '14 Southdown Lane', zone: 'Ridgewood South', lat: 49.8530, lng: -97.2875, type: 'residential' },
    { id: 'prop-006', address: '369 Wescana St', zone: 'Ridgewood South', lat: 49.8560, lng: -97.2890, type: 'residential' },
    { id: 'prop-007', address: '106 Wescana St', zone: 'Ridgewood South', lat: 49.8565, lng: -97.2885, type: 'residential' },
    
    // === MARLTON ===
    { id: 'prop-008', address: '424 Hosmer Blvd', zone: 'Marlton', lat: 49.8485, lng: -97.2720, type: 'residential' },
    { id: 'prop-009', address: '52 Southwick Close', zone: 'Marlton', lat: 49.8478, lng: -97.2735, type: 'residential' },
    { id: 'prop-010', address: '53 Litchfield Blvd', zone: 'Marlton', lat: 49.8470, lng: -97.2742, type: 'residential' },
    { id: 'prop-011', address: '1 Kerslake Drive', zone: 'Marlton', lat: 49.8465, lng: -97.2755, type: 'residential' },
    { id: 'prop-012', address: '109 Carberry Cres', zone: 'Marlton', lat: 49.8490, lng: -97.2765, type: 'residential' },
    
    // === ERIC COY ===
    { id: 'prop-013', address: '355 Dodds Road', zone: 'Eric Coy', lat: 49.8420, lng: -97.2680, type: 'residential' },
    { id: 'prop-014', address: '1096 Green Oaks Lane', zone: 'Eric Coy', lat: 49.8405, lng: -97.2695, type: 'residential' },
    { id: 'prop-015', address: '22 Matlock Crescent', zone: 'Eric Coy', lat: 49.8412, lng: -97.2672, type: 'residential' },
    { id: 'prop-016', address: '26 Orchard Park Boulevard', zone: 'Eric Coy', lat: 49.8398, lng: -97.2660, type: 'residential' },
    { id: 'prop-017', address: '31 Hermitage Road', zone: 'Eric Coy', lat: 49.8385, lng: -97.2648, type: 'residential' },
    { id: 'prop-018', address: '6 Hermitage Road', zone: 'Eric Coy', lat: 49.8388, lng: -97.2652, type: 'residential' },
    { id: 'prop-019', address: '70 Ascot Bay', zone: 'Eric Coy', lat: 49.8375, lng: -97.2665, type: 'residential' },
    { id: 'prop-020', address: '3 Glenacres Crescent', zone: 'Eric Coy', lat: 49.8368, lng: -97.2678, type: 'residential' },
    { id: 'prop-021', address: '5 Livingston Way', zone: 'Eric Coy', lat: 49.8355, lng: -97.2690, type: 'residential' },
    
    // === VARSITY VIEW ===
    { id: 'prop-022', address: '4515 Roblin Blvd', zone: 'Varsity View', lat: 49.8650, lng: -97.2520, type: 'residential' },
    
    // === HEADINGLEY SOUTH (RM of Headingley - South of Assiniboine River) ===
    // Covers: Roblin Blvd, Ridgedale area, Breezy Bend - all west of Perimeter
    { id: 'prop-023', address: '7830 Roblin Blvd', zone: 'Headingley South', lat: 49.8680, lng: -97.3850, type: 'residential' },
    { id: 'prop-024', address: '8565 Roblin Blvd', zone: 'Headingley South', lat: 49.8690, lng: -97.4020, type: 'residential' },
    { id: 'prop-025', address: '6945 Roblin Blvd', zone: 'Headingley South', lat: 49.8660, lng: -97.3580, type: 'residential' },
    { id: 'prop-026', address: '5392 Portage Avenue', zone: 'Headingley South', lat: 49.8720, lng: -97.3200, type: 'commercial' },
    
    // === DEER LODGE ===
    { id: 'prop-027', address: '300 Sharp Blvd', zone: 'Deer Lodge', lat: 49.8880, lng: -97.2380, type: 'residential' },
    { id: 'prop-028', address: '2 Augusta Drive', zone: 'Deer Lodge', lat: 49.8895, lng: -97.2395, type: 'residential' },
    
    // === ST. JAMES / COMMERCIAL ===
    { id: 'prop-029', address: '466 Ainslie Street', zone: 'Bruce Park', lat: 49.8920, lng: -97.2150, type: 'residential' },
    { id: 'prop-030', address: '487 King Edward St', zone: 'King Edward', lat: 49.8945, lng: -97.2280, type: 'commercial' },
    { id: 'prop-031', address: '830 King Edward', zone: 'King Edward', lat: 49.8960, lng: -97.2295, type: 'commercial' },
    { id: 'prop-032', address: '1369 Border St', zone: 'St. James Industrial', lat: 49.9020, lng: -97.1950, type: 'commercial' },
    { id: 'prop-033', address: '1835 Sargent Avenue', zone: 'Airport', lat: 49.8865, lng: -97.2085, type: 'commercial' },
    { id: 'prop-034', address: '1695 Ellice Avenue', zone: 'Airport', lat: 49.8850, lng: -97.2065, type: 'commercial' },
    { id: 'prop-035', address: '2070 Logan Ave', zone: 'Brooklands', lat: 49.9085, lng: -97.1820, type: 'commercial' },
    { id: 'prop-036', address: '2150 Logan Ave', zone: 'Brooklands', lat: 49.9090, lng: -97.1835, type: 'commercial' },
    { id: 'prop-037', address: '1535 Burrows Ave', zone: 'Shaughnessy Park', lat: 49.9150, lng: -97.1680, type: 'commercial' },
    { id: 'prop-038', address: '1438 Church Ave', zone: 'Inkster', lat: 49.9180, lng: -97.1550, type: 'commercial' },
    { id: 'prop-039', address: '1255 Leila Ave', zone: 'Garden City', lat: 49.9320, lng: -97.1420, type: 'commercial' },
    { id: 'prop-040', address: '1265 Leila Ave', zone: 'Garden City', lat: 49.9325, lng: -97.1425, type: 'commercial' },
    
    // === TUXEDO / RIVER HEIGHTS ===
    { id: 'prop-041', address: '75 Charlesglen Drive', zone: 'South Tuxedo', lat: 49.8380, lng: -97.2150, type: 'residential' },
    { id: 'prop-042', address: '95 Charlesglen Drive', zone: 'South Tuxedo', lat: 49.8385, lng: -97.2155, type: 'residential' },
    { id: 'prop-043', address: '57 Curry Dr', zone: 'South Tuxedo', lat: 49.8365, lng: -97.2120, type: 'residential' },
    { id: 'prop-044', address: '60 Eagle Drive', zone: 'South Tuxedo', lat: 49.8350, lng: -97.2105, type: 'residential' },
    { id: 'prop-045', address: '710 Park Boulevard S', zone: 'Tuxedo', lat: 49.8520, lng: -97.2050, type: 'residential' },
    { id: 'prop-046', address: '201 Dromore Avenue', zone: 'Crescentwood', lat: 49.8680, lng: -97.1680, type: 'residential' },
    { id: 'prop-047', address: '300 Stafford Street', zone: 'Crescentwood', lat: 49.8695, lng: -97.1695, type: 'residential' },
    { id: 'prop-048', address: '516 Rodney St', zone: 'Crescentwood', lat: 49.8710, lng: -97.1720, type: 'residential' },
    { id: 'prop-049', address: '700 Kenaston Blvd', zone: 'River Heights', lat: 49.8580, lng: -97.1920, type: 'commercial' },
    
    // === SOUTH ===
    { id: 'prop-050', address: '95 Scurfield Blvd', zone: 'Whyte Ridge', lat: 49.8120, lng: -97.2350, type: 'residential' },
    { id: 'prop-051', address: '308 Deer Point Drive', zone: 'Pointe West', lat: 49.8090, lng: -97.2295, type: 'residential' },
    { id: 'prop-052', address: '330 Risbey Crescent', zone: 'Crestview', lat: 49.8920, lng: -97.2520, type: 'residential' },
    { id: 'prop-053', address: '183 Seekings St', zone: 'Headingley North', lat: 49.8880, lng: -97.3450, type: 'residential' },
    { id: 'prop-054', address: '29 Kemper', zone: 'Westwood', lat: 49.8780, lng: -97.2680, type: 'residential' },
    
    // === HEADINGLEY AREA (West of Perimeter - Roblin Blvd Corridor) ===
    // These fall within the new Headingley South administrative boundary
    { id: 'prop-055', address: '278 Deer Pointe Drive', zone: 'Headingley South', lat: 49.8620, lng: -97.3650, type: 'residential' },
    { id: 'prop-056', address: '48 Deer Pointe Drive', zone: 'Headingley South', lat: 49.8615, lng: -97.3640, type: 'residential' },
];

/**
 * Get all properties for a specific zone
 */
export const getPropertiesByZone = (zoneName: string): ClientProperty[] => {
    return CLIENT_PROPERTIES.filter(p => p.zone === zoneName);
};

/**
 * Get all unique zones from client properties
 */
export const getClientZones = (): string[] => {
    const zones = new Set(CLIENT_PROPERTIES.map(p => p.zone));
    return Array.from(zones);
};

/**
 * Group properties by zone
 */
export const getPropertiesGroupedByZone = (): Map<string, ClientProperty[]> => {
    const grouped = new Map<string, ClientProperty[]>();
    CLIENT_PROPERTIES.forEach(prop => {
        const existing = grouped.get(prop.zone) || [];
        existing.push(prop);
        grouped.set(prop.zone, existing);
    });
    return grouped;
};

/**
 * Get property by ID
 */
export const getPropertyById = (id: string): ClientProperty | undefined => {
    return CLIENT_PROPERTIES.find(p => p.id === id);
};
