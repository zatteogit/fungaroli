import { SPECIES } from './species.js';
import { todayISO } from './weather.js';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from './vendor/webauthn.js';
import { communityMultiplier } from './community-signal.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let enabled = false, user = null, summary = null, zones = [], ready = Promise.resolve(), reportDialog, authDialog;
export const communityEnabled = () => enabled;
export const currentUser = () => user;
export const communityReady = () => ready;

export async function communityRequest(path, method = 'GET', data) {
  const res = await fetch('/api/community/' + path, { method, credentials: 'same-origin', cache: 'no-store',
    headers: data == null ? {} : { 'content-type': 'application/json' }, body: data == null ? undefined : JSON.stringify(data) });
  let out; try { out = await res.json(); } catch { out = {}; }
  if (!res.ok) { const e = new Error(out.error || 'La community non è raggiungibile. Riprova.'); e.status = res.status; throw e; }
  return out;
}

const changed = () => document.dispatchEvent(new CustomEvent('fungaroli:community', { detail: { user } }));
export async function refreshCommunity() {
  if (!enabled) return;
  try { summary = await communityRequest('summary'); } catch { summary = null; }
  changed();
}
export function communityStatus() {
  if (!enabled) return 'Le segnalazioni collettive saranno disponibili quando il servizio è attivo.';
  if (!summary) return 'Segnalazioni temporaneamente non disponibili.';
  return summary.totalReports ? `${summary.totalReports} osservazioni raccolte: stiamo costruendo la validazione locale. L’accuratezza della trovabilità non è ancora misurata.`
    : 'Siamo all’inizio: nessuna segnalazione collettiva. Le condizioni di crescita sono stimate; la trovabilità non è ancora validata.';
}
export function reportBadge(zoneId, speciesId) {
  const r = summary?.reports?.find((r) => r.zoneId === zoneId && r.speciesId === speciesId);
  if (!r) return '';
  return `<span class="community-badge" title="Segnalazioni degli ultimi 7 giorni, dichiarate dagli utenti e non certificate. Ultima: ${esc(r.latestDay)}">${r.sightings ? `${r.sightings} ${r.sightings === 1 ? 'segnalazione' : 'segnalazioni'}` : `${r.zeros} ${r.zeros === 1 ? 'ricerca a vuoto' : 'ricerche a vuoto'}`}</span>`;
}
export function communityRank(zoneId, speciesIds) {
  if (!summary || Date.now() - Date.parse(summary.updatedAt) > 10 * 60e3) return 1;
  return communityMultiplier((summary.reports || []).filter((r) => r.zoneId === zoneId && speciesIds.includes(r.speciesId)));
}

async function session() {
  try { user = (await communityRequest('session')).user; } catch { user = null; }
}

export function initCommunity({ zoneList }) {
  zones = zoneList;
  document.addEventListener('fungaroli:refresh-community', refreshCommunity);
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
  if (!enabled) throw new Error('La community non è ancora attiva. Puoi usare il diario su questo dispositivo.');
  if (user) return user;
  return openAccount();
}

export async function openAccount() {
  await ready;
  if (!authDialog) { authDialog = document.createElement('dialog'); authDialog.className = 'community-dialog'; document.body.appendChild(authDialog); }
  if (!enabled) {
    authDialog.innerHTML = '<h2>Il taccuino è già tuo</h2><p>Puoi usarlo su questo dispositivo. Profili e segnalazioni collettive saranno disponibili quando il servizio è attivo.</p><button class="btn primary" type="button">Continua</button>';
    authDialog.querySelector('button').onclick = () => authDialog.close(); authDialog.showModal(); return null;
  }
  return new Promise((resolve) => {
    authDialog.innerHTML = user ? `<h2>Il tuo profilo</h2><p>${esc(user.handle)}</p><p>Il diario è privato. Solo le osservazioni che scegli di condividere entrano nei conteggi collettivi.</p>
      <button type="button" class="btn ghost" data-logout>Esci</button><button type="button" class="link-btn" data-delete-account>Elimina profilo e dati</button><button type="button" class="btn primary" data-close>Chiudi</button><p role="status" data-status></p>`
      : `<h2>Unisciti a Fungaroli</h2><p>Un profilo senza password o email: usa la passkey del telefono o del computer. Il nome è facoltativo e non appare nelle segnalazioni.</p>
      <label>Come vuoi chiamarti? <input class="wiz-input" maxlength="32" autocomplete="nickname" data-handle placeholder="Un nome, anche inventato"></label>
      <button type="button" class="btn primary big" data-register>Crea profilo con passkey</button><button type="button" class="btn ghost big" data-login>Ho già una passkey</button>
      <p class="small muted">Il diario rimane tuo. Zona, specie, giorno e quantità diventano pubblici solo in forma aggregata quando scegli di segnalarli. <a href="#/info">Privacy e condizioni</a></p>
      <p class="small muted">Per ritrovare il profilo usa la stessa passkey, eventualmente sincronizzata dal tuo dispositivo. Se la perdi, non possiamo recuperarla tramite email.</p>
      <p role="status" data-status></p><button type="button" class="btn ghost" data-close>Continua senza profilo</button>`;
    authDialog.setAttribute('aria-label', user ? 'Il tuo profilo' : 'Accedi o crea un profilo');
    const status = authDialog.querySelector('[data-status]');
    authDialog.onclose = () => resolve(user);
    authDialog.querySelector('[data-close]').onclick = () => authDialog.close();
    const auth = async (register) => {
      if (!browserSupportsWebAuthn()) { status.textContent = 'Questo browser non supporta le passkey. Puoi continuare con il diario locale.'; return; }
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
      if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = 'Conferma eliminazione di profilo, diario e segnalazioni'; return; }
      try { await communityRequest('account', 'DELETE'); user = null; changed(); await refreshCommunity(); authDialog.close(); }
      catch (err) { status.textContent = err.message; }
    });
    authDialog.showModal();
  });
}

