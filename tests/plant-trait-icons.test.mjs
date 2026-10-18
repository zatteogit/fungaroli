import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {traitTilesHtml} from '../js/guided-key.js';
const read=name=>JSON.parse(readFileSync(new URL(`../data/${name}.json`,import.meta.url)));
const plants=read('recognize-plants'),plantIcons=read('plant-trait-icons'),trees=read('recognize-trees'),treeIcons=read('tree-trait-icons');
test('i 51 valori botanici illustrabili hanno un asset intero e corrispondente allo schema',()=>{
 const required=Object.entries(plants.schema).filter(([k,q])=>q.ask&&!['size','habitat','special'].includes(k)).flatMap(([k,q])=>q.values.map(v=>`${k}-${v.id}`));
 const actual=Object.entries(plantIcons.values).flatMap(([k,vs])=>vs.map(v=>`${k}-${v}`));
 assert.equal(required.length,51);assert.deepEqual([...actual].sort(),[...required].sort());
 for(const id of actual){assert.ok(existsSync(new URL(`../assets/plant-traits/${id}.webp`,import.meta.url)),id);assert.ok(plantIcons.margins[id]>=2,id);}
});
test('le schede botaniche usano i propri disegni anche per chiavi condivise con gli alberi',()=>{
 for(const item of Object.values(plants.items)){
  const html=traitTilesHtml(plants,item.traits,plantIcons.values,'piante');
  assert.doesNotMatch(html,/assets\/tree-traits\//);
  for(const [,file]of html.matchAll(/src="(assets\/plant-traits\/[^" ]+)"/g))assert.ok(existsSync(new URL('../'+file,import.meta.url)),file);
 }
 const tree=Object.values(trees.items)[0];
 assert.match(traitTilesHtml(trees,tree.traits,treeIcons.values),/assets\/tree-traits\//);
});
test('senza indice rimangono i testi, senza immagini rotte o caratteri nulli disegnati',()=>{
 const traits={leaf_type:['molto_divisa_fine'],flower_color:null};
 const html=traitTilesHtml(plants,traits,null,'piante');
 assert.doesNotMatch(html,/<img/);assert.match(html,/Lacinie filiformi/);
 const art=traitTilesHtml(plants,traits,plantIcons.values,'piante');
 assert.match(art,/leaf_type-molto_divisa_fine.webp/);assert.doesNotMatch(art,/flower_color-/);
});
