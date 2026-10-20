import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ATMOSPHERES,homeAtmosphere,atmosphere} from '../js/atmosphere.js';
test('ogni atmosfera ha loop, still piccoli e grandi, autore e licenza tracciabili',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/video/nature/manifest.json',import.meta.url),'utf8'));
 for(const id of Object.keys(ATMOSPHERES)){
  const row=manifest.find(r=>r.slug===id);assert.ok(row?.author&&row?.page&&row?.license_url);assert.match(row.original_sha256,/^[a-f0-9]{64}$/);
  for(const suffix of ['-loop.mp4','-poster.webp','-poster-small.webp'])assert.ok(fs.statSync(new URL('../assets/video/nature/'+id+suffix,import.meta.url)).size>0);
  assert.equal(row.duration,8);assert.equal(row.audio,false);assert.ok(row.bytes<2_000_000);
 }
 assert.equal(homeAtmosphere({month:10}),'autunno');assert.equal(homeAtmosphere({month:4}),'luce-tra-le-foglie');assert.equal(homeAtmosphere({month:10,walking:true}),'bosco-e-sentiero');
 assert.equal(atmosphere('sconosciuta'),'');assert.match(atmosphere('autunno',{hero:true}),/Video di atmosfera/);
});
