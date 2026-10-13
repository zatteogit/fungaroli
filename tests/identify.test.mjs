import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchTraits, retainCandidate, deadlyWarnings } from '../js/identify-model.js';
const taxa = Object.values(JSON.parse(fs.readFileSync(new URL('../data/species-traits.json', import.meta.url))).taxa);
test('due risposte errate non eliminano Amanita phalloides', () => {
  const t = taxa.find((t) => t.latin === 'Amanita phalloides');
  const answers = { hymenophore: 'lamelle', hymenophore_color: 'bianco', cap_color: 'verde', stem_ring: false, stem_volva: false };
  const m = matchTraits(t, answers, Object.keys(answers).map((key) => ({ key })));
  assert.equal(m.contra.length, 2); assert.equal(retainCandidate(t, m), true);
  assert.ok(deadlyWarnings(taxa).includes(t));
});
test('nessuna checklist pubblica suggerisce assaggi per identificare', () => {
  const checklist = taxa.flatMap((t) => t.check_before_picking || []).join(' ');
  assert.doesNotMatch(checklist, /punta della lingua|frammento crudo|assaggio/i);
});
