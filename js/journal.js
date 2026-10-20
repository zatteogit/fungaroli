import {notebookGlyph} from './ui-icons.js';
import {openModal} from './modal-flow.js';
import {renderNotebook, notebookRoute, notebookTitle} from './notebook-view.js';
import {notebookDemo} from './notebook-demo.js';
// Diario delle uscite: procedura guidata a passi + elenco con confronto previsto/trovato.
// Archivio: nella versione Artifact usa il db privato dell'utente (persistente, leggibile
// da Claude per la taratura); altrove localStorage del browser.

import { SPECIES } from './species.js';
import {createOutingComposer} from './outing-composer.js';
import {outingMemory,outingStory} from './outing-memory.js';
import { formatIndex } from './model.js';
import { todayISO } from './weather.js';
import { communityReady, communityEnabled, currentUser, communityRequest, shareDiaryEntry, shareNotebookNote } from './community.js';
import {normalizeNotebookNote,PHENO_PHASES} from './notebook-entry.js';
import {sharedObservation} from './community-observation.js';
import {createNotebookComposer} from './notebook-composer.js';

const KEY = 'fungaroli:diario:v1';
export const LEVELS = ['', 'Pochi', 'Discreti', 'Tanti'];
export const FOUND_THRESHOLD = 30; // soglia esplorativa 3,0/10, non calibrata

// --- funzioni pure (testabili) ------------------------------------------------

// Il modello e' d'accordo con l'uscita? Confronta l'indice massimo previsto
// (solo specie con previsione) con l'aver trovato o meno qualcosa.
export function speciesAgreement(entry) {
  const captured = Date.parse(entry.forecast?.capturedAt);
  const started = Date.parse(entry.effort?.startedAt);
  if (['plan','note'].includes(entry.kind) || entry.forecast?.mode !== 'prospective' || !Number.isFinite(captured)
      || !Number.isFinite(started) || captured >= started || !Array.isArray(entry.searched)) return [];
  return [...new Set(entry.searched)].flatMap((id) => {
    const predicted = entry.predicted?.[id], observed = entry.finds?.[id];
    if (!Number.isFinite(predicted) || !Number.isFinite(observed)) return [];
    const said = predicted >= FOUND_THRESHOLD, found = observed > 0;
    return [{ id, predicted, said, found, ok: said === found }];
  });
}

export function agreement(entry) {
  const species = speciesAgreement(entry);
  if (!species.length) return null;
  return { species, ok: species.every((s) => s.ok),
    missed: species.filter((s) => !s.said && s.found).length,
    falseAlarm: species.filter((s) => s.said && !s.found).length };
}

export function summary(entries) {
  const outings = entries.filter((e) => !['plan','note'].includes(e.kind));
  const judged = outings.flatMap(speciesAgreement);
  return {
    total: outings.length,
    judged: judged.length,
    ok: judged.filter((a) => a.ok).length,
    missed: judged.filter((a) => !a.said && a.found).length,
    falseAlarm: judged.filter((a) => a.said && !a.found).length,
  };
}

// --- archivio -----------------------------------------------------------------

function localStore(key = KEY) {
  const read = () => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const write = (list) => { localStorage.setItem(key, JSON.stringify(list)); };
  return {
    kind: 'local',
    async list() { return read(); },
    async replace(list) { write(list); },
    async put(e) { write([...read().filter((x) => x.id !== e.id), e]); },
    async remove(id) { write(read().filter((x) => x.id !== id)); },
  };
}

function collectiveStore() {
  const account = currentUser();
  const local = localStore('fungaroli:diario:account:' + account.id);
  return { kind: 'community', ownerId: account.id,
    async list({isCurrent=()=>true}={}) {
      try {
        if (currentUser()?.id !== account.id) throw Object.assign(new Error('Profilo cambiato.'), { status: 401 });
        const entries = (await communityRequest('entries')).entries;
        if (currentUser()?.id !== account.id) throw Object.assign(new Error('Profilo cambiato.'), { status: 401 });
        if(isCurrent())await local.replace(entries); return entries;
      }
      catch (e) { if (e.status === 401) throw e; return local.list(); }
    },
    async put(e) {
      if (currentUser()?.id !== account.id) throw new Error('Profilo cambiato: riapri il taccuino.');
      await local.put(e);
      if (currentUser()?.id !== account.id) throw new Error('Profilo cambiato: riapri il taccuino.');
      const saved = await communityRequest('entries/' + e.id, 'PUT', e);
      if (saved.entry) { Object.assign(e, saved.entry); await local.put(e); }
    },
    async remove(id,{signal}={}) { if (currentUser()?.id !== account.id) throw new Error('Profilo cambiato.'); await communityRequest('entries/' + id, 'DELETE',undefined,{signal}); await local.remove(id); },
  };
}

function dbStore(col) {
  return {
    kind: 'db',
    async list() { return (await col.get()).docs.map((d) => d.data()).filter(Boolean); },
    async put(e) { await col.doc(e.id).set(e); },
    async remove(id) { await col.doc(id).delete(); },
  };
}

