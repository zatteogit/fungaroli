import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeGrowth,mergeOuting,rebaseGrowth} from '../js/weather-state.js';
const growth=t=>[{dates:['2026-10-25'],source:{fetchedAt:new Date(t).toISOString()}}];
const outing=t=>({fetchedAt:new Date(t).toISOString(),p:[1]});
for(const [name,merge,value] of [['growth',mergeGrowth,growth],['outing',mergeOuting,outing]]){
  test(`${name}: partial/failed replies retain memory and never replace newer acquisitions`,()=>{
    const a=value(2000),b=value(1000),previous={a,b};
    assert.deepEqual(merge(previous,null),previous);
    const result=merge(previous,{a:value(1000),c:value(3000),invalid:{}});
    assert.equal(result.a,a);assert.equal(result.b,b);assert.deepEqual(result.c,value(3000));assert.equal(result.invalid,undefined);
    assert.deepEqual(previous,{a,b});
  });
}

test('memory retained during a disk/network outage still expires and rebases across midnight',()=>{
 const acquired=Date.parse('2026-10-25T10:00:00Z');
 const original={a:[{dates:['2026-10-25','2026-10-26'],todayIndex:0,source:{fetchedAt:new Date(acquired).toISOString(),expired:false}}]};
 const result=rebaseGrowth(original,'2026-10-26',acquired+25*3600000);
 assert.equal(result.a[0].source.expired,true);assert.equal(result.a[0].todayIndex,1);
 assert.equal(original.a[0].source.expired,false);assert.equal(original.a[0].todayIndex,0);
});
