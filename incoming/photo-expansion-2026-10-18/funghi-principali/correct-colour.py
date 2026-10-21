import json,io,hashlib
from pathlib import Path
from PIL import Image
from colour import open_srgb
B=Path(__file__).resolve().parent;ROOT=B.parents[2]
def save(im,p,side,cap):
 q=84
 while True:
  resized=im.copy();resized.thumbnail((side,side),Image.Resampling.LANCZOS);buf=io.BytesIO();resized.save(buf,'WEBP',quality=q,method=6)
  if len(buf.getvalue())<=cap:p.write_bytes(buf.getvalue());return
  if q>58:q-=5
  else:side=int(side*.9);q=78
p=B/'manifest.json';d=json.load(open(p));review=[]
for r in d['photos']:
 raw=ROOT/r['original'];assert hashlib.sha256(raw.read_bytes()).hexdigest()==r['sha256_original']
 im,details=open_srgb(raw);r['colour_management']=details
 if details['converted_to_srgb']:
  old_hashes={key:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for key,f in r['files'].items()}
  save(im,ROOT/r['files']['file'],560,80000);save(im,ROOT/r['files']['file_hd'],1200,220000);side=min(im.size);x=(im.width-side)//2;y=(im.height-side)//2;im.crop((x,y,x+side,y+side)).resize((160,160),Image.Resampling.LANCZOS).save(ROOT/r['files']['thumb'],'WEBP',quality=72,method=6)
  review.append({'id':r['id'],**details,'old_export_sha256':old_hashes,'new_export_sha256':{key:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for key,f in r['files'].items()}})
 r['changes']='Orientamento EXIF applicato, ridimensionamento, compressione WebP; miniatura quadrata centrale. Profili ICC presenti convertiti a sRGB prima della rimozione; originali non alterati. EXIF/XMP assenti. Nessuna correzione cromatica creativa o generazione.'
tmp=B/'manifest.colour.tmp';tmp.write_text(json.dumps(d,ensure_ascii=False,indent=2));tmp.replace(p);(B/'colour-review.json').write_text(json.dumps({'photos':review,'untagged_assumed_srgb':sum(not r['colour_management']['source_icc_name'] for r in d['photos'])},ensure_ascii=False,indent=2));print('ICC converted',len(review),'P3',sum('Display P3'==r['source_icc_name'] for r in review),'total',len(d['photos']))
# Ensure future incremental renders preserve corrected base rows.
base=json.load(open(B/'base-manifest.json'));updated={r['id']:r for r in d['photos']}
for i,r in enumerate(base['photos']):base['photos'][i]=updated.get(r['id'],r)
(B/'base-manifest.json').write_text(json.dumps(base,ensure_ascii=False,indent=2))
