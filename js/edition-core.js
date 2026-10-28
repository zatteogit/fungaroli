// Edizioni di Fronda: un solo codice, configurazioni diverse (editions/*.json).
// Modulo puro, senza DOM: lo usano sia l'app sia il Worker. Vedi docs/ambienti-ed-edizioni.md.
export const PROVINCE_CODES = ['RI', 'RM', 'VT', 'LT', 'FR'];
export const EDITION_KINDS = ['generalista', 'dedicata', 'demo'];
export const ENVIRONMENTS = ['local', 'staging', 'production'];

// L'edizione generalista di oggi: usata quando /edition.json non risponde (file statici, copia di revisione).
export const DEFAULT_EDITION = Object.freeze({
  id: 'fronda', kind: 'generalista', name: 'Fronda',
  place: Object.freeze({ pre: 'pilota', label: 'Lazio', title: 'Pilota Lazio: zone selezionate nelle cinque province, con copertura parziale di accessi e sentieri', srText: 'versione pilota, che cosa copre' }),
  zones: Object.freeze({ provinces: null, ids: null }), demo: null, environment: 'production',
});

const text = (v, max) => typeof v === 'string' && v.trim() !== '' && v.length <= max;

// Restituisce gli errori di un'edizione; `zoneIds` (facoltativo) controlla che le zone citate esistano.
export function editionErrors(e, zoneIds = null) {
  const err = [];
  if (!e || typeof e !== 'object') return ['Edizione mancante.'];
  if (!/^[a-z0-9-]{2,40}$/.test(e.id || '')) err.push('id non valido.');
  if (!EDITION_KINDS.includes(e.kind)) err.push(`kind deve essere uno fra ${EDITION_KINDS.join(', ')}.`);
  if (!text(e.name, 40)) err.push('name non valido.');
  const p = e.place;
  if (!p || !text(p.pre, 20) || !text(p.label, 30) || !text(p.title, 160) || !text(p.srText, 80)) err.push('place incompleto (pre, label, title, srText).');
  const z = e.zones;
  if (!z || typeof z !== 'object') err.push('zones mancante.');
  else {
    if (z.provinces !== null && (!Array.isArray(z.provinces) || !z.provinces.length || z.provinces.some(c => !PROVINCE_CODES.includes(c)))) err.push('zones.provinces deve essere null o un elenco di sigle del Lazio.');
    if (z.ids !== null && (!Array.isArray(z.ids) || !z.ids.length || z.ids.some(id => typeof id !== 'string'))) err.push('zones.ids deve essere null o un elenco di id.');
    if (zoneIds && Array.isArray(z.ids)) for (const id of z.ids) if (!zoneIds.has(id)) err.push(`zona sconosciuta: ${id}.`);
  }
  if (e.kind === 'demo' && (!e.demo || !text(e.demo.partner, 80))) err.push('una demo richiede demo.partner.');
  if (e.kind !== 'demo' && e.demo != null) err.push('demo vale solo per kind "demo".');
  return err;
}

// Zone dell'edizione: con provinces e ids entrambi null restano tutte (generalista).
export function editionZones(edition, zones) {
  const z = edition?.zones;
  if (!z || (z.provinces == null && z.ids == null)) return zones;
  const prov = z.provinces ? new Set(z.provinces) : null, ids = z.ids ? new Set(z.ids) : null;
  return zones.filter(zone => (!prov || (zone.province || ['RI']).some(c => prov.has(c))) && (!ids || ids.has(zone.id)));
}

export function normalizeEnvironment(value) {
  return ENVIRONMENTS.includes(value) ? value : 'production';
}
