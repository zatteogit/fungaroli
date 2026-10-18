import json,hashlib,sys
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[2]
candidates=json.load(open(BASE/'candidates.json')); rows=[]
for i,c in enumerate(candidates):
 p=list((BASE/'originals').glob('*'+c['commons_sha1'][:8]+'.*'))
 if p:
  c.update(id=p[0].stem,original=str(p[0].relative_to(ROOT)),sha256_original=hashlib.sha256(p[0].read_bytes()).hexdigest(),index=i);rows.append(c)
(BASE/'downloaded.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for start in range(0,len(rows),12):
 part=rows[start:start+12];out=Image.new('RGB',(1200,320*((len(part)+2)//3)),'white');dr=ImageDraw.Draw(out)
 for j,c in enumerate(part):
  im=ImageOps.exif_transpose(Image.open(ROOT/c['original'])).convert('RGB');im.thumbnail((390,280));x=(j%3)*400;y=(j//3)*320;out.paste(im,(x+(400-im.width)//2,y));dr.text((x+5,y+283),str(c['index'])+' '+c['target_key'],fill='black')
 out.save(BASE/('original-review-'+str(start//12+1)+'.jpg'))
print(len(rows))
