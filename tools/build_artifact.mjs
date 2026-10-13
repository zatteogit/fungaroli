#!/usr/bin/env node
// Genera la versione Artifact (claude.ai): un unico HTML con JS, CSS e dati incorporati
// e una fotografia del meteo al momento della build (la pagina non puo' chiamare API esterne).
//
// Uso: npm i && npm run build:artifact   ->  dist/fungaroli.html
process.env.TZ = 'Europe/Rome';

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = await import(process.env.ESBUILD_PATH || 'esbuild');

// fetch via curl: rispetta proxy e certificati di sistema
globalThis.fetch = async (url) => {
  const body = execFileSync('curl', ['--fail', '-sS', '--retry', '2', '--retry-all-errors', '-m', '30', String(url)], { maxBuffer: 1e9 }).toString();
  return { ok: true, status: 200, json: async () => JSON.parse(body) };
};
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const zones = JSON.parse(read('data/zones.json'));
const habitat = JSON.parse(read('data/habitat.json'));
const readOpt = (p) => (fs.existsSync(path.join(ROOT, p)) ? JSON.parse(read(p)) : null);
const access = readOpt('data/access.json');
const trails = readOpt('data/trails.json');
const speciesId = readOpt('data/species-id.json');
const media = readOpt('data/media.json');
// foto delle specie incorporate come data URI (l'Artifact non carica immagini esterne)
const assets = {};
const mime = (f) => (f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'image/jpeg');
const put = (f) => { if (f && fs.existsSync(path.join(ROOT, f))) assets[f] = `data:${mime(f)};base64,${fs.readFileSync(path.join(ROOT, f)).toString('base64')}`; };
const collect = (m) => { put(m?.file); put(m?.thumb); };
for (const v of Object.values(media?.species || {})) { collect(v.ref); (v.inat || []).forEach(collect); }
for (const v of Object.values(media?.lookalikes || {})) { collect(v.ref); (v.inat || []).forEach(collect); }
const { loadWeather } = await import(path.join(ROOT, 'js/weather.js'));
const w = await loadWeather(zones.zones, { force: true });
const { loadOuting } = await import(path.join(ROOT, 'js/outing.js'));
const outing = await loadOuting(zones.zones, { force: true });

const bundle = await esbuild.build({
  entryPoints: [path.join(ROOT, 'js/app.js')],
  bundle: true, format: 'iife', minify: true, write: false, target: 'es2020',
});

// base cartografica incorporata (generata una tantum da tools/build_basemap.py)
const b64 = (f, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, 'assets', f)).toString('base64')}`;
const bmMeta = JSON.parse(read('assets/basemap.json'));
const basemap = {
  ...bmMeta,
  topo: b64('basemap-topo.webp', 'image/webp'),
  forest: b64('basemap-forest.webp', 'image/webp'),
  legend: b64('forest-legend.png', 'image/png'),
};
const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4';
const leafletCss = execFileSync('curl', ['-sS', '--retry', '4', `${LEAFLET}/leaflet.min.css`]).toString();

const html = read('index.html');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];
const body = html.match(/<body>([\s\S]*)<\/body>/)[1]
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace('Mappe © OpenStreetMap, OpenTopoMap (CC-BY-SA). ', '');
const extra = Object.fromEntries(Object.entries({ legal: 'legal', traits: 'species-traits', trees: 'trees', infographics: 'infografiche', preparation: 'preparation', trailheads: 'trailheads' }).map(([k,f]) => [k, readOpt('data/' + f + '.json')]));
const data = JSON.stringify({ zones, habitat, access, trails, speciesId, media, assets, basemap, ...extra, outing, weather: { series: w.series, fetchedAt: w.fetchedAt.toISOString() } })
  .replace(/</g, '\\u003c');

const out = `${title}
${fonts}
<style>
${leafletCss}
${read('css/style.css')}
body { padding-inline: 0; }
</style>
${body.trim()}
<script src="${LEAFLET}/leaflet.min.js"></script>
<script>window.FUNGAROLI_DATA=${data};</script>
<script>${bundle.outputFiles[0].text.replace(/<\/script/g, '<\\/script')}</script>
`;
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/fungaroli.html'), out);
console.log(`dist/fungaroli.html  ${(out.length / 1024).toFixed(0)} KB  meteo ${w.fetchedAt.toISOString()}`);
