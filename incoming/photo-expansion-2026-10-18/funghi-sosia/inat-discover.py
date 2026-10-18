"""Read-only iNaturalist API source discovery, serial >=3 s, no photo downloads."""
import urllib.request,urllib.parse,json,time,re,hashlib
from pathlib import Path
ROOT=Path.cwd();OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia';CACHE=OUT/'inat-metadata';CACHE.mkdir(exist_ok=True)
UA='Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'
def api(params,cache):
 if cache.exists():return json.load(open(cache))
 time.sleep(3.2)
 url='https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode(params)
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=45) as r:d=json.load(r)
 except Exception as e:
  (OUT/'inat-api-error.json').write_text(json.dumps({'url':url,'error':str(e)}));raise
 cache.write_text(json.dumps(d,ensure_ascii=False,indent=2));return d
media=json.load(open('data/media.json'));poor={k:v for k,v in media['lookalikes'].items() if len(v.get('inat',[]))+bool(v.get('ref'))==1}
obsmap={}
for k,v in poor.items():
 for ph in v.get('inat',[]):
  mt=re.search(r'/observations/(\d+)',ph.get('page',''))
  if mt:obsmap[mt.group(1)]=k
current=api({'id':','.join(obsmap),'per_page':200},CACHE/'existing-observations.json');taxa={}
for obs in current.get('results',[]):
 k=obsmap.get(str(obs['id']));t=obs.get('taxon',{})
 if k and t.get('name','').lower()==k.lower() and t.get('rank')=='species':taxa[k]=t['id']
 else:
  if k: print('taxon differing:',k,t.get('name'),flush=True)
# Conservative source acquisition uses exact matching taxon, no substitution for related taxa.
existing_pages=set()
for grp in ['species','lookalikes']:
 for v in media[grp].values():
  for ph in ([v['ref']] if v.get('ref') else [])+v.get('inat',[]):existing_pages.add(ph.get('page'))
commonsplan=json.load(open(OUT/'download-plan.json'));commonsids=set()
for row in commonsplan:
 for match in re.findall(r'observations/(\d+)',row.get('source_description','')):commonsids.add(int(match))
# Exclude independent-platform copies of the very same Commons source observation.
selected_titles={row['source_title'] for row in commonsplan}
for metapath in (OUT/'metadata').glob('*.json'):
 for page_data in json.load(open(metapath)).get('query',{}).get('pages',{}).values():
  if page_data.get('title') in selected_titles:
   for ident in re.findall(r'inaturalist.org/observations/(\d+)',json.dumps(page_data)):
    commonsids.add(int(ident))
rows=[];rejected=[]
priority=['Inocybe lilacina','Chlorophyllum venenatum','Craterellus cinereus','Sarcodon scabrosus','Tricholoma pardinum']+list(taxa)
for k in dict.fromkeys(priority):
 if k not in taxa:continue
 d=api({'taxon_id':taxa[k],'quality_grade':'research','photo_license':'cc0,cc-by,cc-by-sa','photos':'true','geo':'true','swlat':35,'swlng':-12,'nelat':71,'nelng':35,'per_page':8,'order_by':'votes','order':'desc'},CACHE/(k.replace(' ','-')+'.json'))
 for obs in d.get('results',[]):
  page='https://www.inaturalist.org/observations/'+str(obs['id']);t=obs.get('taxon',{})
  if page in existing_pages or obs['id'] in commonsids:continue
  if t.get('name','').lower()!=k.lower() or t.get('rank')!='species':rejected.append({'taxon':k,'id':obs['id'],'reason':'taxon differs'});continue
  for ph in obs.get('photos',[])[:2]:
   lic=ph.get('license_code');url=ph.get('url','')
   if ph.get('hidden') or ph.get('flags'):continue
   if lic not in ['cc0','cc-by','cc-by-sa'] or '/square.' not in url:continue
   photoid=ph['id'];fid='pe2-sosia-'+k.lower().replace(' ','-')+'-inat-'+str(photoid)
   rows.append(dict(id=fid,target_group='lookalikes',target_key=k,latin=k,page=page,source='iNaturalist (research grade)',observation_id=obs['id'],photo_id=photoid,taxon_id=t['id'],sourceImage=url.replace('/square.','/original.'),original=str((OUT/'originals'/(fid+Path(urllib.parse.urlparse(url).path).suffix)).relative_to(ROOT)),license={'cc0':'CC0','cc-by':'CC BY 4.0','cc-by-sa':'CC BY-SA 4.0'}[lic],licenseUrl={'cc0':'https://creativecommons.org/publicdomain/zero/1.0/','cc-by':'https://creativecommons.org/licenses/by/4.0/','cc-by-sa':'https://creativecommons.org/licenses/by-sa/4.0/'}[lic],author=ph.get('attribution',''),attribution=ph.get('attribution',''),source_description=obs.get('description'),place_guess=obs.get('place_guess'),location=obs.get('location'),quality_grade=obs.get('quality_grade'),identifications_count=obs.get('identifications_count'),observed_on=obs.get('observed_on'),editorial_precheck='Nome scientifico esatto nella risposta API; osservazione research grade nell’area europea. Stato comunitario, non determinazione di un micologo ufficiale. Licenza della singola foto verificata. Non scaricata.',visual_review={'approved':False,'attribution_approved':False}))
  if sum(r['target_key']==k for r in rows)>=4:break
 print(k,len([r for r in rows if r['target_key']==k]),flush=True)
 (OUT/'inat-download-plan.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
(OUT/'inat-rejected.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2));print('DONE',len(rows),len(taxa),flush=True)
