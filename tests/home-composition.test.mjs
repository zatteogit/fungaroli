import {test} from 'node:test';
import assert from 'node:assert/strict';
import {composeHome,nextHomeOpportunity} from '../js/home-composition.js';
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
 assert.equal(nextHomeOpportunity([c(20,'ok',{o:1}),later,first],{after:0}),first);
 assert.equal(nextHomeOpportunity([first,later],{after:2}),later);
 assert.equal(nextHomeOpportunity([c(20,'ok',{o:1}),c(99,'sconsigliata',{o:2}),c(99,'ok',{o:8})]),null);
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
