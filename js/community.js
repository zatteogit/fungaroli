import {entityCommunity} from './fronda-connections.js';
import {zoneCommunityHtml} from './zone-community.js';
import {notebookGlyph} from './ui-icons.js';
import {openModal} from './modal-flow.js';
import { SPECIES } from './species.js';
import { todayISO } from './weather.js';
import { mountSearchSelect } from './search-select.js';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from './vendor/webauthn.js';
import { communityMultiplier } from './community-signal.js';
import { PROVINCES, zoneProvince } from './community-aggregate.js';
import {setBaseUser,mountBaseEditor} from './base-location.js';
import {downloadAccountData} from './data-export.js';
import {clearNotebookStore,accountNotebookScope} from './notebook-photo-store.js';
import {RESEARCH_CONSENT_VERSION,RESEARCH_CONSENT_TEXT} from './research-consent.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let enabled = false, user = null, summary = null, zones = [], ready = Promise.resolve(), reportDialog, authDialog, speciesCatalog = SPECIES;
let summaryRevision = 0;
let logoutPending = false;
function syncLogoutFeedback(){
 const button=authDialog?.querySelector('[data-logout]');if(!button)return;
 button.disabled=logoutPending;
 button.textContent=logoutPending?'Uscita in corso…':'Esci dal profilo';
 if(logoutPending){button.setAttribute('aria-busy','true');authDialog.querySelector('[data-status]').textContent='Sto chiudendo il profilo…';}
 else button.removeAttribute('aria-busy');
}
const clearSummary = () => { summaryRevision++; summary = null; };
export const communityEnabled = () => enabled;
export const communityHasAccess = () => summary?.access==='granted';
export const currentUser = () => user;
export const zoneCommunity = (zone,resolve) => zoneCommunityHtml({zone,resolve,summary,status:communityStatus(),enabled,authenticated:!!user});
export const communityReady = () => ready;
export const communityForEntity = context => ({...entityCommunity(summary,context),status:communityStatus()});
export const animalCommunity = id => ({access:summary?.access||'unavailable',status:communityStatus(),records:summary?.access==='granted'?(summary.observations||[]).filter(r=>r.category==='animale'&&r.taxonId===id):[]});

export async function communityRequest(path, method = 'GET', data, {signal} = {}) {
  const res = await fetch('/api/community/' + path, { method, credentials: 'same-origin', cache: 'no-store',
    signal,
    headers: data == null ? {} : { 'content-type': 'application/json' }, body: data == null ? undefined : JSON.stringify(data) });
  let out; try { out = await res.json(); } catch(error) {
    if(signal?.aborted)throw signal.reason||error;
    if(res.ok)throw new Error('Il servizio ha restituito una risposta non valida. Riprova.');
    out = {};
  }
  if (!res.ok) { const e = new Error(out.error || 'La community non è raggiungibile. Riprova.'); e.status = res.status; throw e; }
  return out;
}

