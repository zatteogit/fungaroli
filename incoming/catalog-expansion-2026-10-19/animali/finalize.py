"""Offline manifest/crop review only; never modifies public catalogs."""
import json,hashlib,importlib.util,os
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path.cwd();OUT=ROOT/'incoming/catalog-expansion-2026-10-19/animali'
spec=importlib.util.spec_from_file_location('crop_helper',ROOT/'tools/import_crop_points.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
rows=json.load(open(OUT/'candidates.json'))['photos'];reviews=json.load(open(OUT/'review-decisions.json'));approved=[];pending=[];rejected=[]
for row in rows:
 rv=reviews.get(row['id'])
 if rv and rv.get('approved') is False:rejected.append({'id':row['id'],'reason':rv.get('nota','')});continue
 if not rv or not rv.get('approved'):pending.append(row['id']);continue
 row=dict(row)
 if row.get('source_taxon_name'):row['photo_taxon']=row['source_taxon_name']
 row['visual_review']={k:v for k,v in rv.items() if k not in ['caption','alt']};row['alt']=rv.get('alt',row['alt']);row['caption']=rv.get('caption',row['caption']);row['crop_points']=module.positions((row['width'],row['height']),rv);approved.append(row)
# Exact six UI cover formats using the same crop algorithm as the app.
for start in range(0,len(approved),8):
 chunk=approved[start:start+8];board=Image.new('RGB',(1800,len(chunk)*215),'#f5f5ed');draw=ImageDraw.Draw(board)
 for j,row in enumerate(chunk):
  im=Image.open(ROOT/row['files']['file_hd']);W,H=im.size;y=j*215;draw.text((5,y+3),f'{start+j:02d} {row["target_key"]} · {row["id"]}',fill='black')
  for c,(name,r) in enumerate(module.FORMATS.items()):
   cw,ch=min(W,H*r),min(H,W/r);px,py=row['crop_points'][name];ox,oy=px*(W-cw),py*(H-ch);crop=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)));crop.thumbnail((285,175),Image.Resampling.LANCZOS);x=c*300+(290-crop.width)//2;board.paste(crop,(x,y+22));draw.text((c*300+5,y+199),name,fill='black')
 board.save(OUT/'review'/f'crops-{start//8+1:02}.jpg',quality=93)
# Actual centred 160px thumbnails, distinct from CSS 1:1 cover crop.
for start in range(0,len(approved),48):
 chunk=approved[start:start+48];board=Image.new('RGB',(1440,((len(chunk)+7)//8)*205),'#f5f5ed');draw=ImageDraw.Draw(board)
 for j,row in enumerate(chunk):
  x=(j%8)*180;y=(j//8)*205;im=Image.open(ROOT/row['files']['thumb']);board.paste(im,(x+10,y));draw.text((x+3,y+163),f'{start+j:02d} '+row['target_key'][:23],fill='black');draw.text((x+3,y+181),row['id'].split('-')[-1],fill='black')
 board.save(OUT/'review'/f'thumbs-{start//48+1:02}.jpg',quality=93)
manifest={'photos':approved,'pending_visual_review':pending,'rejected_visual_review':rejected,'note':'Fotografie acquisite; per Commons SHA1 confrontato con API. SHA256 originale locale conservato per entrambe le fonti; iNaturalist non fornisce un hash remoto. Originali e sei ritagli osservati. Nessuna fase biologica dedotta. Cataloghi pubblici non modificati.'}
tmp=OUT/'manifest.json.tmp';tmp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2));os.replace(tmp,OUT/'manifest.json');print('Approved',len(approved),'pending',len(pending))
