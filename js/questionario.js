// Questionario per cercatori esperti del Reatino (pagina /questionario).
// Compilazione a parti, con bozza salvata nel browser: al server arriva qualcosa solo dopo «Invia».
// Elenchi chiusi, risposte rapide e validazione vengono da survey-schema.js, lo stesso modulo del Worker.
// Regola della pagina: nessuna risposta preimpostata. Numeri vuoti finché la persona non scrive,
// nessuna opzione già scelta, nessun esempio numerico; «Non so» sempre possibile.

// Tutto ciò che riguarda il contratto con il server (nome e versione del questionario, indirizzo,
// elenchi, limiti dei campi, risposte rapide) arriva da survey-schema.js in main(): qui non si ripete.
let S = {};
let SURVEY_ID = '', SURVEY_VERSION = 0, ENDPOINT = '', MAX_BYTES = 0;
let KEY = '', RECEIPTS_KEY = '';
let YEAR_MIN = 0, LAST_YEAR = 0;
let LIMITS = {}, SHORT = {}, RESPONDENT = {};
let DONT_KNOW = 'non so';
let MONTHS = [], MONTHS_SHORT = [];
let ZONES = [], SPECIES = [], FORESTS = [], FACTORS = [];

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
function asOptions(x) {
  if (Array.isArray(x)) return x.map((e) => (typeof e === 'string' ? opt(e)
    : opt(e?.id ?? e?.value ?? e?.key, e?.label ?? e?.name ?? e?.nome ?? String(e?.id ?? e?.value ?? e?.key))));
  if (x && typeof x === 'object') return Object.entries(x).map(([value, v]) => opt(value, typeof v === 'string' ? v : (v?.label ?? v?.name ?? v?.nome ?? value)));
  return [];
}
const optionsOf = (f) => (typeof f.options === 'function' ? f.options() : f.options) || [];
const labelOf = (opts, v) => opts.find((o) => o.value === v)?.label ?? String(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const fmtNum = (n) => String(n).replace('.', ',');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
// Stessa pulizia del server (S.cleanText) e stesso modo di contare i caratteri (unità UTF-16, come maxlength).
function clean(s, max) {
  let t = S.cleanText(String(s ?? '')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  if (t.length > max) t = t.slice(0, /[\uD800-\uDBFF]/.test(t[max - 1]) ? max - 1 : max);
  return t.trim();
}
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------------------------------------------------------------------------------------------
// Opzioni chiuse (valori del contratto API) ed etichette
// ---------------------------------------------------------------------------------------------
// I valori ammessi vengono dallo schema (una sola fonte); qui solo le etichette mostrate.
const YES_NO = [opt('sì', 'Sì'), opt('no', 'No')];
const LABELS = {
  'non dico': 'Preferisco non dirlo', quaderno: 'Su un quaderno', 'foto con data': 'Con foto datate', telefono: 'Sul telefono', niente: 'No, niente',
  'foto o appunti': 'Da foto o appunti', memoria: 'A memoria',
};
const fromSchema = (values) => (Array.isArray(values) ? values : []).map((v) => opt(v, LABELS[v] || cap(v)));
let ATTESTATO = [], ASL_CHECK = [], NOTES = [], MONTH_PARTS = [], KINDS = [], SEEN = [], QUANTITY = [], DATE_FROM = [], RISK_GATE = [], SEASON_GATE = [], WEATHER_GATE = [];
const WEEKS = [opt(1, 'Prima'), opt(2, 'Seconda'), opt(3, 'Terza'), opt(4, 'Quarta'), opt(5, 'Quinta')];
const CONFIDENCE = [opt(1, '1'), opt(2, '2'), opt(3, '3'), opt(4, '4'), opt(5, '5')];
// Vero se lo schema ha dato tutti gli elenchi chiusi che la pagina mostra.
function loadOptions() {
  ATTESTATO = fromSchema(S.ATTESTATO);
  ASL_CHECK = fromSchema(S.ASL_CHECK);
  NOTES = fromSchema(S.NOTE_KINDS);
  MONTH_PARTS = fromSchema(S.MONTH_PARTS);
  KINDS = fromSchema(S.EVENT_KINDS);
  SEEN = fromSchema(S.SEEN);
  QUANTITY = fromSchema(S.QUANTITIES);
  DATE_FROM = fromSchema(S.DATE_FROM);
  RISK_GATE = fromSchema(S.RISK_GATE);
  SEASON_GATE = fromSchema(S.SEASON_GATE);
  WEATHER_GATE = fromSchema(S.WEATHER_GATE);
  // L'ordine dei fattori si mescola una volta per bozza: nessun fattore parte «in testa».
  FACTORS = asOptions(S.RANKING_FACTORS);
  MONTHS = Array.isArray(S.MONTHS) ? [...S.MONTHS] : [];
  MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
  return [ATTESTATO, ASL_CHECK, NOTES, MONTH_PARTS, KINDS, SEEN, QUANTITY, DATE_FROM, RISK_GATE, SEASON_GATE, WEATHER_GATE, FACTORS].every((l) => l.length) && MONTHS.length === 12;
}
const UNITS = { anni: ['anno', 'anni'], uscite: ['uscita', 'uscite'], giorni: ['giorno', 'giorni'], ore: ['ora', 'ore'], m: ['m', 'm'] };
const UNIT_SR = { m: 'in metri', giorni: 'in giorni', ore: 'in ore', anni: 'in anni' };
const unitText = (u, n) => (UNITS[u] ? UNITS[u][n === 1 ? 0 : 1] : u);

// Risposte rapide della domanda (QUICK_ANSWERS dello schema: options, exclusive, single).
// «Non so» è sempre ammesso e non si combina con altre scelte; «Altro…» apre il testo libero.
function quickFor(path, omit = []) {
  const q = path ? S.QUICK_ANSWERS?.[path] : null;
  if (!q) return null;
  const values = (Array.isArray(q) ? q : q.options || []).filter((v) => typeof v === 'string' && v !== DONT_KNOW && !omit.includes(v));
  return { options: values.map((v) => opt(v, cap(v))), exclusive: new Set([...(q.exclusive || []), DONT_KNOW]), single: !!q.single };
}

// ---------------------------------------------------------------------------------------------
// Stato e bozza
// ---------------------------------------------------------------------------------------------
const open0 = () => ({ quick: [], text: '' });
const opens = (...keys) => Object.fromEntries(keys.map((k) => [k, open0()]));
function blank() {
  return {
    format: 1, mode: null, step: 'intro', startedAt: null, skipped: {},
    profile: { years: null, mentor: open0(), zones: [], zonesOther: '', tripsGoodYear: null, tripsBadYear: null, speciesSought: [], attestato: null, aslCheck: null, notes: [], notesSince: null },
    speciesChosen: [], speciesData: {},
    rain: opens('goodRain', 'drySummer', 'flushEnd', 'lowRainSpecies'),
    weather: { remembers: null }, weatherEvents: [],
    flushes: [], emptyTrips: [],
    forest: { ...opens('aspect', 'cutAge', 'microsites', 'soil', 'reliableSpots', 'indicators'), ranking: [], order: shuffle(FACTORS.map((f) => f.value)) },
    access: opens('gates', 'navigators', 'localRules', 'parks', 'crowding', 'parking'),
    risks: { ...opens('confusions', 'poisonings', 'beginnerErrors', 'avoided', 'mountainDangers'), knowsPoisonings: null, avoidsSpecies: null },
    followUp: opens('knowsOthers'),
    consent: { anonymousUse: false, recontact: null, diary: null },
    respondent: { name: '', contact: '' },
  };
}
const speciesItem = (id) => ({ id, name: '', start: null, peak: null, end: null, seasonChanged: null, changed: open0(), elevMin: null, elevMax: null, elevMode: null,
  forests: [], forestsNever: [], lagMin: null, lagTyp: null, lagMax: null, flushDays: null, confidence: null });
const eventItem = () => ({ year: null, month: null, zone: '', kind: null, effect: open0(), daysAfter: null, seen: null });
const flushItem = () => ({ year: null, month: null, week: null, zone: '', elev: null, forest: null, species: null, speciesOther: '', quantity: null, hours: null, weatherBefore: open0(), dateFrom: null });
const emptyItem = () => ({ year: null, month: null, week: null, zone: '', elev: null, forest: null, speciesSought: [], hours: null, why: open0(), dateFrom: null });

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
let savedStep = 'A'; // la parte in cui era la bozza
let sent = null; // ricevuta dell'invio appena riuscito
let storageOk = true;
let saveTimer = 0;

function loadDraft() {
  try {
    const raw = store.get(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.state?.format === 1 && d.state.mode ? d : null;
  } catch { return null; }
}
function save(now = false) {
  clearTimeout(saveTimer);
  if (now) writeDraft(); else saveTimer = setTimeout(writeDraft, 250);
}
function writeDraft() {
  if (!state.mode || sent) return;
  const savedAt = new Date().toISOString();
  storageOk = store.set(KEY, JSON.stringify({ savedAt, state }));
  const el = $('#q-saved');
  if (el) el.textContent = storageOk ? `Bozza salvata su questo dispositivo alle ${clock(savedAt)}.` : 'Questo browser non salva la bozza: non chiudere la pagina prima di inviare.';
}
const clock = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const dayText = (iso) => { const d = new Date(iso); return `il ${d.getDate()} ${MONTHS[d.getMonth()]} alle ${clock(iso)}`; };

const PART_KEYS = 'ABCDEFGHI'.split('');
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
// Domande. t = tipo; brief = anche nella versione breve; when = solo dopo una certa risposta.
// ---------------------------------------------------------------------------------------------
const contactOn = () => state.consent.recontact === 'sì' || state.consent.diary === 'sì';
// «Non è cambiata» resta tra le risposte rapide dello schema (risposte già valide), ma nella pagina lo dice il «No» del cancello.
const NOT_CHANGED = 'non è cambiata';
const elevCheck = (o) => {
  const [a, m, b] = [o.elevMin, o.elevMode, o.elevMax];
  if (isNum(a) && isNum(b) && a > b) return 'La quota più bassa è sopra la più alta: controlla.';
  if (isNum(m) && ((isNum(a) && m < a) || (isNum(b) && m > b))) return 'La quota più frequente è fuori da quelle che hai scritto: controlla.';
  return '';
};
const lagCheck = (o) => {
  const [a, m, b] = [o.lagMin, o.lagTyp, o.lagMax];
  if (isNum(a) && isNum(b) && a > b) return 'Il minimo è sopra il massimo: controlla.';
  if (isNum(m) && ((isNum(a) && m < a) || (isNum(b) && m > b))) return 'Il «di solito» è fuori da minimo e massimo: controlla.';
  return '';
};

const A_FIELDS = [
  { t: 'num', k: 'years', short: 'Anni di esperienza', label: 'Da quanti anni vai per funghi?', unit: 'anni', brief: true },
  { t: 'open', k: 'mentor', path: 'profile.mentor', short: 'Chi ti ha insegnato', label: 'Chi ti ha insegnato?' },
  { t: 'order', k: 'zones', short: 'Zone più frequentate', label: 'In quali zone vai più spesso?', hint: 'Tocca le zone in ordine, dalla più frequentata. Tocca di nuovo una zona per toglierla.', options: () => ZONES, brief: true },
  { t: 'text', k: 'zonesOther', short: 'Altre zone', label: 'Altre zone o località', hint: 'Facoltativo. Basta il nome del comune o della località.', list: 'zone', brief: true },
  { t: 'num', k: 'tripsGoodYear', short: 'Uscite in un anno buono', label: 'Quante uscite fai in un anno buono?', unit: 'uscite' },
  { t: 'num', k: 'tripsBadYear', short: 'Uscite in un anno scarso', label: 'E in un anno scarso?', unit: 'uscite' },
  { t: 'multi', k: 'speciesSought', short: 'Funghi che cerchi', label: 'Quali funghi cerchi davvero?', hint: 'Quelli per cui esci apposta. Puoi sceglierne più di uno.', options: () => SPECIES, brief: true },
  { t: 'choice', k: 'attestato', short: 'Attestato micologico', label: 'Hai l’attestato micologico (il tesserino)?', hint: 'Facoltativo.', options: () => ATTESTATO },
  { t: 'choice', k: 'aslCheck', short: 'Controllo ASL', label: 'Fai controllare i funghi all’Ispettorato micologico della ASL?', hint: 'Facoltativo.', options: () => ASL_CHECK },
  { t: 'multi', k: 'notes', short: 'Annoti le uscite', label: 'Annoti le tue uscite?', hint: 'Puoi scegliere più risposte.', options: () => NOTES, exclusive: 'niente' },
  { t: 'num', k: 'notesSince', short: 'Annoti dal', label: 'Da che anno le annoti?', when: (o) => o.notes.some((n) => n !== 'niente') },
];
const SPECIES_FIELDS = [
  { t: 'group', label: 'Quando esce?', hint: 'Mese e parte del mese. Se non lo sai, lascia vuoto.', brief: true, fields: [
    { t: 'month', k: 'start', short: 'Comincia', label: 'Quando comincia', part: true, brief: true },
    { t: 'month', k: 'peak', short: 'Picco', label: 'Quando c’è il picco', part: true, brief: true },
    { t: 'month', k: 'end', short: 'Finisce', label: 'Quando finisce', part: true, brief: true },
  ] },
  // Il cancello si invia (sì, no, non so), come quelli dei rischi; il dettaglio si chiede solo dopo un «Sì».
  { t: 'choice', k: 'seasonChanged', short: 'La stagione è cambiata', label: 'La stagione è cambiata negli anni?', options: () => SEASON_GATE },
  { t: 'open', k: 'changed', path: 'species.changed', short: 'Come è cambiata la stagione', label: 'Come è cambiata?', when: (o) => o.seasonChanged === 'sì', omitQuick: [NOT_CHANGED] },
  { t: 'group', label: 'A che quota la trovi?', hint: 'In metri, anche a occhio.', brief: true, check: elevCheck, fields: [
    { t: 'num', k: 'elevMin', short: 'Quota più bassa', label: 'Quota più bassa', unit: 'm', brief: true },
    { t: 'num', k: 'elevMax', short: 'Quota più alta', label: 'Quota più alta', unit: 'm', brief: true },
    { t: 'num', k: 'elevMode', short: 'Quota più frequente', label: 'Quota dove la trovi più spesso', unit: 'm', brief: true },
  ] },
  { t: 'multi', k: 'forests', short: 'Boschi dove la trovi', label: 'In quali boschi la trovi?', options: () => FORESTS, pairWith: 'forestsNever' },
  { t: 'multi', k: 'forestsNever', short: 'Boschi dove non l’hai mai trovata', label: 'In quali boschi non l’hai mai trovata?', options: () => FORESTS, pairWith: 'forests' },
  { t: 'group', label: 'Dopo una pioggia buona, quanti giorni passano prima che esca?', check: lagCheck, fields: [
    { t: 'num', k: 'lagMin', short: 'Giorni dopo la pioggia, al più presto', label: 'Al più presto', unit: 'giorni' },
    { t: 'num', k: 'lagTyp', short: 'Giorni dopo la pioggia, di solito', label: 'Di solito', unit: 'giorni' },
    { t: 'num', k: 'lagMax', short: 'Giorni dopo la pioggia, al più tardi', label: 'Al più tardi', unit: 'giorni' },
  ] },
  { t: 'num', k: 'flushDays', short: 'Durata di una buttata', label: 'Quanto dura una buttata?', unit: 'giorni' },
  { t: 'confidence', k: 'confidence', short: 'Quanto sei sicuro', label: 'Quanto sei sicuro di queste risposte?', hint: '1 vuol dire poco sicuro, 5 molto sicuro.', options: CONFIDENCE },
];
const C_FIELDS = [
  { t: 'open', k: 'goodRain', path: 'rain.goodRain', short: 'Pioggia buona', label: 'Per te, cos’è una pioggia buona per i funghi?' },
  { t: 'open', k: 'drySummer', path: 'rain.drySummer', short: 'Dopo un’estate secca', label: 'Dopo un’estate secca, cosa succede?' },
  { t: 'open', k: 'flushEnd', path: 'rain.flushEnd', short: 'Cosa fa finire una buttata', label: 'Cosa fa finire una buttata?' },
  { t: 'open', k: 'lowRainSpecies', path: 'rain.lowRainSpecies', short: 'Specie con poca pioggia', label: 'Ci sono specie che escono anche con poca pioggia? Quali?' },
];
const zoneField = { t: 'text', k: 'zone', short: 'Zona', label: 'In che zona?', hint: 'Basta la zona o il comune.', list: 'zone', mine: true };
const yearField = { t: 'year', k: 'year', short: 'Anno', label: 'In che anno?' };
const monthField = { t: 'month', k: 'month', short: 'Mese', label: 'In che mese?' };
const weekField = { t: 'choice', k: 'week', short: 'Settimana', label: 'In che settimana del mese?', options: WEEKS };
const elevField = { t: 'num', k: 'elev', short: 'Quota', label: 'A che quota, più o meno?', unit: 'm' };
const forestField = { t: 'choice', k: 'forest', short: 'Bosco', label: 'In che bosco?', options: () => FORESTS };
const hoursField = { t: 'num', k: 'hours', short: 'Ore di ricerca', label: 'Quante ore hai cercato?', unit: 'ore' };
const dateFromField = { t: 'choice', k: 'dateFrom', short: 'La data viene da', label: 'La data la ricordi da foto o appunti, o a memoria?', options: () => DATE_FROM };
const EVENT_FIELDS = [
  yearField, monthField, zoneField,
  { t: 'choice', k: 'kind', short: 'Che cosa', label: 'Che cosa è successo?', options: () => KINDS },
  { t: 'open', k: 'effect', path: 'weatherEvents.effect', short: 'Effetto sui funghi', label: 'Che effetto ha avuto sui funghi?' },
  { t: 'num', k: 'daysAfter', short: 'Dopo quanti giorni', label: 'Dopo quanti giorni hai visto l’effetto?', unit: 'giorni' },
  { t: 'choice', k: 'seen', short: 'Fonte', label: 'L’hai visto di persona o te l’hanno raccontato?', options: () => SEEN },
];
const FLUSH_FIELDS = [
  yearField, monthField, weekField, zoneField, elevField, forestField,
  { t: 'species1', k: 'species', short: 'Specie', label: 'Quale specie?' },
  { t: 'choice', k: 'quantity', short: 'Quanti', label: 'Quanti ne hai trovati?', options: () => QUANTITY },
  hoursField,
  { t: 'open', k: 'weatherBefore', path: 'flushes.weatherBefore', short: 'Tempo nei giorni prima', label: 'Che tempo aveva fatto prima?' },
  dateFromField,
];
const EMPTY_FIELDS = [
  yearField, monthField, weekField, zoneField, elevField, forestField,
  { t: 'multi', k: 'speciesSought', short: 'Cosa cercavi', label: 'Cosa cercavi?', options: () => SPECIES, shortlist: true },
  hoursField,
  { t: 'open', k: 'why', path: 'emptyTrips.why', short: 'Perché niente', label: 'Secondo te perché non c’era niente?' },
  dateFromField,
];
const F_FIELDS = [
  { t: 'open', k: 'aspect', path: 'forest.aspect', short: 'Versante', label: 'Quale versante guardi a inizio stagione? E a fine stagione?' },
  { t: 'open', k: 'cutAge', path: 'forest.cutAge', short: 'Età del bosco', label: 'Dove trovi di più: bosco tagliato da poco, ceduo vecchio o alto fusto?' },
  { t: 'open', k: 'microsites', path: 'forest.microsites', short: 'Dove guardi prima', label: 'Dentro il bosco, dove guardi per primo?' },
  { t: 'open', k: 'soil', path: 'forest.soil', short: 'Terreno', label: 'Che terreno preferiscono i funghi che cerchi?' },
  { t: 'open', k: 'reliableSpots', path: 'forest.reliableSpots', short: 'Posti che rendono ogni anno', label: 'Ci sono posti che rendono quasi ogni anno?', hint: 'Non serve dire dove sono.', detail: { value: 'sì, alcuni posti rendono quasi ogni anno', label: 'Che cosa hanno in comune? (facoltativo)' } },
  { t: 'open', k: 'indicators', path: 'forest.indicators', short: 'Segni che fanno pensare al porcino', label: 'Ci sono segni che ti fanno pensare che sia il momento del porcino?', hint: 'Indica anche quanto spesso hanno funzionato. Se non l’hai contato, va bene dirlo.' },
  { t: 'order', k: 'ranking', short: 'Fattori in ordine di importanza', label: 'Che cosa conta di più perché escano i funghi?', hint: 'Tocca i fattori in ordine di importanza: il numero si mette da solo. Puoi fermarti prima della fine.', options: () => FACTORS, shuffled: 'order', asRanking: true, undo: true },
];
const G_FIELDS = [
  { t: 'open', k: 'gates', path: 'access.gates', short: 'Sbarre e divieti', label: 'Ci sono sbarre, strade chiuse o divieti di transito da sapere?' },
  { t: 'open', k: 'navigators', path: 'access.navigators', short: 'Navigatori', label: 'Ci sono posti dove il navigatore porta fuori strada?' },
  { t: 'open', k: 'localRules', path: 'access.localRules', short: 'Permessi e regole locali', label: 'Ci sono permessi o regole locali da sapere?' },
  { t: 'open', k: 'parks', path: 'access.parks', short: 'Parchi e riserve', label: 'Parchi e riserve: cosa bisogna sapere?' },
  { t: 'open', k: 'crowding', path: 'access.crowding', short: 'Affollamento', label: 'Quanta gente c’è nelle tue zone, e quando?' },
  { t: 'open', k: 'parking', path: 'access.parking', short: 'Parcheggio', label: 'Com’è il parcheggio?' },
];
const H_FIELDS = [
  { t: 'open', k: 'confusions', path: 'risks.confusions', short: 'Scambi pericolosi', label: 'Quali scambi pericolosi vedi in zona?' },
  // Intossicazioni e specie evitate: prima un sì o no, poi il testo solo dopo «Sì». Nessuna risposta rapida sul contenuto.
  { t: 'choice', k: 'knowsPoisonings', short: 'Conosci casi di intossicazione', label: 'Conosci casi di intossicazione da funghi?', options: () => RISK_GATE },
  { t: 'open', k: 'poisonings', path: 'risks.poisonings', short: 'Cosa era successo', label: 'Cosa era successo?', hint: 'Racconta specie, anno e zona. Non scrivere chi era e non dare dettagli sulla salute di persone riconoscibili, nemmeno tua.', when: (o) => o.knowsPoisonings === 'sì' },
  { t: 'open', k: 'beginnerErrors', path: 'risks.beginnerErrors', short: 'Errori dei principianti', label: 'Quali errori fanno i principianti?' },
  { t: 'choice', k: 'avoidsSpecies', short: 'Specie che eviti', label: 'Ci sono specie che eviti di raccogliere?', options: () => RISK_GATE },
  { t: 'open', k: 'avoided', path: 'risks.avoided', short: 'Quali e perché', label: 'Quali, e perché?', when: (o) => o.avoidsSpecies === 'sì' },
  { t: 'open', k: 'mountainDangers', path: 'risks.mountainDangers', short: 'Pericoli in montagna', label: 'Quali pericoli ci sono in montagna?' },
];
const KNOWS_FIELD = { t: 'open', of: 'followUp', k: 'knowsOthers', path: 'followUp.knowsOthers', short: 'Altri esperti', label: 'Conosci altri cercatori esperti che potrebbero rispondere?', hint: 'Non scrivere nomi o contatti di altre persone: gira loro il link.' };
const I_FIELDS = [
  { t: 'choice', of: 'consent', k: 'diary', short: 'Taccuino delle uscite', label: 'Nella prossima stagione ti va di annotare le tue uscite e mandarcele?', hint: 'Data, zona, cosa hai trovato o non trovato. Ti spieghiamo noi come.', options: YES_NO },
  KNOWS_FIELD,
  { t: 'choice', of: 'consent', k: 'recontact', short: 'Ricontatto', label: 'Possiamo ricontattarti per qualche domanda in più?', options: YES_NO },
  { t: 'text', of: 'respondent', k: 'name', short: 'Nome', label: 'Il tuo nome', hint: 'Facoltativo. Anche solo un soprannome: serve a collegare le risposte alla tua testimonianza durante lo studio. Non comparirà nei risultati.', autocomplete: 'name' },
  { t: 'text', of: 'respondent', k: 'contact', short: 'Contatto', label: 'Come ti ricontattiamo?', hint: 'Facoltativo. Telefono o email.', when: contactOn },
  { t: 'consent' },
];

// Limiti dei campi (lunghezze, minimi, massimi, decimali) dallo schema condiviso: fieldSpec(percorso).
// Un campo che lo schema non conosce ferma l'avvio: meglio un errore subito che un 400 all'invio.
const FIELD_GROUPS = [[A_FIELDS, 'profile'], [SPECIES_FIELDS, 'species'], [C_FIELDS, 'rain'], [EVENT_FIELDS, 'weatherEvents'], [FLUSH_FIELDS, 'flushes'],
  [EMPTY_FIELDS, 'emptyTrips'], [F_FIELDS, 'forest'], [G_FIELDS, 'access'], [H_FIELDS, 'risks'], [I_FIELDS, 'followUp']];
function setLimit(f, key, value) {
  if (f[key] !== undefined && f[key] !== value) throw new Error(`Limiti diversi per lo stesso campo: ${f.k}.${key}`);
  f[key] = value;
}
function applySpec(fields, prefix) {
  for (const f of fields) {
    if (f.t === 'group') { applySpec(f.fields, prefix); continue; }
    if (!f.k || f.of === 'consent' || f.send === false) continue;
    if (f.of === 'respondent') { setLimit(f, 'max', RESPONDENT[f.k]); continue; }
    const path = `${f.of || prefix}.${f.k}`;
    const spec = S.fieldSpec(path);
    if (!spec) throw new Error(`Campo assente dallo schema: ${path}`);
    if (spec.t === 'int' || spec.t === 'dec') { setLimit(f, 'min', spec.min); setLimit(f, 'max', spec.max); setLimit(f, 'decimal', spec.t === 'dec'); }
    else if (Number.isInteger(spec.max)) setLimit(f, 'max', spec.max);
    if ((f.t === 'num' || f.t === 'text' || f.t === 'open' || f.t === 'species1') && !Number.isInteger(f.max)) throw new Error(`Manca il limite di ${path}`);
  }
}
let SPECIES_NAME_MAX = 0;
const briefLimit = () => (state.mode === 'breve' ? SHORT.species : LIMITS.species);
const PARTS = [
  { key: 'A', id: 'profile', title: 'Chi sei', brief: true, intro: 'Qualche domanda su di te e su come vai per funghi. Se non vuoi rispondere a una domanda, lasciala vuota.', fields: A_FIELDS, owner: () => state.profile },
  { key: 'B', title: 'Le specie che conosci bene', brief: true, intro: 'Scegli le specie che conosci bene: per ognuna si apre una scheda. Bastano mese e quota indicativa, anche a occhio.', render: renderSpeciesPart, summary: speciesSummary, collect: collectSpecies },
  { key: 'C', id: 'rain', title: 'Pioggia', intro: 'Come la pioggia cambia le uscite, secondo la tua esperienza.', fields: C_FIELDS, owner: () => state.rain },
  { key: 'D', title: 'Temperatura, vento e secco', intro: 'Ci interessano episodi precisi, anche vecchi: un freddo improvviso, una gelata, un vento secco, un caldo fuori stagione.', render: renderWeatherPart, summary: weatherSummary, collect: collectWeather },
  { key: 'E', title: 'Gli ultimi anni', brief: true, briefAll: true, intro: ['Pensa agli ultimi anni: ci servono le buttate e anche le uscite andate a vuoto.', 'Niente posti precisi: basta la zona e la quota indicativa.'], render: renderRecentPart, summary: recentSummary, collect: collectRecent },
  { key: 'F', id: 'forest', title: 'Bosco, versante e terreno', intro: 'Dove guardi e perché. Non servono posti precisi.', fields: F_FIELDS, owner: () => state.forest },
  { key: 'G', id: 'access', title: 'Accessi e regole locali', intro: 'Cosa deve sapere chi va in quelle zone: strade, permessi, parcheggi. Non servono posti precisi.', fields: G_FIELDS, owner: () => state.access },
  { key: 'H', id: 'risks', title: 'Rischi', intro: 'I rischi che vedi in zona, per chi cerca funghi.', fields: H_FIELDS, owner: () => state.risks },
  { key: 'I', title: 'Per finire', brief: true, briefAll: true, intro: 'Ancora poche domande. Poi controlli tutto prima di inviare.', fields: I_FIELDS, owner: () => state.followUp, collect: collectFinal },
];
const partBy = (key) => PARTS.find((p) => p.key === key);
const activeParts = () => PARTS.filter((p) => state.mode === 'completa' || p.brief);
const fieldOn = (f, briefAll) => state.mode !== 'breve' || briefAll || f.brief;
const ownerOf = (f, o) => (f.of ? state[f.of] : o);

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

function renderFields(parent, fields, o, briefAll) {
  for (const f of fields) {
    if (!fieldOn(f, briefAll)) continue;
    const owner = ownerOf(f, o);
    const el = control(f, owner, briefAll);
    if (f.when) when(el, () => f.when(owner));
    parent.append(el);
  }
}
function control(f, o, briefAll) {
  switch (f.t) {
    case 'num': return numControl(f, o);
    case 'choice': return choiceControl(f, o);
    case 'confidence': return choiceControl(f, o, 'q-dots');
    case 'multi': return multiControl(f, o);
    case 'order': return orderControl(f, o);
    case 'month': return monthControl(f, o);
    case 'year': return yearControl(f, o);
    case 'open': return openControl(f, o);
    case 'text': return textControl(f, o);
    case 'species1': return speciesOneControl(f, o);
    case 'group': return groupControl(f, o, briefAll);
    case 'consent': return consentControl();
    default: return h('div');
  }
}

function parseNum(raw, f) {
  const s = String(raw).trim().replace(/\s/g, '').replace(',', '.');
  if (!s) return { ok: true, value: null };
  if (!(f.decimal ? /^\d+(\.\d+)?$/ : /^\d+$/).test(s)) return { ok: false, message: f.decimal ? 'Scrivi solo cifre; per i decimali usa la virgola.' : 'Scrivi solo cifre, senza decimali.' };
  const n = Number(s);
  if (n < f.min || n > f.max) return { ok: false, message: `Scrivi un numero tra ${f.min} e ${f.max}.` };
  return { ok: true, value: n };
}
function numControl(f, o) {
  o._u ||= {};
  const id = uid('n'), hid = f.hint ? uid('h') : null, eid = uid('e');
  const input = h('input', { id, type: 'text', inputmode: f.decimal ? 'decimal' : 'numeric', autocomplete: 'off', enterkeyhint: 'next', class: 'q-input q-num', 'aria-describedby': [hid, eid].filter(Boolean).join(' '), 'aria-invalid': 'false' });
  input.value = isNum(o[f.k]) ? fmtNum(o[f.k]) : '';
  const err = h('p', { id: eid, class: 'q-error', hidden: true });
  // «Non so» dice anche a quale domanda risponde, per chi naviga con il lettore di schermo
  const unknown = h('button', { type: 'button', class: 'q-chip-btn q-unknown', 'aria-pressed': String(!!o._u[f.k]) }, 'Non so', h('span', { class: 'q-sr' }, ` (${f.label})`));
  const setErr = (m) => { err.textContent = m; err.hidden = !m; input.setAttribute('aria-invalid', m ? 'true' : 'false'); };
  input.addEventListener('input', () => {
    const r = parseNum(input.value, f);
    o[f.k] = r.ok ? r.value : null;
    if (r.ok) setErr('');
    if (input.value.trim() && o._u[f.k]) { o._u[f.k] = false; unknown.setAttribute('aria-pressed', 'false'); }
    changed();
  });
  // l'errore compare quando si lascia il campo: si annuncia, perché il focus è già altrove
  input.addEventListener('blur', () => {
    const r = parseNum(input.value, f), before = err.textContent;
    setErr(r.ok ? '' : r.message);
    if (!r.ok && r.message !== before) announce(`${f.label}: ${r.message}`);
  });
  unknown.addEventListener('click', () => {
    const on = unknown.getAttribute('aria-pressed') !== 'true';
    o._u[f.k] = on;
    unknown.setAttribute('aria-pressed', String(on));
    if (on) { input.value = ''; o[f.k] = null; setErr(''); }
    changed();
  });
  return h('div', { class: 'q-field' },
    h('label', { for: id, class: 'q-q' }, f.label, UNIT_SR[f.unit] ? h('span', { class: 'q-sr' }, ` (${UNIT_SR[f.unit]})`) : null),
    f.hint ? h('p', { id: hid, class: 'q-hint' }, f.hint) : null,
    h('div', { class: 'q-num-row' }, input, f.unit ? h('span', { class: 'q-unit', 'aria-hidden': 'true' }, unitText(f.unit, 2)) : null, unknown),
    err);
}

function choiceControl(f, o, extra = '') {
  const opts = optionsOf(f), name = uid('r');
  const fs = fieldset(f, extra);
  const chips = h('div', { class: 'q-chips' });
  const inputs = opts.map((x) => {
    const c = chip('radio', name, x.label, o[f.k] === x.value, (input) => { if (input.checked) { o[f.k] = x.value; f.onPick?.(x.value); changed(); } }, { value: String(x.value) });
    chips.append(c.el);
    return c.input;
  });
  const clear = linkButton('Cancella la scelta', () => {
    o[f.k] = null;
    inputs.forEach((i) => { i.checked = false; });
    changed();
    inputs[0]?.focus();
    announce('Scelta cancellata.');
  });
  watch(clear, (e) => { e.hidden = o[f.k] == null; });
  fs.append(chips, clear);
  return fs;
}

// Le specie scelte nelle parti «Chi sei» e «Le specie che conosci bene» vengono mostrate per prime negli elenchi delle uscite.
function speciesShortlist() {
  const s = new Set(state.profile.speciesSought);
  for (const k of state.speciesChosen) if (!String(k).startsWith('altra')) s.add(k);
  return s;
}
function splitShort(opts) {
  const s = speciesShortlist();
  if (!s.size) return [opts, []];
  return [opts.filter((x) => s.has(x.value)), opts.filter((x) => !s.has(x.value))];
}
function extraToggle(box, open) {
  box.id = uid('x');
  const btn = linkButton('', () => set(box.hidden), { 'aria-controls': box.id });
  const set = (on) => { box.hidden = !on; btn.setAttribute('aria-expanded', String(on)); btn.textContent = on ? 'Mostra meno specie' : 'Mostra tutte le specie'; };
  set(open);
  return btn;
}

function multiControl(f, o) {
  o[f.k] ||= [];
  const opts = optionsOf(f);
  const [main, extra] = f.shortlist ? splitShort(opts) : [opts, []];
  const fs = fieldset(f);
  const inputs = [];
  const mk = (x) => {
    const c = chip('checkbox', null, x.label, o[f.k].includes(x.value), (input) => {
      const a = o[f.k];
      if (input.checked) {
        if (f.exclusive === x.value) a.splice(0, a.length);
        else if (f.exclusive && a.includes(f.exclusive)) a.splice(a.indexOf(f.exclusive), 1);
        if (!a.includes(x.value)) a.push(x.value);
        if (f.pairWith) {
          const other = (o[f.pairWith] ||= []);
          const i = other.indexOf(x.value);
          if (i >= 0) { other.splice(i, 1); announce(`«${x.label}» tolto dall’altro elenco.`); }
        }
      } else if (a.includes(x.value)) a.splice(a.indexOf(x.value), 1);
      changed();
    }, { value: String(x.value) });
    inputs.push([x, c.input]);
    return c.el;
  };
  const chips = h('div', { class: 'q-chips' }, main.map(mk));
  fs.append(chips);
  if (extra.length) {
    const box = h('div', { class: 'q-chips q-extra' }, extra.map(mk));
    fs.append(extraToggle(box, extra.some((x) => o[f.k].includes(x.value))), box);
  }
  watch(fs, () => { for (const [x, input] of inputs) input.checked = o[f.k].includes(x.value); });
  return fs;
}

function orderControl(f, o) {
  o[f.k] ||= [];
  let opts = optionsOf(f);
  if (f.shuffled) {
    const order = o[f.shuffled];
    if (Array.isArray(order) && order.length === opts.length && opts.every((x) => order.includes(x.value))) opts = order.map((v) => opts.find((x) => x.value === v));
  }
  const fs = fieldset(f, 'q-order');
  const label = (v) => labelOf(opts, v);
  const buttons = opts.map((x) => {
    const badge = h('span', { class: 'q-badge', 'aria-hidden': 'true' });
    const sr = h('span', { class: 'q-sr' });
    const b = h('button', { type: 'button', class: 'q-chip-btn q-rank', 'aria-pressed': 'false' }, badge, h('span', {}, x.label), sr);
    b.addEventListener('click', () => {
      const a = o[f.k], i = a.indexOf(x.value);
      if (i >= 0) a.splice(i, 1); else a.push(x.value);
      changed();
      announce(i >= 0 ? `${x.label}: tolto. Gli altri scalano.` : `${x.label}: posto ${a.length}.`);
    });
    return [x, b, badge, sr];
  });
  const tools = h('div', { class: 'q-row' },
    f.undo ? linkButton('Annulla l’ultimo', () => { const v = o[f.k].pop(); changed(); if (v) announce(`${label(v)}: tolto.`); }) : null,
    linkButton('Ricomincia da capo', () => { o[f.k] = []; changed(); announce('Ordine cancellato.'); buttons[0]?.[1].focus(); }));
  fs.append(h('div', { class: 'q-chips' }, buttons.map((b) => b[1])), tools);
  watch(fs, () => {
    for (const [x, b, badge, sr] of buttons) {
      const pos = o[f.k].indexOf(x.value);
      b.setAttribute('aria-pressed', String(pos >= 0));
      badge.textContent = pos >= 0 ? String(pos + 1) : '';
      sr.textContent = pos >= 0 ? `, posto ${pos + 1}` : '';
    }
    tools.hidden = !o[f.k].length;
  });
  return fs;
}

function monthControl(f, o) {
  o._u ||= {};
  const fs = fieldset(f, 'q-month-field');
  const name = uid('m');
  const month = () => (f.part ? o[f.k]?.month ?? null : o[f.k] ?? null);
  const unknown = h('button', { type: 'button', class: 'q-chip-btn q-unknown', 'aria-pressed': String(!!o._u[f.k]) }, 'Non so');
  const monthInputs = MONTHS.map((m, i) => chip('radio', name, [h('span', { 'aria-hidden': 'true' }, MONTHS_SHORT[i]), h('span', { class: 'q-sr' }, m)], month() === i + 1, (input) => {
    if (!input.checked) return;
    o[f.k] = f.part ? { month: i + 1, part: o[f.k]?.part ?? null } : i + 1;
    o._u[f.k] = false;
    changed();
  }, { value: String(i + 1) }));
  fs.append(h('div', { class: 'q-chips q-months' }, monthInputs.map((c) => c.el)));
  let partInputs = [];
  if (f.part) {
    const pname = uid('p');
    partInputs = MONTH_PARTS.map((x) => chip('radio', pname, x.label, o[f.k]?.part === x.value, (input) => {
      if (input.checked && o[f.k]?.month) { o[f.k].part = x.value; changed(); }
    }, { value: x.value }));
    const sub = h('fieldset', { class: 'q-sub' }, h('legend', { class: 'q-sub-q' }, 'In che parte del mese?'), h('div', { class: 'q-chips' }, partInputs.map((c) => c.el)));
    when(sub, () => !!o[f.k]?.month);
    fs.append(sub);
  }
  unknown.addEventListener('click', () => {
    const on = unknown.getAttribute('aria-pressed') !== 'true';
    o._u[f.k] = on;
    if (on) o[f.k] = null;
    changed();
  });
  fs.append(h('div', { class: 'q-row' }, unknown));
  watch(fs, () => {
    monthInputs.forEach((c, i) => { c.input.checked = month() === i + 1; });
    partInputs.forEach((c, i) => { c.input.checked = o[f.k]?.part === MONTH_PARTS[i].value; });
    unknown.setAttribute('aria-pressed', String(!!o._u[f.k]));
  });
  return fs;
}

function yearControl(f, o) {
  o._p ||= {};
  const years = Array.from({ length: 6 }, (_, i) => LAST_YEAR - i);
  const first = years[years.length - 1];
  const fs = fieldset(f);
  const name = uid('y');
  const before = () => !!o._p[f.k] || (Number.isInteger(o[f.k]) && o[f.k] < first);
  const yearInputs = years.map((y) => chip('radio', name, String(y), o[f.k] === y, (input) => { if (input.checked) { o[f.k] = y; o._p[f.k] = false; changed(); } }, { value: String(y) }));
  const iid = uid('n'), eid = uid('e');
  const older = h('input', { id: iid, type: 'text', inputmode: 'numeric', autocomplete: 'off', class: 'q-input q-num', 'aria-describedby': eid, 'aria-invalid': 'false' });
  older.value = Number.isInteger(o[f.k]) && o[f.k] < first ? String(o[f.k]) : '';
  const err = h('p', { id: eid, class: 'q-error', hidden: true });
  const range = { min: YEAR_MIN, max: first - 1 };
  // «Prima del …» e non solo «Prima»: nella stessa scheda c'è la «Prima» settimana del mese
  const prima = chip('radio', name, `Prima del ${first}`, before(), (input) => {
    if (!input.checked) return;
    o._p[f.k] = true;
    const r = parseNum(older.value, range);
    o[f.k] = r.ok ? r.value : null;
    changed();
    setTimeout(() => older.focus(), 0);
  }, { value: 'prima' });
  older.addEventListener('input', () => { const r = parseNum(older.value, range); o[f.k] = r.ok ? r.value : null; if (r.ok) { err.hidden = true; older.setAttribute('aria-invalid', 'false'); } changed(); });
  older.addEventListener('blur', () => {
    const r = parseNum(older.value, range), before = err.textContent;
    err.textContent = r.ok ? '' : r.message; err.hidden = r.ok; older.setAttribute('aria-invalid', String(!r.ok));
    if (!r.ok && r.message !== before) announce(`${f.label} ${r.message}`);
  });
  const olderWrap = h('div', { class: 'q-other' }, h('label', { for: iid, class: 'q-sub-q' }, 'Che anno?'), older, err);
  when(olderWrap, before);
  const clear = linkButton('Cancella la scelta', () => { o[f.k] = null; o._p[f.k] = false; older.value = ''; changed(); yearInputs[0].input.focus(); announce('Scelta cancellata.'); });
  watch(clear, (e) => { e.hidden = o[f.k] == null && !o._p[f.k]; });
  watch(fs, () => { yearInputs.forEach((c, i) => { c.input.checked = !before() && o[f.k] === years[i]; }); prima.input.checked = before(); });
  fs.append(h('div', { class: 'q-chips q-years' }, yearInputs.map((c) => c.el), prima.el), olderWrap, clear);
  return fs;
}

const growable = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');
function textarea(id, f, value, oninput) {
  const t = h('textarea', { id, class: 'q-input q-area', rows: 3, maxlength: f.max, spellcheck: 'true', autocapitalize: 'sentences' });
  t.value = value || '';
  const counter = h('p', { class: 'q-count-chars', hidden: true });
  const grow = () => {
    if (!growable) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; }
    const left = f.max - t.value.length;
    counter.hidden = left > 60;
    counter.textContent = left > 0 ? `Puoi scrivere ancora ${left} caratteri.` : 'Hai raggiunto il limite di questa risposta.';
  };
  t.addEventListener('input', () => { grow(); oninput(t.value); });
  t.addEventListener('focus', grow);
  requestAnimationFrame(grow);
  return [t, counter];
}
const dictation = () => h('p', { class: 'q-dict' }, 'Puoi dettare con il microfono della tastiera.');

function openControl(f, o) {
  o._o ||= {};
  let v = o[f.k];
  if (!v || typeof v !== 'object') v = o[f.k] = { quick: [], text: typeof v === 'string' ? v : '' };
  if (!Array.isArray(v.quick)) v.quick = [];
  const q = quickFor(f.path, f.omitQuick);
  const tid = uid('t');
  const [area, counter] = textarea(tid, f, v.text, (val) => { v.text = val; changed(); });
  if (!q) {
    // domanda solo a testo: un elenco di nomi suggerirebbe la risposta
    const hid = f.hint ? uid('h') : null;
    if (hid) area.setAttribute('aria-describedby', hid);
    return h('div', { class: 'q-field' }, h('label', { for: tid, class: 'q-q' }, f.label), f.hint ? h('p', { id: hid, class: 'q-hint' }, f.hint) : null, dictation(), area, counter);
  }
  if (v.text.trim() && o._o[f.k] == null && !(f.detail && v.quick.includes(f.detail.value))) o._o[f.k] = true;
  const fs = fieldset(f, 'q-open');
  const name = q.single ? uid('r') : null;
  const choices = [...q.options, opt(DONT_KNOW, 'Non so')];
  const pick = (value, on) => {
    let list = v.quick.filter((x) => x !== value);
    if (on) {
      list = q.single || q.exclusive.has(value) ? [] : list.filter((x) => !S.quickChoicesConflict(f.path, x, value));
      list.push(value);
      if (value === DONT_KNOW) o._o[f.k] = false;
    }
    v.quick = list;
    changed();
  };
  const boxes = choices.map((x) => [x, chip(q.single ? 'radio' : 'checkbox', name, x.label, v.quick.includes(x.value), (input) => pick(x.value, input.checked), { value: x.value })]);
  const other = chip('checkbox', null, 'Altro…', !!o._o[f.k], (input) => {
    o._o[f.k] = input.checked;
    if (input.checked) { v.quick = v.quick.filter((x) => x !== DONT_KNOW); setTimeout(() => area.focus(), 0); }
    changed();
  });
  // domanda di approfondimento solo dopo il «sì» (f.detail): il testo si apre con la sua domanda
  const detailOn = () => !!f.detail && v.quick.includes(f.detail.value);
  const areaLabel = h('label', { for: tid, class: 'q-sub-q' }, 'Scrivi con parole tue');
  const otherWrap = h('div', { class: 'q-other' }, areaLabel, dictation(), area, counter);
  watch(otherWrap, (e) => {
    e.hidden = !(o._o[f.k] || detailOn());
    const text = detailOn() && !o._o[f.k] ? f.detail.label : 'Scrivi con parole tue';
    if (areaLabel.textContent !== text) areaLabel.textContent = text;
  });
  fs.append(h('div', { class: 'q-chips' }, boxes.map(([, c]) => c.el), other.el), otherWrap);
  if (q.single) {
    const clear = linkButton('Cancella la scelta', () => { v.quick = []; changed(); boxes[0]?.[1].input.focus(); announce('Scelta cancellata.'); });
    watch(clear, (e) => { e.hidden = !v.quick.length; });
    fs.append(clear);
  }
  watch(fs, () => {
    for (const [x, c] of boxes) c.input.checked = v.quick.includes(x.value);
    other.input.checked = !!o._o[f.k];
  });
  return fs;
}

function textControl(f, o) {
  const id = uid('x'), hid = f.hint ? uid('h') : null;
  const input = h('input', { id, type: 'text', class: 'q-input', maxlength: f.max, list: f.list ? `q-${f.list}-list` : null, autocomplete: f.autocomplete || 'off', enterkeyhint: 'next', 'aria-describedby': hid });
  input.value = o[f.k] || '';
  input.addEventListener('input', () => { o[f.k] = input.value; changed(); });
  const wrap = h('div', { class: 'q-field' }, h('label', { for: id, class: 'q-q' }, f.label), f.hint ? h('p', { id: hid, class: 'q-hint' }, f.hint) : null, input);
  if (f.mine) {
    // le zone già indicate in «Chi sei», a un tocco
    const mine = h('div', { class: 'q-mine' });
    watch(mine, () => {
      const zs = state.profile.zones;
      mine.hidden = !zs.length;
      if (mine.childElementCount === zs.length + 1 && zs.every((z, i) => mine.children[i + 1]?.dataset.zone === z)) return;
      mine.replaceChildren(h('span', { class: 'q-hint' }, 'Le tue zone:'), ...zs.map((z) => {
        const b = h('button', { type: 'button', class: 'q-chip-btn q-small', onclick: () => { input.value = labelOf(ZONES, z); o[f.k] = input.value; changed(); announce(`Zona: ${input.value}.`); } }, labelOf(ZONES, z));
        b.dataset.zone = z;
        return b;
      }));
    });
    wrap.append(mine);
  }
  return wrap;
}

function speciesOneControl(f, o) {
  const fs = fieldset(f);
  const name = uid('s');
  const inputs = [];
  const mk = (value, label) => {
    const c = chip('radio', name, label, o.species === value, (input) => {
      if (!input.checked) return;
      o.species = value;
      changed();
      if (value === 'altra') setTimeout(() => other.focus(), 0);
    }, { value: String(value) });
    inputs.push([value, c.input]);
    return c.el;
  };
  const [main, extra] = splitShort(SPECIES);
  const chips = h('div', { class: 'q-chips' }, main.map((x) => mk(x.value, x.label)), mk('altra', 'Un’altra specie'));
  const oid = uid('o');
  const other = h('input', { id: oid, type: 'text', class: 'q-input', maxlength: f.max, list: 'q-species-list', autocomplete: 'off' });
  other.value = o.speciesOther || '';
  other.addEventListener('input', () => { o.speciesOther = other.value; changed(); });
  const otherWrap = h('div', { class: 'q-other' }, h('label', { for: oid, class: 'q-sub-q' }, 'Quale? Scrivi il nome'), other);
  when(otherWrap, () => o.species === 'altra');
  fs.append(chips);
  if (extra.length) {
    const box = h('div', { class: 'q-chips q-extra' }, extra.map((x) => mk(x.value, x.label)));
    fs.append(extraToggle(box, extra.some((x) => x.value === o.species)), box);
  }
  const clear = linkButton('Cancella la scelta', () => { o.species = null; changed(); inputs[0]?.[1].focus(); announce('Scelta cancellata.'); });
  watch(clear, (e) => { e.hidden = !o.species; });
  watch(fs, () => { for (const [v, input] of inputs) input.checked = o.species === v; });
  fs.append(otherWrap, clear);
  return fs;
}

function groupControl(f, o, briefAll) {
  const fs = fieldset(f, 'q-group');
  renderFields(fs, f.fields, o, briefAll);
  if (f.check) {
    // regione annunciata sempre presente: l'avviso si aggiunge e si toglie al suo interno
    // (un elemento nascosto che compare insieme al testo spesso non viene letto)
    const live = h('div', { role: 'status' });
    watch(live, (e) => {
      const m = f.check(o);
      if ((e.firstChild?.textContent || '') === m) return;
      e.replaceChildren(...(m ? [h('p', { class: 'q-warn' }, m)] : []));
    });
    fs.append(live);
  }
  return fs;
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
    h('label', { for: id, class: 'q-consent-label' }, input, h('span', {}, 'Acconsento all’uso delle mie risposte per studiare stagioni e condizioni dei funghi nel Reatino, come spiegato nell’informativa. Nei risultati non compariranno il mio nome né il mio contatto.')),
    h('p', { id: hid, class: 'q-hint' }, 'Serve per inviare. Titolare: Matteo Sgambato. Non cediamo i dati a nessuno. ', h('a', { href: '#informativa' }, 'Leggi l’informativa'), '.'));
  watch(box, () => { input.checked = !!state.consent.anonymousUse; });
  return box;
}

// ---------------------------------------------------------------------------------------------
// Parti con elenchi: specie (B), episodi (D), buttate e uscite a vuoto (E)
// ---------------------------------------------------------------------------------------------
function speciesTitle(key) {
  const s = state.speciesData[key];
  if (!s) return '';
  if (s.id === 'altra') return s.name.trim() ? `${s.name.trim()} (altra specie)` : 'Altra specie';
  return labelOf(SPECIES, s.id);
}
let removedSpecies = null;
function renderSpeciesPart(body) {
  const lim = briefLimit();
  if (state.mode === 'breve') body.append(h('p', { class: 'q-box' }, `Nella versione breve: al massimo ${lim} specie, solo calendario e quote.`));
  const fs = fieldset({ label: 'Quali specie conosci bene?', hint: `Puoi sceglierne fino a ${lim}. Se manca una specie, aggiungila con «Un’altra specie».` });
  const boxes = SPECIES.map((x) => [x, chip('checkbox', null, x.label, state.speciesChosen.includes(x.value), (input) => {
    if (input.checked) {
      if (!state.speciesChosen.includes(x.value)) state.speciesChosen.push(x.value);
      state.speciesData[x.value] ||= speciesItem(x.value);
      announce(`Aggiunta la scheda: ${x.label}.`);
    } else {
      state.speciesChosen = state.speciesChosen.filter((k) => k !== x.value);
      announce(`Tolta la scheda: ${x.label}. Le risposte restano nella bozza.`);
    }
    changed();
    drawCards();
  }, { value: x.value })]);
  const addOther = h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: () => {
    const key = `altra:${Date.now().toString(36)}${seq += 1}`;
    state.speciesChosen.push(key);
    state.speciesData[key] = speciesItem('altra');
    changed();
    drawCards();
    $(`[data-card="${key}"] input`)?.focus();
  } }, 'Un’altra specie');
  const limitNote = h('p', { class: 'q-hint', role: 'status' });
  fs.append(h('div', { class: 'q-chips' }, boxes.map(([, c]) => c.el)), h('div', { class: 'q-row' }, addOther), limitNote);
  watch(fs, () => {
    const full = state.speciesChosen.length >= lim;
    for (const [x, c] of boxes) { c.input.checked = state.speciesChosen.includes(x.value); c.input.disabled = full && !c.input.checked; }
    addOther.disabled = full;
    const msg = full ? (state.mode === 'breve' ? `Hai scelto ${lim} specie: è il massimo della versione breve.` : `Hai scelto ${lim} specie: è il massimo.`) : '';
    if (limitNote.textContent !== msg) limitNote.textContent = msg;
  });
  const cards = h('div', { class: 'q-cards' });
  body.append(fs, cards);

  function drawCards() {
    cards.replaceChildren();
    const keys = state.speciesChosen.slice(0, lim);
    if (removedSpecies) {
      const r = removedSpecies;
      cards.append(h('p', { class: 'q-box q-row' }, `Hai tolto «${speciesTitle(r.key)}».`, linkButton('Rimettila', () => {
        state.speciesChosen.splice(Math.min(r.index, state.speciesChosen.length), 0, r.key);
        removedSpecies = null;
        changed();
        drawCards();
        $(`[data-card="${r.key}"] summary`)?.focus();
      })));
    }
    if (!keys.length) cards.append(h('p', { class: 'q-muted' }, 'Quando scegli una specie, qui compare la sua scheda.'));
    for (const key of keys) cards.append(speciesCard(key));
    if (state.speciesChosen.length > lim) cards.append(h('p', { class: 'q-box' }, `Nella versione breve compili al massimo ${lim} specie. Le altre che hai scelto restano nella bozza: le ritrovi passando alla versione completa.`));
  }
  function speciesCard(key) {
    const s = state.speciesData[key] ||= speciesItem(key.startsWith('altra') ? 'altra' : key);
    const title = h('span', { class: 'q-card-title' }, speciesTitle(key));
    const content = h('div', { class: 'q-card-body' });
    if (s.id === 'altra') {
      const nid = uid('x'), wid = uid('h');
      const input = h('input', { id: nid, type: 'text', class: 'q-input', maxlength: SPECIES_NAME_MAX, list: 'q-species-list', autocomplete: 'off', 'aria-describedby': wid });
      input.value = s.name;
      const warn = h('p', { id: wid, class: 'q-hint' }, 'Nome italiano o scientifico. Senza nome la scheda non viene inviata.');
      input.addEventListener('input', () => { s.name = input.value; title.textContent = speciesTitle(key); changed(); });
      content.append(h('div', { class: 'q-field' }, h('label', { for: nid, class: 'q-q' }, 'Nome della specie'), warn, input));
    }
    renderFields(content, SPECIES_FIELDS, s, false);
    content.append(h('div', { class: 'q-row' }, h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: () => {
      const index = state.speciesChosen.indexOf(key);
      state.speciesChosen.splice(index, 1);
      removedSpecies = { key, index };
      changed();
      drawCards();
      announce(`Tolta la scheda: ${speciesTitle(key)}.`);
      cards.querySelector('.q-link')?.focus();
    } }, 'Togli questa specie')));
    return h('details', { class: 'q-card q-species', open: true, 'data-card': key }, h('summary', {}, title), content);
  }
  drawCards();
}

