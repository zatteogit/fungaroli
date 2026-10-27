import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { buildSync } from 'esbuild';
import { inspectCoreSource, checkArchitecture } from '../tools/foundation/architecture.mjs';
import { environmentConfig, readInputs, ROOT } from '../tools/foundation/environments.mjs';
import { foundationCss, inspectNewConsumer, buildDesignSystem } from '../tools/foundation/design-system.mjs';
import { EDITIONS, resolveModules, normalizeFieldRecord } from '../js/core/index.js';
import { normalizeFieldRecord as legacy } from '../js/community-observation.js';
import demo from '../infra/demo/worker.js';
import { createEnvironmentBoundary } from '../infra/environment-boundary.js';
const nonproduction = createEnvironmentBoundary({ fetch() { throw Error('Nessun accesso all’app per health o ambienti ignoti.'); } });

const coreRoot = path.join(ROOT, 'src/js/core');
const inspect = source => inspectCoreSource(source, path.join(coreRoot, 'probe.ts'), coreRoot);

test('il nucleo esegue le regole senza DOM, provider o API Node', () => {
  const bundle = buildSync({ entryPoints: [path.join(ROOT, 'js/core/index.js')], bundle: true, write: false, format: 'iife', globalName: 'FrondaCore', platform: 'neutral' }).outputFiles[0].text;
  const context = vm.createContext({});
  vm.runInContext(bundle, context);
  const output = vm.runInContext(`FrondaCore.normalizeFieldRecord({presence:'searched_absent',amount:null,minutes:45,habitat:'unknown'})`, context);
  assert.equal(output.amount, 0);
  assert.equal(output.effortClass, '30-60');
  assert.equal(output.identification, 'unreviewed');
  assert.equal(normalizeFieldRecord, legacy, 'l’app usa la stessa implementazione');
});
test('il guard protegge anche type import, re-export e import dinamici', async () => {
  assert.deepEqual(await checkArchitecture(ROOT), []);
  for (const source of [
    `import type {X} from '../notebook-types.js';`,
    `export { x } from 'node:fs';`,
    `const x = import('../weather.js');`,
    `const x = import(target);`,
    `const x = import('./field-record.js' + suffix);`,
    `type X = import('../weather.js').Weather;`,
    `const x: any = 1;`,
    `// @ts-nocheck\nconst x = 1;`,
    `const x = require('./field-record.js');`,
  ]) assert.ok(inspect(source).length, source);
  assert.deepEqual(inspect(`import {x} from './field-record.js'; export type {X} from './field-record-types.js';`), []);
});
test('ogni offerta include sicurezza e dipendenze una sola volta', () => {
  for (const modules of Object.values(EDITIONS)) {
    const resolved = resolveModules(modules);
    assert.equal(resolved[0], 'safety');
    assert.equal(resolved.length, new Set(resolved).size);
    assert.ok(Object.isFrozen(resolved));
  }
  assert.deepEqual(resolveModules(['academy']), ['safety', 'catalog', 'learning', 'academy']);
  assert.deepEqual(resolveModules([]), ['safety']);
  assert.throws(() => resolveModules(['unknown']));
  assert.throws(() => resolveModules(['__proto__']));
});
test('gli ambienti rifiutano collisioni e non ereditano risorse della produzione', async () => {
  const { manifest, production } = await readInputs();
  for (const name of ['local', 'test', 'staging', 'demo']) {
    const config = environmentConfig(name, manifest, production);
    assert.equal(config.workers_dev, false);
    assert.equal(config.preview_urls, false);
    assert.deepEqual(config.triggers.crons, []);
    const serialized = JSON.stringify(config);
    for (const value of [production.name, production.vars.APP_ORIGIN, production.vars.CMS_ADMIN_IDS, ...production.kv_namespaces.map(x => x.id)]) {
      assert.ok(!serialized.includes('"' + value + '"'), value);
    }
    assert.ok(!config.routes && !config.services && !config.send_email);
    if (name === 'demo') assert.ok(!config.d1_databases && !config.kv_namespaces);
    else assert.ok(config.d1_databases.every(x => x.remote === false && x.database_name.startsWith(`fronda-${name}-`)));
  }
  for (const edit of [m => m.environments.demo.port = m.environments.test.port,
    m => m.environments.local.worker = production.name,
    m => m.environments.staging.remote = true,
    m => m.environments.demo.data = 'production']) {
    const m = structuredClone(manifest); edit(m);
    assert.throws(() => environmentConfig('local', m, production));
  }
  assert.throws(() => environmentConfig('production', manifest, production));
});
test('la demo è sintetica, in sola lettura e non chiama servizi o account', async () => {
  const env = { ASSETS: { fetch() { throw Error('Gli asset non devono essere chiamati dalle API.'); } } };
  const response = await demo.fetch(new Request('http://demo.test/api/demo/v1/foundation'), env);
  const data = await response.json();
  assert.equal(data.synthetic, true);
  assert.equal(data.observation.identification, 'unreviewed');
  assert.equal(data.observation.amount, 0);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.ok(response.headers.get('content-security-policy').includes("connect-src 'self'"));
  for (const method of ['POST', 'PATCH', 'DELETE']) assert.equal((await demo.fetch(new Request('http://demo.test/api/demo/v1/foundation', {method}), env)).status, 405);
  for (const url of ['/api/community/status', '/api/weather/v1/snapshot', '/redazione']) assert.equal((await demo.fetch(new Request('http://demo.test'+url), env)).status, 404);
  const head = await demo.fetch(new Request('http://demo.test/api/demo/v1/foundation', {method:'HEAD'}), env);
  assert.equal(await head.text(), '');
});
test('il Worker non produttivo rifiuta ambienti ignoti e non esegue cron', async () => {
  assert.equal((await nonproduction.fetch(new Request('http://local.test/'), {})).status, 503);
  const health = await nonproduction.fetch(new Request('http://local.test/_fronda/health'), {FRONDA_ENVIRONMENT:'test'});
  assert.deepEqual(await health.json(), {environment:'test', scheduledJobs:false});
  await nonproduction.scheduled({}, new Proxy({}, {get() {throw Error('Nessun effetto schedulato ammesso.');}}), {});
});
test('il contratto visuale rifiuta salti di livello, primitive orfane e valori nei consumer', async () => {
  const foundation = JSON.parse(await readFile(path.join(ROOT, 'design-system/foundation.json'), 'utf8'));
  assert.ok(foundationCss(foundation).includes('--ds-component-card-padding'));
  const bypass = structuredClone(foundation); bypass.component['card-padding'] = '{primitive.space-4}';
  assert.throws(() => foundationCss(bypass));
  const orphan = structuredClone(foundation); orphan.primitive.unused = {type:'dimension', value:10, unit:'px'};
  assert.throws(() => foundationCss(orphan));
  const known = new Set(['--text', '--ds-space-stack']);
  for (const source of ['.x{color:#ffffff}', '.x{color:red}', '.x{padding:17px}', '.x{color:var(--_ref-ink)}', '.x{gap:var(--undefined)}']) assert.ok(inspectNewConsumer(source, known).length, source);
  assert.deepEqual(inspectNewConsumer('.x{color:var(--text);gap:var(--ds-space-stack)}', known), []);
  assert.ok((await buildDesignSystem({check:true})).publicTokens > 0);
});
