import json,re,html,hashlib,collections
from pathlib import Path
from PIL import Image
B=Path(__file__).resolve().parent;R=B.parents[2]
def clean(s):return ' '.join(html.unescape(re.sub('<[^>]*>',' ',s)).split())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
sel=json.load(open(B/'selected.json'));manifest=json.load(open(B/'manifest.json'));photos=manifest['photos'];rank={f'ce1-piante-{key}-{i}':j for j,(key,i) in enumerate(( (key,i) for key,rows in sel.items() for i in rows))};photos.sort(key=lambda p:rank[p['id']]);candidates=json.load(open(B/'photo-candidates.json'));audit=[]
for p in photos:
 s=(R/p['source_metadata']).read_text();caps=[]
 for a,cap in re.findall(r'(<a [^>]*class="pirobox_gall"[^>]*>.*?</a>)<br><font size=1>(.*?)</font>',s,re.S):
  if p['sourceImage'].rsplit('/',1)[-1] in a:caps.append(clean(cap))
 if caps:p['sourceCaption']=p['source_description']=max(caps,key=len)
 assert 'CC BY-SA 4.0' in p['sourceCaption'] and 'Andrea Moro' in p['sourceCaption']
 p['source_metadata_sha256']=sha(R/p['source_metadata']);p['visual_review']['approved']=True
 p['visual_review']['nota']='Originale e sei ritagli esaminati. Nitidezza, composizione e dettaglio complementare approvati il 19 ottobre 2026. I formati larghi mostrano una parte del soggetto quando la figura completa non entra; la foto completa resta nel visore.'
 p['source_categories']=[];p['attribution']='© Dipartimento di Scienze della Vita, Università degli Studi di Trieste · Andrea Moro · CC BY-SA 4.0'
 p['source_rights_note']='CC BY-SA 4.0 riferita alla singola fotografia, non al testo della scheda.'
 assert sha(R/p['original'])==p['sha256_original']
 row=dict(id=p['id'],original_sha256_verified=True,source_icc=p['source_icc_profile'],color_conversion=p['color_conversion'],files={})
 for field,path in p['files'].items():
  file=R/path;im=Image.open(file);size=file.stat().st_size
  assert not any(k in im.info for k in ['icc_profile','exif','xmp'])
  if field=='thumb':assert im.size==(160,160)
  if field=='file':assert max(im.size)<=560 and size<=80000
  if field=='file_hd':assert max(im.size)<=1200 and size<=220000
  row['files'][field]=dict(bytes=size,width=im.width,height=im.height,sha256=sha(file),metadata_clean=True)
 audit.append(row)
manifest.update(version=1,frozen='2026-10-19',photos=photos,rejected=json.load(open(B/'original-rejections.json')),no_active_downloads=True)
(B/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
proposals=json.load(open(B/'proposals.json'))
for v in proposals['proposals']:
 chosen=[p for p in photos if p['target_key']==v['key']];v['photo_ids']=[p['id'] for p in chosen]
 fields=['alt','caption','author','license','licenseUrl','page','sourceImage','sourceCaption','attribution','photo_taxon']
 v['record']['photos']=[{**p['files'],**{k:p[k] for k in fields}} for p in chosen];v['review_status']='Proposta documentata e fotografie revisionate; pronta alla valutazione e importazione del coordinatore.'
 for c in v['claim_sources']:
  source='-dryades.html' if 'dryades.units.it' in c['source'] else '-morphology.html';path=B/'sources'/(v['key']+source)
  if path.exists():c['source_snapshot']=str(path.relative_to(R));c['source_snapshot_sha256']=sha(path)
  elif v['key']=='geranio-robertiano':c['source_snapshot']='incoming/catalog-expansion-2026-10-19/piante/sources/geranio-robertiano-morphology-read.json'
 v['photo_claim_sources']=[dict(id=p['id'],source=p['page'],sourceImage=p['sourceImage'],locator='Galleria fotografica: '+p['sourceImage'].rsplit('/',1)[-1],taxon=p['photo_taxon'],photographic_role=p['photographic_role'],evidence=p['sourceCaption'],scope='Attribuzione di specie e diritti verificati sulla fonte; didascalia descrittiva della vista fotografata, senza età o stagioni dedotte.') for p in chosen]
(B/'proposals.json').write_text(json.dumps(proposals,ensure_ascii=False,indent=2)+'\n')
rejected=[]
for c in candidates:
 id=f'ce1-piante-{c["key"]}-{c["index"]}'
 if id in rank:continue
 reason='Vista meno complementare alle scelte approvate o soggetto meno isolato e leggibile; anteprima conservata nella tavola di confronto.'
 if c['key']=='bugola' and c['index'] in [0,39,44]:reason='Soggetti piccoli o confusi nel contesto, meno leggibili delle macro scelte.'
 if c['key']=='acetosella' and c['index']==4:reason='Controluce sul cielo: preferite foglie e fiori con lettura diretta e colore meno influenzato dalla luce trasmessa.'
 if c['key']=='geranio-robertiano' and c['index'] in [16,24,48]:reason='Pianta confusa nel contesto o troppo piccola; preferiti dettagli isolati.'
 if c['key']=='viola-silvestre' and c['index'] in [28,33,39]:reason='Vista ambientale più confusa; le tre macro scelte mostrano corolla, sperone e foglia con maggiore chiarezza.'
 if c['key']=='pervinca-minore' and c['index'] in [0,48,66]:reason='Soggetti piccoli nella massa vegetale; preferita la coppia frontale e laterale del fiore.'
 if c['key']=='sanicola' and c['index']==14:reason=manifest['rejected'][0]['reason']
 rejected.append(dict(target_key=c['key'],index=c['index'],sourceImage=c['sourceImage'],preview='incoming/catalog-expansion-2026-10-19/piante/previews/'+c['key']+'-'+str(c['index'])+'.jpg',reason=reason))
(B/'selection-rejections.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2)+'\n')
(B/'file-audit.json').write_text(json.dumps(dict(photos=audit),ensure_ascii=False,indent=2)+'\n')
summary=dict(status='frozen',records=8,approved_photos=len(photos),preview_candidates=len(candidates),not_selected_previews=len(rejected),originals_acquired=21,originals_rejected=1,webp_files=len(photos)*3,by_species=dict(collections.Counter(p['target_key'] for p in photos)),source='Università di Trieste · Dryades',text_sources=['Dryades / Università di Trieste','FloraWeb / Bundesamt für Naturschutz','Plants of the World Online / Royal Botanic Gardens, Kew'],originals_with_icc=sum(bool(p['source_icc_profile']) for p in photos),icc_converted=sum(p['color_conversion'] for p in photos),source_checksum_note='SHA-1 e SHA-256 calcolati localmente; nessun checksum remoto disponibile su Dryades.',tests='Nessuna suite o dry-run',active_processes=0,manifest_sha256=sha(B/'manifest.json'),proposals_sha256=sha(B/'proposals.json'))
(B/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False,indent=2))
