import json,urllib.request,urllib.parse,time,html,re,hashlib
from pathlib import Path
OUT=Path(__file__).parent; ROOT=Path.cwd()
UA='Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'
def plain(s):return ' '.join(html.unescape(re.sub('<[^>]+>',' ',s or '')).split())
p=json.load(open(OUT/'proposals.json'))
existing=json.load(open('data/animals.json'))
reuse=[]
for i in existing['items']:
 if i['id']=='farfalle-diurne':
  for photo in i['photos']:
   if 'Papilio machaon' in json.dumps(photo):reuse.append(dict(target_key='macaone',photo=photo,status='reuse-existing-not-new-acquisition',role='Adulto: riuso della vista esatta già catalogata, senza duplicare file.'))
(OUT/'reuse-photos.json').write_text(json.dumps(reuse,ensure_ascii=False,indent=2)+'\n')
for i in p['items']:
 cache=OUT/'metadata'/(i['id']+'.json')
 if cache.exists():continue
 query='intitle:"'+i['latin']+'"'
 if i['id']=='macaone':query+=' (caterpillar OR larva OR pupa OR chrysalis)'
 params=dict(action='query',generator='search',gsrsearch=query,gsrnamespace=6,gsrlimit=25,prop='imageinfo|categories',iiprop='url|size|sha1|extmetadata',cllimit=100,format='json')
 try:
  req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params),headers={'User-Agent':UA})
  with urllib.request.urlopen(req,timeout=60) as r:data=json.load(r)
  cache.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
  print(i['id'],len(data.get('query',{}).get('pages',{})),flush=True)
 except Exception as e: print(type(e).__name__,str(e),flush=True);break
 time.sleep(3.2)
# candidates sorted, visual remains pending until central acquired bytes arrive
candidates=[]; reject=[]
for i in p['items']:
 cache=OUT/'metadata'/(i['id']+'.json')
 if not cache.exists():continue
 for page in json.load(open(cache)).get('query',{}).get('pages',{}).values():
  if not page.get('imageinfo'):continue
  ii=page['imageinfo'][0];ex=ii.get('extmetadata',{}); f=lambda k:plain(ex.get(k,{}).get('value',''))
  title=page['title'];desc=f('ImageDescription');cats=f('Categories');tax=desc+' '+cats
  why=''
  if i['latin'].lower() not in tax.lower():why='Nome esatto non documentato nella descrizione/categorie del singolo file.'
  if not re.match(r'^(CC0|CC BY |CC BY-SA )',f('LicenseShortName')) or not f('LicenseUrl') or not f('Artist'):why='Licenza/autore/link incompleti o fuori preferenza.'
  if not re.search(r'\.(jpe?g|png)$',title,re.I):why='Non foto raster.'
  if ii['size']>25_000_000 or min(ii['width'],ii['height'])<600:why='Dimensioni fuori requisiti.'
  if re.search(r'drawing|illustration|museum specimen|skull|dead |roadkill|taxiderm|stuffed|mounted|skin of|collage|distribution|\bmap\b',title+' '+desc,re.I):why='Esemplare morto, illustrazione o materiale non adatto alla scheda.'
  if i['id']=='gatto-selvatico' and re.search('catus|hybrid|bicolor|lybica',tax,re.I):why='Taxon domestico/ibrido/africano.'
  if why: reject.append(dict(target_key=i['id'],source_title=title,reason=why));continue
  ident='ce26-animali-'+i['id']+'-'+hashlib.sha1(title.encode()).hexdigest()[:8]
  role='Soggetto intero leggibile e caratteri esterni: candidatura da valutare sui byte originali.'
  if i['id']=='macaone':role='Fase complementare all’adulto riusato: adottare solo se la descrizione documenta larva o crisalide.'
  score=0
  if re.search('featured pictures|quality images|valued images',cats,re.I):score+=4
  if re.search('zoo|captive|park|tierpark|wildlife centre|reserve',desc,re.I):score-=1
  if re.search('Italy|Italia|France|Germany|Deutschland|Spain|Switzerland|Austria|Czech|Poland|Europe|Finland|Sweden|Netherlands|United Kingdom',desc+' '+cats,re.I):score+=2
  candidates.append(dict(id=ident,target_group='animals',target_key=i['id'],latin=i['latin'],source_title=title,source_description=desc,source_categories=cats,page=ii['descriptionurl'],author=f('Artist'),license=f('LicenseShortName'),licenseUrl=f('LicenseUrl'),attribution_requested=f('Attribution'),sourceImage=ii['url'],originalURL=ii['url'],commons_sha1=ii['sha1'],original=str(OUT/'originals'/(ident+'.jpg')),width=ii['width'],height=ii['height'],size=ii['size'],role=role,metadata_score=score,visual_review={'approved':False,'status':'pending-original-acquisition'},metadata_file=str(cache)))
(OUT/'photo-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2)+'\n')
(OUT/'photo-rejections.json').write_text(json.dumps(reject,ensure_ascii=False,indent=2)+'\n')
print('candidates',len(candidates),'reuse',len(reuse),flush=True)
