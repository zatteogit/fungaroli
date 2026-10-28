import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {WEATHER_REFRESH_SCHEMA,weatherRefreshPlan,refreshSavedWeather} from '../worker/weather-refresh.js';
import {weatherStorage,WEATHER_STORAGE_SCHEMA} from '../worker/weather-storage.js';
import {cachedForecast,forecastParams} from '../worker/weather-provider.js';
import {todayISO} from '../js/weather.js';
import {weatherSnapshot} from '../worker/weather-snapshot.js';
const zones=Array.from({length:36},(_,i)=>({id:`zone-${String(i).padStart(2,'0')}`,lat:42+i/100,lon:12,bands:[800,1000,1200]}));
const now=Date.parse(todayISO()+'T10:00:00Z');
function cache(){const data=new Map();return {get:async k=>JSON.parse(data.get(k)||'null'),put:async(k,v)=>data.set(k,v)};}
function d1(){const db=new DatabaseSync(':memory:');const stmt=(sql,args=[])=>({bind:(...v)=>stmt(sql,v),first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>db.prepare(sql).run(...args)});return {prepare:sql=>stmt(sql),db};}
function response(url){const q=new URL(url).searchParams;return Response.json(q.get('latitude').split(',').map(()=>Object.fromEntries(['daily','hourly'].filter(g=>q.has(g)).map(g=>[g,{time:[todayISO(new Date(now))+(g==='hourly'?'T12:00':'')],...Object.fromEntries(q.get(g).split(',').map(f=>[f,[0]]))}]))));}
test('snapshot pubblico: un’unica lettura D1 per profilo, date per zona e nessuna acquisizione',async()=>{
 const env={CMS_DB:d1()},subset=zones.slice(0,4);let upstream=0;
 for(const kind of ['growth','outing'])for(const zone of subset)await cachedForecast(forecastParams([zone],kind),{zones:subset,cache:weatherStorage(env),now,fetcher:async url=>{upstream++;return response(url);}});
 const prepare=env.CMS_DB.prepare;let reads=0;
 env.CMS_DB.prepare=sql=>{if(sql.startsWith('SELECT cache_key,payload'))reads++;return prepare(sql);};
 for(const kind of ['growth','outing']){
  const result=await weatherSnapshot(kind,subset,env);assert.equal(result.status,200);
  const lines=(await result.text()).trim().split('\n').map(JSON.parse);assert.equal(lines.length,4);
  assert.ok(lines.every(line=>line.record.t===now&&line.record.raw.length===(kind==='growth'?3:1)));
 }
 assert.equal(reads,2);assert.equal(upstream,8);
 assert.equal((await weatherSnapshot('unknown',subset,env)).status,422);
 assert.equal((await weatherSnapshot('outing',zones.slice(5,6),env)).status,503);
});

