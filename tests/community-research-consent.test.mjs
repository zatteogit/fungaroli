// Consenso alla ricerca (D4, decisioni di Matteo del 16 e del 24/10/2026): per profilo, separato dalla condivisione,
// spento all'inizio, revocabile. Le osservazioni condivise prima del 24/10 non portano più researchConsent:true.
// Il Worker gira su un D1 finto (node:sqlite) con le migrazioni del repository, come negli altri test della community.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

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
const { handleCommunity } = await import('../worker/community.js');
const { RESEARCH_CONSENT_VERSION } = await import('../js/research-consent.js');

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
const ORIGIN = 'https://fronda.test', NOW = Date.parse('2026-10-24T10:00:00Z');
const sha = (s) => createHash('sha256').update(s).digest('hex');

async function setup() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  const env = { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN };
  const call = (who, method, path, body, now = NOW) => handleCommunity(new Request(`${ORIGIN}/api/community/${path}`, { method,
    headers: { origin: ORIGIN, ...(who ? { cookie: `__Host-fungaroli_session=token-${who}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined }), env, now);
  assert.equal((await call(null, 'GET', 'status')).status, 200);
  for (const who of ['a', 'b']) {
    sql.prepare('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?)').run('acc-' + who, 'Nome ' + who, NOW - 30 * 864e5);
    sql.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(sha('token-' + who), 'acc-' + who, NOW + 864e5);
  }
  const json = async (r) => ({ status: r.status, data: await r.json() });
  return { sql, env, call, json };
}
const choose = (granted, accountId = 'acc-a', version = RESEARCH_CONSENT_VERSION) => ({ accountId, granted, version });

test('consenso alla ricerca: spento all’inizio, dato e tolto dal profilo, una riga per ogni cambiamento', async () => {
  const { sql, call, json } = await setup();
  assert.deepEqual((await json(await call('a', 'GET', 'session'))).data.user.research, { granted: false, version: null, since: null });
  assert.equal((await call(null, 'PUT', 'research-consent', choose(true))).status, 401);
  assert.equal((await call('a', 'PUT', 'research-consent', choose(true, 'acc-b'))).status, 409);
  for (const bad of [choose('yes'), choose(true, 'acc-a', 'fronda-research-v0'), { accountId: 'acc-a', granted: true }])
    assert.equal((await call('a', 'PUT', 'research-consent', bad)).status, 422);
  const given = await json(await call('a', 'PUT', 'research-consent', choose(true)));
  assert.equal(given.status, 200);
  assert.deepEqual(given.data.research, { granted: true, version: RESEARCH_CONSENT_VERSION, since: new Date(NOW).toISOString() });
  // Ripetere la stessa scelta non riscrive la data.
  assert.equal((await json(await call('a', 'PUT', 'research-consent', choose(true), NOW + 6e4))).data.research.since, new Date(NOW).toISOString());
  assert.equal((await json(await call('a', 'GET', 'session'))).data.user.research.granted, true);
  assert.equal((await json(await call('b', 'GET', 'session'))).data.user.research.granted, false, 'il consenso è del singolo profilo');
  const revoked = await json(await call('a', 'PUT', 'research-consent', choose(false), NOW + 36e5));
  assert.deepEqual(revoked.data.research, { granted: false, version: RESEARCH_CONSENT_VERSION, since: new Date(NOW + 36e5).toISOString() });
  assert.deepEqual(sql.prepare("SELECT granted FROM research_consents WHERE account_id='acc-a' ORDER BY id").all().map((r) => r.granted), [1, 0]);
  // La copia dei propri dati contiene la storia delle scelte; l'eliminazione del profilo la cancella.
  const out = JSON.parse(await (await call('a', 'GET', 'export')).text());
  assert.deepEqual(out.researchConsents.map((c) => c.granted), [true, false]);
  assert.equal((await call('a', 'DELETE', 'account')).status, 200);
  assert.equal(sql.prepare("SELECT count(*) AS n FROM research_consents WHERE account_id='acc-a'").get().n, 0);
  sql.close();
});

test('condividere non dà il consenso alla ricerca; le fotografie già salvate perdono researchConsent', async () => {
  const { sql, env, call } = await setup();
  const note = { id: 'nota-a', kind: 'note', category: 'fungo', title: 'Porcino', date: '2026-10-18', zoneId: 'tancia', note: 'privato',
    reference: { href: '#/fungo/edulis', title: 'Porcino' }, record: { presence: 'observed', amount: 2, minutes: 90, people: 2, elevation: 1100, habitat: 'broadleaf' } };
  assert.equal((await call('a', 'PUT', 'entries/' + note.id, note)).status, 200);
  assert.equal((await call('a', 'PUT', 'observations/' + note.id, { consent: true })).status, 200);
  const payload = JSON.parse(sql.prepare("SELECT payload FROM shared_observations WHERE entry_id='nota-a'").get().payload);
  assert.equal(payload.researchConsent, undefined);
  assert.equal(payload.effortClass, '60-120');
  // Una fotografia del vecchio formato (fino al 24/10) torna senza researchConsent alla prima inizializzazione.
  sql.prepare("UPDATE shared_observations SET payload=json_set(payload,'$.researchConsent',json('true')) WHERE entry_id='nota-a'").run();
  const migration = readFileSync(new URL('../migrations/0015_research_consent.sql', import.meta.url), 'utf8');
  sql.exec(migration);
  assert.equal(JSON.parse(sql.prepare("SELECT payload FROM shared_observations WHERE entry_id='nota-a'").get().payload).researchConsent, undefined);
  sql.exec(migration); // idempotente
  assert.equal(sql.prepare('SELECT count(*) AS n FROM research_consents').get().n, 0);
  void env;
  sql.close();
});
