// API del questionario per i cercatori esperti (/questionario): invio anonimo senza login,
// lettura, esportazione e cancellazione solo per gli amministratori CMS (CMS_ADMIN_IDS).
// Schema delle risposte: js/survey-schema.js (unica fonte, condivisa con la pagina).
//   POST   /api/survey/v1/responses                      → 201 {id, receipt} | 400 | 403 | 413 | 415 | 429
//   GET    /api/survey/v1/responses?survey=…&format=json|csv|count[&sep=comma|semicolon][&receipt=XXXXXXXX]   (amministratori)
//   DELETE /api/survey/v1/responses/<id o ricevuta>                               (amministratori)
import schema from '../migrations/0004_survey.sql';
import { ANSWERS_SPEC, MAX_BODY_BYTES, SURVEY_ID, SURVEY_RETENTION, hasSurveyAnswers, validateSurvey } from '../js/survey-schema.js';
import { readCommunityUser } from './community.js';

// SURVEY_DAILY_LIMIT: invii al giorno (UTC) per connessione; SURVEY_DAILY_TOTAL: tetto complessivo al giorno
// (UTC), deciso da Matteo il 16/10/2026. Oltre l'uno o l'altro: 429 con Retry-After fino alla mezzanotte UTC.
export const SURVEY_DAILY_LIMIT = 10, SURVEY_DAILY_TOTAL = 200, MAX_ERRORS = 50;
const SURVEYS = new Set([SURVEY_ID]);
const RECEIPT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 simboli: niente 0/O, 1/I
const RECEIPT = /^[A-HJ-NP-Z2-9]{8}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_DURATION_S = 30 * 86400;
const initialized = new WeakMap(), enc = new TextEncoder();
const hash = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))), (b) => b.toString(16).padStart(2, '0')).join('');
const fail = (message, status = 400, extra = {}) => { throw Object.assign(new Error(message), { status, extra }); };
const HEADERS = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const result = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...HEADERS, ...headers } });
const utcDay = (now) => new Date(now).toISOString().slice(0, 10);

export function newReceipt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => RECEIPT_ALPHABET[b & 31]).join('');
}
// Il codice si può dettare o copiare con spazi e trattini: «abcd-efgh» vale «ABCDEFGH».
export const normalizeReceipt = (s) => String(s || '').toUpperCase().replace(/[\s-]/g, '');

async function init(db) {
  if (!initialized.has(db)) initialized.set(db, (async () => {
    // D1 tratta ogni riga come istruzione: si passano istruzioni complete, senza commenti.
    await db.batch(schema.split(';').map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter((s) => s && !s.startsWith('PRAGMA')).map((s) => db.prepare(s)));
    await db.prepare("INSERT INTO community_meta(key,value) VALUES('survey_ip_salt',?) ON CONFLICT(key) DO NOTHING").bind(crypto.randomUUID() + crypto.randomUUID()).run();
  })().catch((e) => { initialized.delete(db); throw e; }));
  return initialized.get(db);
}

async function readJson(request) {
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') fail('Serve una richiesta JSON.', 415);
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY_BYTES) fail('Risposte troppo lunghe: accorcia i testi e riprova.', 413);
  const reader = request.body?.getReader();
  if (!reader) fail('Richiesta vuota.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); fail('Risposte troppo lunghe: accorcia i testi e riprova.', 413); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size); let offset = 0;
  for (const c of chunks) { buffer.set(c, offset); offset += c.length; }
  try { return JSON.parse(new TextDecoder().decode(buffer)); } catch { fail('Richiesta non valida.'); }
}

