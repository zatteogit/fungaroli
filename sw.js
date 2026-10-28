// Service worker di Fronda: l'app si apre anche senza campo.
// - codice e dati dell'app (stessa origine): prima la rete (max 3 s), poi la cache: una nuova versione si vede subito
// - immagini (assets/): subito dalla cache, aggiornate in background
// - meteo Open-Meteo: gestito dall'app con data di acquisizione e limite d'età
// - mappe: dalla cache se gia' viste, con un limite di tessere
// - diario (/api/): mai in cache
const SHELL = 'fungaroli-shell-v394';
const RUNTIME = 'fungaroli-runtime-v1';
const TILES = 'fungaroli-tiles-v1';
const CONTENT = 'fungaroli-content-v1';
const MAX_TILES = 1500;
const PRECACHE = [
  'offline.html','js/field-mode.js','js/field-device.js','js/field-store.js','js/field-reader.js','js/field-render.js','js/field-alerts.js','js/field-contracts.js','css/field.css',
  'js/content-snapshot.js','js/edition.js','js/edition-core.js','edition.json','js/adaptive-effects.js','css/adaptive-effects.css',
  'js/research-consent-invite.js',
  'js/navigation-dock.js','js/contextual-navigation.js', 'css/navigation-dock.css',
  'js/zone-community.js',
  'js/home-composition.js', 'js/home-intro.js',
  'js/notebook-photo.js', 'js/notebook-photo-store.js', 'js/notebook-quick-composer.js', 'js/data-export.js',
  'js/home-cover-media.js', 'assets/video/places/canneto-verde-sereno-poster-small.webp', 'assets/video/places/tancia-autunno-asciutto-poster-small.webp',
  'js/atmosphere.js', 'js/atmosphere-video.js', 'css/atmosphere.css',
  'assets/video/nature/autunno-poster-small.webp', 'assets/video/nature/luce-tra-le-foglie-poster-small.webp',
  'assets/video/nature/bosco-e-sentiero-poster-small.webp', 'assets/video/nature/gocce-sulla-felce-poster-small.webp', 'assets/video/nature/ombre-di-foglie-poster-small.webp',
  'js/daily-thought.js', 'data/daily-thoughts.json',
  'js/trail-context.js', 'js/outing-route.js', 'js/outing-documentation.js', 'js/map-label-layout.js', 'js/plant-pair-context.js',
  'js/external-observation.js', 'js/external-signal.js', 'js/external-signals-client.js',
  'js/editorial-outings.js', 'css/editorial-outings.css', 'data/editorial-outings.json',
  'js/animals.js', 'css/animals.css', 'data/animals.json',
  'js/outing-mushrooms.js', 'js/outing-intent.js', 'js/planning-time.js', 'js/base-location.js', 'js/travel-model.js',
  'js/feedback.js', 'js/feedback-schema.js', 'js/feedback-admin.js', 'js/pilot-onboarding.js', 'js/pilot-choice-state.js', 'js/legal-access.js', 'js/legal-notice.js', 'js/navigation-context.js', 'js/focus.js', 'js/modal-scroll.js', 'js/modal-flow.js', 'js/compare-picker.js', 'js/entity-sheet.js', 'js/entity-accordions.js', 'js/content-ui.js', 'js/ambilight.js', 'js/ui-icons.js', 'js/map-experience.js',
  'assets/ui/chevron-right.svg', 'assets/ui/alert-triangle.svg', 'assets/ui/map.svg', 'assets/ui/leaf.svg', 'assets/ui/notebook.svg',
  'js/search-select.js', 'js/species-search.js', 'js/site-info.js', 'js/forecast-capture.js', 'js/forecast-autosave.js',
  'js/weather-request.js', 'js/weather-cache.js', 'js/weather-data.js','js/data-guards.js', 'js/core/index.js', 'js/core/guards.js', 'js/core/field-record-types.js', 'js/core/field-record.js', 'js/weather-dom.js',
  'js/images.js','js/inline-gallery.js', 'js/fronda-connections.js', 'js/plants.js','js/plant-comparison.js','js/botanical-model.js','js/outing-discoveries.js','js/botanical-explanation.js','data/botanical-models.json', 'js/plant-catalog.js', 'js/catalog-search.js', 'js/guided-key.js', 'data/recognize-trees.json', 'data/recognize-plants.json', 'js/notebook-entry.js', 'data/plants.json', 'js/challenges.js', 'data/challenges.json',
  'data/media-glossary.json', 'data/crop-points.json', 'data/habitat-info.json', 'data/access-info.json', 'data/trait-icons.json', 'data/trait-callouts.json', 'data/tree-trait-icons.json', 'data/plant-trait-icons.json',
  './', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/style.css', 'css/fronda.css', 'css/species-pages.css', 'css/content-ui.css', 'css/map-experience.css', 'css/pilot-test.css', 'css/fonts.css',
  'js/learning.js','js/glossary-context.js', 'js/species-link.js', 'js/content-schema.js', 'js/walks.js', 'js/edible-catalog.js', 'js/species-autocomplete.js', 'js/app.js', 'js/indicators.js', 'js/index-tip.js', 'js/outing-memory.js', 'js/outing-composer.js', 'js/notebook-view.js', 'js/notebook-demo.js', 'css/notebook.css', 'js/notebook-composer.js', 'js/community-observation.js', 'js/community.js', 'js/research-consent.js', 'js/view-stability.js', 'js/community-signal.js', 'js/community-aggregate.js', 'js/guides.js', 'js/vendor/webauthn.js', 'js/model.js', 'js/species.js', 'js/weather-state.js', 'js/weather.js', 'js/journal.js', 'js/svgmap.js',
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
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !keep.includes(k)&&!k.startsWith('fronda-field-pack-')).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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
    // Streaming and range responses belong to the browser, including offline-pack lookups.
    if(req.headers.has('range')||url.pathname.startsWith('/assets/video/')&&url.pathname.endsWith('.mp4'))return;
    const reader=['/offline','/offline/','/offline.html'].includes(url.pathname);
    if(reader||url.pathname.startsWith('/assets/')||url.pathname.startsWith('/js/field-')||url.pathname==='/css/field.css'||url.pathname==='/css/tokens.css'){
      e.respondWith((async()=>{
        const documentAsset=!url.pathname.startsWith('/assets/');
        const savedRequest=reader?new URL('/offline.html',url):req;
        const clean=response=>reader?new Response(response.body,{status:response.status,statusText:response.statusText,headers:response.headers}):response;
        if(documentAsset){const current=await(await caches.open(SHELL)).match(savedRequest,{ignoreSearch:true});if(current)return clean(current);}
        // Foto e immagini: prima la copia normale, che si rinnova; le uscite preparate per il bosco sono
        // solo il ripiego offline, altrimenti una foto sostituita allo stesso percorso resterebbe vecchia per sempre.
        let normal=null;if(!documentAsset){normal=await staleWhileRevalidate(req,RUNTIME);if(normal.type!=='error')return normal;}
        for(const key of (await caches.keys()).filter(k=>k.startsWith('fronda-field-pack-'))){const hit=await(await caches.open(key)).match(savedRequest,{ignoreSearch:reader});if(hit)return clean(hit);}
        return documentAsset?networkFirstFast(req,SHELL):normal;
      })());return;
    }
    // Le prove pubblicate restano indipendenti dalla cache e dal ripiego dell’app.
    if(url.pathname==='/dev'||url.pathname.startsWith('/dev/'))return;
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

