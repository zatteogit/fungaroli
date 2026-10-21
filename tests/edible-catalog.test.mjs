import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEdibleCatalog, searchEdibleCatalog, seasonStatus, seasonLabel } from '../js/edible-catalog.js';
const traits=JSON.parse(fs.readFileSync(new URL('../data/species-traits.json',import.meta.url)));
const extra=JSON.parse(fs.readFileSync(new URL('../data/edible-catalog.json',import.meta.url)));
const catalog=buildEdibleCatalog(traits,extra);
test('catalogo solo commestibili, senza duplicati o parametri inventati',()=>{
 assert.equal(catalog.length,51); assert.equal(new Set(catalog.map(s=>s.id)).size,catalog.length);
 assert.equal(catalog.filter(s=>s.modelId).length,14);
 assert.ok(catalog.every(s=>['commestibile','commestibile con cautela'].includes(s.toxicity)));
 assert.ok(!catalog.some(s=>s.id==='amanita-phalloides'||s.id==='amanita-crocea'));
 assert.ok(extra.species.every(s=>s.sources.length));
 // le schede del catalogo sono tutte anche taxon completi: senza l'elenco breve il catalogo resta intero
 assert.equal(buildEdibleCatalog(traits,{species:[{id:'tossico',toxicity:'tossico'}]}).length,51);
});
test('ricerca per sinonimo e nome scientifico; nessun velenoso nei suggerimenti',()=>{
 assert.equal(searchEdibleCatalog(catalog,'agrocybe aegerita')[0].name,'Pioppino');
 assert.equal(searchEdibleCatalog(catalog,'spugnole')[0].id,'morchella-esculenta');
 assert.deepEqual(searchEdibleCatalog(catalog,'phalloides'),[]);
 assert.deepEqual(searchEdibleCatalog(catalog,''),[]);
});
test('fuori stagione distingue calendario noto da dato mancante',()=>{
 const morel=catalog.find(s=>s.id==='morchella-esculenta');
 assert.equal(seasonStatus(morel,'2026-10-13'),'out'); assert.equal(seasonStatus(morel,'2026-04-13'),'in');
 assert.equal(seasonStatus({months:null},'2026-10-13'),'unknown');
 assert.equal(seasonStatus(morel,'invalid'),'unknown');
});
test('etichette del periodo: mesi indicativi, non una stagione certa',()=>{
 const morel=catalog.find(s=>s.id==='morchella-esculenta');
 assert.equal(seasonLabel(morel,'2026-04-13'),'Nel periodo tipico');
 assert.equal(seasonLabel(morel,'2026-10-13'),'Fuori periodo tipico');
 assert.equal(seasonLabel({months:null},'2026-10-13'),'Periodo n.d.');
 assert.ok(!/stagione/i.test(seasonLabel(morel,'2026-10-13')));
});
