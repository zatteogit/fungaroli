#!/usr/bin/env python3
"""Audit ripetibile da acquisizioni OSM locali; nessuna promozione a verifica sul terreno.
Le tolleranze (15 m semplificazione + 1 m arrotondamento) verificano l'identità
geometrica del catalogo, non autorizzano un raccordo, una sosta o il transito.
"""
import argparse,collections,hashlib,json,math,pathlib,xml.etree.ElementTree as E
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--raw',default='incoming/outing-validation-2026-10-20');parser.add_argument('--checked-on',default='2026-10-20');args=parser.parse_args();RAW=ROOT/args.raw;DAY=args.checked_on
def load(p):return json.loads((ROOT/p).read_text())
def sig(lines):
 s=json.dumps(lines,separators=(',',':'),ensure_ascii=False); h=2166136261
 for b in s.encode():h=((h^b)*16777619)&0xffffffff
 return f'{h:08x}'
def meters(a,b):return math.hypot((a[0]-b[0])*111195,(a[1]-b[1])*111195*math.cos(math.radians((a[0]+b[0])/2)))
def segment(p,a,b):
 c=math.cos(math.radians(p[0])); x=(b[1]-a[1])*c;y=b[0]-a[0];px=(p[1]-a[1])*c;py=p[0]-a[0];n=x*x+y*y
 f=max(0,min(1,(px*x+py*y)/n))if n else 0
 return math.hypot(px-f*x,py-f*y)*111195

def check(t):
 p=RAW/f'{t["id"]}-full.osm'
 if not p.exists():return {'status':'not_checked','geometrySignature':sig(t['lines'])}
 root=E.parse(p).getroot(); rel=next(r for r in root.findall('relation')if r.get('id')==str(t['id'])); tags={x.get('k'):x.get('v')for x in rel.findall('tag')}; ways={w.get('id'):w for w in root.findall('way')}; nodes={n.get('id'):[float(n.get('lat')),float(n.get('lon'))]for n in root.findall('node')}; graph=collections.defaultdict(set); cautions=[]; members=[]; seen_edges=set()
 for m in rel.findall('member'):
  if m.get('type')!='way':
   if m.get('type')=='relation':cautions.append('nested_relation_to_review')
   continue
  if m.get('role') not in ['',None]:cautions.append('member_direction_to_review')
  w=ways[m.get('ref')]; ns=[n.get('ref')for n in w.findall('nd')]; wt={x.get('k'):x.get('v')for x in w.findall('tag')};members.append({'id':int(w.get('id')),'version':int(w.get('version')),'updatedOn':w.get('timestamp')[:10]})
  if wt.get('foot')in ['no','private'] or (wt.get('access')in ['no','private']and wt.get('foot')not in ['yes','designated','permissive']):cautions.append('restricted_foot_access')
  if any(k in wt for k in ['access:conditional','foot:conditional','oneway:foot']):cautions.append('conditional_or_directional_access')
  for a,b in zip(ns,ns[1:]):
   edge=tuple(sorted((a,b)))
   if edge in seen_edges:cautions.append('repeated_edge_to_review')
   seen_edges.add(edge);graph[a].add(b);graph[b].add(a)
 for n in root.findall('node'):
  if n.get('id') not in graph:continue
  nt={x.get('k'):x.get('v')for x in n.findall('tag')}
  if nt.get('foot')in ['no','private']or(nt.get('access')in ['no','private']and nt.get('foot')not in ['yes','designated','permissive']):cautions.append('restricted_foot_access')
  if any(k in nt for k in ['access:conditional','foot:conditional']):cautions.append('conditional_or_directional_access')
 ends=[n for n,v in graph.items()if len(v)==1]; chain=[]
 if len(ends)==2 and all(len(v)<=2 for v in graph.values()):
  prev=None;cur=ends[0]
  while cur is not None:
   chain.append(cur); nxt=[n for n in graph[cur]if n!=prev];prev,cur=cur,nxt[0]if nxt else None
 connected=len(chain)==len(graph) and bool(chain); line=[nodes[n]for n in chain]; local=t['lines'][0]; deviations=None
 if connected:
  deviations=[max(min(segment(p,a,b)for a,b in zip(dst,dst[1:]))for p in src)for src,dst in [(line,local),(local,line)]]
 identity=connected and max(deviations)<=16 and min(meters(local[0],line[0])+meters(local[-1],line[-1]),meters(local[0],line[-1])+meters(local[-1],line[0]))<=32
 return {'status':'network_correspondence_checked'if identity and not cautions else 'needs_review','geometrySignature':sig(t['lines']),'checkedOn':DAY,'sourceUrl':f'https://www.openstreetmap.org/relation/{t["id"]}','sourceVersion':int(rel.get('version')),'sourceUpdatedOn':rel.get('timestamp')[:10],'sourceHash':hashlib.sha256(p.read_bytes()).hexdigest(),'license':'ODbL-1.0','members':members,'connectedSimpleChain':connected,'maxDeviationMeters':list(map(lambda n:round(n,2),deviations))if deviations else None,'identityToleranceMeters':16,'sourceDurations':{k:tags[k]for k in ['duration','duration:forward','duration:backward']if k in tags},'cautions':sorted(set(cautions)),'orientation':'not_established','parking':{'status':'unverified','liveAvailability':None},'connector':{'status':'unverified','minutes':None,'geometry':None},'return':{'status':'undefined','minutes':None},'walkingTotalMinutes':None,'fieldValidation':False}

