const fs = require('fs');
const geo = JSON.parse(fs.readFileSync('src/lib/data/nta-boundaries.json'));
const comp = JSON.parse(fs.readFileSync('src/lib/data/noise_complaints_day_by_nta.json'));

const geoCodes = new Set(geo.features.map(f => f.properties.nta_code));
const compCodes = new Set(comp.map(c => c.nta_code));

const missing = [...geoCodes].filter(code => !compCodes.has(code));
console.log('NTA codes in GeoJSON but not in complaints:', missing.length);
console.log('Examples:', missing.slice(0, 10));
