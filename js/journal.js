// Diario delle uscite: procedura guidata a passi + elenco con confronto previsto/trovato.
// Archivio: nella versione Artifact usa il db privato dell'utente (persistente, leggibile
// da Claude per la taratura); altrove localStorage del browser, da esportare ogni tanto.

import { SPECIES } from './species.js';
import { intornoA } from './human.js';

const KEY = 'fungaroli:diario:v1';
export const LEVELS = ['', 'Pochi', 'Discreti', 'Tanti'];
export const FOUND_THRESHOLD = 30; // indice da cui il modello "dice di andare"

// --- funzioni pure (testabili) ------------------------------------------------

// Il modello e' d'accordo con l'uscita? Confronta l'indice massimo previsto
// (solo specie con previsione) con l'aver trovato o meno qualcosa.
export function agreement(entry) {
  const scores = Object.values(entry.predicted || {});
  if (!scores.length) return null;
  const said = Math.max(...scores) >= FOUND_THRESHOLD;
  const found = Object.values(entry.finds || {}).some((l) => l > 0);
  return { said, found, ok: said === found };
}

export function summary(entries) {
  const judged = entries.map(agreement).filter(Boolean);
  return {
    total: entries.length,
    judged: judged.length,
    ok: judged.filter((a) => a.ok).length,
    missed: judged.filter((a) => !a.said && a.found).length,      // trovati ma il modello diceva di no
    falseAlarm: judged.filter((a) => a.said && !a.found).length,  // il modello diceva si', niente funghi
  };
}

// --- archivio -----------------------------------------------------------------

