import { SPECIES, GROUPS, FOREST } from './species.js';
import { scoreZoneDay, scoreSpecies, habitatAtBand, habitatPotential, classOf, CLASSES } from './model.js';
import { loadWeather } from './weather.js';
import { renderCharts } from './chart.js';
import { initJournal } from './journal.js';
import { renderSvgMap } from './svgmap.js';
import { initSpeciesCards, thumb, renderSpeciesDetail, whereSummary, criticalRule, speciesPhoto } from './speciescard.js';
import { openLightbox, captionHtml } from './lightbox.js';
import { initInstall } from './install.js';
import { loadOuting, outingFor, OUTING_LABEL, OUTING_SHORT, OUTING_RANK } from './outing.js';
import { initIdentify, renderIdentify, setCompare, searchTaxa, openTaxon, renderTaxonPage } from './identify.js';
import { initSearch, openSearch } from './search.js';
import { renderWhy, renderMethod } from './science.js';
import { navigate, soft } from './motion.js';
import { FOREST_LEGEND } from './forest-legend.js';
import { initTrees, renderTreeGrid, renderTreePage, linkTrees, treeForCategory, treeThumb } from './trees.js';
import { crowding, comfortScore, timingAdvice, fmtTime, fmtRough, holidayName, intornoA } from './human.js';

const HISTORY_DAYS = 30;   // giorni passati mostrati nel grafico
const AHEAD_DAYS = 7;      // giorni futuri valutati
const PREFS_KEY = 'fungaroli:prefs:v2'; // v2: si parte con tutti i gruppi

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const scoreVar = (score) => `--s${5 - classOf(score)}`;
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

const state = {
  groups: new Set(GROUPS.map((g) => g.id)),
  dayOffset: 0,
  zoneId: null,
  distancePenalty: false,
  avoidCrowd: false,
  preferComfort: false,
  homeDay: null,   // null = tutti i prossimi giorni
  view: 'uscite',
};
try {
  const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
  if (p) { state.groups = new Set(p.groups); state.distancePenalty = !!p.distancePenalty; state.avoidCrowd = !!p.avoidCrowd; state.preferComfort = !!p.preferComfort; }
} catch { /* preferenze non disponibili */ }
const savePrefs = () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ groups: [...state.groups], distancePenalty: state.distancePenalty, avoidCrowd: state.avoidCrowd, preferComfort: state.preferComfort })); } catch { /* ignora */ }
};

let zones, origin, habitat, access, trails, traits, legal, series, results, map, zoneLayers = {}, zoneMedia = {}, outing = null;
const hasLeaflet = () => typeof globalThis.L !== 'undefined';

