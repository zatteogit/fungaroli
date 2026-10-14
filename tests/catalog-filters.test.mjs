import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterPlants,plantHabitats,treeGroup} from '../js/plant-catalog.js';
const read=f=>JSON.parse(fs.readFileSync(new URL(`../data/${f}`,import.meta.url)));
const rows=Object.entries(read('plants.json').plants).map(([id,p])=>({...p,id}));
const trees=read('trees.json').trees;
const ids=list=>list.map(p=>p.id).sort();

test('without filters the plant catalog is complete',()=>{
  assert.equal(filterPlants(rows).length,rows.length);
  assert.equal(filterPlants(rows,{q:'',category:''}).length,rows.length);
});
test('flowering filter uses the documented flowerMonths of the chosen month',()=>{
  for(const month of [1,4,10]){
    const hits=filterPlants(rows,{flowering:true,month});
    assert.deepEqual(ids(hits),ids(rows.filter(p=>p.flowerMonths.includes(month))));
    assert.ok(hits.length<rows.length);
  }
});
test('dangerous lookalike filter keeps plants whose lookalikes include a dangerous species',()=>{
  const hits=filterPlants(rows,{lookalikes:true});
  assert.ok(hits.some(p=>p.id==='finocchietto'),'finocchietto si confronta con la cicuta');
  assert.ok(hits.some(p=>p.id==='sambuco'),'sambuco si confronta con l’ebbio');
  assert.ok(!hits.some(p=>p.id==='alliaria'),'l’ortica non è una specie pericolosa');
  const danger=new Set(rows.filter(p=>p.category==='Pericolose').map(p=>p.id));
  assert.ok(hits.every(p=>p.lookalikes.some(id=>danger.has(id))));
});
test('habitat list comes from the data, by frequency, and filters by it',()=>{
  const habitats=plantHabitats(rows);
  assert.ok(habitats.length>0);
  for(let i=1;i<habitats.length;i++)assert.ok(habitats[i-1].count>=habitats[i].count);
  const top=habitats[0];
  const hits=filterPlants(rows,{habitat:top.name});
  assert.equal(hits.length,top.count);
  assert.ok(hits.every(p=>p.habitatCategories.includes(top.name)));
  assert.deepEqual(filterPlants(rows,{habitat:'Ambiente inesistente'}),[]);
});
test('filters combine in AND with category and search',()=>{
  const month=10,habitat=plantHabitats(rows)[0].name;
  const hits=filterPlants(rows,{category:'Frutti',flowering:true,month,habitat});
  assert.ok(hits.every(p=>p.category==='Frutti'&&p.flowerMonths.includes(month)&&p.habitatCategories.includes(habitat)));
  assert.deepEqual(ids(filterPlants(rows,{q:'cicuta',lookalikes:true})),[]);
  assert.deepEqual(ids(filterPlants(rows,{q:'finocchio',lookalikes:true})),['finocchietto']);
});
test('tree groups map the type field; unknown types stay only in «Tutti»',()=>{
  assert.equal(treeGroup('latifoglia caducifoglia'),'latifoglie');
  assert.equal(treeGroup('latifoglia sempreverde'),'latifoglie');
  assert.equal(treeGroup('conifera'),'conifere');
  assert.equal(treeGroup(''),'');
  assert.equal(treeGroup(undefined),'');
  const groups=Object.values(trees).map(t=>treeGroup(t.type));
  assert.ok(groups.includes('conifere')&&groups.includes('latifoglie'));
  assert.equal(Object.values(trees).filter(t=>treeGroup(t.type)==='conifere').length,Object.values(trees).filter(t=>/^conifer/i.test(t.type||'')).length);
});
