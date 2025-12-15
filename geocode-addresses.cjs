/**
 * Address Geocoding and Neighborhood Assignment Script
 * 
 * This script:
 * 1. Geocodes addresses using OpenStreetMap Nominatim API (free, no key required)
 * 2. Uses point-in-polygon to find which GeoJSON neighborhood they belong to
 * 3. Generates corrected clientProperties.ts with accurate zone mappings
 * 
 * Usage: node geocode-addresses.cjs
 */

const fs = require('fs');
const path = require('path');

// All addresses to geocode (from user's list)
const ADDRESSES = [
    { address: '110 Ridgedale Cres', type: 'residential' },
    { address: '14 Southdown Lane', type: 'residential' },
    { address: '181 Ridgedale Cres', type: 'residential' },
    { address: '183 Seekings St', type: 'residential' },
    { address: '369 Wescana St', type: 'residential' },
    { address: '424 Hosmer Blvd', type: 'residential' },
    { address: '4515 Roblin Blvd', type: 'commercial' },
    { address: '52 Southwick Close', type: 'residential' },
    { address: '53 Litchfield Blvd', type: 'residential' },
    { address: '7830 Roblin Blvd', type: 'residential' },
    { address: '8565 Roblin Blvd', type: 'residential' },
    { address: '220 Ridgedale Cres', type: 'residential' },
    { address: '466 Ainslie Street', type: 'residential' },
    { address: '106 Wescana Street', type: 'residential' },
    { address: '487 King Edward St', type: 'commercial' },
    { address: '57 Curry Dr', type: 'residential' },
    { address: '75 Charlesglen Drive', type: 'residential' },
    { address: '60 Eagle Drive', type: 'residential' },
    { address: '2 Augusta Drive', type: 'residential' },
    { address: '355 Dodds Road', type: 'residential' },
    { address: '1096 Green Oaks Lane', type: 'residential' },
    { address: '278 Deer Pointe Drive', type: 'residential' },
    { address: '330 Risbey Crescent', type: 'residential' },
    { address: '48 Deer Pointe Drive', type: 'residential' },
    { address: '22 Matlock Crescent', type: 'residential' },
    { address: '1 Kerslake Drive', type: 'residential' },
    { address: '109 Carberry Cres', type: 'residential' },
    { address: '175 Ridgedale Cres', type: 'residential' },
    { address: '26 Orchard Park Boulevard', type: 'residential' },
    { address: '300 Sharp Blvd', type: 'residential' },
    { address: '308 Deer Point Drive', type: 'residential' },
    { address: '31 Hermitage Road', type: 'residential' },
    { address: '5 Livingston Way', type: 'residential' },
    { address: '6 Hermitage Road', type: 'residential' },
    { address: '70 Ascot Bay', type: 'residential' },
    { address: '710 Park Boulevard S', type: 'residential' },
    { address: '95 Charlesglen Drive', type: 'residential' },
    { address: '29 Kemper', type: 'residential' },
    { address: '3 Glenacres Crescent', type: 'residential' },
    { address: '201 Dromore Avenue', type: 'residential' },
    { address: '516 Rodney St', type: 'residential' },
    { address: '300 Stafford Street', type: 'residential' },
    { address: '1695 Ellice Avenue', type: 'commercial' },
    { address: '1255 Leila Ave', type: 'commercial' },
    { address: '1265 Leila Ave', type: 'commercial' },
    { address: '1275 Leila Ave', type: 'commercial' },
    { address: '1835 Sargent Avenue', type: 'commercial' },
    { address: '700 Kenaston Blvd', type: 'commercial' },
    { address: '750 Kenaston Blvd', type: 'commercial' },
    { address: '5392 Portage Avenue', type: 'commercial' },
    { address: '180 Cree Crescent', type: 'commercial' },
    { address: '3074 Portage Ave', type: 'commercial' },
    { address: '3420 Grant Ave', type: 'commercial' },
    { address: '1438 Church Ave', type: 'commercial' },
    { address: '2070 Logan Ave', type: 'commercial' },
    { address: '2078 Logan Ave', type: 'commercial' },
    { address: '2150 Logan Ave', type: 'commercial' },
    { address: '1369 Border St', type: 'commercial' },
    { address: '830 King Edward St', type: 'commercial' },
    { address: '1535 Burrows Ave', type: 'commercial' },
    { address: '6945 Roblin Blvd', type: 'commercial' },
    { address: '3740 Portage Ave', type: 'commercial' },
    { address: '2800 Saskatchewan Ave', type: 'commercial' },
    { address: '95 Scurfield Blvd', type: 'commercial' },
];

// Load GeoJSON neighborhoods
const geoJsonPath = path.join(__dirname, 'public', 'winnipeg-neighbourhoods.geojson');
const geoData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

/**
 * Ray-casting algorithm for point-in-polygon test
 */
function isPointInPolygon(lat, lng, polygon) {
    // polygon is array of [lng, lat] pairs (GeoJSON format)
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > lat) !== (yj > lat))
            && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Find which neighborhood a point belongs to
 */
