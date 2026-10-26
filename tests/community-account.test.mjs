// Dati del profilo (decisioni di Matteo del 22/10/2026): «Scarica i miei dati» (art. 15 e 20 GDPR), cancellazione
// completa del profilo, base di partenza arrotondata a circa 1 km e foto ripulite dai metadati anche lato server.
// Il Worker gira su un D1 finto (node:sqlite) con le migrazioni del repository, come negli altri test della community.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// worker/community.js importa le migrazioni .sql e JSON senza attributi (come Wrangler).
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
const { handleCommunity, EXPORT_FORMAT, EXPORT_PAGE, EXPORT_PER_DAY } = await import('../worker/community.js');
const { completeExport } = await import('../js/data-export.js');

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

// ID non esadecimali: non possono coincidere per caso con frammenti degli UUID casuali.
const ORIGIN = 'https://fronda.test', NOW = Date.parse('2026-10-20T10:00:00Z');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const seg = (marker, body) => String.fromCharCode(0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 255) + body;
const JPEG = (...extra) => '\xff\xd8' + seg(0xe0, 'JFIF\0\x01\x01\0\0\x01\0\x01\0\0') + extra.join('') + seg(0xda, '\x01\x01\0\0\x3f\0') + 'ab\xff\x00cd' + '\xff\xd9';
const EXIF = seg(0xe1, 'Exif\0\0MM\0*GPSLatitude 42.567812 GPSLongitude 12.964834');
const photo = (raw) => ({ data: 'data:image/jpeg;base64,' + btoa(raw), width: 640, height: 480 });

