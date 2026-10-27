import test from 'node:test';
import assert from 'node:assert/strict';
import {createEffectsPolicy} from '../js/adaptive-effects.js';
const smooth=ms=>Array.from({length:60},()=>ms);
const strained=()=>Array.from({length:40},(_,i)=>i%3===0?70:16.7);
test('cadenze stabili da 30 a 360 Hz e una pausa isolata non classificano il dispositivo come lento',()=>{
 for(const ms of [33.3,16.7,8.3,2.78]){
  const p=createEffectsPolicy();
  for(let n=1;n<=20;n++)assert.equal(p.read(smooth(ms),n*1200),'full');
 }
 const p=createEffectsPolicy();p.read(smooth(16.7),1000);
 assert.equal(p.read([...smooth(16.7),250],2200),'full');
 assert.equal(p.read(smooth(16.7),3400),'full');
 assert.equal(p.read(strained(),4600),'full');
 assert.equal(p.read(smooth(16.7),5800),'full');
});
test('rallentamenti ripetuti alleggeriscono un livello alla volta, con un limite',()=>{
 const p=createEffectsPolicy();p.read(smooth(16.7),1000);
 assert.equal(p.read(strained(),2200),'full');
 assert.equal(p.read(strained(),3400),'reduced');
 assert.equal(p.read(strained(),4600),'reduced');
 assert.equal(p.read(strained(),5800),'minimal');
 for(let n=6;n<20;n++)assert.equal(p.read(strained(),n*1200),'minimal');
});
test('anche una cadenza continuamente molto bassa alleggerisce gli effetti',()=>{
 const p=createEffectsPolicy();assert.equal(p.read(smooth(45),1000),'full');
 assert.equal(p.read(smooth(45),2200),'reduced');
 p.read(smooth(45),3400);assert.equal(p.read(smooth(45),4600),'minimal');
 for(let n=5;n<60;n++)assert.equal(p.read(smooth(45),n*1200),'minimal');
});
test('ripristino graduale solo dopo finestre pulite e attesa, senza oscillare',()=>{
 const p=createEffectsPolicy();p.read(strained(),1000);p.read(strained(),2200);
 for(let n=3;n<20;n++)assert.equal(p.read(smooth(16.7),n*1000),'reduced');
 assert.equal(p.read(smooth(16.7),33000),'full');
 assert.equal(p.read(strained(),34200),'full');
 assert.equal(p.read(smooth(16.7),35400),'full');
});
test('sospensione e nuovo schermo azzerano solo le prove, conservando la qualita',()=>{
 const p=createEffectsPolicy();p.read(strained(),1000);p.resetEvidence();
 assert.equal(p.read(strained(),2200),'full');
 assert.equal(p.read(strained(),3400),'reduced');
 p.resetEvidence(true);
 for(let n=4;n<10;n++)assert.equal(p.read(smooth(33.3),n*1200),'reduced');
 assert.equal(p.read([NaN,-1,0,Infinity,1500],40000),'reduced');
});