const changed = () => {
  setBaseUser(user);
  document.querySelectorAll('[data-profile-label]').forEach(el=>{el.textContent=user?.handle||'Accedi';const b=el.closest('.profile-entry');b?.classList.toggle('is-user',!!user);if(b)b.dataset.initial=(user?.handle||'').trim().charAt(0).toUpperCase();});
  document.dispatchEvent(new CustomEvent('fungaroli:community', { detail: { user } }));
};
export async function refreshCommunity({signal} = {}) {
  const revision=++summaryRevision,accountId=user?.id;
  if (!enabled || !accountId) { summary=null; changed(); return; }
  try {
    const next=await communityRequest('summary','GET',undefined,{signal});
    if(revision!==summaryRevision||user?.id!==accountId)return;
    summary=next;
  } catch(error) {
    if(revision!==summaryRevision||user?.id!==accountId)return;
    summary=null;
    if(error.status===401)user=null;
  }
  changed();
}
export function communityStatus() {
  if (!enabled) return 'Condivisione delle osservazioni non ancora attiva.';
  if (!user) return 'Ogni uscita aggiunge qualcosa. Accedi e condividi un’osservazione per scoprire cosa raccontano gli altri.';
  if (!summary) return 'Le osservazioni condivise non sono disponibili in questo momento. Riprova più tardi.';
  if (summary.access!=='granted') return 'Hai fatto un giro nel bosco? Condividi cosa hai osservato, anche se non hai trovato nulla, per leggere i riepiloghi degli altri.';
  const count=(summary.totalReports||0)+(summary.observations||[]).reduce((n,r)=>n+r.observations,0);
  const wide=(summary.provinceReports||[]).length+(summary.provinceObservations||[]).length;
  return count ? `${count} osservazioni condivise negli ultimi 7 giorni. Scopri dove e cosa è stato segnalato.`
    : wide ? 'Nelle singole zone le osservazioni degli ultimi 7 giorni sono ancora poche: trovi un riepilogo per provincia.'
    : 'Le osservazioni degli ultimi 7 giorni sono ancora poche per un riepilogo. Anche la tua uscita può essere utile.';
}
const plural=(n,one,many)=>`${n} ${n===1?one:many}`;
const outcomes = r => `${plural(r.sightings,'ritrovamento dichiarato','ritrovamenti dichiarati')} · ${plural(r.zeros,'ricerca a vuoto','ricerche a vuoto')}`;
export function communityOverview() {
  if(summary?.access!=='granted')return '';
  const zoneName=id=>zones.find(z=>z.id===id)?.title||zones.find(z=>z.id===id)?.name||id;
  const taxonName=id=>speciesCatalog.find(s=>s.id===id)?.name||id.replaceAll('-',' ');
  const rows=(summary.reports||[]).map(r=>({...r,name:taxonName(r.speciesId)}));
  // Notes may describe the same outing: keep the series distinct, never sum them as independent outings.
  const notes=summary.observations||[];
  const list=(records,note=false)=>records.length?`<ul class="community-totals">${records.map(r=>`<li><b>${esc(zoneName(r.zoneId))} · ${esc(note?taxonName(r.taxonId):r.name)}</b><span>${note?`${plural(r.sightings,'osservazione dichiarata','osservazioni dichiarate')} · ${plural(r.zeros,'ricerca a vuoto','ricerche a vuoto')}`:outcomes(r)}</span></li>`).join('')}</ul>`:'';
  // Per provincia: compare anche quando le zone non bastano. I totali comprendono le zone già mostrate sopra.
  const wide=[...(summary.provinceReports||[]).map(r=>({...r,name:taxonName(r.speciesId)})),...(summary.provinceObservations||[]).map(r=>({...r,name:taxonName(r.taxonId),note:true}))];
  const provinces=wide.length?`<h3>Per provincia</h3><p class="small">Ultimi 7 giorni, quando le singole zone non bastano.${rows.length||notes.length?' I totali comprendono anche le zone elencate sopra.':''} Uscite e osservazioni restano separate.</p><ul class="community-totals">${wide.map(r=>`<li><b>Provincia di ${esc(PROVINCES[r.province]||r.province)} · ${esc(r.name)}</b><span>${r.note?`${plural(r.sightings,'osservazione dichiarata','osservazioni dichiarate')} · ${plural(r.zeros,'ricerca a vuoto','ricerche a vuoto')}`:outcomes(r)}${r.note?' · dal Taccuino':''}</span></li>`).join('')}</ul>`:'';
  return list(rows)+(notes.length?`<h3>Osservazioni strutturate</h3><p class="small">Serie separata: può comprendere note della stessa uscita, su funghi, piante, alberi e animali.</p>${list(notes,true)}`:'')+provinces;
}
const provinceOf=zoneId=>zoneProvince(zones.find(z=>z.id===zoneId));
export function reportBadge(zoneId, speciesId) {
  const records = (summary?.reports || []).filter(r => (!zoneId || r.zoneId === zoneId) && r.speciesId === speciesId);
  if (!records.length) {
    // Ripiego sulla provincia della zona, dichiarato nel testo: non è un dato della zona.
    const wide = zoneId && (summary?.provinceReports || []).find(r => r.province === provinceOf(zoneId) && r.speciesId === speciesId);
    return wide ? `<span class="community-badge" title="Ultimi 7 giorni, provincia di ${esc(PROVINCES[wide.province]||wide.province)}: dichiarazioni, non un dato di questa zona né una conferma di presenza attuale.">In provincia: ${outcomes(wide)}</span>` : '';
  }
  const r = records.reduce((a,r) => ({sightings:a.sightings+r.sightings,zeros:a.zeros+r.zeros}), {sightings:0,zeros:0});
  return `<span class="community-badge" title="Ultimi 7 giorni: dichiarazioni, non un campione rappresentativo né una conferma di presenza attuale.">${outcomes(r)}</span>`;
}
export function communityRank(zoneId, speciesIds) {
  if (!summary || Date.now() - Date.parse(summary.updatedAt) > 10 * 60e3) return 1;
  return communityMultiplier((summary.reports || []).filter((r) => r.zoneId === zoneId && speciesIds.includes(r.speciesId)),summary.policy?.maxPercent ?? 10);
}

