import {DEFAULT_BASE,normalizeBase,airDistanceKm,pointKey,drivingDirections} from './travel-model.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let fallback=DEFAULT_BASE,base=null,account=null,epoch=0,timer,loading=false,controller;
const routes=new Map(),queue=new Map(),failed=new Set(),inflight=new Set();
export const currentBase=()=>base||fallback;
export const customBase=()=>base!==null;
export function initBaseLocation(origin){fallback=normalizeBase(origin);}
const announce=kind=>document.dispatchEvent(new CustomEvent('fungaroli:'+kind));
export function setBaseUser(user){
  const next=user?.base?normalizeBase(user.base):null,id=user?.id||null;
  if(account===id&&JSON.stringify(next)===JSON.stringify(base))return;
  account=id;base=next;epoch++;controller?.abort();clearTimeout(timer);loading=false;routes.clear();queue.clear();failed.clear();inflight.clear();announce('base');
}
export function retryBaseRoutes(){failed.clear();announce('travel');}
export function travelTo(target,reference,{route=true}={}){
  const airKm=airDistanceKm(currentBase(),target);
  if(!customBase())return{minutes:Number.isFinite(reference?.minutes)?reference.minutes:null,km:Number.isFinite(reference?.km)?reference.km:null,airKm,reference:true};
  const key=pointKey(target),known=routes.get(key);
  if(known)return{...known,airKm,reference:false};
  if(route&&account&&!failed.has(key)&&!inflight.has(key)){queue.set(key,{lat:target.lat,lon:target.lon});if(!loading){clearTimeout(timer);timer=setTimeout(flush,80);}}
  return{minutes:null,km:null,airKm,reference:false};
}
async function flush(){
  if(!queue.size||loading||!base)return;
  const generation=epoch,selected=base,items=[...queue.entries()].slice(0,50);items.forEach(([k])=>{queue.delete(k);inflight.add(k);});loading=true;controller=new AbortController();
  try{
    const res=await fetch('/api/community/travel',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({targets:items.map(([,p])=>p)}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(23000)])});
    const data=await res.json();if(!res.ok)throw new Error(data.error);
    if(generation!==epoch)return;
    if(pointKey(data.base)!==pointKey(selected)){items.forEach(([key])=>failed.add(key));announce('refresh-account');return;}
    for(const[key]of items){const r=data.routes?.find(x=>x.key===key);if(r&&Number.isFinite(r.minutes)&&Number.isFinite(r.km)&&r.minutes>=0&&r.km>=0)routes.set(key,r);else failed.add(key);}
  }catch{if(generation===epoch)items.forEach(([key])=>failed.add(key));}
  finally{if(generation===epoch){items.forEach(([key])=>inflight.delete(key));loading=false;announce('travel');if(queue.size)timer=setTimeout(flush,100);}}
}
const decimal=n=>Number.isFinite(n)?n.toLocaleString('it-IT',{maximumFractionDigits:1}):'–';
export const travelText=t=>Number.isFinite(t.minutes)?`${t.minutes} min${Number.isFinite(t.km)?` · ${decimal(t.km)} km`:''}`:`${decimal(t.airKm)} km in linea d’aria`;
export const directionsTo=(lat,lon)=>drivingDirections(currentBase(),{lat,lon});
export const BASE_PRIVACY_TEXT='La base di partenza è facoltativa e privata: nome e coordinate vengono salvati nel tuo profilo su Cloudflare D1. Per la base, la posizione del dispositivo viene richiesta solo se premi “Usa la posizione attuale”. Per cercare una località usiamo Photon; per i percorsi inviamo le coordinate a OSRM/OpenStreetMap, senza nome o ID del profilo. Aprendo il navigatore, la partenza viene inviata anche a Google Maps. La base non entra nelle segnalazioni pubbliche e puoi rimuoverla dal profilo.';

