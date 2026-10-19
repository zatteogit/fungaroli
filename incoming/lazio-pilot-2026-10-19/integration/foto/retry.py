import urllib.request,urllib.parse,json,time,hashlib
from pathlib import Path
from PIL import Image
P=Path(__file__).parent;UA='fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)'
x=json.load(open(P/'acquired.json'))
for r in x:
 if not r.get('error') or not r.get('pageid') or any(t in r['title'].lower() for t in ['mixomicete','chrysomela','daini','dune']):continue
 try:
  # Request a regular Commons derivative at its published URL; retain original URL in manifest.
  u=r['originalUrl'].split('?')[0];base,fn=u.rsplit('/',1);u=base.replace('/commons/','/commons/thumb/')+'/'+fn+'/960px-'+fn
  raw=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=30).read()
  f=P/'originals'/f"{r['pageid']}.jpg";f.write_bytes(raw);Image.open(f).verify();r.update(local=str(f),sha256=hashlib.sha256(raw).hexdigest(),acquiredUrl=u,screen='visual_pending');r.pop('error',None)
  print('OK',r['pageid'],flush=True)
 except Exception as e:print('ERR',r['pageid'],str(e)[:40],flush=True)
 time.sleep(2)
 (P/'acquired.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
