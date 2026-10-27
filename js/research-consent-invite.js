import {getPilotChoices,clearPilotChoices} from './pilot-choice-state.js';
import {openModal} from './modal-flow.js';
import {needsResearchChoice,RESEARCH_CONSENT_VERSION,RESEARCH_CONSENT_TEXT} from './research-consent.js';

// Una richiesta alla prima occasione libera dopo l'accesso; mai sopra un altro percorso.
export function initResearchConsentInvite({getUser,save}){
 let bootReady=false,timer,dialog,accountId,busy=false,sessionDeferred=false,pilotProfileOpened=false;
 const skipped=new Set(),key=id=>`fungaroli:research-invite:${RESEARCH_CONSENT_VERSION}:${id}`;
 const deferred=id=>{try{return skipped.has(id)||sessionStorage.getItem(key(id))==='1';}catch{return skipped.has(id);}};
 const postpone=()=>{if(!accountId)return;skipped.add(accountId);try{sessionStorage.setItem(key(accountId),'1');}catch{/* memoria della pagina */}};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(offer,650);};
 function offer(){
  const user=getUser(),pending=getPilotChoices();
  if(pending&&!pending.accountId&&!pilotProfileOpened)return;
  if(pending?.accountId&&user&&pending.accountId!==user.id){clearPilotChoices();if(dialog?.open)dialog.close();schedule();return;}
  if(dialog?.open){if(user?.id!==accountId||(!pending&&!needsResearchChoice(user.research)))dialog.close();return;}
  if(busy||!bootReady||!user||(!pending&&!needsResearchChoice(user.research))||(!pending&&(sessionDeferred||deferred(user.id)))||document.hidden||document.body.hasAttribute('data-legal-pending')||document.querySelector('dialog[open]:modal')||document.activeElement?.matches('input,textarea,[contenteditable="true"]'))return;
  accountId=user.id;busy=false;
  if(pending&&user.research?.version===RESEARCH_CONSENT_VERSION&&user.research.granted===pending.research){clearPilotChoices();postpone();return;}
  if(pending&&!pending.research){clearPilotChoices();postpone();return;}
  if(!dialog){dialog=document.createElement('dialog');dialog.id='research-consent-invite';dialog.className='community-dialog profile-dialog';dialog.setAttribute('aria-labelledby','research-invite-title');document.body.append(dialog);}
  if(pending){offerPilot(user,pending);return;}
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
 function offerPilot(user,pending){
  dialog.innerHTML=`<div class="profile-header"><h2 id="research-invite-title">Studio dell’indice</h2><button type="button" class="profile-close" data-pilot-later aria-label="Decidi più tardi">×</button></div><p data-pilot-account></p>
   <label class="pilot-permission-choice"><input type="checkbox" data-pilot-research${pending.research?' checked':''}><span><b>Acconsento allo Studio dell’indice</b><small data-research-description></small></span></label>
   <p class="small muted">È facoltativo. Le note restano private finché non scegli di condividere una singola osservazione.</p>
   <div class="profile-actions"><button type="button" class="btn ghost" data-pilot-later>Non ora</button><button type="button" class="btn primary" data-confirm-pilot>Salva la scelta</button></div><p role="status" data-status></p>`;
  dialog.querySelector('[data-pilot-account]').textContent='Questa scelta riguarda il profilo '+(user.handle||'Fronda')+'.';
  dialog.querySelector('[data-research-description]').textContent=RESEARCH_CONSENT_TEXT;
  const close=()=>{if(busy)return;clearPilotChoices();postpone();dialog.close();};
  dialog.querySelectorAll('[data-pilot-later]').forEach(b=>b.onclick=close);
  dialog.oncancel=e=>{e.preventDefault();close();};dialog.onclose=()=>{clearPilotChoices();postpone();schedule();};
  dialog.querySelector('[data-confirm-pilot]').onclick=async()=>{
   if(busy)return;busy=true;const id=accountId,research=dialog.querySelector('[data-pilot-research]').checked,controls=dialog.querySelectorAll('button,input');
   controls.forEach(el=>el.disabled=true);dialog.setAttribute('aria-busy','true');dialog.querySelector('[data-status]').textContent='Salvo la scelta per lo Studio…';
   try{
    await save(id,research);clearPilotChoices();postpone();dialog.close();
    const {toast}=await import('./refresh.js');toast('Scelta salvata. Puoi cambiarla dal profilo.',5000,'top');
   }catch(error){if(getUser()?.id===id)dialog.querySelector('[data-status]').textContent=error.message||'Scelta non salvata. Riprova.';}
   finally{busy=false;controls.forEach(el=>el.disabled=false);dialog.removeAttribute('aria-busy');schedule();}
  };
  openModal(dialog);dialog.querySelector('[data-pilot-later]').focus({preventScroll:true});
 }
 document.addEventListener('fronda:pilot-choices',schedule);
 document.addEventListener('fronda:pilot-profile-opened',()=>{pilotProfileOpened=true;schedule();});
 document.addEventListener('fronda:pilot-choice-deferred',()=>{sessionDeferred=true;pilotProfileOpened=false;const current=getUser();if(current){skipped.add(current.id);try{sessionStorage.setItem(key(current.id),'1');}catch{}}});
 addEventListener('fronda:boot-ready',()=>{bootReady=true;schedule();});
 addEventListener('fronda:legal-access',schedule);
 document.addEventListener('fungaroli:community',schedule);
 document.addEventListener('close',schedule,true);
 document.addEventListener('focusout',schedule);
 document.addEventListener('visibilitychange',schedule);
}