data=load('data/trails.json'); access=load('data/access.json'); rows=[]
for zid,z in data['zones'].items():
 for t in z['trails']:
  v=check(t)
  if t['id']==11098449 and v.get('status')=='network_correspondence_checked' and v['geometrySignature']=='9d05099a':
   v['orientation']='Ascrea → Fonte le Forche';v['start']=[42.1960641,12.996808];v['end']=[42.21533,13.00783]
   v['parking']={'status':'historically_reported_area','sourceUrl':'https://www.cairoma.it/?p=19638','sourcePublishedOn':'2022-03-25','checkedOn':DAY,'positionStatus':'unverified','liveAvailability':None,'note':'Sosta presso il cimitero descritta per una gita del 2022; nessun posto auto puntuale o disponibilità attuale attestati.'}
   v['return']={'status':'same_trail_reversed','minutes':90,'durationStatus':'osm_estimate','sourceUrl':v['sourceUrl'],'sourceTag':'duration:backward','geometryMethod':'reverse_verified_trail','geometrySignature':v['geometrySignature'],'fieldValidation':False}
   v['trailRoundTripMinutes']=210;v['trailRoundTripKm']=round(t['total_km']*2,1)
  t['routeValidation']=v
  rows.append({'zone':zid,'id':t['id'],'ref':t.get('ref'),'status':v['status'],'localFragment':t.get('total_km') is None or abs(t['total_km']-t['in_zone_km'])>=.05,'parts':len(t['lines']),'parking':v.get('parking',{}).get('status','unverified'),'connector':v.get('connector',{}).get('status','unverified'),'return':v.get('return',{}).get('status','undefined'),'walkingTotalMinutes':None})
drives=[]
for zid,routes in access['zones'].items():
 for a in routes:
  if a.get('line'):drives.append({'zone':zid,'label':a['parking'],'labelPoint':[a['lat'],a['lon']],'routedEndpoint':a['line'][-1],'endpointOffsetMeters':round(meters([a['lat'],a['lon']],a['line'][-1]),1),'parkingVerified':False,'returnDriveMinutes':None})
counts=dict(collections.Counter(x['status']for x in rows))
report={'checkedOn':DAY,'scope':'202 voci catalogo; acquisizione OSM completa dei candidati con durata, lunghezza intera coincidente e singola polilinea. Controllo topologico e corrispondenza geometrica, non sopralluogo.','counts':counts,'entries':rows,'driveRoutes':drives,'completeOutings':0,'sourceLicense':'ODbL-1.0','limitations':['Una corrispondenza geometrica non attesta apertura, manutenzione, parcheggio o diritto di transito.','Nessun raccordo viene costruito in linea d’aria.','Tempi auto di ritorno non ottenuti raddoppiando quelli di andata.','Durate di sentieri diversi o frammenti non trasferite.']}
(ROOT/'data/trails.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');(RAW/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'counts':counts,'driveRoutes':len(drives),'completeOutings':0}))
