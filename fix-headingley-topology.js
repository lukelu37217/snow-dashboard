// Fix Headingley topology using turf.js difference
const fs = require('fs');
const turf = require('@turf/turf');

const geoPath = './public/winnipeg-neighbourhoods.geojson';
const data = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

// Helper to get a feature by name
function getFeature(name) {
  return data.features.find(f => f.properties.name === name);
}

// Get Headingley features
const headingleyNorth = getFeature('Headingley North');
const headingleySouth = getFeature('Headingley South');

// Get neighbor features (the 'wall')
const neighborNames = [
  'Assiniboia Downs',
  'River West Park',
  'Westdale',
  'Ridgewood South',
  'West Perimeter South'
];
const neighborFeatures = neighborNames.map(getFeature).filter(Boolean);

// Union all neighbors into one big polygon
let wall = neighborFeatures[0];
for (let i = 1; i < neighborFeatures.length; i++) {
  wall = turf.union(wall, neighborFeatures[i]);
}

// Difference: cut the wall shape out of Headingley
const fixedNorth = turf.difference(headingleyNorth, wall);
const fixedSouth = turf.difference(headingleySouth, wall);

// Replace in GeoJSON
function replaceFeature(original, fixed) {
  if (!fixed) return;
  const idx = data.features.indexOf(original);
  if (idx !== -1) {
    data.features[idx] = fixed;
    // Preserve name/id
    data.features[idx].properties = original.properties;
  }
}
replaceFeature(headingleyNorth, fixedNorth);
replaceFeature(headingleySouth, fixedSouth);

fs.writeFileSync(geoPath, JSON.stringify(data, null, 2));
console.log('✅ Headingley topology fixed and saved to', geoPath);
