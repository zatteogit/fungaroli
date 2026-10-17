import test from 'node:test';
import assert from 'node:assert/strict';
import {cachedForecast,forecastParams,compactGrowth} from '../worker/weather-provider.js';
import {fetchForecast} from '../js/weather-request.js';
import {todayISO,toDaily} from '../js/weather.js';
const now=Date.parse(todayISO()+'T10:00:00Z'),zones=[{lat:42.4,lon:12.8,bands:[800,1000]}];
const cache=()=>{const data=new Map();return{data,get:async k=>data.has(k)?JSON.parse(data.get(k)):null,put:async(k,v)=>data.set(k,v)};};
const raw=(kind='growth')=>Array.from({length:kind==='growth'?2:1},()=>Object.fromEntries(['daily','hourly'].filter(g=>forecastParams(zones,kind).has(g)).map(g=>[g,{time:[todayISO(new Date(now))+(g==='hourly'?'T12:00':'')],...Object.fromEntries(forecastParams(zones,kind).get(g).split(',').map(f=>[f,[0]]))}])));
test('shared cache coalesces parallel downloads and preserves the provider acquisition date',async()=>{
  const storage=cache();let calls=0;
  const options={zones,cache:storage,now,fetcher:async()=>{calls++;await new Promise(r=>setTimeout(r,10));return Response.json(raw());}};
  const params=forecastParams(zones,'growth');
  const [a,b]=await Promise.all([cachedForecast(params,options),cachedForecast(params,options)]);
  assert.equal(calls,1);assert.deepEqual(await a.json(),await b.json());
  const hit=await cachedForecast(params,{...options,now:now+60000});
  assert.equal(hit.headers.get('x-weather-cache'),'hit');assert.equal(hit.headers.get('x-weather-fetched-at'),new Date(now).toISOString());assert.equal(calls,1);
});
test('rate limiting falls back to dated data within its limit and never renews its age',async()=>{
  const storage=cache(),params=forecastParams(zones,'outing');
  await cachedForecast(params,{zones,cache:storage,now,fetcher:async()=>Response.json(raw('outing'))});
  const limited={zones,cache:storage,now:now+3600001,fetcher:async()=>Response.json({error:true},{status:429})};
  const stale=await cachedForecast(params,limited);
  assert.equal(stale.headers.get('x-weather-cache'),'stale');assert.equal(stale.headers.get('x-weather-fetched-at'),new Date(now).toISOString());
  await assert.rejects(cachedForecast(params,{...limited,now:now+3*3600000+1}),e=>e.status===429);
});
test('arbitrary coordinates, duplicate parameters and extra models cannot spend provider quota',async()=>{
  let calls=0;const options={zones,cache:cache(),now,fetcher:async()=>{calls++;return Response.json(raw());}};
  for(const edit of [p=>p.set('latitude','0,0'),p=>p.append('latitude',p.get('latitude')),p=>p.set('models','gfs_seamless')]){
    const query=forecastParams(zones,'growth');edit(query);await assert.rejects(cachedForecast(query,options),e=>e.status===422);
  }
  assert.equal(calls,0);
});
test('incomplete or malformed provider data cannot poison the shared cache',async()=>{
  for(const response of [raw().slice(0,1),[{daily:{time:[5]}},{}]]){
    const storage=cache();await assert.rejects(cachedForecast(forecastParams(zones,'growth'),{zones,cache:storage,now,fetcher:async()=>Response.json(response)}),e=>e.status===502);assert.equal(storage.data.size,0);
  }
});
test('browser request has a timeout and keeps a stale server timestamp',async()=>{
  const original=global.fetch,document=global.document;global.document={};
  // Date del client nel passato: il client riporta all'ora del dispositivo quelle future.
  const stamp=Date.now()-7200000;
  global.fetch=async(url,opts)=>{assert.match(url,/^\/api\/weather\/v1\/forecast\?/);assert.ok(opts.signal instanceof AbortSignal);return Response.json(raw(),{headers:{'x-weather-fetched-at':new Date(stamp).toISOString(),'x-weather-cache':'stale'}});};
  try{const received=await fetchForecast(forecastParams(zones,'growth'));assert.equal(received.fetchedAt.getTime(),stamp);assert.equal(received.stale,true);}
  finally{global.fetch=original;if(document===undefined)delete global.document;else global.document=document;}
});
test('compact soil series preserve hourly means, incomplete days and all daily climate data',()=>{
  const row={daily:{time:['2026-10-12','2026-10-13'],precipitation_sum:[4,null],temperature_2m_mean:[13,14],temperature_2m_min:[8,9],temperature_2m_max:[18,19]},hourly:{time:Array.from({length:48},(_,i)=>`2026-10-${i<24?'12':'13'}T${String(i%24).padStart(2,'0')}:00`),soil_moisture_3_to_9cm:Array(48).fill(.3),soil_temperature_6cm:Array(48).fill(13)}};
  row.hourly.soil_moisture_3_to_9cm[29]=null;
  const small=compactGrowth([row])[0];
  assert.equal(small.hourly,undefined);assert.equal(small.daily.soil_moisture_3_to_9cm_mean[1],null);
  const full=toDaily(row,'2026-10-13'),compact=toDaily(small,'2026-10-13');
  for(const key of ['dates','p','tmean','tmin','tmax','soilm','soilt'])assert.deepEqual(compact[key],full[key]);
});
test('small provider batches stay bounded and preserve the requested elevation order',async()=>{
  const wide=[{...zones[0],bands:Array.from({length:12},(_,i)=>600+i*100)}],storage=cache();let live=0,max=0,calls=0;
  const result=await cachedForecast(forecastParams(wide,'growth'),{zones:wide,cache:storage,now,fetcher:async url=>{
    const elevations=new URL(url).searchParams.get('elevation').split(',').map(Number);assert.ok(elevations.length<=5);
    calls++;live++;max=Math.max(max,live);await new Promise(resolve=>setTimeout(resolve,elevations[0]===600?15:1));live--;
    return Response.json(elevations.map(elevation=>({...raw()[0],elevation})));
  }});
  assert.equal(calls,3);assert.ok(max<=3);assert.deepEqual((await result.json()).map(r=>r.elevation),wide[0].bands);
});
test('browser requests published zones separately with bounded concurrency and retains the oldest acquisition date',async()=>{
  const original=global.fetch,document=global.document;global.document={};
  const wide=Array.from({length:8},(_,i)=>({lat:42+i*.01,lon:12+i*.01,bands:[700,900,1100]}));let live=0,max=0,calls=0;const base=Date.now()-3600000;
  global.fetch=async url=>{
    const q=new URL(url,'https://example.test').searchParams,elevations=q.get('elevation').split(',').map(Number),i=wide.findIndex(z=>String(z.lat)===q.get('latitude').split(',')[0]);
    assert.equal(elevations.length,3);assert.equal(new Set(q.get('latitude').split(',')).size,1);
    calls++;live++;max=Math.max(max,live);await new Promise(r=>setTimeout(r,i===0?10:1));live--;
    return Response.json(elevations.map(elevation=>({elevation,latitude:wide[i].lat})),{headers:{'x-weather-fetched-at':new Date(base-i*60000).toISOString()}});
  };
  try {
    const result=await fetchForecast(forecastParams(wide,'growth'));assert.equal(calls,8);assert.ok(max<=3);
    assert.deepEqual(result.raw.map(r=>r.latitude),wide.flatMap(z=>z.bands.map(()=>z.lat)));assert.equal(result.fetchedAt.getTime(),base-7*60000);
  } finally{global.fetch=original;if(document===undefined)delete global.document;else global.document=document;}
});
test('one failing zone does not cancel successful forecasts or shift elevations',async()=>{
  const original=global.fetch,document=global.document;global.document={};
  const selection=[{id:'ok-first',lat:42,lon:13,bands:[800,1000]},{id:'missing',lat:43,lon:13,bands:[900]},{id:'ok-last',lat:44,lon:13,bands:[700]}];let failedCalls=0;
  global.fetch=async url=>{const q=new URL(url,'https://test.local').searchParams;if(q.get('latitude')==='43'){failedCalls++;return Response.json({error:'Temporaneamente non disponibile'},{status:503});}return Response.json(q.get('elevation').split(',').map(e=>({elevation:Number(e),daily:{time:[todayISO()],precipitation_sum:[3],temperature_2m_mean:[13],temperature_2m_min:[8],temperature_2m_max:[18]}})),{headers:{'x-weather-fetched-at':new Date().toISOString()}});};
  try{
    const result=await fetchForecast(forecastParams(selection,'growth'));assert.equal(result.partial,true);assert.equal(failedCalls,2);assert.deepEqual(result.raw.map(r=>r?.elevation??null),[800,1000,null,700]);
    const {loadWeather}=await import('../js/weather.js');const writes=[];const oldStorage=global.localStorage;global.localStorage={getItem:()=>null,setItem:(...x)=>writes.push(x)};
    try{const weather=await loadWeather(selection);assert.deepEqual(weather.missingZones,['missing']);assert.deepEqual(Object.keys(weather.series),['ok-first','ok-last']);assert.equal(writes.length,2);}finally{if(oldStorage===undefined)delete global.localStorage;else global.localStorage=oldStorage;}
  }finally{global.fetch=original;if(document===undefined)delete global.document;else global.document=document;}
});

