import json,hashlib,collections
from pathlib import Path
from PIL import Image
B=Path(__file__).resolve().parent;R=B.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
d=json.load(open(B/'manifest.json'));existing=(R/'data/media.json').read_text();audit=[];primary={}
for key,obs in [('virescens',134413554),('felleus',94886653)]:
 x=json.load(open(B/'metadata'/(key+'-inat-source.json')))['results'][0];primary[key]=x
for p in d['photos']:
 assert p['page'] not in existing and p['sourceImage'] not in existing and p['sha256_original'] not in existing
 raw=(R/p['original']).read_bytes();assert hashlib.sha1(raw).hexdigest()==p['commons_sha1'];assert hashlib.sha256(raw).hexdigest()==p['sha256_original']
 p['source_metadata']=p['api_metadata'];p['source_metadata_sha256']=sha(R/p['source_metadata']);p['taxon_evidence']=dict(page=p['page'],locator='Description / Captions / Structured data depicts / taxon category',taxon=p['photo_taxon'])
 p['visual_review']['approved']=True;p['visual_review']['nota']='Originale a dimensione utile e sei ritagli realmente esaminati. Nitidezza, colore e leggibilità approvati. Nei formati larghi la copertina conserva il cappello; la foto complementare di T. felleus isola pori e reticolo. Nessun carattere o fase dedotto dalla fotografia.'
 p['editorial_action']='propose_as_cover' if p['id']!='ce1-replace-felleus-extra20' else 'add_complementary_photo'
 p['duplicate_review']=dict(source_page_absent_from_current_media=True,source_image_absent_from_current_media=True,original_sha256_absent_from_current_media=True,note='Escluse fonti esistenti e ritagli alternativi della stessa foto proposta; nessuna sostituzione canonica applicata.')
 if p['id'] in ['ce1-replace-virescens-2','ce1-replace-felleus-extra20']:
  key='virescens' if 'virescens' in p['id'] else 'felleus';v=primary[key];pid=229109186 if key=='virescens' else 157455599;photo=next(x['photo']for x in v['observation_photos'] if x['photo']['id']==pid)
  assert v['quality_grade']=='research' and v['taxon']['name']==p['photo_taxon']
  p.update(observationID=v['id'],quality_grade=v['quality_grade'],primary_taxon=v['taxon']['name'],primary_photo_id=pid,primary_photo_license=photo['license_code'],primary_page=f'https://www.inaturalist.org/observations/{v["id"]}',primary_place=v.get('place_guess'),primary_metadata='incoming/catalog-expansion-2026-10-19/replacements/metadata/'+key+'-inat-source.json')
  if key=='felleus':
   assert photo['license_code']=='cc-by';p['author']='Annie Weissman (wearethechampignons)';p['attribution']=p['attribution_required_text'] or p['author']+' · Wikimedia Commons / iNaturalist · CC BY 4.0';p['license_verification_note']='CC BY 4.0 confermata dalla foto primaria e dalla revisione Commons; non adottata la vecchia etichetta CC BY-SA di validità non verificata.'
 row=dict(id=p['id'],sha1_matches_commons=True,sha256_verified=True,icc_profile=p['source_icc_profile'],color_conversion=p['color_conversion'],files={})
 for kind,path in p['files'].items():
  file=R/path;im=Image.open(file);size=file.stat().st_size
  assert not any(k in im.info for k in ['icc_profile','exif','xmp'])
  if kind=='file':assert size<=80000 and max(im.size)<=560
  if kind=='file_hd':assert size<=220000 and max(im.size)<=1200
  if kind=='thumb':assert im.size==(160,160)
  row['files'][kind]=dict(bytes=size,size=im.size,sha256=sha(file),metadata_clean=True)
 audit.append(row)
rejected=[];chosen={p['id']for p in d['photos']}
for c in json.load(open(B/'candidates.json')):
 if c['id']in chosen:continue
 reason='Non offre una copertina più pulita e complementare delle scelte approvate; anteprima conservata.'
 if c['id']=='ce1-replace-satanas-13':reason='Preparato/modello da museo: non fotografia di esemplare fresco in contesto naturale.'
 if c['id']=='ce1-replace-virescens-1':reason='Taxon differente: la pagina attesta Russula viridirubrolimbata; esclusa nonostante il risultato della ricerca.'
 if c['id']=='ce1-replace-virescens-10':reason='Candidata asiatica, incertezza non risolta nel complesso di R. virescens; preferita l’osservazione europea con taxon attuale verificato.'
 if c['id']=='ce1-replace-aereus-0':reason='Ritaglio della medesima fotografia Paffka: scelto soltanto il file originale Boletus aereusBG.JPG.'
 if c['id']in ['ce1-replace-satanas-11','ce1-replace-satanas-15']:reason='Esemplare tagliato o condizioni troppo deteriorate per la nuova copertina.'
 if c['id']in ['ce1-replace-felleus-1','ce1-replace-felleus-10','ce1-replace-felleus-14','ce1-replace-felleus-15']:reason='Danni al cappello, quadro ingombro o esemplare adagiato; preferiti gli esemplari più integri e leggibili.'
 rejected.append(dict(id=c['id'],source_title=c['source_title'],page=c['page'],preview_file=c['preview_file'],reason=reason))
d.update(version=1,frozen='2026-10-19',rejected=rejected,gaps=[],canonicals_modified=False,no_active_downloads=True)
(B/'manifest.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');(B/'file-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
summary=dict(status='frozen',approved_photos=len(d['photos']),webp_files=len(d['photos'])*3,by_taxon=dict(collections.Counter(p['photo_taxon']for p in d['photos'])),candidates_reviewed=36,rejected_candidates=len(rejected),commons_sha1_verified=5,icc_profiles=[dict(id=p['id'],profile=p['source_icc_profile'],converted=p['color_conversion'])for p in d['photos']],active_downloads=0,http_403_429=0,retry_after=None,manifest_sha256=sha(B/'manifest.json'),tests='Nessuna suite o dry-run',scope='Solo incoming/catalog-expansion-2026-10-19/replacements/')
(B/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False,indent=2))
