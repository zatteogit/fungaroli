import json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path.cwd();O=ROOT/'incoming/catalog-expansion-2026-10-19/animali';D=ROOT/'docs/assets/catalog-expansion-2026-10-19/quality-review'
a=json.load(open(D/'index.json'));s=json.load(open(D/'screening.json'))['candidates_for_full_size_review'];indices=sorted(int(k) for k in s if int(k)>=140)
groups=list(dict.fromkeys(a[k]['target'] for k in indices));(O/'existing-quality-comparisons').mkdir(exist_ok=True)
for g in groups:
 rows=[(i,x) for i,x in enumerate(a) if x['target']==g]
 board=Image.new('RGB',(1500,((len(rows)+2)//3)*390),'#f5f5ed');draw=ImageDraw.Draw(board)
 for j,(i,r) in enumerate(rows):
  im=Image.open(ROOT/r['file']);im.thumbnail((490,340));x=j%3*500;y=j//3*390;board.paste(im,(x+(490-im.width)//2,y));draw.text((x+5,y+345),str(i)+' '+r['file'].split('/')[-1][:64],fill='black')
 board.save(O/'existing-quality-comparisons'/(g.replace(' ','-')+'.jpg'),quality=93)
(O/'existing-quality-work.json').write_text(json.dumps({'indices':indices,'groups':groups,'rows':[dict(index=i,**a[i],screeningReason=s[str(i)]) for i in indices]},ensure_ascii=False,indent=2))
print(len(indices),'candidates',len(groups),'taxa')
