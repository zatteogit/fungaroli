#!/usr/bin/env python3
"""Primo lotto OSM controllato. Legge solo acquisizioni locali, nessuna chiamata di rete.
Eseguire senza --apply per generare ricevuta/candidati; --apply aggiorna le fonti del repository.
Le acquisizioni grezze restano in incoming, escluso dagli asset pubblicati.
"""
import argparse,json,pathlib,xml.etree.ElementTree as ET,hashlib
ROOT=pathlib.Path(__file__).resolve().parent.parent
RAW=ROOT/'incoming/trails-open-2026-10-20';DAY='2026-10-20'
parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
load=lambda p:json.loads((ROOT/p).read_text())
save=lambda p,d:(ROOT/p).write_text(json.dumps(d,ensure_ascii=False,indent=2) +'\n' if p=='data/zones.json' else json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n')
trails=load('data/trails.json');zones=load('data/zones.json');access=load('data/access.json')
previous_receipt=json.loads((RAW/'receipt.json').read_text())if(RAW/'receipt.json').exists()else None
old={'parking':next(z['parking']for z in zones['zones']if z['id']=='vallonina'),'access':access['zones']['vallonina'],'drive':trails['zones']['vallonina'].get('drive')}
if previous_receipt and previous_receipt.get('applied'):old=previous_receipt['quarantined']['oldAccessTargets']
relations={};files=[]
for rid in [10645640,10645560,10645472]:
 p=RAW/f'osm-relation-{rid}.xml';root=ET.parse(p).getroot();e=root.find('relation');tags={t.attrib['k']:t.attrib['v']for t in e.findall('tag')}
 if e.attrib['id']!=str(rid) or tags.get('route')!='hiking':raise ValueError('Identità relazione non valida')
 relations[rid]={'sourceUrl':f'https://www.openstreetmap.org/relation/{rid}','license':'ODbL-1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/','checkedOn':DAY,'sourceUpdatedOn':e.attrib['timestamp'][:10],'sourceVersion':int(e.attrib['version']),'mappedOperator':tags.get('operator'),'originStatement':tags.get('source'),'geometryReacquired':False,'sourceHash':hashlib.sha256(p.read_bytes()).hexdigest()}
 files.append({'file':str(p.relative_to(ROOT)),'sha256':relations[rid]['sourceHash']})
 for z in trails['zones'].values():
  for t in z['trails']:
   if t['id']==rid:
    for key,tag in [('difficulty','cai_scale'),('duration','duration:forward'),('ascent','ascent')]:
     if tags.get(tag)!=t.get(key):raise ValueError(f'Conflitto {rid} {key}: revisionare prima di aggiornare')
    t['sourceEvidence']=relations[rid]
    if rid==10645640:
     added=[{'provider':'CAI','url':'https://sentieroitalia.cai.it/track/si-o15/','label':'Tappa collegata sul sito del CAI','relationship':'official_context','note':'La tappa SI O15 utilizza il sentiero 404, ma è un itinerario distinto: distanze e tempi non vanno trasferiti a questo tratto.','checkedOn':DAY,'status':'reviewed'}, {'provider':'Wikiloc','url':'https://it.wikiloc.com/percorsi-escursionismo/sella-jacci-e-selletta-di-pratorecchia-da-rifugio-sebastiani-211730293','label':'Altro itinerario su Wikiloc','authorLabel':'fb1947','caution':'Include passaggi fuori sentiero','relationship':'partly_overlapping','note':'Itinerario diverso che utilizza un tratto del 404 e descrive anche passaggi fuori sentiero. Consultalo sul sito originale; non è la geometria mostrata da Fronda.','checkedOn':DAY,'status':'reviewed'}]
     existing=t.setdefault('relatedLinks',[])
     for a in added:
      if not any(x.get('url')==a['url']for x in existing):existing.append(a)
      elif a.get('caution'):
       for x in existing:
        if x.get('url')==a['url']:x.setdefault('caution',a['caution'])
places={}
for file in ['vallonina-map.osm','sebastiani-map.osm']:
 p=RAW/file;root=ET.parse(p).getroot();nodes={e.attrib['id']:(float(e.attrib['lat']),float(e.attrib['lon']))for e in root.findall('node')};files.append({'file':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 for e in root:
  tags={t.attrib['k']:t.attrib['v']for t in e.findall('tag')};kind=tags.get('amenity')if tags.get('amenity')in ['parking','drinking_water','shelter','toilets']else tags.get('tourism')if tags.get('tourism')in ['alpine_hut','wilderness_hut','picnic_site']else None
  if not kind or tags.get('access')in ['no','private']:continue
  if e.tag=='node':lat,lon=float(e.attrib['lat']),float(e.attrib['lon']);method='node'
  elif e.tag=='way':
   pts=[nodes[n.attrib['ref']]for n in e.findall('nd')if n.attrib['ref']in nodes]
   if not pts:continue
   if pts[0]==pts[-1]:pts=pts[:-1]
   lat,lon=[sum(p[i]for p in pts)/len(pts)for i in [0,1]];method='area_representative'
  else:continue
  key=f'osm:{e.tag}:{e.attrib["id"]}'
  places[key]={'id':key,'kind':kind,'name':tags.get('name')or'Parcheggio mappato presso Sella di Leonessa','lat':round(lat,6),'lon':round(lon,6),'positionMethod':method,'elevation':int(tags['ele'])if tags.get('ele','').isdigit()else None,'mappedAccess':tags.get('access'),'mappedFee':tags.get('fee'),'mappedOpeningHours':tags.get('opening_hours'),'sourceUrl':f'https://www.openstreetmap.org/{e.tag}/{e.attrib["id"]}','sourceVersion':int(e.attrib['version']),'sourceUpdatedOn':e.attrib['timestamp'][:10],'checkedOn':DAY,'license':'ODbL-1.0','status':'mapped','liveAvailability':None}
if len(places)!=3:raise ValueError('Copertura inattesa: revisionare il lotto')
trails['zones']['vallonina']['publicPlaces']=sorted(places.values(),key=lambda p:(p['kind']!='parking',p['name']))
# Correzione circoscritta: i vecchi obiettivi sono i due rifugi, non aree di parcheggio.
park=places['osm:way:132609641']
for z in zones['zones']:
 if z['id']=='vallonina':
  z['parking']=[{k:park[k]for k in ['name','lat','lon','sourceUrl','checkedOn','license']}|{'accessStatus':'unknown','positionMethod':park['positionMethod']}]
  z['drive_min']=None;z['drive_km']=None
access['zones']['vallonina']=[];trails['zones']['vallonina']['drive']=None
trails.update(license='ODbL-1.0',licenseUrl='https://opendatacommons.org/licenses/odbl/1-0/',attribution='© contributori OpenStreetMap; geometrie del catalogo da OSM/Waymarked Trails',researchCheckedOn=DAY)
receipt={'checkedOn':DAY,'applied':args.apply,'source':'OpenStreetMap API 0.6, ODbL','objects':list(relations)+list(places),'files':files,'coverage':'Tre relazioni e due riquadri limitati a Vallonina/Sella di Leonessa; nessuna posizione utente. Geometrie sentieri esistenti conservate.','quarantined':{'oldAccessTargets':old,'reason':'I due obiettivi coincidono con rifugi mappati; tempi e percorsi derivati non attestano un parcheggio o un accesso automobilistico.'},'rejectedLinks':[{'url':'https://www.komoot.com/smarttour/28487608','reason':'HTTP 410 durante la verifica: non pubblicato'}],'failedQueries':['Overpass principale HTTP 406','Overpass kumi timeout; usate due letture delimitate OSM API, nessuna conclusione su oggetti mancanti']}
(RAW/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
if args.apply:
 for p,d in [('data/trails.json',trails),('data/zones.json',zones),('data/access.json',access)]:save(p,d)
print(json.dumps({'applied':args.apply,'routes':len(relations),'routeOccurrences':sum(t['id']in relations for z in trails['zones'].values()for t in z['trails']),'places':len(places),'receipt':str(RAW/'receipt.json')},ensure_ascii=False))
