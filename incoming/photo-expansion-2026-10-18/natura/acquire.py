import urllib.request,urllib.parse,json,time,hashlib,re,html,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];BASE=Path(__file__).resolve().parent
UA={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}
def get(url):
 for i in range(4):
  try:return urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=45).read()
  except Exception:
   if i==3:raise
   time.sleep(2+i)
def api(params):return json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',**params))))
def clean(x):return html.unescape(re.sub('<[^>]+>','',x or '')).strip()
animals=json.load(open(ROOT/'data/animals.json'))['items']
examples={'bombi':'Bombus terrestris','sirfidi':'Episyrphus balteatus','farfalle-diurne':'Papilio machaon','zecche':'Ixodes ricinus'}
targets=[('animals',a['id'],a['latin'],examples.get(a['id'],a['latin']),2) for a in animals if a['publicationStatus']=='ready']
plants=json.load(open(ROOT/'data/plants.json'))['plants']
for k,v in plants.items():
 if len(v.get('photos',[]))==2 and k!='giglio-rosso':targets.append(('plants',k,v['latin'],re.sub(r' (?:L\.|Roth|\(L\.).*','',v['latin']),1))
targets += [('trees',k,t,t,1) for k,t in [('sorbo domestico','Sorbus domestica'),('ciliegio','Prunus avium'),('noce','Juglans regia'),('robinia','Robinia pseudoacacia'),('olmo montano','Ulmus glabra'),('ippocastano','Aesculus hippocastanum')]]
existing=''.join(p.read_text() for p in (ROOT/'data').glob('*.json'))
allc=[];fail=[]
def search(t):
 group,key,latin,taxon,n=t
 try:
  d=api(dict(generator='search',gsrsearch='"'+taxon+'" filetype:bitmap',gsrnamespace=6,gsrlimit=12,prop='imageinfo|categories',iiprop='url|extmetadata|sha1|size',cllimit=30))
  out=[]
  for p in sorted(d.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',0)):
   ii=p.get('imageinfo',[{}])[0];m=ii.get('extmetadata',{});val=lambda x:clean(m.get(x,{}).get('value',''))
   license=val('LicenseShortName');lu=val('LicenseUrl');desc=val('ImageDescription');cats=[c['title'] for c in p.get('categories',[])];evidence=' '.join([p['title'],desc,*cats]).lower()
   if not (license.startswith('CC BY') or license in ['CC0','Public domain']):continue
   if not lu or not val('Artist') or ii.get('size',99999999)>25000000:continue
   if ii.get('width',0)<600 or ii.get('height',0)<500:continue
   if p['title'] in existing or ii.get('url','') in existing:continue
   if any(w in evidence for w in ['taxiderm','museum specimen','mounted specimen','illustration','drawing','dead animal','roadkill','carcass']):continue
   # Require explicit species in description/categories/title.
   if taxon.lower() not in evidence:continue
   out.append(dict(target_group=group,target_key=key,latin=latin,photo_taxon=taxon,source_title=p['title'],source_description=desc,source_categories=cats,page=ii['descriptionurl'],author=val('Artist'),license=license,licenseUrl=lu,sourceImage=ii['url'],commons_sha1=ii['sha1'],size=ii['size']))
   if len(out)>=n+1:break
  return t,out
 except Exception as e:return t,[{'error':str(e)}]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 for t,out in ex.map(search,targets):
  print(t[1],len(out),flush=True);allc.extend(out)
(BASE/'candidates.json').write_text(json.dumps(allc,ensure_ascii=False,indent=2))
# Download first n candidates per target plus one spare, retain raw metadata.
(BASE/'originals').mkdir(exist_ok=True)
def download(c):
 if 'error' in c:return c
 try:
  b=get(c['sourceImage']);sha1=hashlib.sha1(b).hexdigest()
  if sha1!=c['commons_sha1']:raise ValueError('sha1 mismatch')
  ext=Path(urllib.parse.urlparse(c['sourceImage']).path).suffix
  name='pe2-natura-'+c['target_key'].replace(' ','-')+'-'+sha1[:8]
  p=BASE/'originals'/(name+ext);p.write_bytes(b)
  c.update(id=name,original=str(p.relative_to(ROOT)),sha256_original=hashlib.sha256(b).hexdigest())
 except Exception as e:c['error']=str(e)
 return c
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 results=list(ex.map(download,allc))
(BASE/'downloaded.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('downloaded',sum('original'in c for c in results),flush=True)
