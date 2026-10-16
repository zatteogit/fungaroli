import { seasonStatus } from './edible-catalog.js';

export const INTENTS = [
  { id: 'funghi', label: 'A funghi' },
  { id: 'piante', label: 'Piante spontanee' },
  { id: 'passeggiata', label: 'Passeggiata' },
];
export const validIntent = value => INTENTS.some(i => i.id === value) ? value : 'funghi';

// Only documented calendars can suspend a saved selection. Missing weather,
// missing models and low scores never establish that a season is over.
export function seasonalSelection(catalog, ids, dates) {
  if (!dates.length) return null;
  const selected = ids === null ? catalog : catalog.filter(s => ids.has(s.id));
  if (!selected.length || !selected.every(s => dates.every(d => seasonStatus(s, d) === 'out'))) return null;
  return { names: selected.map(s => s.name), clearSpecies: ids !== null,
    suspendIntent: catalog.length > 0 && catalog.every(s => dates.every(d => seasonStatus(s, d) === 'out')) };
}

export function matchesWalk(t, prefs) {
  // in_zone_km is the mapped portion, never the length of an entire outing.
  return (!prefs.easyTrails || t.difficulty === 'T') &&
    (!prefs.shortTrails || Number.isFinite(t.in_zone_km) && t.in_zone_km <= 5);
}

export function compareOutdoor(a, b, prefs) {
  // Lexicographic ordering; these are product preferences, no biological index.
  const weather = (a.weatherRank ?? 0) - (b.weatherRank ?? 0);
  if (weather) return -weather;
  if (prefs.target === 'piante' && a.botanicalRank !== b.botanicalRank) return b.botanicalRank - a.botanicalRank;
  if (prefs.avoidCrowd && a.crowd !== b.crowd) return (a.crowd ?? 1) - (b.crowd ?? 1);
  if (prefs.preferComfort && a.comfort !== b.comfort) return (b.comfort ?? -1) - (a.comfort ?? -1);
  if (prefs.distancePenalty && a.minutes !== b.minutes) return (a.minutes ?? Infinity) - (b.minutes ?? Infinity);
  return a.o - b.o || a.z.name.localeCompare(b.z.name, 'it');
}
