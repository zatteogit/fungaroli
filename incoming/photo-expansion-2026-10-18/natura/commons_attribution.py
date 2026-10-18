import urllib.request,urllib.parse,json,time,html,re
from pathlib import Path
B=Path(__file__).resolve().parent;cs=json.load(open(B/'candidates.json'));out={}
for i in range(0,len(cs),30):
 titles='|'.join(c['source_title']for c in cs[i:i+30]);url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',titles=titles,prop='imageinfo',iiprop='extmetadata|sha1'))
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=25);d=json.load(r)
  for p in d.get('query',{}).get('pages',{}).values():out[p['title']]=p.get('imageinfo',[{}])[0]
 except Exception as e:print(e);break
 time.sleep(3)
(B/'commons-extmetadata.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print('metadata',len(out))
