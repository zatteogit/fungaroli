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
test('riepilogo pubblico senza giorni (22/10/2026): la guardia dei 2 giorni è già del server, il peso resta lo stesso', () => {
  const published = { establishedContributors: 10, sightings: 20, zeros: 0 };
  assert.equal(communityMultiplier([published]), 1.1);
  assert.equal(communityMultiplier([{ ...published, establishedContributors: 2 }]), 1);
  assert.equal(communityMultiplier([{ ...published, days: 1 }]), 1, 'chi passa ancora i giorni li vede controllati');
});
