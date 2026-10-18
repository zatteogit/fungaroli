import urllib.request,urllib.error,time,json,hashlib,os
from pathlib import Path
O=Path(__file__).parent
(O/'originals').mkdir(exist_ok=True)
plan=json.load(open(O/'download-plan.json'));receipts=[]
for i,row in enumerate(plan):
 p=Path(row['original'])
 if p.exists():continue
 try:
  started=time.time()
  with urllib.request.urlopen(urllib.request.Request(row['sourceImage'],headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=90) as r:
   status=r.status;headers=dict(r.headers);data=r.read(25_000_001)
  if len(data)>25_000_000:raise ValueError('original above25MB')
  digest=hashlib.sha1(data).hexdigest()
  if digest!=row['commons_sha1']:raise ValueError('SHA1 mismatch')
  tmp=p.with_suffix('.tmp');tmp.write_bytes(data);os.replace(tmp,p)
  receipts.append(dict(id=row['id'],status=status,headers=headers,bytes=len(data),sha1=digest,sha256=hashlib.sha256(data).hexdigest(),started=started,elapsed=time.time()-started))
  print(i+1,row['id'],len(data),flush=True)
 except urllib.error.HTTPError as e:
  receipts.append(dict(id=row['id'],status=e.code,headers=dict(e.headers),retry_after=e.headers.get('Retry-After'),stopped=True));print('STOP',e.code,e.headers.get('Retry-After'),flush=True);break
 except Exception as e:
  receipts.append(dict(id=row['id'],error=str(e),stopped=True));print('STOP',str(e),flush=True);break
 finally:(O/'download-receipts.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+'\n')
 time.sleep(8.2)
print('DONE',len(receipts),flush=True)
