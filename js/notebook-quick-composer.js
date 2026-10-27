import {openModal} from './modal-flow.js';
import {todayISO} from './weather.js';
import {normalizeNotebookNote} from './notebook-entry.js';
import {prepareNotebookPhoto} from './notebook-photo.js';
import {mountSearchSelect} from './search-select.js';
import {notebookGlyph} from './ui-icons.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types=[['fungo','Fungo'],['botanica','Pianta'],['albero','Albero'],['animale','Animale'],['percorso','Luogo o sentiero'],['lettura','Lettura'],['appunto','Altro']];
const titles={fungo:'Un fungo da conoscere',botanica:'Una pianta da conoscere',albero:'Un albero da ricordare',animale:'Un incontro nel bosco',percorso:'Un luogo da ricordare',lettura:'Una lettura da ricordare',appunto:'Un ricordo dal bosco'};
export function createQuickNotebookComposer({dialog,zones,catalogs,onSave,onDone,onMore,onDetails,noteWeather=()=>null}){
 let value,original,controls=[],origin,busy=false,session=0;
 const cleanup=()=>{controls.forEach(c=>c.destroy());controls=[];};
 const status=message=>dialog.querySelector('[data-quick-status]').textContent=message;
 function capture(){const f=dialog.querySelector('form');for(const key of ['title','date','note'])value[key]=f.elements[key].value;}
 function render(){
  cleanup();dialog.setAttribute('aria-label',original?'Modifica ritrovamento':'Annota un ritrovamento');
  dialog.innerHTML=`<header class="report-header quick-note-header"><div><p class="eyebrow">Il tuo taccuino</p><h2>${original?'Modifica appunto':'Annota un ritrovamento'}</h2></div><button type="button" class="profile-close" data-quick-close aria-label="Chiudi">×</button></header><form class="notebook-form quick-note-form">
  <section class="quick-photo${value.photo?' has-photo':''}" aria-label="Fotografia del ritrovamento">${value.photo?`<img src="${value.photo.data}" width="${value.photo.width}" height="${value.photo.height}" alt="La foto del tuo ritrovamento">`:''}<label class="quick-photo-pick"><input type="file" accept="image/*" data-quick-photo><span class="quick-photo-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5l1-2h6l1 2h4v15H4V5Z"/><circle cx="12" cy="12" r="4"/></svg></span><span class="quick-photo-copy"><strong>${value.photo?'Cambia foto':'Aggiungi una foto'}</strong><small>${value.photo?'Scatta o scegli dalla raccolta':'Facoltativa · Scatta o scegli dalla raccolta'}</small></span></label>${value.photo?'<button type="button" class="link-btn small" data-remove-photo>Rimuovi foto</button>':''}</section>
  <fieldset class="quick-note-types"><legend>Che cosa hai osservato?</legend>${types.map(([key,label])=>`<button type="button" class="chip" data-quick-type="${key}" aria-pressed="${value.category===key}">${label}</button>`).join('')}</fieldset>
  ${['fungo','botanica','albero','animale'].includes(value.category)?`<div class="quick-note-species"><div class="search-select"><label>Nome (facoltativo)<input class="wiz-input" data-quick-species autocomplete="off" placeholder="Cerca una specie"></label><ul id="quick-species-options" hidden></ul></div><p class="small muted">Puoi lasciarlo da riconoscere. Il nome è una tua proposta.</p></div>`:''}
  <details class="quick-note-details"${value.note||original?' open':''}><summary>Luogo, data e note</summary><div class="search-select"><label>Luogo (facoltativo)<input class="wiz-input" data-quick-zone autocomplete="off" placeholder="Dove eri?"></label><ul id="quick-zone-options" hidden></ul></div><button type="button" class="link-btn small" data-quick-clear-zone>Togli luogo</button><label>Giorno<input class="wiz-input" type="date" name="date" required${['fungo','botanica','albero','animale'].includes(value.category)?` max="${todayISO()}"`:''} value="${esc(value.date)}"></label><label>Un titolo tuo (facoltativo)<input class="wiz-input" name="title" maxlength="120" value="${esc(value.title)}" placeholder="${titles[value.category]}"></label><label>Con parole tue<textarea class="wiz-input" name="note" maxlength="2000" rows="3" placeholder="Com’era il bosco? Cosa ti ha colpito?">${esc(value.note)}</textarea></label></details>
  <p data-quick-status role="status"></p><div class="quick-note-save"><div class="quick-note-confirm"><p class="quick-note-private">${value.share?'L’osservazione è condivisa. Foto e testo restano privati. Gestisci la condivisione nei dettagli.':'La foto e l’appunto restano privati, solo per te.'}</p><button type="submit" class="btn primary">${notebookGlyph}${original?'Salva modifiche':'Salva nel taccuino'}</button></div>${original?'<button type="button" class="link-btn small" data-quick-details>Dettagli dell’osservazione e condivisione</button>':''}${!original?'<button type="button" class="link-btn small" data-quick-more>Altri appunti e racconto dell’uscita</button>':''}</div></form>`;
  dialog.querySelector('[data-quick-close]').onclick=()=>{if(!busy)dialog.close();};
  dialog.querySelector('[data-quick-photo]').onchange=async event=>{
   const file=event.target.files[0];if(!file||busy)return;event.target.disabled=true;capture();const current=session;busy=true;status('Preparo la fotografia…');dialog.querySelector('[type="submit"]').disabled=true;
   try{const photo=await prepareNotebookPhoto(file);if(current!==session||!dialog.open)return;value.photo=photo;render();}catch(error){if(current===session&&dialog.open)status(error.message);}finally{if(current===session){busy=false;dialog.querySelector('[type="submit"]').disabled=false;dialog.querySelector('[data-quick-photo]').disabled=false;}}
  };
  dialog.querySelector('[data-remove-photo]')?.addEventListener('click',()=>{if(busy)return;capture();value.photo=null;render();});
  dialog.querySelectorAll('[data-quick-type]').forEach(b=>b.onclick=()=>{if(busy||value.category===b.dataset.quickType)return;capture();value.category=b.dataset.quickType;value.share=false;value.reference=null;value.observation=null;value.record=undefined;render();});
  const bounds=()=>{const r=dialog.getBoundingClientRect();return {top:dialog.querySelector('.report-header').getBoundingClientRect().bottom+8,bottom:r.bottom-16};};
  const species=dialog.querySelector('[data-quick-species]');
  if(species){
   const options=(catalogs()[value.category]||[]).map(t=>({value:t.href,label:t.name,detail:t.latin}));
   // Le note storiche possono usare una rotta diversa da quella corrente del catalogo.
   if(value.reference&&!options.some(t=>t.value===value.reference.href))options.unshift({value:value.reference.href,label:value.reference.title,detail:'Collegamento salvato'});
   controls.push(mountSearchSelect({input:species,list:dialog.querySelector('#quick-species-options'),options,selectedId:value.reference?.href,bounds,onChange:href=>{if((href||null)!==(value.reference?.href||null)){value.observation=null;value.share=false;}const t=options.find(t=>t.value===href);value.reference=t?{href,title:t.label}:null;}}));
  }
  if(species){species.setCustomValidity('');species.addEventListener('input',()=>{if(!species.value.trim())species.setCustomValidity('');});}
  const zone=dialog.querySelector('[data-quick-zone]'),zoneControl=mountSearchSelect({input:zone,list:dialog.querySelector('#quick-zone-options'),options:zones.map(z=>({value:z.id,label:z.title||z.name,detail:z.subtitle})),selectedId:value.zoneId,bounds,onChange:id=>value.zoneId=id||null});controls.push(zoneControl);zone.setCustomValidity('');zone.addEventListener('input',()=>{if(!zone.value.trim())zone.setCustomValidity('');});dialog.querySelector('[data-quick-clear-zone]').onclick=()=>zoneControl.clear();
  dialog.querySelector('[data-quick-details]')?.addEventListener('click',()=>{if(busy)return;capture();cleanup();onDetails({...value},original);});
  dialog.querySelector('[data-quick-more]')?.addEventListener('click',()=>{if(busy)return;capture();if(value.photo||value.note||value.title){status('Conserva prima questo ritrovamento, oppure rimuovi foto e testo per cambiare tipo.');return;}dialog.addEventListener('close',()=>onMore(),{once:true});dialog.close();});
  dialog.querySelector('form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;capture();if(!event.currentTarget.reportValidity())return;
   if(!value.photo&&!value.note.trim()&&!value.reference){status('Aggiungi una foto, un appunto o il nome che hai osservato.');return;}
   if(['fungo','botanica','albero','animale'].includes(value.category)&&value.date>todayISO()){status('Scegli oggi o il giorno del ritrovamento.');return;}
   busy=true;dialog.querySelector('[type="submit"]').disabled=true;
   try{const weather=original?.zoneId===value.zoneId&&original?.date===value.date?original.weather:noteWeather(value.zoneId,value.date);const entry=normalizeNotebookNote({...value,weather,title:value.title.trim()||value.reference?.title||titles[value.category],record:!['fungo','botanica','albero','animale'].includes(value.category)?undefined:value.record||{presence:'observed',amount:null,minutes:null,people:null,elevation:null,habitat:'unknown'}});const saving=session;await onSave(entry,value.share===true);if(saving!==session||!dialog.open)return;dialog.close();requestAnimationFrame(()=>onDone(entry));}catch(error){status(error.message);}finally{busy=false;dialog.querySelector('[type="submit"]').disabled=false;}
  };
 }
 dialog.addEventListener('close',()=>{session++;cleanup();origin?.isConnected&&origin.focus({preventScroll:true});});
 return {open(context={},entry=null){session++;original=entry;entry=context.draft||entry;origin=document.activeElement;value={...(entry||{}),id:entry?.id||crypto.randomUUID(),kind:'note',category:entry?.category||context.category||'fungo',title:entry?.title||'',date:entry?.date||todayISO(),note:entry?.note||'',zoneId:entry?.zoneId||context.zoneId||null,reference:entry?.reference||context.reference||null,photo:entry?.photo||null,share:typeof entry?.share==='boolean'?entry.share:entry?.shared===true,savedAt:entry?.savedAt||new Date().toISOString()};busy=false;render();if(!dialog.open)openModal(dialog);dialog.querySelector('[data-quick-close]').focus({preventScroll:true});}};
}