async function session() {
  try { user = (await communityRequest('session')).user; } catch { user = null; }
}

export function initCommunity({ zoneList, speciesList = SPECIES }) {
  zones = zoneList; speciesCatalog = speciesList;
  document.addEventListener('fungaroli:refresh-community', refreshCommunity);
  document.addEventListener('fungaroli:refresh-account',async()=>{if(enabled){clearSummary();changed();await session();await refreshCommunity();}});
  ready = (async () => {
    if (globalThis.FUNGAROLI_DATA || globalThis.FUNGAROLI_REVIEW) { changed(); return; }
    try { enabled = (await communityRequest('status')).enabled; } catch { enabled = false; }
    if (enabled) { await session(); await refreshCommunity(); }
    else changed();
  })();
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-report]');
    if (b) openQuickReport(b.dataset.zone || '', b.dataset.species || '');
    if (e.target.closest('[data-community-account]')) openAccount();
  });
  setInterval(() => { if (document.visibilityState === 'visible') refreshCommunity(); }, 120000);
  return ready;
}

export async function ensureAccount() {
  await ready;
  if (!enabled) throw new Error('La community non è ancora attiva. Puoi usare il taccuino su questo dispositivo.');
  if (user) return user;
  return openAccount();
}

// Consenso alla ricerca (D4): separato dalla condivisione, spento all'inizio, revocabile in ogni momento.
function mountResearchConsent(slot,accountId){
  const since=r=>r?.granted&&r.since?`Consenso dato il ${new Date(r.since).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}.`:'Spento: le tue osservazioni condivise servono solo alla community.';
  slot.innerHTML=`<label class="composer-share-switch"><span><b>Studio dell’indice</b><small>${esc(RESEARCH_CONSENT_TEXT)}</small></span><input class="switch-input" type="checkbox" role="switch" data-research-switch${user?.research?.granted?' checked':''}></label><p class="small muted" role="status" data-research-status>${esc(since(user?.research))}</p>`;
  const input=slot.querySelector('[data-research-switch]'),status=slot.querySelector('[data-research-status]');
  input.addEventListener('change',async()=>{
    const granted=input.checked;input.disabled=true;status.textContent='Salvo la scelta…';
    try{
      if(user?.id!==accountId)throw new Error('Il profilo è cambiato. Riaprilo prima di salvare.');
      const r=await communityRequest('research-consent','PUT',{accountId,granted,version:RESEARCH_CONSENT_VERSION});
      if(user?.id===accountId)user={...user,research:r.research};
      input.checked=!!r.research.granted;status.textContent=since(r.research);
    }catch(e){input.checked=!granted;status.textContent=e.message||'Scelta non salvata. Riprova.';}
    finally{input.disabled=false;}
  });
}