export function mountBaseEditor(root,{value,save}){
  let selected=null;
  root.innerHTML=`<details class="base-settings"><summary><span>Base di partenza</span><b data-base-current>${esc(value?.name||fallback.name)}</b></summary><div class="base-settings-body"><p class="small muted">Scegli un comune o una località. La base resta privata; le ricerche usano Photon e i percorsi OSRM/OpenStreetMap.</p><div class="base-search"><label>Comune o località<input class="wiz-input" type="search" maxlength="120" data-base-query autocomplete="off" placeholder="Es. Roma, Leonessa…"></label><button type="button" class="btn ghost" data-base-search>Cerca</button></div><ul class="base-places" data-base-places></ul><button type="button" class="btn ghost" data-base-gps>Usa la posizione attuale</button><div data-base-selected hidden><p class="small" data-base-selection></p><button type="button" class="btn primary" data-base-save>Salva base</button></div><div class="base-secondary"><button type="button" class="link-btn" data-base-reset${value?'':' hidden'}>Ripristina Rieti</button><button type="button" class="link-btn" data-base-retry${value?'':' hidden'}>Ricalcola percorsi</button></div><p class="small muted">La posizione del dispositivo viene richiesta solo con il pulsante. Salviamo nome e coordinate nel tuo profilo; la base non entra nelle segnalazioni.</p><p class="small" role="status" data-base-status></p></div></details>`;
  const input=root.querySelector('[data-base-query]'),status=root.querySelector('[data-base-status]');
  const select=p=>{selected=normalizeBase(p);root.querySelector('[data-base-selected]').hidden=false;root.querySelector('[data-base-selection]').textContent=selected.name;root.querySelector('[data-base-places]').replaceChildren();status.textContent='Premi “Salva base” per aggiornare le distanze.';};
  input.addEventListener('input',()=>{selected=null;root.querySelector('[data-base-selected]').hidden=true;root.querySelector('[data-base-places]').replaceChildren();});
  const search=async()=>{
    const q=input.value.trim();if(q.length<2){status.textContent='Scrivi almeno due caratteri.';return;}
    const button=root.querySelector('[data-base-search]');button.disabled=true;status.textContent='Cerco la località…';
    try{const r=await fetch('/api/community/places?q='+encodeURIComponent(q),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000)}),data=await r.json();if(!r.ok)throw new Error(data.error);if(input.value.trim()!==q)return;
      root.querySelector('[data-base-places]').innerHTML=(data.places||[]).map((p,i)=>`<li><button class="base-place" type="button" data-place="${i}">${esc(p.name)}</button></li>`).join('');
      root.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>select(data.places[+b.dataset.place]));status.textContent=data.places?.length?'Scegli la località corretta.':'Nessuna località trovata. Prova un nome più completo.';
    }catch(e){status.textContent=e.message||'Ricerca non disponibile.';}finally{button.disabled=false;}
  };
  root.querySelector('[data-base-search]').onclick=search;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  root.querySelector('[data-base-gps]').onclick=()=>{
    if(!navigator.geolocation){status.textContent='La posizione non è disponibile. Cerca una località.';return;}
    status.textContent='Attendo la posizione del dispositivo…';
    navigator.geolocation.getCurrentPosition(p=>select({name:'Posizione attuale',lat:p.coords.latitude,lon:p.coords.longitude}),()=>{status.textContent='Posizione non disponibile o accesso negato. Puoi cercare una località.';},{timeout:10000,maximumAge:60000,enableHighAccuracy:false});
  };
  const persist=async b=>{const buttons=[...root.querySelectorAll('button')];buttons.forEach(x=>x.disabled=true);status.textContent='Salvo la base…';try{await save(b);root.querySelector('[data-base-current]').textContent=b?.name||fallback.name;root.querySelector('[data-base-selected]').hidden=true;selected=null;root.querySelector('[data-base-reset]').hidden=!b;root.querySelector('[data-base-retry]').hidden=!b;status.textContent='Base salvata. Distanze e percorsi aggiornati.';}catch(e){status.textContent=e.message;}finally{buttons.forEach(x=>x.disabled=false);}};
  root.querySelector('[data-base-save]').onclick=()=>selected&&persist(selected);
  root.querySelector('[data-base-reset]')?.addEventListener('click',()=>persist(null));
  root.querySelector('[data-base-retry]')?.addEventListener('click',()=>{retryBaseRoutes();status.textContent='Ricalcolo i percorsi.';});
}
