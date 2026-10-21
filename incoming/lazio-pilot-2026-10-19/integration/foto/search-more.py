import urllib.request,urllib.parse,json,re,time,hashlib
from pathlib import Path
from PIL import Image
P=Path(__file__).parent;UA='fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)'
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=30).read()
queries=['"Monte Rufeno"','"Tuscolo" bosco','"Monte Cavo"','"Fontan Tempesta"','"Cerquone"','"Prataglia"','"Monte Livata" bosco','"Valle di Canneto"','"Campello Vecchio"','"Sughereta" "San Vito"','"Fiumata"','"Semprevisa" bosco']
x=[]
for q in queries:
 try:
  u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',generator='search',gsrsearch=q,gsrnamespace=6,gsrlimit=8,prop='imageinfo',iiprop='url|size|extmetadata|mime',iiurlwidth=1600,format='json'))
  data=json.loads(get(u))
  for page in data.get('query',{}).get('pages',{}).values():
   i=page.get('imageinfo',[{}])[0];m=i.get('extmetadata',{});val=lambda k:re.sub('<[^>]*>','',m.get(k,{}).get('value','')).strip()
   r=dict(query=q,title=page['title'],pageid=page['pageid'],page=i.get('descriptionurl'),originalUrl=i.get('url'),previewUrl=i.get('thumburl'),author=val('Artist'),license=val('LicenseShortName'),licenseUrl=val('LicenseUrl'),description=val('ImageDescription'),width=i.get('width'),height=i.get('height'),extmetadata=m)
   if i.get('mime')!='image/jpeg' or not re.match(r'^(CC BY|CC0)',r['license']) or not r['licenseUrl'] or i.get('width',0)<1400:continue
   if re.search('ISS\d|fung|bolet|russul|amanit|chiesa|santuario|abbazia|croc|stemma|logo|dipinto|Madonna|statua',r['title'],re.I):continue
   x.append(r)
  print('Q',q,len(x),flush=True)
 except Exception as e:print('QERR',q,e,flush=True)
 time.sleep(.5)
(P/'more-metadata.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
for r in x:
 try:
  f=P/'originals'/f"{r['pageid']}.jpg"
  if not f.exists():f.write_bytes(get(r['previewUrl']))
  Image.open(f).verify();r.update(local=str(f),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),acquiredUrl=r['previewUrl'],screen='visual_pending');print('OK',r['pageid'],flush=True)
 except Exception as e:r['error']=str(e);print('ERR',r['pageid'],flush=True)
 (P/'more-acquired.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 time.sleep(1)
