// Confronto di caratteri dichiarati dall'utente, non identificazione né probabilità.
export function matchTraits(taxon, answers, questions) {
  let ok = 0, tot = 0;
  const contra = [];
  for (const [key, value] of Object.entries(answers)) {
    if (value == null) continue;
    const q = questions.find((q) => q.key === key);
    if (!q) continue;
    const trait = q.get ? q.get(taxon) : taxon.traits?.[key];
    if (trait == null || (Array.isArray(trait) && !trait.length)) continue;
    tot++;
    const hit = q.match ? q.match([].concat(trait), value) : Array.isArray(trait) ? trait.includes(value) : trait === value;
    if (hit) ok++; else contra.push(key);
  }
  return { ok, tot, contra };
}

export function retainCandidate(taxon, match) {
  // Una risposta sbagliata su base, velo o anello non autorizza a escludere un mortale.
  if (taxon.toxicity === 'mortale') return true;
  return match.contra.length === 0 || (match.contra.length === 1 && match.ok >= 2);
}

// Il richiamo ai mortali non dipende dai filtri, dalla zona o da una ricerca testuale.
export const deadlyWarnings = (taxa) => taxa.filter((t) => t.toxicity === 'mortale');
