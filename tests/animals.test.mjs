import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicAnimals,initAnimals,animalRecord,animalSearchItems} from '../js/animals.js';
import {matchSpecies} from '../js/species-search.js';
import {validateContent} from '../worker/content-validation.js';
const data=JSON.parse(readFileSync(new URL('../data/animals.json',import.meta.url)));
test('animal catalog publishes only reviewed ready entries, including direct lookup and search',()=>{
 initAnimals(data);assert.equal(publicAnimals(data).length,8);assert.equal(animalRecord('vipera-comune'),undefined);assert.equal(animalSearchItems().some(i=>i.href.endsWith('/vipera-comune')),false);
 assert.equal(validateContent('animals',data).needsReview,true);
});
test('animal claims require known sources; unsafe media and unreviewed schema changes are rejected',()=>{
 for(const mutate of [d=>d.items[0].observe.push({text:'Fatto senza fonte',sourceIds:[]}),d=>d.items[0].cautions.push({text:'Fonte ignota',sourceIds:['no-source']}),d=>d.items[0].photos.push({file:'assets/test.webp',generated:true}),d=>d.items[0].presenceProbability=.9]){
  const changed=structuredClone(data);mutate(changed);assert.throws(()=>validateContent('animals',changed));
 }
 const changed=structuredClone(data);changed.items[0].summary+=' Nota.';assert.equal(validateContent('animals',changed,data).needsReview,true);
});
test('animal names take precedence over trait suggestions and reasons use documented observations',()=>{
 initAnimals(data);const rows=animalSearchItems(),options={names:i=>i.searchNames,features:i=>i.features};
 const named=matchSpecies(rows,'sirfidi',options);assert.equal(named.byTraits,false);assert.equal(named.items[0].title,'Sirfidi');
 const traits=matchSpecies(rows,'paio di ali',options);assert.equal(traits.byTraits,true);assert.equal(traits.items[0].title,'Sirfidi');assert.match(traits.reasons.get(traits.items[0]),/Da osservare/);
});
