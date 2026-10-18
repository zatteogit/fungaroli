import urllib.request,urllib.parse,json,re,time,hashlib,html,sys
raise SystemExit('Historical parallel collector disabled after Commons HTTP429. Use only the globally coordinated serial downloader.')
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from PIL import Image,ImageOps,ImageDraw
ROOT=Path(__file__).resolve().parents[3]; B=Path(__file__).resolve().parent
UA={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}
def get(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60) as r: return r.read(25*1024*1024+1)
  except Exception:
   if attempt==2: raise
   time.sleep(2)
def api(**kw): return json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',**kw))))
def plain(s): return html.unescape(re.sub('<[^>]+>',' ',s or '')).strip()
m=json.load(open(ROOT/'data/media.json')); targets={k:v for k,v in m['species'].items() if 1+len(v.get('inat',[]))<4 and k not in ['aestivalis','nuda']}
existing='\n'.join(p.read_text(errors='ignore') for folder in ['data','incoming/photo-enrichment-2026-10-18'] for p in (ROOT/folder).rglob('*.json'))
existing=urllib.parse.unquote(existing).replace('_',' ')
(B/'originals').mkdir(exist_ok=True);(B/'metadata').mkdir(exist_ok=True)
oldsha=set()
for p in (ROOT/'incoming/photo-enrichment-2026-10-18').rglob('*'):
 if p.is_file() and p.suffix.lower() in ['.jpg','.jpeg','.png']:oldsha.add(hashlib.sha1(p.read_bytes()).hexdigest())
allrecords=[]; rejects=[]
def one_target(item):
 k,v=item;latin=v['latin'];taxon=re.split(r' \(| s\.l\.',latin)[0]; aliases=[taxon]
 if k=='cyclocybe-aegerita':aliases=['Cyclocybe aegerita','Agrocybe aegerita','Cyclocybe cylindracea']
 records=[]
 for alias in aliases:
  try:
   d=api(generator='categorymembers',gcmtitle='Category:'+alias,gcmtype='file',gcmlimit=40,prop='imageinfo|categories',iiprop='url|size|sha1|extmetadata',cllimit=100)
   pages=list(d.get('query',{}).get('pages',{}).values())
   if not pages:
    d=api(generator='search',gsrsearch='filetype:bitmap "'+alias+'"',gsrnamespace=6,gsrlimit=30,prop='imageinfo|categories',iiprop='url|size|sha1|extmetadata',cllimit=100);pages=list(d.get('query',{}).get('pages',{}).values())
   (B/'metadata'/f'{k}-{aliases.index(alias)}-api.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
   for p in pages:
    info=p.get('imageinfo',[{}])[0];e=info.get('extmetadata',{});val=lambda n:plain(e.get(n,{}).get('value',''))
    title=p['title'];lic=val('LicenseShortName');desc=val('ImageDescription');cats=[x['title'] for x in p.get('categories',[])]
    if title.replace('_',' ') in existing:continue
    if not re.match(r'^(CC0|CC BY(?:-SA)?(?: |$))',lic) or not val('LicenseUrl') or not val('Artist'):continue
    if info.get('sha1') in oldsha or info.get('size',1e9)>25*1024*1024:continue
    if not urllib.parse.urlparse(info.get('url','')).path.lower().endswith(('.jpg','.jpeg','.png')):continue
    if not any(a.lower() in (desc+' '+' '.join(cats)).lower() for a in aliases):continue
    if min(info.get('width',0),info.get('height',0))<500:continue
    if re.search('spore|microscop|illustrat|drawing|stamp|icon|plate|distribution',title,re.I):continue
    records.append({'target_key':k,'latin':latin,'source_title':title,'source_description':desc,'source_categories':cats,'page':info['descriptionurl'],'author':val('Artist'),'license':lic,'licenseUrl':val('LicenseUrl'),'sourceImage':info['url'],'commons_sha1':info['sha1'],'width':info['width'],'height':info['height']})
   if len(records)>=4:break
  except Exception as ex: rejects.append({'target':k,'reason':str(ex)})
 # spread authors rather than near-identical sequential pictures
 selected=[];authorcounts={}
 for r in sorted(records,key=lambda x:(len(x['source_title']),x['source_title'])):
  if authorcounts.get(r['author'],0)>=2:continue
  selected.append(r);authorcounts[r['author']]=authorcounts.get(r['author'],0)+1
  if len(selected)>=4:break
 output=[]
 for i,r in enumerate(selected,1):
  try:
   raw=get(r['sourceImage']); sha=hashlib.sha1(raw).hexdigest()
   if sha!=r['commons_sha1']:raise ValueError('SHA1 mismatch')
   id=f'pe2-main-{k}-{i:02}';p=B/'originals'/(id+Path(urllib.parse.urlparse(r['sourceImage']).path).suffix.lower());p.write_bytes(raw)
   r.update(id=id,original=str(p.relative_to(ROOT)),sha256_original=hashlib.sha256(raw).hexdigest());output.append(r)
  except Exception as ex:rejects.append({'target':k,'title':r['source_title'],'reason':str(ex)})
 print(k,len(output),flush=True);return output
with ThreadPoolExecutor(max_workers=3) as pool:
 for fut in as_completed([pool.submit(one_target,x) for x in targets.items()]):allrecords+=fut.result()
(B/'candidates.json').write_text(json.dumps({'photos':allrecords,'rejected':rejects},ensure_ascii=False,indent=2))
for start in range(0,len(allrecords),12):
 chunk=allrecords[start:start+12];sheet=Image.new('RGB',(1600,4*320),'#eeeeee');draw=ImageDraw.Draw(sheet)
 for j,r in enumerate(chunk):
  im=ImageOps.exif_transpose(Image.open(ROOT/r['original'])).convert('RGB');im.thumbnail((390,275));x=(j%4)*400;y=(j//4)*320;sheet.paste(im,(x+(400-im.width)//2,y));draw.text((x+5,y+278),r['id'],fill='black');draw.text((x+5,y+296),r['author'][:45],fill='black')
 sheet=sheet.crop((0,0,1600,((len(chunk)+3)//4)*320));sheet.save(B/f'original-review-{start//12+1:02}.jpg',quality=90)
print('TOTAL',len(allrecords))
