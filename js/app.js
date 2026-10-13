import './rails.js';
import './theme.js';
import { consumeFresh, freshDone } from './refresh.js';
import { SPECIES, GROUPS, FOREST } from './species.js';
import { scoreZoneDay, scoreSpecies, habitatAtBand, habitatPotential, elevationFit, combine, classOf, scoreLabel, scoreShortLabel, formatIndex, MODEL_VERSION, PARAMS, CLASSES } from './model.js';
import { todayISO, loadWeather } from './weather.js';
import { renderCharts } from './chart.js';
import { initJournal } from './journal.js';
import { renderSvgMap } from './svgmap.js';
import { initSpeciesCards, thumb, renderSpeciesDetail, whereSummary, criticalRule, speciesPhoto } from './speciescard.js';
import { openLightbox, captionHtml } from './lightbox.js';
import { initInstall, maybeInvite } from './install.js';
import { loadOuting, outingFor, OUTING_LABEL, OUTING_SHORT, OUTING_RANK } from './outing.js';
import { initIdentify, renderIdentify, setCompare, searchTaxa, openTaxon, renderTaxonPage, taxonName } from './identify.js';
import { initSearch, openSearch } from './search.js';
import { renderWhy, renderMethod } from './science.js';
import { navigate, soft } from './motion.js';
import { FOREST_LEGEND } from './forest-legend.js';
import { initTrees, renderTreeGrid, renderTreePage, linkTrees, treeForCategory, treeThumb } from './trees.js';
import { crowding, comfortScore, timingAdvice, fmtTime, fmtRough, holidayName, intornoA } from './human.js';
import { initCommunity, communityStatus, communityRank, reportBadge } from './community.js';
import { guideTitle, renderGuideCards, renderGuide } from './guides.js';
import { buildEdibleCatalog, seasonStatus, seasonLabel, searchEdibleCatalog } from './edible-catalog.js';
import { mountSpeciesAutocomplete } from './species-autocomplete.js';
import { uniquePlaceProposals, chooseWalkTrail, walkContext, trailSketch } from './walks.js';

const HISTORY_DAYS = 30;   // giorni passati mostrati nel grafico
const AHEAD_DAYS = 7;      // giorni futuri valutati
const PREFS_KEY = 'fungaroli:prefs:v2'; // v2: si parte con tutti i gruppi

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const scoreVar = (score) => Number.isFinite(score) ? `--s${5 - classOf(score)}` : '--muted';
const scoreText = formatIndex;
let journal;
// sulla mappa la stessa scala verde dell'app: per farla risaltare, quando ci sono i riquadri la carta sotto si desatura (#map.cells-on)
const mapVar = scoreVar;
const fmtDate = (d, opts) => new Date(d + 'T12:00:00').toLocaleDateString('it-IT', opts);

// Colore fisso per categoria forestale (il colore segue l'entita', non il rango).
const FOREST_COLORS = {
  [FOREST.FAG]: ['#2a78d6', '#3987e5'],
  [FOREST.CAS]: ['#eb6834', '#d95926'],
  [FOREST.CER]: ['#1baf7a', '#199e70'],
  [FOREST.ROV]: ['#eda100', '#c98500'],
  [FOREST.OST]: ['#e87ba4', '#d55181'],
  [FOREST.CON]: ['#008300', '#008300'],
  [FOREST.LEC]: ['#6250d6', '#9085e9'],
};
const isDark = () => matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light'
  || document.documentElement.dataset.theme === 'dark';
const forestColor = (name) => {
  if (name === 'non bosco') return 'var(--grid)';
  const c = FOREST_COLORS[name];
  return c ? c[isDark() ? 1 : 0] : 'var(--muted)';
};
const SHORT = { [FOREST.CON]: 'Conifere (rimboschimenti)', [FOREST.ROV]: 'Roverella' };

let catalog = buildEdibleCatalog();
const state = {
  speciesIds: null, // null = tutto il catalogo; Set = selezione individuale
  // giorno della mappa e della scheda: dalle 14 (ora italiana) si guarda a domani, oggi l'uscita e' ormai andata
  dayOffset: +new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Rome' }).format(new Date()) >= 14 ? 1 : 0,
  zoneId: null,
  trailId: null,
  distancePenalty: false,
  avoidCrowd: false,
  preferComfort: false,
  homeDay: null,   // null = tutti i prossimi giorni
  view: 'uscite',
};
try {
  const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
  if (p) {
    if ('speciesIds' in p) state.speciesIds = Array.isArray(p.speciesIds) ? new Set(p.speciesIds.filter(x => typeof x === 'string')) : null;
    else {
      const groups = (p.groups || []).filter(g => GROUPS.some(x => x.id === g));
      if (groups.length && groups.length !== GROUPS.length) state.speciesIds = new Set(SPECIES.filter(s => groups.includes(s.group)).map(s => s.id));
    }
    state.distancePenalty = !!p.distancePenalty; state.avoidCrowd = !!p.avoidCrowd; state.preferComfort = !!p.preferComfort;
  }
} catch { /* preferenze non disponibili */ }
const savePrefs = () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ speciesIds: state.speciesIds === null ? null : [...state.speciesIds], distancePenalty: state.distancePenalty, avoidCrowd: state.avoidCrowd, preferComfort: state.preferComfort })); } catch { /* ignora */ }
};
const selectedCatalog = () => state.speciesIds === null ? catalog : catalog.filter(s => state.speciesIds.has(s.id));
const filterDate = () => todayISO(new Date(Date.now() + (state.view === 'uscite' ? state.homeDay || 0 : state.dayOffset) * 864e5));
const groupMembers = (id) => catalog.filter(s => s.group === id);
const groupSelection = (id) => {
  const members = groupMembers(id), n = members.filter(s => state.speciesIds === null || state.speciesIds.has(s.id)).length;
  return n === members.length ? 'full' : n ? 'partial' : 'none';
};
function toggleGroup(id) {
  const members = groupMembers(id);
  if (state.speciesIds === null) state.speciesIds = new Set(members.map(s => s.id));
  else {
    const remove = members.every(s => state.speciesIds.has(s.id));
    members.forEach(s => remove ? state.speciesIds.delete(s.id) : state.speciesIds.add(s.id));
    if (!state.speciesIds.size) state.speciesIds = null;
  }
}
function addSpecies(id) {
  if (!catalog.some(s => s.id === id)) return;
  if (state.speciesIds === null) state.speciesIds = new Set();
  state.speciesIds.add(id);
}
const outOfSeason = (id) => { const members = groupMembers(id); return members.length && members.every(s => seasonStatus(s, filterDate()) === 'out'); };

let zones, origin, habitat, access, trails, traits, legal, series, results, map, zoneLayers = {}, zoneMedia = {}, outing = null;
const hasLeaflet = () => typeof globalThis.L !== 'undefined';

