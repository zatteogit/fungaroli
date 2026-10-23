import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBase,airDistanceKm,drivingDirections,pointKey} from '../js/travel-model.js';
import {routeMatrix,searchPlaces} from '../worker/travel-provider.js';
test('base coordinates are finite, bounded and normalized; distance is geodesic',()=>{
  assert.equal(normalizeBase(null),null);
  assert.throws(()=>normalizeBase({name:'Roma',lat:91,lon:12}),/validi/);
  assert.throws(()=>normalizeBase({name:'Roma',lat:'41',lon:12}),/validi/);
  // Base personale arrotondata a 2 decimali, circa 1 km (decisione di Matteo del 22/10/2026).
  const rome=normalizeBase({name:' Roma ',lat:41.902800001,lon:12.4964});assert.deepEqual(rome,{name:'Roma',lat:41.9,lon:12.5});
  assert.equal(airDistanceKm(rome,rome),0);assert.ok(airDistanceKm(rome,{lat:42.404,lon:12.8623})>60);
  const url=new URL(drivingDirections(rome,{lat:42.404,lon:12.8623}));assert.equal(url.searchParams.get('origin'),'41.9,12.5');
  // L'origine di riferimento del catalogo non è un dato personale: resta precisa quando lo si chiede.
  assert.deepEqual(normalizeBase({name:'Rieti',lat:42.404,lon:12.8623},{decimals:6}),{name:'Rieti',lat:42.404,lon:12.8623});
});
test('base personale: niente più di 2 decimali, anche dalla posizione GPS del dispositivo',()=>{
  const gps=normalizeBase({name:'Posizione attuale',lat:42.567812,lon:12.964834});
  assert.deepEqual(gps,{name:'Posizione attuale',lat:42.57,lon:12.96});
  for(const v of [gps.lat,gps.lon])assert.ok((String(v).split('.')[1]||'').length<=2);
  // Lo scarto resta entro circa mezzo chilometro: basta per distanze e tempi verso zone larghe 1,5–5 km.
  assert.ok(airDistanceKm(gps,{lat:42.567812,lon:12.964834})<0.6);
  assert.deepEqual(normalizeBase(gps),gps);
});
test('road routing preserves zero and unavailable routes without substituting air distances',async()=>{
  const base={lat:41.9,lon:12.5},targets=[{lat:42.4,lon:12.8},{lat:42.5,lon:12.9},{lat:42.6,lon:13}];
  const routes=await routeMatrix(base,targets,async url=>{assert.ok(String(url).includes('12.5,41.9'));return Response.json({code:'Ok',durations:[[0,null,600]],distances:[[0,null,25000]]});});
  assert.deepEqual(routes,[{key:pointKey(targets[0]),minutes:0,km:0},{key:pointKey(targets[1]),minutes:null,km:null},{key:pointKey(targets[2]),minutes:10,km:25}]);
  await assert.rejects(()=>routeMatrix(base,Array(51).fill(targets[0])),/non validi/);
  await assert.rejects(()=>routeMatrix(base,targets,async()=>new Response('',{status:503})),/non disponibile/);
});
test('place lookup sends only the query to its fixed provider and rejects invalid points',async()=>{
  const places=await searchPlaces('Roma',async url=>{assert.equal(url.hostname,'photon.komoot.io');assert.equal(url.searchParams.get('q'),'Roma');return Response.json({features:[{properties:{name:'Roma',country:'Italia'},geometry:{coordinates:[12.49,41.9]}},{properties:{name:'Errato'},geometry:{coordinates:[12,900]}}]});});
  assert.equal(places.length,1);assert.equal(places[0].name,'Roma, Italia');
});
