/**
 * Service Zone Configuration
 * 
 * This file defines the neighborhoods where we have active clients.
 * Only these zones will be rendered on the map and receive weather API calls.
 * 
 * Benefits:
 * - Reduces API calls from ~240 to ~20 zones (prevents 429 rate limit errors)
 * - Faster map loading and rendering
 * - Dispatchers focus only on relevant service areas
 * 
 * Last Updated: December 2024
 */

// Client address to neighborhood mapping (for reference)
// Based on provided address list:
// 
// CHARLESWOOD CLUSTER:
// - Ridgedale Cres addresses → Ridgedale
// - Southdown Lane, Southwick Close → Ridgewood South  
// - Seekings St → Varsity View
// - Wescana St → Westdale
// - Hosmer Blvd → Eric Coy
// - Roblin Blvd (4515, 7830, 8565, 6945) → Charleswood / Assiniboine Park area
// - Litchfield Blvd, Charlesglen Dr → Charleswood
// - Eagle Drive, Augusta Drive → Charleswood area
// - Green Oaks Lane, Deer Pointe Dr → Linden Woods / Whyte Ridge
// - Risbey Crescent → Linden Woods
// - Matlock Crescent, Kerslake Drive → Charleswood
// - Carberry Cres → Westdale / Charleswood
// - Orchard Park Boulevard → Charleswood
// - Sharp Blvd, Livingston Way, Hermitage Road → Charleswood
// - Ascot Bay, Park Boulevard S → Charleswood / Westdale
// - Kemper → Charleswood
// - Glenacres Crescent → Charleswood
// 
// ST. JAMES / AIRPORT:
// - King Edward St → King Edward
// - Airport → Airport
// - Polo Park → Polo Park
// - Sturgeon Creek → Sturgeon Creek
// - Silver Heights → Silver Heights
// - Portage Ave (3074, 3420, 3740, 5392) → St. James Industrial / Westwood
// 
// TUXEDO / CENTRAL:
// - Dromore Avenue → Crescentwood
// - Rodney St → Wolseley / West Broadway
// - Stafford Street → River Heights
// - Ellice Avenue → Polo Park area
// - Kenaston → Tuxedo
// 
// NORTH/WEST COMMERCIAL:
// - Leila → Garden City / Leila-McPhillips Triangle
// - Sargent Avenue → Sargent Park / West Broadway
// - Cree Crescent → Crestview / St. James
// - Church → Central area
// - Logan → Logan-C.P.R.
// - Border St → Weston
// - Burrows → Burrows Central
// - Saskatchewan → Brooklands / Weston
// 
// PERIMETER/SOUTH:
// - Whyte Ridge → Whyte Ridge
// - Scurfield → Whyte Ridge / Linden Woods

/**
 * Whitelist of neighborhood names to render
 * These match the 'name' property in winnipeg-neighbourhoods.geojson
 * 
 * CLASSIFICATION: Kevin Moist Real Estate Style
 * Updated: December 15, 2025
 * 
 * Key distinction:
 * - Headingley: Premium standalone area (RM of Headingley)
 * - Winnipeg: All areas within city limits
 */
export const SERVICE_ZONE_WHITELIST: string[] = [
    // === HEADINGLEY (RM - Premium Standalone Area) ===
    'Headingley South', // Taylor Farm, Charlesglen, Wescana, South Headingley, Assiniboine Landing
    'Headingley North', // Deer Pointe, Seekings, Portage Ave west of Perimeter
    'West Perimeter South', // Fill gap between Headingley and Charleswood
    'Wilkes South',     // Fill gap south of Headingley
    
    // === CHARLESWOOD CLUSTER (Inside Winnipeg) ===
    'Ridgedale',        // Ridgedale Cres, 4515 Roblin
    'Betsworth',        // 330 Risbey Crescent, 22 Matlock Crescent
    'Southboine',       // 26 Orchard Park Boulevard
    'Elmhurst',         // 52 Southwick, 3420 Grant Ave
    'Roblin Park',      // Near Roblin Blvd inside Winnipeg
    
    // === TUXEDO AREA ===
    'Tuxedo',           // 424 Hosmer Blvd
    'South Tuxedo',     // Kerslake, Litchfield, Park Blvd S, Ascot Bay
    'Mathers',          // 700-750 Kenaston Blvd
    'Old Tuxedo',       // Historic Tuxedo
    
    // === RIVER HEIGHTS / CRESCENTWOOD ===
    'Crescentwood',     // 201 Dromore Avenue
    'Earl Grey',        // 300 Stafford Street
    'Wellington Crescent',
    'River Heights',
    
    // === ST. JAMES-ASSINIBOIA ===
    'Silver Heights',   // 466 Ainslie Street
    'Deer Lodge',       // 300 Sharp Blvd
    'Crestview',        // 109 Carberry Cres
    'Kirkfield',        // 3074 Portage Ave
    'Glendale',         // 3740 Portage Ave
    
    // === COMMERCIAL / INDUSTRIAL ===
    'King Edward',              // 487, 830 King Edward St
    'St. James Industrial',     // Ellice, Sargent, Border, Eagle Dr
    'Murray Industrial Park',   // 180 Cree Crescent
    'Saskatchewan North',       // 2800 Saskatchewan Ave
    "Omand's Creek Industrial", // Logan Ave
    'Inkster Industrial Park',  // Church, Burrows
    'Leila North',              // 1255-1275 Leila Ave
    
    // === SOUTH WINNIPEG ===
    'West Fort Garry Industrial', // 95 Scurfield
    'Whyte Ridge',
    'Waverley Heights',         // 2 Augusta Drive
    'Richmond West',            // 3 Glenacres Crescent
    
    // === ADDITIONAL COVERAGE (neighboring zones) ===
    'Assiniboia Downs',  // 355 Dodds Road, 5392 Portage Ave (edge of Headingley)
    'Sturgeon Creek',
    'Bruce Park',
    'Varsity View',
    'Polo Park',
    'Grant Park',
    'Garden City',
    'Brooklands',
    'Weston',
    'Airport',           // 300 Sharp Blvd, 60 Eagle Drive
];

