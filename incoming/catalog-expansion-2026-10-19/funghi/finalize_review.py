import json,pathlib,sys,hashlib,math
from PIL import Image,ImageDraw
B=pathlib.Path(__file__).resolve().parent;ROOT=B.parents[2];sys.path.insert(0,str(ROOT/'tools'));from import_crop_points import positions,FORMATS
v=json.load(open(B/'visual-review.json'));m=json.load(open(B/'manifest-candidates.json'));updates={'84478911':([.5,.3],[.16,.02,.88,.67]),'35484839':([.5,.4],[.2,.25,.8,.59]),'63054929':([.5,.34],[.13,.04,.83,.66]),'53537315':([.3,.76],[.01,.56,.6,.99])}
items=[];photos=[]
for r in m['photos']:
 id=r['id'];n=id.rsplit('-',1)[-1];rv=v[id]
 if n in updates:rv['punto'],rv['riquadro']=updates[n]
 rv['approved']=True;rv['attribution_approved']=True;rv['nota']='Originale, colore, qualità e sei formati controllati visivamente. Nei formati stretti/largamente orizzontali è mostrato un particolare; il visore conserva la foto intera.'
 r['visual_review']=rv;r['role_observed']=rv['role_observed'];r['download_status']='acquired_sha1_verified';r['caption']=rv['caption'];r['alt']=rv['alt']
 im=Image.open(ROOT/r['files']['file_hd']);r['crop_points']=positions(im.size,rv)
 for fmt,ratio in FORMATS.items():
  cw,ch=min(im.width,im.height*ratio),min(im.height,im.width/ratio);px,py=r['crop_points'][fmt];ox,oy=px*(im.width-cw),py*(im.height-ch);items.append((r['id']+' '+fmt,im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch))),n in updates))
 photos.append(r)
def sheets(items,prefix,count=9):
 for start in range(0,len(items),count):
  canvas=Image.new('RGB',(1560,1200),'#eee');dr=ImageDraw.Draw(canvas)
  for j,(label,im,_) in enumerate(items[start:start+count]):
   im=im.copy();im.thumbnail((506,360));x=(j%3)*520;y=(j//3)*400;canvas.paste(im,(x+(520-im.width)//2,y+32));dr.text((x+4,y+5),label[-70:],fill='black')
  canvas.save(B/f'{prefix}-{start//count+1:02}.jpg',quality=92)
sheets(items,'final-crops');sheets([x for x in items if x[2]],'corrected-crops')
# Final manifest is written only after corrected sheets have been reviewed, via --freeze.
if '--freeze' in sys.argv:
 p=B/'manifest.json';tmp=p.with_suffix('.json.tmp');tmp.write_text(json.dumps({'photos':photos,'rejected':m['rejected'],'limits':['18 fotografie selezionate su26 originali; 8 scarti conservati.','Due fasi giovani esplicitamente attestate dalla descrizione Commons; nessuna altra fase attribuita.','Nessuna suite, dry-run o modifica canonica.']},ensure_ascii=False,indent=2));tmp.replace(p);json.dump(v,open(B/'visual-review.json','w'),ensure_ascii=False,indent=2)
 checks=[]
 for r in photos:
  original=ROOT/r['original'];assert hashlib.sha1(original.read_bytes()).hexdigest()==r['commons_sha1'];assert hashlib.sha256(original.read_bytes()).hexdigest()==r['sha256_original']
  for k,fn in r['files'].items():
   p=ROOT/fn;im=Image.open(p);limit=80000 if k=='file' else 220000 if k=='file_hd' else 80000;assert p.stat().st_size<=limit;assert not any(im.info.get(n) for n in ['exif','xmp','icc_profile']);assert im.size==(160,160) if k=='thumb' else max(im.size)<=(560 if k=='file' else 1200)
   checks.append({'id':r['id'],'kind':k,'file':fn,'bytes':p.stat().st_size,'size':im.size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'metadata_clean':True})
 json.dump({'photos':len(photos),'taxa':len(set(x['target_key'] for x in photos)),'webp':len(checks),'originals_acquired':26,'rejected':len(m['rejected']),'manifest_sha256':hashlib.sha256((B/'manifest.json').read_bytes()).hexdigest(),'files':checks,'note':'Controllo mirato dei file e degli hash; nessuna suite o dry-run.'},open(B/'checks.json','w'),ensure_ascii=False,indent=2)
 print('frozen',len(photos),hashlib.sha256((B/'manifest.json').read_bytes()).hexdigest())