function localStore() {
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = (list) => { localStorage.setItem(KEY, JSON.stringify(list)); };
  return {
    kind: 'local',
    async list() { return read(); },
    async put(e) { write([...read().filter((x) => x.id !== e.id), e]); },
    async remove(id) { write(read().filter((x) => x.id !== id)); },
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

// Diario sincronizzato sul sito (Cloudflare Pages Function + KV), protetto dal "codice diario".
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
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (s) => new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export function initJournal({ zones, predict, getZoneId, zoneImage = () => '' }) {
  const dlg = document.getElementById('journal-dialog');
  const body = dlg.querySelector('.wiz-body');
  const list = document.getElementById('journal-list');
  let entries = [];
  let store = null;
  let draft, step;
  const sortEntries = () => entries.sort((a, b) => b.date.localeCompare(a.date) || b.savedAt.localeCompare(a.savedAt));

  const STEPS = ['dove', 'quando', 'quota', 'cosa', 'nota'];

  function open() {
    draft = { zoneId: getZoneId(), date: iso(new Date()), band: undefined, finds: {}, note: '' };
    step = 0;
    render();
    dlg.showModal();
  }

  function next() { step = Math.min(STEPS.length - 1, step + 1); render(); }
  function back() { step = Math.max(0, step - 1); render(); }

  function shell(title, hint, content, { canNext = true, nextLabel = 'Avanti' } = {}) {
    body.innerHTML = `
      <div class="wiz-progress" aria-hidden="true">${STEPS.map((_, k) => `<span class="${k <= step ? 'on' : ''}"></span>`).join('')}</div>
      <p class="wiz-step">Passo ${step + 1} di ${STEPS.length}</p>
      <h2 class="wiz-title">${title}</h2>
      ${hint ? `<p class="wiz-hint">${hint}</p>` : ''}
      <div class="wiz-content">${content}</div>
      <div class="wiz-nav">
        ${step > 0 ? '<button type="button" class="btn ghost" data-act="back">Indietro</button>' : '<span></span>'}
        ${canNext ? `<button type="button" class="btn primary" data-act="next">${nextLabel}</button>` : ''}
      </div>`;
    body.querySelector('[data-act="back"]')?.addEventListener('click', back);
    body.querySelector('[data-act="next"]')?.addEventListener('click', step === STEPS.length - 1 ? save : next);
  }

  function choices(items, current, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'wiz-choices';
    for (const it of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wiz-choice' + (it.value === current ? ' sel' : '') + (it.img ? ' has-img' : '');
      b.innerHTML = `${it.img ? `<img src="${it.img}" alt="" loading="lazy">` : ''}<span>${esc(it.label)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}`;
      b.addEventListener('click', () => onPick(it.value));
      wrap.appendChild(b);
    }
    return wrap;
  }

  function render() {
    const zone = zones.find((z) => z.id === draft.zoneId);
    const s = STEPS[step];

    if (s === 'dove') {
      shell('Dove sei stato?', 'Tocca la zona.', '', { canNext: false });
      body.querySelector('.wiz-content').appendChild(choices(
        zones.map((z) => ({ value: z.id, label: z.title || z.name, sub: z.subtitle, img: zoneImage(z.id) })), draft.zoneId,
        (v) => { draft.zoneId = v; draft.band = undefined; next(); }));
    }

    if (s === 'quando') {
      const today = new Date();
      const yest = new Date(Date.now() - 864e5);
      const other = draft.date !== iso(today) && draft.date !== iso(yest);
      shell('Quando?', null, '', { canNext: other });
      const c = body.querySelector('.wiz-content');
      c.appendChild(choices([
        { value: iso(today), label: 'Oggi' },
        { value: iso(yest), label: 'Ieri' },
        { value: 'altro', label: 'Un altro giorno' },
      ], other ? 'altro' : draft.date, (v) => {
        if (v === 'altro') { draft.date = iso(new Date(Date.now() - 2 * 864e5)); render(); } else { draft.date = v; next(); }
      }));
      if (other) {
        const inp = document.createElement('input');
        inp.type = 'date'; inp.className = 'wiz-input'; inp.value = draft.date; inp.max = iso(today);
        inp.addEventListener('change', () => { if (inp.value) draft.date = inp.value; });
        c.appendChild(inp);
      }
    }

    if (s === 'quota') {
      shell('A che quota, più o meno?', 'Se non lo sai va bene lo stesso.', '', { canNext: false });
      body.querySelector('.wiz-content').appendChild(choices(
        [...zone.bands.map((b) => ({ value: b, label: `${intornoA(b).replace('i', 'I')} ${b} m` })), { value: null, label: 'Non lo so' }],
        draft.band, (v) => { draft.band = v; next(); }));
    }

    if (s === 'cosa') {
      const pred = predict(draft.zoneId, draft.date, draft.band) || {};
      const sorted = [...SPECIES].sort((a, b) => (pred[b.id] ?? -1) - (pred[a.id] ?? -1));
      const showAll = draft.showAll || sorted.slice(6).some((sp) => draft.finds[sp.id]);
      const shown = showAll ? sorted : sorted.slice(0, 6);
      const rows = shown.map((sp) => `
        <div class="wiz-row">
          <div class="wiz-sp">${esc(sp.name)}<small>${esc(sp.latin)}</small></div>
          <div class="seg" role="group" aria-label="${esc(sp.name)}">
            ${[1, 2, 3].map((l) => `<button type="button" data-sp="${sp.id}" data-l="${l}" aria-pressed="${draft.finds[sp.id] === l}">${LEVELS[l]}</button>`).join('')}
          </div>
        </div>`).join('');
      const nothing = !Object.values(draft.finds).some(Boolean);
      shell('Cosa hai trovato?', 'Tocca la quantità solo per quello che hai raccolto. Se non hai trovato niente, vai avanti.',
        rows + (showAll ? '' : '<button type="button" class="link-btn" data-act="all">Mostra altre specie</button>'),
        { nextLabel: nothing ? 'Niente funghi, avanti' : 'Avanti' });
      body.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.sp, l = +b.dataset.l;
        draft.finds[id] = draft.finds[id] === l ? 0 : l;
        render();
      }));
      body.querySelector('[data-act="all"]')?.addEventListener('click', () => { draft.showAll = true; render(); });
    }

    if (s === 'nota') {
      const found = Object.entries(draft.finds).filter(([, l]) => l);
      const recap = found.length
        ? found.map(([id, l]) => `${SPECIES.find((x) => x.id === id).name} (${LEVELS[l].toLowerCase()})`).join(', ')
        : 'niente funghi';
      shell('Vuoi aggiungere una nota?', 'Facoltativo: esposizione, tipo di bosco, com\'era il terreno…',
        `<p class="wiz-recap"><b>${esc(zone.name)}</b> · ${fmt(draft.date)}${draft.band ? ` · ${draft.band} m` : ''}<br>${esc(recap)}</p>
         <textarea class="wiz-input" rows="3" placeholder="Es. versante nord, faggeta, terreno umido">${esc(draft.note)}</textarea>`,
        { nextLabel: 'Salva uscita' });
      body.querySelector('textarea').addEventListener('input', (e) => { draft.note = e.target.value; });
    }
  }

  async function save() {
    const entry = {
      id: Date.now().toString(36),
      date: draft.date,
      zoneId: draft.zoneId,
      band: draft.band ?? null,
      finds: Object.fromEntries(Object.entries(draft.finds).filter(([, l]) => l)),
      note: draft.note.trim(),
      predicted: predict(draft.zoneId, draft.date, draft.band) || {},
      savedAt: new Date().toISOString(),
    };
    let ok = true;
    try { await store.put(entry); } catch { ok = false; }
    entries = [entry, ...entries];
    sortEntries();
    body.innerHTML = `<div class="wiz-done"><p class="wiz-big">✓</p><h2 class="wiz-title">Uscita salvata</h2>
      ${ok ? '' : '<p class="notice">Non sono riuscito a salvarla in modo permanente: esporta subito il diario.</p>'}
      <div class="wiz-nav"><span></span><button type="button" class="btn primary" data-act="close">Chiudi</button></div></div>`;
    body.querySelector('[data-act="close"]').addEventListener('click', () => dlg.close());
    renderList();
  }

  function renderList(msg = '') {
    if (!store) { list.innerHTML = '<p class="muted">Carico il diario…</p>'; return; }
    const sm = summary(entries);
    const head = entries.length
      ? `<p class="j-sum">${sm.total} ${sm.total === 1 ? 'uscita' : 'uscite'}${sm.judged ? ` · il modello ci ha preso <b>${sm.ok} su ${sm.judged}</b>` : ''}
         ${sm.falseAlarm ? ` · ${sm.falseAlarm} volte ha promesso troppo` : ''}${sm.missed ? ` · ${sm.missed} volte è stato troppo pessimista` : ''}</p>`
      : `<div class="j-empty">${zoneImage('laga') ? `<img src="${zoneImage('laga')}" alt="" loading="lazy">` : ''}<span class="shade"></span>
          <div class="j-empty-body"><b>Il primo giro è il più utile</b><span>Dopo ogni uscita segna cosa hai trovato, anche niente: in pochi tocchi capisci se il modello funziona nei tuoi boschi.</span>
          <button type="button" class="btn light big" data-open-journal-inline>＋ Registra un'uscita</button></div></div>`;
    const rows = entries.map((e) => {
      const z = zones.find((x) => x.id === e.zoneId);
      const found = Object.entries(e.finds).map(([id, l]) => `${SPECIES.find((x) => x.id === id)?.name ?? id} (${LEVELS[l].toLowerCase()})`).join(', ') || 'niente';
      const a = agreement(e);
      const top = Object.entries(e.predicted || {}).sort((x, y) => y[1] - x[1])[0];
      const badge = a ? `<span class="tag ${a.ok ? 'ok' : 'warn'}">${a.ok ? 'previsione giusta' : a.said ? 'previsione ottimista' : 'previsione pessimista'}</span>` : '<span class="tag">fuori dal periodo meteo</span>';
      const img = zoneImage(e.zoneId);
      return `<li class="j-item">
        <span class="j-img">${img ? `<img src="${img}" alt="" loading="lazy">` : ''}</span>
        <div class="j-body">
          <div class="j-top"><b>${esc(z?.title ?? z?.name ?? e.zoneId)}</b><span class="muted small">${fmt(e.date)}${e.band ? ` · ${e.band} m` : ''}</span></div>
          <div class="small">Trovato: ${esc(found)}${top ? ` · previsto ${top[1]} (${esc(SPECIES.find((x) => x.id === top[0])?.name ?? '')})` : ''}</div>
          <div>${badge}</div>
          ${e.note ? `<div class="small muted">${esc(e.note)}</div>` : ''}
          <button type="button" class="link-btn small" data-del="${e.id}">Elimina</button>
        </div>
      </li>`;
    }).join('');
    list.innerHTML = (msg ? `<p class="notice">${esc(msg)}</p>` : '') + head + (rows ? `<ul class="j-list">${rows}</ul>` : '');
    list.querySelector('[data-open-journal-inline]')?.addEventListener('click', open);
    document.querySelector('[data-open-journal]').hidden = !entries.length;
    // conferma in pagina: primo tocco arma, secondo elimina
    list.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.armed !== '1') {
        b.dataset.armed = '1';
        b.textContent = 'Tocca di nuovo per eliminare';
        setTimeout(() => { if (b.isConnected) { b.dataset.armed = ''; b.textContent = 'Elimina'; } }, 4000);
        return;
      }
      try { await store.remove(b.dataset.del); } catch { renderList('Eliminazione non riuscita, riprova.'); return; }
      entries = entries.filter((e) => e.id !== b.dataset.del);
      renderList();
    }));
  }

  async function exportFile() {
    const json = JSON.stringify({ version: 1, entries }, null, 1);
    const filename = `diario-funghi-${iso(new Date())}.json`;
    const downloads = typeof globalThis.claude?.use === 'function' ? await globalThis.claude.use('downloads') : null;
    if (downloads) {
      try { await downloads.save({ filename, data: json }); } catch (e) { if (e?.code !== 'declined') renderList('Esportazione non disponibile qui.'); }
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importFile(file) {
    try {
      const data = JSON.parse(await file.text());
      const incoming = (Array.isArray(data) ? data : data.entries).filter((e) => e && e.id && e.date && e.zoneId);
      const ids = new Set(entries.map((e) => e.id));
      const fresh = incoming.filter((e) => !ids.has(e.id));
      for (const e of fresh) await store.put(e);
      entries = [...entries, ...fresh];
      sortEntries();
      renderList(`Importate ${fresh.length} uscite.`);
    } catch {
      renderList('File non valido: serve un diario esportato da questa app.');
    }
  }

  document.querySelectorAll('[data-open-journal]').forEach((b) => b.addEventListener('click', open));
  dlg.querySelector('.wiz-close').addEventListener('click', () => dlg.close());
  document.getElementById('journal-export').addEventListener('click', exportFile);
  const imp = document.getElementById('journal-import');
  imp.addEventListener('change', () => { if (imp.files[0]) importFile(imp.files[0]); imp.value = ''; });
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
      renderList(`Diario collegato: ${entries.length} uscite sincronizzate.`);
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
    if (store.kind === 'db') {
      storageBox.innerHTML = 'Il diario è salvato nel tuo spazio privato di questa pagina: lo ritrovi da qualsiasi dispositivo.';
    } else if (store.kind === 'remote') {
      storageBox.innerHTML = `<div class="sync-card ok"><span class="sync-ic">${PHONES}</span><div><b>Diario sincronizzato</b><p class="small">${store.offline ? 'Sei offline: vedi l\'ultima copia scaricata. ' : ''}Lo ritrovi su tutti i dispositivi collegati.</p></div></div>
        <button type="button" class="btn primary" id="j-share">Collega un altro dispositivo</button>
        <div class="sync-qr" id="j-qr" hidden></div>
        <button type="button" class="link-btn small" id="j-disconnect">Scollega questo dispositivo</button>`;
      storageBox.querySelector('#j-disconnect').addEventListener('click', () => { setToken(''); location.reload(); });
      storageBox.querySelector('#j-share').addEventListener('click', async (e) => {
        const box = storageBox.querySelector('#j-qr'), url = linkFor(getToken());
        e.currentTarget.hidden = true; box.hidden = false;
        box.innerHTML = `<p><b>Sull'altro telefono inquadra il codice con la fotocamera</b> e apri il link: si collega da solo.</p><div class="qr-img" aria-label="Codice QR per collegare un altro dispositivo"></div>
          <button type="button" class="btn ghost" id="j-copy">Oppure copia il link</button>
          <p class="small muted">Chi ha questo codice può leggere e scrivere il diario: mostralo solo ai tuoi.</p>`;
        box.querySelector('#j-copy').addEventListener('click', (ev) => navigator.clipboard?.writeText(url).then(() => { ev.target.textContent = 'Link copiato'; }));
        try { await loadQr(); const q = globalThis.qrcode(0, 'M'); q.addData(url); q.make(); box.querySelector('.qr-img').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
        catch { box.querySelector('.qr-img').innerHTML = '<p class="small">Senza rete non posso disegnare il QR: usa "copia il link".</p>'; }
      });
    } else if (remote === 'needs_code') {
      storageBox.innerHTML = `
        <div class="sync-card"><span class="sync-ic">${PHONES}</span><div><b>Ritrova il diario su tutti i dispositivi</b>
          <p class="small">Ora le uscite sono salvate solo su questo dispositivo.</p></div></div>
        <ol class="sync-steps">
          <li>Sul telefono dove il diario è già collegato apri <b>Diario › Collega un altro dispositivo</b>.</li>
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
      storageBox.innerHTML = 'Il diario resta solo in questo browser. Esporta ogni tanto il file per non perderlo o per spostarlo su un altro dispositivo.';
    }
  }

  // link dal QR: #/diario/collega/<codice>. Il codice esce subito dalla barra degli indirizzi e dalla cronologia
  const fromLink = () => {
    const m = location.hash.match(/^#\/diario\/collega\/(.+)$/);
    if (!m) return;
    let code = ''; try { code = decodeURIComponent(m[1]); } catch { return; }
    history.replaceState(null, '', '#/diario');
    connect(code, null).then((ok) => { if (!ok) renderList('Il link non ha funzionato: inserisci il codice a mano.'); });
  };
  addEventListener('hashchange', fromLink);


  (async () => {
    let st = await openStore();
    let remote = 'none';
    if (st.kind === 'local') {
      const token = getToken();
      if (token) {
        const rs = remoteStore(token);
        try { await rs.list(); st = rs; } catch (e) { if (e.status === 401) setToken(''); }
      }
      if (st.kind === 'local') remote = await probeRemote();
    }
    store = st;
    try { entries = await st.list(); } catch { entries = []; }
    sortEntries();
    renderStorage(remote);
    renderList();
    fromLink(); // dopo l'avvio: il collegamento dal QR non deve essere sovrascritto
  })();
  return { refresh: renderList };
}
