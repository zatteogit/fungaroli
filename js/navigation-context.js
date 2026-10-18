// Cronologia reale: le pagine e le schede contestuali sono passi distinti.
// history.state contiene soltanto riferimenti; DOM, titoli e scroll restano in memoria.
const KEY='frondaContext',session=crypto.randomUUID(),entries=new Map();
let current=null,sequence=0,adapter=null,pending=null,restored=false,revision=0;
const hash=()=>location.hash||'#/';
function stateEntry(){const state=history.state?.[KEY];return state?.session===session?entries.get(state.id):null;}
function write(entry,push=false){const state={...(history.state||{}),[KEY]:{session,id:entry.id}};history[push?'pushState':'replaceState'](state,'',entry.hash);}
function create(kind,title,backId=null){const entry={id:crypto.randomUUID(),index:++sequence,kind,title,hash:hash(),backId,scroll:scrollY};entries.set(entry.id,entry);return entry;}
function prune(){
 const retained=[...entries.values()].filter(e=>e.snapshot?.frames.some(frame=>frame.body));
 while(retained.length>16){const old=retained.shift();if(old!==current)old.snapshot={...old.snapshot,origin:null,frames:old.snapshot.frames.map(({href,title,scroll})=>({href,title,scroll}))};}
}
export function rememberNavigationContext(){
 if(!current)return;
 if(current.kind==='entity'){const snapshot=adapter?.capture();if(snapshot)current.snapshot=snapshot;}
 else {current.scroll=scrollY;if(document.title.endsWith(' · Fronda'))current.title=document.title.replace(/ · Fronda$/,'');}
}
export function registerEntityNavigation(value){adapter=value;}
export function recordNavigationPage(title){
 const target=stateEntry();restored=!!target;
 if(target)current=target;
 else {const back=current;current=create('page',title,back?.id);current.scroll=0;write(current);}
 pending=null;
}
export function restoreNavigationContext(){
 const target=current,token=++revision;
 requestAnimationFrame(()=>{
  if(token!==revision||stateEntry()!==target||target.hash!==hash())return;
  if(target.kind==='entity'&&target.snapshot)adapter?.restore(target.snapshot);
  else adapter?.close();
  dispatchEvent(new Event('fronda:navigation-context'));
 });
}
export function pushEntityNavigation(title){
 if(!current){current=create('page',document.title.replace(/ · Fronda$/,''));write(current);}
 const base=current.kind==='entity'?current.pageId:current.id;
 const entry=create('entity',title,current.id);entry.pageId=base;entry.snapshot=adapter?.capture();
 current=entry;write(entry,true);prune();
 dispatchEvent(new Event('fronda:navigation-context'));
}
export const contextualBackTitle=()=>entries.get(current?.backId)?.title||'';
export const returningNavigation=()=>pending?.back===true;
export const restoredNavigationScroll=()=>restored?(current?.kind==='entity'?entries.get(current.pageId)?.scroll:current?.scroll):undefined;
export function backNavigation(){
 if(!entries.has(current?.backId))return false;
 history.back();return true;
}
// Promuovere una scheda alla pagina può mantenere lo stesso URL: è comunque
// un nuovo passo, senza attribuire alla pagina lo stato della scheda precedente.
export function navigateContextPage(href){
 if(href!==hash()){location.hash=href;return;}
 const state={...(history.state||{})},oldURL=location.href;delete state[KEY];
 history.pushState(state,'',href);
 dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));
}
export function dismissEntityNavigation(){
 if(current?.kind!=='entity'||stateEntry()!==current)return false;
 let entry=current,steps=0;
 while(entry?.kind==='entity'){steps++;entry=entries.get(entry.backId);}
 if(!entry)return false;
 history.go(-steps);return true;
}
addEventListener('popstate',event=>{
 const target=event.state?.[KEY]?.session===session?entries.get(event.state[KEY].id):null;
 if(!target){pending=null;return;}
 rememberNavigationContext();pending={back:!!current&&target.index<current.index};
 if(target.hash===current?.hash){
  current=target;restored=true;pending=null;
  restoreNavigationContext();
  if(target.kind==='page')requestAnimationFrame(()=>{if(stateEntry()===target)scrollTo({top:target.scroll,behavior:'instant'});});
 }
});
let account;
document.addEventListener('fungaroli:community',event=>{
 const next=event.detail?.user?.id||null;
 if(account!==undefined&&account!==next){
  entries.clear();current=null;pending=null;revision++;
  const state={...(history.state||{})};delete state[KEY];history.replaceState(state,'');
 }
 account=next;
});
