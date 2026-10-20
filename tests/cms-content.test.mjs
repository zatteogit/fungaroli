// Snapshot pubblico del CMS: aggiornamento dal repository dei documenti non toccati (elenco
// REPOSITORY_REFRESHED di worker/cms.js) e ETag. Il Worker gira su un D1 finto (node:sqlite).
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { validateContent } from '../worker/content-validation.js';

// worker/cms.js importa la migrazione .sql e, tramite community.js, JSON senza attributi (come Wrangler).
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
const { handleContent, noneMatch, publishedContent, REPOSITORY_REFRESHED } = await import('../worker/cms.js');

const read = id => readFileSync(new URL(`../data/${id}.json`, import.meta.url), 'utf8');
test('frasi del giorno: seed nel database e snapshot, bozza autore preservata', async () => {
  const sql = new DatabaseSync(':memory:');
  const initial = await publishedContent(env(sql), ORIGIN);
  assert.deepEqual(initial.resources['daily-thoughts'], JSON.parse(read('daily-thoughts')));
  const draft = structuredClone(initial.resources['daily-thoughts']);
  draft.items[0].text = 'Una frase in lavorazione.';
  sql.prepare("UPDATE cms_documents SET version=1,draft=?,updated_by='autore' WHERE id='daily-thoughts'").run(JSON.stringify(draft));
  const snapshot = await publishedContent(env(sql), ORIGIN);
  assert.deepEqual(snapshot.resources['daily-thoughts'], initial.resources['daily-thoughts']);
  assert.equal(JSON.parse(sql.prepare("SELECT draft FROM cms_documents WHERE id='daily-thoughts'").get().draft).items[0].text, 'Una frase in lavorazione.');
});
// D1 essenziale: prepare/bind/all/first/run e batch in una transazione. Un nuovo adattatore sulla
// stessa base equivale a un nuovo isolate del Worker: init() riparte e confronta con il repository.
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
const env = (sql, files = {}) => ({ CMS_DB: d1(sql), ASSETS: { fetch: async req => {
  const id = new URL(req.url).pathname.match(/^\/data\/([a-z0-9-]+)\.json$/)?.[1];
  try { return new Response(files[id] ?? read(id)); } catch { return new Response('', { status: 404 }); }
} } });
const ORIGIN = 'https://fungaroli.test';
const row = (sql, id) => sql.prepare('SELECT version,published_version,updated_by,published FROM cms_documents WHERE id=?').get(id);

test('ogni documento aggiornato dal repository passa la validazione del CMS e ne esce invariato', () => {
  assert.ok(REPOSITORY_REFRESHED.includes('trails') && REPOSITORY_REFRESHED.includes('zones'));
  for (const id of REPOSITORY_REFRESHED) {
    const data = JSON.parse(read(id));
    const { value } = validateContent(id, data);
    if (!['guides', 'legal'].includes(id)) assert.equal(JSON.stringify(value), JSON.stringify(data), `${id}: la validazione non deve cambiare il seed`);
  }
  // i generati in sola lettura restano fuori: si aggiornano dai loro script, non dal CMS
  for (const id of ['access', 'habitat', 'trailheads']) assert.equal(REPOSITORY_REFRESHED.includes(id), false);
});

test('primo avvio: i seed entrano come versione 0, senza release aggiuntive', async () => {
  const sql = new DatabaseSync(':memory:');
  const s = await publishedContent(env(sql), ORIGIN);
  assert.equal(s.versions.trails, 0);
  assert.equal(s.versions.zones, 0);
  assert.deepEqual(s.resources.trails, JSON.parse(read('trails')));
  assert.deepEqual(s.resources.zones, JSON.parse(read('zones')));
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM cms_releases').get().n, 0);
});

test('sentieri e zone non toccati da autori si aggiornano dal repository al deploy successivo', async () => {
  const trails = JSON.parse(read('trails')), zones = JSON.parse(read('zones'));
  const oldTrails = structuredClone(trails), oldZones = structuredClone(zones);
  for (const id of ['poggio-cantalice', 'terminillo-ovest']) oldTrails.zones[id].trails.find(t => t.id === 21004687).total_km = 1.0;
  oldZones.zones[0].name += ' (vecchio)';
  const sql = new DatabaseSync(':memory:');
  await publishedContent(env(sql, { trails: JSON.stringify(oldTrails), zones: JSON.stringify(oldZones) }), ORIGIN);
  const before = await publishedContent(env(sql, { trails: JSON.stringify(oldTrails), zones: JSON.stringify(oldZones) }), ORIGIN);
  assert.equal(before.versions.trails, 0); // stesso repository: nessuna nuova revisione
  const s = await publishedContent(env(sql), ORIGIN); // nuovo deploy con i dati corretti
  assert.equal(s.versions.trails, 1);
  assert.equal(s.versions.zones, 1);
  assert.equal(s.resources.trails.zones['poggio-cantalice'].trails.find(t => t.id === 21004687).total_km, null);
  assert.deepEqual(s.resources.zones, zones);
  assert.equal(row(sql, 'trails').updated_by, 'release:repository-seed:discover-v1');
  // la revisione originale resta in cronologia
  assert.deepEqual(sql.prepare("SELECT version FROM cms_revisions WHERE document_id='trails' ORDER BY version").all().map(r => r.version), [0, 1]);
  assert.notEqual(s.release, before.release);
});

