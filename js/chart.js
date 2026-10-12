// Due grafici affiancati sullo stesso asse dei giorni (niente doppio asse Y):
// pioggia giornaliera (mm) e indice di fruttificazione (0-100), con crosshair condiviso.

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

const fmtDay = (d) => new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

export function renderCharts(container, { dates, rain, score, todayIndex, selectedIndex }) {
  container.innerHTML = '';
  // larghezza reale del contenitore: il testo resta leggibile anche su mobile
  const W = Math.max(280, Math.round(container.clientWidth || 640)), L = 34, R = 8;
  const n = dates.length;
  const step = (W - L - R) / n;
  const x = (i) => L + step * (i + 0.5);

  const wrap = document.createElement('div');
  wrap.className = 'chart';
  container.appendChild(wrap);
  const tip = document.createElement('div');
  tip.className = 'tip';
  wrap.appendChild(tip);

  const makePanel = (title, keys, H) => {
    const h = document.createElement('div');
    h.className = 'chart-title';
    h.innerHTML = `<span>${title}</span>` + keys.map((k) => `<span class="key">${k}</span>`).join('');
    wrap.appendChild(h);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': title });
    wrap.appendChild(svg);
    return svg;
  };

  // --- pioggia
  const H1 = 92, top1 = 6, bot1 = 18;
  const rmax = Math.max(10, Math.ceil(Math.max(...rain) / 10) * 10);
  const y1 = (v) => H1 - bot1 - (v / rmax) * (H1 - bot1 - top1);
  const svg1 = makePanel('Pioggia giornaliera (mm)', [
    '<span class="dot" style="background:var(--rain);border-radius:3px"></span>osservata',
    '<span class="dot" style="background:var(--rain-fc);border-radius:3px"></span>prevista',
  ], H1);
  const g1 = el('g', { class: 'axis' }, svg1);
  [0, rmax / 2, rmax].forEach((v) => {
    el('line', { x1: L, x2: W - R, y1: y1(v), y2: y1(v), class: 'gridline' }, g1);
    el('text', { x: L - 6, y: y1(v) + 3.5, 'text-anchor': 'end' }, g1).textContent = v;
  });
  const bw = Math.max(2, step * 0.62);
  rain.forEach((v, i) => {
    if (!v) return;
    const h = Math.max(1, y1(0) - y1(v));
    const r = Math.min(2, bw / 2, h / 2);
    const x0 = x(i) - bw / 2, yTop = y1(0) - h;
    el('path', {
      d: `M${x0},${y1(0)} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + bw - r} Q${x0 + bw},${yTop} ${x0 + bw},${yTop + r} V${y1(0)} Z`,
      fill: i > todayIndex ? 'var(--rain-fc)' : 'var(--rain)',
    }, svg1);
  });

  // --- indice
  const H2 = 118, top2 = 6, bot2 = 22;
  const y2 = (v) => H2 - bot2 - (v / 100) * (H2 - bot2 - top2);
  const svg2 = makePanel('Indice di fruttificazione (0–100)', [
    '<svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="var(--line)" stroke-width="2"/></svg>da dati osservati',
    '<svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 3"/></svg>con previsioni',
  ], H2);
  const g2 = el('g', { class: 'axis' }, svg2);
  [0, 30, 60, 100].forEach((v) => {
    el('line', { x1: L, x2: W - R, y1: y2(v), y2: y2(v), class: 'gridline' }, g2);
    el('text', { x: L - 6, y: y2(v) + 3.5, 'text-anchor': 'end' }, g2).textContent = v;
  });
  // etichette date (circa ogni 7 giorni, sempre "oggi")
  for (let i = 0; i < n; i++) {
    if (i !== todayIndex && (todayIndex - i) % 7 !== 0) continue;
    el('text', { x: x(i), y: H2 - 6, 'text-anchor': 'middle' }, g2).textContent = i === todayIndex ? 'oggi' : fmtDay(dates[i]);
  }
  const pts = score.map((v, i) => [x(i), y2(v)]);
  const path = (from, to) => pts.slice(from, to + 1).map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
  el('path', { d: path(0, todayIndex), fill: 'none', stroke: 'var(--line)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg2);
  el('path', { d: path(todayIndex, n - 1), fill: 'none', stroke: 'var(--line)', 'stroke-width': 2, 'stroke-dasharray': '4 3', 'stroke-linejoin': 'round' }, svg2);
  if (selectedIndex != null) {
    el('circle', { cx: pts[selectedIndex][0], cy: pts[selectedIndex][1], r: 4.5, fill: 'var(--line)', stroke: 'var(--surface)', 'stroke-width': 2 }, svg2);
  }

  // linea "oggi" + crosshair su entrambi i pannelli
  const cross = [];
  [[svg1, H1 - bot1], [svg2, H2 - bot2]].forEach(([svg, yb]) => {
    el('line', { x1: x(todayIndex), x2: x(todayIndex), y1: 0, y2: yb, class: 'today' }, svg);
    const c = el('line', { x1: 0, x2: 0, y1: 0, y2: yb, stroke: 'var(--text)', 'stroke-width': 1, opacity: 0 }, svg);
    cross.push(c);
    const hit = el('rect', { x: L, y: 0, width: W - L - R, height: yb, fill: 'transparent' }, svg);
    const move = (ev) => {
      const box = svg.getBoundingClientRect();
      const px = ((ev.clientX - box.left) / box.width) * W;
      const i = Math.max(0, Math.min(n - 1, Math.floor((px - L) / step)));
      cross.forEach((cl) => { cl.setAttribute('x1', x(i)); cl.setAttribute('x2', x(i)); cl.setAttribute('opacity', 0.35); });
      const wb = wrap.getBoundingClientRect();
      tip.style.left = `${ev.clientX - wb.left}px`;
      tip.style.top = `${box.top - wb.top - 4}px`;
      tip.innerHTML = `<b>${fmtDay(dates[i])}</b>${i > todayIndex ? ' (previsione)' : ''}<br>Pioggia ${rain[i].toFixed(1)} mm · Indice ${score[i]}`;
      tip.style.opacity = 1;
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerleave', () => { tip.style.opacity = 0; cross.forEach((cl) => cl.setAttribute('opacity', 0)); });
  });
}