function listBlock(cfg) {
  const box = h('div', { class: 'q-list' });
  let removed = null;
  const titleOf = (i) => `${cfg.itemName} ${i + 1}`;
  const [gone, back] = cfg.male ? ['tolto', 'Rimettilo'] : ['tolta', 'Rimettila'];
  const draw = (focus) => {
    const arr = cfg.items(), lim = cfg.limit();
    box.replaceChildren();
    arr.slice(0, lim).forEach((item, i) => {
      const hid = uid('c');
      const tools = h('div', { class: 'q-row q-card-tools' });
      if (i > 0 && cfg.copy) tools.append(h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: () => {
        const prev = cfg.items()[i - 1];
        for (const k of cfg.copy.keys) item[k] = prev[k] == null ? null : JSON.parse(JSON.stringify(prev[k]));
        changed();
        draw(() => box.querySelectorAll('.q-card-title')[i]?.focus());
        announce(`Copiato da ${titleOf(i - 1).toLowerCase()}: ${cfg.copy.what}.`);
      } }, `Come il precedente: ${cfg.copy.what}`));
      tools.append(h('button', { type: 'button', class: 'q-btn q-btn-small', onclick: () => {
        cfg.items().splice(i, 1);
        removed = { item, i };
        changed();
        draw(() => box.querySelector('.q-undo button')?.focus());
        announce(`${titleOf(i)}: ${gone}.`);
      } }, 'Togli'));
      const card = h('div', { class: 'q-card', role: 'group', 'aria-labelledby': hid }, h('h3', { id: hid, class: 'q-card-title', tabindex: '-1' }, titleOf(i)), tools);
      renderFields(card, cfg.fields, item, true);
      box.append(card);
    });
    if (removed) {
      const r = removed;
      box.append(h('p', { class: 'q-box q-row q-undo' }, `Hai tolto: ${titleOf(r.i).toLowerCase()}.`, linkButton(back, () => {
        const a = cfg.items();
        a.splice(Math.min(r.i, a.length), 0, r.item);
        removed = null;
        changed();
        draw(() => box.querySelectorAll('.q-card-title')[Math.min(r.i, a.length - 1)]?.focus());
      })));
    }
    if (arr.length > lim) box.append(h('p', { class: 'q-box' }, `Nella versione breve ne contano ${lim}. Le altre restano nella bozza.`));
    if (arr.length < lim) {
      box.append(h('button', { type: 'button', class: 'q-btn q-add', onclick: () => {
        const a = cfg.items();
        a.push(cfg.make());
        removed = null;
        changed();
        draw(() => box.querySelectorAll('.q-card-title')[a.length - 1]?.focus());
      } }, arr.length ? cfg.addMore : cfg.addFirst));
    } else box.append(h('p', { class: 'q-hint' }, 'Hai raggiunto il numero massimo.'));
    if (focus) focus();
  };
  draw();
  return box;
}

