"""Run only after exclusive Commons photo-host slot is assigned. No canonical writes."""
import argparse,json,pathlib,hashlib,time,urllib.request,urllib.error,io,sys
from PIL import Image,ImageOps,ImageCms,ImageDraw
B=pathlib.Path(__file__).resolve().parent;ROOT=B.parents[2];sys.path.insert(0,str(ROOT/'tools'))
from import_crop_points import positions,FORMATS
UA='Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'
a=argparse.ArgumentParser();a.add_argument('--acquire',action='store_true');a.add_argument('--prepare',action='store_true');args=a.parse_args()
plan=json.load(open(B/'download-plan.json'))['photos'];(B/'originals').mkdir(exist_ok=True);(B/'webp').mkdir(exist_ok=True)
def atomic(path,obj):
 tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2));tmp.replace(path)
receipts=json.load(open(B/'download-receipts.json')) if (B/'download-receipts.json').exists() else []
if args.acquire:
 for r in plan:
  p=ROOT/r['original']
  if p.exists():
   data=p.read_bytes()
   if hashlib.sha1(data).hexdigest()!=r['commons_sha1']:raise ValueError('Existing original SHA1 mismatch '+r['id'])
   continue
  time.sleep(8)
  try:
   with urllib.request.urlopen(urllib.request.Request(r['sourceImage'],headers={'User-Agent':UA}),timeout=60) as resp:
    data=resp.read(25000001)
    if len(data)>25000000:raise ValueError('Original exceeds25MB')
    if hashlib.sha1(data).hexdigest()!=r['commons_sha1']:raise ValueError('Original SHA1 mismatch')
    t=p.with_suffix(p.suffix+'.part');t.write_bytes(data);t.replace(p)
    receipts.append({'id':r['id'],'http_status':resp.status,'bytes':len(data),'sha1':hashlib.sha1(data).hexdigest(),'sha256':hashlib.sha256(data).hexdigest()})
    atomic(B/'download-receipts.json',receipts);print('acquired',r['id'],flush=True)
  except urllib.error.HTTPError as e:
   receipts.append({'id':r['id'],'http_status':e.code,'retry_after':e.headers.get('Retry-After')});atomic(B/'download-receipts.json',receipts);print('STOP',e.code,e.headers.get('Retry-After'),flush=True);break
  except Exception as e:
   receipts.append({'id':r['id'],'error':str(e)});atomic(B/'download-receipts.json',receipts);print('STOP',r['id'],str(e),flush=True);break
if not args.prepare:sys.exit(0)
review=json.load(open(B/'visual-review.json')) if (B/'visual-review.json').exists() else {}
def srgb(p):
 im=ImageOps.exif_transpose(Image.open(p));icc=im.info.get('icc_profile');change='nessun profilo incorporato; nessuna correzione cromatica applicata'
 if icc:
  src=ImageCms.ImageCmsProfile(io.BytesIO(icc));desc=ImageCms.getProfileDescription(src).strip();im=ImageCms.profileToProfile(im.convert('RGB'),src,ImageCms.createProfile('sRGB'),outputMode='RGB');change='ICC '+desc+' convertito a sRGB prima della rimozione del profilo'
 else:im=im.convert('RGB')
 return Image.frombytes('RGB',im.size,im.tobytes()),change
def save(im,p,side,limit):
 q=85
 while True:
  t=im.copy();t.thumbnail((side,side),Image.Resampling.LANCZOS);buf=io.BytesIO();t.save(buf,'WEBP',quality=q,method=6)
  if len(buf.getvalue())<=limit:p.write_bytes(buf.getvalue());return
  if q>60:q-=5
  else:side=int(side*.9);q=80
photos=[];originals=[];cropimgs=[];rejected=[]
for r in plan:
 p=ROOT/r['original']
 if not p.exists():continue
 im,color=srgb(p);rv=review.get(r['id'],{'approved':False,'attribution_approved':False,'punto':[.5,.5],'riquadro':[.01,.01,.99,.99],'nota':'Ritaglio centrale provvisorio: revisione richiesta.'});r=dict(r);r['visual_review']=rv;r['sha256_original']=hashlib.sha256(p.read_bytes()).hexdigest();r['crop_points']=positions(im.size,rv);r['target_group']='lookalikes';r['color_management']=color
 originals.append((r['id'],im.copy()))
 if rv.get('rejected'):
  rejected.append({'id':r['id'],'reason':rv.get('nota')});continue
 files={k:B/'webp'/(r['id']+suffix+'.webp') for k,suffix in [('file',''),('file_hd','-hd'),('thumb','-t')]};save(im,files['file'],560,80000);save(im,files['file_hd'],1200,220000)
 side=min(im.size);x=(im.width-side)//2;y=(im.height-side)//2;im.crop((x,y,x+side,y+side)).resize((160,160),Image.Resampling.LANCZOS).save(files['thumb'],'WEBP',quality=72,method=6)
 r['files']={k:str(v.relative_to(ROOT)) for k,v in files.items()};r['attribution']=f"{r['attribution_required_text'] or r['author']} / Wikimedia Commons / {r['license']}";r['caption']=rv.get('caption','Fotografia di '+r['latin']+'; descrizione visiva da completare.');r['alt']=rv.get('alt',r['caption']);r['changes']='Orientamento EXIF, '+color+'; ridimensionamento e WebP, miniatura quadrata centrale. EXIF/XMP/ICC rimossi dopo conversione. Nessuna generazione o ritocco.'
 photos.append(r)
 for fmt,ratio in FORMATS.items():
  cw,ch=min(im.width,im.height*ratio),min(im.height,im.width/ratio);px,py=r['crop_points'][fmt];ox,oy=px*(im.width-cw),py*(im.height-ch);cropimgs.append((r['id']+' '+fmt,im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)))))
def sheets(items,prefix,cols=3,rows=3,w=520,h=400):
 for start in range(0,len(items),cols*rows):
  canvas=Image.new('RGB',(cols*w,rows*h),'#eee');dr=ImageDraw.Draw(canvas)
  for n,(label,im) in enumerate(items[start:start+cols*rows]):
   im=im.copy();im.thumbnail((w-14,h-40));x=(n%cols)*w;y=(n//cols)*h;canvas.paste(im,(x+(w-im.width)//2,y+32));dr.text((x+5,y+4),label[-70:],fill='black')
  canvas.save(B/f'{prefix}-{start//(cols*rows)+1:02}.jpg',quality=92)
sheets(originals,'review-originals');sheets(cropimgs,'review-crops')
atomic(B/'manifest-candidates.json',{'photos':photos,'rejected':rejected,'note':'Solo candidati: importare esclusivamente approved=true e attribution_approved=true dopo revisione reale. target_group proposto lookalikes per schede didattiche senza modello.'})
approved=[p for p in photos if p['visual_review'].get('approved') and p['visual_review'].get('attribution_approved')]
atomic(B/'manifest.json',{'photos':approved,'rejected':rejected});print('originals',len(originals),'approved',len(approved),flush=True)
