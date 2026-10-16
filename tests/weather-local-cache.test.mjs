import test from 'node:test';
import assert from 'node:assert/strict';
import {saveZoneWeather,cachedZoneWeather,validWeatherRows,migrateGrowthCache} from '../js/weather-cache.js';
import {loadWeather,todayISO} from '../js/weather.js';
const zones=[{id:'a',lat:42,lon:12,bands:[800]},{id:'b',lat:43,lon:13,bands:[900]}];
const raw=()=>[{daily:{time:[todayISO()],precipitation_sum:[7],temperature_2m_mean:[13],temperature_2m_min:[8],temperature_2m_max:[18],soil_moisture_3_to_9cm_mean:[.3],soil_temperature_6cm_mean:[13]}}];
function storage(){const data=new Map();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};return data;}
test('cache rejects invalid dimensions, future dates and older replacements',()=>{
 storage();const t=Date.now();saveZoneWeather(zones[0],'growth',{t,raw:raw()});saveZoneWeather(zones[0],'growth',{t:t-1000,raw:raw()});
 assert.equal(cachedZoneWeather(zones[0]).t,t);assert.equal(cachedZoneWeather({...zones[0],bands:[900]}),null);
 assert.equal(cachedZoneWeather(zones[0],'growth',t-1),null);assert.equal(cachedZoneWeather(zones[0],'growth',t+7*864e5),null);
 assert.equal(validWeatherRows([{daily:{time:[todayISO()]}}],1),false);
});
test('saved data is emitted before network completes; partial successes survive reopening',async()=>{
 storage();const original=global.fetch;global.document={};const t=Date.now()-7200000;
 saveZoneWeather(zones[0],'growth',{t,raw:raw()});let release;const phases=[];
 global.fetch=async url=>{if(new URL(url,'https://local').searchParams.get('latitude')==='43')return Response.json({},{status:429});return new Promise(r=>release=()=>r(Response.json(raw())));};
 try{
  const loading=loadWeather(zones,{onUpdate:(w,m)=>phases.push({w,m})});
  assert.equal(phases[0].m.phase,'cache');assert.equal(phases[0].w.series.a[0].source.fetchedAt,new Date(t).toISOString());
  await new Promise(r=>setTimeout(r,0));release();const result=await loading;
  assert.deepEqual(result.missingZones,['b']);assert.ok(cachedZoneWeather(zones[0]).t>t);
  global.fetch=async()=>Response.json({},{status:429});const reopened=[];
  await loadWeather(zones,{onUpdate:w=>reopened.push(w)});assert.ok(reopened[0].series.a);assert.deepEqual(reopened[0].missingZones,['b']);
 }finally{global.fetch=original;delete global.document;delete global.localStorage;}
});
test('local storage failures leave live forecasts usable; expired data is explicitly marked',async()=>{
 storage();saveZoneWeather(zones[0],'growth',{t:Date.now()-25*3600000,raw:raw()});const original=global.fetch;global.document={};global.fetch=async()=>Response.json({},{status:429});
 try{const result=await loadWeather([zones[0]]);assert.equal(result.series.a[0].source.expired,true);assert.equal(result.stale,true);
 global.localStorage.setItem=()=>{throw new Error('quota');};assert.doesNotThrow(()=>saveZoneWeather(zones[1],'growth',{t:Date.now(),raw:raw()}));
 }finally{global.fetch=original;delete global.document;delete global.localStorage;}
});
test('a fresh download stamped by a server clock ahead of the device stays usable and is saved',async()=>{
 storage();const original=global.fetch;global.document={};
 global.fetch=async()=>Response.json(raw(),{headers:{'x-weather-fetched-at':new Date(Date.now()+5000).toISOString(),'x-weather-cache':'miss'}});
 try{const result=await loadWeather([zones[0]]);
  assert.equal(result.series.a[0].source.expired,false);assert.ok(result.fetchedAt.getTime()<=Date.now());
  assert.ok(cachedZoneWeather(zones[0]));
 }finally{global.fetch=original;delete global.document;delete global.localStorage;}
});
test('legacy whole-catalogue copies migrate once, expired ones are dropped, other geometries wait',()=>{
 const sig=zones.flatMap(z=>z.bands.map(b=>`${z.lat},${z.lon},${b}`)).join(';'),t=Date.now()-3600000;
 const data=storage();localStorage.setItem('fungaroli:weather:v2',JSON.stringify({sig:'2026-10-13|'+sig,t,data:[...raw(),...raw()]}));
 migrateGrowthCache(zones);assert.equal(cachedZoneWeather(zones[1]).t,t);assert.equal(data.has('fungaroli:weather:v2'),false);
 localStorage.setItem('fungaroli:weather:v2',JSON.stringify({sig:'x|'+sig,t:Date.now()-7*864e5,data:[]}));migrateGrowthCache(zones);assert.equal(data.has('fungaroli:weather:v2'),false);
 localStorage.setItem('fungaroli:weather:v2',JSON.stringify({sig:'x|other',t,data:[]}));migrateGrowthCache(zones);assert.equal(data.has('fungaroli:weather:v2'),true);
 delete global.localStorage;
});

// ---- Strato 9–27 cm: le copie locali precedenti restano valide, la richiesta nuova è quella accettata dal Worker ----
test('una copia locale senza lo strato 9–27 cm resta valida e non viene riscaricata prima del tempo',async()=>{
 storage();const original=global.fetch;global.document={};let calls=0;
 saveZoneWeather(zones[0],'growth',{t:Date.now()-60000,raw:raw()});
 global.fetch=async()=>{calls++;return Response.json(raw());};
 try{const w=await loadWeather([zones[0]]);
  assert.equal(calls,0);assert.deepEqual(w.series.a[0].soilm9to27,[null]);assert.equal(w.series.a[0].soilm[0],.3);assert.equal(w.series.a[0].soilt[0],13);
 }finally{global.fetch=original;delete global.document;delete global.localStorage;}
});
test('la richiesta del browser include lo strato 9–27 cm, è accettata dal Worker e la media viene salvata',async()=>{
 const data=storage();const original=global.fetch;global.document={};let url;
 const deep=()=>raw().map(r=>({...r,daily:{...r.daily,soil_moisture_9_to_27cm_mean:[.28]}}));
 global.fetch=async u=>{url=u;return Response.json(deep());};
 try{const w=await loadWeather([zones[0]]);
  assert.deepEqual(w.series.a[0].soilm9to27,[.28]);
  assert.match(data.get('fungaroli:weather:zones:v3'),/soil_moisture_9_to_27cm_mean/);
  const q=new URL(url,'https://local').searchParams;assert.ok(q.get('hourly').split(',').includes('soil_moisture_9_to_27cm'));
  const {cachedForecast}=await import('../worker/weather-provider.js');
  const today=todayISO(),hourly={time:Array.from({length:24},(_,h)=>`${today}T${String(h).padStart(2,'0')}:00`)};
  for(const f of q.get('hourly').split(','))hourly[f]=Array(24).fill(.3);
  const res=await cachedForecast(q,{zones:[zones[0]],now:Date.now(),fetcher:async()=>Response.json([{daily:raw()[0].daily,hourly}])});
  assert.equal(res.status,200);assert.ok(Math.abs((await res.json())[0].daily.soil_moisture_9_to_27cm_mean[0]-.3)<1e-12);
 }finally{global.fetch=original;delete global.document;delete global.localStorage;}
});