// Cancello della parte D: si invia anche il «No» (answers.weatherRemembers), gli episodi solo dopo «Sì».
const WEATHER_FIELD = { t: 'choice', k: 'remembers', short: 'Ricordi episodi di freddo, gelata, vento o caldo', label: 'Ricordi un episodio di freddo, gelata, vento o caldo che ha cambiato le uscite?', options: () => WEATHER_GATE };
function renderWeatherPart(body) {
  const gate = { ...WEATHER_FIELD,
    onPick: (v) => { if (v === 'sì' && !state.weatherEvents.length) { state.weatherEvents.push(eventItem()); redraw(); } } };
  const wrap = h('div');
  const redraw = () => wrap.replaceChildren(listBlock({ items: () => state.weatherEvents, limit: () => LIMITS.weatherEvents, fields: EVENT_FIELDS, make: eventItem, itemName: 'Episodio', male: true,
    addFirst: 'Aggiungi un episodio', addMore: 'Aggiungi un altro episodio', copy: { keys: ['zone'], what: 'zona' } }));
  body.append(control(gate, state.weather, true), wrap);
  redraw();
  when(wrap, () => state.weather.remembers === 'sì');
}
function renderRecentPart(body) {
  const brief = state.mode === 'breve';
  const copy = { keys: ['zone', 'elev', 'forest'], what: 'zona, quota e bosco' };
  body.append(
    h('h3', { class: 'q-sub-title' }, 'Buttate che ricordi bene'),
    h('p', { class: 'q-hint' }, brief ? `Fino a ${SHORT.flushes}.` : 'Se ci riesci, da 3 a 5.'),
    listBlock({ items: () => state.flushes, limit: () => (brief ? SHORT.flushes : LIMITS.flushes), fields: FLUSH_FIELDS, make: flushItem, itemName: 'Buttata', addFirst: 'Aggiungi una buttata', addMore: 'Aggiungi un’altra buttata', copy }),
    h('h3', { class: 'q-sub-title' }, 'Uscite andate a vuoto pur cercando bene'),
    h('p', { class: 'q-hint' }, 'Contano quanto le buttate: dicono quando i funghi non c’erano, e senza questo non si capisce cosa li fa uscire.'),
    h('p', { class: 'q-hint' }, brief ? 'Ne basta una.' : 'Se ci riesci, 2 o 3.'),
    listBlock({ items: () => state.emptyTrips, limit: () => (brief ? SHORT.emptyTrips : LIMITS.emptyTrips), fields: EMPTY_FIELDS, make: emptyItem, itemName: 'Uscita a vuoto', addFirst: 'Aggiungi un’uscita a vuoto', addMore: 'Aggiungi un’altra uscita a vuoto', copy }));
}

