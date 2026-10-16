// Leggibilità: funzioni pure per il contrasto dei testi (WCAG 2.x), lettura dei PNG
// degli screenshot e raccolta dei testi visibili nella pagina.
// Usate da tools/visual-audit.mjs, da tests/browser/legibility.spec.mjs e dai test unitari.
import { inflateSync } from 'node:zlib';

/** Colore CSS calcolato → [r, g, b, a] (canali 0–255, alfa 0–1). null se non riconosciuto. */
export function parseCssColor(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  if (s === 'transparent') return [0, 0, 0, 0];
  if (s === 'white') return [255, 255, 255, 1];
  if (s === 'black') return [0, 0, 0, 1];
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return [...n, h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  }
  const fn = s.match(/^(rgba?|color)\((.*)\)$/);
  if (!fn) return null;
  let body = fn[2].trim(), space = 'srgb';
  if (fn[1] === 'color') {
    const m = body.match(/^([a-z0-9-]+)\s+(.*)$/);
    if (!m || (m[1] !== 'srgb' && m[1] !== 'srgb-linear')) return null;
    space = m[1]; body = m[2];
  }
  const [chan, alphaPart] = body.split('/').map((x) => x.trim());
  const parts = chan.split(/[\s,]+/).filter(Boolean);
  let alpha = alphaPart ?? (parts.length === 4 ? parts.pop() : '1');
  if (parts.length !== 3) return null;
  const num = (x, scale) => (x.endsWith('%') ? (parseFloat(x) / 100) * scale : parseFloat(x));
  let rgb = parts.map((x) => num(x, fn[1] === 'color' ? 1 : 255));
  if (fn[1] === 'color') {
    if (space === 'srgb-linear') rgb = rgb.map((v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
    rgb = rgb.map((v) => v * 255);
  }
  alpha = alpha.endsWith('%') ? parseFloat(alpha) / 100 : parseFloat(alpha);
  if (rgb.some((v) => !Number.isFinite(v)) || !Number.isFinite(alpha)) return null;
  return [...rgb.map((v) => Math.max(0, Math.min(255, v))), Math.max(0, Math.min(1, alpha))];
}

const lin = (v) => { const n = v / 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; };
/** Luminanza relativa WCAG di [r, g, b] 0–255. */
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
/** Rapporto di contrasto WCAG tra due colori opachi. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Colore con alfa sopra un fondo opaco (miscela in sRGB, come il browser). */
export function blend(fg, bg) {
  const a = fg[3] ?? 1;
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
}
/** Testo grande WCAG: almeno 24 px, oppure 18,66 px in grassetto (peso ≥ 700). */
export const isLargeText = (px, weight) => px >= 24 || (px >= 18.66 && Number(weight) >= 700);
export const thresholdFor = (px, weight) => (isLargeText(px, weight) ? 3 : 4.5);

/** Percentile p (0–100) di un array numerico (copia ordinata). */
export function percentile(values, p) {
  if (!values.length) return NaN;
  const s = Float64Array.from(values).sort();
  const i = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
  return s[i];
}

/**
 * Contrasto del testo contro il fondo fotografico misurato pixel per pixel.
 * `pixels`: RGBA (Uint8Array), `width`; `rects`: riquadri del testo in pixel dell'immagine;
 * `fg`: [r, g, b, a] del testo. Per ogni pixel del fondo si calcola il contrasto del testo
 * (con la sua trasparenza) sopra quel pixel; il caso peggiore è il percentile `p` più basso (10° di default).
 */
export function photoContrast({ pixels, width, height, rects, fg, p = 10 }) {
  const ratios = [];
  const lumFg = fg[3] >= 1 ? luminance(fg) : null;
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
    const x1 = Math.min(width, Math.ceil(r.x + r.width)), y1 = Math.min(height, Math.ceil(r.y + r.height));
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
      const o = (y * width + x) * 4, bg = [pixels[o], pixels[o + 1], pixels[o + 2]];
      const lb = luminance(bg), lf = lumFg ?? luminance(blend(fg, bg));
      ratios.push((Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05));
    }
  }
  if (!ratios.length) return null;
  return { worst: percentile(ratios, p), median: percentile(ratios, 50), min: percentile(ratios, 0), samples: ratios.length };
}

