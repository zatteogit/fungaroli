import {openModal} from './modal-flow.js';
import {needsResearchChoice,RESEARCH_CONSENT_VERSION,RESEARCH_CONSENT_TEXT} from './research-consent.js';

// Una richiesta alla prima occasione libera dopo l'accesso; mai sopra un altro percorso.
export function initResearchConsentInvite({getUser,save}){
 let bootReady=false,timer,dialog,accountId,busy=false;
 const skipped=new Set(),key=id=>`fungaroli:research-invite:${RESEARCH_CONSENT_VERSION}:${id}`;
 const deferred=id=>{try{return skipped.has(id)||sessionStorage.getItem(key(id))==='1';}catch{return skipped.has(id);}};
 const postpone=()=>{if(!accountId)return;skipped.add(accountId);try{sessionStorage.setItem(key(accountId),'1');}catch{/* memoria della pagina */}};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(offer,650);};
 function offer(){
  const user=getUser();
  if(dialog?.open){if(user?.id!==accountId||!needsResearchChoice(user.research))dialog.close();return;}
  if(busy||!bootReady||!user||!needsResearchChoice(user.research)||deferred(user.id)||document.hidden||document.body.hasAttribute('data-legal-pending')||document.querySelector('dialog[open]:modal')||document.activeElement?.matches('input,textarea,[contenteditable="true"]'))return;
  accountId=user.id;busy=false;
  if(!dialog){dialog=document.createElement('dialog');dialog.id='research-consent-invite';dialog.className='community-dialog profile-dialog';dialog.setAttribute('aria-labelledby','research-invite-title');document.body.append(dialog);}
  dialog.innerHTML=`<div class="profile-header"><h2 id="research-invite-title">Aiuti a migliorare l’indice?</h2><button type="button" class="profile-close" data-later aria-label="Decidi più tardi">×</button></div>
   <p>Puoi contribuire allo <b>Studio dell’indice</b> con le osservazioni che scegli di condividere.</p>
   <p data-research-description></p>
   <p class="small muted">È facoltativo: puoi usare Fronda anche senza acconsentire e cambiare la scelta dal profilo.</p>
   <div class="profile-actions"><button type="button" class="btn ghost" data-choice="false">Non acconsento</button><button type="button" class="btn ghost" data-choice="true">Acconsento</button></div>
   <p role="status" data-status></p>`;
  dialog.querySelector('[data-research-description]').textContent=RESEARCH_CONSENT_TEXT;
  const close=()=>{if(busy)return;postpone();dialog.close();};
  dialog.querySelector('[data-later]').onclick=close;
  dialog.oncancel=e=>{e.preventDefault();close();};
  dialog.onclose=()=>{postpone();schedule();};
  dialog.querySelectorAll('[data-choice]').forEach(button=>button.onclick=async()=>{
   if(busy)return;busy=true;
   const id=accountId,buttons=dialog.querySelectorAll('button'),status=dialog.querySelector('[data-status]');
   buttons.forEach(b=>b.disabled=true);dialog.setAttribute('aria-busy','true');status.textContent='Salvo la scelta…';
   try{
    await save(id,button.dataset.choice==='true');
    dialog.close();
    const {toast}=await import('./refresh.js');toast('Scelta salvata. Puoi modificarla dal profilo.',5000,'top');
   }catch(error){if(getUser()?.id===id)status.textContent=error.message||'Scelta non salvata. Riprova.';}
   finally{busy=false;buttons.forEach(b=>b.disabled=false);dialog.removeAttribute('aria-busy');schedule();}
  });
  openModal(dialog);
  dialog.querySelector('[data-later]').focus({preventScroll:true});
 }
 addEventListener('fronda:boot-ready',()=>{bootReady=true;schedule();});
 addEventListener('fronda:legal-access',schedule);
 document.addEventListener('fungaroli:community',schedule);
 document.addEventListener('close',schedule,true);
 document.addEventListener('focusout',schedule);
 document.addEventListener('visibilitychange',schedule);
}
