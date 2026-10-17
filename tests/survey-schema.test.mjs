// Questionario per i cercatori esperti: schema condiviso (js/survey-schema.js), elenchi per
// l'autocomplete e regole della compilazione semplice (nessun valore preimpostato, risposte rapide neutre).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANSWERS_SPEC, DONT_KNOW, FORESTS, LIST_LIMITS, MUNICIPALITIES, MUNICIPALITIES_SOURCE, PLACES, QUICK_ANSWERS, RANKING_FACTORS, RISK_GATE, RISK_GATES, SEASON_GATE, SPECIES, SPECIES_IDS, WEATHER_GATE,
  SHORT_LIMITS, SURVEY_ID, SURVEY_VERSION, ZONES, ZONE_SUGGESTIONS, cleanText, fieldSpec, validateSurvey,
} from '../js/survey-schema.js';
import { SPECIES_NAMES, SPECIES_NAME_OPTIONS } from '../js/survey-species-names.js';
import { generate, latinNames, plainAliases } from '../tools/build_survey_lists.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const body = (answers = {}, extra = {}) => ({
  survey: SURVEY_ID, version: SURVEY_VERSION, startedAt: '2026-10-16T08:00:00.000Z', website: '',
  respondent: { name: '', contact: '' }, consent: { anonymousUse: true, recontact: false, diary: false }, answers, ...extra,
});
const fields = (b) => validateSurvey(b).errors.map((e) => e.field);
const rejects = (answers, field) => {
  const r = validateSurvey(body(answers));
  assert.equal(r.ok, false, `${field} doveva essere rifiutato`);
  assert.ok(r.errors.some((e) => e.field === field), `${field} atteso tra ${JSON.stringify(r.errors)}`);
  assert.ok(r.errors.every((e) => typeof e.message === 'string' && e.message.length > 5));
};
const accepts = (answers) => { const r = validateSurvey(body(answers)); assert.equal(r.ok, true, JSON.stringify(r.errors)); return r.value.answers; };

// Tutte le parti del questionario, compilate.
const FULL_ANSWERS = {
  profile: { years: 35, mentor: { quick: ['un familiare'], text: 'Mio nonno, a Leonessa.' }, zones: ['Leonessa', 'Terminillo'], zonesOther: 'Valle del Tronto',
    tripsGoodYear: 40, tripsBadYear: 8, speciesSought: ['edulis', 'caesarea'], attestato: 'sì', aslCheck: 'a volte', notes: ['quaderno', 'foto con data'], notesSince: 1998 },
  species: [
    { id: 'edulis', start: { month: 6, part: 'fine' }, peak: { month: 9, part: 'metà' }, end: { month: 11, part: null }, seasonChanged: 'sì', changed: { quick: ['comincia più tardi'], text: '' },
      elevMin: 900, elevMax: 1700, elevMode: 1300, forests: ['faggeta'], forestsNever: ['leccio'], lagMin: 7, lagTyp: 12, lagMax: 20, flushDays: 10, confidence: 4 },
    { id: 'altra', name: 'Prugnolo', start: { month: 4, part: 'inizio' }, confidence: null },
  ],
  rain: { goodRain: { quick: ['2–3 giorni di pioggia'], text: '' }, drySummer: 'Serve una pioggia lunga.', flushEnd: { quick: ['il freddo', 'il vento secco'], text: '' },
    lowRainSpecies: { quick: ['Chiodino'], text: '' } },
  weatherRemembers: 'sì',
  weatherEvents: [{ year: 2023, month: 10, zone: 'Terminillo', kind: 'gelata', effect: { quick: ['i funghi si sono fermati'], text: '' }, daysAfter: 2, seen: 'visto di persona' }],
  flushes: [{ year: 2024, month: 9, week: 2, zone: 'Pian de\' Valli (Rieti)', elev: 1300, forest: 'faggeta', species: 'edulis', quantity: 'tanti (oltre 20)', hours: 2.5,
    weatherBefore: { quick: ['temporali'], text: '' }, dateFrom: 'foto o appunti' }],
  emptyTrips: [{ year: 2025, month: 8, week: null, zone: 'Rascino', elev: null, forest: 'pino nero o altre conifere piantate', speciesSought: ['suillus'], hours: 3,
    why: { quick: ['troppo secco'], text: '' }, dateFrom: 'memoria' }],
  forest: { aspect: { quick: ['inizio stagione: meglio a nord'], text: '' }, cutAge: 'alto fusto', microsites: '', soil: { quick: [DONT_KNOW], text: '' },
    reliableSpots: { quick: ['sì, alcuni posti rendono quasi ogni anno'], text: 'Vicino ai fossi.' }, indicators: { quick: ['altri funghi già nati', 'funziona a volte'], text: '' },
    ranking: { rain: 1, temperature: 2, forestType: 3, elevation: null, aspect: null, year: null, crowd: null } },
  access: { gates: { quick: ['strade con sbarra'], text: '' }, navigators: '', localRules: { quick: ['non ne conosco'], text: '' }, parks: '', crowding: '', parking: '' },
  risks: { confusions: 'Porcino e boleto di fiele.', knowsPoisonings: 'sì', poisonings: 'Un vicino, anni fa: funghi non controllati.',
    beginnerErrors: { quick: ['non fanno controllare il raccolto'], text: '' }, avoidsSpecies: 'no', avoided: '', mountainDangers: '' },
  followUp: { knowsOthers: { quick: ['no'], text: '' } },
};

