import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chooseHomeCover} from '../js/home-cover-media.js';
const media=JSON.parse(fs.readFileSync(new URL('../data/media-zones.json',import.meta.url),'utf8')).zones;
const choose=(overrides={})=>chooseHomeCover({zone:'tancia',date:'2026-10-20',icon:'sun',media:media.tancia,pickStock:()=>{throw Error('Lo stock non deve precedere il luogo');},...overrides});
test('il video fornito appartiene soltanto al Tancia autunnale asciutto',()=>{
 for(const icon of ['sun','cloud','wind'])assert.equal(choose({icon}).id,'tancia-autunno-asciutto');
 for(const icon of ['rain','storm','snow','fog','unknown'])assert.equal(choose({icon}).kind,'place-photo');
 for(const date of ['2026-01-20','2026-04-20','2026-07-20'])assert.equal(choose({date}).kind,'place-photo');
 assert.equal(choose({zone:'laga',media:media.laga}).kind,'place-photo');
});
test('la foto locale segue la variante meteo, anche passando da asciutto a pioggia o nebbia',()=>{
 assert.match(choose({icon:'rain'}).photo.file,/autunno-pioggia/);
 assert.match(choose({icon:'fog'}).photo.file,/autunno-nebbia/);
 assert.match(choose({date:'2026-01-20',icon:'snow'}).photo.file,/inverno-neve/);
 assert.equal(choose({icon:'sun'}).kind,'place-video');
});
test('stock soltanto senza foto locale; nessuna scena serena per neve, nebbia o temporali',()=>{
 const empty={zone:'luogo-senza-foto',media:null,pickStock:()=> 'bosco-e-sentiero'};
 assert.equal(choose(empty).kind,'stock');
 assert.equal(choose({...empty,icon:'rain'}).id,'gocce-sulla-felce');
 for(const icon of ['snow','fog','storm'])assert.equal(choose({...empty,icon}).kind,'weather-illustration');
});
