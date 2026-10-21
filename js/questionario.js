// Questionario per cercatori esperti del Reatino (pagina /questionario), versione 2: corta (3–4 minuti).
// Chiede solo ciò che si sa per abitudine (zone, specie, mesi, boschi e quote di solito, errori e pericoli),
// mai episodi, numeri, quantità o classifiche da ricordare: un dato inventato che sembra vero è dannoso.
// Le osservazioni vere si raccolgono poi dal bosco con l'app («Annota»): la ricevuta invita a farlo.
// Bozza salvata nel browser: al server arriva qualcosa solo dopo «Invia», dal riepilogo.
// Elenchi chiusi, limiti e validazione vengono da survey-schema.js, lo stesso modulo del Worker.
// Regola della pagina: nessuna risposta preimpostata; «Non so» dove serve.

// Tutto ciò che riguarda il contratto con il server (nome e versione del questionario, indirizzo,
// elenchi, limiti dei campi) arriva da survey-schema.js in main(): qui non si ripete.
let S = {};
let SURVEY_ID = '', SURVEY_VERSION = 0, ENDPOINT = '', MAX_BYTES = 0;
let KEY = '', RECEIPTS_KEY = '', OLD_KEYS = [];
let LIMITS = {}, RESPONDENT = {};
let DONT_KNOW = 'non so';
let MONTHS = [], MONTHS_SHORT = [];
let SPECIES = [], FORESTS = [], YEARS = [], ELEVATION = [], REPORT = [], REACHABLE = [];

// ---------------------------------------------------------------------------------------------
// Strumenti: DOM senza innerHTML (i testi delle persone restano testo), memoria locale prudente.
// ---------------------------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
let seq = 0;
const uid = (p = 'q') => `${p}${++seq}`;
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false && c !== '') el.append(c);
  return el;
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* memoria non disponibile */ } },
};
let announceTimer = 0;
function announce(msg) {
  const el = $('#q-announce');
  if (!el) return;
  el.textContent = '';
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { el.textContent = msg; }, 80);
}
const opt = (value, label = String(value)) => ({ value, label });
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const labelOf = (opts, v) => (v === DONT_KNOW ? 'Non so' : opts.find((o) => o.value === v)?.label ?? String(v));
const optionsOf = (f) => (typeof f.options === 'function' ? f.options() : f.options) || [];
// Stessa pulizia del server (S.cleanText) e stesso modo di contare i caratteri (unità UTF-16, come maxlength).
function clean(s, max) {
  let t = S.cleanText(String(s ?? '')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  if (max && t.length > max) t = t.slice(0, /[\uD800-\uDBFF]/.test(t[max - 1]) ? max - 1 : max);
  return t.trim();
}
const newKey = () => `${Date.now().toString(36)}${(seq += 1).toString(36)}`;

// ---------------------------------------------------------------------------------------------
// Stato e bozza (chiave con la versione: le bozze della versione 1 restano nel browser ma non si riaprono)
// ---------------------------------------------------------------------------------------------
const YES_NO = [opt('sì', 'Sì'), opt('no', 'No')];
const LABELS = { 'preferisco non dirlo': 'Preferisco non dirlo', sì: 'Sì', forse: 'Forse', no: 'No' };
const fromSchema = (values) => (Array.isArray(values) ? values : []).map((v) => opt(v, LABELS[v] || cap(v)));

function blank() {
  return {
    format: 2, step: 'intro', startedAt: null,
    // forma delle risposte; zone e altre specie sono righe con una chiave stabile (le schede vi si legano)
    a: { profile: { years: null, zones: [], speciesSought: [], speciesOther: [] }, barrenZones: { where: '', opinion: '' }, warning: '', willReport: null },
    cards: {}, cardPick: [],
    consent: { anonymousUse: false, recontact: null },
    respondent: { name: '', contact: '' },
  };
}
const cardItem = () => ({ months: [], forests: [], elevation: [] });

function merge(base, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
  for (const [k, v] of Object.entries(saved)) {
    const b = base[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v)) base[k] = merge(b, v);
    else if (v !== undefined) base[k] = v;
  }
  return base;
}

let state = blank();
let resumeAt = null; // data della bozza trovata all'apertura: finché non si sceglie, si chiede se riprenderla
let savedStep = 'A';
let sent = null; // ricevuta dell'invio appena riuscito
let saveTimer = 0;