test('il browser legge lo stream a blocchi e conserva le righe acquisite se lo stream si interrompe',async()=>{
 const previous={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};
 globalThis.document={};globalThis.window={};
 try{
  const {fetchForecast}=await import('../js/weather-request.js');
  const q=forecastParams(zones.slice(0,2),'outing'),coordinates=['latitude','longitude','elevation'].map(k=>forecastParams([zones[0]],'outing').get(k)).join('|');
  let reads=0;const updates=[];
  const zoneCalls=[];
  globalThis.fetch=async url=>{if(!url.includes('snapshot')){zoneCalls.push(new URL(url,'https://t.local').searchParams.get('latitude'));return Response.json({error:'non disponibile'},{status:503});}reads++;let first=true;return new Response(new ReadableStream({pull(controller){if(first){first=false;controller.enqueue(new TextEncoder().encode(JSON.stringify({coordinates,record:{t:Date.now(),raw:[{hourly:{time:['example']}}]}})+'\n'));}else controller.error(new Error('rete interrotta'));}}),{headers:{'content-type':'application/x-ndjson'}});};
  const result=await fetchForecast(q,{onChunk:row=>updates.push(row)});assert.equal(reads,1);assert.equal(updates.length,1);assert.equal(result.partial,true);assert.equal(result.raw[1],null);
  // La zona mancante si chiede da sola (due tentativi sul 5xx); la riga già ricevuta resta.
  assert.deepEqual(zoneCalls,Array(2).fill(String(zones[1].lat)));assert.ok(result.raw[0]);
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
test('all 36 zones get 8 outing and 1 growth refresh per four hours, with bounded invocations',()=>{
  const counts=new Map();let max=0;
  for(let minute=0;minute<240;minute++){
    const plan=weatherRefreshPlan(zones,minute*60000);max=Math.max(max,plan.length);
    assert.deepEqual(plan,weatherRefreshPlan([...zones].reverse(),minute*60000));
    for(const {zone,kind} of plan){const key=kind+zone.id;counts.set(key,(counts.get(key)||0)+1);}
  }
  assert.ok(max<=3);
  for(const z of zones){assert.equal(counts.get('outing'+z.id),8);assert.equal(counts.get('growth'+z.id),1);}
});
test('atomic D1 claims prevent duplicate provider calls across independent scheduled runs',async()=>{
 const env={CMS_DB:d1(),DIARIO:cache()};let calls=0;
 const options={zones:[zones[0]],scheduledTime:0,now,fetcher:async url=>{calls++;return response(url);}};
 const [a,b]=await Promise.all([refreshSavedWeather(env,options),refreshSavedWeather(env,options)]);
 assert.equal(calls,2);assert.equal(a.length+b.length,2);assert.ok([...a,...b].every(r=>r.ok));
 await refreshSavedWeather(env,options);assert.equal(calls,2);
 const read=await cachedForecast(forecastParams([zones[0]],'growth'),{zones,cache:weatherStorage(env),now,cacheOnly:true,fetcher:()=>assert.fail('public reads cannot download')});
 assert.equal(read.headers.get('x-weather-cache'),'hit');
});
test('public cache reads serve dated records without upstream work and misses stay explicit',async()=>{
 const saved=cache(),q=forecastParams([zones[0]],'outing');let calls=0;
 const options={zones,cache:saved,now,fetcher:async url=>{calls++;return response(url);}};
 await assert.rejects(cachedForecast(q,{...options,cacheOnly:true}),e=>e.code==='cache-warming');assert.equal(calls,0);
 await cachedForecast(q,options);
 const stale=await cachedForecast(q,{...options,now:now+7200000,cacheOnly:true});
 assert.equal(stale.headers.get('x-weather-refreshing'),'0');assert.equal(stale.headers.get('x-weather-cache'),'stale');assert.equal(calls,1);
 assert.equal(stale.headers.get('x-weather-fetched-at'),new Date(now).toISOString());
 await assert.rejects(cachedForecast(forecastParams(zones,'outing'),{...options,cacheOnly:true}),e=>e.status===409);assert.equal(calls,1);
});
test('provider failures and cache write failures preserve the last acquired copy and report failure',async()=>{
 const env={CMS_DB:d1(),DIARIO:cache()},zone=zones[0];
 await refreshSavedWeather(env,{zones:[zone],scheduledTime:0,now,fetcher:response});
 const before=await (await cachedForecast(forecastParams([zone],'outing'),{zones,cache:weatherStorage(env),now,cacheOnly:true})).json();
 const failed=await refreshSavedWeather(env,{zones:[zone],scheduledTime:30*60000,now:now+30*60000,fetcher:async()=>Response.json({},{status:429})});
 assert.equal(failed[0].ok,false);
 const after=await cachedForecast(forecastParams([zone],'outing'),{zones,cache:weatherStorage(env),now:now+30*60000,cacheOnly:true});
 assert.deepEqual(await after.json(),before);assert.equal(after.headers.get('x-weather-fetched-at'),new Date(now).toISOString());
 const prepare=env.CMS_DB.prepare;env.CMS_DB.prepare=sql=>{if(sql.startsWith('INSERT INTO weather_live_cache'))throw new Error('quota');return prepare(sql);};
 const noWrite=await refreshSavedWeather(env,{zones:[zone],scheduledTime:60*60000,now:now+60*60000,fetcher:response});assert.equal(noWrite[0].ok,false);
});
test('refresh claims schema matches the migration',()=>{
 const norm=s=>s.replace(/--.*$/gm,'').replace(/\s+/g,' ').replace(/;\s*$/,'').trim();
 assert.equal(norm(WEATHER_REFRESH_SCHEMA+'; '+WEATHER_STORAGE_SCHEMA),norm(readFileSync(new URL('../migrations/0017_weather_refresh_jobs.sql',import.meta.url),'utf8')));
});

test('a transient provider failure retries from D1 after backoff, without waiting four hours',async()=>{
 const env={CMS_DB:d1(),DIARIO:cache()};let calls=0;
 const options={zones:[zones[0]],scheduledTime:0,now,fetcher:async()=>{calls++;return Response.json({},{status:429});}};
 await refreshSavedWeather(env,options);assert.equal(calls,2);
 await refreshSavedWeather(env,{...options,scheduledTime:60000,now:now+60000});assert.equal(calls,2);
 await refreshSavedWeather(env,{...options,scheduledTime:120000,now:now+120000,fetcher:async url=>{calls++;return response(url);}});assert.equal(calls,3);
 await refreshSavedWeather(env,{...options,scheduledTime:180000,now:now+180000,fetcher:async url=>{calls++;return response(url);}});assert.equal(calls,4);
 await refreshSavedWeather(env,{...options,scheduledTime:240000,now:now+240000});assert.equal(calls,4);
});

test('live D1 cache rejects older writes, retains legacy fallback and expires records',async()=>{
 const env={CMS_DB:d1(),DIARIO:cache()},store=weatherStorage(env),t=Date.now();
 await env.DIARIO.put('legacy',JSON.stringify({t:t-1000,raw:[]}));
 assert.equal((await store.get('legacy')).t,t-1000);
 await store.put('new',JSON.stringify({t,raw:[{value:2}]}),{expirationTtl:3600});
 await store.put('new',JSON.stringify({t:t-1000,raw:[{value:1}]}),{expirationTtl:3600});
 assert.equal((await store.get('new')).raw[0].value,2);
 assert.equal(await env.DIARIO.get('new'),null,'no KV writes');
 await store.put('expired',JSON.stringify({t:t-7200000,raw:[]}),{expirationTtl:3600});
 assert.equal(await store.get('expired'),null);
 env.CMS_DB.prepare=()=>{throw new Error('database unavailable');};
 assert.equal((await store.get('legacy')).t,t-1000);
});

test('old per-zone clients read the refreshed current profile without a second provider download',async()=>{
 const env={CMS_DB:d1(),DIARIO:cache()};
 await refreshSavedWeather(env,{zones:[zones[0]],scheduledTime:0,now,fetcher:response});
 const legacy=await cachedForecast(forecastParams([zones[0]],'growthLegacy'),{zones,cache:weatherStorage(env),now,cacheOnly:true,fetcher:()=>assert.fail('no legacy acquisition')});
 assert.equal(legacy.status,200);assert.equal(legacy.headers.get('x-weather-cache'),'hit');assert.equal((await legacy.json()).length,3);
});
