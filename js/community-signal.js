// Effetto prudente sulle priorità delle passeggiate, separato dall'indice biologico.
// Le quantità dichiarate dagli utenti non sono misure di produttività o probabilità.
export function communityMultiplier(records, maxPercent = 10) {
  if(!Number.isInteger(maxPercent)||maxPercent<0||maxPercent>10)return 1;
  // Il riepilogo pubblico della community non espone più i giorni (22/10/2026): la guardia dei 2 giorni diversi
  // la applica il server prima di pubblicare. Le altre fonti (segnali esterni, cruscotto) passano ancora days.
  const usable = records.filter((r) => r.establishedContributors >= 3 && (r.days === undefined || r.days >= 2));
  if (!usable.length) return 1;
  const signals = usable.map((r) => {
    const n = r.sightings + r.zeros;
    return n ? (maxPercent / 100) * ((r.sightings - r.zeros) / n) * Math.min(1, r.establishedContributors / 10) : 0;
  });
  // Aggiungere taxa non somma bonus; il segnale più informativo decide.
  return 1 + signals.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a, 0);
}
