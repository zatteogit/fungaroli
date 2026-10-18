import json,hashlib,sys,io,re,html
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;ROOT=B.parents[2];sys.path.insert(0,str(ROOT/'tools'))
from import_crop_points import positions,FORMATS
from colour import open_srgb
base=json.load(open(B/'base-manifest.json'));reviews=json.load(open(B/'approved-extra.json'));sources=json.load(open(B/'download-plan.json'))['photos']
if (B/'inat-candidates.json').exists():sources+=json.load(open(B/'inat-candidates.json'))['photos']
if (B/'replacement-plan.json').exists():sources+=json.load(open(B/'replacement-plan.json'))['photos']
source_map={r['id']:r for r in sources};out=base['photos'][:];extra=[]
def save(im,p,side,cap):
 q=84
 while True:
  target=im.copy();target.thumbnail((side,side),Image.Resampling.LANCZOS);buf=io.BytesIO();target.save(buf,'WEBP',quality=q,method=6)
  if len(buf.getvalue())<=cap:p.write_bytes(buf.getvalue());return
  if q>58:q-=5
  else:side=int(side*.9);q=78
for id,rev in reviews.items():
 if id not in source_map:continue
 r=source_map[id].copy();p=ROOT/r['original']
 if not p.exists():continue
 raw=p.read_bytes()
 if r.get('commons_sha1'):assert hashlib.sha1(raw).hexdigest()==r['commons_sha1']
 r['sha256_original']=hashlib.sha256(raw).hexdigest();r.setdefault('source','Wikimedia Commons')
 if r['source']=='Wikimedia Commons':
  match=re.search(r'This image was created by user\s+(.*?)\s+at\s+Mushroom Observer',r['author'])
  if match:r['source_attribution']=r['author'];r['author']=match.group(1).strip()
 im,colour_details=open_srgb(p);r['colour_management']=colour_details;cap=rev['caption'];rv=dict(approved=True,attribution_approved=True,punto=rev['punto'],riquadro=rev['riquadro'],nota=rev.get('nota',cap)+' Vista completa e sei ritagli controllati; i formati stretti possono escludere parti. Nessuna fase biologica dedotta; nessun giudizio di commestibilità.')
 fn=B/'webp'/f'{id}.webp';hd=B/'webp'/f'{id}-hd.webp';t=B/'webp'/f'{id}-t.webp';save(im,fn,560,80000);save(im,hd,1200,220000);side=min(im.size);x=(im.width-side)//2;y=(im.height-side)//2;im.crop((x,y,x+side,y+side)).resize((160,160),Image.Resampling.LANCZOS).save(t,'WEBP',quality=72,method=6)
 r.update(attribution=(r.get('source_attribution') if r.get('source')=='iNaturalist' and r.get('source_attribution')!='no rights reserved' else None) or f"{r['author']} / {r['source']} / {r['license']}",alt=f"{r['latin']}. {cap}",caption=cap,changes='Orientamento EXIF applicato, ridimensionamento e compressione WebP; miniatura quadrata centrale. EXIF/XMP rimossi. Nessuna modifica cromatica o generazione.',visual_review=rv,crop_points=positions(im.size,rv),files=dict(file=str(fn.relative_to(ROOT)),file_hd=str(hd.relative_to(ROOT)),thumb=str(t.relative_to(ROOT))))
 for f in r['files'].values():
  info=Image.open(ROOT/f).info;assert not info.get('exif') and not info.get('xmp')
 extra.append(r);out.append(r)
# Honour explicit attribution on each Commons file, beyond Artist.
attrs={}
for metadata_file in (B/'metadata').glob('*api.json'):
 if '-inat-api' in metadata_file.name:continue
 for page_data in json.load(open(metadata_file)).get('query',{}).get('pages',{}).values():
  info=page_data.get('imageinfo',[{}])[0];em=info.get('extmetadata',{});text=em.get('Attribution',{}).get('value','')
  if text:attrs[info.get('sha1')]=html.unescape(re.sub('<[^>]+>',' ',str(text))).strip()
for r in out:
 if r.get('source')=='Wikimedia Commons':
  required=attrs.get(r.get('commons_sha1'),'');r['attribution_required_text']=required
  if required:r['attribution']=required+' / Wikimedia Commons / '+r['license']
base['photos']=out
if (B/'extra-rejections.json').exists():base['rejected']+=json.load(open(B/'extra-rejections.json'))
base['summary']={'photo_count':len(out),'derivative_count':len(out)*3,'sources':{s:sum(r.get('source')==s for r in out) for s in ['Wikimedia Commons','iNaturalist']},'not_acquired_are_not_counted':True}
tmp=B/'manifest.tmp';tmp.write_text(json.dumps(base,ensure_ascii=False,indent=2));tmp.replace(B/'manifest.json')
for start in range(0,len(extra),3):
 chunk=extra[start:start+3];sh=Image.new('RGB',(1680,len(chunk)*350),'#eee');dr=ImageDraw.Draw(sh)
 for j,r in enumerate(chunk):
  im=Image.open(ROOT/r['files']['file_hd']).convert('RGB');y=j*350;dr.text((8,y+3),r['id'],fill='black')
  for n,(name,ratio) in enumerate(FORMATS.items()):
   cw,ch=min(im.width,im.height*ratio),min(im.height,im.width/ratio);px,py=r['crop_points'][name];ox=px*(im.width-cw);oy=py*(im.height-ch);c=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)));c.thumbnail((230,285));x=n*240;sh.paste(c,(x,y+25));dr.text((x+2,y+320),name,fill='black')
  sh.paste(Image.open(ROOT/r['files']['thumb']),(1450,y+25));dr.text((1450,y+200),'thumb centro',fill='black')
 sh.save(B/f'extra-crop-review-{start//3+1:02}.jpg',quality=92)
print(base['summary'])
