// Uscita già condivisa: se cambiano i dati che la segnalazione porta con sé, la segnalazione si ritira.
// Prima del 16/10/2026 il ritiro scattava solo per zona, giorno, ritrovamenti e specie cercate: cambiando minuti,
// numero di cercatori o inizio della ricerca, la community continuava a contare lo sforzo vecchio.
// Il Worker gira su un D1 finto (node:sqlite), come in tests/cms-content.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
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
const { handleCommunity, sharedFieldsChanged } = await import('../worker/community.js');

function d1(sql) {
  const stmt = (q, params = []) => {
    const exec = () => {
      const s = sql.prepare(q);
      if (/^\s*SELECT\b/i.test(q) || /\bRETURNING\b/i.test(q)) return { results: s.all(...params), meta: { changes: 0 } };
      return { results: [], meta: { changes: Number(s.run(...params).changes) } };
    };
    return { exec, bind: (...p) => stmt(q, p), all: async () => exec(), run: async () => exec(),
      first: async col => { const r = exec().results[0] ?? null; return col && r ? r[col] : r; } };
  };
  return { prepare: q => stmt(q), batch: async list => {
    sql.exec('BEGIN');
    try { const out = list.map(s => s.exec()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; }
  } };
}

const ORIGIN = 'https://fungaroli.test', NOW = Date.parse('2026-10-15T15:00:00Z'), TOKEN = 'sessione-di-prova';
const sha = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), (b) => b.toString(16).padStart(2, '0')).join('');
async function setup() {
  const sql = new DatabaseSync(':memory:');
  const env = { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN };
  await handleCommunity(new Request(`${ORIGIN}/api/community/status`), env, NOW); // crea lo schema
  sql.prepare('INSERT INTO accounts(id,handle,created_at) VALUES(?,?,?)').run('acc-1', 'Prova', NOW - 30 * 864e5);
  sql.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(await sha(TOKEN), 'acc-1', NOW + 864e5);
  const call = async (method, path, body) => {
    const res = await handleCommunity(new Request(`${ORIGIN}/api/community/${path}`, { method,
      headers: { origin: ORIGIN, cookie: `__Host-fungaroli_session=${TOKEN}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined }), env, NOW);
    const data = await res.json();
    assert.equal(res.status, 200, JSON.stringify(data));
    return data;
  };
  const reports = () => sql.prepare('SELECT validation_context FROM reports WHERE account_id=?').all('acc-1');
  return { call, reports };
}
const outing = (effort = {}) => ({ id: 'uscita-1', kind: 'outing', zoneId: 'tancia', date: '2026-10-15', band: null,
  finds: { edulis: 1 }, searched: ['edulis'], note: '', predicted: {}, forecast: { mode: 'none' },
  effort: { startedAt: '2026-10-15T07:00:00.000Z', minutes: 120, people: 2, ...effort } });

async function shared(change) {
  const { call, reports } = await setup();
  await call('PUT', 'entries/uscita-1', outing());
  await call('POST', 'reports', { entryId: 'uscita-1', zoneId: 'tancia', day: '2026-10-15', speciesId: 'edulis', amount: 1, searched: true });
  assert.equal(reports().length, 1);
  assert.deepEqual(JSON.parse(reports()[0].validation_context).effort, outing().effort);
  const saved = await call('PUT', 'entries/uscita-1', change(outing()));
  return { saved, left: reports().length };
}

for (const [label, effort] of [['cambiano i minuti', { minutes: 45 }], ['cambia il numero di cercatori', { people: 5 }], ['cambia l’inizio della ricerca', { startedAt: '2026-10-15T09:30:00.000Z' }]]) {
  test(`uscita condivisa: se ${label} la segnalazione si ritira, come per zona e ritrovamenti`, async () => {
    const { saved, left } = await shared((e) => ({ ...e, effort: { ...e.effort, ...effort } }));
    assert.equal(saved.entry.shared, false);
    assert.equal(left, 0);
  });
}

test('uscita condivisa: una nota o lo sforzo invariato non ritirano la segnalazione', async () => {
  const { saved, left } = await shared((e) => ({ ...e, note: 'faggeta umida', effort: { ...e.effort } }));
  assert.equal(saved.entry.shared, true);
  assert.equal(left, 1);
});

test('sharedFieldsChanged: sforzo assente e sforzo vuoto valgono uguale; ogni campo dello sforzo conta', () => {
  const base = outing();
  assert.equal(sharedFieldsChanged({ ...base, effort: undefined }, { ...base, effort: {} }), false);
  assert.equal(sharedFieldsChanged(base, structuredClone(base)), false);
  for (const k of ['minutes', 'people', 'startedAt']) assert.equal(sharedFieldsChanged(base, { ...base, effort: { ...base.effort, [k]: null } }), true, k);
  assert.equal(sharedFieldsChanged(base, { ...base, finds: { edulis: 2 } }), true);
});