async function setup({ foreignKeys = true } = {}) {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`PRAGMA foreign_keys=${foreignKeys ? 'ON' : 'OFF'}`);
  const env = { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN };
  assert.equal((await handleCommunity(new Request(ORIGIN + '/api/community/status'), env, NOW)).status, 200); // crea lo schema
  const call = (who, method, path, body, { origin = ORIGIN, now = NOW } = {}) => handleCommunity(new Request(`${ORIGIN}/api/community/${path}`, { method,
    headers: { ...(origin ? { origin } : {}), ...(who ? { cookie: `__Host-fungaroli_session=token-${who}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined }), env, now);
  return { sql, env, call };
}

// Un profilo con dati in tutte le tabelle personali, scritti per quanto possibile attraverso l'API.
async function person({ sql, call }, who) {
  sql.prepare('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?)').run('account-' + who, 'Nome ' + who, NOW - 30 * 864e5);
  sql.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(sha('token-' + who), 'account-' + who, NOW + 864e5);
  sql.prepare('INSERT INTO passkeys(id,account_id,public_key,counter,transports,backed_up,created_at) VALUES(?,?,?,?,?,?,?)').run('cred-' + who, 'account-' + who, 'chiave-pubblica-' + who, 7, '["internal","hybrid"]', 1, NOW - 30 * 864e5);
  sql.prepare('INSERT INTO challenges(token_hash,kind,challenge,account_id,handle,origin,rp_id,expires_at) VALUES(?,?,?,?,?,?,?,?)').run(sha('sfida-' + who), 'register', 'sfida-segreta-' + who, 'account-' + who, 'Nome ' + who, ORIGIN, 'fronda.test', NOW + 3e5);
  sql.prepare('INSERT INTO legal_acceptances(account_id,version,notice_hash,accepted_at,recorded_at,source,platform) VALUES(?,?,?,?,?,?,?)').run('account-' + who, 'cgs-1', 'a'.repeat(64), new Date(NOW - 5e3).toISOString(), NOW, 'explicit', 'browser');
  const ok = async (method, path, body) => { const r = await call(who, method, path, body); assert.equal(r.status, 200, `${method} ${path}: ${await r.clone().text()}`); return r.json(); };
  await ok('PUT', 'profile', { accountId: 'account-' + who, base: { name: 'Posizione attuale', lat: 42.567812, lon: 12.964834 } });
  const note = { id: 'nota-' + who, kind: 'note', category: 'fungo', title: 'Foto di ' + who, date: '2026-10-18', zoneId: 'tancia', note: 'testo privato di ' + who,
    reference: { href: '#/fungo/edulis', title: 'Porcino' }, record: { presence: 'observed', amount: 2, minutes: 90, people: 2, elevation: 1100, habitat: 'broadleaf' }, photo: photo(JPEG(EXIF)) };
  await ok('PUT', 'entries/' + note.id, note);
  await ok('PUT', 'observations/' + note.id, { consent: true });
  const outing = { id: 'uscita-' + who, kind: 'outing', zoneId: 'tancia', date: '2026-10-18', band: null, finds: { edulis: 1 }, searched: ['edulis'], note: 'uscita di ' + who, predicted: {}, forecast: { mode: 'none' } };
  await ok('PUT', 'entries/' + outing.id, outing);
  await ok('POST', 'reports', { entryId: outing.id, zoneId: 'tancia', day: '2026-10-18', speciesId: 'edulis', amount: 1, searched: true, identificationChecked: true });
  await ok('GET', 'export');
}
const owned = (sql, id) => Object.fromEntries(['passkeys', 'sessions', 'challenges', 'account_preferences', 'diary_entries', 'reports', 'shared_observations', 'legal_acceptances']
  .map((t) => [t, sql.prepare(`SELECT count(*) AS n FROM ${t} WHERE account_id=?`).get(id).n]));
const everything = (sql) => JSON.stringify(sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(({ name }) => sql.prepare(`SELECT * FROM "${name}"`).all()));

for (const foreignKeys of [true, false]) test(`elimina profilo: nessun dato personale residuo, l’altro profilo intatto (chiavi esterne ${foreignKeys ? 'attive' : 'disattivate'})`, async () => {
  const ctx = await setup({ foreignKeys }), { sql, call } = ctx;
  await person(ctx, 'a'); await person(ctx, 'b');
  const before = owned(sql, 'account-b');
  assert.ok(Object.values(owned(sql, 'account-a')).every((n) => n > 0), 'dati in tutte le tabelle personali');
  assert.ok(sql.prepare("SELECT count(*) AS n FROM rate_limits WHERE key LIKE '%account-a'").get().n >= 4, 'contatori legati al profilo');
  // Senza origine o senza sessione non si cancella nulla.
  assert.equal((await call('a', 'DELETE', 'account', null, { origin: null })).status, 403);
  assert.equal((await call('a', 'DELETE', 'account', null, { origin: 'https://evil.test' })).status, 403);
  assert.equal((await call(null, 'DELETE', 'account')).status, 401);
  assert.equal(sql.prepare("SELECT count(*) AS n FROM accounts WHERE id='account-a'").get().n, 1);
  const res = await call('a', 'DELETE', 'account');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('set-cookie'), /__Host-fungaroli_session=;.*Max-Age=0/);
  assert.equal(sql.prepare("SELECT count(*) AS n FROM accounts WHERE id='account-a'").get().n, 0);
  assert.deepEqual(Object.values(owned(sql, 'account-a')), Array(8).fill(0));
  // Nessuna traccia in nessuna tabella: ID, nome, testi, credenziale, chiave pubblica, sfida, foto.
  const dump = everything(sql);
  for (const leak of ['account-a', 'Nome a', 'testo privato di a', 'uscita di a', 'cred-a', 'chiave-pubblica-a', 'sfida-segreta-a', 'Foto di a'])
    assert.ok(!dump.includes(leak), leak);
  assert.deepEqual(owned(sql, 'account-b'), before);
  assert.equal((await call('b', 'GET', 'entries')).status, 200);
  assert.equal((await call('a', 'GET', 'entries')).status, 401);
  sql.close();
});

test('scarica i miei dati: file completo del proprio profilo, con foto, senza segreti né dati altrui', async () => {
  const ctx = await setup(), { sql, call } = ctx;
  await person(ctx, 'a'); await person(ctx, 'b');
  assert.equal((await call(null, 'GET', 'export')).status, 401);
  const res = await call('a', 'GET', 'export');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('content-disposition'), 'attachment; filename="fronda-dati-2026-10-20.json"');
  const text = await res.text();
  assert.ok(completeExport(text), 'il file si chiude con complete:true');
  const out = JSON.parse(text);
  assert.equal(out.format, EXPORT_FORMAT);
  assert.equal(out.exportedAt, new Date(NOW).toISOString());
  assert.deepEqual(out.account, { id: 'account-a', handle: 'Nome a', createdAt: new Date(NOW - 30 * 864e5).toISOString() });
  assert.deepEqual(out.passkeys, [{ createdAt: new Date(NOW - 30 * 864e5).toISOString(), transports: ['internal', 'hybrid'], backedUp: true }]);
  assert.deepEqual(out.preferences, { base: { name: 'Posizione attuale', lat: 42.57, lon: 12.96 }, updatedAt: new Date(NOW).toISOString() });
  assert.deepEqual(out.entries.map((e) => e.id).sort(), ['nota-a', 'uscita-a']);
  const note = out.entries.find((e) => e.id === 'nota-a');
  assert.equal(note.note, 'testo privato di a');
  assert.equal(note.photo.data, photo(JPEG()).data, 'foto inclusa, già ripulita dai metadati');
  assert.equal(note.serverSavedAt, new Date(NOW).toISOString());
  assert.equal(out.reports.length, 1);
  assert.deepEqual(Object.keys(out.reports[0]).sort(), ['amount', 'createdAt', 'day', 'entryId', 'id', 'identificationChecked', 'searched', 'speciesId', 'validationContext', 'zoneId']);
  assert.equal(out.reports[0].identificationChecked, true);
  assert.equal(out.reports[0].validationContext.mode, 'none');
  assert.equal(out.sharedObservations.length, 1);
  assert.equal(out.sharedObservations[0].payload.elevation, 1100);
  assert.equal(out.sharedObservations[0].consentVersion, 'fronda-community-v1');
  assert.deepEqual(out.legalAcceptances.map((a) => [a.version, a.source, a.platform]), [['cgs-1', 'explicit', 'browser']]);
  assert.equal(out.complete, true);
  // Niente segreti tecnici né dati dell'altro profilo.
  const salt = sql.prepare("SELECT value FROM community_meta WHERE key='ip_salt'").get().value;
  for (const leak of [sha('token-a'), 'token-a', salt, 'chiave-pubblica-a', 'cred-a', 'sfida-segreta-a', 'account-b', 'Nome b', 'testo privato di b', 'rate', 'token_hash', 'public_key', 'counter'])
    assert.ok(!text.includes(leak), leak);
  sql.close();
});

test('scarica i miei dati: le voci arrivano tutte, una volta sola, a pagine; limite di download al giorno', async () => {
  const ctx = await setup(), { sql, call } = ctx;
  await person(ctx, 'a');
  const total = EXPORT_PAGE * 2 + 7;
  for (let i = 0; i < total - 2; i++) sql.prepare('INSERT INTO diary_entries(account_id,id,payload,saved_at) VALUES(?,?,?,?)')
    .run('account-a', 'voce-' + String(i).padStart(4, '0'), JSON.stringify({ id: 'voce-' + i, kind: 'note', note: 'n' + i }), NOW - i);
  const out = JSON.parse(await (await call('a', 'GET', 'export')).text());
  assert.equal(out.entries.length, total);
  assert.equal(new Set(out.entries.map((e) => e.id)).size, total);
  // person() ha già scaricato una volta, il test una seconda: si arriva al limite e poi 429.
  for (let i = 2; i < EXPORT_PER_DAY; i++) assert.equal((await call('a', 'GET', 'export')).status, 200);
  const limited = await call('a', 'GET', 'export');
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).error, /Troppe richieste/);
  sql.prepare("UPDATE sessions SET expires_at=? WHERE account_id='account-a'").run(NOW + 3 * 864e5);
  assert.equal((await call('a', 'GET', 'export', null, { now: NOW + 86400e3 + 1 })).status, 200, 'il giorno dopo si riparte');
  sql.close();
});

test('base di partenza: salvata e restituita arrotondata a 2 decimali, anche quando era stata salvata precisa', async () => {
  const ctx = await setup(), { sql, call } = ctx;
  await person(ctx, 'a');
  assert.deepEqual(JSON.parse(sql.prepare("SELECT base FROM account_preferences WHERE account_id='account-a'").get().base), { name: 'Posizione attuale', lat: 42.57, lon: 12.96 });
  // Una base salvata prima della decisione, con 6 decimali: la sessione non la restituisce precisa.
  sql.prepare("UPDATE account_preferences SET base=? WHERE account_id='account-a'").run(JSON.stringify({ name: 'Casa', lat: 42.123456, lon: 12.654321 }));
  assert.deepEqual((await (await call('a', 'GET', 'session')).json()).user.base, { name: 'Casa', lat: 42.12, lon: 12.65 });
  assert.match(await (await call('a', 'GET', 'export')).text(), /"base":\{"name":"Casa","lat":42\.12,"lon":12\.65\}/);
  sql.close();
});

test('migrazione 0014: le basi già salvate vengono riscritte arrotondate al primo accesso, una volta sola', async () => {
  const sql = new DatabaseSync(':memory:');
  for (const f of ['0001_community.sql', '0003_account_preferences.sql']) sql.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));
  sql.prepare('INSERT INTO accounts VALUES(?,?,?)').run('vecchio', 'Vecchio', NOW - 864e6);
  sql.prepare('INSERT INTO account_preferences VALUES(?,?,?)').run('vecchio', JSON.stringify({ name: 'Posizione attuale', lat: 41.902812, lon: 12.496398 }), NOW - 864e6);
  const env = { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN };
  assert.equal((await handleCommunity(new Request(ORIGIN + '/api/community/status'), env, NOW)).status, 200);
  const row = sql.prepare("SELECT base,updated_at FROM account_preferences WHERE account_id='vecchio'").get();
  assert.deepEqual(JSON.parse(row.base), { name: 'Posizione attuale', lat: 41.9, lon: 12.5 });
  assert.equal(row.updated_at, NOW - 864e6, 'nessuna data inventata');
  const migration = readFileSync(new URL('../migrations/0014_base_precision.sql', import.meta.url), 'utf8').replace(/^\s*--.*$/gm, '').trim().replace(/;$/, '');
  assert.equal(sql.prepare(migration).run().changes, 0, 'idempotente');
  sql.close();
});

test('foto lato server: Exif tolto da note e uscite inviate direttamente all’API; una foto non valida è rifiutata', async () => {
  const ctx = await setup(), { sql, call } = ctx;
  await person(ctx, 'a');
  const stored = (id) => JSON.parse(sql.prepare("SELECT payload FROM diary_entries WHERE account_id='account-a' AND id=?").get(id).payload);
  assert.equal(stored('nota-a').photo.data, photo(JPEG()).data);
  const outing = { id: 'uscita-foto', kind: 'outing', zoneId: 'tancia', date: '2026-10-18', band: null, finds: {}, searched: [], note: '', predicted: {}, forecast: { mode: 'none' }, photo: photo(JPEG(EXIF)) };
  const saved = await call('a', 'PUT', 'entries/' + outing.id, outing);
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).entry.photo.data, photo(JPEG()).data);
  assert.ok(!atob(stored('uscita-foto').photo.data.split(',')[1]).includes('Exif'));
  const bad = await call('a', 'PUT', 'entries/uscita-rotta', { ...outing, id: 'uscita-rotta', photo: { data: 'data:image/jpeg;base64,' + btoa('\xff\xd8rotta\xff\xd9'), width: 10, height: 10 } });
  assert.equal(bad.status, 400);
  assert.equal(sql.prepare("SELECT count(*) AS n FROM diary_entries WHERE id='uscita-rotta'").get().n, 0);
  sql.close();
});