function loadDraft() {
  try {
    const raw = store.get(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.state?.format === 2 ? d : null;
  } catch { return null; }
}
function save(now = false) {
  clearTimeout(saveTimer);
  if (now) writeDraft(); else saveTimer = setTimeout(writeDraft, 250);
}
function writeDraft() {
  if (!state.startedAt || sent) return;
  const savedAt = new Date().toISOString();
  const ok = store.set(KEY, JSON.stringify({ savedAt, state }));
  const el = $('#q-saved');
  if (el) el.textContent = ok ? `Bozza salvata su questo dispositivo alle ${clock(savedAt)}.` : 'Questo browser non salva la bozza: non chiudere la pagina prima di inviare.';
}
const clock = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const dayText = (iso) => { const d = new Date(iso); return `il ${d.getDate()} ${MONTHS[d.getMonth()]} alle ${clock(iso)}`; };

const PART_KEYS = ['A', 'B', 'C', 'D'];
const isPart = (step) => PART_KEYS.includes(step);
function changed() {
  if (!state.startedAt && isPart(state.step)) state.startedAt = new Date().toISOString();
  save();
  refresh();
}

// Aggiornamenti dei pezzi che dipendono da altre risposte (domande condizionate, avvisi, limiti)
let watchers = [];
function watch(el, fn) { watchers.push({ el, fn }); fn(el); return el; }
const when = (el, test) => watch(el, (e) => { e.hidden = !test(); });
function refresh() {
  watchers = watchers.filter((w) => w.el.isConnected);
  for (const w of watchers) w.fn(w.el);
}

// ---------------------------------------------------------------------------------------------
// Domande. path = percorso nello schema (fieldSpec); il valore sta nello stato con la stessa forma.
// ---------------------------------------------------------------------------------------------
const reachableAnswer = () => REACHABLE.includes(state.a.willReport);
const wantsContact = () => reachableAnswer() && state.consent.recontact === 'sì';

const A_FIELDS = [
  { t: 'choice', path: 'profile.years', short: 'Da quanti anni cerchi funghi', label: 'Da quanti anni cerchi funghi?', options: () => YEARS },
  { t: 'texts', path: 'profile.zones', short: 'Zone', label: 'In quali zone vai, a grandi linee?', hint: 'Basta il comune o la località, anche più di uno. Niente posti precisi.', list: 'zone', item: 'Zona', add: 'Aggiungi un’altra zona' },
  { t: 'multi', path: 'profile.speciesSought', short: 'Funghi che cerchi', label: 'Quali funghi cerchi?', hint: 'Quelli per cui esci apposta. Puoi sceglierne più di uno.', options: () => SPECIES },
  { t: 'texts', path: 'profile.speciesOther', short: 'Altre specie che cerchi', label: 'Cerchi anche altre specie?', hint: 'Facoltativo. Scrivi il nome italiano o scientifico.', list: 'species', item: 'Altra specie', add: 'Aggiungi una specie', empty: true },
];
const SPECIES_FIELDS = [
  { t: 'months', path: 'species.months', short: 'Mesi in cui la trovi di solito', label: 'In che mesi la trovi di solito?', hint: 'Tocca tutti i mesi in cui la trovi, anno dopo anno.' },
  { t: 'multi', path: 'species.forests', short: 'Boschi', label: 'In che boschi la trovi?', hint: 'Puoi sceglierne più di uno.', options: () => FORESTS, dontKnow: true },
  { t: 'multi', path: 'species.elevation', short: 'Quota di solito', label: 'A che quota la trovi, di solito?', hint: 'Anche più di una fascia.', options: () => ELEVATION, dontKnow: true },
];
const C_FIELDS = [
  { t: 'area', path: 'barrenZones.where', short: 'Zone che non danno mai niente', label: 'Ci sono zone che sembrano adatte, ma non danno mai niente?', hint: 'Facoltativo. Basta la zona a grandi linee.' },
  { t: 'area', path: 'barrenZones.opinion', short: 'Perché, secondo te (parere)', label: 'Secondo te, perché?', hint: 'È un tuo parere, e va bene così. Se non lo sai, lascia vuoto.', when: () => !!clean(state.a.barrenZones.where) },
  { t: 'area', path: 'warning', short: 'Un errore o un pericolo', label: 'Un errore da principiante che vedi spesso, oppure un pericolo in montagna', hint: 'Facoltativo. Non scrivere nomi di persone né dati sulla salute.' },
];
const D_FIELDS = [
  { t: 'choice', path: 'willReport', short: 'Segnaleresti con l’app', label: 'Segnaleresti con l’app i tuoi ritrovamenti, anche quando non trovi niente?', hint: 'Con «Annota» bastano pochi tocchi, nel bosco: cosa hai trovato, o che non hai trovato niente, e quanto hai cercato.', options: () => REPORT },
  { t: 'choice', path: 'consent.recontact', short: 'Ricontatto', label: 'Vuoi che ti ricontatti?', hint: 'Per spiegarti come si segnala con l’app, o per qualche domanda in più.', options: YES_NO, when: reachableAnswer },
  { t: 'text', path: 'respondent.name', short: 'Nome', label: 'Il tuo nome', hint: 'Facoltativo. Anche solo un soprannome. Non comparirà nei risultati.', autocomplete: 'name', when: wantsContact },
  { t: 'text', path: 'respondent.contact', short: 'Contatto', label: 'Come posso ricontattarti?', hint: 'Telefono o email.', when: wantsContact },
];

// Dove sta il valore di un campo: [oggetto, chiave]. Le schede delle specie passano la loro scheda.
function ref(f, card) {
  const [head, ...rest] = f.path.split('.');
  if (head === 'respondent') return [state.respondent, rest[0]];
  if (head === 'consent') return [state.consent, rest[0]];
  if (head === 'species') return [card, rest[0]];
  if (!rest.length) return [state.a, head];
  return [state.a[head], rest[0]];
}
const getV = (f, card) => { const [o, k] = ref(f, card); return o[k]; };
const setV = (f, card, v) => { const [o, k] = ref(f, card); o[k] = v; };

// Limiti dei campi (lunghezze, numero di voci) dallo schema condiviso: fieldSpec(percorso).
// Un campo che lo schema non conosce ferma l'avvio: meglio un errore subito che un 400 all'invio.
function applySpec(fields) {
  for (const f of fields) {
    if (f.path.startsWith('consent.')) continue;
    if (f.path.startsWith('respondent.')) { f.max = RESPONDENT[f.path.split('.')[1]]; continue; }
    const spec = S.fieldSpec(f.path);
    if (!spec) throw new Error(`Campo assente dallo schema: ${f.path}`);
    if (f.t === 'texts') { f.max = spec.item?.max; f.count = spec.max; }
    else if (spec.t === 'text') f.max = spec.max;
    if (['text', 'area', 'texts'].includes(f.t) && !Number.isInteger(f.max)) throw new Error(`Manca il limite di ${f.path}`);
    if (f.t === 'texts' && !Number.isInteger(f.count)) throw new Error(`Manca il numero di voci di ${f.path}`);
  }
}

const PARTS = [
  { key: 'A', title: 'Tu e i funghi', intro: 'Dove vai e che cosa cerchi. Basta quello che fai di solito.', fields: A_FIELDS },
  { key: 'B', title: 'Le tue specie', intro: 'Per ogni specie, quello che vedi di solito, anno dopo anno. «Non so» va benissimo.', render: renderSpeciesPart, summary: speciesSummary },
  { key: 'C', title: 'Quello che hai notato', intro: 'Due domande aperte, se ti va. Scrivi con parole tue.', fields: C_FIELDS },
  { key: 'D', title: 'Con l’app', intro: 'Le osservazioni vere si raccolgono nel bosco, sul momento.', fields: D_FIELDS },
];
const partBy = (key) => PARTS.find((p) => p.key === key);

// ---------------------------------------------------------------------------------------------
// Controlli
// ---------------------------------------------------------------------------------------------
function fieldset(f, extra = '') {
  const hid = f.hint ? uid('h') : null;
  const fs = h('fieldset', { class: `q-field ${extra}`.trim(), 'aria-describedby': hid });
  fs.append(h('legend', { class: 'q-q' }, f.label));
  if (f.hint) fs.append(h('p', { id: hid, class: 'q-hint' }, f.hint));
  return fs;
}
function chip(type, name, label, checked, onchange, extra = {}) {
  const input = h('input', { type, name, ...extra });
  input.checked = !!checked;
  input.addEventListener('change', () => onchange(input));
  return { input, el: h('label', { class: 'q-chip' }, input, h('span', {}, label)) };
}
function linkButton(text, onclick, extra = {}) { return h('button', { type: 'button', class: 'q-link', onclick, ...extra }, text); }

function renderFields(parent, fields, card) {
  for (const f of fields) {
    const el = control(f, card);
    if (f.when) when(el, () => f.when(card));
    parent.append(el);
  }
}
function control(f, card) {
  switch (f.t) {
    case 'choice': return choiceControl(f, card);
    case 'multi': return multiControl(f, card);
    case 'months': return monthsControl(f, card);
    case 'texts': return textsControl(f);
    case 'area': return areaControl(f);
    case 'text': return textControl(f);
    default: return h('div');
  }
}

function choiceControl(f, card) {
  const opts = optionsOf(f), name = uid('r');
  const fs = fieldset(f);
  const inputs = opts.map((x) => chip('radio', name, x.label, getV(f, card) === x.value, (input) => { if (input.checked) { setV(f, card, x.value); changed(); } }, { value: String(x.value) }));
  const clear = linkButton('Cancella la scelta', () => {
    setV(f, card, null);
    inputs.forEach((c) => { c.input.checked = false; });
    changed();
    inputs[0]?.input.focus();
    announce('Scelta cancellata.');
  });
  watch(clear, (e) => { e.hidden = getV(f, card) == null; });
  watch(fs, () => { inputs.forEach((c, i) => { c.input.checked = getV(f, card) === opts[i].value; }); });
  fs.append(h('div', { class: 'q-chips' }, inputs.map((c) => c.el)), clear);
  return fs;
}

// Scelta multipla; con dontKnow anche «Non so», che non si combina con le altre scelte.
function toggle(list, value, on) {
  const a = list.filter((x) => x !== value);
  if (!on) return a;
  if (value === DONT_KNOW) return [DONT_KNOW];
  return [...a.filter((x) => x !== DONT_KNOW), value];
}
function multiControl(f, card, extra = '') {
  if (!Array.isArray(getV(f, card))) setV(f, card, []);
  const opts = [...optionsOf(f), ...(f.dontKnow ? [opt(DONT_KNOW, 'Non so')] : [])];
  const fs = fieldset(f, extra);
  const boxes = opts.map((x) => chip('checkbox', null, x.label, getV(f, card).includes(x.value), (input) => {
    setV(f, card, toggle(getV(f, card), x.value, input.checked));
    changed();
  }, { value: String(x.value) }));
  watch(fs, () => { boxes.forEach((c, i) => { c.input.checked = getV(f, card).includes(opts[i].value); }); });
  fs.append(h('div', { class: 'q-chips' }, boxes.map((c) => c.el)));
  return fs;
}

// Mesi: griglia di 12 (si possono toccare più mesi), più «Non so». Nessuna parte del mese.
function monthsControl(f, card) {
  if (!Array.isArray(getV(f, card))) setV(f, card, []);
  const fs = fieldset(f, 'q-month-field');
  // i mesi restano in ordine di calendario, qualunque sia l'ordine dei tocchi
  const pick = (value, on) => {
    const next = toggle(getV(f, card), value, on);
    setV(f, card, [...MONTHS.filter((m) => next.includes(m)), ...(next.includes(DONT_KNOW) ? [DONT_KNOW] : [])]);
    changed();
  };
  const months = MONTHS.map((m, i) => chip('checkbox', null, [h('span', { 'aria-hidden': 'true' }, MONTHS_SHORT[i]), h('span', { class: 'q-sr' }, m)], getV(f, card).includes(m), (input) => pick(m, input.checked), { value: m }));
  const unknown = chip('checkbox', null, 'Non so', getV(f, card).includes(DONT_KNOW), (input) => pick(DONT_KNOW, input.checked), { value: DONT_KNOW });
  watch(fs, () => {
    months.forEach((c, i) => { c.input.checked = getV(f, card).includes(MONTHS[i]); });
    unknown.input.checked = getV(f, card).includes(DONT_KNOW);
  });
  fs.append(h('div', { class: 'q-chips q-months' }, months.map((c) => c.el)), h('div', { class: 'q-chips' }, unknown.el));
  return fs;
}

// Più righe di testo libero con suggerimenti (datalist nativi): zone, altre specie.
function textsControl(f) {
  const fs = fieldset(f, 'q-texts');
  const rows = h('div', { class: 'q-text-rows' });
  const add = h('button', { type: 'button', class: 'q-btn q-btn-small q-add-row' }, f.add);
  const draw = (focusIndex) => {
    const items = getV(f);
    if (!f.empty && !items.length) items.push({ key: newKey(), value: '' });
    rows.replaceChildren(...items.map((item, i) => {
      const id = uid('x');
      const input = h('input', { id, type: 'text', class: 'q-input', maxlength: f.max, list: `q-${f.list}-list`, autocomplete: 'off', enterkeyhint: 'next' });
      input.value = item.value || '';
      input.addEventListener('input', () => { item.value = input.value; changed(); });
      const remove = h('button', { type: 'button', class: 'q-btn q-btn-small', 'aria-label': `Togli: ${f.item} ${i + 1}` }, 'Togli');
      remove.addEventListener('click', () => {
        items.splice(i, 1);
        changed();
        draw(Math.min(i, items.length - 1));
        announce(`${f.item} ${i + 1}: tolta.`);
        if (!items.length) add.focus();
      });
      return h('div', { class: 'q-text-row' }, h('label', { for: id, class: 'q-sr' }, `${f.item} ${i + 1}`), input, items.length > 1 || f.empty ? remove : null);
    }));
    add.hidden = items.length >= f.count;
    if (focusIndex != null && focusIndex >= 0) rows.querySelectorAll('input')[focusIndex]?.focus();
  };
  add.addEventListener('click', () => {
    const items = getV(f);
    if (items.length >= f.count) return;
    items.push({ key: newKey(), value: '' });
    changed();
    draw(items.length - 1);
  });
  draw();
  fs.append(rows, add, h('p', { class: 'q-hint q-count-note' }, `Fino a ${f.count}.`));
  return fs;
}

const growable = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');
function areaControl(f) {
  const id = uid('t'), hid = f.hint ? uid('h') : null;
  const t = h('textarea', { id, class: 'q-input q-area', rows: 3, maxlength: f.max, spellcheck: 'true', autocapitalize: 'sentences', 'aria-describedby': hid });
  t.value = getV(f) || '';
  const counter = h('p', { class: 'q-count-chars', hidden: true });
  const grow = () => {
    if (!growable) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; }
    const left = f.max - t.value.length;
    counter.hidden = left > 60;
    counter.textContent = left > 0 ? `Puoi scrivere ancora ${left} caratteri.` : 'Hai raggiunto il limite di questa risposta.';
  };
  t.addEventListener('input', () => { grow(); setV(f, null, t.value); changed(); });
  t.addEventListener('focus', grow);
  requestAnimationFrame(grow);
  return h('div', { class: 'q-field' }, h('label', { for: id, class: 'q-q' }, f.label), f.hint ? h('p', { id: hid, class: 'q-hint' }, f.hint) : null,
    h('p', { class: 'q-dict' }, 'Puoi dettare con il microfono della tastiera.'), t, counter);
}

