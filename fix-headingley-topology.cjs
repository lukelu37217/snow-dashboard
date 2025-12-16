/**
 * Fix Headingley Topological Alignment using Turf.js
 * 
 * Strategy:
 * 1. Merge all neighbor zones (the "wall") into one polygon
 * 2. Expand Headingley slightly to the right (to cover any gaps)
 * 3. Use turf.difference to clip Headingley against the wall
 * 4. This ensures perfect edge alignment with no gaps or overlaps
 */

const fs = require('fs');
const turf = require('@turf/turf');

const geoPath = './public/winnipeg-neighbourhoods.geojson';
const data = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

// Neighbor zones that form the "wall" on Headingley's right side
const NEIGHBOR_ZONES = [
    'Assiniboia Downs',
    'River West Park', 
    'Buchanan',
    'Westdale',
    'Ridgewood South',
    'West Perimeter South',
    'Wilkes South',
    'Sturgeon Creek',
    'Crestview',
    'Southboine',
    'Betsworth'
];

function getFeatureByName(name) {
    return data.features.find(f => f.properties.name === name);
}

function createBufferedPolygon(feature, bufferKm = 0.5) {
    // Expand the polygon slightly to ensure overlap before clipping
    try {
        return turf.buffer(feature, bufferKm, { units: 'kilometers' });
    } catch (e) {
        console.log(`  Warning: Could not buffer ${feature.properties?.name}`);
        return feature;
    }
}

function fixHeadingleyZone(zoneName) {
    console.log(`\n=== Processing ${zoneName} ===`);
    
    const headingley = getFeatureByName(zoneName);
    if (!headingley) {
        console.log(`  ERROR: ${zoneName} not found!`);
        return;
    }
    
    // Get original bounds
    const bbox = turf.bbox(headingley);
    console.log(`  Original bbox: [${bbox.map(b => b.toFixed(4)).join(', ')}]`);
    
    // Collect all neighbor polygons that are relevant for this zone
    const relevantNeighbors = [];
    const headingleyBbox = turf.bbox(headingley);
    
    for (const neighborName of NEIGHBOR_ZONES) {
        const neighbor = getFeatureByName(neighborName);
        if (!neighbor) continue;
        
        // Check if this neighbor overlaps with or is adjacent to Headingley
        const neighborBbox = turf.bbox(neighbor);
        
        // Check latitude overlap (rough check)
        const latOverlap = !(neighborBbox[3] < headingleyBbox[1] || neighborBbox[1] > headingleyBbox[3]);
        
        // Check if neighbor is to the right of Headingley's left edge
        const isToTheRight = neighborBbox[0] > headingleyBbox[0] - 0.1;
        
        if (latOverlap && isToTheRight) {
            console.log(`  Including neighbor: ${neighborName}`);
            relevantNeighbors.push(neighbor);
        }
    }
    
    if (relevantNeighbors.length === 0) {
        console.log(`  No relevant neighbors found, skipping.`);
        return;
    }
    
    // Step 1: Merge all neighbors into one "wall" polygon
    console.log(`  Merging ${relevantNeighbors.length} neighbors into wall...`);
    let wall = relevantNeighbors[0];
    for (let i = 1; i < relevantNeighbors.length; i++) {
        try {
            const merged = turf.union(turf.featureCollection([wall, relevantNeighbors[i]]));
            if (merged) wall = merged;
        } catch (e) {
            console.log(`  Warning: Could not merge ${relevantNeighbors[i].properties?.name}`);
        }
    }
    
    // Step 2: Expand Headingley slightly to the right to ensure it covers gaps
    // We'll shift the right boundary points by a small amount
    console.log(`  Expanding Headingley rightward...`);
    const expandedHeadingley = createBufferedPolygon(headingley, 0.3);
    
    // Step 3: Use difference to clip
    console.log(`  Clipping Headingley against wall...`);
    try {
        const clipped = turf.difference(turf.featureCollection([expandedHeadingley, wall]));
        
        if (clipped) {
            // Update the feature in place
            const idx = data.features.findIndex(f => f.properties.name === zoneName);
            if (idx !== -1) {
                data.features[idx].geometry = clipped.geometry;
                console.log(`  ✅ Successfully clipped ${zoneName}`);
                
                // Verify new bounds
                const newBbox = turf.bbox(clipped);
                console.log(`  New bbox: [${newBbox.map(b => b.toFixed(4)).join(', ')}]`);
            }
        } else {
            console.log(`  ⚠️ Difference returned null for ${zoneName}`);
        }
    } catch (e) {
        console.log(`  ❌ Error clipping ${zoneName}: ${e.message}`);
    }
}

// Alternative approach: Direct vertex snapping
function snapHeadingleyVertices(zoneName) {
    console.log(`\n=== Vertex Snapping for ${zoneName} ===`);
    
    const headingley = getFeatureByName(zoneName);
    if (!headingley) return;
    
    // Collect all boundary points from neighbors
    const neighborBoundaryPoints = [];
    for (const neighborName of NEIGHBOR_ZONES) {
        const neighbor = getFeatureByName(neighborName);
        if (!neighbor) continue;
        
        const coords = neighbor.geometry.coordinates[0];
        const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
        
        // Get the leftmost (western) points of each neighbor
        ring.forEach(point => {
            neighborBoundaryPoints.push({ lng: point[0], lat: point[1], from: neighborName });
        });
    }
    
    // Sort by longitude to find the "wall" line
    const westPoints = neighborBoundaryPoints
        .filter(p => p.lng < -97.31) // Only points that could be on the wall
        .sort((a, b) => a.lat - b.lat);
    
    console.log(`  Found ${westPoints.length} potential snap points from neighbors`);
    
    // Now snap Headingley's right boundary to these points
    const coords = headingley.geometry.coordinates[0];
    const ring = Array.isArray(coords[0][0]) ? coords[0] : coords;
    
    let snapped = 0;
    const newRing = ring.map(point => {
        const lng = point[0];
        const lat = point[1];
        
        // Only modify points on the right side
        if (lng > -97.36) {
            // Find the closest neighbor point at similar latitude
            const nearby = westPoints.filter(p => Math.abs(p.lat - lat) < 0.005);
            if (nearby.length > 0) {
                // Snap to the westernmost nearby point
                const snapTo = nearby.reduce((a, b) => a.lng < b.lng ? a : b);
                snapped++;
                return [snapTo.lng, lat]; // Keep original latitude, use neighbor's longitude
            }
        }
        return point;
    });
    
    console.log(`  Snapped ${snapped} vertices`);
    
    // Update geometry
    const idx = data.features.findIndex(f => f.properties.name === zoneName);
    if (idx !== -1) {
        if (Array.isArray(headingley.geometry.coordinates[0][0][0])) {
            data.features[idx].geometry.coordinates[0] = newRing;
        } else {
            data.features[idx].geometry.coordinates[0] = newRing;
        }
    }
}

// Main execution
console.log('🔧 Headingley Topological Fix');
console.log('================================');

// Try the vertex snapping approach first (simpler and more predictable)
snapHeadingleyVertices('Headingley South');
snapHeadingleyVertices('Headingley North');

// Save
fs.writeFileSync(geoPath, JSON.stringify(data, null, 2));
console.log('\n✅ GeoJSON updated!');
console.log('   File:', geoPath);
