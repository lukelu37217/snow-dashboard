/**
 * Verify Client Properties against GeoJSON boundaries
 * 
 * This script checks if each client property's coordinates actually fall
 * within the zone they're assigned to in the GeoJSON file.
 * 
 * Usage: node verify-zones.cjs
 */

const fs = require('fs');
const path = require('path');

// Load GeoJSON
const geoJsonPath = path.join(__dirname, 'public', 'winnipeg-neighbourhoods.geojson');
const geoData = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

// Load client properties (parse from TS file)
const propsPath = path.join(__dirname, 'src', 'config', 'clientProperties.ts');
const propsContent = fs.readFileSync(propsPath, 'utf8');

// Extract property data from TypeScript file
const propMatches = propsContent.matchAll(/\{\s*id:\s*'([^']+)',\s*address:\s*'([^']+)',\s*zone:\s*'([^']+)',\s*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)/g);
const properties = [];
for (const match of propMatches) {
    properties.push({
        id: match[1],
        address: match[2],
        zone: match[3],
        lat: parseFloat(match[4]),
        lng: parseFloat(match[5])
    });
}

console.log(`📍 Loaded ${properties.length} client properties\n`);

// Point-in-polygon algorithm
function isPointInPolygon(lat, lng, polygon) {
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

// Find which zone a point is in
function findZone(lat, lng) {
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
    return null;
}

// Verify each property
let correct = 0;
let mismatch = 0;
let orphan = 0;
const issues = [];

for (const prop of properties) {
    const actualZone = findZone(prop.lat, prop.lng);
    
    if (!actualZone) {
        orphan++;
        issues.push({
            address: prop.address,
            assigned: prop.zone,
            actual: 'ORPHAN (outside all boundaries)',
            lat: prop.lat,
            lng: prop.lng
        });
    } else if (actualZone !== prop.zone) {
        mismatch++;
        issues.push({
            address: prop.address,
            assigned: prop.zone,
            actual: actualZone,
            lat: prop.lat,
            lng: prop.lng
        });
    } else {
        correct++;
    }
}

console.log('📊 VERIFICATION RESULTS:');
console.log(`   ✅ Correct: ${correct}`);
console.log(`   ⚠️ Mismatch: ${mismatch}`);
console.log(`   🔵 Orphan (synthetic zones needed): ${orphan}`);
console.log('');

if (issues.length > 0) {
    console.log('📋 ISSUES FOUND:');
    console.log('================');
    for (const issue of issues) {
        console.log(`\n${issue.address}`);
        console.log(`   Assigned: ${issue.assigned}`);
        console.log(`   Actual:   ${issue.actual}`);
        console.log(`   Coords:   ${issue.lat}, ${issue.lng}`);
    }
}

// Summary by zone
console.log('\n📍 PROPERTIES BY ZONE:');
const byZone = {};
for (const prop of properties) {
    if (!byZone[prop.zone]) byZone[prop.zone] = [];
    byZone[prop.zone].push(prop.address);
}
for (const zone of Object.keys(byZone).sort()) {
    console.log(`   ${zone}: ${byZone[zone].length} properties`);
}
