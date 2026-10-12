#!/usr/bin/env node
// Copia di revisione su claude.ai (Artifact multi-file): stessa app e stessi file del sito,
// con il meteo fotografato al momento della build e la mappa di base incorporata,
// perche' la pagina non puo' chiamare servizi esterni.
//
// Uso: node tools/build_review.mjs <cartella di uscita>   -> page.html, review.js, leaflet.min.css, files.json
process.env.TZ = 'Europe/Rome';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'dist/review'));
fs.mkdirSync(OUT, { recursive: true });
globalThis.fetch = async (url) => {
  const body = execFileSync('curl', ['-sS', '--retry', '6', '--retry-all-errors', '-m', '60', String(url)], { maxBuffer: 1e9 }).toString();
  return { ok: true, status: 200, json: async () => JSON.parse(body) };
};
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const zones = JSON.parse(read('data/zones.json'));
const { loadWeather } = await import(path.join(ROOT, 'js/weather.js'));
const w = await loadWeather(zones.zones, { force: true });
const bm = JSON.parse(read('assets/basemap.json'));
const review = {
  weather: { series: w.series, fetchedAt: w.fetchedAt.toISOString() },
  basemap: { ...bm, topo: 'assets/basemap-topo.webp', forest: 'assets/basemap-forest.webp', legend: 'assets/forest-legend.png', attribution: bm.attribution },
};
fs.writeFileSync(path.join(OUT, 'review.js'), `window.FUNGAROLI_REVIEW=${JSON.stringify(review)};\n`);
fs.writeFileSync(path.join(OUT, 'leaflet.min.css'), execFileSync('curl', ['-sS', '--retry', '4', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css']));

// pagina: contenuto di index.html senza lo scheletro (lo aggiunge la pubblicazione)
const html = read('index.html');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1]
  .replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>\n  <script src="review.js"></script>');
fs.writeFileSync(path.join(OUT, 'page.html'), `${title}
<link rel="stylesheet" href="leaflet.min.css">
<link rel="stylesheet" href="css/fonts.css">
<link rel="stylesheet" href="css/style.css">
${body.trim()}
`);

// file pubblicati accanto alla pagina (percorso pubblicato -> sorgente)
const files = { 'review.js': path.join(OUT, 'review.js'), 'leaflet.min.css': path.join(OUT, 'leaflet.min.css') };
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
for (const f of [...walk('js'), ...walk('css'), ...walk('data'), ...walk('assets')]) {
  if (/basemap\.json$|\.py$/.test(f)) continue;
  files[f] = path.join(ROOT, f);
}
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(files, null, 1));
const size = Object.values(files).reduce((s, f) => s + fs.statSync(f).size, 0);
console.log(`${Object.keys(files).length} file, ${(size / 1e6).toFixed(1)} MB · meteo ${w.fetchedAt.toISOString()}`);
