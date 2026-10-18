import json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;R=B.parents[2]
rows=json.load(open(B/'dryades-downloaded.json'))
for st in range(0,len(rows),12):
 part=rows[st:st+12];out=Image.new('RGB',(1400,400*((len(part)+3)//4)),'white');dr=ImageDraw.Draw(out)
 for j,c in enumerate(part):
  im=ImageOps.exif_transpose(Image.open(R/c['original'])).convert('RGB');im.thumbnail((340,350));x=(j%4)*350;y=(j//4)*400;out.paste(im,(x+(350-im.width)//2,y));dr.text((x+5,y+355),str(st+j)+' '+c['target_key'],fill='black');dr.text((x+5,y+375),Path(c['sourceImage']).name,fill='black')
 out.save(B/('dryades-original-review-'+str(st//12+1)+'.jpg'))
print(len(rows))
