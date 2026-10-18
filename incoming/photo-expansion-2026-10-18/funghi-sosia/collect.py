import urllib.request, urllib.parse, json, re, hashlib, time, concurrent.futures, html
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
ROOT=Path.cwd(); OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia'; OUT.mkdir(parents=True,exist_ok=True)
for d in ['metadata','originals','derived','review']: (OUT/d).mkdir(exist_ok=True)
UA='Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'
def get(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=60) as r: return r.read()
  except Exception:
   if attempt==2: raise
   time.sleep(2+attempt*2)
def api(p): return json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(format='json',**p))))
def plain(t): return html.unescape(re.sub('<[^>]+>',' ',t or '')).strip()
media=json.load(open('data/media.json'))
keys=[k for k,v in media['lookalikes'].items() if len(v.get('inat',[]))+bool(v.get('ref'))==1]
existing=' '.join(p.read_text(errors='ignore') for p in (ROOT/'data').glob('*.json'))
existing+=' '.join(p.read_text(errors='ignore') for p in (ROOT/'incoming/photo-enrichment-2026-10-18').glob('*.json'))
reject=[]; selected=[]; usedsha=set()
for p in (ROOT/'incoming/photo-enrichment-2026-10-18/originals').glob('*'):
 if p.is_file(): usedsha.add(hashlib.sha256(p.read_bytes()).hexdigest())

def discover(k):
 cache=OUT/'metadata'/(k.replace(' ','-')+'.json')
 if cache.exists(): return k,json.load(open(cache))
 data=api({'action':'query','generator':'search','gsrsearch':'intitle:"'+k+'"','gsrnamespace':6,'gsrlimit':40,'prop':'imageinfo|categories','iiprop':'url|size|sha1|extmetadata','cllimit':100})
 cache.write_text(json.dumps(data,ensure_ascii=False,indent=2)); return k,data
