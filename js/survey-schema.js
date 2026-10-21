// Questionario per i cercatori esperti del Reatino: unica fonte dello schema delle risposte, VERSIONE 2
// (versione corta, decisa da Matteo il 21/10/2026). La importano la pagina (/questionario), il Worker
// (worker/survey.js) e la redazione. Modulo ES senza dipendenze esterne.
//
// Perché la versione 2: un cercatore esperto, provando la versione 1, si è «sentito preso in giro». Le domande
// chiedevano di ricordare episodi (giorni dopo la pioggia, buttate e stagioni passate, uscite a vuoto, gelate,
// quantità) e di mettere in classifica dei fattori: nessuno li ricorda con certezza, si risponde a caso, e un
// dato inventato che sembra vero è dannoso. La versione 2 chiede solo ciò che si sa per abitudine e ripetizione;
// le osservazioni vere si raccolgono dal bosco con l'app («Annota»).
//
// Regole della compilazione (valgono anche qui):
// - nessun valore preimpostato: lo schema non ha predefiniti e la pagina non sceglie al posto della persona;
// - «Non so» (DONT_KNOW) dove serve, esclusivo con le altre scelte;
// - nessuna domanda su episodi, numeri, stagioni passate, uscite a vuoto ricordate, quantità o classifiche.
//
// Le risposte della versione 1 restano archiviate e si leggono con js/survey-schema-v1.js (congelato).
// Da lì vengono anche gli elenchi condivisi, uguali nelle due versioni.
import {
  SURVEY_ID, SURVEY_ENDPOINT, MAX_BODY_BYTES, RESPONDENT_LIMITS, SURVEY_RETENTION, DONT_KNOW,
  ZONES, SPECIES, SPECIES_IDS, OTHER_SPECIES, speciesLabel, FORESTS, MONTHS,
  MUNICIPALITIES, MUNICIPALITIES_SOURCE, PLACES, PLACES_SOURCE, ZONE_SUGGESTIONS, cleanText, hasSurveyAnswers,
} from './survey-schema-v1.js';

export {
  SURVEY_ID, SURVEY_ENDPOINT, MAX_BODY_BYTES, RESPONDENT_LIMITS, SURVEY_RETENTION, DONT_KNOW,
  ZONES, SPECIES, SPECIES_IDS, OTHER_SPECIES, speciesLabel, FORESTS, MONTHS,
  MUNICIPALITIES, MUNICIPALITIES_SOURCE, PLACES, PLACES_SOURCE, ZONE_SUGGESTIONS, cleanText, hasSurveyAnswers,
};

export const SURVEY_VERSION = 2;
// Versioni che il server sa leggere ed esportare (le risposte salvate non si riscrivono mai).
export const SURVEY_VERSIONS = Object.freeze([1, 2]);

// Da quanti anni cerchi funghi: classi larghe, con «Preferisco non dirlo». Nessun numero da ricordare.
export const EXPERIENCE_YEARS = Object.freeze(['meno di 5 anni', 'da 5 a 14 anni', 'da 15 a 29 anni', '30 anni o più', 'preferisco non dirlo']);
// Quota abituale di una specie: classi ampie (si possono indicare più fasce), oppure «Non so».
export const ELEVATION_BANDS = Object.freeze(['sotto i 600 m', 'tra 600 e 1000 m', 'tra 1000 e 1400 m', 'sopra i 1400 m']);
// Segnaleresti i tuoi ritrovamenti, anche quando non trovi niente, con l'app?
export const REPORT_INTENT = Object.freeze(['sì', 'forse', 'no']);
// Con «sì» o «forse» si può chiedere di essere ricontattati; solo allora si salvano nome e contatto.
export const REPORT_REACHABLE = Object.freeze(['sì', 'forse']);

// zones: zone a grandi linee; speciesOther: altre specie cercate (nomi); species: schede (al massimo 5).
export const LIST_LIMITS = Object.freeze({ zones: 5, speciesOther: 5, species: 5 });

