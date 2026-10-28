import test from 'node:test';
import assert from 'node:assert/strict';

// IndexedDB minimo: un solo archivio con chiave «id», operazioni asincrone come nel browser.
function fakeIndexedDB(rows){
  const data=new Map(rows.map(r=>[r.id,r]));
  const request=run=>{const r={};queueMicrotask(()=>{r.result=run();r.onsuccess?.();});return r;};
  const db={transaction(){const tx={objectStore:()=>({
    getAll:()=>{const r=request(()=>[...data.values()]);queueMicrotask(()=>queueMicrotask(()=>tx.oncomplete?.()));return r;},
    get:k=>{const r=request(()=>data.get(k));queueMicrotask(()=>queueMicrotask(()=>tx.oncomplete?.()));return r;},
    delete:k=>{const r=request(()=>data.delete(k));queueMicrotask(()=>queueMicrotask(()=>tx.oncomplete?.()));return r;},
  })};return tx;}};
  return {data,indexedDB:{open(){const r={};queueMicrotask(()=>{r.result=db;r.onsuccess?.();});return r;}}};
}
test('archivio offline: una copia non leggibile non blocca l’elenco e si può rimuovere',async()=>{
  const deleted=[],fake=fakeIndexedDB([{id:'rotta',cache:'fronda-field-pack-abc',zone:'non valida'}]);
  const previous={indexedDB:globalThis.indexedDB,caches:globalThis.caches};
  globalThis.indexedDB=fake.indexedDB;globalThis.caches={delete:async name=>{deleted.push(name);return true;}};
  try{
    const {listFieldPacks,getFieldPack,removeFieldPack}=await import('../js/field-store.js');
    assert.deepEqual(await listFieldPacks(),{packs:[],unreadable:[{id:'rotta'}]});
    assert.equal(await getFieldPack('rotta'),undefined);
    await removeFieldPack('rotta');
    assert.equal(fake.data.size,0);assert.deepEqual(deleted,['fronda-field-pack-abc']);
  }finally{for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
