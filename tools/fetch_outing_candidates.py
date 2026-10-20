#!/usr/bin/env python3
"""Riaccesso mirato alle fonti OSM: due richieste concorrenti, sola lettura.
Rileggere e valutare l’audit prima di pubblicare; non convalida automaticamente gli accessi.
"""
import json,pathlib,urllib.request,xml.etree.ElementTree as E,concurrent.futures,time,datetime,argparse
root=pathlib.Path(__file__).resolve().parents[1]; d=json.loads((root/'data/trails.json').read_text()); ids=sorted({t['id'] for z in d['zones'].values() for t in z['trails'] if t.get('duration') and abs(t['total_km']-t['in_zone_km'])<.05 and len(t['lines'])==1}); parser=argparse.ArgumentParser();parser.add_argument('--out',default='incoming/outing-validation-'+datetime.date.today().isoformat());args=parser.parse_args();dest=root/args.out;dest.mkdir(parents=True,exist_ok=True)
def get(rid):
 p=dest/f'{rid}-full.osm'
 try:
  with urllib.request.urlopen(urllib.request.Request(f'https://api.openstreetmap.org/api/0.6/relation/{rid}/full',headers={'User-Agent':'Fronda documented route audit github.com/zatteogit/fungaroli'}),timeout=40) as r: data=r.read()
  x=E.fromstring(data)
  for e in x:
   for k in ['user','uid','changeset']:e.attrib.pop(k,None)
  E.ElementTree(x).write(p,encoding='utf-8',xml_declaration=True); time.sleep(.6); return {'id':rid,'ok':True}
 except Exception as e:return {'id':rid,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool: results=list(pool.map(get,ids))
(dest/'fetch.json').write_text(json.dumps({'checkedOn':datetime.date.today().isoformat(),'requests':results},indent=2)); print(json.dumps({'candidates':len(ids),'success':sum(x.get('ok',False) for x in results),'failures':[x for x in results if not x.get('ok')]}))
