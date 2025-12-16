/**
 * Fix Headingley boundaries to align with adjacent zones
 * 
 * Strategy: Clip the right side of Headingley North and South to match
 * the left boundaries of adjacent zones:
 * 
 * For Headingley North (lat 49.865 - 49.927):
 * - Use Assiniboia Downs left boundary (-97.3435) for lat 49.866-49.899
 * - Use Buchanan left boundary (-97.3263) for lat 49.88-49.90
 * 
 * For Headingley South (lat 49.806 - 49.865):
 * - Use West Perimeter South left boundary (-97.3492) for lat 49.809-49.838
 * - Use Ridgewood South left boundary (-97.3253) for lat 49.839-49.848
 * - Use Westdale left boundary (-97.3259) for lat 49.847-49.866
 */

const fs = require('fs');

const geoPath = './public/winnipeg-neighbourhoods.geojson';
const data = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

// Define the new right boundary for Headingley based on latitude
function getNewRightBoundary(lat) {
    // From south to north:
    if (lat < 49.838) {
        // West Perimeter South region
        return -97.349;
    } else if (lat < 49.848) {
        // Ridgewood South region
        return -97.325;
    } else if (lat < 49.866) {
        // Westdale / River West Park region
        return -97.326;
    } else if (lat < 49.900) {
        // Assiniboia Downs region - this is the key overlap area
        return -97.344;
    } else {
        // North of Assiniboia Downs
        return -97.326;
    }
}

function fixHeadingleyBoundary(zoneName) {
    const feature = data.features.find(f => f.properties.name === zoneName);
    if (!feature) {
        console.log(`Zone ${zoneName} not found!`);
        return;
    }
    
    const coords = feature.geometry.coordinates[0];
    const isMultiRing = Array.isArray(coords[0][0]);
    const ring = isMultiRing ? coords[0] : coords;
    
    console.log(`\nProcessing ${zoneName}:`);
    console.log(`  Original points: ${ring.length}`);
    
    // Find which points are on the right (east) side and need adjustment
    let modified = 0;
    const newRing = ring.map(point => {
        const lng = point[0];
        const lat = point[1];
        const newRightBound = getNewRightBoundary(lat);
        
        // If point is east of the new boundary, clip it
        if (lng > newRightBound) {
            modified++;
            return [newRightBound, lat];
        }
        return point;
    });
    
    console.log(`  Points modified: ${modified}`);
    
    // Update the coordinates
    if (isMultiRing) {
        feature.geometry.coordinates[0] = newRing;
    } else {
        feature.geometry.coordinates[0] = newRing;
    }
    
    // Verify new bounds
    const newLngs = newRing.map(c => c[0]);
    console.log(`  New lng range: [${Math.min(...newLngs).toFixed(4)} - ${Math.max(...newLngs).toFixed(4)}]`);
}

// Fix both Headingley zones
fixHeadingleyBoundary('Headingley South');
fixHeadingleyBoundary('Headingley North');

// Save the modified GeoJSON
fs.writeFileSync(geoPath, JSON.stringify(data, null, 2));
console.log('\n✅ GeoJSON updated successfully!');
console.log('   File: ' + geoPath);
