import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
register('data:text/javascript,'+encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url,context,next){
 if(url.startsWith('file:')&&(url.endsWith('.sql')||url.endsWith('.json')&&!context.importAttributes?.type)){
  const text=readFileSync(fileURLToPath(url),'utf8');
  return {format:'module',shortCircuit:true,source:'export default '+(url.endsWith('.sql')?JSON.stringify(text):text)+';'};
 }
 return next(url,context);
}`));
const {default:worker}=await import('../worker/index.js');
const {forecastParams,cachedForecast}=await import('../worker/weather-provider.js');
const {todayISO}=await import('../js/weather.js');
const zones=[{id:'tancia',lat:42.3,lon:12.7,bands:[650,850,1100]}];
test('the public Worker route is cache-only, including force refresh headers and cold start',async()=>{
 const original=global.fetch;let upstream=0;const records=new Map();
 global.fetch=async()=>{upstream++;throw new Error('must never reach the provider');};
 const cache={get:async key=>records.has(key)?JSON.parse(records.get(key)):null,put:async(key,value)=>records.set(key,value)};
 const env={DIARIO:cache,ASSETS:{fetch:async()=>Response.json({zones})}},q=forecastParams(zones,'growth');
 const request=()=>new Request('https://example.test/api/weather/v1/forecast?'+q,{headers:{'x-weather-refresh':'1'}});
 try{
  const missing=await worker.fetch(request(),env,{});
  assert.equal(missing.status,503);assert.equal((await missing.json()).code,'cache-warming');assert.equal(upstream,0);
  const now=Date.now(),day=todayISO();
  await cachedForecast(q,{zones,cache,now,fetcher:async()=>Response.json(zones[0].bands.map(()=>({
   daily:{time:[day],...Object.fromEntries(q.get('daily').split(',').map(k=>[k,[1]]))},
   hourly:{time:Array.from({length:24},(_,h)=>day+'T'+String(h).padStart(2,'0')+':00'),...Object.fromEntries(q.get('hourly').split(',').map(k=>[k,Array(24).fill(.3)]))},
  })))});
  const saved=await worker.fetch(request(),env,{});
  assert.equal(saved.status,200);assert.equal(saved.headers.get('x-weather-refreshing'),'0');assert.equal(saved.headers.get('x-weather-fetched-at'),new Date(now).toISOString());assert.equal(upstream,0);
 }finally{global.fetch=original;}
});
