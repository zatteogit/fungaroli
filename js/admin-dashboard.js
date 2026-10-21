import {communityMultiplier} from './community-signal.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(n);
const when=n=>n?new Date(n).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'}):'Mai';
const effect=(r,cap)=>{const p=(communityMultiplier([r],cap)-1)*100;return Math.abs(p)<.05?'Nessun effetto':`${p>0?'+':''}${fmt(p)}% sull’ordine`;};
export function mountAdminDashboard(root,{api,openSurvey}){
 let data=null,loading=false,disposed=false;
 const notice=(text,error=false)=>{const el=root.querySelector('[data-admin-status]');if(el){el.textContent=text;el.classList.toggle('error',error);}};
 function render(){
  const d=data;
  root.innerHTML=`<header class="admin-heading"><div><p class="eyebrow">Amministrazione</p><h2>Il polso di Fronda</h2><p class="small muted">Dati dichiarati, regole applicate e modifiche tracciate.</p></div><button class="btn ghost" type="button" data-refresh>Aggiorna dati</button></header>
  <p class="cms-status" role="status" aria-live="polite" data-admin-status></p>
  <div class="admin-stats"><article><h3>Questionari</h3><strong>${fmt(d.survey.count)}</strong><p>Risposte completate</p><p class="small muted">Ultima: ${esc(when(d.survey.lastAt))}</p><button type="button" class="btn ghost" data-surveys>Consulta ed esporta</button></article><article><h3>Segnalazioni fungine</h3><strong>${fmt(d.totals.reports)}</strong><p>Condivise in totale</p><p class="small muted">${fmt(d.reports.reduce((n,r)=>n+r.count,0))} negli ultimi 7 giorni · ${d.reports.filter(r=>r.establishedContributors>=3&&r.days>=2).length} coppie zona/specie con requisiti sufficienti</p></article><article><h3>Altre annotazioni</h3><strong>${fmt(d.totals.observations)}</strong><p>Condivise in totale</p><p class="small muted">${fmt(d.observations.reduce((n,r)=>n+r.count,0))} negli ultimi 7 giorni. Conteggi informativi, senza effetto sull’ordine.</p></article></div>
  <section class="admin-section"><p class="eyebrow">Algoritmo</p><h3>Quanto contano le segnalazioni?</h3><p>Nel modello sperimentale le segnalazioni fungine modificano soltanto <b>l’ordine delle uscite</b>. L’indice biologico resta invariato. Il limite attuale è <b>±${d.policy.maxPercent}%</b>; con 0% l’effetto è disattivato.</p><p class="small muted">Servono almeno 3 contributori con account creato da oltre un giorno e segnalazioni su 2 giorni distinti, negli ultimi 7 giorni. La forza cresce fino a 10 contributori. I contributi di specie diverse non si sommano. Le osservazioni restano dichiarate e non certificate.</p>
  <form data-policy><div class="admin-policy-fields"><label>Influenza massima (%)<input name="maxPercent" type="number" min="0" max="10" step="1" required value="${d.policy.maxPercent}" aria-describedby="admin-preview"></label><label>Motivo della modifica<textarea name="reason" minlength="5" maxlength="500" required placeholder="Perché cambi questo limite?"></textarea></label></div><p id="admin-preview" class="admin-preview" aria-live="polite"></p><button type="submit" class="btn primary">Salva limite</button><p class="small muted">Il salvataggio applica il limite a tutti. Le app connesse lo ricevono al successivo aggiornamento dei dati, normalmente entro 2 minuti. Non modifica né cancella le osservazioni.</p></form></section>
  <section class="admin-section"><h3>Questionari e taratura</h3><p><b>Nessun effetto automatico sul modello.</b> Le risposte raccolgono esperienze da esaminare: non sono coefficienti già validati. Prima di collegarle all’algoritmo occorre definire quali risposte usare, come gestire i pareri discordanti e come verificarne l’effetto su dati indipendenti.</p><button class="btn ghost" type="button" data-surveys>Apri le risposte al questionario</button></section>
  <section class="admin-section"><h3>Segnalazioni negli ultimi 7 giorni</h3><p class="small muted">Dal ${esc(d.since)} · effetto della singola coppia zona/specie con il limite salvato. L’ordine finale dipende anche da meteo e preferenze.</p><div class="admin-records">${d.reports.length?d.reports.map(r=>`<article><h4>${esc(r.zoneName||r.zoneId)} · ${esc(r.taxonName||r.taxonId)}</h4><p>${r.sightings} presenze · ${r.zeros} ricerche a vuoto</p><p class="small muted">${r.establishedContributors} contributori con account da oltre un giorno · ${r.days} giorni distinti · ultima ${esc(r.latestDay)}</p><strong>${esc(effect(r,d.policy.maxPercent))}</strong></article>`).join(''):'<p>Nessuna segnalazione in questa finestra.</p>'}</div></section>
  <section class="admin-section"><h3>Annotazioni condivise</h3><p class="small muted">Ultimi 7 giorni. Solo zona, categoria, specie e conteggi: il testo privato del taccuino resta escluso. Non alimentano automaticamente il modello.</p><div class="admin-records">${d.observations.length?d.observations.map(r=>`<article><h4>${esc(r.zoneName||r.zoneId)} · ${esc(r.taxonName||r.taxonId)}</h4><p>${esc(({fungo:'Funghi',botanica:'Piante',albero:'Alberi',animale:'Animali'})[r.category]||r.category)} · ${r.count} annotazioni · ultima ${esc(r.latestDay)}</p></article>`).join(''):'<p>Nessuna annotazione condivisa in questa finestra.</p>'}</div></section>
  <section class="admin-section"><h3>Storico dei limiti</h3><p class="small muted">Ultime 20 modifiche. Per ripristinare un limite precedente, salvalo di nuovo indicando il motivo.</p><ol class="admin-history">${d.history.length?d.history.map(r=>`<li><b>${r.previousPercent}% → ${r.maxPercent}%</b> · ${esc(when(r.updatedAt))}<p>${esc(r.reason)}</p><small>Profilo ${esc(r.updatedBy)} · revisione ${r.version}</small></li>`).join(''):'<li>Nessuna modifica: limite iniziale del 10%.</li>'}</ol></section><p class="small muted">Dati letti il ${esc(when(d.generatedAt))}. I conteggi totali riguardano le voci ancora condivise.</p>`;
  root.querySelectorAll('[data-surveys]').forEach(b=>b.onclick=openSurvey);
  root.querySelector('[data-refresh]').onclick=load;
  const form=root.querySelector('[data-policy]'),input=form.elements.maxPercent;
  const preview=()=>{const cap=input.valueAsNumber;root.querySelector('#admin-preview').textContent=Number.isInteger(cap)&&cap>=0&&cap<=10?`Anteprima: moltiplicatore tra ${fmt(1-cap/100)} e ${fmt(1+cap/100)}. ${cap===0?'Segnalazioni escluse dall’ordine delle uscite.':'Le soglie minime restano invariate.'}`:'Indica un numero intero da 0 a 10.';};
  input.oninput=preview;preview();
  form.onsubmit=async e=>{
   e.preventDefault();const button=form.querySelector('button');button.disabled=true;notice('Salvo il limite…');
   try{await api('dashboard','PATCH',{maxPercent:input.valueAsNumber,reason:form.elements.reason.value,version:d.policy.version});const refreshed=await load();notice(refreshed?'Limite salvato. La modifica è registrata nello storico.':'Limite salvato, ma non riesco a rileggere i dati. Premi Aggiorna dati.',!refreshed);}
   catch(error){notice(error.message,true);}finally{button.disabled=false;}
  };
 }
 async function load(){
  if(loading||disposed)return;loading=true;
  const refresh=root.querySelector('[data-refresh]');if(refresh)refresh.disabled=true;
  if(!data)root.innerHTML='<p role="status">Carico la dashboard…</p>';else notice('Aggiorno i dati…');
  try{const next=await api('dashboard');if(disposed)return;data=next;render();return true;}
  catch(error){if(disposed)return;if(!data){root.innerHTML='<p role="status" data-admin-status></p><button class="btn ghost" type="button" data-refresh>Riprova</button>';root.querySelector('button').onclick=load;}notice(error.message,true);}
  finally{loading=false;const b=root.querySelector('[data-refresh]');if(b)b.disabled=false;}
 }
 return {load,ensureLoaded(){if(!data)return load();},dispose(){disposed=true;root.replaceChildren();}};
}
