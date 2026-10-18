import json,importlib.util
from pathlib import Path
from PIL import Image
ROOT=Path.cwd();O=Path(__file__).parent
s=importlib.util.spec_from_file_location('c',ROOT/'tools/import_crop_points.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
p=json.load(open(O/'candidates.json'));r=json.load(open(O/'review-decisions.json'))
for photo in p['photos']:
 rv=r.get(photo['id'],{})
 if not rv.get('approved'):continue
 im=Image.open(ROOT/photo['files']['file_hd']);W,H=im.size;side=min(W,H);px,py=m.positions((W,H),rv)['1:1'];x=round(px*(W-side));y=round(py*(H-side));im.crop((x,y,x+side,y+side)).resize((160,160),Image.Resampling.LANCZOS).save(ROOT/photo['files']['thumb'],'WEBP',quality=72,method=6)
 photo['changes']+=' Miniatura centrata sul soggetto con il punto di ritaglio revisionato.'
(O/'candidates.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