const text = (max) => ({ t: 'text', max });
const oneOf = (values, required = false) => ({ t: 'enum', values, required });
const setOf = (values, exclusive = []) => ({ t: 'set', values, exclusive });
const list = (max, item, check) => ({ t: 'list', max, item, check });
const obj = (fields, check) => ({ t: 'obj', fields, check });
const describe = (values) => values.map((v) => `«${v}»`).join(', ');
const lower = (s) => String(s || '').toLocaleLowerCase('it');

export const ANSWERS_SPEC = obj({
  // 1–2. Esperienza, zone a grandi linee (testo con suggerimenti: comuni e località), specie cercate.
  profile: obj({
    years: oneOf(EXPERIENCE_YEARS),
    zones: list(LIST_LIMITS.zones, text(80), (items, err) => {
      const seen = items.map(lower);
      if (seen.some((z, i) => seen.indexOf(z) !== i)) err('Hai scritto due volte la stessa zona.');
    }),
    speciesSought: setOf(SPECIES_IDS),
    speciesOther: list(LIST_LIMITS.speciesOther, text(60), (items, err) => {
      const seen = items.map(lower);
      if (seen.some((z, i) => seen.indexOf(z) !== i)) err('Hai scritto due volte la stessa specie.');
    }),
  }),
  // 3. Per ogni specie scelta (al massimo 5 schede): mesi in cui la trovi di solito, boschi, quota abituale.
  species: list(LIST_LIMITS.species, obj({
    id: oneOf([...SPECIES_IDS, OTHER_SPECIES], true), name: text(60),
    months: setOf([...MONTHS, DONT_KNOW], [DONT_KNOW]),
    forests: setOf([...FORESTS, DONT_KNOW], [DONT_KNOW]),
    elevation: setOf([...ELEVATION_BANDS, DONT_KNOW], [DONT_KNOW]),
  }, (item, err) => {
    if (item.id === OTHER_SPECIES && !item.name) err('name', 'Scrivi il nome della specie.');
    if (item.id !== OTHER_SPECIES && item.name) err('name', 'Il nome si scrive solo per un’altra specie.');
  }), (items, err) => {
    const ids = items.map((s) => s.id).filter((id) => id !== OTHER_SPECIES);
    const twice = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (twice.length) err(`${describe([...new Set(twice)].map(speciesLabel))}: c'è già una scheda per questa specie.`);
    const names = items.filter((s) => s.id === OTHER_SPECIES).map((s) => lower(s.name));
    if (names.some((n, i) => names.indexOf(n) !== i)) err('C’è già una scheda con questo nome.');
  }),
  // 4. Zone che non danno mai nulla anche se sembrano adatte; il motivo è un parere (opinion), non un fatto.
  barrenZones: obj({ where: text(600), opinion: text(600) }),
  // 5. Un errore da principiante che vedi spesso, oppure un pericolo in montagna.
  warning: text(800),
  // 6. Segnaleresti i tuoi ritrovamenti con l'app, anche quando non trovi niente?
  willReport: oneOf(REPORT_INTENT),
}, (item, err) => {
  // Le schede sono delle specie scelte alla domanda 2: niente schede di specie che non cerchi.
  const sought = new Set(item.profile?.speciesSought || []), other = new Set((item.profile?.speciesOther || []).map(lower));
  (item.species || []).forEach((s, i) => {
    if (s.id !== OTHER_SPECIES && !sought.has(s.id)) err(`species[${i}].id`, `${speciesLabel(s.id)}: prima scegli la specie tra quelle che cerchi.`);
    if (s.id === OTHER_SPECIES && s.name && !other.has(lower(s.name))) err(`species[${i}].name`, `«${s.name}»: prima aggiungi la specie tra quelle che cerchi.`);
  });
});

