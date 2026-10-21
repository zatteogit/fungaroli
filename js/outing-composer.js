import {openModal} from './modal-flow.js';
import {todayISO} from './weather.js';
import {FATIGUE,MUSHROOMS,outingMemory,outingStory} from './outing-memory.js';
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function createOutingComposer({dialog,zones,species,onSave,onDone}) {
  const body=dialog.querySelector('.wiz-body');dialog.classList.add('outing-dialog');
  let draft,existing,step,busy=false,query='',origin=null;
  dialog.addEventListener('close',()=>origin?.isConnected&&origin.focus({preventScroll:true}));
  addEventListener('hashchange',()=>{if(dialog.open&&!busy)dialog.close();});
  const catalog=()=>species();
  function collect() {
    if(step===0){const zoneId=body.querySelector('[name="place"]').value;if(zoneId!==draft.zoneId){draft.experience.route=null;draft.experience.fromEntryId=null;if(draft.reference?.href?.startsWith('#/giri/'))draft.reference=null;}draft.zoneId=zoneId;draft.date=body.querySelector('[name="day"]').value;}
    else {draft.note=body.querySelector('[name="note"]').value;const duration=body.querySelector('[name="duration"]').value;draft.experience.durationMinutes=duration?Number(duration):null;const route=body.querySelector('[name="followed"]');if(route)draft.experience.route.followed=route.checked;}
  }
  function render(focus=true) {
    const scroll=dialog.scrollTop,extrasOpen=body.querySelector('.outing-extras')?.open;
    const memory=draft.experience,legacy=Object.keys(existing?.finds||{}).length>0;
    body.innerHTML=`<form class="outing-form"><p class="diary-section-label">${existing?'Ritrova i dettagli':'Un ricordo del giro'} · ${step+1}/2</p><h2 class="wiz-title" tabindex="-1">${step===0?'Dove sei stato?':'Cosa ti porti a casa?'}</h2><p class="wiz-hint">${step===0?'Luogo e giorno. Al resto pensiamo insieme.':'Pochi tocchi, nessun racconto da scrivere. Tutto facoltativo.'}</p>
      ${step===0?`<div class="outing-place-fields"><label>Luogo<select class="wiz-input" name="place" required><option value="">Scegli il luogo</option>${zones.map(z=>`<option value="${esc(z.id)}"${z.id===draft.zoneId?' selected':''}>${esc(z.title||z.name)}</option>`).join('')}</select></label><label>Giorno<input class="wiz-input" type="date" name="day" value="${esc(draft.date)}" max="${todayISO(new Date())}" required></label></div><p class="outing-gentle">Un’uscita resta un ricordo anche senza funghi.</p>`:`<fieldset><legend>Com’è andata con i funghi?</legend>${legacy?'<p class="small muted">Ritrovamenti e ricerche già annotati restano conservati. Qui puoi aggiungere i ricordi del giro.</p>':''}<div class="outing-picks">${legacy?'':MUSHROOMS.map(([id,label])=>`<button class="chip" type="button" data-mushrooms="${id}" aria-pressed="${memory.mushrooms===id}">${label}</button>`).join('')}</div></fieldset>
      ${memory.mushrooms==='observed'&&!legacy?`<section class="outing-species"><label for="outing-species-query">Quali hai osservato? <small>Anche nessun nome, se non sei sicuro.</small></label><input id="outing-species-query" class="wiz-input" type="search" placeholder="Cerca un fungo…" value="${esc(query)}" autocomplete="off"><div class="outing-selected" data-selected-species></div><div class="outing-species-options" data-species-options></div><p class="small muted">Nomi proposti da te, da verificare.</p></section>`:''}
      <fieldset><legend>Quanta fatica?</legend><div class="outing-picks">${FATIGUE.map(([id,label])=>`<button class="chip" type="button" data-fatigue="${id}" aria-pressed="${memory.fatigue===id}">${label}</button>`).join('')}</div></fieldset>
      <details class="outing-extras"><summary>Un dettaglio in più</summary><label>Quanto è durato il giro? <span class="small muted">Minuti, se li ricordi</span><input class="wiz-input" name="duration" type="number" min="1" max="1440" step="1" value="${memory.durationMinutes||''}"></label>${memory.route?`<label class="outing-route-check"><input type="checkbox" name="followed"${memory.route.followed?' checked':''}><span>Ho seguito questo percorso: <b>${esc(memory.route.name)}</b></span></label>`:''}<label>Una cosa da ricordare<textarea class="wiz-input" name="note" maxlength="2000" rows="3" placeholder="Una scoperta, con chi eri, il motivo per tornare…">${esc(draft.note)}</textarea></label></details>
      <section class="outing-preview"><span class="diary-section-label">La pagina prende forma</span><p data-story-preview>${esc(outingStory(draft,{zones,species:catalog()}))}</p></section><p class="small muted">Si salva nel tuo taccuino. Condividerai una copia solo se lo scegli.</p>`}
      <p class="notice" role="alert" data-outing-error hidden></p><div class="wiz-nav">${step?'<button class="btn ghost" type="button" data-back>Indietro</button>':'<span></span>'}<button type="submit" class="btn primary">${step?'Salva l’uscita':'Continua'}</button></div></form>`;
    body.querySelector('form').addEventListener('submit',submit);
    body.querySelector('[data-back]')?.addEventListener('click',()=>{collect();step=0;render();});
    body.querySelectorAll('[data-fatigue],[data-mushrooms]').forEach(button=>button.addEventListener('click',()=>{
      collect();const key=button.dataset.fatigue?'fatigue':'mushrooms',value=button.dataset.fatigue||button.dataset.mushrooms;
      memory[key]=memory[key]===value?(key==='fatigue'?null:'unknown'):value;
      if(key==='mushrooms'&&memory.mushrooms!=='observed')memory.observedIds=[];
      const attr=key==='fatigue'?'data-fatigue':'data-mushrooms';render(false);body.querySelector(`[${attr}="${value}"]`)?.focus({preventScroll:true});
    }));
    body.querySelector('#outing-species-query')?.addEventListener('input',event=>{query=event.target.value;renderSpecies();});
    body.querySelector('#outing-species-query')?.addEventListener('keydown',event=>{if(event.key==='Enter')event.preventDefault();});
    body.querySelector('.outing-extras')?.addEventListener('input',()=>{collect();body.querySelector('[data-story-preview]').textContent=outingStory(draft,{zones,species:catalog()});});
    renderSpecies();
    if(extrasOpen&&body.querySelector('.outing-extras'))body.querySelector('.outing-extras').open=true;
    if(focus){dialog.scrollTop=0;body.querySelector('h2').focus({preventScroll:true});}else dialog.scrollTop=scroll;
  }
  function renderSpecies() {
    const target=body.querySelector('[data-species-options]');if(!target)return;
    const all=catalog(),selected=draft.experience.observedIds,normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const matches=all.filter(s=>normalize([s.name,s.latin].join(' ')).includes(normalize(query.trim()))&&!selected.includes(s.id));
    const button=(s,picked)=>`<button type="button" class="outing-species-choice" data-species-id="${esc(s.id)}" aria-label="${esc([s.name,s.latin].filter(Boolean).join(' '))}" aria-pressed="${picked}"><span>${esc(s.name)}<small>${esc(s.latin||'')}</small></span><b aria-hidden="true">${picked?'✓':'+'}</b></button>`;
    body.querySelector('[data-selected-species]').innerHTML=selected.map(id=>all.find(s=>s.id===id)).filter(Boolean).map(s=>button(s,true)).join('');
    target.innerHTML=matches.slice(0,query?30:8).map(s=>button(s,false)).join('')||'<p class="small muted">Nessun altro nome trovato.</p>';
    if(matches.length>(query?30:8))target.insertAdjacentHTML('beforeend','<p class="small muted">Cerca per nome per vedere gli altri funghi.</p>');
    body.querySelectorAll('[data-species-id]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.speciesId;draft.experience.observedIds=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];renderSpecies();body.querySelector('[data-story-preview]').textContent=outingStory(draft,{zones,species:all});body.querySelector(`[data-species-id="${CSS.escape(id)}"]`)?.focus({preventScroll:true});}));
  }
  async function submit(event) {
    event.preventDefault();if(busy)return;collect();
    if(!step){step=1;render();return;}
    busy=true;body.querySelectorAll('button').forEach(b=>b.disabled=true);const button=body.querySelector('[type="submit"]');button.textContent='Salvo il ricordo…';
    try{const entry=await onSave(draft,existing);dialog.close();onDone(entry);}
    catch(error){const target=body.querySelector('[data-outing-error]');target.hidden=false;target.textContent=error.message||'Salvataggio non riuscito. Riprova.';body.querySelectorAll('button').forEach(b=>b.disabled=false);button.textContent='Salva l’uscita';}
    finally{busy=false;}
  }
  return {open(context={},entry=null){
    existing=entry;step=entry?1:0;query='';origin=document.activeElement;
    draft=entry?structuredClone(entry):{kind:'outing',zoneId:context.zoneId||'',date:context.date||todayISO(new Date()),reference:context.reference||null,note:'',finds:{},searched:[],effort:{},experience:{route:context.route||null,fromEntryId:context.fromEntryId||null}};
    draft.experience=outingMemory(draft,catalog());
    if(!entry)draft.experience.mushrooms='unknown';
    body.innerHTML='';render(false);openModal(dialog);body.querySelector('h2').focus({preventScroll:true});
  }};
}