// Every received push produces a visible, same-origin notification, even with malformed data.
self.addEventListener('push',event=>{event.waitUntil((async()=>{
 let data={},target=location.origin+'/';try{const value=event.data?.json();if(value&&typeof value==='object')data=value;}catch{}
 try{const url=new URL(typeof data.url==='string'?data.url:'/',location.origin);if(url.origin===location.origin&&/^\/#\/zona\/[a-z0-9-]+\/([0-7]|\d{4}-\d{2}-\d{2})$/.test(url.pathname+url.hash))target=url.href;}catch{}
 await self.registration.showNotification(typeof data.title==='string'?data.title.slice(0,120):'Novità per la tua uscita',{body:typeof data.body==='string'?data.body.slice(0,400):'Apri Fronda per ricontrollare il meteo.',icon:'/assets/fronda-icon-192.png',badge:'/assets/fronda-icon-192.png',tag:typeof data.tag==='string'?data.tag.slice(0,120):'fronda-outing',data:{url:target}});
})());});
// Una finestra di Fronda già aperta si riusa: niente schede doppie a ogni notifica.
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{let target=location.origin+'/';try{const url=new URL(event.notification.data?.url,location.origin);if(url.origin===location.origin)target=url.href;}catch{}
 const open=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).find(client=>new URL(client.url).origin===location.origin);
 if(open){try{const client=await open.navigate(target)||open;await client.focus();return;}catch{/* finestra non controllata: se ne apre una nuova */}}
 await self.clients.openWindow(target);})());});