/**
 * Colore effettivo del testo stimato da due screenshot (testo visibile e nascosto): il pixel che cambia di più
 * dentro i riquadri del testo. Serve quando un filtro CSS altera il colore calcolato.
 */
export function shownTextColor({ shown, hidden, width, height, rects }) {
  let best = null, bestDiff = -1;
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
    const x1 = Math.min(width, Math.ceil(r.x + r.width)), y1 = Math.min(height, Math.ceil(r.y + r.height));
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
      const o = (y * width + x) * 4, a = [shown[o], shown[o + 1], shown[o + 2]], b = [hidden[o], hidden[o + 1], hidden[o + 2]];
      const d = Math.abs(luminance(a) - luminance(b));
      if (d > bestDiff) { bestDiff = d; best = a; }
    }
  }
  return best ? [...best, 1] : null;
}

/** PNG a 8 bit (scala di grigi, RGB, RGBA, non interlacciato) → { width, height, data RGBA }. */
export function decodePng(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error('non è un PNG');
  let pos = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (depth !== 8 || !channels || interlace) throw new Error(`PNG non gestito (profondità ${depth}, tipo ${type}, interlacciato ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat)), stride = width * channels, out = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? cur[i - channels] : 0, b = prev[i], c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4, s = x * channels;
      if (channels >= 3) { out[o] = cur[s]; out[o + 1] = cur[s + 1]; out[o + 2] = cur[s + 2]; out[o + 3] = channels === 4 ? cur[s + 3] : 255; }
      else { out[o] = out[o + 1] = out[o + 2] = cur[s]; out[o + 3] = channels === 2 ? cur[s + 1] : 255; }
    }
    [prev, cur] = [cur, prev];
  }
  return { width, height, data: out };
}

/**
 * Da eseguire nella pagina (page.evaluate): segna con data-la-id ogni elemento con testo visibile
 * e ne descrive colore, dimensione, fondo. `fondo pieno` quando tra il testo e il primo antenato opaco
 * non ci sono foto, gradienti o sfocature; altrimenti `screenshot` con l'elemento che fa da fondo (data-la-host).
 * Funzione autosufficiente: non usa nulla fuori dal suo corpo.
 */
export function collectTextItems({ root = 'body', minImg = 80 } = {}) {
  const parse = (v) => {
    const s = String(v || '').trim();
    if (!s || s === 'transparent') return [0, 0, 0, 0];
    let m = s.match(/^rgba?\(([^)]*)\)$/);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = s.match(/^color\(srgb\s+([^)]*)\)$/);
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
    return null;
  };
  const blendIn = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const scope = document.querySelector(root) || document.body;
  let nextId = Number(document.documentElement.dataset.laNext || 0), nextHost = Number(document.documentElement.dataset.laHostNext || 0);
  const hostId = (el) => { if (!el.dataset.laHost) el.dataset.laHost = String(nextHost++); return el.dataset.laHost; };
  const sx = scrollX, sy = scrollY;
  const imgs = [...document.querySelectorAll('img, canvas, video')].filter((im) => {
    const r = im.getBoundingClientRect();
    return r.width >= minImg && r.height >= minImg && im.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) !== false && (im.tagName !== 'IMG' || im.currentSrc || im.getAttribute('src'));
  }).map((im) => ({ im, r: im.getBoundingClientRect() }));
  const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const describe = (el) => {
    const parts = []; let e = el;
    for (let i = 0; e && e !== document.body && i < 4; i += 1, e = e.parentElement) {
      const cls = [...e.classList].filter((c) => !c.startsWith('la-')).slice(0, 2).join('.');
      parts.unshift(e.tagName.toLowerCase() + (e.id ? `#${e.id}` : '') + (cls ? `.${cls}` : ''));
    }
    return parts.join(' > ');
  };
  // gruppi: elemento → rettangoli del suo testo diretto
  const groups = new Map();
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.nodeValue.trim()) continue;
    const el = t.parentElement;
    if (!el || el.closest('script, style, noscript, template, title, [data-la-skip]')) continue;
    const range = document.createRange(); range.selectNodeContents(t);
    const rects = [...range.getClientRects()].filter((q) => q.width >= 1 && q.height >= 4);
    if (!rects.length) continue;
    if (!groups.has(el)) groups.set(el, { rects: [], text: '' });
    const g = groups.get(el); g.rects.push(...rects); g.text += t.nodeValue;
  }
  // campi: segnaposto e valori
  for (const el of scope.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]), textarea, select')) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const empty = !el.value;
    if (empty && !el.placeholder) continue;
    groups.set(el, { rects: [r], text: empty ? el.placeholder : (el.tagName === 'SELECT' ? el.selectedOptions[0]?.textContent || '' : el.value), field: empty ? 'placeholder' : 'value' });
  }
  const items = [];
  for (const [el, g] of groups) {
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    // testo solo per lettori di schermo (clip 1 px) o tagliato via
    const box = el.getBoundingClientRect();
    if (box.width <= 2 || box.height <= 2) continue;
    let clipped = false;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if ((cs.clip && cs.clip !== 'auto') || (cs.clipPath && cs.clipPath !== 'none' && /inset\(50%|circle\(0/.test(cs.clipPath))) { clipped = true; break; }
      if (cs.overflow !== 'visible') {
        const ar = a.getBoundingClientRect();
        if (ar.width < 3 || ar.height < 3) { clipped = true; break; }
      }
    }
    if (clipped) continue;
    const cs = getComputedStyle(el);
    const svgText = el instanceof SVGElement;
    const fgRaw = g.field === 'placeholder' ? getComputedStyle(el, '::placeholder').color : svgText ? cs.fill : cs.color;
    const fg = parse(fgRaw);
    if (!fg) continue;
    if (svgText) for (let a = el; a && a instanceof SVGElement; a = a.parentElement) fg[3] *= Number(getComputedStyle(a).fillOpacity || 1);
    // filtri CSS (es. mappa scurita): il colore calcolato non è quello mostrato, si misura dallo screenshot
    let filtered = null;
    for (let a = el; a; a = a.parentElement) { const f = getComputedStyle(a).filter; if (f && f !== 'none') { filtered = a; break; } }
    if (cs.webkitTextFillColor && g.field !== 'placeholder') { const f = parse(cs.webkitTextFillColor); if (f && f[3] === 0 && fg[3] > 0) continue; }
    if (fg[3] === 0) continue;
    // fondo: risale gli antenati fino al primo opaco, raccogliendo livelli semitrasparenti e opacità
    const layers = []; let base = null, baseEl = null, complex = null, opacity = 1, opacityAbove = 1;
    for (let a = el; a; a = a.parentElement) {
      const ac = getComputedStyle(a);
      const op = Number(ac.opacity);
      const bg = parse(ac.backgroundColor) || [0, 0, 0, 0];
      const img = ac.backgroundImage && ac.backgroundImage !== 'none';
      const backdrop = ac.backdropFilter && ac.backdropFilter !== 'none' && bg[3] < 1;
      if (!complex && img) complex = { el: a, why: /url\(/.test(ac.backgroundImage) ? 'immagine di fondo' : 'gradiente' };
      if (!complex && backdrop) complex = { el: a, why: 'vetro sfocato' };
      if (bg[3] >= 0.999 && !img) { base = bg; baseEl = a; opacityAbove = op; break; }
      if (img) { baseEl = a; if (bg[3] >= 0.999) { base = bg; break; } }
      if (bg[3] > 0) layers.push({ c: [...bg.slice(0, 3), bg[3] * opacity * op] });
      opacity *= op;
    }
    if (!base) {
      const html = parse(getComputedStyle(document.documentElement).backgroundColor), body = parse(getComputedStyle(document.body).backgroundColor);
      base = html && html[3] >= 0.999 ? html : body && body[3] >= 0.999 ? body : [255, 255, 255, 1];
    }
    // foto sotto il testo: immagine grande che si sovrappone al testo e sta dentro il fondo trovato
    const union = g.rects.reduce((u, q) => ({ left: Math.min(u.left, q.left), top: Math.min(u.top, q.top), right: Math.max(u.right, q.right), bottom: Math.max(u.bottom, q.bottom) }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    const area = Math.max(1, (union.right - union.left) * (union.bottom - union.top));
    let photo = null;
    for (const { im, r } of imgs) {
      if (im.contains(el) || el.contains(im)) continue;
      if (overlap(union, r) / area < 0.3) continue;
      if (baseEl && baseEl !== document.documentElement && baseEl !== document.body && !baseEl.contains(im)) continue;
      photo = im; break;
    }
    const opacityText = (() => { let o = 1; for (let a = el; a && a !== baseEl; a = a.parentElement) o *= Number(getComputedStyle(a).opacity); return o; })();
    const id = String(nextId++);
    el.dataset.laId = id;
    let bgSolid = base.slice(0, 3);
    for (const l of layers.reverse()) bgSolid = blendIn(l.c, bgSolid);
    if (filtered && !complex) complex = { el: filtered, why: 'filtro CSS' };
    // La selezione della barra è un fratello posizionato sotto il link: si misura il fondo reale.
    if (el.closest('.tabbar a[aria-current="page"]') && document.querySelector('.tab-pill')) complex = {el: el.closest('.tabbar'), why: 'selezione sovrapposta'};
    const host = photo ? hostId(photo.closest('.cover, .phero, .tile, .sp-card, .portrait') || photo) : complex ? hostId(complex.el) : null;
    items.push({
      id, text: g.text.replace(/\s+/g, ' ').trim().slice(0, 80), where: describe(el), field: g.field || null,
      fg: [...fg.slice(0, 3), fg[3] * opacityText],
      fontSize: parseFloat(cs.fontSize), fontWeight: Number(cs.fontWeight) || 400,
      method: photo ? 'foto' : complex ? 'screenshot' : 'pieno', why: photo ? 'foto' : complex?.why || null,
      host, photoSrc: photo ? (photo.currentSrc || photo.getAttribute('src') || '').replace(location.origin + '/', '') : null,
      bg: bgSolid, disabled: !!el.closest(':disabled, [aria-disabled="true"]'), filtered: !!filtered,
      decorative: !!el.closest('[aria-hidden="true"]'),
      textShadow: cs.textShadow !== 'none',
      rect: { x: union.left + sx, y: union.top + sy, width: union.right - union.left, height: union.bottom - union.top },
    });
  }
  document.documentElement.dataset.laNext = String(nextId);
  document.documentElement.dataset.laHostNext = String(nextHost);
  return items;
}

/** Riquadri del testo di un elemento segnato, in coordinate del viewport (da eseguire nella pagina). */
export function textRectsOf(ids) {
  const out = {};
  for (const id of ids) {
    const el = document.querySelector(`[data-la-id="${id}"]`);
    if (!el) continue;
    let rects = [];
    if (el.matches('input, textarea, select')) rects = [el.getBoundingClientRect()];
    else for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      rects.push(...[...r.getClientRects()].filter((q) => q.width >= 1 && q.height >= 4));
    }
    // il testo che esce da un contenitore con overflow nascosto (es. puntini di sospensione) non si vede: si taglia
    let box = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const r = a.getBoundingClientRect(); box = { left: Math.max(box.left, r.left), top: Math.max(box.top, r.top), right: Math.min(box.right, r.right), bottom: Math.min(box.bottom, r.bottom) }; }
    }
    out[id] = rects.map((q) => ({ x: Math.max(q.left, box.left), y: Math.max(q.top, box.top), right: Math.min(q.right, box.right), bottom: Math.min(q.bottom, box.bottom) }))
      .filter((q) => q.right - q.x >= 1 && q.bottom - q.y >= 2).map((q) => ({ x: q.x, y: q.y, width: q.right - q.x, height: q.bottom - q.y }));
  }
  return out;
}

/** CSS iniettato durante le misure: niente transizioni; con `hide` il testo diventa trasparente. */
export const AUDIT_CSS = `
*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
html.la-hide [data-la-id], html.la-hide [data-la-id]::placeholder { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; }
html.la-noshadow [data-la-id] { text-shadow: none !important; }
`;
