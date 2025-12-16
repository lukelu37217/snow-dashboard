/**
 * Client Properties Configuration
 * 
 * UPDATED: December 16, 2025
 * Coordinates verified and corrected based on actual geocoding
 * Zones assigned based on coordinate location
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
    // HEADINGLEY (RM of Headingley - West of Perimeter)
    // Longitude roughly -97.40 to -97.45
    // ============================================

    // --- Headingley South (South of Assiniboine River) ---
    { id: 'prop-001', address: '14 Southdown Lane', zone: 'Headingley South', lat: 49.87177487266534, lng: -97.4018032035914, type: 'residential' },
    { id: 'prop-002', address: '57 Curry Dr', zone: 'Headingley South', lat: 49.87044886328594, lng: -97.40051615700852, type: 'residential' },
    { id: 'prop-006', address: '106 Wescana Street', zone: 'Headingley South', lat: 49.86322576935866, lng: -97.42297086440497, type: 'residential' },
    { id: 'prop-007', address: '369 Wescana St', zone: 'Headingley South', lat: 49.85460146288351, lng: -97.42485441099554, type: 'residential' },
    { id: 'prop-015', address: '8565 Roblin Blvd', zone: 'Headingley South', lat: 49.87006640782997, lng: -97.41872739564242, type: 'residential' },
    { id: 'prop-020', address: '29 Kemper', zone: 'Headingley South', lat: 49.864731315608864, lng: -97.41333446496336, type: 'residential' },
    { id: 'prop-021', address: '516 Rodney St', zone: 'Headingley South', lat: 49.85245167155481, lng: -97.4143304570221, type: 'residential' },

    // --- Headingley North (North of Assiniboine River / Portage corridor) ---
    { id: 'prop-008', address: '183 Seekings St', zone: 'Headingley North', lat: 49.863390052197204, lng: -97.41954194167224, type: 'residential' },
    { id: 'prop-016', address: '5392 Portage Avenue', zone: 'Headingley North', lat: 49.87594259596184, lng: -97.40478276256991, type: 'commercial' },
    { id: 'prop-012', address: '355 Dodds Road', zone: 'Headingley North', lat: 49.88943181815845, lng: -97.40587142631128, type: 'residential' },

    // ============================================
    // CHARLESWOOD WEST / ROBLIN CORRIDOR
    // Longitude roughly -97.33 to -97.40
    // ============================================

    { id: 'prop-014', address: '7830 Roblin Blvd', zone: 'Westdale', lat: 49.86287100125357, lng: -97.38380761838052, type: 'residential' },
    { id: 'prop-063', address: '2 Augusta Drive', zone: 'Westdale', lat: 49.86244617649917, lng: -97.37499549564798, type: 'residential' },
    { id: 'prop-003', address: '75 Charlesglen Drive', zone: 'Ridgewood South', lat: 49.86701604111262, lng: -97.36873816496166, type: 'residential' },
    { id: 'prop-004', address: '95 Charlesglen Drive', zone: 'Ridgewood South', lat: 49.865820249511145, lng: -97.36930573427944, type: 'residential' },
    { id: 'prop-009', address: '278 Deer Pointe Drive', zone: 'Ridgewood South', lat: 49.85133972006804, lng: -97.36786770304754, type: 'residential' },
    { id: 'prop-010', address: '48 Deer Pointe Drive', zone: 'Ridgewood South', lat: 49.86038561936129, lng: -97.3661665036002, type: 'residential' },
    { id: 'prop-011', address: '308 Deer Point Drive', zone: 'Ridgewood South', lat: 49.85038398696967, lng: -97.36634840304824, type: 'residential' },
    { id: 'prop-019', address: '5 Livingston Way', zone: 'Ridgewood South', lat: 49.85575125956081, lng: -97.36509039565324, type: 'residential' },
    { id: 'prop-005', address: '1096 Green Oaks Lane', zone: 'River West Park', lat: 49.87207736106371, lng: -97.35309092632414, type: 'residential' },
    { id: 'prop-018', address: '6 Hermitage Road', zone: 'River West Park', lat: 49.865566661931695, lng: -97.35357251837861, type: 'residential' },
    { id: 'prop-017', address: '31 Hermitage Road', zone: 'River West Park', lat: 49.86842957244926, lng: -97.34930936440125, type: 'residential' },
    { id: 'prop-013', address: '6945 Roblin Blvd', zone: 'River West Park', lat: 49.86430786322172, lng: -97.33781879558374, type: 'commercial' },

    // ============================================
    // CHARLESWOOD / ST. JAMES WEST
    // Longitude roughly -97.27 to -97.33
    // ============================================

    // --- Crestview ---
    { id: 'prop-026', address: '330 Risbey Crescent', zone: 'Crestview', lat: 49.89846161035256, lng: -97.31972681096275, type: 'residential' },
    { id: 'prop-047', address: '3740 Portage Ave', zone: 'Glendale', lat: 49.88117567499309, lng: -97.31782151280139, type: 'commercial' },
    { id: 'prop-029', address: '26 Orchard Park Boulevard', zone: 'Southboine', lat: 49.8639464539021, lng: -97.30495899564696, type: 'residential' },
    { id: 'prop-043', address: '109 Carberry Cres', zone: 'Crestview', lat: 49.89968852176382, lng: -97.29751753369452, type: 'residential' },
    { id: 'prop-027', address: '22 Matlock Crescent', zone: 'Betsworth', lat: 49.85488553533031, lng: -97.29516932633706, type: 'residential' },
    { id: 'prop-046', address: '3074 Portage Ave', zone: 'Kirkfield', lat: 49.88054439039715, lng: -97.28281174221861, type: 'commercial' },

    // --- Ridgedale (Charleswood) ---
    { id: 'prop-022', address: '110 Ridgedale Cres', zone: 'Ridgedale', lat: 49.86767385989989, lng: -97.27653155701066, type: 'residential' },
    { id: 'prop-030', address: '4515 Roblin Blvd', zone: 'Ridgedale', lat: 49.86362657718845, lng: -97.27672986496401, type: 'commercial' },
    { id: 'prop-025', address: '220 Ridgedale Cres', zone: 'Ridgedale', lat: 49.8671232099475, lng: -97.27539133427804, type: 'residential' },
    { id: 'prop-024', address: '181 Ridgedale Cres', zone: 'Ridgedale', lat: 49.86857346466772, lng: -97.2748268876931, type: 'residential' },
    { id: 'prop-023', address: '175 Ridgedale Cres', zone: 'Ridgedale', lat: 49.86934849856342, lng: -97.27434946495977, type: 'residential' },

    // ============================================
    // ST. JAMES / SILVER HEIGHTS
    // Longitude roughly -97.23 to -97.27
    // ============================================

    { id: 'prop-048', address: '2800 Saskatchewan Ave', zone: 'Saskatchewan North', lat: 49.90278500353594, lng: -97.26872974260903, type: 'commercial' },
    { id: 'prop-049', address: '180 Cree Crescent', zone: 'Murray Industrial Park', lat: 49.89277752386836, lng: -97.26760648028389, type: 'commercial' },
    { id: 'prop-036', address: '70 Ascot Bay', zone: 'South Tuxedo', lat: 49.85524849229993, lng: -97.26170207236154, type: 'residential' },
    { id: 'prop-041', address: '466 Ainslie Street', zone: 'Silver Heights', lat: 49.8855418217374, lng: -97.26110537233872, type: 'residential' },
    { id: 'prop-031', address: '3420 Grant Ave', zone: 'Elmhurst', lat: 49.85897867439599, lng: -97.25865935701711, type: 'commercial' },
    { id: 'prop-028', address: '52 Southwick Close', zone: 'Elmhurst', lat: 49.85606491777647, lng: -97.25245553372736, type: 'residential' },
    { id: 'prop-042', address: '300 Sharp Blvd', zone: 'Deer Lodge', lat: 49.881253311806915, lng: -97.23856281836674, type: 'residential' },

    // ============================================
    // TUXEDO / RIVER HEIGHTS
    // Longitude roughly -97.15 to -97.23
    // ============================================

    { id: 'prop-053', address: '60 Eagle Drive', zone: 'Airport', lat: 49.93420509315428, lng: -97.22352135814053, type: 'residential' },
    { id: 'prop-032', address: '424 Hosmer Blvd', zone: 'Tuxedo', lat: 49.862774602246965, lng: -97.22236518030621, type: 'residential' },
    { id: 'prop-035', address: '710 Park Boulevard S', zone: 'South Tuxedo', lat: 49.851379116480395, lng: -97.22217864168131, type: 'residential' },
    { id: 'prop-034', address: '53 Litchfield Blvd', zone: 'South Tuxedo', lat: 49.849930709074265, lng: -97.22878709565754, type: 'residential' },
    { id: 'prop-033', address: '1 Kerslake Drive', zone: 'South Tuxedo', lat: 49.85056850000272, lng: -97.22796280360724, type: 'residential' },
    { id: 'prop-044', address: '1835 Sargent Avenue', zone: 'St. James Industrial', lat: 49.8988984924067, lng: -97.21263609325311, type: 'commercial' },
    { id: 'prop-059', address: '2070 Logan Ave', zone: "Omand's Creek Industrial", lat: 49.92563941094686, lng: -97.21308834957594, type: 'commercial' },
    { id: 'prop-060', address: '2078 Logan Ave', zone: "Omand's Creek Industrial", lat: 49.92563941094686, lng: -97.21321709560071, type: 'commercial' },
    { id: 'prop-061', address: '2150 Logan Ave', zone: "Omand's Creek Industrial", lat: 49.92552398341687, lng: -97.21629338765057, type: 'commercial' },
    { id: 'prop-037', address: '700-750 Kenaston Blvd', zone: 'Mathers', lat: 49.852270769691046, lng: -97.20618251099721, type: 'commercial' },
    { id: 'prop-051', address: '830 King Edward St', zone: 'St. James Industrial', lat: 49.90284839102069, lng: -97.20796939424511, type: 'commercial' },
    { id: 'prop-052', address: '487 King Edward St', zone: 'King Edward', lat: 49.89065349716643, lng: -97.20774446494397, type: 'commercial' },
    { id: 'prop-045', address: '1695 Ellice Avenue', zone: 'St. James Industrial', lat: 49.89579535448896, lng: -97.20175246494013, type: 'commercial' },
    { id: 'prop-050', address: '1369 Border St', zone: 'St. James Industrial', lat: 49.914657549096276, lng: -97.20114500428821, type: 'commercial' },
    { id: 'prop-062', address: '95 Scurfield Blvd', zone: 'West Fort Garry Industrial', lat: 49.8180279678352, lng: -97.19125372574545, type: 'commercial' },

    // ============================================
    // NORTH END / INKSTER
    // ============================================

    { id: 'prop-057', address: '1535 Burrows Ave', zone: 'Inkster Industrial Park', lat: 49.932272655122084, lng: -97.18408121119553, type: 'commercial' },
    { id: 'prop-058', address: '1438 Church Ave', zone: 'Inkster Industrial Park', lat: 49.93774747341098, lng: -97.17661150185482, type: 'commercial' },
    { id: 'prop-064', address: '3 Glenacres Crescent', zone: 'Richmond West', lat: 49.779894755764495, lng: -97.17264791844262, type: 'residential' },
    { id: 'prop-039', address: '201 Dromore Avenue', zone: 'Crescentwood', lat: 49.873501183159014, lng: -97.16992674166465, type: 'residential' },

    // ============================================
    // SEVEN OAKS / LEILA
    // ============================================

    { id: 'prop-054', address: '1255 Leila Ave', zone: 'Leila North', lat: 49.958485796231805, lng: -97.15924797228399, type: 'commercial' },
    { id: 'prop-055', address: '1265 Leila Ave', zone: 'Leila North', lat: 49.959142590207605, lng: -97.15941711886754, type: 'commercial' },
    { id: 'prop-056', address: '1275 Leila Ave', zone: 'Leila North', lat: 49.95882571178977, lng: -97.16033509557585, type: 'commercial' },
    { id: 'prop-040', address: '300 Stafford Street', zone: 'Earl Grey', lat: 49.866121868077194, lng: -97.15879406496225, type: 'residential' },
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
