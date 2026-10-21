// Scheda specie, lista «dove cercarla»: l'indice di oggi va mostrato sulla scala dell'app (0–10, virgola).
// Prima del 16/10/2026 la riga stampava il valore interno 0–100 («indice oggi 72»).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { whereMeta } from '../js/science.js';

test('dove cercarla: indice di oggi su 0–10 con la virgola, mai sulla scala interna 0–100', () => {
  const pot = { ha: 320, elevRange: [900, 1300] };
  assert.equal(whereMeta(pot, 72), '~320 ha adatti tra 900 e 1300 m · indice oggi 7,2');
  assert.equal(whereMeta(pot, 100), '~320 ha adatti tra 900 e 1300 m · indice oggi 10,0');
  assert.equal(whereMeta(pot, 0), '~320 ha adatti tra 900 e 1300 m · indice oggi 0,0');
  assert.doesNotMatch(whereMeta(pot, 72), /\b72\b/);
});

test('dove cercarla: senza meteo niente indice; senza bosco adatto lo dice', () => {
  assert.equal(whereMeta({ ha: 0, elevRange: null }, null), 'nessun bosco adatto');
  assert.equal(whereMeta({ ha: 40, elevRange: null }, undefined), '~40 ha adatti');
  assert.equal(whereMeta({ ha: 40, elevRange: null }, NaN), '~40 ha adatti');
});

// La produzione (v319) mostra l'indice di oggi con il simbolo del fungo accanto: ettari e quote vengono da whereMeta,
// l'indice dalla stessa formatIndex (0–10 con la virgola).
test('la scheda specie usa whereMeta e non stampa più l’indice grezzo', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /indice oggi \$\{today\}/);
  assert.match(app, /whereMeta\(pot, null\)/);
  assert.match(app, /indice oggi \$\{formatIndex\(today\)\}/);
});
