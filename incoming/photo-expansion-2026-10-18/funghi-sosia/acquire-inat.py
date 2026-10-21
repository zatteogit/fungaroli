"""Serial photo downloads only while the coordinator grants the iNat-host slot."""
import urllib.request,urllib.parse,json,time,hashlib,re,os
from pathlib import Path
from PIL import Image
ROOT=Path.cwd();OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia';rows=json.load(open(OUT/'inat-download-plan.json'))
# Reject taxonomic complexes, exact-source duplicates and poor-resolution source photos.
meta={}
for f in (OUT/'inat-metadata').glob('*.json'):
 d=json.load(open(f))
 for o in d.get('results',[]):
  if 'photos' in o:
   for ph in o.get('photos',[]):meta[ph['id']]=(o,ph)
filtered=[];seen=set();reject=[]
for r in rows:
 o,ph=meta[r['photo_id']];t=o.get('taxon',{})
 if t.get('rank')!='species' or t.get('name','').lower()!=r['target_key'].lower():reject.append({'id':r['id'],'reason':'taxon not species exact'});continue
 dims=ph.get('original_dimensions') or {}
 if min(dims.get('width',0),dims.get('height',0))<550:reject.append({'id':r['id'],'reason':'resolution <550'});continue
 if ph.get('hidden') or ph.get('flags'):reject.append({'id':r['id'],'reason':'hidden/flagged'});continue
 if ph['id']in seen:continue
 seen.add(ph['id']);r['source_width']=dims['width'];r['source_height']=dims['height'];r['photo_attribution_original']=r['attribution'];r['author']=re.sub(r'^\(c\)\s*','',r['attribution']).split(', some rights reserved')[0].split(', no rights reserved')[0];r['source_metadata']=str((OUT/'inat-metadata'/(r['target_key'].replace(' ','-')+'.json')).relative_to(ROOT));filtered.append(r)
# Round robin: widest taxonomic coverage first, then complementary views.
first=[];rest=[];taxa=set()
for r in filtered:
 if r['target_key']not in taxa:first.append(r);taxa.add(r['target_key'])
 else:rest.append(r)
ordered=first+rest
# Limit this pass to two source photographs per taxon, with first38 prioritized.
counts={};selected=[]
for r in ordered:
 k=r['target_key']
 if counts.get(k,0)>=2:continue
 counts[k]=counts.get(k,0)+1;selected.append(r)
(OUT/'inat-download-plan.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2));(OUT/'inat-rejected.json').write_text(json.dumps(reject,ensure_ascii=False,indent=2))
receipts=[];acquired=[]
for i,row in enumerate(selected[:60]):
 path=ROOT/row['original'];path.parent.mkdir(exist_ok=True)
 if path.exists():
  b=path.read_bytes()
 else:
  time.sleep(3.2)
  try:
   with urllib.request.urlopen(urllib.request.Request(row['sourceImage'],headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=60) as response:
    headers=dict(response.headers);status=response.status
    if int(headers.get('Content-Length','0'))>25_000_000:raise ValueError('original >25MB')
    b=response.read(25_000_001)
    if len(b)>25_000_000:raise ValueError('original >25MB')
   # Validate actual image bytes before atomic persistence.
   import io
   Image.open(io.BytesIO(b)).verify();tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_bytes(b);os.replace(tmp,path)
   receipts.append(dict(id=row['id'],sourceImage=row['sourceImage'],status=status,headers={k:v for k,v in headers.items() if k.lower() in ['content-type','content-length','last-modified','etag']},sha256=hashlib.sha256(b).hexdigest()))
  except Exception as e:
   error={'id':row['id'],'sourceImage':row['sourceImage'],'error':str(e)}
   if hasattr(e,'headers'):error['retry_after']=e.headers.get('Retry-After')
   (OUT/'inat-download-error.json').write_text(json.dumps(error,ensure_ascii=False,indent=2));print('STOP',error,flush=True);break
 acquired.append(row)
 (OUT/'inat-acquired.json').write_text(json.dumps({'photos':acquired},ensure_ascii=False,indent=2));(OUT/'inat-download-receipts.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2));print('ACQUIRED',len(acquired),row['target_key'],row['id'],flush=True)
print('COMPLETE',len(acquired),'photos',flush=True)
