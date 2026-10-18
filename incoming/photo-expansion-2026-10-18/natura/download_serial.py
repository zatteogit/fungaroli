import urllib.request,urllib.error,json,hashlib,time,urllib.parse
from pathlib import Path
B=Path(__file__).resolve().parent
cs=json.load(open(B/'candidates.json'));log=[]
# Skip visibly unsuitable source candidates and acquire representative views first.
reject={0,12,14,25,39,49,50,51,79}
order=[i for j in range(3) for i,c in enumerate(cs) if sum(p['target_key']==c['target_key'] for p in cs[:i])==j and i not in reject]
for i in order:
 c=cs[i]
 if list((B/'originals').glob('*'+c['commons_sha1'][:8]+'.*')):continue
 try:
  req=urllib.request.Request(c['sourceImage'],headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'})
  r=urllib.request.urlopen(req,timeout=25);b=r.read()
  if hashlib.sha1(b).hexdigest()!=c['commons_sha1']:raise ValueError('SHA1 mismatch')
  ext=Path(urllib.parse.urlparse(c['sourceImage']).path).suffix
  p=B/'originals'/('pe2-natura-'+c['target_key'].replace(' ','-')+'-'+c['commons_sha1'][:8]+ext);p.write_bytes(b)
  log.append({'index':i,'status':'downloaded'});print(i,c['target_key'],'OK',flush=True)
 except urllib.error.HTTPError as e:
  log.append({'index':i,'status':e.code,'headers':dict(e.headers)});print(i,e.code,dict(e.headers),flush=True)
  if e.code in (429,403):break
 except Exception as e:log.append({'index':i,'error':str(e)});print(i,str(e),flush=True)
 (B/'network-log.json').write_text(json.dumps(log,indent=2));time.sleep(3)
(B/'network-log.json').write_text(json.dumps(log,indent=2))
