// Guardia del design system Fronda sull'app: token a tre livelli, contrasti, perimetro a tolleranza zero e cricchetto sul resto.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (cwd) => spawnSync(process.execPath, ['tools/ds-guard.mjs'], {cwd, encoding: 'utf8'});

test('la guardia passa sul repository', () => {
  const r = run(root);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// copia minima: token, fogli di stile, JS e guardia; ogni sonda rompe una regola e deve far fallire la guardia
function probe(edit) {
  const dir = mkdtempSync(join(tmpdir(), 'fronda-app-guard-'));
  try {
    for (const p of ['css', 'js', 'tools', 'index.html', 'redazione.html']) cpSync(join(root, p), join(dir, p), {recursive: true});
    edit(dir);
    return run(dir);
  } finally { rmSync(dir, {recursive: true, force: true}); }
}
const append = (dir, file, text) => writeFileSync(join(dir, file), readFileSync(join(dir, file), 'utf8') + text);
const swap = (dir, file, a, b) => { const s = readFileSync(join(dir, file), 'utf8'); assert.ok(s.includes(a), a); writeFileSync(join(dir, file), s.replace(a, b)); };

for (const [name, edit] of [
  ['colore scritto a mano nel perimetro Fronda', (d) => append(d, 'css/fronda.css', '\n.x { color: #123456; }\n')],
  ['primitiva privata usata fuori dai token', (d) => append(d, 'css/style.css', '\n.x { color: var(--_ref-forest); }\n')],
  ['nuovo colore scritto a mano nel CSS esistente', (d) => append(d, 'css/style.css', '\n.x { color: #123456; }\n')],
  ['riferimento a un token inesistente', (d) => swap(d, 'css/tokens.css', '--bg: var(--_ref-ivory);', '--bg: var(--non-esiste);')],
  ['contrasto insufficiente fra testo e fondo', (d) => swap(d, 'css/tokens.css', '--text: var(--_ref-ink);', '--text: var(--_ref-paper);')],
]) test(`la guardia blocca: ${name}`, () => {
  const r = probe(edit);
  assert.notEqual(r.status, 0, r.stdout);
});