// ---------------------------------------------------------------------------------------------
// Dalle risposte al corpo dell'invio (solo parti attive, non saltate, e domande visibili)
// ---------------------------------------------------------------------------------------------
function openOut(f, o) {
  const v = o[f.k];
  if (!v) return undefined;
  const raw = typeof v === 'string' ? { quick: [], text: v } : v;
  const q = quickFor(f.path, f.omitQuick);
  const allowed = new Set([...(q ? q.options.map((x) => x.value) : []), ...(q ? [DONT_KNOW] : [])]);
  const quick = (raw.quick || []).filter((x) => allowed.has(x));
  const text = !q || o._o?.[f.k] || (f.detail && quick.includes(f.detail.value)) ? clean(raw.text, f.max) : '';
  return quick.length || text ? { quick, text } : undefined;
}
function valueOut(f, o) {
  const v = o[f.k];
  switch (f.t) {
    case 'num': return isNum(v) ? v : undefined;
    case 'choice': case 'confidence': return v == null || v === '' ? undefined : v;
    case 'multi': case 'order': return Array.isArray(v) && v.length ? [...v] : undefined;
    case 'month': return f.part ? (Number.isInteger(v?.month) ? { month: v.month, part: v.part ?? null } : undefined) : (Number.isInteger(v) ? v : undefined);
    case 'year': return Number.isInteger(v) ? v : undefined;
    case 'text': return clean(v, f.max) || undefined;
    case 'open': return openOut(f, o);
    case 'species1': return o.species === 'altra' ? (clean(o.speciesOther, f.max) || undefined) : (o.species || undefined);
    default: return undefined;
  }
}
const toRanking = (list) => Object.fromEntries(list.map((k, i) => [k, i + 1]));
function collectFields(fields, o, briefAll, out = {}) {
  for (const f of fields) {
    if (!fieldOn(f, briefAll) || f.of || f.t === 'consent') continue;
    if (f.when && !f.when(o)) continue;
    if (f.send === false) continue;
    if (f.t === 'group') { collectFields(f.fields, o, briefAll, out); continue; }
    const v = valueOut(f, o);
    if (v !== undefined) out[f.k] = f.asRanking ? toRanking(v) : v;
  }
  return out;
}
const filled = (x) => x && Object.keys(x).length > 0;
function collectInto(answers, key, fields, o, briefAll) { const v = collectFields(fields, o, briefAll); if (filled(v)) answers[key] = v; }
function speciesEntries() {
  return state.speciesChosen.slice(0, briefLimit()).map((key) => {
    const s = state.speciesData[key];
    if (!s) return null;
    if (s.id === 'altra') { const name = clean(s.name, SPECIES_NAME_MAX); return name ? { key, value: { id: 'altra', name, ...collectFields(SPECIES_FIELDS, s, false) } } : null; }
    return { key, value: { id: s.id, ...collectFields(SPECIES_FIELDS, s, false) } };
  }).filter(Boolean);
}
function collectSpecies(answers) { const list = speciesEntries().map((e) => e.value); if (list.length) answers.species = list; }
const listOut = (arr, fields, lim) => arr.slice(0, lim).map((item) => collectFields(fields, item, true)).filter(filled);
function collectWeather(answers) {
  const gate = valueOut(WEATHER_FIELD, state.weather);
  if (gate !== undefined) answers.weatherRemembers = gate;
  if (gate !== 'sì') return;
  const list = listOut(state.weatherEvents, EVENT_FIELDS, LIMITS.weatherEvents);
  if (list.length) answers.weatherEvents = list;
}
function collectRecent(answers) {
  const brief = state.mode === 'breve';
  const fl = listOut(state.flushes, FLUSH_FIELDS, brief ? SHORT.flushes : LIMITS.flushes), em = listOut(state.emptyTrips, EMPTY_FIELDS, brief ? SHORT.emptyTrips : LIMITS.emptyTrips);
  if (fl.length) answers.flushes = fl;
  if (em.length) answers.emptyTrips = em;
}
function collectFinal(answers) { const v = valueOut(KNOWS_FIELD, state.followUp); if (v !== undefined) answers.followUp = { knowsOthers: v }; }
for (const p of PARTS) if (!p.collect) p.collect = (answers) => collectInto(answers, p.id, p.fields, p.owner(), !!p.briefAll);

