import fs from 'fs';
import path from 'path';

// Simple WKT to GeoJSON converter
function wktToGeoJSON(wkt) {
  if (!wkt) return null;
  
  wkt = wkt.trim();
  
  // Handle MULTIPOLYGON
  if (wkt.startsWith('MULTIPOLYGON')) {
    const coordsStr = wkt.slice(14, -2); // Remove "MULTIPOLYGON ((" and "))"
    const polygons = [];
    let current = '';
    let depth = 0;
    
    for (let char of coordsStr) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
      
      if (char === ',' && depth === 0) {
        polygons.push(parsePolygonString(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      polygons.push(parsePolygonString(current.trim()));
    }
    
    return {
      type: 'MultiPolygon',
      coordinates: polygons
    };
  }
  
  // Handle POLYGON
  if (wkt.startsWith('POLYGON')) {
    const coordsStr = wkt.slice(9, -1); // Remove "POLYGON ((" and ")"
    return {
      type: 'Polygon',
      coordinates: parsePolygonString(coordsStr)
    };
  }
  
  return null;
}

function parsePolygonString(str) {
  str = str.trim().slice(1, -1); // Remove outer parens
  const rings = [];
  let current = '';
  let depth = 0;
  
  for (let char of str) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    
    if (char === ',' && depth === 0) {
      rings.push(parseRing(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    rings.push(parseRing(current.trim()));
  }
  
  return rings;
}

function parseRing(ringStr) {
  ringStr = ringStr.trim();
  if (ringStr.startsWith('(') && ringStr.endsWith(')')) {
    ringStr = ringStr.slice(1, -1);
  }
  
  return ringStr.split(',').map(coord => {
    const [lng, lat] = coord.trim().split(/\s+/);
    return [parseFloat(lng), parseFloat(lat)];
  });
}

// Read the CSV file and extract WKT + NTA info
const csvFile = './src/lib/data/2020_Neighborhood_Tabulation_Areas_(NTAs)_20260427.csv';
const content = fs.readFileSync(csvFile, 'utf8');
const lines = content.split('\n');

// Parse header
const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
const ntaCodeIdx = header.findIndex(h => h.includes('NTA2020') && !h.includes('Name'));
const ntaNameIdx = header.findIndex(h => h.includes('NTA2020') && h.includes('Name'));
const wktIdx = header.length - 1; // Last column

console.log('Parsing CSV...');
console.log(`NTA Code index: ${ntaCodeIdx}, NTA Name index: ${ntaNameIdx}, WKT index: ${wktIdx}`);

const features = [];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  try {
    // Simple CSV parsing - split by comma, but be careful with quoted fields
    const cells = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      const nextChar = lines[i][j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.replace(/^"|"$/g, '').trim());
    
    if (cells.length <= wktIdx) continue;
    
    const ntaCode = cells[ntaCodeIdx]?.trim();
    const ntaName = cells[ntaNameIdx]?.trim();
    const wkt = cells[wktIdx]?.trim();
    
    if (!ntaCode || !wkt) continue;
    
    const geometry = wktToGeoJSON(wkt);
    if (!geometry) {
      console.warn(`Skipped ${ntaCode} - couldn't parse geometry`);
      continue;
    }
    
    features.push({
      type: 'Feature',
      geometry: geometry,
      properties: {
        nta_code: ntaCode,
        nta_name: ntaName
      }
    });
    
    if (i % 50 === 0) console.log(`Processed ${i} rows...`);
  } catch (e) {
    console.warn(`Error on row ${i}:`, e.message);
  }
}

const geojson = {
  type: 'FeatureCollection',
  features: features
};

fs.writeFileSync('./src/lib/data/nta-boundaries.geojson', JSON.stringify(geojson));
console.log(`\n✓ Converted ${features.length} NTA features to GeoJSON`);
console.log(`Saved to: ./src/lib/data/nta-boundaries.geojson`);
