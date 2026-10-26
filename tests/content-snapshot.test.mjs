import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContentSnapshot} from '../js/content-snapshot.js';
const snapshot=release=>({schemaVersion:1,release,resources:{legal:{version:7},zones:{},habitat:{},'species-traits':{},'edible-catalog':{},guides:{}}});
test('il catalogo salvato sblocca subito l’avvio; la rete rinnova la prossima copia senza sostituire quella corrente',async()=>{
 const previous={caches:globalThis.caches,fetch:globalThis.fetch,localStorage:globalThis.localStorage};
 let stored=snapshot('old'),finish,updated;
 globalThis.localStorage={removeItem(){},getItem(){return null;}};
 globalThis.caches={open:async()=>({match:async()=>Response.json(stored),put:async(_,res)=>{stored=await res.json();}})};
 globalThis.fetch=()=>new Promise(resolve=>finish=resolve);
 try{
  const current=await loadContentSnapshot({onUpdate:value=>updated=value});assert.equal(current.release,'old');
  finish(Response.json(snapshot('new')));await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(updated.release,'new');assert.equal(stored.release,'new');assert.equal(current.release,'old');
  globalThis.caches.open=async()=>{throw new Error('cache non disponibile');};globalThis.fetch=async()=>Response.json(snapshot('network'));
  assert.equal((await loadContentSnapshot()).release,'network');
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
