import test from 'node:test';
import assert from 'node:assert/strict';
import { agreement, summary, speciesAgreement } from '../js/journal.js';
const outing = (data) => ({ kind: 'outing', searched: ['edulis'],
  forecast: { mode: 'prospective', capturedAt: '2026-10-12T05:00:00Z' },
  effort: { startedAt: '2026-10-12T08:00:00Z' }, ...data });
test('il confronto prospettico riguarda ciascuna specie cercata', () => {
  const e = outing({ predicted: { edulis: 70, mellea: 0 }, finds: { edulis: 0, mellea: 2 } });
  assert.equal(agreement(e).ok, false); assert.equal(agreement(e).falseAlarm, 1);
  assert.deepEqual(speciesAgreement(e).map((x) => x.id), ['edulis']);
});
test('un ritrovamento concorda solo con la previsione della propria specie', () => {
  assert.equal(agreement(outing({ predicted: { edulis: 70 }, finds: { edulis: 2 } })).ok, true);
  assert.equal(agreement(outing({ predicted: { edulis: 5 }, finds: { edulis: 2 } })).missed, 1);
});
test('vecchie voci, ricostruzioni e dati mancanti non diventano validazione', () => {
  assert.equal(agreement({ predicted: { edulis: 70 }, finds: { edulis: 2 } }), null);
  assert.equal(agreement(outing({ predicted: { edulis: null }, finds: { edulis: 2 } })), null);
  assert.equal(agreement(outing({ predicted: { edulis: 70 }, finds: {} })), null);
  assert.equal(agreement(outing({ forecast: { mode: 'retrospective' }, predicted: { edulis: 70 }, finds: { edulis: 2 } })), null);
});
test('una previsione salvata dopo l’inizio non è prospettica', () => {
  assert.equal(agreement(outing({ forecast: { mode: 'prospective', capturedAt: '2026-10-12T09:00:00Z' }, predicted: { edulis: 70 }, finds: { edulis: 2 } })), null);
});
test('riepilogo per specie e piani esclusi dal numero di uscite', () => {
  assert.deepEqual(summary([
    outing({ searched: ['edulis', 'mellea'], predicted: { edulis: 70, mellea: 5 }, finds: { edulis: 2, mellea: 2 } }),
    outing({ predicted: { edulis: 70 }, finds: { edulis: 0 } }),
    { kind: 'plan', predicted: { edulis: 70 }, finds: {} }, { predicted: {}, finds: {} },
  ]), { total: 3, judged: 3, ok: 1, missed: 1, falseAlarm: 1 });
});
