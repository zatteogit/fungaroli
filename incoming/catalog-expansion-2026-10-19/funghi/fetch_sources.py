import urllib.request,json,hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import fitz
B=Path(__file__).resolve().parent
urls={
 'ispra-vol2-2019':'https://www.isprambiente.gov.it/it/pubblicazioni/manuali-e-linee-guida/resolveuid/feae7f92afd54c53bddf4116b1bda545',
 'campania-atlante':'https://funghietartufi.regione.campania.it/docfunghietartufi/doc/funghi_campania.pdf',
 'piemonte-2021':'https://www.regione.piemonte.it/web/media/24510/download'}
def fetch(item):
 key,url=item
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Fronda/SourceReview (https://github.com/zatteogit/fungaroli)'}),timeout=90) as r:data=r.read();status=r.status
  local=Path('/tmp/fronda-catalog-funghi-20261019');local.mkdir(exist_ok=True);p=local/(key+'.pdf');p.write_bytes(data);doc=fitz.open(p);pages=[page.get_text() for page in doc]
  (local/(key+'-pages.json')).write_text(json.dumps(pages,ensure_ascii=False,indent=2));print(key,status,len(data),len(pages),flush=True)
  return {'id':key,'url':url,'file':str(p),'sha256':hashlib.sha256(data).hexdigest(),'status':status,'pages':len(pages)}
 except Exception as e: print(key,str(e),flush=True);return {'id':key,'url':url,'error':str(e)}
with ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(fetch,urls.items()))
(B/'sources/download-receipts.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
