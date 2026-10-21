#!/usr/bin/env python3
"""Incremental real Lazio sampling. Never invokes full builders or alters existing zones.
Run with the sampling venv; source, response hashes and blocks live in incoming.
"""
import argparse, datetime, hashlib, json, math, subprocess, sys, time, urllib.parse
from pathlib import Path
import build_habitat as h
import build_trails as t
from shapely import STRtree
from shapely.geometry import LineString, MultiLineString, Point
from shapely.ops import linemerge, transform
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'incoming/lazio-pilot-2026-10-19/integration/campionamenti'
OUT.mkdir(parents=True,exist_ok=True)
CACHE=OUT/'responses'; CACHE.mkdir(exist_ok=True)
LOG=OUT/'requests.jsonl'
LAST_DEM=0
LAST_DEM_COUNT=100
DEM_MODE="copernicus-glo90-openmeteo"
DEM_STATE=OUT/"dem-provider.json"
if DEM_STATE.exists():DEM_MODE=json.loads(DEM_STATE.read_text())["provider"]
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(p,d):
 tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')) if p==ROOT/'data/trails.json' else json.dumps(d,ensure_ascii=False,indent=1));tmp.replace(p)
def request(url,params=None,body=None):
 global LAST_DEM,LAST_DEM_COUNT
 q=url+('?' + urllib.parse.urlencode(params) if params else '')
 key=hashlib.sha256((q+json.dumps(body,sort_keys=True)).encode()).hexdigest(); f=CACHE/(key+'.json')
 if f.exists(): return json.loads(f.read_text())
 for attempt in range(3):
  if url==h.ELEV:
   delay=max(0,11.5*LAST_DEM_COUNT/100-(time.monotonic()-LAST_DEM))
   if delay:time.sleep(delay)
   LAST_DEM=time.monotonic()
   LAST_DEM_COUNT=len(str((params or {}).get("latitude","")).split(","))
  started=time.monotonic();cmd=['curl','-sS','-m','90','-A',h.UA,q]
  if body is not None: cmd+=['-H','Content-Type: application/json','-d',json.dumps(body)]
  r=subprocess.run(cmd,capture_output=True)
  record={'at':now(),'url':q,'body':body,'attempt':attempt+1,'seconds':round(time.monotonic()-started,3),'curlExit':r.returncode,'bytes':len(r.stdout),'sha256':hashlib.sha256(r.stdout).hexdigest(),'response':str(f.relative_to(ROOT))}
  try:
   d=json.loads(r.stdout)
   if r.returncode or isinstance(d,dict) and d.get('error'): raise ValueError(str(d)[:200])
   f.write_bytes(r.stdout);record['status']='ok'
   with LOG.open('a') as l:l.write(json.dumps(record)+'\n')
   return d
  except (ValueError, json.JSONDecodeError) as e:
   last_error=str(e)
   record.update(status='failed',error=str(e)[:200],stderr=r.stderr.decode(errors='replace')[:200])
   with LOG.open('a') as l:l.write(json.dumps(record)+'\n')
   if attempt<2:time.sleep(60 if 'Minutely' in str(e) else 2**attempt)
 raise RuntimeError('API failed: '+q[:160]+'; '+last_error[:200])
h.get_json=request;t.get_json=request
# Every elevation request must return one finite value per point: no zip truncation or zero fills.
def elevations(pts):
 out=[]
 for k in range(0,len(pts),100):
  c=pts[k:k+100]
  if DEM_MODE=='copernicus-glo90-openmeteo':
   d=request(h.ELEV,{'latitude':','.join(f'{p[1]:.5f}' for p in c),'longitude':','.join(f'{p[0]:.5f}' for p in c)});es=d.get('elevation')
  else:
   d=request('https://api.opentopodata.org/v1/srtm90m',{'locations':'|'.join(f'{p[1]:.5f},{p[0]:.5f}' for p in c),'interpolation':'bilinear'});es=[r.get('elevation') for r in d.get('results',[])]
   time.sleep(1.1)
  if not isinstance(es,list) or len(es)!=len(c) or any(not isinstance(e,(float,int)) or not math.isfinite(e) for e in es):raise ValueError('Missing/invalid DEM elevation')
  out+=es;time.sleep(.4)
 return out

