// La scienza dietro l'indice, per chi vuole approfondire: la "ricetta" fattore per fattore con i numeri veri del giorno,
// i grafici con le soglie della specie, il profilo della specie e la pagina del metodo (docs/metodo-scientifico.md).
import { PARAMS, formatIndex } from './model.js';
import { speciesLink } from './species-link.js';
import {renderBotanicalWhy} from './botanical-explanation.js';

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
    { k: 'Umidità del suolo', v: r.moist, inputs: ['umidità del suolo', 'meteo aggiornato'], brief: `${n1(r.sm, 2)} m³/m³ stimati a 3–9 cm`, tags: ['dato', 'eur'], why: r.sm == null ? 'dato non disponibile: indice non calcolabile.' : `${n1(r.sm, 2)} m³/m³ a 3–9 cm negli ultimi 3 giorni (soglie euristiche ${n1(PARAMS.moistDry, 2)}–${n1(PARAMS.moistWet, 2)}). È un dato di modello, non una misura del terreno.` },
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

// grafici piccoli, SVG in linea: niente librerie, leggibili su telefono
function rainChart(s, i, sp) {
  const from = Math.max(0, i - 35), N = i - from + 1, W = 320, H = 96, bw = W / N;
  const vals = s.p.slice(from, i + 1);
  if (!vals.some(v => Number.isFinite(v) && v >= 0)) return '<p class="sci-note">Pioggia giornaliera: dati non disponibili per il grafico.</p>';
  const total30 = r30sum(s, i);
  const max = Math.max(PARAMS.triggerMm * 1.6, ...vals.filter(Number.isFinite));
  const Y = (v) => H - 14 - (v / max) * (H - 24);
  const [lagMin, lagMax] = sp.lag;
  const a = Math.max(from, i - lagMax) - from, b = Math.max(from, i - lagMin) - from;
  const bars = vals.map((v, k) => Number.isFinite(v) && v >= 0 ? `<rect x="${(k * bw + 0.6).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${(bw - 1.2).toFixed(1)}" height="${(H - 14 - Y(v)).toFixed(1)}" class="${k + from > s.todayIndex ? 'fc' : k >= a && k <= b ? 'in' : ''}"/>` : '').join('');
  return `<figure class="sci-chart"><figcaption><b>Pioggia giornaliera</b> · la fascia è la finestra di latenza (${lagMax}–${lagMin} giorni prima)</figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pioggia degli ultimi ${N} giorni: ${total30 == null ? 'totale degli ultimi 30 non disponibile' : `${n0(total30)} mm negli ultimi 30`}">
      <rect x="${(a * bw).toFixed(1)}" y="0" width="${((b - a + 1) * bw).toFixed(1)}" height="${H - 14}" class="win"/>
      <line x1="0" x2="${W}" y1="${Y(PARAMS.triggerMm).toFixed(1)}" y2="${Y(PARAMS.triggerMm).toFixed(1)}" class="thr"/>
      <text x="${W - 2}" y="${(Y(PARAMS.triggerMm) - 3).toFixed(1)}" text-anchor="end" class="lbl">${PARAMS.triggerMm} mm innesco</text>
      <g class="bars">${bars}</g>
      <text x="0" y="${H - 2}" class="lbl">${N - 1} giorni prima</text><text x="${W}" y="${H - 2}" text-anchor="end" class="lbl">giorno scelto</text>
    </svg></figure>`;
}
const r30sum = (s, i) => { let t = 0; if (i < 30) return null; for (let k = i - 30; k < i; k++) { if (!Number.isFinite(s.p[k]) || s.p[k] < 0) return null; t += s.p[k]; } return t; };

function lineChart({ vals, lo, hi, band, unit, title, note, bandLabel, digits = 1 }) {
  const W = 320, H = 92, N = vals.length;
  const ok = vals.filter((v) => v != null);
  if (ok.length < 3) return '';
  const mn = Math.min(...ok, band ? band[0] : Infinity, lo ?? Infinity), mx = Math.max(...ok, band ? band[1] : -Infinity, hi ?? -Infinity);
  const pad = (mx - mn) * 0.12 || 1;
  const Y = (v) => H - 14 - ((v - (mn - pad)) / (mx - mn + 2 * pad)) * (H - 22);
  const X = (k) => (k / (N - 1)) * W;
  const path = vals.map((v, k) => (v == null ? '' : `${k && vals[k - 1] != null ? 'L' : 'M'}${X(k).toFixed(1)} ${Y(v).toFixed(1)}`)).join('');
  const bandR = band ? `<rect x="0" width="${W}" y="${Y(band[1]).toFixed(1)}" height="${(Y(band[0]) - Y(band[1])).toFixed(1)}" class="win"/><text x="${W - 2}" y="${(Y(band[1]) + 10).toFixed(1)}" text-anchor="end" class="lbl">${esc(bandLabel)}</text>` : '';
  const thr = [lo, hi].filter((x) => x != null).map((x) => `<line x1="0" x2="${W}" y1="${Y(x).toFixed(1)}" y2="${Y(x).toFixed(1)}" class="thr"/><text x="2" y="${(Y(x) - 3).toFixed(1)}" class="lbl">${n1(x, digits)} ${unit}</text>`).join('');
  return `<figure class="sci-chart"><figcaption><b>${esc(title)}</b>${note ? ` · ${esc(note)}` : ''}</figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${bandR}${thr}<path d="${path}" class="ln"/>
      <text x="0" y="${H - 2}" class="lbl">${N - 1} giorni prima</text><text x="${W}" y="${H - 2}" text-anchor="end" class="lbl">giorno scelto</text></svg></figure>`;
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

// la sezione "Perche' questo indice", completa
export function renderWhy({ r, s, i, sp, band, dateStr, shown, agg, parts = [], prefs = [], outing }) {
  if(sp.kind==='plant')return renderBotanicalWhy({r,sp,prefs});
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
    <details class="sci-technical"><summary>Calcolo e fonti dei 9 fattori</summary><div class="sci-technical-body">
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
    ${rainChart(s, i, sp)}
    ${lineChart({ vals: s.tmean.slice(Math.max(0, i - 35), i + 1), band: [sp.topt - sp.tsd, sp.topt + sp.tsd], bandLabel: 'ampiezza della curva euristica', unit: '°C', title: 'Temperatura media', note: 'conta la media dei 20 giorni prima' })}
    ${lineChart({ vals: s.soilm.slice(Math.max(0, i - 35), i + 1), lo: PARAMS.moistDry, hi: PARAMS.moistWet, unit: 'm³/m³', digits: 2, title: 'Umidità del suolo (3–9 cm)', note: 'sotto la linea bassa è secco, sopra l\'alta pienamente umido' })}
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
    // i link interni non cambiano la rotta: scorrono alla sezione
    box.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  } catch {
    box.innerHTML = '<p class="notice">Non riesco a caricare il metodo senza rete. Riprova quando sei di nuovo connesso.</p>';
  }
}
