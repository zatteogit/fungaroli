import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFieldPack, parseStoredFieldPack } from '../js/field-contracts.js';

const original = () => ({
  version: 1, id: 'vallonina~2026-10-27~710', preparedAt: '2026-10-27T10:00:00Z', date: '2026-10-27',
  zone: { id: 'vallonina', title: 'Vallonina', description: null, parking: [{ name: 'Sosta' }] },
  trail: { id: 710, name: 'Tratto', length: 3.3, lines: [[[42, 12], [42.1, 12.1]]] },
  weather: { text: 'Asciutto', level: 'ok', fetchedAt: '2026-10-27T09:00:00Z' },
  rules: 'Verifica le regole locali.',
  species: [{ kind: 'fungus', name: 'Porcino', features: ['Pori'], sources: [{ title: 'Fonte', url: 'https://example.org/' }] }],
});
test('confine JS/TS: la copia pubblica non conserva campi privati inattesi', () => {
  const input = original();
  input.position = { latitude: 42.12345, longitude: 12.11223 };
  input.zone.note = 'appunto privato';
  input.species[0].privatePhoto = 'data:image/jpeg;base64,private';
  const result = parseFieldPack(input);
  assert.equal(result.position, undefined);
  assert.equal(result.zone.note, undefined);
  assert.equal(result.species[0].privatePhoto, undefined);
  assert.deepEqual(result.trail.lines, input.trail.lines);
  assert.equal(result.species[0].sources[0].title, 'Fonte');
});
test('copie v1 esistenti: campi facoltativi nulli e metadati di salvataggio restano leggibili', () => {
  const input = original();
  input.trail = null; input.weather = null;
  const result = parseStoredFieldPack({ ...input, cache: 'fronda-field-pack-old', bytes: 1024, savedAt: input.preparedAt });
  assert.equal(result.zone.description, undefined);
  assert.equal(result.cache, 'fronda-field-pack-old');
  assert.equal(result.trail, null);
  assert.equal(result.weather, null);
  assert.deepEqual(result.species[0].lookalikes, []);
});
test('dati da JS o IndexedDB malformati: niente date, meteo o geometrie inventate', () => {
  for (const change of [
    p => { p.version = 2; },
    p => { p.preparedAt = 'ieri'; },
    p => { p.weather.fetchedAt = 'ieri'; },
    p => { p.weather.level = 'sicuro'; },
    p => { p.trail.lines = [[[91, 12], [42, 12]]]; },
    p => { p.trail.lines = [[[42, '12'], [42, 12]]]; },
    p => { p.trail.lines = [[[42], [42, 12]]]; },
    p => { p.species[0].features = [false]; },
    p => { p.species[0].sources = [{ url: {} }]; },
  ]) {
    const input = original(); change(input);
    assert.throws(() => parseFieldPack(input));
  }
});