/**
 * Check if a neighborhood should be rendered
 * @param name Neighborhood name from GeoJSON properties
 */
export const isServiceZone = (name: string): boolean => {
    return SERVICE_ZONE_WHITELIST.includes(name);
};

/**
 * Get count of service zones (for metrics)
 */
export const getServiceZoneCount = (): number => {
    return SERVICE_ZONE_WHITELIST.length;
};

/**
 * Client addresses for reference/documentation
 * Maps addresses to neighborhoods for dispatch planning
 */
export const CLIENT_ADDRESSES = [
    // Charleswood Cluster
    { address: '110 Ridgedale Cres.', zone: 'Ridgedale' },
    { address: '181 Ridgedale Cres.', zone: 'Ridgedale' },
    { address: '175 Ridgedale Cres.', zone: 'Ridgedale' },
    { address: '220 Ridgedale Cres.', zone: 'Ridgedale' },
    { address: '14 Southdown Lane.', zone: 'Ridgewood South' },
    { address: '52 Southwick Close', zone: 'Ridgewood South' },
    { address: '183 Seekings St.', zone: 'Varsity View' },
    { address: '369 Wescana St.', zone: 'Westdale' },
    { address: '106 Wescana Street', zone: 'Westdale' },
    { address: '424 Hosmer Blvd.', zone: 'Eric Coy' },
    { address: '4515 Roblin Blvd.', zone: 'Assiniboine Park' },
    { address: '7830 Roblin Blvd.', zone: 'Roblin Park' },
    { address: '8565 Roblin Blvd.', zone: 'Roblin Park' },
    { address: '6945 Roblin Blvd.', zone: 'Roblin Park' },
    { address: '53 Litchfield Blvd.', zone: 'Charleswood' },
    { address: '75 Charlesglen Drive', zone: 'Charleswood' },
    { address: '95 Charlesglen Drive', zone: 'Charleswood' },
    { address: '60 Eagle Drive', zone: 'Charleswood' },
    { address: '2 Augusta Drive', zone: 'Charleswood' },
    { address: '355 Dodds Road', zone: 'Charleswood' },
    { address: '1096 Green Oaks Lane', zone: 'Linden Woods' },
    { address: '278 Deer Pointe Drive', zone: 'Linden Woods' },
    { address: '308 Deer Point Drive', zone: 'Linden Woods' },
    { address: '48 Deer Pointe Drive', zone: 'Linden Woods' },
    { address: '330 Risbey Crescent', zone: 'Linden Woods' },
    { address: '22 Matlock Crescent', zone: 'Charleswood' },
    { address: '1 Kerslake Drive', zone: 'Charleswood' },
    { address: '109 Carberry Cres', zone: 'Westdale' },
    { address: '26 Orchard Park Boulevard', zone: 'Charleswood' },
    { address: '300 Sharp Blvd', zone: 'Charleswood' },
    { address: '31 Hermitage Road', zone: 'Charleswood' },
    { address: '6 Hermitage Road', zone: 'Charleswood' },
    { address: '5 Livingston Way', zone: 'Charleswood' },
    { address: '70 Ascot Bay', zone: 'Westdale' },
    { address: '710 Park Boulevard S.', zone: 'Westdale' },
    { address: '29 Kemper', zone: 'Charleswood' },
    { address: '3 Glenacres Crescent', zone: 'Charleswood' },
    
    // Central/Tuxedo Cluster
    { address: '466 Ainslie Street', zone: 'Crescentwood' },
    { address: '57 Curry Dr', zone: 'Linden Ridge' },
    { address: '201 Dromore Avenue', zone: 'Crescentwood' },
    { address: '516 Rodney St.', zone: 'Wolseley' },
    { address: '300 Stafford Street', zone: 'South River Heights' },
    { address: '700-750 Kenaston', zone: 'Tuxedo' },
    
    // St. James / Commercial
    { address: '487 King Edward St.', zone: 'King Edward' },
    { address: '830 King Edward', zone: 'King Edward' },
    { address: '1695 Ellice Avenue', zone: 'Polo Park' },
    { address: '180 Cree Crescent', zone: 'Crestview' },
    { address: '3074 Portage Ave', zone: 'Westwood' },
    { address: '3420 Grant Ave', zone: 'Grant Park' },
    { address: '3740 Portage Ave', zone: 'Westwood' },
    { address: '5392 Portage Avenue', zone: 'Westwood' },
    
    // North/West Commercial
    { address: '1255, 1265, 1275 Leila', zone: 'Leila-McPhillips Triangle' },
    { address: '1835 Sargent Avenue', zone: 'Sargent Park' },
    { address: '1438 Church', zone: 'Central area' },
    { address: '2070, 2078, 2150 Logan', zone: 'Logan-C.P.R.' },
    { address: '1369 Border St', zone: 'Weston' },
    { address: 'Selkirk and Perimeter', zone: 'North area' },
    { address: '1535 Burrows', zone: 'Burrows Central' },
    { address: '2800 Saskatchewan', zone: 'Brooklands' },
    
    // Whyte Ridge / South
    { address: '95 Scurfield', zone: 'Whyte Ridge' },
];
