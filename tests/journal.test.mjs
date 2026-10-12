import test from 'node:test';
import assert from 'node:assert/strict';
import { agreement, summary } from '../js/journal.js';

test('agreement: modello positivo e funghi trovati = giusto', () => {
  assert.deepEqual(agreement({ predicted: { edulis: 70, aereus: 10 }, finds: { edulis: 2 } }), { said: true, found: true, ok: true });
});

test('agreement: modello positivo ma niente = ottimista', () => {
  const a = agreement({ predicted: { edulis: 55 }, finds: {} });
  assert.equal(a.ok, false);
  assert.equal(a.said, true);
});

test('agreement: senza previsione non si giudica', () => {
  assert.equal(agreement({ predicted: {}, finds: { edulis: 1 } }), null);
});

test('summary conta giusti, ottimisti e pessimisti', () => {
  const s = summary([
    { predicted: { edulis: 70 }, finds: { edulis: 3 } },
    { predicted: { edulis: 60 }, finds: {} },
    { predicted: { edulis: 5 }, finds: { mellea: 2 } },
    { predicted: {}, finds: {} },
  ]);
  assert.deepEqual(s, { total: 4, judged: 3, ok: 1, missed: 1, falseAlarm: 1 });
});
