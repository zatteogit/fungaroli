import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {calloutSvg} from '../js/trait-callouts.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const annotations=JSON.parse(read('data/trait-callouts.json'));
const taxa=JSON.parse(read('data/species-traits.json')).taxa;
test('gli ancoraggi revisionati corrispondono al raster esatto e a caratteri documentati',()=>{
 for(const [file,record]of Object.entries(annotations.assets)){
  assert.equal(createHash('sha256').update(read(file)).digest('hex'),record.sha256,`${file}: raster cambiato, rivedere ancoraggi`);
  assert.ok(record.review,file);
  for(const [field,point]of Object.entries(record.points)){
   assert.ok(['stem_ring','stem_volva','stem_reticulum'].includes(field));
   if(point){
    assert.equal(typeof taxa[record.species].traits[field],'boolean',`${file}: ${field} non documentato`);
    assert.equal(taxa[record.species].traits[field],record.traits[field],`${file}: dato cambiato, rivedere richiamo`);
    assert.ok(calloutSvg(point),`${file}: ${field} coordinate non valide`);
   }
  }
 }
});
test('zone sconosciute o coordinate non valide non producono richiami',()=>{
 for(const point of [null,{}, {x:NaN,y:10},{x:129,y:20},{x:20,y:-1}])assert.equal(calloutSvg(point),'');
});
