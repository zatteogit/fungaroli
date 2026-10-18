import urllib.request,urllib.parse,json,time
from pathlib import Path
O=Path(__file__).parent
for key,query in [('donnola-extra','"Mustela nivalis" -skull -skeleton -Naturalis -Stamp -museum -skin -MHNT -Alaska'),('quercino-extra','"Eliomys quercinus" -skull -skeleton -Naturalis -Stamp -museum -Jacopo -sleeping'),('macaone-extra','"Papilio machaon" chrysalis -drawing -MHNT')]:
 params=dict(action='query',generator='search',gsrsearch=query,gsrnamespace=6,gsrlimit=15,prop='imageinfo|categories',iiprop='url|size|sha1|extmetadata',cllimit=100,format='json')
 with urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params),headers={'User-Agent':'Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'}),timeout=60) as r:d=json.load(r)
 (O/'metadata'/(key+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2))
 print(key,[(p['pageid'],p['title']) for p in d.get('query',{}).get('pages',{}).values()],flush=True)
 time.sleep(3.2)