function textControl(f) {
  const id = uid('x'), hid = f.hint ? uid('h') : null;
  const input = h('input', { id, type: 'text', class: 'q-input', maxlength: f.max, autocomplete: f.autocomplete || 'off', enterkeyhint: 'next', 'aria-describedby': hid });
  input.value = getV(f) || '';
  input.addEventListener('input', () => { setV(f, null, input.value); changed(); });
  return h('div', { class: 'q-field' }, h('label', { for: id, class: 'q-q' }, f.label), f.hint ? h('p', { id: hid, class: 'q-hint' }, f.hint) : null, input);
}

function consentControl() {
  const id = uid('k'), hid = uid('h');
  const input = h('input', { id, type: 'checkbox', class: 'q-check', 'aria-describedby': hid, 'data-consent': '' });
  input.checked = !!state.consent.anonymousUse;
  input.addEventListener('change', () => {
    state.consent.anonymousUse = input.checked;
    if (input.checked) {
      input.removeAttribute('aria-invalid');
      input.setAttribute('aria-describedby', hid);
      const e = $('#q-send-error'); if (e && e.dataset.kind === 'consent') { e.hidden = true; e.textContent = ''; }
    }
    changed();
  });
  const box = h('div', { class: 'q-consent' },
    h('label', { for: id, class: 'q-consent-label' }, input, h('span', {}, 'Acconsento all’uso delle mie risposte per studiare stagioni e condizioni dei funghi nel Reatino e preparare l’app, come spiegato nell’informativa. Nei risultati non compariranno il mio nome né il mio contatto.')),
    h('p', { id: hid, class: 'q-hint' }, 'Serve per inviare. Titolare: Matteo Sgambato. Non cediamo i dati a nessuno. ', h('a', { href: '#informativa' }, 'Leggi l’informativa'), '.'));
  watch(box, () => { input.checked = !!state.consent.anonymousUse; });
  return box;
}