test('stale shared cache is immediate, refresh is coalesced and failures preserve its date',async()=>{
 const storage=cache(),params=forecastParams(zones,'growth');
 await cachedForecast(params,{zones,cache:storage,now,fetcher:async()=>Response.json(raw())});
 let finish,calls=0;const work=[];
 const options={zones,cache:storage,now:now+3600001,waitUntil:p=>work.push(p),fetcher:()=>{calls++;return new Promise(r=>finish=r);}};
 const saved=await cachedForecast(params,options);
 assert.equal(saved.headers.get('x-weather-refreshing'),'1');assert.equal(saved.headers.get('x-weather-fetched-at'),new Date(now).toISOString());
 // Il follower calcola lo SHA-256 in modo asincrono: il download si sblocca
 // solo dopo che ha letto la cache, altrimenti sotto carico troverebbe già la copia nuova.
 const read=storage.get;let followerRead;const hasRead=new Promise(r=>followerRead=r);
 storage.get=async(...args)=>{const value=await read(...args);followerRead();return value;};
 const follower=cachedForecast(params,{...options,waitForFresh:true});
 await hasRead;storage.get=read;await new Promise(r=>setTimeout(r,0));assert.equal(calls,1);
 finish(Response.json(raw()));const fresh=await follower;await Promise.all(work);
 assert.equal(fresh.headers.get('x-weather-cache'),'miss');assert.equal(fresh.headers.get('x-weather-fetched-at'),new Date(now+3600001).toISOString());
 const bad=await cachedForecast(params,{...options,now:now+7200002,fetcher:async()=>Response.json({},{status:429})});
 await Promise.all(work);assert.equal(bad.headers.get('x-weather-fetched-at'),new Date(now+3600001).toISOString());
});
test('shared cache survives midnight when its forecast covers the new day',async()=>{
 const storage=cache(),params=forecastParams(zones,'growth'),before=Date.parse(todayISO()+'T21:59:00Z');let calls=0;
 const rows=raw();for(const row of rows)for(const group of ['daily','hourly']){const data=row[group];for(const field of Object.keys(data))data[field].push(field==='time'?todayISO(new Date(before+3600000))+(group==='hourly'?'T12:00':''):0);}
 const fetcher=async()=>{calls++;return Response.json(rows);};
 await cachedForecast(params,{zones,cache:storage,now:before,fetcher});
 const hit=await cachedForecast(params,{zones,cache:storage,now:before+120000,fetcher});
 assert.equal(hit.headers.get('x-weather-cache'),'hit');assert.equal(calls,1);
});

test('fresh shared outing cache serves another client without calling the provider',async()=>{
 const storage=cache(),params=forecastParams(zones,'outing');let calls=0;
 const fetcher=async()=>{calls++;return Response.json(raw('outing'));};
 await cachedForecast(params,{zones,cache:storage,now,fetcher});
 const second=await cachedForecast(params,{zones,cache:storage,now:now+60000,fetcher});
 assert.equal(calls,1);assert.equal(second.headers.get('x-weather-cache'),'hit');
 assert.equal(second.headers.get('x-weather-fetched-at'),new Date(now).toISOString());assert.deepEqual(await second.json(),raw('outing'));
});
