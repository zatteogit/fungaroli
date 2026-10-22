// Aggregato più largo della community (decisione di Matteo, 22/10/2026): provincia e 7 giorni, con la stessa
// guardia dei gruppi per zona (3 contributori distinti, 2 giorni diversi). È soppressione dei piccoli gruppi,
// non una soglia scientifica né una garanzia di anonimato.
// Protezione per sottrazione: un gruppo di provincia si pubblica solo se anche la parte che non è già
// pubblicata per zona supera la guardia. Altrimenti «provincia meno zone mostrate» rivelerebbe un gruppo piccolo.
export const MIN_CONTRIBUTORS = 3, MIN_DAYS = 2;
export const PROVINCES = { RI: 'Rieti', RM: 'Roma', VT: 'Viterbo', LT: 'Latina', FR: 'Frosinone' };

// Stessa regola dell'app: una zona senza provincia nei dati è del Reatino.
export const zoneProvince = (zone) => (Array.isArray(zone?.province) && zone.province[0]) || 'RI';

const passes = (rows) => new Set(rows.map((r) => r.accountId)).size >= MIN_CONTRIBUTORS && new Set(rows.map((r) => r.day)).size >= MIN_DAYS;

// rows: {zoneId, accountId, day, outcome:'sighting'|'zero'|'other', ...chiave}; keyOf: riga -> chiave del taxon;
// published: chiavi `${zoneId}|${chiave}` dei gruppi per zona già pubblicati; fields: riga -> campi del taxon in uscita.
// In uscita solo provincia, taxon e totali: nessun account, giorno, zona o conteggio di persone.
export function provinceGroups(rows, { zones, keyOf, fields, published = new Set() }) {
  const province = new Map(zones.map((z) => [z.id, zoneProvince(z)]));
  const groups = new Map();
  for (const r of rows) {
    const p = r.zoneId && province.get(r.zoneId);
    if (!p) continue;
    const key = `${p}|${keyOf(r)}`;
    if (!groups.has(key)) groups.set(key, { province: p, ...fields(r), rows: [] });
    groups.get(key).rows.push(r);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([, { rows: all, ...g }]) => {
    const rest = all.filter((r) => !published.has(`${r.zoneId}|${keyOf(r)}`));
    if (!passes(all) || !passes(rest)) return [];
    return [{ ...g, reports: all.length, sightings: all.filter((r) => r.outcome === 'sighting').length, zeros: all.filter((r) => r.outcome === 'zero').length }];
  });
}
