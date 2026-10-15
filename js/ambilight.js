// Alone «ambilight» attorno alle copertine a tutta foto: i colori dei bordi della foto, campionati su 8×8 punti,
// diventano quattro luci sfumate (sopra, sinistra, destra, sotto). Le ombre non sono tagliate dagli angoli arrotondati
// e non cambiano la struttura della pagina. Spento con «riduci trasparenza».
const N = 8;
let canvas;
const avg = (d, cells) => {
  let r = 0, g = 0, b = 0;
  for (const i of cells) { r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; }
  const n = cells.length;
  return `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)})`;
};
export function ambilight(img) {
  const host = img.closest('.phero, .cover');
  if (!host || !img.naturalWidth || matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
  try {
    canvas ||= Object.assign(document.createElement('canvas'), { width: N, height: N });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, N, N);
    const d = ctx.getImageData(0, 0, N, N).data, col = (x) => Array.from({ length: N }, (_, y) => y * N + x);
    host.style.setProperty('--amb-t', avg(d, Array.from({ length: N * 2 }, (_, i) => i)));
    host.style.setProperty('--amb-l', avg(d, [...col(0), ...col(1)]));
    host.style.setProperty('--amb-r', avg(d, [...col(N - 1), ...col(N - 2)]));
    host.style.setProperty('--amb-b', avg(d, Array.from({ length: N * 2 }, (_, i) => (N - 2) * N + i)));
    host.classList.add('has-amb');
  } catch { /* immagine di un altro dominio senza CORS: niente alone */ }
}
export function initAmbilight() {
  document.addEventListener('load', (e) => { if (e.target instanceof HTMLImageElement) ambilight(e.target); }, true);
}