export async function openAccount() {
  const {toast} = await import('./refresh.js');
  await ready;
  if (!authDialog) { authDialog = document.createElement('dialog'); authDialog.className = 'community-dialog'; document.body.appendChild(authDialog); }
  authDialog.classList.toggle('profile-dialog', !!user);
  authDialog.classList.toggle('auth-dialog', !user && enabled);
  if (!enabled) {
    authDialog.innerHTML = '<h2>Il taccuino è già tuo</h2><p>Puoi usarlo su questo dispositivo. Profili e segnalazioni collettive saranno disponibili quando il servizio è attivo.</p><button class="btn primary" type="button">Continua</button>';
    authDialog.querySelector('button').onclick = () => authDialog.close(); openModal(authDialog); return null;
  }
  return new Promise((resolve) => {
    authDialog.innerHTML = user ? `<div class="profile-header"><div><h2>${esc(user.handle || 'Il tuo profilo')}</h2><p class="small muted profile-role" data-account-role>Profilo personale</p></div><button type="button" class="profile-close" data-close aria-label="Chiudi il profilo">×</button></div>
      <p>Il taccuino è privato. Condividendo un’osservazione puoi consultare gli aggregati della community. Anche una ricerca a vuoto conta. Ritirando tutte le condivisioni perdi questo accesso. Nessuna condivisione è automatica. La tua fungaia non viene mostrata agli altri: solo conteggi per zona ampia e specie, su 7 giorni, con almeno 3 contributori e 2 giorni diversi.</p>
      <section class="composer-sharing profile-research" data-research-consent></section>
      <div data-profile-base></div>
      <div class="profile-editorial" data-cms-link hidden></div>
      <div class="profile-actions" role="group" aria-label="Azioni del profilo"><button type="button" class="btn ghost" data-logout>Esci dal profilo</button><button type="button" class="btn primary" data-close autofocus>Chiudi</button></div>
      <div class="profile-data"><button type="button" class="btn ghost" data-export-account>Scarica i miei dati</button><button type="button" class="link-btn" data-delete-account>Elimina profilo e dati</button></div><p class="profile-status" role="status" data-status></p>`
      : `<header class="account-header"><h2>Unisciti a Fronda</h2><button type="button" class="profile-close" data-close aria-label="Chiudi l’accesso" autofocus>×</button></header><div class="auth-content"><p class="auth-intro">Accedi con la passkey del dispositivo, senza password o email.</p>
      <label>Nome facoltativo <input class="wiz-input" maxlength="32" autocomplete="nickname" data-handle placeholder="Un nome, anche inventato"></label>
      <div class="auth-actions"><button type="button" class="btn primary" data-register>Crea profilo con passkey</button><button type="button" class="btn ghost" data-login>Ho già una passkey</button></div>
      <p class="small muted auth-privacy">Il taccuino rimane tuo. Scegli tu se condividere: chi contribuisce può consultare gli aggregati. Agli altri non mostriamo la posizione della tua fungaia, nomi o note: solo conteggi per zona ampia e specie su 7 giorni, se ci sono almeno 3 contributori e 2 giorni diversi. <a href="#/info">Privacy e condizioni</a></p>
      <details class="context-note"><summary>Come ritrovare il profilo</summary><p>Usa la stessa passkey, anche sincronizzata fra i tuoi dispositivi. Se la perdi, non possiamo recuperarla tramite email. Il nome non appare nelle segnalazioni.</p></details>
      <p role="status" data-status></p><button type="button" class="link-btn auth-dismiss" data-close>Continua senza profilo</button></div>`;
    authDialog.setAttribute('aria-label', user ? 'Il tuo profilo' : 'Accedi o crea un profilo');
    const status = authDialog.querySelector('[data-status]');
    if(user){
      const accountId=user.id;
      mountResearchConsent(authDialog.querySelector('[data-research-consent]'),accountId);
      const baseSlot=authDialog.querySelector('[data-profile-base]');
      mountBaseEditor(baseSlot,{value:user.base,save:async base=>{
        if(user?.id!==accountId)throw new Error('Il profilo è cambiato. Riaprilo prima di salvare.');
        const r=await communityRequest('profile','PUT',{accountId,base});user={...user,base:r.base};changed();
      }});
      fetch('/api/cms/v1/me',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(r=>{
        const slot=authDialog.querySelector('[data-cms-link]');
        if(!slot||user?.id!==accountId||r?.user?.id!==accountId)return;
        const scopes=r.user.scopes||[],role=r.user.role||(scopes.includes('admin')?'admin':scopes.includes('write')?'editor':'member');
        authDialog.querySelector('[data-account-role]').textContent={admin:'Amministratore',editor:'Editor',member:'Utente'}[role]||'Profilo personale';
        if(scopes.includes('read')&&!location.pathname.startsWith('/redazione')){
          slot.hidden=false;
          slot.innerHTML=`<a class="btn ghost" href="/redazione">Apri la redazione →</a><p class="small muted">${scopes.includes('admin')?'Puoi gestire contenuti, pubblicazioni e accessi degli agenti.':'Puoi preparare le bozze. Un amministratore le pubblica.'}</p>`;
        }
      }).catch(()=>{});
    }
    authDialog.onclose = () => resolve(user);
    authDialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>authDialog.close());
    const auth = async (register) => {
      if (!browserSupportsWebAuthn()) { status.textContent = 'Questo browser non supporta le passkey. Puoi continuare con il taccuino locale.'; return; }
      const buttons = authDialog.querySelectorAll('button'); buttons.forEach((b) => b.disabled = true);
      status.textContent = 'Conferma sul tuo dispositivo…';
      try {
        const optionsJSON = await communityRequest(register ? 'auth/register-options' : 'auth/login-options', 'POST', { handle: authDialog.querySelector('[data-handle]')?.value || '' });
        const response = register ? await startRegistration({ optionsJSON }) : await startAuthentication({ optionsJSON });
        await communityRequest(register ? 'auth/register' : 'auth/login', 'POST', response);
        await session(); await refreshCommunity(); authDialog.close();
      } catch (e) { status.textContent = e.name === 'NotAllowedError' ? 'Accesso annullato. Puoi riprovare quando vuoi.' : e.message; }
      finally { buttons.forEach((b) => b.disabled = false); }
    };
    authDialog.querySelector('[data-register]')?.addEventListener('click', () => auth(true));
    authDialog.querySelector('[data-login]')?.addEventListener('click', () => auth(false));
    authDialog.querySelector('[data-logout]')?.addEventListener('click', async () => {
      if(logoutPending)return;
      logoutPending=true;syncLogoutFeedback();
      try {
        await communityRequest('auth/logout', 'POST', {});
        user = null; clearSummary(); changed(); authDialog.close();
        toast('Sei uscito dal profilo.',5000,'top');
      } catch (e) {
        const message=e.message||'Non riesco a completare l’uscita. Riprova.';
        if(authDialog.open)authDialog.querySelector('[data-status]').textContent=message;
        else toast(esc(message),5000,'top');
      } finally { logoutPending=false;syncLogoutFeedback(); }
    });
    // Copia completa dei propri dati, con le foto: art. 15 e 20 GDPR (decisione del 22/10/2026).
    authDialog.querySelector('[data-export-account]')?.addEventListener('click', async (e) => {
      const button = e.currentTarget, accountId = user?.id;
      button.disabled = true; status.textContent = 'Preparo il file con i tuoi dati…';
      try { await downloadAccountData(); if (user?.id === accountId) status.textContent = 'File pronto: profilo, taccuino con le foto e segnalazioni.'; }
      catch (err) { if (user?.id === accountId) status.textContent = err.message; }
      finally { button.disabled = false; }
    });
    authDialog.querySelector('[data-delete-account]')?.addEventListener('click', async (e) => {
      if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = 'Conferma eliminazione'; status.textContent = 'Elimina il tuo profilo, il taccuino e le tue segnalazioni. Se vuoi conservarli, prima scarica i tuoi dati. Premi ancora per confermare.'; return; }
      const accountId = user.id;
      try { await communityRequest('account', 'DELETE'); }
      catch (err) { status.textContent = err.message; return; }
      user = null; clearSummary(); changed();
      // Anche la copia di questo dispositivo: voci in localStorage e foto in IndexedDB del profilo eliminato.
      let local = true;
      try { await clearNotebookStore(accountNotebookScope(accountId)); } catch { local = false; }
      await refreshCommunity();
      if (local) { authDialog.close(); return; }
      authDialog.querySelectorAll('[data-export-account],[data-delete-account],[data-logout]').forEach((b) => b.remove());
      status.textContent = 'Profilo eliminato. Non sono riuscito a togliere la copia del taccuino da questo dispositivo: cancella i dati del sito dalle impostazioni del browser.';
    });
    syncLogoutFeedback();openModal(authDialog);
  });
}

