// Fronda · grafico giornaliero condiviso. Un solo componente per tutti i grafici della scheda zona:
// stesso asse dei giorni, stessi margini, stessa tipografia (testo in pixel reali, non scalato), griglia
// recessiva, etichette che non toccano i dati, tooltip al tocco/hover/tastiera. Niente librerie.
// Le funzioni pure in cima (scale, tacche, collisioni) sono testate in tests/viz.test.mjs.

// ---------------------------------------------------------------- funzioni pure

export const scaleLinear = (d0, d1, r0, r1) => {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v) => r0 + (v - d0) * k;
};

/** Passo «tondo» (1, 2, 2,5, 5 × 10^n) per circa `count` intervalli. */
export function niceStep(span, count = 3) {
  if (!(span > 0)) return 1;
  const raw = span / Math.max(1, count), p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

/** Dominio arrotondato e tacche tonde che lo coprono. */
export function niceTicks(min, max, count = 3) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1] };
  if (max === min) { max = min + 1; }
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { min: lo, max: hi, ticks };
}

/** Due rettangoli {x,y,w,h} si toccano? `pad` allarga il primo su tutti i lati. */
export const overlaps = (a, b, pad = 0) =>
  a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;

/**
 * Sceglie dove mettere le etichette senza toccare dati né altre etichette.
 * labels: [{ id, candidates: [{x,y,w,h}, …] }] in ordine di priorità (la prima vince).
 * obstacles: rettangoli dei dati; bounds: area utile {x,y,w,h}.
 * Ritorna una Map id → rettangolo scelto; le etichette senza posto non compaiono (vanno nella didascalia).
 */
export function placeLabels(labels, obstacles = [], bounds = null, pad = 2) {
  const placed = new Map(), taken = [];
  const inside = (r) => !bounds || (r.x >= bounds.x && r.y >= bounds.y && r.x + r.w <= bounds.x + bounds.w && r.y + r.h <= bounds.y + bounds.h);
  for (const l of labels) {
    const spot = l.candidates.find((c) => inside(c) && !obstacles.some((o) => overlaps(c, o, pad)) && !taken.some((t) => overlaps(c, t, pad)));
    if (spot) { placed.set(l.id, spot); taken.push(spot); }
  }
  return placed;
}

/**
 * Tacche delle date: «oggi» sempre, poi ogni 7 giorni a partire da oggi, scartando quelle che si
 * sovrappongono. widthOf(i) dà la larghezza in px dell'etichetta i; x(i) il centro; lo/hi i bordi del
 * grafico (le etichette vicino ai bordi vengono spostate dentro prima del controllo).
 */
export function dayTicks(n, todayIndex, x, widthOf, gap = 10, lo = -Infinity, hi = Infinity) {
  const order = [];
  if (todayIndex >= 0 && todayIndex < n) order.push(todayIndex);
  for (let i = 0; i < n; i++) if (i !== todayIndex && (todayIndex - i) % 7 === 0) order.push(i);
  const kept = [];
  for (const i of order) {
    const w = widthOf(i), r = { x: Math.max(lo, Math.min(hi - w, x(i) - w / 2)), y: 0, w, h: 1 };
    if (!kept.some((k) => overlaps(r, k.r, gap))) kept.push({ i, r });
  }
  return kept.map((k) => k.i).sort((a, b) => a - b);
}

/** Giorno più vicino a una coordinata x (il crosshair «trova il giorno»: non serve centrare la barra). */
export const nearestIndex = (px, left, step, n) => Math.max(0, Math.min(n - 1, Math.floor((px - left) / step)));

// stima della larghezza del testo quando non c'è un canvas (test, stampa): Manrope ≈ 0,56 em per carattere
let ctx2d = null;
export function textWidth(text, size = 11, weight = 500) {
  try {
    if (!ctx2d && typeof document !== 'undefined') ctx2d = document.createElement('canvas').getContext('2d');
    if (ctx2d) {
      const family = getComputedStyle(document.documentElement).getPropertyValue('--font-body') || 'sans-serif';
      ctx2d.font = `${weight} ${size}px ${family}`;
      return Math.ceil(ctx2d.measureText(String(text)).width);
    }
  } catch { /* stima sotto */ }
  return Math.ceil(String(text).length * size * 0.56);
}

// ---------------------------------------------------------------- componente

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const html = (tag, cls, parent, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
};
export const fmtDay = (d, long = false) => new Date(d + 'T12:00:00').toLocaleDateString('it-IT', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });

const AXIS = 11;     // px: testo d'asse, più piccolo del titolo (15) e della risposta (14)
const TOP = 20;      // fascia delle annotazioni sopra il grafico: i dati non ci entrano mai
const BOTTOM = 22;   // asse dei giorni

/**
 * Disegna un grafico giornaliero dentro `figure` (un <figure class="viz">).
 * spec: {
 *   kind: 'bars' | 'line', name, unit, values[], dates[], todayIndex, selectedIndex,
 *   format(v) → testo del valore, describe?(v) → parola (es. «umido»),
 *   y: { min, max, ticks: [{ v, label }] },
 *   window?: { from, to, label }       finestra che conta per il giorno scelto (indici del dominio)
 *   band?: { lo, hi, label }           fascia di riferimento orizzontale (temperatura)
 *   zones?: [{ lo, hi, label }]        fasce a parole (suolo), etichette nel margine sinistro
 *   threshold?: { v, label }           linea di soglia con etichetta posizionata senza collisioni
 *   height?: altezza dell'area dati
 * }
 */
export function renderViz(figure, spec) {
  const plotBox = figure.querySelector('.viz-plot') || html('div', 'viz-plot', figure);
  const keyBox = figure.querySelector('.viz-key');
  plotBox.textContent = '';
  const W = Math.max(260, Math.round(plotBox.clientWidth || figure.clientWidth || 320));
  const n = spec.dates.length;
  const tickLabels = spec.zones ? spec.zones.map((z) => z.label) : spec.y.ticks.map((t) => t.label);
  const L = spec.left ?? Math.max(24, ...tickLabels.map((t) => textWidth(t, AXIS))) + 8, R = 6;
  const PH = spec.height || 104, H = TOP + PH + BOTTOM;
  const step = (W - L - R) / n;
  const x = (i) => L + step * (i + 0.5);
  const y = scaleLinear(spec.y.min, spec.y.max, TOP + PH, TOP);
  const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'viz-svg', role: 'img', 'aria-label': spec.summary || spec.name, focusable: 'false' }, plotBox);

  // fasce e finestre dietro ai dati
  if (spec.window) {
    const a = Math.max(0, spec.window.from), b = Math.min(n - 1, spec.window.to);
    if (b >= a) el('rect', { x: L + a * step, y: TOP, width: (b - a + 1) * step, height: PH, class: 'viz-window' }, svg);
  }
  if (spec.band) el('rect', { x: L, y: y(Math.min(spec.y.max, spec.band.hi)), width: W - L - R, height: Math.max(0, y(Math.max(spec.y.min, spec.band.lo)) - y(Math.min(spec.y.max, spec.band.hi))), class: 'viz-band' }, svg);

  // griglia recessiva e tacche
  const grid = el('g', { class: 'viz-grid' }, svg);
  if (spec.zones) {
    spec.zones.forEach((z) => {
      const top = y(Math.min(spec.y.max, z.hi)), bot = y(Math.max(spec.y.min, z.lo));
      if (z.lo > spec.y.min) el('line', { x1: L, x2: W - R, y1: bot, y2: bot, class: 'viz-gridline' }, grid);
      el('text', { x: L - 8, y: (top + bot) / 2 + 4, 'text-anchor': 'end', class: 'viz-tick' }, grid).textContent = z.label;
    });
  } else {
    spec.y.ticks.forEach((t) => {
      el('line', { x1: L, x2: W - R, y1: y(t.v), y2: y(t.v), class: t.v === spec.y.min ? 'viz-baseline' : 'viz-gridline' }, grid);
      el('text', { x: L - 8, y: y(t.v) + 4, 'text-anchor': 'end', class: 'viz-tick' }, grid).textContent = t.label;
    });
  }
  if (spec.zones) el('line', { x1: L, x2: W - R, y1: TOP + PH, y2: TOP + PH, class: 'viz-baseline' }, grid);

  // asse dei giorni: «oggi» e una data a settimana, senza sovrapposizioni
  const dayLabel = (i) => (i === spec.todayIndex ? 'oggi' : fmtDay(spec.dates[i]));
  for (const i of dayTicks(n, spec.todayIndex, x, (i) => textWidth(dayLabel(i), AXIS), 10, L, W - R)) {
    const w = textWidth(dayLabel(i), AXIS);
    const cx = Math.max(L + w / 2, Math.min(W - R - w / 2, x(i)));
    el('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'viz-tick' }, grid).textContent = dayLabel(i);
  }

  // dati
  const obstacles = [];
  const data = el('g', { class: 'viz-data' }, svg);
  const fc = (i) => i > spec.todayIndex;
  if (spec.kind === 'bars') {
    const bw = Math.max(2, Math.min(24, step - 2));
    spec.values.forEach((v, i) => {
      if (!Number.isFinite(v)) { el('circle', { cx: x(i), cy: TOP + PH - 3, r: 2, class: 'viz-missing' }, data); return; }
      if (v <= 0) return;
      const h = Math.max(1.5, y(spec.y.min) - y(Math.min(v, spec.y.max)));
      const r = Math.min(4, bw / 2, h);
      const x0 = x(i) - bw / 2, yt = TOP + PH - h;
      el('path', { d: `M${x0},${TOP + PH}V${yt + r}Q${x0},${yt} ${x0 + r},${yt}H${x0 + bw - r}Q${x0 + bw},${yt} ${x0 + bw},${yt + r}V${TOP + PH}Z`, class: `viz-bar${fc(i) ? ' is-forecast' : ''}${i === spec.selectedIndex ? ' is-selected' : ''}` }, data);
      obstacles.push({ x: x0, y: yt, w: bw, h });
    });
  } else {
    const pts = spec.values.map((v, i) => (Number.isFinite(v) ? [x(i), y(Math.max(spec.y.min, Math.min(spec.y.max, v)))] : null));
    const seg = (from, to) => pts.slice(from, to + 1).map((p, k, a) => (p ? `${k && a[k - 1] ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}` : '')).join('');
    const split = Math.min(n - 1, Math.max(0, spec.todayIndex));
    el('path', { d: seg(0, split), class: 'viz-line' }, data);
    if (split < n - 1) el('path', { d: seg(split, n - 1), class: 'viz-line is-forecast' }, data);
    // ostacoli: piccoli riquadri lungo la linea, per tenere lontane le etichette
    pts.forEach((p, i) => { if (p && pts[i + 1]) { const [x1, y1] = p, [x2, y2] = pts[i + 1]; obstacles.push({ x: Math.min(x1, x2) - 2, y: Math.min(y1, y2) - 2, w: Math.abs(x2 - x1) + 4, h: Math.abs(y2 - y1) + 4 }); } });
    const sel = pts[spec.selectedIndex];
    if (sel) { el('circle', { cx: sel[0], cy: sel[1], r: 4.5, class: 'viz-dot' }, data); obstacles.push({ x: sel[0] - 7, y: sel[1] - 7, w: 14, h: 14 }); }
  }

  // giorno scelto e oggi: righe sottili; le parole stanno nella fascia alta, lontano dai dati
  const marks = el('g', { class: 'viz-marks' }, svg);
  const vline = (i, cls) => el('line', { x1: x(i), x2: x(i), y1: TOP, y2: TOP + PH, class: cls }, marks);
  if (spec.todayIndex !== spec.selectedIndex && spec.todayIndex >= 0 && spec.todayIndex < n) vline(spec.todayIndex, 'viz-today');
  if (spec.selectedIndex >= 0 && spec.selectedIndex < n) vline(spec.selectedIndex, 'viz-selected');

  // etichette: prima quelle della fascia alta, poi la soglia vicino alla sua linea
  const lab = [], fh = AXIS + 3;
  const topSpot = (text, cx) => { const w = textWidth(text, AXIS); return [{ x: Math.max(L, Math.min(W - R - w, cx - w / 2)), y: 2, w, h: fh }]; };
  if (spec.selectedIndex >= 0 && spec.selectedIndex < n) lab.push({ id: 'sel', text: spec.selectedIndex === spec.todayIndex ? 'oggi · giorno scelto' : 'giorno scelto', candidates: topSpot(spec.selectedIndex === spec.todayIndex ? 'oggi · giorno scelto' : 'giorno scelto', x(spec.selectedIndex)) });
  if (spec.window?.label) { const a = Math.max(0, spec.window.from), b = Math.min(n - 1, spec.window.to); lab.push({ id: 'win', text: spec.window.label, candidates: topSpot(spec.window.label, (x(a) + x(b)) / 2) }); }
  if (spec.todayIndex !== spec.selectedIndex && spec.todayIndex >= 0 && spec.todayIndex < n) lab.push({ id: 'today', text: 'oggi', candidates: topSpot('oggi', x(spec.todayIndex)) });
  const near = (id, text, yy) => {
    const w = textWidth(text, AXIS), cands = [];
    for (const yy2 of [yy - fh - 1, yy + 2]) for (const xx of [L + 4, W - R - w - 4, (L + W - R - w) / 2]) cands.push({ x: xx, y: yy2, w, h: fh });
    lab.push({ id, text, candidates: cands });
  };
  if (spec.threshold) near('thr', spec.threshold.label, y(spec.threshold.v));
  if (spec.band?.label) near('band', spec.band.label, y(Math.min(spec.y.max, spec.band.hi)) + fh + 2);
  const placed = placeLabels(lab, obstacles, { x: L, y: 0, w: W - L - R, h: TOP + PH });
  if (spec.threshold) el('line', { x1: L, x2: W - R, y1: y(spec.threshold.v), y2: y(spec.threshold.v), class: 'viz-threshold' }, marks);
  const notes = el('g', { class: 'viz-notes' }, svg);
  for (const l of lab) {
    const r = placed.get(l.id);
    if (!r) continue;
    el('text', { x: r.x, y: r.y + fh - 3, class: 'viz-note', 'data-label': l.id }, notes).textContent = l.text;
  }
  // ciò che non ha trovato posto finisce nella legenda sotto il grafico, mai sopra i dati
  if (keyBox) keyBox.querySelectorAll('[data-fallback]').forEach((k) => { k.hidden = placed.has(k.dataset.fallback); });

  // interazione: il crosshair trova il giorno, il tooltip dice valore e data
  const tip = figure.querySelector('.viz-tip') || html('div', 'viz-tip', figure);
  tip.setAttribute('role', 'status');
  tip.setAttribute('aria-live', 'polite');
  const cross = el('line', { x1: 0, x2: 0, y1: TOP, y2: TOP + PH, class: 'viz-cross' }, svg);
  const hits = el('g', { class: 'viz-hits' }, svg);
  for (let i = 0; i < n; i++) el('rect', { x: L + i * step, y: 0, width: step, height: H, class: 'viz-hit', 'data-i': i }, hits);
  let current = null;
  const show = (i) => {
    current = i;
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.classList.add('on');
    tip.textContent = '';
    const v = spec.values[i];
    html('b', 'viz-tip-v', tip, Number.isFinite(v) ? spec.format(v) : 'dato assente');
    if (Number.isFinite(v) && spec.describe) html('span', 'viz-tip-w', tip, spec.describe(v));
    html('span', 'viz-tip-d', tip, `${fmtDay(spec.dates[i], true)}${i === spec.todayIndex ? ' · oggi' : fc(i) ? ' · previsione' : ''}`);
    const fw = figure.clientWidth, tw = tip.offsetWidth || 120;
    const px = (x(i) / W) * plotBox.clientWidth + plotBox.offsetLeft;
    tip.style.left = `${Math.max(0, Math.min(fw - tw, px - tw / 2))}px`;
    tip.style.top = `${plotBox.offsetTop - 4}px`;
    tip.classList.add('on');
  };
  const hide = () => { current = null; cross.classList.remove('on'); tip.classList.remove('on'); };
  const fromEvent = (ev) => { const b = svg.getBoundingClientRect(); return nearestIndex(((ev.clientX - b.left) / b.width) * W, L, step, n); };
  svg.addEventListener('pointermove', (ev) => show(fromEvent(ev)));
  svg.addEventListener('pointerdown', (ev) => show(fromEvent(ev)));
  svg.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') hide(); });
  plotBox.tabIndex = 0;
  plotBox.setAttribute('role', 'group');
  plotBox.setAttribute('aria-label', `${spec.name}: usa le frecce per scorrere i giorni`);
  plotBox.onkeydown = (ev) => {
    const k = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[ev.key];
    if (ev.key === 'Escape') { hide(); return; }
    if (k == null) return;
    ev.preventDefault();
    const base = current ?? spec.selectedIndex ?? 0;
    show(Math.max(0, Math.min(n - 1, Number.isFinite(k) ? base + k : k < 0 ? 0 : n - 1)));
  };
  plotBox.onfocus = () => { if (current == null) show(Math.max(0, Math.min(n - 1, spec.selectedIndex ?? n - 1))); };
  plotBox.onblur = hide;
  return { width: W, height: H, placed };
}
