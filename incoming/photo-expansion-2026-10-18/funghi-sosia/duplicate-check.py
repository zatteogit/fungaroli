import json
from pathlib import Path
from PIL import Image,ImageOps
ROOT=Path.cwd();OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia'
def dh(path):
 im=ImageOps.exif_transpose(Image.open(path)).convert('L').resize((9,8));p=list(im.getdata());return sum((p[y*9+x]>p[y*9+x+1])<<(y*8+x) for y in range(8) for x in range(8))
media=json.load(open('data/media.json'));existing=[]
for group in ['species','lookalikes']:
 for key,v in media[group].items():
  for photo in ([v['ref']]if v.get('ref')else[])+v.get('inat',[]):
   path=ROOT/photo['file']
   if path.exists():existing.append((key,photo['file'],dh(path)))
rows=json.load(open(OUT/'candidates.json'))['photos'];results=[];hashed=[]
for row in rows:
 h=dh(ROOT/row['files']['file']);close=[]
 for key,path,oldhash in existing+hashed:
  distance=bin(h^oldhash).count('1')
  if distance<=8:close.append({'key':key,'path':path,'dhash_distance':distance})
 hashed.append((row['target_key'],row['files']['file'],h));results.append({'id':row['id'],'dhash':f'{h:016x}','matches_to_review':close})
(OUT/'duplicate-audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('Images',len(rows),'close matches',sum(bool(x['matches_to_review'])for x in results))
