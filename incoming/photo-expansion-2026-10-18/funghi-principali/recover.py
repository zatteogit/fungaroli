import json,hashlib,re,html,sys
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent;ROOT=B.parents[2]
plain=lambda x:html.unescape(re.sub('<[^>]+>',' ',str(x))).strip()
lookup={}
for f in (B/'metadata').glob('*api.json'):
 for p in json.load(open(f)).get('query',{}).get('pages',{}).values():
  if p.get('imageinfo'):lookup[p['imageinfo'][0].get('sha1')]=p
out=[];m=json.load(open(ROOT/'data/media.json'))
for f in sorted((B/'originals').iterdir()):
 raw=f.read_bytes();sha=hashlib.sha1(raw).hexdigest();p=lookup[sha];i=p['imageinfo'][0];e=i['extmetadata'];v=lambda k:plain(e.get(k,{}).get('value',''));key=f.stem[len('pe2-main-'):-3]
 cats=[x['title'] for x in p.get('categories',[])]+v('Categories').split('|')
 out.append(dict(id=f.stem,target_group='species',target_key=key,latin=m['species'][key]['latin'],original=str(f.relative_to(ROOT)),sha256_original=hashlib.sha256(raw).hexdigest(),commons_sha1=sha,source_title=p['title'],source_description=v('ImageDescription'),source_categories=cats,page=i['descriptionurl'],author=v('Artist'),license=v('LicenseShortName'),licenseUrl=v('LicenseUrl'),sourceImage=i['url']))
(B/'candidates.json').write_text(json.dumps({'photos':out},ensure_ascii=False,indent=2))
for start in range(0,len(out),12):
 chunk=out[start:start+12];sheet=Image.new('RGB',(1600,((len(chunk)+3)//4)*340),'#eeeeee');d=ImageDraw.Draw(sheet)
 for j,r in enumerate(chunk):
  im=ImageOps.exif_transpose(Image.open(ROOT/r['original'])).convert('RGB');im.thumbnail((390,290));x=j%4*400;y=j//4*340;sheet.paste(im,(x+(400-im.width)//2,y));d.text((x+5,y+294),r['id'],fill='black');d.text((x+5,y+312),r['author'][:45],fill='black')
 sheet.save(B/f'original-review-{start//12+1:02}.jpg',quality=92)
print(len(out));print('\n'.join(r['id']+' '+r['source_title'] for r in out))
