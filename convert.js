#!/usr/bin/env node
const fs = require('fs');
const csv = require('csv-parser');
const { featureCollection, feature, multiPolygon, polygon } = require('@turf/helpers');

// Simple WKT parser
function parseWKT(wktString) {
  if (!wktString || typeof wktString !== 'string') return null;
  
  wktString = wktString.trim();
  
  if (wktString.startsWith('MULTIPOLYGON')) {
    // Extract coordinates from MULTIPOLYGON
    const coordsMatch = wktString.match(/MULTIPOLYGON\s*\(\((.*)\)\)/s);
    if (!coordsMatch) return null;
    
    const polygons = [];
    let depth = 0;
    let currentPoly = '';
    
    for (let char of coordsMatch[1]) {
      if (char === '(') {
        depth++;
        if (depth === 1) continue;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          polygons.push(currentPoly);
          currentPoly = '';
          continue;
        }
      }
      if (depth > 0) currentPoly += char;
    }
    
    const coords = polygons.map(p => {
      const rings = [];
      let ring = '';
      let inRing = false;
      
      for (let char of p) {
        if (char === '(') {
          inRing = true;
          continue;
        } else if (char === ')') {
          if (inRing) {
            const coords = ring.split(',').map(c => {
              const [lng, lat] = c.trim().split(/\s+/);
              return [parseFloat(lng), parseFloat(lat)];
            });
            rings.push(coords);
            ring = '';
            inRing = false;
          }
          continue;
        }
        if (inRing) ring += char;
      }
      
      return rings;
    });
    
    return { type: 'MultiPolygon', coordinates: coords };
  }
  
  return null;
}

const features = [];
const output = [];

fs.createReadStream('./src/lib/data/2020_Neighborhood_Tabulation_Areas_(NTAs)_20260427.csv')
  .pipe(csv())
  .on('data', (row) => {
    try {
      const keys = Object.keys(row);
      const lastKey = keys[keys.length - 1];
      const wktGeom = row[lastKey];
      
      const geometry = parseWKT(wktGeom);
      if (!geometry) return;
      
      features.push({
        type: 'Feature',
        geometry: geometry,
        properties: {
          nta_code: row[keys[6]]?.trim() || '',
          nta_name: row[keys[4]]?.trim() || '',
          borough: row[keys[2]]?.trim() || ''
        }
      });
    } catch (e) {
      console.error('Error:', e.message);
    }
  })
  .on('end', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: features
    };
    
    fs.writeFileSync('./src/lib/data/nta-boundaries.geojson', JSON.stringify(geojson));
    console.log(`Converted ${features.length} features to GeoJSON`);
  });
