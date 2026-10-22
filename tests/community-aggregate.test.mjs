// Aggregato per provincia della community (decisione di Matteo, 22/10/2026) e confronto personale del Taccuino.
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
const { provinceGroups, zoneProvince } = await import('../js/community-aggregate.js');
const { personalComparison, outcomeText } = await import('../js/journal.js');
const { handleCommunity } = await import('../worker/community.js');

const ZONES = [{ id: 'a' }, { id: 'b' }, { id: 'c', province: ['RM'] }, { id: 'd', province: ['RM'] }];
const row = (zoneId, accountId, day, outcome = 'sighting', speciesId = 'edulis') => ({ zoneId, accountId, day, outcome, speciesId });
const reports = (rows, published = []) => provinceGroups(rows, { zones: ZONES, keyOf: (r) => r.speciesId, fields: (r) => ({ speciesId: r.speciesId }), published: new Set(published) });

test('zona senza provincia nei dati: Reatino, come nell\'app', () => {
  assert.equal(zoneProvince({ id: 'x' }), 'RI');
  assert.equal(zoneProvince({ id: 'x', province: ['VT'] }), 'VT');
  assert.equal(zoneProvince(undefined), 'RI');
});

test('due zone piccole della stessa provincia insieme superano la guardia', () => {
  const out = reports([row('a', 'p1', '2026-10-20'), row('a', 'p2', '2026-10-21', 'zero'), row('b', 'p3', '2026-10-21')]);
  assert.deepEqual(out, [{ province: 'RI', speciesId: 'edulis', reports: 3, sightings: 2, zeros: 1 }]);
});

test('sotto la guardia nulla si pubblica: 2 persone o un solo giorno', () => {
  assert.deepEqual(reports([row('a', 'p1', '2026-10-20'), row('b', 'p2', '2026-10-21'), row('b', 'p2', '2026-10-20')]), []);
  assert.deepEqual(reports([row('a', 'p1', '2026-10-20'), row('a', 'p2', '2026-10-20'), row('b', 'p3', '2026-10-20')]), []);
});

test('protezione per sottrazione: la parte non già pubblicata per zona deve superare la guardia', () => {
  const zoneC = [row('c', 'p1', '2026-10-20'), row('c', 'p2', '2026-10-21'), row('c', 'p3', '2026-10-21')];
  // c è già pubblicata per zona; d ha una persona sola: provincia meno c rivelerebbe d.
  assert.deepEqual(reports([...zoneC, row('d', 'p4', '2026-10-20', 'zero')], ['c|edulis']), []);
  // Se anche il resto supera la guardia, la provincia si pubblica con i totali completi.
  const rest = [row('d', 'p4', '2026-10-20'), row('d', 'p5', '2026-10-21'), row('d', 'p6', '2026-10-21', 'zero')];
  assert.deepEqual(reports([...zoneC, ...rest], ['c|edulis']), [{ province: 'RM', speciesId: 'edulis', reports: 6, sightings: 5, zeros: 1 }]);
});

test('zone sconosciute o assenti non entrano in nessuna provincia', () => {
  assert.deepEqual(reports([row('zz', 'p1', '2026-10-20'), row(null, 'p2', '2026-10-21'), row('a', 'p3', '2026-10-21')]), []);
});

test('in uscita niente account, giorni, zone o numero di persone', () => {
  const [g] = reports([row('a', 'p1', '2026-10-20'), row('a', 'p2', '2026-10-21'), row('b', 'p3', '2026-10-21')]);
  assert.deepEqual(Object.keys(g).sort(), ['province', 'reports', 'sightings', 'speciesId', 'zeros']);
});

// --- endpoint /api/community/summary su un D1 finto ------------------------------------------------------
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
const NOW = Date.parse('2026-10-22T10:00:00Z'), ORIGIN = 'https://fungaroli.test';