// ---------------------------------------------------------------------------------------------
// Schede delle specie (B): una per specie scelta, al massimo LIMITS.species
// ---------------------------------------------------------------------------------------------
// Specie candidate, nell'ordine della scelta: quelle dell'elenco, poi le altre con un nome.
function candidates() {
  return [
    ...state.a.profile.speciesSought.map((id) => ({ key: id, id, title: labelOf(SPECIES, id) })),
    ...state.a.profile.speciesOther.map((x) => ({ key: `altra:${x.key}`, id: S.OTHER_SPECIES, name: clean(x.value, LIMITS.speciesName), title: clean(x.value, LIMITS.speciesName) })).filter((x) => x.name),
  ];
}
// Con più specie del massimo, si scelgono le schede da compilare: nessuna scelta fatta al posto della persona.
const overflow = () => candidates().length > LIMITS.species;
function cardSpecies() {
  const all = candidates();
  if (all.length <= LIMITS.species) return all;
  return state.cardPick.map((k) => all.find((x) => x.key === k)).filter(Boolean).slice(0, LIMITS.species);
}
function renderSpeciesPart(body) {
  const all = candidates();
  if (!all.length) {
    body.append(h('p', { class: 'q-box' }, 'Non hai scelto nessuna specie. Puoi tornare indietro e sceglierle, oppure andare avanti.'));
    return;
  }
  if (all.length > LIMITS.species) {
    const f = { label: `Hai scelto ${all.length} specie: per quali compili la scheda?`, hint: `Fino a ${LIMITS.species}. Scegli quelle che conosci meglio.` };
    const fs = fieldset(f);
    const note = h('p', { class: 'q-hint', role: 'status' });
    const boxes = all.map((x) => chip('checkbox', null, x.title, state.cardPick.includes(x.key), (input) => {
      state.cardPick = input.checked ? [...state.cardPick.filter((k) => k !== x.key), x.key] : state.cardPick.filter((k) => k !== x.key);
      changed();
      drawCards();
    }, { value: x.key }));
    watch(fs, () => {
      const picked = cardSpecies().map((x) => x.key), full = picked.length >= LIMITS.species;
      boxes.forEach((c, i) => { c.input.checked = picked.includes(all[i].key); c.input.disabled = full && !c.input.checked; });
      const msg = full ? `Hai scelto ${LIMITS.species} schede: è il massimo.` : '';
      if (note.textContent !== msg) note.textContent = msg;
    });
    fs.append(h('div', { class: 'q-chips' }, boxes.map((c) => c.el)), note);
    body.append(fs);
  }
  const cards = h('div', { class: 'q-cards' });
  body.append(cards);
  function drawCards() {
    const list = cardSpecies();
    cards.replaceChildren(...(list.length ? list.map((x) => {
      const card = (state.cards[x.key] ||= cardItem());
      const content = h('div', { class: 'q-card-body' });
      renderFields(content, SPECIES_FIELDS, card);
      return h('details', { class: 'q-card q-species', open: true, 'data-card': x.key }, h('summary', {}, h('span', { class: 'q-card-title' }, x.title)), content);
    }) : [h('p', { class: 'q-muted' }, 'Quando scegli una specie, qui compare la sua scheda.')]));
  }
  drawCards();
}

