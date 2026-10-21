// Modello di idoneita' alla fruttificazione (0-100) per specie, zona, quota e giorno.
// Funzioni pure: nessuna dipendenza dal DOM, testabili con `node --test`.

import {scoreBotanical} from './botanical-model.js';
import {validExternalDay} from './external-observation.js';

// Evidenze del registro esterno: informazioni osservate, separate dal punteggio.
// Il chiamante può fornire il dataset autenticato della redazione per analisi e confronto.
export function externalFieldEvidence(dataset,zoneId,taxonId,day,{windowDays=7,now=Date.now()}={}) {
  if(!dataset||dataset.schemaVersion!==1||dataset.purpose!=='occurrence_evidence'||!Array.isArray(dataset.occurrences)||!validExternalDay(day,now)||!Number.isInteger(windowDays)||windowDays<1||windowDays>365)return null;
  const since=new Date(Date.parse(day+'T12:00:00Z')-(windowDays-1)*864e5).toISOString().slice(0,10),seen=new Set();
  const records=dataset.occurrences.filter(r=>{
    if(r.zoneUsable!==true||r.zoneId!==zoneId||r.taxonId!==taxonId||!validExternalDay(r.observedOn,now)||r.observedOn<since||r.observedOn>day||!['presence','searched_absent'].includes(r.outcome))return false;
    if(r.outcome==='searched_absent'&&(!r.searched||!Number.isInteger(r.effortMinutes)||r.effortMinutes<1))return false;
    if(r.outcome==='presence'&&r.quality!=='research')return false;
    const key=r.eventKey+'|'+r.observedOn;if(seen.has(key))return false;seen.add(key);return true;
  });
  return {since,asOf:day,zoneId,taxonId,records:records.map(r=>({id:r.id,version:r.version,observedOn:r.observedOn,outcome:r.outcome,sourceUrl:r.sourceUrl})),
    presences:records.filter(r=>r.outcome==='presence').length,searchedAbsent:records.filter(r=>r.outcome==='searched_absent').length,
    coverage:records.length?'observations_available':'no_usable_observations',rankingEffect:'none'};
}

export const MODEL_VERSION = '2.1.0'; // indice sperimentale; nessuna calibrazione locale. 2.1.0: shock sul suolo, solo porcino e porcino rosso
export const PARAMS = {
  r30Days: 30,          // finestra pioggia cumulata (Salerni et al. 2002: correlazione piu' forte a 30 gg)
  tDays: 20,            // finestra T media (preprint 2025: ~13 °C media dei 20 gg precedenti per B. edulis)
  triggerMm: 8,         // un evento singolo >= 8 mm nella finestra di latenza conta come "innesco"
  moistDry: 0.10,       // m³/m³ suolo 3-9 cm: sotto = secco
  moistWet: 0.26,       // sopra = pienamente umido
  frostC: -1,           // T minima che blocca/danneggia i carpofori
  heatC: 30,            // T massima che secca lettiera e carpofori
  // Calo della temperatura del suolo (solo specie con soilShock: B. edulis e B. pinophilus).
  // Fonte: Olivier J.-M., Guinberteau J., Rondet J., Mamoun M. 1997, Revue forestière française XLIX
  // n° sp.: 222-234, doi:10.4267/2042/5671, testo su HAL https://hal.science/hal-03443958 (letto il 16/10/2026).
  // Osservazione preliminare su parcelle della Francia sud-occidentale, senza statistica («une base qu'il faut affiner»).
  shockSoilDropC: 5,      // «un écart de 5 °C environ par rapport à la température moyenne initiale»
  shockLagDays: [6, 15],  // «6 à 10 jours après le choc thermique si la température est supérieure à 15 °C, 8 à 15 jours si elle est inférieure»
  shockRefDays: 3,        // giorni della media di riferimento («température moyenne initiale»): numero euristico, la fonte non lo dice
  shockOnsetDays: 5,      // il calo può distribuirsi su più giorni: «20 heures pouvant se répartir sur 3 à 5 nuits»
  shockBonus: 1.15,       // moltiplicatore del giorno con evento: euristica senza fonte
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

  return { effRain, maxEvent, r30, triggered, rain, t20, temp, sm, moist, minT, frost, maxT, heat, ...soilTemperatureShock(species, s, i) };
}

// ---- Shock termico sul suolo (Olivier et al. 1997, vedi PARAMS) ----
// Dato: media giornaliera della temperatura del suolo a 6 cm (`soilt`, Open-Meteo `soil_temperature_6cm`).
// La fonte misura a −10 cm («Température dans le sol (– 10 cm)»; «refroidissement du sol dans les
// 10 premiers centimètres»): 6 cm è lo strato del modello più vicino (gli altri sono 0, 18 e 54 cm).
// Approssimazioni dichiarate:
// - la fonte conta le ore «fredde» («le nombre d'heures pendant lequel cet écart se manifeste doit être,
//   en cumulé, de 20 heures pouvant se répartir sur 3 à 5 nuits»); qui ci sono solo medie giornaliere.
//   Un giorno con media più bassa di 5 °C vale circa 24 ore di scarto; ore fredde sparse su più notti
//   con una media del giorno meno bassa non vengono viste (meno eventi, mai di più);
// - la temperatura del suolo è un'uscita del modello meteo, non una misura nel bosco.

