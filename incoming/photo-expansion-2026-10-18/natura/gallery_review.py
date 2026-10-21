import json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;R=B.parents[2];M=json.load(open(B/'manifest.json'))['photos'];P=json.load(open(R/'data/plants.json'))['plants'];keys=list(dict.fromkeys(c['target_key']for c in M if c['target_group']=='plants'))
for st in range(0,len(keys),5):
 out=Image.new('RGB',(1440,310*len(keys[st:st+5])),'white');dr=ImageDraw.Draw(out)
 for row,key in enumerate(keys[st:st+5]):
  ps=[dict(p,kind='esistente')for p in P[key]['photos']]+[dict(c['files'],kind='nuova')for c in M if c['target_group']=='plants' and c['target_key']==key]
  assert len(ps)<=6,(key,len(ps))
  y=row*310;dr.text((5,y+2),key+' '+str(len(ps))+' foto totali',fill='black')
  for col,p in enumerate(ps):
   im=ImageOps.exif_transpose(Image.open(R/p['file'])).convert('RGB');im.thumbnail((230,260));x=col*240;out.paste(im,(x+(230-im.width)//2,y+22));dr.text((x+4,y+285),p['kind'],fill='black')
 out.save(B/('plant-gallery-review-'+str(st//5+1)+'.jpg'))
print(len(keys),'gallerie finali entro6foto')