test('un autore che ha modificato i sentieri o ha una bozza aperta sulle zone non viene sovrascritto', async () => {
  const trails = JSON.parse(read('trails')), zones = JSON.parse(read('zones'));
  const oldTrails = structuredClone(trails);
  oldTrails.zones['poggio-cantalice'].trails[0].editorialNote = 'Nota della redazione.';
  const sql = new DatabaseSync(':memory:');
  await publishedContent(env(sql, { trails: JSON.stringify(oldTrails) }), ORIGIN);
  const authored = JSON.stringify(oldTrails), draft = JSON.stringify({ ...zones, origin: { ...zones.origin, name: 'Bozza' } });
  sql.prepare("UPDATE cms_documents SET version=1,published_version=1,draft=?,published=?,updated_by='autore' WHERE id='trails'").run(authored, authored);
  sql.prepare("UPDATE cms_documents SET version=1,draft=?,updated_by='autore' WHERE id='zones'").run(draft);
  const changedZones = JSON.stringify({ ...zones, zones: zones.zones.map((z, i) => i ? z : { ...z, name: z.name + ' (nuovo)' }) });
  const s = await publishedContent(env(sql, { zones: changedZones }), ORIGIN);
  assert.equal(s.versions.trails, 1);
  assert.equal(row(sql, 'trails').published, authored);
  assert.equal(s.versions.zones, 0);
  assert.deepEqual(s.resources.zones, zones);
});

test('If-None-Match: confronto debole, liste e «*» (RFC 9110 §13.1.2)', () => {
  const tag = '"82332829-a491-4580-9c91-7d67e79f157d"';
  for (const h of [tag, `W/${tag}`, `"altro", W/${tag}`, `W/"altro",${tag}`, '*', ' * ']) assert.equal(noneMatch(h, tag), true, h);
  for (const h of [null, '', '"altro"', 'W/"altro"', tag.slice(0, -1) + 'x"', `w/${tag}x`, tag.replace(/"/g, '')]) assert.equal(noneMatch(h, tag), false, String(h));
});

test('lo snapshot risponde 304 anche all’ETag debole che il browser rimanda dopo la compressione', async () => {
  const sql = new DatabaseSync(':memory:'), e = env(sql);
  const get = headers => handleContent(new Request(`${ORIGIN}/api/content/v1/snapshot`, { headers }), e);
  const first = await get({});
  assert.equal(first.status, 200);
  const tag = first.headers.get('etag');
  assert.match(tag, /^"[^"]+"$/);
  for (const h of [tag, `W/${tag}`, `"vecchia", W/${tag}`]) {
    const r = await get({ 'if-none-match': h });
    assert.equal(r.status, 304, h);
    assert.equal(r.headers.get('etag'), tag);
    assert.equal(await r.text(), '');
  }
  assert.equal((await get({ 'if-none-match': 'W/"vecchia"' })).status, 200);
});

test('animal catalog is seeded in snapshots, refreshed only when untouched, and preserves an author draft',async()=>{
 const sql=new DatabaseSync(':memory:');
 const initial=await publishedContent(env(sql),ORIGIN);
 assert.equal(initial.resources.animals.items.filter(i=>i.publicationStatus==='ready').length,8);
 const changed=JSON.parse(read('animals'));changed.items[0].summary+=' Aggiornamento.';
 const updated=await publishedContent(env(sql,{animals:JSON.stringify(changed)}),ORIGIN);
 assert.deepEqual(updated.resources.animals,changed);
 const draft=structuredClone(changed);draft.items[0].summary='Bozza autore';
 sql.prepare("UPDATE cms_documents SET version=version+1,draft=?,updated_by='autore' WHERE id='animals'").run(JSON.stringify(draft));
 const preserved=await publishedContent(env(sql),ORIGIN);
 assert.deepEqual(preserved.resources.animals,changed);
 assert.equal(JSON.parse(sql.prepare("SELECT draft FROM cms_documents WHERE id='animals'").get().draft).items[0].summary,'Bozza autore');
});
