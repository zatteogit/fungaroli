import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {outingDiscoveries} from '../js/outing-discoveries.js';
import {botanicalModels} from '../js/botanical-model.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)));
const models=botanicalModels(read('botanical-models'),read('plants'));
const base={zone:{id:'local',bands:[800]},date:'2026-10-13',models,flora:[],trees:{faggio:{name:'Faggio',forest_categories:['Faggeta']},leccio:{name:'Leccio',forest_categories:['Lecceta']}},zoneHabitat:{sample_categories:['Lecceta'],samples:[[800,0],[800,0],[800,0]]}};
test('secondary discoveries use only the chosen trail and its own category index, never another zone’s samples',()=>{
 const route={...base,trail:{samples:[[800,0],[800,0],[800,0]]},trailCategories:['Faggeta']};
 const rows=outingDiscoveries(route);assert.ok(rows.length);assert.ok(rows.length<=3);assert.equal(rows.at(-1).id,'faggio');assert.ok(rows.every(r=>r.scope==='tracciato'&&r.zoneId==='local'&&r.date===base.date));
 assert.deepEqual(outingDiscoveries({...route,trail:{samples:[]}}),[]);
 assert.deepEqual(outingDiscoveries({...route,trailCategories:[]}),[]);
 assert.equal(outingDiscoveries(base).at(-1).id,'leccio');
});
test('flowering-only catalogue matches do not become fruit maturity or numerical growth predictions, and dangerous taxa are excluded',()=>{
 const flora=[{id:'flower',name:'Fiorita',category:'Erbe',habitatCategories:['Lecceta'],flowerMonths:[10],habitatMappingNote:'Mapping'}, {id:'danger',name:'Pericolosa',category:'Pericolose',habitatCategories:['Lecceta'],flowerMonths:[10]}];
 const rows=outingDiscoveries({...base,models:[],flora});assert.equal(rows.length,2);assert.equal(rows[0].phase,'Fioritura nel calendario indicativo');assert.equal(rows[0].r,undefined);assert.equal(rows[0].model,undefined);assert.ok(rows.every(r=>r.id!=='danger'));assert.doesNotMatch(JSON.stringify(rows),/maturo|maturi|probabilità/);
});
test('secondary computation preserves primary inputs and exposes calendar-only climate as unavailable',()=>{
 const input=structuredClone(base),before=JSON.stringify(input),rows=outingDiscoveries(input);assert.equal(JSON.stringify(input),before);
 const botanical=rows.find(r=>r.model);assert.ok(botanical);assert.equal(botanical.r.quality.climateUnavailable,true);assert.equal(botanical.r.climateContext.minTemperature3,null);
 assert.deepEqual(outingDiscoveries({...base,date:null}),[]);assert.deepEqual(outingDiscoveries({...base,zoneHabitat:{sample_categories:['Lecceta'],samples:[[800,0]]}}),[]);
});
