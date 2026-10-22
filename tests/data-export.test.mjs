// «Scarica il taccuino» senza profilo e controllo del file del profilo (decisione di Matteo del 22/10/2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPORT_FORMAT, exportFilename, completeExport, deviceNotebookExport, downloadDeviceNotebook } from '../js/data-export.js';

test('nome del file con il giorno di Roma', () => {
  assert.equal(exportFilename('taccuino', new Date('2026-10-21T22:30:00Z')), 'fronda-taccuino-2026-10-22.json');
  assert.equal(exportFilename('dati', new Date('2026-10-21T10:00:00Z')), 'fronda-dati-2026-10-21.json');
});

test('un file del profilo troncato non viene salvato come completo', () => {
  const full = `{"format":"${EXPORT_FORMAT}","entries":[{"id":"a"}],"complete":true}`;
  assert.equal(completeExport(full), true);
  assert.equal(completeExport(full + '\n'), true);
  assert.equal(completeExport(full.slice(0, -18)), false);
  assert.equal(completeExport('{"format":"altro","complete":true}'), false);
  assert.equal(completeExport(undefined), false);
});

test('taccuino del dispositivo: voci con foto, ricevuta degli avvisi, foto mancanti dichiarate', async () => {
  const photo = { data: 'data:image/jpeg;base64,/9j/2Q==', width: 2, height: 2 };
  const entries = [{ id: 'n1', kind: 'note', note: 'privata', photo }, { id: 'n2', kind: 'note', note: '', photo: null, photoUnavailable: true }];
  const receipt = { version: 'cgs-1', noticeHash: 'a'.repeat(64), acceptedAt: '2026-10-20T08:00:00.000Z', source: 'explicit', platform: 'browser' };
  const out = deviceNotebookExport({ entries, legalAcceptance: receipt, exportedAt: '2026-10-22T10:00:00.000Z' });
  assert.equal(out.format, EXPORT_FORMAT);
  assert.equal(out.scope, 'device');
  assert.equal(out.account, null);
  assert.deepEqual(out.entries, [entries[0], { id: 'n2', kind: 'note', note: '', photo: null, photoMissing: true }]);
  assert.deepEqual(out.legalAcceptances, [receipt]);
  assert.equal(out.complete, true);
  assert.ok(completeExport(JSON.stringify(out)), 'stesso controllo di completezza del file del profilo');
  assert.deepEqual(deviceNotebookExport({ entries: [] }).legalAcceptances, []);
});

test('il download usa le voci lette dall’archivio locale e restituisce quante sono', async () => {
  const saved = [];
  const old = globalThis.claude;
  globalThis.claude = { use: async (name) => (name === 'downloads' ? { save: async (file) => saved.push(file) } : null) };
  try {
    const count = await downloadDeviceNotebook({ list: async () => [{ id: 'n1', kind: 'note', note: 'x' }] });
    assert.equal(count, 1);
    assert.equal(saved.length, 1);
    assert.match(saved[0].filename, /^fronda-taccuino-\d{4}-\d{2}-\d{2}\.json$/);
    assert.deepEqual(JSON.parse(saved[0].data).entries, [{ id: 'n1', kind: 'note', note: 'x' }]);
  } finally { if (old === undefined) delete globalThis.claude; else globalThis.claude = old; }
});
