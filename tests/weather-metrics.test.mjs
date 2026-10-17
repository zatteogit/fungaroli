import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {recordWeatherMetric,weatherMetrics,cleanupWeatherMetrics,flushWeatherMetrics,WEATHER_METRICS_SCHEMA,SERVED_FLUSH_MS} from '../worker/weather-metrics.js';
import {cachedForecast,forecastParams,requestWeight} from '../worker/weather-provider.js';
import {todayISO} from '../js/weather.js';

// Adattatore minimo con la stessa forma di D1 sopra SQLite reale.
function d1(){
  const db=new DatabaseSync(':memory:');
  const statement=(sql,args=[])=>({bind:(...a)=>statement(sql,a),run:async()=>db.prepare(sql).run(...args),all:async()=>({results:db.prepare(sql).all(...args).map(r=>({...r}))}),first:async()=>db.prepare(sql).get(...args)});
  return {prepare:sql=>statement(sql),batch:async list=>Promise.all(list.map(s=>s.run())),raw:db};
}
const norm=s=>s.replace(/--.*$/gm,'').replace(/\s+/g,' ').replace(/;\s*$/,'').trim();

test('the inline schema matches the versioned migration',()=>{
  assert.equal(norm(WEATHER_METRICS_SCHEMA),norm(readFileSync(new URL('../migrations/0006_weather_metrics.sql',import.meta.url),'utf8')));
});

test('hourly counters aggregate calls, estimated weight, latency buckets and cache use per Rome day',async()=>{
  const db=d1(),t=Date.parse('2026-10-14T06:30:00Z');// 08:30 a Roma
  await recordWeatherMetric(db,{profile:'growth',event:'upstream:ok',ms:800,locations:3,weighted:15},t);
  await recordWeatherMetric(db,{profile:'growth',event:'upstream:ok',ms:4200,locations:3,weighted:15},t+60000);
  await recordWeatherMetric(db,{profile:'growth',event:'upstream:429',ms:150,locations:3,weighted:15},t+3600000);
  for(const event of ['served:hit','served:hit','served:stale','served:miss'])await recordWeatherMetric(db,{profile:'growth',event},t);
  const {days,limits}=await weatherMetrics(db,30,t+7200000),day=days[0];
  assert.equal(limits.perDay,10000);assert.equal(day.day,'2026-10-14');
  assert.equal(day.upstream.calls,3);assert.equal(day.upstream.failed,1);assert.equal(day.upstream.rateLimited,1);assert.equal(day.upstream.weightedEstimate,45);
  assert.equal(day.upstream.maxMs,4200);assert.equal(day.upstream.meanMs,1717);assert.equal(day.upstream.shareUnder1s,2/3);assert.equal(day.upstream.shareUnder3s,2/3);
  assert.equal(day.peakHour,8);assert.equal(day.peakHourWeightedEstimate,30);
  assert.equal(day.servedTotal,4);assert.equal(day.servedWithoutWaiting,.75);
});

test('a broken or missing database never breaks the weather path; old rows are removed',async()=>{
  await assert.doesNotReject(recordWeatherMetric(null,{profile:'growth',event:'served:hit'}));
  await assert.doesNotReject(recordWeatherMetric({prepare:()=>{throw new Error('down');}},{profile:'growth',event:'served:hit'}));
  const db=d1(),now=Date.parse('2026-10-14T10:00:00Z');
  await recordWeatherMetric(db,{profile:'outing',event:'served:hit'},now-200*86400000);
  await recordWeatherMetric(db,{profile:'outing',event:'served:hit'},now);
  await cleanupWeatherMetrics(db,now);
  assert.deepEqual(db.raw.prepare('SELECT day FROM weather_metrics').all().map(r=>r.day),['2026-10-14']);
});

