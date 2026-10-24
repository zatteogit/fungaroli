// Righe per lo studio dell'indice (4.3): solo con consenso alla ricerca, zero solo con ricerca conclusa e durata,
// nessun dato privato, righe conformi a docs/schema/uscita-osservazione.schema.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { researchRows, observationRow } from '../js/research-export.js';
import { RESEARCH_CONSENT_VERSION } from '../js/research-consent.js';
const schema = JSON.parse(readFileSync(new URL('../docs/schema/uscita-osservazione.schema.json', import.meta.url)));

// Validatore minimo per il sottoinsieme dello schema usato qui (type, const, enum, required, additionalProperties, minimi e massimi).
function check(value, s, path = '$') {
  const types = s.type ? [].concat(s.type) : null, t = value === null ? 'null' : Number.isInteger(value) ? 'integer' : typeof value;
  if (types && !types.includes(t) && !(t === 'integer' && types.includes('number'))) throw new Error(`${path}: tipo ${t}`);
  if ('const' in s && value !== s.const) throw new Error(`${path}: diverso da ${s.const}`);
  if (s.enum && !s.enum.includes(value)) throw new Error(`${path}: ${value} fuori elenco`);
  if (typeof value === 'number' && (s.minimum != null && value < s.minimum || s.maximum != null && value > s.maximum)) throw new Error(`${path}: fuori intervallo`);
  if (typeof value === 'string' && (s.minLength && value.length < s.minLength || s.pattern && !new RegExp(s.pattern).test(value))) throw new Error(`${path}: stringa non valida`);
  if (t === 'object' && s.properties) {
    for (const k of s.required || []) if (!(k in value)) throw new Error(`${path}.${k}: manca`);
    for (const [k, v] of Object.entries(value)) {
      if (!(k in s.properties)) { if (s.additionalProperties === false) throw new Error(`${path}.${k}: campo non previsto`); continue; }
      check(v, s.properties[k], `${path}.${k}`);
    }
  }
}
const consents = new Map([['acc-si', { granted: true, version: RESEARCH_CONSENT_VERSION }], ['acc-tolto', { granted: false, version: RESEARCH_CONSENT_VERSION }]]);
const pseudonym = (id) => 'obs-' + id.slice(4).padEnd(8, '0');
const shared = (accountId, payload) => ({ accountId, kind: 'shared_observation', day: '2026-10-18', zoneId: 'tancia', category: 'fungo', taxonId: 'edulis',
  payload: { presence: 'observed', amount: 2, minutes: null, effortClass: null, completed: null, stopReason: null, people: 2, elevation: 1100, habitat: 'broadleaf', protocolVersion: 'fronda-field-note-v2', ...payload } });

test('entrano solo i profili con il consenso alla ricerca attivo', () => {
  const rows = researchRows([shared('acc-si', {}), shared('acc-tolto', {}), shared('acc-mai', {})], { consents, pseudonym });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].observer, 'obs-si000000');
  assert.equal(rows[0].consent_version, RESEARCH_CONSENT_VERSION);
});

test('uno zero è not_detected solo con ricerca conclusa e durata', () => {
  const zero = (p) => observationRow(shared('acc-si', { presence: 'searched_absent', amount: 0, ...p }), { observer: 'obs-12345678', consentVersion: RESEARCH_CONSENT_VERSION });
  assert.equal(zero({ completed: true, effortClass: '60-120', stopReason: 'planned_time' }).outcome, 'not_detected');
  assert.equal(zero({ completed: true, minutes: 45 }).outcome, 'not_detected', 'minuti degli appunti v1 letti nella loro classe');
  assert.equal(zero({ completed: false, effortClass: '60-120', stopReason: 'weather' }).outcome, 'unknown');
  assert.equal(zero({ completed: null, effortClass: '60-120' }).outcome, 'unknown');
  assert.equal(zero({ completed: true }).outcome, 'unknown');
  const row = zero({ completed: true, effortClass: 'gt120', stopReason: 'planned_time' });
  assert.deepEqual(row.effort, { basis: 'actual_with_stop_reason', class: 'gt120', minutes: null, people: 2, completed: true, stop_reason: 'planned_time' });
  assert.equal(row.amount, 0);
});

test('segnalazioni rapide: trovato con quantità, zero sempre unknown, previsione solo se prospettica', () => {
  const report = (amount, ctx) => ({ accountId: 'acc-si', kind: 'report', day: '2026-10-18', zoneId: 'tancia', speciesId: 'edulis', amount, identificationChecked: true, validationContext: ctx });
  const [found, zero] = researchRows([report(3, { mode: 'prospective', predicted: 62, modelVersion: '2.1.0', capturedAt: '2026-10-18T05:00:00Z', effort: { minutes: 90, people: 1 } }), report(0, { mode: 'none', effort: null })], { consents, pseudonym });
  assert.deepEqual([found.outcome, found.amount, found.identification, found.effort.class, found.forecast.predicted], ['detected', 3, 'declared_checked', '60-120', 62]);
  assert.deepEqual([zero.outcome, zero.forecast, zero.effort.basis], ['unknown', null, 'none']);
});

test('righe conformi allo schema e senza dati privati', () => {
  const rows = researchRows([
    shared('acc-si', { title: 'Il mio punto segreto', note: 'testo privato', lat: 42.1, lon: 12.9, accountId: 'acc-si' }),
    shared('acc-si', { presence: 'searched_absent', amount: 0, completed: true, effortClass: 'lt30', stopReason: 'other' }),
    { accountId: 'acc-si', kind: 'report', day: '2026-10-18', zoneId: 'tancia', speciesId: 'edulis', amount: 1, identificationChecked: false, validationContext: null },
  ], { consents, pseudonym });
  assert.equal(rows.length, 3);
  for (const row of rows) check(row, schema);
  const text = JSON.stringify(rows);
  for (const leak of ['segreto', 'testo privato', '42.1', 'acc-si']) assert.ok(!text.includes(leak), leak);
});
