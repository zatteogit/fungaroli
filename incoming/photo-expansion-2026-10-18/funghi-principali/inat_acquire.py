import urllib.request,urllib.parse,urllib.error,json,re,time,hashlib,sys
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;ROOT=B.parents[2];m=json.load(open(ROOT/'data/media.json'));commons=json.load(open(B/'manifest.json'))['photos'];represented={r['target_key'] for r in commons};targets={k:v for k,v in m['species'].items() if 1+len(v.get('inat',[]))<4 and k not in represented|{'aestivalis','nuda','morchella-esculenta','morchella-elata'}}
UA={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'};last=0;out=[];reject=[];stopped=False
existing=(ROOT/'data/media.json').read_text();last=0
licenses={'cc0':('CC0','https://creativecommons.org/publicdomain/zero/1.0/'),'cc-by':('CC BY 4.0','https://creativecommons.org/licenses/by/4.0/'),'cc-by-sa':('CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/')}
def get(u,photo=False):
 global last
 if photo:time.sleep(max(0,4-(time.monotonic()-last)))
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=45) as r:
   raw=r.read(25000001)
   if photo:last=time.monotonic()
   return raw
 except urllib.error.HTTPError as ex:
  reject.append({'url':u,'status':ex.code,'retry_after':ex.headers.get('Retry-After')})
  if ex.code in [403,429]:raise
  return None
try:
 for k,v in targets.items():
  taxon=re.split(r' \(| s\.l\.',v['latin'])[0];aliases=[taxon]
  if k=='cyclocybe-aegerita':aliases+=['Cyclocybe aegerita','Agrocybe aegerita']
  q=dict(taxon_name=taxon,quality_grade='research',photos='true',photo_license='cc0,cc-by,cc-by-sa',per_page=25,place_id=6973,order_by='votes',order='desc')
  raw=get('https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(q));d=json.loads(raw);(B/'metadata'/f'{k}-inat-api.json').write_bytes(raw);n=0
  for o in d.get('results',[]):
   t=o.get('taxon',{});name=t.get('name','')
   if name not in aliases or t.get('rank')!='species' or o.get('quality_grade')!='research' or str(o['id']) in existing:continue
   if o.get('taxon',{}).get('provisional') or o.get('captive'):continue
   for op in o.get('observation_photos',[]):
    p=op['photo'];code=p.get('license_code');dim=p.get('original_dimensions',{})
    if code not in licenses or p.get('hidden') or p.get('flags') or min(dim.get('width',0),dim.get('height',0))<700:continue
    u=p['url'].replace('/square.','/original.');id=f'pe2-main-{k}-inat{n+1:02}';suffix=Path(urllib.parse.urlparse(u).path).suffix.lower();f=B/'originals'/(id+suffix);pic=get(u,True)
    if not pic or len(pic)>25000000:continue
    try:
     im=Image.open(__import__('io').BytesIO(pic));im.verify()
    except Exception:continue
    f.write_bytes(pic);lic,link=licenses[code];attr=p.get('attribution','');author=re.sub(r'^\(c\)\s*','',attr).split(',')[0]
    if not author:author=o['user'].get('name') or o['user']['login']
    r=dict(id=id,target_group='species',target_key=k,latin=v['latin'],original=str(f.relative_to(ROOT)),sha256_original=hashlib.sha256(pic).hexdigest(),commons_sha1=None,source_sha1=None,source='iNaturalist',source_title=f"iNaturalist observation {o['id']}, photo {p['id']}",source_description=o.get('description') or f"{name}; research grade; {o.get('place_guess','Italy')}",source_categories=[name,'research grade','Italy'],page=f"https://www.inaturalist.org/observations/{o['id']}",author=author,license=lic,licenseUrl=link,sourceImage=u,source_attribution=attr,observationID=o['id'],photoID=p['id'],quality_grade='research',source_taxon=name,photo_license_code=code,source_location=o.get('place_guess','Italy'),source_api='https://api.inaturalist.org/v1/observations/'+str(o['id']),source_html_status='www.inaturalist.org photo page unavailable: HTTP403; official API used')
    out.append(r);n+=1;break
   if n>=2:break
  print(k,n,flush=True)
except urllib.error.HTTPError as ex:stopped=True;print('STOP',ex.code,flush=True)
finally:
 (B/'inat-candidates.json').write_text(json.dumps({'photos':out,'rejected':reject,'stopped':stopped},ensure_ascii=False,indent=2))
 for start in range(0,len(out),12):
  chunk=out[start:start+12];sh=Image.new('RGB',(1600,((len(chunk)+3)//4)*340),'#eee');dr=ImageDraw.Draw(sh)
  for j,r in enumerate(chunk):
   im=ImageOps.exif_transpose(Image.open(ROOT/r['original'])).convert('RGB');im.thumbnail((390,290));x=j%4*400;y=j//4*340;sh.paste(im,(x+(400-im.width)//2,y));dr.text((x+5,y+295),r['id'],fill='black');dr.text((x+5,y+313),r['author'][:45],fill='black')
  sh.save(B/f'inat-original-review-{start//12+1:02}.jpg',quality=92)
 print('TOTAL',len(out),flush=True)
