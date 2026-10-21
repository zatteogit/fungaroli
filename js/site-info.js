// Informazioni sul luogo da leggere, fuori dall'indice biologico (decisione del proprietario, 16/10/2026):
// struttura del bosco, esposizione, ultimo disturbo visto da satellite, aree protette e zone dei piani.
// Dati: data/habitat-info.json (statico, fuori dal CMS, da tools/build_habitat_info.py), allineato per indice
// ai campioni di data/habitat.json. Nessuna di queste informazioni pesa sull'indice: servono a descrivere il
// bosco e a non proporre per la raccolta i punti dove il piano di un parco la esclude.
// Funzioni pure, senza DOM: tests/site-info.test.mjs.
import { PARAMS } from './model.js';
import { sampleFits } from './walks.js';

// ---- Allineamento con habitat.json ----
// habitat.json può arrivare dallo snapshot del CMS: i file statici valgono solo se descrivono gli stessi campioni.
// Stessa data di generazione, stesso numero di campioni e stesse somme di controllo delle coordinate
// (somma di round(lat·1e5) e di round(lon·1e5), come scrivono gli script in tools/). Vale anche per
// data/access-info.json, che ha la stessa intestazione. Una zona che non torna si ignora.
export function checkSums(samples) {
  let a = 0, b = 0;
  for (const s of samples || []) { a += Math.round(s[2] * 1e5); b += Math.round(s[3] * 1e5); }
  return [a, b];
}
export function alignedZones(info, habitatDoc) {
  const out = new Set();
  if (!info?.zones || !habitatDoc?.zones) return out;
  if (info.habitat?.generated !== habitatDoc.generated) return out;
  for (const [id, hz] of Object.entries(habitatDoc.zones)) {
    const iz = info.zones[id], s = hz?.samples;
    if (!iz || !Array.isArray(s) || !Array.isArray(iz.samples) || iz.n !== s.length || iz.samples.length !== s.length) continue;
    if (Array.isArray(iz.check)) { const [a, b] = checkSums(s); if (iz.check[0] !== a || iz.check[1] !== b) continue; }
    out.add(id);
  }
  return out;
}

// Indici dei campi per nome (il file li dichiara in «fields»): null se manca un campo atteso.
export const INFO_FIELDS = ['strutt', 'copertura', 'pendenza', 'esposizione', 'disturbo_anno', 'disturbo_causa', 'area', 'zona', 'lazio'];
export function fieldIndex(info, names = INFO_FIELDS) {
  const f = info?.fields;
  if (!Array.isArray(f)) return null;
  const idx = Object.fromEntries(names.map((n) => [n, f.indexOf(n)]));
  return Object.values(idx).every((k) => k >= 0) ? idx : null;
}

// Il file pronto per l'app: null se manca, è illeggibile o non descrive gli stessi campioni di habitat.json.
// In quel caso l'app non mostra informazioni sul bosco e non esclude punti: alla Laga resta l'avviso di zona.
export function prepareSiteInfo(info, habitatDoc) {
  const idx = fieldIndex(info);
  const zones = idx ? alignedZones(info, habitatDoc) : new Set();
  if (!zones.size) return null;
  return { info, idx, zones };
}

// Riga di un campione come oggetto, o null se la zona non è allineata.
export function infoRow(si, zid, i) {
  const r = si?.zones.has(zid) ? si.info.zones[zid].samples[i] : null;
  if (!r) return null;
  const x = si.idx;
  return { strutt: r[x.strutt], copertura: r[x.copertura], pendenza: r[x.pendenza], esposizione: r[x.esposizione],
    anno: r[x.disturbo_anno], causa: r[x.disturbo_causa], area: r[x.area], zona: r[x.zona], lazio: r[x.lazio] };
}

// ---- Esclusioni (regola scritta nel file: «esclusioni») ----
// Oggi una sola: Parco Nazionale del Gran Sasso e Monti della Laga, zone A e B. Il Piano esclude il prelievo
// (Normativa di attuazione, art. 7, c. 7 e art. 8, c. 7), salvi usi civici e diritti reali che l'app non conosce.
// Un campione escluso non si propone per la raccolta; resta nell'indice biologico.
export function exclusionOf(si, row) {
  if (!row?.area || !row.zona) return null;
  return (si?.info?.esclusioni || []).find((e) => e.area === row.area && (e.zone || []).includes(row.zona)) || null;
}
// (i) => regola o null, per i campioni di una zona. Senza file allineato non esclude nulla.
export function excludedFn(si, zid) {
  if (!si?.zones.has(zid)) return () => null;
  return (i) => exclusionOf(si, infoRow(si, zid, i));
}

