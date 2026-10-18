import json,importlib.util,hashlib,html,re,io
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageCms
B=Path(__file__).resolve().parent;R=B.parents[2]
def load_rgb(path):
 raw=Image.open(path);icc=raw.info.get('icc_profile');image=ImageOps.exif_transpose(raw)
 if icc:
  profile=ImageCms.ImageCmsProfile(io.BytesIO(icc));name=ImageCms.getProfileName(profile).strip()
  if 'srgb' not in name.lower():return ImageCms.profileToProfile(image,profile,ImageCms.createProfile('sRGB'),renderingIntent=1,outputMode='RGB')
 return image.convert('RGB')

spec=importlib.util.spec_from_file_location('crop',R/'tools/import_crop_points.py');crop=importlib.util.module_from_spec(spec);spec.loader.exec_module(crop)
base=json.load(open(B/'manifest.json'));commons=[c for c in base['photos'] if c.get('commons_sha1')];rejected=[c for c in base['rejected'] if c.get('source_title')=='File:Hornet-vespa.jpg']
decisions=json.load(open(B/'review-decisions.json'));approved=[]
for c in commons:
 if c['id'] not in decisions:decisions[c['id']]=dict(punto=c['visual_review']['punto'],riquadro=c['visual_review']['riquadro'],note=c['visual_review']['nota'],caption=c['caption'],alt=c['alt'])
commons=[]
for fn in ['inat-downloaded.json','dryades-downloaded.json','downloaded.json']:
 if not (B/fn).exists():continue
 for c in json.load(open(B/fn)):
  if c['id'] in {v['id'] for v in commons}:continue
  if c.get('commons_sha1'):c.setdefault('source','Wikimedia Commons')
  d=decisions.get(c['id'])
  if not d:continue
  if d.get('reject'):
   rejected.append(dict(id=c['id'],original=c['original'],reason=d['reject']));continue
  im=load_rgb(R/c['original']);v=dict(punto=d.get('punto',[.5,.5]),riquadro=d.get('riquadro',[.1,.1,.9,.9]),nota=d['note']);pos=crop.positions(im.size,v);files={}
  for role,side,cap,suf in [('file',560,80000,''),('file_hd',1200,220000,'-hd')]:
   image=im.copy();image.thumbnail((side,side));p=B/'prepared'/(c['id']+suf+'.webp')
   for q in ([] if p.exists() else range(84,29,-3)):
    image.save(p,'WEBP',quality=q,method=6)
    if p.stat().st_size<=cap:break
   files[role]=str(p.relative_to(R))
  W,H=im.size;side=min(W,H);px,py=pos['1:1'];ox,oy=round(px*(W-side)),round(py*(H-side));p=B/'prepared'/(c['id']+'-t.webp');im.crop((ox,oy,ox+side,oy+side)).resize((160,160),Image.LANCZOS).save(p,'WEBP',quality=72,method=6);files['thumb']=str(p.relative_to(R))
  c.update(files=files,crop_points=pos,visual_review=dict(approved=True,attribution_approved=True,**v),caption=d['caption'],alt=d['alt'],changes='Orientamento EXIF, ridimensionamento, compressione WebP e miniatura ritagliata; nessuna correzione cromatica. EXIF/XMP rimossi.')
  if not c.get('attribution'):c['attribution']=c['author']+' · '+c['source']+' · '+c['license']
  approved.append(c)
photos=commons+approved
color={v['original']:v for v in json.load(open(B/'color-audit.json'))}
for c in photos:
 info=color[c['original']];name=info['icc_name'];c['source_icc_profile']=name;c['export_color_space']='sRGB';c['color_conversion']='ICC_to_sRGB' if name and 'srgb'not in name.lower() else ('source_sRGB' if name else 'untagged_RGB_assumed_sRGB')
 if c['color_conversion']=='ICC_to_sRGB':c['changes']+=' Conversione ICC da '+name+' a sRGB prima della rimozione del profilo.'
photos.sort(key=lambda c:({'animals':0,'plants':1,'trees':2}[c['target_group']],c['target_key'],0 if c.get('commons_sha1') else 1))
meta=json.load(open(B/'commons-extmetadata.json'))
for c in photos:
 c['sha1_basis']='commons_api_verified' if c.get('commons_sha1') else 'computed_from_downloaded_original'
 if not c.get('commons_sha1'):continue
 m=meta.get(c['source_title'],{});assert m.get('sha1')==c['commons_sha1']
 raw=m.get('extmetadata',{}).get('Attribution',{}).get('value','');required=html.unescape(re.sub('<[^>]*>','',raw)).strip()
 c['attribution_required_text']=required;c['attribution_required_html']=raw
 if required:c['attribution']=required+' · '+c['license']
 c['source_metadata']='incoming/photo-expansion-2026-10-18/natura/commons-extmetadata.json'
for st in range(0,len(approved),5):
 part=approved[st:st+5];sheet=Image.new('RGB',(1600,230*len(part)),'white');dr=ImageDraw.Draw(sheet)
 for j,c in enumerate(part):
  im=load_rgb(R/c['original']);W,H=im.size;y=j*230;dr.text((5,y+2),c['id'],fill='black')
  for col,(label,r) in enumerate([('original',None),*crop.FORMATS.items()]):
   if r:
    cw,ch=min(W,H*r),min(H,W/r);px,py=c['crop_points'][label];ox,oy=px*(W-cw),py*(H-ch);ci=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)))
   else:ci=im.copy()
   ci.thumbnail((220,185));x=col*228;sheet.paste(ci,(x+(220-ci.width)//2,y+25));dr.text((x+4,y+212),label,fill='black')
 sheet.save(B/('external-crop-review-'+str(st//5+1)+'.jpg'))
tmp=B/'manifest.tmp.json';tmp.write_text(json.dumps(dict(photos=photos,rejected=rejected),ensure_ascii=False,indent=2));tmp.replace(B/'manifest.json')
checks=[]
for c in photos:
 b=(R/c['original']).read_bytes();assert hashlib.sha256(b).hexdigest()==c['sha256_original'];assert hashlib.sha1(b).hexdigest()==c.get('commons_sha1',c.get('source_sha1'))
 for role,path in c['files'].items():
  p=R/path;im=Image.open(p);assert not im.info.get('exif') and not im.info.get('xmp');assert p.stat().st_size<={'file':80000,'file_hd':220000,'thumb':80000}[role];checks.append(dict(id=c['id'],role=role,path=path,bytes=p.stat().st_size,size=im.size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),metadata_clean=True))
(B/'verification.json').write_text(json.dumps(checks,indent=2));print('approved',len(photos),'rejected',len(rejected),'derivati',len(checks))