// Connessione a cui si applica il limite. IPv4: l'indirizzo. IPv6: il blocco /64, perché un dispositivo o
// un server riceve di solito un /64 intero e può cambiare indirizzo al suo interno a ogni invio; una rete
// domestica IPv6 condivide il /64 come una rete IPv4 condivide l'indirizzo. «::ffff:a.b.c.d» vale come IPv4.
// Un valore che non si riconosce resta com'è (viene comunque solo trasformato in hash).
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
export function rateSubject(raw) {
  const ip = String(raw || '').trim().toLowerCase().replace(/%.*$/, '');
  if (!ip.includes(':')) return ip || 'local';
  const halves = ip.split('::');
  if (halves.length > 2) return ip;
  const groups = (s) => (s ? s.split(':') : []).flatMap((g) => IPV4.test(g)
    ? (([a, b, c, d]) => [((a << 8) | b).toString(16), ((c << 8) | d).toString(16)])(g.split('.').map(Number)) : [g]);
  const head = groups(halves[0]), tail = halves.length === 2 ? groups(halves[1]) : [];
  const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
  const all = [...head, ...Array(Math.max(0, fill)).fill('0'), ...tail];
  if (fill < 0 || all.length !== 8 || !all.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return ip;
  const n = all.map((g) => parseInt(g, 16));
  if (n.slice(0, 5).every((x) => x === 0) && n[5] === 0xffff) return [n[6] >> 8, n[6] & 255, n[7] >> 8, n[7] & 255].join('.');
  return all.slice(0, 4).map((g) => g.padStart(4, '0')).join(':') + '::/64';
}

// Limite di invii: hash SHA-256 di sale privato + connessione + giorno UTC + questionario. L'IP non viene
// salvato; il sale impedisce a chi non lo conosce di risalire all'IP provando tutti gli indirizzi. Chi legge
// il database ha anche il sale: l'hash è un dato pseudonimo, e si cancella entro il terzo giorno.
// Restano solo i contatori di oggi e di ieri (UTC): quelli di 2 giorni fa o prima si cancellano al primo invio
// o con il cron delle 03:17 UTC. La riga di un giorno resta quindi da 24 a circa 51 ore.
// Il tetto complessivo sta nella stessa tabella, con la chiave «total:<questionario>:<giorno>» (nessun dato
// della connessione). Cresce solo per un invio accettato: non lo consumano gli invii rifiutati dalla
// validazione o dal limite per connessione, né il campo trappola. Con il tetto pieno un tentativo non consuma
// nemmeno il limite della connessione. Le conte stanno in una sola transazione.
const rateCutoff = (now) => utcDay(now - 864e5);
export const totalKey = (day) => `total:${SURVEY_ID}:${day}`;
async function countSubmission(db, request, now) {
  const day = utcDay(now), cutoff = rateCutoff(now), total = totalKey(day);
  const salt = await db.prepare("SELECT value FROM community_meta WHERE key='survey_ip_salt'").first('value');
  const ip = rateSubject(request.headers.get('CF-Connecting-IP') || 'local');
  const key = await hash(salt + '|' + ip + '|' + day + '|' + SURVEY_ID);
  const [, , accepted, connection] = await db.batch([
    db.prepare('DELETE FROM survey_rate WHERE day<?').bind(cutoff),
    // +1 alla connessione solo se il tetto del giorno ha ancora posto.
    db.prepare('INSERT INTO survey_rate(key,day,count) SELECT ?,?,1 WHERE COALESCE((SELECT count FROM survey_rate WHERE key=?),0)<? '
      + 'ON CONFLICT(key) DO UPDATE SET count=count+1').bind(key, day, total, SURVEY_DAILY_TOTAL),
    // +1 al tetto solo se la connessione è nel suo limite e il tetto non è pieno; altrimenti nessuna riga.
    db.prepare('INSERT INTO survey_rate(key,day,count) SELECT ?,?,1 WHERE (SELECT count FROM survey_rate WHERE key=?)<=? '
      + 'ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE survey_rate.count<? RETURNING count')
      .bind(total, day, key, SURVEY_DAILY_LIMIT, SURVEY_DAILY_TOTAL),
    db.prepare('SELECT count FROM survey_rate WHERE key=?').bind(key),
  ]);
  if (accepted.results.length) return;
  const headers = { 'retry-after': String(Math.max(60, Math.ceil((Date.parse(day + 'T00:00:00Z') + 864e5 - now) / 1000))) };
  // La connessione oltre il suo limite riceve il suo messaggio anche se il tetto è pieno.
  if ((connection.results[0]?.count ?? 0) >= SURVEY_DAILY_LIMIT)
    fail('Hai già inviato molte risposte oggi da questa connessione. Riprova domani.', 429, { code: 'connection-limit', headers });
  fail('Per oggi il questionario ha ricevuto tutte le risposte che può accettare. Riprova domani.', 429, { code: 'daily-limit', headers });
}

const durationOf = (startedAt, now) => {
  const s = Math.round((now - Date.parse(startedAt)) / 1000);
  return Number.isFinite(s) && s >= 0 && s <= MAX_DURATION_S ? s : null;
};

async function submit(request, env, now) {
  const db = env.COMMUNITY_DB;
  if (now >= Date.parse(SURVEY_RETENTION.answersUntil)) fail('La raccolta delle risposte è terminata.', 410);
  const body = await readJson(request);
  // Campo trappola compilato: risposta identica a un invio riuscito, senza salvare nulla.
  if (body && typeof body === 'object' && body.website != null && String(body.website).trim() !== '')
    return result({ id: crypto.randomUUID(), receipt: newReceipt() }, 201);
  const checked = validateSurvey(body);
  // Al massimo MAX_ERRORS errori nella risposta: un corpo pieno di chiavi sconosciute non produce
  // una risposta molte volte più grande della richiesta.
  const errors = checked.errors.slice(0, MAX_ERRORS);
  if (!checked.ok) fail(errors.length === 1 ? errors[0].message : 'Alcune risposte vanno corrette: controlla i campi segnalati.', 400,
    { fields: errors.map((e) => e.field), errors });
  if (!hasSurveyAnswers(checked.value.answers)) fail('Per inviare, rispondi ad almeno una domanda. Puoi anche scegliere «Non so».', 400, { fields: ['answers'] });
  await init(db);
  await countSubmission(db, request, now);
  const v = checked.value, id = crypto.randomUUID();
  if (now >= Date.parse(SURVEY_RETENTION.contactUntil)) {
    v.respondent.contact = null;
    v.consent.recontact = false;
    v.consent.diary = false;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const receipt = newReceipt();
    const saved = await db.prepare('INSERT INTO survey_responses(id,survey,version,receipt,created_at,duration_s,name,contact,consent_recontact,consent_diary,answers) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(receipt) DO NOTHING')
      .bind(id, v.survey, v.version, receipt, now, v.startedAt ? durationOf(v.startedAt, now) : null, v.respondent.name, v.respondent.contact,
        v.consent.recontact ? 1 : 0, v.consent.diary ? 1 : 0, JSON.stringify(v.answers)).run();
    if (saved.meta.changes) return result({ id, receipt }, 201);
  }
  fail('Non riesco a salvare le risposte. Riprova tra poco.', 503);
}

async function requireAdmin(request, env, now) {
  const user = await readCommunityUser(request, env, now);
  if (!user) fail('Accedi con la passkey di un amministratore.', 401);
  const admins = (env.CMS_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!admins.includes(user.id)) fail('Solo gli amministratori possono vedere e cancellare le risposte.', 403);
  return user;
}

const view = (r) => ({
  id: r.id, survey: r.survey, version: r.version, receipt: r.receipt, createdAt: new Date(r.created_at).toISOString(),
  durationS: r.duration_s, name: r.name, contact: r.contact,
  consent: { anonymousUse: true, recontact: !!r.consent_recontact, diary: !!r.consent_diary }, answers: JSON.parse(r.answers),
});

// Colonne del CSV ricavate dallo schema: campi semplici in colonne piatte, liste in JSON.
// Le domande aperte hanno due colonne: «.quick» (risposte rapide, JSON) e «.text».
export function answerColumns(spec = ANSWERS_SPEC, prefix = '') {
  return Object.entries(spec.fields).flatMap(([key, field]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (field.t === 'obj') return answerColumns(field, path);
    if (field.t === 'open') return [path + '.quick', path + '.text'];
    return [path];
  });
}
const BASE_COLUMNS = ['id', 'created_at', 'survey', 'version', 'receipt', 'duration_s', 'name', 'contact', 'consent_recontact', 'consent_diary'];
const pick = (answers, column) => {
  const parts = column.split('.');
  let v = answers;
  for (const p of parts) v = v == null ? undefined : v[p];
  return v;
};
// Una cella che inizia con = + - @ (o tabulazione / a capo) diventerebbe una formula in un foglio
// di calcolo: si antepone un apostrofo. Lo stesso dopo ogni «;» e ogni a capo dentro la cella: Excel in
// italiano, aperto con un doppio clic, separa le colonne con il punto e virgola e ignora le virgolette che
// non aprono il suo campo, quindi lì per lui comincia una cella nuova (o una riga nuova).
// Dopo un separatore o un a capo l'apostrofo va anche davanti alle virgolette: lì le virgolette aprono un campo,
// e un lettore tollerante come Excel attacca al campo chiuso («""») il testo che segue, per esempio «=1+1».
// Il JSON resta l'esportazione esatta: nel CSV una riga che inizia con «- » diventa «'- ».
// Con il separatore «;» («CSV per Excel», per Excel in italiano) vale lo stesso anche dopo ogni virgola:
// Excel con impostazioni inglesi, aperto con un doppio clic, separerebbe lì le colonne.
// Sempre tra virgolette le celle con virgola, punto e virgola, virgolette o a capo, con entrambi i separatori.
export const CSV_SEPARATORS = Object.freeze({ comma: ',', semicolon: ';' });
const FORMULA_AT_START = /^(?=\s*[=+\-@\t\r])/;
const FORMULA_AFTER = { ',': /([;\r\n])(?=\s*["=+\-@\t\r])/g, ';': /([;,\r\n])(?=\s*["=+\-@\t\r])/g };
export function csvCell(value, sep = ',') {
  if (value == null) return '';
  let s = typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value);
  // Excel in italiano legge «2.5» come testo o come data: nel file con «;» i decimali hanno la virgola.
  if (sep === ';' && typeof value === 'number') s = s.replace('.', ',');
  s = s.replace(FORMULA_AT_START, "'").replace(FORMULA_AFTER[sep], "$1'");
  return /[",;\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const csvLine = (cells, sep) => cells.map((c) => csvCell(c, sep)).join(sep) + '\r\n';
const csvHeader = (columns, sep) => '\uFEFF' + csvLine([...BASE_COLUMNS, ...columns], sep);
function csvRow(r, columns, sep) {
  const answers = JSON.parse(r.answers);
  const base = [r.id, new Date(r.created_at).toISOString(), r.survey, r.version, r.receipt, r.duration_s, r.name, r.contact, r.consent_recontact, r.consent_diary];
  return csvLine([...base, ...columns.map((c) => pick(answers, c))], sep);
}
export function toCsv(rows, sep = ',') {
  if (!FORMULA_AFTER[sep]) throw new Error('Separatore non previsto: ' + sep);
  const columns = answerColumns();
  return csvHeader(columns, sep) + rows.map((r) => csvRow(r, columns, sep)).join('');
}

// Esportazione a pagine (cursore su created_at e id, EXPORT_PAGE righe alla volta), scritta mentre si legge:
// il Worker non tiene mai in memoria tutte le risposte, e non c'è un numero massimo di righe.
export const EXPORT_PAGE = 100;
const COLUMNS = 'id,survey,version,receipt,created_at,duration_s,name,contact,consent_recontact,consent_diary,answers';
async function* responsePages(db, survey, receipt) {
  if (receipt) { yield (await db.prepare(`SELECT ${COLUMNS} FROM survey_responses WHERE survey=? AND receipt=?`).bind(survey, receipt).all()).results; return; }
  for (let last = null; ;) {
    const rows = (await (last
      ? db.prepare(`SELECT ${COLUMNS} FROM survey_responses WHERE survey=? AND (created_at>? OR (created_at=? AND id>?)) ORDER BY created_at, id LIMIT ?`)
        .bind(survey, last.created_at, last.created_at, last.id, EXPORT_PAGE)
      : db.prepare(`SELECT ${COLUMNS} FROM survey_responses WHERE survey=? ORDER BY created_at, id LIMIT ?`).bind(survey, EXPORT_PAGE)).all()).results;
    if (rows.length) yield rows;
    if (rows.length < EXPORT_PAGE) return;
    last = rows.at(-1);
  }
}
async function* csvParts(pages, sep) {
  const columns = answerColumns();
  yield csvHeader(columns, sep);
  for await (const rows of pages) yield rows.map((r) => csvRow(r, columns, sep)).join('');
}
// «count» alla fine: è il numero delle risposte scritte nel file.
async function* jsonParts(pages, survey, now) {
  yield `{"survey":${JSON.stringify(survey)},"exportedAt":${JSON.stringify(new Date(now).toISOString())},"responses":[`;
  let n = 0;
  for await (const rows of pages) { yield rows.map((r) => (n++ ? ',' : '') + JSON.stringify(view(r))).join(''); }
  yield `],"count":${n}}`;
}
// Un errore del database a metà interrompe il file: chi scarica riceve un errore, non un file troncato in silenzio.
function streamOf(parts) {
  const it = parts[Symbol.asyncIterator](), enc = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await it.next();
      if (done) controller.close(); else controller.enqueue(enc.encode(value));
    },
    async cancel() { await it.return?.(); },
  });
}

