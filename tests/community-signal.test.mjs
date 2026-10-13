import test from 'node:test';
import assert from 'node:assert/strict';
import { communityMultiplier } from '../js/community-signal.js';
test('nessun contributo e primi dati non attribuiscono un’accuratezza inventata', () => {
  assert.equal(communityMultiplier([]), 1);
  assert.equal(communityMultiplier([{ establishedContributors: 2, days: 2, sightings: 50, zeros: 0 }]), 1);
  assert.equal(communityMultiplier([{ establishedContributors: 3, days: 1, sightings: 50, zeros: 0 }]), 1);
});
test('segnalazioni e zeri hanno influenza limitata e non si sommano tra taxa', () => {
  const r = { establishedContributors: 10, days: 2, sightings: 20, zeros: 0 };
  assert.equal(communityMultiplier([r]), 1.1); assert.equal(communityMultiplier([r, r, r]), 1.1);
  assert.equal(communityMultiplier([{ ...r, sightings: 0, zeros: 20 }]), 0.9);
});