// Calo nel giorno k rispetto alla «température moyenne initiale»: la media di shockRefDays giorni più
// calda tra quelle che finiscono da 1 a shockOnsetDays giorni prima di k, cioè il livello prima che il
// raffreddamento cominci («une chute des températures, air et sol, entraîne un refroidissement du sol»).
// null se manca anche un solo dato: niente valori inventati.
export function soilDrop(soilt, k) {
  if (!Number.isFinite(soilt?.[k])) return null;
  let ref = -Infinity;
  for (let e = k - PARAMS.shockOnsetDays; e <= k - 1; e++) {
    let tot = 0;
    for (let j = e - PARAMS.shockRefDays + 1; j <= e; j++) {
      if (!Number.isFinite(soilt?.[j])) return null;
      tot += soilt[j];
    }
    ref = Math.max(ref, tot / PARAMS.shockRefDays);
  }
  return { drop: ref - soilt[k], from: ref, to: soilt[k] };
}

// Evento: primo giorno in cui il calo raggiunge shockSoilDropC (il giorno prima non lo raggiungeva).
// Il giorno i riceve il bonus se un evento cade tra i − 15 e i − 6 (shockLagDays).
// Stati: 'non previsto' (specie senza soilShock), 'calo', 'nessun calo', 'dati incompleti'.
// Dati incompleti: un evento dimostrato da dati completi vale comunque; se nessun evento è dimostrato
// e manca un dato, il bonus non si applica (fattore 1) e inputQuality lo segnala in bonusUnavailable.
// Lo shock è un bonus: trattarlo come assente non gonfia mai l'indice, mentre renderlo un dato
// obbligatorio toglierebbe l'indice intero per un'informazione accessoria.
// Non implementato: «un nouvel abaissement de la température du sol d'au moins 3 °C pendant la période
// de fructification arrête le processus» e la condizione sulla pioggia («le choc thermique a lieu
// pendant ou après la période de pluie»).
export function soilTemperatureShock(species, s, i) {
  const none = { shock: 1, drop: null, shockDate: null, shockDaysBefore: null, shockFrom: null, shockTo: null };
  if (!species?.soilShock) return { ...none, shockStatus: 'non previsto' };
  const [lagMin, lagMax] = PARAMS.shockLagDays, x = PARAMS.shockSoilDropC;
  let complete = true, event = null, maxDrop = null;
  for (let k = i - lagMax; k <= i - lagMin; k++) {
    const d = soilDrop(s.soilt, k), prev = soilDrop(s.soilt, k - 1);
    if (!d || !prev) { complete = false; continue; }
    maxDrop = Math.max(maxDrop ?? -Infinity, d.drop);
    if (d.drop >= x && prev.drop < x) event = { k, ...d }; // tiene il più recente
  }
  if (event) return { shock: PARAMS.shockBonus, shockStatus: 'calo', drop: event.drop, shockDate: s.dates?.[event.k] ?? null,
    shockDaysBefore: i - event.k, shockFrom: event.from, shockTo: event.to };
  return { ...none, drop: maxDrop, shockStatus: complete ? 'nessun calo' : 'dati incompleti' };
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
  // Lo shock è un bonus: la temperatura del suolo incompleta non rende l'indice non calcolabile,
  // ma il bonus non si applica e viene dichiarato qui (vedi soilTemperatureShock).
  const bonusUnavailable = soilTemperatureShock(species, s, i).shockStatus === 'dati incompleti' ? ['temperatura del suolo'] : [];
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
  return { complete: missing.length === 0, missing, bonusUnavailable, usesForecast: futureDays.size > 0,
    forecastDays: futureDays.size, fetchedAt: s.source?.fetchedAt || null, validation: 'non validato localmente' };
}

export function scoreSpecies(species, s, i, hab, band,context) {
  if(species.kind==='plant')return scoreBotanical(species,s,i,hab,band,context);
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
export function scoreZoneDay(zone, hab, seriesByBand, speciesList, i,context) {
  let best = null;
  const perSpecies = [];
  for (const sp of speciesList) {
    let spBest = null;
    zone.bands.forEach((band, bi) => {
      const s = seriesByBand[bi];
      if (!s) return;
      const r = scoreSpecies(sp, s, i, hab, band,context);
      if (!spBest || (r.score ?? -1) > (spBest.score ?? -1)) spBest = { ...r, band, species: sp };
    });
    if (spBest&&context?.externalObservations)spBest.fieldEvidence=externalFieldEvidence(context.externalObservations,zone.id,sp.id,seriesByBand.find(Boolean)?.dates?.[i],context.evidenceOptions);
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
  if (r.t20 != null) out.push(`T media 20 gg ${r.t20.toFixed(1)}\u00a0°C`);
  if (r.sm != null) out.push(`suolo ${r.moist >= 0.8 ? 'umido' : r.moist >= 0.5 ? 'discreto' : 'secco'} (${r.sm.toFixed(2)} m³/m³)`);
  if (r.frost < 1) out.push(`gelate recenti (min ${r.minT.toFixed(1)}\u00a0°C)`);
  if (r.heat < 1) out.push(`caldo eccessivo (max ${r.maxT.toFixed(1)}\u00a0°C)`);
  if (r.shock > 1) out.push(`calo della temperatura del suolo (−${r.drop.toFixed(1)}\u00a0°C, ${r.shockDaysBefore} giorni prima)`);
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
