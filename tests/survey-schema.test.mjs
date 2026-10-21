// Questionario per i cercatori esperti, VERSIONE 2 (corta, 21/10/2026): schema condiviso (js/survey-schema.js),
// elenchi per l'autocomplete e regole della compilazione: solo sapere abituale, nessun valore preimpostato,
// «Non so» dove serve, nome e contatto solo per chi segnalerebbe con l'app e vuole essere ricontattato.
// Lo schema congelato della versione 1 ha i suoi test in tests/survey-schema-v1.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANSWERS_SPEC, DONT_KNOW, ELEVATION_BANDS, EXPERIENCE_YEARS, FORESTS, LIST_LIMITS, MONTHS, MUNICIPALITIES, MUNICIPALITIES_SOURCE, PLACES,
  REPORT_INTENT, REPORT_REACHABLE, SPECIES, SPECIES_IDS, SURVEY_ID, SURVEY_VERSION, SURVEY_VERSIONS, ZONES, ZONE_SUGGESTIONS, cleanText, fieldSpec, validateSurvey,
} from '../js/survey-schema.js';
import { SPECIES_NAMES, SPECIES_NAME_OPTIONS } from '../js/survey-species-names.js';
import { generate, latinNames, plainAliases } from '../tools/build_survey_lists.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const body = (answers = {}, extra = {}) => ({
  survey: SURVEY_ID, version: SURVEY_VERSION, startedAt: '2026-10-21T08:00:00.000Z', website: '',
  respondent: {}, consent: { anonymousUse: true, recontact: false }, answers, ...extra,
});
const fields = (b) => validateSurvey(b).errors.map((e) => e.field);
const rejects = (answers, field) => {
  const r = validateSurvey(body(answers));
  assert.equal(r.ok, false, `${field} doveva essere rifiutato`);
  assert.ok(r.errors.some((e) => e.field === field), `${field} atteso tra ${JSON.stringify(r.errors)}`);
  assert.ok(r.errors.every((e) => typeof e.message === 'string' && e.message.length > 5));
};
const accepts = (answers) => { const r = validateSurvey(body(answers)); assert.equal(r.ok, true, JSON.stringify(r.errors)); return r.value.answers; };

// Tutte le domande della versione 2, compilate.
const FULL_ANSWERS = {
  profile: { years: 'da 15 a 29 anni', zones: ['Leonessa', 'Pian de\' Valli (Rieti)'], speciesSought: ['edulis', 'armillaria'], speciesOther: ['Spugnola'] },
  species: [
    { id: 'edulis', months: ['settembre', 'ottobre'], forests: ['faggeta', 'castagneto'], elevation: ['tra 1000 e 1400 m', 'sopra i 1400 m'] },
    { id: 'armillaria', months: [DONT_KNOW], forests: [DONT_KNOW], elevation: [DONT_KNOW] },
    { id: 'altra', name: 'Spugnola', months: ['aprile', 'maggio'] },
  ],
  barrenZones: { where: 'Certi castagneti bassi verso Rieti.', opinion: 'Forse troppo secco.' },
  warning: 'Si perdono nella nebbia sul Terminillo.',
  willReport: 'sì',
};

test('versione 2: numero, versioni leggibili, elenchi chiusi del contratto', () => {
  assert.equal(SURVEY_VERSION, 2);
  assert.deepEqual(SURVEY_VERSIONS, [1, 2]);
  assert.deepEqual(EXPERIENCE_YEARS, ['meno di 5 anni', 'da 5 a 14 anni', 'da 15 a 29 anni', '30 anni o più', 'preferisco non dirlo']);
  assert.deepEqual(ELEVATION_BANDS, ['sotto i 600 m', 'tra 600 e 1000 m', 'tra 1000 e 1400 m', 'sopra i 1400 m']);
  assert.deepEqual(REPORT_INTENT, ['sì', 'forse', 'no']);
  assert.deepEqual(REPORT_REACHABLE, ['sì', 'forse']);
  assert.deepEqual(LIST_LIMITS, { zones: 5, speciesOther: 5, species: 5 });
  assert.equal(SPECIES.length, 14);
  assert.equal(FORESTS.length, 8);
  assert.equal(MONTHS.length, 12);
  // ogni specie del questionario corrisponde a una voce del catalogo dell'app
  const taxa = JSON.parse(read('data/species-traits.json')).taxa;
  for (const s of SPECIES) assert.ok(taxa[s.catalogId], `${s.id} → ${s.catalogId}`);
});

