// Diario delle uscite: procedura guidata a passi + elenco con confronto previsto/trovato.
// Archivio: nella versione Artifact usa il db privato dell'utente (persistente, leggibile
// da Claude per la taratura); altrove localStorage del browser, da esportare ogni tanto.

import { SPECIES } from './species.js';

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

export function initJournal({ zones, predict, getZoneId }) {
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
      b.className = 'wiz-choice' + (it.value === current ? ' sel' : '');
      b.innerHTML = `<span>${esc(it.label)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}`;
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
        zones.map((z) => ({ value: z.id, label: z.name })), draft.zoneId,
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
        [...zone.bands.map((b) => ({ value: b, label: `Intorno ai ${b} m` })), { value: null, label: 'Non lo so' }],
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
      : '<p class="muted">Ancora nessuna uscita. Dopo ogni giro registra cosa hai trovato (anche niente): servono per capire se il modello funziona qui.</p>';
    const rows = entries.map((e) => {
      const z = zones.find((x) => x.id === e.zoneId);
      const found = Object.entries(e.finds).map(([id, l]) => `${SPECIES.find((x) => x.id === id)?.name ?? id} (${LEVELS[l].toLowerCase()})`).join(', ') || 'niente';
      const a = agreement(e);
      const top = Object.entries(e.predicted || {}).sort((x, y) => y[1] - x[1])[0];
      const badge = a ? `<span class="tag ${a.ok ? 'ok' : 'warn'}">${a.ok ? 'previsione giusta' : a.said ? 'previsione ottimista' : 'previsione pessimista'}</span>` : '<span class="tag">fuori dal periodo meteo</span>';
      return `<li class="j-item">
        <div><b>${esc(z?.name ?? e.zoneId)}</b> · ${fmt(e.date)}${e.band ? ` · ${e.band} m` : ''}</div>
        <div class="small">Trovato: ${esc(found)}${top ? ` · indice previsto ${top[1]} (${esc(SPECIES.find((x) => x.id === top[0])?.name ?? '')})` : ''} ${badge}</div>
        ${e.note ? `<div class="small muted">${esc(e.note)}</div>` : ''}
        <button type="button" class="link-btn small" data-del="${e.id}">Elimina</button>
      </li>`;
    }).join('');
    list.innerHTML = (msg ? `<p class="notice">${esc(msg)}</p>` : '') + head + (rows ? `<ul class="j-list">${rows}</ul>` : '');
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
  openStore().then(async (st) => {
    store = st;
    try { entries = await st.list(); } catch { entries = []; }
    sortEntries();
    document.getElementById('journal-storage').textContent = st.kind === 'db'
      ? 'Il diario è salvato nel tuo spazio privato di questa pagina: lo ritrovi da qualsiasi dispositivo.'
      : 'Il diario resta solo in questo browser. Esporta ogni tanto il file per non perderlo o per spostarlo su un altro dispositivo.';
    renderList();
  });
  return { refresh: renderList };
}
