import json,hashlib,sys
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;ROOT=B.parents[2];sys.path.insert(0,str(ROOT/'tools'))
from import_crop_points import FORMATS
from colour import open_srgb
p=B/'manifest.json';d=json.load(open(p));photos=d['photos'];tables=[];checks=[]
for old in list(B.glob('approved-originals-*.jpg'))+list(B.glob('approved-crops-*.jpg')):old.unlink()
for start in range(0,len(photos),12):
 chunk=photos[start:start+12];sh=Image.new('RGB',(1600,((len(chunk)+3)//4)*350),'#eeeeee');dr=ImageDraw.Draw(sh)
 for j,r in enumerate(chunk):
  im,_=open_srgb(ROOT/r['original']);im.thumbnail((390,285));x=j%4*400;y=j//4*350;sh.paste(im,(x+(400-im.width)//2,y));dr.text((x+4,y+290),r['id'],fill='black');dr.text((x+4,y+308),r['source']+' / '+r['author'][:40],fill='black');dr.text((x+4,y+326),r['license'],fill='black')
 f=B/f'approved-originals-{start//12+1:02}.jpg';sh.save(f,quality=92);tables.append(str(f.relative_to(ROOT)))
for start in range(0,len(photos),3):
 chunk=photos[start:start+3];sh=Image.new('RGB',(1680,len(chunk)*350),'#eeeeee');dr=ImageDraw.Draw(sh)
 for j,r in enumerate(chunk):
  im=Image.open(ROOT/r['files']['file_hd']).convert('RGB');y=j*350;dr.text((8,y+3),r['id'],fill='black')
  for n,(name,ratio) in enumerate(FORMATS.items()):
   cw,ch=min(im.width,im.height*ratio),min(im.height,im.width/ratio);px,py=r['crop_points'][name];ox=px*(im.width-cw);oy=py*(im.height-ch);c=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)));c.thumbnail((230,285));x=n*240;sh.paste(c,(x,y+25));dr.text((x+2,y+320),name,fill='black')
  sh.paste(Image.open(ROOT/r['files']['thumb']),(1450,y+25));dr.text((1450,y+200),'thumb centro',fill='black')
 f=B/f'approved-crops-{start//3+1:02}.jpg';sh.save(f,quality=92);tables.append(str(f.relative_to(ROOT)))
for r in photos:
 original=ROOT/r['original'];raw=original.read_bytes();assert hashlib.sha256(raw).hexdigest()==r['sha256_original']
 if r.get('commons_sha1'):assert hashlib.sha1(raw).hexdigest()==r['commons_sha1']
 assert len(raw)<=25*1024*1024
 row={'id':r['id'],'original_sha256_verified':True,'commons_sha1_verified':bool(r.get('commons_sha1')),'files':{}}
 for key,path in r['files'].items():
  f=ROOT/path;im=Image.open(f);assert not im.info.get('exif') and not im.info.get('xmp');size=f.stat().st_size
  assert size<=(220000 if key=='file_hd' else 80000)
  if key=='thumb':assert im.size==(160,160)
  else:assert max(im.size)<=(1200 if key=='file_hd' else 560)
  row['files'][key]={'bytes':size,'dimensions':im.size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'exif_xmp_absent':True}
 checks.append(row)
# Only derivatives referenced by approved records remain. Originals and rejection receipts remain untouched.
allowed={Path(v).name for r in photos for v in r['files'].values()}
for f in (B/'webp').glob('*.webp'):
 if f.name not in allowed:f.unlink()
d['review_tables']=tables;d['checks_file']=str((B/'checks.json').relative_to(ROOT));d['delivery_status']='Acquired and prepared bundle, not canonical integration or publication';tmp=B/'manifest.final.tmp';tmp.write_text(json.dumps(d,ensure_ascii=False,indent=2));tmp.replace(p);(B/'checks.json').write_text(json.dumps({'photos':checks,'suites_run':False},ensure_ascii=False,indent=2));print('final',len(photos),'photos',len(photos)*3,'webp',len(tables),'tables')
