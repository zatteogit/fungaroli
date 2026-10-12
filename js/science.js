// La scienza dietro l'indice, per chi vuole approfondire: la "ricetta" fattore per fattore con i numeri veri del giorno,
// i grafici con le soglie della specie, il profilo della specie e la pagina del metodo (docs/metodo-scientifico.md).
import { PARAMS } from './model.js';

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
    { k: 'Stagione', v: r.season, tags: ['eur'], why: `${/^[ao]/.test(month) ? 'ad' : 'a'} ${month} ${r.season >= 0.8 ? 'è nel suo periodo' : r.season >= 0.3 ? 'è ai margini del periodo' : 'è fuori stagione'} (curva mensile della specie).` },
    { k: 'Bosco alla quota', v: r.habitat, tags: ['dato', 'eur'], why: `a ${band} m il ${pct(r.suitableShare)} del bosco è adatto alla specie (Carta Forestale, ±${PARAMS.bandHalfWidth} m). Ne basta il 45% per il massimo.` },
    { k: 'Quota', v: r.elev, tags: ['eur'], why: band >= lo && band <= hi ? `${band} m è dentro l'intervallo della specie (${lo}–${hi} m).` : `${band} m è fuori dall'intervallo ${lo}–${hi} m: il fattore cala di 1/200 per metro.` },
    { k: 'Pioggia', v: r.rain, tags: ['lett', 'eur'], why: `${n0(r.effRain)} mm tra ${lagMax} e ${lagMin} giorni prima (la finestra in cui la pioggia "diventa" funghi), evento massimo ${n0(r.maxEvent)} mm${r.triggered ? ': innesco sì' : ` (sotto gli ${PARAMS.triggerMm} mm dell'innesco: vale meno)`}; ${n0(r.r30)} mm nei 30 giorni.` },
    { k: 'Temperatura', v: r.temp, tags: [sp.id === 'edulis' ? 'lett' : 'eur'], why: `media dei 20 giorni prima ${n1(r.t20)} °C; l'ottimo della specie è ${n1(sp.topt, 0)} ± ${n1(sp.tsd)} °C (curva a campana).` },
    { k: 'Umidità del suolo', v: r.moist, tags: ['dato', 'eur'], why: r.sm == null ? 'dato non disponibile: vale 0,5.' : `${n1(r.sm, 2)} m³/m³ a 3–9 cm negli ultimi 3 giorni (secco sotto ${n1(PARAMS.moistDry, 2)}, pieno sopra ${n1(PARAMS.moistWet, 2)}).` },
    { k: 'Gelo', v: r.frost, tags: ['eur'], why: r.frost < 1 ? `minima di ${n1(r.minT)} °C negli ultimi 5 giorni: sotto ${PARAMS.frostC} °C i carpofori si fermano.` : `minima ${n1(r.minT)} °C negli ultimi 5 giorni: nessuna gelata.` },
    { k: 'Caldo', v: r.heat, tags: ['eur'], why: r.heat < 1 ? `massima di ${n1(r.maxT)} °C negli ultimi 3 giorni: sopra ${PARAMS.heatC} °C lettiera e funghi seccano.` : `massima ${n1(r.maxT)} °C negli ultimi 3 giorni: niente caldo eccessivo.` },
    { k: 'Shock termico', v: r.shock, tags: ['eur'], bonus: true, why: r.shock > 1 ? `calo di ${n1(r.drop)} °C nella media tra 4 e 14 giorni fa: spesso fa partire le nascite (bonus).` : `nessun calo di almeno ${PARAMS.shockDropC} °C tra 4 e 14 giorni fa: nessun bonus.` },
  ];
}

const level = (v) => (v >= 0.8 ? 'hi' : v >= 0.5 ? 'mid' : 'lo');

