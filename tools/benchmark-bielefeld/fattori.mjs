// Fattori della parte meteo dell'indice di Fronda per Boletus edulis, calcolati con js/model.js.
//
// Uso: node tools/benchmark-bielefeld/fattori.mjs [cartella-dati]
// Di solito lo lancia valuta.py. Legge dalla cartella dei dati (predefinita: dati/ accanto a questo file):
//   serie.json  serie giornaliere per stagione, dal 28/6 al 30/11 (ricostruite da valuta.py, sezione 5) e
//               serie dei soli valori grezzi dal 1/8 (controllo 6);
//   sigma.json  lista dei σ di (2b) come stringhe: repr Python di un numero, oppure "inf" (sezione 6, (2b));
//   Environmental_fruiting_data_jun8.csv  per l'esito (blocco All) e per il legame con le righe, per data.
// Scrive fattori.json nella stessa cartella. Non modifica js/model.js né js/species.js: li importa.
// Solo Node ≥ 22, nessuna dipendenza.

import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MODEL_VERSION, PARAMS, weatherFactors, seasonWeight, inputQuality } from '../../js/model.js';
import { SPECIES } from '../../js/species.js';

const QUI = dirname(fileURLToPath(import.meta.url));
const DATI = resolve(process.argv[2] || join(QUI, 'dati'));

function ferma(msg) {
  console.error('ERRORE (fattori.mjs): ' + msg);
  process.exit(1);
}

const edulis = SPECIES.find((s) => s.id === 'edulis');
if (!edulis) ferma('profilo edulis non trovato in js/species.js');
const edulis20 = { ...edulis, tsd: 2 }; // confronto (2): copia in memoria, species.js non cambia

// σ di (2b): stringa → numero, oppure +∞. Qualsiasi altro valore ferma l'esecuzione.
function sigmaDaStringa(str) {
  if (typeof str !== 'string') ferma(`σ non è una stringa: ${JSON.stringify(str)}`);
  if (str === 'inf') return Infinity;
  if (!/^[0-9]+(\.[0-9]+)?(e[-+]?[0-9]+)?$/.test(str)) ferma(`σ non valido: ${JSON.stringify(str)}`);
  const v = Number(str);
  if (!Number.isFinite(v) || v <= 0) ferma(`σ non valido: ${JSON.stringify(str)}`);
  return v;
}

// --- lettura del CSV (nessun campo fra virgolette nel file) ---
const testo = readFileSync(join(DATI, 'Environmental_fruiting_data_jun8.csv'), 'utf8');
const righe = testo.split(/\r?\n/).filter((r) => r.length > 0);
const intest = righe[0].split(',');
const col = Object.fromEntries(intest.map((n, k) => [n, k]));
for (const c of ['Temp', 'Precip', 'date', 'year', 'Mnb', 'site', 'rollT_20', 'rollP_26']) {
  if (!(c in col)) ferma(`colonna ${c} assente nel CSV`);
}
const csvAll = new Map(); // date -> riga del blocco All
for (const r of righe.slice(1)) {
  const v = r.split(',');
  if (v.length !== intest.length) ferma('riga del CSV con un numero di campi diverso dall\'intestazione');
  if (v[col.site] !== 'All') continue;
  if (csvAll.has(v[col.date])) ferma(`data duplicata nel blocco All: ${v[col.date]}`);
  csvAll.set(v[col.date], {
    date: v[col.date], year: Number(v[col.year]), Temp: Number(v[col.Temp]), Precip: Number(v[col.Precip]),
    Mnb: Number(v[col.Mnb]),
  });
}

const serie = JSON.parse(readFileSync(join(DATI, 'serie.json'), 'utf8'));
const sigmaStr = JSON.parse(readFileSync(join(DATI, 'sigma.json'), 'utf8')).sigma;
if (!Array.isArray(sigmaStr)) ferma('sigma.json senza la lista "sigma"');
const profiliSigma = sigmaStr.map((str) => ({ str, profilo: { ...edulis, tsd: sigmaDaStringa(str) } }));

const ATTESI_MANCANTI = ['umidità del suolo', 'temperature minime', 'temperature massime'];
const GIORNO_MS = 86400000;

function controllaSerie(st, nome) {
  const n = st.date.length;
  if (st.p.length !== n || st.tmean.length !== n) ferma(`${nome} ${st.anno}: lunghezze diverse`);
  for (let i = 0; i < n; i++) {
    if (typeof st.p[i] !== 'number' || !Number.isFinite(st.p[i])) ferma(`${nome} ${st.anno}: pioggia non finita al giorno ${i}`);
    if (typeof st.tmean[i] !== 'number' || !Number.isFinite(st.tmean[i])) ferma(`${nome} ${st.anno}: temperatura non finita al giorno ${i}`);
    if (st.p[i] < 0) ferma(`${nome} ${st.anno}: pioggia negativa al giorno ${i}`);
    if (i > 0) {
      const dt = Date.parse(st.date[i] + 'T12:00:00Z') - Date.parse(st.date[i - 1] + 'T12:00:00Z');
      if (dt !== GIORNO_MS) ferma(`${nome} ${st.anno}: date non consecutive a ${st.date[i]}`);
    }
  }
}

// Fattori di un giorno con un profilo dato.
function giorno(profilo, s, i, data) {
  const w = weatherFactors(profilo, s, i);
  const S = seasonWeight(profilo.months, data);
  return { w, S };
}

const FINITI = ['rain', 'temp', 'effRain', 'maxEvent', 'r30', 't20'];

