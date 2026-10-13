// Effetto prudente sulle priorità delle passeggiate, separato dall'indice biologico.
// Le quantità dichiarate dagli utenti non sono misure di produttività o probabilità.
export function communityMultiplier(records) {
  const usable = records.filter((r) => r.establishedContributors >= 3 && r.days >= 2);
  if (!usable.length) return 1;
  const signals = usable.map((r) => {
    const n = r.sightings + r.zeros;
    return n ? 0.1 * ((r.sightings - r.zeros) / n) * Math.min(1, r.establishedContributors / 10) : 0;
  });
  // Aggiungere taxa non somma bonus; il segnale più informativo decide.
  return 1 + signals.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a, 0);
}
