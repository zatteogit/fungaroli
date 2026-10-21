import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entityIdentity,entityEntries,entityCommunity,connectionsHtml} from '../js/fronda-connections.js';
const taxa=JSON.parse(readFileSync(new URL('../data/species-traits.json',import.meta.url))).taxa;
const options={taxa,modeledIds:['edulis']};
test('fungal aliases retrieve the same notes and actual searched outings, excluding plans and unsearched zeros',()=>{
 const context=entityIdentity('specie','edulis',options),key=Object.keys(taxa).find(k=>taxa[k].edible_id==='edulis');
 const entries=[{id:'note',kind:'note',date:'2026-10-20',reference:{href:`#/fungo/${key}`}},{id:'found',kind:'outing',date:'2026-10-19',finds:{edulis:2}},{id:'zero',kind:'outing',date:'2026-10-18',finds:{edulis:0},searched:['edulis']},{id:'unsearched',kind:'outing',finds:{edulis:0}},{id:'legacy',date:'2026-10-17',finds:{edulis:1}},{id:'plan',kind:'plan',finds:{edulis:2}},{id:'other',kind:'note',reference:{href:'#/albero/faggio'}}];
 assert.deepEqual(entityEntries(entries,context).map(e=>e.id),['note','found','zero','legacy']);
 assert.equal(entityIdentity('fungo',key,options).href,'#/specie/edulis');
});
test('community access gates all records; identical ids across categories cannot leak and series remain distinct',()=>{
 const context=entityIdentity('pianta','ortica');
 const observations=[{category:'botanica',taxonId:'ortica',zoneId:'a',sightings:3,zeros:0},{category:'albero',taxonId:'ortica',zoneId:'b'}];
 assert.deepEqual(entityCommunity({access:'contribute',observations},context).records,[]);
 const result=entityCommunity({access:'granted',observations,reports:[{speciesId:'ortica'}]},context);
 assert.equal(result.records.length,1);assert.equal(result.records[0].zoneId,'a');
 const fungi=entityCommunity({access:'granted',observations:[{category:'fungo',taxonId:'edulis',zoneId:'a'}],reports:[{speciesId:'edulis',zoneId:'a'}]},entityIdentity('specie','edulis',options));
 assert.deepEqual(fungi.records.map(r=>r.series),['notes','outings']);
});
test('all known fungal identities retain their catalog aliases and only modeled ids route to modeled cards',()=>{
 for(const [key,t] of Object.entries(taxa)){
  const c=entityIdentity('fungo',key,options);assert.ok(c.references.includes(`#/fungo/${key}`));
  if(t.edible_id){assert.ok(c.ids.includes(t.edible_id));assert.ok(c.references.includes(`#/commestibile/${t.edible_id}`));}
  if(c.href.startsWith('#/specie/'))assert.equal(c.href,'#/specie/edulis');
 }
});
test('absence of shared records is explicit and private values are escaped',()=>{
 const html=connectionsHtml({notes:[{id:'note-1',date:'2026-10-20',zoneId:'unsafe',kind:'note'}],community:{access:'granted',records:[]},zoneLabel:()=>'<script>alert(1)</script>'});
 assert.match(html,/Non significa che sia assente/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
});
