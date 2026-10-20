import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ATMOSPHERES,homeAtmosphere,createHomeAtmospherePicker,atmosphere} from '../js/atmosphere.js';
test('ogni atmosfera ha loop, still piccoli e grandi, autore e licenza tracciabili',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/video/nature/manifest.json',import.meta.url),'utf8'));
 for(const id of Object.keys(ATMOSPHERES)){
  const row=manifest.find(r=>r.slug===id);assert.ok(row?.author&&row?.page&&row?.license_url);assert.match(row.original_sha256,/^[a-f0-9]{64}$/);
  for(const suffix of ['-loop.mp4','-poster.webp','-poster-small.webp'])assert.ok(fs.statSync(new URL('../assets/video/nature/'+id+suffix,import.meta.url)).size>0);
  assert.equal(row.duration,8);assert.equal(row.audio,false);assert.ok(row.bytes<2_000_000);
 }
 assert.equal(homeAtmosphere({month:10}),'autunno');assert.equal(homeAtmosphere({month:4}),'luce-tra-le-foglie');assert.equal(homeAtmosphere({month:10,walking:true}),'bosco-e-sentiero');
 assert.equal(atmosphere('sconosciuta'),'');assert.doesNotMatch(atmosphere('autunno',{hero:true}),/<figcaption>/);
});

test('la copertina varia per giorno e zona, resta stabile e usa solo loop orizzontali stagionali',()=>{
 for(const month of [4,10])for(const intent of [{},{plants:true},{walking:true}]){
  const pick=(zone,date)=>homeAtmosphere({...intent,zone,date,month});
  const clips=Array.from({length:4},(_,i)=>pick('vallonina',`2026-10-${20+i}`));
  for(let i=1;i<clips.length;i++)assert.notEqual(clips[i],clips[i-1]);
  for(const clip of clips){assert.ok(ATMOSPHERES[clip].width>ATMOSPHERES[clip].height);if(month===4)assert.notEqual(clip,'autunno');}
  assert.equal(pick('vallonina','2026-10-20'),pick('vallonina','2026-10-20'));
  assert.ok(new Set(['vallonina','tancia','rascino','terminillo'].map(z=>pick(z,'2026-10-20'))).size>1);
 }
});

test('nuove proposte evitano la clip appena vista anche con hash coincidenti; i ritorni restano stabili',()=>{
 const pick=createHomeAtmospherePicker(),a={zone:'a',date:'2026-10-20',month:10},b={...a,zone:'e'};
 assert.equal(homeAtmosphere(a),homeAtmosphere(b));
 const first=pick(a);assert.equal(pick(a),first);const second=pick(b);assert.notEqual(second,first);
 assert.equal(pick(b),second);assert.equal(pick(a),first);
});