test('solo sapere abituale: nessun campo numerico, episodico o di classifica', () => {
  const keys = [];
  const walk = (spec, path) => {
    assert.ok(!('default' in spec) && !('value' in spec), `${path}: nessun valore predefinito`);
    assert.ok(['obj', 'list', 'text', 'enum', 'set'].includes(spec.t), `${path}: tipo ${spec.t}`);
    if (spec.fields) for (const [k, f] of Object.entries(spec.fields)) { keys.push(k); walk(f, `${path}.${k}`); }
    if (spec.item) walk(spec.item, `${path}[]`);
  };
  walk(ANSWERS_SPEC, 'answers');
  // niente numeri da ricordare (int, dec, mesi con parte), niente episodi, buttate, uscite a vuoto, quantità, classifiche
  for (const k of ['weatherEvents', 'flushes', 'emptyTrips', 'ranking', 'quantity', 'hours', 'lagMin', 'lagTyp', 'lagMax', 'flushDays', 'year',
    'confidence', 'seasonChanged', 'changed', 'tripsGoodYear', 'tripsBadYear', 'start', 'peak', 'end', 'elevMin', 'elevMax', 'elevMode', 'rain'])
    assert.ok(!keys.includes(k), `campo della versione 1 non più chiesto: ${k}`);
  assert.deepEqual(Object.keys(ANSWERS_SPEC.fields), ['profile', 'species', 'barrenZones', 'warning', 'willReport']);
});