export async function shareNotebookNote(entry,{signal}={}){
  if(!user)throw new Error('Accedi al profilo Fronda per condividere.');
  await communityRequest('observations/'+entry.id,'PUT',{consent:true},{signal});
  await refreshCommunity({signal});return true;
}
export function communityHasZone(zoneId){return [...(summary?.reports||[]),...(summary?.observations||[])].some(r=>r.zoneId===zoneId);}
export const communityDataAvailable=()=>summary?.access==='granted';

export async function shareDiaryEntry(entry, { identificationChecked = false, signal } = {}) {
  if (!entry || entry.kind==='note' || !Object.entries(entry.finds || {}).some(([id, amount]) => speciesCatalog.some((s) => s.id === id) && (amount > 0 || (amount === 0 && entry.searched?.includes(id)))))
    throw new Error('Non ci sono ritrovamenti o ricerche a vuoto esplicite da condividere.');
  await ensureAccount();
  if (!user) return false;
  for (const [speciesId, amount] of Object.entries(entry.finds || {})) {
    if (!speciesCatalog.some((s) => s.id === speciesId) || (amount === 0 && !entry.searched?.includes(speciesId))) continue;
    await communityRequest('reports', 'POST', { entryId: entry.id, zoneId: entry.zoneId, day: entry.date,
      speciesId, amount, searched: entry.searched?.includes(speciesId) || false, identificationChecked },{signal});
  }
  await refreshCommunity({signal}); return true;
}

