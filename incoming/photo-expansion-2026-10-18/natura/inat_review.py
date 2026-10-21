import json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;R=B.parents[2]
rows=json.load(open(B/'inat-downloaded.json'))
for st in range(0,len(rows),12):
 part=rows[st:st+12];out=Image.new('RGB',(1200,340*((len(part)+2)//3)),'white');dr=ImageDraw.Draw(out)
 for j,c in enumerate(part):
  im=ImageOps.exif_transpose(Image.open(R/c['original'])).convert('RGB');im.thumbnail((390,290));x=(j%3)*400;y=(j//3)*340;out.paste(im,(x+(400-im.width)//2,y));dr.text((x+5,y+295),str(st+j)+' '+c['target_key'],fill='black');dr.text((x+5,y+314),c['photo_taxon'],fill='black')
 out.save(B/('inat-original-review-'+str(st//12+1)+'.jpg'))
print(len(rows))