async function init() {
  initInstall(); // prima di tutto: non dipende dai dati
  // versione Artifact: dati incorporati nella pagina (niente fetch esterni)
  const embedded = globalThis.FUNGAROLI_DATA;
  const review = !!globalThis.FUNGAROLI_REVIEW; // copia di revisione: niente API esterne
  const load = (f) => fetch(`data/${f}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  legal = embedded ? embedded.legal : await load('legal');
  const [zj, hj, aj, tj, idj, mj, ij, trj, stj, mtj, mzj, prj, thj] = embedded
    ? [embedded.zones, embedded.habitat, embedded.access, embedded.trails, embedded.speciesId, embedded.media, embedded.infographics, embedded.trees, embedded.traits, null, null, embedded.preparation, embedded.trailheads]
    : await Promise.all(['zones', 'habitat', 'access', 'trails', 'species-id', 'media', 'infografiche', 'trees', 'species-traits', 'media-trees', 'media-zones', 'preparation', 'trailheads'].map(load));
  trailheads = thj?.zones || {};
  prep = prj;
  zoneMedia = mzj?.zones || {};
  if (mj && mtj?.trees) mj.trees = { ...(mj.trees || {}), ...mtj.trees };
  traits = stj;
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
  initIdentify({
    traits: stj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, thumb, zones, banner: legal?.identify_banner,
    howTo: (eid, latin) => idj?.species?.[eid]?.lookalikes?.find((l) => l.latin === latin)?.how_to_tell || '',
    potential: (sid, zid) => { const sp = SPECIES.find((x) => x.id === sid); const z = zones.find((x) => x.id === zid); return sp && z ? potentialOf(sp, z) : null; },
  });
  applyLegal();
  initTrees({ trees: trj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, zones, habitat, thumb });
  renderTreeGrid($('#tree-grid'));
  buildSearch(idj, trj, embedded);
  initMap();
  initShell();
  initJournal({ zones, predict, getZoneId: () => state.zoneId || zones[0].id, zoneImage: (zid) => zoneMedia[zid]?.file || speciesPhoto(SPECIES[0].id)?.file });
  route(); // le pagine che non dipendono dal meteo (specie, diario, info) compaiono subito
  await refreshWeather(false);
  if (embedded || review) $('#refresh').hidden = true;
  else $('#refresh').addEventListener('click', () => refreshWeather(true));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
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
    if (navDepth > 0) history.back(); else location.hash = '#/';
  });
  renderFilterSummary();
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  const [a, b, c] = parts;
  if (a === 'zona' && zones.some((z) => z.id === b)) return { view: 'zona', zoneId: b, offset: Math.max(0, Math.min(AHEAD_DAYS, +c || 0)) };
  if (a === 'mappa') return { view: 'mappa', zoneId: b };
  if (a === 'specie' && b) return { view: 'specie-dettaglio', speciesId: b };
  if (a === 'specie') return { view: 'specie' };
  if (a === 'albero' && b) return { view: 'albero', treeId: b };
  if (a === 'alberi') return { view: 'alberi' };
  if (a === 'riconosci') return { view: 'riconosci', compare: b === 'confronta' ? c : '', pick: b === 'confronta' ? parts[3] : '' };
  if (a === 'diario') return { view: 'diario' };
  if (a === 'info') return { view: 'info' };
  if (a === 'metodo') return { view: 'metodo' };
  if (a === 'fungo' && b) return { view: 'fungo', taxonId: b };
  return { view: 'uscite' };
}

// profondita' e posizione delle viste: decidono la direzione della transizione
const LEVEL = { zona: 1, 'specie-dettaglio': 1, albero: 1, info: 1, metodo: 2, fungo: 1 };
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

function route() {
  const r = parseRoute();
  r.tab = { zona: 'uscite', 'specie-dettaglio': 'specie', alberi: 'specie', albero: 'specie', riconosci: 'specie', info: '', metodo: '', fungo: 'specie' }[r.view] ?? r.view;
  r.hash = location.hash || '#/';
  const nav = navKind(prev, r), back = prev?.hash || '';
  if (prev) scrollMem.set(prev.hash, scrollY);
  prev = r;
  navigate(() => routeNow(r, nav), { nav, back });
}

function routeNow(r, nav) {
  state.view = r.view;
  if (r.zoneId) state.zoneId = r.zoneId;
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
  if (r.view === 'metodo') renderMethod($('#method-body'));
  if (r.view === 'fungo') renderTaxonPage($('#taxon-detail'), r.taxonId);
  if (r.view === 'riconosci') { setCompare(r.compare, r.pick); renderIdentify($('#identify')); }
  if (r.view === 'mappa') {
    requestAnimationFrame(() => {
      map?.invalidateSize();
      const lb = $('.legend-box');
      if (lb && !lb.dataset.touched) lb.open = $('#map').clientHeight >= 600 && $('#map').clientWidth >= 340;
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
function renderFilterSummary() {
  const box = $('#active-filters');
  if (!box) return;
  const all = state.groups.size === GROUPS.length;
  box.innerHTML = `<button type="button" class="chip" data-g="all" aria-pressed="${all}">Tutti</button>
    ${GROUPS.map((g) => `<button type="button" class="chip" data-g="${g.id}" aria-pressed="${!all && state.groups.has(g.id)}">${esc(g.label)}</button>`).join('')}
    <span class="af-sep" aria-hidden="true"></span>
    ${PREFS.map(([k, label]) => `<button type="button" class="chip pref" data-p="${k}" aria-pressed="${!!state[k]}">${esc(label)}</button>`).join('')}`;
  const changed = () => soft(() => { savePrefs(); renderFilterSummary(); if (series) { compute(); outCache.clear(); renderAll(); } });
  box.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.g;
    if (id === 'all') state.groups = new Set(GROUPS.map((g) => g.id));
    else if (state.groups.size === GROUPS.length) state.groups = new Set([id]); // da "Tutti" si restringe al gruppo toccato
    else if (state.groups.has(id)) { state.groups.delete(id); if (!state.groups.size) state.groups = new Set(GROUPS.map((g) => g.id)); }
    else state.groups.add(id);
    changed();
  }));
  box.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => soft(() => { state[b.dataset.p] = !state[b.dataset.p]; savePrefs(); renderFilterSummary(); renderAll(); })));
}

async function refreshWeather(force) {
  try {
    $('#updated').textContent = 'Aggiornamento…';
    const w = await loadWeather(zones, { force });
    series = w.series;
    zones = zones.filter((z) => series[z.id]); // una zona senza meteo (copia di revisione vecchia) resta fuori
    const sameDay = w.fetchedAt.toDateString() === new Date().toDateString();
    $('#updated').textContent = (w.offline ? 'Senza rete · ' : '') + 'Aggiornamento meteo · ' + (w.snapshot || !sameDay
      ? w.fetchedAt.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : w.fetchedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
    document.documentElement.classList.toggle('is-offline', !!w.offline);
    $('#stale').hidden = !w.stale;
    $('#today-kicker').textContent = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    compute();
    renderAll();
    loadOuting(zones, { force }).then((o) => { outing = o; outCache.clear(); renderAll(); }).catch(() => {});
  } catch (err) {
    $('#updated').textContent = '';
    const msg = `<div class="error">Non riesco a scaricare il meteo (${esc(err.message)}). Controlla la connessione e tocca ↻ in alto per riprovare.</div>`;
    $('#hero').innerHTML = msg;
    $('#detail').innerHTML = msg;
  }
}

const selectedSpecies = () => SPECIES.filter((s) => state.groups.has(s.group));

// meteo della mattina dell'uscita per zona e giorno (null finche' le previsioni orarie non arrivano)
const outCache = new Map();
function wxOf(z, d) {
  if (!outing || !d) return null;
  const k = z.id + d.date;
  if (!outCache.has(k)) outCache.set(k, outingFor(outing[z.id], z, d.date));
  return outCache.get(k);
}
const wxRank = (z, d) => OUTING_RANK[wxOf(z, d)?.level] ?? 1;
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
    if (!d2?.best || !w2 || OUTING_RANK[w2.level] <= OUTING_RANK[w.level]) continue;
    const s2 = adjusted(z2, d2.score, d2);
    if (s2 < Math.max(30, s0 * 0.7)) continue;
    const r = s2 * OUTING_RANK[w2.level];
    if (!best || r > best.r) best = { z: z2, d: d2, s: s2, w: w2, r };
  }
  return best;
}
const wxIcon = (w) => (w?.thunder ? 'storm' : w?.snow ? 'snow' : w && (w.rain >= 0.5 || w.prob >= 50) ? 'rain' : 'sun');

function compute() {
  const sp = selectedSpecies();
  results = {};
  for (const z of zones) {
    const sb = series[z.id];
    const t = sb[0].todayIndex;
    const days = [];
    for (let i = Math.max(30, t - HISTORY_DAYS); i <= t + AHEAD_DAYS && i < sb[0].dates.length; i++) {
      const r = scoreZoneDay(z, habitat[z.id], sb, sp, i);
      days.push({ i, date: sb[0].dates[i], ...r, score: r.best ? r.best.score : 0 });
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
let prep = null, trailheads = {};
const srcLinks = (src) => (src || []).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(' · ');
function prepGeneralHtml(rules) {
  const ord = [...rules].sort((a, b) => (a.level === 'obbligatorio' ? 0 : 1) - (b.level === 'obbligatorio' ? 0 : 1));
  return `<details class="prep-gen"><summary><h2>Prepararli e conservarli: le regole per tutti</h2></summary>
    <ol class="k-steps">${ord.map((r) => `<li class="${r.level === 'obbligatorio' ? 'must' : 'tip'}"><b>${esc(r.title)}</b> ${esc(r.text)}${r.why ? `<small>${esc(r.why)}</small>` : ''}<span class="k-src">${r.level === 'obbligatorio' ? '<span class="k-lv">obbligatorio</span>' : '<span class="k-lv tip">consigliato</span>'}${r.sources?.length ? `<details class="k-src-d"><summary>Fonti (${r.sources.length})</summary>${srcLinks(r.sources)}</details>` : ''}</span></li>`).join('')}</ol>
  </details>`;
}
const adjParts = (zone, d) => {
  const out = [];
  if (state.distancePenalty) out.push({ label: 'vicino a Rieti', mult: 1 - 0.3 * Math.min(1, (access[zone.id]?.[0]?.minutes ?? zone.drive_min) / 120) });
  if (state.avoidCrowd && d?.crowd) out.push({ label: 'poca gente', mult: 1 - 0.45 * d.crowd.value });
  if (state.preferComfort && d?.comfort) out.push({ label: 'accesso comodo', mult: 0.55 + 0.45 * d.comfort.value });
  return out;
};
const adjusted = (zone, score, d) => {
  let v = score;
  if (state.distancePenalty) v *= 1 - 0.3 * Math.min(1, (access[zone.id]?.[0]?.minutes ?? zone.drive_min) / 120);
  if (state.avoidCrowd && d?.crowd) v *= 1 - 0.45 * d.crowd.value;
  if (state.preferComfort && d?.comfort) v *= 0.55 + 0.45 * d.comfort.value;
  return Math.round(v);
};

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
    const chips = [{ id: 'all', label: 'Tutti' }, ...GROUPS];
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
function fillSpecies() {
  const month = new Date().getMonth();
  const q = normTxt(spQuery).trim();
  const groups = Object.fromEntries(GROUPS.map((g) => [g.id, g.label]));
  const list = SPECIES.filter((sp) => (spFilter === 'all' || sp.group === spFilter)
    && (!q || q.split(/\s+/).every((w) => normTxt(`${sp.name} ${sp.latin} ${groups[sp.group]}`).includes(w))));
  $('#sp-cards').innerHTML = list.map((sp) => {
    const ph = speciesPhoto(sp.id);
    const inSeason = sp.months[month] >= 0.6;
    return `<button type="button" class="sp-card" data-species="${sp.id}" aria-label="${esc(sp.name)}">
      ${ph ? `<img src="${ph.file}" alt="" loading="lazy">` : ''}<span class="shade"></span>
      ${inSeason ? '<span class="pill glass sm">in stagione</span>' : ''}
      <span class="sp-card-body"><b>${esc(sp.name)}</b><i>${esc(sp.latin)}</i></span></button>`;
  }).join('') || `<p class="muted empty-note">Nessuna specie commestibile con "${esc(spQuery)}". Se cerchi un fungo che hai trovato, anche velenoso, prova <a href="#/riconosci">Riconosci</a>.</p>`;
}


function renderAll() {
  if (!results) return;
  if (state.view === 'uscite') { renderDays(); renderHome(); }
  if (state.view === 'zona') renderDetail();
  if (state.view === 'mappa') { renderMapDays(); renderMap(); renderLegend(); if (sheetZone) openSheet(sheetZone); }
}

function bestOfDay(o) {
  let best = null;
  for (const z of zones) {
    const d = dayEntry(z.id, o);
    if (!d?.best) continue;
    const sc = adjusted(z, d.score, d);
    if (!best || sc > best.s) best = { s: sc, z, d, o };
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
    b.innerHTML = `<span class="d1">${top}</span><span class="d2">${mid}</span>${sc != null ? `<span class="d3"><span class="dot" style="--dc:var(${scoreVar(sc)});--dcs:var(${scoreVar(sc).replace('--s', '--ps')})"></span><b class="pc">${sc}</b></span>` : '<span class="d3">giorni</span>'}`;
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
    if (best) mk(o === 0 ? 'Oggi' : o === 1 ? 'Dom' : fmtDate(best.d.date, { weekday: 'short' }).replace('.', ''), fmtDate(best.d.date, { day: 'numeric' }), o, best.s);
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
      if (d?.best) { const s = adjusted(z, d.score, d); combos.push({ z, o, d, s, r: s * wxRank(z, d) }); }
    }
  }
  combos.sort((a, b) => b.r - a.r || a.o - b.o);
  const perZone = {};
  return combos.filter((c) => (perZone[c.z.id] = (perZone[c.z.id] || 0) + 1) <= (state.homeDay == null ? 2 : 1));
}

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
  const img = (src) => (src ? `<img class="thumb" src="${src}" width="44" height="44" alt="" loading="lazy">` : '');
  const items = [];
  for (const z of zones) {
    const tip = Object.keys(habitat?.[z.id]?.forest?.tipologie_ha || {}).join(' ');
    // "faggio" deve trovare le zone con faggete: nomi degli alberi i cui sinonimi compaiono nei tipi di bosco
    const tl = tip.toLowerCase();
    const treesHere = Object.values(trj?.trees || {}).filter((t) => [t.name, ...(t.aliases || [])].some((a) => a && tl.includes(String(a).toLowerCase()))).map((t) => t.name).join(' ');
    const cv = coverOf(z);
    items.push({ kind: 'zona', title: splitName(z)[0], sub: splitName(z)[1] || z.name, hay: `${z.name} ${tip} ${treesHere} ${(habitat?.[z.id]?.road_names || []).join(' ')}`, href: `#/zona/${z.id}`, img: cv ? img(cv.small) : '', boost: 1 });
  }
  for (const sp of SPECIES) {
    const d = idj?.species?.[sp.id] || {};
    items.push({ kind: 'fungo', title: sp.name, sub: sp.latin, hay: `${(d.aka || []).join(' ')} ${sp.group || ''} ${d.latin || ''}`, href: `#/specie/${sp.id}`, img: thumb(sp.id, 44), boost: 1 });
  }
  for (const t of searchTaxa()) {
    const look = t.look.map((id) => SPECIES.find((x) => x.id === id)?.name).filter(Boolean);
    items.push({ kind: 'velenoso', title: t.name || t.latin, sub: `${t.name !== t.latin ? t.latin : ''}${look.length ? `${t.name !== t.latin ? ' · ' : ''}si confonde con ${look.slice(0, 2).join(', ').toLowerCase()}` : ''}`, hay: look.join(' '), href: `#/fungo/${t.key}`, img: t.photo ? img(A(t.photo.file)) : '', badge: t.toxicity, badgeCls: `tox-${String(t.toxicity).replace(/\s/g, '-')}` });
  }
  for (const [id, t] of Object.entries(trj?.trees || {})) {
    items.push({ kind: 'albero', title: t.name, sub: t.latin, hay: `${(t.aliases || []).join(' ')} ${t.type || ''}`, href: `#/albero/${encodeURIComponent(id)}`, img: treeThumb(id, 44) });
  }
  const seen = new Map();
  for (const z of zones) for (const t of trails[z.id]?.trails || []) {
    const key = `${t.ref || ''}|${t.name || ''}`;
    if (seen.has(key)) { seen.get(key).zs.push(z); continue; }
    seen.set(key, { t, zs: [z] });
  }
  for (const { t, zs } of seen.values()) {
    items.push({ kind: 'sentiero', title: `${t.ref ? `Sentiero ${t.ref}` : 'Sentiero'}${t.name ? ` · ${t.name}` : ''}`, sub: zs.map((z) => splitName(z)[0]).join(', '), hay: `${(t.itinerary || []).join(' ')} ${t.operator || ''} cai segnavia`, href: `#/zona/${zs[0].id}`, img: segnavia(t) });
  }
  const pages = [
    ['Riconosci un fungo', 'Descrivi quello che vedi, anche se è velenoso', 'identificare trovato velenoso sosia caratteri lamelle pori volva anello sporata', '#/riconosci'],
    ['Emergenza e intossicazione', 'Cosa fare, chi chiamare', 'emergenza intossicazione avvelenamento centro antiveleni 118 112 pronto soccorso sintomi', '#/info'],
    ['Regole di raccolta nel Lazio', 'Attestato, contributo, limiti, orari', 'regole legge tesserino attestato contributo 3 kg limite orari divieti parchi aree protette', '#/info'],
    ['Controllo gratuito all\'ASL', 'Ispettorato micologico', 'asl ispettorato micologico controllo gratuito micologo', '#/info'],
    ['Come funziona l\'indice', 'Formule, parametri, fonti e limiti', 'metodo scienza scientifico indice calcolo formula pioggia temperatura suolo latenza innesco probabilita affidabilita fonti letteratura euristica', '#/metodo'],
    ['Gli alberi', 'Riconoscerli e cosa ci cresce sotto', 'alberi bosco piante', '#/alberi'],
    ['Prepararli e conservarli', 'Crudo, prebollitura, congelare, essiccare, sott\'olio', 'preparazione cucina cuocere cottura crudo prebollitura congelare surgelare essiccare seccare sottolio sott olio botulino conserve vasetti quantita bambini gravidanza alcol', '#/info'],
    ['Il diario delle uscite', 'Registra cosa hai trovato e dove', 'diario uscite registrare raccolto storico esporta', '#/diario'],
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
const ring = (s, big = true) => `<span class="ring${big ? '' : ' ring-sm'}" style="--c:var(${scoreVar(s).replace('--s', '--ps')});--p:${s}" aria-label="Indice ${s} su 100, ${CLASSES[classOf(s)].label}"><b>${s}</b>${big ? `<small>${CLASSES[classOf(s)].label}</small>` : ''}</span>`;
const IC = {
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
  if (!hero) { box.innerHTML = '<p class="muted">Nessuna uscita calcolabile per questi filtri.</p>'; $('#ranking').innerHTML = ''; return; }
  const t = hero.d.crowd ? timingAdvice({ dateStr: hero.d.date, lat: hero.z.lat, lon: hero.z.lon, crowd: hero.d.crowd }) : null;
  const a0 = access[hero.z.id]?.[0];
  const [title, sub] = splitName(hero.z);
  const cov = coverOf(hero.z, hero.d.best.species.id);
  // le altre specie con la loro probabilita': pillole piccole, colore della classe (la principale e' gia' nell'anello)
  const also = hero.d.perSpecies.slice(1, 3).filter((p) => p.score >= 25)
    .map((p) => `<span class="sp-pill" title="${esc(CLASSES[classOf(p.score)].label)}"><i style="background:var(${scoreVar(p.score).replace('--s', '--ps')})"></i>${esc(p.species.name.split(' / ')[0])} <b>${p.score}</b></span>`);
  box.innerHTML = `
    <a class="cover vtn" style="--vtn:cover" href="#/zona/${hero.z.id}/${hero.o}">
      ${cov ? `<img class="cover-img" src="${cov.hd}" alt="${esc(cov.alt)}" fetchpriority="high">` : ''}
      <span class="shade"></span>
      <span class="cover-top"><span class="pill glass">${state.homeDay == null ? 'La migliore uscita' : 'Il posto migliore'} · ${esc(dayLabel(hero.o, hero.d.date, true))}</span>${ring(hero.s)}</span>
      <span class="cover-body">
        <span class="cover-title">${esc(title)}</span>${sub ? `<span class="cover-sub">${esc(sub)}</span>` : ''}
        <span class="cover-sp">${thumb(hero.d.best.species.id, 44)}<span><b>${esc(hero.d.best.species.name)}</b> ${intornoA(hero.d.best.band)} ${hero.d.best.band} m</span></span>
        ${also.length ? `<span class="sp-pills" aria-label="Altre specie possibili"><span class="sp-pills-k">anche</span>${also.join('')}</span>` : ''}
        <span class="facts">${t ? fact('clock', `entro le <b>${fmtRough(t.arrive, 15, 'floor')}</b>`) : ''}${fact('car', `<b>${a0?.minutes ?? hero.z.drive_min}</b> min`)}${hero.d.crowd ? fact('people', crowdText(hero.d.crowd)) : ''}${wxOf(hero.z, hero.d) ? `<span class="fact wx-${wxOf(hero.z, hero.d).level}">${IC[wxIcon(wxOf(hero.z, hero.d))]}${esc(wxOf(hero.z, hero.d).main)}</span>` : ''}</span>
        ${(() => { const g = list.filter((c) => c.o === hero.o).sort((a, b) => b.s - a.s)[0]; const wg = g && wxOf(g.z, g.d); return g && g.z.id !== hero.z.id && wg && wg.level !== 'ok' ? `<span class="cover-note">${esc(splitName(g.z)[0])} avrebbe un indice più alto (${g.s}), ma ${esc(dayLabel(hero.o, hero.d.date, true).toLowerCase())} mattina: ${esc(wg.main)}.</span>` : ''; })()}
        <span class="cover-cta">Il piano dell'uscita <span aria-hidden="true">→</span></span>
      </span>
    </a>`;
  const ol = $('#ranking');
  ol.innerHTML = list.slice(1, 8).map((c) => {
    const cv = coverOf(c.z, c.d.best.species.id);
    return `<li class="vtn" style="--vtn:t-${c.z.id}-${c.o}"><a class="tile" href="#/zona/${c.z.id}/${c.o}">
      ${cv ? `<img src="${cv.small}" alt="" loading="lazy">` : ''}<span class="shade"></span>${ring(c.s, false)}${(() => { const w = wxOf(c.z, c.d); return w && w.level !== 'ok' ? `<span class="tile-wx wx-${w.level}" title="${esc(w.text)}">${IC[wxIcon(w)]}${esc(OUTING_LABEL[w.level])}</span>` : ''; })()}
      <span class="tile-body"><span class="tile-day">${esc(dayLabel(c.o, c.d.date, true))}</span><b>${esc(splitName(c.z)[0])}</b><small>${esc(c.d.best.species.name)} · ${c.d.best.band} m · ${access[c.z.id]?.[0]?.minutes ?? c.z.drive_min} min</small></span>
    </a></li>`;
  }).join('');
  $('#others-h').hidden = list.length < 2;
  renderSeason();
  fitCover();
}

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
  const need = (c.querySelector('.cover-body')?.offsetHeight || 0) + (c.querySelector('.cover-top')?.offsetHeight || 0) + 18 * 2 + 14;
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
    for (const p of scoreZoneDay(z, habitat[z.id], series[z.id], SPECIES, d.i).perSpecies) {
      if (!best[p.species.id] || p.score > best[p.species.id].score) best[p.species.id] = { ...p, z };
    }
  }
  const arr = Object.values(best).filter((p) => p.score >= 15).sort((a, b) => b.score - a.score).slice(0, 10);
  $('#season-h').hidden = !arr.length;
  box.innerHTML = arr.map((p) => {
    const ph = speciesPhoto(p.species.id);
    return `<li><button type="button" class="portrait" data-species="${p.species.id}">
      ${ph ? `<img src="${ph.file}" alt="" loading="lazy">` : ''}<span class="shade"></span>${ring(p.score, false)}
      <span class="portrait-body"><b>${esc(p.species.name)}</b><small>${esc(splitName(p.z)[0])}</small></span></button></li>`;
  }).join('');
}