function payload() {
  const answers = {};
  for (const p of activeParts()) if (!state.skipped[p.key]) p.collect(answers);
  const final = !state.skipped.I;
  const name = final ? clean(state.respondent.name, RESPONDENT.name) : '';
  const contact = final && contactOn() ? clean(state.respondent.contact, RESPONDENT.contact) : '';
  const respondent = {};
  if (name) respondent.name = name;
  if (contact) respondent.contact = contact;
  return {
    survey: SURVEY_ID,
    version: SURVEY_VERSION,
    startedAt: state.startedAt || new Date().toISOString(),
    // Campo trappola: nella pagina ha un nome neutro (q-lascia-vuoto), nel corpo la chiave resta «website».
    website: $('#q-lascia-vuoto')?.value || '',
    respondent,
    consent: { anonymousUse: state.consent.anonymousUse === true, recontact: final && state.consent.recontact === 'sì', diary: final && state.consent.diary === 'sì' },
    answers,
  };
}

// ---------------------------------------------------------------------------------------------
// Riepilogo: mostra esattamente ciò che parte con l'invio
// ---------------------------------------------------------------------------------------------
function fmtValue(f, v) {
  switch (f.t) {
    case 'num': return `${fmtNum(v)}${f.unit ? ` ${unitText(f.unit, v)}` : ''}`;
    case 'confidence': return `${v} su 5`;
    case 'choice': return labelOf(optionsOf(f), v);
    case 'multi': return v.map((x) => labelOf(optionsOf(f), x)).join(', ');
    case 'order': return v.map((x, i) => `${i + 1}. ${labelOf(optionsOf(f), x)}`).join('; ');
    case 'month': return typeof v === 'object' ? `${v.part ? `${v.part} ` : ''}${MONTHS[v.month - 1]}` : MONTHS[v - 1];
    case 'open': return typeof v === 'string' ? v : [...v.quick.map((x) => (x === DONT_KNOW ? 'Non so' : cap(x))), v.text].filter(Boolean).join(' · ');
    case 'species1': return labelOf(SPECIES, v);
    default: return String(v);
  }
}
function summarizeFields(fields, o, briefAll, rows = []) {
  for (const f of fields) {
    const owner = ownerOf(f, o);
    if (!fieldOn(f, briefAll) || f.t === 'consent') continue;
    if (f.when && !f.when(owner)) continue;
    if (f.send === false) continue;
    if (f.t === 'group') { summarizeFields(f.fields, owner, briefAll, rows); continue; }
    const v = valueOut(f, owner);
    if (v !== undefined) rows.push([f.short || f.label, fmtValue(f, v)]);
  }
  return rows;
}
function speciesSummary() {
  return speciesEntries().map((e) => ({ label: speciesTitle(e.key), rows: summarizeFields(SPECIES_FIELDS, state.speciesData[e.key], false), empty: 'Solo indicata come specie che conosci.' }));
}
const listSummary = (arr, fields, lim, name) => arr.slice(0, lim).map((item, i) => ({ label: `${name} ${i + 1}`, rows: summarizeFields(fields, item, true) })).filter((r) => r.rows.length);
function weatherSummary() {
  const gate = valueOut(WEATHER_FIELD, state.weather);
  if (gate === undefined) return [];
  return [[WEATHER_FIELD.short, fmtValue(WEATHER_FIELD, gate)], ...(gate === 'sì' ? listSummary(state.weatherEvents, EVENT_FIELDS, LIMITS.weatherEvents, 'Episodio') : [])];
}
function recentSummary() {
  const brief = state.mode === 'breve';
  return [...listSummary(state.flushes, FLUSH_FIELDS, brief ? SHORT.flushes : LIMITS.flushes, 'Buttata'), ...listSummary(state.emptyTrips, EMPTY_FIELDS, brief ? SHORT.emptyTrips : LIMITS.emptyTrips, 'Uscita a vuoto')];
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
const stepAllowed = (step) => step === 'intro' || step === 'riepilogo' || activeParts().some((p) => p.key === step);

function go(step, { push = true } = {}) {
  state.step = step;
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
function nextAfter(key) {
  const i = PARTS.findIndex((p) => p.key === key);
  return PARTS.slice(i + 1).find((p) => activeParts().includes(p))?.key || 'riepilogo';
}
function prevBefore(key) {
  const i = PARTS.findIndex((p) => p.key === key);
  return PARTS.slice(0, i).reverse().find((p) => activeParts().includes(p))?.key || 'intro';
}
function switchMode() {
  state.mode = state.mode === 'breve' ? 'completa' : 'breve';
  let step = state.step;
  if (isPart(step) && !stepAllowed(step)) step = nextAfter(step);
  const n = activeParts().length;
  go(step, { push: step !== state.step });
  announce(state.mode === 'breve' ? `Versione breve: ${n} parti. Le altre risposte restano nella bozza.` : `Versione completa: ${n} parti.`);
}

function renderProgress() {
  const box = $('#q-progress');
  // la scelta breve/completa sta fuori dalla parte incollata in cima: sul telefono, con la tastiera aperta, resta più spazio
  const modeLine = $('#q-mode-line');
  box.replaceChildren();
  modeLine?.replaceChildren();
  const list = activeParts();
  const i = list.findIndex((p) => p.key === state.step);
  if (i < 0 && state.step !== 'riepilogo') { box.hidden = true; return; }
  box.hidden = false;
  const fill = h('span', { class: 'q-bar-fill' });
  fill.style.width = `${Math.round(((i < 0 ? list.length + 1 : i + 1) / (list.length + 1)) * 100)}%`;
  box.append(
    h('p', { class: 'q-count' }, i < 0 ? 'Riepilogo' : `Parte ${i + 1} di ${list.length}`),
    h('div', { class: 'q-bar', 'aria-hidden': 'true' }, fill));
  (modeLine || box).append(h('p', { class: 'q-mode' }, state.mode === 'breve' ? 'Versione breve · ' : 'Versione completa · ',
    linkButton(state.mode === 'breve' ? 'passa alla completa' : 'passa alla breve', switchMode)));
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

function readReceipts() { try { const r = JSON.parse(store.get(RECEIPTS_KEY) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; } }

function renderIntro(host) {
  const sec = stepSection('Prima di cominciare');
  sec.append(
    h('p', {}, 'Cerchiamo chi va per funghi nel Reatino da molti anni. Vogliamo capire quando e dove escono, e che cosa li fa uscire: pioggia, freddo, bosco, quota.'),
    h('ul', { class: 'q-points' },
      h('li', {}, 'Non chiediamo posti precisi: basta la zona e la quota indicativa.'),
      h('li', {}, 'Se non sai una cosa, lasciala vuota o tocca «Non so». Va bene anche rispondere solo in parte.'),
      h('li', {}, 'Non serve registrarsi. Il nome è facoltativo.'),
      h('li', {}, 'Mentre scrivi, le risposte restano su questo dispositivo. Ci arrivano solo quando premi «Invia», alla fine.')));
  const receipts = readReceipts();
  if (receipts.length) {
    const last = receipts[receipts.length - 1];
    sec.append(h('p', { class: 'q-box' }, `Da questo dispositivo è già stato inviato un questionario ${dayText(last.sentAt)}. Codice ricevuta: `, h('strong', { class: 'q-code' }, last.receipt), '.'));
  }
  if (resumeAt) sec.append(resumeBox());
  else {
    const vid = uid('v');
    const big = (mode, title, time, text) => h('button', { type: 'button', class: `q-big${state.mode === mode ? ' q-current' : ''}`, onclick: () => {
      state.mode = mode;
      go('A');
      announce(`${title}: ${activeParts().length} parti.`);
    } }, h('span', { class: 'q-big-title' }, title), h('span', { class: 'q-big-time' }, time), h('span', { class: 'q-big-text' }, text),
      state.mode === mode ? h('span', { class: 'q-big-text' }, 'È quella che stai usando.') : null);
    sec.append(h('div', { class: 'q-versions', role: 'group', 'aria-labelledby': vid },
      h('h3', { id: vid }, 'Quanto tempo hai?'),
      big('breve', 'Versione breve', 'circa 10 minuti', 'Chi sei, quando e a che quota escono fino a 3 specie, qualche buttata.'),
      big('completa', 'Versione completa', 'circa 30–40 minuti', 'Tutte le domande: anche pioggia, freddo e vento, bosco, accessi e rischi.'),
      h('p', { class: 'q-hint' }, 'Puoi passare dall’una all’altra quando vuoi, senza perdere niente.')));
  }
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
  const list = activeParts();
  const n = list.indexOf(part) + 1;
  const sec = stepSection(part.title, `Parte ${n} di ${list.length}`);
  for (const t of [].concat(part.intro || [])) sec.append(h('p', { class: 'q-intro' }, t));
  if (state.skipped[part.key]) {
    sec.append(h('div', { class: 'q-box' }, h('p', {}, 'Hai saltato questa parte: queste risposte non vengono inviate.'),
      h('button', { type: 'button', class: 'q-btn', onclick: () => { delete state.skipped[part.key]; save(); render(); focusTitle(); } }, 'Compila questa parte')));
  } else {
    const body = h('div', { class: 'q-body' });
    if (part.render) part.render(body, part); else renderFields(body, part.fields, part.owner(), !!part.briefAll);
    sec.append(body);
  }
  const next = nextAfter(part.key), prev = prevBefore(part.key);
  sec.append(h('div', { class: 'q-nav' },
    h('button', { type: 'button', class: 'q-btn', onclick: () => go(prev) }, 'Indietro'),
    h('button', { type: 'button', class: 'q-btn q-btn-primary', onclick: () => go(next) }, next === 'riepilogo' ? 'Vai al riepilogo' : 'Avanti')),
  state.skipped[part.key] ? null : h('p', { class: 'q-skip-part' }, linkButton('Salta questa parte', () => {
    state.skipped[part.key] = true;
    go(next);
    announce(`Hai saltato «${part.title}». Puoi tornarci dal riepilogo.`);
  })));
  host.append(sec);
}

function renderSummary(host) {
  const sec = stepSection('Riepilogo e invio');
  sec.append(h('p', { class: 'q-intro' }, 'Controlla le risposte. Con «Modifica» torni a quella parte e cambi quello che vuoi.'));
  for (const part of activeParts()) {
    const id = uid('s');
    const skipped = !!state.skipped[part.key];
    const rows = skipped ? [] : part.summary ? part.summary() : summarizeFields(part.fields, part.owner(), !!part.briefAll);
    sec.append(h('section', { class: 'q-sum', 'aria-labelledby': id },
      h('div', { class: 'q-sum-head' }, h('h3', { id }, part.title),
        h('button', { type: 'button', class: 'q-btn q-btn-small', 'aria-label': `Modifica: ${part.title}`, onclick: () => go(part.key) }, 'Modifica')),
      skipped ? h('p', { class: 'q-muted' }, 'Parte saltata: non viene inviata.') : rows.length ? rowsEl(rows) : h('p', { class: 'q-muted' }, 'Nessuna risposta.')));
  }
  const p = payload();
  const who = [p.respondent.name, p.respondent.contact].filter(Boolean);
  sec.append(h('div', { class: 'q-box q-send-what' }, h('h3', {}, 'Cosa inviamo'), h('ul', {},
    h('li', {}, 'Le risposte qui sopra. Le parti saltate e le domande senza risposta non partono.'),
    h('li', {}, who.length ? `Nome e contatto: ${who.join(', ')}.` : 'Nessun nome e nessun contatto.'),
    h('li', {}, `Ricontatto: ${p.consent.recontact ? 'sì' : 'no'}. Taccuino delle uscite: ${p.consent.diary ? 'sì' : 'no'}.`),
    h('li', {}, 'L’ora in cui hai cominciato: serve solo a sapere quanto tempo hai impiegato.'),
    h('li', {}, 'Non inviamo la tua posizione. L’indirizzo IP non viene salvato.'))));
  sec.append(consentControl());
  const error = h('div', { id: 'q-send-error', class: 'q-box q-box-crit', role: 'alert', hidden: true });
  const status = h('p', { class: 'q-status', role: 'status' });
  const sendBtn = h('button', { type: 'button', class: 'q-btn q-btn-primary q-send', onclick: () => send(sendBtn, error, status) }, 'Invia');
  sec.append(error, h('div', { class: 'q-nav' }, h('button', { type: 'button', class: 'q-btn', onclick: () => go(activeParts().at(-1).key) }, 'Indietro'), sendBtn), status);
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
      h('p', {}, 'Conservalo. Se un giorno vuoi farci cancellare le risposte, manda questo codice a Matteo Sgambato: ', ...contactLink(), '.')));
  }
  sec.append(h('p', { class: 'q-muted' }, 'La bozza su questo dispositivo è stata cancellata.'),
    h('div', { class: 'q-row' }, h('button', { type: 'button', class: 'q-btn', onclick: () => { sent = null; state = blank(); go('intro'); } }, 'Compila un altro questionario')));
  host.append(sec);
}

// ---------------------------------------------------------------------------------------------
// Invio
// ---------------------------------------------------------------------------------------------
const PART_OF_PATH = { profile: 'A', species: 'B', rain: 'C', weatherEvents: 'D', flushes: 'E', emptyTrips: 'E', forest: 'F', access: 'G', risks: 'H', followUp: 'I', respondent: 'I', consent: 'I' };
function partsOf(errors) {
  const keys = new Set();
  for (const e of errors || []) {
    const path = typeof e === 'string' ? e : (e?.path ?? e?.field ?? '');
    const m = String(path).replace(/^answers\./, '').match(/^([A-Za-z]+)/);
    if (m && PART_OF_PATH[m[1]]) keys.add(PART_OF_PATH[m[1]]);
  }
  return [...keys].map(partBy).filter((p) => p && activeParts().includes(p));
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
  if (typeof S.validateSurvey === 'function') {
    let check;
    // Il campo trappola lo giudica solo il server (201 finto): qui un errore su un campo invisibile
    // bloccherebbe la persona senza rimedio e mostrerebbe la trappola a chi esegue la pagina.
    try { check = S.validateSurvey({ ...body, website: '' }); } catch { check = { ok: true }; }
    if (check && check.ok === false) {
      showError(error, 'Alcune risposte non vanno bene.', { details: check.errors || [], parts: partsOf(check.errors) });
      return;
    }
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
// Zone: macro-zone, località e comuni della provincia (elenco ISTAT nello schema). Il campo accetta anche testo libero.
function placeNames() {
  if (Array.isArray(S.ZONE_SUGGESTIONS) && S.ZONE_SUGGESTIONS.length) return S.ZONE_SUGGESTIONS;
  return [...ZONES.map((z) => z.label), ...(S.PLACES || []).map((p) => p?.name), ...(S.MUNICIPALITIES || []).map((m) => m?.name)];
}
// Specie «altra»: nomi italiani e latini del catalogo, in un file statico generato (tools/build_survey_lists.mjs).
async function loadSpeciesNames() {
  let names = SPECIES.map((x) => x.label);
  try {
    const m = await import('./survey-species-names.js');
    if (Array.isArray(m.SPECIES_NAME_OPTIONS)) names = [...names, ...m.SPECIES_NAME_OPTIONS];
    else if (Array.isArray(m.SPECIES_NAMES)) names = [...names, ...m.SPECIES_NAMES.flatMap((x) => [x?.name, ...(x?.latin || []), ...(x?.aliases || [])])];
  } catch { /* elenco facoltativo: restano le specie principali */ }
  fillList('q-species-list', names.filter((n) => typeof n === 'string' && n.length <= SPECIES_NAME_MAX));
}

// ---------------------------------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------------------------------
// Bozze salvate prima dei cancelli (16/10/2026). Si guarda la bozza com'era salvata, prima di unirla a blank():
// una bozza nuova ha sempre la chiave del cancello, anche vuota (null) dopo «Cancella la scelta».
function upgradeDraft(raw) {
  // Rischi: un testo già scritto, senza cancello nella bozza, vale come «Sì», così non si perde.
  const risks = raw?.risks && typeof raw.risks === 'object' ? raw.risks : {};
  for (const [gate, key] of S.RISK_GATES || []) {
    if (Object.hasOwn(risks, gate)) continue;
    const v = state.risks[key];
    if (v && (String(v.text ?? v).trim() || v.quick?.length)) state.risks[gate] = 'sì';
  }
  // Schede specie: il vecchio cancello della stagione (changedYes, non inviato) diventa seasonChanged.
  for (const item of Object.values(state.speciesData || {})) {
    if (!item || typeof item !== 'object' || !Object.hasOwn(item, 'changedYes')) continue;
    if (item.seasonChanged == null) item.seasonChanged = item.changedYes ?? null;
    delete item.changedYes;
  }
}
function failed() {
  $('#q-loading')?.setAttribute('hidden', '');
  $('#q-fail')?.removeAttribute('hidden');
}
async function main() {
  try { S = await import('./survey-schema.js'); } catch { failed(); return; }
  ({ SURVEY_ID, SURVEY_VERSION, SURVEY_ENDPOINT: ENDPOINT, MAX_BODY_BYTES: MAX_BYTES, YEAR_MIN, DONT_KNOW } = S);
  KEY = `fronda:questionario:${SURVEY_ID}:v${SURVEY_VERSION}`;
  RECEIPTS_KEY = `${KEY}:ricevute`;
  ZONES = asOptions(S.ZONES);
  SPECIES = asOptions(S.SPECIES).filter((x) => x.value !== S.OTHER_SPECIES);
  FORESTS = asOptions(S.FORESTS).map((x) => opt(x.value, cap(x.label)));
  // Gli ultimi 6 anni a un tocco, fino all'ultimo anno ammesso dallo schema (YEAR_MAX).
  LAST_YEAR = Math.min(Math.max(new Date().getFullYear(), YEAR_MIN + 6), S.YEAR_MAX);
  LIMITS = { ...S.LIST_LIMITS };
  SHORT = { ...S.SHORT_LIMITS };
  RESPONDENT = { ...S.RESPONDENT_LIMITS };
  SPECIES_NAME_MAX = S.fieldSpec('species.name')?.max;
  try {
    if (!loadOptions() || !ZONES.length || !SPECIES.length || !FORESTS.length || !ENDPOINT || !Number.isInteger(SPECIES_NAME_MAX)) throw new Error('Schema incompleto');
    for (const [fields, prefix] of FIELD_GROUPS) applySpec(fields, prefix);
  } catch (e) { console.error(e); failed(); return; }

  const draft = loadDraft();
  if (draft) { state = merge(blank(), draft.state); resumeAt = draft.savedAt || new Date().toISOString(); upgradeDraft(draft.state); }
  const order = state.forest.order;
  if (!Array.isArray(order) || order.length !== FACTORS.length || !FACTORS.every((f) => order.includes(f.value))) state.forest.order = shuffle(FACTORS.map((f) => f.value));
  if (location.hash && fromHash(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch { /* cronologia non disponibile */ } }
  // si apre sempre dall'inizio: con una bozza, l'inizio chiede se riprenderla e «Riprendi» torna alla parte salvata
  savedStep = state.step;
  state.step = 'intro';
  fillList('q-zone-list', placeNames());
  loadSpeciesNames();

  const form = $('#q-form');
  form.addEventListener('submit', (e) => e.preventDefault());
  addEventListener('popstate', () => {
    if (state.step === 'inviato' || resumeAt) return;
    const target = fromHash(location.hash);
    if (!target || target === state.step) return;
    if (target !== 'intro' && (!state.mode || !stepAllowed(target))) return;
    go(target, { push: false });
  });
  addEventListener('pagehide', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(true); });

  render();
  $('#q-loading')?.setAttribute('hidden', '');
  form.hidden = false;
}
main().catch(failed);