// Quanti campioni adatti alla specie nella fascia sono in una zona esclusa (stesso criterio del punto d'accesso:
// affinità del bosco ≥ 0,6, quota della specie ±50 m, ±150 m dalla fascia). all = tutti esclusi.
export function bandReserve({ hab, sp, band, excluded = () => null, half = PARAMS.bandHalfWidth }) {
  if (!hab?.samples || !sp?.forest || sp.kind === 'plant') return null;
  let suitable = 0, out = 0, rule = null;
  hab.samples.forEach(([e, c], i) => {
    const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    if ((sp.forest[cat] || 0) < 0.6 || !Number.isFinite(e) || Math.abs(e - band) > half) return;
    if (sp.elev && (e < sp.elev[0] - 50 || e > sp.elev[1] + 50)) return;
    suitable++;
    const r = excluded(i);
    if (r) { out++; rule ||= r; }
  });
  return { suitable, excluded: out, all: suitable > 0 && out === suitable, rule };
}
// La frase decisa dal proprietario per la fascia tutta esclusa.
export const RESERVE_BAND_TEXT = 'In questa fascia il bosco adatto è in zona di riserva del Parco: la raccolta è esclusa.';

// ---- Informazioni sul bosco della fascia ----
export const ASPECT_WORD = { N: 'nord', NE: 'nord-est', E: 'est', SE: 'sud-est', S: 'sud', SO: 'sud-ovest', O: 'ovest', NO: 'nord-ovest' };
export const STRUCT_WORD = { 1: 'ceduo', 2: 'fustaia', 3: 'struttura composita' };
export const CAUSE_WORD = { 1: 'vento o insetti', 2: 'incendio', 3: 'taglio' };
const pct = (n, d) => `${Math.round((n / d) * 100)}%`;

// Riepilogo dei campioni di bosco della fascia (±150 m): prima quelli adatti alla specie (sampleFits, come i
// sentieri); se nessuno è adatto, tutto il bosco della fascia. Solo conteggi: nessun peso, nessuna soglia d'età.
export function bandForestInfo({ hab, si, zid, sp, band, half = PARAMS.bandHalfWidth }) {
  if (!hab?.samples || !si?.zones.has(zid) || !Number.isFinite(band)) return null;
  const forestIdx = [], fitIdx = [];
  hab.samples.forEach(([e, c], i) => {
    if (!(c >= 0) || !Number.isFinite(e) || Math.abs(e - band) > half) return;
    forestIdx.push(i);
    if (sp && sampleFits(sp, e, hab.sample_categories[c], band)) fitIdx.push(i);
  });
  const scope = fitIdx.length ? 'adatto' : 'fascia', idx = fitIdx.length ? fitIdx : forestIdx;
  if (!idx.length) return null;
  const struct = {}, aspects = {}, dist = {};
  let flat = 0, noStruct = 0, undisturbed = 0, notAssessed = 0;
  const areas = new Map();
  for (const i of idx) {
    const r = infoRow(si, zid, i);
    if (STRUCT_WORD[r.strutt]) struct[r.strutt] = (struct[r.strutt] || 0) + 1; else noStruct++;
    if (ASPECT_WORD[r.esposizione]) aspects[r.esposizione] = (aspects[r.esposizione] || 0) + 1; else flat++;
    if (r.anno == null) notAssessed++;
    else if (r.anno === 0) undisturbed++;
    else { const k = `${r.anno}|${r.causa ?? ''}`; dist[k] = (dist[k] || 0) + 1; }
    if (r.area) {
      if (!areas.has(r.area)) areas.set(r.area, { area: r.area, n: 0, zones: new Map() });
      const a = areas.get(r.area), k = r.zona ?? '';
      a.n++;
      if (!a.zones.has(k)) a.zones.set(k, { zona: r.zona ?? null, n: 0, excluded: !!exclusionOf(si, r) });
      a.zones.get(k).n++;
    }
  }
  return {
    scope, n: idx.length, band, noSpecies: !sp,
    struct: Object.entries(struct).map(([k, n]) => ({ k: +k, n })).sort((a, b) => b.n - a.n), noStruct,
    aspects: Object.entries(aspects).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n), flat,
    disturbances: Object.entries(dist).map(([k, n]) => { const [y, c] = k.split('|'); return { year: +y, cause: c === '' ? null : +c, n }; })
      .sort((a, b) => b.year - a.year || b.n - a.n),
    undisturbed, notAssessed,
    areas: [...areas.values()].map((a) => ({ ...a, zones: [...a.zones.values()].sort((x, y) => y.n - x.n) })).sort((a, b) => b.n - a.n),
  };
}

