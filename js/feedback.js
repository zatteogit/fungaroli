import {openModal} from './modal-flow.js';
import {FEEDBACK_TYPES,FEEDBACK_PRIVACY,feedbackContext} from './feedback-schema.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notifyClosed=async text=>{const {toast}=await import('./refresh.js');toast(esc(text),6000,'top');};
let dialog,busy=false,draft={type:'commento',message:'',includeContext:true},context,lastBody,requestId;
function build(){
 dialog=document.createElement('dialog');dialog.className='wiz feedback-dialog';dialog.setAttribute('aria-labelledby','feedback-title');document.body.append(dialog);
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 addEventListener('hashchange',()=>{if(dialog.open&&!busy)dialog.close();});
}
function render(){
 dialog.innerHTML=`<header class="report-header"><div><p class="eyebrow">Costruiamo Fronda insieme</p><h2 id="feedback-title">Come sta andando il test?</h2></div><button type="button" class="profile-close" data-feedback-close aria-label="Chiudi">×</button></header><form class="notebook-form feedback-form">
 <p>Un problema, un dubbio o un’idea: anche un dettaglio mi aiuta a migliorare l’app.</p>
 <label>Che cosa vuoi condividere?<select class="wiz-input" name="type">${Object.entries(FEEDBACK_TYPES).map(([id,label])=>`<option value="${id}"${draft.type===id?' selected':''}>${label}</option>`).join('')}</select></label>
 <label>Il tuo messaggio<textarea class="wiz-input" name="message" rows="5" minlength="5" maxlength="2000" required placeholder="Cosa stavi provando a fare? Che cosa ti aspettavi? Cosa è successo?">${esc(draft.message)}</textarea></label>
 <label class="feedback-context"><input type="checkbox" name="includeContext"${draft.includeContext?' checked':''}><span>Allega pagina e versione<small>${esc(context.page)} · ${esc(context.version.replace('fungaroli-shell-',''))}. Non inviamo l’indirizzo della pagina o gli identificativi dei tuoi appunti.</small></span></label>
 <details class="feedback-privacy"><summary>Chi riceve il messaggio e quali dati invii</summary><p>${FEEDBACK_PRIVACY}</p></details>
 <p class="small muted">Per un ritrovamento, anche a vuoto, usa il Taccuino: questo modulo raccoglie feedback sull’app.</p>
 <p data-feedback-status role="status" aria-live="polite"></p><button type="submit" class="btn primary" data-feedback-send>Invia feedback</button></form>`;
 const form=dialog.querySelector('form'),send=dialog.querySelector('[data-feedback-send]'),close=dialog.querySelector('[data-feedback-close]'),status=dialog.querySelector('[data-feedback-status]');
 const capture=()=>{draft={type:form.elements.type.value,message:form.elements.message.value,includeContext:form.elements.includeContext.checked};};
 form.addEventListener('input',capture);close.onclick=()=>{if(!busy){capture();dialog.close();}};
 form.onsubmit=async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;capture();
  const value={type:draft.type,message:draft.message,context:draft.includeContext?context:null},body=JSON.stringify(value);
  if(body!==lastBody){lastBody=body;requestId=crypto.randomUUID();}
  busy=true;send.disabled=true;close.disabled=true;form.querySelectorAll('input,textarea,select').forEach(field=>field.disabled=true);send.textContent='Invio in corso…';form.setAttribute('aria-busy','true');status.textContent='Invio il tuo feedback…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch('/api/feedback/v1/messages',{method:'POST',credentials:'omit',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({id:requestId,...value}),signal:controller.signal});
   const result=await response.json().catch(()=>null);if(!response.ok||result?.ok!==true||result.id!==requestId)throw Error(result?.error||'Non riesco a confermare l’invio. Il testo è ancora qui: riprova.');
   draft={type:'commento',message:'',includeContext:true};lastBody=null;requestId=null;
   dialog.innerHTML='<header class="report-header"><h2 id="feedback-title">Grazie del tuo aiuto</h2><button type="button" class="profile-close" aria-label="Chiudi">×</button></header><div class="feedback-success"><span class="feedback-check" aria-hidden="true">✓</span><p role="status">Il tuo feedback è arrivato a Fronda.</p><p>Matteo potrà leggerlo privatamente. I tuoi commenti aiutano a scegliere cosa migliorare nel test.</p><button type="button" class="btn primary">Torna all’app</button></div>';
   dialog.querySelectorAll('button').forEach(button=>button.onclick=()=>dialog.close());
   // La navigazione può aver chiuso il dialog durante l'invio (modal-flow): l'esito non deve finire nascosto.
   if(dialog.open)dialog.querySelector('.feedback-success button').focus({preventScroll:true});else notifyClosed('Il tuo feedback è arrivato a Fronda. Grazie del tuo aiuto.');
  }catch(error){status.textContent=controller.signal.aborted?'L’invio sta impiegando troppo tempo. Il testo è ancora qui: riprova.':navigator.onLine===false?'Sei offline. Il testo è ancora qui: riprova quando torna la connessione.':error instanceof TypeError?'Connessione non riuscita. Il testo è ancora qui: riprova.':error.message;send.textContent='Riprova a inviare';
   if(!dialog.open)notifyClosed('Feedback non inviato. Il testo è conservato: riapri «Invia feedback» per riprovare.');}
  finally{clearTimeout(timer);busy=false;send.disabled=false;close.disabled=false;form.querySelectorAll('input,textarea,select').forEach(field=>field.disabled=false);form.removeAttribute('aria-busy');}
 };
}
export function openFeedback(){
 if(!dialog)build();if(busy)return;
 context=feedbackContext(location.hash,document.querySelector('meta[name="app-version"]')?.content);render();openModal(dialog);dialog.querySelector('textarea').focus({preventScroll:true});
}
export function initFeedback(){document.addEventListener('click',event=>{if(event.target.closest('[data-open-feedback]'))openFeedback();});}
