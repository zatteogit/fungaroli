import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// L'avviso «versione nuova» confronta la versione della pagina con quella del service worker: devono coincidere.
test('la versione in index.html è la stessa di SHELL in sw.js', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8').match(/const SHELL = '([^']+)'/)?.[1];
  const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/<meta name="app-version" content="([^"]+)"/)?.[1];
  assert.ok(sw);
  assert.equal(page, sw);
});