// caricamento iniziale: i passi del loader si spuntano man mano (index.html, .loader)
function loadStep(n) {
  document.querySelectorAll('.loader .ld-steps li').forEach((li) => {
    const k = +li.dataset.step;
    li.classList.toggle('done', k < n); li.classList.toggle('now', k === n);
  });
}
async function init() {
  loadStep(0);
  initInstall(); // prima di tutto: non dipende dai dati
  // versione Artifact: dati incorporati nella pagina (niente fetch esterni)
  const embedded = globalThis.FUNGAROLI_DATA;
  const review = !!globalThis.FUNGAROLI_REVIEW; // copia di revisione: niente API esterne
  const load = (f) => fetch(`data/${f}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  legal = embedded ? embedded.legal : await load('legal');
  const [zj, hj, aj, tj, idj, mj, ij, trj, stj, mtj, mzj, prj, thj, ecj] = embedded
    ? [embedded.zones, embedded.habitat, embedded.access, embedded.trails, embedded.speciesId, embedded.media, embedded.infographics, embedded.trees, embedded.traits, null, null, embedded.preparation, embedded.trailheads, embedded.edibleCatalog]
    : await Promise.all(['zones', 'habitat', 'access', 'trails', 'species-id', 'media', 'infografiche', 'trees', 'species-traits', 'media-trees', 'media-zones', 'preparation', 'trailheads', 'edible-catalog'].map(load));
  trailheads = thj?.zones || {};
  prep = prj;
  zoneMedia = mzj?.zones || {};
  if (mj && mtj?.trees) mj.trees = { ...(mj.trees || {}), ...mtj.trees };
  traits = stj;
  catalog = buildEdibleCatalog(stj, ecj, idj);
  if (state.speciesIds !== null) {
    state.speciesIds = new Set([...state.speciesIds].filter(id => catalog.some(s => s.id === id)));
    if (!state.speciesIds.size) state.speciesIds = null;
  }
  initSpeciesCards({
    idData: idj, media: mj, allow3d: !embedded && !review, infographics: ij?.species,
    whereSection: (id) => whereToFind(id),
    traits: stj, footer: legal?.species_footer, prep: prj,
    assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f,
  });
  renderSpeciesGrid();
  access = aj?.zones || {};
  trails = tj?.zones || {};
  zones = zj.zones.filter((z) => hj.zones[z.id]); // una zona senza dati di bosco non e' ancora pronta
  origin = zj.origin;
  habitat = hj.zones;
  renderGuideCards($('#editorial'));
  initCommunity({ zoneList: zones, speciesList: catalog });
  renderCommunityIntro();
  document.addEventListener('fungaroli:community', () => { renderCommunityIntro(); renderTrackedSpecies(); if (results) renderAll(); });
  initIdentify({
    traits: stj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, thumb, zones, banner: legal?.identify_banner,
    howTo: (eid, latin) => idj?.species?.[eid]?.lookalikes?.find((l) => l.latin === latin)?.how_to_tell || '',
    potential: (sid, zid) => { const sp = SPECIES.find((x) => x.id === sid); const z = zones.find((x) => x.id === zid); return sp && z ? potentialOf(sp, z) : null; },
  });
  renderSpeciesGrid();
  applyLegal();
  initTrees({ trees: trj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, zones, habitat, thumb });
  renderTreeGrid($('#tree-grid'));
  treesData = trj; idData = idj;
  renderFilterSummary(); // ora che c'e' il pregio delle specie, riordina i filtri
  buildSearch(idj, trj, embedded);
  initMap();
  initShell();
  journal = initJournal({ zones, speciesCatalog: catalog, predict, captureForecast, getZoneId: () => state.zoneId || zones[0].id, zoneImage: (zid) => zoneMedia[zid]?.file || speciesPhoto(SPECIES[0].id)?.file });
  route(); // le pagine che non dipendono dal meteo (specie, diario, info) compaiono subito
  const fresh = consumeFresh(); // ricarica pulita dal logo: anche il meteo da capo
  await refreshWeather(fresh);
  if (fresh) freshDone();
  // ricaricare il meteo e' raro (si aggiorna da solo dopo un'ora): sta sulla scritta dell'aggiornamento, non nella barra
  if (embedded || review) $('#refresh').disabled = true;
  else $('#refresh').addEventListener('click', () => { $('#refresh').classList.add('spin'); refreshWeather(true).finally(() => $('#refresh').classList.remove('spin')); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
  addEventListener('themechange', renderAll);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => results && state.view === 'zona' && renderDetail(), 200); });
}

// ---------------------------------------------------------------------------
// Navigazione: viste con hash (#/, #/zona/<id>/<giorno>, #/mappa[/<id>], #/specie[/<id>], #/diario, #/info)
// Il tasto indietro del telefono funziona perche' ogni passo e' una voce di cronologia.
let navDepth = 0;
function initShell() {
  addEventListener('hashchange', () => { navDepth++; route(); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-back]')) return;
    // indietro vero se la pagina precedente e' nell'app, altrimenti la pagina "madre"
    if (navStack.length > 1) history.back(); else location.hash = parentOf(prev);
  });
  renderFilterSummary();
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  const [a, b, c] = parts;
  if (a === 'zona' && zones.some((z) => z.id === b)) return { view: 'zona', zoneId: b, offset: Math.max(0, Math.min(AHEAD_DAYS, +c || 0)), trailId: parts[3] === 'sentiero' && (trails[b]?.trails || []).some(t => String(t.id) === parts[4]) ? parts[4] : null };
  if (a === 'mappa') return { view: 'mappa', zoneId: b };
  if (a === 'specie' && b) return { view: 'specie-dettaglio', speciesId: b };
  if (a === 'specie') return { view: 'specie' };
  if (a === 'albero' && b) return { view: 'albero', treeId: b };
  if (a === 'alberi') return { view: 'alberi' };
  if (a === 'riconosci') return { view: 'riconosci', compare: b === 'confronta' ? c : '', pick: b === 'confronta' ? parts[3] : '' };
  if (a === 'guide') return { view: 'guide', guideId: b };
  if (a === 'diario') return { view: 'diario' };
  if (a === 'info') return { view: 'info' };
  if (a === 'metodo') return { view: 'metodo' };
  if (a === 'commestibile' && b) return { view: 'commestibile', speciesId: b };
  if (a === 'fungo' && b) return { view: 'fungo', taxonId: b };
  return { view: 'uscite' };
}

// profondita' e posizione delle viste: decidono la direzione della transizione
const LEVEL = { commestibile: 1, guide: 1, zona: 1, 'specie-dettaglio': 1, albero: 1, info: 1, metodo: 2, fungo: 1 };
const TABS = ['uscite', 'mappa', 'specie', 'diario'];
const SUB = { specie: 0, alberi: 1, riconosci: 2 };
const scrollMem = new Map();
let prev = null;
function navKind(a, b) {
  if (!a) return 'none';
  const la = (LEVEL[a.view] || 0) + (a.compare ? 2 : 0), lb = (LEVEL[b.view] || 0) + (b.compare ? 2 : 0);
  if (lb > la) return 'push';
  if (lb < la) return 'pop';
  if (a.view === b.view) return 'none';
  const ta = TABS.indexOf(a.tab), tb = TABS.indexOf(b.tab);
  if (ta !== tb && ta >= 0 && tb >= 0) return tb > ta ? 'right' : 'left';
  if (a.view in SUB && b.view in SUB) return SUB[b.view] > SUB[a.view] ? 'right' : 'left';
  return 'none';
}

// sulle pagine con la foto in testata la barra diventa piena solo dopo la foto
function onScrollBar() {
  const h = document.querySelector('.view:not([hidden]) .phero');
  document.documentElement.classList.toggle('scrolled', !h || scrollY > h.offsetHeight - 70);
}
addEventListener('scroll', onScrollBar, { passive: true });

// tasto indietro in alto a sinistra: freccia + nome della pagina a cui torni
const navStack = [];
const TITLES = { uscite: 'Uscite', mappa: 'Mappa', specie: 'Specie', alberi: 'Alberi', riconosci: 'Riconosci', diario: 'Diario', info: 'Regole e metodo', metodo: 'Come funziona' };
function titleOf(r) {
  if (!r) return '';
  if (r.view === 'zona') { const z = zones.find((x) => x.id === r.zoneId); return z ? splitName(z)[0] : 'Zona'; }
  if (r.view === 'specie-dettaglio') return SPECIES.find((x) => x.id === r.speciesId)?.name || 'Specie';
  if (r.view === 'commestibile') return catalog.find(s => s.id === r.speciesId)?.name || 'Specie';
  if (r.view === 'fungo') return taxonName(r.taxonId) || 'Specie';
  if (r.view === 'guide') return guideTitle(r.guideId);
  if (r.view === 'albero') return treesData?.trees?.[r.treeId]?.name || 'Albero';
  if (r.view === 'riconosci' && r.compare) return 'Confronto';
  return TITLES[r.view] || '';
}
function parentOf(r) {
  if (!r) return '#/';
  if (r.view === 'specie-dettaglio' || r.view === 'fungo' || r.view === 'commestibile') return '#/specie';
  if (r.view === 'albero') return '#/alberi';
  if (r.view === 'riconosci' && r.compare) return '#/riconosci';
  return '#/';
}
const PARENT_TITLE = (r) => ({ '#/specie': 'Specie', '#/alberi': 'Alberi', '#/riconosci': 'Riconosci', '#/': 'Uscite' }[parentOf(r)]);
// modalita' app: quando il titolo grande della pagina passa sotto la barra in alto, la barra lo mostra piccolo al centro (come iOS)
let titleIO = null;
function watchTitle() {
  const bar = $('.appbar-title');
  if (!bar) return;
  titleIO?.disconnect();
  document.documentElement.classList.remove('title-in-bar');
  // il titolo del livello in cui sei: prima quello della pagina interna (confronto, scheda), poi quello della sezione
  const v = $('.view:not([hidden])');
  const h = v?.querySelector('.cmp-title') || v?.querySelector('.phero-title') || v?.querySelector('.view-title');
  // dove c'e' il logo (la home) la barra ha gia' il suo titolo: niente titolino sopra il logo
  if (!h || ($('.brand') && !$('.brand').hidden)) return;
  bar.textContent = h.textContent.trim();
  const top = $('.appbar').getBoundingClientRect().bottom;
  titleIO = new IntersectionObserver(([e]) => {
    // fuori dalla vista ma sopra (scorso via), non sotto (pagina corta o non ancora raggiunto)
    document.documentElement.classList.toggle('title-in-bar', !e.isIntersecting && e.boundingClientRect.top < top);
  }, { rootMargin: `-${Math.round(top)}px 0px 0px 0px` });
  titleIO.observe(h);
}
function updateBack(r, nav) {
  if (nav === 'pop') { while (navStack.length && navStack[navStack.length - 1].hash !== r.hash) navStack.pop(); }
  if (navStack[navStack.length - 1]?.hash !== r.hash) {
    if (nav === 'left' || nav === 'right') navStack.length = 0; // cambio di scheda: si riparte
    navStack.push({ hash: r.hash, title: titleOf(r) });
  }
  const deep = (LEVEL[r.view] || 0) + (r.compare ? 2 : 0) > 0;
  const b = $('.appbar-back');
  if (b) {
    b.hidden = !deep;
    const back = navStack.length > 1 ? navStack[navStack.length - 2].title : PARENT_TITLE(r);
    b.querySelector('span').textContent = back || 'Indietro';
    b.setAttribute('aria-label', `Indietro: ${back || 'pagina precedente'}`);
  }
  // il logo solo in home
  onScrollBar();
  const brand = $('.brand');
  if (brand) brand.hidden = r.view !== 'uscite';
}

function route() {
  const r = parseRoute();
  r.tab = { zona: 'uscite', 'specie-dettaglio': 'specie', alberi: 'specie', albero: 'specie', riconosci: 'specie', info: '', metodo: '', guide: 'uscite', fungo: 'specie', commestibile: 'specie' }[r.view] ?? r.view;
  r.hash = location.hash || '#/';
  const nav = navKind(prev, r), back = prev?.hash || '';
  if (prev) scrollMem.set(prev.hash, scrollY);
  prev = r;
  navigate(() => { routeNow(r, nav); updateBack(r, nav); requestAnimationFrame(watchTitle); }, { nav, back });
}

function routeNow(r, nav) {
  state.view = r.view;
  if (r.zoneId) state.zoneId = r.zoneId;
  if (r.view === 'zona' || r.view === 'mappa') state.trailId = r.trailId || null;
  if (r.view === 'zona') state.dayOffset = r.offset;
  document.querySelectorAll('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== r.view; });
  const tab = r.tab;
  document.querySelectorAll('[data-tab]').forEach((t) => {
    if (t.dataset.tab === tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  $('.tabbar')?.style.setProperty('--ti', TABS.indexOf(tab));
  document.body.dataset.page = r.view;
  if (r.view === 'specie-dettaglio') renderSpeciesDetail($('#species-detail'), r.speciesId);
  if (r.view === 'albero') renderTreePage($('#tree-detail'), r.treeId);
  if (r.view === 'guide') renderGuide($('#guide-body'), r.guideId);
  if (r.view === 'metodo') renderMethod($('#method-body'));
  if (r.view === 'commestibile') renderEdiblePage(r.speciesId);
  if (r.view === 'fungo') renderTaxonPage($('#taxon-detail'), r.taxonId);
  if (r.view === 'riconosci') { setCompare(r.compare, r.pick); renderIdentify($('#identify')); }
  if (r.view === 'mappa') {
    requestAnimationFrame(() => {
      map?.invalidateSize();
      const lb = $('.legend-box');
      // aperta di default solo su schermi grandi (larghi e alti): su telefono e tablet la carta prima di tutto
      if (lb && !lb.dataset.touched) lb.open = matchMedia('(min-width: 1200px) and (min-height: 760px)').matches;
      const z = zones.find((x) => x.id === r.zoneId);
      if (z && map) { map.flyToBounds(L.latLng(z.lat, z.lon).toBounds(z.radius_m * 2.6), { duration: 0.5 }); openSheet(z.id); }
    });
  }
  renderAll();
  // indietro: torni dove eri nella lista; avanti: dall'inizio
  if (r.view !== 'mappa') scrollTo(0, nav === 'pop' ? (scrollMem.get(r.hash) || 0) : 0);
}

const go = (hash) => { location.hash = hash; };

// Filtri in una sola riga: tutti i gruppi visibili (si parte da "Tutti" e si restringe) e le preferenze come interruttori
const PREFS = [['avoidCrowd', 'Poca gente'], ['preferComfort', 'Accesso comodo'], ['distancePenalty', 'Vicino a Rieti']];
// ordine dei funghi: prima quelli in stagione adesso, poi per pregio; i primi CHIPS_SHOWN visibili, gli altri dietro "+ altri"
let fitN = 99; // quanti funghi entrano nella riga senza tagliare (ricalcolato sulla larghezza)
const QUALITY = { ottimo: 1, buono: 0.6 };
let chipsOpen = false;
function groupOrder() {
  const m = new Date().getMonth();
  const val = (g) => {
    const sp = SPECIES.filter((x) => x.group === g.id);
    const season = Math.max(...sp.map((x) => x.months[m] || 0));
    const q = Math.max(...sp.map((x) => QUALITY[idData?.species?.[x.id]?.edibility] ?? 0.3));
    return (season >= 0.6 ? 2 : season >= 0.3 ? 1 : 0) + q;
  };
  return [...GROUPS].sort((a, b) => val(b) - val(a));
}
// adatta il numero di funghi visibili alla larghezza: la riga si taglia solo se proprio non c'e' spazio
function fitChips(box) {
  const cs = getComputedStyle(box);
  const W = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
  if (W <= 0) return;
  const gap = parseFloat(cs.columnGap) || 8;
  const w = (el) => (el ? el.getBoundingClientRect().width + gap : 0);
  // su mobile le preferenze vanno a capo (riga propria): nella prima riga contano solo "Tutti", i funghi e "+ altri"
  const sep = box.querySelector('.af-sep');
  const wrap = sep && getComputedStyle(sep).flexBasis === '100%';
  const fixed = w(box.querySelector('[data-g="all"]')) + (w(box.querySelector('[data-more]')) || 96) + (wrap ? 0 : w(sep) + [...box.querySelectorAll('[data-p]')].reduce((a, el) => a + w(el), 0)); // 112 = "+ altri N"
  let used = fixed, n = 0;
  for (const el of box.querySelectorAll('.chip-g')) { if (used + w(el) > W) break; used += w(el); n++; }
  n = Math.max(1, n);
  if (n !== fitN) { fitN = n; renderFilterSummary(); }
}
let fitT2;
addEventListener('resize', () => { clearTimeout(fitT2); fitT2 = setTimeout(() => { fitN = 99; renderFilterSummary(); }, 150); });
function renderFilterSummary() {
  renderFilterBox($('#active-filters'));
  renderFilterBox($('#map-filters'), true);
  renderTrackedSpecies();
}
function renderFilterBox(box, onMap = false) {
  if (!box) return;
  const all = state.speciesIds === null;
  const order = groupOrder();
  // in mappa la riga scorre di lato: tutti i funghi, senza "+ altri"
  const vis = chipsOpen || onMap ? order : order.filter((g, k) => k < fitN || (!all && groupSelection(g.id) !== 'none'));
  const hidden = order.length - vis.length;
  const bd = onMap && results ? bestOfDay(state.dayOffset) : null;
  const dayChip = bd ? `<button type="button" class="chip chip-day" data-days aria-expanded="${!!box.closest('.map-top')?.classList.contains('days-open')}" style="--dc:var(${scoreVar(bd.s)})"><i></i>${esc(state.dayOffset === 0 ? 'Oggi' : state.dayOffset === 1 ? 'Domani' : fmtDate(bd.d.date, { weekday: 'short' }).replace('.', '').replace(/^./, (c) => c.toUpperCase()))} ${esc(fmtDate(bd.d.date, { day: 'numeric' }))} <b class="pc">${formatIndex(bd.s)}</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>` : '';
  box.innerHTML = `${dayChip}<button type="button" class="chip" data-g="all" aria-pressed="${all}">Tutti</button>
    ${vis.map((g) => `<button type="button" class="chip chip-g" data-g="${g.id}" aria-pressed="${!all && groupSelection(g.id) !== 'none'}">${esc(g.label)}${outOfSeason(g.id) ? '<small class="season-out">Fuori stagione</small>' : ''}</button>`).join('')}
    <button type="button" class="chip chip-more" data-more aria-haspopup="dialog">Tutti i filtri</button>
    <span class="af-sep" aria-hidden="true"></span>
    ${PREFS.map(([k, label]) => `<button type="button" class="chip pref" data-p="${k}" aria-pressed="${!!state[k]}">${esc(label)}</button>`).join('')}`;
  const changed = () => soft(() => { savePrefs(); renderFilterSummary(); if (series) { compute(); outCache.clear(); renderAll(); } });
  box.querySelector('[data-days]')?.addEventListener('click', (e) => {
    const top = box.closest('.map-top');
    const open = top.classList.toggle('days-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
    if (open) top.querySelector('.day[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
  box.querySelector('[data-more]')?.addEventListener('click', openFullFilters);
  box.classList.toggle('open', chipsOpen);
  box.querySelector('[data-less]')?.addEventListener('click', () => soft(() => { chipsOpen = false; renderFilterSummary(); }));
  if (!chipsOpen && !onMap) fitChips(box);
  box.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.g;
    if (id === 'all') state.speciesIds = null;
    else toggleGroup(id);
    changed();
  }));
  box.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => soft(() => { state[b.dataset.p] = !state[b.dataset.p]; savePrefs(); renderFilterSummary(); renderAll(); })));
}

// Tutti i gruppi sono sempre raggiungibili, anche quando la riga compatta ne mostra pochi.
function openFullFilters() {
  let dlg = $('#full-filters');
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.id = 'full-filters'; dlg.className = 'full-filters';
    dlg.setAttribute('aria-labelledby', 'full-filters-title'); document.body.appendChild(dlg);
  }
  const paint = () => {
    const selected = selectedCatalog(), date = filterDate();
    const chip = (s) => `<button type="button" class="chip species-choice" data-catalog-id="${s.id}" aria-pressed="${state.speciesIds === null || state.speciesIds.has(s.id)}"><span>${esc(s.name)}<small class="${seasonStatus(s,date)==='out'?'season-out':''}">${seasonStatus(s,date)==='out'?'Fuori stagione':s.toxicity==='commestibile con cautela'?'Preparazione specifica':''}</small></span></button>`;
    dlg.innerHTML = `<div class="filter-panel-head"><h2 id="full-filters-title">Tutti i filtri</h2><button type="button" class="btn ghost" data-close>Chiudi</button></div>
      <p>Scegli gruppi o singole specie commestibili.</p>
      <label class="species-search-label" for="species-filter-search">Aggiungi una specie</label>
      <input id="species-filter-search" class="wiz-input" type="search" placeholder="Es. pioppino, spugnola, Boletus…" role="combobox" aria-autocomplete="list" aria-controls="species-filter-options" aria-expanded="false" autocomplete="off">
      <ul id="species-filter-options" class="species-options" role="listbox" aria-label="Specie commestibili" hidden></ul>
      <p class="small muted">Da “Tutti”, scegliere una specie restringe la selezione; poi puoi aggiungerne altre.</p>
      ${state.speciesIds !== null ? `<div class="filter-panel-groups selected-species" aria-label="Specie selezionate">${selected.map(s=>`<button type="button" class="chip" data-remove-species="${s.id}" aria-label="Rimuovi ${esc(s.name)}">${esc(s.name)}${seasonStatus(s,date)==='out'?'<small class="season-out">Fuori stagione</small>':''} <span aria-hidden="true">×</span></button>`).join('')}</div>` : ''}
      <div class="filter-panel-groups" role="group" aria-label="Gruppi di funghi">
        <button type="button" class="chip" data-all aria-pressed="${state.speciesIds === null}">Tutti i commestibili</button>
        ${GROUPS.map(g=>`<button type="button" class="chip" data-group="${g.id}" aria-pressed="${groupSelection(g.id)!=='none'}">${thumb(g.rep,32)}<span>${esc(g.label)}${g.id==='porcini'?' (4 specie)':''}${outOfSeason(g.id)?'<small class="season-out">Fuori stagione</small>':''}</span></button>`).join('')}
      </div>
      <details class="catalog-all"><summary>Tutti i ${catalog.length} commestibili del catalogo</summary><div class="filter-panel-groups">${[...catalog].sort((a,b)=>a.name.localeCompare(b.name,'it')).map(chip).join('')}</div></details>
      <p class="small muted">Stagione indicativa per ${fmtDate(date,{day:'numeric',month:'long'})}, variabile con clima e quota. Sono inclusi anche i commestibili che richiedono trattamenti. Il catalogo si amplia: non comprende ogni specie esistente.</p>
      <h3>Preferenze per l'uscita</h3><p class="small muted">Cambiano l'ordine dei consigli, mantenendo l'indice delle condizioni.</p>
      <div class="filter-panel-groups" role="group" aria-label="Preferenze">${PREFS.map(([k,label])=>`<button type="button" class="chip" data-pref="${k}" aria-pressed="${!!state[k]}">${esc(label)}</button>`).join('')}</div>
      <p class="small muted" aria-live="polite">${selected.length} specie selezionate · ${selected.filter(s=>s.modelId).length} con indice di crescita</p><button type="button" class="btn primary big" data-close>Mostra i risultati</button>`;
    dlg.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dlg.close()));
    const changed = (focus) => { savePrefs(); if (series) compute(); outCache.clear(); renderFilterSummary(); renderAll(); paint(); dlg.querySelector(focus)?.focus(); };
    mountSpeciesAutocomplete({ input: dlg.querySelector('#species-filter-search'), list: dlg.querySelector('#species-filter-options'), catalog, date,
      onSelect: s => { addSpecies(s.id); changed('#species-filter-search'); } });
    dlg.querySelector('[data-all]').onclick = () => { state.speciesIds = null; changed('[data-all]'); };
    dlg.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{toggleGroup(b.dataset.group); changed(`[data-group="${b.dataset.group}"]`);});
    dlg.querySelectorAll('[data-remove-species]').forEach(b=>b.onclick=()=>{state.speciesIds.delete(b.dataset.removeSpecies); if (!state.speciesIds.size) state.speciesIds=null; changed('#species-filter-search');});
    dlg.querySelectorAll('[data-catalog-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.catalogId; if(state.speciesIds?.has(id)){state.speciesIds.delete(id);if(!state.speciesIds.size)state.speciesIds=null;}else addSpecies(id);changed('#species-filter-search');});
    dlg.querySelectorAll('[data-pref]').forEach(b=>b.onclick=()=>{const k=b.dataset.pref;state[k]=!state[k];changed(`[data-pref="${k}"]`);});
  };
  dlg.onclose = () => $(state.view === 'mappa' ? '#map-filters [data-more]' : '#active-filters [data-more]')?.focus();
  paint(); dlg.showModal();
}

function renderTrackedSpecies() {
  const box = $('#followed-species'); if (!box) return;
  const selected = state.speciesIds === null ? [] : selectedCatalog();
  box.hidden = !selected.length;
  const date = filterDate();
  box.innerHTML = selected.length ? `<h2 class="sec-title">Le specie che hai scelto</h2><div class="followed-grid">${selected.map(s=>`<article class="followed-card"><a href="${s.href}"><b>${esc(s.name)}</b><i>${esc(s.latin)}</i></a><span class="season-badge ${seasonStatus(s,date)==='out'?'season-out':''}">${seasonLabel(s,date)}</span>${reportBadge(null,s.id)}${s.modelId?'': '<small class="muted">Indice non disponibile</small>'}<button type="button" class="link-btn small" data-report data-species="${s.id}">Segnala un’osservazione</button></article>`).join('')}</div>` : '';
}

async function refreshWeather(force) {
  try {
    $('#updated').textContent = 'Aggiornamento…';
    loadStep(1);
    const w = await loadWeather(zones, { force });
    loadStep(2);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); // lascia disegnare il passo prima del calcolo
    series = w.series;
    zones = zones.filter((z) => series[z.id]); // una zona senza meteo (copia di revisione vecchia) resta fuori
    const sameDay = w.fetchedAt.toDateString() === new Date().toDateString();
    $('#updated').textContent = (w.offline ? 'Senza rete · ' : '') + 'Aggiornamento meteo · ' + (w.snapshot || !sameDay
      ? w.fetchedAt.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : w.fetchedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
    document.documentElement.classList.toggle('is-offline', !!w.offline);
    $('#stale').hidden = !w.stale;
    $('#stale').textContent = 'Meteo salvato o non aggiornato: verifica la data di acquisizione. Oltre 24 ore gli indici per oggi e i giorni futuri non vengono calcolati.';
    $('#today-kicker').textContent = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    compute();
    renderAll();
    loadOuting(zones, { force }).then((o) => { outing = o; outCache.clear(); renderAll(); }).catch(() => {});
  } catch (err) {
    $('#updated').textContent = '';
    const msg = `<div class="error">Non riesco a scaricare il meteo (${esc(err.message)}). Controlla la connessione e <button type="button" class="link-btn" data-retry>riprova</button>.</div>`;
    $('#hero').innerHTML = msg;
    $('#detail').innerHTML = msg;
    document.querySelectorAll('[data-retry]').forEach((b) => b.addEventListener('click', () => refreshWeather(true)));
  }
}

const selectedSpecies = () => { const ids = new Set(selectedCatalog().map(s=>s.modelId).filter(Boolean)); return SPECIES.filter(s=>ids.has(s.id)); };

// meteo della mattina dell'uscita per zona e giorno (null finche' le previsioni orarie non arrivano)
const outCache = new Map();
function wxOf(z, d) {
  if (!d) return null;
  const k = z.id + d.date;
  if (!outCache.has(k)) outCache.set(k, outingFor(outing?.[z.id], z, d.date));
  return outCache.get(k);
}
const wxRank = (z, d) => OUTING_RANK[wxOf(z, d)?.level] ?? OUTING_RANK.non_disponibile;
// "Puoi andare a...": stesso giorno, tempo migliore, funghi ancora probabili
function alternativeFor(z, o, d) {
  const w = wxOf(z, d);
  if (!w || w.level === 'ok') return null;
  const s0 = adjusted(z, d.score, d);
  let best = null;
  for (const z2 of zones) {
    if (z2.id === z.id) continue;
    const d2 = dayEntry(z2.id, o);
    const w2 = wxOf(z2, d2);
    if (!d2?.best || !w2?.available || w2.level !== 'ok') continue;
    const s2 = adjusted(z2, d2.score, d2);
    if (s2 < Math.max(30, s0 * 0.7)) continue;
    const r = s2 * OUTING_RANK[w2.level];
    if (!best || r > best.r) best = { z: z2, d: d2, s: s2, w: w2, r };
  }
  return best;
}
// icona meteo con il suo colore (sole ambra, pioggia blu, temporale viola, neve azzurro)
const wxi = (w) => `<span class="wxi wxi-${wxIcon(w)}">${IC[wxIcon(w)]}</span>`;
const wxIcon = (w) => (!w?.available ? 'unknown' : w?.thunder ? 'storm' : w?.snow ? 'snow' : w && (w.rain >= 0.5 || w.prob >= 50) ? 'rain' : 'sun');

function compute() {
  const sp = selectedSpecies();
  results = {};
  for (const z of zones) {
    const sb = series[z.id];
    const t = sb[0].todayIndex;
    const days = [];
    if (t < 0) { results[z.id] = { todayIndex: t, days }; continue; }
    for (let i = Math.max(30, t - HISTORY_DAYS); i <= t + AHEAD_DAYS && i < sb[0].dates.length; i++) {
      const r = scoreZoneDay(z, habitat[z.id], sb, sp, i);
      // Indice della zona: il migliore delle specie selezionate, senza bonus dal numero di taxa.
      days.push({ i, date: sb[0].dates[i], ...r, score: combine(r.perSpecies.map((p) => p.score)) });
    }
    // fattore umano: accesso, comodita' e affollamento per ogni giorno
    const acc0 = access[z.id]?.[0];
    days.forEach((d, k) => {
      if (!d.best) return;
      d.access = accessFor(z, d.best.species, d.best.band);
      d.comfort = comfortScore({
        driveMin: acc0?.minutes ?? z.drive_min,
        walkM: d.access?.walkM ?? 800,
        surface: d.access?.surface ?? 0,
        unpavedKm: (acc0?.unpaved_tail_km ?? 0) + (acc0?.unpaved_other_km ?? 0),
      });
      const bi = bandIndex(z, d.best.band);
      d.crowd = crowding({
        dateStr: d.date, popularity: z.popularity ?? 0.5, comfort: d.comfort.value,
        scores: days.slice(Math.max(0, k - 6), k + 1).map((x) => x.score),
        rainMm: sb[bi].p[d.i] ?? 0,
      });
    });
    results[z.id] = { todayIndex: t, days };
  }
}

const dayEntry = (zid, offset) => {
  const r = results[zid];
  return r.days.find((d) => d.i === r.todayIndex + offset);
};
// indice "opportunita'": l'indice di fruttificazione corretto con le preferenze attive
// le stesse correzioni di adjusted(), una per una, per spiegarle
let prep = null, trailheads = {}, treesData = null, idData = null;
const srcLinks = (src) => (src || []).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(' · ');
function prepGeneralHtml(rules) {
  const ord = [...rules].sort((a, b) => (a.level === 'obbligatorio' ? 0 : 1) - (b.level === 'obbligatorio' ? 0 : 1));
  return `<details class="prep-gen"><summary><h2>Prepararli e conservarli: le regole per tutti</h2></summary>
    <ol class="k-steps">${ord.map((r) => `<li class="${r.level === 'obbligatorio' ? 'must' : 'tip'}"><b>${esc(r.title)}</b> ${esc(r.text)}${r.why ? `<small>${esc(r.why)}</small>` : ''}<span class="k-src">${r.level === 'obbligatorio' ? '<span class="k-lv">indicazione di sicurezza</span>' : '<span class="k-lv tip">prudenziale</span>'}${r.sources?.length ? `<details class="k-src-d"><summary>Fonti (${r.sources.length})</summary>${srcLinks(r.sources)}</details>` : ''}</span></li>`).join('')}</ol>
  </details>`;
}
const adjParts = (zone, d) => {
  const out = [];
  if (state.distancePenalty) out.push({ label: 'vicino a Rieti', mult: 1 - 0.3 * Math.min(1, (access[zone.id]?.[0]?.minutes ?? zone.drive_min) / 120) });
  if (state.avoidCrowd && d?.crowd) out.push({ label: 'poca gente', mult: 1 - 0.45 * d.crowd.value });
  if (state.preferComfort && d?.comfort) out.push({ label: 'accesso comodo', mult: 0.55 + 0.45 * d.comfort.value });
  return out;
};
const preferenceRank = (zone, score, d) => {
  let v = score;
  if (state.distancePenalty) v *= 1 - 0.3 * Math.min(1, (access[zone.id]?.[0]?.minutes ?? zone.drive_min) / 120);
  if (state.avoidCrowd && d?.crowd) v *= 1 - 0.45 * d.crowd.value;
  if (state.preferComfort && d?.comfort) v *= 0.55 + 0.45 * d.comfort.value;
  return Math.round(v);
};
// ogni specie con la stessa correzione dell'anello: i numeri si confrontano tra loro e la prima coincide con l'indice
// Il numero mostrato resta biologico; le preferenze cambiano solo l'ordine.
const adjusted = (zone, score) => Number.isFinite(score) ? score : null;
const spScore = (z, d, p) => p.score;
const spPill = (name, sc) => `<span class="sp-pill" title="${esc(scoreLabel(sc))}"><i style="background:var(${scoreVar(sc).replace('--s', '--ps')})"></i>${name ? `${esc(name)} ` : ''}<b>${formatIndex(sc)}</b></span>`;

// Punto del bosco adatto piu' vicino a una strada carrozzabile (campioni Carta Forestale + Valhalla).
function accessFor(z, sp, band) {
  const hab = habitat[z.id];
  if (!hab?.samples?.[0] || hab.samples[0].length < 5) return null;
  const pick = (strictBand) => {
    let best = null;
    for (const smp of hab.samples) {
      const [e, c, lat, lon, dist, surf, ri, rlat, rlon] = smp;
      if (dist == null) continue;
      const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
      if ((sp.forest[cat] || 0) < 0.6) continue;
      if (e < sp.elev[0] - 50 || e > sp.elev[1] + 50) continue;
      if (strictBand && Math.abs(e - band) > 150) continue;
      const cost = dist + 300 * (surf || 0);
      if (!best || cost < best.cost) best = { cost, e, cat, lat, lon, walkM: dist, surface: surf || 0, road: ri >= 0 ? hab.road_names[ri] : null, rlat, rlon };
    }
    return best;
  };
  const best = pick(true) || pick(false);
  if (!best) return null;
  // quanto bosco adatto e' lontano dalle strade (meno battuto)
  let n = 0, far = 0;
  for (const smp of hab.samples) {
    const cat = smp[1] >= 0 ? hab.sample_categories[smp[1]] : 'non bosco';
    if ((sp.forest[cat] || 0) < 0.6 || Math.abs(smp[0] - band) > 150 || smp[4] == null) continue;
    n++;
    if (smp[4] > 600) far++;
  }
  return { ...best, farShare: n ? far / n : 0 };
}

// Sentieri della zona ordinati per km in bosco adatto alla specie, alla quota giusta.
function trailsFor(z, sp, band) {
  const tz = trails[z.id];
  if (!tz) return [];
  return tz.trails.map((t) => {
    let n = 0, lo = Infinity, hi = -Infinity;
    const cats = {};
    for (const [e, c] of t.samples) {
      const cat = c >= 0 ? tz.sample_categories[c] : 'non bosco';
      if ((sp.forest[cat] || 0) < 0.6 || e < sp.elev[0] || e > sp.elev[1] || Math.abs(e - band) > 250) continue;
      n++; lo = Math.min(lo, e); hi = Math.max(hi, e);
      cats[cat] = (cats[cat] || 0) + 1;
    }
    const mainCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    // i lunghi itinerari (E1, Sentiero Italia, cammini) ricalcano i sentieri CAI: precedenza ai locali
    const long = ['INT', 'NAT', 'REG'].includes(t.group);
    return { ...t, goodKm: n / 10, lo, hi, mainCat, long, rank: (n / 10) * (long ? 0.7 : 1) };
  }).filter((t) => t.goodKm >= 0.3).sort((a, b) => b.rank - a.rank);
}

let spFilter = 'all', spQuery = '';
const normTxt = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function renderSpeciesGrid() {
  const box = $('#species-grid');
  if (!box) return;
  if (!box.querySelector('#sp-head')) {
    const chips = [{ id: 'all', label: 'Tutti' }, { id: 'season', label: 'In stagione ora' }];
    // un solo campo di ricerca nell'app: qui apre la ricerca generale, con funghi e sosia in cima
    box.innerHTML = `<button type="button" id="sp-head" class="search-box search-fake" data-open-search><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
        <span>Cerca funghi, sosia, alberi, zone…</span></button>
      <div class="filter-rail" role="group" aria-label="Gruppi">${chips.map((g) => `<button type="button" class="chip" data-spf="${g.id}" aria-pressed="${spFilter === g.id}">${esc(g.label)}</button>`).join('')}</div>
      <div class="card-grid" id="sp-cards"></div>`;
    box.querySelector('#sp-head').addEventListener('click', () => openSearch());
    box.querySelectorAll('[data-spf]').forEach((b) => b.addEventListener('click', () => {
      spFilter = b.dataset.spf;
      box.querySelectorAll('[data-spf]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.spf === spFilter)));
      fillSpecies();
    }));
  }
  fillSpecies();
}
const catalogPhoto = (s) => s.modelId ? speciesPhoto(s.modelId) : searchTaxa().find(t => t.key === s.id)?.photo;
function fillSpecies() {
  const date = todayISO();
  const matched = spQuery.trim() ? searchEdibleCatalog(catalog, spQuery, { date, limit: catalog.length }) : catalog;
  const list = matched.filter(s => spFilter === 'all' || (spFilter === 'season' ? seasonStatus(s,date)==='in' : s.group===spFilter));
  $('#sp-cards').innerHTML = list.map(s => {
    const ph = catalogPhoto(s);
    return `<a class="sp-card" href="${s.href}" aria-label="${esc(s.name)}">
      ${ph ? `<img src="${ph.file}" alt="" loading="lazy" decoding="async">` : `<span class="catalog-placeholder" aria-hidden="true">${esc(s.name.slice(0,2))}</span>`}<span class="shade"></span>
      <span class="pill glass sm">${seasonLabel(s,date)}</span>
      <span class="sp-card-body"><b>${esc(s.name)}</b><i>${esc(s.latin)}</i></span></a>`;
  }).join('') || `<p class="muted empty-note">Nessuna specie commestibile con “${esc(spQuery)}”.</p>`;
}

function renderEdiblePage(id) {
  const s = catalog.find(x=>x.id===id), box=$('#edible-detail');
  if (!s) { box.innerHTML='<p>Specie non presente nel catalogo.</p>';return; }
  const date=todayISO(), names=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  box.innerHTML=`<article class="editorial-article"><p class="eyebrow">Taccuino delle specie</p><h1>${esc(s.name)}</h1><p><i>${esc(s.latin)}</i></p><span class="season-badge ${seasonStatus(s,date)==='out'?'season-out':''}">${seasonLabel(s,date)}</span>
    <p>${esc(s.habitat || '')}</p><h2>Quando osservarla</h2><p>${s.months?.length ? s.months.map(m=>names[m-1]).join(' · ') : 'Calendario non ancora documentato.'}</p><p class="small muted">Stagione indicativa da manualistica, non validata nel Reatino: clima e quota possono spostarla. Le coltivazioni seguono cicli diversi.</p>
    ${s.caution?`<p class="notice">${esc(s.caution)}</p>`:''}
    <h2>Le osservazioni aiutano a conoscerla</h2><p>L’indice di crescita non è ancora disponibile per questa specie. Puoi annotare ritrovamenti e ricerche a vuoto nel taccuino e scegliere di condividerli.</p><button class="btn primary" type="button" data-report data-species="${s.id}">Segnala un’osservazione</button>
    <p class="small muted">Commestibilità della specie, non dell’esemplare: foto e schede non confermano l’identità. Fai controllare il raccolto all’Ispettorato micologico ASL e segui le indicazioni di preparazione.</p><details><summary>Fonti</summary><ul>${(s.sources||[]).map(x=>`<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></li>`).join('')}</ul></details></article>`;
}


function renderAll() {
  if (!results) return;
  if (state.view === 'uscite') { renderDays(); renderHome(); }
  if (state.view === 'zona') renderDetail();
  if (state.view === 'mappa') { renderMapDays(); renderFilterBox($('#map-filters'), true); renderMap(); renderLegend(); if (sheetZone) openSheet(sheetZone); }
}

function bestOfDay(o) {
  let best = null;
  for (const z of zones) {
    const d = dayEntry(z.id, o);
    if (!d?.best) continue;
    const sc = adjusted(z, d.score, d);
    const rank = preferenceRank(z, sc, d) * wxRank(z, d) * communityRank(z.id, selectedCatalog().map((s) => s.id));
    if (!best || rank > best.rank) best = { s: sc, rank, z, d, o };
  }
  return best;
}

const dayLabel = (o, date, long = false) => (o === 0 ? 'Oggi' : o === 1 ? 'Domani'
  : fmtDate(date, long ? { weekday: 'long', day: 'numeric' } : { weekday: 'short' }));

function dayChips(box, selected, onPick, { withAll = false } = {}) {
  box.innerHTML = '';
  const mk = (top, mid, o, sc) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'day';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(selected === o));
    // selezionato: tutta la tessera prende il colore del suo indice (il testo si adegua al chiaro/scuro della tinta)
    if (sc != null) { b.dataset.lv = scoreVar(sc).slice(3); b.style.setProperty('--sel', `var(${scoreVar(sc)})`); }
    b.innerHTML = `<span class="d1">${top}</span><span class="d2">${mid}</span>${sc != null ? `<span class="d3"><span class="dot" style="--dc:var(${scoreVar(sc)});--dcs:var(${scoreVar(sc).replace('--s', '--ps')})"></span><b class="pc">${formatIndex(sc)}</b></span>` : '<span class="d3">giorni</span>'}`;
    b.addEventListener('click', () => onPick(o));
    box.appendChild(b);
  };
  if (withAll) {
    // la settimana intera: intervallo di date e miglior indice del periodo
    const bests = [...Array(AHEAD_DAYS + 1).keys()].map((o) => bestOfDay(o)).filter(Boolean);
    if (bests.length) {
      const d0 = bests[0].d.date, d1 = bests[bests.length - 1].d.date;
      const same = d0.slice(5, 7) === d1.slice(5, 7);
      const range = `${fmtDate(d0, { day: 'numeric' })}–${fmtDate(d1, { day: 'numeric' })}`;
      mk('Settimana', range, null, Math.max(...bests.map((x) => x.s)));
      const b = box.lastChild;
      b.classList.add('day-all');
      b.setAttribute('aria-label', `Tutta la settimana, ${fmtDate(d0, { day: 'numeric', month: 'long' })} - ${fmtDate(d1, { day: 'numeric', month: 'long' })}${same ? '' : ''}: mostra le uscite migliori del periodo`);
    }
  }
  for (let o = 0; o <= AHEAD_DAYS; o++) {
    const best = bestOfDay(o);
    if (best) mk(o === 0 ? 'Oggi' : o === 1 ? 'Domani' : fmtDate(best.d.date, { weekday: 'short' }).replace('.', ''), fmtDate(best.d.date, { day: 'numeric' }), o, best.s);
  }
  box.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function renderDays() {
  dayChips($('#days'), state.homeDay, (o) => soft(() => { state.homeDay = o; renderAll(); }), { withAll: true });
}

function combosList() {
  const combos = [];
  for (const z of zones) {
    for (let o = 0; o <= AHEAD_DAYS; o++) {
      if (state.homeDay != null && o !== state.homeDay) continue;
      const d = dayEntry(z.id, o);
      if (d?.best) { const s = adjusted(z, d.score, d); combos.push({ z, o, d, s, r: preferenceRank(z, s, d) * wxRank(z, d) * communityRank(z.id, selectedCatalog().map((s) => s.id)) }); }
    }
  }
  const seenTrails = new Set(), list = [];
  for (const c of uniquePlaceProposals(combos)) {
    const walk = walkFor(c.z, c.d, null, seenTrails);
    if (!walk && trails[c.z.id]?.trails.length) continue; // same mapped route already featured elsewhere
    if (walk) seenTrails.add(String(walk.t.id));
    list.push({ ...c, walk });
  }
  return list;
}

const walkHref = (z, o, t) => `#/zona/${z.id}/${o}${t ? '/sentiero/' + t.id : ''}`;
function walkFor(z, d, trailId = null, excluded = new Set()) {
  const all = (trails[z.id]?.trails || []).filter(t => !excluded.has(String(t.id)));
  const compatible = d?.best ? trailsFor(z, d.best.species, d.best.band).filter(t => !excluded.has(String(t.id))) : [];
  const selected = trailId && all.find(t => String(t.id) === String(trailId));
  const t = selected ? compatible.find(t => t.id === selected.id) || selected
    : chooseWalkTrail(compatible, all, t => headsOf(z, t));
  return walkContext(z, t, t ? headsOf(z, t) : []);
}
const walkBrief = w => w ? `${w.t.ref ? 'Sentiero ' + w.t.ref : trailName(w.t)} · ${w.t.difficulty || 'difficoltà n.d.'} · ${fmtKm(w.t.in_zone_km)} km nella zona` : 'Sentieri da verificare';

// Nome della zona in titolo + sottotitolo ("Monte Tancia (Monti Sabini)" -> due righe)
const splitName = (z) => {
  if (z.title) return [z.title, z.subtitle || ''];
  const m = z.name.match(/^(.*?)\s*(?:\(|\s\/\s|\s–\s)\s*(.*?)\)?$/);
  return m ? [m[1], m[2]] : [z.name, ''];
};
// Foto di copertina: il luogo se c'e', altrimenti il fungo da cercare
// indice della ricerca generale: tutto quello che l'app sa, in voci semplici
function buildSearch(idj, trj, embedded) {
  const A = embedded ? (f) => embedded.assets?.[f] || '' : (f) => f;
  const img = (src) => (src ? `<img class="thumb" src="${src}" width="44" height="44" alt="" loading="lazy" decoding="async">` : '');
  const items = [];
  for (const z of zones) {
    const tip = Object.keys(habitat?.[z.id]?.forest?.tipologie_ha || {}).join(' ');
    // "faggio" deve trovare le zone con faggete: nomi degli alberi i cui sinonimi compaiono nei tipi di bosco
    const tl = tip.toLowerCase();
    const treesHere = Object.values(trj?.trees || {}).filter((t) => [t.name, ...(t.aliases || [])].some((a) => a && tl.includes(String(a).toLowerCase()))).map((t) => t.name).join(' ');
    const cv = coverOf(z);
    items.push({ kind: 'zona', title: splitName(z)[0], sub: splitName(z)[1] || z.name, hay: `${z.name} ${tip} ${treesHere} ${(habitat?.[z.id]?.road_names || []).join(' ')}`, href: `#/zona/${z.id}`, img: cv ? img(cv.small) : '', boost: 1 });
  }
  for (const sp of catalog.filter(s=>s.modelId)) {
    const d = idj?.species?.[sp.id] || {};
    items.push({ kind: 'fungo', title: sp.name, sub: sp.latin, hay: `${(d.aka || []).join(' ')} ${sp.group || ''} ${d.latin || ''}`, href: `#/specie/${sp.id}`, img: thumb(sp.id, 44), boost: 1 });
  }
  for (const s of catalog.filter(s=>!s.modelId)) {
    const ph = catalogPhoto(s);
    items.push({kind:'fungo',title:s.name,sub:s.latin,hay:(s.aliases||[]).join(' '),href:s.href,img:ph?img(ph.file):'',boost:1});
  }
  for (const t of searchTaxa().filter(t=>!catalog.some(s=>s.id===t.key))) {
    const look = t.look.map((id) => SPECIES.find((x) => x.id === id)?.name).filter(Boolean);
    items.push({ kind: 'velenoso', title: t.name || t.latin, sub: `${t.name !== t.latin ? t.latin : ''}${look.length ? `${t.name !== t.latin ? ' · ' : ''}si confonde con ${look.slice(0, 2).join(', ').toLowerCase()}` : ''}`, hay: look.join(' '), href: `#/fungo/${t.key}`, img: t.photo ? img(A(t.photo.thumb || t.photo.file)) : '', badge: t.toxicity, badgeCls: `tox-${String(t.toxicity).replace(/\s/g, '-')}` });
  }
  for (const [id, t] of Object.entries(trj?.trees || {})) {
    items.push({ kind: 'albero', title: t.name, sub: t.latin, hay: `${(t.aliases || []).join(' ')} ${t.type || ''}`, href: `#/albero/${encodeURIComponent(id)}`, img: treeThumb(id, 44) });
  }
  const seen = new Map();
  for (const z of zones) for (const t of trails[z.id]?.trails || []) {
    const key = String(t.id);
    if (seen.has(key)) { seen.get(key).zs.push(z); continue; }
    seen.set(key, { t, zs: [z] });
  }
  for (const { t, zs } of seen.values()) {
    items.push({ kind: 'sentiero', title: `${t.ref ? `Sentiero ${t.ref}` : 'Sentiero'}${t.name ? ` · ${t.name}` : ''}`, sub: zs.map((z) => splitName(z)[0]).join(', '), hay: `${(t.itinerary || []).join(' ')} ${t.operator || ''} cai segnavia`, href: walkHref(zs[0], 0, t), img: segnavia(t) });
  }
  const pages = [
    ['Riconosci un fungo', 'Descrivi quello che vedi, anche se è velenoso', 'identificare trovato velenoso sosia caratteri lamelle pori volva anello sporata', '#/riconosci'],
    ['Emergenza e intossicazione', 'Cosa fare, chi chiamare', 'emergenza intossicazione avvelenamento centro antiveleni 118 112 pronto soccorso sintomi', '#/info'],
    ['Regole di raccolta nel Lazio', 'Attestato, contributo, limiti, orari', 'regole legge tesserino attestato contributo 3 kg limite orari divieti parchi aree protette', '#/info'],
    ['Controllo gratuito all\'ASL', 'Ispettorato micologico', 'asl ispettorato micologico controllo gratuito micologo', '#/info'],
    ['Come funziona l\'indice', 'Formule, parametri, fonti e limiti', 'metodo scienza scientifico indice calcolo formula pioggia temperatura suolo latenza innesco probabilita affidabilita fonti letteratura euristica', '#/metodo'],
    ['Gli alberi', 'Riconoscerli e cosa ci cresce sotto', 'alberi bosco piante', '#/alberi'],
    ['Prepararli e conservarli', 'Crudo, prebollitura, congelare, essiccare, sott\'olio', 'preparazione cucina cuocere cottura crudo prebollitura congelare surgelare essiccare seccare sottolio sott olio botulino conserve vasetti quantita bambini gravidanza alcol', '#/info'],
    ['Il diario delle passeggiate', 'Annota ricerche, ritrovamenti e osservazioni', 'diario uscite registrare raccolto storico esporta', '#/diario'],
    ['Il taccuino del bosco', 'Alberi, piogge e preparazione della passeggiata', 'imparare guida passeggiate boschi editoriale', '#/guide/leggere-il-bosco'],
    ['La mappa', 'Zone, parcheggi, sentieri, Carta Forestale', 'mappa carta forestale parcheggio sosta', '#/mappa'],
    ['Installa l\'app', 'A tutto schermo e senza campo', 'installa app schermo home offline', '#/info'],
  ];
  for (const [title, sub, hay, href] of pages) items.push({ kind: 'pagina', title, sub, hay, href, img: '<span class="sr-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg></span>' });
  initSearch(items);
}

function coverOf(z, spId) {
  const zm = zoneMedia[z.id];
  if (zm) return { hd: zm.file_hd || zm.file, small: zm.file, credit: zm, alt: z.name };
  const p = speciesPhoto(spId);
  return p ? { hd: p.file_hd || p.file, small: p.file, credit: p, alt: '' } : null;
}
const ring = (s, big = true) => `<span class="ring${big ? '' : ' ring-sm'}" style="--c:var(${scoreVar(s).replace('--s', '--ps')});--p:${s ?? 0}" aria-label="Indice ${formatIndex(s)} su 10, ${scoreLabel(s)}"><b>${scoreText(s)}</b>${big ? `<small>${scoreShortLabel(s)}</small>` : ''}</span>`;
const IC = {
  unknown: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16v-4.5L7 7h10l2 4.5V16"/><path d="M3.5 16h17"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/></svg>',
  people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/></svg>',
  walk: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M8 11l3-3.5 3 1.5 2 3M11.5 14.5l1-5"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  rain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 15a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 8.5 3.5 3.5 0 0 1 17.5 15z"/><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/></svg>',
  storm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 7.5 3.5 3.5 0 0 1 17.5 14z"/><path d="M12.5 13l-2.5 4h3l-2 4"/></svg>',
  snow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 7.5 3.5 3.5 0 0 1 17.5 14z"/><path d="M9 18h.01M12 20h.01M15 18h.01"/></svg>',
};
// affollamento in parole (il livello resta basso/medio/alto per i colori)
const CROWD = { basso: 'poca gente', medio: 'un po\' di gente', alto: 'molta gente' };
const crowdText = (c) => CROWD[c?.level] || '';
const fact = (ic, html) => `<span class="fact">${IC[ic]}${html}</span>`;
const creditLine = (m) => m ? `Foto: ${esc(m.author || '')}${m.license ? `, ${esc(m.license)}` : ''} · <a href="${esc(m.page)}" target="_blank" rel="noopener">${esc(m.source || 'fonte')}</a>` : '';

function renderHome() {
  const list = combosList();
  const hero = list[0];
  const box = $('#hero');
  renderTrackedSpecies();
  if (!hero) { box.innerHTML = `<p class="notice">${selectedSpecies().length ? 'Le condizioni di crescita non sono calcolabili: mancano dati o meteo aggiornato.' : 'Per queste specie l’indice di crescita non è ancora disponibile. Puoi consultare le schede e contribuire con le osservazioni.'} Puoi comunque esplorare boschi e sentieri.</p><div class="explore-fallback">${zones.slice(0, 6).map((z) => `<a class="btn ghost" href="#/zona/${z.id}/${state.homeDay || 0}">${esc(z.title || z.name)}</a>`).join('')}</div>`; $('#ranking').innerHTML = ''; $('#others-h').hidden = true; renderSeason(); renderCommunityIntro(); return; }
  $('#others-h').hidden = false;
  const t = hero.d.crowd ? timingAdvice({ dateStr: hero.d.date, lat: hero.z.lat, lon: hero.z.lon, crowd: hero.d.crowd }) : null;
  const a0 = access[hero.z.id]?.[0];
  const [title, sub] = splitName(hero.z);
  const cov = coverOf(hero.z, hero.d.best.species.id);
  // le altre specie: testo con il pallino della classe, non pillole (non sono bottoni)
  const also = hero.d.perSpecies.slice(1, 3).map((p) => [p, spScore(hero.z, hero.d, p)]).filter(([, sc]) => sc >= 20)
    .map(([p, sc], k) => `<span class="sp-also">${k ? ', ' : ''}<i style="background:var(${scoreVar(sc).replace('--s', '--ps')})"></i>${esc(p.species.name.split(' / ')[0].toLowerCase())} <b class="pc">${formatIndex(sc)}</b></span>`);
  const w0 = wxOf(hero.z, hero.d);
  // il posto con l'indice piu' alto quel giorno, se il meteo della mattina l'ha fatto scendere: nota breve e cliccabile
  const g = list.filter((c) => c.o === hero.o).sort((a, b) => b.s - a.s)[0], wg = g && wxOf(g.z, g.d);
  const note = g && g.z.id !== hero.z.id && wg && wg.level !== 'ok'
    ? `<a class="cover-note" href="#/zona/${g.z.id}/${g.o}"><span>${wxi(wg)}<b>${esc(splitName(g.z)[0])}</b> <span class="pc-up">${formatIndex(g.s)}</span> ma ${esc(wg.short || wg.main)}</span><span aria-hidden="true">›</span></a>` : '';
  box.innerHTML = `
    <p class="small muted">Condizioni di crescita: indice sperimentale 0–10. Le passeggiate sono ordinate con preferenze, meteo e segnalazioni recenti; i ritrovamenti restano incerti.</p>
    <div class="cover vtn" style="--vtn:cover">
      ${cov ? `<img class="cover-img" src="${cov.hd}" alt="${esc(cov.alt)}" fetchpriority="high">` : ''}
      <span class="shade"></span>
      <a class="cover-link" data-walk-zone="${hero.z.id}" href="${walkHref(hero.z, hero.o, hero.walk?.t)}" aria-label="${esc(title)}, ${esc(hero.walk?.microzone || sub)}, ${esc(dayLabel(hero.o, hero.d.date, true))}: il taccuino della passeggiata"></a>
      <span class="cover-top"><span class="pill glass">Una passeggiata da esplorare · ${esc(dayLabel(hero.o, hero.d.date, true))}</span>${ring(hero.s)}</span>
      <span class="cover-body">
        <span class="cover-title">${esc(title)}</span>${sub ? `<span class="cover-sub">${esc(sub)}</span>` : ''}
        ${hero.walk ? `<span class="cover-walk"><b>${esc(hero.walk.microzone)}</b><span>${esc(walkBrief(hero.walk))}</span></span>` : ''}
        <span class="cover-sp">${thumb(hero.d.best.species.id, 44)}<span><small>Da conoscere in questi boschi</small><span class="cover-sp-name"><b>${esc(hero.d.best.species.name)}</b> ${reportBadge(hero.z.id, hero.d.best.species.id)}</span>
          <small>${intornoA(hero.d.best.band)} ${hero.d.best.band} m${also.length ? ` · anche ${also.join('')}` : ''}</small></span></span>
        <span class="facts" aria-label="L'uscita in breve">${t ? fact('clock', `<span class="fk">entro le </span><b>${fmtRough(t.arrive, 15, 'floor')}</b>`) : ''}${fact('car', `<span><b>${access[hero.z.id]?.[0]?.minutes ?? hero.z.drive_min}</b><span class="fk2"> min</span><span class="fk3">′</span></span>`)}${hero.d.crowd ? fact('people', crowdText(hero.d.crowd)) : ''}${w0 ? `<span class="fact wx-${w0.level}" title="${esc(w0.text)}">${wxi(w0)}<span class="fx">${esc(w0.level === 'ok' ? w0.main : (w0.short || w0.main))}</span></span>` : ''}</span>
        ${note}
        <span class="cover-cta" aria-hidden="true">Il taccuino della passeggiata <span>→</span></span>
      </span>
    </div>`;
  const ol = $('#ranking');
  ol.innerHTML = list.slice(1, 8).map((c) => {
    const cv = coverOf(c.z, c.d.best.species.id);
    return `<li class="vtn" style="--vtn:t-${c.z.id}-${c.o}"><a class="tile" data-walk-zone="${c.z.id}" href="${walkHref(c.z, c.o, c.walk?.t)}">
      ${cv ? `<img src="${cv.small}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>${ring(c.s, false)}${(() => { const w = wxOf(c.z, c.d); return w && w.level !== 'ok' ? `<span class="tile-wx wx-${w.level}" title="${esc(w.text)}">${wxi(w)}${esc(OUTING_LABEL[w.level])}</span>` : ''; })()}
      <span class="tile-body"><span class="tile-day">${esc(dayLabel(c.o, c.d.date, true))}</span><b>${esc(splitName(c.z)[0])}</b>${c.walk ? `<span class="tile-micro">${esc(c.walk.microzone)}</span><small>${esc(walkBrief(c.walk))}</small>` : ''}<small>${esc(c.d.best.species.name)} · ${c.d.best.band} m</small></span>
    </a></li>`;
  }).join('');
  $('#others-h').hidden = list.length < 2;
  fitFacts($('#hero .facts'));
  renderSeason();
  renderCommunityIntro();
  fitCover();
}

function renderCommunityIntro() {
  const box = $('#community-intro');
  if (box) box.innerHTML = `<p class="eyebrow">Un bosco da conoscere insieme</p><h2>Ogni passeggiata aggiunge un pezzetto.</h2><p>Fungaroli nasce per esplorare i sentieri, imparare e osservare. Vogliamo renderlo più accurato grazie alle vostre segnalazioni, anche quando una ricerca non porta ritrovamenti.</p><p class="small muted">${esc(communityStatus())}</p><button class="btn primary" type="button" data-report>Segnala dal bosco</button> <button class="btn ghost" type="button" data-community-account>Il tuo profilo</button>`;
}

// barra delle info: se non ci sta, toglie prima "entro le", poi "min", poi il testo del meteo quando e' bello (resta l'icona)
function fitFacts(el) {
  if (!el) return;
  el.classList.remove('t1', 't2', 't3');
  for (const c of ['t1', 't2', 't3']) { if (el.scrollWidth <= el.clientWidth + 1) break; el.classList.add(c); }
}
addEventListener('resize', () => fitFacts($('#hero .facts')));
document.fonts?.ready.then(() => fitFacts($('#hero .facts'))); // misurata col font giusto, non con quello di riserva
// Copertina della home alta quanto serve per arrivare esatta sopra la barra in basso, su ogni telefono
function fitCover() {
  const c = $('#hero .cover');
  if (!c || state.view !== 'uscite') return;
  const vh = window.visualViewport?.height || innerHeight;
  const tab = $('.tabbar').getBoundingClientRect();
  const below = tab.top > vh / 2 ? vh - tab.top : 0; // barra in basso (telefono) o in alto (desktop)
  const top = c.getBoundingClientRect().top + scrollY;
  const h = Math.round(vh - top - below - 14);
  // mai piu' bassa del contenuto: il titolo non deve finire sotto l'etichetta in alto
  const body = c.querySelector('.cover-body');
  // telefono: testo sotto la foto (in flusso), alla foto restano almeno 200 px
  const split = body && getComputedStyle(body).position !== 'absolute';
  const need = split ? body.offsetHeight + 200
    : (body?.offsetHeight || 0) + (c.querySelector('.cover-top')?.offsetHeight || 0) + 18 * 2 + 14;
  fitFacts(c.querySelector('.facts'));
  document.documentElement.style.setProperty('--cover-h', `${Math.max(need, vh < 800 ? 300 : 400, Math.min(640, h))}px`);
}
let fitT;
const refit = () => { clearTimeout(fitT); fitT = setTimeout(fitCover, 120); };
addEventListener('resize', refit);
addEventListener('orientationchange', refit);
window.visualViewport?.addEventListener('resize', refit);

// "Nei boschi in questi giorni": tutte le specie, il miglior indice tra le zone nel giorno scelto
function renderSeason() {
  const box = $('#season');
  if (!box) return;
  const o = state.homeDay ?? 0;
  const best = {};
  for (const z of zones) {
    const d = dayEntry(z.id, o);
    if (!d) continue;
    for (const p of scoreZoneDay(z, habitat[z.id], series[z.id], selectedSpecies(), d.i).perSpecies) {
      if (!best[p.species.id] || p.score > best[p.species.id].score) best[p.species.id] = { ...p, z };
    }
  }
  const arr = Object.values(best).filter((p) => p.score >= 15).sort((a, b) => b.score - a.score).slice(0, 10);
  $('#season-h').hidden = !arr.length;
  box.innerHTML = arr.map((p) => {
    const ph = speciesPhoto(p.species.id);
    return `<li><button type="button" class="portrait" data-species="${p.species.id}">
      ${ph ? `<img src="${ph.file}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>${ring(p.score, false)}
      <span class="portrait-body"><b>${esc(p.species.name)}</b>${reportBadge(p.z.id, p.species.id)}<small>${esc(splitName(p.z)[0])}</small></span></button></li>`;
  }).join('');
}

function renderMapDays() {
  // scelto il giorno, su telefono la fila si richiude (resta il chip del giorno in testa ai filtri)
  dayChips($('#map-days'), state.dayOffset, (o) => { state.dayOffset = o; $('.map-top')?.classList.remove('days-open'); renderAll(); renderFilterSummary(); });
}
// riquadro della zona aperto: su telefono la barra delle sezioni si toglie di mezzo (come fa Google Maps)
new MutationObserver(() => document.documentElement.classList.toggle('map-sheet-open', !$('#map-sheet')?.hidden))
  .observe(document.getElementById('map-sheet') || document.body, { attributes: true, attributeFilter: ['hidden'] });

// Riquadro dal basso sulla mappa: riassunto della zona e accesso alla scheda
let sheetZone = null;
function openSheet(zid) {
  sheetZone = zid;
  if (!results) return; // il meteo non e' ancora arrivato: renderAll riapre il riquadro
  const z = zones.find((x) => x.id === zid);
  const d = dayEntry(zid, state.dayOffset);
  const sh = $('#map-sheet');
  if (!z || !d?.best) { sh.hidden = true; return; }
  const sc = adjusted(z, d.score, d);
  const cv = coverOf(z, d.best.species.id);
  sh.innerHTML = `
    <button type="button" class="sheet-close" aria-label="Chiudi">✕</button>
    <a class="sheet-row" href="#/zona/${zid}/${state.dayOffset}">
      <span class="sheet-img">${cv ? `<img src="${cv.small}" alt="" loading="lazy" decoding="async">` : ''}${ring(sc, false)}</span>
      <span class="sheet-txt"><span class="eyebrow">${esc(dayLabel(state.dayOffset, d.date, true))}</span><b class="sheet-title">${esc(splitName(z)[0])}</b>
        <span class="small">${esc(d.best.species.name)} ~${d.best.band} m · ${access[zid]?.[0]?.minutes ?? z.drive_min} min${d.crowd ? ` · ${crowdText(d.crowd)}` : ''}</span>${wxOf(z, d) ? `<span class="small wx-line wx-${wxOf(z, d).level}">${wxi(wxOf(z, d))}${esc(wxOf(z, d).text)}</span>` : ''}</span>
    </a>
    ${forestOn ? forestHere(zid) : ''}
    <p class="sheet-key small"><span class="key-p">P</span> sosta <span class="key-walk">${IC.walk}</span> qui lasci l'auto <span class="key-trail"></span> sentiero consigliato <span class="muted">· tocca un segno</span></p>
    <a class="btn primary big" href="#/zona/${zid}/${state.dayOffset}">Apri il piano dell'uscita</a>`;
  sh.hidden = false;
  sh.querySelector('.sheet-close').addEventListener('click', () => { sh.hidden = true; sheetZone = null; state.zoneId = null; renderMap(); });
  if (state.zoneId !== zid) { state.zoneId = zid; renderMap(); }
}

function openPoint(zid, pt) {
  const z = zones.find((x) => x.id === zid);
  const d = dayEntry(zid, state.dayOffset);
  const sh = $('#map-sheet');
  if (!z || !d?.best) return;
  const copyBtn = (lat, lon) => `<button type="button" class="btn ghost" data-copy="${lat.toFixed(5)}, ${lon.toFixed(5)}">Copia coordinate</button>`;
  let ic, eyebrow, title, text, actions;
  if (pt.kind === 'parking') {
    ic = '<span class="pt-ic pt-p">P</span>'; eyebrow = 'Sosta per l\'auto'; title = pt.p.name;
    text = 'Parcheggio o slargo da cui partono i boschi della zona.';
    actions = `<a class="btn primary big" href="${gmaps(pt.p.lat, pt.p.lon)}" target="_blank" rel="noopener">${IC.car} Indicazioni stradali fin qui</a>${copyBtn(pt.p.lat, pt.p.lon)}`;
  } else if (pt.kind === 'access') {
    const ax = d?.access;
    ic = `<span class="pt-ic pt-walk">${IC.walk}</span>`; eyebrow = 'Qui lasci l\'auto e prosegui a piedi'; title = ax.road || 'Punto più vicino al bosco adatto';
    text = `In auto ${ax.surface ? `su ${SURF_LABEL[ax.surface]}` : 'su asfalto'} fino a qui, poi ${ax.walkM < 50 ? `il bosco adatto è a bordo strada: ${esc((SHORT[ax.cat] || ax.cat).toLowerCase())} a ${ax.e} m` : `${walkTxt(ax.walkM)} in linea d'aria fino a ${esc((SHORT[ax.cat] || ax.cat).toLowerCase())} a ${ax.e} m`}, adatto a ${esc(d.best.species.name.toLowerCase())}.`;
    actions = `<a class="btn primary big" href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">${IC.car} Indicazioni stradali fin qui</a>${copyBtn(ax.rlat, ax.rlon)}`;
  } else if (pt.kind === 'trailhead') {
    const h = pt.h, t = pt.t;
    ic = `<span class="pt-ic pt-th">${segnavia(t)}</span>`; eyebrow = 'Imbocco del sentiero'; title = trailName(t);
    text = `Qui il sentiero incontra una ${h.kind === 'strada' ? 'strada mappata' : 'strada sterrata mappata'}${h.road ? ` (${esc(h.road)})` : ''}${h.ele != null ? `, a circa ${Math.round(h.ele / 25) * 25} m` : ''}. Verifica transitabilità e possibilità di sosta.`;
    actions = `<a class="btn primary big" href="${gmaps(h.lat, h.lon)}" target="_blank" rel="noopener">${IC.car} Indicazioni stradali fin qui</a>
      <a class="btn ghost" href="${walkHref(z, state.dayOffset, t)}">Il taccuino di questo sentiero</a>${copyBtn(h.lat, h.lon)}`;
  } else {
    const t = pt.t;
    ic = null; eyebrow = 'Sentiero da esplorare'; title = '';
    text = trailCard(z, t, d, false);
    actions = `<a class="btn primary big" href="${walkHref(z, state.dayOffset, t)}">Il taccuino di questo sentiero</a>${trailLinks(z, t)}`;
  }
  sh.innerHTML = `
    <div class="sheet-nav"><button type="button" class="sheet-back">‹ ${esc(splitName(z)[0])}</button><button type="button" class="sheet-close" aria-label="Chiudi">✕</button></div>
    ${ic ? `<div class="pt-head">${ic}<div><span class="eyebrow">${eyebrow}</span><b class="sheet-title">${esc(title)}</b></div></div>
    <p class="small pt-text">${text}</p>` : `<span class="eyebrow">${eyebrow}</span>${text}`}
    <div class="pt-actions">${actions}</div>`;
  sh.hidden = false;
  sh.querySelector('.sheet-back').addEventListener('click', () => openSheet(zid));
  sh.querySelector('.sheet-close').addEventListener('click', () => { sh.hidden = true; sheetZone = null; state.zoneId = null; renderMap(); });
  sh.querySelector('[data-trail]')?.addEventListener('click', () => openPoint(zid, { kind: 'trail', t: pt.t, top: false }));
  sh.querySelector('[data-copy]')?.addEventListener('click', (e) => {
    const b = e.currentTarget;
    navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.textContent = 'Copiate'; }).catch(() => { b.textContent = b.dataset.copy; });
  });
}

function initMap() {
  const bm = globalThis.FUNGAROLI_DATA?.basemap || globalThis.FUNGAROLI_REVIEW?.basemap;
  if (hasLeaflet() && bm) { initEmbeddedMap(bm); return; }
  if (!hasLeaflet()) { document.querySelector('.view-map')?.classList.add('schematic'); return; } // senza Leaflet: mappa schematica
  map = L.map('map', { scrollWheelZoom: true, zoomControl: false }).setView([42.4, 13.05], 10);
  const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17, attribution: '© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)',
  }).addTo(map);
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
  const forest = L.tileLayer.wms('https://geoportale.regione.lazio.it/geoserver/ows', {
    layers: 'geonode:tipi_forestali2', format: 'image/png', transparent: true, opacity: 0.55,
    attribution: 'Carta Forestale © Regione Lazio',
  });
  mapControls({ bases: [['Topografica', 'assets/map-thumb-topo.jpg', topo], ['Stradale', 'assets/map-thumb-osm.jpg', osm]], forest });
  map.on('zoomend', () => results && state.view === 'mappa' && renderMap());
  // la carta cambia misura (barra in alto che sparisce, rotazione): Leaflet va avvisato
  new ResizeObserver(() => map.invalidateSize()).observe($('#map'));
  if (canHover) {
    map.on('mousemove', hoverCell);
    map.on('mouseout', () => hoverCell({ latlng: L.latLng(0, 0) }));
  }
}