function findNeighborhood(lat, lng) {
    for (const feature of geoData.features) {
        const geometry = feature.geometry;
        const name = feature.properties.name;
        
        if (geometry.type === 'Polygon') {
            if (isPointInPolygon(lat, lng, geometry.coordinates[0])) {
                return name;
            }
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                if (isPointInPolygon(lat, lng, polygon[0])) {
                    return name;
                }
            }
        }
    }
    return null; // Not in any neighborhood
}

/**
 * Geocode an address using OpenStreetMap Nominatim API (free, no key required)
 */
async function geocodeAddress(address) {
    // Add Winnipeg/Headingley context for better results
    const searchAddress = address.includes('Headingley') || address.includes('Roblin') 
        ? `${address}, Manitoba, Canada`
        : `${address}, Winnipeg, Manitoba, Canada`;
    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json&limit=1&countrycodes=ca`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SnowDashboard/1.0 (address geocoding for service zones)'
            }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                formattedAddress: data[0].display_name
            };
        } else {
            console.error(`  No results for ${address}`);
            return null;
        }
    } catch (error) {
        console.error(`Error geocoding ${address}:`, error.message);
        return null;
    }
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
    console.log('🌍 Starting address geocoding and neighborhood assignment...\n');
    console.log(`📍 Total addresses to process: ${ADDRESSES.length}`);
    console.log(`🗺️ Total neighborhoods in GeoJSON: ${geoData.features.length}\n`);
    
    const results = [];
    let orphanCount = 0;
    
    for (let i = 0; i < ADDRESSES.length; i++) {
        const item = ADDRESSES[i];
        console.log(`[${i + 1}/${ADDRESSES.length}] Geocoding: ${item.address}...`);
        
        const geo = await geocodeAddress(item.address);
        
        if (geo) {
            const neighborhood = findNeighborhood(geo.lat, geo.lng);
            
            if (neighborhood) {
                console.log(`  ✅ ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)} → ${neighborhood}`);
            } else {
                console.log(`  ⚠️ ${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)} → NOT IN ANY NEIGHBORHOOD (orphan)`);
                orphanCount++;
            }
            
            results.push({
                id: `prop-${String(i + 1).padStart(3, '0')}`,
                address: item.address,
                zone: neighborhood || 'ORPHAN',
                lat: geo.lat,
                lng: geo.lng,
                type: item.type,
                formattedAddress: geo.formattedAddress
            });
        } else {
            console.log(`  ❌ Failed to geocode`);
            results.push({
                id: `prop-${String(i + 1).padStart(3, '0')}`,
                address: item.address,
                zone: 'GEOCODE_FAILED',
                lat: 0,
                lng: 0,
                type: item.type,
                formattedAddress: null
            });
        }
        
        // Rate limit: Nominatim requires 1 second between requests
        await sleep(1100);
    }
    
    // Generate the TypeScript file
    console.log('\n📝 Generating clientProperties.ts...\n');
    
    const tsContent = generateTypeScript(results);
    const outputPath = path.join(__dirname, 'src', 'config', 'clientProperties.ts');
    fs.writeFileSync(outputPath, tsContent);
    
    console.log(`✅ Generated ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total addresses: ${results.length}`);
    console.log(`   In neighborhoods: ${results.filter(r => r.zone !== 'ORPHAN' && r.zone !== 'GEOCODE_FAILED').length}`);
    console.log(`   Orphans: ${orphanCount}`);
    console.log(`   Failed geocoding: ${results.filter(r => r.zone === 'GEOCODE_FAILED').length}`);
    
    // Also output JSON for reference
    const jsonPath = path.join(__dirname, 'geocoded-addresses.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Also saved raw data to ${jsonPath}`);
}

/**
 * Generate TypeScript file content
 */
function generateTypeScript(results) {
    // Group by zone for organized output
    const grouped = {};
    for (const r of results) {
        if (!grouped[r.zone]) grouped[r.zone] = [];
        grouped[r.zone].push(r);
    }
    
    // Sort zones alphabetically
    const zones = Object.keys(grouped).sort();
    
    let entries = '';
    let propIndex = 1;
    
    for (const zone of zones) {
        entries += `\n    // === ${zone.toUpperCase()} ===\n`;
        for (const prop of grouped[zone]) {
            entries += `    { id: 'prop-${String(propIndex++).padStart(3, '0')}', address: '${prop.address}', zone: '${prop.zone}', lat: ${prop.lat.toFixed(6)}, lng: ${prop.lng.toFixed(6)}, type: '${prop.type}' },\n`;
        }
    }
    
    return `/**
 * Client Properties Configuration
 * 
 * AUTO-GENERATED by geocode-addresses.cjs on ${new Date().toISOString()}
 * 
 * Each address has been geocoded using Google Maps API and assigned to
 * its correct neighborhood using point-in-polygon matching against
 * the winnipeg-neighbourhoods.geojson boundaries.
 */

export interface ClientProperty {
    id: string;
    address: string;
    zone: string;
    lat: number;
    lng: number;
    type: 'residential' | 'commercial';
}

export const CLIENT_PROPERTIES: ClientProperty[] = [${entries}];

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
`;
}

// Run the script
main().catch(console.error);