// ---------------------------------------------------------------------------------------------
// Dalle risposte al corpo dell'invio (solo domande visibili e non vuote)
// ---------------------------------------------------------------------------------------------
function valueOut(f, card) {
  if (f.when && !f.when(card)) return undefined;
  const v = getV(f, card);
  switch (f.t) {
    case 'choice': return v == null || v === '' ? undefined : v;
    case 'multi': case 'months': return Array.isArray(v) && v.length ? [...v] : undefined;
    case 'texts': { const out = [...new Set((v || []).map((x) => clean(x.value, f.max)).filter(Boolean))]; return out.length ? out : undefined; }
    case 'area': case 'text': return clean(v, f.max) || undefined;
    default: return undefined;
  }
}
function speciesEntries() {
  return cardSpecies().map((x) => {
    const card = state.cards[x.key] || cardItem();
    const value = { id: x.id, ...(x.id === S.OTHER_SPECIES ? { name: x.name } : {}) };
    for (const f of SPECIES_FIELDS) { const v = valueOut(f, card); if (v !== undefined) value[f.path.split('.')[1]] = v; }
    return { ...x, value };
  });
}
function answersOut() {
  const answers = {}, profile = {};
  for (const f of A_FIELDS) { const v = valueOut(f); if (v !== undefined) profile[f.path.split('.')[1]] = v; }
  if (Object.keys(profile).length) answers.profile = profile;
  const species = speciesEntries().map((e) => e.value);
  if (species.length) answers.species = species;
  const where = valueOut(C_FIELDS[0]), opinion = valueOut(C_FIELDS[1]);
  if (where) answers.barrenZones = { where, ...(opinion ? { opinion } : {}) };
  const warning = valueOut(C_FIELDS[2]);
  if (warning) answers.warning = warning;
  const report = valueOut(D_FIELDS[0]);
  if (report) answers.willReport = report;
  return answers;
}
function payload() {
  const contact = wantsContact();
  const respondent = {};
  const name = contact ? clean(state.respondent.name, RESPONDENT.name) : '', reach = contact ? clean(state.respondent.contact, RESPONDENT.contact) : '';
  if (name) respondent.name = name;
  if (reach) respondent.contact = reach;
  return {
    survey: SURVEY_ID,
    version: SURVEY_VERSION,
    startedAt: state.startedAt || new Date().toISOString(),
    // Campo trappola: nella pagina ha un nome neutro (q-lascia-vuoto), nel corpo la chiave resta «website».
    website: $('#q-lascia-vuoto')?.value || '',
    respondent,
    consent: { anonymousUse: state.consent.anonymousUse === true, recontact: contact },
    answers: answersOut(),
  };
}

// ---------------------------------------------------------------------------------------------
// Riepilogo: mostra esattamente ciò che parte con l'invio
// ---------------------------------------------------------------------------------------------
function fmtValue(f, v) {
  switch (f.t) {
    case 'choice': return labelOf(optionsOf(f), v);
    case 'multi': return v.map((x) => labelOf(optionsOf(f), x)).join(', ');
    case 'months': return v.map((x) => (x === DONT_KNOW ? 'Non so' : cap(x))).join(', ');
    case 'texts': return v.join(', ');
    default: return String(v);
  }
}
function summarize(fields, card) {
  const rows = [];
  for (const f of fields) { const v = valueOut(f, card); if (v !== undefined) rows.push([f.short || f.label, fmtValue(f, v)]); }
  return rows;
}
function speciesSummary() {
  return speciesEntries().map((e) => ({ label: e.title, rows: summarize(SPECIES_FIELDS, state.cards[e.key] || cardItem()), empty: 'Scheda vuota: parte solo il nome della specie.' }));
}
function rowsEl(rows) {
  const dl = h('dl', { class: 'q-dl' });
  for (const r of rows) {
    if (Array.isArray(r)) dl.append(h('dt', {}, r[0]), h('dd', {}, r[1]));
    else dl.append(h('dt', {}, r.label), h('dd', {}, r.rows.length ? rowsEl(r.rows) : h('span', { class: 'q-muted' }, r.empty || '—')));
  }
  return dl;
}

