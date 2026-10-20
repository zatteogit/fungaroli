import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cachedRoutes} from '../worker/travel-cache.js';
test('private per-target cache survives reordered batches and provider failure without changing age',async()=>{
 const entries=new Map(),cache={match:async k=>entries.get(k.url)?.clone(),put:async(k,r)=>entries.set(k.url,r)};
 const base={lat:42,lon:12},a={lat:43,lon:13},b={lat:44,lon:14};let calls=0;
 const fetcher=async()=>{calls++;return Response.json({code:'Ok',durations:[[600,1200]],distances:[[5000,9000]]});};
 const opts={base,targets:[a,b],owner:'a',origin:'https://example.org',cache,hash:async s=>encodeURIComponent(s),fetcher,now:1000};
 await cachedRoutes(opts);assert.equal(calls,1);
 const cached=await cachedRoutes({...opts,targets:[b],now:2000});assert.equal(calls,1);assert.equal(cached[0].minutes,20);
 const stale=await cachedRoutes({...opts,targets:[a],now:7*3600e3,fetcher:async()=>{throw Error('offline');}});
 assert.equal(stale[0].minutes,10);assert.equal(stale[0].calculatedAt,1000);assert.equal(stale[0].stale,true);
 await assert.rejects(()=>cachedRoutes({...opts,owner:'another-account',fetcher:async()=>{throw Error('offline');}}),/non risponde/);
});
