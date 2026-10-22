// Le fotografie restano fuori dal piccolo spazio localStorage. Ogni archivio ha chiavi proprie.
let opening;
const queues=new Map();
function serial(scope,work){
 const pending=(queues.get(scope)||Promise.resolve()).catch(()=>{}).then(work);queues.set(scope,pending);
 pending.finally(()=>{if(queues.get(scope)===pending)queues.delete(scope);}).catch(()=>{});return pending;
}
function database(){return opening||=(new Promise((resolve,reject)=>{
 const r=indexedDB.open('fronda-notebook-photos',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Archivio fotografico non disponibile. Riprova senza chiudere questa pagina.'));
})).catch(e=>{opening=null;throw e;});}
async function photoIO(method,key,value){const db=await database();return new Promise((resolve,reject)=>{
 const tx=db.transaction('photos',method==='get'?'readonly':'readwrite'),r=tx.objectStore('photos')[method](...(method==='put'?[value,key]:[key]));let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error('Spazio per le fotografie non disponibile. La nota non è stata salvata.'));tx.onabort=tx.onerror;
});}
// Copia locale del taccuino di un profilo: chiave di localStorage e prefisso delle sue foto in IndexedDB.
export const accountNotebookScope=id=>'fungaroli:diario:account:'+id;
// Toglie dal dispositivo una copia del taccuino (decisione del 22/10/2026): voci in localStorage e foto con il
// prefisso dell'archivio. Usata dopo «Elimina profilo e dati»; aspetta le scritture già in coda su quell'archivio.
export function clearNotebookStore(scope){
 return serial(scope,async()=>{
  try{localStorage.removeItem(scope);}catch{/* memoria non disponibile: restano solo le foto da togliere */}
  const db=await database();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('photos','readwrite');tx.objectStore('photos').delete(IDBKeyRange.bound(scope+':',scope+':\uffff'));
   tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('Non riesco a togliere le foto da questo dispositivo.'));tx.onabort=tx.onerror;
  });
 });
}
export function notebookLocalStore(scope='fungaroli:diario:v1'){
 const metadata=()=>{try{return JSON.parse(localStorage.getItem(scope)||'[]');}catch{return [];}};
 const hydrate=async entry=>{
  if(!entry.photo?.key)return entry;
  const photo=await photoIO('get',entry.photo.key);
  return {...entry,photo:photo||null,...(!photo?{photoUnavailable:true}:{})};
 };
 async function write(entries){
  const before=metadata(),oldKeys=new Set(before.map(e=>e.photo?.key).filter(Boolean)),written=[];
  try{
   const rows=[];
   for(const e of entries){
    if(!e.photo?.data){rows.push(e);continue;}
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(e.photo.data));
    const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),key=scope+':'+e.id+':'+hash;
    await photoIO('put',key,e.photo);if(!oldKeys.has(key))written.push(key);
    rows.push({...e,photo:{key,width:e.photo.width,height:e.photo.height}});
   }
   localStorage.setItem(scope,JSON.stringify(rows));
   const keep=new Set(rows.map(e=>e.photo?.key).filter(Boolean));
   await Promise.all([...oldKeys].filter(k=>!keep.has(k)).map(k=>photoIO('delete',k).catch(()=>{})));
  }catch(error){await Promise.all(written.map(k=>photoIO('delete',k).catch(()=>{})));throw error;}
 }
 return {kind:'local',async list(){return Promise.all(metadata().map(hydrate));},replace:entries=>serial(scope,()=>write(entries)),put:e=>serial(scope,()=>write([...metadata().filter(x=>x.id!==e.id),e])),remove:id=>serial(scope,()=>write(metadata().filter(x=>x.id!==id)))};
}
