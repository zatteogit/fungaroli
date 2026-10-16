import { SPECIES } from './species.js';
import { todayISO } from './weather.js';
import { mountSearchSelect } from './search-select.js';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from './vendor/webauthn.js';
import { communityMultiplier } from './community-signal.js';
import {setBaseUser,mountBaseEditor} from './base-location.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let enabled = false, user = null, summary = null, zones = [], ready = Promise.resolve(), reportDialog, authDialog, speciesCatalog = SPECIES;
export const communityEnabled = () => enabled;
export const currentUser = () => user;
export const communityReady = () => ready;

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
  if (!enabled) return;
  try { summary = await communityRequest('summary','GET',undefined,{signal}); } catch { summary = null; }
  changed();
}
export function communityStatus() {
  if (!enabled) return 'Le segnalazioni collettive saranno disponibili quando il servizio è attivo.';
  if (!summary) return 'Segnalazioni temporaneamente non disponibili.';
  return summary.totalReports ? `${summary.totalReports} osservazioni raccolte: stiamo costruendo la validazione locale. L’accuratezza della trovabilità non è ancora misurata.`
    : 'Siamo all’inizio: nessuna segnalazione collettiva. Le condizioni di crescita sono stimate; la trovabilità non è ancora validata.';
}
export function reportBadge(zoneId, speciesId) {
  const records = (summary?.reports || []).filter(r => (!zoneId || r.zoneId === zoneId) && r.speciesId === speciesId);
  if (!records.length) return '';
  const r = records.reduce((a,r) => ({sightings:a.sightings+r.sightings,zeros:a.zeros+r.zeros,latestDay:r.latestDay>a.latestDay?r.latestDay:a.latestDay}), {sightings:0,zeros:0,latestDay:''});
  return `<span class="community-badge" title="Segnalazioni degli ultimi 7 giorni, dichiarate dagli utenti e non certificate. Ultima: ${esc(r.latestDay)}">${r.sightings ? `${r.sightings} ${r.sightings === 1 ? 'segnalazione' : 'segnalazioni'}` : `${r.zeros} ${r.zeros === 1 ? 'ricerca a vuoto' : 'ricerche a vuoto'}`}</span>`;
}
export function communityRank(zoneId, speciesIds) {
  if (!summary || Date.now() - Date.parse(summary.updatedAt) > 10 * 60e3) return 1;
  return communityMultiplier((summary.reports || []).filter((r) => r.zoneId === zoneId && speciesIds.includes(r.speciesId)));
}

async function session() {
  try { user = (await communityRequest('session')).user; } catch { user = null; }
}

