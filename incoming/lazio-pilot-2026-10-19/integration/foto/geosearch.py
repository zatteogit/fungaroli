import urllib.request,urllib.parse,json,re,time,hashlib
from pathlib import Path
from PIL import Image
P=Path(__file__).parent;UA='fungaroli-rieti/1.0 (https://github.com/zatteogit/fungaroli)'
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=25).read()
def api(p):return json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(p,format='json'))))
seeds=json.load(open(P.parent/'zone-seeds.json'))['zones'];done=['vico-monte-venere','oriolo-monte-raschio','allumiere-faggeto','monterano-bicione','veio-monte-musino','faete-rocca-papa','cerquone-doganella','circeo-cerasella-verdesca','ernici-prato-campoli','lepini-supino-santaserena','pnalm-settefrati-canneto'];x=[]
for z in seeds:
 if z['id'] in done:continue
 try:
  data=api(dict(action='query',list='geosearch',gscoord=f"{z['lat']}|{z['lon']}",gsradius=5000,gsnamespace=6,gslimit=50));gs=data.get('query',{}).get('geosearch',[]);titles={g['title']:g['dist'] for g in gs}
  if not titles:print('NONE',z['id'],flush=True);continue
  data=api(dict(action='query',titles='|'.join(titles),prop='imageinfo',iiprop='url|size|extmetadata|mime',iiurlwidth=1600))
  for page in data.get('query',{}).get('pages',{}).values():
   i=page.get('imageinfo',[{}])[0];m=i.get('extmetadata',{});val=lambda k:re.sub('<[^>]*>','',m.get(k,{}).get('value','')).strip()
   r=dict(zoneId=z['id'],distanceFromZoneSeedM=titles.get(page['title']),title=page['title'],pageid=page['pageid'],page=i.get('descriptionurl'),originalUrl=i.get('url'),previewUrl=i.get('thumburl'),author=val('Artist'),license=val('LicenseShortName'),licenseUrl=val('LicenseUrl'),description=val('ImageDescription'),width=i.get('width'),height=i.get('height'),extmetadata=m)
   if i.get('mime')!='image/jpeg' or not re.match(r'^(CC BY|CC0)',r['license']) or not r['licenseUrl'] or i.get('width',0)<1400:continue
   if re.search('ISS\d|fung|bolet|russul|amanit|chiesa|santuario|abbazia|croc|stemma|logo|dipinto|Madonna|statua|stazione|Strada|campanile|cartello|altare|targa|mappa|pannello',r['title'],re.I):continue
   x.append(r)
  print(z['id'],len(gs),len(x),flush=True)
 except Exception as e:print('ERR',z['id'],e,flush=True)
 (P/'geo-metadata.json').write_text(json.dumps(x,ensure_ascii=False,indent=2));time.sleep(.8)
for r in x:
 try:
  f=P/'originals'/f"{r['pageid']}.jpg"
  if not f.exists():f.write_bytes(get(r['previewUrl']))
  Image.open(f).verify();r.update(local=str(f),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),acquiredUrl=r['previewUrl'],screen='visual_pending');print('OK',r['pageid'],flush=True)
 except Exception as e:r['error']=str(e);print('ERR',r['pageid'],flush=True)
 (P/'geo-acquired.json').write_text(json.dumps(x,ensure_ascii=False,indent=2));time.sleep(.8)