test('request weight follows the published Open-Meteo rule per location',()=>{
  const zones=[{lat:42.4,lon:12.8,bands:[800,1000,1200]}];
  assert.deepEqual(requestWeight(forecastParams(zones,'growth')),{locations:3,weighted:15});// 6 variabili, 70 giorni: 5 chiamate per punto
  assert.deepEqual(requestWeight(forecastParams(zones,'outing')),{locations:1,weighted:1});// 5 variabili, 8 giorni
});

test('the provider reports what it served and every upstream call',async()=>{
  const zones=[{lat:42.4,lon:12.8,bands:[800,1000]}],params=forecastParams(zones,'growth'),now=Date.parse(todayISO()+'T10:00:00Z');
  const raw=()=>[0,1].map(()=>({daily:{time:[todayISO(new Date(now))],...Object.fromEntries(params.get('daily').split(',').map(f=>[f,[0]]))},hourly:{time:[todayISO(new Date(now))+'T12:00'],...Object.fromEntries(params.get('hourly').split(',').map(f=>[f,[0]]))}}));
  const store=new Map(),cache={get:async k=>store.has(k)?JSON.parse(store.get(k)):null,put:async(k,v)=>store.set(k,v)};
  const events=[],metrics=m=>events.push(m);
  await cachedForecast(params,{zones,cache,now,metrics,fetcher:async()=>Response.json(raw())});
  await cachedForecast(params,{zones,cache,now:now+1000,metrics,fetcher:async()=>{throw new Error('non deve scaricare');}});
  assert.deepEqual(events.map(e=>e.event),['upstream:ok','served:miss','served:hit']);
  assert.equal(events[0].profile,'growth');assert.equal(events[0].weighted,10);assert.ok(Number.isFinite(events[0].ms));
  events.length=0;
  await cachedForecast(params,{zones,cache,now:now+2*3600000,metrics,fetcher:async()=>Response.json({},{status:429})});
  assert.deepEqual(events.map(e=>e.event),['upstream:429','served:stale-fallback']);
  events.length=0;store.clear();
  await assert.rejects(cachedForecast(params,{zones,cache,now,metrics,fetcher:async()=>Response.json({},{status:503})}));
  assert.deepEqual(events.map(e=>e.event),['upstream:error','served:error']);
  events.length=0;
  await assert.rejects(cachedForecast(params,{zones,cache,now,metrics,fetcher:async()=>Response.json([{daily:{time:['1999-01-01']}}])}));
  assert.deepEqual(events.map(e=>e.event),['upstream:invalid','served:error']);
});

test('served responses are summed in memory and written at most once a minute, or with the next upstream call',async()=>{
  const db=d1(),t=Date.parse('2026-10-14T06:30:00Z'),rows=()=>db.raw.prepare("SELECT event,count FROM weather_metrics WHERE event LIKE 'served:%' ORDER BY event").all().map(r=>({...r}));
  let writes=0;const prepare=db.prepare;db.prepare=sql=>{if(sql.startsWith('INSERT'))writes++;return prepare(sql);};
  for(let i=0;i<30;i++)await recordWeatherMetric(db,{profile:'growth',event:i%3?'served:hit':'served:miss'},t+i*1000);
  assert.equal(writes,0);
  await recordWeatherMetric(db,{profile:'growth',event:'served:hit'},t+SERVED_FLUSH_MS);
  assert.deepEqual(rows(),[{event:'served:hit',count:21},{event:'served:miss',count:10}]);assert.equal(writes,2);
  await recordWeatherMetric(db,{profile:'growth',event:'served:stale'},t+SERVED_FLUSH_MS+1000);
  await recordWeatherMetric(db,{profile:'growth',event:'upstream:ok',ms:500,locations:3,weighted:15},t+SERVED_FLUSH_MS+2000);
  assert.deepEqual(rows(),[{event:'served:hit',count:21},{event:'served:miss',count:10},{event:'served:stale',count:1}]);
  await flushWeatherMetrics(db,t+SERVED_FLUSH_MS+3000);assert.equal(rows().length,3);
});