// Regole di un campo dal suo percorso, senza indici: fieldSpec('species.name').max → 60.
// Serve alla pagina per maxlength e per gli elenchi chiusi.
export function fieldSpec(path) {
  let spec = ANSWERS_SPEC;
  for (const key of String(path).split('.')) {
    if (spec?.t === 'list') spec = spec.item;
    spec = spec?.t === 'obj' && Object.hasOwn(spec.fields, key) ? spec.fields[key] : undefined;
  }
  return spec || null;
}

// --- Validazione -------------------------------------------------------------------------------
// Testo: forma NFC, a capo uniformi, niente caratteri di controllo né di direzione del testo (cleanText).
// L'HTML non viene interpretato: resta testo, e chi lo mostra deve usare textContent.
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);

function checkSet(v, values, exclusive, path, errors) {
  const err = (message) => { errors.push({ field: path, message }); return undefined; };
  if (v == null) return [];
  if (!Array.isArray(v)) return err('Serve un elenco di scelte.');
  if (v.some((x) => typeof x !== 'string' || !values.includes(x))) return err('Scelta non valida.');
  if (new Set(v).size !== v.length) return err('Hai scelto due volte la stessa voce.');
  const alone = v.filter((x) => exclusive.includes(x));
  if (alone.length && v.length > 1) return err(`${describe(alone.map((x) => (x === DONT_KNOW ? 'Non so' : x)))} non si combina con altre scelte.`);
  // ordine stabile: quello dell'elenco (i mesi in ordine di calendario)
  return values.filter((x) => v.includes(x));
}

function checkValue(spec, v, path, errors) {
  const err = (message, at = path) => { errors.push({ field: at, message }); return undefined; };
  switch (spec.t) {
    case 'text': {
      if (v == null) return null;
      if (typeof v !== 'string') return err('Serve un testo.');
      const s = cleanText(v);
      if (s.length > spec.max) return err(`Testo troppo lungo: al massimo ${spec.max} caratteri.`);
      return s || null;
    }
    case 'enum': {
      if (v == null || v === '') return spec.required ? err('Scegli una voce.') : null;
      if (typeof v !== 'string' || !spec.values.includes(v)) return err('Scelta non valida.');
      return v;
    }
    case 'set': return checkSet(v, spec.values, spec.exclusive, path, errors);
    case 'list': {
      if (v == null) return [];
      if (!Array.isArray(v)) return err('Serve un elenco.');
      if (v.length > spec.max) return err(`Al massimo ${spec.max} voci.`);
      const out = [];
      v.forEach((item, i) => {
        const value = checkValue(spec.item, item, `${path}[${i}]`, errors);
        if (value == null) return;
        if (typeof value === 'object' && !Object.values(value).some((x) => !empty(x))) return;
        out.push(value);
      });
      spec.check?.(out, (message) => err(message));
      return out;
    }
    case 'obj': {
      if (v == null) return null;
      if (!isPlainObject(v)) return err('Serve un gruppo di risposte.');
      const out = {};
      for (const key of Object.keys(v)) {
        if (!Object.hasOwn(spec.fields, key)) { err('Campo sconosciuto.', `${path}.${key}`); continue; }
        const value = checkValue(spec.fields[key], v[key], `${path}.${key}`, errors);
        if (value !== undefined) out[key] = value;
      }
      for (const [key, field] of Object.entries(spec.fields)) if (field.required && !Object.hasOwn(v, key)) err('Scegli una voce.', `${path}.${key}`);
      spec.check?.(out, (key, message) => err(message, `${path}.${key}`));
      return out;
    }
    default: throw new Error('Tipo di campo sconosciuto: ' + spec.t);
  }
}

// La chiave resta «anonymousUse» (contratto dalla versione 1), ma il testo non lo promette: le risposte restano
// legate alla ricevuta e, se dati, a nome e contatto. Sono dati personali (vedi l'informativa).
const CONSENT_MISSING = 'Per inviare serve il tuo consenso: spunta la casella qui sopra.';
const BODY_KEYS = ['survey', 'version', 'startedAt', 'website', 'respondent', 'consent', 'answers'];
const CONSENT_KEYS = ['anonymousUse', 'recontact', 'diary'];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

