import urllib.request,urllib.parse,urllib.error,json,time,hashlib,re
from pathlib import Path
B=Path(__file__).resolve().parent;R=B.parents[2];UA={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}
(B/'inat-metadata').mkdir(exist_ok=True)
animals=json.load(open(R/'data/animals.json'))['items'];examples={'bombi':'Bombus terrestris','sirfidi':'Episyrphus balteatus','farfalle-diurne':'Papilio machaon','zecche':'Ixodes ricinus'}
already={'bombi','calabrone-europeo','zecche'}
targets=[('animals',a['id'],a['latin'],examples.get(a['id'],a['latin']))for a in animals if a['publicationStatus']=='ready' and a['id'] not in already]
for k,p in json.load(open(R/'data/plants.json'))['plants'].items():
 if len(p.get('photos',[]))==2 and k!='giglio-rosso':targets.append(('plants',k,p['latin'],re.match('[A-Z][a-z]+ [a-z]+',p['latin']).group()))
results=[];logs=[];last={}
def get(url):
 host=urllib.parse.urlparse(url).hostname;delay=3-(time.time()-last.get(host,0))
 if delay>0:time.sleep(delay)
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=35);b=r.read(25000001);last[host]=time.time()
  if len(b)>25000000:raise ValueError('Originale oltre25MB')
  return b
 except urllib.error.HTTPError as e:
  last[host]=time.time();logs.append(dict(url=url,status=e.code,headers=dict(e.headers)))
  (B/'inat-network.json').write_text(json.dumps(logs,indent=2))
  if e.code in (403,429):raise SystemExit('STOP '+str(e.code)+' '+host)
  raise
for group,key,latin,taxon in targets:
 try:
  params=dict(taxon_name=taxon,quality_grade='research',photos='true',photo_license='cc0,cc-by,cc-by-sa',per_page=6,order_by='votes',captive='false')
  url='https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(params)
  raw=get(url);(B/'inat-metadata'/(key+'.json')).write_bytes(raw);data=json.loads(raw);chosen=None
  for ob in data.get('results',[]):
   if ob.get('taxon',{}).get('name')!=taxon or ob.get('quality_grade')!='research':continue
   if not ob.get('photos'):continue
   ph=ob['photos'][0];lc=ph.get('license_code')
   if lc not in ('cc0','cc-by','cc-by-sa') or ph.get('hidden') or ph.get('flags'):continue
   source=ph['url'].replace('/square.','/original.')
   author=ph.get('attribution','');a=re.sub(r'^\(c\) ','',author).split(', some rights reserved')[0].split(', no rights reserved')[0]
   if not a:continue
   chosen=dict(target_group=group,target_key=key,latin=latin,photo_taxon=taxon,source='iNaturalist (research grade)',source_title=taxon+' · osservazione '+str(ob['id']),source_description=ob.get('description')or'',source_categories=[],page='https://www.inaturalist.org/observations/'+str(ob['id']),author=a,license={'cc0':'CC0 1.0','cc-by':'CC BY 4.0','cc-by-sa':'CC BY-SA 4.0'}[lc],licenseUrl='https://creativecommons.org/'+('publicdomain/zero/1.0/'if lc=='cc0'else'licenses/'+lc[3:]+'/4.0/'),sourceImage=source,attribution=author,quality_grade='research',observation_id=ob['id'],photo_id=ph['id'],observation_taxon=ob['taxon'],photo_license_code=lc,photo_author_attribution=author,source_metadata=str((B/'inat-metadata'/(key+'.json')).relative_to(R)))
   break
  if not chosen:print(key,'NO',flush=True);continue
  body=get(chosen['sourceImage']);sha=hashlib.sha1(body).hexdigest();name='pe2-natura-'+key+'-inat'+str(chosen['photo_id']);ext=Path(urllib.parse.urlparse(chosen['sourceImage']).path).suffix;p=B/'originals'/(name+ext);p.write_bytes(body)
  chosen.update(id=name,original=str(p.relative_to(R)),sha256_original=hashlib.sha256(body).hexdigest(),source_sha1=sha)
  results.append(chosen);(B/'inat-downloaded.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(key,len(body),'OK',flush=True)
 except Exception as e:logs.append(dict(target=key,error=str(e)));print(key,str(e),flush=True)
(B/'inat-network.json').write_text(json.dumps(logs,indent=2))
