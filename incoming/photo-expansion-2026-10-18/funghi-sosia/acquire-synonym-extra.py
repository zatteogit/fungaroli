import json,urllib.request,time,hashlib,os,io
from pathlib import Path
from PIL import Image
ROOT=Path.cwd();OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia';rows=json.load(open(OUT/'inat-synonym-download-plan.json'));acquired=[];receipts=[]
for row in rows[:2]:
 dst=ROOT/row['original']
 if dst.exists():b=dst.read_bytes()
 else:
  time.sleep(3.2)
  try:
   with urllib.request.urlopen(urllib.request.Request(row['sourceImage'],headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=60) as response:status=response.status;headers=dict(response.headers);b=response.read(25_000_001)
   if len(b)>25_000_000:raise ValueError('>25MB')
   Image.open(io.BytesIO(b)).verify();tmp=dst.with_suffix(dst.suffix+'.tmp');tmp.write_bytes(b);os.replace(tmp,dst)
   receipts.append({'id':row['id'],'status':status,'sourceImage':row['sourceImage'],'sha256':hashlib.sha256(b).hexdigest(),'headers':{k:v for k,v in headers.items() if k.lower() in ['content-type','content-length','etag','last-modified']}})
  except Exception as e:
   error={'id':row['id'],'error':str(e)}
   if hasattr(e,'headers'):error['retry_after']=e.headers.get('Retry-After')
   (OUT/'inat-synonym-download-error.json').write_text(json.dumps(error,ensure_ascii=False,indent=2));print('STOP',error,flush=True);break
 acquired.append(row);(OUT/'inat-synonym-acquired.json').write_text(json.dumps({'photos':acquired},ensure_ascii=False,indent=2));(OUT/'inat-synonym-receipts.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2));print('ACQUIRED',row['id'],flush=True)
print('COMPLETE',len(acquired),flush=True)
