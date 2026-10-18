import json,sys,hashlib,importlib.util
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;R=B.parents[2]
spec=importlib.util.spec_from_file_location('crop',R/'tools/import_crop_points.py');crop=importlib.util.module_from_spec(spec);spec.loader.exec_module(crop)
config={
3:([.57,.57],[.28,.22,.94,.94],'Esempio di bombo: Bombus terrestris su un fiore. La foto rappresenta questa specie, non tutto il genere Bombus.','Bombus terrestris su un fiore; esempio di specie del gruppo Bombi.'),
13:([.52,.54],[.05,.19,.93,.86],'Calabrone europeo (Vespa crabro) presso una cavità del legno; fotografia scattata nel Grunewald di Berlino.','Vespa crabro visto di lato sul legno.'),
16:([.38,.53],[.01,.01,.8,.92],'Esempio di zecca: Ixodes ricinus, ripresa macro. La foto rappresenta questa specie, non tutto il gruppo Ixodida.','Ixodes ricinus, vista macro della parte anteriore; esempio di specie del gruppo Zecche.')}
rows=json.load(open(B/'downloaded.json'));accepted=[];rejected=[]
(B/'prepared').mkdir(exist_ok=True)
for c in rows:
 if c['index'] not in config:
  rejected.append(dict(index=c['index'],source_title=c['source_title'],original=c['original'],reason='Esemplare isolato su fondo uniforme, dall’aspetto di preparato; preferito il calabrone vivo su legno.'));continue
 point,box,caption,alt=config[c['index']];v=dict(punto=point,riquadro=box,nota='Originale esaminato; soggetto fotografato attribuito dalla pagina Commons. I formati più larghi possono mostrare solo una parte del soggetto, la foto completa resta nel visore.')
 im=ImageOps.exif_transpose(Image.open(R/c['original'])).convert('RGB');files={}
 for name,side,cap,suffix in [('file',560,80000,''),('file_hd',1200,220000,'-hd')]:
  out=im.copy();out.thumbnail((side,side));p=B/'prepared'/(c['id']+suffix+'.webp')
  for quality in range(84,29,-3):
   out.save(p,'WEBP',quality=quality,method=6)
   if p.stat().st_size<=cap:break
  files[name]=str(p.relative_to(R))
 pos=crop.positions(im.size,v);W,H=im.size;side=min(W,H);px,py=pos['1:1'];ox,oy=round(px*(W-side)),round(py*(H-side));thumb=im.crop((ox,oy,ox+side,oy+side)).resize((160,160),Image.LANCZOS);p=B/'prepared'/(c['id']+'-t.webp');thumb.save(p,'WEBP',quality=72,method=6);files['thumb']=str(p.relative_to(R))
 c.update(files=files,caption=caption,alt=alt,attribution=c['author']+' · Wikimedia Commons · '+c['license'],source='Wikimedia Commons',changes='Orientamento EXIF, ridimensionamento, compressione WebP e miniatura ritagliata; nessuna correzione cromatica. EXIF/XMP rimossi.',visual_review=dict(approved=True,attribution_approved=True,**v),crop_points=pos)
 accepted.append(c)
# Both original and six real CSS-ratio crops, each reviewed as one row.
for start in range(0,len(accepted),5):
 part=accepted[start:start+5];sheet=Image.new('RGB',(1600,230*len(part)),'white');dr=ImageDraw.Draw(sheet)
 for j,c in enumerate(part):
  im=ImageOps.exif_transpose(Image.open(R/c['original'])).convert('RGB');W,H=im.size;y=j*230;dr.text((5,y+2),str(c['index'])+' '+c['target_key']+' '+c['photo_taxon'],fill='black')
  for col,(label,ratio) in enumerate([('original',None),*crop.FORMATS.items()]):
   if ratio:
    cw,ch=min(W,H*ratio),min(H,W/ratio);px,py=c['crop_points'][label];ox,oy=px*(W-cw),py*(H-ch);ci=im.crop((round(ox),round(oy),round(ox+cw),round(oy+ch)))
   else:ci=im.copy()
   ci.thumbnail((220,185));x=col*228;sheet.paste(ci,(x+(220-ci.width)//2,y+25));dr.text((x+4,y+212),label,fill='black')
 sheet.save(B/('crop-review-'+str(start//5+1)+'.jpg'))
(B/'manifest.json').write_text(json.dumps(dict(photos=accepted,rejected=rejected),ensure_ascii=False,indent=2))
print('approved',len(accepted),'rejected',len(rejected))
