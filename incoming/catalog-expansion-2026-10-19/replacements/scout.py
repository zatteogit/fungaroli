import urllib.request,urllib.parse,urllib.error,json,time,re,html,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
B=Path(__file__).resolve().parent;R=B.parents[2];UA={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}
T=[('satanas','Rubroboletus satanas'),('virescens','Russula virescens'),('felleus','Tylopilus felleus'),('aereus','Boletus aereus')]
for d in ['metadata','previews','originals','prepared']:(B/d).mkdir(exist_ok=True)
last={};network=json.loads((B/'network.json').read_text()) if (B/'network.json').exists() else []
def get(u,cap=25000000):
 host=urllib.parse.urlparse(u).netloc;delay=8 if host=='upload.wikimedia.org' else 3;time.sleep(max(0,delay-(time.time()-last.get(host,0))))
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=45) as r:
   b=r.read(cap+1);network.append(dict(url=u,status=r.status,bytes=len(b)))
  last[host]=time.time()
  if len(b)>cap:raise ValueError('File oltre limite')
  (B/'network.json').write_text(json.dumps(network,indent=2));return b
 except urllib.error.HTTPError as e:
  last[host]=time.time();network.append(dict(url=u,status=e.code,retry_after=e.headers.get('Retry-After')));(B/'network.json').write_text(json.dumps(network,indent=2))
  if e.code in [403,429]:(B/'NETWORK-STOP.json').write_text(json.dumps(network[-1],indent=2));raise SystemExit(f'STOP {e.code} Retry-After {e.headers.get("Retry-After")}')
  raise

def api(p):return json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',**p))))
def clean(s):return ' '.join(html.unescape(re.sub('<[^>]*>',' ',s or '')).split())
if __name__=='__main__':
 existing=(R/'data/media.json').read_text();rows=[]
 for key,taxon in T:
  d=api(dict(generator='search',gsrsearch='"'+taxon+'" filetype:bitmap',gsrnamespace=6,gsrlimit=30,prop='imageinfo|categories',iiprop='url|extmetadata|sha1|size',iiurlwidth=700,cllimit=50));(B/'metadata'/(key+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2));part=[]
  for p in sorted(d.get('query',{}).get('pages',{}).values(),key=lambda x:x.get('index',0)):
   ii=p.get('imageinfo',[{}])[0];m=ii.get('extmetadata',{});val=lambda k:clean(m.get(k,{}).get('value',''));license=val('LicenseShortName');lu=val('LicenseUrl');desc=val('ImageDescription');cats=[x['title'] for x in p.get('categories',[])];text=' '.join([p['title'],desc,*cats]).lower()
   if p['title'].replace('File:','').replace(' ','_') in existing or ii.get('descriptionurl','') in existing or ii.get('url','') in existing:continue
   if ii.get('size',99999999)>25000000 or min(ii.get('width',0),ii.get('height',0))<650:continue
   if not (license.startswith('CC BY') or license=='CC0') or not lu or not val('Artist'):continue
   if any(w in text for w in ['illustration','drawing','stamp','diorama','modell','museum','collage','microscop']):continue
   if taxon.lower() not in text and not (key=='satanas' and 'boletus satanas' in text):continue
   # Avoid ambiguous overseas virescens complex as Italian cover candidate.
   if key=='virescens' and any(w in text for w in ['new jersey','north america','united states','laos','thailand','taiwan','japan','south korea']):continue
   part.append(dict(id=f'ce1-replace-{key}-{len(part)}',target_group='species' if key in ['aereus','virescens'] else 'lookalikes',target_key=key if key in ['aereus','virescens'] else taxon,latin=taxon,photo_taxon=taxon,source='Wikimedia Commons',source_title=p['title'],source_description=desc,source_categories=cats,page=ii['descriptionurl'],author=val('Artist'),license=license,licenseUrl=lu if lu.startswith('https:') else 'https:'+lu,sourceImage=ii['url'],previewImage=ii.get('thumburl',ii['url']),commons_sha1=ii['sha1'],size=ii['size'],attribution_required_text=val('Attribution'),api_metadata=str((B/'metadata'/(key+'.json')).relative_to(R))))
  # Favor assessed images while preserving choice for visual scrutiny.
  part.sort(key=lambda p:('Category:Quality images' not in p['source_categories'],p['id']))
  part=part[:8]
  for i,p in enumerate(part):
   p['candidate_index']=i;target=B/'previews'/(p['id']+'.jpg');target.write_bytes(get(p['previewImage']));p['preview_file']=str(target.relative_to(R));print(key,i,p['source_title'],flush=True)
  sheet=Image.new('RGB',(1400,360*((len(part)+3)//4)),'white');draw=ImageDraw.Draw(sheet)
  for i,p in enumerate(part):
   im=Image.open(R/p['preview_file']).convert('RGB');im.thumbnail((345,315));x=(i%4)*350;y=(i//4)*360;sheet.paste(im,(x+(345-im.width)//2,y));draw.text((x,y+320),str(i)+' '+p['source_title'][:44],fill='black')
  sheet.save(B/(key+'-candidates.jpg'));rows.extend(part);(B/'candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
