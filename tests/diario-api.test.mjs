import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/diario/[[path]].js';

function kv() {
  const m = new Map();
  return {
    m,
    async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
    async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
  };
}
const env = () => ({ DIARIO: kv(), DIARIO_TOKEN: 'codice-segreto-1234' });
const req = (method, path, { token = 'codice-segreto-1234', body } = {}) => ({
  request: new Request(`https://x.pages.dev/api/diario${path ? '/' + path : ''}`, { method, body, headers: token ? { authorization: `Bearer ${token}` } : {} }),
  params: { path: path ? [path] : [] },
});
const entry = { id: 'abc123', date: '2026-10-11', zoneId: 'tancia', band: 1100, finds: { edulis: 2 }, note: 'faggeta' };

test('senza codice o con codice errato: 401', async () => {
  const e = env();
  assert.equal((await onRequest({ ...req('GET', '', { token: '' }), env: e })).status, 401);
  assert.equal((await onRequest({ ...req('GET', '', { token: 'sbagliato' }), env: e })).status, 401);
});

test('salva, elenca ed elimina un uscita', async () => {
  const e = env();
  assert.equal((await onRequest({ ...req('PUT', 'abc123', { body: JSON.stringify(entry) }), env: e })).status, 200);
  const list = await (await onRequest({ ...req('GET', ''), env: e })).json();
  assert.deepEqual(list.entries, [entry]);
  assert.equal((await onRequest({ ...req('DELETE', 'abc123'), env: e })).status, 200);
  assert.equal((await (await onRequest({ ...req('GET', ''), env: e })).json()).entries.length, 0);
});

test('rifiuta id non valido, id incoerente e dati malformati', async () => {
  const e = env();
  assert.equal((await onRequest({ ...req('PUT', '../x', { body: '{}' }), env: e })).status, 400);
  assert.equal((await onRequest({ ...req('PUT', 'zzz999', { body: JSON.stringify(entry) }), env: e })).status, 400);
  assert.equal((await onRequest({ ...req('PUT', 'abc123', { body: 'non json' }), env: e })).status, 400);
});

test('non configurato: 503', async () => {
  assert.equal((await onRequest({ ...req('GET', ''), env: {} })).status, 503);
});
