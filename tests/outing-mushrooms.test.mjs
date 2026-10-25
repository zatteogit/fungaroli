import test from 'node:test';
import assert from 'node:assert/strict';
import {selectOutingMushrooms} from '../js/outing-mushrooms.js';
const rows=(scores,chosen=[])=>scores.map((score,id)=>({id,score,chosen:chosen.includes(id),pot:{score:1}}));
test('five favorable fungi: no low-index filling and no mutation',()=>{
 const input=rows([84,75,73,69,66,41,29,28,27],[2]);
 const result=selectOutingMushrooms(input);
 assert.deepEqual(result.shown.map(r=>r.id),[2,0,1,3,4]);
 assert.equal(result.remaining.length,4);assert.equal(input.length,9);
});
test('fills only to three, prioritizing chosen fungi in each tier',()=>{
 const result=selectOutingMushrooms(rows([80,41,29,28],[2]));
 assert.deepEqual(result.shown.map(r=>r.id),[0,2,1]);
});
test('never exceeds six, and does not pad when three favorable exist',()=>{
 assert.equal(selectOutingMushrooms(rows([90,89,88,87,86,85,84,30])).shown.length,6);
 assert.equal(selectOutingMushrooms(rows([90,80,60,59])).shown.length,3);
});
test('missing indices stay in expanded list; zero is a real low index',()=>{
 const result=selectOutingMushrooms(rows([null,NaN,undefined,0,20]));
 assert.deepEqual(result.shown.map(r=>r.score),[20,0]);
 assert.equal(result.remaining.length,3);
});