def habitat(z):
 polys=h.fetch_forest(z['lat'],z['lon'],z['radius_m']);tree=STRtree([p[0] for p in polys]);pts=[]
 for i in range(21):
  for j in range(21):
   dx=(i/20*2-1)*z['radius_m'];dy=(j/20*2-1)*z['radius_m']
   if dx*dx+dy*dy<=z['radius_m']**2:pts.append((z['lon']+dx/(111320*math.cos(math.radians(z['lat']))),z['lat']+dy/111320))
 es=elevations(pts);cats=sorted({p[1] for p in polys});samples=[]
 for (lon,lat),e in zip(pts,es):
  pt=Point(*h.to_utm(lon,lat));cat=None
  for ix in tree.query(pt):
   if polys[ix][0].contains(pt):cat=polys[ix][1];break
  samples.append([round(e),cats.index(cat) if cat else -1,round(lat,5),round(lon,5),None,None,-1,None,None])
 roadnames=[];roaderrors=[]
 for k in range(0,len(samples),40):
  chunk=samples[k:k+40]
  try:
   ds=request('https://valhalla1.openstreetmap.de/locate',body={'locations':[{'lat':s[2],'lon':s[3]} for s in chunk],'costing':'auto','verbose':True})
   if not isinstance(ds,list) or len(ds)!=len(chunk):raise ValueError('incomplete Valhalla response')
   for s,loc in zip(chunk,ds):
    edges=loc.get('edges') or []
    if not edges:continue
    ed=min(edges,key=lambda e:e.get('distance',1e9));cl=(ed.get('edge') or {}).get('classification') or {};names=(ed.get('edge_info') or {}).get('names') or []
    name=next((n for n in names if n[:2] in ('SS','SR','SP')),names[0] if names else None)
    if name and name not in roadnames:roadnames.append(name)
    s[4:]=[round(ed['distance']),h.SURF.get(cl.get('surface')),roadnames.index(name) if name else -1,round(ed['correlated_lat'],5),round(ed['correlated_lon'],5)]
  except Exception as e:roaderrors.append({'startSample':k,'count':len(chunk),'error':str(e)})
  time.sleep(.5)
 used=sorted({cats[s[1]] for s in samples if s[1]>=0})
 for s in samples:
  if s[1]>=0:s[1]=used.index(cats[s[1]])
 cats=used
 stats=h.elevation_stats(samples)
 return {'forest':h.composition(polys,z['lat'],z['lon'],z['radius_m']),'elevation':stats,'sample_categories':cats,'road_names':roadnames,'samples':samples},polys,roaderrors

