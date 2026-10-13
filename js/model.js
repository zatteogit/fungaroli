// Modello di idoneita' alla fruttificazione (0-100) per specie, zona, quota e giorno.
// Funzioni pure: nessuna dipendenza dal DOM, testabili con `node --test`.

export const MODEL_VERSION = '2.0.0'; // indice sperimentale; nessuna calibrazione locale
export const PARAMS = {
  r30Days: 30,          // finestra pioggia cumulata (Salerni et al. 2002: correlazione piu' forte a 30 gg)
  tDays: 20,            // finestra T media (preprint 2025: ~13 °C media dei 20 gg precedenti per B. edulis)
  triggerMm: 8,         // un evento singolo >= 8 mm nella finestra di latenza conta come "innesco"
  moistDry: 0.10,       // m³/m³ suolo 3-9 cm: sotto = secco
  moistWet: 0.26,       // sopra = pienamente umido
  frostC: -1,           // T minima che blocca/danneggia i carpofori
  heatC: 30,            // T massima che secca lettiera e carpofori
  shockDropC: 4,        // calo della T media (3 gg vs 3 gg) che conta come shock termico
  bandHalfWidth: 150,   // metri attorno alla quota della fascia per leggere la composizione forestale
};

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sum = (arr, from, to) => { let s = 0; for (let i = from; i <= to; i++) if (Number.isFinite(arr?.[i])) s += arr[i]; return s; };
const mean = (arr, from, to) => {
  let s = 0, n = 0;
  for (let i = from; i <= to; i++) if (Number.isFinite(arr?.[i])) { s += arr[i]; n++; }
  return n ? s / n : null;
};

// Peso stagionale interpolato sul giorno dell'anno (12 valori mensili centrati al 15).
export function seasonWeight(months, dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const m = d.getUTCMonth(), y = d.getUTCFullYear();
  const center = Date.UTC(y, m, 15, 12);
  const next = d.getTime() >= center;
  const other = Date.UTC(y, m + (next ? 1 : -1), 15, 12);
  const j = (m + (next ? 1 : 11)) % 12;
  const t = Math.abs((d.getTime() - center) / (other - center));
  return months[m] * (1 - t) + months[j] * t;
}

// Composizione forestale (frazioni) dei campioni entro ±bandHalfWidth dalla quota.
export function habitatAtBand(hab, band, half = PARAMS.bandHalfWidth) {
  const counts = {};
  let n = 0;
  for (const [e, c] of hab?.samples || []) {
    if (!Number.isFinite(e)) continue;
    if (Math.abs(e - band) > half) continue;
    const name = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    if (!name) continue;
    counts[name] = (counts[name] || 0) + 1;
    n++;
  }
  const frac = {};
  for (const k in counts) frac[k] = counts[k] / n;
  return { frac, n };
}

export function habitatScore(species, frac) {
  let h = 0;
  for (const k in frac) h += frac[k] * (species.forest[k] || 0);
  // il 45% di bosco pienamente idoneo nella fascia basta per un habitat "pieno"
  return { value: clamp(h / 0.45), suitableShare: h };
}

export function elevationFit(species, band) {
  const [lo, hi] = species.elev;
  if (band >= lo && band <= hi) return 1;
  const d = band < lo ? lo - band : band - hi;
  return clamp(1 - d / 200);
}

