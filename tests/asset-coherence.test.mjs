import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coherence } from '../tools/asset-requirements.mjs';

// Principio (AGENTS.md): le immagini si disegnano dai dati. Ogni voce degli indici delle immagini
// (soggetto, tessera, variante, fase, chiave/valore degli alberi, stagione/meteo dei luoghi) deve
// corrispondere a un valore che esiste nei dati.
test('ogni immagine e ogni voce degli indici corrisponde a un valore dei dati', () => {
  assert.deepEqual(coherence(), []);
});
