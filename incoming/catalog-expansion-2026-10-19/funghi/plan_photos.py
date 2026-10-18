import json,urllib.request,urllib.parse,time,pathlib,re,html
B=pathlib.Path(__file__).resolve().parent
p=json.load(open(B/'catalog-proposal.json'))
UA='Fronda/PhotoEnrichment (https://github.com/zatteogit/fungaroli)'
plan=[];receipts=[]
for key,t in p['taxa'].items():
 q={'action':'query','format':'json','generator':'search','gsrsearch':'"'+t['latin']+'" -microscope -spores -illustration -drawing -stamp','gsrnamespace':6,'gsrlimit':8,'prop':'imageinfo|categories','cllimit':'max','iiprop':'url|size|sha1|extmetadata','iiurlwidth':640}
 u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(q)
 try:
  r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=35);raw=r.read();d=json.loads(raw);receipts.append({'taxon':key,'api':u,'http_status':r.status});json.dump(d,open(B/'sources'/('commons-'+key+'.json'),'w'),ensure_ascii=False,indent=2)
 except urllib.error.HTTPError as e:
  receipts.append({'taxon':key,'http_status':e.code,'retry_after':e.headers.get('Retry-After')});print('STOP',e.code);break
 except Exception as e:receipts.append({'taxon':key,'error':str(e)});print('ERROR',key,str(e));break
 candidates=[]
 for x in d.get('query',{}).get('pages',{}).values():
  if 'imageinfo' not in x:continue
  ii=x['imageinfo'][0];em=ii.get('extmetadata',{});clean=lambda k:html.unescape(re.sub('<[^>]+>',' ',em.get(k,{}).get('value',''))).strip();desc=clean('ImageDescription');cats=[c['title'].replace('Category:','') for c in x.get('categories',[])];combined=x['title']+' '+desc+' '+' '.join(cats);lic=clean('LicenseShortName')
  if any(z in combined.lower() for z in ['microscop','spores of','illustration','drawing','watercolour','stamp of','scanning electron']):continue
  if not(lic.startswith('CC BY') or lic in ['CC0','Public domain']):continue
  if min(ii['width'],ii['height'])<600:continue
  if t['latin'].lower() not in (desc+' '+' '.join(cats)).lower():continue
  candidates.append({'id':'ce-funghi-'+key+'-'+str(x['pageid']),'target_key':key,'latin':t['latin'],'source':'Wikimedia Commons','source_title':x['title'],'page':ii['descriptionurl'],'sourceImage':ii['url'],'preview_url':ii.get('thumburl'),'commons_sha1':ii['sha1'],'width':ii['width'],'height':ii['height'],'size':ii.get('size'),'author':clean('Artist'),'license':lic,'licenseUrl':clean('LicenseUrl'),'attribution_required_text':clean('Attribution'),'source_description':desc,'source_categories':cats,'visual_review':{'approved':False,'status':'non acquisita e non visualizzata; selezione qualitativa da completare dopo slot seriale'},'role_proposed':'intero leggibile; scegliere vista complementare di imenoforo/base solo se realmente presente dopo visione','growth_stage':None,'stage_reason':'nessuna fase assegnata da nomefile o intuizione','download_status':'metadata_only; upload.wikimedia.org non richiesto'})
 plan.extend(candidates);print(key,len(candidates));time.sleep(1.2)
json.dump({'status':'candidate-pool-not-quality-approved','photos':plan,'policy':'Non scegliere automaticamente per risoluzione. Dopo visione mantenere 1–3 foto eccellenti e complementari, con ruolo visivo specifico, scartare sfocati/occlusi/dominanti. Nessun download effettuato.','api_receipts':receipts},open(B/'photo-plan.json','w'),ensure_ascii=False,indent=2)
