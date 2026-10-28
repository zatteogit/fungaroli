import test from 'node:test';
import assert from 'node:assert/strict';
import {notebookLocalStore} from '../js/notebook-photo-store.js';

test('archivio non leggibile: il controllo del contratto non lo trasforma in un taccuino vuoto',async()=>{
 const original=globalThis.localStorage;
 try{
  for(const raw of ['{"id":"legacy-note"}', '[{"id":"legacy-note"},{"photo":{"key":"broken"}}]', '{broken']){
   const data=new Map([['test-typescript-archive',raw]]);
   globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
   const store=notebookLocalStore('test-typescript-archive');
   await assert.rejects(store.list(),/restano conservati/);
   await assert.rejects(store.put({id:'new-entry',note:'Nuovo appunto'}),/restano conservati/);
   assert.equal(data.get('test-typescript-archive'),raw);
  }
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original;}
});
