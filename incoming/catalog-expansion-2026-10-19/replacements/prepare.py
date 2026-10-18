from scout import B,R,get,network
import json,hashlib,urllib.parse,importlib.util,io
from pathlib import Path
from PIL import Image,ImageOps,ImageCms,ImageDraw
s=importlib.util.spec_from_file_location('crop',R/'tools/import_crop_points.py');crop=importlib.util.module_from_spec(s);s.loader.exec_module(crop)
def color(path):
 raw=Image.open(path);im=ImageOps.exif_transpose(raw);icc=raw.info.get('icc_profile');name=None;converted=False
 if icc:
  prof=ImageCms.ImageCmsProfile(io.BytesIO(icc));name=ImageCms.getProfileName(prof).strip()
  if 'srgb' not in name.lower():im=ImageCms.profileToProfile(im,prof,ImageCms.createProfile('sRGB'),renderingIntent=1,outputMode='RGB');converted=True
  else:im=im.convert('RGB')
 else:im=im.convert('RGB')
 return im,name,converted
sel=json.load(open(B/'selected.json'));candidates={p['id']:p for p in json.load(open(B/'candidates.json'))};out=[]
for id,(point,box,role,caption) in sel.items():
 c=candidates[id];p=B/'originals'/(id+Path(urllib.parse.urlparse(c['sourceImage']).path).suffix)
 if not p.exists():p.write_bytes(get(c['sourceImage']));print('downloaded',id,p.stat().st_size,flush=True)
 raw=p.read_bytes();assert hashlib.sha1(raw).hexdigest()==c['commons_sha1'];im,profile,converted=color(p);v=dict(punto=point,riquadro=box);pos=crop.positions(im.size,v);files={}
 for field,side,cap,suffix in [('file',560,80000,''),('file_hd',1200,220000,'-hd')]:
  ci=im.copy();ci.thumbnail((side,side));dst=B/'prepared'/(id+suffix+'.webp')
  for q in range(84,29,-3):
   ci.save(dst,'WEBP',quality=q,method=6)
   if dst.stat().st_size<=cap:break
  assert dst.stat().st_size<=cap;files[field]=str(dst.relative_to(R))
 W,H=im.size;side=min(W,H);px,py=pos['1:1'];ox,oy=round(px*(W-side)),round(py*(H-side));thumb=im.crop((ox,oy,ox+side,oy+side)).resize((160,160),Image.Resampling.LANCZOS);dst=B/'prepared'/(id+'-t.webp');thumb.save(dst,'WEBP',quality=72,method=6);files['thumb']=str(dst.relative_to(R))
 for path in files.values():assert not any(k in Image.open(R/path).info for k in ['icc_profile','xmp','exif'])
 c.update(original=str(p.relative_to(R)),sha256_original=hashlib.sha256(raw).hexdigest(),commons_sha1_verified=True,files=files,source_icc_profile=profile,color_conversion=converted,export_color_space='sRGB' if profile else 'Assumed sRGB; source has no ICC profile',caption=caption,alt=c['photo_taxon']+': '+role.split(': ',1)[-1]+'.',photographic_role=role,crop_points=pos,visual_review=dict(approved=False,attribution_approved=True,**v,nota='Da completare dopo visione dell’originale e dei sei ritagli.'),changes='Orientamento EXIF, eventuale conversione ICC a sRGB, ridimensionamento e compressione WebP; miniatura ritagliata. EXIF, XMP e ICC rimossi dagli export.')
 lu=c['licenseUrl'].replace('https:http://','https://').replace('http://','https://');c['licenseUrl']=lu
 c['attribution']=c['attribution_required_text'] or c['author']+' · Wikimedia Commons · '+c['license'];out.append(c)
(B/'network-originals.json').write_text(json.dumps(network,indent=2));(B/'manifest.json').write_text(json.dumps(dict(photos=out),ensure_ascii=False,indent=2)+'\n')
# Source-size quality sheets and real UI crops, rendered after color conversion.
for start in range(0,len(out),3):
 part=out[start:start+3];sheet=Image.new('RGB',(1800,280*len(part)),'white');dr=ImageDraw.Draw(sheet)
 for j,c in enumerate(part):
  im,_,_=color(R/c['original']);W,H=im.size;y=j*280;dr.text((3,y),c['id']+' '+c['photo_taxon'],fill='black')
  for col,(label,ratio) in enumerate([('original',None),*crop.FORMATS.items()]):
   if ratio:
    cw,ch=min(W,H*ratio),min(H,W/ratio);px,py=c['crop_points'][label];ox,oy=px*(W-cw),py*(H-ch);ci=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)))
   else:ci=im.copy()
   ci.thumbnail((250,235));x=col*257;sheet.paste(ci,(x+(250-ci.width)//2,y+22));dr.text((x+3,y+258),label,fill='black')
 sheet.save(B/f'crop-review-{start//3+1}.jpg')
for c in out:
 im,_,_=color(R/c['original']);im.thumbnail((1400,1400));im.save(B/(c['id']+'-quality.jpg'))
print('prepared',len(out),flush=True)
