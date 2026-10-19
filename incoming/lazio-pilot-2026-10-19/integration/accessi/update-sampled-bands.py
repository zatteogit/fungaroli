"""Merge available real DEM bands into the new pilot zones only; preserve other fields."""
import json
from pathlib import Path
repo = Path(__file__).resolve().parents[4]
folder = repo / 'incoming/lazio-pilot-2026-10-19/integration'
seeds = {z['id'] for z in json.loads((folder / 'zone-seeds.json').read_text())['zones']}
path = repo / 'data/zones.json'
data = json.loads(path.read_text())
ready = []
for zone in data['zones']:
    if zone['id'] not in seeds:
        continue
    audit = folder / 'campionamenti' / (zone['id'] + '-audit.json')
    if not audit.exists():
        continue
    bands = json.loads(audit.read_text()).get('suggestedBandsM')
    if isinstance(bands, list) and bands and all(isinstance(n, (int, float)) for n in bands):
        zone['bands'] = bands
        ready.append(zone['id'])
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(f'Fasce DEM integrate: {len(ready)}/{len(seeds)}')
