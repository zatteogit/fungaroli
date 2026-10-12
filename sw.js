// Service worker di Fungaroli: l'app si apre anche senza campo.
// - file dell'app (stessa origine): subito dalla cache, aggiornati in background (vale al prossimo avvio)
// - meteo Open-Meteo: prima la rete, senza rete l'ultima risposta salvata
// - mappe: dalla cache se gia' viste, con un limite di tessere
// - diario (/api/): mai in cache
const SHELL = 'fungaroli-shell-v2';
const RUNTIME = 'fungaroli-runtime-v1';
const TILES = 'fungaroli-tiles-v1';
const MAX_TILES = 1500;
const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/fonts.css',
  'js/app.js', 'js/model.js', 'js/species.js', 'js/weather.js', 'js/chart.js', 'js/journal.js', 'js/svgmap.js',
  'js/speciescard.js', 'js/identify.js', 'js/trees.js', 'js/human.js', 'js/lightbox.js', 'js/install.js', 'js/outing.js', 'js/motion.js', 'js/forest-legend.js', 'js/search.js',
  'data/zones.json', 'data/habitat.json', 'data/access.json', 'data/trails.json', 'data/species-id.json', 'data/media.json',
  'data/infografiche.json', 'data/trees.json', 'data/species-traits.json', 'data/media-trees.json', 'data/media-zones.json', 'data/legal.json',
  'assets/icon-192.png', 'assets/icon.svg', 'assets/map-thumb-topo.jpg', 'assets/map-thumb-osm.jpg', 'assets/map-thumb-forest.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  const keep = [SHELL, RUNTIME, TILES];
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
  const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
}
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || Response.error();
  }
}
async function tile(req) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') {
      cache.put(req, res.clone());
      cache.keys().then((ks) => { if (ks.length > MAX_TILES) ks.slice(0, ks.length - MAX_TILES).forEach((k) => cache.delete(k)); });
    }
    return res;
  } catch { return Response.error(); }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/')) return;
    e.respondWith(staleWhileRevalidate(req, url.pathname.startsWith('/assets/') ? RUNTIME : SHELL));
  } else if (url.hostname === 'api.open-meteo.com') {
    e.respondWith(networkFirst(req, RUNTIME));
  } else if (/tile\.opentopomap\.org$|tile\.openstreetmap\.org$/.test(url.hostname)) {
    e.respondWith(tile(req));
  } else if (url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'geoportale.regione.lazio.it') {
    e.respondWith(staleWhileRevalidate(req, RUNTIME));
  }
});
