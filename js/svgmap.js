import { formatIndex } from './model.js';
// Mappa schematica in SVG (usata quando le tile esterne non sono disponibili, es. Artifact).
// Proiezione equirettangolare locale: abbastanza fedele su ~60 km.

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

const TOWNS = [
  { name: 'Leonessa', lat: 42.5632, lon: 12.9638 },
  { name: 'Amatrice', lat: 42.6321, lon: 13.2902 },
  { name: 'Antrodoco', lat: 42.4033, lon: 13.1354 },
  { name: 'Cittaducale', lat: 42.3870, lon: 12.9470 },
  { name: 'Fiamignano', lat: 42.2650, lon: 13.1264 },
  { name: 'Poggio Mirteto', lat: 42.2660, lon: 12.6870 },
];

export function renderSvgMap(container, { zones, origin, items, onSelect }) {
  container.innerHTML = '';
  const pts = [...zones.map((z) => [z.lat, z.lon]), [origin.lat, origin.lon]];
  const lat0 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180), ky = 110.57; // km per grado
  const pad = 9; // km
  const xs = pts.map((p) => p[1] * kx), ys = pts.map((p) => p[0] * ky);
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const W = 600, H = Math.round((W * (maxY - minY)) / (maxX - minX));
  const s = W / (maxX - minX); // px per km
  const P = (lat, lon) => [(lon * kx - minX) * s, (maxY - lat * ky) * s];

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'svgmap', role: 'group', 'aria-label': `Mappa schematica delle zone con partenza da ${origin.name}` }, container);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: 'var(--surface-2)' }, svg);

  // anelli di distanza in linea d'aria da Rieti
  const [ox, oy] = P(origin.lat, origin.lon);
  for (const km of [10, 20, 30, 40]) {
    el('circle', { cx: ox, cy: oy, r: km * s, fill: 'none', stroke: 'var(--border)', 'stroke-dasharray': '3 4' }, svg);
    el('text', { x: ox + km * s * 0.707 + 3, y: oy - km * s * 0.707 - 3, class: 'ring-label' }, svg).textContent = `${km} km`;
  }

  for (const t of TOWNS) {
    const [x, y] = P(t.lat, t.lon);
    if (x < 0 || x > W || y < 0 || y > H) continue;
    el('circle', { cx: x, cy: y, r: 2.5, fill: 'var(--muted)' }, svg);
    el('text', { x: x + 5, y: y + 4, class: 'town-label' }, svg).textContent = t.name;
  }

  // etichette: posizionamento greedy per evitare sovrapposizioni
  const placed = [];
  for (const it of items) {
    const z = it.z;
    const [x, y0] = P(z.lat, z.lon);
    const name0 = z.name.split(/[/–(]/)[0].trim();
    const w0 = 14 + (`${it.label||formatIndex(it.score)}  ${name0}`).length * 6.4;
    let y = y0;
    const hit = (yy) => placed.some((b) => Math.abs(b.x - x) < (b.w + w0) / 2 + 4 && Math.abs(b.y - yy) < 26);
    for (let k = 1; hit(y) && k < 8; k++) y = y0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 26;
    placed.push({ x, y, w: w0 });
    it.labelY = y;
  }

  for (const it of items) {
    const z = it.z;
    const [x, yc] = P(z.lat, z.lon);
    const y = it.labelY;
    const g = el('g', { class: 'zone' + (it.selected ? ' sel' : ''), tabindex: 0, role: 'button', 'aria-label': `${z.name}, ${it.label||"indice "+formatIndex(it.score)}` }, svg);
    el('circle', {
      cx: x, cy: yc, r: (z.radius_m / 1000) * s, fill: it.color, 'fill-opacity': 0.55,
      stroke: it.selected ? 'var(--text)' : it.color, 'stroke-width': it.selected ? 3 : 1.5,
    }, g);
    const label = el('g', { transform: `translate(${x},${y})` }, g);
    const name = z.name.split(/[/–(]/)[0].trim();
    const text = `${it.label||formatIndex(it.score)}  ${name}`;
    const w = 14 + text.length * 6.4;
    el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 7, fill: 'var(--surface)', stroke: 'var(--border)' }, label);
    el('circle', { cx: -w / 2 + 10, cy: 0, r: 4.5, fill: it.color }, label);
    el('text', { x: -w / 2 + 19, y: 4.5, class: 'zone-text' }, label).textContent = text;
    const title = el('title', {}, g);
    title.textContent = it.tooltip;
    g.addEventListener('click', () => onSelect(z.id));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(z.id); } });
  }

  // Rieti
  el('circle', { cx: ox, cy: oy, r: 6, fill: 'var(--accent)', stroke: 'var(--surface)', 'stroke-width': 2 }, svg);
  el('text', { x: ox + 9, y: oy + 5, class: 'origin-label' }, svg).textContent = origin.name;
}
