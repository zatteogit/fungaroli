import urllib.request,urllib.error,urllib.parse,json,time,re,html
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
B=Path(__file__).resolve().parent
T=[('bugola','Ajuga reptans L.',4414,141),('acetosella','Oxalis acetosella L.',2799,4062),('geranio-robertiano','Geranium robertianum L.',2831,2691),('sanicola','Sanicula europaea L.',3411,5236),('viola-silvestre','Viola reichenbachiana Jord. ex Boreau',3172,6390),('pervinca-minore','Vinca minor L.',4069,6348),('cariofillata','Geum urbanum L.',2015,2701),('stellina-odorosa','Galium odoratum (L.) Scop.',4119,2560)]
for d in ['sources','previews','originals','prepared']: (B/d).mkdir(exist_ok=True)
last=0

def get(u):
 global last
 time.sleep(max(0,3-(time.time()-last)))
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=30) as r:b=r.read(25000001)
  last=time.time()
  if len(b)>25000000:raise ValueError('oltre 25 MB')
  return b
 except urllib.error.HTTPError as e:
  last=time.time()
  if e.code in [403,429]:raise SystemExit('STOP '+str(e.code))
  raise

def clean(x):return ' '.join(html.unescape(re.sub('<[^>]*>',' ',x)).split())
if __name__=='__main__':
 out=[]
 for key,latin,tid,fid in T:
  page=f'https://dryades.units.it/casentinesi/index.php?id={tid}&procedure=taxon_page'
  raw=get(page);(B/'sources'/f'{key}-dryades.html').write_bytes(raw);s=raw.decode('utf8',errors='replace')
  blocks=re.findall(r'(<a [^>]*class="pirobox_gall"[^>]*>.*?</a>)<br><font size=1>(.*?)</font>',s,re.S)
  photos=[];seen=set()
  for a,cap in blocks:
   src=urllib.parse.urljoin(page,html.unescape(re.search('href="([^"]+)"',a)[1]));thumb=urllib.parse.urljoin(page,html.unescape(re.search('src="([^"]+)"',a)[1]))
   if src in seen or '/plants/foto/' not in src or 'CC BY-SA 4.0' not in clean(cap):continue
   seen.add(src);parts=[clean(c) for c in re.split('<br[^>]*>',cap) if clean(c)];author=parts[1] if len(parts)>1 else ''
   p=dict(key=key,latin=latin,page=page,sourceImage=src,preview=thumb,sourceCaption=clean(cap),author=author,index=len(photos))
   photos.append(p)
  # Representative evenly spaced candidates across complete gallery, not its first entries.
  ids=sorted(set(round(i*(len(photos)-1)/min(11,len(photos)-1)) for i in range(min(12,len(photos))))) if len(photos)>1 else [0]
  sample=[photos[i] for i in ids];out.extend(sample)
  for p in sample:
   target=B/'previews'/f'{key}-{p["index"]}.jpg'
   target.write_bytes(get(p['preview']))
  sheet=Image.new('RGB',(1000,((len(sample)+3)//4)*240),'white');draw=ImageDraw.Draw(sheet)
  for i,p in enumerate(sample):
   im=Image.open(B/'previews'/f'{key}-{p["index"]}.jpg');im.thumbnail((245,210));x=(i%4)*250;y=(i//4)*240;sheet.paste(im,(x,y));draw.text((x,y+214),f'{key} {p["index"]}',fill='black')
  sheet.save(B/f'review-{key}.jpg');(B/'photo-candidates.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
  print(key,len(photos),len(sample),flush=True)
