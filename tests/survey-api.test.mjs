// API del questionario (worker/survey.js) su un D1 finto (node:sqlite): invio anonimo, campo trappola,
// controlli del corpo, limite giornaliero senza IP, esportazione e cancellazione per gli amministratori.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// worker/survey.js importa la migrazione .sql e, tramite community.js, JSON senza attributi (come Wrangler).
register('data:text/javascript,' + encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url, context, next) {
  if (url.startsWith('file:') && (url.endsWith('.sql') || url.endsWith('.json') && !context.importAttributes?.type)) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return {format: 'module', shortCircuit: true, source: 'export default ' + (url.endsWith('.sql') ? JSON.stringify(text) : text) + ';'};
  }
  return next(url, context);
}`));
const { handleSurvey, cleanupSurvey, csvCell, toCsv, answerColumns, totalKey, EXPORT_PAGE, SURVEY_DAILY_LIMIT, SURVEY_DAILY_TOTAL } = await import('../worker/survey.js');
const { default: worker } = await import('../worker/index.js');

// D1 essenziale, come in tests/cms-content.test.mjs: prepare/bind/all/first/run e batch in transazione.
function d1(sql) {
  const stmt = (q, params = []) => {
    const exec = () => {
      const s = sql.prepare(q);
      if (/^\s*SELECT\b/i.test(q) || /\bRETURNING\b/i.test(q)) return { results: s.all(...params), meta: { changes: 0 } };
      return { results: [], meta: { changes: Number(s.run(...params).changes) } };
    };
    return { exec, bind: (...p) => stmt(q, p), all: async () => exec(), run: async () => exec(),
      first: async (col) => { const r = exec().results[0] ?? null; return col && r ? r[col] : r; } };
  };
  return { prepare: (q) => stmt(q), batch: async (list) => {
    sql.exec('BEGIN');
    try { const out = list.map((s) => s.exec()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; }
  } };
}

const ORIGIN = 'https://fungaroli.test', URL_RESPONSES = `${ORIGIN}/api/survey/v1/responses`;
const NOW = Date.parse('2026-10-16T10:00:00Z');
const ADMIN = 'admin-0000', EDITOR = 'editor-0000', MEMBER = 'member-0000';
const sha = (s) => createHash('sha256').update(s).digest('hex');

function setup() {
  const sql = new DatabaseSync(':memory:');
  // profili e sessioni della community (passkey): servono per riconoscere gli amministratori
  for (const f of ['0001_community.sql', '0003_account_preferences.sql']) sql.exec(readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8'));
  for (const id of [ADMIN, EDITOR, MEMBER]) {
    sql.prepare('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?)').run(id, id, NOW);
    sql.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(sha('token-' + id), id, NOW + 864e5);
  }
  const env = { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN, CMS_ADMIN_IDS: ` ${ADMIN} , other`, CMS_EDITOR_IDS: EDITOR };
  return { sql, env };
}
const cookie = (id) => ({ cookie: `__Host-fungaroli_session=token-${id}` });
// Corpo della versione 2 (corta): sapere abituale, nome e contatto perché segnalerebbe con l'app e vuole il ricontatto.
const valid = (extra = {}) => ({
  survey: 'esperti-reatino', version: 2, startedAt: new Date(NOW - 600_000).toISOString(), website: '',
  respondent: { name: 'Mario', contact: '333 0000000' }, consent: { anonymousUse: true, recontact: true },
  answers: {
    profile: { years: '30 anni o più', zones: ['Terminillo'], speciesSought: ['edulis'] },
    species: [{ id: 'edulis', months: ['settembre', 'giugno'], forests: ['faggeta'], elevation: ['tra 1000 e 1400 m'] }],
    willReport: 'sì',
  },
  ...extra,
});
// Una risposta della versione 1 com'era salvata prima del 21/10/2026 (schema congelato in js/survey-schema-v1.js).
const V1_ANSWERS = {
  profile: { years: 30, zones: ['Terminillo'], mentor: { quick: ['un familiare'], text: 'Mio padre' }, clarifications: [{ field: 'notesSince', kind: 'not_applicable', text: null }] },
  species: [{ id: 'edulis', start: { month: 6, part: 'fine' }, elevMin: 900, elevMax: 1600, forests: ['faggeta'], lagTyp: 12 }],
  flushes: [{ year: 2024, month: 9, zone: 'Campoforogna (Rieti)', quantity: 'tanti (oltre 20)', hours: 2.5 }],
  risks: { knowsPoisonings: 'no' }, notApplicableParts: ['G'],
};
const v1Body = (extra = {}) => ({ survey: 'esperti-reatino', version: 1, website: '', respondent: { name: 'Lucia', contact: '06 000' },
  consent: { anonymousUse: true, recontact: false, diary: true }, answers: V1_ANSWERS, ...extra });
const post = (env, body, { headers = {}, ip = '203.0.113.7', now = NOW, raw } = {}) => handleSurvey(new Request(URL_RESPONSES, {
  method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': ip, ...headers },
  body: raw ?? JSON.stringify(body),
}), env, now);
const get = (env, query = '', headers = {}, now = NOW) => handleSurvey(new Request(`${URL_RESPONSES}${query}`, { headers }), env, now);
const del = (env, ref, headers = {}) => handleSurvey(new Request(`${URL_RESPONSES}/${ref}`, { method: 'DELETE', headers: { origin: ORIGIN, ...headers } }), env, NOW);
// le tabelle del questionario nascono al primo invio valido: prima di allora le righe sono zero
const count = (sql, table = 'survey_responses') => sql.prepare('SELECT COUNT(*) AS n FROM sqlite_master WHERE name=?').get(table).n
  ? sql.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n : 0;
// contatori per connessione (hash) e tetto complessivo del giorno (chiave «total:…»)
const connectionRates = (sql) => sql.prepare("SELECT * FROM survey_rate WHERE key NOT LIKE 'total:%' ORDER BY day, key").all();
const dailyTotal = (sql, day = '2026-10-16') => count(sql, 'survey_rate') ? sql.prepare('SELECT count FROM survey_rate WHERE key=?').get(totalKey(day))?.count ?? 0 : 0;

test('un invio valido risponde 201 con id e ricevuta e salva la riga', async () => {
  const { sql, env } = setup();
  const r = await post(env, valid());
  assert.equal(r.status, 201);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const out = await r.json();
  assert.match(out.id, /^[0-9a-f-]{36}$/);
  assert.match(out.receipt, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.deepEqual(Object.keys(out).sort(), ['id', 'receipt']);
  const row = sql.prepare('SELECT * FROM survey_responses WHERE id=?').get(out.id);
  assert.equal(row.survey, 'esperti-reatino');
  assert.equal(row.version, 2);
  assert.equal(row.receipt, out.receipt);
  assert.equal(row.created_at, NOW);
  assert.equal(row.duration_s, 600);
  assert.equal(row.name, 'Mario');
  assert.equal(row.contact, '333 0000000');
  assert.equal(row.consent_recontact, 1);
  assert.equal(row.consent_diary, 0);
  const answers = JSON.parse(row.answers);
  assert.equal(answers.profile.years, '30 anni o più');
  assert.deepEqual(answers.species[0].months, ['giugno', 'settembre'], 'mesi in ordine di calendario');
  assert.equal(answers.willReport, 'sì');
  // l'IP non è salvato da nessuna parte: solo un hash nella tabella dei contatori
  for (const { name } of sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all())
    for (const r of sql.prepare(`SELECT * FROM ${name}`).all()) assert.ok(!JSON.stringify(r).includes('203.0.113.7'), name);
  const rate = connectionRates(sql);
  assert.equal(rate.length, 1);
  assert.equal(dailyTotal(sql), 1, 'tetto complessivo del giorno');
  assert.equal(totalKey('2026-10-16'), 'total:esperti-reatino:2026-10-16');
  assert.match(rate[0].key, /^[0-9a-f]{64}$/);
  assert.equal(rate[0].day, '2026-10-16');
  assert.equal(rate[0].count, 1);
  // l'hash non si ricava da IP, giorno e questionario senza il sale privato
  assert.notEqual(rate[0].key, sha('203.0.113.7' + '2026-10-16' + 'esperti-reatino'));
});

test('migrazione idempotente: un nuovo isolate riapplica 0004 senza perdere righe né cambiare il sale', async () => {
  const { sql, env } = setup();
  // il Worker divide il file sul punto e virgola: nei commenti non ce ne devono essere
  const migration = readFileSync(new URL('../migrations/0004_survey.sql', import.meta.url), 'utf8');
  for (const line of migration.split('\n')) if (line.trim().startsWith('--')) assert.ok(!line.includes(';'), line);
  assert.equal((await post(env, valid())).status, 201);
  const salt = sql.prepare("SELECT value FROM community_meta WHERE key='survey_ip_salt'").get().value;
  const again = { ...env, COMMUNITY_DB: d1(sql) }; // nuovo adattatore = nuovo isolate: init() riparte
  assert.equal((await post(again, valid())).status, 201);
  assert.equal(count(sql), 2);
  assert.equal(sql.prepare("SELECT value FROM community_meta WHERE key='survey_ip_salt'").get().value, salt);
  assert.equal(connectionRates(sql)[0].count, 2, 'stesso contatore per la stessa connessione');
  assert.equal(dailyTotal(sql), 2);
});

test('la rotta passa dal Worker', async () => {
  const { env } = setup();
  const r = await worker.fetch(new Request(URL_RESPONSES, { method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(valid()) }), env, {});
  assert.equal(r.status, 201);
});

test('campo trappola compilato: 201 finto e nulla salvato', async () => {
  const { sql, env } = setup();
  const r = await post(env, valid({ website: 'https://spam.example' }));
  assert.equal(r.status, 201);
  const out = await r.json();
  assert.match(out.id, /^[0-9a-f-]{36}$/);
  assert.match(out.receipt, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(count(sql), 0);
  assert.equal(count(sql, 'survey_rate'), 0);
  // anche con il resto del corpo non valido
  assert.equal((await post(env, { website: 'x', foo: 1 })).status, 201);
  assert.equal(count(sql), 0);
});

test('consenso mancante o chiave sconosciuta: 400 con messaggio e campi', async () => {
  const { sql, env } = setup();
  let r = await post(env, valid({ consent: { anonymousUse: false, recontact: false } }));
  assert.equal(r.status, 400);
  let out = await r.json();
  assert.match(out.error, /consenso/);
  assert.deepEqual(out.fields, ['consent.anonymousUse']);
  r = await post(env, valid({ consent: undefined }));
  assert.equal(r.status, 400);
  const body = valid(); body.answers.profile.favouriteSpot = 'Fonte segreta';
  r = await post(env, body);
  assert.equal(r.status, 400);
  out = await r.json();
  assert.deepEqual(out.fields, ['answers.profile.favouriteSpot']);
  assert.equal(out.errors[0].field, 'answers.profile.favouriteSpot');
  r = await post(env, { ...valid(), tracking: 'x' });
  assert.deepEqual((await r.json()).fields, ['tracking']);
  assert.equal(count(sql), 0);
  assert.equal(count(sql, 'survey_rate'), 0, 'un invio rifiutato non consuma il limite');
});

test('limiti numerici e lunghezze dei testi: 400 con il percorso del campo', async () => {
  const { sql, env } = setup();
  const cases = [
    [(b) => { b.answers.profile.years = 30; }, 'answers.profile.years'],
    [(b) => { b.answers.species[0].months = ['tredicembre']; }, 'answers.species[0].months'],
    [(b) => { b.answers.species[0].elevation = ['non so', 'sopra i 1400 m']; }, 'answers.species[0].elevation'],
    [(b) => { b.answers.species[0].elevMax = 1600; }, 'answers.species[0].elevMax'],
    [(b) => { b.answers.flushes = [{ year: 2024 }]; }, 'answers.flushes'],
    [(b) => { b.respondent.name = 'x'.repeat(81); }, 'respondent.name'],
    [(b) => { b.respondent.contact = 'x'.repeat(121); }, 'respondent.contact'],
    [(b) => { b.answers.warning = 'x'.repeat(801); }, 'answers.warning'],
    [(b) => { b.answers.barrenZones = { where: 'x'.repeat(601) }; }, 'answers.barrenZones.where'],
    [(b) => { b.answers.profile.zones = Array.from({ length: 6 }, (_, i) => 'Zona ' + i); }, 'answers.profile.zones'],
    [(b) => { b.answers.profile.speciesOther = Array.from({ length: 6 }, (_, i) => 'S' + i); b.answers.species = b.answers.profile.speciesOther.map((name) => ({ id: 'altra', name })); }, 'answers.species'],
  ];
  for (const [edit, field] of cases) {
    const b = valid(); edit(b);
    const r = await post(env, b);
    assert.equal(r.status, 400, field);
    assert.ok((await r.json()).fields.includes(field), field);
  }
  assert.equal(count(sql), 0);
});

test('corpo oltre 64 KB: 413; tipo sbagliato: 415; JSON rotto: 400', async () => {
  const { sql, env } = setup();
  const big = valid(); big.answers.warning = 'x'.repeat(70_000);
  assert.equal((await post(env, big)).status, 413);
  assert.equal((await post(env, null, { raw: '{"a":"' + 'x'.repeat(65_536) + '"}', headers: { 'content-length': '65545' } })).status, 413);
  assert.equal((await post(env, valid(), { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await post(env, valid(), { headers: { 'content-type': 'application/x-www-form-urlencoded' } })).status, 415);
  assert.equal((await post(env, valid(), { headers: { 'content-type': 'application/json; charset=utf-8' } })).status, 201);
  const broken = await post(env, null, { raw: '{"survey":' });
  assert.equal(broken.status, 400);
  assert.match((await broken.json()).error, /non valida/);
  assert.equal(count(sql), 1);
});

test('origine estranea o assente: 403', async () => {
  const { sql, env } = setup();
  assert.equal((await post(env, valid(), { headers: { origin: 'https://evil.example' } })).status, 403);
  const noOrigin = await handleSurvey(new Request(URL_RESPONSES, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(valid()) }), env, NOW);
  assert.equal(noOrigin.status, 403);
  assert.equal(count(sql), 0);
});

test('al massimo 10 invii al giorno per connessione: l’undicesimo risponde 429 con Retry-After', async () => {
  const { sql, env } = setup();
  for (let i = 0; i < SURVEY_DAILY_LIMIT; i++) assert.equal((await post(env, valid())).status, 201, `invio ${i + 1}`);
  const r = await post(env, valid());
  assert.equal(r.status, 429);
  assert.equal(Number(r.headers.get('retry-after')), 14 * 3600, 'fino alla mezzanotte UTC');
  assert.match((await r.json()).error, /Riprova domani/);
  assert.equal(count(sql), 10);
  // un'altra connessione e il giorno dopo non sono bloccati
  assert.equal((await post(env, valid(), { ip: '198.51.100.9' })).status, 201);
  assert.equal((await post(env, valid(), { now: NOW + 864e5 })).status, 201);
  // l'invio rifiutato dal limite per connessione non consuma il tetto complessivo
  assert.equal(dailyTotal(sql), 11);
  // a ogni invio restano solo i contatori di oggi e di ieri: quelli di 2 giorni fa si cancellano
  const days = () => connectionRates(sql).map((r) => r.day);
  const totals = () => sql.prepare("SELECT day, count FROM survey_rate WHERE key LIKE 'total:%' ORDER BY day").all().map((r) => `${r.day}:${r.count}`);
  assert.deepEqual(days(), ['2026-10-16', '2026-10-16', '2026-10-17']);
  assert.deepEqual(totals(), ['2026-10-16:11', '2026-10-17:1']);
  assert.equal((await post(env, valid(), { now: NOW + 2 * 864e5 })).status, 201);
  assert.deepEqual(days(), ['2026-10-17', '2026-10-18']);
  assert.deepEqual(totals(), ['2026-10-17:1', '2026-10-18:1']);
  // il cron fa lo stesso anche senza nuovi invii
  await cleanupSurvey(env, NOW + 3 * 864e5);
  assert.deepEqual(sql.prepare('SELECT day FROM survey_rate').all().map((r) => r.day), ['2026-10-18', '2026-10-18']);
  await cleanupSurvey(env, NOW + 10 * 864e5);
  assert.equal(count(sql, 'survey_rate'), 0);
});

test('tetto complessivo: al massimo 200 invii accettati al giorno (UTC), poi 429 con Retry-After e un messaggio chiaro', async () => {
  const { sql, env } = setup();
  assert.equal(SURVEY_DAILY_TOTAL, 200);
  // né gli invii rifiutati dalla validazione né il campo trappola consumano il tetto
  assert.equal((await post(env, valid({ consent: { anonymousUse: false } }))).status, 400);
  assert.equal((await post(env, valid({ website: 'https://spam.example' }))).status, 201);
  assert.equal(dailyTotal(sql), 0);
  // 200 invii da 20 connessioni diverse, 10 ciascuna (il limite per connessione)
  for (let i = 0; i < SURVEY_DAILY_TOTAL; i++)
    assert.equal((await post(env, valid(), { ip: `198.51.100.${Math.floor(i / SURVEY_DAILY_LIMIT) + 1}` })).status, 201, `invio ${i + 1}`);
  assert.equal(count(sql), SURVEY_DAILY_TOTAL);
  assert.equal(dailyTotal(sql), SURVEY_DAILY_TOTAL);
  // il 201° da una connessione nuova: 429 fino alla mezzanotte UTC, con il codice del tetto
  const r = await post(env, valid(), { ip: '203.0.113.200' });
  assert.equal(r.status, 429);
  assert.equal(Number(r.headers.get('retry-after')), 14 * 3600);
  const out = await r.json();
  assert.equal(out.code, 'daily-limit');
  assert.match(out.error, /Per oggi il questionario ha ricevuto tutte le risposte che può accettare\. Riprova domani\./);
  assert.equal(count(sql), SURVEY_DAILY_TOTAL, 'nessuna riga in più');
  assert.equal(dailyTotal(sql), SURVEY_DAILY_TOTAL, 'il tetto non va oltre 200');
  // una connessione oltre il proprio limite riceve il messaggio della connessione, non quello del tetto
  const own = await post(env, valid(), { ip: '198.51.100.1' });
  assert.equal(own.status, 429);
  assert.equal((await own.json()).code, 'connection-limit');
  // a mezzanotte UTC il tetto riparte
  const tomorrow = Date.parse('2026-10-17T00:00:00Z');
  assert.equal((await post(env, valid(), { ip: '203.0.113.200', now: tomorrow })).status, 201);
  assert.equal(dailyTotal(sql, '2026-10-17'), 1);
  assert.equal(count(sql), SURVEY_DAILY_TOTAL + 1);
});

test('con il tetto pieno un tentativo non consuma il limite della connessione', async () => {
  const { sql, env } = setup();
  assert.equal((await post(env, valid(), { ip: '198.51.100.1' })).status, 201); // crea le tabelle
  sql.prepare('UPDATE survey_rate SET count=? WHERE key=?').run(SURVEY_DAILY_TOTAL, totalKey('2026-10-16'));
  const before = connectionRates(sql);
  // più tentativi del limite per connessione: tutti respinti dal tetto, con il messaggio del tetto
  for (let i = 0; i < SURVEY_DAILY_LIMIT + 3; i++) {
    const r = await post(env, valid(), { ip: '203.0.113.50' });
    assert.equal(r.status, 429, `tentativo ${i + 1}`);
    assert.equal((await r.json()).code, 'daily-limit', `tentativo ${i + 1}`);
  }
  assert.deepEqual(connectionRates(sql), before, 'nessun contatore di connessione nuovo o cresciuto');
  assert.equal(dailyTotal(sql), SURVEY_DAILY_TOTAL);
  assert.equal(count(sql), 1);
  // quando il tetto si libera, la stessa connessione ha ancora tutti i suoi invii
  sql.prepare('UPDATE survey_rate SET count=1 WHERE key=?').run(totalKey('2026-10-16'));
  for (let i = 0; i < SURVEY_DAILY_LIMIT; i++) assert.equal((await post(env, valid(), { ip: '203.0.113.50' })).status, 201, `invio ${i + 1}`);
  const over = await post(env, valid(), { ip: '203.0.113.50' });
  assert.equal(over.status, 429);
  assert.equal((await over.json()).code, 'connection-limit');
  assert.equal(dailyTotal(sql), 1 + SURVEY_DAILY_LIMIT);
});

test('esportazione JSON solo per gli amministratori', async () => {
  const { env } = setup();
  const sent = await (await post(env, valid())).json();
  assert.equal((await get(env, '?survey=esperti-reatino&format=json')).status, 401);
  assert.equal((await get(env, '?survey=esperti-reatino&format=json', { cookie: '__Host-fungaroli_session=sbagliato' })).status, 401);
  assert.equal((await get(env, '?survey=esperti-reatino&format=json', cookie(EDITOR))).status, 403);
  assert.equal((await get(env, '?survey=esperti-reatino&format=json', cookie(MEMBER))).status, 403);
  const r = await get(env, '?survey=esperti-reatino&format=json', cookie(ADMIN));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const out = await r.json();
  assert.equal(out.count, 1);
  assert.equal(out.responses[0].id, sent.id);
  assert.equal(out.responses[0].receipt, sent.receipt);
  assert.equal(out.responses[0].createdAt, '2026-10-16T10:00:00.000Z');
  assert.deepEqual(out.responses[0].consent, { anonymousUse: true, recontact: true, diary: false });
  assert.equal(out.responses[0].version, 2);
  assert.equal(out.responses[0].answers.profile.years, '30 anni o più');
  assert.equal((await get(env, '?survey=altro&format=json', cookie(ADMIN))).status, 400);
  assert.equal((await get(env, '?survey=esperti-reatino&format=xml', cookie(ADMIN))).status, 400);
  // un editor CMS con sessione valida resta senza accesso anche con altri parametri
  assert.equal((await get(env, '?receipt=' + sent.receipt, cookie(EDITOR))).status, 403);
});

test('conteggio per la redazione (format=count): numero e data dell’ultima, senza le risposte', async () => {
  const { env } = setup();
  assert.equal((await get(env, '?survey=esperti-reatino&format=count')).status, 401);
  assert.equal((await get(env, '?survey=esperti-reatino&format=count', cookie(EDITOR))).status, 403);
  // nessuna risposta (le tabelle nascono qui)
  assert.deepEqual(await (await get(env, '?survey=esperti-reatino&format=count', cookie(ADMIN))).json(), { survey: 'esperti-reatino', count: 0, lastAt: null, byVersion: { 1: 0, 2: 0 } });
  await post(env, valid());
  const second = await (await post(env, valid(), { now: NOW + 60_000 })).json();
  const r = await get(env, '?survey=esperti-reatino&format=count', cookie(ADMIN));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const text = await r.text();
  assert.deepEqual(JSON.parse(text), { survey: 'esperti-reatino', count: 2, lastAt: '2026-10-16T10:01:00.000Z', byVersion: { 1: 0, 2: 2 } });
  assert.doesNotMatch(text, /Mario|333/, 'né nomi né contatti');
  assert.equal((await (await get(env, `?format=count&receipt=${second.receipt}`, cookie(ADMIN))).json()).count, 1);
});

test('esportazione a pagine: tutte le righe, in ordine, senza un massimo; un errore a metà non dà un file troncato in silenzio', async () => {
  const { sql, env } = setup();
  await post(env, valid()); // crea le tabelle
  const insert = sql.prepare('INSERT INTO survey_responses(id,survey,version,receipt,created_at,duration_s,name,contact,consent_recontact,consent_diary,answers) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  const n = 2 * EXPORT_PAGE + 49;
  // molte righe con la stessa data: il cursore usa anche l'id
  const YEARS = ['meno di 5 anni', 'da 5 a 14 anni', 'da 15 a 29 anni', '30 anni o più', 'preferisco non dirlo'];
  for (let i = 0; i < n; i++) insert.run(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, 'esperti-reatino', 2, `X${String(i).padStart(7, '0')}`,
    NOW - 1000 + Math.floor(i / 7), null, null, null, 0, 0, JSON.stringify({ profile: { years: YEARS[i % 5] } }));
  const total = n + 1;
  const pages = [];
  const spied = { ...env, COMMUNITY_DB: { ...env.COMMUNITY_DB, prepare: (q) => { if (/FROM survey_responses .*LIMIT/.test(q)) pages.push(q); return env.COMMUNITY_DB.prepare(q); } } };
  const out = await (await get(spied, '?survey=esperti-reatino&format=json', cookie(ADMIN))).json();
  assert.equal(out.count, total);
  assert.equal(out.responses.length, total);
  assert.equal(new Set(out.responses.map((x) => x.id)).size, total, 'nessuna riga ripetuta');
  const keys = out.responses.map((x) => [x.createdAt, x.id]);
  assert.deepEqual(keys, [...keys].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1)), 'in ordine di arrivo');
  assert.equal(pages.length, Math.ceil(total / EXPORT_PAGE), 'una lettura per pagina');
  assert.equal(out.responses.at(-1).name, 'Mario', 'l’ultima arrivata è in fondo');
  const csv = new TextDecoder().decode(await (await get(env, '?survey=esperti-reatino&format=csv&sep=semicolon', cookie(ADMIN))).arrayBuffer());
  assert.equal(csv.split('\r\n').filter(Boolean).length, total + 1, 'intestazione e una riga per risposta');
  // il file scritto a pezzi è identico a quello fatto in una volta
  const all = sql.prepare('SELECT * FROM survey_responses ORDER BY created_at, id').all();
  assert.equal('\uFEFF' + csv, toCsv(all, ';'));
  // la prima pagina fallisce: 503 senza dettagli; una pagina dopo la prima fallisce: la lettura del file dà errore
  let calls = 0;
  const failing = (after) => ({ ...env, COMMUNITY_DB: { ...env.COMMUNITY_DB, prepare: (q) => {
    if (/FROM survey_responses .*LIMIT/.test(q) && ++calls > after) throw new Error('D1 segreto');
    return env.COMMUNITY_DB.prepare(q);
  } } });
  const down = await get(failing(0), '?survey=esperti-reatino&format=json', cookie(ADMIN));
  assert.equal(down.status, 503);
  assert.doesNotMatch(await down.text(), /segreto/);
  calls = 0;
  const broken = await get(failing(1), '?survey=esperti-reatino&format=csv', cookie(ADMIN));
  assert.equal(broken.status, 200);
  await assert.rejects(broken.text());
});

test('esportazione CSV: colonne piatte, liste in JSON, formule neutralizzate', async () => {
  const { env } = setup();
  const b = valid({ respondent: { name: '=HYPERLINK("http://x","clic")', contact: '+39 333' } });
  b.answers.warning = '@SUM(A1)';
  b.answers.barrenZones = { where: '-1 e "virgolette", a capo\nseconda riga', opinion: '<script>alert(1)</script>' };
  await post(env, b);
  assert.equal((await get(env, '?survey=esperti-reatino&format=csv')).status, 401);
  assert.equal((await get(env, '?survey=esperti-reatino&format=csv', cookie(EDITOR))).status, 403);
  const r = await get(env, '?survey=esperti-reatino&format=csv', cookie(ADMIN));
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /^text\/csv; charset=utf-8/);
  assert.match(r.headers.get('content-disposition'), /^attachment; filename="questionario-esperti-reatino-v2-2026-10-16\.csv"$/);
  const bytes = new Uint8Array(await r.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xEF, 0xBB, 0xBF], 'BOM UTF-8: Excel legge bene gli accenti');
  const text = new TextDecoder().decode(bytes); // il decoder toglie il BOM
  assert.ok(text.endsWith('\r\n'));
  const [header, ...rest] = text.split('\r\n');
  const columns = header.split(',');
  assert.deepEqual(columns.slice(0, 10), ['id', 'created_at', 'survey', 'version', 'receipt', 'duration_s', 'name', 'contact', 'consent_recontact', 'consent_diary']);
  assert.deepEqual(columns.slice(10), ['profile.years', 'profile.zones', 'profile.speciesSought', 'profile.speciesOther', 'species', 'barrenZones.where', 'barrenZones.opinion', 'warning', 'willReport']);
  assert.deepEqual(columns.slice(10), answerColumns());
  assert.deepEqual(columns.slice(10), answerColumns(2));
  const row = rest.join('\r\n');
  assert.ok(row.includes(`"'=HYPERLINK(""http://x"",""clic"")"`), 'formula neutralizzata e virgolette raddoppiate');
  assert.ok(row.includes(",'+39 333,"));
  assert.ok(row.includes(",'@SUM(A1),sì"));
  assert.ok(row.includes(`"'-1 e ""virgolette"", a capo\nseconda riga"`));
  assert.ok(row.split(',')[3] === '2', 'la versione in ogni riga');
  assert.ok(row.includes('<script>alert(1)</script>'), 'testo salvato così com’è, mai reso come HTML');
  assert.ok(row.includes('"[""Terminillo""]"'), 'le liste sono in JSON');
  assert.ok(row.includes('"[{""id"":""edulis""'));
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(0), '0');
  assert.equal(csvCell('=1+1'), "'=1+1");
  assert.equal(csvCell('-'), "'-");
  assert.equal(csvCell(' =1'), "' =1");
  assert.equal(csvCell('\tx'), "'\tx");
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell(['=x']), '"[""=x""]"');
});

// Lettore CSV con le regole di RFC 4180 (virgolette che aprono un campo, "" dentro le virgolette).
function parseCsv(text, sep) {
  const rows = [[]]; let cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) { rows.at(-1).push(cell); cell = ''; }
    else if (c === '\r' && text[i + 1] === '\n') { rows.at(-1).push(cell); cell = ''; rows.push([]); i++; }
    else cell += c;
  }
  if (cell || rows.at(-1).length) rows.at(-1).push(cell);
  return rows.filter((r) => r.length);
}

test('esportazione «CSV per Excel»: separatore punto e virgola con &sep=semicolon, stesse colonne e stesse celle', async () => {
  const { env } = setup();
  const b = valid({ respondent: { name: 'Rossi; Mario', contact: '=1+1' } });
  b.answers.warning = 'porcino, boleto di fiele, -1 volta; =2';
  await post(env, b);
  const commaRows = parseCsv(new TextDecoder().decode(await (await get(env, '?survey=esperti-reatino&format=csv', cookie(ADMIN))).arrayBuffer()), ',');
  const semi = await get(env, '?survey=esperti-reatino&format=csv&sep=semicolon', cookie(ADMIN));
  assert.equal(semi.status, 200);
  assert.match(semi.headers.get('content-type'), /^text\/csv; charset=utf-8/);
  assert.match(semi.headers.get('content-disposition'), /^attachment; filename="questionario-esperti-reatino-v2-2026-10-16-excel\.csv"$/);
  const bytes = new Uint8Array(await semi.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xEF, 0xBB, 0xBF], 'BOM UTF-8 anche qui');
  const text = new TextDecoder().decode(bytes);
  const [header, row] = parseCsv(text, ';');
  assert.deepEqual(header, commaRows[0], 'stesse colonne della versione con la virgola');
  assert.equal(header.length, row.length);
  const cell = (c) => row[header.indexOf(c)];
  assert.equal(cell('name'), 'Rossi; Mario');
  assert.equal(cell('contact'), "'=1+1");
  // apostrofo dopo il punto e virgola e, solo nella versione per Excel, anche dopo la virgola
  assert.equal(cell('warning'), "porcino, boleto di fiele,' -1 volta;' =2");
  assert.equal(commaRows[1][header.indexOf('warning')], "porcino, boleto di fiele, -1 volta;' =2");
  assert.equal(cell('willReport'), 'sì');
  assert.equal(cell('version'), '2');
  assert.equal(cell('profile.years'), '30 anni o più');
  // la versione con la virgola resta quella predefinita, anche scritta per esteso
  assert.equal((await get(env, '?survey=esperti-reatino&format=csv&sep=comma', cookie(ADMIN))).headers.get('content-disposition'),
    'attachment; filename="questionario-esperti-reatino-v2-2026-10-16.csv"');
  const wrong = await get(env, '?survey=esperti-reatino&format=csv&sep=tab', cookie(ADMIN));
  assert.equal(wrong.status, 400);
  assert.match((await wrong.json()).error, /Separatore non valido/);
  assert.equal((await get(env, '?survey=esperti-reatino&format=csv&sep=semicolon')).status, 401);
  assert.equal((await get(env, '?survey=esperti-reatino&format=csv&sep=semicolon', cookie(EDITOR))).status, 403);
  // decimali con la virgola nella versione per Excel in italiano; con la virgola come separatore, il punto
  assert.equal(csvCell(2.5, ';'), '"2,5"');
  assert.equal(csvCell(2.5), '2.5');
  assert.equal(csvCell(30, ';'), '30');
});

test('ricerca per ricevuta e cancellazione: solo amministratori', async () => {
  const { sql, env } = setup();
  const a = await (await post(env, valid())).json();
  const b = await (await post(env, valid())).json();
  // ricerca per ricevuta, anche in minuscolo o con il trattino
  const spaced = (a.receipt.slice(0, 4) + '-' + a.receipt.slice(4)).toLowerCase();
  let r = await get(env, `?survey=esperti-reatino&receipt=${spaced}`, cookie(ADMIN));
  assert.equal(r.status, 200);
  let out = await r.json();
  assert.equal(out.count, 1);
  assert.equal(out.responses[0].id, a.id);
  assert.equal((await (await get(env, '?receipt=ZZZZZZZZ', cookie(ADMIN))).json()).count, 0);
  assert.equal((await get(env, '?receipt=12', cookie(ADMIN))).status, 400);
  assert.equal((await get(env, `?receipt=${a.receipt}`)).status, 401);
  // cancellazione
  assert.equal((await del(env, a.id)).status, 401);
  assert.equal((await del(env, a.id, cookie(EDITOR))).status, 403);
  assert.equal((await del(env, a.id, { ...cookie(ADMIN), origin: 'https://evil.example' })).status, 403);
  r = await del(env, a.id.toUpperCase(), cookie(ADMIN));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, id: a.id, receipt: a.receipt });
  assert.equal(count(sql), 1);
  assert.equal((await del(env, a.id, cookie(ADMIN))).status, 404);
  // anche con il codice ricevuta
  r = await del(env, b.receipt.toLowerCase(), cookie(ADMIN));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).id, b.id);
  assert.equal(count(sql), 0);
  assert.equal((await del(env, 'non-valido', cookie(ADMIN))).status, 400);
  assert.equal((await del(env, '%E0%A4%A', cookie(ADMIN))).status, 400);
});

test('metodi e percorsi non previsti, servizio non configurato', async () => {
  const { env } = setup();
  const put = await handleSurvey(new Request(URL_RESPONSES, { method: 'PUT', headers: { origin: ORIGIN } }), env, NOW);
  assert.equal(put.status, 405);
  assert.equal(put.headers.get('allow'), 'GET, POST');
  assert.equal((await handleSurvey(new Request(`${URL_RESPONSES}/x`, { method: 'GET' }), env, NOW)).status, 405);
  assert.equal((await handleSurvey(new Request(`${ORIGIN}/api/survey/v1/altro`), env, NOW)).status, 404);
  assert.equal((await handleSurvey(new Request(URL_RESPONSES, { method: 'POST' }), {}, NOW)).status, 503);
  // un errore interno non espone dettagli
  const broken = { ...env, COMMUNITY_DB: { prepare: () => { throw new Error('D1 segreto'); }, batch: async () => { throw new Error('D1 segreto'); } } };
  const r = await post(broken, valid());
  assert.equal(r.status, 503);
  assert.doesNotMatch(await r.text(), /segreto/);
});


test('invii vuoti o con soli contenitori non consumano né tetto né limite della connessione', async () => {
  const {env, sql} = setup();
  for (const answers of [{}, {profile: {}}, {profile: {zones: ['  ', '']}}, {barrenZones: {where: ' ', opinion: null}}, {species: [], warning: ''}]) {
    assert.equal((await post(env, valid({answers}))).status, 400);
    assert.equal(count(sql), 0);
    assert.equal(dailyTotal(sql), 0);
    assert.equal(count(sql, 'survey_rate'), 0);
  }
  // «No» e «Preferisco non dirlo» sono risposte, non caselle vuote; anche una specie conosciuta è informazione.
  for (const answers of [{profile: {years: 'preferisco non dirlo'}}, {willReport: 'no'}, {profile: {speciesSought: ['edulis']}, species: [{id: 'edulis'}]}])
    assert.equal((await post(env, valid({answers}))).status, 201);
  assert.equal(dailyTotal(sql), 3);
});

test('scadenze: recapito azzerato nel 2028, risposte eliminate nel 2029, raccolta chiusa', async () => {
  const {env, sql} = setup();
  await post(env, valid());
  await cleanupSurvey(env, Date.parse('2027-12-31T23:59:59.999Z'));
  assert.equal(sql.prepare('SELECT contact FROM survey_responses').get().contact, '333 0000000');
  await cleanupSurvey(env, Date.parse('2028-01-01T00:00:00Z'));
  const row = sql.prepare('SELECT name,contact,consent_recontact,consent_diary FROM survey_responses').get();
  assert.deepEqual({...row}, {name:'Mario', contact:null, consent_recontact:0, consent_diary:0});
  assert.equal(count(sql), 1);
  await cleanupSurvey(env, Date.parse('2028-12-31T23:59:59.999Z'));
  assert.equal(count(sql), 1);
  await cleanupSurvey(env, Date.parse('2029-01-01T00:00:00Z'));
  assert.equal(count(sql), 0);
  assert.equal((await post(env, valid(), {now:Date.parse('2029-01-01T00:00:00Z')})).status, 410);
});


test('dal 2028 non si raccolgono nuovi recapiti, neanche da una pagina vecchia', async () => {
  const {env, sql}=setup();
  assert.equal((await post(env, valid(), {now:Date.parse('2028-01-01T00:00:00Z')})).status, 201);
  const row=sql.prepare('SELECT name,contact,consent_recontact,consent_diary FROM survey_responses').get();
  assert.deepEqual({...row}, {name:'Mario', contact:null, consent_recontact:0, consent_diary:0});
});


// Risposte della versione 1: restano archiviate così come sono, si leggono ed esportano con lo schema congelato.
function insertV1(sql, i = 0, created = NOW - 864e5) {
  const { validateSurveyV1 } = v1Schema;
  const v = validateSurveyV1(v1Body()).value;
  sql.prepare('INSERT INTO survey_responses(id,survey,version,receipt,created_at,duration_s,name,contact,consent_recontact,consent_diary,answers) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(`10000000-0000-4000-8000-${String(i).padStart(12, '0')}`, 'esperti-reatino', 1, `V222222${'ABCDEFGHJK'[i]}`, created, 900, v.respondent.name, v.respondent.contact, 0, 1, JSON.stringify(v.answers));
  return v;
}
const v1Schema = await import('../js/survey-schema-v1.js');

test('una pagina vecchia (versione 1) riceve 400 «ricarica la pagina», senza salvare né consumare i limiti', async () => {
  const { sql, env } = setup();
  const r = await post(env, v1Body());
  assert.equal(r.status, 400);
  const out = await r.json();
  // un solo errore, chiaro: le risposte non si giudicano con lo schema di un'altra versione
  assert.deepEqual(out.fields, ['version']);
  assert.match(out.error, /ricarica la pagina/);
  assert.equal(count(sql), 0);
  assert.equal(count(sql, 'survey_rate'), 0);
});

test('versione 1 archiviata: JSON con tutte le versioni, CSV per versione (&version=1|2, predefinita la 2), conteggio per versione', async () => {
  const { sql, env } = setup();
  const sent = await (await post(env, valid())).json(); // crea le tabelle e una risposta v2
  const old = insertV1(sql);
  // JSON: tutte le versioni, ciascuna con la sua «version»; le risposte v1 restano com'erano salvate
  const all = await (await get(env, '?format=json', cookie(ADMIN))).json();
  assert.equal(all.count, 2);
  assert.deepEqual(all.responses.map((x) => x.version), [1, 2]);
  assert.deepEqual(all.responses[0].answers, old.answers);
  assert.deepEqual(all.responses[0].consent, { anonymousUse: true, recontact: false, diary: true });
  assert.equal(all.version, undefined);
  const onlyV1 = await (await get(env, '?format=json&version=1', cookie(ADMIN))).json();
  assert.equal(onlyV1.version, 1);
  assert.deepEqual(onlyV1.responses.map((x) => x.receipt), ['V222222A']);
  // ricerca per ricevuta: trova anche le risposte v1 (richieste di cancellazione)
  assert.equal((await (await get(env, '?format=json&receipt=v222-222a', cookie(ADMIN))).json()).count, 1);
  // conteggio per versione
  assert.deepEqual((await (await get(env, '?format=count', cookie(ADMIN))).json()).byVersion, { 1: 1, 2: 1 });
  assert.deepEqual(await (await get(env, '?format=count&version=1', cookie(ADMIN))).json(), { survey: 'esperti-reatino', count: 1, lastAt: new Date(NOW - 864e5).toISOString(), byVersion: { 1: 1 } });
  // CSV predefinito: solo la versione corrente, con le sue colonne
  const csv2 = parseCsvText(await (await get(env, '?format=csv', cookie(ADMIN))).text(), ',');
  assert.deepEqual(csv2[0].slice(10), answerColumns(2));
  assert.deepEqual(csv2.slice(1).map((row) => row[csv2[0].indexOf('receipt')]), [sent.receipt]);
  // CSV della versione 1: colonne dello schema congelato, la versione in ogni riga
  const res1 = await get(env, '?format=csv&version=1&sep=semicolon', cookie(ADMIN));
  assert.match(res1.headers.get('content-disposition'), /filename="questionario-esperti-reatino-v1-2026-10-16-excel\.csv"/);
  const csv1 = parseCsvText(await res1.text(), ';');
  assert.deepEqual(csv1[0].slice(10), answerColumns(1));
  assert.ok(csv1[0].includes('profile.mentor.quick') && csv1[0].includes('flushes') && csv1[0].includes('notApplicableParts') && csv1[0].includes('profile.clarifications'));
  assert.equal(csv1.length, 2);
  const cell = (c) => csv1[1][csv1[0].indexOf(c)];
  assert.equal(cell('version'), '1');
  assert.equal(cell('profile.years'), '30');
  assert.equal(cell('profile.mentor.text'), 'Mio padre');
  assert.equal(cell('consent_diary'), '1');
  // le liste restano in JSON (nel file con la virgola si rileggono così come sono)
  const comma1 = parseCsvText(await (await get(env, '?format=csv&version=1', cookie(ADMIN))).text(), ',');
  assert.deepEqual(JSON.parse(comma1[1][comma1[0].indexOf('flushes')]), V1_ANSWERS.flushes);
  // versioni non previste: 400
  for (const v of ['3', '0', 'due', '']) assert.equal((await get(env, `?format=csv&version=${v}`, cookie(ADMIN))).status, 400, v);
  // un CSV contiene una sola versione: righe miste rifiutate
  const rows = sql.prepare('SELECT * FROM survey_responses ORDER BY created_at').all();
  assert.throws(() => toCsv(rows, ','), /una sola/);
  assert.equal(toCsv(rows.filter((r) => r.version === 1), ',', 1).split('\r\n')[0].replace(/^﻿/, '').split(',').slice(10).join(','), answerColumns(1).join(','));
});

test('redazione: una risposta v1 si rivede con lo schema v1; le nuove compilazioni solo con la versione corrente', async () => {
  const { sql, env } = setup();
  await post(env, valid());
  insertV1(sql);
  const { saveSurveyAdmin, readSurveyAdmin, surveyAdminSchema } = await import('../worker/survey-admin.js');
  const id = '10000000-0000-4000-8000-000000000000';
  const row = await readSurveyAdmin(env.COMMUNITY_DB, id);
  assert.equal(row.version, 1);
  const patch = (data) => saveSurveyAdmin(env.COMMUNITY_DB, id, { data, reason: 'Correzione su richiesta', revision: 0, mode: 'transcription' }, ADMIN, NOW);
  // la revisione resta nella versione 1 (schema congelato), anche con i campi che la versione 2 non chiede più
  const fixed = await patch({ ...v1Body(), answers: { ...V1_ANSWERS, profile: { ...V1_ANSWERS.profile, years: 31 } } });
  assert.equal(fixed.version, 1);
  assert.equal(fixed.answers.profile.years, 31);
  assert.equal(fixed.revision, 1);
  await assert.rejects(saveSurveyAdmin(env.COMMUNITY_DB, id, { data: valid(), reason: 'Prova di conversione', revision: 1, mode: 'transcription' }, ADMIN, NOW), /versione 1/);
  // nuova compilazione: solo la versione corrente
  const add = (data) => saveSurveyAdmin(env.COMMUNITY_DB, null, { data, reason: 'Intervista di prova', mode: 'interview', collectedOn: null }, ADMIN, NOW);
  await assert.rejects(add(v1Body()), /versione 2/);
  const created = await add(valid());
  assert.equal(created.version, 2);
  assert.equal(created.respondent.name, 'Mario');
  // lo schema per la redazione descrive entrambe le versioni
  const schema = surveyAdminSchema();
  assert.equal(schema.version, 2);
  assert.ok(schema.versions[1].answersSpec.fields.flushes && schema.versions[2].answersSpec.fields.willReport);
  assert.equal(schema.versions[1].newResponses, false);
});

// Lettore CSV con le regole di RFC 4180 per un file intero (anche con il BOM).
function parseCsvText(text, sep) { return parseCsv(text.replace(/^﻿/, ''), sep); }