// ---------------------------------------------------------------------------------------------
// Passi
// ---------------------------------------------------------------------------------------------
const HASH = { intro: 'inizio', riepilogo: 'riepilogo', inviato: 'inviato', ...Object.fromEntries(PART_KEYS.map((k) => [k, `parte-${k.toLowerCase()}`])) };
const fromHash = (hash) => { const x = hash.replace(/^#/, ''); if (!x) return 'intro'; return Object.keys(HASH).find((k) => HASH[k] === x) || null; };
const stepAllowed = (step) => step === 'intro' || step === 'riepilogo' || isPart(step);

function go(step, { push = true } = {}) {
  state.step = step;
  if (isPart(step) && !state.startedAt) state.startedAt = new Date().toISOString();
  save();
  render();
  if (push) { try { history.pushState({ q: step }, '', `#${HASH[step]}`); } catch { /* cronologia non disponibile */ } }
  focusTitle();
}
function focusTitle() {
  const t = $('#q-step-title');
  if (!t) return;
  t.focus({ preventScroll: true });
  // ogni passo comincia dall'alto (l'avanzamento resta incollato in cima mentre si scorre)
  window.scrollTo(0, Math.max(0, ($('#q-form')?.offsetTop || 0) - 8));
}
const nextAfter = (key) => PART_KEYS[PART_KEYS.indexOf(key) + 1] || 'riepilogo';
const prevBefore = (key) => PART_KEYS[PART_KEYS.indexOf(key) - 1] || 'intro';

function renderProgress() {
  const box = $('#q-progress');
  box.replaceChildren();
  const i = PART_KEYS.indexOf(state.step);
  if (i < 0 && state.step !== 'riepilogo') { box.hidden = true; return; }
  box.hidden = false;
  const fill = h('span', { class: 'q-bar-fill' });
  fill.style.width = `${Math.round(((i < 0 ? PART_KEYS.length + 1 : i + 1) / (PART_KEYS.length + 1)) * 100)}%`;
  box.append(
    h('p', { class: 'q-count' }, i < 0 ? 'Riepilogo' : `Parte ${i + 1} di ${PART_KEYS.length}`),
    h('div', { class: 'q-bar', 'aria-hidden': 'true' }, fill));
}

function stepSection(title, prefix) {
  return h('section', { class: 'q-step', 'aria-labelledby': 'q-step-title' },
    h('h2', { id: 'q-step-title', tabindex: '-1' }, prefix ? h('span', { class: 'q-sr' }, `${prefix}: `) : null, title));
}

function render() {
  watchers = [];
  const host = $('#q-step');
  host.replaceChildren();
  renderProgress();
  if (state.step === 'intro') renderIntro(host);
  else if (state.step === 'riepilogo') renderSummary(host);
  else if (state.step === 'inviato') renderSent(host);
  else renderPart(host, partBy(state.step) || PARTS[0]);
}

// Ricevute: la chiave non dipende dalla versione; si leggono anche quelle salvate dalla versione 1.
function readReceipts() {
  const read = (k) => { try { const r = JSON.parse(store.get(k) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; } };
  return [...OLD_KEYS.flatMap((k) => read(`${k}:ricevute`)), ...read(RECEIPTS_KEY)].filter((r) => r && typeof r.receipt === 'string' && r.sentAt)
    .sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
}

function renderIntro(host) {
  const sec = stepSection('Mi dai una mano?');
  sec.append(
    h('p', {}, 'Sono poche domande, 3 o 4 minuti, su quello che sai per abitudine: dove vai, che cosa cerchi, in che mesi, in che boschi e a che quota lo trovi di solito.'),
    h('p', {}, 'Non ti chiedo date, giorni dopo la pioggia, quantità o uscite di anni fa: nessuno le ricorda con precisione, e una risposta data a caso fa più danni di una domanda saltata.'),
    h('p', { class: 'q-box' }, h('strong', {}, '«Non so» va benissimo.'), ' Ogni domanda si può anche lasciare vuota.'),
    h('p', {}, 'Stiamo preparando un’app per le uscite a funghi nel Reatino: le tue risposte ci dicono da dove partire. Le osservazioni vere, poi, si raccolgono nel bosco, con l’app.'),
    h('ul', { class: 'q-points' },
      h('li', {}, 'I tuoi posti restano tuoi: basta la zona a grandi linee.'),
      h('li', {}, 'Non serve registrarsi.'),
      h('li', {}, 'Puoi fermarti e riprendere da questo dispositivo. Ricevo le risposte solo quando premi «Invia», alla fine.')));
  const receipts = readReceipts();
  if (receipts.length) {
    const last = receipts[receipts.length - 1];
    sec.append(h('p', { class: 'q-box' }, `Da questo dispositivo è già stato inviato un questionario ${dayText(last.sentAt)}. Codice ricevuta: `, h('strong', { class: 'q-code' }, last.receipt), '.'));
  }
  // Bozze della versione 1 (lunga): restano nel browser, ma le domande sono cambiate e non si riaprono.
  const old = OLD_KEYS.filter((k) => store.get(k));
  if (old.length) {
    const box = h('div', { class: 'q-box q-old-draft' },
      h('p', {}, 'Su questo dispositivo c’è una bozza della versione lunga del questionario. Le domande sono cambiate: quella bozza non si riapre.'),
      h('div', { class: 'q-row' }, h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: () => {
        old.forEach((k) => store.del(k));
        box.replaceChildren(h('p', { tabindex: '-1' }, 'Vecchia bozza cancellata.'));
        box.firstChild.focus();
      } }, 'Cancella la vecchia bozza')));
    sec.append(box);
  }
  if (resumeAt) sec.append(resumeBox());
  else sec.append(h('div', { class: 'q-nav' }, h('button', { type: 'button', class: 'q-btn q-btn-primary', onclick: () => go('A') }, 'Comincia')));
  host.append(sec);
}
function resumeBox() {
  const box = h('div', { class: 'q-box q-resume' });
  const ask = () => {
    const q = h('p', { tabindex: '-1' }, 'Vuoi cancellare la bozza e ricominciare? Le risposte non inviate si perdono.');
    box.replaceChildren(q, h('div', { class: 'q-row' },
      h('button', { type: 'button', class: 'q-btn q-btn-primary', onclick: () => {
        store.del(KEY);
        state = blank();
        resumeAt = null;
        render();
        focusTitle();
        announce('Bozza cancellata. Puoi ricominciare.');
      } }, 'Sì, cancella la bozza'),
      h('button', { type: 'button', class: 'q-btn', onclick: () => { box.replaceWith(resumeBox()); $('.q-resume button')?.focus(); } }, 'No, tienila')));
    q.focus();
  };
  box.append(h('p', {}, `Hai una bozza salvata ${dayText(resumeAt)}.`), h('div', { class: 'q-row' },
    h('button', { type: 'button', class: 'q-btn q-btn-primary', onclick: () => {
      resumeAt = null;
      const step = savedStep;
      go(step !== 'intro' && step !== 'inviato' && stepAllowed(step) ? step : 'A');
      announce('Bozza ripresa.');
    } }, 'Riprendi la bozza'),
    h('button', { type: 'button', class: 'q-btn', onclick: ask }, 'Ricomincia')));
  return box;
}

function renderPart(host, part) {
  const n = PART_KEYS.indexOf(part.key) + 1;
  const sec = stepSection(part.title, `Parte ${n} di ${PART_KEYS.length}`);
  for (const t of [].concat(part.intro || [])) sec.append(h('p', { class: 'q-intro' }, t));
  const body = h('div', { class: 'q-body' });
  if (part.render) part.render(body, part); else renderFields(body, part.fields);
  sec.append(body);
  const next = nextAfter(part.key), prev = prevBefore(part.key);
  sec.append(h('div', { class: 'q-nav' },
    h('button', { type: 'button', class: 'q-btn', onclick: () => go(prev) }, 'Indietro'),
    h('button', { type: 'button', class: 'q-btn q-btn-primary', onclick: () => go(next) }, next === 'riepilogo' ? 'Vai al riepilogo' : 'Avanti')));
  host.append(sec);
}

function renderSummary(host) {
  const sec = stepSection('Riepilogo e invio');
  sec.append(h('p', { class: 'q-intro' }, 'Controlla le risposte. Con «Modifica» torni a quella parte e cambi quello che vuoi.'));
  for (const part of PARTS) {
    const id = uid('s');
    const rows = part.summary ? part.summary() : summarize(part.fields);
    sec.append(h('section', { class: 'q-sum', 'aria-labelledby': id },
      h('div', { class: 'q-sum-head' }, h('h3', { id }, part.title),
        h('button', { type: 'button', class: 'q-btn q-btn-small', 'aria-label': `Modifica: ${part.title}`, onclick: () => go(part.key) }, 'Modifica')),
      rows.length ? rowsEl(rows) : h('p', { class: 'q-muted' }, 'Nessuna risposta.')));
  }
  const p = payload();
  const who = [p.respondent.name, p.respondent.contact].filter(Boolean);
  sec.append(h('div', { class: 'q-box q-send-what' }, h('h3', {}, 'Cosa inviamo'), h('ul', {},
    h('li', {}, 'Le risposte qui sopra. Le domande lasciate vuote non partono.'),
    h('li', {}, who.length ? `Nome e contatto: ${who.join(', ')}.` : 'Nessun nome e nessun contatto.'),
    h('li', {}, `Ricontatto: ${p.consent.recontact ? 'sì' : 'no'}.${p.consent.recontact && !p.respondent.contact ? ' Senza un contatto non posso ricontattarti: se vuoi, aggiungilo in «Con l’app».' : ''}`),
    h('li', {}, 'I dati tecnici dell’invio descritti nell’informativa.'),
    h('li', {}, 'Non inviamo la tua posizione. L’indirizzo IP non viene salvato.'))));
  sec.append(consentControl());
  const error = h('div', { id: 'q-send-error', class: 'q-box q-box-crit', role: 'alert', hidden: true });
  const status = h('p', { class: 'q-status', role: 'status' });
  const sendBtn = h('button', { type: 'button', class: 'q-btn q-btn-primary q-send', onclick: () => send(sendBtn, error, status) }, 'Invia');
  sec.append(error, h('div', { class: 'q-nav' }, h('button', { type: 'button', class: 'q-btn', onclick: () => go(PART_KEYS.at(-1)) }, 'Indietro'), sendBtn), status);
  host.append(sec);
}

// Contatto del titolare: lo stesso indirizzo dell'informativa in fondo alla pagina (una sola copia nella pagina;
// un test lo confronta con data/legal.json). Senza indirizzo si rimanda all'informativa.
function contactLink() {
  const a = document.querySelector('#informativa a[href^="mailto:"]');
  if (!a) return ['scrivigli usando i contatti dell’', h('a', { href: '#informativa' }, 'informativa'), ' qui sotto'];
  return ['scrivi a ', h('a', { href: a.getAttribute('href') }, a.textContent)];
}
function renderSent(host) {
  const sec = stepSection('Grazie!');
  sec.append(h('p', { class: 'q-intro' }, 'Abbiamo ricevuto le tue risposte.'));
  if (sent?.receipt) {
    const copy = h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: async () => {
      try { await navigator.clipboard.writeText(sent.receipt); announce('Codice copiato.'); copy.textContent = 'Copiato'; } catch { announce('Non riesco a copiare: scrivi il codice a mano.'); }
    } }, 'Copia il codice');
    sec.append(h('div', { class: 'q-box q-receipt-box' },
      h('p', {}, 'Il tuo codice ricevuta:'),
      h('p', { class: 'q-receipt', 'data-receipt': '' }, sent.receipt),
      h('div', { class: 'q-row' }, copy),
      h('p', {}, 'Conservalo. Se un giorno vuoi cancellare le risposte, scrivimi e mandami questo codice: ', ...contactLink(), '.')));
  }
  // Invito al campo: le segnalazioni fatte sul momento valgono più di qualsiasi ricordo.
  sec.append(h('div', { class: 'q-box q-app-invite' },
    h('h3', {}, 'E adesso, nel bosco'),
    h('p', {}, 'Quello che annoti sul momento vale più di qualsiasi ricordo. Quando sei nel bosco, apri Fronda e tocca «Annota»: segna subito cosa hai trovato, oppure che non hai trovato niente, e quanto hai cercato.'),
    h('p', { class: 'q-row' }, h('a', { href: '/', class: 'q-btn q-btn-primary' }, 'Apri Fronda'))));
  sec.append(h('p', { class: 'q-muted' }, 'La bozza su questo dispositivo è stata cancellata.'),
    h('div', { class: 'q-row' }, h('button', { type: 'button', class: 'q-btn', onclick: () => { sent = null; state = blank(); go('intro'); } }, 'Compila un altro questionario')));
  host.append(sec);
}

