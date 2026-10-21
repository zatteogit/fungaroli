// Previsioni datate per il Taccuino (piani d'uscita): cosa si salva, con quali dati, per confrontarle poi con le uscite.
// Funzioni pure, senza DOM: tests/forecast-capture.test.mjs. js/app.js le usa in predict() e captureForecast().
import { scoreSpecies, combine, MODEL_VERSION, PARAMS } from './model.js';
import { SPECIES } from './species.js';

// Serie meteo salvate per ogni fascia: 31 giorni (da d−30 a d). soilt copre la finestra dello shock (da d−23 a d−6);
// soilm9to27 (umidità 9–27 cm, m³/m³) ed et0 (ET₀ FAO-56, mm/giorno), dal 16/10/2026, si registrano senza entrare
// nell'indice (decisione D2), per confrontarli poi con le uscite. Una serie assente (copie meteo precedenti) vale null.
export const FORECAST_INPUTS = ['p', 'tmean', 'tmin', 'tmax', 'soilm', 'soilt', 'soilm9to27', 'et0'];
const bandIndex = (zone, band) => Math.max(0, zone.bands.indexOf(band));

// Indice di ogni specie per il giorno i (band null = miglior quota della zona).
// noShock: lo stesso calcolo senza il bonus del calo della temperatura del suolo (specie con soilShock trattate
// come le altre). Serve a confrontare sulle uscite reali l'indice con e senza bonus (decisione del 16/10/2026:
// l'evidenza è una sola osservazione preliminare, Olivier et al. 1997).
export function predictScores({ zone, seriesByBand, hab, i, band = null, species = SPECIES, noShock = false }) {
  const bands = band == null ? zone.bands : [band];
  const out = {};
  for (const sp of species) {
    const s = noShock && sp.soilShock ? { ...sp, soilShock: false } : sp;
    out[sp.id] = combine(bands.map((b) => scoreSpecies(s, seriesByBand[bandIndex(zone, b)], i, hab, b).score));
  }
  return out;
}

// Fattore dello shock per fascia e specie (solo le specie con soilShock): con i dati che lo hanno deciso.
export function shockFactors({ zone, seriesByBand, hab, i, species = SPECIES }) {
  const out = {};
  for (const b of zone.bands) {
    const row = {};
    for (const sp of species.filter((x) => x.soilShock)) {
      const r = scoreSpecies(sp, seriesByBand[bandIndex(zone, b)], i, hab, b);
      row[sp.id] = { shock: r.shock, status: r.shockStatus, date: r.shockDate ?? null, daysBefore: r.shockDaysBefore ?? null, drop: Number.isFinite(r.drop) ? Math.round(r.drop * 10) / 10 : null };
    }
    out[b] = row;
  }
  return out;
}

// Previsione datata per zona, data e fascia: null se la data è passata, fuori dalla serie o se il meteo è scaduto.
// Contiene l'indice con il bonus dello shock (scores, scoresByBand, come prima) e senza (scoresNoShock,
// scoresByBandNoShock), i fattori dello shock, i 31 giorni di meteo per fascia, i parametri del modello e i campioni.
export function captureForecastData({ zone, seriesByBand, hab, date, band, species = SPECIES, now = new Date() }) {
  const sb = seriesByBand;
  if (!zone || !sb?.length) return null;
  const i = sb[0].dates.indexOf(date);
  if (i < 30 || i < sb[0].todayIndex || sb.some((s) => s.source?.expired)) return null;
  const at = (b, noShock = false) => predictScores({ zone, seriesByBand: sb, hab, i, band: b, species, noShock });
  const scoresByBand = Object.fromEntries(zone.bands.map((b) => [b, at(b)]));
  const scores = scoresByBand[band] || at(null);
  if (!scores || !Object.values(scores).some(Number.isFinite)) return null;
  const scoresByBandNoShock = Object.fromEntries(zone.bands.map((b) => [b, at(b, true)]));
  const scoresNoShock = scoresByBandNoShock[band] || at(null, true);
  const inputs = sb.map((s, bi) => ({ band: zone.bands[bi], source: s.source,
    dates: s.dates.slice(i - 30, i + 1),
    ...Object.fromEntries(FORECAST_INPUTS.map((k) => [k, s[k]?.slice(i - 30, i + 1) ?? null])) }));
  return { mode: 'prospective', capturedAt: now.toISOString(), modelVersion: MODEL_VERSION,
    internalScoreScale: '0–100', scores, scoresByBand, scoresNoShock, scoresByBandNoShock,
    shock: { bonus: PARAMS.shockBonus, note: 'scoresNoShock: stesso calcolo senza il bonus del calo della temperatura del suolo', byBand: shockFactors({ zone, seriesByBand: sb, hab, i, species }) },
    inputs, model: { params: PARAMS, species },
    habitat: { sample_categories: hab.sample_categories, samples: hab.samples.map((s) => s.slice(0, 2)) } };
}
