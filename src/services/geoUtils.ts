
export interface Coordinate {
  lat: number;
  lon: number;
}

export const getCentroid = (geometry: any): Coordinate | null => {
  if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
    return null;
  }

  let totalLat = 0;
  let totalLon = 0;
  let count = 0;

  // Handle MultiPolygon and Polygon
  // GeoJSON Polygon coordinates: [ [ [lon, lat], ... ] ]
  // GeoJSON MultiPolygon coordinates: [ [ [ [lon, lat], ... ] ] ]
  
  const processRing = (ring: number[][]) => {
    ring.forEach(coord => {
      // GeoJSON is [lon, lat]
      totalLon += coord[0];
      totalLat += coord[1];
      count++;
    });
  };

  const processPolygon = (poly: number[][][]) => {
      processRing(poly[0]); // Outer ring is usually enough for visual centroid of simple shapes
  };

  if (geometry.type === 'Polygon') {
    processPolygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly: number[][][]) => {
        processPolygon(poly);
    });
  }

  if (count === 0) return null;

  return {
    lat: totalLat / count,
    lon: totalLon / count
  };
};
