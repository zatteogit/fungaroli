// Punteggi della prova retrospettiva (preregistrazione.md, sezione 6; preregistrazione-italia.md, 4.3–4.6),
// calcolati con la copia congelata del modello 2.1.0 (modello-2.1.0/, stessi SHA-256 preregistrati di js/model.js, js/species.js e js/weather.js; D23).
//
// Uso: node tools/prova-lazio/fattori.mjs [cartella-dati]
// Di solito lo lancia valuta.py. Legge dalla cartella dei dati (predefinita: dati/ accanto a questo file):
//   da-calcolare.json  {"voci": [[chiave della richiesta, giorno ISO, specie dell'app], ...]}
//   meteo/<chiave>.json  le risposte salvate da scarica_meteo.py
// Scrive fattori.json nella stessa cartella: per ogni voce i fattori di weatherFactors, il peso stagionale, la
// completezza di inputQuality e i punteggi (1), (1b), (A) e (1) arrotondato come nell'app. Scrive anche, per il
// controllo 5 di 12 del Lazio, le serie giornaliere costruite da toDaily (solo in dati/, mai nel repository).
// Solo Node ≥ 22, nessuna dipendenza.

import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MODEL_VERSION, PARAMS, weatherFactors, seasonWeight, inputQuality } from './modello-2.1.0/model.js';
import { SPECIES } from './modello-2.1.0/species.js';
import { toDaily } from './modello-2.1.0/weather.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const DATI = resolve(process.argv[2] || join(QUI, 'dati'));

function ferma(msg) {
  console.error('ERRORE (fattori.mjs): ' + msg);
  process.exit(1);
}

const profili = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
const { voci } = JSON.parse(readFileSync(join(DATI, 'da-calcolare.json'), 'utf8'));
if (!Array.isArray(voci)) ferma('da-calcolare.json senza la lista "voci"');

// Una serie per richiesta. todayStr fuori dalla serie: issuedIndex = −1, nessun giorno è una previsione (5.3 del Lazio).
const serie = new Map();
function serieDi(chiave) {
  if (serie.has(chiave)) return serie.get(chiave);
  const salvata = JSON.parse(readFileSync(join(DATI, 'meteo', chiave + '.json'), 'utf8'));
  if (salvata.chiave !== chiave) ferma(`meteo/${chiave}.json contiene la chiave ${salvata.chiave}`);
  const s = toDaily(salvata.risposta, '0000-00-00');
  if (s.issuedIndex !== -1 || s.todayIndex !== -1) ferma(`${chiave}: issuedIndex ${s.issuedIndex}, atteso −1`);
  const giorni = new Map(s.dates.map((d, k) => [d, k]));
  const v = { s, giorni, utc: salvata.risposta.utc_offset_seconds ?? null };
  serie.set(chiave, v);
  return v;
}

const FINITI = ['effRain', 'maxEvent', 'r30', 'rain', 'frost', 'heat', 'shock'];
const righe = [];
for (const [chiave, giorno, specie] of voci) {
  const sp = profili[specie];
  if (!sp) ferma(`specie sconosciuta: ${specie}`);
  const { s, giorni } = serieDi(chiave);
  const i = giorni.get(giorno);
  if (i === undefined) ferma(`${chiave}: giorno ${giorno} fuori dalla serie (${s.dates[0]} … ${s.dates.at(-1)})`);
  const q = inputQuality(sp, s, i);
  const w = weatherFactors(sp, s, i);
  const S = seasonWeight(sp.months, giorno);
  if (!Number.isFinite(S)) ferma(`${chiave} ${giorno} ${specie}: peso stagionale non finito`);
  // La finestra più lunga dell'indice (pioggia: max(r30Days, lag[1]) giorni prima) deve stare dentro la serie:
  // altrimenti inputQuality la vedrebbe incompleta e l'unità uscirebbe per completezza, non per un errore.
  const finestraIntera = i - Math.max(PARAMS.r30Days, sp.lag[1]) >= 0 && i - PARAMS.tDays >= 0 && i - 4 >= 0;
  let r = { complete: q.complete && finestraIntera, missing: q.missing, finestra: finestraIntera };
  if (r.complete) {
    for (const k of FINITI) if (!Number.isFinite(w[k])) ferma(`${chiave} ${giorno} ${specie}: ${k} non finito con dati completi`);
    if (!Number.isFinite(w.temp) || !Number.isFinite(w.moist)) ferma(`${chiave} ${giorno} ${specie}: temp o moist non finiti`);
    const f1 = Math.min(1, S * w.rain * w.temp * w.moist * w.frost * w.heat * w.shock);
    const f1b = Math.min(1, S * w.rain * w.temp * w.moist * w.frost * w.heat);
    const fA = Math.min(1, S * w.rain * w.temp * w.frost * w.heat);
    r = { ...r, S, rain: w.rain, temp: w.temp, moist: w.moist, frost: w.frost, heat: w.heat, shock: w.shock,
      shockStatus: w.shockStatus, effRain: w.effRain, maxEvent: w.maxEvent, r30: w.r30, t20: w.t20, sm: w.sm,
      f1, f1b, fA, f1_app: Math.round(Math.max(0, Math.min(1, f1)) * 100),
      bonusUnavailable: q.bonusUnavailable };
  }
  righe.push(r);
}

// Serie giornaliere per il controllo 5 (allineamento JS–Python): solo le richieste usate.
const serieUsate = {};
for (const [chiave, v] of [...serie.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const { s } = v;
  serieUsate[chiave] = { dates: s.dates, p: s.p, tmean: s.tmean, tmin: s.tmin, tmax: s.tmax, soilm: s.soilm, soilt: s.soilt, utc: v.utc };
}

const out = {
  model_version: MODEL_VERSION,
  node: process.version,
  params: { r30Days: PARAMS.r30Days, tDays: PARAMS.tDays, triggerMm: PARAMS.triggerMm, moistDry: PARAMS.moistDry, moistWet: PARAMS.moistWet },
  profili: Object.fromEntries(SPECIES.map((s) => [s.id, { lag: s.lag, eref: s.eref, topt: s.topt, tsd: s.tsd, months: s.months,
    frostTolerant: !!s.frostTolerant, soilShock: !!s.soilShock }])),
  // seasonWeight ai giorni 15 dei mesi (controllo 5)
  stagione15: Object.fromEntries(SPECIES.map((s) => [s.id, Array.from({ length: 12 }, (_, m) => seasonWeight(s.months, `2024-${String(m + 1).padStart(2, '0')}-15`))])),
  righe,
};
const dest = join(DATI, 'fattori.json');
writeFileSync(dest + '.tmp', JSON.stringify(out));
renameSync(dest + '.tmp', dest);
const destS = join(DATI, 'serie-giornaliere.json');
writeFileSync(destS + '.tmp', JSON.stringify(serieUsate));
renameSync(destS + '.tmp', destS);
console.log(`fattori.mjs: model.js ${MODEL_VERSION}, ${righe.length} voci, ${serie.size} serie`);
