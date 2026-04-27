import csv
import json
from shapely import wkt as shapely_wkt
from shapely.geometry import mapping

# Read the CSV file
csv_path = './src/lib/data/2020_Neighborhood_Tabulation_Areas_(NTAs)_20260427.csv'
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    data = list(reader)

# Get column names
columns = list(data[0].keys()) if data else []
geometry_col = columns[-1]  # Last column has WKT
nta_code_col = columns[6]   
nta_name_col = columns[4]
borough_col = columns[2]

features = []
for row in data:
    try:
        wkt_geom = row[geometry_col]
        if not wkt_geom or wkt_geom.strip() == '':
            continue
        
        # Parse WKT
        geom = shapely_wkt.loads(wkt_geom)
        
        features.append({
            'type': 'Feature',
            'geometry': mapping(geom),
            'properties': {
                'nta_code': row[nta_code_col].strip(),
                'nta_name': row[nta_name_col].strip(),
                'borough': row[borough_col].strip()
            }
        })
    except Exception as e:
        print(f"Error processing row: {e}")

geojson = {
    'type': 'FeatureCollection',
    'features': features
}

with open('./src/lib/data/nta-boundaries.geojson', 'w') as f:
    json.dump(geojson, f)

print(f"Converted {len(features)} features to GeoJSON")
