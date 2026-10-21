import json,urllib.request,time,hashlib
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
P=Path(__file__).parent;ids=[138222980,61876711,120252877,97991275,107524915,107524919,168684244,168684243,84167254,9614495,198023021,71315414,79666309,93401132,53912080,53912083]
x=[r for r in json.load(open(P/'geo-metadata.json')) if r['pageid'] in ids]
for r in x:
 try:
  f=P/'originals'/f"{r['pageid']}.jpg"
  if not f.exists():f.write_bytes(urllib.request.urlopen(urllib.request.Request(r['previewUrl'],headers={'User-Agent':'fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)'}),timeout=20).read())
  im=Image.open(f);im.verify();r.update(local=str(f),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),acquiredUrl=r['previewUrl'],screen='visual_pending');print('OK',r['pageid'],flush=True)
 except Exception as e:r['error']=str(e);print('ERR',r['pageid'],str(e)[:80],flush=True)
 (P/'geo-selected-acquired.json').write_text(json.dumps(x,ensure_ascii=False,indent=2));time.sleep(1)
valid=[r for r in x if r.get('local')];o=Image.new('RGB',(1400,250*((len(valid)+3)//4)),'white');d=ImageDraw.Draw(o)
for k,r in enumerate(valid):
 im=ImageOps.exif_transpose(Image.open(r['local']));im.thumbnail((340,210));a=k%4*350;b=k//4*250;o.paste(im,(a,b));d.text((a,b+212),str(r['pageid'])+' '+r['zoneId'][:25],fill='black');d.text((a,b+228),r['title'][5:50],fill='black')
o.save(P/'geo-review.jpg',quality=90)