async function list(request, env, url, now) {
  await requireAdmin(request, env, now);
  const db = env.COMMUNITY_DB;
  await init(db);
  const survey = url.searchParams.get('survey') || SURVEY_ID;
  if (!SURVEYS.has(survey)) fail('Questionario sconosciuto.');
  const format = url.searchParams.get('format') || 'json';
  if (!['json', 'csv', 'count'].includes(format)) fail('Formato non valido: usa json, csv o count.');
  const sepName = url.searchParams.get('sep') || 'comma';
  if (!Object.hasOwn(CSV_SEPARATORS, sepName)) fail('Separatore non valido: usa comma o semicolon.');
  let receipt = null;
  if (url.searchParams.has('receipt')) {
    receipt = normalizeReceipt(url.searchParams.get('receipt'));
    if (!RECEIPT.test(receipt)) fail('Codice ricevuta non valido: sono 8 caratteri.');
  }
  // Conteggio per la redazione: numero e data dell'ultima, senza leggere né mandare le risposte.
  if (format === 'count') {
    const r = await db.prepare(`SELECT COUNT(*) AS n, MAX(created_at) AS last FROM survey_responses WHERE survey=?${receipt ? ' AND receipt=?' : ''}`)
      .bind(...(receipt ? [survey, receipt] : [survey])).first();
    return result({ survey, count: r?.n ?? 0, lastAt: r?.last == null ? null : new Date(r.last).toISOString() });
  }
  // La prima pagina si legge prima di rispondere: se il database non risponde, 503 come le altre richieste.
  const pages = responsePages(db, survey, receipt), first = await pages.next();
  const rows = (async function* () { if (first.done) return; yield first.value; yield* pages; })();
  if (format === 'csv') return new Response(streamOf(csvParts(rows, CSV_SEPARATORS[sepName])), { status: 200, headers: { ...HEADERS, 'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="questionario-${survey}-${utcDay(now)}${sepName === 'semicolon' ? '-excel' : ''}.csv"` } });
  return new Response(streamOf(jsonParts(rows, survey, now)), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', ...HEADERS } });
}

async function remove(request, env, ref, now) {
  await requireAdmin(request, env, now);
  const db = env.COMMUNITY_DB;
  await init(db);
  const id = ref.toLowerCase(), receipt = normalizeReceipt(ref);
  const byId = UUID.test(id);
  if (!byId && !RECEIPT.test(receipt)) fail('Indica l’identificativo della risposta o il codice ricevuta.', 400);
  const row = await db.prepare(`DELETE FROM survey_responses WHERE ${byId ? 'id' : 'receipt'}=? RETURNING id,receipt`).bind(byId ? id : receipt).first();
  if (!row) fail('Risposta non trovata: forse è già stata cancellata.', 404);
  return result({ ok: true, id: row.id, receipt: row.receipt });
}

export async function handleSurvey(request, env, now = Date.now()) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/survey\/v1\/?/, '').replace(/\/$/, '');
  try {
    if (!env.COMMUNITY_DB) fail('Il questionario non è ancora attivo.', 503);
    const expectedOrigin = env.APP_ORIGIN || url.origin;
    const one = path.match(/^responses\/([^/]+)$/);
    if (path !== 'responses' && !one) fail('Percorso non trovato.', 404);
    const allowed = one ? ['DELETE'] : ['GET', 'POST'];
    if (!allowed.includes(request.method)) fail('Metodo non consentito.', 405, { headers: { allow: allowed.join(', ') } });
    if (request.method !== 'GET' && request.headers.get('origin') !== expectedOrigin) fail('Origine non autorizzata.', 403);
    if (request.method === 'POST') return await submit(request, env, now);
    if (request.method === 'GET') return await list(request, env, url, now);
    let ref;
    try { ref = decodeURIComponent(one[1]); } catch { fail('Indica l’identificativo della risposta o il codice ricevuta.'); }
    return await remove(request, env, ref, now);
  } catch (e) {
    // Nessun dettaglio interno negli errori pubblici.
    if (!e.status) return result({ error: 'Servizio temporaneamente non disponibile. Riprova.' }, 503);
    const { headers = {}, ...extra } = e.extra || {};
    return result({ error: e.message, ...extra }, e.status, headers);
  }
}

export async function cleanupSurvey(env, now = Date.now()) {
  if (!env.COMMUNITY_DB) return;
  await init(env.COMMUNITY_DB);
  await env.COMMUNITY_DB.batch([
    env.COMMUNITY_DB.prepare('DELETE FROM survey_rate WHERE day<?').bind(rateCutoff(now)),
    env.COMMUNITY_DB.prepare('UPDATE survey_responses SET contact=NULL,consent_recontact=0,consent_diary=0 WHERE ? >= ? AND contact IS NOT NULL').bind(now, Date.parse(SURVEY_RETENTION.contactUntil)),
    env.COMMUNITY_DB.prepare('DELETE FROM survey_responses WHERE ? >= ?').bind(now, Date.parse(SURVEY_RETENTION.answersUntil)),
  ]);
}
