import json,sys,hashlib,importlib.util,io,math
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageCms
from acquire import B,T,get
R=B.parents[2];s=importlib.util.spec_from_file_location('crop',R/'tools/import_crop_points.py');crop=importlib.util.module_from_spec(s);s.loader.exec_module(crop)

def loadcolor(p):
 raw=Image.open(p);icc=raw.info.get('icc_profile');im=ImageOps.exif_transpose(raw);name=None;conversion=False
 if icc:
  prof=ImageCms.ImageCmsProfile(io.BytesIO(icc));name=ImageCms.getProfileName(prof).strip()
  if 'srgb' not in name.lower():im=ImageCms.profileToProfile(im,prof,ImageCms.createProfile('sRGB'),renderingIntent=1,outputMode='RGB');conversion=True
  else:im=im.convert('RGB')
 else:im=im.convert('RGB')
 return im,name,conversion

def run(download=True):
 selected=json.load(open(B/'selected.json'));cand=json.load(open(B/'photo-candidates.json'));photos=[]
 for c in cand:
  if str(c['index']) not in selected.get(c['key'],{}):continue
  point,box,role,caption=selected[c['key']][str(c['index'])];id=f'ce1-piante-{c["key"]}-{c["index"]}';p=B/'originals'/(id+'.jpg')
  if not p.exists():
   if not download:continue
   p.write_bytes(get(c['sourceImage']));print('downloaded',id,p.stat().st_size,flush=True)
  raw=p.read_bytes();im,profile,converted=loadcolor(p);v=dict(punto=point,riquadro=box,nota='Originale e sei ritagli esaminati; priorità a nitidezza, soggetto leggibile e dettaglio complementare. I formati larghi isolano la porzione selezionata; l’originale completo resta nel visore.');pos=crop.positions(im.size,v);files={}
  for field,side,cap,suffix in [('file',560,80000,''),('file_hd',1200,220000,'-hd')]:
   out=im.copy();out.thumbnail((side,side));path=B/'prepared'/(id+suffix+'.webp')
   for q in range(84,29,-3):
    out.save(path,'WEBP',quality=q,method=6)
    if path.stat().st_size<=cap:break
   assert path.stat().st_size<=cap
   files[field]=str(path.relative_to(R))
  W,H=im.size;side=min(W,H);px,py=pos['1:1'];ox,oy=round(px*(W-side)),round(py*(H-side));thumb=im.crop((ox,oy,ox+side,oy+side)).resize((160,160),Image.Resampling.LANCZOS);path=B/'prepared'/(id+'-t.webp');thumb.save(path,'WEBP',quality=72,method=6);files['thumb']=str(path.relative_to(R))
  for path in files.values():assert not any(x in Image.open(R/path).info for x in ['icc_profile','exif','xmp'])
  author=c['author']+' · Dipartimento di Scienze della Vita, Università di Trieste'
  row=dict(id=id,target_group='plants',target_key=c['key'],latin=c['latin'],photo_taxon=c['latin'],source='Università di Trieste · Dryades',source_title=c['latin']+' · '+c['sourceImage'].rsplit('/',1)[-1],source_description=c['sourceCaption'],sourceCaption=c['sourceCaption'],page=c['page'],sourceImage=c['sourceImage'],source_taxon=c['latin'],author=author,license='CC BY-SA 4.0',licenseUrl='https://creativecommons.org/licenses/by-sa/4.0/',attribution=author+' · CC BY-SA 4.0',original=str(p.relative_to(R)),sha256_original=hashlib.sha256(raw).hexdigest(),source_sha1=hashlib.sha1(raw).hexdigest(),sha1_basis='computed_from_downloaded_original; no upstream checksum supplied by Dryades',source_metadata=str((B/'sources'/(c['key']+'-dryades.html')).relative_to(R)),alt=c['latin']+': '+role.lower()+'.',caption=caption,photographic_role=role,changes='Orientamento EXIF, conversione ICC a sRGB ove necessaria, ridimensionamento e compressione WebP; miniatura ritagliata. Profili ICC, EXIF e XMP rimossi dagli export.',source_icc_profile=profile,color_conversion=converted,export_color_space='sRGB' if profile else 'Assumed sRGB; source has no ICC profile',visual_review=dict(approved=False,attribution_approved=True,**v),crop_points=pos,files=files)
  photos.append(row)
 for start in range(0,len(photos),4):
  sheet=Image.new('RGB',(1680,len(photos[start:start+4])*250),'white');draw=ImageDraw.Draw(sheet)
  for j,c in enumerate(photos[start:start+4]):
   im,_,_=loadcolor(R/c['original']);W,H=im.size;y=j*250;draw.text((4,y),c['id']+' | '+c['photographic_role'],fill='black')
   for col,(label,ratio) in enumerate([('original',None),*crop.FORMATS.items()]):
    if ratio:
     cw,ch=min(W,H*ratio),min(H,W/ratio);px,py=c['crop_points'][label];ox,oy=px*(W-cw),py*(H-ch);ci=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)))
    else:ci=im.copy()
    ci.thumbnail((232,210));x=col*240;sheet.paste(ci,(x+(232-ci.width)//2,y+20));draw.text((x+4,y+232),label,fill='black')
  sheet.save(B/f'crop-review-{start//4+1}.jpg')
 (B/'manifest.json').write_text(json.dumps(dict(photos=photos),ensure_ascii=False,indent=2)+'\n')
 print('prepared',len(photos),flush=True)
if __name__=='__main__':run('--no-download' not in sys.argv)