test('summary: provincia pubblicata per due zone piccole del Reatino, Roma trattenuta per sottrazione', async () => {
  const sql = new DatabaseSync(':memory:');
  for (const f of ['0001_community.sql', '0003_account_preferences.sql', '0007_shared_observations.sql']) sql.exec(readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));
  const people = ['me', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  for (const id of people) {
    sql.prepare('INSERT INTO accounts VALUES(?,?,?)').run(id, id, NOW - 30 * 864e5);
    sql.prepare('INSERT INTO diary_entries(account_id,id,payload,saved_at) VALUES(?,?,?,?)').run(id, 'e-' + id, '{}', NOW);
  }
  sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update('me').digest('hex'), 'me', NOW + 864e5);
  let n = 0;
  const report = (account, day, zone, amount) => sql.prepare('INSERT INTO reports(id,account_id,entry_id,day,zone_id,species_id,amount,searched,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
    .run('r' + (++n), account, 'e-' + account, day, zone, 'edulis', amount, amount ? 0 : 1, NOW);
  // Reatino: vallonina 2 persone, tancia 1 persona; insieme 3 persone su 2 giorni.
  report('me', '2026-10-20', 'vallonina', 0); report('p1', '2026-10-21', 'vallonina', 2); report('p2', '2026-10-21', 'tancia', 1);
  // Roma: tuscolo-nord pubblicata per zona (3 persone, 2 giorni); faete-rocca-papa una persona sola.
  report('p3', '2026-10-20', 'tuscolo-nord', 1); report('p4', '2026-10-21', 'tuscolo-nord', 1); report('p5', '2026-10-21', 'tuscolo-nord', 0);
  report('p6', '2026-10-21', 'faete-rocca-papa', 3);
  // Fuori finestra (più di 7 giorni): non conta.
  report('p6', '2026-10-01', 'tancia', 1);
  const env = { COMMUNITY_DB: d1(sql), APP_ORIGIN: ORIGIN };
  const res = await handleCommunity(new Request(ORIGIN + '/api/community/summary', { headers: { cookie: '__Host-fungaroli_session=me' } }), env, NOW);
  const out = await res.json();
  assert.equal(out.access, 'granted');
  assert.deepEqual(out.reports.map((r) => r.zoneId), ['tuscolo-nord']);
  assert.deepEqual(out.provinceReports, [{ province: 'RI', speciesId: 'edulis', reports: 3, sightings: 2, zeros: 1 }]);
  assert.deepEqual(out.provinceObservations, []);
  assert.ok(!JSON.stringify(out.provinceReports).match(/p\d|me|vallonina|tancia|2026-10-2/));
});

// --- confronto personale nel Taccuino ----------------------------------------------------------------------
const outing = (data) => ({ kind: 'outing', searched: ['edulis'], forecast: { mode: 'prospective', capturedAt: '2026-10-12T05:00:00Z' },
  effort: { startedAt: '2026-10-12T08:00:00Z' }, ...data });

test('confronto personale: valore ed esito per specie cercata, senza verdetto, più recenti prima', () => {
  const rows = personalComparison([
    outing({ id: 'o1', date: '2026-10-12', zoneId: 'tancia', predicted: { edulis: 72 }, finds: { edulis: 0 } }),
    outing({ id: 'o2', date: '2026-10-15', zoneId: 'vallonina', searched: ['edulis', 'mellea'], predicted: { edulis: 20, mellea: 55 }, finds: { edulis: 2, mellea: 0 } }),
    { id: 'p', kind: 'plan', date: '2026-10-16', predicted: { edulis: 80 }, finds: {} },
    outing({ id: 'o3', date: '2026-10-17', forecast: { mode: 'retrospective' }, predicted: { edulis: 50 }, finds: { edulis: 1 } }),
  ]);
  assert.deepEqual(rows, [
    { entryId: 'o2', date: '2026-10-15', zoneId: 'vallonina', speciesId: 'edulis', predicted: 20, amount: 2 },
    { entryId: 'o2', date: '2026-10-15', zoneId: 'vallonina', speciesId: 'mellea', predicted: 55, amount: 0 },
    { entryId: 'o1', date: '2026-10-12', zoneId: 'tancia', speciesId: 'edulis', predicted: 72, amount: 0 },
  ]);
  assert.ok(rows.every((r) => !('ok' in r) && !('said' in r)));
  assert.equal(outcomeText(0), 'cercato, zero');
  assert.equal(outcomeText(2), 'trovato · Discreti');
});
