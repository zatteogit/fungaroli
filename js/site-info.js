// Informazioni sul luogo da leggere, fuori dall'indice biologico (decisione del proprietario, 16/10/2026):
// struttura del bosco, esposizione, ultimo disturbo visto da satellite, aree protette e zone dei piani.
// Dati: data/habitat-info.json (statico, fuori dal CMS, da tools/build_habitat_info.py), allineato per indice
// ai campioni di data/habitat.json. Nessuna di queste informazioni pesa sull'indice: servono a descrivere il
// bosco, a non proporre per la raccolta i punti dove il piano di un parco la esclude e ad avvisare dove la raccolta
// dipende dal regolamento dell'ente.
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
// In quel caso l'app non mostra informazioni sul bosco, non esclude punti e non avvisa: alla Laga resta l'avviso di zona.
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

// ---- Esclusioni e avvisi (regole scritte nel file: «esclusioni» e «avvisi», da tools/build_habitat_info.py) ----
// Ogni regola: area, zone del piano, effetto, motivo, fonti, certezza, eccezioni. Esclusioni (decisioni del 16 e del
// 21/10/2026): zone A e B del Gran Sasso-Laga e del Parco d'Abruzzo (versante laziale), R1, R2 e R4 dei Simbruini,
// A e A1 dei Lucretili. Un campione escluso non si propone per la raccolta; resta nell'indice biologico.
// Avvisi (21/10/2026): zone B e B1 dei Lucretili, B1 e B2 di Veio. Il campione resta proponibile, la scheda avvisa
// di verificare il regolamento dell'ente. Salvi in ogni caso usi civici e diritti reali, che l'app non conosce.
const ruleOf = (list, row) => (!row?.area || !row.zona ? null
  : (list || []).find((e) => e.area === row.area && (e.zone || []).includes(row.zona)) || null);
export const exclusionOf = (si, row) => ruleOf(si?.info?.esclusioni, row);
export const warningOf = (si, row) => ruleOf(si?.info?.avvisi, row);
// (i) => regola o null, per i campioni di una zona. Senza file allineato non esclude e non avvisa.
const rowFn = (of) => (si, zid) => (!si?.zones.has(zid) ? () => null : (i) => of(si, infoRow(si, zid, i)));
export const excludedFn = rowFn(exclusionOf);
export const warnedFn = rowFn(warningOf);

// Quanti campioni adatti alla specie nella fascia sono in una zona esclusa o con avviso (stesso criterio del punto
// d'accesso: affinità del bosco ≥ 0,6, quota della specie ±50 m, ±150 m dalla fascia). all = tutti esclusi.
// at: indice del punto proposto (chooseAccess); point = regola d'avviso del suo campione, anche fuori fascia.
export function bandReserve({ hab, sp, band, excluded = () => null, warned = () => null, at = null, half = PARAMS.bandHalfWidth }) {
  if (!hab?.samples || !sp?.forest || sp.kind === 'plant') return null;
  let suitable = 0, out = 0, warn = 0, rule = null, warning = null;
  hab.samples.forEach(([e, c], i) => {
    const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    if ((sp.forest[cat] || 0) < 0.6 || !Number.isFinite(e) || Math.abs(e - band) > half) return;
    if (sp.elev && (e < sp.elev[0] - 50 || e > sp.elev[1] + 50)) return;
    suitable++;
    const r = excluded(i);
    if (r) { out++; rule ||= r; return; }
    const w = warned(i);
    if (w) { warn++; warning ||= w; }
  });
  const point = Number.isInteger(at) ? warned(at) || null : null;
  return { suitable, excluded: out, warned: warn, all: suitable > 0 && out === suitable, rule, warning, point };
}
// La frase decisa dal proprietario per la fascia tutta esclusa (vale per tutte le esclusioni).
export const RESERVE_BAND_TEXT = 'In questa fascia il bosco adatto è in zona di riserva del Parco: la raccolta è esclusa.';
// L'avviso deciso dal proprietario (21/10/2026) per le zone di riserva senza esclusione.
export const WARNING_TEXT = 'Zona di riserva del Parco: verifica il regolamento dell’ente prima di raccogliere.';
// Frase d'apertura per la scheda e il punto della mappa: fascia tutta esclusa e/o punto proposto in zona con avviso.
// after si aggiunge solo se c'è una frase (per esempio uno spazio prima del testo che segue).
export function reserveLead(r, after = '') {
  const t = [r?.all && RESERVE_BAND_TEXT, r?.point && WARNING_TEXT].filter(Boolean).join(' ');
  return t ? t + after : '';
}
// Riga della riserva sotto l'accesso, oltre alla frase della fascia tutta esclusa: quanti punti esclusi o con avviso.
export function reserveAccessText(r) {
  if (!r) return '';
  const parts = [];
  if (r.excluded && !r.all) parts.push(`${r.excluded} punti su ${r.suitable} del bosco adatto della fascia sono in zona di riserva del Parco: il Piano esclude la raccolta, quindi non si propongono.`);
  // con punti esclusi nella stessa frase: «Altri 27 sono…», senza ripetere il totale
  const who = r.excluded && !r.all ? `${r.warned === 1 ? 'Un altro' : `Altri ${r.warned}`}`
    : r.warned === r.suitable ? `Tutti i ${r.suitable} punti del bosco adatto della fascia`
    : `${r.warned} ${r.warned === 1 ? 'punto' : 'punti'} su ${r.suitable} del bosco adatto della fascia`;
  if (r.warned) parts.push(`${who} ${r.warned === 1 ? 'è' : 'sono'} in zona di riserva del Parco dove la raccolta dipende dal regolamento dell’ente: verificalo prima di raccogliere.`);
  if (r.point && !r.warned) parts.push(`Il punto proposto è in zona di riserva del Parco: verifica il regolamento dell’ente prima di raccogliere.`);
  return parts.join(' ');
}
// Legenda della mappa: le zone escluse e quelle con avviso, dal file. Senza file resta la frase sul Gran Sasso-Laga.
export function reserveLegendText(si) {
  const name = (r) => si?.info?.aree?.[r.area]?.nome || r.area;
  // i nomi hanno virgole («Abruzzo, Lazio e Molise»): le aree si separano con il punto e virgola
  const list = (rules) => rules.map((r) => `${name(r)}, zone ${join(r.zone)}`).join('; ');
  const ex = si?.info?.esclusioni || [], wa = si?.info?.avvisi || [];
  if (!ex.length) return 'Nel Gran Sasso-Laga il Piano del Parco esclude in zona A e B il prelievo di funghi e piante, salvi usi civici: l’app non propone lì punti per la raccolta.';
  return `Il piano dell’area protetta esclude la raccolta, salvi usi civici, in queste zone di riserva (l’app non propone lì punti per la raccolta): ${list(ex)}.`
    + (wa.length ? ` Qui la raccolta dipende dal regolamento dell’ente, da verificare: ${list(wa)}.` : '');
}

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
      if (!a.zones.has(k)) a.zones.set(k, { zona: r.zona ?? null, n: 0, excluded: !!exclusionOf(si, r), warned: !!warningOf(si, r) });
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
    const warn = a.zones.filter((x) => x.warned).map((x) => x.zona);
    if (warn.length) lines.push({ k: 'avviso', warned: true, text: `In zona ${join(warn)}, di riserva del Parco, le regole sulla raccolta rinviano a un regolamento dell’ente: verificalo prima di raccogliere. La cartografia della Regione è indicativa.` });
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
