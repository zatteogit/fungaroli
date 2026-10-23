// Vecchio diario con codice (Workers KV): dismesso il 22/10/2026 (decisione di Matteo). L'API risponde 410 a ogni
// richiesta, anche con il codice giusto, e non tocca il namespace: le voci si esportano e si cancellano con Wrangler
// (docs/legale.md, §6.5). Il binding DIARIO resta perché ospita anche la cache meteo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { onRequest, handleDiario } from '../functions/api/diario/[[path]].js';

// worker/index.js importa migrazioni .sql e JSON senza attributi (come Wrangler).
register('data:text/javascript,' + encodeURIComponent(`
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function load(url, context, next) {
  if (url.startsWith('file:') && (url.endsWith('.sql') || url.endsWith('.json') && !context.importAttributes?.type)) {
    const text = readFileSync(fileURLToPath(url), 'utf8');
    return {format: 'module', shortCircuit: true, source: 'export default ' + (url.endsWith('.sql') ? JSON.stringify(text) : text) + ';'};
  }
  return next(url, context);
}`));
const { default: worker } = await import('../worker/index.js');

function kv() {
  const m = new Map([['entry:abc123', '{"id":"abc123","note":"faggeta"}'], ['weather:v1:zona', '{"meteo":true}']]);
  const calls = [];
  const touch = (name) => (...args) => { calls.push(name); return name === 'list' ? { keys: [], list_complete: true } : null; };
  return { m, calls, get: touch('get'), put: touch('put'), delete: touch('delete'), list: touch('list') };
}
const env = () => ({ DIARIO: kv(), DIARIO_TOKEN: 'codice-segreto-1234' });
const req = (method, path, { token = 'codice-segreto-1234', body } = {}) => new Request(`https://x.test/api/diario${path ? '/' + path : ''}`,
  { method, body, headers: token ? { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) } : {} });
const cases = [['GET', ''], ['GET', 'abc123'], ['PUT', 'abc123', '{"id":"abc123","date":"2026-10-11","zoneId":"tancia"}'], ['DELETE', 'abc123'], ['POST', '']];

test('ogni richiesta riceve 410 «servizio dismesso», con o senza codice', async () => {
  for (const token of ['codice-segreto-1234', 'sbagliato', '']) for (const [method, path, body] of cases) {
    const e = env();
    const res = await onRequest({ request: req(method, path, { token, body }), env: e, params: { path: path ? [path] : [] } });
    assert.equal(res.status, 410, `${method} /${path}`);
    const out = await res.json();
    assert.equal(out.code, 'diario_dismesso');
    assert.match(out.error, /^Servizio dismesso/);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  }
});

test('i dati non vengono letti, scritti né cancellati: la cache meteo resta', async () => {
  for (const [method, path, body] of cases) {
    const e = env();
    assert.equal((await handleDiario(req(method, path, { body }), e, path ? [path] : [])).status, 410);
    assert.deepEqual(e.DIARIO.calls, []);
    assert.deepEqual([...e.DIARIO.m.keys()], ['entry:abc123', 'weather:v1:zona']);
  }
});

test('anche senza binding o segreto la risposta resta 410, senza dettagli di configurazione', async () => {
  const res = await handleDiario(req('GET', ''), {}, []);
  assert.equal(res.status, 410);
  assert.doesNotMatch(JSON.stringify(await res.json()), /DIARIO_TOKEN|\bKV\b|binding|not_configured/);
});

test('il Worker inoltra /api/diario alla risposta di dismissione', async () => {
  for (const path of ['/api/diario', '/api/diario/', '/api/diario/abc123']) {
    const e = { ...env(), ASSETS: { fetch: () => { throw new Error('non deve servire file statici'); } } };
    const res = await worker.fetch(new Request('https://x.test' + path, { headers: { authorization: 'Bearer codice-segreto-1234' } }), e, {});
    assert.equal(res.status, 410, path);
    assert.deepEqual(e.DIARIO.calls, []);
  }
});
