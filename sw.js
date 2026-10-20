// Service worker di Fronda: l'app si apre anche senza campo.
// - codice e dati dell'app (stessa origine): prima la rete (max 3 s), poi la cache: una nuova versione si vede subito
// - immagini (assets/): subito dalla cache, aggiornate in background
// - meteo Open-Meteo: gestito dall'app con data di acquisizione e limite d'età
// - mappe: dalla cache se gia' viste, con un limite di tessere
// - diario (/api/): mai in cache
const SHELL = 'fungaroli-shell-v278';
const RUNTIME = 'fungaroli-runtime-v1';
const TILES = 'fungaroli-tiles-v1';
const CONTENT = 'fungaroli-content-v1';
const MAX_TILES = 1500;
const PRECACHE = [
  'js/home-cover-media.js', 'assets/video/places/canneto-verde-sereno-poster-small.webp', 'assets/video/places/tancia-autunno-asciutto-poster-small.webp',
  'js/atmosphere.js', 'js/atmosphere-video.js', 'css/atmosphere.css',
  'assets/video/nature/autunno-poster-small.webp', 'assets/video/nature/luce-tra-le-foglie-poster-small.webp',
  'assets/video/nature/bosco-e-sentiero-poster-small.webp', 'assets/video/nature/gocce-sulla-felce-poster-small.webp', 'assets/video/nature/ombre-di-foglie-poster-small.webp',
  'js/daily-thought.js', 'data/daily-thoughts.json',
  'js/trail-context.js', 'js/outing-route.js',
  'js/external-observation.js', 'js/external-signal.js', 'js/external-signals-client.js',
  'js/editorial-outings.js', 'css/editorial-outings.css', 'data/editorial-outings.json',
  'js/animals.js', 'css/animals.css', 'data/animals.json',
  'js/outing-intent.js', 'js/planning-time.js', 'js/base-location.js', 'js/travel-model.js',
  'js/legal-access.js', 'js/legal-notice.js', 'js/navigation-context.js', 'js/focus.js', 'js/modal-scroll.js', 'js/modal-flow.js', 'js/compare-picker.js', 'js/entity-sheet.js', 'js/entity-accordions.js', 'js/content-ui.js', 'js/ambilight.js', 'js/ui-icons.js', 'js/map-experience.js',
  'assets/ui/chevron-right.svg', 'assets/ui/alert-triangle.svg', 'assets/ui/map.svg', 'assets/ui/leaf.svg', 'assets/ui/notebook.svg',
  'js/search-select.js', 'js/species-search.js',
  'js/weather-request.js', 'js/weather-cache.js', 'js/weather-data.js', 'js/weather-dom.js',
  'js/images.js','js/inline-gallery.js', 'js/fronda-connections.js', 'js/plants.js','js/plant-comparison.js','js/botanical-model.js','js/outing-discoveries.js','js/botanical-explanation.js','data/botanical-models.json', 'js/plant-catalog.js', 'js/catalog-search.js', 'js/guided-key.js', 'data/recognize-trees.json', 'data/recognize-plants.json', 'js/notebook-entry.js', 'data/plants.json', 'js/challenges.js', 'data/challenges.json',
  'data/media-glossary.json', 'data/crop-points.json', 'data/trait-icons.json', 'data/trait-callouts.json', 'data/tree-trait-icons.json', 'data/plant-trait-icons.json',
  './', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/style.css', 'css/fronda.css', 'css/species-pages.css', 'css/content-ui.css', 'css/map-experience.css', 'css/fonts.css',
  'js/learning.js','js/glossary-context.js', 'js/species-link.js', 'js/content-schema.js', 'js/walks.js', 'js/edible-catalog.js', 'js/species-autocomplete.js', 'js/app.js', 'js/indicators.js', 'js/index-tip.js', 'js/outing-memory.js', 'js/outing-composer.js', 'js/notebook-view.js', 'js/notebook-demo.js', 'css/notebook.css', 'js/notebook-composer.js', 'js/community-observation.js', 'js/community.js', 'js/community-signal.js', 'js/guides.js', 'js/vendor/webauthn.js', 'js/model.js', 'js/species.js', 'js/weather.js', 'js/journal.js', 'js/svgmap.js',
  'js/species-context.js', 'js/speciescard.js', 'js/identify.js', 'js/trait-callouts.js', 'js/fungus-stages.js', 'js/identify-model.js', 'js/trees.js', 'js/human.js', 'js/lightbox.js', 'js/install.js', 'js/outing.js', 'js/motion.js', 'js/rails.js', 'js/theme.js', 'js/refresh.js', 'js/names.js', 'js/zone-cover.js', 'js/forest-legend.js', 'js/search.js', 'js/science.js', 'js/viz.js', 'docs/metodo-scientifico.md',
  'data/glossary.json', 'data/guides.json', 'data/ui-copy.json', 'data/edible-catalog.json', 'data/zones.json', 'data/habitat.json', 'data/access.json', 'data/trails.json', 'data/species-id.json', 'data/media.json',
  'data/infografiche.json', 'data/trees.json', 'data/species-traits.json', 'data/media-trees.json', 'data/media-zones.json', 'data/legal.json', 'data/preparation.json', 'data/trailheads.json',
  'assets/fronda-icon-192.png', 'assets/fronda-icon.svg', 'assets/map-thumb-topo.jpg', 'assets/map-thumb-osm.jpg', 'assets/map-thumb-forest.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  const keep = [SHELL, RUNTIME, TILES, CONTENT];
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
// rete con un tempo massimo: se non risponde in fretta (campo scarso) si usa la copia salvata
async function networkFirstFast(req, cacheName, ms = 3000) {
  const cache = await caches.open(cacheName);
  const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; });
  const timeout = new Promise((r) => setTimeout(r, ms, null));
  try {
    const res = await Promise.race([net, timeout]);
    if (res) return res;
  } catch { /* senza rete */ }
  const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
  if (hit) return hit;
  try { return await net; } catch { return (req.mode === 'navigate' && await cache.match('index.html')) || Response.error(); }
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
    // Streaming e richieste Range: gestiti dal browser, mai copiati nella cache PWA.
    if (url.pathname.startsWith('/assets/video/') && url.pathname.endsWith('.mp4')) return;
    if(url.pathname==='/api/content/v1/snapshot'){e.respondWith(networkFirst(req,RUNTIME));return;}
    if(url.pathname.startsWith('/redazione')||url.pathname.startsWith('/api/cms/'))return;
    // Il questionario è una pagina a sé: senza rete non deve aprirsi l'app (ripiego su index.html).
    if(/^\/questionario(\.html|\/)?$/.test(url.pathname))return;
    if (url.pathname.startsWith('/api/')) return;
    e.respondWith(url.pathname.startsWith('/assets/') ? staleWhileRevalidate(req, RUNTIME) : networkFirstFast(req, SHELL));
  } else if (url.hostname === 'api.open-meteo.com') {
    // Non restituire una risposta vecchia come se fosse appena acquisita.
    // La cache esplicita di weather.js/outing.js conserva il timestamp originale.
    return;
  } else if (/tile\.opentopomap\.org$|tile\.openstreetmap\.org$/.test(url.hostname)) {
    e.respondWith(tile(req));
  } else if (url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'geoportale.regione.lazio.it') {
    e.respondWith(staleWhileRevalidate(req, RUNTIME));
  }
});