test('elenchi chiusi del contratto: 8 zone, 14 specie, 8 boschi, 7 fattori', () => {
  assert.equal(ZONES.length, 8);
  assert.deepEqual(SPECIES_IDS, ['edulis', 'aereus', 'reticulatus', 'pinophilus', 'caesarea', 'cantharellus', 'armillaria', 'procera', 'craterellus', 'hydnum', 'russula', 'suillus', 'terreum', 'nuda']);
  assert.equal(FORESTS.length, 8);
  assert.equal(RANKING_FACTORS.length, 7);
  // ogni specie del questionario corrisponde a una voce del catalogo dell'app
  const taxa = JSON.parse(read('data/species-traits.json')).taxa;
  for (const s of SPECIES) assert.ok(taxa[s.catalogId], `${s.id} → ${s.catalogId}`);
});

test('comuni della provincia di Rieti secondo ISTAT: 73, codici 057001–057073, con fonte e data', () => {
  assert.equal(MUNICIPALITIES.length, 73);
  assert.equal(MUNICIPALITIES_SOURCE.count, 73);
  MUNICIPALITIES.forEach((m, i) => assert.equal(m.code, '057' + String(i + 1).padStart(3, '0')));
  assert.equal(new Set(MUNICIPALITIES.map((m) => m.name)).size, 73);
  assert.match(MUNICIPALITIES_SOURCE.url, /^https:\/\/www\.istat\.it\//);
  assert.match(MUNICIPALITIES_SOURCE.consulted, /^\d{4}-\d{2}-\d{2}$/);
  const names = new Set(MUNICIPALITIES.map((m) => m.name));
  for (const p of PLACES) if (p.municipality) assert.ok(names.has(p.municipality), p.name);
});

test('autocomplete della zona: macro-zone, località principali e comuni', () => {
  for (const z of ZONES) assert.ok(ZONE_SUGGESTIONS.includes(z));
  for (const name of ['Terminillo', 'Pian de\' Valli', 'Campoforogna', 'Lisciano', 'Rascino', 'Leonessa', 'Amatrice', 'Accumoli', 'Cittareale',
    'Borgorose', 'Corvaro', 'Fiamignano', 'Pescorocchiano', 'Antrodoco', 'Cittaducale'])
    assert.ok(ZONE_SUGGESTIONS.some((s) => s.startsWith(name)), name);
  assert.equal(new Set(ZONE_SUGGESTIONS).size, ZONE_SUGGESTIONS.length);
  assert.ok(ZONE_SUGGESTIONS.every((s) => s.length <= 80), 'ogni suggerimento entra nel campo zona');
});

test('nomi delle specie per l’autocomplete: generati dal catalogo e aggiornati', () => {
  assert.equal(read('js/survey-species-names.js'), generate(), 'esegui node tools/build_survey_lists.mjs');
  assert.equal(SPECIES_NAMES.length, Object.keys(JSON.parse(read('data/species-traits.json')).taxa).length);
  for (const s of SPECIES) assert.equal(SPECIES_NAMES.find((n) => n.id === s.catalogId)?.survey, s.id);
  assert.ok(SPECIES_NAME_OPTIONS.includes('Porcino (Boletus edulis)'));
  assert.ok(SPECIES_NAME_OPTIONS.includes('Pioppino (Cyclocybe aegerita)'));
  assert.ok(SPECIES_NAME_OPTIONS.every((o) => o.length <= 60));
  assert.equal(new Set(SPECIES_NAME_OPTIONS).size, SPECIES_NAME_OPTIONS.length);
  assert.deepEqual(latinNames('Cyclocybe cylindracea (= Cyclocybe aegerita)'), ['Cyclocybe cylindracea', 'Cyclocybe aegerita']);
  assert.deepEqual(latinNames('Russula virescens; Russula cyanoxantha'), ['Russula virescens', 'Russula cyanoxantha']);
  // un nome locale di un'altra regione può indicare un'altra specie nel Reatino: resta fuori
  assert.deepEqual(plainAliases(['ovolaccio (Umbria)', 'galletto', 'spinarolo / spinerolo']), ['galletto', 'spinarolo', 'spinerolo']);
  assert.ok(!SPECIES_NAME_OPTIONS.some((o) => /^Ovolaccio/.test(o)));
});

// Punto 2 delle regole: suggerimenti solo dove non condizionano.
function openFields(spec, prefix = '') {
  return Object.entries(spec.fields).flatMap(([k, f]) => f.t === 'obj' ? openFields(f, `${prefix}${k}.`)
    : f.t === 'list' ? openFields(f.item, `${prefix}${k}.`) : f.t === 'open' ? [[`${prefix}${k}`, f]] : []);
}
function walk(spec, visit) { visit(spec); if (spec.fields) Object.values(spec.fields).forEach((f) => walk(f, visit)); if (spec.item) walk(spec.item, visit); }

test('risposte rapide: chiavi coerenti con lo schema, valori unici e niente numeri preimpostati', () => {
  const open = openFields(ANSWERS_SPEC);
  for (const [path, f] of open) assert.equal(f.key, path, 'la chiave delle risposte rapide è il percorso della domanda');
  for (const key of Object.keys(QUICK_ANSWERS)) assert.ok(open.some(([p]) => p === key), `${key} non corrisponde a una domanda aperta`);
  for (const [key, q] of Object.entries(QUICK_ANSWERS)) {
    assert.ok(q.options.length >= 2, key);
    assert.equal(new Set(q.options).size, q.options.length, key);
    assert.ok(!q.options.includes(DONT_KNOW), `${key}: «Non so» è aggiunto dallo schema, non dalla lista`);
    for (const x of q.exclusive) assert.ok(q.options.includes(x), `${key}: ${x}`);
    // l'unico numero ammesso è la categoria indicata da Matteo per la pioggia buona
    for (const o of q.options) if (/\d/.test(o)) assert.equal(o, '2–3 giorni di pioggia', `${key}: «${o}» contiene un numero`);
  }
  // domande sulle specie pericolose: solo testo, una lista di nomi suggerirebbe la risposta
  for (const key of ['risks.confusions', 'risks.poisonings', 'risks.avoided']) assert.equal(QUICK_ANSWERS[key], undefined);
  // le risposte rapide coprono entrambe le direzioni
  for (const [a, b] of [['comincia prima', 'comincia più tardi'], ['dura di più', 'dura di meno'], ['si trova più in alto', 'si trova più in basso']])
    assert.ok(QUICK_ANSWERS['species.changed'].options.includes(a) && QUICK_ANSWERS['species.changed'].options.includes(b));
  assert.ok(QUICK_ANSWERS['weatherEvents.effect'].options.includes('i funghi sono diminuiti') && QUICK_ANSWERS['weatherEvents.effect'].options.includes('i funghi sono aumentati'));
  for (const [a, b] of [['i funghi escono prima', 'i funghi escono più tardi'], ['poi ne escono di meno', 'poi ne escono di più'], ['serve più pioggia del solito', 'basta una pioggia normale']])
    assert.ok(QUICK_ANSWERS['rain.drySummer'].options.includes(a) && QUICK_ANSWERS['rain.drySummer'].options.includes(b), `${a} / ${b}`);
});

test('cancelli della stagione (schede specie) e degli episodi (parte D): si salva anche il «no», il dettaglio solo dopo «sì»', () => {
  assert.deepEqual(SEASON_GATE, ['sì', 'no', 'non so']);
  assert.deepEqual(WEATHER_GATE, ['sì', 'no']);
  assert.deepEqual(fieldSpec('species.seasonChanged'), { t: 'enum', values: SEASON_GATE, required: false });
  assert.deepEqual(fieldSpec('weatherRemembers'), { t: 'enum', values: WEATHER_GATE, required: false });
  for (const key of ['species.seasonChanged', 'weatherRemembers']) assert.equal(QUICK_ANSWERS[key], undefined, 'nessuna risposta rapida sul cancello');
  // «sì» da solo arriva al server: «è cambiata, non so come» non si perde
  assert.deepEqual(accepts({ species: [{ id: 'edulis', seasonChanged: 'sì' }] }).species, [{ id: 'edulis', seasonChanged: 'sì' }]);
  assert.deepEqual(accepts({ species: [{ id: 'edulis', seasonChanged: 'sì', changed: { quick: [DONT_KNOW], text: '' } }] }).species[0].changed, { quick: [DONT_KNOW], text: '' });
  for (const v of ['no', 'non so']) {
    assert.deepEqual(accepts({ species: [{ id: 'edulis', seasonChanged: v }] }).species, [{ id: 'edulis', seasonChanged: v }]);
    rejects({ species: [{ id: 'edulis', seasonChanged: v, changed: { quick: ['comincia prima'], text: '' } }] }, 'answers.species[0].changed');
  }
  rejects({ species: [{ id: 'edulis', seasonChanged: 'forse' }] }, 'answers.species[0].seasonChanged');
  // risposte di prima del cancello restano valide (stessa versione dello schema)
  assert.deepEqual(accepts({ species: [{ id: 'edulis', changed: { quick: ['non è cambiata'], text: '' } }] }).species[0].changed.quick, ['non è cambiata']);
  // parte D: il «no» si distingue da nessuna risposta; con «no» niente episodi
  assert.deepEqual(accepts({ weatherRemembers: 'no' }), { weatherRemembers: 'no' });
  assert.equal(accepts({ weatherRemembers: 'sì', weatherEvents: [{ year: 2024 }] }).weatherEvents.length, 1);
  assert.equal(accepts({ weatherEvents: [{ year: 2024 }] }).weatherEvents.length, 1, 'episodi senza cancello: come prima');
  rejects({ weatherRemembers: 'no', weatherEvents: [{ year: 2024 }] }, 'answers.weatherEvents');
  rejects({ weatherRemembers: 'non so' }, 'answers.weatherRemembers');
});

test('rischi: intossicazioni e specie evitate hanno un cancello sì/no che non suggerisce contenuti', () => {
  assert.deepEqual(RISK_GATE, ['sì', 'no', 'non dico']);
  assert.deepEqual(RISK_GATES, [['knowsPoisonings', 'poisonings'], ['avoidsSpecies', 'avoided']]);
  for (const [gate, key] of RISK_GATES) {
    assert.deepEqual(fieldSpec(`risks.${gate}`), { t: 'enum', values: RISK_GATE, required: false });
    assert.equal(fieldSpec(`risks.${key}`).t, 'open', 'il racconto resta testo libero');
    // nessuna risposta rapida di contenuto, né sul cancello né sul testo
    assert.equal(QUICK_ANSWERS[`risks.${gate}`], undefined);
    assert.equal(QUICK_ANSWERS[`risks.${key}`], undefined);
    rejects({ risks: { [key]: { quick: ['amanita'], text: '' } } }, `answers.risks.${key}.quick`);
    rejects({ risks: { [gate]: 'forse' } }, `answers.risks.${gate}`);
    // «sì» con o senza racconto; «no» e «non dico» da soli
    assert.deepEqual(accepts({ risks: { [gate]: 'sì', [key]: 'Racconto.' } }).risks, { [gate]: 'sì', [key]: { quick: [], text: 'Racconto.' } });
    assert.deepEqual(accepts({ risks: { [gate]: 'sì' } }).risks, { [gate]: 'sì' });
    for (const v of ['no', 'non dico']) {
      assert.deepEqual(accepts({ risks: { [gate]: v, [key]: '  ' } }).risks, { [gate]: v, [key]: null });
      rejects({ risks: { [gate]: v, [key]: 'Racconto.' } }, `answers.risks.${key}`);
      rejects({ risks: { [gate]: v, [key]: { quick: [DONT_KNOW], text: '' } } }, `answers.risks.${key}`);
    }
    // risposte di prima dei cancelli (solo testo) restano valide nella stessa versione dello schema
    assert.equal(accepts({ risks: { [key]: 'Racconto.' } }).risks[key].text, 'Racconto.');
  }
});

test('versante: nord, sud, est e ovest con lo stesso peso, a inizio e a fine stagione', () => {
  const q = QUICK_ANSWERS['forest.aspect'];
  for (const phase of ['inizio stagione', 'fine stagione'])
    for (const side of ['nord', 'sud', 'est', 'ovest']) assert.ok(q.options.includes(`${phase}: meglio a ${side}`), `${phase}, ${side}`);
  assert.equal(q.options.filter((o) => o.includes(': meglio a ')).length, 8);
  assert.deepEqual(q.exclusive, ['il versante non conta']);
  // le risposte già valide restano valide
  assert.deepEqual(accepts({ forest: { aspect: { quick: ['inizio stagione: meglio a nord', 'fine stagione: meglio a sud'], text: '' } } }).forest.aspect.quick,
    ['inizio stagione: meglio a nord', 'fine stagione: meglio a sud']);
  assert.deepEqual(accepts({ forest: { aspect: { quick: ['inizio stagione: meglio a est', 'fine stagione: meglio a ovest'], text: '' } } }).forest.aspect.quick,
    ['inizio stagione: meglio a est', 'fine stagione: meglio a ovest']);
  rejects({ forest: { aspect: { quick: ['il versante non conta', 'fine stagione: meglio a est'], text: '' } } }, 'answers.forest.aspect.quick');
});

test('nessun valore predefinito: lo schema non riempie ciò che la persona non ha scritto', () => {
  walk(ANSWERS_SPEC, (f) => assert.ok(!('default' in f) && !('value' in f), JSON.stringify(f)));
  assert.deepEqual(accepts({}), {});
  assert.deepEqual(accepts({ profile: {}, species: [{ id: 'nuda' }] }), { profile: {}, species: [{ id: 'nuda' }] });
  // «Non so» sui numeri: null resta null, il campo vuoto diventa null
  assert.deepEqual(accepts({ species: [{ id: 'edulis', elevMin: null, elevMax: '', confidence: null }] }).species[0], { id: 'edulis', elevMin: null, elevMax: null, confidence: null });
  const v = validateSurvey(body({}));
  assert.deepEqual(v.value.consent, { anonymousUse: true, recontact: false, diary: false });
});

test('un questionario completo è valido e torna normalizzato', () => {
  const r = validateSurvey(body(FULL_ANSWERS, { respondent: { name: '  Mario Rossi ', contact: 'mario@example.org' }, consent: { anonymousUse: true, recontact: true, diary: true } }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.value.respondent, { name: 'Mario Rossi', contact: 'mario@example.org' });
  assert.equal(r.value.answers.rain.drySummer.text, 'Serve una pioggia lunga.');
  assert.deepEqual(r.value.answers.rain.drySummer.quick, []);
  assert.equal(r.value.answers.forest.microsites, null);
  assert.equal(r.value.answers.flushes[0].hours, 2.5);
  assert.ok(!('website' in r.value));
  assert.equal(r.value.startedAt, '2026-10-16T08:00:00.000Z');
});

test('consenso, questionario e versione', () => {
  assert.ok(fields(body({}, { consent: { anonymousUse: false } })).includes('consent.anonymousUse'));
  assert.ok(fields(body({}, { consent: undefined })).includes('consent.anonymousUse'));
  assert.ok(fields(body({}, { consent: { anonymousUse: 'true' } })).includes('consent.anonymousUse'));
  assert.ok(fields(body({}, { consent: { anonymousUse: true, recontact: 'sì' } })).includes('consent.recontact'));
  assert.ok(fields(body({}, { survey: 'altro' })).includes('survey'));
  assert.ok(fields(body({}, { version: 2 })).includes('version'));
  // l'ora di inizio serve solo alla durata: se non è valida si ignora, senza bloccare l'invio
  assert.equal(validateSurvey(body({}, { startedAt: 'ieri' })).value.startedAt, null);
  assert.equal(validateSurvey(body({}, { startedAt: 42 })).value.startedAt, null);
  assert.ok(fields(body({}, { website: 'http://spam' })).includes('website'));
  assert.ok(fields(body({}, { answers: [] })).includes('answers'));
  assert.equal(validateSurvey(null).ok, false);
  assert.equal(validateSurvey([]).ok, false);
});

test('chiavi sconosciute rifiutate a ogni livello', () => {
  assert.ok(fields(body({}, { extra: 1 })).includes('extra'));
  assert.ok(fields(body({}, { respondent: { name: 'a', email: 'x' } })).includes('respondent.email'));
  assert.ok(fields(body({}, { consent: { anonymousUse: true, marketing: true } })).includes('consent.marketing'));
  rejects({ other: {} }, 'answers.other');
  rejects({ profile: { age: 50 } }, 'answers.profile.age');
  rejects({ species: [{ id: 'edulis', colour: 'bruno' }] }, 'answers.species[0].colour');
  rejects({ rain: { goodRain: { quick: [], text: '', note: 'x' } } }, 'answers.rain.goodRain');
  rejects({ species: [{ id: 'edulis', start: { month: 5, day: 3 } }] }, 'answers.species[0].start');
  rejects({ forest: { ranking: { moon: 1 } } }, 'answers.forest.ranking.moon');
  rejects({ ['__proto__']: { x: 1 } }, 'answers.__proto__');
  rejects(JSON.parse('{"profile":{"__proto__":{"years":1}}}'), 'answers.profile.__proto__');
});

test('limiti numerici dello schema', () => {
  for (const [answers, field] of [
    [{ profile: { years: 81 } }, 'answers.profile.years'], [{ profile: { years: -1 } }, 'answers.profile.years'], [{ profile: { years: 3.5 } }, 'answers.profile.years'],
    [{ profile: { years: '10 anni' } }, 'answers.profile.years'], [{ profile: { years: true } }, 'answers.profile.years'],
    [{ profile: { tripsGoodYear: 301 } }, 'answers.profile.tripsGoodYear'], [{ profile: { tripsBadYear: 301 } }, 'answers.profile.tripsBadYear'],
    [{ profile: { notesSince: 1949 } }, 'answers.profile.notesSince'], [{ profile: { notesSince: 2027 } }, 'answers.profile.notesSince'],
    [{ species: [{ id: 'edulis', elevMax: 3001 }] }, 'answers.species[0].elevMax'], [{ species: [{ id: 'edulis', lagTyp: 61 }] }, 'answers.species[0].lagTyp'],
    [{ species: [{ id: 'edulis', flushDays: 61 }] }, 'answers.species[0].flushDays'],
    [{ species: [{ id: 'edulis', confidence: 0 }] }, 'answers.species[0].confidence'], [{ species: [{ id: 'edulis', confidence: 6 }] }, 'answers.species[0].confidence'],
    [{ species: [{ id: 'edulis', start: { month: 13 } }] }, 'answers.species[0].start.month'], [{ species: [{ id: 'edulis', start: { month: 6, part: 'primi' } }] }, 'answers.species[0].start.part'],
    [{ weatherEvents: [{ year: 1999 }] }, 'answers.weatherEvents[0].year'], [{ weatherEvents: [{ year: 2027 }] }, 'answers.weatherEvents[0].year'],
    [{ weatherEvents: [{ daysAfter: 61 }] }, 'answers.weatherEvents[0].daysAfter'], [{ flushes: [{ week: 6 }] }, 'answers.flushes[0].week'],
    [{ flushes: [{ month: 0 }] }, 'answers.flushes[0].month'], [{ flushes: [{ hours: 24.5 }] }, 'answers.flushes[0].hours'],
    [{ emptyTrips: [{ elev: 3001 }] }, 'answers.emptyTrips[0].elev'], [{ forest: { ranking: { rain: 8 } } }, 'answers.forest.ranking.rain'],
  ]) rejects(answers, field);
  // numeri scritti come testo (campi di input) e decimali con la virgola
  assert.equal(accepts({ profile: { years: '12' } }).profile.years, 12);
  assert.equal(accepts({ flushes: [{ hours: '1,5' }] }).flushes[0].hours, 1.5);
  rejects({ flushes: [{ elev: '1300,5' }] }, 'answers.flushes[0].elev');
  assert.equal(accepts({ flushes: [{ hours: 0 }] }).flushes[0].hours, 0);
  assert.equal(accepts({ species: [{ id: 'edulis', elevMin: 0, elevMax: 3000 }] }).species[0].elevMax, 3000);
});

test('lunghezze dei testi', () => {
  const long = (n) => 'a'.repeat(n);
  assert.ok(fields(body({}, { respondent: { name: long(81) } })).includes('respondent.name'));
  assert.ok(fields(body({}, { respondent: { contact: long(121) } })).includes('respondent.contact'));
  assert.equal(validateSurvey(body({}, { respondent: { name: long(80), contact: long(120) } })).ok, true);
  for (const [answers, field] of [
    [{ profile: { mentor: long(301) } }, 'answers.profile.mentor.text'], [{ profile: { zonesOther: long(201) } }, 'answers.profile.zonesOther'],
    [{ species: [{ id: 'altra', name: long(61) }] }, 'answers.species[0].name'], [{ species: [{ id: 'edulis', changed: { quick: [], text: long(301) } }] }, 'answers.species[0].changed.text'],
    [{ rain: { goodRain: long(601) } }, 'answers.rain.goodRain.text'], [{ weatherEvents: [{ zone: long(81) }] }, 'answers.weatherEvents[0].zone'],
    [{ weatherEvents: [{ effect: long(401) }] }, 'answers.weatherEvents[0].effect.text'], [{ flushes: [{ species: long(61) }] }, 'answers.flushes[0].species'],
    [{ emptyTrips: [{ why: long(301) }] }, 'answers.emptyTrips[0].why.text'], [{ access: { gates: long(801) } }, 'answers.access.gates.text'],
    [{ access: { parking: long(601) } }, 'answers.access.parking.text'], [{ risks: { confusions: long(801) } }, 'answers.risks.confusions.text'],
    [{ followUp: { knowsOthers: long(301) } }, 'answers.followUp.knowsOthers.text'],
  ]) rejects(answers, field);
  assert.equal(accepts({ access: { gates: long(800) } }).access.gates.text.length, 800);
});

test('scelte chiuse, scelte multiple ed esclusive', () => {
  rejects({ profile: { zones: ['Roma'] } }, 'answers.profile.zones');
  rejects({ profile: { zones: ['Terminillo', 'Terminillo'] } }, 'answers.profile.zones');
  rejects({ profile: { speciesSought: ['boletus'] } }, 'answers.profile.speciesSought');
  rejects({ profile: { attestato: 'forse' } }, 'answers.profile.attestato');
  rejects({ profile: { aslCheck: 'spesso' } }, 'answers.profile.aslCheck');
  rejects({ profile: { notes: ['niente', 'quaderno'] } }, 'answers.profile.notes');
  rejects({ species: [{ id: 'edulis', forests: ['pineta'] }] }, 'answers.species[0].forests');
  rejects({ weatherEvents: [{ kind: 'grandine' }] }, 'answers.weatherEvents[0].kind');
  rejects({ weatherEvents: [{ seen: 'letto' }] }, 'answers.weatherEvents[0].seen');
  rejects({ flushes: [{ quantity: 'molti' }] }, 'answers.flushes[0].quantity');
  rejects({ flushes: [{ dateFrom: 'diario' }] }, 'answers.flushes[0].dateFrom');
  rejects({ emptyTrips: [{ speciesSought: ['altra'] }] }, 'answers.emptyTrips[0].speciesSought');
  rejects({ rain: { goodRain: { quick: ['una nevicata'], text: '' } } }, 'answers.rain.goodRain.quick');
  rejects({ rain: { goodRain: { quick: [DONT_KNOW, 'un temporale forte'], text: '' } } }, 'answers.rain.goodRain.quick');
  rejects({ forest: { cutAge: { quick: ['non fa differenza', 'alto fusto'], text: '' } } }, 'answers.forest.cutAge.quick');
  rejects({ followUp: { knowsOthers: { quick: ['no', 'sì, gli passo il link'], text: '' } } }, 'answers.followUp.knowsOthers.quick');
  rejects({ risks: { confusions: { quick: ['porcino e boleto di fiele'], text: '' } } }, 'answers.risks.confusions.quick');
  // «Non so» si può dare a ogni domanda aperta, anche a quelle solo testo
  assert.deepEqual(accepts({ risks: { confusions: { quick: [DONT_KNOW], text: '' } } }).risks.confusions, { quick: [DONT_KNOW], text: '' });
  assert.deepEqual(accepts({ profile: { notes: ['niente'] } }).profile.notes, ['niente']);
});

test('schede delle specie: «altra» con nome, niente doppioni, quote e giorni in ordine', () => {
  rejects({ species: [{ id: 'altra' }] }, 'answers.species[0].name');
  rejects({ species: [{ name: 'Porcino' }] }, 'answers.species[0].id');
  rejects({ species: [{ id: 'boletus' }] }, 'answers.species[0].id');
  rejects({ species: [{ id: 'edulis' }, { id: 'edulis' }] }, 'answers.species');
  assert.equal(accepts({ species: [{ id: 'altra', name: 'Prugnolo' }, { id: 'altra', name: 'Spugnola' }] }).species.length, 2);
  rejects({ species: [{ id: 'edulis', elevMin: 1500, elevMax: 900 }] }, 'answers.species[0].elevMax');
  rejects({ species: [{ id: 'edulis', elevMin: 900, elevMax: 1500, elevMode: 1600 }] }, 'answers.species[0].elevMode');
  rejects({ species: [{ id: 'edulis', lagMin: 10, lagTyp: 5 }] }, 'answers.species[0].lagMax');
  rejects({ species: [{ id: 'edulis', forests: ['faggeta'], forestsNever: ['faggeta'] }] }, 'answers.species[0].forestsNever');
  assert.equal(validateSurvey(body({ species: [{ id: 'edulis', elevMin: 1500, elevMax: 900 }] })).errors.length, 1, 'un solo errore per un solo problema');
  // la stagione può passare l'anno (ottobre → gennaio)
  accepts({ species: [{ id: 'nuda', start: { month: 10 }, end: { month: 1, part: 'fine' } }] });
  rejects({ species: Array.from({ length: 16 }, (_, i) => ({ id: 'altra', name: 'Specie ' + i })) }, 'answers.species');
  accepts({ species: Array.from({ length: 15 }, (_, i) => ({ id: 'altra', name: 'Specie ' + i })) });
});

test('liste di episodi, buttate e uscite a vuoto: al massimo 10, schede vuote ignorate', () => {
  for (const key of ['weatherEvents', 'flushes', 'emptyTrips']) {
    rejects({ [key]: Array.from({ length: 11 }, () => ({ year: 2024 })) }, `answers.${key}`);
    assert.equal(accepts({ [key]: Array.from({ length: 10 }, () => ({ year: 2024 })) })[key].length, 10);
    assert.deepEqual(accepts({ [key]: [{}, { year: null, zone: '' }] })[key], []);
    rejects({ [key]: {} }, `answers.${key}`);
  }
});

test('regole dei campi per la pagina: limiti delle liste, versione breve, fieldSpec', () => {
  assert.deepEqual(LIST_LIMITS, { species: 15, weatherEvents: 10, flushes: 10, emptyTrips: 10 });
  assert.deepEqual(SHORT_LIMITS, { species: 3, flushes: 3, emptyTrips: 1 });
  assert.equal(fieldSpec('rain.goodRain').max, 600);
  assert.equal(fieldSpec('rain.goodRain').key, 'rain.goodRain');
  assert.deepEqual(fieldSpec('species.elevMin'), { t: 'int', min: 0, max: 3000 });
  assert.equal(fieldSpec('flushes.hours').t, 'dec');
  assert.equal(fieldSpec('forest.ranking.crowd').max, 7);
  assert.equal(fieldSpec('profile.nope'), null);
  assert.equal(fieldSpec('constructor'), null);
});

test('classifica dei fattori: posti distinti da 1 a 7, anche parziale', () => {
  assert.deepEqual(accepts({ forest: { ranking: { rain: 1, crowd: 2 } } }).forest.ranking, { rain: 1, crowd: 2 });
  rejects({ forest: { ranking: { rain: 1, crowd: 1 } } }, 'answers.forest.ranking.crowd');
  accepts({ forest: { ranking: Object.fromEntries(RANKING_FACTORS.map((f, i) => [f.key, i + 1])) } });
});

test('testi: salvati come testo, senza caratteri di controllo', () => {
  const html = '<img src=x onerror="alert(1)"><b>bosco</b>';
  assert.equal(accepts({ risks: { confusions: html } }).risks.confusions.text, html, 'l’HTML resta testo, non viene interpretato né alterato');
  assert.equal(cleanText(' a\r\nb\u0000c\u202Ed\u0007 '), 'a\nbcd');
  assert.equal(accepts({ rain: { goodRain: '   ' } }).rain.goodRain, null);
  rejects({ rain: { goodRain: 12 } }, 'answers.rain.goodRain');
});


test('versante non conta per fase: combinazioni indipendenti e conflitti della stessa fase', () => {
  for (const [a,b] of [
    ['inizio stagione: il versante non conta', 'fine stagione: meglio a nord'],
    ['inizio stagione: meglio a est', 'fine stagione: il versante non conta'],
    ['inizio stagione: il versante non conta', 'fine stagione: il versante non conta'],
  ]) assert.equal(accepts({forest:{aspect:{quick:[a,b],text:''}}}).forest.aspect.quick.length, 2);
  for (const phase of ['inizio stagione','fine stagione'])
    for (const side of ['nord','sud','est','ovest'])
      rejects({forest:{aspect:{quick:[`${phase}: il versante non conta`,`${phase}: meglio a ${side}`],text:''}}}, 'answers.forest.aspect.quick');
});
