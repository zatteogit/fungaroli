import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {botanicalModels,scoreBotanical,recentBotanicalObservation} from '../js/botanical-model.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/botanical-models.json',import.meta.url))),plants=JSON.parse(fs.readFileSync(new URL('../data/plants.json',import.meta.url))),models=botanicalModels(data,plants);
const hab={sample_categories:['Faggeta','Lecceta'],samples:[[800,0],[800,1]]};
const series={dates:Array(40).fill('2026-10-13'),p:Array(40).fill(3),tmean:Array(40).fill(13),tmin:Array(40).fill(7),soilm:Array(40).fill(.3),todayIndex:33,issuedIndex:33,source:{fetchedAt:'2026-10-13T08:00:00Z'}};
test('only documented plant-part uses enter the engine; harmful taxa and missing calendars do not become models or flowering periods',()=>{
 assert.equal(models.length,10);assert.ok(models.every(m=>m.plantId!=='cicuta'&&m.plantId!=='ebbio'));
 const p=models.find(m=>m.plantId==='fragolina'),r=scoreBotanical({...p,phaseMonths:null},series,33,hab,800);
 assert.equal(r.season,null);assert.ok(r.quality.partial.includes('Frutti maturi'));assert.ok(Number.isFinite(r.score));
});
test('weather events affect new-leaf ranking but recent rainfall cannot fabricate fruit maturity',()=>{
 const leaf=models.find(m=>m.plantId==='ortica'),fruit=models.find(m=>m.plantId==='corbezzolo'),cold={...series,tmin:Array(40).fill(-4)},wet={...series,p:Array(40).fill(100)};
 assert.ok(scoreBotanical(leaf,cold,33,hab,800).score<scoreBotanical(leaf,series,33,hab,800).score);
 assert.equal(scoreBotanical(fruit,wet,33,hab,800).score,scoreBotanical(fruit,series,33,hab,800).score);
 assert.equal(scoreBotanical(fruit,cold,33,hab,800).score,scoreBotanical(fruit,series,33,hab,800).score);
});
test('own observations are phase-specific, dated, deduplicated and never imported from other zones or the future',()=>{
 const e={kind:'note',zoneId:'tancia',date:'2026-10-12',observation:{taxonId:'rovo',phases:[{code:'ripe_fruits',status:'present'}],availability:'few'}};
 assert.equal(recentBotanicalObservation([e,e],'rovo','tancia','2026-10-13','ripe_fruits').date,e.date);
 for(const [zone,date,phase] of [['elsewhere','2026-10-13','ripe_fruits'],['tancia','2026-10-01','ripe_fruits'],['tancia','2026-11-20','ripe_fruits'],['tancia','2026-10-13','open_flowers']])assert.equal(recentBotanicalObservation([e],'rovo',zone,date,phase),null);
});
test('missing habitat prevents a score; stale climate is excluded from usable calendar and landscape',()=>{
 const p=models[0];assert.equal(scoreBotanical(p,series,33,{samples:[]},800).score,null);
 const stale=scoreBotanical(p,{...series,source:{expired:true}},33,hab,800);assert.ok(Number.isFinite(stale.score));assert.equal(stale.climateContext.minTemperature3,null);assert.equal(stale.quality.climateUnavailable,true);
 for(const m of models){const r=scoreBotanical(m,series,33,hab,800);assert.ok(r.score>=0&&r.score<=100);}
});
test('personal phase evidence adjusts a calendar outside its core, with expiry and fruit availability distinct from leaves',()=>{
 const leaf={...models.find(m=>m.plantId==='ortica'),observationDays:3},fruit=models.find(m=>m.plantId==='rovo');
 const note=plantId=>({kind:'note',zoneId:'tancia',date:'2026-10-12',observation:{taxonId:plantId,phases:[{code:plantId==='ortica'?'young_leaves':'ripe_fruits',status:'present'}],availability:'none'}});
 const r=scoreBotanical(leaf,series,33,hab,800,{zoneId:'tancia',observations:[note('ortica')]});assert.equal(r.factors.find(f=>f.key==='observation').value,1);assert.ok(r.season>.15);assert.equal(r.factors.find(f=>f.key==='season').origin,'private_unreviewed');
 const depleted=scoreBotanical(fruit,series,33,hab,800,{zoneId:'tancia',observations:[note('rovo')]});assert.equal(depleted.factors.find(f=>f.key==='observation').value,.35);
 assert.equal(scoreBotanical(leaf,series,33,hab,800,{zoneId:'tancia',observations:[{...note('ortica'),date:'2026-10-08'}]}).ownObservation,null);
});
test('a non-detection cannot raise a recommendation simply by increasing input coverage',()=>{
 for(const p of models)for(const affinity of [.01,.1,.4,1]){
  const m={...p,forest:{Faggeta:affinity,Lecceta:affinity}};
  for(const availability of ['unknown','none']){
   const note={kind:'note',zoneId:'tancia',date:'2026-10-13',observation:{taxonId:m.plantId,phases:[{code:m.phase,status:availability==='none'?'present':'absent'}],availability}};
   if(availability==='none'&&m.phase!=='ripe_fruits')continue;
   assert.ok(scoreBotanical(m,series,33,hab,800,{zoneId:'tancia',observations:[note]}).score<=scoreBotanical(m,series,33,hab,800).score);
  }
 }
});
