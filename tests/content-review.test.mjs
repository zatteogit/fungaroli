import test from 'node:test';
import assert from 'node:assert/strict';
import {inventory,validateReview,PERSONAS} from '../tools/content-review.mjs';
const data=inventory();
test('content pipeline inventories individual records and every persona without claiming reviews',()=>{
 assert.equal(data.entries.filter(e=>e.kind==='fungo').length,100);
 assert.equal(new Set(data.entries.map(e=>e.id)).size,data.entries.length);
 for(const e of data.entries){assert.ok(e.source.hash);assert.ok(e.fields.length);assert.equal(new Set(e.fields.map(f=>f.id)).size,e.fields.length);for(const p of PERSONAS)assert.equal(e.personas[p.id].state,'queued');}
});
const entry={id:'fungo:prova',source:{hash:'source'},fields:[{id:'name'},{id:'caution'}]};
const valid=()=>({unit:entry.id,persona:'neofita',sourceHash:'source',testedCommit:'a'.repeat(40),evidence:['docs/evidence.json'],decisions:entry.fields.map(f=>({field:f.id,importance:'core',actions:0,disclosure:'now',format:'Etichetta e testo visibile',reason:'Orienta la decisione prima di proseguire'}))});
test('pipeline rejects an incomplete per-content assessment',()=>{const r=valid();r.decisions.pop();assert.throws(()=>validateReview(entry,r),/caution/);});
test('pipeline rejects evidence from changed data',()=>{const r=valid();r.sourceHash='old';assert.throws(()=>validateReview(entry,r),/fonte è cambiata/);});
test('pipeline requires persona, runtime and evidence',()=>{
 for(const change of [{persona:'inventata'},{testedCommit:''},{evidence:[]}])assert.throws(()=>validateReview(entry,{...valid(),...change}));
});
test('pipeline accepts a complete explicit assessment but does not mutate progress',()=>{
 assert.equal(validateReview(entry,valid()),true);assert.equal(entry.personas,undefined);
});

test('a route placeholder cannot be marked as reviewed',()=>{assert.throws(()=>validateReview({...entry,inventoryKind:'route-seed'},valid()),/Inventariare/);});
