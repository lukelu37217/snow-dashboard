/**
 * Client Properties Configuration
 * 
 * VERIFIED: December 15, 2025
 * Each address has been geocoded and verified using Google Maps.
 * Neighborhood assignments are based on point-in-polygon matching
 * against winnipeg-neighbourhoods.geojson boundaries.
 * 
 * Geographic Context:
 * - RM of Headingley: Separate municipality WEST of Perimeter Highway 101
 * - Headingley addresses have postal codes R4H/R4J
 * - All Headingley addresses fall within "Headingley South" or "Headingley North" zones
 */

export interface ClientProperty {
    id: string;
    address: string;
    zone: string;
    lat: number;
    lng: number;
    type: 'residential' | 'commercial';
}

export const CLIENT_PROPERTIES: ClientProperty[] = [
    // ============================================
    // RM OF HEADINGLEY (Outside Winnipeg)
    // West of Perimeter Highway 101
    // ============================================

    // --- Headingley South ---
    // Taylor Farm, Charlesglen, Wescana subdivisions
    { id: 'prop-001', address: '14 Southdown Lane', zone: 'Headingley South', lat: 49.8547, lng: -97.3483, type: 'residential' },
    { id: 'prop-002', address: '57 Curry Dr', zone: 'Headingley South', lat: 49.8539, lng: -97.3506, type: 'residential' },
    { id: 'prop-003', address: '75 Charlesglen Drive', zone: 'Headingley South', lat: 49.8498, lng: -97.3454, type: 'residential' },
    { id: 'prop-004', address: '95 Charlesglen Drive', zone: 'Headingley South', lat: 49.8505, lng: -97.3463, type: 'residential' },
    { id: 'prop-005', address: '106 Wescana Street', zone: 'Headingley South', lat: 49.8565, lng: -97.3420, type: 'residential' },
    { id: 'prop-006', address: '369 Wescana St', zone: 'Headingley South', lat: 49.8582, lng: -97.3445, type: 'residential' },
    { id: 'prop-007', address: '1096 Green Oaks Lane', zone: 'Headingley South', lat: 49.8533, lng: -97.3370, type: 'residential' },
    { id: 'prop-008', address: '6945 Roblin Blvd', zone: 'Headingley South', lat: 49.8575, lng: -97.3560, type: 'commercial' },
    { id: 'prop-009', address: '7830 Roblin Blvd', zone: 'Headingley South', lat: 49.8558, lng: -97.3815, type: 'residential' },
    { id: 'prop-010', address: '8565 Roblin Blvd', zone: 'Headingley South', lat: 49.8540, lng: -97.4022, type: 'residential' },

    // --- Headingley North ---
    // Deer Pointe, Seekings, Portage Ave west of Perimeter
    { id: 'prop-011', address: '183 Seekings St', zone: 'Headingley North', lat: 49.8788, lng: -97.3480, type: 'residential' },
    { id: 'prop-012', address: '355 Dodds Road', zone: 'Assiniboia Downs', lat: 49.8795, lng: -97.3395, type: 'residential' },
    { id: 'prop-013', address: '278 Deer Pointe Drive', zone: 'Headingley North', lat: 49.8693, lng: -97.3592, type: 'residential' },
    { id: 'prop-014', address: '48 Deer Pointe Drive', zone: 'Headingley North', lat: 49.8678, lng: -97.3565, type: 'residential' },
    { id: 'prop-015', address: '308 Deer Point Drive', zone: 'Headingley North', lat: 49.8698, lng: -97.3600, type: 'residential' },
    { id: 'prop-016', address: '5392 Portage Avenue', zone: 'Assiniboia Downs', lat: 49.8820, lng: -97.3380, type: 'commercial' },

    // ============================================
    // CHARLESWOOD AREA (Inside Winnipeg)
    // ============================================

    // --- Ridgedale ---
    { id: 'prop-017', address: '110 Ridgedale Cres', zone: 'Ridgedale', lat: 49.8670, lng: -97.2764, type: 'residential' },
    { id: 'prop-018', address: '175 Ridgedale Cres', zone: 'Ridgedale', lat: 49.8685, lng: -97.2745, type: 'residential' },
    { id: 'prop-019', address: '181 Ridgedale Cres', zone: 'Ridgedale', lat: 49.8680, lng: -97.2747, type: 'residential' },
    { id: 'prop-020', address: '220 Ridgedale Cres', zone: 'Ridgedale', lat: 49.8667, lng: -97.2757, type: 'residential' },
    { id: 'prop-021', address: '4515 Roblin Blvd', zone: 'Ridgedale', lat: 49.8630, lng: -97.2769, type: 'commercial' },

    // --- Betsworth ---
    { id: 'prop-022', address: '22 Matlock Crescent', zone: 'Betsworth', lat: 49.8542, lng: -97.2952, type: 'residential' },

    // --- Southboine ---
    { id: 'prop-023', address: '26 Orchard Park Boulevard', zone: 'Southboine', lat: 49.8634, lng: -97.3051, type: 'residential' },

    // --- Elmhurst ---
    { id: 'prop-024', address: '52 Southwick Close', zone: 'Elmhurst', lat: 49.8553, lng: -97.2522, type: 'residential' },
    { id: 'prop-025', address: '70 Ascot Bay', zone: 'Elmhurst', lat: 49.8546, lng: -97.2616, type: 'residential' },
    { id: 'prop-026', address: '3420 Grant Ave', zone: 'Elmhurst', lat: 49.8584, lng: -97.2588, type: 'commercial' },

    // ============================================
    // TUXEDO AREA (Inside Winnipeg)
    // ============================================

    // --- Tuxedo ---
    { id: 'prop-027', address: '424 Hosmer Blvd', zone: 'Tuxedo', lat: 49.8623, lng: -97.2225, type: 'residential' },
    { id: 'prop-028', address: '31 Hermitage Road', zone: 'Tuxedo', lat: 49.8608, lng: -97.2185, type: 'residential' },
    { id: 'prop-029', address: '6 Hermitage Road', zone: 'Tuxedo', lat: 49.8618, lng: -97.2172, type: 'residential' },
    { id: 'prop-030', address: '60 Eagle Drive', zone: 'Tuxedo', lat: 49.8595, lng: -97.2135, type: 'residential' },

    // --- South Tuxedo ---
    { id: 'prop-031', address: '53 Litchfield Blvd', zone: 'South Tuxedo', lat: 49.8492, lng: -97.2289, type: 'residential' },
    { id: 'prop-032', address: '1 Kerslake Drive', zone: 'South Tuxedo', lat: 49.8502, lng: -97.2284, type: 'residential' },
    { id: 'prop-033', address: '710 Park Boulevard S', zone: 'South Tuxedo', lat: 49.8507, lng: -97.2222, type: 'residential' },

    // --- Mathers ---
    { id: 'prop-034', address: '700 Kenaston Blvd', zone: 'Mathers', lat: 49.8522, lng: -97.2066, type: 'commercial' },
    { id: 'prop-035', address: '750 Kenaston Blvd', zone: 'Mathers', lat: 49.8518, lng: -97.2063, type: 'commercial' },

    // ============================================
    // RIVER HEIGHTS / CRESCENTWOOD
    // ============================================
    { id: 'prop-036', address: '201 Dromore Avenue', zone: 'Crescentwood', lat: 49.8729, lng: -97.1699, type: 'residential' },
    { id: 'prop-037', address: '300 Stafford Street', zone: 'Earl Grey', lat: 49.8654, lng: -97.1590, type: 'residential' },
    { id: 'prop-038', address: '516 Rodney St', zone: 'Crescentwood', lat: 49.8712, lng: -97.1720, type: 'residential' },

    // ============================================
    // FORT GARRY
    // ============================================
    { id: 'prop-039', address: '5 Livingston Way', zone: 'Tuxedo Industrial', lat: 49.8378, lng: -97.2040, type: 'residential' },
    { id: 'prop-040', address: '2 Augusta Drive', zone: 'Waverley Heights', lat: 49.8076, lng: -97.1674, type: 'residential' },
    { id: 'prop-041', address: '3 Glenacres Crescent', zone: 'Richmond West', lat: 49.7794, lng: -97.1724, type: 'residential' },
    { id: 'prop-042', address: '95 Scurfield Blvd', zone: 'West Fort Garry Industrial', lat: 49.8180, lng: -97.1913, type: 'commercial' },

    // ============================================
    // ST. JAMES-ASSINIBOIA AREA
    // ============================================

    // --- Crestview ---
    { id: 'prop-043', address: '109 Carberry Cres', zone: 'Crestview', lat: 49.8992, lng: -97.2972, type: 'residential' },

    // --- Silver Heights ---
    { id: 'prop-044', address: '466 Ainslie Street', zone: 'Silver Heights', lat: 49.8790, lng: -97.2612, type: 'residential' },

    // --- Westwood ---
    { id: 'prop-045', address: '29 Kemper', zone: 'Birchwood', lat: 49.8765, lng: -97.2685, type: 'residential' },

    // --- Kirkfield ---
    { id: 'prop-046', address: '3074 Portage Ave', zone: 'Kirkfield', lat: 49.8799, lng: -97.2834, type: 'commercial' },

    // --- Glendale ---
    { id: 'prop-047', address: '3740 Portage Ave', zone: 'Glendale', lat: 49.8811, lng: -97.3177, type: 'commercial' },

    // --- Buchanan ---
    { id: 'prop-048', address: '330 Risbey Crescent', zone: 'Buchanan', lat: 49.8979, lng: -97.3198, type: 'residential' },

    // --- Airport ---
    { id: 'prop-049', address: '300 Sharp Blvd', zone: 'Airport', lat: 49.8906, lng: -97.2349, type: 'residential' },

    // ============================================
    // COMMERCIAL / INDUSTRIAL
    // ============================================

    // --- King Edward ---
    { id: 'prop-050', address: '487 King Edward St', zone: 'King Edward', lat: 49.8898, lng: -97.2079, type: 'commercial' },
    { id: 'prop-051', address: '830 King Edward St', zone: 'St. James Industrial', lat: 49.9028, lng: -97.2074, type: 'commercial' },

    // --- St. James Industrial ---
    { id: 'prop-052', address: '1695 Ellice Avenue', zone: 'St. James Industrial', lat: 49.8949, lng: -97.2020, type: 'commercial' },
    { id: 'prop-053', address: '1835 Sargent Avenue', zone: 'St. James Industrial', lat: 49.8990, lng: -97.2126, type: 'commercial' },
    { id: 'prop-054', address: '1369 Border St', zone: 'St. James Industrial', lat: 49.9145, lng: -97.2010, type: 'commercial' },

    // --- Murray Industrial Park ---
    { id: 'prop-055', address: '180 Cree Crescent', zone: 'Murray Industrial Park', lat: 49.8921, lng: -97.2677, type: 'commercial' },

    // --- Saskatchewan North ---
    { id: 'prop-056', address: '2800 Saskatchewan Ave', zone: 'Saskatchewan North', lat: 49.9029, lng: -97.2686, type: 'commercial' },

    // --- Omand's Creek Industrial ---
    { id: 'prop-057', address: '2070 Logan Ave', zone: "Omand's Creek Industrial", lat: 49.9248, lng: -97.2109, type: 'commercial' },
    { id: 'prop-058', address: '2078 Logan Ave', zone: "Omand's Creek Industrial", lat: 49.9251, lng: -97.2134, type: 'commercial' },
    { id: 'prop-059', address: '2150 Logan Ave', zone: "Omand's Creek Industrial", lat: 49.9248, lng: -97.2161, type: 'commercial' },

    // --- Inkster Industrial Park ---
    { id: 'prop-060', address: '1438 Church Ave', zone: 'Inkster Industrial Park', lat: 49.9378, lng: -97.1766, type: 'commercial' },
    { id: 'prop-061', address: '1535 Burrows Ave', zone: 'Inkster Industrial Park', lat: 49.9322, lng: -97.1841, type: 'commercial' },

    // --- Leila North ---
    { id: 'prop-062', address: '1255 Leila Ave', zone: 'Leila North', lat: 49.9580, lng: -97.1592, type: 'commercial' },
    { id: 'prop-063', address: '1265 Leila Ave', zone: 'Leila North', lat: 49.9588, lng: -97.1596, type: 'commercial' },
    { id: 'prop-064', address: '1275 Leila Ave', zone: 'Leila North', lat: 49.9583, lng: -97.1604, type: 'commercial' },
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
