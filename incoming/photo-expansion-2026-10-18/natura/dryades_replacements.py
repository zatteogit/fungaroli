import urllib.request,urllib.parse,urllib.error,json,time,re,html,hashlib
from pathlib import Path
B=Path(__file__).resolve().parent;R=B.parents[2];UA={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'};(B/'dryades-pages').mkdir(exist_ok=True)
existing=''.join(p.read_text()for p in (R/'data').glob('*.json'));targets=[]
for k,v in json.load(open(R/'data/plants.json'))['plants'].items():
 if len(v.get('photos',[]))==2 and k!='giglio-rosso':targets.append(('plants',k,v['latin'],v['photos'][0]['page'],3))
for k,v in json.load(open(R/'data/media-trees.json'))['trees'].items():
 if k not in ['sorbo domestico','ciliegio','noce','robinia','olmo montano','ippocastano']:continue
 ps=v.get('commons',[])+v.get('inat',[])
 ph=next((p for p in ps if 'dryades.units.it' in p.get('page','')),None)
 if ph:targets.append(('trees',k,v['latin'],ph['page'],2))
targets=[(g,k,l,p,1)for g,k,l,p,n in targets if k in ['scilla-silvestre','orchide-maschia']];last=0;out=json.load(open(B/'dryades-downloaded.json'));existing+=''.join(c['sourceImage']for c in out);log=[]
def clean(s):return html.unescape(re.sub('<[^>]*>',' ',s)).strip()
def get(url):
 global last
 time.sleep(max(0,3-(time.time()-last)))
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30);b=r.read(25000001);last=time.time()
  if len(b)>25000000:raise ValueError('Originale oltre25MB')
  return b
 except urllib.error.HTTPError as e:
  last=time.time();log.append(dict(url=url,status=e.code,headers=dict(e.headers)))
  (B/'dryades-network.json').write_text(json.dumps(log,indent=2))
  if e.code in (403,429):raise SystemExit('STOP '+str(e.code))
  raise
for group,key,latin,page,n in targets:
 try:
  raw=get(page);(B/'dryades-pages'/(key.replace(' ','-')+'.html')).write_bytes(raw);s=raw.decode('utf-8',errors='replace');count=0;seen=set()
  for m in re.finditer(r'(<a [^>]*class="pirobox_gall"[^>]*>.*?</a>)<br><div style="font-size:10px; line-height:12px">(.*?)</div>',s,re.S):
   anchor,sc=m.groups();href=re.search(r'href="([^"]+)"',anchor);alt=re.search(r'alt="([^"]+)"',anchor)
   if not href or not alt:continue
   desc=clean(alt.group(1));caption=clean(sc);src=urllib.parse.urljoin(page,html.unescape(href.group(1)))
   if '/plants/foto/' not in src or src in seen or src in existing:continue
   seen.add(src)
   if 'CC-BY-SA 4.0' not in desc and 'CC-BY-SA 4.0' not in caption:continue
   au=re.search(r'by ([^<]+)',alt.group(1));author=clean(au.group(1)) if au else ''
   if not author:continue
   body=get(src);sha=hashlib.sha1(body).hexdigest();id='pe2-natura-'+key.replace(' ','-')+'-dryades-'+sha[:8];p=B/'originals'/(id+Path(urllib.parse.urlparse(src).path).suffix);p.write_bytes(body)
   c=dict(id=id,target_group=group,target_key=key,latin=latin,photo_taxon=latin,source='Università di Trieste · Dryades',source_title=latin+' · '+src.rsplit('/',1)[-1],source_description=desc,sourceCaption=caption,source_categories=[],page=page,author=author+' · Dipartimento di Scienze della Vita, Università di Trieste',license='CC BY-SA 4.0',licenseUrl='https://creativecommons.org/licenses/by-sa/4.0/',sourceImage=src,original=str(p.relative_to(R)),sha256_original=hashlib.sha256(body).hexdigest(),source_sha1=sha,source_metadata=str((B/'dryades-pages'/(key.replace(' ','-')+'.html')).relative_to(R)))
   out.append(c);(B/'dryades-downloaded.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));count+=1;print(key,count,len(body),'OK',flush=True)
   if count>=n:break
 except Exception as e:log.append(dict(target=key,error=str(e)));print(key,str(e),flush=True)
(B/'dryades-network.json').write_text(json.dumps(log,indent=2))