// Controlli della mappa come nelle app di mappe: una colonna in alto a destra (livelli, posizione;
// zoom + e - solo con il mouse, al tocco si usano due dita). Le opzioni stanno in un unico pannello.
function mapControls({ bases = null, forest }) {
  let base = bases?.[0]?.[2] || null, me = null;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const Ctl = L.Control.extend({
    onAdd() {
      const box = L.DomUtil.create('div', 'mapctl');
      box.innerHTML = `<div class="mapctl-stack">
          <button type="button" class="mapctl-btn" data-act="layers" aria-label="Livelli della mappa" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg></button>
          <button type="button" class="mapctl-btn" data-act="locate" aria-label="La mia posizione"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/></svg></button>
          ${fine ? '<button type="button" class="mapctl-btn" data-act="in" aria-label="Ingrandisci">+</button><button type="button" class="mapctl-btn" data-act="out" aria-label="Riduci">−</button>' : ''}
        </div>
        <div class="mapctl-panel" hidden>
          <div class="mapctl-head"><b>Livelli</b><button type="button" class="mapctl-x" data-act="layers" aria-label="Chiudi">✕</button></div>
          ${bases ? `<p class="eyebrow">Tipo di mappa</p><div class="mapctl-tiles">${bases.map(([n, img], k) => `<button type="button" class="mapctl-tile" data-base="${k}" aria-pressed="${k === 0}"><img src="${img}" alt="" width="64" height="64"><span>${n}</span></button>`).join('')}</div>` : ''}
          <p class="eyebrow">Dettagli della mappa</p>
          <div class="mapctl-tiles"><button type="button" class="mapctl-tile" data-act="forest" aria-pressed="false"><img src="assets/map-thumb-forest.jpg" alt="" width="64" height="64"><span>Carta Forestale</span></button></div>
          <p class="small muted mapctl-note" hidden>Colori dei tipi di bosco: vedi Legenda in basso.</p>
        </div>`;
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.disableScrollPropagation(box);
      const panel = box.querySelector('.mapctl-panel');
      const lbtn = box.querySelector('[data-act="layers"]');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'layers') { panel.hidden = !panel.hidden; lbtn.setAttribute('aria-expanded', String(!panel.hidden)); box.classList.toggle('open', !panel.hidden); }
        if (act === 'in') map.zoomIn();
        if (act === 'out') map.zoomOut();
        if (act === 'forest') {
          const on = !map.hasLayer(forest);
          if (on) forest.addTo(map); else forest.remove();
          b.setAttribute('aria-pressed', String(on));
          box.querySelector('.mapctl-note').hidden = !on;
          lbtn.classList.toggle('on', on);
          forestOn = on;
          const w = $('#legend .wms');
          if (w) { w.hidden = !on; w.innerHTML = forestLegend(); }
          if (sheetZone && !$('#map-sheet').hidden && $('#map-sheet .sheet-row')) openSheet(sheetZone);
          if (on) $('.legend-box').open = true;
        }
        if (b.dataset.base != null) {
          const nb = bases[+b.dataset.base][2];
          if (nb !== base) { base.remove(); nb.addTo(map); nb.bringToBack(); base = nb; }
          box.querySelectorAll('[data-base]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        }
        if (act === 'locate') {
          b.classList.add('busy');
          map.locate({ setView: true, maxZoom: 14, enableHighAccuracy: true });
        }
      });
      map.on('click', () => { panel.hidden = true; lbtn.setAttribute('aria-expanded', 'false'); box.classList.remove('open'); });
      map.on('locationfound', (e) => {
        box.querySelector('[data-act="locate"]').classList.remove('busy');
        if (!me) me = L.layerGroup().addTo(map);
        me.clearLayers();
        L.circle(e.latlng, { radius: e.accuracy, color: '#2a78d6', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(me);
        L.circleMarker(e.latlng, { radius: 7, color: '#fff', weight: 3, fillColor: '#2a78d6', fillOpacity: 1, interactive: false }).addTo(me);
      });
      map.on('locationerror', () => {
        const b = box.querySelector('[data-act="locate"]');
        b.classList.remove('busy');
        b.setAttribute('aria-label', 'Posizione non disponibile: controlla i permessi del browser');
        b.classList.add('err'); setTimeout(() => b.classList.remove('err'), 2500);
      });
      return box;
    },
  });
  new Ctl({ position: 'topright' }).addTo(map);
}


// Versione Artifact: base topografica e Carta Forestale incorporate come immagini georeferenziate.
function initEmbeddedMap(bm) {
  const bounds = L.latLngBounds(bm.bounds);
  map = L.map('map', { maxBounds: bounds.pad(0.05), minZoom: 9, maxZoom: 14, zoomSnap: 0.5, zoomControl: false }).fitBounds(bounds);
  L.imageOverlay(bm.topo, bounds, { className: 'basemap', attribution: bm.attribution }).addTo(map);
  const forest = L.imageOverlay(bm.forest, bounds, { opacity: 0.55, className: 'forestmap' });
  map.setView([42.42, 13.03], 10);
  mapControls({ forest });
  map.on('zoomend', () => results && state.view === 'mappa' && renderMap());
  // la carta cambia misura (barra in alto che sparisce, rotazione): Leaflet va avvisato
  new ResizeObserver(() => map.invalidateSize()).observe($('#map'));
  if (canHover) {
    map.on('mousemove', hoverCell);
    map.on('mouseout', () => hoverCell({ latlng: L.latLng(0, 0) }));
  }
}

const shortName = (z) => z.title || z.name.split(/[/–(]/)[0].trim();

// Dove cercare dentro una zona: i punti campione della Carta Forestale (griglia di 300 m) con bosco adatto
// alla specie e una quota vicina a quella migliore del giorno. Il valore di un riquadro e' l'indice della specie
// (stessa correzione dell'anello) per l'adattezza del bosco e della quota: dice "bosco giusto alla quota giusta",
// non "qui c'e' il fungo". Prima specie migliore, poi le altre due (vince la piu' alta).
// Le celle hanno il passo del reticolo originale (300–500 m).
const cellSize = (z) => z.radius_m / 10;
function zoneCells(z, d) {
  const hab = habitat[z.id];
  if (!hab?.samples?.length || !d?.perSpecies?.length) return [];
  const sp = d.perSpecies.map((p) => ({ p, sc: spScore(z, d, p) })).filter((x) => x.sc >= 10);
  const out = [];
  for (const smp of hab.samples) {
    const [e, c, lat, lon] = smp;
    const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    const parts = [];
    for (const { p, sc } of sp) {
      const f = p.species.forest[cat] || 0;
      if (cat === FOREST.CON && ['suillus', 'terreum'].includes(p.species.id)) continue; // categoria mista: presenza di pini non confermata
      if (f < 0.5) continue;
      // il meteo e' calcolato alla quota migliore della specie: entro 200 m vale tutto, poi cala fino a 600 m
      const band = Math.max(0, 1 - Math.max(0, Math.abs(e - p.band) - 200) / 400);
      const v = Math.round(sc * f * elevationFit(p.species, e) * band);
      if (v >= 5) parts.push({ sp: p.species, v });
    }
    if (!parts.length) continue;
    parts.sort((a, b) => b.v - a.v);
    const v = combine(parts.map((x) => x.v)); // stesso aggregato della zona
    if (v >= 15) out.push({ lat, lon, v, e, cat, parts, size: cellSize(z) });
  }
  return out;
}
let cellRenderer = null, cellsOut = false;
// popover della mappa: titolo e percentuale grande, una riga per fungo con la barretta nella scala dell'indice, l'azione in fondo
function mapCard({ title, sub, pct, rows = [], more = 0, foot = '' }) {
  return `<div class="mtt"><b class="mtt-t">${esc(title)}</b>${sub ? `<span class="mtt-s">${sub}</span>` : ''}
    <span class="mtt-p" style="--c:var(${scoreVar(pct)})"><b class="pc">${scoreText(pct)}</b><small>${esc(scoreLabel(pct).toLowerCase())}</small></span>
    ${rows.length ? `<ul class="mtt-rows">${rows.map((r) => `<li><span>${esc(r.name)}</span><i><i style="width:${r.v}%;background:var(${scoreVar(r.v)})"></i></i><b class="pc">${formatIndex(r.v)}</b></li>`).join('')}</ul>` : ''}
    ${more ? `<p class="mtt-more">e altri ${more}</p>` : ''}${foot ? `<p class="mtt-f">${foot}</p>` : ''}</div>`;
}
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
// i riquadri sono disegnati su una tela che non prende il mouse (sotto ci sono cerchi e sentieri):
// il riquadro sotto il puntatore si trova dalla posizione (cellHits) e si evidenzia con un contorno a parte
let cellHits = [], cellHi = null, cellTip = null;
function cellsLayer(z, d, interactive = true) {
  if (!map.getPane('cells')) map.createPane('cells').style.zIndex = 410; // sopra i cerchi, sotto le etichette
  cellRenderer ||= L.canvas({ padding: 0.3, pane: 'cells' });
  const lg = L.layerGroup();
  const size = cellSize(z);
  const dLat = size / 2 / 111320, dLon = size / 2 / (111320 * Math.cos(z.lat * Math.PI / 180));
  for (const c of zoneCells(z, d)) {
    L.rectangle([[c.lat - dLat, c.lon - dLon], [c.lat + dLat, c.lon + dLon]], {
      renderer: cellRenderer, interactive: false, stroke: false, fillColor: cssVar(mapVar(c.v)), fillOpacity: 0.5 + 0.4 * Math.min(1, c.v / 80),
    }).addTo(lg);
    if (interactive) cellHits.push({ z, c, dLat, dLon });
  }
  return lg;
}
function cellAt(ll) {
  for (const h of cellHits) if (Math.abs(ll.lat - h.c.lat) <= h.dLat && Math.abs(ll.lng - h.c.lon) <= h.dLon) return h;
  return null;
}
function hoverCell(e) {
  const h = map && $('#map').classList.contains('cells-on') ? cellAt(e.latlng) : null;
  if (!h) { cellHi?.remove(); cellHi = null; cellTip?.remove(); cellTip = null; return; }
  const { c, dLat, dLon } = h;
  const b = [[c.lat - dLat, c.lon - dLon], [c.lat + dLat, c.lon + dLon]];
  if (!cellHi) cellHi = L.rectangle(b, { interactive: false, color: '#fff', weight: 2.5, fill: false, className: 'cell-hi' }).addTo(map);
  else cellHi.setBounds(b);
  const html = mapCard({ title: 'Questo riquadro', sub: `${esc(c.cat)} · ${c.e} m · campione ${c.size} m`, pct: c.v,
    rows: c.parts.slice(0, 3).map((x) => ({ name: x.sp.name.split(' / ')[0], v: x.v })), more: Math.max(0, c.parts.length - 3),
    foot: 'Campione di habitat: verifica alberi ospiti, divieti e condizioni sul posto.' });
  if (!cellTip) cellTip = L.tooltip({ className: 'zone-tt', direction: 'top', offset: [0, -14], opacity: 1 }).setLatLng(e.latlng).setContent(html).addTo(map);
  else { cellTip.setLatLng(e.latlng); if (cellTip._fz !== c) cellTip.setContent(html); }
  cellTip._fz = c;
}

function renderMap() {
  if (!hasLeaflet()) {
    renderSvgMap($('#map'), {
      zones, origin,
      items: zones.map((z) => {
        const d = dayEntry(z.id, state.dayOffset);
        const s = adjusted(z, d?.score ?? null, d);
        return {
          z, score: s, color: `var(${mapVar(s)})`, selected: z.id === state.zoneId,
          tooltip: `${z.name} · ${scoreText(s)}/10 ${scoreLabel(s).toLowerCase()}${d?.best ? ` · ${d.best.species.name} ~${d.best.band} m` : ''}`,
        };
      }),
      onSelect: (id) => openSheet(id),
    });
    return;
  }
  // passaggio cerchi pieni <-> riquadri: prima si anima (carta, cerchi, riquadri in dissolvenza), poi si ridisegna
  const mapEl = $('#map');
  const want = map.getZoom() >= 11.5 || !!state.zoneId;
  const had = mapEl.classList.contains('cells-on');
  const slow = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (had && !want && slow && !cellsOut) {
    cellsOut = true;
    mapEl.classList.remove('cells-on');
    setTimeout(() => { cellsOut = false; renderMap(); }, 420);
    return;
  }
  for (const k in zoneLayers) zoneLayers[k].remove();
  zoneLayers = {};
  cellHits = []; cellHi?.remove(); cellHi = null; cellTip?.remove(); cellTip = null;
  // al primo disegno la carta e' gia' nello stato giusto (niente dissolvenza colorata -> grigia); dopo, i passaggi si animano
  if (!mapEl.dataset.ready) {
    mapEl.dataset.ready = '1';
    mapEl.classList.add('no-anim');
    mapEl.classList.toggle('cells-on', want);
    setTimeout(() => mapEl.classList.remove('no-anim'), 120);
  } else if (want && !had) requestAnimationFrame(() => requestAnimationFrame(() => mapEl.classList.add('cells-on')));
  else mapEl.classList.toggle('cells-on', want);
  // etichette con nome: spostamento verticale greedy (in pixel) per evitare sovrapposizioni
  const placed = [];
  const labelPos = {};
  for (const z of zones) {
    const pt = map.latLngToContainerPoint([z.lat, z.lon]);
    const w = 40 + shortName(z).length * 7;
    let y = pt.y;
    const hit = (yy) => placed.some((b) => Math.abs(b.x - pt.x) < (b.w + w) / 2 + 4 && Math.abs(b.y - yy) < 26);
    for (let k = 1; hit(y) && k < 8; k++) y = pt.y + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 26;
    placed.push({ x: pt.x, y, w });
    labelPos[z.id] = map.containerPointToLatLng([pt.x, y]);
  }
  for (const z of zones) {
    const d = dayEntry(z.id, state.dayOffset);
    const s = adjusted(z, d?.score ?? null, d);
    const color = cssVar(mapVar(s));
    const g = L.layerGroup().addTo(map);
    const selected = z.id === state.zoneId;
    // il cerchio e' l'area di cui si parla, non il posto dei funghi: da vicino resta solo il contorno, dentro i riquadri
    const near = map.getZoom() >= 11.5;
    const showCells = near || selected;
    const circle = L.circle([z.lat, z.lon], {
      radius: z.radius_m, color: selected ? cssVar('--text') : color, weight: selected ? 2.5 : 2,
      dashArray: showCells ? '6 6' : null, fillColor: color, fillOpacity: 0.28, className: `zone-c${showCells ? ' has-cells' : ''}`,
    }).addTo(g).on('click', () => openSheet(z.id));
    if (showCells && d) cellsLayer(z, d).addTo(g);
    else if (d && canHover) {
      // a volo d'uccello: passandoci sopra la zona si accende e mostra in anteprima i suoi riquadri
      let prev = null;
      circle.on('mouseover', () => { circle.setStyle({ weight: 3.5, dashArray: '6 6' }); circle.getElement()?.classList.add('peek'); prev ||= cellsLayer(z, d, false); prev.addTo(g); mapEl.classList.add('cells-peek'); });
      circle.on('mouseout', () => { circle.setStyle({ weight: 2, dashArray: null }); circle.getElement()?.classList.remove('peek'); mapEl.classList.remove('cells-peek'); setTimeout(() => { if (!mapEl.classList.contains('cells-peek')) prev?.remove(); }, 300); });
    }
    if (canHover && !showCells) {
      const [t1, t2] = splitName(z);
      g.getLayers()[0].bindTooltip(mapCard({ title: t1, sub: t2 ? esc(t2) : '', pct: s,
        rows: (d?.perSpecies || []).slice(0, 3).map((p) => ({ name: p.species.name.split(' / ')[0], v: spScore(z, d, p) })),
        more: Math.max(0, (d?.perSpecies?.filter((p) => spScore(z, d, p) >= 10).length || 0) - 3),
        foot: 'Tocca per aprire la zona' }), { className: 'zone-tt', sticky: true, direction: 'top', offset: [0, -14], opacity: 1 });
    }
    L.marker(labelPos[z.id], {
      icon: L.divIcon({ className: '', html: `<span class="zone-label${state.zoneId && !selected ? ' zone-label-min' : ''}${selected ? ' zone-label-sel' : ''}"><span class="dot" style="background:${color}"></span> <b class="pc">${formatIndex(s)}</b>${state.zoneId && !selected ? '' : ` <span class="zone-name">${esc(shortName(z))}</span>`}</span>`, iconSize: null }),
      interactive: false,
    }).addTo(g);
    if (selected && d?.best) {
      const tl = trailsFor(z, d.best.species, d.best.band);
      const topId = tl[0]?.id;
      for (const t of trails[z.id]?.trails || []) {
        const good = tl.find((x) => x.id === t.id);
        for (const line of t.lines) {
          L.polyline(line, { color: cssVar(t.id === topId ? '--accent' : '--text-2'), weight: t.id === topId ? 5 : good ? 3 : 2, opacity: good ? 0.95 : 0.5, dashArray: good ? null : '4 4' })
            .addTo(g).on('click', (e) => { L.DomEvent.stop(e); openPoint(z.id, { kind: 'trail', t: good || t, top: t.id === topId }); })
            .bindTooltip(`${t.ref ? 'CAI ' + esc(t.ref) + ' · ' : ''}${esc(t.name || t.itinerary.join(' – ') || 'Sentiero')}`, { sticky: true });
        }
      }
      // imbocchi dei sentieri adatti: un segnavia piccolo dove si lascia l'auto (uno per punto, anche se ci passano piu' sentieri)
      const seenTh = [];
      for (const t of tl) for (const h of headsOf(z, t)) {
        if (seenTh.some((q) => Math.abs(q.lat - h.lat) < 0.0015 && Math.abs(q.lon - h.lon) < 0.002)) continue;
        seenTh.push(h);
        L.marker([h.lat, h.lon], { icon: L.divIcon({ className: '', html: `<span class="map-th${h.kind === 'strada' ? '' : ' unpaved'}" aria-hidden="true"><i></i><i></i><i></i></span>`, iconSize: [18, 22], iconAnchor: [9, 11] }), keyboard: true, title: `Imbocco: ${trailName(t)}` })
          .addTo(g).on('click', () => openPoint(z.id, { kind: 'trailhead', h, t }));
      }
      if (d.access?.rlat) {
        L.polyline([[d.access.rlat, d.access.rlon], [d.access.lat, d.access.lon]], { color: cssVar('--text'), weight: 2, dashArray: '2 5', interactive: false }).addTo(g);
        L.marker([d.access.rlat, d.access.rlon], { icon: L.divIcon({ className: '', html: `<span class="map-pin" aria-hidden="true">${IC.walk}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }), keyboard: true, title: 'Qui lasci l\'auto e prosegui a piedi' })
          .addTo(g).on('click', () => openPoint(z.id, { kind: 'access' }));
      }
    }
    if (selected) {
      for (const p of z.parking) {
        L.marker([p.lat, p.lon], { icon: L.divIcon({ className: '', html: '<span class="map-p" aria-hidden="true">P</span>', iconSize: [28, 28], iconAnchor: [14, 14] }), keyboard: true, title: `Sosta: ${p.name}` })
          .addTo(g).on('click', () => openPoint(z.id, { kind: 'parking', p }));
      }
    }
    zoneLayers[z.id] = g;
  }
}

function renderLegend() {
  const items = [...CLASSES].reverse().map((c) => `<span><span class="sw" style="background:var(${mapVar(c.min)})"></span>${c.label}${c.min ? ' ≥' + formatIndex(c.min) : ''}</span>`);
  $('#legend').innerHTML = items.join('') +
    (hasLeaflet() || !globalThis.FUNGAROLI_DATA ? '' : '<span class="muted">Schema: cerchi = zone, anelli = distanza in linea d\'aria da Rieti</span>') +
    (hasLeaflet() ? '<span class="lg-cells"><span class="sw sw-cell"></span>Riquadri campionati da 300–500 m: habitat potenziale, senza verifica di presenza o permesso di raccolta. Avvicinati o apri una zona per vederli.</span>' : '') +
    `<div class="wms"${forestOn ? '' : ' hidden'}>${forestLegend()}</div>`;
}

// legenda della Carta Forestale nel nostro carattere: prima i tipi della zona aperta (con la quota), poi quelli delle altre zone
let forestOn = false;
const FL = new Map(FOREST_LEGEND.map(([n, c, p]) => [n, { c, p }]));
const flSw = (n) => { const f = FL.get(n); return f ? `<i class="fl-sw${f.p ? ' fl-righe' : ''}" style="--fc:${f.c}"></i>` : '<i class="fl-sw"></i>'; };
// nel riquadro della zona, con la Carta Forestale accesa: i tipi di bosco che vedi qui
function forestHere(zid) {
  const t = habitat?.[zid]?.forest?.tipologie_ha;
  if (!t) return '';
  const tot = Object.values(t).reduce((a, b) => a + b, 0);
  const top = Object.entries(t).filter(([n]) => FL.has(n)).sort((a, b) => b[1] - a[1]).slice(0, 4).filter(([, ha]) => ha / tot >= 0.02);
  return top.length ? `<ul class="fl fl-sheet" aria-label="Tipi di bosco nella zona">${top.map(([n, ha]) => `<li>${flSw(n)}<span>${esc(n)}</span><b>${Math.round((ha / tot) * 100)}%</b></li>`).join('')}</ul>` : '';
}
function forestLegend() {
  const here = sheetZone && habitat?.[sheetZone]?.forest?.tipologie_ha;
  const tot = here ? Object.values(here).reduce((a, b) => a + b, 0) : 0;
  const mine = here ? Object.entries(here).filter(([n, ha]) => FL.has(n) && ha / tot >= 0.01).sort((a, b) => b[1] - a[1]) : [];
  const all = {};
  for (const z of zones) for (const [n, ha] of Object.entries(habitat?.[z.id]?.forest?.tipologie_ha || {})) all[n] = (all[n] || 0) + ha;
  const others = Object.entries(all).filter(([n]) => FL.has(n) && !mine.some(([m]) => m === n)).sort((a, b) => b[1] - a[1]);
  const row = (n, pct) => `<li>${flSw(n)}<span>${esc(n)}</span>${pct != null ? `<b>${pct < 1 ? '<1' : Math.round(pct)}%</b>` : ''}</li>`;
  const z = zones.find((x) => x.id === sheetZone);
  return `<p class="fl-h">Tipi di bosco${z ? ` · ${esc(splitName(z)[0])}` : ''}</p>
    ${mine.length ? `<ul class="fl">${mine.map(([n, ha]) => row(n, (ha / tot) * 100)).join('')}</ul>` : ''}
    ${others.length ? (mine.length ? `<details class="fl-more"><summary>Nelle altre zone (${others.length})</summary><ul class="fl">${others.map(([n]) => row(n)).join('')}</ul></details>` : `<ul class="fl">${others.map(([n]) => row(n)).join('')}</ul>`) : ''}
    <p class="fl-src">Carta Forestale, Regione Lazio</p>`;
}

function forestBar(frac) {
  const entries = Object.entries(frac).sort((a, b) => b[1] - a[1]);
  const named = entries.filter(([k]) => FOREST_COLORS[k] || k === 'non bosco');
  const other = entries.filter(([k]) => !FOREST_COLORS[k] && k !== 'non bosco').reduce((s, [, v]) => s + v, 0);
  if (other > 0) named.push(['Altro bosco/arbusteto', other]);
  named.sort((a, b) => (a[0] === 'non bosco') - (b[0] === 'non bosco') || b[1] - a[1]);
  const bar = named.map(([k, v]) => `<span style="flex:${v};background:${forestColor(k)}" title="${esc(k)} ${Math.round(v * 100)}%"></span>`).join('');
  const leg = named.filter(([, v]) => v >= 0.03).map(([k, v]) => {
    const tid = treeForCategory(k);
    const label = esc(SHORT[k] || k);
    return `<span><span class="dot" style="background:${forestColor(k)};border-radius:3px"></span> ${tid ? `<a class="tree-link" href="#/albero/${encodeURIComponent(tid)}">${label}</a>` : label} ${Math.round(v * 100)}%</span>`;
  }).join('');
  return `<div class="forest">${bar}</div><div class="forest-legend">${leg}</div>`;
}

const ICON = {
  track: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21 10 3M19 21 14 3"/><circle cx="12" cy="17" r=".6"/><circle cx="10.5" cy="12" r=".6"/><circle cx="13" cy="8.5" r=".6"/><circle cx="12" cy="5" r=".6"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
  find: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 6 0 0 1 16 0z"/><path d="M10 12v6a2 2 0 0 0 4 0v-6"/></svg>',
  when: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16V11l2-4h10l2 4v5"/><path d="M4 16h16"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>',
  trail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20c2-4 8-3 8-7s-6-3-6-7"/><circle cx="17" cy="5" r="1.5"/></svg>',
};

function renderWalkFocus(z, d, walk) {
  if (!walk) return `<p class="small muted">Non abbiamo ancora un sentiero documentato per questa zona.</p>`;
  const { t, h } = walk, sketch = trailSketch(t, h);
  return `<section class="walk-focus" data-walk-trail="${t.id}" aria-label="Microzona e sentiero">
    <p class="eyebrow">La passeggiata, più da vicino</p><h2>${esc(walk.microzone)}</h2>
    <p class="walk-route">${segnavia(t)}<b>${esc(trailName(t))}</b></p>
    <dl class="walk-facts">
      <div><dt>Difficoltà</dt><dd>${esc(t.difficulty ? `${t.difficulty} · ${DIFF[t.difficulty] || 'classificazione della fonte'}` : 'Non indicata nella fonte')}</dd></div>
      <div><dt>Tratto nella zona</dt><dd>${fmtKm(t.in_zone_km)} km${t.lines?.length > 1 ? ' · più segmenti separati' : ''}</dd></div>
      <div><dt>Itinerario completo</dt><dd>${t.total_km ? `${fmtKm(t.total_km)} km` : 'Lunghezza n.d.'}${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div>
      <div><dt>Imbocco mappato</dt><dd>${h ? `${h.ele != null ? `Circa ${Math.round(h.ele / 25) * 25} m · ` : ''}${esc(h.road || (h.kind === 'strada' ? 'su strada' : 'su sterrata'))}` : 'Non disponibile; le soste indicate riguardano la zona'}</dd></div>
    </dl>
    ${t.mainCat ? `<p class="small">Lungo il tracciato: ${linkTrees(t.mainCat.toLowerCase())} nei campioni tra circa ${Math.floor(t.lo / 25) * 25} e ${Math.ceil(t.hi / 25) * 25} m, compatibili con l’habitat di ${esc(d.best.species.name.toLowerCase())}.</p>` : ''}
    ${sketch ? `<figure class="walk-sketch"><svg viewBox="0 0 360 200" role="img" aria-label="Schema del tratto di sentiero nella zona${h ? ', con imbocco mappato' : ''}"><text x="330" y="20">N ↑</text>${sketch.paths.map(p => `<polyline points="${p}"/>`).join('')}${sketch.head ? `<circle cx="${sketch.head[0].toFixed(1)}" cy="${sketch.head[1].toFixed(1)}" r="6"/>` : ''}</svg><figcaption>Traccia locale${h ? ' · punto: imbocco mappato' : ''}. Schema orientato a nord; apri la mappa del percorso per orientarti.</figcaption></figure>` : ''}
    ${trailLinks(z, t)}
    <p class="small muted">Il GPX contiene solo il tratto nella zona. Tempi e dislivello, quando disponibili, riguardano l’itinerario completo. Verifica accesso, sosta e stato del sentiero prima di partire.</p>
    <p class="small muted">Tracciato OpenStreetMap / Waymarked Trails · imbocchi ricavati dalla rete stradale mappata. L’indice e le segnalazioni riguardano la zona, non questo singolo sentiero.</p>
  </section>`;
}

function planCard(z, d, walk) {
  const best = d.best;
  const rows = [];
  rows.push({ sec: 'specie', icon: 'find', thumb: best.species.id, k: 'Cosa osservare', v: `<button type="button" class="sp-inline" data-species="${best.species.id}">${esc(best.species.name)}</button> ${intornoA(best.band)} <b>${best.band} m</b>`,
    sub: [whereSummary(best.species.id) && `<span class="plan-where">${linkTrees(whereSummary(best.species.id))}</span>`,
      criticalRule(best.species.id) && `<span class="plan-crit">⚠ ${esc(criticalRule(best.species.id))}</span>`,
      d.perSpecies.slice(1, 3).map((p) => [p, spScore(z, d, p)]).filter(([, sc]) => sc >= 20).map(([p, sc]) => `${esc(p.species.name)} ${formatIndex(sc)}/10`).join(' · ')].filter(Boolean).join('<br>') || esc(best.species.latin) });
  if (d.crowd) {
    const t = timingAdvice({ dateStr: d.date, lat: z.lat, lon: z.lon, crowd: d.crowd });
    rows.push({ sec: 'quando', icon: 'when', k: 'Quando', v: `Arriva <b>entro le ${fmtRough(t.arrive, 15, 'floor')}</b> <span class="badge crowd-${d.crowd.level}">${crowdText(d.crowd)}</span>`,
      sub: `alba verso le ${fmtRough(t.sunrise, 5)} · raccolta dalle ${fmtRough(t.legal, 5, 'ceil')}` });
  }  const w = wxOf(z, d);
  if (w) {
    const alt = alternativeFor(z, state.dayOffset, d);
    rows.push({ sec: 'quando', svg: wxi(w), k: 'Meteo dell\'uscita', badge: `<span class="badge wx-b wx-${w.level}">${OUTING_SHORT[w.level]}</span>`,
      v: `${esc(w.text.replace(/^./, (c) => c.toUpperCase()))}`,
      sub: alt ? `<span class="plan-alt">Puoi andare a <a href="#/zona/${alt.z.id}/${state.dayOffset}">${esc(splitName(alt.z)[0])}</a>: ${esc(alt.w.main)}, indice ${formatIndex(alt.s)}.</span>`
        : w.available ? `Mattina, dalle ${w.from}:00 alle 13 · quota centrale. Verifica percorso e rientro${w.thunder ? ' · uscita sconsigliata con temporali' : ''}` : 'Aggiorna le previsioni prima di decidere.' });
  }

  const a0 = access[z.id]?.[0];
  const ax = walk?.h ? null : d?.access;
  if (a0 || ax) {
    const unp = a0?.unpaved_tail_km > 0.2 ? `, ultimi ${fmtKm(a0.unpaved_tail_km)} km su strada bianca` : '';
    rows.push({ sec: 'accesso', icon: 'car', k: 'Come arrivare',
      v: walk?.h ? `<a href="${gmaps(walk.h.lat, walk.h.lon)}" target="_blank" rel="noopener">Apri l’imbocco mappato del sentiero ${esc(walk.t.ref || '')}</a>` : ax ? `In auto ${ax.road ? `su ${esc(ax.road)}` : 'fino al punto più vicino'}${ax.walkM < 50 ? ': habitat campionato vicino alla strada' : `, poi <b>${fmtM(ax.walkM)} in linea d’aria</b>`}` : `${a0.minutes} min fino a ${esc(a0.parking)}`,
      sub: `${a0 ? `${a0.minutes} min da Rieti${unp}` : ''}${ax ? ` · <a href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">navigatore</a>` : ''}`,
      badge: d.comfort ? `<span class="badge comfort-${d.comfort.level}">${d.comfort.level}</span>` : '' });
  }
  if (walk?.t) {
    const t = walk.t;
    rows.push({ sec: 'sentieri', svg: segnavia(t), k: 'Sentiero', v: esc(trailName(t)),
      sub: `${fmtKm(t.in_zone_km)} km nella zona${t.difficulty ? ` · ${esc(t.difficulty)}, ${esc(DIFF[t.difficulty] || '')}` : ' · difficoltà n.d.'}` });
  }
  return `<ul class="plan">${rows.map((r) => `
    <li data-sec-open="${r.sec}" tabindex="0" role="button" aria-label="${r.k}: dettagli"><span class="plan-ic${r.thumb ? ' has-thumb' : ''}${r.svg ? ' plan-ic-wx' : ''}">${r.thumb ? `<button type="button" class="thumb-btn" data-species="${r.thumb}" aria-label="Scheda specie">${thumb(r.thumb, 32)}</button>` : (r.svg || ICON[r.icon])}</span>
      <div class="plan-body"><div class="plan-k">${r.k}${r.badge ? ' ' + r.badge : ''}</div><div class="plan-v">${r.v}</div>${r.sub ? `<div class="plan-sub">${r.sub}</div>` : ''}</div><span class="chev" aria-hidden="true">›</span></li>`).join('')}</ul>`;
}

const section = (id, title, body, open = false) => body ? `
  <details class="sec" data-sec="${id}"${open || openSecs.has(id) ? ' open' : ''}>
    <summary>${title}</summary><div class="sec-body">${body}</div>
  </details>` : '';
const openSecs = new Set();

function renderDetail() {
  const z = zones.find((x) => x.id === state.zoneId) || zones[0];
  const r = results[z.id];
  const d = dayEntry(z.id, state.dayOffset);
  const walk = walkFor(z, d, state.trailId);
  const box = $('#detail');
  if (!d?.best) {
    const missing = [...new Set((d?.perSpecies || []).flatMap((p) => p.quality?.missing || []))];
    box.innerHTML = `<h1>${esc(z.title || z.name)}</h1><p class="notice">${selectedSpecies().length?'Indice non calcolabile':'Indice non ancora disponibile per le specie selezionate'}${missing.length ? ': mancano ' + esc(missing.join(', ')) : ' per questo giorno'}. Un dato mancante non indica assenza di funghi.</p><p><a href="#/mappa/${z.id}">Apri la mappa</a> · <a href="#/metodo">Metodo e limiti</a></p>${renderWalkFocus(z, d, walk)}${z.protection ? `<p class="notice">${esc(z.protection)}</p>` : ''}<p>${linkTrees(z.description)}</p>${section('accesso','Accessi e soste',renderAccess(z,{access:null}))}${section('sentieri','Sentieri della zona',renderTrails(z,null),true)}`; return;
  }
  const best = d.best;
  const s = adjusted(z, d.score, d);
  const dayLabel = state.dayOffset === 0 ? 'Oggi' : fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' });
  const hab = habitatAtBand(habitat[z.id], best.band);
  const rows = d.perSpecies.map((p0) => ({ ...p0, score: spScore(z, d, p0) })).map((p) => `
    <tr>
      <td><button type="button" class="sp-link" data-species="${p.species.id}">${thumb(p.species.id, 34)}<span><span class="sp-n">${esc(p.species.name)}</span><span class="latin">${esc(p.species.latin)}</span></span></button>
        ${p.species.warning ? `<div class="warnline">⚠ ${esc(p.species.warning)}</div>` : ''}</td>
      <td class="num">${p.band} m</td>
      <td><div class="bar"><i style="width:${p.score ?? 0}%;background:var(${scoreVar(p.score)})"></i></div></td>
      <td class="num"><b class="pc">${formatIndex(p.score)}</b>${p.score == null ? `<small>${esc(p.quality.missing.join(', '))}</small>` : ''}</td>
    </tr>`).join('');

  const sb = series[z.id][bandIndex(z, best.band)];
  const from = Math.max(0, r.todayIndex - HISTORY_DAYS);
  const days = r.days.filter((x) => x.i >= from);

  const [title, sub] = splitName(z);
  const cov = coverOf(z, best.species.id);
  box.innerHTML = `
    <header class="phero">
      ${cov ? `<button type="button" class="phero-img" data-cover aria-label="Ingrandisci la foto"><img src="${cov.hd}" alt="${esc(cov.alt)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar"><a class="fab" href="#/mappa/${z.id}" aria-label="Mappa della zona">${IC.map}</a></div>
      <div class="phero-body"><span class="pill glass">${esc(dayLabel)}</span><h1 class="phero-title">${esc(title)}</h1>${sub ? `<p class="phero-sub">${esc(sub)}</p>` : ''}</div>
      ${ring(s)}
    </header>
    <div class="pbody">
    <div id="zone-days" class="days compact" role="tablist" aria-label="Giorno"></div>
    ${renderWalkFocus(z, d, walk)}
    ${planCard(z, d, walk)}
    <div class="zone-community"><button type="button" class="btn primary" data-report data-zone="${z.id}" data-species="${best.species.id}">Segnala dal bosco</button>${reportBadge(z.id, best.species.id)}</div>
    <button type="button" class="btn ghost big" data-save-plan>Salva le condizioni prima della passeggiata</button><p class="small muted" data-plan-status></p>
    <a class="btn ghost big map-link" href="#/mappa/${z.id}">${IC.map} Sentieri e accessi nella zona</a>
    ${zoneLegal(z, d)}
    ${z.protection ? `<div class="notice">${esc(z.protection)}</div>` : ''}
    ${section('meteo', 'Perché questo indice', `${renderWhy({ r: best, s: sb, i: d.i, sp: best.species, band: best.band, dateStr: d.date, shown: s, agg: d.score, parts: d.perSpecies.map((p) => ({ name: p.species.name.split(' / ')[0], score: p.score })), prefs: adjParts(z, d), outing: wxRank(z, d) < 1 ? wxRank(z, d) : 0 })}
      <p class="sci-h">L'indice nei giorni</p><div id="charts"></div>${legal?.forecast_note ? `<p class="small muted">${esc(legal.forecast_note)}</p>` : ''}`)}
    ${section('quando', 'Quando andare e affollamento', renderHuman(z, d))}
    ${section('accesso', 'Accesso in auto e a piedi', renderAccess(z, d))}
    ${section('sentieri', 'Sentieri della zona', renderTrails(z, d))}
    ${section('specie', 'Cosa può nascere qui', zoneSpecies(z, d))}
    ${section('bosco', `Bosco a ${best.band} m (Carta Forestale)`, forestBar(hab.frac) + `<p class="small muted">${hab.n} punti nella fascia ±150 m. Campioni spazialmente correlati; composizione indicativa.</p>`)}
    ${section('zona', 'La zona', `<p class="small">${linkTrees(z.description)}</p>
      <dl class="kv">
        <dt>Accesso</dt><dd>${esc(z.access)}</dd>
        <dt>Soste</dt><dd>${z.parking.map((p) => `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join(' · ')}</dd>
        <dt>Quote</dt><dd>${habitat[z.id].elevation.min}–${habitat[z.id].elevation.max} m (mediana ${habitat[z.id].elevation.median})</dd>
      </dl>${zoneMedia[z.id] ? `<p class="small muted">${creditLine(zoneMedia[z.id])}</p>` : ''}`)}
    </div>`;
  box.querySelector('[data-cover]')?.addEventListener('click', () => openLightbox([{ src: cov.hd, alt: cov.alt, caption: captionHtml({ title: esc(z.name), credit: creditLine(cov.credit) }) }]));
  box.querySelector('[data-save-plan]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget, status = box.querySelector('[data-plan-status]');
    btn.disabled = true;
    try { await journal.savePlan(z.id, d.date, best.band); status.textContent = 'Previsione e dati salvati nel diario. Dopo l’uscita registra specie cercate, orario e ritrovamenti.'; }
    catch (err) { status.textContent = err.message; }
    finally { btn.disabled = false; }
  });
  // giorni della zona: cambiano il giorno senza aggiungere voci di cronologia
  const zd = $('#zone-days');
  zd.innerHTML = '';
  for (let o = 0; o <= AHEAD_DAYS; o++) {
    const x = dayEntry(z.id, o);
    if (!x?.best) continue;
    const sc = adjusted(z, x.score, x);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(o === state.dayOffset));
    b.innerHTML = `<span class="d1">${o === 0 ? 'Oggi' : o === 1 ? 'Dom' : fmtDate(x.date, { weekday: 'short' }).replace('.', '')}</span><span class="d2">${fmtDate(x.date, { day: 'numeric' })}</span><span class="d3"><span class="dot" style="--dc:var(${scoreVar(sc)});--dcs:var(${scoreVar(sc).replace('--s', '--ps')})"></span><b class="pc">${formatIndex(sc)}</b></span>`;
    b.addEventListener('click', () => soft(() => { history.replaceState(null, '', walkHref(z, o, state.trailId ? walk?.t : null)); state.dayOffset = o; renderDetail(); }));
    zd.appendChild(b);
  }
  zd.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  // ogni riga del piano apre la sezione di dettaglio corrispondente
  box.querySelectorAll('[data-sec-open]').forEach((row) => {
    const open = (e) => {
      if (e.target.closest('a, button')) return;
      const sec = box.querySelector(`details.sec[data-sec="${row.dataset.secOpen}"]`);
      if (!sec) return;
      sec.open = true;
      sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
  });
  box.querySelectorAll('details.sec').forEach((el) => el.addEventListener('toggle', () => {
    if (el.open) openSecs.add(el.dataset.sec); else openSecs.delete(el.dataset.sec);
    if (el.dataset.sec === 'meteo' && el.open) drawCharts();
  }));
  const drawCharts = () => $('#charts') && renderCharts($('#charts'), {
    dates: days.map((x) => x.date),
    rain: days.map((x) => sb.p[x.i]),
    score: days.map((x) => adjusted(z, x.score, x)),
    todayIndex: r.todayIndex - from,
    selectedIndex: r.todayIndex + state.dayOffset - from,
  });
  if (openSecs.has('meteo')) drawCharts();
}

const fmtKm = (km) => km.toLocaleString('it-IT', { maximumFractionDigits: 1 });
const fmtM = (m) => (m >= 1000 ? `${fmtKm(m / 1000)} km` : `${Math.round(m / 10) * 10} m`);
// tratto a piedi in parole: sotto i 50 m il bosco e' praticamente a bordo strada
const walkTxt = (m) => (m < 50 ? 'il campione di habitat è <b>vicino alla strada</b>' : `circa <b>${fmtM(m)} in linea d’aria</b>`);
const SURF_LABEL = ['asfalto', 'strada bianca', 'sentiero o pista'];
const gmaps = (lat, lon) => `https://www.google.com/maps/dir/?api=1&origin=Rieti&destination=${lat},${lon}&travelmode=driving`;

function renderHuman(z, d) {
  if (!d.crowd) return '';
  const t = timingAdvice({ dateStr: d.date, lat: z.lat, lon: z.lon, crowd: d.crowd });
  const hol = holidayName(d.date);
  // alternativa: un giorno con meno gente e indice simile
  let alt = null;
  for (let o = 0; o <= AHEAD_DAYS; o++) {
    const x = dayEntry(z.id, o);
    if (!x?.crowd || x.date === d.date) continue;
    if (x.crowd.value < d.crowd.value - 0.15 && x.score >= d.score - 10 && (!alt || x.score > alt.score)) alt = x;
  }
  const tips = [];
  if (d.crowd.fresh) tips.push('Il modello segnala un aumento recente dell’indice: l’affollamento è solo ipotizzato.');
  else if (d.crowd.goodDays >= 3) tips.push(`Le condizioni sono favorevoli da ${d.crowd.goodDays} giorni: il modello ipotizza più cercatori; il passaparola non è misurato.`);
  if (d.access?.farShare >= 0.2 && d.crowd.level !== 'basso') tips.push(`Il ${Math.round(d.access.farShare * 100)}% del bosco adatto è a più di 600 m da una strada: la minore frequentazione è un’ipotesi da verificare.`);
  if (alt) tips.push(`Alternativa più tranquilla: ${fmtDate(alt.date, { weekday: 'long', day: 'numeric' })} (indice ${formatIndex(alt.score)}, ${crowdText(alt.crowd)}).`);
  if ((series[z.id][bandIndex(z, d.best.band)].p[d.i] ?? 0) >= 5) tips.push('È prevista pioggia: meno gente, ma porta il necessario e attenzione al fondo scivoloso.');
  return `
    <div class="human">
      <p><span class="badge crowd-${d.crowd.level}">${crowdText(d.crowd).replace(/^./, (c) => c.toUpperCase())}</span> <span class="muted small">${esc(hol || d.crowd.day.label)}</span></p>
      <dl class="kv">
        <dt>Alba</dt><dd>verso le ${fmtRough(t.sunrise, 5)} · raccolta consentita dalle <b>${fmtRough(t.legal, 5, 'ceil')}</b> alle ${fmtRough(t.end, 5, 'floor')}</dd>
        <dt>Arrivo consigliato</dt><dd><b>entro le ${fmtRough(t.arrive, 15, 'floor')}</b>. ${esc(t.why)}</dd>
        ${(() => { const dep = new Date(t.arrive.getTime() - ((access[z.id]?.[0]?.minutes ?? z.drive_min) + 10) * 6e4); return `<dt>Partenza da Rieti</dt><dd>verso le ${fmtRough(dep, 15, 'floor')}</dd>`; })()}
      </dl>
      ${tips.length ? `<ul class="reasons">${tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="muted small">Stima euristica: giorno della settimana e festivi, notorietà della zona, da quanti giorni l'indice è alto, facilità d'accesso, pioggia.</p>
    </div>`;
}

function renderAccess(z, d) {
  const acc = access[z.id] || [];
  const a0 = acc[0];
  const ax = d?.access;
  if (!a0 && !ax) return '';
  const lines = [];
  if (a0) {
    let txt = `Da Rieti ${a0.minutes} min, ${fmtKm(a0.km)} km${a0.roads.length ? ` via ${a0.roads.join(', ')}` : ''}.`;
    if (a0.unpaved_tail_km > 0.2) txt += ` Asfalto per ${fmtKm(a0.paved_km)} km${a0.transition?.after ? ` (fino a ${a0.transition.after})` : ''}, poi <b>${fmtKm(a0.unpaved_tail_km)} km di strada bianca</b>${a0.unpaved_surfaces.length ? ` (${a0.unpaved_surfaces.map((x) => ({ gravel: 'ghiaia', dirt: 'sterrato', compacted: 'fondo compatto' }[x] || x)).join(', ')})` : ''} fino a ${esc(a0.parking)}.`;
    else txt += ` Tutto su asfalto fino a ${esc(a0.parking)} (${a0.elevation} m).`;
    lines.push(txt);
  }
  if (ax) {
    lines.push(`<b>Punto più comodo per ${esc(d.best.species.name.toLowerCase())}</b>: in auto ${ax.surface === 0 ? 'su asfalto' : `su ${SURF_LABEL[ax.surface]}`}${ax.road ? ` lungo ${esc(ax.road)}` : ''} fino al <a href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">punto sulla strada</a>, poi ${ax.walkM < 50 ? 'subito, a bordo strada,' : `<b>${fmtM(ax.walkM)} in linea d’aria</b> (in linea d'aria) fino a`} ${esc((SHORT[ax.cat] || ax.cat).toLowerCase())} a ${ax.e} m.`);
  }
  return `
    <p><span class="badge comfort-${d.comfort?.level}">accesso ${d.comfort?.level ?? ''}</span></p>
    <ul class="reasons access">${lines.map((x) => `<li>${x}</li>`).join('')}</ul>
    ${acc.length > 1 ? `<p class="small muted">Altre soste: ${acc.slice(1).map((a) => `<a href="${gmaps(a.lat, a.lon)}" target="_blank" rel="noopener">${esc(a.parking)}</a> (${a.minutes} min${a.unpaved_tail_km > 0.2 ? `, ${fmtKm(a.unpaved_tail_km)} km di strada bianca` : ''})`).join(' · ')}</p>` : ''}`;
}

// Sentieri: segnavia CAI, difficolta' in parole, dati dell'itinerario e profilo del tratto nella zona
const DIFF = { T: 'turistico', E: 'escursionistico', EE: 'per escursionisti esperti', EEA: 'attrezzato, per esperti' };
const segnavia = (t) => (t.ref
  ? `<span class="segnavia" role="img" aria-label="Segnavia ${esc(t.ref)}"><i></i><b>${esc(t.ref)}</b><i></i></span>`
  : `<span class="segnavia seg-none" aria-hidden="true">${ICON.trail}</span>`);
const trailName = (t) => t.name || (t.itinerary?.length ? `${t.itinerary[0]} – ${t.itinerary[t.itinerary.length - 1]}` : 'Sentiero');
const fmtDur = (h) => { const [a, b] = String(h).split(':').map(Number); return `${a} h${b ? ` ${b}` : ''}`; };

// posizione di un imbocco lungo il tratto della zona (0-1): punto piu' vicino sulla linea, distanza cumulata
function headX(t, h) {
  const pts = (t.lines || []).flat();
  if (pts.length < 2) return null;
  const k = Math.cos((h.lat * Math.PI) / 180);
  const dd = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * k);
  let cum = 0, best = Infinity, at = 0;
  pts.forEach((p, i) => { if (i) cum += dd(pts[i - 1], p); const d = dd(p, [h.lat, h.lon]); if (d < best) { best = d; at = cum; } });
  return cum ? at / cum : null;
}

function trailProfile(zid, t, sp, band, heads = []) {
  const sm = t.samples || [];
  if (sm.length < 4) return '';
  if (t.lines?.length > 1) return `<p class="small muted">Quote campionate tra ${Math.min(...sm.map(x => x[0]))} e ${Math.max(...sm.map(x => x[0]))} m su segmenti separati. Non costituiscono un profilo continuo.</p>`;
  const cats = trails[zid]?.sample_categories || [];
  const es = sm.map((x) => x[0]);
  const lo = Math.min(...es), hi = Math.max(...es);
  const W = 300, H = 70, n = sm.length;
  const X = (i) => (i / (n - 1)) * W;
  const Y = (e) => H - 6 - ((e - lo) / Math.max(1, hi - lo)) * (H - 18);
  const ok = sm.map(([e, c]) => { const cat = c >= 0 ? cats[c] : 'non bosco'; return (sp.forest[cat] || 0) >= 0.6 && e >= sp.elev[0] && e <= sp.elev[1] && Math.abs(e - band) <= 250; });
  const line = sm.map(([e], i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(e).toFixed(1)}`).join('');
  const area = `${line}L${W} ${H}L0 ${H}Z`;
  const step = W / (n - 1);
  const good = sm.map(([e], i) => (ok[i] ? `<rect x="${(X(i) - step / 2).toFixed(1)}" y="${Y(e).toFixed(1)}" width="${step.toFixed(1)}" height="${(H - Y(e)).toFixed(1)}"/>` : '')).join('');
  // imbocchi sulla linea, numerati come i bottoni sotto il grafico
  const marks = heads.map((h, k) => { const x = headX(t, h); if (x == null) return ''; const i = Math.round(x * (n - 1)); return `<span class="tp-th" style="--x:${(x * 100).toFixed(1)}%;top:${((Y(es[i]) / H) * 100).toFixed(1)}%" aria-hidden="true">${k + 1}</span>`; }).join('');
  return `<figure class="tprof"><div class="tp-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Profilo del tratto nella zona: da ${es[0]} a ${es[n - 1]} m, tra ${lo} e ${hi} m">
      <path d="${area}" class="tp-area"/><g class="tp-good">${good}</g><path d="${line}" class="tp-line"/></svg>${marks}</div>
    <figcaption><span>${es[0]} m</span><span class="tp-key"><i></i>bosco adatto a ${esc(sp.name.toLowerCase())}</span><span>${es[n - 1]} m</span></figcaption></figure>`;
}

function trailCard(z, t, d, top = false) {
  const facts = [
    t.difficulty && `<div><dt>Difficoltà</dt><dd><b>${esc(t.difficulty)}</b> · ${esc(DIFF[t.difficulty] || '')}</dd></div>`,
    t.total_km && t.total_km < 200 && `<div><dt>Intero</dt><dd>${fmtKm(t.total_km)} km${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div>`,
    `<div><dt>Nella zona</dt><dd>${fmtKm(t.in_zone_km)} km${t.goodKm != null ? `, di cui <b>${fmtKm(t.goodKm)} km</b> in bosco adatto` : ''}</dd></div>`,
  ].filter(Boolean).join('');
  const heads = headsOf(z, t);
  return `<div class="tcard${top ? ' top' : ''}">
    <div class="tc-head">${segnavia(t)}<div class="tc-name"><b>${esc(trailName(t))}</b>${t.itinerary?.length > 2 ? `<small>${esc(t.itinerary.slice(1, -1).join(' · '))}</small>` : ''}${t.long ? '<small>tratto di un itinerario lungo</small>' : ''}${t.operator ? `<small>${esc(t.operator)}</small>` : ''}</div>${top ? '<span class="badge tc-top">In evidenza</span>' : ''}</div>
    <dl class="tc-facts">${facts}</dl>
    ${d?.best ? trailProfile(z.id, t, d.best.species, d.best.band, heads) : ''}
    ${heads.length ? `<div class="th-row"><span class="th-k">Imbocchi</span><div class="th-list">${heads.map((h, k) => `<a class="th-chip" href="${gmaps(h.lat, h.lon)}" target="_blank" rel="noopener" aria-label="Indicazioni stradali per l'imbocco ${k + 1}, a ${h.ele ?? ''} metri"><i class="th-n">${k + 1}</i>${h.kind === 'strada' ? IC.car : ICON.track}<span><b>${h.ele != null ? `${h.ele.toLocaleString('it-IT')} m` : 'imbocco'}</b><small>${esc(h.road || (h.kind === 'strada' ? 'su strada' : 'su sterrata'))}</small></span></a>`).join('')}</div></div>` : ''}
  </div>`;
}

function renderTrails(z, d) {
  const candidates = d?.best ? trailsFor(z, d.best.species, d.best.band) : (trails[z.id]?.trails || []);
  const walk = walkFor(z, d, state.trailId);
  const list = (walk ? [walk.t, ...candidates.filter(t => t.id !== walk.t.id)] : candidates).slice(0,4);
  if (!list.length) return trails[z.id] ? '<p class="small muted">Non risultano sentieri compatibili in questi dati: verifica tracciati, accessibilità e segnaletica sul posto.</p>' : '';
  return `
    <ol class="trails">${list.map((t, k) => `<li>${trailCard(z, t, d, k === 0)}<a class="small" href="${walkHref(z, state.dayOffset, t)}">Microzona e taccuino di questo sentiero →</a>${trailLinks(z, t)}</li>`).join('')}</ol>
    <p class="muted small">Sentieri OpenStreetMap (rete CAI). ${d?.best ? 'I km adatti incrociano tracciato, Carta Forestale e quota della specie.' : 'Questi percorsi sono elencati senza una valutazione di idoneità per la specie selezionata.'} Google Maps di norma non mostra i sentieri CAI: sul posto usa un'app con mappe OpenStreetMap (OsmAnd, Organic Maps, Komoot, Locus) e il GPX.</p>`;
}

// Intersezioni con strade mappate: non certificano transitabilità o possibilità di sosta.
function headsOf(z, t) {
  const list = trailheads[z.id]?.[String(t.id)] || [];
  const park = access[z.id]?.[0] || z;
  const d2 = (h) => (h.lat - park.lat) ** 2 + ((h.lon - park.lon) * 0.74) ** 2;
  return [...list].sort((a, b) => (a.kind === 'strada' ? 0 : 1) - (b.kind === 'strada' ? 0 : 1) || d2(a) - d2(b)).slice(0, 3);
}

// Geometria di un sentiero nella zona: mappa centrata sul tratto, imbocco piu' vicino alla sosta, GPX del tratto
function trailGeo(z, t) {
  const pts = (t.lines || []).flat();
  if (!pts.length) return null;
  const lats = pts.map((p) => p[0]), lons = pts.map((p) => p[1]);
  const c = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lons) + Math.max(...lons)) / 2];
  const span = Math.max(Math.max(...lats) - Math.min(...lats), (Math.max(...lons) - Math.min(...lons)) * 0.74);
  const zoom = Math.max(11, Math.min(15, Math.round(Math.log2(0.9 / Math.max(span, 0.005)) + 8)));
  const park = access[z.id]?.[0] || z;
  const d2 = (p) => (p[0] - park.lat) ** 2 + ((p[1] - park.lon) * 0.74) ** 2;
  const start = pts.reduce((a, p) => (d2(p) < d2(a) ? p : a), pts[0]);
  const name = t.name || t.ref || 'Sentiero';
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Fungaroli Rieti" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${esc(name)}</name><desc>Tratto nella zona ${esc(z.name)}. Dati OpenStreetMap, licenza ODbL.</desc></metadata>${(t.lines || []).map((l) => `<trk><name>${esc(name)}</name><trkseg>${l.map((p) => `<trkpt lat="${p[0]}" lon="${p[1]}"/>`).join('')}</trkseg></trk>`).join('')}</gpx>`;
  return {
    wm: `https://hiking.waymarkedtrails.org/#route?id=${t.id}&map=${zoom}/${c[0].toFixed(5)}/${c[1].toFixed(5)}`, start,
    gpx: `data:application/gpx+xml;charset=utf-8,${encodeURIComponent(gpx)}`, file: `${(t.ref || name).replace(/[^\w-]+/g, '_')}-${z.id}.gpx`,
  };
}

// Link di un sentiero nella scheda della zona
function trailLinks(z, t) {
  const g = trailGeo(z, t);
  if (!g) return `<a class="small" href="https://www.openstreetmap.org/relation/${t.id}" target="_blank" rel="noopener">Tracciato su OpenStreetMap</a>`;
  const h = headsOf(z, t)[0], go = h ? [h.lat, h.lon] : g.start;
  return `<div class="tl-btns">
    <a class="tl-btn primary" href="${gmaps(go[0], go[1])}" target="_blank" rel="noopener">${h ? IC.car : IC.map}<span>${h ? 'Apri l’imbocco mappato' : 'Apri un punto sulla traccia'}</span></a>
    <a class="tl-btn" href="${g.wm}" target="_blank" rel="noopener">${IC.map}<span>Percorso e profilo</span></a>
    <a class="tl-btn" href="${g.gpx}" download="${esc(g.file)}">${ICON.download}<span>GPX del tratto locale</span></a>
    <a class="tl-btn" href="https://www.openstreetmap.org/relation/${t.id}" target="_blank" rel="noopener">${ICON.ext}<span>OpenStreetMap</span></a></div>`;
}

// --- testi legali e di sicurezza (data/legal.json, con ripiego prudente) ------
const LEGAL_KEY = 'fungaroli:legal-accepted';
function applyLegal() {
  const L = legal || {};
  if (L.home_strip) $('#home-legal span').textContent = L.home_strip;
  // emergenza e sezioni legali nella pagina Info
  const em = L.emergency;
  $('#emergency').innerHTML = `<h2>${esc(em?.title || 'Sospetto avvelenamento')}</h2>
    <ul class="reasons">${(em?.steps || ['Chiama subito il 112, anche senza sintomi.', 'Conserva i funghi avanzati, gli scarti e il resto del raccolto per i medici.']).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="em-numbers">${(em?.numbers || [{ label: 'Numero unico di emergenza', number: '112' }]).map((n) => `<a class="btn ${n.number === '112' ? 'primary' : 'ghost'}" href="tel:${esc(n.number.replace(/\s/g, ''))}">${esc(n.label)} · <b>${esc(n.number)}</b></a>`).join('')}</div>`;
  const zc = Object.entries(zoneMedia).map(([zid, m]) => `${esc(zones.find((z) => z.id === zid)?.name || zid)}: ${creditLine(m)}`);
  if (zc.length) $('#zone-credits').innerHTML = `<b>Foto dei luoghi</b> (Wikimedia Commons): ${zc.join(' · ')}`;
  // preparazione e conservazione: regole per tutti i funghi (obbligatorie prima)
  if (prep?.general?.length && $('#prep-general')) $('#prep-general').innerHTML = prepGeneralHtml(prep.general);
  $('#legal-sections').innerHTML = (L.info_sections || []).map((x) => `<details><summary><h2>${esc(x.title)}</h2></summary><div class="method">${x.html}</div></details>`).join('');
  // primo avvio: avviso da confermare (si ripresenta se cambia la versione dei testi)
  const ver = String(L.version || 0) + (L.verified_on || '');
  let accepted = null;
  try { accepted = localStorage.getItem(LEGAL_KEY); } catch { /* ignora */ }
  if (accepted !== ver) {
    const dlg = $('#onboarding');
    dlg.querySelector('h2').textContent = L.onboarding?.title || 'Prima di usare l\'app';
    dlg.querySelector('.ob-points').innerHTML = (L.onboarding?.points || [
      'Le previsioni sono stime: non garantiscono che troverai funghi.',
      'Schede e ricerca aiutano a orientarsi ma non sono un\'identificazione: prima di mangiare fai controllare i funghi all\'Ispettorato Micologico ASL.',
      'Per raccogliere nel Lazio servono attestato micologico e contributo regionale, nel rispetto della L.R. 32/1998.',
      'In montagna la sicurezza e il rispetto delle regole di parchi e riserve sono tua responsabilità.',
    ]).map((x) => `<li>${esc(x)}</li>`).join('');
    $('#ob-accept').textContent = L.onboarding?.accept || 'Ho capito';
    $('#ob-accept').onclick = () => { try { localStorage.setItem(LEGAL_KEY, ver); } catch { /* ignora */ } dlg.close(); };
    $('#ob-more').onclick = () => dlg.close();
    dlg.addEventListener('cancel', (e) => e.preventDefault());
    dlg.addEventListener('close', maybeInvite, { once: true }); // dopo l'avviso, l'invito a installare
    dlg.showModal();
  } else maybeInvite();
}

function zoneLegal(z) {
  const L = legal || {};
  const items = L.zone_legal || ['Max 3 kg a persona al giorno', 'Raccolta da un\'ora prima dell\'alba a un\'ora dopo il tramonto', 'Attestato micologico e contributo regionale con te'];
  return `<div class="zone-legal"><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    ${z.protection ? `<p><b>Area protetta.</b> ${esc(z.protection)}${L.protected_area_note ? ` <span class="muted">${esc(L.protected_area_note)}</span>` : ''}</p>` : ''}<a class="small" href="#/info">Regole complete e note legali</a></div>`;
}

// Dove trovare una specie: idoneita' dell'habitat per zona + indice di oggi (se il meteo e' caricato).
const POT_LABEL = { alta: 'habitat molto adatto', media: 'habitat adatto', bassa: 'habitat scarso', scarsa: 'quasi assente' };
function potentialOf(sp, z) { return habitatPotential(sp, habitat[z.id], habitat[z.id].forest?.area_ha); }
function whereToFind(id) {
  const sp = SPECIES.find((x) => x.id === id);
  if (!sp || !zones) return '';
  const rows = zones.map((z) => {
    const pot = potentialOf(sp, z);
    let today = null;
    if (results && series) {
      const r = results[z.id];
      const sb = series[z.id];
      const i = r.todayIndex;
      today = combine(z.bands.map((b, bi) => scoreSpecies(sp, sb[bi], i, habitat[z.id], b).score));
    }
    return { z, pot, today };
  }).sort((a, b) => b.pot.score - a.pot.score);
  return `<p class="small muted">Quanto bosco adatto alla specie c'è in ogni zona, alla quota giusta (Carta Forestale). Non è un censimento: dice dove ha senso cercarla.</p>
    <ul class="where">${rows.map(({ z, pot, today }) => `
      <li><a href="#/zona/${z.id}/0">
        <div class="where-top"><b>${esc(shortName(z))}</b><span class="badge pot-${pot.level}">${POT_LABEL[pot.level]}</span></div>
        <div class="bar"><i style="width:${Math.round(pot.score * 100)}%;background:var(--line)"></i></div>
        <div class="small muted">${pot.ha ? `~${pot.ha.toLocaleString('it-IT')} ha adatti` : 'nessun bosco adatto'}${pot.elevRange ? ` tra ${pot.elevRange[0]} e ${pot.elevRange[1]} m` : ''}${today != null ? ` · indice oggi ${today}` : ''}</div>
      </a></li>`).join('')}</ul>`;
}

// Specie che possono nascere in una zona, con idoneita' e indice del giorno scelto
function zoneSpecies(z, d) {
  const scores = Object.fromEntries((d.perSpecies || []).map((p) => [p.species.id, p]));
  const sb = series[z.id];
  const rows = SPECIES.map((sp) => {
    const pot = potentialOf(sp, z);
    const p = scores[sp.id] || { score: combine(z.bands.map((b, bi) => scoreSpecies(sp, sb[bi], d.i, habitat[z.id], b).score)) };
    return { sp, pot, score: p.score, band: p.band };
  }).filter((r) => r.pot.level !== 'scarsa').sort((a, b) => b.score - a.score || b.pot.score - a.pot.score);
  return `<ul class="zsp">${rows.map(({ sp, pot, score }) => `
    <li><a href="#/specie/${sp.id}" class="zsp-row">${thumb(sp.id, 40)}
      <span class="zsp-body"><b>${esc(sp.name)}</b>${reportBadge(z.id, sp.id)}<span class="small muted">${POT_LABEL[pot.level]}${pot.ha ? ` · ~${pot.ha.toLocaleString('it-IT')} ha` : ''}</span></span>
      <span class="score-pill"><span class="dot" style="background:var(${scoreVar(score)})"></span>${scoreText(score)}</span></a></li>`).join('')}</ul>
    <p class="small muted">Ordinate per condizioni nel giorno scelto; sotto il nome, habitat e segnalazioni dichiarate degli ultimi 7 giorni.</p>`;
}

// Indice previsto per tutte le specie in una zona/data (per il diario).
// band null = miglior quota della zona. Ritorna null se la data e' fuori dai dati meteo.
function predict(zoneId, date, band) {
  if (!series) return null;
  const z = zones.find((x) => x.id === zoneId);
  const sb = series[zoneId];
  if (!z || !sb?.[0]) return null;
  const i = sb[0].dates.indexOf(date);
  if (i < 30) return null;
  const bands = band == null ? z.bands : [band];
  const out = {};
  for (const sp of SPECIES) {
    out[sp.id] = combine(bands.map((b) => scoreSpecies(sp, sb[bandIndex(z, b)], i, habitat[zoneId], b).score));
  }
  return out;
}

function bandIndex(z, band) {
  return Math.max(0, z.bands.indexOf(band));
}

function captureForecast(zoneId, date, band) {
  const z = zones.find((x) => x.id === zoneId), sb = series?.[zoneId];
  if (!z || !sb?.length) return null;
  const i = sb[0].dates.indexOf(date);
  if (i < 30 || i < sb[0].todayIndex || sb.some((s) => s.source?.expired)) return null;
  const scoresByBand = Object.fromEntries(z.bands.map((b) => [b, predict(zoneId, date, b)]));
  const scores = scoresByBand[band] || predict(zoneId, date, null);
  if (!scores || !Object.values(scores).some(Number.isFinite)) return null;
  const inputs = sb.map((s, bi) => ({ band: z.bands[bi], source: s.source,
    dates: s.dates.slice(i - 30, i + 1),
    ...Object.fromEntries(['p', 'tmean', 'tmin', 'tmax', 'soilm', 'soilt'].map((k) => [k, s[k].slice(i - 30, i + 1)])) }));
  return { mode: 'prospective', capturedAt: new Date().toISOString(), modelVersion: MODEL_VERSION,
    internalScoreScale: '0–100', scores, scoresByBand, inputs, model: { params: PARAMS, species: SPECIES },
    habitat: { sample_categories: habitat[zoneId].sample_categories, samples: habitat[zoneId].samples.map((s) => s.slice(0, 2)) } };
}

init().catch((e) => {
  $('#detail').innerHTML = `<div class="error">Errore di avvio: ${esc(e.message)}</div>`;
});
