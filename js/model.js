// Modello di idoneita' alla fruttificazione (0-100) per specie, zona, quota e giorno.
// Funzioni pure: nessuna dipendenza dal DOM, testabili con `node --test`.

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
const sum = (arr, from, to) => { let s = 0; for (let i = from; i <= to; i++) s += arr[i] ?? 0; return s; };
const mean = (arr, from, to) => {
  let s = 0, n = 0;
  for (let i = from; i <= to; i++) if (arr[i] != null && !Number.isNaN(arr[i])) { s += arr[i]; n++; }
  return n ? s / n : null;
};

// Peso stagionale interpolato sul giorno dell'anno (12 valori mensili centrati al 15).
export function seasonWeight(months, dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const m = d.getMonth();
  const frac = (d.getDate() - 15) / 30;
  const j = frac >= 0 ? (m + 1) % 12 : (m + 11) % 12;
  const t = Math.abs(frac);
  return months[m] * (1 - t) + months[j] * t;
}

// Composizione forestale (frazioni) dei campioni entro ±bandHalfWidth dalla quota.
export function habitatAtBand(hab, band, half = PARAMS.bandHalfWidth) {
  const counts = {};
  let n = 0;
  for (const [e, c] of hab.samples) {
    if (Math.abs(e - band) > half) continue;
    const name = c >= 0 ? hab.sample_categories[c] : 'non bosco';
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
  for (let k = a; k <= b; k++) maxEvent = Math.max(maxEvent, s.p[k] ?? 0);
  const r30 = sum(s.p, Math.max(0, i - PARAMS.r30Days), i - 1);

  let rain = 0.6 * (1 - Math.exp(-effRain / species.eref)) + 0.4 * (1 - Math.exp(-r30 / (2 * species.eref)));
  // senza un evento d'innesco la pioggia diffusa vale meta' (transizione graduale)
  const trig = Math.max(clamp(maxEvent / PARAMS.triggerMm), clamp(effRain / 15));
  const triggered = trig >= 1;
  rain *= 0.5 + 0.5 * trig;

  const t20 = mean(s.tmean, Math.max(0, i - PARAMS.tDays), i - 1);
  const temp = t20 == null ? 0 : Math.exp(-0.5 * ((t20 - species.topt) / species.tsd) ** 2);

  const sm = mean(s.soilm, Math.max(0, i - 3), i - 1);
  const moist = sm == null ? 0.5 : Math.max(0.15, clamp((sm - PARAMS.moistDry) / (PARAMS.moistWet - PARAMS.moistDry)) ** 0.6);

  let frost = 1;
  let minT = Infinity;
  for (let k = Math.max(0, i - 4); k <= i; k++) minT = Math.min(minT, s.tmin[k] ?? Infinity);
  if (minT < PARAMS.frostC) frost = species.frostTolerant ? 0.7 : 0.35;

  let heat = 1;
  let maxT = -Infinity;
  for (let k = Math.max(0, i - 3); k <= i - 1; k++) maxT = Math.max(maxT, s.tmax[k] ?? -Infinity);
  if (maxT > PARAMS.heatC) heat = 0.65;

  // shock termico: calo di T media tra 4 e 14 giorni prima (euristica da pratica micologica)
  let drop = 0;
  for (let j = Math.max(3, i - 14); j <= i - 4; j++) {
    const before = mean(s.tmean, j - 3, j - 1), after = mean(s.tmean, j + 1, j + 3);
    if (before != null && after != null) drop = Math.max(drop, before - after);
  }
  const shock = drop >= PARAMS.shockDropC ? 1 + 0.075 * (species.shockWeight || 2) : 1;

  return { effRain, maxEvent, r30, triggered, rain, t20, temp, sm, moist, minT, frost, maxT, heat, drop, shock };
}

// Quota di pioggia efficace che proviene da giorni previsti (non ancora osservati).
export function confidence(species, s, i) {
  if (i <= s.todayIndex) return 1;
  const [lagMin, lagMax] = species.lag;
  const a = Math.max(0, i - lagMax), b = Math.max(0, i - lagMin);
  let tot = 0, fc = 0;
  for (let k = a; k <= b; k++) { tot += s.p[k] ?? 0; if (k > s.todayIndex) fc += s.p[k] ?? 0; }
  const share = tot > 0 ? fc / tot : 0;
  return clamp(1 - 0.5 * share - 0.04 * (i - s.todayIndex), 0.2, 1);
}

export function scoreSpecies(species, s, i, hab, band) {
  const season = seasonWeight(species.months, s.dates[i]);
  const { frac } = habitatAtBand(hab, band);
  const habitat = habitatScore(species, frac);
  const elev = elevationFit(species, band);
  const w = weatherFactors(species, s, i);
  const raw = season * habitat.value * elev * w.rain * w.temp * w.moist * w.frost * w.heat * w.shock;
  return {
    score: Math.round(clamp(raw) * 100),
    season, habitat: habitat.value, suitableShare: habitat.suitableShare, elev,
    confidence: confidence(species, s, i),
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
      if (!spBest || r.score > spBest.score) spBest = { ...r, band, species: sp };
    });
    if (spBest) perSpecies.push(spBest);
    if (spBest && (!best || spBest.score > best.score)) best = spBest;
  }
  perSpecies.sort((a, b) => b.score - a.score);
  return { best, perSpecies };
}

export const CLASSES = [
  { min: 75, label: 'Eccellente' },
  { min: 60, label: 'Ottimo' },
  { min: 45, label: 'Buono' },
  { min: 30, label: 'Possibile' },
  { min: 15, label: 'Scarso' },
  { min: 0, label: 'Improbabile' },
];
export const classOf = (score) => CLASSES.findIndex((c) => score >= c.min);

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
