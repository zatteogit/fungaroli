import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as pause} from 'node:timers/promises';
import {setBaseUser,travelTo,currentBase} from '../js/base-location.js';
import {pointKey} from '../js/travel-model.js';

test('a late route response cannot overwrite a new base or cross into another account',async()=>{
  const originalFetch=globalThis.fetch,originalDocument=globalThis.document;
  globalThis.document=new EventTarget();
  const a={name:'Roma',lat:41.9,lon:12.5},b={name:'Leonessa',lat:42.56,lon:12.96},target={lat:42.4,lon:12.86};
  let release,calls=0;
  const slow=new Promise(resolve=>{release=resolve;});
  globalThis.fetch=async()=>++calls===1?slow:Response.json({base:b,routes:[{key:pointKey(target),minutes:20,km:12}]});
  try{
    setBaseUser({id:'owner-a',base:a});assert.equal(travelTo(target,{minutes:55,km:30}).minutes,null);
    await pause(120);assert.equal(calls,1);
    setBaseUser({id:'owner-a',base:b});travelTo(target);await pause(120);
    assert.equal(travelTo(target).minutes,20);
    release(Response.json({base:a,routes:[{key:pointKey(target),minutes:111,km:77}]}));await pause(20);
    assert.equal(travelTo(target).minutes,20);assert.deepEqual(currentBase(),b);
    setBaseUser({id:'owner-b',base:null});assert.equal(travelTo(target,{minutes:55,km:30}).minutes,55);
  }finally{setBaseUser(null);globalThis.fetch=originalFetch;globalThis.document=originalDocument;}
});
