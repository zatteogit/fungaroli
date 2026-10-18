"""Prepare only original files already acquired by the globally coordinated queue. No network."""
import json,hashlib,sys,importlib.util,io
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageCms
ROOT=Path.cwd(); OUT=ROOT/'incoming/photo-expansion-2026-10-18/funghi-sosia'
for name in ['derived','review']: (OUT/name).mkdir(exist_ok=True)
rows=json.load(open(OUT/'download-plan.json'))
if (OUT/'inat-acquired.json').exists():rows+=json.load(open(OUT/'inat-acquired.json'))['photos']
if (OUT/'inat-synonym-acquired.json').exists():rows+=json.load(open(OUT/'inat-synonym-acquired.json'))['photos']
photos=[];errors=[]
old_by_id={}
if (OUT/'candidates.json').exists():old_by_id={r['id']:r for r in json.load(open(OUT/'candidates.json'))['photos']}
for row in rows:
 src=ROOT/row['original']
 if not src.exists():continue
 b=src.read_bytes();sha1=hashlib.sha1(b).hexdigest()
 if row.get('commons_sha1') and sha1!=row['commons_sha1']:errors.append({'id':row['id'],'error':'SHA1 mismatch'});continue
 row=dict(row)
 row.setdefault('commons_sha1',None);row.setdefault('source_title','iNaturalist photo '+str(row.get('photo_id','')));row.setdefault('source_categories',[]);row.setdefault('alt',row['target_key']+', fotografia dalla fonte iNaturalist.');row.setdefault('caption',row['target_key']+'.');row.setdefault('changes','Orientamento, ridimensionamento e compressione WebP; miniatura quadrata centrata; nessuna modifica cromatica.')
 if row.get('source_taxon_name'):row['photo_taxon']=row['source_taxon_name']
 probe=Image.open(src);icc=probe.info.get('icc_profile');profile_name=ImageCms.getProfileName(ImageCms.ImageCmsProfile(io.BytesIO(icc))).strip() if icc else None
 needs_color_conversion=bool(icc and ('display p3' in profile_name.lower() or 'adobe' in profile_name.lower() or 'srgb' not in profile_name.lower()))
 row['source_color_profile']=profile_name
 if needs_color_conversion:
  row['color_profile_normalized']='sRGB';row['changes']='Conversione ICC del profilo sorgente in sRGB per preservare la resa cromatica sul Web; orientamento, ridimensionamento e compressione WebP; miniatura quadrata centrata; nessun ritocco creativo.'
 old=old_by_id.get(row['id']);digest=hashlib.sha256(b).hexdigest()
 if old and (not needs_color_conversion or old.get('color_profile_normalized')=='sRGB') and old.get('sha256_original')==digest and all((ROOT/f).exists() for f in old['files'].values()):
  photos.append(dict(row,sha256_original=digest,files=old['files'],width=old['width'],height=old['height']));continue
 im=ImageOps.exif_transpose(probe).convert('RGB')
 if needs_color_conversion:im=ImageCms.profileToProfile(im,ImageCms.ImageCmsProfile(io.BytesIO(icc)),ImageCms.createProfile('sRGB'),outputMode='RGB')
 files={}
 for kind,side,limit,suffix in [('file',560,80000,''),('file_hd',1200,220000,'-hd')]:
  dst=OUT/'derived'/(row['id']+suffix+'.webp');quality=83
  while True:
   exp=im.copy();exp.thumbnail((side,side),Image.Resampling.LANCZOS);exp.save(dst,'WEBP',quality=quality,method=6)
   if dst.stat().st_size<=limit:break
   if quality>65:quality-=5
   else:side=int(side*.9)
  if Image.open(dst).info.get('exif') or Image.open(dst).info.get('xmp'):raise ValueError('Private metadata')
  files[kind]=str(dst.relative_to(ROOT))
 dst=OUT/'derived'/(row['id']+'-t.webp');ImageOps.fit(im,(160,160),method=Image.Resampling.LANCZOS,centering=(.5,.5)).save(dst,'WEBP',quality=72,method=6);files['thumb']=str(dst.relative_to(ROOT))
 photos.append(dict(row,sha256_original=hashlib.sha256(b).hexdigest(),files=files,width=im.width,height=im.height))
(OUT/'candidates.json').write_text(json.dumps({'photos':photos,'errors':errors},ensure_ascii=False,indent=2))
for start in range(0,len(photos),12):
 chunk=photos[start:start+12];board=Image.new('RGB',(1600,3*350),'#f4f4ec');draw=ImageDraw.Draw(board)
 for j,row in enumerate(chunk):
  im=Image.open(ROOT/row['files']['file_hd']);im.thumbnail((390,290));x=(j%4)*400;y=(j//4)*350;board.paste(im,(x+(390-im.width)//2,y));draw.text((x+5,y+292),f'{start+j:02d} {row["target_key"]}',fill='black');draw.text((x+5,y+310),row['source_title'][:52],fill='black')
 board.save(OUT/'review'/f'originals-{start//12+1:02}.jpg',quality=93)
print('Acquired/prepared',len(photos),'errors',len(errors))