function renderMapDays() {
  dayChips($('#map-days'), state.dayOffset, (o) => { state.dayOffset = o; renderAll(); });
}

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
      <span class="sheet-img">${cv ? `<img src="${cv.small}" alt="">` : ''}${ring(sc, false)}</span>
      <span class="sheet-txt"><span class="eyebrow">${esc(dayLabel(state.dayOffset, d.date, true))}</span><b class="sheet-title">${esc(splitName(z)[0])}</b>
        <span class="small">${esc(d.best.species.name)} ~${d.best.band} m · ${access[zid]?.[0]?.minutes ?? z.drive_min} min${d.crowd ? ` · ${crowdText(d.crowd)}` : ''}</span>${wxOf(z, d) ? `<span class="small wx-line wx-${wxOf(z, d).level}">${IC[wxIcon(wxOf(z, d))]}${esc(wxOf(z, d).text)}</span>` : ''}</span>
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
    const ax = d.access;
    ic = `<span class="pt-ic pt-walk">${IC.walk}</span>`; eyebrow = 'Qui lasci l\'auto e prosegui a piedi'; title = ax.road || 'Punto più vicino al bosco adatto';
    text = `In auto ${ax.surface ? `su ${SURF_LABEL[ax.surface]}` : 'su asfalto'} fino a qui, poi ${ax.walkM < 50 ? `il bosco adatto è a bordo strada: ${esc((SHORT[ax.cat] || ax.cat).toLowerCase())} a ${ax.e} m` : `${walkTxt(ax.walkM)} in linea d'aria fino a ${esc((SHORT[ax.cat] || ax.cat).toLowerCase())} a ${ax.e} m`}, adatto a ${esc(d.best.species.name.toLowerCase())}.`;
    actions = `<a class="btn primary big" href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">${IC.car} Indicazioni stradali fin qui</a>${copyBtn(ax.rlat, ax.rlon)}`;
  } else if (pt.kind === 'trailhead') {
    const h = pt.h, t = pt.t;
    ic = `<span class="pt-ic pt-th">${segnavia(t)}</span>`; eyebrow = 'Imbocco del sentiero'; title = trailName(t);
    text = `Qui il sentiero incontra una ${h.kind === 'strada' ? 'strada percorribile in auto' : 'strada sterrata'}${h.road ? ` (${esc(h.road)})` : ''}${h.ele != null ? `, a ${h.ele.toLocaleString('it-IT')} m` : ''}.${h.kind === 'sterrata' ? ' Controlla prima che la sterrata sia aperta e adatta alla tua auto.' : ''}`;
    actions = `<a class="btn primary big" href="${gmaps(h.lat, h.lon)}" target="_blank" rel="noopener">${IC.car} Indicazioni stradali fin qui</a>
      <button type="button" class="btn ghost" data-trail="${t.id}">Il sentiero</button>${copyBtn(h.lat, h.lon)}`;
  } else {
    const t = pt.t, g = trailGeo(z, t);
    ic = null; eyebrow = pt.top ? 'Sentiero consigliato' : 'Sentiero'; title = '';
    text = trailCard(z, t, d, false);
    actions = g ? `<a class="btn primary big" href="${g.wm}" target="_blank" rel="noopener">${IC.map} Percorso e profilo del sentiero</a>
      <a class="btn ghost" href="${gmaps(g.start[0], g.start[1])}" target="_blank" rel="noopener">${IC.car} Indicazioni stradali all'imbocco</a>
      <a class="btn ghost" href="${g.gpx}" download="${esc(g.file)}">Scarica GPX</a>` : '';
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
}

