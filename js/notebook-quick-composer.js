import {openModal} from './modal-flow.js';
import {todayISO} from './weather.js';
import {normalizeNotebookNote} from './notebook-entry.js';
import {prepareNotebookPhoto} from './notebook-photo.js';
import {mountSearchSelect} from './search-select.js';
import {notebookGlyph} from './ui-icons.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types=[['fungo','Un fungo'],['botanica','Una pianta'],['albero','Un albero'],['animale','Un animale'],['appunto','Altro']];
const titles={fungo:'Un fungo da conoscere',botanica:'Una pianta da conoscere',albero:'Un albero da ricordare',animale:'Un incontro nel bosco',appunto:'Un ricordo dal bosco'};
export function createQuickNotebookComposer({dialog,zones,catalogs,onSave,onDone,onMore,noteWeather=()=>null}){
 let value,original,controls=[],origin,busy=false,session=0;
 const cleanup=()=>{controls.forEach(c=>c.destroy());controls=[];};
 const status=message=>dialog.querySelector('[data-quick-status]').textContent=message;
 function capture(){const f=dialog.querySelector('form');for(const key of ['title','date','note'])value[key]=f.elements[key].value;}
 function render(){
  cleanup();dialog.setAttribute('aria-label',original?'Modifica ritrovamento':'Annota un ritrovamento');
  dialog.innerHTML=`<header class="report-header"><div><p class="eyebrow">${notebookGlyph}Il tuo taccuino</p><h2>${original?'Il tuo ritrovamento':'Cosa hai incontrato?'}</h2></div><button type="button" class="profile-close" data-quick-close aria-label="Chiudi">×</button></header><form class="notebook-form quick-note-form"><p class="quick-note-intro">Una foto, un dettaglio. Il ricordo comincia qui.</p>
  <section class="quick-photo${value.photo?' has-photo':''}" aria-label="Fotografia del ritrovamento">${value.photo?`<img src="${value.photo.data}" width="${value.photo.width}" height="${value.photo.height}" alt="La foto del tuo ritrovamento">`:''}<label class="quick-photo-pick"><input type="file" accept="image/*" data-quick-photo><span>${value.photo?'Cambia foto':'＋ Aggiungi una foto'}</span>${!value.photo?'<small>Scatta una foto o sceglila dalla raccolta</small>':''}</label>${value.photo?'<button type="button" class="btn ghost" data-remove-photo>Rimuovi foto</button>':'<p class="small muted">Puoi annotare anche senza foto.</p>'}</section>
  <fieldset class="quick-note-types"><legend>Che cosa hai osservato?</legend>${types.map(([key,label])=>`<button type="button" class="chip" data-quick-type="${key}" aria-pressed="${value.category===key}">${label}</button>`).join('')}</fieldset>
  ${value.category!=='appunto'?`<div class="search-select"><label>Nome, se lo conosci<input class="wiz-input" data-quick-species autocomplete="off" placeholder="Da riconoscere · cerca un nome se vuoi"></label><ul id="quick-species-options" hidden></ul></div><p class="small muted">Puoi lasciarlo da riconoscere. Il nome annotato è una tua proposta.</p>`:''}
  <details class="quick-note-details"${value.note||original?' open':''}><summary>Luogo, giorno e qualche parola</summary><div class="search-select"><label>Luogo (facoltativo)<input class="wiz-input" data-quick-zone autocomplete="off" placeholder="Dove eri?"></label><ul id="quick-zone-options" hidden></ul></div><button type="button" class="link-btn small" data-quick-clear-zone>Togli luogo</button><label>Giorno<input class="wiz-input" type="date" name="date" required max="${todayISO()}" value="${esc(value.date)}"></label><label>Un titolo tuo (facoltativo)<input class="wiz-input" name="title" maxlength="120" value="${esc(value.title)}" placeholder="${titles[value.category]}"></label><label>Con parole tue<textarea class="wiz-input" name="note" maxlength="2000" rows="3" placeholder="Com’era il bosco? Cosa ti ha colpito?">${esc(value.note)}</textarea></label></details>
  <p class="quick-note-private">Solo per te. La foto e l’appunto restano privati.</p><p data-quick-status role="status"></p><div class="quick-note-save"><button type="submit" class="btn primary">${notebookGlyph}${original?'Salva modifiche':'Conserva nel taccuino'}<span aria-hidden="true">→</span></button>${!original?'<button type="button" class="link-btn small" data-quick-more>Altri appunti e racconto dell’uscita</button>':''}</div></form>`;
  dialog.querySelector('[data-quick-close]').onclick=()=>{if(!busy)dialog.close();};
  dialog.querySelector('[data-quick-photo]').onchange=async event=>{
   const file=event.target.files[0];if(!file||busy)return;event.target.disabled=true;capture();const current=session;busy=true;status('Preparo la fotografia…');dialog.querySelector('[type="submit"]').disabled=true;
   try{const photo=await prepareNotebookPhoto(file);if(current!==session||!dialog.open)return;value.photo=photo;render();}catch(error){if(current===session&&dialog.open)status(error.message);}finally{if(current===session){busy=false;dialog.querySelector('[type="submit"]').disabled=false;dialog.querySelector('[data-quick-photo]').disabled=false;}}
  };
  dialog.querySelector('[data-remove-photo]')?.addEventListener('click',()=>{if(busy)return;capture();value.photo=null;render();});
  dialog.querySelectorAll('[data-quick-type]').forEach(b=>b.onclick=()=>{if(busy)return;capture();value.category=b.dataset.quickType;value.reference=null;value.observation=null;value.record=undefined;render();});
  const bounds=()=>{const r=dialog.getBoundingClientRect();return {top:dialog.querySelector('.report-header').getBoundingClientRect().bottom+8,bottom:r.bottom-16};};
  const species=dialog.querySelector('[data-quick-species]');if(species)controls.push(mountSearchSelect({input:species,list:dialog.querySelector('#quick-species-options'),options:(catalogs()[value.category]||[]).map(t=>({value:t.href,label:t.name,detail:t.latin})),selectedId:value.reference?.href,bounds,onChange:href=>{const t=(catalogs()[value.category]||[]).find(t=>t.href===href);value.reference=t?{href,title:t.name}:null;}}));
  if(species){species.setCustomValidity('');species.addEventListener('input',()=>{if(!species.value.trim())species.setCustomValidity('');});}
  const zone=dialog.querySelector('[data-quick-zone]'),zoneControl=mountSearchSelect({input:zone,list:dialog.querySelector('#quick-zone-options'),options:zones.map(z=>({value:z.id,label:z.title||z.name,detail:z.subtitle})),selectedId:value.zoneId,bounds,onChange:id=>value.zoneId=id||null});controls.push(zoneControl);zone.setCustomValidity('');zone.addEventListener('input',()=>{if(!zone.value.trim())zone.setCustomValidity('');});dialog.querySelector('[data-quick-clear-zone]').onclick=()=>zoneControl.clear();
  dialog.querySelector('[data-quick-more]')?.addEventListener('click',()=>{if(busy)return;capture();if(value.photo||value.note||value.title){status('Conserva prima questo ritrovamento, oppure rimuovi foto e testo per cambiare tipo.');return;}dialog.addEventListener('close',()=>onMore(),{once:true});dialog.close();});
  dialog.querySelector('form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;capture();if(!event.currentTarget.reportValidity())return;
   if(!value.photo&&!value.note.trim()&&!value.reference){status('Aggiungi una foto, un appunto o il nome che hai osservato.');return;}
   if(value.date>todayISO()){status('Scegli oggi o il giorno del ritrovamento.');return;}
   busy=true;dialog.querySelector('[type="submit"]').disabled=true;
   try{const weather=original?.zoneId===value.zoneId&&original?.date===value.date?original.weather:noteWeather(value.zoneId,value.date);const entry=normalizeNotebookNote({...value,weather,title:value.title.trim()||value.reference?.title||titles[value.category],record:value.category==='appunto'?undefined:value.record||{presence:'observed',amount:null,minutes:null,people:null,elevation:null,habitat:'unknown'}});const saving=session;await onSave(entry,false);if(saving!==session||!dialog.open)return;dialog.close();requestAnimationFrame(()=>onDone(entry));}catch(error){status(error.message);}finally{busy=false;dialog.querySelector('[type="submit"]').disabled=false;}
  };
 }
 dialog.addEventListener('close',()=>{session++;cleanup();origin?.isConnected&&origin.focus({preventScroll:true});});
 return {open(context={},entry=null){session++;original=entry;origin=document.activeElement;value={...(entry||{}),id:entry?.id||crypto.randomUUID(),kind:'note',category:entry?.category||context.category||'fungo',title:entry?.title||'',date:entry?.date||todayISO(),note:entry?.note||'',zoneId:entry?.zoneId||context.zoneId||null,reference:entry?.reference||context.reference||null,photo:entry?.photo||null,savedAt:entry?.savedAt||new Date().toISOString()};busy=false;render();if(!dialog.open)openModal(dialog);dialog.querySelector('[data-quick-close]').focus({preventScroll:true});}};
}
