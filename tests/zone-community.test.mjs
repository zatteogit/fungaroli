import test from 'node:test';
import assert from 'node:assert/strict';
import {zoneCommunityHtml} from '../js/zone-community.js';
const zone={id:'tancia',name:'Monte Tancia',province:['RI']};
const report={zoneId:'tancia',speciesId:'edulis',sightings:4,zeros:2};
const render=options=>zoneCommunityHtml({zone,enabled:true,authenticated:true,status:'Condividi per leggere',...options});
test('locked and unavailable summaries never expose aggregate records',()=>{
 for(const access of ['locked','unavailable']){
  const html=render({summary:{access,reports:[report]}});
  assert.ok(html.includes('Condividi per leggere'));assert.ok(!html.includes('edulis'));assert.ok(!html.includes('4 ritrovamenti'));assert.ok(html.includes('data-zone="tancia"'));
 }
});
test('zone recap separates outings and notes, excludes other zones and province totals',()=>{
 const html=render({summary:{access:'granted',reports:[report,{...report,zoneId:'elsewhere',speciesId:'altra-zona-esclusa'}],observations:[{zoneId:'tancia',category:'botanica',taxonId:'corbezzolo',sightings:3,zeros:0}],provinceReports:[{province:'RI',speciesId:'wide',sightings:12}]},resolve:(category,id)=>({name:id,href:`#/${category}/${id}`})});
 assert.ok(html.includes('4 ritrovamenti dichiarati'));assert.ok(html.includes('3 presenze dichiarate'));assert.ok(html.includes('Uscite condivise'));assert.ok(html.includes('Osservazioni dal Taccuino'));assert.ok(!html.includes('altra-zona-esclusa'));assert.ok(!html.includes('12 ritrovamenti'));assert.ok(html.includes('indipendentemente dal giorno e dai filtri'));
});
test('no local aggregates: province fallback is explicitly separate and only for matching province',()=>{
 const html=render({summary:{access:'granted',provinceReports:[{province:'RI',speciesId:'edulis',sightings:8,zeros:1},{province:'RM',speciesId:'altra-zona-esclusa'}]}});
 assert.ok(html.includes('Non ci sono ancora osservazioni sufficienti'));assert.ok(html.includes('In provincia di Rieti'));assert.ok(html.includes('non un dato di Monte Tancia'));assert.ok(html.includes('8 ritrovamenti'));assert.ok(!html.includes('altra-zona-esclusa'));
});
test('empty and guest states preserve contribution and notebook access without inventing reports',()=>{
 const empty=render({summary:{access:'granted'}});assert.ok(empty.includes('Non significa che non ci siano'));assert.ok(empty.includes('Racconta la tua uscita'));
 const guest=render({authenticated:false});assert.ok(guest.includes('data-community-account'));assert.ok(guest.includes('#/diario'));assert.ok(!guest.includes('Uscite condivise'));
 const escaped=render({zone:{...zone,name:'<script>'}});assert.ok(!escaped.includes('<script>'));assert.ok(escaped.includes('&lt;script&gt;'));
});