export function initCommunity({ zoneList, speciesList = SPECIES }) {
  zones = zoneList; speciesCatalog = speciesList;
  document.addEventListener('fungaroli:refresh-community', refreshCommunity);
  document.addEventListener('fungaroli:refresh-account',async()=>{if(enabled){await session();changed();}});
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

export async function openAccount() {
  await ready;
  if (!authDialog) { authDialog = document.createElement('dialog'); authDialog.className = 'community-dialog'; document.body.appendChild(authDialog); }
  authDialog.classList.toggle('profile-dialog', !!user);
  if (!enabled) {
    authDialog.innerHTML = '<h2>Il taccuino è già tuo</h2><p>Puoi usarlo su questo dispositivo. Profili e segnalazioni collettive saranno disponibili quando il servizio è attivo.</p><button class="btn primary" type="button">Continua</button>';
    authDialog.querySelector('button').onclick = () => authDialog.close(); authDialog.showModal(); return null;
  }
  return new Promise((resolve) => {
    authDialog.innerHTML = user ? `<div class="profile-header"><div><h2>${esc(user.handle || 'Il tuo profilo')}</h2><p class="small muted profile-role" data-account-role>Profilo personale</p></div><button type="button" class="profile-close" data-close aria-label="Chiudi il profilo">×</button></div>
      <p>Il taccuino è privato. Solo le osservazioni che scegli di condividere entrano nei conteggi collettivi.</p>
      <div data-profile-base></div>
      <div class="profile-editorial" data-cms-link hidden></div>
      <div class="profile-actions" role="group" aria-label="Azioni del profilo"><button type="button" class="btn ghost" data-logout>Esci dal profilo</button><button type="button" class="btn primary" data-close autofocus>Chiudi</button></div>
      <div class="profile-data"><button type="button" class="link-btn" data-delete-account>Elimina profilo e dati</button></div><p class="profile-status" role="status" data-status></p>`
      : `<h2>Unisciti a Fronda</h2><p>Un profilo senza password o email: usa la passkey del telefono o del computer. Il nome è facoltativo e non appare nelle segnalazioni.</p>
      <label>Come vuoi chiamarti? <input class="wiz-input" maxlength="32" autocomplete="nickname" data-handle placeholder="Un nome, anche inventato"></label>
      <button type="button" class="btn primary big" data-register>Crea profilo con passkey</button><button type="button" class="btn ghost big" data-login>Ho già una passkey</button>
      <p class="small muted">Il taccuino rimane tuo. Zona, specie, giorno e quantità diventano pubblici solo in forma aggregata quando scegli di segnalarli. <a href="#/info">Privacy e condizioni</a></p>
      <p class="small muted">Per ritrovare il profilo usa la stessa passkey, eventualmente sincronizzata dal tuo dispositivo. Se la perdi, non possiamo recuperarla tramite email.</p>
      <p role="status" data-status></p><button type="button" class="btn ghost" data-close>Continua senza profilo</button>`;
    authDialog.setAttribute('aria-label', user ? 'Il tuo profilo' : 'Accedi o crea un profilo');
    const status = authDialog.querySelector('[data-status]');
    if(user){
      const accountId=user.id;
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
        await session(); changed(); authDialog.close();
      } catch (e) { status.textContent = e.name === 'NotAllowedError' ? 'Accesso annullato. Puoi riprovare quando vuoi.' : e.message; }
      finally { buttons.forEach((b) => b.disabled = false); }
    };
    authDialog.querySelector('[data-register]')?.addEventListener('click', () => auth(true));
    authDialog.querySelector('[data-login]')?.addEventListener('click', () => auth(false));
    authDialog.querySelector('[data-logout]')?.addEventListener('click', async () => {
      try { await communityRequest('auth/logout', 'POST', {}); user = null; changed(); authDialog.close(); } catch (e) { status.textContent = e.message; }
    });
    authDialog.querySelector('[data-delete-account]')?.addEventListener('click', async (e) => {
      if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = 'Conferma eliminazione'; status.textContent = 'Elimina il tuo profilo, il taccuino e le tue segnalazioni. Premi ancora per confermare.'; return; }
      try { await communityRequest('account', 'DELETE'); user = null; changed(); await refreshCommunity(); authDialog.close(); }
      catch (err) { status.textContent = err.message; }
    });
    authDialog.showModal();
  });
}

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
  reportDialog.setAttribute('aria-label', 'Segnala dal bosco');
  reportDialog.innerHTML = `<header class="report-header"><div><p class="eyebrow">Dal bosco al taccuino</p><h2>Osservazione</h2></div><button class="profile-close" type="button" data-report-dismiss aria-label="Chiudi">×</button></header>
    <p class="report-intro">Nel tuo taccuino, e nei conteggi della community.</p>
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
      <p class="report-privacy">È pubblica solo la zona: nessun punto preciso o nome personale.</p>
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
      form.innerHTML=`<div class="report-done"><span class="report-done-mark" aria-hidden="true">✓</span><h3>Osservazione salvata</h3><p><b>${esc(species.name)}</b> · ${esc(zone.title||zone.name)}<br>${esc(new Date(data.get('day')+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long'}))}</p><p role="status" class="report-status" data-status>È nel tuo taccuino e nei conteggi collettivi.</p><a class="btn primary" href="#/diario">Apri il taccuino →</a><button class="btn ghost" type="button" data-close>Chiudi</button></div>`;
      form.querySelector('[data-close]').onclick=dismiss;
      reportDialog.scrollTop=0;form.querySelector('a').focus({preventScroll:true});
    } catch(err) {status.textContent=err.message;}
    finally {if(submit.isConnected){submit.disabled=false;submit.textContent='Condividi';}}
  };
  if(!reportDialog.open)reportDialog.showModal();
  // Nessuna ricerca aperta automaticamente quando si arriva da una scheda già selezionata.
  reportDialog.querySelector('[data-report-dismiss]').focus({preventScroll:true});
  reportDialog.scrollTop=0;
}