test('«Non so» dove serve: mesi, boschi e quote; esclusivo con le altre scelte', () => {
  for (const k of ['months', 'forests', 'elevation']) {
    const spec = fieldSpec(`species.${k}`);
    assert.equal(spec.t, 'set');
    assert.ok(spec.values.includes(DONT_KNOW), k);
    assert.deepEqual(spec.exclusive, [DONT_KNOW], k);
    rejects({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis', [k]: [DONT_KNOW, spec.values[0]] }] }, `answers.species[0].${k}`);
    assert.deepEqual(accepts({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis', [k]: [DONT_KNOW] }] }).species[0][k], [DONT_KNOW]);
  }
  // anni di esperienza: «Preferisco non dirlo» al posto di un numero
  assert.equal(accepts({ profile: { years: 'preferisco non dirlo' } }).profile.years, 'preferisco non dirlo');
  rejects({ profile: { years: 30 } }, 'answers.profile.years');
  rejects({ profile: { years: '30' } }, 'answers.profile.years');
});

test('mesi: griglia dei 12 mesi senza parti del mese, in ordine di calendario', () => {
  const a = accepts({ profile: { speciesSought: ['nuda'] }, species: [{ id: 'nuda', months: ['dicembre', 'ottobre', 'novembre'] }] });
  assert.deepEqual(a.species[0].months, ['ottobre', 'novembre', 'dicembre']);
  rejects({ profile: { speciesSought: ['nuda'] }, species: [{ id: 'nuda', months: [10] }] }, 'answers.species[0].months');
  rejects({ profile: { speciesSought: ['nuda'] }, species: [{ id: 'nuda', months: [{ month: 10, part: 'inizio' }] }] }, 'answers.species[0].months');
  rejects({ profile: { speciesSought: ['nuda'] }, species: [{ id: 'nuda', months: ['ottobre', 'ottobre'] }] }, 'answers.species[0].months');
});

test('nessun valore predefinito: lo schema non riempie ciò che la persona non ha scritto', () => {
  assert.deepEqual(accepts({ willReport: 'no' }), { willReport: 'no' });
  assert.deepEqual(accepts({ profile: {}, willReport: 'forse' }), { profile: {}, willReport: 'forse' });
  const v = validateSurvey(body({ willReport: 'no' }));
  assert.deepEqual(v.value.consent, { anonymousUse: true, recontact: false, diary: false });
  assert.deepEqual(v.value.respondent, { name: null, contact: null });
});

test('un questionario completo è valido e torna normalizzato', () => {
  const r = validateSurvey(body(FULL_ANSWERS, { respondent: { name: '  Mario Rossi ', contact: 'mario@example.org' }, consent: { anonymousUse: true, recontact: true } }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.value.respondent, { name: 'Mario Rossi', contact: 'mario@example.org' });
  assert.deepEqual(r.value.consent, { anonymousUse: true, recontact: true, diary: false });
  assert.deepEqual(r.value.answers, FULL_ANSWERS);
  assert.ok(!('website' in r.value));
  assert.equal(r.value.version, 2);
  assert.equal(r.value.startedAt, '2026-10-21T08:00:00.000Z');
});

test('nome e contatto solo con «sì» o «forse» alle segnalazioni e con il ricontatto (nome compreso)', () => {
  const who = { name: 'Mario', contact: '333 0000000' };
  const saved = (willReport, recontact) => validateSurvey(body(willReport ? { willReport } : { warning: 'x' }, { respondent: who, consent: { anonymousUse: true, recontact } })).value;
  for (const w of ['sì', 'forse']) {
    assert.deepEqual(saved(w, true).respondent, who, w);
    assert.equal(saved(w, true).consent.recontact, true);
    assert.deepEqual(saved(w, false).respondent, { name: null, contact: null }, `${w} senza ricontatto`);
  }
  for (const w of ['no', null]) {
    assert.deepEqual(saved(w, true).respondent, { name: null, contact: null }, `${w}: niente nome né contatto`);
    assert.equal(saved(w, true).consent.recontact, false, 'senza «sì» o «forse» il ricontatto non vale');
  }
  // un nome o un contatto troppo lungo è comunque un errore, anche se poi non si salverebbe
  assert.ok(fields(body({ willReport: 'no' }, { respondent: { name: 'x'.repeat(81) } })).includes('respondent.name'));
  assert.ok(fields(body({ willReport: 'no' }, { respondent: { contact: 'x'.repeat(121) } })).includes('respondent.contact'));
});

test('consenso, questionario e versione: una pagina vecchia riceve «ricarica la pagina»', () => {
  assert.ok(fields(body({}, { consent: { anonymousUse: false } })).includes('consent.anonymousUse'));
  assert.ok(fields(body({}, { consent: undefined })).includes('consent.anonymousUse'));
  assert.ok(fields(body({}, { consent: { anonymousUse: 'true' } })).includes('consent.anonymousUse'));
  assert.ok(fields(body({}, { consent: { anonymousUse: true, recontact: 'sì' } })).includes('consent.recontact'));
  // il taccuino della versione 1 non è più una domanda: «diary» solo assente o falso (contratto delle righe salvate)
  assert.ok(fields(body({}, { consent: { anonymousUse: true, diary: true } })).includes('consent.diary'));
  assert.deepEqual(validateSurvey(body({ willReport: 'no' }, { consent: { anonymousUse: true, recontact: false, diary: false } })).value.consent, { anonymousUse: true, recontact: false, diary: false });
  assert.ok(fields(body({}, { consent: { anonymousUse: true, marketing: true } })).includes('consent.marketing'));
  assert.ok(fields(body({}, { survey: 'altro' })).includes('survey'));
  for (const version of [1, 3, '2', undefined]) {
    const r = validateSurvey(body({ willReport: 'sì' }, { version }));
    assert.equal(r.ok, false);
    assert.deepEqual(r.errors.map((e) => e.field), ['version'], 'un solo errore');
    assert.match(r.errors[0].message, /ricarica la pagina/);
  }
  assert.equal(validateSurvey(body({}, { startedAt: 'ieri' })).value.startedAt, null);
  assert.ok(fields(body({}, { website: 'http://spam' })).includes('website'));
  assert.ok(fields(body({}, { answers: [] })).includes('answers'));
  assert.equal(validateSurvey(null).ok, false);
  assert.equal(validateSurvey([]).ok, false);
});

test('chiavi sconosciute rifiutate a ogni livello, anche quelle della versione 1', () => {
  assert.ok(fields(body({}, { extra: 1 })).includes('extra'));
  assert.ok(fields(body({}, { respondent: { name: 'a', email: 'x' } })).includes('respondent.email'));
  rejects({ rain: {} }, 'answers.rain');
  rejects({ flushes: [] }, 'answers.flushes');
  rejects({ profile: { tripsGoodYear: 40 } }, 'answers.profile.tripsGoodYear');
  rejects({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis', elevMin: 900 }] }, 'answers.species[0].elevMin');
  rejects({ barrenZones: { where: 'x', why: 'y' } }, 'answers.barrenZones.why');
  rejects({ ['__proto__']: { x: 1 } }, 'answers.__proto__');
  rejects(JSON.parse('{"profile":{"__proto__":{"years":"meno di 5 anni"}}}'), 'answers.profile.__proto__');
});

test('zone e altre specie: testo libero con suggerimenti, al massimo 5, senza doppioni', () => {
  assert.deepEqual(accepts({ profile: { zones: ['Fuori provincia, vicino a Norcia', '  ', null] } }).profile.zones, ['Fuori provincia, vicino a Norcia']);
  rejects({ profile: { zones: ['Leonessa', 'leonessa'] } }, 'answers.profile.zones');
  rejects({ profile: { zones: Array.from({ length: 6 }, (_, i) => 'Zona ' + i) } }, 'answers.profile.zones');
  rejects({ profile: { zones: ['x'.repeat(81)] } }, 'answers.profile.zones[0]');
  rejects({ profile: { zones: 'Leonessa' } }, 'answers.profile.zones');
  rejects({ profile: { speciesOther: ['Spugnola', 'spugnola'] } }, 'answers.profile.speciesOther');
  rejects({ profile: { speciesOther: ['x'.repeat(61)] } }, 'answers.profile.speciesOther[0]');
  rejects({ profile: { speciesSought: ['boletus'] } }, 'answers.profile.speciesSought');
  rejects({ profile: { speciesSought: ['altra'] } }, 'answers.profile.speciesSought');
});

test('schede: al massimo 5, solo per le specie scelte, «altra» con il nome scritto alla domanda 2', () => {
  const sought = ['edulis', 'aereus', 'reticulatus', 'pinophilus', 'caesarea', 'cantharellus'];
  rejects({ profile: { speciesSought: sought }, species: sought.map((id) => ({ id })) }, 'answers.species');
  assert.equal(accepts({ profile: { speciesSought: sought }, species: sought.slice(0, 5).map((id) => ({ id })) }).species.length, 5);
  rejects({ species: [{ id: 'edulis' }] }, 'answers.species[0].id');
  rejects({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis' }, { id: 'edulis' }] }, 'answers.species');
  rejects({ profile: { speciesOther: ['Spugnola'] }, species: [{ id: 'altra' }] }, 'answers.species[0].name');
  rejects({ profile: { speciesOther: ['Spugnola'] }, species: [{ id: 'altra', name: 'Prugnolo' }] }, 'answers.species[0].name');
  rejects({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis', name: 'Porcino' }] }, 'answers.species[0].name');
  rejects({ species: [{ name: 'Porcino' }] }, 'answers.species[0].id');
  assert.equal(accepts({ profile: { speciesOther: ['Spugnola', 'Prugnolo'] }, species: [{ id: 'altra', name: 'spugnola' }, { id: 'altra', name: 'Prugnolo' }] }).species.length, 2);
  rejects({ profile: { speciesOther: ['Spugnola'] }, species: [{ id: 'altra', name: 'Spugnola' }, { id: 'altra', name: 'SPUGNOLA' }] }, 'answers.species');
  rejects({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis', forests: ['pineta'] }] }, 'answers.species[0].forests');
  rejects({ profile: { speciesSought: ['edulis'] }, species: [{ id: 'edulis', elevation: ['sotto i 1000 m'] }] }, 'answers.species[0].elevation');
  // schede vuote o assenti: una specie scelta senza scheda resta un'informazione nel profilo
  assert.deepEqual(accepts({ profile: { speciesSought: ['edulis'] }, species: [] }), { profile: { speciesSought: ['edulis'] }, species: [] });
});

test('zone che non danno nulla (il motivo è un parere), errori e pericoli: testo libero facoltativo', () => {
  assert.deepEqual(accepts({ barrenZones: { where: ' Rascino ', opinion: '' } }).barrenZones, { where: 'Rascino', opinion: null });
  rejects({ barrenZones: { where: 'x'.repeat(601) } }, 'answers.barrenZones.where');
  rejects({ barrenZones: { opinion: 'x'.repeat(601) } }, 'answers.barrenZones.opinion');
  assert.equal(accepts({ warning: 'x'.repeat(800) }).warning.length, 800);
  rejects({ warning: 'x'.repeat(801) }, 'answers.warning');
  rejects({ warning: { quick: [], text: 'x' } }, 'answers.warning');
  rejects({ willReport: 'spesso' }, 'answers.willReport');
});

test('testi: salvati come testo, senza caratteri di controllo', () => {
  const html = '<img src=x onerror="alert(1)"><b>bosco</b>';
  assert.equal(accepts({ warning: html }).warning, html, 'l’HTML resta testo, non viene interpretato né alterato');
  assert.equal(cleanText(' a\r\nb\u0000c‮d\u0007 '), 'a\nbcd');
  assert.equal(accepts({ warning: '   ', willReport: 'no' }).warning, null);
  rejects({ warning: 12 }, 'answers.warning');
});

test('regole dei campi per la pagina: fieldSpec', () => {
  assert.equal(fieldSpec('species.name').max, 60);
  assert.equal(fieldSpec('profile.zones').item.max, 80);
  assert.equal(fieldSpec('profile.zones').max, 5);
  assert.equal(fieldSpec('barrenZones.opinion').max, 600);
  assert.equal(fieldSpec('warning').max, 800);
  assert.equal(fieldSpec('profile.nope'), null);
  assert.equal(fieldSpec('constructor'), null);
});

test('comuni della provincia di Rieti secondo ISTAT: 73, codici 057001–057073, con fonte e data', () => {
  assert.equal(MUNICIPALITIES.length, 73);
  assert.equal(MUNICIPALITIES_SOURCE.count, 73);
  MUNICIPALITIES.forEach((m, i) => assert.equal(m.code, '057' + String(i + 1).padStart(3, '0')));
  const names = new Set(MUNICIPALITIES.map((m) => m.name));
  for (const p of PLACES) if (p.municipality) assert.ok(names.has(p.municipality), p.name);
});

test('autocomplete della zona: macro-zone, località principali e comuni', () => {
  for (const z of ZONES) assert.ok(ZONE_SUGGESTIONS.includes(z));
  for (const name of ['Terminillo', 'Pian de\' Valli', 'Campoforogna', 'Rascino', 'Leonessa', 'Amatrice', 'Corvaro', 'Antrodoco', 'Cittaducale'])
    assert.ok(ZONE_SUGGESTIONS.some((s) => s.startsWith(name)), name);
  assert.equal(new Set(ZONE_SUGGESTIONS).size, ZONE_SUGGESTIONS.length);
  assert.ok(ZONE_SUGGESTIONS.every((s) => s.length <= fieldSpec('profile.zones').item.max), 'ogni suggerimento entra nel campo zona');
});

test('nomi delle specie per l’autocomplete: generati dal catalogo e aggiornati', () => {
  assert.equal(read('js/survey-species-names.js'), generate(), 'esegui node tools/build_survey_lists.mjs');
  assert.equal(SPECIES_NAMES.length, Object.keys(JSON.parse(read('data/species-traits.json')).taxa).length);
  for (const s of SPECIES) assert.equal(SPECIES_NAMES.find((n) => n.id === s.catalogId)?.survey, s.id);
  assert.ok(SPECIES_NAME_OPTIONS.includes('Porcino (Boletus edulis)'));
  assert.ok(SPECIES_NAME_OPTIONS.every((o) => o.length <= fieldSpec('profile.speciesOther').item.max), 'ogni suggerimento entra nel campo «altra specie»');
  assert.equal(new Set(SPECIES_NAME_OPTIONS).size, SPECIES_NAME_OPTIONS.length);
  assert.deepEqual(latinNames('Cyclocybe cylindracea (= Cyclocybe aegerita)'), ['Cyclocybe cylindracea', 'Cyclocybe aegerita']);
  assert.deepEqual(plainAliases(['ovolaccio (Umbria)', 'galletto', 'spinarolo / spinerolo']), ['galletto', 'spinarolo', 'spinerolo']);
  assert.ok(SPECIES_IDS.every((id) => SPECIES_NAMES.some((n) => n.survey === id)));
});
