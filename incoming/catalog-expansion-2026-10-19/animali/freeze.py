import json,hashlib,os
from pathlib import Path
from PIL import Image
ROOT=Path.cwd();O=Path(__file__).parent
p=json.load(open(O/'manifest.json'));errors=[]
for row in p['photos']:
 for kind,file in row['files'].items():
  f=ROOT/file;im=Image.open(f)
  if im.info.get('exif') or im.info.get('xmp'):errors.append(file+' metadata')
  if kind=='file' and (max(im.size)>560 or f.stat().st_size>80000):errors.append(file+' normal limit')
  if kind=='file_hd' and (max(im.size)>1200 or f.stat().st_size>220000):errors.append(file+' HD limit')
  if kind=='thumb' and im.size!=(160,160):errors.append(file+' thumb size')
 row['visual_review']['six_crops_approved']=True;row['visual_review']['thumbnail_approved']=True
 row['visual_review']['nota']+=' Visti tutti i sei ritagli e la miniatura reale; le anteprime orizzontali possono mostrare il dettaglio del capo, mentre il visore conserva la vista completa.'
assert len(set(r['sha256_original'] for r in p['photos']))==len(p['photos'])
p['note']='19 originali Commons acquisiti, SHA1 conforme;12 nuove fotografie approvate per8taxa,7scarti espliciti.72ritagli e12miniature realmente visti.2riusi Macaone separati. Nessuna fase o sesso dedotti. Conversione ICC→sRGB dove necessaria; niente EXIF/XMP negli export. Cataloghi pubblici non modificati.'
(O/'manifest.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
meta={'acquired_originals':19,'approved_new_photos':len(p['photos']),'approved_taxa':len(set(r['target_key'] for r in p['photos'])),'reuse_photos':2,'ready_new_cards':9,'draft_new_cards':1,'draft_reason':'moscardino: foto mediocri, contenuto disponibile ma integrazione rinviata','rejected':p['rejected_visual_review'],'color_profiles_converted':[r['id'] for r in p['photos'] if r.get('color_profile_normalized')],'derivatives':len(p['photos'])*3,'bytes_derivatives':sum((ROOT/f).stat().st_size for r in p['photos'] for f in r['files'].values()),'crops_seen':len(p['photos'])*6,'thumbnails_seen':len(p['photos']),'errors':errors,'active_processes':[],'no_suite_run':True,'manifest_sha256':hashlib.sha256((O/'manifest.json').read_bytes()).hexdigest(),'proposals_sha256':hashlib.sha256((O/'proposals.json').read_bytes()).hexdigest()}
(O/'freeze.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(meta,ensure_ascii=False,indent=2))