// Fattori meteo per il giorno i della serie (indici precedenti = passato).
export function weatherFactors(species, s, i) {
  const [lagMin, lagMax] = species.lag;
  const a = Math.max(0, i - lagMax), b = Math.max(0, i - lagMin);
  const effRain = sum(s.p, a, b);
  let maxEvent = 0;
  for (let k = a; k <= b; k++) maxEvent = Math.max(maxEvent, s.p?.[k] ?? 0);
  const r30 = sum(s.p, Math.max(0, i - PARAMS.r30Days), i - 1);

  let rain = 0.6 * (1 - Math.exp(-effRain / species.eref)) + 0.4 * (1 - Math.exp(-r30 / (2 * species.eref)));
  // senza un evento d'innesco la pioggia diffusa vale meta' (transizione graduale)
  const trig = Math.max(clamp(maxEvent / PARAMS.triggerMm), clamp(effRain / 15));
  const triggered = trig >= 1;
  rain *= 0.5 + 0.5 * trig;

  const t20 = mean(s.tmean, Math.max(0, i - PARAMS.tDays), i - 1);
  const temp = t20 == null ? 0 : Math.exp(-0.5 * ((t20 - species.topt) / species.tsd) ** 2);

  const sm = mean(s.soilm, Math.max(0, i - 3), i - 1);
  const moist = sm == null ? null : Math.max(0.15, clamp((sm - PARAMS.moistDry) / (PARAMS.moistWet - PARAMS.moistDry)) ** 0.6);

  let frost = 1;
  let minT = Infinity;
  for (let k = Math.max(0, i - 4); k <= i; k++) minT = Math.min(minT, s.tmin?.[k] ?? Infinity);
  if (minT < PARAMS.frostC) frost = species.frostTolerant ? 0.7 : 0.35;

  let heat = 1;
  let maxT = -Infinity;
  for (let k = Math.max(0, i - 3); k <= i - 1; k++) maxT = Math.max(maxT, s.tmax?.[k] ?? -Infinity);
  if (maxT > PARAMS.heatC) heat = 0.65;

  // shock termico: calo di T media tra 4 e 14 giorni prima (euristica da pratica micologica)
  let drop = 0;
  for (let j = Math.max(3, i - 14); j <= i - 4; j++) {
    const before = mean(s.tmean, j - 3, j - 1), after = mean(s.tmean, j + 1, j + 3);
    if (before != null && after != null) drop = Math.max(drop, before - after);
  }
  const shock = drop >= PARAMS.shockDropC ? 1 + 0.075 * (species.shockWeight ?? 2) : 1;

  return { effRain, maxEvent, r30, triggered, rain, t20, temp, sm, moist, minT, frost, maxT, heat, drop, shock };
}

// Completezza degli input, distinta dall'accuratezza (non misurata) del modello.
// Il giorno di acquisizione contiene ancora previsioni: non va chiamato osservato.
export function inputQuality(species, s, i) {
  const windows = [
    ['p', 'pioggia', i - Math.max(PARAMS.r30Days, species.lag[1]), i - 1],
    ['tmean', 'temperatura media', i - PARAMS.tDays, i - 1],
    ['soilm', 'umidità del suolo', i - 3, i - 1],
    ['tmin', 'temperature minime', i - 4, i],
    ['tmax', 'temperature massime', i - 3, i - 1],
  ];
  const missing = [], futureDays = new Set();
  const issuedIndex = Number.isInteger(s.issuedIndex) ? s.issuedIndex : s.todayIndex;
  for (const [key, label, from, to] of windows) {
    let n = 0;
    for (let k = from; k <= to; k++) {
      if (Number.isFinite(s[key]?.[k]) && (key !== 'p' || s[key][k] >= 0)) n++;
      if (issuedIndex >= 0 && k >= issuedIndex) futureDays.add(k);
    }
    if (n !== to - from + 1) missing.push(label);
  }
  if (!s.dates?.[i]) missing.push('data');
  return { complete: missing.length === 0, missing, usesForecast: futureDays.size > 0,
    forecastDays: futureDays.size, fetchedAt: s.source?.fetchedAt || null, validation: 'non validato localmente' };
}

export function scoreSpecies(species, s, i, hab, band) {
  const season = seasonWeight(species.months, s.dates[i]);
  const { frac, n } = habitatAtBand(hab, band);
  const habitat = habitatScore(species, frac);
  const elev = elevationFit(species, band);
  const w = weatherFactors(species, s, i);
  const quality = inputQuality(species, s, i);
  if (!n) { quality.complete = false; quality.missing.push('campioni di habitat'); }
  if (s.source?.expired && i >= s.todayIndex) { quality.complete = false; quality.missing.push('meteo aggiornato'); }
  const raw = season * habitat.value * elev * w.rain * w.temp * w.moist * w.frost * w.heat * w.shock;
  return {
    score: quality.complete ? Math.round(clamp(raw) * 100) : null,
    season, habitat: habitat.value, suitableShare: habitat.suitableShare, elev,
    quality, habitatSamples: n, modelVersion: MODEL_VERSION,
    ...w,
  };
}