// ---------------------------------------------------------------------------------------------
// Invio
// ---------------------------------------------------------------------------------------------
const PART_OF_PATH = { profile: 'A', species: 'B', barrenZones: 'C', warning: 'C', willReport: 'D', respondent: 'D', consent: 'D' };
function partsOf(errors) {
  const keys = new Set();
  for (const e of errors || []) {
    const path = typeof e === 'string' ? e : (e?.path ?? e?.field ?? '');
    const m = String(path).replace(/^answers\./, '').match(/^([A-Za-z]+)/);
    if (m && PART_OF_PATH[m[1]]) keys.add(PART_OF_PATH[m[1]]);
  }
  return [...keys].map(partBy).filter(Boolean);
}
function showError(box, message, { parts = [], details = [], kind = 'send' } = {}) {
  box.dataset.kind = kind;
  box.replaceChildren(h('p', {}, message));
  const msgs = details.map((d) => (typeof d === 'string' ? d : d?.message)).filter(Boolean).slice(0, 6);
  if (msgs.length) box.append(h('ul', {}, msgs.map((m) => h('li', {}, m))));
  if (parts.length) box.append(h('p', { class: 'q-row' }, 'Controlla:', parts.map((p) => h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: () => go(p.key) }, p.title))));
  box.hidden = false;
}
function retryText(res) {
  const s = Number(res.headers.get('retry-after'));
  if (!Number.isFinite(s) || s <= 0) return 'Riprova più tardi.';
  // al singolare «un minuto» e «un’ora», non «1 minuti» o «1 ore»
  const minutes = Math.max(1, Math.round(s / 60));
  if (minutes < 60) return minutes === 1 ? 'Riprova tra circa un minuto.' : `Riprova tra circa ${minutes} minuti.`;
  const hours = Math.round(s / 3600);
  return hours === 1 ? 'Riprova tra circa un’ora.' : `Riprova tra circa ${hours} ore.`;
}
let sending = false;
async function send(btn, error, status) {
  if (sending) return;
  error.hidden = true;
  if (!state.consent.anonymousUse) {
    showError(error, 'Per inviare serve il tuo consenso: spunta la casella qui sopra.', { kind: 'consent' });
    const box = $('[data-consent]');
    box?.setAttribute('aria-invalid', 'true');
    // l'errore resta legato alla casella: si rilegge tornandoci sopra
    if (box && !/\bq-send-error\b/.test(box.getAttribute('aria-describedby') || '')) box.setAttribute('aria-describedby', `${box.getAttribute('aria-describedby') || ''} q-send-error`.trim());
    box?.focus();
    return;
  }
  const body = payload();
  if (!S.hasSurveyAnswers(body.answers)) {
    showError(error, 'Per inviare, rispondi ad almeno una domanda. Puoi anche scegliere «Non so».');
    return;
  }
  let check;
  // Il campo trappola lo giudica solo il server (201 finto): qui un errore su un campo invisibile
  // bloccherebbe la persona senza rimedio e mostrerebbe la trappola a chi esegue la pagina.
  try { check = S.validateSurvey({ ...body, website: '' }); } catch { check = { ok: true }; }
  if (check && check.ok === false) {
    showError(error, 'Alcune risposte non vanno bene.', { details: check.errors || [], parts: partsOf(check.errors) });
    return;
  }
  const json = JSON.stringify(body);
  if (new TextEncoder().encode(json).length > MAX_BYTES) { showError(error, 'Le risposte sono troppo lunghe per un solo invio. Accorcia i testi più lunghi e riprova.'); return; }
  sending = true;
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  status.textContent = 'Invio in corso…';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: json, credentials: 'same-origin', cache: 'no-store', signal: ctrl.signal });
  } catch {
    res = null;
  } finally {
    clearTimeout(timer);
    sending = false;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    status.textContent = '';
  }
  save(true);
  if (!res) { showError(error, 'Non riesco a inviare: sembra che manchi la connessione. Le risposte restano salvate su questo dispositivo. Riprova quando hai campo.'); return; }
  const data = await res.json().catch(() => ({}));
  if (res.status === 201 || res.ok) {
    sent = { receipt: typeof data.receipt === 'string' ? data.receipt : '' };
    if (sent.receipt) store.set(RECEIPTS_KEY, JSON.stringify([...readReceipts(), { receipt: sent.receipt, sentAt: new Date().toISOString() }].slice(-5)));
    store.del(KEY);
    $('#q-saved').textContent = '';
    state = blank();
    state.step = 'inviato';
    render();
    try { history.replaceState({ q: 'inviato' }, '', `#${HASH.inviato}`); } catch { /* cronologia non disponibile */ }
    focusTitle();
    return;
  }
  const msg = typeof data.error === 'string' && data.error ? data.error : '';
  if (res.status === 400) {
    // pagina rimasta aperta con una versione vecchia del questionario: il server chiede di ricaricare
    if ((data.fields || []).includes('version')) { showError(error, msg || 'Il questionario è cambiato: ricarica la pagina.'); return; }
    // un solo errore: il messaggio del server basta; più errori: l'elenco, senza ripetere il titolo
    const details = Array.isArray(data.errors) && data.errors.length > 1 ? data.errors : [];
    showError(error, msg && !details.length ? `Alcune risposte non vanno bene: ${msg}` : 'Alcune risposte non vanno bene.', { details, parts: partsOf(data.errors || data.fields) });
  }
  else if (res.status === 403) showError(error, 'L’invio è stato rifiutato da questa pagina. Apri il questionario dal link che hai ricevuto e riprova: le risposte restano salvate.');
  else if (res.status === 413) showError(error, 'Le risposte sono troppo lunghe per un solo invio. Accorcia i testi più lunghi e riprova.');
  else if (res.status === 429) showError(error, data.code === 'daily-limit'
    ? `Per oggi il questionario ha ricevuto tutte le risposte che può accettare. ${retryText(res)} Le tue risposte restano salvate su questo dispositivo.`
    : `Da questa connessione sono già arrivati troppi invii oggi. ${retryText(res)} Le risposte restano salvate.`);
  else showError(error, `Il servizio non risponde come dovrebbe${msg ? ` (${msg})` : ''}. Le risposte restano salvate su questo dispositivo: riprova tra poco.`);
}