export async function shareDiaryEntry(entry, { identificationChecked = false } = {}) {
  if (!entry || !Object.entries(entry.finds || {}).some(([id, amount]) => SPECIES.some((s) => s.id === id) && (amount > 0 || (amount === 0 && entry.searched?.includes(id)))))
    throw new Error('Non ci sono ritrovamenti o ricerche a vuoto esplicite da condividere.');
  await ensureAccount();
  if (!user) return false;
  for (const [speciesId, amount] of Object.entries(entry.finds || {})) {
    if (!SPECIES.some((s) => s.id === speciesId) || (amount === 0 && !entry.searched?.includes(speciesId))) continue;
    await communityRequest('reports', 'POST', { entryId: entry.id, zoneId: entry.zoneId, day: entry.date,
      speciesId, amount, searched: entry.searched?.includes(speciesId) || false, identificationChecked });
  }
  await refreshCommunity(); return true;
}

export async function openQuickReport(zoneId = '', speciesId = '') {
  if (!reportDialog) { reportDialog = document.createElement('dialog'); reportDialog.className = 'community-dialog'; document.body.appendChild(reportDialog); }
  reportDialog.setAttribute('aria-label', 'Segnala dal bosco');
  reportDialog.innerHTML = `<h2>Un’osservazione dal bosco</h2><p>Aiuta chi verrà dopo di te. La zona resta approssimativa: nessun punto GPS o nome è pubblicato.</p>
    <form><label>Zona <select class="wiz-input" name="zone">${zones.map((z) => `<option value="${z.id}"${z.id === zoneId ? ' selected' : ''}>${esc(z.title || z.name)}</option>`).join('')}</select></label>
    <label>Specie <select class="wiz-input" name="species">${SPECIES.map((s) => `<option value="${s.id}"${s.id === speciesId ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Quando <input class="wiz-input" type="date" name="day" value="${todayISO()}" max="${todayISO()}" required></label>
    <fieldset><legend>Cosa hai osservato?</legend><div class="seg">${['Cercata, non trovata', 'Pochi', 'Discreti', 'Tanti'].map((l, i) => `<label><input type="radio" name="amount" value="${i}" required> ${l}</label>`).join('')}</div></fieldset>
    <label class="small"><input type="checkbox" name="checked"> Identità controllata da un micologo (facoltativo)</label>
    <p class="small muted">Segnala solo specie che sai riconoscere. Foto e app non certificano la commestibilità: fai controllare il raccolto prima del consumo. Quantità e ritrovamenti sono dichiarazioni degli utenti.</p>
    <button class="btn primary big" type="submit">Condividi l’osservazione</button><button class="btn ghost" type="button" data-close>Annulla</button><p role="status" data-status></p></form>`;
  reportDialog.querySelector('[data-close]').onclick = () => reportDialog.close();
  reportDialog.querySelector('form').onsubmit = async (e) => {
    e.preventDefault(); const form = e.currentTarget, data = new FormData(form), status = form.querySelector('[data-status]');
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    try {
      const account = await ensureAccount(); if (!account) return;
      await communityRequest('reports', 'POST', { zoneId: data.get('zone'), speciesId: data.get('species'), day: data.get('day'), amount: +data.get('amount'),
        searched: +data.get('amount') === 0, identificationChecked: data.get('checked') === 'on' });
      await refreshCommunity(); status.textContent = 'Grazie! L’osservazione è nel tuo diario e nei conteggi collettivi.';
      submit.textContent = 'Segnalazione inviata'; submit.dataset.saved = '1';
    } catch (err) { status.textContent = err.message; }
    finally { submit.disabled = submit.dataset.saved === '1'; }
  };
  reportDialog.showModal();
}
