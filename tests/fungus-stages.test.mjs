import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {availableGrowthStages} from '../js/fungus-stages.js';
const read=f=>JSON.parse(readFileSync(new URL(`../data/${f}.json`,import.meta.url)));
const taxa=read('species-traits').taxa,icons=read('trait-icons').taxa;

test('growth selector requires the whole sourced series, never a partial delivery',()=>{
 assert.equal(availableGrowthStages(taxa.caesarea,icons.caesarea).length,4);
 assert.deepEqual(availableGrowthStages(taxa['agaricus-arvensis'],icons['agaricus-arvensis']),[]);
 assert.deepEqual(availableGrowthStages(taxa.edulis,icons.edulis),[]);
 assert.deepEqual(availableGrowthStages(taxa.caesarea,null),[]);
 const t=structuredClone(taxa.caesarea);delete t.stages[0].source;
 assert.deepEqual(availableGrowthStages(t,icons.caesarea),[]);
});
test('every selectable stage has its declared files, including all four egg sections',()=>{
 let species=0,sections=0;
 for(const[key,t]of Object.entries(taxa)){
  const stages=availableGrowthStages(t,icons[key]);if(stages.length)species++;
  for(const s of stages)for(const part of s.tiles){
   assert.ok(existsSync(new URL(`../assets/traits/${key}-${part}-fase-${s.id}.webp`,import.meta.url)),`${key} ${s.id}/${part}`);
   if(part==='taglio')sections++;
  }
 }
 assert.equal(species,15);assert.equal(sections,4);
});