// Taccuino sincronizzato sul sito (Cloudflare Pages Function + KV), protetto dal "codice diario".
const TOKEN_KEY = 'fungaroli:diario-token';
const API = 'api/diario';
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignora */ } };

// 'needs_code' se il sito ha la sincronizzazione attiva, altrimenti 'none'
async function probeRemote() {
  try {
    const r = await fetch(API, { headers: { authorization: 'Bearer -' } });
    if (r.status === 401 && (r.headers.get('content-type') || '').includes('json')) return 'needs_code';
  } catch { /* offline o sito statico */ }
  return 'none';
}

function remoteStore(token) {
  const local = localStore();
  const call = async (path, opts = {}) => {
    const r = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
    if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
    return r.json();
  };
  return {
    kind: 'remote',
    async list() {
      try {
        const { entries } = await call(API);
        try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* copia locale facoltativa */ }
        return entries;
      } catch (e) {
        if (e.status === 401) throw e;
        this.offline = true;
        return local.list(); // offline: mostra l'ultima copia scaricata
      }
    },
    async put(e) { await local.put(e); await call(`${API}/${e.id}`, { method: 'PUT', body: JSON.stringify(e) }); },
    async remove(id) { await local.remove(id); await call(`${API}/${id}`, { method: 'DELETE' }); },
  };
}

async function openStore() {
  await communityReady();
  if (communityEnabled() && currentUser()) return collectiveStore();
  const use = globalThis.claude?.use;
  if (typeof use === 'function') {
    try {
      const [db, user] = await Promise.all([use('db'), use('user')]);
      const id = user ? await user.id() : null;
      if (db && id) return dbStore(db.collection(`data/users/${id}/diario/uscite`));
    } catch { /* ricade su localStorage */ }
  }
  return localStore();
}

// --- interfaccia --------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iso = todayISO;