def trails(z,polys):
 R=z['radius_m'];dlat=R/111320;dlon=R/(111320*math.cos(math.radians(z['lat'])))
 x0,y0=t.ll2m(z['lon']-dlon,z['lat']-dlat);x1,y1=t.ll2m(z['lon']+dlon,z['lat']+dlat)
 items=request(t.WMT+'/list/by_area',{'bbox':f'{x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f}','limit':100})['results']
 refs={str(r).lower().replace(' ','') for r in z.get('officialTrailRefs',[])}
 names=[str(n).casefold() for n in z.get('officialTrailNameMatches',[])]
 # Only mapped relations matching the institution's documented trail reference are imported.
 selected=[it for it in items if str(it.get('ref','')).lower().replace(' ','') in refs or any(n in str(it.get('name','')).casefold() for n in names)]
 cats=sorted({p[1] for p in polys});tree=STRtree([p[0] for p in polys]);circle=Point(*t.ll2utm(z['lon'],z['lat'])).buffer(R,64)
 result=[];audit=[]
 for it in selected:
  d=request(t.WMT+'/details/relation/'+str(it['id']));ways=[];t.collect_ways(d.get('route'),ways)
  lines=[w for w in ways if isinstance(w,LineString)]
  if not lines:continue
  geom=transform(t.m2utm,linemerge(MultiLineString(lines)));inside=geom.intersection(circle)
  if inside.is_empty or inside.length<500:continue
  parts=list(inside.geoms) if hasattr(inside,'geoms') else [inside];parts=[p for p in parts if isinstance(p,LineString) and p.length>=150]
  if not parts:continue
  pts=[]
  for p in parts:
   n=max(1,int(p.length//100));pts +=[p.interpolate((k+.5)*p.length/n) for k in range(n)]
  es=elevations([t.utm2ll(p.x,p.y) for p in pts]);samp=[]
  for pt,e in zip(pts,es):
   c=-1
   for ix in tree.query(pt):
    if polys[ix][0].contains(pt):c=cats.index(polys[ix][1]);break
   samp.append([round(e),c])
  length=sum(p.length for p in parts);tags=d.get('tags') or {};official=d.get('official_length');mapped=(d.get('route') or {}).get('length') or 0
  full=t.full_length_m(official,mapped,tags.get('type')=='superroute',length)
  result.append({'id':it['id'],'ref':it.get('ref') or tags.get('ref'),'name':it.get('name') or tags.get('name'),'itinerary':it.get('itinerary') or [],'group':it.get('group'),'operator':d.get('operator') or tags.get('operator'),'difficulty':tags.get('cai_scale'),'total_km':round(full/1000,1) if full else None,'duration':tags.get('duration:forward') or tags.get('duration'),'ascent':tags.get('ascent'),'in_zone_km':round(length/1000,1),'samples':samp,'lines':[[[round(lat,5),round(lon,5)] for lon,lat in (t.utm2ll(x,y) for x,y in p.simplify(15).coords)] for p in parts]})
  audit.append({'relation':it['id'],'ref':it.get('ref'),'source':f'https://www.openstreetmap.org/relation/{it["id"]}','license':'ODbL-1.0','officialTagLengthM':official,'mappedLengthM':mapped,'inZoneLengthM':length,'sampleCount':len(samp),'note':'Reference match with institutional itinerary; geometry independently obtained from OSM via Waymarked Trails. Match does not certify exact geometric identity or current opening.'})
 result.sort(key=lambda a:-a['in_zone_km'])
 # Drive destinations must be documented access/sosta, never zone centre.
 drive=None;driveerror=None
 if z.get('parking'):
  try:drive=t.drive(json.loads((ROOT/'data/zones.json').read_text())['origin'],z['parking'][0])
  except Exception as e:driveerror=str(e)
 return {'sample_categories':cats,'trails':result,'drive':drive},{'listedRelations':len(items),'requestedRefs':sorted(refs),'requestedDistinctiveNames':names,'matchedRelations':audit,'unmatchedRefs':sorted(refs-{str(x.get('ref','')).lower().replace(' ','') for x in selected}),'driveError':driveerror,'coverageLimit':100,'geometryStatus':'matched_osm_geometry' if result else 'no_documented_osm_match_imported'}

def dem_only(zones, only=None):
 global DEM_MODE
 result={}
 mf=OUT/'manifest.json';manifest=json.loads(mf.read_text()) if mf.exists() else {'zones':{}}
 queue=list(zones)
 while queue:
  z=queue.pop(0)
  if only and z['id'] not in only:continue
  old=manifest['zones'].get(z['id'],{})
  if old.get('elevation') and old.get('suggestedBandsM'):
   result[z['id']]={k:old.get(k) for k in ('elevation','suggestedBandsM','demProvider','demResolutionM')};result[z['id']].update(demProvider=old.get('demProvider','copernicus-glo90-openmeteo'),demResolutionM=90,habitatStatus='complete' if old.get('status')=='complete' else 'pending_wfs');save(OUT/'dem-bands.json',result);continue
  print(now(),'DEM-only',z['id'],DEM_MODE,flush=True)
  try:
   pts=[]
   for i in range(21):
    for j in range(21):
     dx=(i/20*2-1)*z['radius_m'];dy=(j/20*2-1)*z['radius_m']
     if dx*dx+dy*dy<=z['radius_m']**2:pts.append((z['lon']+dx/(111320*math.cos(math.radians(z['lat']))),z['lat']+dy/111320))
   es=elevations(pts);stats=h.elevation_stats([[round(e)] for e in es]);bands=[int(math.floor(stats[k]/10+.5)*10) for k in ('p25','median','p75')]
   data={'demProvider':DEM_MODE,'demResolutionM':90,'elevation':stats,'suggestedBandsM':bands,'gridPointCount':len(pts),'grid':21,'status':'dem_complete_habitat_pending','habitatStatus':'pending_wfs','habitatReason':'Carta Forestale WFS timed out repeatedly after 2026-10-19T10:54Z; no forest samples/composition substituted.','finished':now()}
   save(OUT/(z['id']+'-dem.json'),data|{'samplesLatLonElevation':[[round(lat,5),round(lon,5),round(e)] for (lon,lat),e in zip(pts,es)]})
   result[z['id']]=data;manifest['zones'][z['id']]=old|data;save(OUT/(z['id']+'-audit.json'),manifest['zones'][z['id']]);save(mf,manifest);save(OUT/'dem-bands.json',result)
  except Exception as e:
   print('DEM BLOCKED',z['id'],str(e),flush=True)
   if DEM_MODE=='copernicus-glo90-openmeteo' and ('Hourly' in str(e) or 'Daily' in str(e)):
    DEM_MODE='srtm-v3-90m-opentopodata';save(DEM_STATE,{'provider':DEM_MODE,'changedAt':now(),'reason':str(e),'policy':'Rerun whole zone with alternate DEM; never mix within-zone.'});queue.insert(0,z)
   else:
    result[z['id']]={'status':'dem_blocked','error':str(e),'at':now()};save(OUT/'dem-bands.json',result)
 manifest['demFinished']=now();save(mf,manifest)

def main():
 global DEM_MODE
 ap=argparse.ArgumentParser();ap.add_argument('--seeds',default='incoming/lazio-pilot-2026-10-19/integration/zone-seeds.json');ap.add_argument('--only',nargs='*');ap.add_argument('--dem-only',action='store_true');a=ap.parse_args()
 seeds=json.loads((ROOT/a.seeds).read_text());zones=seeds.get('zones',seeds) if isinstance(seeds,dict) else seeds
 if a.dem_only:return dem_only(zones,a.only)
 manifest={'started':now(),'grid':21,'DEM':{'primary':'Copernicus GLO-90 2021 via Open-Meteo; 90m; https://open-meteo.com/en/docs/elevation-api','fallback':'SRTM v3, 3 arcsec (~90m), bilinear via OpenTopoData; https://www.opentopodata.org/datasets/srtm/','policy':'Per-zone provider in audit. Fallback only after explicit hourly/daily source limit; no within-zone DEM mixing.'},'forest':'Regione Lazio Carta Forestale tipologica WFS geonode:tipi_forestali2; historical landcover, not current survey; CC BY 4.0','roads':'OSM via Valhalla; unknown surface remains null','trails':'OSM via Waymarked Trails, ODbL-1.0; exact institutional ref match; clipped parts <150m omitted as current builder','bands':'Suggested representative elevation bands = p25/median/p75 of complete 21x21 clipped grid; rounded to nearest 10m, half upward; not ecological thresholds','zones':{}}
 previous=OUT/'manifest.json'
 if previous.exists():manifest['zones']=json.loads(previous.read_text()).get('zones',{})
 hp=ROOT/'data/habitat.json';tp=ROOT/'data/trails.json';hab=json.loads(hp.read_text());trs=json.loads(tp.read_text());originalH=dict(hab['zones']);originalT=dict(trs['zones'])
 queue=list(zones)
 while queue:
  z=queue.pop(0)
  if a.only and z['id'] not in a.only:continue
  if manifest['zones'].get(z['id'],{}).get('status')=='complete':continue
  print(now(),z['id'],flush=True);record={'started':now(),'seed':z,'demProvider':DEM_MODE,'demResolutionM':90}
  try:
   hf=OUT/(z['id']+'-habitat.json');tf=OUT/(z['id']+'-trails.json');af=OUT/(z['id']+'-audit.json')
   old_audit=json.loads(af.read_text()) if af.exists() else {}
   same_provider=old_audit.get('demProvider','copernicus-glo90-openmeteo')==DEM_MODE
   if hf.exists() and same_provider: hd=json.loads(hf.read_text());polys=h.fetch_forest(z['lat'],z['lon'],z['radius_m']);roaderrors=json.loads(af.read_text()).get('roadErrors',[]) if af.exists() else []
   else:hd,polys,roaderrors=habitat(z);save(hf,hd)
   stats=hd['elevation'];bands=[int(math.floor(stats[k]/10+.5)*10) for k in ('p25','median','p75')]
   record.update(elevation=stats,suggestedBandsM=bands,forestPolygonCount=len(polys),habitatSamples=len(hd['samples']),roadErrors=roaderrors)
   save(af,record);save(OUT/'manifest.json',manifest | {'zones':manifest['zones'] | {z['id']:record}})
   if tf.exists() and same_provider:td=json.loads(tf.read_text());ta=old_audit.get('trails',{})
   else:td,ta=trails(z,polys);save(tf,td)
   record.update(trails=ta,status='complete',finished=now());save(af,record)
   # New zones only, preserve every pre-existing record exactly.
   if z['id'] in originalH and originalH[z['id']]!=hd or z['id'] in originalT and originalT[z['id']]!=td: raise ValueError('Refusing replacement of existing zone with different content')
   hab['zones'][z['id']]=hd;trs['zones'][z['id']]=td
   save(hp,hab);save(tp,trs)
  except Exception as e:
   record.update(status='blocked',error=str(e),finished=now());print('BLOCKED',z['id'],str(e),flush=True)
   if DEM_MODE=='copernicus-glo90-openmeteo' and ('Hourly' in str(e) or 'Daily' in str(e)):
    DEM_MODE='srtm-v3-90m-opentopodata';save(DEM_STATE,{'provider':DEM_MODE,'changedAt':now(),'reason':str(e),'policy':'Switch provider after source limit; rerun complete current zone, never mix DEMs within a zone.'});queue.insert(0,z);print('Switch whole-zone DEM provider to SRTM90m',flush=True)
  manifest['zones'][z['id']]=record;save(OUT/'manifest.json',manifest)
 manifest['finished']=now();manifest['existingHabitatPreserved']=all(hab['zones'][k]==v for k,v in originalH.items());manifest['existingTrailsPreserved']=all(trs['zones'][k]==v for k,v in originalT.items());save(OUT/'manifest.json',manifest)
if __name__=='__main__':main()