const shortName = (z) => z.title || z.name.split(/[/–(]/)[0].trim();

function renderMap() {
  if (!hasLeaflet()) {
    renderSvgMap($('#map'), {
      zones, origin,
      items: zones.map((z) => {
        const d = dayEntry(z.id, state.dayOffset);
        const s = adjusted(z, d?.score ?? 0, d);
        return {
          z, score: s, color: `var(${scoreVar(s)})`, selected: z.id === state.zoneId,
          tooltip: `${z.name} · indice ${s}${d?.best ? ` · ${d.best.species.name} ~${d.best.band} m` : ''}`,
        };
      }),
      onSelect: (id) => openSheet(id),
    });
    return;
  }
  for (const k in zoneLayers) zoneLayers[k].remove();
  zoneLayers = {};
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
    const s = adjusted(z, d?.score ?? 0, d);
    const color = cssVar(scoreVar(s));
    const g = L.layerGroup().addTo(map);
    const selected = z.id === state.zoneId;
    L.circle([z.lat, z.lon], {
      radius: z.radius_m, color: selected ? cssVar('--text') : color, weight: selected ? 3 : 2,
      fillColor: color, fillOpacity: 0.5,
    }).addTo(g).on('click', () => openSheet(z.id));
    if (matchMedia('(hover: hover)').matches) g.getLayers()[0].bindTooltip(`<b>${esc(z.name)}</b><br>Indice ${s} · ${d?.best ? esc(d.best.species.name) + ' ~' + d.best.band + ' m' : '—'}`, { className: 'zone-tt', sticky: true });
    L.marker(labelPos[z.id], {
      icon: L.divIcon({ className: '', html: `<span class="zone-label${state.zoneId && !selected ? ' zone-label-min' : ''}${selected ? ' zone-label-sel' : ''}"><span class="dot" style="background:${color}"></span> ${s}${state.zoneId && !selected ? '' : ` <span class="zone-name">${esc(shortName(z))}</span>`}</span>`, iconSize: null }),
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
  const items = [...CLASSES].reverse().map((c) => `<span><span class="sw" style="background:var(${scoreVar(c.min)})"></span>${c.label}${c.min ? ' ≥' + c.min : ''}</span>`);
  $('#legend').innerHTML = items.join('') +
    (hasLeaflet() || !globalThis.FUNGAROLI_DATA ? '' : '<span class="muted">Schema: cerchi = zone, anelli = distanza in linea d\'aria da Rieti</span>') +
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

function planCard(z, d) {
  const best = d.best;
  const rows = [];
  rows.push({ sec: 'specie', icon: 'find', thumb: best.species.id, k: 'Cosa cercare', v: `<button type="button" class="sp-inline" data-species="${best.species.id}">${esc(best.species.name)}</button> ${intornoA(best.band)} <b>${best.band} m</b>`,
    sub: [whereSummary(best.species.id) && `<span class="plan-where">${linkTrees(whereSummary(best.species.id))}</span>`,
      criticalRule(best.species.id) && `<span class="plan-crit">⚠ ${esc(criticalRule(best.species.id))}</span>`,
      d.perSpecies.slice(1, 3).filter((p) => p.score >= 20).map((p) => `${esc(p.species.name)} ${p.score}`).join(' · ')].filter(Boolean).join('<br>') || esc(best.species.latin) });
  if (d.crowd) {
    const t = timingAdvice({ dateStr: d.date, lat: z.lat, lon: z.lon, crowd: d.crowd });
    rows.push({ sec: 'quando', icon: 'when', k: 'Quando', v: `Arriva <b>entro le ${fmtRough(t.arrive, 15, 'floor')}</b> <span class="badge crowd-${d.crowd.level}">${crowdText(d.crowd)}</span>`,
      sub: `alba verso le ${fmtRough(t.sunrise, 5)} · raccolta dalle ${fmtRough(t.legal, 5, 'ceil')}` });
  }  const w = wxOf(z, d);
  if (w) {
    const alt = alternativeFor(z, state.dayOffset, d);
    rows.push({ sec: 'quando', svg: IC[wxIcon(w)], k: 'Meteo dell\'uscita', badge: `<span class="badge wx-b wx-${w.level}">${OUTING_SHORT[w.level]}</span>`,
      v: `${esc(w.text.replace(/^./, (c) => c.toUpperCase()))}`,
      sub: alt ? `<span class="plan-alt">Puoi andare a <a href="#/zona/${alt.z.id}/${state.dayOffset}">${esc(splitName(alt.z)[0])}</a>: ${esc(alt.w.main)}, indice ${alt.s}.</span>`
        : `Mattina, dalle ${w.from}:00 alle 13${w.thunder ? ' · in montagna con i temporali non si sta nel bosco' : ''}` });
  }

  const a0 = access[z.id]?.[0];
  const ax = d.access;
  if (a0 || ax) {
    const unp = a0?.unpaved_tail_km > 0.2 ? `, ultimi ${fmtKm(a0.unpaved_tail_km)} km su strada bianca` : '';
    rows.push({ sec: 'accesso', icon: 'car', k: 'Come arrivare',
      v: ax ? `In auto ${ax.road ? `su ${esc(ax.road)}` : 'fino al punto più vicino'}${ax.walkM < 50 ? ': bosco adatto a bordo strada' : `, poi <b>${fmtM(ax.walkM)} a piedi</b>`}` : `${a0.minutes} min fino a ${esc(a0.parking)}`,
      sub: `${a0 ? `${a0.minutes} min da Rieti${unp}` : ''}${ax ? ` · <a href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">navigatore</a>` : ''}`,
      badge: d.comfort ? `<span class="badge comfort-${d.comfort.level}">${d.comfort.level}</span>` : '' });
  }
  const tl = trailsFor(z, best.species, best.band);
  if (tl[0]) {
    const t = tl[0];
    rows.push({ sec: 'sentieri', svg: segnavia(t), k: 'Sentiero', v: esc(trailName(t)),
      sub: `${fmtKm(t.goodKm)} km in bosco adatto tra ${t.lo} e ${t.hi} m${t.difficulty ? ` · ${esc(t.difficulty)}, ${esc(DIFF[t.difficulty] || '')}` : ''}` });
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
  const box = $('#detail');
  if (!d?.best) { box.innerHTML = '<p class="muted">Nessun dato per questo giorno.</p>'; return; }
  const best = d.best;
  const s = adjusted(z, d.score, d);
  const dayLabel = state.dayOffset === 0 ? 'Oggi' : fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' });
  const hab = habitatAtBand(habitat[z.id], best.band);
  const rows = d.perSpecies.map((p) => `
    <tr>
      <td><button type="button" class="sp-link" data-species="${p.species.id}">${thumb(p.species.id, 34)}<span><span class="sp-n">${esc(p.species.name)}</span><span class="latin">${esc(p.species.latin)}</span></span></button>
        ${p.species.warning ? `<div class="warnline">⚠ ${esc(p.species.warning)}</div>` : ''}</td>
      <td class="num">${p.band} m</td>
      <td><div class="bar"><i style="width:${p.score}%;background:var(${scoreVar(p.score)})"></i></div></td>
      <td class="num"><b class="pc">${p.score}</b></td>
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
      <div class="phero-bar"><button type="button" class="fab" data-back aria-label="Indietro">${IC.back}</button><a class="fab" href="#/mappa/${z.id}" aria-label="Mappa della zona">${IC.map}</a></div>
      <div class="phero-body"><span class="pill glass">${esc(dayLabel)}</span><h1 class="phero-title">${esc(title)}</h1>${sub ? `<p class="phero-sub">${esc(sub)}</p>` : ''}</div>
      ${ring(s)}
    </header>
    <div class="pbody">
    <div id="zone-days" class="days compact" role="tablist" aria-label="Giorno"></div>
    ${planCard(z, d)}
    <a class="btn ghost big map-link" href="#/mappa/${z.id}">${IC.map} Sentieri e accesso sulla mappa</a>
    ${zoneLegal(z, d)}
    ${z.protection ? `<div class="notice">${esc(z.protection)}</div>` : ''}
    ${section('meteo', 'Perché questo indice', `${renderWhy({ r: best, s: sb, i: d.i, sp: best.species, band: best.band, dateStr: d.date, shown: s, prefs: adjParts(z, d), outing: wxRank(z, d) < 1 ? wxRank(z, d) : 0 })}
      <p class="sci-h">L'indice nei giorni</p><div id="charts"></div>${legal?.forecast_note ? `<p class="small muted">${esc(legal.forecast_note)}</p>` : ''}`)}
    ${section('quando', 'Quando andare e affollamento', renderHuman(z, d))}
    ${section('accesso', 'Accesso in auto e a piedi', renderAccess(z, d))}
    ${section('sentieri', 'Sentieri della zona', renderTrails(z, d))}
    ${section('specie', 'Cosa può nascere qui', zoneSpecies(z, d))}
    ${section('bosco', `Bosco a ${best.band} m (Carta Forestale)`, forestBar(hab.frac))}
    ${section('zona', 'La zona', `<p class="small">${linkTrees(z.description)}</p>
      <dl class="kv">
        <dt>Accesso</dt><dd>${esc(z.access)}</dd>
        <dt>Soste</dt><dd>${z.parking.map((p) => `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join(' · ')}</dd>
        <dt>Quote</dt><dd>${habitat[z.id].elevation.min}–${habitat[z.id].elevation.max} m (mediana ${habitat[z.id].elevation.median})</dd>
      </dl>${zoneMedia[z.id] ? `<p class="small muted">${creditLine(zoneMedia[z.id])}</p>` : ''}`)}
    </div>`;
  box.querySelector('[data-cover]')?.addEventListener('click', () => openLightbox([{ src: cov.hd, alt: cov.alt, caption: captionHtml({ title: esc(z.name), credit: creditLine(cov.credit) }) }]));
  // giorni della zona: cambiano il giorno senza aggiungere voci di cronologia
  const zd = $('#zone-days');
  zd.innerHTML = '';
  for (let o = 0; o <= AHEAD_DAYS; o++) {
    const x = dayEntry(z.id, o);
    if (!x?.best) continue;
    const sc = adjusted(z, x.score, x);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(o === state.dayOffset));
    b.innerHTML = `<span class="d1">${o === 0 ? 'Oggi' : o === 1 ? 'Dom' : fmtDate(x.date, { weekday: 'short' }).replace('.', '')}</span><span class="d2">${fmtDate(x.date, { day: 'numeric' })}</span><span class="d3"><span class="dot" style="--dc:var(${scoreVar(sc)});--dcs:var(${scoreVar(sc).replace('--s', '--ps')})"></span><b class="pc">${sc}</b></span>`;
    b.addEventListener('click', () => soft(() => { history.replaceState(null, '', `#/zona/${z.id}/${o}`); state.dayOffset = o; renderDetail(); }));
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
    rain: days.map((x) => sb.p[x.i] ?? 0),
    score: days.map((x) => adjusted(z, x.score, x)),
    todayIndex: r.todayIndex - from,
    selectedIndex: r.todayIndex + state.dayOffset - from,
  });
  if (openSecs.has('meteo')) drawCharts();
}

const fmtKm = (km) => km.toLocaleString('it-IT', { maximumFractionDigits: 1 });
const fmtM = (m) => (m >= 1000 ? `${fmtKm(m / 1000)} km` : `${Math.round(m / 10) * 10} m`);
// tratto a piedi in parole: sotto i 50 m il bosco e' praticamente a bordo strada
const walkTxt = (m) => (m < 50 ? 'il bosco adatto è <b>a bordo strada</b>' : `circa <b>${fmtM(m)} a piedi</b>`);
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
  if (d.crowd.fresh) tips.push('La buttata è appena partita: pochi lo sanno ancora.');
  else if (d.crowd.goodDays >= 3) tips.push(`L'indice è alto da ${d.crowd.goodDays} giorni: la notizia gira, aspettati altri cercatori.`);
  if (d.access?.farShare >= 0.2 && d.crowd.level !== 'basso') tips.push(`Il ${Math.round(d.access.farShare * 100)}% del bosco adatto è a più di 600 m da una strada: lì passa molta meno gente.`);
  if (alt) tips.push(`Alternativa più tranquilla: ${fmtDate(alt.date, { weekday: 'long', day: 'numeric' })} (indice ${alt.score}, ${crowdText(alt.crowd)}).`);
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
  const ax = d.access;
  if (!a0 && !ax) return '';
  const lines = [];
  if (a0) {
    let txt = `Da Rieti ${a0.minutes} min, ${fmtKm(a0.km)} km${a0.roads.length ? ` via ${a0.roads.join(', ')}` : ''}.`;
    if (a0.unpaved_tail_km > 0.2) txt += ` Asfalto per ${fmtKm(a0.paved_km)} km${a0.transition?.after ? ` (fino a ${a0.transition.after})` : ''}, poi <b>${fmtKm(a0.unpaved_tail_km)} km di strada bianca</b>${a0.unpaved_surfaces.length ? ` (${a0.unpaved_surfaces.map((x) => ({ gravel: 'ghiaia', dirt: 'sterrato', compacted: 'fondo compatto' }[x] || x)).join(', ')})` : ''} fino a ${esc(a0.parking)}.`;
    else txt += ` Tutto su asfalto fino a ${esc(a0.parking)} (${a0.elevation} m).`;
    lines.push(txt);
  }
  if (ax) {
    lines.push(`<b>Punto più comodo per ${esc(d.best.species.name.toLowerCase())}</b>: in auto ${ax.surface === 0 ? 'su asfalto' : `su ${SURF_LABEL[ax.surface]}`}${ax.road ? ` lungo ${esc(ax.road)}` : ''} fino al <a href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">punto sulla strada</a>, poi ${ax.walkM < 50 ? 'subito, a bordo strada,' : `<b>${fmtM(ax.walkM)} a piedi</b> (in linea d'aria) fino a`} ${esc((SHORT[ax.cat] || ax.cat).toLowerCase())} a ${ax.e} m.`);
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

function trailProfile(zid, t, sp, band) {
  const sm = t.samples || [];
  if (sm.length < 4) return '';
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
  return `<figure class="tprof"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Profilo del tratto nella zona: da ${es[0]} a ${es[n - 1]} m, tra ${lo} e ${hi} m">
      <path d="${area}" class="tp-area"/><g class="tp-good">${good}</g><path d="${line}" class="tp-line"/></svg>
    <figcaption><span>${hi} m</span><span class="tp-key"><i></i>bosco adatto a ${esc(sp.name.toLowerCase())}</span><span>${lo} m</span></figcaption></figure>`;
}

function trailCard(z, t, d, top = false) {
  const facts = [
    t.difficulty && `<div><dt>Difficoltà</dt><dd><b>${esc(t.difficulty)}</b> · ${esc(DIFF[t.difficulty] || '')}</dd></div>`,
    t.total_km && t.total_km < 200 && `<div><dt>Intero</dt><dd>${fmtKm(t.total_km)} km${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div>`,
    `<div><dt>Nella zona</dt><dd>${fmtKm(t.in_zone_km)} km${t.goodKm != null ? `, di cui <b>${fmtKm(t.goodKm)} km</b> in bosco adatto` : ''}</dd></div>`,
  ].filter(Boolean).join('');
  const heads = headsOf(z, t);
  return `<div class="tcard${top ? ' top' : ''}">
    <div class="tc-head">${segnavia(t)}<div class="tc-name"><b>${esc(trailName(t))}</b>${t.itinerary?.length > 2 ? `<small>${esc(t.itinerary.slice(1, -1).join(' · '))}</small>` : ''}${t.long ? '<small>tratto di un itinerario lungo</small>' : ''}${t.operator ? `<small>${esc(t.operator)}</small>` : ''}</div>${top ? '<span class="badge tc-top">consigliato</span>' : ''}</div>
    <dl class="tc-facts">${facts}</dl>
    ${d?.best ? trailProfile(z.id, t, d.best.species, d.best.band) : ''}
    ${heads.length ? `<div class="th-row"><span class="th-k">Imbocchi</span><div class="th-list">${heads.map((h) => `<a class="th-chip" href="${gmaps(h.lat, h.lon)}" target="_blank" rel="noopener" aria-label="Indicazioni stradali per l'imbocco a ${h.ele ?? ''} metri">${h.kind === 'strada' ? IC.car : ICON.track}<span><b>${h.ele != null ? `${h.ele.toLocaleString('it-IT')} m` : 'imbocco'}</b><small>${esc(h.road || (h.kind === 'strada' ? 'su strada' : 'su sterrata'))}</small></span></a>`).join('')}</div></div>` : ''}
  </div>`;
}

function renderTrails(z, d) {
  const list = trailsFor(z, d.best.species, d.best.band).slice(0, 4);
  if (!list.length) return trails[z.id] ? '<p class="small muted">Nessun sentiero segnato attraversa bosco adatto a questa quota: muoviti fuori sentiero dal punto d\'accesso.</p>' : '';
  return `
    <ol class="trails">${list.map((t, k) => `<li>${trailCard(z, t, d, k === 0)}${trailLinks(z, t)}</li>`).join('')}</ol>
    <p class="muted small">Sentieri OpenStreetMap (rete CAI). Il segnavia è il segno bianco e rosso con il numero dipinto su alberi e sassi. I km "adatti" incrociano tracciato, Carta Forestale e quota della specie. Google Maps di norma non mostra i sentieri CAI: sul posto usa un'app con mappe OpenStreetMap (OsmAnd, Organic Maps, Komoot, Locus) e il GPX.</p>`;
}

// imbocchi del sentiero (data/trailheads.json): dove si arriva in auto; prima i piu' vicini alla sosta della zona
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
    <a class="tl-btn primary" href="${gmaps(go[0], go[1])}" target="_blank" rel="noopener">${IC.car}<span>Portami all'imbocco</span></a>
    <a class="tl-btn" href="${g.wm}" target="_blank" rel="noopener">${IC.map}<span>Percorso e profilo</span></a>
    <a class="tl-btn" href="${g.gpx}" download="${esc(g.file)}">${ICON.download}<span>Scarica GPX</span></a>
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
    dlg.showModal();
  }
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
      today = Math.max(...z.bands.map((b, bi) => scoreSpecies(sp, sb[bi], i, habitat[z.id], b).score));
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
    const p = scores[sp.id] || { score: Math.max(...z.bands.map((b, bi) => scoreSpecies(sp, sb[bi], d.i, habitat[z.id], b).score)) };
    return { sp, pot, score: p.score, band: p.band };
  }).filter((r) => r.pot.level !== 'scarsa').sort((a, b) => b.score - a.score || b.pot.score - a.pot.score);
  return `<ul class="zsp">${rows.map(({ sp, pot, score }) => `
    <li><a href="#/specie/${sp.id}" class="zsp-row">${thumb(sp.id, 40)}
      <span class="zsp-body"><b>${esc(sp.name)}</b><span class="small muted">${POT_LABEL[pot.level]}${pot.ha ? ` · ~${pot.ha.toLocaleString('it-IT')} ha` : ''}</span></span>
      <span class="score-pill"><span class="dot" style="background:var(${scoreVar(score)})"></span>${score}</span></a></li>`).join('')}</ul>
    <p class="small muted">Ordinate per indice di oggi; sotto il nome, quanto habitat adatto c'è nella zona.</p>`;
}

// Indice previsto per tutte le specie in una zona/data (per il diario).
// band null = miglior quota della zona. Ritorna null se la data e' fuori dai dati meteo.
function predict(zoneId, date, band) {
  if (!series) return null;
  const z = zones.find((x) => x.id === zoneId);
  const sb = series[zoneId];
  const i = sb[0].dates.indexOf(date);
  if (i < 30) return null;
  const bands = band == null ? z.bands : [band];
  const out = {};
  for (const sp of SPECIES) {
    out[sp.id] = Math.max(...bands.map((b) => scoreSpecies(sp, sb[bandIndex(z, b)], i, habitat[zoneId], b).score));
  }
  return out;
}

function bandIndex(z, band) {
  return Math.max(0, z.bands.indexOf(band));
}

init().catch((e) => {
  $('#detail').innerHTML = `<div class="error">Errore di avvio: ${esc(e.message)}</div>`;
});