// validateSurvey(body) → {ok, value, errors}: errors = [{field, message}] con il percorso del campo
// (es. «answers.species[0].months»). value è il corpo normalizzato, senza il campo trappola.
// Accetta solo la versione corrente: una pagina vecchia rimasta aperta riceve 400 «ricarica la pagina».
export function validateSurvey(body) {
  const errors = [];
  const err = (field, message) => errors.push({ field, message });
  if (!isPlainObject(body)) return { ok: false, value: null, errors: [{ field: '', message: 'Richiesta non valida.' }] };
  for (const key of Object.keys(body)) if (!BODY_KEYS.includes(key)) err(key, 'Campo sconosciuto.');
  if (body.survey !== SURVEY_ID) err('survey', 'Questionario sconosciuto.');
  // Un'altra versione (pagina vecchia rimasta aperta): un solo errore chiaro, senza giudicare le risposte con lo schema sbagliato.
  if (body.version !== SURVEY_VERSION) return { ok: false, value: null, errors: [{ field: 'version', message: 'Il questionario è cambiato: ricarica la pagina. Le risposte già scritte restano su questo dispositivo.' }] };
  // L'ora di inizio serve solo a stimare la durata: se non è valida si ignora, senza bloccare l'invio.
  const startedAt = typeof body.startedAt === 'string' && ISO.test(body.startedAt) && Number.isFinite(Date.parse(body.startedAt))
    ? new Date(Date.parse(body.startedAt)).toISOString() : null;
  if (body.website != null && (typeof body.website !== 'string' || body.website.trim() !== '')) err('website', 'Questo campo deve restare vuoto.');
  const respondent = checkValue(obj({ name: text(RESPONDENT_LIMITS.name), contact: text(RESPONDENT_LIMITS.contact) }), body.respondent, 'respondent', errors) || {};
  let consent = null;
  if (!isPlainObject(body.consent)) err('consent.anonymousUse', CONSENT_MISSING);
  else {
    for (const key of Object.keys(body.consent)) if (!CONSENT_KEYS.includes(key)) err(`consent.${key}`, 'Campo sconosciuto.');
    if (body.consent.anonymousUse !== true) err('consent.anonymousUse', CONSENT_MISSING);
    if (body.consent.recontact != null && typeof body.consent.recontact !== 'boolean') err('consent.recontact', 'Rispondi sì o no.');
    // «diary» (taccuino delle uscite) era una domanda della versione 1: si accetta solo assente o falso.
    if (body.consent.diary != null && body.consent.diary !== false) err('consent.diary', 'Il taccuino delle uscite non si chiede più: lascia questa scelta vuota.');
    consent = { anonymousUse: true, recontact: body.consent.recontact === true };
  }
  let answers = null;
  if (!isPlainObject(body.answers)) err('answers', 'Mancano le risposte.');
  else answers = checkValue(ANSWERS_SPEC, body.answers, 'answers', errors);
  if (errors.length) return { ok: false, value: null, errors };
  // Nome e contatto servono solo a ricontattare chi segnalerebbe con l'app («sì» o «forse») e lo chiede:
  // altrimenti non si salvano, nemmeno il nome (minimizzazione dei dati; decisione di Matteo, 21/10/2026).
  const reachable = consent.recontact && REPORT_REACHABLE.includes(answers.willReport);
  return { ok: true, errors: [], value: {
    survey: SURVEY_ID, version: SURVEY_VERSION, startedAt,
    respondent: { name: reachable ? respondent.name ?? null : null, contact: reachable ? respondent.contact ?? null : null },
    // «diary» resta nel contratto delle righe salvate (colonna consent_diary): nella versione 2 è sempre falso.
    consent: { anonymousUse: true, recontact: !!reachable, diary: false }, answers,
  } };
}
