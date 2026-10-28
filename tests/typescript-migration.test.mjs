import test from 'node:test';
import assert from 'node:assert/strict';
import {notebookLocalStore} from '../js/notebook-photo-store.js';

test('archivio non leggibile: il controllo del contratto non lo trasforma in un taccuino vuoto',async()=>{
 const original=globalThis.localStorage;
 try{
  for(const raw of ['{"id":"legacy-note"}', '{broken']){
   const data=new Map([['test-typescript-archive',raw]]);
   globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
   const store=notebookLocalStore('test-typescript-archive');
   await assert.rejects(store.list(),/restano conservati/);
   await assert.rejects(store.put({id:'new-entry',note:'Nuovo appunto'}),/restano conservati/);
   assert.equal(data.get('test-typescript-archive'),raw);
  }
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});

test('una sola riga non leggibile non blocca il taccuino: si salta e si mette da parte',async()=>{
 const original=globalThis.localStorage;
 try{
  const raw='[{"id":"legacy-note"},{"photo":{"key":"broken"}}]',data=new Map([['test-aside',raw]]);
  globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const store=notebookLocalStore('test-aside');
  assert.deepEqual((await store.list()).map(e=>e.id),['legacy-note']);
  await store.put({id:'new-entry',note:'Nuovo appunto'});
  assert.deepEqual(JSON.parse(data.get('test-aside')).map(e=>e.id),['legacy-note','new-entry']);
  assert.deepEqual(JSON.parse(data.get('test-aside:non-leggibili')),[{photo:{key:'broken'}}]);
  await store.remove('new-entry');
  assert.equal(JSON.parse(data.get('test-aside:non-leggibili')).length,1,'non si duplica');
  await assert.rejects(store.put({id:'bad-photo',photo:{data:'x',width:NaN,height:10}}),/foto non valida/);
  assert.deepEqual(JSON.parse(data.get('test-aside')).map(e=>e.id),['legacy-note']);
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});
