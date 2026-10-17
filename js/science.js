import {enhanceContentReading} from './content-ui.js';
// La scienza dietro l'indice, per chi vuole approfondire: la "ricetta" fattore per fattore con i numeri veri del giorno,
// i grafici giorno per giorno (un solo componente, js/viz.js), il profilo della specie e la pagina del metodo (docs/metodo-scientifico.md).
import { PARAMS, formatIndex } from './model.js';
import { speciesLink } from './species-link.js';
import {renderBotanicalWhy} from './botanical-explanation.js';
import { renderViz, niceTicks, textWidth, fmtDay } from './viz.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = (x, d = 1) => (x == null || Number.isNaN(x) ? '–' : x.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }));
const n0 = (x) => (x == null ? '–' : Math.round(x).toLocaleString('it-IT'));
const pct = (x) => `${Math.round(x * 100)}%`;
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

// quanto e' solido ogni pezzo (stesse etichette di docs/metodo-scientifico.md)
const TAG = { lett: 'Letteratura', dato: 'Dato ufficiale', eur: 'Euristica' };
const tag = (k) => `<span class="ev-tag ev-${k}">${TAG[k]}</span>`;

function factorRows(r, sp, band, dateStr) {
  const [lo, hi] = sp.elev;
  const [lagMin, lagMax] = sp.lag;
  const month = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'][new Date(dateStr + 'T12:00:00').getMonth()];
  return [
    { k: 'Stagione', v: r.season, inputs: ['data'], brief: `${month} · periodo indicativo della specie`, tags: ['eur'], why: `${/^[ao]/.test(month) ? 'ad' : 'a'} ${month} ${r.season >= 0.8 ? 'è nel suo periodo' : r.season >= 0.3 ? 'è ai margini del periodo' : 'è fuori stagione'} (curva mensile della specie).` },
    { k: 'Bosco alla quota', v: r.habitat, inputs: ['campioni di habitat'], brief: `${pct(r.suitableShare)} di idoneità ponderata · ${r.habitatSamples} campioni`, tags: ['dato', 'eur'], why: `a ${band} m l'idoneità ponderata dell'area campionata è ${pct(r.suitableShare)}, inclusi i punti fuori bosco (${r.habitatSamples} campioni, ±${PARAMS.bandHalfWidth} m). Il massimo a 45% è una scelta euristica.` },
    { k: 'Quota', v: r.elev, inputs: [], brief: `${band} m · intervallo del modello ${lo}–${hi} m`, tags: ['eur'], why: band >= lo && band <= hi ? `${band} m è dentro l'intervallo della specie (${lo}–${hi} m).` : `${band} m è fuori dall'intervallo ${lo}–${hi} m: il fattore cala di 1/200 per metro.` },
    { k: 'Pioggia', v: r.rain, inputs: ['pioggia', 'meteo aggiornato'], brief: `${n0(r.effRain)} mm tra ${lagMax} e ${lagMin} giorni prima`, tags: ['lett', 'eur'], why: `${n0(r.effRain)} mm tra ${lagMax} e ${lagMin} giorni prima (finestra di latenza del modello), evento massimo ${n0(r.maxEvent)} mm${r.triggered ? ': innesco sì' : ` (sotto gli ${PARAMS.triggerMm} mm dell'innesco: vale meno)`}; ${n0(r.r30)} mm nei 30 giorni.` },
    { k: 'Temperatura', v: r.temp, inputs: ['temperatura media', 'meteo aggiornato'], brief: `Media di ${n1(r.t20)}\u00a0°C nei 20 giorni precedenti`, tags: sp.id === 'edulis' ? ['lett', 'eur'] : ['eur'], why: `media dei 20 giorni prima ${n1(r.t20)} °C; centro della curva ${n1(sp.topt, 0)} °C, ampiezza euristica ${n1(sp.tsd)} °C. Non è un intervallo di confidenza.` },
    { k: 'Umidità del suolo', v: r.moist, inputs: ['umidità del suolo', 'meteo aggiornato'], brief: r.sm == null ? 'Dato non disponibile' : `Terreno ${SOIL_TEXT[soilLevel(r.sm)]} negli ultimi 3 giorni (stima a 3–9 cm)`, tags: ['dato', 'eur'], why: r.sm == null ? 'dato non disponibile: indice non calcolabile.' : `${n1(r.sm, 2)} m³/m³ a 3–9 cm negli ultimi 3 giorni (soglie euristiche ${n1(PARAMS.moistDry, 2)}–${n1(PARAMS.moistWet, 2)}). È un dato di modello, non una misura del terreno.` },
    { k: 'Gelo', v: r.frost, inputs: ['temperature minime', 'meteo aggiornato'], brief: `Minima di ${n1(r.minT)}\u00a0°C negli ultimi 5 giorni`, tags: ['eur'], why: r.frost < 1 ? `minima di ${n1(r.minT)}\u00a0°C negli ultimi 5 giorni: il modello penalizza il gelo sotto ${PARAMS.frostC} °C.` : `minima ${n1(r.minT)}\u00a0°C negli ultimi 5 giorni: nessuna penalità per gelo nel modello.` },
    { k: 'Caldo', v: r.heat, inputs: ['temperature massime', 'meteo aggiornato'], brief: `Massima di ${n1(r.maxT)}\u00a0°C negli ultimi 3 giorni`, tags: ['eur'], why: r.heat < 1 ? `massima di ${n1(r.maxT)}\u00a0°C negli ultimi 3 giorni: il modello penalizza il caldo sopra ${PARAMS.heatC} °C.` : `massima ${n1(r.maxT)}\u00a0°C negli ultimi 3 giorni: nessuna penalità per caldo nel modello.` },
    { k: 'Shock termico', v: r.shock, inputs: ['temperatura media', 'meteo aggiornato'], brief: r.shock > 1 ? `Calo di ${n1(r.drop)}\u00a0°C · bonus non validato` : 'Nessun bonus nel modello', tags: ['eur'], bonus: true, why: r.shock > 1 ? `calo di ${n1(r.drop)} °C nella media tra 4 e 14 giorni fa: bonus ipotizzato, senza validazione locale.` : `nessun calo di almeno ${PARAMS.shockDropC} °C tra 4 e 14 giorni fa: nessun bonus.` },
  ];
}

function factorState(x) {
  if (!Number.isFinite(x.v)) return { label: 'Non disponibile', kind: 'unknown' };
  if (x.bonus) return { label: x.v > 1 ? 'Bonus ipotizzato' : 'Nessun bonus', kind: 'neutral' };
  if (x.v >= 1) return { label: 'Non penalizza', kind: 'good' };
  if (x.v === 0) return { label: 'Azzera il calcolo', kind: 'low' };
  return x.v >= .8 ? { label: 'Riduce poco', kind: 'mild' } : x.v >= .5 ? { label: 'Riduce', kind: 'moderate' } : { label: 'Riduce molto', kind: 'low' };
}

function speciesProfile(sp) {
  const months = sp.months.map((v, k) => `<span class="sp-m" title="${MESI[k]}: ${pct(v)}"><i style="height:${Math.max(4, v * 100)}%"></i><small>${MESI[k][0]}</small></span>`).join('');
  const forest = Object.entries(sp.forest).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><span>${esc(k === 'non bosco' ? 'fuori bosco (prati, radure)' : k)}</span><i style="--w:${v * 100}%"></i><b>${n1(v, 1)}</b></li>`).join('');
  return `<div class="sci-profile">
    <p class="sci-h">Il profilo di ${speciesLink(sp, sp.name.toLowerCase())} nel modello</p>
    <dl class="sci-params">
      <div><dt>Finestra di latenza</dt><dd>${sp.lag[0]}–${sp.lag[1]} giorni dopo la pioggia</dd></div>
      <div><dt>Pioggia di riferimento</dt><dd>${sp.eref} mm (parametro di saturazione euristico delle due curve)</dd></div>
      <div><dt>Curva termica</dt><dd>centro ${n1(sp.topt, 0)}\u00a0°C, ampiezza ${n1(sp.tsd)}\u00a0°C (media di 20 giorni)</dd></div>
      <div><dt>Quote</dt><dd>${sp.elev[0]}–${sp.elev[1]} m</dd></div>
      ${sp.frostTolerant ? '<div><dt>Gelo</dt><dd>tollerante: il gelo pesa meno</dd></div>' : ''}
    </dl>
    <p class="sci-sub">Mesi (peso stagionale)</p><div class="sp-months" aria-hidden="true">${months}</div>
    <p class="sci-sub">Boschi (idoneità da 0 a 1)</p><ul class="sp-forest">${forest}</ul>
    ${sp.evidence ? `<p class="small muted">Origine dei parametri: ${esc(sp.evidence)}</p>` : ''}
  </div>`;
}

// ---- le condizioni giorno per giorno: quattro domande, un solo componente grafico (js/viz.js) ----

/** Umidità del suolo a parole, con le soglie del modello (PARAMS.moistDry / moistWet). */
export function soilLevel(v) {
  if (!Number.isFinite(v)) return null;
  return v < PARAMS.moistDry ? 'secco' : v < PARAMS.moistWet ? 'medio' : 'umido';
}
const SOIL_TEXT = { secco: 'secco', medio: 'mediamente umido', umido: 'umido' };
const mm = (v) => `${v === 0 ? '0' : v < 10 ? n1(v, 1) : n0(v)} mm`;

/** Le frasi che rispondono alle quattro domande. Funzione pura: testata in tests/science-story.test.mjs. */
export function dayStory({ r, sp, rows, days = [], todayIndex, i }) {
  const name = sp.name.split(' / ')[0].toLowerCase();
  const [lagMin, lagMax] = sp.lag;
  const ok = (k) => rows.find((x) => x.k === k && Number.isFinite(x.v));
  const rain = !ok('Pioggia') ? 'Mancano dati di pioggia per le finestre richieste: il fattore non è calcolabile.'
    : `${n0(r.effRain)} mm tra ${lagMax} e ${lagMin} giorni prima del giorno scelto: è la finestra in cui la pioggia conta per ${name} nel modello. `
      + (r.maxEvent >= PARAMS.triggerMm ? `Almeno un giorno ha superato gli ${PARAMS.triggerMm} mm che il modello considera un innesco (massimo ${n0(r.maxEvent)} mm).`
        : r.triggered ? `Nessun giorno ha raggiunto gli ${PARAMS.triggerMm} mm, ma il totale basta come innesco nel modello.`
        : `Nessun giorno ha raggiunto gli ${PARAMS.triggerMm} mm dell'innesco (massimo ${n0(r.maxEvent)} mm): la pioggia vale meno.`)
      + ` Negli ultimi 30 giorni: ${n0(r.r30)} mm.`;
  const lo = sp.topt - sp.tsd, hi = sp.topt + sp.tsd;
  const temp = !ok('Temperatura') || r.t20 == null ? 'Mancano dati di temperatura per i 20 giorni richiesti: il fattore non è calcolabile.'
    : `Media dei 20 giorni prima: ${n1(r.t20)} °C. Per ${name} il modello preferisce medie tra ${n0(lo)} e ${n0(hi)} °C. `
      + (r.t20 < lo ? 'Ora fa più freddo di così.' : r.t20 > hi ? 'Ora fa più caldo di così.' : 'Siamo dentro questa fascia.')
      + ' Non è un limite netto: più ci si allontana dal centro, più il fattore riduce l’indice.';
  const lvl = soilLevel(r.sm);
  const soil = !ok('Umidità del suolo') || !lvl ? 'Umidità del suolo non disponibile: l’indice non è calcolabile. Un dato mancante non vuol dire terreno secco.'
    : `Negli ultimi 3 giorni il terreno è ${SOIL_TEXT[lvl]}, secondo il modello meteo (strato tra 3 e 9 cm). È una stima, non una misura sul posto.`;
  const sel = days.find((d) => d.i === i), ahead = days.filter((d) => d.i > todayIndex && Number.isFinite(d.score));
  let next = sel && Number.isFinite(sel.score) ? `Il giorno scelto vale ${formatIndex(sel.score)} su 10.` : 'Per il giorno scelto l’indice non è calcolabile.';
  if (ahead.length) {
    const best = ahead.reduce((a, b) => (b.score > a.score ? b : a));
    const lowest = Math.min(...ahead.map((d) => d.score));
    next += ` Nei prossimi ${ahead.length} giorni va da ${formatIndex(lowest)} a ${formatIndex(best.score)}; il valore più alto è ${new Date(best.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' })}.`;
  }
  next += ' Dopo oggi il calcolo usa previsioni: più sono lontane, meno sono affidabili.';
  return { rain, temp, soil, next };
}

const key = (cls, text, fallback) => `<span class="viz-k"${fallback ? ` data-fallback="${fallback}"` : ''}><i class="viz-sw ${cls}" aria-hidden="true"></i>${esc(text)}</span>`;
const block = (id, q, answer, keys) => `
    <section class="sci-q" id="sci-q-${id}" aria-labelledby="sci-q-${id}-h">
      <h3 class="sci-q-h" id="sci-q-${id}-h">${esc(q)}</h3>
      <p class="sci-q-a">${esc(answer)}</p>
      <figure class="viz" data-viz="${id}"><div class="viz-plot"></div><figcaption class="viz-key">${keys}</figcaption></figure>
    </section>`;

function storyHtml({ r, sp, rows, days, todayIndex, i }) {
  if (!days?.length) return '';
  const t = dayStory({ r, sp, rows, days, todayIndex, i });
  const lo = sp.topt - sp.tsd, hi = sp.topt + sp.tsd;
  return `
    <div class="sci-days">
    <h3 class="sci-h" id="sci-giorni">Le condizioni giorno per giorno</h3>
    <p class="sci-intro">Ultimi ${Math.max(0, todayIndex - days[0].i)} giorni e prossimi ${Math.max(0, days[days.length - 1].i - todayIndex)}. La fascia chiara è la <b>finestra che conta</b> per il giorno scelto. Tocca un grafico per leggere il valore di un giorno.</p>
    ${block('rain', 'Ha piovuto abbastanza, e al momento giusto?', t.rain, key('sw-water', 'pioggia del giorno (modello)') + key('sw-water is-forecast', 'prevista') + key('sw-threshold', `${PARAMS.triggerMm} mm: innesco nel modello`, 'thr'))}
    ${block('temp', 'Fa la temperatura giusta?', t.temp, key('sw-heat-line', 'media del giorno') + key('sw-heat-band', `fascia preferita nel modello: ${n0(lo)}–${n0(hi)} °C`))}
    ${block('soil', 'Il terreno è umido?', t.soil, key('sw-water-line', 'umidità stimata tra 3 e 9 cm') + `<span class="viz-k">secco sotto ${n1(PARAMS.moistDry, 2)} m³/m³, umido sopra ${n1(PARAMS.moistWet, 2)}</span>`)}
    ${block('index', 'Come va nei prossimi giorni?', t.next, key('sw-index-line', 'indice con meteo passato di modello') + key('sw-index-line is-forecast', 'con previsioni'))}
    <details class="viz-table"><summary>Tutti i valori giorno per giorno</summary><div class="viz-table-wrap" data-viz-table></div></details>
    </div>`;
}

// piante: pioggia di contesto e indice nei giorni, senza le finestre del modello fungino
function plantDaysHtml({ days, todayIndex, i }) {
  if (!days?.length) return '';
  const sel = days.find((d) => d.i === i);
  return `
    <div class="sci-days">
    <h3 class="sci-h" id="sci-giorni">Le condizioni giorno per giorno</h3>
    ${block('rain', 'Quanto ha piovuto?', 'Pioggia giornaliera di modello: fa da contesto, non decide da sola la fase della pianta.', key('sw-water', 'pioggia del giorno (modello)') + key('sw-water is-forecast', 'prevista'))}
    ${block('index', 'Come va nei prossimi giorni?', `${sel && Number.isFinite(sel.score) ? `Il giorno scelto vale ${formatIndex(sel.score)} su 10.` : 'Per il giorno scelto l’indice non è calcolabile.'} Dopo oggi il calcolo usa previsioni: più sono lontane, meno sono affidabili.`, key('sw-index-line', 'indice con meteo passato di modello') + key('sw-index-line is-forecast', 'con previsioni'))}
    <details class="viz-table"><summary>Tutti i valori giorno per giorno</summary><div class="viz-table-wrap" data-viz-table></div></details>
    </div>`;
}

/** Disegna i quattro grafici sullo stesso asse dei giorni. Va chiamata a sezione aperta (serve la larghezza reale). */
export function drawWhyCharts(box, { s, sp, days, todayIndex, i }) {
  if (!box || !days?.length || !box.querySelector('[data-viz]')) return;
  const from = days[0].i, at = (k) => k - from;
  const dates = days.map((d) => d.date), ti = at(todayIndex), si = at(i);
  const pick = (arr) => days.map((d) => (Number.isFinite(arr?.[d.i]) && arr[d.i] >= 0 ? arr[d.i] : null));
  const rain = pick(s.p), temp = days.map((d) => (Number.isFinite(s.tmean?.[d.i]) ? s.tmean[d.i] : null)), soil = pick(s.soilm), score = days.map((d) => (Number.isFinite(d.score) ? d.score : null));
  const fin = (a) => a.filter(Number.isFinite);
  const fungal = sp.kind !== 'plant' && Array.isArray(sp.lag);
  const [lagMin, lagMax] = fungal ? sp.lag : [0, 0];
  const rTicks = niceTicks(0, Math.max(fungal ? PARAMS.triggerMm * 1.5 : 10, ...fin(rain)), 2);
  const tlo = fungal ? sp.topt - sp.tsd : Infinity, thi = fungal ? sp.topt + sp.tsd : -Infinity;
  const tTicks = niceTicks(Math.min(tlo, ...fin(temp)), Math.max(thi, ...fin(temp)), 3);
  const sMax = Math.max(0.4, ...fin(soil));
  const specs = {
    rain: { kind: 'bars', name: 'Pioggia giornaliera in millimetri', values: rain, format: mm, y: { min: 0, max: rTicks.max, ticks: rTicks.ticks.map((v, k, a) => ({ v, label: k === a.length - 1 ? `${n0(v)} mm` : n0(v) })) }, ...(fungal ? { window: { from: at(i - lagMax), to: at(i - lagMin), label: 'finestra che conta' }, threshold: { v: PARAMS.triggerMm, label: `${PARAMS.triggerMm} mm innesco` } } : {}) },
    temp: { kind: 'line', name: 'Temperatura media giornaliera in gradi', values: temp, format: (v) => `${n1(v)} °C`, y: { min: tTicks.min, max: tTicks.max, ticks: tTicks.ticks.map((v) => ({ v, label: `${n0(v)} °C` })) }, window: { from: at(i - PARAMS.tDays), to: at(i - 1), label: 'finestra che conta' }, band: { lo: tlo, hi: thi } },
    soil: { kind: 'line', name: 'Umidità del suolo stimata', values: soil, format: (v) => soilLevel(v), describe: (v) => `${n1(v, 2)} m³/m³`, y: { min: 0, max: sMax, ticks: [] }, zones: [{ lo: 0, hi: PARAMS.moistDry, label: 'secco' }, { lo: PARAMS.moistDry, hi: PARAMS.moistWet, label: 'medio' }, { lo: PARAMS.moistWet, hi: sMax, label: 'umido' }], window: { from: at(i - 3), to: at(i - 1), label: 'finestra che conta' } },
    index: { kind: 'line', name: 'Indice sperimentale da 0 a 10', values: score, format: (v) => `${formatIndex(v)} su 10`, y: { min: 0, max: 100, ticks: [0, 50, 100].map((v) => ({ v, label: formatIndex(v).replace(',0', '') })) } },
  };
  // stesso margine sinistro per tutti: gli assi dei giorni restano allineati da un grafico all'altro
  const left = Math.max(24, ...Object.values(specs).flatMap((sp2) => (sp2.zones ? sp2.zones.map((z) => z.label) : sp2.y.ticks.map((t) => t.label))).map((t) => textWidth(t, 11))) + 8;
  for (const [id, spec] of Object.entries(specs)) {
    const fig = box.querySelector(`[data-viz="${id}"]`);
    if (fig) renderViz(fig, { ...spec, left, dates, todayIndex: ti, selectedIndex: si });
  }
  const tbl = box.querySelector('[data-viz-table]');
  if (tbl && !tbl.firstChild) {
    const dash = '—';
    tbl.innerHTML = `<table><caption class="sr-only">Valori giornalieri usati nei grafici</caption><thead><tr><th scope="col">Giorno</th><th scope="col">Pioggia</th><th scope="col">Temperatura media</th><th scope="col">Suolo</th><th scope="col">Indice</th></tr></thead><tbody>${days.map((d, k) => `<tr${d.i === i ? ' class="is-selected"' : ''}><th scope="row">${esc(fmtDay(d.date, true))}${d.i === todayIndex ? ' · oggi' : d.i > todayIndex ? ' · prev.' : ''}</th><td>${rain[k] == null ? dash : mm(rain[k])}</td><td>${temp[k] == null ? dash : `${n1(temp[k])} °C`}</td><td>${soil[k] == null ? dash : `${soilLevel(soil[k])} <small>${n1(soil[k], 2)} m³/m³</small>`}</td><td>${score[k] == null ? dash : formatIndex(score[k])}</td></tr>`).join('')}</tbody></table><p class="small muted">${dash} dato assente: non vuol dire zero.</p>`;
  }
  // ridisegna quando cambia la larghezza (rotazione, finestra), senza osservatori orfani
  if (!box._vizObserver && typeof ResizeObserver !== 'undefined') {
    let w = box.clientWidth, t = 0;
    box._vizObserver = new ResizeObserver(() => {
      if (!box.isConnected) { box._vizObserver.disconnect(); return; }
      if (Math.abs(box.clientWidth - w) < 2) return;
      w = box.clientWidth; clearTimeout(t);
      t = setTimeout(() => box._vizDraw?.(), 120);
    });
    box._vizObserver.observe(box);
  }
  box._vizDraw = () => drawWhyCharts(box, { s, sp, days, todayIndex, i });
  // aprendo un dettaglio, la sua intestazione resta sotto la barra in alto e non nascosta dietro
  box.querySelectorAll('.sci-technical, .viz-table').forEach((d) => {
    d.ontoggle = () => {
      if (!d.open) return;
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--appbar-h')) || 56;
      if (d.getBoundingClientRect().top < bar + 8) d.scrollIntoView({ block: 'start' });
    };
  });
}

// la sezione "Perche' questo indice", completa
export function renderWhy({ r, s, i, sp, band, dateStr, shown, agg, parts = [], prefs = [], outing, days = [], todayIndex = i }) {
  if(sp.kind==='plant')return renderBotanicalWhy({r,sp,prefs})+plantDaysHtml({days,todayIndex,i});
  const missing = new Set(r.quality?.missing || []);
  const rows = factorRows(r, sp, band, dateStr).map(x => x.inputs.some(k => missing.has(k)) ? { ...x, v: null, brief: 'Dati mancanti o non aggiornati per il calcolo', why: 'Dati mancanti o non aggiornati per le finestre richieste: il fattore non è utilizzabile.' } : x);
  const complete = r.quality?.complete !== false && rows.every(x => Number.isFinite(x.v));
  const product = complete ? Math.min(1, rows.reduce((a, x) => a * x.v, 1)) : null;
  const limiting = rows.filter(x => !x.bonus && Number.isFinite(x.v) && x.v < 1).sort((a, b) => a.v - b.v);
  const weakest = limiting[0];
  const tied = weakest ? limiting.filter(x => Math.abs(x.v - weakest.v) < 1e-9) : [];
  const main = [...tied, ...rows.slice(0, 6).filter(x => !tied.includes(x))].slice(0, 6);
  const other = rows.filter(x => !main.includes(x));
  const raw = complete ? Math.round(product * 100) : null;
  const takeaway = !complete ? 'Mancano dati per un indice completo.' : tied.length ? `Nel modello ${tied.map(x => x.k.toLowerCase()).join(' e ')} ${tied.length > 1 ? 'sono i fattori che riducono' : 'è il fattore che riduce'} di più l’indice.` : 'Nessun fattore riduce l’indice nel modello.';
  const fc = `<p class="sci-note"><b>Dati ${r.quality?.complete ? 'completi per le finestre richieste' : 'incompleti'}.</b> ${r.quality?.usesForecast ? 'Il calcolo include previsioni meteorologiche, anche del giorno di acquisizione.' : 'Il calcolo usa meteo passato di modello, non misure nella fungaia.'} L'accuratezza dei ritrovamenti non è stata misurata nel Reatino. ${r.quality?.fetchedAt ? `Acquisizione: ${esc(new Date(r.quality.fetchedAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }))}.` : ''}</p>`;
  return `
    <p class="sci-lede">${Number.isFinite(shown) && complete ? `Indice sperimentale <b>${formatIndex(shown)}/10</b>` : '<b>Indice non disponibile</b>'} per ${speciesLink(sp, sp.name.toLowerCase())} a ${band} m. Descrive condizioni ambientali stimate, non la probabilità di trovare funghi.</p>
    <p class="sci-takeaway">${esc(takeaway)}</p>
    <p class="sci-sub">Come incidono le condizioni nel modello</p>
    <ul class="sci-signals" aria-label="Come incidono i fattori nel modello">${main.map(x => { const state = factorState(x); return `<li class="sci-signal ${tied.includes(x) && complete ? 'weak' : ''}"><div class="sci-signal-head"><b>${esc(x.k)}</b><span class="sci-state state-${state.kind}">${state.label}</span></div><p>${esc(x.brief)}</p></li>`; }).join('')}</ul>
    <ul class="sci-checks" aria-label="Altri fattori del modello">${other.map(x => { const state = factorState(x); return `<li><b>${esc(x.k)}</b><span class="sci-state state-${state.kind}">${state.label}</span><small>${esc(x.brief)}</small></li>`; }).join('')}</ul>
    ${storyHtml({ r, sp, rows, days, todayIndex, i })}
    <details class="sci-technical" id="sci-calcolo"><summary>Calcolo e fonti dei 9 fattori</summary><div class="sci-technical-body">
    <p class="sci-note">I fattori si moltiplicano: ×1 non riduce l’indice, un valore inferiore lo abbassa. Lo shock termico può aggiungere un bonus ipotizzato. Le etichette riassumono l’effetto nel modello, senza misurare l’affidabilità dei dati.</p>
    <ol class="sci-factors">${rows.map((x) => `
      <li>
        <div class="sf-top"><span class="sf-k">${esc(x.k)}</span><b class="sf-v" title="Moltiplicatore del fattore">${Number.isFinite(x.v) ? `×${n1(x.v, 2)}` : 'Non disponibile'}</b></div>
        <p class="sf-why">${esc(x.why)} ${x.tags.map(tag).join(' ')}</p>
      </li>`).join('')}
    </ol>
    <p class="sci-eq"><span>min(10; 10 × ${rows.map((x) => n1(x.v, 2)).join(' × ')})</span> ≈ <b>${formatIndex(raw)}</b></p>
    <p class="sci-note">I coefficienti mostrati sono arrotondati; il risultato usa i valori completi ed è limitato a 10.</p>
    ${parts.length > 1 ? `<p class="sci-note">L'indice della zona è il <b>massimo</b> delle specie selezionate. Le altre: ${parts.slice(1).map((x) => `${esc(x.name.toLowerCase())} ${formatIndex(x.score)}`).join(', ')}. Aggiungere specie non aumenta automaticamente il numero. Specie diverse possono avere la quota migliore in luoghi diversi.</p>` : ''}
    ${prefs.length ? `<p class="sci-note">Le preferenze (${prefs.map((p) => `${esc(p.label)} ×${n1(p.mult, 2)}`).join(', ')}) modificano solo l'ordine dei consigli. L'indice delle condizioni resta <b>${formatIndex(shown)}</b>.</p>` : ''}
    ${outing ? `<p class="sci-note"><b>Il meteo dell'uscita non cambia l'indice</b>: cambia solo l'ordine delle zone (×${n1(outing, 2)} in classifica). Le condizioni della mattina sono valutate separatamente dalle condizioni di crescita.</p>` : ''}
    ${fc}${speciesProfile(sp)}</div></details>
    <p class="sci-more"><a class="more-row" href="#/metodo">Il metodo completo: formule, fonti e limiti</a></p>`;
}

// ---- pagina del metodo: il documento del repository, reso nel nostro stile ----
function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}
const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function mdToHtml(md) {
  // la sezione «Per chi sviluppa» resta nel documento del repository, non nella pagina dell'app
  const lines = md.replace(/\r/g, '').split(/\n(?=## Per chi sviluppa\s*$)/m)[0].split('\n');
  const out = [], toc = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue; }
    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) { const lv = h[1].length, id = slug(h[2]); if (lv === 2) toc.push([id, h[2]]); out.push(`<h${lv + 1} id="m-${id}">${inline(h[2])}</h${lv + 1}>`); i++; continue; }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r, k) => !(k === 1 && /^\|[\s:|-]+\|$/.test(r)));
      out.push(`<div class="md-table"><table><thead><tr>${cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l), items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { let t = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''); while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) t += ' ' + lines[i++].trim(); items.push(t); }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue; }
    if (!l.trim()) { i++; continue; }
    const buf = [l]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\||>|\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

let methodCache = null;
export async function renderMethod(box) {
  box.innerHTML = '<p class="muted">Carico il metodo…</p>';
  try {
    if (!methodCache) {
      const embedded = globalThis.FUNGAROLI_DATA?.method;
      const md = embedded || await (await fetch('docs/metodo-scientifico.md')).text();
      methodCache = mdToHtml(md);
    }
    const { html, toc } = methodCache;
    // con molte sezioni, una riga di chip che scorre in orizzontale porta alla sezione
    const chips = toc.length > 6 ? `<nav class="md-chips" aria-label="Sezioni">${toc.map(([id, t]) => `<a class="chip" href="#m-${id}" data-jump="m-${id}">${inline(t)}</a>`).join('')}</nav>` : '';
    box.innerHTML = `${chips}<article class="md">${html}</article>`;
    enhanceContentReading(box.querySelector('.md'));
    // i link interni non cambiano la rotta: scorrono alla sezione
    box.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  } catch {
    box.innerHTML = '<p class="notice">Non riesco a caricare il metodo senza rete. Riprova quando sei di nuovo connesso.</p>';
  }
}