let reportControls = [], reportEpoch = 0;
export async function openQuickReport(zoneId = '', speciesId = '') {
  const epoch = ++reportEpoch;
  const origin = document.activeElement;
  reportControls.forEach(c=>c.destroy()); reportControls=[];
  if (!reportDialog) {
    reportDialog = document.createElement('dialog'); reportDialog.className = 'community-dialog report-dialog'; document.body.appendChild(reportDialog);
    addEventListener('hashchange',()=>{if(reportDialog.open)reportDialog.close();});
  }
  const today=todayISO(),yesterday=todayISO(new Date(Date.now()-864e5));
  reportDialog.setAttribute('aria-label', 'Annota un’osservazione nel taccuino');
  reportDialog.innerHTML = `<header class="report-header"><div><p class="eyebrow">Dal bosco al taccuino</p><h2>Osservazione</h2></div><button class="profile-close" type="button" data-report-dismiss aria-label="Chiudi">×</button></header>
    <p class="report-intro">Nel taccuino e nei conteggi collettivi.</p>
    <form class="report-form">
      <div class="report-fields">
        <div class="report-field search-select"><label id="report-zone-label" for="report-zone">Zona</label><input id="report-zone" class="wiz-input" type="text" placeholder="Cerca una zona…" autocomplete="off" required><input name="zone" type="hidden"><ul id="report-zone-options" class="search-select-options" aria-labelledby="report-zone-label" hidden></ul></div>
        <div class="report-field search-select"><label id="report-species-label" for="report-species">Specie</label><input id="report-species" class="wiz-input" type="text" placeholder="Nome comune o scientifico…" autocomplete="off" required aria-describedby="report-species-hint"><input name="species" type="hidden"><ul id="report-species-options" class="search-select-options" aria-labelledby="report-species-label" hidden></ul><small id="report-species-hint">Cerca anche con i nomi locali.</small></div>
      </div>
      <div class="report-field report-date"><label for="report-day">Quando</label><div class="report-date-row"><div class="report-days" role="group" aria-label="Giorni recenti"><button type="button" class="chip" data-report-day="${today}" aria-pressed="true">Oggi</button><button type="button" class="chip" data-report-day="${yesterday}" aria-pressed="false">Ieri</button></div><input id="report-day" class="wiz-input" type="date" name="day" value="${today}" max="${today}" required aria-label="Data dell’osservazione"></div></div>
      <fieldset class="report-amount"><legend>Cosa hai osservato?</legend><div class="report-quantities">${[
        ['Nessuno','Ricerca a vuoto'],['Pochi','Ritrovamento scarso'],['Discreti','Presenza intermedia'],['Tanti','Presenza abbondante']
      ].map(([label,hint],i)=>`<label class="report-quantity"><input type="radio" name="amount" value="${i}" required><span><b>${label}</b><small>${hint}</small></span></label>`).join('')}</div></fieldset>
      <details class="report-extra"><summary>Controllo dell’identità <span class="small muted">facoltativo</span></summary><label class="report-check"><input type="checkbox" name="checked"><span>Identità controllata da un micologo</span></label></details>
      <p class="report-privacy">Condividi per consultare gli aggregati della community. Agli altri non mostriamo la tua fungaia: solo conteggi per zona ampia e specie su 7 giorni, con almeno 3 contributori e 2 giorni diversi. Nessun punto GPS, nome, giorno preciso o testo della nota. Puoi ritirare la condivisione dal taccuino; ritirandole tutte perdi l’accesso agli aggregati.</p>
      <details class="report-safety context-note"><summary>L’app non certifica la commestibilità.</summary><p>Segnala solo specie che sai riconoscere. Foto e schede non identificano l’esemplare: fai controllare il raccolto all’Ispettorato micologico ASL prima del consumo. Quantità e ritrovamenti sono dichiarazioni degli utenti; scegli “Nessuno” solo se hai cercato questa specie senza trovarla.</p></details>
      <p role="status" class="report-status" data-status></p>
      <footer class="report-actions"><button class="btn primary" type="submit">Condividi</button><button class="btn ghost" type="button" data-close>Annulla</button></footer>
    </form>`;
  const dismiss=()=>{reportDialog.close();if(origin?.isConnected)origin.focus({preventScroll:true});};
  reportDialog.querySelector('[data-report-dismiss]').onclick=dismiss;
  reportDialog.querySelector('[data-close]').onclick=dismiss;
  const form=reportDialog.querySelector('form');
  for(const [kind,options,selectedId] of [
    ['zone',zones.map(z=>({value:z.id,label:z.title||z.name,detail:z.subtitle||'',aliases:[z.name]})),zoneId],
    ['species',speciesCatalog.map(s=>({value:s.id,label:s.name,detail:s.latin,aliases:s.aliases})),speciesId]
  ]) reportControls.push(mountSearchSelect({input:form.querySelector(`#report-${kind}`),list:form.querySelector(`#report-${kind}-options`),options,selectedId,
    onChange:value=>{form.elements[kind].value=value;},bounds:()=>({top:reportDialog.querySelector('.report-header').getBoundingClientRect().bottom,bottom:form.querySelector('.report-actions').getBoundingClientRect().top}),
    empty:kind==='zone'?'Nessuna zona nel catalogo con questo nome.':'Nessuna specie commestibile nel catalogo con questo nome.'}));
  const dateInput=form.elements.day;
  const markDate=()=>form.querySelectorAll('[data-report-day]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reportDay===dateInput.value)));
  form.querySelectorAll('[data-report-day]').forEach(b=>b.onclick=()=>{dateInput.value=b.dataset.reportDay;markDate();});
  dateInput.onchange=markDate;
  form.onsubmit = async e => {
    e.preventDefault(); const data=new FormData(form),status=form.querySelector('[data-status]'),submit=form.querySelector('[type="submit"]');
    if(!zones.some(z=>z.id===data.get('zone'))||!speciesCatalog.some(s=>s.id===data.get('species'))) {status.textContent='Scegli zona e specie dai risultati della ricerca.';return;}
    submit.disabled=true;submit.textContent='Invio…';
    try {
      const account=await ensureAccount();if(!account)return;
      if(epoch!==reportEpoch||!reportDialog.open)return;
      await communityRequest('reports','POST',{zoneId:data.get('zone'),speciesId:data.get('species'),day:data.get('day'),amount:+data.get('amount'),searched:+data.get('amount')===0,identificationChecked:data.get('checked')==='on'});
      await refreshCommunity();
      if(epoch!==reportEpoch||!reportDialog.open)return;
      reportControls.forEach(c=>c.destroy());reportControls=[];
      const zone=zones.find(z=>z.id===data.get('zone')),species=speciesCatalog.find(s=>s.id===data.get('species'));
      reportDialog.querySelector('.report-intro').remove();
      form.innerHTML=`<div class="report-done"><span class="report-done-mark" aria-hidden="true">✓</span><h3>Osservazione salvata</h3><p><b>${esc(species.name)}</b> · ${esc(zone.title||zone.name)}<br>${esc(new Date(data.get('day')+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long'}))}</p><p role="status" class="report-status" data-status>È nel tuo taccuino e nei conteggi collettivi.</p><a class="btn primary" href="#/diario">${notebookGlyph}<span>Apri il taccuino →</span></a><button class="btn ghost" type="button" data-close>Chiudi</button></div>`;
      form.querySelector('[data-close]').onclick=dismiss;
      reportDialog.scrollTop=0;form.querySelector('a').focus({preventScroll:true});
    } catch(err) {status.textContent=err.message;}
    finally {if(submit.isConnected){submit.disabled=false;submit.textContent='Condividi';}}
  };
  if(!reportDialog.open)openModal(reportDialog);
  // Nessuna ricerca aperta automaticamente quando si arriva da una scheda già selezionata.
  reportDialog.querySelector('[data-report-dismiss]').focus({preventScroll:true});
  reportDialog.scrollTop=0;
}