export function initJournal({ resolveTrip=()=>null,onEntries=()=>{},zones, speciesCatalog = SPECIES, predict, captureForecast, getZoneId, noteCatalogs=()=>({}), zoneImage = () => '', referenceImage=()=>null }) {
  const dlg = document.getElementById('journal-dialog');
  const body = dlg.querySelector('.wiz-body');
  const list = document.getElementById('journal-list');
  let entries = [],notifiedEntries=null;
  let store = null;
  let listMessage = '';
  const actionStates=new Map();let entriesRevision=0;
  let listFilter='',listQuery='',noteControls=[];
  let listLayout='pages',listDensity='large';
  try { const saved=JSON.parse(localStorage.getItem('fungaroli:notebook-view')||'null');if(['pages','gallery','list'].includes(saved?.layout))listLayout=saved.layout;if(saved?.density==='compact')listDensity='compact'; } catch { /* La vista resta utilizzabile anche senza storage. */ }

  let demoEntries=null,lastDemoMode=false;
  const getDemoEntries=()=>demoEntries ||= notebookDemo({zones,catalogs:noteCatalogs(),species:speciesCatalog});
  const sortEntries = () => entries.sort((a, b) => String(b.date||'').localeCompare(String(a.date||'')) || String(b.savedAt||'').localeCompare(String(a.savedAt||'')));
  const noteDialog=document.createElement('dialog');noteDialog.className='wiz notebook-dialog';noteDialog.setAttribute('aria-label','Appunto privato');document.body.append(noteDialog);
  const savedNotice=document.createElement('div');savedNotice.className='app-toast';savedNotice.setAttribute('role','status');document.body.append(savedNotice);let noticeTimer;
  document.addEventListener('fungaroli:note-saved',()=>{
    const origin=noteOrigin;
    const showSavedNotice=()=>{clearTimeout(noticeTimer);(origin?.closest('dialog[open]')||document.body).append(savedNotice);savedNotice.innerHTML=`Salvato nel taccuino <a href="#/diario" class="link-btn">${notebookGlyph}Apri →</a>`;savedNotice.classList.add('on');noticeTimer=setTimeout(()=>savedNotice.classList.remove('on'),5000);};
    // Il coordinatore riapre la scheda al close: prima il suo dialog è sospeso.
    if(noteDialog.open)noteDialog.addEventListener('close',showSavedNotice,{once:true});else showSavedNotice();
  });
  let noteOrigin=null;
  noteDialog.addEventListener('close',()=>{noteControls.forEach(c=>c.destroy());noteControls=[];noteOrigin?.isConnected&&noteOrigin.focus({preventScroll:true});});
  addEventListener('hashchange',()=>{if(noteDialog.open)noteDialog.close();});

  let noteOwner;
  const composer=createNotebookComposer({dialog:noteDialog,zones,catalogs:noteCatalogs,canShare:()=>store?.kind==='community'&&!!currentUser(),onOuting:()=>open(),onSave:async(entry,share)=>{
    const owner=noteOwner;if(owner!==store)throw new Error('Profilo cambiato: riapri la nota.');
    await owner.put(entry);if(owner!==store)throw new Error('Profilo cambiato: riapri la nota.');
    entries=[entry,...entries.filter(e=>e.id!==entry.id)];sortEntries();entriesRevision++;renderList('Nota salvata nel taccuino.');
    if(share){try{await shareNotebookNote(entry);if(owner!==store)throw new Error('Profilo cambiato: riapri il taccuino.');entry.shared=true;renderList('Osservazione condivisa con Fronda. Il testo resta privato.');}catch(error){throw new Error('Nota salvata privata. Condivisione non completata: '+error.message);}}
    if(!share&&owner.kind==='community')document.dispatchEvent(new CustomEvent('fungaroli:refresh-community'));
    document.dispatchEvent(new CustomEvent('fungaroli:note-saved',{detail:{title:entry.title}}));
  }});
  async function openNote(context={},existing=null){
    await storageReady;if(!store){renderList('Il taccuino sta ancora caricando.');return;}
    noteOwner=store;noteOrigin=document.activeElement;composer.open(context,existing);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-new-note],[data-note-kind]');if(!b)return;
    const kind=b.dataset.noteKind,id=b.dataset.noteId;
    const category={pianta:'botanica',albero:'albero',specie:'fungo',fungo:'fungo',commestibile:'fungo',zona:'percorso',guide:'lettura'}[kind]||'appunto';
    openNote({...(kind?{category}:{}),zoneId:b.dataset.noteZone,reference:kind?{href:b.dataset.noteHref||`#/${kind}/${id}`,title:b.dataset.noteTitle}:null});
  });

  const editorialTripTitle=source=>source.reference.title.replace(/^Giro simulato di Matteo · /,'');
  // Il ricordo dell’uscita resta distinto dalle osservazioni di ricerca.
  const outingSpecies=()=>{
    const byId=new Map(speciesCatalog.map(s=>[s.id,s]));
    for(const item of noteCatalogs().fungo||[]){const id=item.href?.split('/').at(-1);if(id&&!byId.has(id))byId.set(id,{...item,id});}
    return [...byId.values()];
  };
  let outingOwner;
  const outingComposer=createOutingComposer({dialog:dlg,zones,species:outingSpecies,onSave:async(draft,existing)=>{
    const owner=outingOwner;if(!currentStore(owner))throw new Error('Profilo cambiato: riapri l’uscita.');
    if(!zones.some(z=>z.id===draft.zoneId)||!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)||draft.date>iso(new Date()))throw new Error('Controlla luogo e giorno dell’uscita.');
    const parsedDay=new Date(draft.date+'T12:00:00Z');if(!Number.isFinite(+parsedDay)||parsedDay.toISOString().slice(0,10)!==draft.date)throw new Error('Controlla il giorno dell’uscita.');
    const now=new Date().toISOString(),sameContext=existing&&existing.zoneId===draft.zoneId&&existing.date===draft.date;
    const entry={...draft,id:existing?.id||crypto.randomUUID(),kind:'outing',note:draft.note.trim(),band:sameContext?existing?.band??null:null,
      experience:outingMemory(draft,outingSpecies()),savedAt:existing?.savedAt||now,
      predicted:sameContext?existing.predicted||{}:{},
      forecast:sameContext?existing.forecast:{mode:'retrospective',capturedAt:now}};
    await owner.put(entry);if(!currentStore(owner))throw new Error('Profilo cambiato: riapri il taccuino.');
    entries=[entry,...entries.filter(e=>e.id!==entry.id)];sortEntries();entriesRevision++;renderList('Uscita salvata nel taccuino.');return entry;
  },onDone:entry=>{location.hash='#/diario/pagina/'+encodeURIComponent(entry.id);}});
  async function open(context={},existing=null){
    await storageReady;if(!store)return;outingOwner=store;outingComposer.open(context,existing);
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-new-outing],[data-edit-outing],[data-complete-outing],[data-save-trip]');if(!button||button.disabled)return;
    const entry=entries.find(e=>String(e.id)===(button.dataset.editOuting||button.dataset.completeOuting));
    if(button.hasAttribute('data-edit-outing')){if(entry)open({},entry);return;}
    if(button.hasAttribute('data-complete-outing')){
      if(!entry)return;const reference=entry.reference,source=resolveTrip(reference?.href);
      open({zoneId:entry.zoneId,date:entry.date<=iso(new Date())?entry.date:iso(new Date()),fromEntryId:entry.id,reference:source?.reference||null,route:source?(source.zoneId===entry.zoneId?source.route:null):reference?{href:reference.href,name:reference.title,followed:false}:null});return;
    }
    const source=resolveTrip(button.dataset.tripSource),zoneId=button.dataset.tripZone,route=button.dataset.tripHref?{href:button.dataset.tripHref,name:button.dataset.tripTitle,followed:false}:null;
    if(!button.hasAttribute('data-save-trip')){open({zoneId,route,reference:source?.reference||null});return;}
    await storageReady;if(!store)return;const owner=store;button.disabled=true;
    try{
      const reference=source?.reference||(route?{href:route.href,title:route.name.slice(0,160)}:null),date=button.dataset.tripDate||iso(new Date());
      const duplicate=entries.find(e=>e.kind==='note'&&e.category==='percorso'&&e.reference?.href===reference?.href&&(source||e.date===date));
      if(duplicate){location.hash='#/diario/pagina/'+encodeURIComponent(duplicate.id);return;}
      const saved=normalizeNotebookNote({id:crypto.randomUUID(),kind:'note',category:'percorso',title:(source?editorialTripTitle(source):route?.name)?.slice(0,120),date,zoneId,note:'',reference,savedAt:new Date().toISOString()},{zoneIds:new Set(zones.map(z=>z.id))});
      await owner.put(saved);if(!currentStore(owner))return;
      entries=[saved,...entries];sortEntries();entriesRevision++;renderList('Giro salvato. Dopo l’uscita, tocca “Ci sono stato”.');location.hash='#/diario/pagina/'+encodeURIComponent(saved.id);
    }catch(error){
      clearTimeout(noticeTimer);document.body.append(savedNotice);savedNotice.textContent='Giro non salvato. '+error.message;savedNotice.classList.add('on');noticeTimer=setTimeout(()=>savedNotice.classList.remove('on'),7000);
    }finally{button.disabled=false;}
  });

  // dove sta la voce: solo nel taccuino o anche nei conteggi della community (zona, giorno, specie, quantita')
  function privacyTag(entry){
    const shared=store?.kind==='community'&&entry.shared;
    return shared?`<span class="j-privacy is-shared"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/></svg>Nei conteggi della community · le note restano private</span>`
      :`<span class="j-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Solo per te</span>`;
  }
  function rowActions(entry){
    const state=actionStates.get(String(entry.id))||{},id=esc(entry.id),disabled=state.busy?' disabled':'';
    const completed=entries.filter(e=>e.kind==='outing'&&e.experience?.fromEntryId===entry.id);
    let canPublish=entry.kind==='outing'&&Object.entries(entry.finds||{}).some(([id,amount])=>speciesCatalog.some(sp=>sp.id===id)&&(amount>0||amount===0&&entry.searched?.includes(id)));if(entry.kind==='note')try{sharedObservation(entry);canPublish=true;}catch{/* Contesto incompleto: modifica prima di condividere. */}
    const publicControl=store.kind==='community'&&entry.kind!=='plan'&&(entry.shared||canPublish)?`<button type="button" class="diary-community-switch" role="switch" aria-checked="${!!entry.shared}" ${entry.shared?'data-withdraw-entry':'data-share-entry'}="${id}"${disabled}><span class="diary-switch-track" aria-hidden="true"></span><span><b>Condividi con community Fronda</b><small>Condividi per consultare gli aggregati. Agli altri solo conteggi per zona ampia e specie su 7 giorni, con almeno 3 contributori e 2 giorni diversi: nessun punto GPS, nome, giorno preciso o testo della nota. Ritirando tutte le condivisioni perdi l’accesso agli aggregati.</small></span></button>`:'';
    return `${completed.length?`<p class="small">${completed.map(e=>`<a href="#/diario/pagina/${encodeURIComponent(e.id)}">Uscita del ${esc(e.date)} →</a>`).join(' · ')}</p>`:''}${privacyTag(entry)}${publicControl}<div class="j-actions" aria-busy="${!!state.busy}">
      ${['note','outing','plan'].includes(entry.kind)?`<button type="button" class="btn notebook-share" data-share-note="${id}"${disabled}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/></svg>Invia una copia</button>`:''}
      ${entry.kind==='note'?`<button type="button" class="link-btn small" data-edit-note="${id}"${disabled}>Modifica</button>`:''}

      ${entry.kind==='outing'?`<button type="button" class="link-btn small" data-edit-outing="${id}"${disabled}>Modifica il ricordo</button>`:''}
      ${entry.kind==='plan'||entry.category==='percorso'?`<button type="button" class="btn primary" data-complete-outing="${id}"${disabled}>Ci sono stato</button>`:''}
      <button type="button" class="link-btn small j-delete" data-del="${id}"${disabled}>${state.busy==='delete'?'Elimino…':state.confirmDelete?'Conferma eliminazione':'Elimina'}</button>
      ${state.confirmDelete&&!state.busy?`<button type="button" class="link-btn small" data-cancel-delete="${id}">Annulla</button>`:''}
    </div>${state.message?`<p class="j-action-status${state.error?' is-error':''}" role="${state.error?'alert':'status'}">${esc(state.message)}</p>`:''}`;
  }
  const currentStore=target=>!!target&&target===store&&(target.kind!=='community'||target.ownerId===currentUser()?.id);
  const focusAction=(id,attr)=>list.querySelector(`[${attr}="${CSS.escape(id)}"]`)?.focus({preventScroll:true});
  const shareDialog=document.createElement('dialog');shareDialog.className='wiz notebook-share-dialog';shareDialog.setAttribute('aria-label','Condividi una copia');document.body.append(shareDialog);
  let shareOrigin=null;
  shareDialog.addEventListener('close',()=>shareOrigin?.isConnected&&shareOrigin.focus({preventScroll:true}));
  addEventListener('hashchange',()=>shareDialog.close());
  list.addEventListener('click',async event=>{
    const button=event.target.closest('[data-share-note]');if(!button||button.disabled)return;
    const entry=entries.find(e=>String(e.id)===button.dataset.shareNote);if(!entry)return;
    const zone=zones.find(z=>z.id===entry.zoneId),title=notebookTitle(entry,zones);
    const text=[title,[entry.date,zone?.title||zone?.name].filter(Boolean).join(' · '),outingStory(entry,{zones,species:outingSpecies()}),entry.note,entry.reference?.title,(entry.reference?.href||outingMemory(entry,outingSpecies()).route?.href)?new URL(entry.reference?.href||outingMemory(entry,outingSpecies()).route.href,location.href).href:''].filter(Boolean).join('\n\n');
    shareOrigin=button;
    if(navigator.share){
      try{await navigator.share({title,text});return;}catch(error){if(error.name==='AbortError')return;}
    }
    shareDialog.innerHTML=`<div class="wiz-body"><h2>Condividi una copia</h2><p>Copia il testo e invialo a chi vuoi.</p><label for="note-share-text" class="sr-only">Testo da condividere</label><textarea id="note-share-text" readonly rows="8">${esc(text)}</textarea><p class="small" role="status" data-copy-status></p><div class="wiz-nav"><button class="btn ghost" type="button" data-share-close>Chiudi</button><button class="btn primary" type="button" data-copy-note>Copia il testo</button></div></div>`;
    shareDialog.querySelector('[data-share-close]').addEventListener('click',()=>shareDialog.close());
    shareDialog.querySelector('[data-copy-note]').addEventListener('click',async()=>{
      const status=shareDialog.querySelector('[data-copy-status]');
      try{await navigator.clipboard.writeText(text);status.textContent='Appunto copiato. Incollalo nella chat o nel messaggio che preferisci.';}catch{shareDialog.querySelector('textarea').select();status.textContent='Seleziona e copia il testo, poi incollalo nel tuo messaggio.';}
    });
    openModal(shareDialog);
  });
  list.addEventListener('click',async event=>{
    const button=event.target.closest('[data-share-entry],[data-withdraw-entry],[data-del],[data-cancel-delete]');
    if(!button||!list.contains(button)||button.disabled)return;
    const attr=['data-share-entry','data-withdraw-entry','data-del','data-cancel-delete'].find(key=>button.hasAttribute(key)),id=button.getAttribute(attr),entry=entries.find(e=>String(e.id)===id),target=store;
    if(!entry||!target||!currentStore(target))return;
    const state=actionStates.get(id)||{};if(state.busy)return;
    if(attr==='data-cancel-delete'){actionStates.delete(id);renderList();focusAction(id,'data-del');return;}
    if(attr==='data-del'&&!state.confirmDelete){
      actionStates.set(id,{confirmDelete:true,message:entry.kind==='note'?'Eliminare definitivamente questo appunto? Conferma oppure annulla.':'Eliminare definitivamente questa voce e le sue segnalazioni? Conferma oppure annulla.'});
      renderList();focusAction(id,'data-del');return;
    }
    const action=attr==='data-share-entry'?'share':attr==='data-withdraw-entry'?'withdraw':'delete';
    actionStates.set(id,{busy:action,message:action==='share'?'Condivisione in corso…':action==='withdraw'?'Ritiro delle segnalazioni in corso…':'Eliminazione in corso…'});
    entriesRevision++;renderList();
    const signal=AbortSignal.timeout(15000);
    try{
      let message;
      if(action==='share'){
        if(!await (entry.kind==='note'?shareNotebookNote:shareDiaryEntry)(entry,{signal}))throw new Error('Accedi al tuo profilo per condividere questa osservazione.');
        entry.shared=true;
        message='Osservazioni condivise: zona, giorno, specie e quantità. Le note restano private.';
      }else if(action==='withdraw'){
        await communityRequest(entry.kind==='note'?'observations/'+id:'reports','DELETE',entry.kind==='note'?undefined:{entryId:id},{signal});
        entry.shared=false;
        document.dispatchEvent(new CustomEvent('fungaroli:refresh-community'));
        message=entry.kind==='note'?'Segnalazioni ritirate. La nota resta privata nel taccuino.':'Segnalazioni ritirate. L’uscita resta nel taccuino privato.';
      }else{
        await target.remove(entry.id,{signal});
        if(!currentStore(target))return;
        entries=entries.filter(e=>String(e.id)!==id);actionStates.delete(id);entriesRevision++;
        if(notebookRoute().id===id)location.hash='#/diario';
        renderList(entry.kind==='note'?'Appunto eliminato.':'Voce e segnalazioni eliminate.');if(target.kind==='community')document.dispatchEvent(new CustomEvent('fungaroli:refresh-community'));return;
      }
      if(!currentStore(target))return;
      actionStates.set(id,{message});entriesRevision++;renderList(message);focusAction(id,attr);
    }catch(error){
      if(!currentStore(target))return;
      const message=['TimeoutError','AbortError'].includes(error.name)?'La richiesta impiega troppo tempo. Controlla la connessione e riprova.':error.message||'Operazione non riuscita. Riprova.';
      actionStates.set(id,{error:true,message});entriesRevision++;renderList(message);focusAction(id,attr);
    }
  });

  function renderList(msg) {
    if (msg !== undefined) listMessage = msg;
    const route=notebookRoute(),inNotebook=location.hash.startsWith('#/diario');
    if(route.demo!==lastDemoMode){listFilter='';listQuery='';lastDemoMode=route.demo;}
    if (!store&&!route.demo) { list.innerHTML = '<p class="muted">Carico il taccuino…</p>'; return; }
    // Fictional pages never enter personalisation, storage, exports or community requests.
    if(store&&notifiedEntries!==entries){notifiedEntries=entries;onEntries(entries);}
    const analysis=e=>{
      const a=agreement(e),top=Object.entries(e.predicted||{}).filter(([,v])=>Number.isFinite(v)).sort((x,y)=>y[1]-x[1])[0];
      return `<details class="notebook-analysis"><summary>Condizioni ${e.kind==='plan'?'salvate':'dell’uscita'}</summary>${top?`<p>Indice salvato ${formatIndex(top[1])} · ${esc(speciesCatalog.find(x=>x.id===top[0])?.name||top[0])}</p><p class="small muted">Valore storico: non descrive le condizioni attuali.</p>`:''}${e.kind==='plan'?'<p>Previsione salvata prima dell’uscita.</p>':a?a.species.map(x=>`<p>${esc(speciesCatalog.find(s=>s.id===x.id)?.name||x.id)}: ${x.ok?'concordante':x.said?'indice alto, zero osservato':'trovata con indice basso'}</p>`).join(''):'<p>Osservazione senza confronto prospettico.</p>'}</details>`;
    };
    const result=renderNotebook({entries:route.demo?getDemoEntries():entries,zones,species:outingSpecies(),zoneImage,referenceImage,route,filter:listFilter,query:listQuery,layout:listLayout,density:listDensity,canPreview:['admin','editor'].includes(currentUser()?.role),actions:rowActions,analysis,shared:e=>store?.kind==='community'&&e.shared});
    const heading=document.querySelector('.notebook-heading');
    heading.querySelector('h1').textContent=result.title;
    heading.querySelector('.kicker').textContent=result.kicker;
    heading.querySelector('.view-sub').textContent=result.subtitle;
    heading.querySelector('.diary-header-actions').hidden=route.demo||result.detail;
    heading.querySelectorAll('[data-new-note],[data-new-outing]').forEach(b=>b.hidden=route.demo||result.detail);
    heading.querySelector('.diary-demo-link').hidden=!['admin','editor'].includes(currentUser()?.role)||route.demo||result.detail;
    document.querySelector('.notebook-view').classList.toggle('is-detail',result.detail);
    document.querySelector('.notebook-view').classList.toggle('is-demo',route.demo);
    document.getElementById('notebook-storage-panel').hidden=route.demo||result.detail;
    const hasRowMessage=[...actionStates.values()].some(state=>state.message===listMessage);
    list.innerHTML=(!route.demo&&listMessage&&!hasRowMessage?`<p class="notice notebook-feedback" role="status">${esc(listMessage)}</p>`:'')+result.html;
    if(inNotebook)document.title=`${result.detail?result.title:route.demo?'Diario di prova':'Taccuino'} · Fronda`;
    list.querySelectorAll('[data-edit-note]').forEach(b=>b.onclick=()=>openNote({},entries.find(e=>String(e.id)===b.dataset.editNote)));
    list.querySelectorAll('button[data-notebook-layout],button[data-notebook-density]').forEach(button=>button.onclick=()=>{
      const bar=list.querySelector('.diary-view-bar'),edge=document.querySelector('.appbar').getBoundingClientRect().bottom;
      const anchored=bar.getBoundingClientRect().top<=edge+2;
      const anchor=anchored?[...list.querySelectorAll('.diary-card')].find(card=>card.getBoundingClientRect().bottom>bar.getBoundingClientRect().bottom+8):null;
      const anchorTop=anchor?Math.max(anchor.getBoundingClientRect().top,bar.getBoundingClientRect().bottom+8):0,id=anchor?.dataset.journalId;
      if(button.dataset.notebookLayout)listLayout=button.dataset.notebookLayout;
      if(button.dataset.notebookDensity)listDensity=button.dataset.notebookDensity;
      try { localStorage.setItem('fungaroli:notebook-view',JSON.stringify({layout:listLayout,density:listDensity})); } catch { /* Preferenza solo in memoria. */ }
      renderList();
      const restored=id&&list.querySelector(`.diary-card[data-journal-id="${CSS.escape(id)}"]`);
      if(restored){const targetTop=Math.max(anchorTop,list.querySelector('.diary-view-bar').getBoundingClientRect().bottom+8);scrollBy({top:restored.getBoundingClientRect().top-targetTop,behavior:'instant'});}
      const selector=button.dataset.notebookLayout?`[data-notebook-layout="${listLayout}"]`:`[data-notebook-density="${listDensity==='large'?'compact':'large'}"]`;
      list.querySelector(selector)?.focus({preventScroll:true});
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)list.querySelector('.diary-grid')?.animate([{opacity:.5},{opacity:1}],{duration:160,easing:'ease-out'});
    });
    list.querySelectorAll('[data-notebook-filter]').forEach(b=>b.onclick=()=>{listFilter=b.dataset.notebookFilter;renderList();list.querySelector(`[data-notebook-filter="${CSS.escape(listFilter)}"]`)?.focus({preventScroll:true});});
    list.querySelector('[data-notebook-reset]')?.addEventListener('click',()=>{listFilter='';listQuery='';renderList();list.querySelector('#notebook-query')?.focus({preventScroll:true});});
    list.querySelector('#notebook-query')?.addEventListener('input',ev=>{const pos=ev.target.selectionStart;listQuery=ev.target.value;renderList();const input=list.querySelector('#notebook-query');input.focus({preventScroll:true});if(pos!=null)try{input.setSelectionRange(pos,pos);}catch{/* Search inputs may not expose selection. */}});
  }

  document.querySelectorAll('[data-open-journal]').forEach((b) => b.addEventListener('click',()=>openNote()));
  dlg.querySelector('.wiz-close').addEventListener('click', () => dlg.close());
  renderList();
  const storageBox = document.getElementById('journal-storage');

  // collega questo dispositivo con il codice di famiglia (dal campo o dal QR di un altro dispositivo)
  async function connect(code, msg) {
    if (msg) msg.textContent = 'Collego…';
    const rs = remoteStore(code);
    try {
      const remoteEntries = await rs.list();
      // carica online le uscite salvate finora solo in questo browser
      const ids = new Set(remoteEntries.map((e) => e.id));
      for (const e of entries) if (!ids.has(e.id)) await rs.put(e);
      setToken(code);
      store = rs;
      entries = await rs.list();
      sortEntries();
      renderStorage();
      renderList(`Taccuino collegato: ${entries.length} voci sincronizzate.`);
      return true;
    } catch (e) {
      if (msg) msg.textContent = e.status === 401 ? 'Codice non valido: controlla di averlo copiato tutto.' : 'Collegamento non riuscito, riprova tra poco.';
      return false;
    }
  }
  const PHONES = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="3" width="8" height="16" rx="2"/><path d="M6.5 16h1M16.5 14h1"/></svg>';
  const linkFor = (code) => `${location.origin}${location.pathname}#/diario/collega/${encodeURIComponent(code)}`;
  let qrLib = null;
  const loadQr = () => qrLib || (qrLib = new Promise((ok, ko) => { if (globalThis.qrcode) return ok(); const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; sc.onload = ok; sc.onerror = ko; document.head.append(sc); }));

  function renderStorage(remote) {
    if (store.kind === 'community') {
      storageBox.innerHTML = `<p>Taccuino privato di <b>${esc(currentUser()?.handle || 'questo profilo')}</b>, sincronizzato con la passkey. Le condivisioni sono facoltative.</p><button type="button" class="btn ghost" data-community-account>Gestisci il profilo</button>`;
    } else if (communityEnabled() && store.kind === 'local') {
      storageBox.innerHTML = '<p>Il taccuino resta su questo dispositivo. Con una passkey puoi tenerlo privato online e scegliere quali osservazioni condividere.</p><button type="button" class="btn primary" data-community-account>Crea profilo o accedi</button>';
    } else if (store.kind === 'db') {
      storageBox.innerHTML = 'Il taccuino è salvato nel tuo spazio privato di questa pagina: lo ritrovi da qualsiasi dispositivo.';
    } else if (store.kind === 'remote') {
      storageBox.innerHTML = `<div class="sync-card ok"><span class="sync-ic">${PHONES}</span><div><b>Taccuino sincronizzato</b><p class="small">${store.offline ? 'Sei offline: vedi l\'ultima copia scaricata. ' : ''}Lo ritrovi su tutti i dispositivi collegati.</p></div></div>
        <button type="button" class="btn primary" id="j-share">Collega un altro dispositivo</button>
        <div class="sync-qr" id="j-qr" hidden></div>
        <button type="button" class="link-btn small" id="j-disconnect">Scollega questo dispositivo</button>`;
      storageBox.querySelector('#j-disconnect').addEventListener('click', () => { setToken(''); location.reload(); });
      storageBox.querySelector('#j-share').addEventListener('click', async (e) => {
        const box = storageBox.querySelector('#j-qr'), url = linkFor(getToken());
        e.currentTarget.hidden = true; box.hidden = false;
        box.innerHTML = `<p><b>Sull'altro telefono inquadra il codice con la fotocamera</b> e apri il link: si collega da solo.</p><div class="qr-img" aria-label="Codice QR per collegare un altro dispositivo"></div>
          <button type="button" class="btn ghost" id="j-copy">Oppure copia il link</button>
          <p class="small muted">Chi ha questo codice può leggere e scrivere il taccuino: mostralo solo ai tuoi.</p>`;
        box.querySelector('#j-copy').addEventListener('click', (ev) => navigator.clipboard?.writeText(url).then(() => { ev.target.textContent = 'Link copiato'; }));
        try { await loadQr(); const q = globalThis.qrcode(0, 'M'); q.addData(url); q.make(); box.querySelector('.qr-img').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
        catch { box.querySelector('.qr-img').innerHTML = '<p class="small">Senza rete non posso disegnare il QR: usa "copia il link".</p>'; }
      });
    } else if (remote === 'needs_code') {
      storageBox.innerHTML = `
        <div class="sync-card"><span class="sync-ic">${PHONES}</span><div><b>Ritrova il taccuino su tutti i dispositivi</b>
          <p class="small">Ora le uscite sono salvate solo su questo dispositivo.</p></div></div>
        <ol class="sync-steps">
          <li>Sul telefono dove il taccuino è già collegato apri <b>Taccuino › Collega un altro dispositivo</b>.</li>
          <li>Inquadra il codice QR con la fotocamera di questo telefono e apri il link. Fatto.</li>
        </ol>
        <details class="sync-code"><summary>Non hai l'altro telefono a portata di mano? Inserisci il codice</summary>
          <form class="j-connect" id="j-connect">
            <div class="j-connect-row"><span class="pw"><input id="j-code" type="password" autocomplete="current-password" class="wiz-input" placeholder="Codice di famiglia" required><button type="button" class="pw-eye" aria-label="Mostra il codice">👁</button></span>
            <button type="submit" class="btn primary">Collega</button></div>
            <p class="j-connect-msg small" role="status"></p>
          </form></details>`;
      const inp = storageBox.querySelector('#j-code');
      storageBox.querySelector('.pw-eye').addEventListener('click', (e) => { const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; e.currentTarget.setAttribute('aria-label', show ? 'Nascondi il codice' : 'Mostra il codice'); });
      storageBox.querySelector('#j-connect').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        await connect(inp.value.trim(), storageBox.querySelector('.j-connect-msg'));
      });
    } else {
      storageBox.innerHTML = 'Il taccuino resta solo in questo browser.';
    }
  }

  // link dal QR: #/diario/collega/<codice>. Il codice esce subito dalla barra degli indirizzi e dalla cronologia
  const fromLink = () => {
    if (communityEnabled()) return; // i vecchi codici di famiglia non cambiano il proprietario del taccuino personale
    const m = location.hash.match(/^#\/diario\/collega\/(.+)$/);
    if (!m) return;
    let code = ''; try { code = decodeURIComponent(m[1]); } catch { return; }
    history.replaceState(null, '', '#/diario');
    connect(code, null).then((ok) => { if (!ok) renderList('Il link non ha funzionato: inserisci il codice a mano.'); });
  };
  addEventListener('hashchange', fromLink);


  const storageReady = (async () => {
    let st = await openStore();
    let remote = 'none';
    if (st.kind === 'local' && !communityEnabled()) {
      const token = getToken();
      if (token) {
        const rs = remoteStore(token);
        try { await rs.list(); st = rs; } catch (e) { if (e.status === 401) setToken(''); }
      }
      if (st.kind === 'local') remote = await probeRemote();
    }
    if (st.kind === 'community' && st.ownerId !== currentUser()?.id) return;
    store = st;
    let initial; try { initial = await st.list(); } catch { initial = []; }
    if (store !== st || (st.kind === 'community' && st.ownerId !== currentUser()?.id)) return;
    entries = initial;
    sortEntries();
    renderStorage(remote);
    renderList();
    fromLink(); // dopo l'avvio: il collegamento dal QR non deve essere sovrascritto
  })();
  let profileId = currentUser()?.id || null;
  document.addEventListener('fungaroli:community', async () => {
    const next = currentUser()?.id || null;
    if (next === profileId) { if (store?.kind === 'community') { const loading = store,revision=entriesRevision; try { const fresh = await loading.list({isCurrent:()=>currentStore(loading)&&revision===entriesRevision}); if (!currentStore(loading)||revision!==entriesRevision) return; entries = fresh; sortEntries(); renderList(); } catch { /* nessuna perdita della copia locale */ } } return; }
    profileId = next;entriesRevision++;actionStates.clear();listMessage='';
    if(noteDialog.open)noteDialog.close();if(dlg.open)dlg.close();
    store = next ? collectiveStore() : localStore();
    entries = []; renderList();
    const loading = store;
    try { const fresh = await loading.list(); if (loading !== store) return; entries = fresh; sortEntries(); renderStorage('none'); renderList(); } catch { if (loading === store) renderList('Taccuino non disponibile. Riprova.'); }
  });
  return { refresh: renderList, entryTitle:(id,demo=false)=>{const e=(demo?getDemoEntries():entries).find(e=>String(e.id)===id);return e?notebookTitle(e,zones):'Pagina del taccuino';}, async savePlan(zoneId, date, band) {
    if (!store) throw new Error('Il taccuino sta ancora caricando. Riprova tra poco.');
    const forecast = captureForecast?.(zoneId, date, band);
    if (!forecast) throw new Error('Non ci sono dati completi e aggiornati per salvare questa previsione.');
    const entry = { id: Date.now().toString(36), kind: 'plan', zoneId, date, band, finds: {}, note: '',
      predicted: forecast.scores, forecast, savedAt: forecast.capturedAt };
    await store.put(entry); entries = [entry, ...entries]; sortEntries(); renderList();
    return entry;
  } };
}