function calcola(st, nome, primoIndice, conSigma) {
  controllaSerie(st, nome);
  const s = { p: st.p, tmean: st.tmean, dates: st.date }; // niente soilm, tmin, tmax, soilt
  const giorni = [];
  const tempSigma = conSigma ? profiliSigma.map(() => []) : null;
  const fSigma = conSigma ? profiliSigma.map(() => []) : null;
  for (let i = primoIndice; i < st.date.length; i++) {
    const data = st.date[i];
    const riga = csvAll.get(data); // legame con il CSV per stringa di data, non per posizione
    if (!riga) ferma(`${nome}: data ${data} assente nel blocco All del CSV`);
    if (riga.year !== st.anno) ferma(`${nome}: anno della riga ${data} diverso dalla stagione ${st.anno}`);
    if (riga.Temp !== st.tmean[i] || riga.Precip !== st.p[i]) ferma(`${nome}: valore grezzo diverso dal CSV a ${data}`);
    if (i < PARAMS.r30Days) ferma(`${nome}: giorno valutato ${data} con i = ${i} < 30 (finestra tagliata)`);

    const { w, S } = giorno(edulis, s, i, riga.date);
    const w2 = weatherFactors(edulis20, s, i);
    const q = inputQuality(edulis, s, i);
    const mancanti = q.missing;
    if (JSON.stringify(mancanti) !== JSON.stringify(ATTESI_MANCANTI)) {
      ferma(`${nome} ${data}: inputQuality.missing = ${JSON.stringify(mancanti)}`);
    }
    for (const k of FINITI) if (!Number.isFinite(w[k])) ferma(`${nome} ${data}: ${k} non finito`);
    if (!Number.isFinite(S) || !Number.isFinite(w2.temp)) ferma(`${nome} ${data}: stagione o temperatura (σ 2) non finita`);
    for (const k of ['rain', 'effRain', 'maxEvent', 'r30', 't20']) {
      if (w2[k] !== w[k]) ferma(`${nome} ${data}: ${k} cambia con tsd (atteso solo temp)`);
    }

    const f1 = S * w.rain * w.temp;
    const f2 = S * w.rain * w2.temp;
    // S7: arrotondamento dell'app, con habitat, quota e fattori esclusi pari a 1
    const f1App = Math.round(Math.max(0, Math.min(1, f1)) * 100);
    giorni.push({
      data, stagione: st.anno, i, Mnb: riga.Mnb, esito: riga.Mnb > 0 ? 1 : 0,
      S, rain: w.rain, effRain: w.effRain, maxEvent: w.maxEvent, r30: w.r30, triggered: w.triggered,
      t20: w.t20, temp_35: w.temp, temp_20: w2.temp, f1, f2, f1_app: f1App, f_rt: w.rain * w.temp,
      finestre_complete: i >= PARAMS.r30Days && i >= edulis.lag[1] && i >= PARAMS.tDays,
      mancanti,
    });
    if (conSigma) {
      profiliSigma.forEach(({ profilo }, k) => {
        const wk = weatherFactors(profilo, s, i);
        if (wk.rain !== w.rain || wk.t20 !== w.t20) ferma(`${nome} ${data}: pioggia o t20 cambiano con σ`);
        if (!Number.isFinite(wk.temp)) ferma(`${nome} ${data}: temperatura non finita con σ ${profiliSigma[k].str}`);
        if (profilo.tsd === Infinity && wk.temp !== 1) ferma(`${nome} ${data}: con σ = +∞ temp = ${wk.temp}, atteso 1`);
        tempSigma[k].push(wk.temp);
        fSigma[k].push(S * wk.rain * wk.temp);
      });
    }
  }
  return { giorni, tempSigma, fSigma };
}

const out = {
  model_version: MODEL_VERSION,
  node: process.version,
  edulis: { topt: edulis.topt, tsd: edulis.tsd, lag: edulis.lag, eref: edulis.eref, months: edulis.months },
  params: { r30Days: PARAMS.r30Days, tDays: PARAMS.tDays, triggerMm: PARAMS.triggerMm },
  sigma: sigmaStr,
  giorni: [],
  temp_sigma: Object.fromEntries(sigmaStr.map((s) => [s, []])),
  f_sigma: Object.fromEntries(sigmaStr.map((s) => [s, []])),
  grezze: [],
};

for (const st of serie.stagioni) {
  const primo = st.date.indexOf(`${st.anno}-08-01`);
  if (primo !== 34) ferma(`stagione ${st.anno}: il 1/8 ha indice ${primo}, atteso 34`);
  const r = calcola(st, 'principale', primo, true);
  out.giorni.push(...r.giorni);
  sigmaStr.forEach((str, k) => {
    out.temp_sigma[str].push(...r.tempSigma[k]);
    out.f_sigma[str].push(...r.fSigma[k]);
  });
}
// Controllo 6: serie dei soli valori grezzi (dal 1/8). Si valutano i giorni con i ≥ 30, cioè dal 31/8.
for (const st of serie.grezze) {
  if (st.date[0] !== `${st.anno}-08-01`) ferma(`serie grezza ${st.anno}: non parte dal 1/8`);
  const r = calcola(st, 'grezze', PARAMS.r30Days, false);
  out.grezze.push(...r.giorni);
}

const dest = join(DATI, 'fattori.json');
writeFileSync(dest + '.tmp', JSON.stringify(out));
renameSync(dest + '.tmp', dest);
console.log(`fattori.mjs: model.js ${MODEL_VERSION}, ${out.giorni.length} giorni, ${out.grezze.length} giorni della serie grezza, ${sigmaStr.length} valori di σ`);
