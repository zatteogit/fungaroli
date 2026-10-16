import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seasonalSelection,matchesWalk,compareOutdoor,validIntent} from '../js/outing-intent.js';
test('stagione: sospende solo una scelta interamente fuori da calendari documentati',()=>{
 const cat=[{id:'a',name:'A',months:[4]},{id:'b',name:'B',months:[10]},{id:'c',name:'C',months:null}];
 assert.deepEqual(seasonalSelection(cat,new Set(['a']),['2026-10-16']),{names:['A'],clearSpecies:true,suspendIntent:false});
 assert.equal(seasonalSelection(cat,null,['2026-10-16']),null);
 assert.equal(seasonalSelection(cat,new Set(['a','c']),['2026-10-16']),null);
 assert.equal(seasonalSelection(cat,new Set(['a']),['2026-03-31','2026-04-01']),null);
 assert.equal(seasonalSelection(cat,new Set(),['2026-10-16']),null);
 assert.equal(seasonalSelection(cat,null,[]),null);
 assert.equal(seasonalSelection([cat[0]],null,['2026-10-16']).suspendIntent,true);
});
test('sentieri: difficoltà e lunghezza mancanti non superano i filtri espliciti',()=>{
 assert.equal(matchesWalk({},{}),true);
 assert.equal(matchesWalk({difficulty:'E',in_zone_km:2},{easyTrails:true}),false);
 assert.equal(matchesWalk({difficulty:'T',in_zone_km:6},{shortTrails:true}),false);
 assert.equal(matchesWalk({difficulty:'T'},{shortTrails:true}),false);
 assert.equal(matchesWalk({difficulty:'T',in_zone_km:3},{easyTrails:true,shortTrails:true}),true);
});
test('ordinamento pratico: meteo prima, botanica solo nella modalità piante',()=>{
 const a={z:{name:'A'},o:0,weatherRank:1,botanicalRank:0},b={z:{name:'B'},o:0,weatherRank:0,botanicalRank:100};
 assert.ok(compareOutdoor(a,b,{target:'piante'})<0);
 b.weatherRank=1;assert.ok(compareOutdoor(a,b,{target:'piante'})>0);
 assert.ok(compareOutdoor(a,b,{target:'passeggiata'})<0);
 assert.equal(validIntent('bad'),'funghi');
});
