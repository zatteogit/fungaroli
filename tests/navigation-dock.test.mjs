import test from 'node:test';
import assert from 'node:assert/strict';
import {createDockScroll,stepDockSpring} from '../js/navigation-dock.js';
test('dock uses directional travel, ignores jitter and stays compact at the bottom',()=>{
 const s=createDockScroll();s.reset();assert.equal(s.read(100,1000),false);assert.equal(s.read(160,1000),true);
 for(const y of [158,161,159,162])assert.equal(s.read(y,1000),true);
 assert.equal(s.read(140,1000),false);assert.equal(s.read(400,1000),true);
 assert.equal(s.read(1100,1000),true);assert.equal(s.read(1080,1000),true);assert.equal(s.read(1000,1000),true);
 assert.equal(s.read(970,1000),false);
});
test('top overscroll, viewport resync and short pages cannot leave the dock compact',()=>{
 const s=createDockScroll();s.reset();assert.equal(s.read(-60,1000),false);assert.equal(s.read(0,1000),false);
 assert.equal(s.read(300,1000),true);s.reset(500);assert.equal(s.read(500,1000),false);
 assert.equal(s.read(504,1000),false);assert.equal(s.read(700,0),false);
 s.reset(400,true);assert.equal(s.read(400,900),true);assert.equal(s.read(395,900),true);assert.equal(s.read(370,900),false);
});
test('one spring preserves value and velocity on reversal and settles after a paused frame',()=>{
 let x=0,v=0;for(let i=0;i<6;i++){const n=stepDockSpring(x,v,1,1/60);x=n.value;v=n.velocity;}
 assert.ok(x>0&&x<1);const before=x;let n=stepDockSpring(x,v,0,1/1000);assert.ok(Math.abs(n.value-before)<.02);
 x=n.value;v=n.velocity;for(let i=0;i<160;i++){n=stepDockSpring(x,v,0,i===5?3:1/60);x=n.value;v=n.velocity;assert.ok(Number.isFinite(x)&&Number.isFinite(v));}
 assert.equal(x,0);assert.equal(v,0);assert.equal(n.settled,true);
});