print('API gate',api({'action':'query','meta':'siteinfo'})['query']['general']['sitename'],flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 discovered=list(pool.map(discover,keys))
for k,data in discovered:
 if k=='Inocybe lilacina':
  reject.append({'taxon':k,'reason':'Complesso tassonomico: necessita risoluzione puntuale europea; non adottato automaticamente.'});continue
 candidates=[]
 for p in data.get('query',{}).get('pages',{}).values():
  ii=p.get('imageinfo',[{}])[0]; ex=ii.get('extmetadata',{}); field=lambda f:plain(ex.get(f,{}).get('value',''))
  title=p.get('title','');desc=field('ImageDescription'); cats=[x['title'] for x in p.get('categories',[])]; tax=desc+' '+' '.join(cats)
  why=''
  if not ii.get('mime','image').startswith('image'): why='non immagine'
  if not re.search(re.escape(k),tax,re.I): why='taxon non confermato da descrizione/categorie'
  if re.search(r'\b(cf|aff)\.?\s+'+re.escape(k.split()[-1]),tax,re.I): why='identificazione cf/aff'
  if re.search(r'United States|North America|South America|Canada|Mexico|California|Massachusetts|New York|Australia|New Zealand|Japan|China|Korea|India|Taiwan|Washington|Oregon|Florida|Michigan|Virginia|Ontario|Quebec|British Columbia|Québec',tax,re.I): why='provenienza extraeuropea o ambigua'
  lic=field('LicenseShortName');lu=field('LicenseUrl'); au=field('Artist')
  if not re.match(r'^(CC0|CC BY |CC BY-SA |Public domain)',lic): why='licenza fuori preferenza'
  if not lu or not au: why='credito/link licenza incompleto'
  if ii.get('size',0)>25_000_000:why='originale >25MB'
  if min(ii.get('width',0),ii.get('height',0))<550:why='risoluzione insufficiente'
  if not re.search(r'\.(jpg|jpeg|png)$',title,re.I):why='non fotografia raster JPG/PNG'
  if ii.get('descriptionurl','') in existing or ii.get('url','') in existing or title.replace(' ','_') in existing:why='fonte già catalogata'
  if re.search(r'spore|microscop|illustration|drawing|distribution|map|painting',title+' '+desc,re.I):why='non fotografia macroscopica utile'
  if why:reject.append({'taxon':k,'title':title,'reason':why});continue
  score=0
  if re.search(r'Germany|Deutschland|France|Italy|Italia|Slovakia|Czech|Poland|Sweden|Finland|Austria|Spain|Switzerland|Slovenia|Croatia|Hungary|Netherlands|Belgium|Europe|Norway|Denmark|Estonia|Latvia|Lithuania|Portugal|United Kingdom|Scotland|England|Wales|Russia|Ukraine|Romania|Bulgaria',tax,re.I):score+=10
  if len(desc)>len(k)+15:score+=2
  candidates.append((score,title,ii,desc,cats,au,lic,lu))
 candidates.sort(key=lambda v:(-v[0],v[1]))
 # Three candidates for visual selection; two maximum final per taxon.
 for val in candidates[:3]:selected.append((k,val))
print('taxa',len(keys),'candidate originals',len(selected),flush=True)
(OUT/'rejected-discovery.json').write_text(json.dumps(reject,ensure_ascii=False,indent=2))

def acquire(item):
 k,(score,title,ii,desc,cats,au,lic,lu)=item
 fid='pe2-sosia-'+k.lower().replace(' ','-')+'-'+hashlib.sha1(title.encode()).hexdigest()[:7]
 orig=OUT/'originals'/(fid+Path(title).suffix.lower());
 try:
  b=orig.read_bytes() if orig.exists() else get(ii['url'])
  sha1=hashlib.sha1(b).hexdigest()
  if sha1!=ii['sha1']:raise ValueError('SHA1 diverge')
  sha256=hashlib.sha256(b).hexdigest()
  if sha256 in usedsha:return None
  orig.write_bytes(b)
  im=ImageOps.exif_transpose(Image.open(orig)).convert('RGB')
  files={}
  for kind,side,limit,suffix in [('file',560,80000,''),('file_hd',1200,220000,'-hd')]:
   dst=OUT/'derived'/(fid+suffix+'.webp'); q=83
   while True:
    exp=im.copy();exp.thumbnail((side,side),Image.Resampling.LANCZOS);exp.save(dst,'WEBP',quality=q,method=6)
    if dst.stat().st_size<=limit:break
    if q>65:q-=5
    else:side=int(side*.9)
   files[kind]=str(dst.relative_to(ROOT))
  dst=OUT/'derived'/(fid+'-t.webp');ImageOps.fit(im,(160,160),method=Image.Resampling.LANCZOS,centering=(.5,.5)).save(dst,'WEBP',quality=72,method=6);files['thumb']=str(dst.relative_to(ROOT))
  return dict(id=fid,target_group='lookalikes',target_key=k,latin=k,original=str(orig.relative_to(ROOT)),sha256_original=sha256,commons_sha1=sha1,source_title=title,source_description=desc,source_categories=cats,page=ii['descriptionurl'],author=au,license=lic,licenseUrl=lu,sourceImage=ii['url'],attribution=f'{au} · {lic} · Wikimedia Commons',alt=f'{k}, fotografia dalla fonte Wikimedia Commons.',caption=f'{k}.',changes='Orientamento, ridimensionamento e compressione WebP; miniatura quadrata centrata; nessuna modifica cromatica.',visual_review={'approved':False,'attribution_approved':False},files=files,discovery_score=score,width=im.width,height=im.height)
 except Exception as e:
  return {'error':str(e),'taxon':k,'title':title}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for row in pool.map(acquire,selected):
  if row:
   if 'error'in row:reject.append(row)
   else:
    if row['sha256_original']not in usedsha:selected_row=row;usedsha.add(row['sha256_original']);
    else:continue
    globals().setdefault('acquired',[]).append(row)
    print('acquired',len(acquired),row['target_key'],flush=True)
acquired=globals().get('acquired',[])
(OUT/'candidates.json').write_text(json.dumps({'photos':acquired},ensure_ascii=False,indent=2))
(OUT/'rejected-discovery.json').write_text(json.dumps(reject,ensure_ascii=False,indent=2))
for start in range(0,len(acquired),12):
 rows=acquired[start:start+12];board=Image.new('RGB',(1600,4*330),'#f5f5ed');draw=ImageDraw.Draw(board)
 for j,row in enumerate(rows):
  im=Image.open(ROOT/row['files']['file_hd']);im.thumbnail((390,280));x=(j%4)*400;y=(j//4)*330;board.paste(im,(x+(390-im.width)//2,y));draw.text((x+5,y+282),f'{start+j:02d} {row["target_key"]}',fill='black');draw.text((x+5,y+300),row['source_title'][:53],fill='black')
 board.save(OUT/'review'/f'originals-{start//12+1:02}.jpg',quality=92)
print('DONE',len(acquired),flush=True)