// grafici piccoli, SVG in linea: niente librerie, leggibili su telefono
function rainChart(s, i, sp) {
  const from = Math.max(0, i - 35), N = i - from + 1, W = 320, H = 96, bw = W / N;
  const vals = s.p.slice(from, i + 1).map((v) => v ?? 0);
  const max = Math.max(PARAMS.triggerMm * 1.6, ...vals);
  const Y = (v) => H - 14 - (v / max) * (H - 24);
  const [lagMin, lagMax] = sp.lag;
  const a = Math.max(from, i - lagMax) - from, b = Math.max(from, i - lagMin) - from;
  const bars = vals.map((v, k) => `<rect x="${(k * bw + 0.6).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${(bw - 1.2).toFixed(1)}" height="${(H - 14 - Y(v)).toFixed(1)}" class="${k + from > s.todayIndex ? 'fc' : k >= a && k <= b ? 'in' : ''}"/>`).join('');
  return `<figure class="sci-chart"><figcaption><b>Pioggia giornaliera</b> · la fascia è la finestra di latenza (${lagMax}–${lagMin} giorni prima)</figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pioggia degli ultimi ${N} giorni: ${n0(r30sum(s, i))} mm negli ultimi 30">
      <rect x="${(a * bw).toFixed(1)}" y="0" width="${((b - a + 1) * bw).toFixed(1)}" height="${H - 14}" class="win"/>
      <line x1="0" x2="${W}" y1="${Y(PARAMS.triggerMm).toFixed(1)}" y2="${Y(PARAMS.triggerMm).toFixed(1)}" class="thr"/>
      <text x="${W - 2}" y="${(Y(PARAMS.triggerMm) - 3).toFixed(1)}" text-anchor="end" class="lbl">${PARAMS.triggerMm} mm innesco</text>
      <g class="bars">${bars}</g>
      <text x="0" y="${H - 2}" class="lbl">${N - 1} giorni prima</text><text x="${W}" y="${H - 2}" text-anchor="end" class="lbl">giorno scelto</text>
    </svg></figure>`;
}
const r30sum = (s, i) => { let t = 0; for (let k = Math.max(0, i - 30); k < i; k++) t += s.p[k] ?? 0; return t; };

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
    <p class="sci-h">Il profilo di ${esc(sp.name.toLowerCase())} nel modello</p>
    <dl class="sci-params">
      <div><dt>Finestra di latenza</dt><dd>${sp.lag[0]}–${sp.lag[1]} giorni dopo la pioggia</dd></div>
      <div><dt>Pioggia di riferimento</dt><dd>${sp.eref} mm (a questa quantità il fattore pioggia è al 63%)</dd></div>
      <div><dt>Temperatura ottimale</dt><dd>${n1(sp.topt, 0)} ± ${n1(sp.tsd)} °C (media di 20 giorni)</dd></div>
      <div><dt>Quote</dt><dd>${sp.elev[0]}–${sp.elev[1]} m</dd></div>
      ${sp.frostTolerant ? '<div><dt>Gelo</dt><dd>tollerante: il gelo pesa meno</dd></div>' : ''}
    </dl>
    <p class="sci-sub">Mesi (peso stagionale)</p><div class="sp-months" aria-hidden="true">${months}</div>
    <p class="sci-sub">Boschi (idoneità da 0 a 1)</p><ul class="sp-forest">${forest}</ul>
    ${sp.evidence ? `<p class="small muted">Origine dei parametri: ${esc(sp.evidence)}</p>` : ''}
  </div>`;
}

// la sezione "Perche' questo indice", completa
export function renderWhy({ r, s, i, sp, band, dateStr, shown, prefs = [], outing }) {
  const rows = factorRows(r, sp, band, dateStr);
  const product = Math.min(1, rows.reduce((a, x) => a * x.v, 1));
  const weakest = rows.filter((x) => !x.bonus).reduce((a, x) => (x.v < a.v ? x : a));
  const raw = Math.round(product * 100);
  const fc = r.confidence < 1 ? `<p class="sci-note"><b>Affidabilità ${pct(r.confidence)}.</b> Parte della pioggia che conta è prevista, non ancora caduta: più il giorno è lontano, meno ci si può fidare.</p>` : '';
  return `
    <p class="sci-lede">L'indice è il <b>prodotto</b> di nove fattori, ognuno tra 0 e 1. Basta un fattore basso per abbassare tutto: oggi pesa di più <b>${esc(weakest.k.toLowerCase())}</b> (${n1(weakest.v, 2)}).</p>
    <ol class="sci-factors">${rows.map((x) => `
      <li class="${x === weakest ? 'weak' : ''}">
        <div class="sf-top"><span class="sf-k">${esc(x.k)}</span><span class="sf-bar lv-${x.bonus ? (x.v > 1 ? 'hi' : 'na') : level(x.v)}"><i style="width:${Math.min(100, x.v * 100)}%"></i></span><b class="sf-v">×${n1(x.v, 2)}</b></div>
        <p class="sf-why">${esc(x.why)} ${x.tags.map(tag).join(' ')}</p>
      </li>`).join('')}
    </ol>
    <p class="sci-eq"><span>100 × ${rows.map((x) => n1(x.v, 2)).join(' × ')}</span> = <b>${raw}</b></p>
    ${prefs.length ? `<p class="sci-note">Con le tue preferenze (${prefs.map((p) => `${esc(p.label)} ×${n1(p.mult, 2)}`).join(', ')}) l'indice mostrato è <b>${shown}</b>.</p>` : ''}
    ${outing ? `<p class="sci-note"><b>Il meteo dell'uscita non cambia l'indice</b>: cambia solo l'ordine delle zone (×${n1(outing, 2)} in classifica), perché i funghi nascono lo stesso anche se quel giorno piove.</p>` : ''}
    ${fc}
    ${rainChart(s, i, sp)}
    ${lineChart({ vals: s.tmean.slice(Math.max(0, i - 35), i + 1), band: [sp.topt - sp.tsd, sp.topt + sp.tsd], bandLabel: `ottimo ${n1(sp.topt, 0)} ± ${n1(sp.tsd)} °C`, unit: '°C', title: 'Temperatura media', note: 'conta la media dei 20 giorni prima' })}
    ${lineChart({ vals: s.soilm.slice(Math.max(0, i - 35), i + 1), lo: PARAMS.moistDry, hi: PARAMS.moistWet, unit: 'm³/m³', digits: 2, title: 'Umidità del suolo (3–9 cm)', note: 'sotto la linea bassa è secco, sopra l\'alta pienamente umido' })}
    ${speciesProfile(sp)}
    <p class="sci-more"><a href="#/metodo">Il metodo completo: formule, fonti e limiti ›</a></p>`;
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
  const lines = md.replace(/\r/g, '').split('\n');
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
    box.innerHTML = `<nav class="md-toc" aria-label="Indice del metodo"><p class="sci-h">In questa pagina</p><ol>${toc.map(([id, t]) => `<li><a href="#m-${id}" data-jump="m-${id}">${inline(t)}</a></li>`).join('')}</ol></nav><article class="md">${html}</article>`;
    // i link interni non cambiano la rotta: scorrono alla sezione
    box.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  } catch {
    box.innerHTML = '<p class="notice">Non riesco a caricare il metodo senza rete. Lo trovi anche nel repository, in docs/metodo-scientifico.md.</p>';
  }
}