// «nel Parco nazionale Gran Sasso e Monti della Laga», «nella Riserva naturale Monte Navegna e Monte Cervia»
export function inArea(si, id) {
  const a = si?.info?.aree?.[id];
  if (!a) return `nell’area protetta ${id}`;
  const name = `${a.categoria ? `${a.categoria} ` : ''}${a.nome}`;
  return /^Riserva/i.test(name) ? `nella ${name}` : /^Area/i.test(name) ? `nell’${name.replace(/^A/, 'a')}` : `nel ${name}`;
}
const zoneDesc = (si, id, zona) => si?.info?.aree?.[id]?.zonazione?.zone?.[zona] || '';
const join = (xs) => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}` : xs[0] || '';

// Le frasi della fascia: struttura, esposizione, disturbi, aree protette. Testo semplice (l'app lo protegge).
const punti = (n) => `${n} ${n === 1 ? 'punto' : 'punti'}`;
// «taglio nel 2017 (2 punti), nel 2015 e nel 2012»; «incendio nel 2018, taglio nel 2016»: la causa non si ripete
// quando resta la stessa dell'anno prima nell'elenco.
function disturbanceList(list) {
  const parts = list.map((d, k) => {
    const cause = d.cause ? CAUSE_WORD[d.cause] : 'disturbo di causa non attribuita';
    const same = k > 0 && list[k - 1].cause === d.cause;
    return { same, text: `${same ? '' : `${cause} `}nel ${d.year}${d.n > 1 ? ` (${punti(d.n)})` : ''}` };
  });
  return parts.reduce((out, p, k) => !k ? p.text : `${out}${p.same && (k === parts.length - 1 || !parts[k + 1].same) ? ' e ' : ', '}${p.text}`, '');
}
export function bandForestLines(f, si) {
  if (!f) return [];
  const who = f.scope === 'adatto' ? 'il bosco adatto' : 'il bosco';
  const lines = [];
  lines.push({ k: 'campioni', text: f.scope === 'adatto' ? `Bosco adatto della fascia dei ${f.band} m: ${punti(f.n)} campione.`
    : f.noSpecies ? `Bosco della fascia dei ${f.band} m: ${punti(f.n)} campione.`
    : `Nessun punto adatto alla specie nella fascia dei ${f.band} m: i dati riguardano tutto il bosco della fascia (${punti(f.n)} campione).` });
  if (f.struct.length) {
    const parts = f.struct.map((s) => `${STRUCT_WORD[s.k]} ${pct(s.n, f.n)}`);
    if (f.noStruct) parts.push(`senza dato ${pct(f.noStruct, f.n)}`);
    lines.push({ k: 'struttura', text: `Struttura: ${parts.join(', ')} (Carta Forestale, rilievo 2005–2007).` });
  }
  if (f.aspects.length) {
    // «nella fascia dei 1300 m il bosco adatto è per il 40% su versanti esposti a nord, …»: i tre settori più frequenti
    const top = f.aspects.slice(0, 3).map((a, k) => `per il ${pct(a.n, f.n)} ${k ? 'a' : 'su versanti esposti a'} ${ASPECT_WORD[a.k]}`);
    lines.push({ k: 'esposizione', text: `Nella fascia dei ${f.band} m ${who} è ${join(top)}${f.flat ? `; in piano per il ${pct(f.flat, f.n)}` : ''}.` });
  }
  const ev = f.disturbances.reduce((a, d) => a + d.n, 0), assessed = f.n - f.notAssessed;
  if (ev) {
    // tutti gli anni, i più recenti per primi: nessuna soglia d'età (l'app non dice quando un bosco «torna buono»)
    const shown = disturbanceList(f.disturbances.slice(0, 3));
    const rest = f.disturbances.slice(3), years = rest.map((d) => d.year);
    const lo = Math.min(...years), hi = Math.max(...years), many = rest.reduce((a, d) => a + d.n, 0) > 1;
    const older = !rest.length ? '' : lo === hi ? `; ${many ? 'gli altri' : 'l’altro'} nel ${lo}` : `; gli altri tra il ${lo} e il ${hi}`;
    lines.push({ k: 'disturbo', text: f.disturbances.length === 1
      ? `Disturbo rilevato da satellite in ${punti(ev)} su ${f.n}: ${shown}, da verificare sul posto.`
      : `Disturbo rilevato da satellite in ${punti(ev)} su ${f.n}, da verificare sul posto. Più recenti: ${shown}${older}.` });
  } else if (assessed) {
    lines.push({ k: 'disturbo', text: `Nessun disturbo rilevato da satellite dal 1985 al 2024 ${assessed === 1 ? 'nell’unico punto valutato' : `nei ${punti(assessed)} valutati`}.` });
  }
  if (f.notAssessed) lines.push({ k: 'disturbo-nd', text: `${punti(f.notAssessed)} non ${f.notAssessed === 1 ? 'valutato' : 'valutati'}: il satellite non ${f.notAssessed === 1 ? 'lo classifica' : 'li classifica'} come bosco.` });
  for (const a of f.areas) {
    const zones = a.zones.filter((x) => x.zona).map((x) => { const d = zoneDesc(si, a.area, x.zona); return `zona ${x.zona}${d ? ` (${d})` : ''} ${punti(x.n)}`; });
    const none = a.zones.find((x) => !x.zona)?.n || 0;
    const plan = si?.info?.aree?.[a.area]?.zonazione;
    const tail = !zones.length ? (plan ? '' : ' (zone del piano non disponibili)') : `: ${zones.join(', ')}${none ? `, fuori dalle zone del piano ${punti(none)}` : ''}`;
    lines.push({ k: 'area', text: `${a.n === f.n ? `Tutti i ${punti(f.n)} sono` : `${punti(a.n)} su ${f.n} sono`} ${inArea(si, a.area)}${tail}.` });
    const excl = a.zones.filter((x) => x.excluded).map((x) => x.zona);
    if (excl.length) lines.push({ k: 'riserva', excluded: true, text: `In zona ${join(excl)} il Piano del Parco esclude la raccolta, salvi usi civici: questi punti non si propongono per la raccolta. La cartografia della Regione è indicativa.` });
  }
  return lines;
}

// Riepilogo della zona intera (sezione «La zona»): struttura del bosco e aree protette, con i punti fuori dal Lazio.
export function zoneSiteInfo({ hab, si, zid }) {
  if (!hab?.samples || !si?.zones.has(zid)) return null;
  const n = hab.samples.length, struct = {}, areas = new Map();
  let forest = 0;
  hab.samples.forEach(([, c], i) => {
    const r = infoRow(si, zid, i);
    if (c >= 0) { forest++; if (STRUCT_WORD[r.strutt]) struct[r.strutt] = (struct[r.strutt] || 0) + 1; }
    if (r.area) {
      if (!areas.has(r.area)) areas.set(r.area, { area: r.area, n: 0, zone: {} });
      const a = areas.get(r.area); a.n++;
      if (r.zona) a.zone[r.zona] = (a.zone[r.zona] || 0) + 1;
    }
  });
  return { n, forest, outside: si.info.zones[zid].fuori_lazio || 0,
    struct: Object.entries(struct).map(([k, m]) => ({ k: +k, n: m })).sort((a, b) => b.n - a.n),
    areas: [...areas.values()].sort((a, b) => b.n - a.n) };
}
export function zoneSiteLines(z, si) {
  if (!z) return [];
  const lines = [];
  if (z.struct.length && z.forest) lines.push({ k: 'struttura', text: `Bosco della zona: ${z.struct.map((s) => `${STRUCT_WORD[s.k]} ${pct(s.n, z.forest)}`).join(', ')} dei ${z.forest} punti di bosco (Carta Forestale, rilievo 2005–2007).` });
  for (const a of z.areas) {
    const zone = Object.entries(a.zone).sort((x, y) => x[0].localeCompare(y[0])).map(([k, m]) => `${k} ${m}`);
    lines.push({ k: 'area', text: `${a.n} punti campione su ${z.n} sono ${inArea(si, a.area)}${zone.length ? ` (zone del piano: ${zone.join(', ')})` : ''}.` });
  }
  if (z.outside) lines.push({ k: 'fuori', text: `${z.outside} punti campione sono fuori dal Lazio: carta forestale e aree protette della Regione non li coprono.` });
  return lines;
}

// Fonti delle informazioni sul bosco, in breve, con i link del file. Le licenze complete stanno in data/habitat-info.json.
export function siteSources(si) {
  const by = Object.fromEntries((si?.info?.sources || []).map((s) => [s.id, s]));
  const page = (s) => s.doi || (Array.isArray(s.scheda) ? s.scheda[0] : s.scheda) || (/^https:\/\/\S+$/.test(s.url || '') ? s.url : null);
  return [
    ['carta-forestale', 'Carta Forestale © Regione Lazio (bosco del 2005–2007)'],
    ['tinitaly', 'pendenza ed esposizione: TINITALY 1.1, INGV (CC BY 4.0)'],
    ['efda', 'disturbi: European Forest Disturbance Atlas v3.0 (CC BY 4.0), che vede meglio tagli a raso e incendi dei tagli parziali'],
    ['aree-protette', 'aree protette e zone dei piani © Regione Lazio, indicative: fa fede la cartografia dell’ente'],
  ].filter(([id]) => by[id]).map(([id, label]) => ({ id, label, url: page(by[id]) }));
}
