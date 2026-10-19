import urllib.request,urllib.parse,json,re,time,hashlib,concurrent.futures
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
P=Path(__file__).parent; (P/'originals').mkdir(exist_ok=True)
UA='fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)'
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=60).read()
def api(params):return json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(params,format='json'))))
queries=['Monte Raschio','Faggeta Allumiere','Monterano Diosilla','Monte Musino','Tuscolo bosco','Monte Cavo bosco','Fontan Tempesta','Cerquone','Monte Livata faggeta','Prataglia Cervara','Monte Gennaro bosco','Circeo foresta','Monti Aurunci Campello','Sughereta San Vito','Prato Campoli','Santa Serena Supino','Filettino Fiumata','Valle Canneto bosco','Monte Rufeno bosco']
rows={}
initial=json.load(open(P.parents[1]/'platform/photo-candidates.json'))
for q in initial['queries']:
 for c in q['candidates']:rows[c['title']]={'query':q['areaQuery'],'title':c['title']}
for query in queries:
 try:
  d=api({'action':'query','list':'search','srsearch':query,'srnamespace':6,'srlimit':7})
  for r in d.get('query',{}).get('search',[]):rows.setdefault(r['title'],{'query':query,'title':r['title']})
 except Exception as e:print('query failed',query,e,flush=True)
 print(query,len(rows),flush=True)
(P/'search-results.json').write_text(json.dumps(list(rows.values()),ensure_ascii=False,indent=2))
def process(r):
 try:
  d=api({'action':'query','titles':r['title'],'prop':'imageinfo','iiprop':'url|size|extmetadata|mime|metadata'})
  p=next(iter(d['query']['pages'].values()));i=p['imageinfo'][0];m=i.get('extmetadata',{})
  val=lambda k:re.sub('<[^>]*>','',m.get(k,{}).get('value','')).strip()
  r.update(page=i['descriptionurl'],originalUrl=i['url'],author=val('Artist'),license=val('LicenseShortName'),licenseUrl=val('LicenseUrl'),description=val('ImageDescription'),width=i['width'],height=i['height'],pageid=p['pageid'],extmetadata=m)
  if i['mime'] not in ['image/jpeg','image/png'] or i['width']<900 or not re.match(r'^(CC BY|CC0|Public domain)',r['license']):return r
  if re.search(r'ISS\d|satellit|manoscrit|fung|bolet|russul|amanit|map|stemma|logo|chiesa|santuario|affresco|dipinto',r['title'],re.I):r['screen']='metadata_rejected';return r
  # License is checked before acquisition. Public domain records need a concrete public-domain template on the page.
  if not r['licenseUrl']:
   if val('Copyrighted')=='False':r['licenseUrl']='https://commons.wikimedia.org/wiki/Commons:Public_domain'
   else:r['screen']='license_pending';return r
  path=P/'originals'/f"{p['pageid']}.jpg"
  if not path.exists():path.write_bytes(get(i['url']))
  Image.open(path).verify();r.update(local=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),screen='visual_pending')
 except Exception as e:r['error']=str(e)
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:out=list(ex.map(process,rows.values()))
(P/'acquired.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
valid=[r for r in out if r.get('local')]
for start in range(0,len(valid),24):
 batch=valid[start:start+24];sheet=Image.new('RGB',(1400,240*((len(batch)+3)//4)), '#eeeeee');dr=ImageDraw.Draw(sheet)
 for k,r in enumerate(batch):
  im=Image.open(r['local']);im.thumbnail((340,190));x=k%4*350;y=k//4*240;sheet.paste(im,(x+(350-im.width)//2,y));dr.text((x+4,y+192),str(r['pageid'])+' '+r['query'][:30],fill='black');dr.text((x+4,y+208),r['title'][5:53],fill='black')
 sheet.save(P/f'candidates-{start//24}.jpg')
print('DOWNLOADED',len(valid),flush=True)