// ---------------------------------------------------------------------------------------------
// Suggerimenti per zone e specie (datalist nativi: funzionano con tastiera, lettori di schermo e telefono)
// ---------------------------------------------------------------------------------------------
function fillList(id, names) {
  const list = $(`#${id}`);
  if (!list) return;
  list.replaceChildren(...[...new Set(names)].filter((n) => typeof n === 'string' && n.trim()).map((n) => h('option', { value: n })));
}
// Specie «altra»: nomi italiani e latini del catalogo, in un file statico generato (tools/build_survey_lists.mjs).
async function loadSpeciesNames() {
  let names = SPECIES.map((x) => x.label);
  try {
    const m = await import('./survey-species-names.js');
    if (Array.isArray(m.SPECIES_NAME_OPTIONS)) names = [...names, ...m.SPECIES_NAME_OPTIONS];
  } catch { /* elenco facoltativo: restano le specie principali */ }
  fillList('q-species-list', names.filter((n) => typeof n === 'string' && n.length <= LIMITS.speciesName));
}

// ---------------------------------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------------------------------
function failed() {
  $('#q-loading')?.setAttribute('hidden', '');
  $('#q-fail')?.removeAttribute('hidden');
}
async function main() {
  try { S = await import('./survey-schema.js'); } catch { failed(); return; }
  ({ SURVEY_ID, SURVEY_VERSION, SURVEY_ENDPOINT: ENDPOINT, MAX_BODY_BYTES: MAX_BYTES, DONT_KNOW } = S);
  KEY = `fronda:questionario:${SURVEY_ID}:v${SURVEY_VERSION}`;
  RECEIPTS_KEY = `fronda:questionario:${SURVEY_ID}:ricevute`;
  OLD_KEYS = Array.from({ length: SURVEY_VERSION - 1 }, (_, i) => `fronda:questionario:${SURVEY_ID}:v${i + 1}`);
  SPECIES = (S.SPECIES || []).map((x) => opt(x.id, x.label));
  FORESTS = (S.FORESTS || []).map((x) => opt(x, cap(x)));
  YEARS = fromSchema(S.EXPERIENCE_YEARS);
  ELEVATION = fromSchema(S.ELEVATION_BANDS);
  REPORT = fromSchema(S.REPORT_INTENT);
  REACHABLE = [...(S.REPORT_REACHABLE || [])];
  MONTHS = Array.isArray(S.MONTHS) ? [...S.MONTHS] : [];
  MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
  RESPONDENT = { ...S.RESPONDENT_LIMITS };
  LIMITS = { ...S.LIST_LIMITS, speciesName: S.fieldSpec('species.name')?.max };
  try {
    if (!SPECIES.length || !FORESTS.length || !YEARS.length || !ELEVATION.length || !REPORT.length || !REACHABLE.length || MONTHS.length !== 12
      || !ENDPOINT || !Number.isInteger(LIMITS.species) || !Number.isInteger(LIMITS.speciesName)) throw new Error('Schema incompleto');
    for (const fields of [A_FIELDS, SPECIES_FIELDS, C_FIELDS, D_FIELDS]) applySpec(fields);
  } catch (e) { console.error(e); failed(); return; }

  const openPrivacy = () => {
    const details = document.getElementById('informativa');
    if (details) details.open = true;
  };
  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href="#informativa"]')) openPrivacy();
  });
  if (location.hash === '#informativa') openPrivacy();
  const draft = loadDraft();
  if (draft) { state = merge(blank(), draft.state); resumeAt = draft.savedAt || new Date().toISOString(); }
  if (location.hash && fromHash(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch { /* cronologia non disponibile */ } }
  // si apre sempre dall'inizio: con una bozza, l'inizio chiede se riprenderla e «Riprendi» torna alla parte salvata
  savedStep = state.step;
  state.step = 'intro';
  fillList('q-zone-list', S.ZONE_SUGGESTIONS || []);
  loadSpeciesNames();

  const form = $('#q-form');
  form.addEventListener('submit', (e) => e.preventDefault());
  addEventListener('popstate', () => {
    if (state.step === 'inviato' || resumeAt) return;
    const target = fromHash(location.hash);
    if (!target || target === state.step || !stepAllowed(target)) return;
    go(target, { push: false });
  });
  addEventListener('pagehide', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(true); });

  render();
  $('#q-loading')?.setAttribute('hidden', '');
  form.hidden = false;
}
main().catch(failed);
