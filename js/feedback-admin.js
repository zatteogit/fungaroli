import {FEEDBACK_TYPES} from './feedback-schema.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountFeedbackAdmin(root,{api}){
 let disposed=false,loaded=false,busy=false,nextBefore=null,items=[];
 function render(){
  root.innerHTML=`<header class="admin-heading"><div><p class="eyebrow">Test con utenti invitati</p><h2>Feedback sull’app</h2><p>Messaggi privati, separati dalle osservazioni del bosco. Conservazione: 90 giorni, con pulizia giornaliera.</p></div><button class="btn ghost" data-feedback-refresh>Aggiorna</button></header><p role="status" data-feedback-admin-status></p><div class="admin-records">${items.length?items.map(item=>`<article data-feedback-id="${esc(item.id)}"><h3>${esc(FEEDBACK_TYPES[item.type])}${item.status==='new'?' · Nuovo':''}</h3><p class="small muted">${esc(new Date(item.createdAt).toLocaleString('it-IT'))}${item.context?' · '+esc(item.context.page)+' · '+esc(item.context.version):' · senza contesto allegato'}</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(item.message)}</p><div class="cms-actions">${item.status==='new'?'<button class="btn ghost" data-feedback-read>Segna come letto</button>':''}<button class="btn ghost" data-feedback-delete>Elimina</button></div></article>`).join(''):'<p>Nessun feedback ricevuto.</p>'}</div>${nextBefore?'<button class="btn ghost" data-feedback-more>Carica altri messaggi</button>':''}`;
  root.querySelector('[data-feedback-refresh]').onclick=()=>load();root.querySelector('[data-feedback-more]')?.addEventListener('click',()=>load(true));
  root.querySelectorAll('[data-feedback-read],[data-feedback-delete]').forEach(button=>button.onclick=async()=>{
   const id=button.closest('[data-feedback-id]').dataset.feedbackId,remove=button.hasAttribute('data-feedback-delete');
   if(remove&&button.dataset.confirm!=='yes'){button.dataset.confirm='yes';button.textContent='Conferma eliminazione';return;}
   button.disabled=true;try{await api('feedback/'+id,remove?'DELETE':'PATCH');if(disposed)return;items=remove?items.filter(item=>item.id!==id):items.map(item=>item.id===id?{...item,status:'read'}:item);render();}catch(e){if(!disposed){root.querySelector('[data-feedback-admin-status]').textContent=e.message;button.disabled=false;}}
  });
 }
 async function load(more=false){
  if(disposed||busy)return;busy=true;if(!loaded)root.innerHTML='<p role="status">Carico i feedback…</p>';
  try{const data=await api('feedback'+(more&&nextBefore?'?before='+encodeURIComponent(nextBefore):''));if(disposed)return;items=more?[...items,...data.items]:data.items;nextBefore=data.nextBefore;loaded=true;render();}
  catch(e){if(!disposed){if(!loaded){root.innerHTML='<p data-feedback-admin-status role="status"></p><button class="btn ghost">Riprova</button>';root.querySelector('button').onclick=()=>load();}root.querySelector('[data-feedback-admin-status]').textContent=e.message;}}
  finally{busy=false;}
 }
 return {ensureLoaded(){if(!loaded)return load();},dispose(){disposed=true;root.replaceChildren();}};
}
