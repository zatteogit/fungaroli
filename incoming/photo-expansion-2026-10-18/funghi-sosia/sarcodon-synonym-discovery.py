import json,time,urllib.request,urllib.parse,re
from pathlib import Path
ROOT=Path.cwd();OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia'
evidence={'canonical_record':'Sarcodon scabrosus','source_taxon':'Hydnellum scabrosum','inat_taxon_id':931835,'relationship':'Nuova combinazione nomenclaturale dello stesso taxon; nessuna modifica dei dati canonici.','primary_source':'https://www.indexfungorum.org/names/NamesRecord.asp?RecordID=222119','primary_source_observed':'Index Fungorum elenca Sarcodon scabrosus e indica Hydnellum scabrosum quale nome corrente; basionimo Hydnum scabrosum.','publication':'Larsson et al., MycoKeys54:42(2019)','doi':'https://doi.org/10.3897/mycokeys.54.35386','limitation':'Identificazione fotografica iNaturalist research grade comunitaria, non certificazione micologica.'}
(OUT/'sarcodon-synonym-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))
p=OUT/'inat-metadata/Sarcodon-scabrosus-via-Hydnellum.json'
if p.exists():d=json.load(open(p))
else:
 time.sleep(3.2);url='https://api.inaturalist.org/v1/observations?'+urllib.parse.urlencode({'taxon_id':931835,'quality_grade':'research','photo_license':'cc0,cc-by,cc-by-sa','photos':'true','geo':'true','swlat':35,'swlng':-12,'nelat':71,'nelng':35,'per_page':10,'order_by':'votes','order':'desc'})
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=45) as r:d=json.load(r)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
rows=[];k='Sarcodon scabrosus'
for obs in d.get('results',[]):
 if obs.get('taxon',{}).get('name')!='Hydnellum scabrosum' or obs.get('taxon',{}).get('rank')!='species':continue
 for ph in obs.get('photos',[]):
  lic=ph.get('license_code');dims=ph.get('original_dimensions') or {};url=ph.get('url','')
  if lic not in ['cc0','cc-by','cc-by-sa'] or ph.get('hidden') or ph.get('flags') or min(dims.get('width',0),dims.get('height',0))<550 or '/square.' not in url:continue
  fid='pe2-sosia-sarcodon-scabrosus-inat-'+str(ph['id']);a=ph['attribution'];author=re.sub(r'^\(c\)\s*','',a).split(', some rights reserved')[0].split(', no rights reserved')[0]
  rows.append(dict(id=fid,target_group='lookalikes',target_key=k,latin=k,source='iNaturalist (research grade)',source_taxon_name='Hydnellum scabrosum',synonym_evidence=str((OUT/'sarcodon-synonym-evidence.json').relative_to(ROOT)),observation_id=obs['id'],photo_id=ph['id'],taxon_id=931835,page='https://www.inaturalist.org/observations/'+str(obs['id']),sourceImage=url.replace('/square.','/original.'),original=str((OUT/'originals'/(fid+Path(urllib.parse.urlparse(url).path).suffix)).relative_to(ROOT)),license={'cc0':'CC0','cc-by':'CC BY 4.0','cc-by-sa':'CC BY-SA 4.0'}[lic],licenseUrl={'cc0':'https://creativecommons.org/publicdomain/zero/1.0/','cc-by':'https://creativecommons.org/licenses/by/4.0/','cc-by-sa':'https://creativecommons.org/licenses/by-sa/4.0/'}[lic],author=author,attribution=a,photo_attribution_original=a,source_description=obs.get('description'),source_metadata=str(p.relative_to(ROOT)),place_guess=obs.get('place_guess'),location=obs.get('location'),quality_grade='research',source_width=dims['width'],source_height=dims['height'],source_title='iNaturalist photo '+str(ph['id']),source_categories=[],alt=k+', fotografia dalla fonte iNaturalist (Hydnellum scabrosum).',caption=k+'.',changes='Orientamento, ridimensionamento e compressione WebP; miniatura quadrata centrata; nessuna modifica cromatica.',editorial_precheck='Nome fonte Hydnellum scabrosum, sinonimia nomenclaturale verificata su Index Fungorum record222119 e API matched_term. Ricerca limitata a osservazioni europee research grade; licenza individuale verificata.',visual_review={'approved':False,'attribution_approved':False}))
  break
 if len(rows)>=4:break
(OUT/'inat-synonym-download-plan.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print([(x['id'],x['place_guess']) for x in rows])
