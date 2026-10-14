import { SPECIES } from './species.js';

const EDIBLE = new Set(['commestibile', 'commestibile con cautela']);
export const normalizeSpeciesText = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const validMonths = (months) => Array.isArray(months) && months.length && months.every((m) => Number.isInteger(m) && m >= 1 && m <= 12) ? [...new Set(months)] : null;

export function buildEdibleCatalog(traits, extra, identification) {
  const taxa = traits?.taxa || {}, models = new Map(SPECIES.map((s) => [s.id, s]));
  const records = new Map();
  for (const sp of SPECIES) {
    const t = taxa[sp.id];
    if (t && !EDIBLE.has(t.toxicity)) continue;
    records.set(sp.id, { id: sp.id, name: t?.name || sp.name, latin: t?.latin || sp.latin, modelId: sp.id, group: sp.group,
      toxicity: t?.toxicity || 'commestibile', months: validMonths(t?.traits?.season) || sp.months.flatMap((w, i) => w > 0 ? [i + 1] : []),
      aliases: [t?.name || '', ...(identification?.species?.[sp.id]?.aka || [])], caution: t?.caution || sp.warning || '', sources: t?.sources || [], href: '#/specie/' + sp.id });
  }
  // una scheda breve del catalogo diventata taxon completo tiene sinonimi, ambiente e fonti del catalogo
  const short = new Map((extra?.species || []).map((s) => [s.id, s]));
  for (const [id, t] of Object.entries(taxa)) {
    if (!EDIBLE.has(t.toxicity) || records.has(id)) continue;
    const e = short.get(id);
    const sources = [...(t.sources || []), ...(e?.sources || []).filter((x) => !(t.sources || []).some((y) => y.url === x.url))];
    records.set(id, { id, name: t.name || e?.name || t.latin, latin: t.latin, modelId: models.has(id) ? id : null,
      toxicity: t.toxicity, months: validMonths(t.traits?.season) || validMonths(e?.months), aliases: e?.aliases || [], habitat: e?.habitat,
      caution: t.caution || e?.caution || '', sources, href: (e ? '#/commestibile/' : '#/fungo/') + id }); // indirizzo invariato per le schede del catalogo
  }
  for (const s of extra?.species || []) {
    if (!EDIBLE.has(s.toxicity) || records.has(s.id) || !/^[a-z0-9-]+$/.test(s.id)) continue;
    records.set(s.id, { ...s, months: validMonths(s.months), modelId: null, href: '#/commestibile/' + s.id });
  }
  return [...records.values()];
}

export function seasonStatus(species, date) {
  const month = Number(String(date).slice(5, 7));
  if (!species?.months?.length || !Number.isInteger(month) || month < 1 || month > 12) return 'unknown';
  return species.months.includes(month) ? 'in' : 'out';
}
export const seasonLabel = (s, date) => ({ in: 'In stagione', out: 'Fuori stagione', unknown: 'Stagione n.d.' })[seasonStatus(s, date)];

export function searchEdibleCatalog(catalog, query, { date, limit = 12 } = {}) {
  const q = normalizeSpeciesText(query);
  if (!q) return [];
  const words = q.split(' ');
  return catalog.filter((s) => {
    const text = normalizeSpeciesText([s.name, s.latin, ...(s.aliases || [])].join(' '));
    return words.every((w) => text.includes(w));
  }).sort((a, b) => {
    const rank = (s) => (normalizeSpeciesText(s.name).startsWith(q) ? 4 : 0) + (seasonStatus(s, date) === 'in' ? 1 : 0);
    return rank(b) - rank(a) || a.name.localeCompare(b.name, 'it');
  }).slice(0, limit);
}