// Miglior combinazione quota x specie per una zona in un giorno.
export function scoreZoneDay(zone, hab, seriesByBand, speciesList, i) {
  let best = null;
  const perSpecies = [];
  for (const sp of speciesList) {
    let spBest = null;
    zone.bands.forEach((band, bi) => {
      const s = seriesByBand[bi];
      if (!s) return;
      const r = scoreSpecies(sp, s, i, hab, band);
      if (!spBest || (r.score ?? -1) > (spBest.score ?? -1)) spBest = { ...r, band, species: sp };
    });
    if (spBest) perSpecies.push(spBest);
    if (spBest && Number.isFinite(spBest.score) && (!best || spBest.score > best.score)) best = spBest;
  }
  perSpecies.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return { best, perSpecies };
}

// La zona mostra il migliore indice calcolabile: aggiungere specie o duplicare un
// taxon non aumenta il numero. Non rappresenta una probabilità di unione di eventi.
export function combine(scores) {
  const a = scores.filter(Number.isFinite);
  return a.length ? Math.round(clamp(Math.max(...a) / 100) * 100) : null;
}

export const CLASSES = [
  { min: 75, label: 'Condizioni molto favorevoli', shortLabel: 'Molto buone' },
  { min: 60, label: 'Condizioni favorevoli', shortLabel: 'Buone' },
  { min: 45, label: 'Condizioni discrete', shortLabel: 'Discrete' },
  { min: 30, label: 'Condizioni limitate', shortLabel: 'Limitate' },
  { min: 15, label: 'Condizioni poco favorevoli', shortLabel: 'Scarse' },
  { min: 0, label: 'Condizioni sfavorevoli', shortLabel: 'Sfavorevoli' },
];
export const classOf = (score) => Number.isFinite(score) ? CLASSES.findIndex((c) => score >= c.min) : -1;
export const scoreLabel = (score) => CLASSES[classOf(score)]?.label || 'Non calcolabile';
export const scoreShortLabel = (score) => CLASSES[classOf(score)]?.shortLabel || 'N.d.';
// Scala interna 0–100 per preservare i dati; presentazione pubblica 0–10.
export const formatIndex = (score) => Number.isFinite(score) ? (score / 10).toFixed(1).replace('.', ',') : '–';

// Spiegazione leggibile dei fattori principali.
export function explain(r) {
  const out = [];
  out.push(`${Math.round(r.effRain)} mm nella finestra di latenza${r.triggered ? '' : ' (nessun evento ≥ 8 mm)'}`);
  out.push(`${Math.round(r.r30)} mm negli ultimi 30 gg`);
  if (r.t20 != null) out.push(`T media 20 gg ${r.t20.toFixed(1)} °C`);
  if (r.sm != null) out.push(`suolo ${r.moist >= 0.8 ? 'umido' : r.moist >= 0.5 ? 'discreto' : 'secco'} (${r.sm.toFixed(2)} m³/m³)`);
  if (r.frost < 1) out.push(`gelate recenti (min ${r.minT.toFixed(1)} °C)`);
  if (r.heat < 1) out.push(`caldo eccessivo (max ${r.maxT.toFixed(1)} °C)`);
  if (r.shock > 1) out.push(`shock termico (−${r.drop.toFixed(1)} °C)`);
  return out;
}

// Idoneita' dell'habitat di una zona per una specie (indipendente dal meteo).
// Quota della zona coperta da bosco adatto alla quota giusta, dai punti campione della Carta Forestale.
// Non e' una probabilita' di presenza misurata: dice quanto ambiente adatto c'e'.
export function habitatPotential(species, hab, areaHa) {
  let sum = 0, n = 0, lo = Infinity, hi = -Infinity;
  for (const smp of hab.samples) {
    const [e, c] = smp;
    n++;
    const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    const v = (species.forest[cat] || 0) * elevationFit(species, e);
    if (v >= 0.5) { lo = Math.min(lo, e); hi = Math.max(hi, e); }
    sum += v;
  }
  const share = n ? sum / n : 0;           // frazione dell'area "pienamente" adatta
  const score = 1 - Math.exp(-share / 0.25); // 25% dell'area pienamente adatta -> 0,63
  const level = score >= 0.6 ? 'alta' : score >= 0.35 ? 'media' : score >= 0.1 ? 'bassa' : 'scarsa';
  return { share, score, level, ha: areaHa ? Math.round(share * areaHa) : null, elevRange: lo <= hi ? [lo, hi] : null };
}
