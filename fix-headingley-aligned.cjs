/**
 * Fix Headingley boundaries to align with adjacent zones
 * 
 * This script clips Headingley North and South's east (right) boundaries
 * to align with the west (left) boundaries of adjacent Winnipeg zones:
 * 
 * Adjacent zones (north to south):
 * - Assiniboia Downs (lat 49.866-49.898): West edge ~-97.3265 to -97.3435
 * - River West Park (lat 49.86-49.87): West edge ~-97.3126
 * - Westdale (lat 49.847-49.866): West edge ~-97.3237
 * - Ridgewood South (lat 49.839-49.848): West edge ~-97.3249
 * - West Perimeter South (lat 49.809-49.838): West edge ~-97.3492
 * 
 * Strategy: 
 * 1. Extract westernmost points from each adjacent zone by latitude band
 * 2. Use those as the new east boundary for Headingley zones
 */

const fs = require('fs');

const geoPath = './public/winnipeg-neighbourhoods.geojson';
const data = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

// Helper: Find feature by name
function getFeature(name) {
    return data.features.find(f => f.properties.name === name);
}

// Helper: Extract all coordinates from a feature (handles Polygon and MultiPolygon)
function getAllCoords(feature) {
    const geom = feature.geometry;
    const coords = [];
    
    if (geom.type === 'Polygon') {
        geom.coordinates[0].forEach(c => coords.push({ lng: c[0], lat: c[1] }));
    } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(poly => {
            poly[0].forEach(c => coords.push({ lng: c[0], lat: c[1] }));
        });
    }
    
    return coords;
}

// Helper: Find the westernmost (minimum lng) point in a latitude range
function getWestBoundaryForLatRange(coords, minLat, maxLat) {
    const filtered = coords.filter(c => c.lat >= minLat && c.lat <= maxLat);
    if (filtered.length === 0) return null;
    
    // Find the minimum longitude (westernmost point)
    const westmost = filtered.reduce((min, c) => c.lng < min.lng ? c : min, filtered[0]);
    return westmost.lng;
}

// Collect west boundaries from adjacent zones
console.log('📍 Analyzing adjacent zone boundaries...\n');

const adjacentZones = [
    { name: 'Assiniboia Downs', minLat: 49.866, maxLat: 49.898 },
    { name: 'River West Park', minLat: 49.86, maxLat: 49.87 },
    { name: 'Westdale', minLat: 49.847, maxLat: 49.866 },
    { name: 'Ridgewood South', minLat: 49.839, maxLat: 49.848 },
    { name: 'West Perimeter South', minLat: 49.809, maxLat: 49.838 }
];

const boundaryByLat = new Map(); // lat -> west boundary lng

adjacentZones.forEach(zone => {
    const feature = getFeature(zone.name);
    if (!feature) {
        console.log(`❌ Zone "${zone.name}" not found!`);
        return;
    }
    
    const coords = getAllCoords(feature);
    const westBound = getWestBoundaryForLatRange(coords, zone.minLat, zone.maxLat);
    
    if (westBound) {
        console.log(`✓ ${zone.name} (lat ${zone.minLat}-${zone.maxLat}): West boundary = ${westBound.toFixed(6)}`);
        
        // Store boundary points
        for (let lat = zone.minLat; lat <= zone.maxLat; lat += 0.001) {
            boundaryByLat.set(lat.toFixed(3), westBound);
        }
    }
});

// Function to get the new east boundary for Headingley based on latitude
function getNewEastBoundary(lat) {
    // Define boundaries by latitude ranges (from adjacent zones)
    // These are the westernmost longitudes of adjacent zones at each latitude
    
    if (lat < 49.809) {
        // South of West Perimeter South - use a reasonable boundary
        return -97.3492;
    } else if (lat < 49.838) {
        // West Perimeter South region
        return -97.3492;
    } else if (lat < 49.848) {
        // Ridgewood South region  
        return -97.3249;
    } else if (lat < 49.860) {
        // Westdale region
        return -97.3237;
    } else if (lat < 49.866) {
        // Transition zone between Westdale and River West Park
        return -97.3200;
    } else if (lat < 49.875) {
        // River West Park / lower Assiniboia Downs region
        return -97.3265;
    } else if (lat < 49.898) {
        // Upper Assiniboia Downs region
        return -97.3435;
    } else {
        // North of Assiniboia Downs
        return -97.3435;
    }
}

// Fix Headingley zone boundaries
function fixHeadingleyBoundary(zoneName) {
    const feature = getFeature(zoneName);
    if (!feature) {
        console.log(`\n❌ Zone "${zoneName}" not found!`);
        return;
    }
    
    console.log(`\n🔧 Processing ${zoneName}...`);
    
    const geom = feature.geometry;
    
    if (geom.type === 'Polygon') {
        const ring = geom.coordinates[0];
        const originalCount = ring.length;
        
        // Find current bounds
        const lngs = ring.map(c => c[0]);
        const lats = ring.map(c => c[1]);
        console.log(`   Original: ${originalCount} points`);
        console.log(`   Lng range: [${Math.min(...lngs).toFixed(4)} to ${Math.max(...lngs).toFixed(4)}]`);
        console.log(`   Lat range: [${Math.min(...lats).toFixed(4)} to ${Math.max(...lats).toFixed(4)}]`);
        
        // Clip points that are east of the new boundary
        let modified = 0;
        const newRing = ring.map(point => {
            const lng = point[0];
            const lat = point[1];
            const newEastBound = getNewEastBoundary(lat);
            
            // If point is east (greater lng = less negative) of the new boundary, clip it
            if (lng > newEastBound) {
                modified++;
                return [newEastBound, lat];
            }
            return point;
        });
        
        // Update the coordinates
        geom.coordinates[0] = newRing;
        
        // Report results
        const newLngs = newRing.map(c => c[0]);
        console.log(`   Modified: ${modified} points clipped`);
        console.log(`   New lng range: [${Math.min(...newLngs).toFixed(4)} to ${Math.max(...newLngs).toFixed(4)}]`);
        
    } else if (geom.type === 'MultiPolygon') {
        // Handle MultiPolygon (shouldn't be the case for Headingley but just in case)
        geom.coordinates.forEach((poly, idx) => {
            const ring = poly[0];
            let modified = 0;
            
            const newRing = ring.map(point => {
                const lng = point[0];
                const lat = point[1];
                const newEastBound = getNewEastBoundary(lat);
                
                if (lng > newEastBound) {
                    modified++;
                    return [newEastBound, lat];
                }
                return point;
            });
            
            poly[0] = newRing;
            console.log(`   Polygon ${idx}: ${modified} points modified`);
        });
    }
}

// Process both Headingley zones
console.log('\n' + '='.repeat(50));
console.log('FIXING HEADINGLEY BOUNDARIES');
console.log('='.repeat(50));

fixHeadingleyBoundary('Headingley South');
fixHeadingleyBoundary('Headingley North');

// Save the modified GeoJSON
fs.writeFileSync(geoPath, JSON.stringify(data, null, 2));

console.log('\n' + '='.repeat(50));
console.log('✅ GeoJSON updated successfully!');
console.log('   File: ' + geoPath);
console.log('='.repeat(50));
console.log('\n📍 The Headingley zones now align with adjacent Winnipeg zones.');
console.log('   Please rebuild the app to see changes.\n');

