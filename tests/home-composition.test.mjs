import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeHome,nextHomeOpportunity,latestDeadline,automaticHomeDay,shiftChosenDay} from '../js/home-composition.js';
import {createHomeIntro} from '../js/home-intro.js';
const c=(s,level='ok',extra={})=>({s,weather:{available:level!=='non_disponibile',level},...extra});
test('only favourable, current, timely proposals can become a hero',()=>{
 const good=c(60),m=composeHome([c(59),c(8),good,c(95,'sconsigliata'),c(90,'non_disponibile'),c(90,'ok',{timely:false})]);
 assert.deepEqual(m.ready,[good]);assert.equal(m.partial,true);assert.equal(m.state,'ready');
});
test('low scores, uncertain conditions and unknown data remain distinct',()=>{
 assert.equal(composeHome([c(8),c(20)]).state,'low');
 assert.equal(composeHome([c(95,'sconsigliata')]).state,'weather');
 assert.equal(composeHome([c(53)]).state,'review');
 assert.equal(composeHome([c(8),c(null,'non_disponibile')]).state,'unknown');
 assert.equal(composeHome([c(null)],{modeled:false}).state,'unsupported');
 assert.equal(composeHome([c(null)],{loading:true}).state,'loading');
 assert.equal(composeHome([]).state,'filters');
 assert.equal(composeHome([],{community:true}).state,'community');
 assert.equal(composeHome([c(85,'ok',{timely:false})]).state,'late');
});
test('botanical and walking proposals do not require or display a fungal score',()=>{
 const walk=c(null);assert.deepEqual(composeHome([walk],{fungi:false}).ready,[walk]);
 assert.equal(composeHome([c(99,'sconsigliata')],{fungi:false}).ready.length,0);
});
test('future opportunity uses the same criteria, earliest eligible date, selected-day horizon',()=>{
 const first=c(72,'ok',{o:2,r:60}),later=c(98,'ok',{o:3,r:98});
 assert.equal(nextHomeOpportunity([c(20,'ok',{o:1}),later,first],{after:0}).next,first);
 assert.equal(nextHomeOpportunity([first,later],{after:2}).next,later);
 assert.deepEqual(nextHomeOpportunity([first],{after:0}),{next:first,reason:'found',partial:false});
});
test('no favourable date is distinct from missing data',()=>{
 const none=nextHomeOpportunity([c(20,'ok',{o:1}),c(99,'sconsigliata',{o:2}),c(99,'ok',{o:8})]);
 assert.equal(none.next,null);assert.equal(none.reason,'none');assert.equal(none.partial,false);
 const data=nextHomeOpportunity([c(90,'non_disponibile',{o:1}),c(null,'ok',{o:2})]);
 assert.equal(data.reason,'data');
 // Senza indice ma con meteo, per Sentieri/Piante i dati bastano.
 assert.equal(nextHomeOpportunity([c(null,'sconsigliata',{o:1})],{fungi:false}).reason,'none');
 const partial=nextHomeOpportunity([c(20,'ok',{o:1}),c(90,'non_disponibile',{o:2})]);
 assert.equal(partial.reason,'none');assert.equal(partial.partial,true);
 assert.equal(nextHomeOpportunity([]).reason,'none');
});
test('late departure uses the latest deadline among today proposals',()=>{
 const a=new Date('2026-10-21T07:15:00Z'),b=new Date('2026-10-21T07:30:00Z');
 assert.equal(latestDeadline([a,null,b,new Date('x')]),b);
 assert.equal(latestDeadline([null]),null);
});
test('automatic day moves past a late today only without a manual choice',()=>{
 const next={o:1};
 assert.deepEqual(automaticHomeDay({todayLate:true,next}),{day:1,auto:true});
 assert.deepEqual(automaticHomeDay({todayLate:true,next:{o:3}}),{day:3,auto:true});
 assert.deepEqual(automaticHomeDay({todayLate:true,next:null}),{day:0,auto:false});
 assert.deepEqual(automaticHomeDay({todayLate:false,next}),{day:0,auto:false});
 assert.deepEqual(automaticHomeDay({manual:true,current:0,todayLate:true,next}),{day:0,auto:false});
 assert.deepEqual(automaticHomeDay({manual:true,current:null,todayLate:true,next}),{day:null,auto:false});
});
test('midnight keeps the chosen calendar date',()=>{
 assert.deepEqual(shiftChosenDay(1,1),{day:0,manual:true});
 assert.deepEqual(shiftChosenDay(3,2),{day:1,manual:true});
 assert.deepEqual(shiftChosenDay(0,1),{day:0,manual:false});
 assert.deepEqual(shiftChosenDay(null,1),{day:null,manual:true});
 assert.deepEqual(shiftChosenDay(2,0),{day:2,manual:true});
});
const store=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};};
test('introduction preserves explicit opening across date updates and persists a scoped dismissal',()=>{
 const local=store(),session=store(),intro=createHomeIntro({local,session,id:()=>1});
 assert.equal(intro.mode('guest',false),'compact');intro.open('guest');
 assert.equal(intro.mode('guest',false),'expanded');intro.dismiss('guest');
 assert.equal(intro.mode('guest',true),'hidden');assert.equal(intro.mode('account-b',true),'expanded');
 assert.equal(intro.mode('guest',true),'hidden');
});
test('only a real later session or successful notebook use reduces the explanation',()=>{
 const local=store(),session=store(),intro=createHomeIntro({local,session,id:()=>1});
 assert.equal(intro.mode('guest',true,{pending:true}),'compact');
 assert.equal(intro.mode('guest',true),'expanded');intro.seen('guest');
 assert.equal(createHomeIntro({local,session,id:()=>2}).mode('guest',true),'expanded');
 assert.equal(createHomeIntro({local,session:store(),id:()=>2}).mode('guest',true),'compact');
 intro.experienced('guest');assert.equal(intro.mode('guest',true),'expanded');intro.leave();
 assert.equal(intro.mode('guest',true),'compact');
});
test('legacy guest dismissal does not hide onboarding for a newly registered account',()=>{
 const local=store();local.setItem('fronda:community-card-dismissed:v1','1');
 const intro=createHomeIntro({local,session:store(),id:()=>1});
 assert.equal(intro.mode('guest',true),'hidden');assert.equal(intro.mode('new-account',true),'expanded');
});
