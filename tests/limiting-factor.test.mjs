import test from 'node:test';
import assert from 'node:assert/strict';
import {limitingReason} from '../js/limiting-factor.js';

const full = {season:1,elev:1,habitat:1,rain:1,temp:1,moist:1,frost:1,heat:1,shock:1};

test('il motivo è il fattore che riduce di più l’indice', () => {
  assert.equal(limitingReason({...full, season:0.1, rain:0.5}), 'fuori periodo tipico');
  assert.equal(limitingReason({...full, season:0.6, rain:0.7}), 'ai margini del periodo');
  assert.equal(limitingReason({...full, elev:0.2, season:0.5}), 'quota fuori dall’intervallo della specie');
  assert.equal(limitingReason({...full, moist:0.4}), 'terreno asciutto');
});

test('a parità vince la stagione; il bonus del suolo non è mai un motivo', () => {
  assert.equal(limitingReason({...full, season:0.5, rain:0.5}), 'ai margini del periodo');
  assert.equal(limitingReason({...full, shock:0.2}), '');
});

test('senza fattori o senza riduzioni nessun motivo', () => {
  assert.equal(limitingReason(null), '');
  assert.equal(limitingReason({score:30}), '');
  assert.equal(limitingReason(full), '');
});
