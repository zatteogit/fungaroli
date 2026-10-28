import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { inspectCoreSource, checkArchitecture } from '../tools/foundation/architecture.mjs';
import { normalizeFieldRecord } from '../js/core/index.js';
import { normalizeFieldRecord as legacy } from '../js/community-observation.js';

// Nucleo portatile recuperato dalla PR #298 (valutazione in docs/ipotesi/fondazione-modulare-pr298-2026-10-28.md).
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const coreRoot = path.join(ROOT, 'src/js/core');
const inspect = source => inspectCoreSource(source, path.join(coreRoot, 'probe.ts'), coreRoot);

test('il nucleo esegue le regole delle osservazioni senza DOM, provider o API Node', () => {
  const bundle = buildSync({ entryPoints: [path.join(ROOT, 'js/core/index.js')], bundle: true, write: false, format: 'iife', globalName: 'FrondaCore', platform: 'neutral' }).outputFiles[0].text;
  const context = vm.createContext({});
  vm.runInContext(bundle, context);
  const output = vm.runInContext(`FrondaCore.normalizeFieldRecord({presence:'searched_absent',amount:null,minutes:45,habitat:'unknown'})`, context);
  assert.equal(output.amount, 0);
  assert.equal(output.effortClass, '30-60');
  assert.equal(output.identification, 'unreviewed');
  assert.equal(normalizeFieldRecord, legacy, 'l’app usa la stessa implementazione');
});
test('il guard del nucleo blocca dipendenze esterne, anche con type import, re-export e import dinamici', async () => {
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
