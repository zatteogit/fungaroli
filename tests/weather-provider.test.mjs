import test from 'node:test';
import assert from 'node:assert/strict';
import {cachedForecast,forecastParams} from '../worker/weather-provider.js';
import {fetchForecast} from '../js/weather-request.js';
import {todayISO} from '../js/weather.js';
const now=Date.now(),zones=[{lat:42.4,lon:12.8,bands:[800,1000]}];
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
  global.fetch=async(url,opts)=>{assert.match(url,/^\/api\/weather\/v1\/forecast\?/);assert.ok(opts.signal instanceof AbortSignal);return Response.json(raw(),{headers:{'x-weather-fetched-at':new Date(now-7200000).toISOString(),'x-weather-cache':'stale'}});};
  try{const received=await fetchForecast(forecastParams(zones,'growth'));assert.equal(received.fetchedAt.getTime(),now-7200000);assert.equal(received.stale,true);}
  finally{global.fetch=original;if(document===undefined)delete global.document;else global.document=document;}
});
