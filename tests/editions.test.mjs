// Edizioni di Fronda (editions/*.json): validità, registro del Worker, zone e risposta /edition.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { DEFAULT_EDITION, editionErrors, editionZones } from '../js/edition-core.js';

// worker/editions.js importa JSON senza attributi, come Wrangler.
register('data:text/javascript,' + encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url, context, next) {
  if (url.startsWith('file:') && url.endsWith('.json') && !context.importAttributes?.type)
    return {format: 'module', shortCircuit: true, source: 'export default ' + readFileSync(fileURLToPath(url), 'utf8') + ';'};
  return next(url, context);
}`));
const { EDITIONS, currentEdition, handleEdition } = await import('../worker/editions.js');

const zones = JSON.parse(readFileSync(new URL('../data/zones.json', import.meta.url), 'utf8')).zones;
const zoneIds = new Set(zones.map(z => z.id));
const files = readdirSync(new URL('../editions/', import.meta.url)).filter(f => f.endsWith('.json'));
const editions = files.map(f => [f, JSON.parse(readFileSync(new URL(`../editions/${f}`, import.meta.url), 'utf8'))]);

test('ogni edizione è valida, ha il nome del file e sta nel registro del Worker', () => {
  for (const [file, e] of editions) {
    assert.deepEqual(editionErrors(e, zoneIds), [], file);
    assert.equal(`${e.id}.json`, file);
    assert.deepEqual(EDITIONS[e.id], e, `${file} non è registrata in worker/editions.js`);
    assert.ok(editionZones(e, zones).length > 0, `${file} non ha zone`);
  }
  assert.equal(Object.keys(EDITIONS).length, files.length);
});

test('la generalista coincide con il ripiego e con la testata statica di index.html', () => {
  const { environment, ...fallback } = DEFAULT_EDITION;
  assert.equal(environment, 'production');
  assert.deepEqual({ ...fallback, place: { ...fallback.place }, zones: { ...fallback.zones } }, EDITIONS.fronda);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes(`title="${EDITIONS.fronda.place.title}"`));
  assert.equal(editionZones(EDITIONS.fronda, zones), zones);
});

test('le zone si filtrano per provincia e per id', () => {
  const ri = editionZones({ zones: { provinces: ['RI'], ids: null } }, zones);
  assert.ok(ri.length && ri.every(z => (z.province || ['RI']).includes('RI')));
  assert.deepEqual(editionZones({ zones: { provinces: null, ids: ['tancia'] } }, zones).map(z => z.id), ['tancia']);
  assert.ok(editionErrors({ ...EDITIONS.fronda, zones: { provinces: null, ids: ['inesistente'] } }, zoneIds).length);
  assert.ok(editionErrors({ ...EDITIONS.fronda, kind: 'demo' }).length, 'una demo senza partner non passa');
});

test('/edition.json: edizione e ambiente dalle variabili, ripiego sulla generalista', async () => {
  const get = env => handleEdition(new Request('https://x/edition.json'), env).json();
  assert.deepEqual(await get({ EDITION: 'demo-esempio', ENVIRONMENT: 'staging' }), { ...EDITIONS['demo-esempio'], environment: 'staging' });
  assert.equal((await get({ EDITION: 'nessuna' })).id, 'fronda');
  assert.equal(currentEdition({ ENVIRONMENT: 'altro' }).environment, 'production');
  assert.equal(handleEdition(new Request('https://x/edition.json', { method: 'POST' }), {}).status, 405);
});

test('wrangler.jsonc: staging con database propri, stessa edizione e cron entro il piano', () => {
  const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  const prod = config, staging = config.env.staging;
  assert.equal(prod.vars.ENVIRONMENT, 'production');
  assert.equal(staging.vars.ENVIRONMENT, 'staging');
  for (const v of [prod.vars.EDITION, staging.vars.EDITION]) assert.ok(EDITIONS[v]);
  const names = c => [...c.d1_databases.map(d => d.database_name), ...c.kv_namespaces.map(k => k.id)];
  for (const n of names(staging)) assert.ok(!names(prod).includes(n), `staging condivide ${n} con la produzione`);
  // Il Worker riconosce i cron dalla stringa esatta; il piano Free ne ammette 5 per account.
  assert.ok(staging.triggers.crons.every(c => prod.triggers.crons.includes(c)));
  assert.ok(staging.triggers.crons.includes('* * * * *'), 'senza aggiornamento meteo lo staging non ha previsioni');
  assert.ok(prod.triggers.crons.length + staging.triggers.crons.length <= 5, 'oltre il limite di cron del piano Workers Free');
  assert.ok(prod.assets.run_worker_first.includes('/edition.json'));
});
