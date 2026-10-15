import './rails.js';
import {outingDiscoveries} from './outing-discoveries.js';
import {renderBotanicalWhy} from './botanical-explanation.js';
import {initPlants,plants,plantName,plantRecord,plantThumb,renderPlants,renderPlantPage} from './plants.js';
import {botanicalModels} from './botanical-model.js';
import './theme.js';
import './images.js';
import { consumeFresh, freshDone } from './refresh.js';
import {updateWeatherHTML,reconcileChildren,keepWeatherReadingPosition} from './weather-dom.js';
import { SPECIES, GROUPS, FOREST } from './species.js';
import { scoreZoneDay, scoreSpecies, habitatAtBand, habitatPotential, elevationFit, combine, classOf, scoreLabel, scoreShortLabel, formatIndex, MODEL_VERSION, PARAMS, CLASSES } from './model.js';
import { todayISO, loadWeather } from './weather.js';
import { weatherErrorMessage } from './weather-request.js';
import { renderCharts } from './chart.js';
import { initJournal } from './journal.js';
import { renderSvgMap } from './svgmap.js';
import { initSpeciesCards, thumb as fungusThumb, renderSpeciesDetail, whereSummary, criticalRule as fungusCriticalRule, criticalRuleOf as fungusCriticalRuleOf, speciesPhoto as fungusPhoto, speciesPhotos as fungusPhotos } from './speciescard.js';
import { speciesLink } from './species-link.js';
import { initEntitySheets, openEntitySheet } from './entity-sheet.js';
import {initBaseLocation,currentBase,customBase,travelTo,travelText,directionsTo,BASE_PRIVACY_TEXT} from './base-location.js';
import { initLearning, renderGlossary, renderFieldIdentify, difficultyLink, glossaryTerms, glossaryTitle, enhanceGlossary } from './learning.js';
import { openLightbox, captionHtml } from './lightbox.js';
import { initInstall, maybeInvite } from './install.js';
import { loadOuting, outingFor, OUTING_LABEL, OUTING_SHORT, OUTING_RANK } from './outing.js';
import { initIdentify, renderIdentify, setCompare, searchTaxa, openTaxon, renderTaxonPage, renderTaxonView, taxonName, taxonByKey, attentionLine, sourceRows } from './identify.js';
import { initSearch } from './search.js';
import { searchFieldHtml, matchesQuery, renderAlsoIn } from './catalog-search.js';
import { renderGuidedKey } from './guided-key.js';
import { renderWhy, renderMethod } from './science.js';
import { navigate, soft } from './motion.js';
import { FOREST_LEGEND } from './forest-legend.js';
import { initTrees, renderTreeGrid, renderTreePage, linkTrees, treeChips, treeForCategory, treeThumb, treePhotoSrc } from './trees.js';
import { crowding, comfortScore, timingAdvice, fmtTime, fmtRough, holidayName, intornoA } from './human.js';
import { initCommunity, communityStatus, communityRank, reportBadge } from './community.js';
import { guideTitle, renderGuideCards, renderGuide, initGuideContent, guideCount } from './guides.js';
import { buildEdibleCatalog, seasonStatus, seasonLabel } from './edible-catalog.js';
import { mountSpeciesAutocomplete } from './species-autocomplete.js';
import { uniquePlaceProposals, chooseWalkTrail, walkContext, trailSketch } from './walks.js';
import { cardLatin } from './names.js';
import { pickCover } from './zone-cover.js';
import { initChallenges, renderChallengeList, renderChallenge, challengeTitle, challengeList, challengeProgressOf, suggestedChallenge } from './challenges.js';

const HISTORY_DAYS = 30;   // giorni passati mostrati nel grafico
const AHEAD_DAYS = 7;      // giorni futuri valutati
const PREFS_KEY = 'fungaroli:prefs:v2'; // v2: si parte con tutti i gruppi

const $ = (s) => document.querySelector(s);
function addNotebookReference(box,kind,id,title){if(!box||!title||box.querySelector('[data-note-kind]'))return;const button=box.querySelector('.notebook-context-action')||document.createElement('button');button.type='button';button.className='btn ghost notebook-context-action';button.dataset.noteKind=kind;button.dataset.noteId=id;button.dataset.noteTitle=title;button.textContent='＋ Annota nel taccuino';const target=box.querySelector('.pbody'),lead=box.querySelector('.article-lede');if(target)target.prepend(button);else if(lead)lead.after(button);else box.append(button);}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const scoreVar = (score) => Number.isFinite(score) ? `--s${5 - classOf(score)}` : '--muted';
const scoreText = formatIndex;
let journal;
let contentCopy = {};
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

let catalog = buildEdibleCatalog(),plantModels=[],botanicalNotes=[];
const botanicalById=id=>plantModels.find(p=>p.id===id);
const thumb=(id,size)=>botanicalById(id)?plantThumb(botanicalById(id).plantId,size):fungusThumb(id,size);
const speciesPhoto=id=>botanicalById(id)?botanicalById(id).photos?.[0]:fungusPhoto(id);
const criticalRule=id=>botanicalById(id)?.caution||fungusCriticalRule(id);
const criticalRuleOf=id=>botanicalById(id)?.caution?{text:botanicalById(id).caution,severity:'critico'}:fungusCriticalRuleOf(id);
const activeCatalog=()=>state.target==='piante'?plantModels.map(p=>({...p,modelId:p.id,aliases:plantRecord(p.plantId)?.aliases||[],months:p.phaseMonths})):catalog;
const activeIds=()=>state.target==='piante'?state.plantIds:state.speciesIds;
const setActiveIds=ids=>{if(state.target==='piante')state.plantIds=ids;else state.speciesIds=ids;};
const activeGroups=()=>state.target==='piante'?plantModels.map(p=>({id:p.group,label:p.name,rep:p.id})):GROUPS;
const state = {
  target: 'funghi',plantIds:null,useBotanicalNotes:false,showDiscoveries:true,
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
    state.useBotanicalNotes=p.useBotanicalNotes===true;state.showDiscoveries=p.showDiscoveries!==false; // Old botanical mode no longer replaces mushroom recommendations.
    if ('speciesIds' in p) state.speciesIds = Array.isArray(p.speciesIds) ? new Set(p.speciesIds.filter(x => typeof x === 'string')) : null;
    else {
      const groups = (p.groups || []).filter(g => GROUPS.some(x => x.id === g));
      if (groups.length && groups.length !== GROUPS.length) state.speciesIds = new Set(SPECIES.filter(s => groups.includes(s.group)).map(s => s.id));
    }
    state.distancePenalty = !!p.distancePenalty; state.avoidCrowd = !!p.avoidCrowd; state.preferComfort = !!p.preferComfort;
  }
} catch { /* preferenze non disponibili */ }
const savePrefs = () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ target:'funghi',showDiscoveries:state.showDiscoveries,useBotanicalNotes:state.useBotanicalNotes,plantIds:state.plantIds===null?null:[...state.plantIds],speciesIds: state.speciesIds === null ? null : [...state.speciesIds], distancePenalty: state.distancePenalty, avoidCrowd: state.avoidCrowd, preferComfort: state.preferComfort })); } catch { /* ignora */ }
};
const selectedCatalog = () => activeIds()===null?activeCatalog():activeCatalog().filter(s=>activeIds().has(s.id));
const filterDate = () => todayISO(new Date(Date.now() + (state.view === 'uscite' ? state.homeDay || 0 : state.dayOffset) * 864e5));
const groupMembers = (id) => activeCatalog().filter(s => s.group === id);
const groupSelection = (id) => {
  const selection=activeIds(),members = groupMembers(id), n = members.filter(s => selection === null || selection.has(s.id)).length;
  return n === members.length ? 'full' : n ? 'partial' : 'none';
};
function toggleGroup(id) {
  let selection=activeIds();const members = groupMembers(id);
  if (selection === null) selection = new Set(members.map(s => s.id));
  else {
    const remove = members.every(s => selection.has(s.id));
    members.forEach(s => remove ? selection.delete(s.id) : selection.add(s.id));
    if (!selection.size) selection = null;
  }
  setActiveIds(selection);
}
function addSpecies(id) {
  let selection=activeIds();
  if (!activeCatalog().some(s => s.id === id)) return;
  if (selection === null) selection = new Set();
  selection.add(id);setActiveIds(selection);
}
const outOfSeason = (id) => { const members = groupMembers(id); return members.length && members.every(s => seasonStatus(s, filterDate()) === 'out'); };

let zones, weatherZones, origin, habitat, access, trails, traits, legal, series, results, map, zoneLayers = {}, zoneMedia = {}, outing = null;
let baseMarker=null;
function zoneTrip(z,walk=null) {
  const a=access?.[z.id]?.[0],target=customBase()&&walk?.h ? walk.h : a||z.parking?.[0]||z;
  return travelTo(target,{minutes:a?.minutes??z.drive_min,km:a?.km??z.drive_km});
}
const compactTravel=t=>Number.isFinite(t.minutes)?`${t.minutes}<span class="fk2"> min</span><span class="fk3">′</span>`:`${fmtKm(t.airKm)} km <abbr title="In linea d’aria" aria-label="in linea d’aria">l.d.</abbr>`;
function proximityMultiplier(z) {
  const t=zoneTrip(z),distance=customBase()?(t.km??t.airKm)/100:(t.minutes??0)/120;
  return 1-0.3*Math.min(1,distance);
}
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
  let snapshot=null;
  const complete=s=>s?.schemaVersion===1&&s.resources&&['zones','habitat','species-traits','edible-catalog','guides','legal'].every(id=>s.resources[id]);
  if(!embedded&&!review){
    try{const res=await fetch('/api/content/v1/snapshot',{cache:'no-cache',signal:AbortSignal.timeout(7000)});if(res.ok){const s=await res.json();if(complete(s)){snapshot=s;try{localStorage.setItem('fungaroli:content:v1',JSON.stringify(s));}catch{/* optional public cache */}}}}catch{/* recover the last public release */}
    if(!snapshot)try{const s=JSON.parse(localStorage.getItem('fungaroli:content:v1')||'null');if(complete(s))snapshot=s;}catch{/* use bundled data */}
  }
  const load = (f) => snapshot?.resources?.[f] ? Promise.resolve(structuredClone(snapshot.resources[f])) : fetch(`data/${f}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  contentCopy = embedded?.contentCopy || await load('ui-copy') || {};
  initGuideContent(embedded?.guides || await load('guides'),contentCopy);
  for(const[selector,key]of [['#home-h','homeTitle'],['#others-h','otherPlacesTitle'],['#season-h','speciesTitle']])if(contentCopy[key]&&$(selector))$(selector).textContent=contentCopy[key];
  legal = embedded ? embedded.legal : await load('legal');
  const [zj, hj, aj, tj, idj, mj, ij, trj, stj, mtj, mzj, prj, thj, ecj] = embedded
    ? [embedded.zones, embedded.habitat, embedded.access, embedded.trails, embedded.speciesId, embedded.media, embedded.infographics, embedded.trees, embedded.traits, null, null, embedded.preparation, embedded.trailheads, embedded.edibleCatalog]
    : await Promise.all(['zones', 'habitat', 'access', 'trails', 'species-id', 'media', 'infografiche', 'trees', 'species-traits', 'media-trees', 'media-zones', 'preparation', 'trailheads', 'edible-catalog'].map(load));
  trailheads = thj?.zones || {};
  prep = prj;
  zoneMedia = mzj?.zones || {};
  if (mj && mtj?.trees) mj.trees = { ...(mj.trees || {}), ...mtj.trees };
  traits = stj;
  for(const sp of SPECIES){const t=stj?.taxa?.[sp.id];if(t){sp.name=t.name||sp.name;sp.latin=t.latin||sp.latin;sp.warning=t.caution||sp.warning;}}
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
  initBaseLocation(zj.origin);origin = currentBase();
  const updateTravel=()=>{origin=currentBase();if(series){compute();outCache.clear();renderAll();}renderFilterSummary();};
  document.addEventListener('fungaroli:base',updateTravel);
  document.addEventListener('fungaroli:travel',updateTravel);
  habitat = hj.zones;
  renderGuideCards($('#editorial'));
  initCommunity({ zoneList: zones, speciesList: catalog });
  renderCommunityIntro();
  document.addEventListener('fungaroli:community', () => { renderCommunityIntro(); if (results) paintWeatherView(); });
  initIdentify({
    traits: stj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, thumb, zones, banner: legal?.identify_banner,
    howTo: (eid, latin) => idj?.species?.[eid]?.lookalikes?.find((l) => l.latin === latin)?.how_to_tell || '',
    potential: (sid, zid) => { const sp = SPECIES.find((x) => x.id === sid); const z = zones.find((x) => x.id === zid); return sp && z ? potentialOf(sp, z) : null; },
  });
  renderSpeciesGrid();
  applyLegal();
  initTrees({ trees: trj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, zones, habitat, thumb });
  const plantData=embedded?.plants||await load('plants');plantModels=botanicalModels(embedded?.botanicalModels||await load('botanical-models'),plantData);
  if(state.plantIds!==null){state.plantIds=new Set([...state.plantIds].filter(id=>plantModels.some(p=>p.id===id)));if(!state.plantIds.size)state.plantIds=null;}
  initPlants(plantData,embedded?(f)=>embedded.assets?.[f]||'':(f)=>f,id=>plantModels.find(m=>m.plantId===id));
  initLearning({ glossary: embedded?.glossary || await load('glossary'), trees: trj,media:embedded?.glossaryMedia||await load('media-glossary'),assetUrl:embedded?(f)=>embedded.assets?.[f]||'':(f)=>f });
  if (embedded) challengeAsset = (f) => embedded.assets?.[f] || '';
  initChallenges({ data: embedded?.challenges || await load('challenges'), assetUrl: challengeAsset, entity: challengeEntity });
  initEntitySheets({ enhance: enhanceGlossary, render: (body, href) => {
    const [, kind, encodedId] = href.split('/'), id = decodeURIComponent(encodedId);
    if (kind === 'pianta' && plantName(id)) {renderPlantPage(body,id);enhanceDiscoverySheet(body,href);return plantName(id);}
    if (kind === 'albero' && trj.trees?.[id]) { renderTreePage(body, id);addNotebookReference(body,'albero',id,trj.trees[id].name);enhanceDiscoverySheet(body,href); return trj.trees[id].name; }
    if (kind === 'fungo' && taxonName(id)) { renderTaxonPage(body, id);addNotebookReference(body,'fungo',id,taxonName(id)); return taxonName(id); }
    const s = catalog.find(x => x.id === id);
    if (!s) return '';
    if (kind === 'specie' && SPECIES.some(x => x.id === id)) renderSpeciesDetail(body, id);
    else renderEdiblePage(id, body);
    addNotebookReference(body,kind,id,s.name);
    return s.name;
  }});
  // l'avviso nel riassunto di una sezione resta un avviso: toccarlo non apre la sezione (sembrerebbe un approfondimento del pericolo)
  document.addEventListener('click',e=>{if(e.target.closest('summary .plan-crit')&&!e.target.closest('a,button'))e.preventDefault();});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-species]'),p=b&&botanicalById(b.dataset.species);if(p){e.preventDefault();e.stopImmediatePropagation();openEntitySheet(p.href,b);}},true);
  renderTreeGrid($('#tree-grid'));
  treesData = trj; idData = idj;
  fillCatalogCounts();

  renderFilterSummary(); // ora che c'e' il pregio delle specie, riordina i filtri
  buildSearch(idj, trj, embedded);
  initMap();
  initShell();
  const notebookReferenceImage=href=>{
    if(typeof href!=='string')return null;
    const [,kind,encoded]=href.split('/');let id;try{id=decodeURIComponent(encoded||'');}catch{return null;}
    let image;
    if(kind==='zona')image=zoneMedia[id];
    else if(kind==='pianta')image=plantRecord(id)?.photos?.[0];
    else if(kind==='albero'){const m=mj.trees?.[id];image=m?.ref||m?.inat?.[0]||m?.commons?.[0];}
    else if(['specie','commestibile'].includes(kind))image=fungusPhoto(id);
    else if(kind==='fungo')image=searchTaxa().find(t=>t.key===id)?.photo;
    const file=image?.thumb||image?.file;return file?{file:assetSrc(file)}:null;
  };
  journal = initJournal({ onEntries:entries=>{botanicalNotes=entries.filter(e=>e.kind==='note'&&e.observation);if(series){compute();outCache.clear();if(weatherBusy)paintWeatherView();else renderAll();}},zones, speciesCatalog: catalog, predict, captureForecast, getZoneId: () => state.zoneId || zones[0].id, zoneImage:zid=>assetSrc(zoneMedia[zid]?.file||''),referenceImage:notebookReferenceImage });
  // preferenza personale (non un filtro): usare le fasi annotate nel taccuino per le cose da osservare
  const botanicalToggle = $('[data-botanical-personalize]');
  if (botanicalToggle) { botanicalToggle.checked = state.useBotanicalNotes; botanicalToggle.addEventListener('change', () => { state.useBotanicalNotes = botanicalToggle.checked; savePrefs(); if (series) { compute(); outCache.clear(); renderAll(); } }); }

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
  // la scheda della zona dipende solo dalla larghezza: la barra degli indirizzi che compare o sparisce (cambia l'altezza) non deve ridisegnarla
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(() => results && state.view === 'zona' && renderDetail(), 200); });
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

// Scopri: tre cataloghi più «Impara». Ogni catalogo ha «Sfoglia | Impara a riconoscere»;
// Impara raccoglie glossario, guide e i dettagli di bosco e sentiero.
const SCOPRI = [['funghi', '#/specie', 'Funghi'], ['piante', '#/piante', 'Piante e fiori'], ['alberi', '#/alberi', 'Alberi'], ['impara', '#/impara', 'Impara']];
const SCOPRI_SUB = {
  funghi: [['#/specie', 'Sfoglia'], ['#/riconosci', 'Impara a riconoscere']],
  piante: [['#/piante', 'Sfoglia'], ['#/riconosci/piante', 'Impara a riconoscere']],
  alberi: [['#/alberi', 'Sfoglia'], ['#/riconosci/alberi', 'Impara a riconoscere']],
  impara: [['#/glossario', 'Glossario'], ['#/guide', 'Guide'], ['#/riconosci/bosco', 'Bosco e sentiero'], ['#/sfide', 'Sfide']],
};
const RECOGNIZE_HEAD = {
  funghi: ['Funghi', 'Descrivi quello che vedi: le domande restringono il confronto e mostrano i sosia.'],
  piante: ['Piante e fiori', 'Cerca per caratteri: foglie, fiori, frutti e ambiente.'],
  alberi: ['Alberi', 'Foglie, corteccia e frutti: confronta i caratteri passo per passo.'],
  bosco: ['Bosco e sentiero', 'Tracce, segni e dettagli che incontri camminando.'],
};
function scopriPlace(r) {
  if (r.view === 'riconosci') return [r.recognizeMode === 'bosco' ? 'impara' : r.recognizeMode, r.recognizeMode === 'bosco' ? '#/riconosci/bosco' : SCOPRI_SUB[r.recognizeMode][1][0]];
  return { specie: ['funghi', '#/specie'], piante: ['piante', '#/piante'], alberi: ['alberi', '#/alberi'], impara: ['impara', '#/impara'], glossario: ['impara', '#/glossario'], 'guide-list': ['impara', '#/guide'], sfide: ['impara', '#/sfide'] }[r.view] || null;
}
function paintScopriNav(r) {
  const place = scopriPlace(r), view = document.querySelector(`.view[data-view="${r.view}"]`);
  if (!place || !view) return;
  const [sec, here] = place, cur = (on) => (on ? ' aria-current="page"' : '');
  const nav = view.querySelector('[data-scopri-nav]'), sub = view.querySelector('[data-scopri-sub]');
  if (nav) nav.innerHTML = SCOPRI.map(([id, href, label]) => `<a href="${href}" data-section="${id}"${cur(id === sec)}>${label}</a>`).join('');
  // la pagina indice di Impara mostra già le sue parti come card: sotto-schede solo nelle pagine interne
  if (sub) sub.innerHTML = r.view === 'impara' ? '' : SCOPRI_SUB[sec].map(([href, label]) => `<a href="${href}"${cur(href === here)}>${label}</a>`).join('');
}

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  const [a, b, c] = parts;
  if (a === 'zona' && (weatherZones||zones).some((z) => z.id === b)) return { view: 'zona', zoneId: b, offset: Math.max(0, Math.min(AHEAD_DAYS, +c || 0)), trailId: parts[3] === 'sentiero' && (trails[b]?.trails || []).some(t => String(t.id) === parts[4]) ? parts[4] : null };
  if (a === 'mappa') return { view: 'mappa', zoneId: b };
  if (a === 'specie' && b) return { view: 'specie-dettaglio', speciesId: b };
  if (a === 'specie' || a === 'scopri') return { view: 'specie' };
  if (a === 'impara') return { view: 'impara' };
  if (a === 'glossario') return { view: 'glossario', termId: b };
  if (a === 'albero' && b) return { view: 'albero', treeId: b };
  if (a === 'piante') return {view:'piante'};
  if (a === 'pianta' && b) return {view:'pianta',plantId:b};
  if (a === 'alberi') return { view: 'alberi' };
  if (a === 'riconosci') return { view: 'riconosci', recognizeMode: ['alberi','piante','bosco'].includes(b) ? b : 'funghi', compare: b === 'confronta' ? c : '', pick: b === 'confronta' ? parts[3] : '' };
  if (a === 'guide') return b ? { view: 'guide', guideId: b } : { view: 'guide-list' };
  if (a === 'sfide') return { view: 'sfide', challengeId: b || '' };
  if (a === 'diario') return { view: 'diario' };
  if (a === 'info') return { view: 'info' };
  if (a === 'metodo') return { view: 'metodo' };
  if (a === 'commestibile' && b) return { view: 'commestibile', speciesId: b };
  if (a === 'fungo' && b) return { view: 'fungo', taxonId: b };
  return { view: 'uscite' };
}

// profondita' e posizione delle viste: decidono la direzione della transizione
const LEVEL = { mappa: 1, pianta:1, commestibile: 1, guide: 2, zona: 1, 'specie-dettaglio': 1, albero: 1, info: 1, metodo: 2, fungo: 1, glossario: 1, 'guide-list': 1, sfide: 1 };
const TABS = ['uscite', 'specie', 'diario'];
const SUB = { specie: 0, alberi: 1, piante:2, riconosci: 3, glossario: 4, 'guide-list': 5, sfide: 6 };
// una sfida aperta è un livello sotto l'elenco delle sfide
const levelOf = (r) => (LEVEL[r.view] || 0) + (r.compare ? 2 : 0) + (r.challengeId ? 1 : 0) + (r.view === 'riconosci' && r.recognizeMode === 'bosco' ? 1 : 0);
const scrollMem = new Map();
let prev = null;
function navKind(a, b) {
  if (!a) return 'none';
  const la = levelOf(a), lb = levelOf(b);
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
const TITLES = { piante:'Piante e fiori', uscite: 'Uscite', mappa: 'Mappa', specie: 'Funghi', alberi: 'Alberi', riconosci: 'Riconosci', impara: 'Impara', glossario: 'Glossario', 'guide-list': 'Guide', sfide: 'Sfide', diario: 'Taccuino', info: 'Regole e metodo', metodo: 'Come funziona' };
function titleOf(r) {
  if (!r) return '';
  if (r.view === 'zona') { const z = (weatherZones||zones).find((x) => x.id === r.zoneId); return z ? splitName(z)[0] : 'Zona'; }
  if (r.view === 'specie-dettaglio') return SPECIES.find((x) => x.id === r.speciesId)?.name || 'Specie';
  if (r.view === 'commestibile') return catalog.find(s => s.id === r.speciesId)?.name || 'Specie';
  if (r.view === 'fungo') return taxonName(r.taxonId) || 'Specie';
  if (r.view === 'guide') return guideTitle(r.guideId);
  if (r.view === 'glossario' && r.termId) return glossaryTitle(r.termId);
  if (r.view === 'pianta') return plantName(r.plantId)||'Pianta';
  if (r.view === 'albero') return treesData?.trees?.[r.treeId]?.name || 'Albero';
  if (r.view === 'riconosci' && r.compare) return 'Confronto';
  if (r.view === 'sfide' && r.challengeId) return challengeTitle(r.challengeId) || 'Sfida';
  return TITLES[r.view] || '';
}
function parentOf(r) {
  if (!r) return '#/';
  if (r.view === 'specie-dettaglio' || r.view === 'fungo' || r.view === 'commestibile') return '#/specie';
  if (r.view === 'pianta') return '#/piante';
  if (r.view === 'albero') return '#/alberi';
  if (r.view === 'guide') return '#/guide';
  if (['glossario','guide-list','sfide'].includes(r.view) && !r.challengeId || r.view === 'riconosci' && r.recognizeMode === 'bosco') return '#/impara';
  if (r.view === 'riconosci' && r.compare) return '#/riconosci';
  if (r.view === 'sfide' && r.challengeId) return '#/sfide';
  if (['specie','alberi','piante','riconosci','glossario','guide-list','sfide'].includes(r.view)) return '#/scopri';
  return '#/';
}
const PARENT_TITLE = (r) => ({ '#/scopri': 'Scopri', '#/specie': 'Funghi', '#/alberi': 'Alberi', '#/piante':'Piante e fiori', '#/riconosci': 'Impara a riconoscere', '#/guide': 'Guide', '#/sfide': 'Sfide', '#/impara': 'Impara', '#/': 'Uscite' }[parentOf(r)]);
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
    if (nav === 'left' || nav === 'right' || navStack.length && navStack[navStack.length - 1].tab !== r.tab && !navStack[navStack.length - 1].level) navStack.length = 0; // cambio di scheda dalla radice di un'altra: si riparte
    // tra pagine sorelle dello stesso livello si sostituisce: «indietro» porta al genitore, non alla sorella
    if (nav === 'none' && navStack.length && levelOf(r) > 0) navStack.pop();
    navStack.push({ hash: r.hash, title: titleOf(r), tab: r.tab, level: levelOf(r) });
  }
  const deep = levelOf(r) > 0;
  // stesso «indietro» in due posti: nella barra su telefono, sopra il titolo della pagina su desktop (la barra tiene le sezioni)
  const back = navStack.length > 1 ? navStack[navStack.length - 2].title : PARENT_TITLE(r);
  for (const b of document.querySelectorAll('.appbar-back, .page-back')) {
    b.hidden = !deep;
    b.querySelector('span').textContent = back || 'Indietro';
    b.setAttribute('aria-label', `Indietro: ${back || 'pagina precedente'}`);
  }
  // il logo solo in home
  onScrollBar();
  const brand = $('.brand');
  if (brand) brand.hidden = r.view !== 'uscite';
}

function route() {
  // un ridisegno del meteo in sospeso (in home aspetta fino a 6 s) non deve cadere sulla pagina nuova: questa si disegna gia' con i dati aggiornati
  if (weatherPaintTimer) { clearTimeout(weatherPaintTimer.handle); weatherPaintTimer = null; }
  const r = parseRoute();
  r.tab = { mappa: 'uscite', impara: 'specie', piante:'specie', pianta:'specie', zona: 'uscite', glossario: 'specie', 'specie-dettaglio': 'specie', alberi: 'specie', albero: 'specie', riconosci: 'specie', info: '', metodo: '', guide: 'specie', 'guide-list': 'specie', sfide: 'specie', fungo: 'specie', commestibile: 'specie' }[r.view] ?? r.view;
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
  placeStale(r.view);
  if (r.view === 'specie-dettaglio') renderSpeciesDetail($('#species-detail'), r.speciesId);
  if (r.view === 'piante') renderPlants($('#plant-grid'));
  if (r.view === 'pianta') renderPlantPage($('#plant-detail'),r.plantId);
  if (r.view === 'albero') renderTreePage($('#tree-detail'), r.treeId);
  if (r.view === 'guide') renderGuide($('#guide-body'), r.guideId);
  if (r.view === 'metodo') renderMethod($('#method-body'));
  if (r.view === 'commestibile') { renderEdiblePage(r.speciesId); const s = catalog.find((x) => x.id === r.speciesId); if (s) addNotebookReference($('#edible-detail'), 'commestibile', s.id, s.name); }
  if (r.view === 'fungo') { renderTaxonPage($('#taxon-detail'), r.taxonId); if (taxonName(r.taxonId)) addNotebookReference($('#taxon-detail'), 'fungo', r.taxonId, taxonName(r.taxonId)); }
  if (r.view === 'glossario') renderGlossary($('#glossary'), r.termId);
  if (r.view === 'impara') renderLearnHub($('#learn-hub'));
  if (r.view === 'sfide') { if (r.challengeId) renderChallenge($('#challenges'), r.challengeId); else renderChallengeList($('#challenges')); }
  paintScopriNav(r);
  if (r.view === 'riconosci') {
    const rt = RECOGNIZE_HEAD[r.recognizeMode];
    $('[data-recognize-title]').textContent = rt[0]; $('[data-recognize-sub]').textContent = rt[1];
    $('#identify').hidden = r.recognizeMode !== 'funghi';
    $('#field-identify').hidden = r.recognizeMode === 'funghi';
    if(r.recognizeMode==='funghi') {setCompare(r.compare,r.pick);renderIdentify($('#identify'));}
    // piante e alberi: lo stesso percorso guidato dei funghi, una domanda alla volta
    else if(r.recognizeMode==='piante') renderGuidedKey($('#field-identify'),'piante',{items:plants().map(p=>({id:p.id,name:p.name,latin:cardLatin(p.latin),href:`#/pianta/${encodeURIComponent(p.id)}`,danger:p.category==='Pericolose'})),thumb:plantThumb});
    else if(r.recognizeMode==='alberi') renderGuidedKey($('#field-identify'),'alberi',{items:Object.entries(treesData?.trees||{}).map(([id,t])=>({id,name:t.name,latin:cardLatin(t.latin),href:`#/albero/${encodeURIComponent(id)}`})),thumb:treeThumb});
    else renderFieldIdentify($('#field-identify'));
  }
  const referenceBox=document.querySelector(`.view[data-view="${r.view}"]`);
  const noteRoute={'albero':['albero',r.treeId],'specie-dettaglio':['specie',r.speciesId],'fungo':['fungo',r.taxonId],'commestibile':['commestibile',r.speciesId],'guide':['guide',r.guideId]}[r.view];
  if(noteRoute)addNotebookReference(referenceBox.querySelector('.sp-page,#guide-body,#edible-detail')||referenceBox,noteRoute[0],noteRoute[1],titleOf(r));
  enhanceGlossary(referenceBox);
  const learningNav=document.querySelector(`.view[data-view="${r.view}"] .seg-nav`),selectedSection=learningNav?.querySelector('[aria-current="page"]');
  if(selectedSection) learningNav.scrollLeft=selectedSection.offsetLeft-(learningNav.clientWidth-selectedSection.offsetWidth)/2;
  if (r.view === 'mappa') {
    requestAnimationFrame(() => {
      map?.invalidateSize();
      const lb = $('.legend-box');
      // chiusa di default ovunque: la carta prima di tutto (si apre a mano o accendendo la Carta Forestale)
      if (lb && !lb.dataset.touched) lb.open = false;
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
const PREFS = [['avoidCrowd', 'Poca gente', 'Poca gente'], ['preferComfort', 'Accesso comodo', 'Comodo'], ['distancePenalty', 'Vicino alla base', 'Vicino']];
// ordine dei funghi: prima quelli in stagione adesso, poi per pregio; i primi CHIPS_SHOWN visibili, gli altri dietro "+ altri"
let fitN = 99; // quanti funghi entrano nella riga senza tagliare (ricalcolato sulla larghezza)
const QUALITY = { ottimo: 1, buono: 0.6 };
let chipsOpen = false;
function groupOrder() {
  // la stagione è quella del giorno che stai guardando (oggi, o il giorno scelto)
  const m = Number(filterDate().slice(5, 7)) - 1;
  const val = (g) => {
    const sp = (state.target==='piante'?plantModels:SPECIES).filter((x) => x.group === g.id);
    const season = Math.max(...sp.map((x) => x.months[m] || 0));
    const q = Math.max(...sp.map((x) => QUALITY[idData?.species?.[x.id]?.edibility] ?? 0.3));
    return (season >= 0.6 ? 2 : season >= 0.3 ? 1 : 0) + q;
  };
  return [...activeGroups()].sort((a, b) => val(b) - val(a));
}
// adatta il numero di funghi visibili alla larghezza: la riga si taglia solo se proprio non c'e' spazio
function fitChips(box) {
  const row = box.querySelector('.af-group-row') || box;
  const cs = getComputedStyle(row);
  const W = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
  if (W <= 0) return;
  const gap = parseFloat(cs.columnGap) || 8;
  const w = (el) => (el ? el.getBoundingClientRect().width + gap : 0);
  const fixed = w(row.querySelector('[data-g="all"]')) + (w(row.querySelector('[data-more]')) || 96);
  let used = fixed, n = 0;
  for (const el of row.querySelectorAll('.chip-g')) { if (used + w(el) > W) break; used += w(el); n++; }
  n = Math.max(1, n);
  if (n !== fitN) { fitN = n; renderFilterSummary(); }
}
let fitT2;
addEventListener('resize', () => { clearTimeout(fitT2); fitT2 = setTimeout(() => { fitN = 99; renderFilterSummary(); }, 150); });
function renderFilterSummary() {
  renderFilterBox($('#active-filters'));
  renderFilterBox($('#map-filters'), true);
}
function renderFilterBox(box, onMap = false) {
  if (!box) return;
  const all = activeIds()===null;
  const order = groupOrder();
  // in mappa la riga scorre di lato: tutti i funghi, senza "+ altri"
  const vis = chipsOpen || onMap ? order : order.filter((g, k) => k < fitN || (!all && groupSelection(g.id) !== 'none'));
  const hidden = order.length - vis.length;
  const bd = onMap && results ? bestOfDay(state.dayOffset) : null;
  const dayChip = bd ? `<button type="button" class="chip chip-day" data-days aria-expanded="${!!box.closest('.map-top')?.classList.contains('days-open')}" style="--dc:var(${scoreVar(bd.s)})"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/></svg><span>${esc(fmtDate(bd.d.date, { weekday: 'short' }).replace('.', ''))} ${esc(fmtDate(bd.d.date, { day: 'numeric' }))}</span><span class="chip-day-score"><i aria-hidden="true"></i><b class="pc">${formatIndex(bd.s)}</b></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>` : '';
  const groups = `<button type="button" class="chip" data-g="all" aria-pressed="${all}">Tutti</button>
    ${vis.map((g) => `<button type="button" class="chip chip-g" data-g="${g.id}" aria-pressed="${!all && groupSelection(g.id) !== 'none'}">${esc(g.label)}</button>`).join('')}
    <button type="button" class="chip chip-more" data-more aria-haspopup="dialog">Altri</button>`;
  const prefs = PREFS.map(([k, label, compact]) => `<button type="button" class="chip pref" data-p="${k}" aria-label="${esc(label)}" title="${esc(label)}" aria-pressed="${!!state[k]}">${onMap?esc(label):`<span class="pref-label-full">${esc(label)}</span><span class="pref-label-short" aria-hidden="true">${esc(compact)}</span>`}</button>`).join('');
  box.innerHTML = onMap ? `${dayChip}${groups}<span class="af-sep" aria-hidden="true"></span>${prefs}` : `<div class="af-group-row" role="group" aria-label="Funghi">${groups}</div><div class="af-pref-row" role="group" aria-label="Preferenze dell’uscita">${prefs}</div>`;
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
  box.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.g;
    if (id === 'all') setActiveIds(null);
    else toggleGroup(id);
    changed();
  }));
  box.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => soft(() => { state[b.dataset.p] = !state[b.dataset.p]; savePrefs(); renderFilterSummary(); renderAll(); })));
  // per ultimo: se la riga non ci sta, fitChips ridisegna i chip con i loro gestori; farlo prima agganciava due volte i gestori ai chip nuovi (un tocco accendeva e spegneva)
  if (!chipsOpen && !onMap) fitChips(box);
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
    const season = (s) => `<small class="season-badge ${seasonStatus(s,date)==='out'?'season-out':''}">${state.target==='piante'?({in:'Fase nel calendario',out:'Fuori calendario indicativo',unknown:'Calendario n.d.'})[seasonStatus(s,date)]:seasonLabel(s,date)}</small>`;
    const chip = (s) => `<button type="button" class="chip species-choice" data-catalog-id="${s.id}" aria-pressed="${activeIds() === null || activeIds().has(s.id)}"><span>${esc(s.name)}${s.toxicity==='commestibile con cautela'?'<small>Preparazione specifica</small>':''}</span>${season(s)}</button>`;
    // pannello in stile app: cerca, gruppi in stagione, il resto richiuso; preferenze come interruttori
    const groupChip = (g) => `<button type="button" class="chip" data-group="${g.id}" aria-pressed="${groupSelection(g.id)!=='none'}">${thumb(g.rep,32)}<span>${esc(g.label)}${g.id==='porcini'?' (4 specie)':''}</span>${outOfSeason(g.id)?`<small class="season-badge season-out">${state.target==='piante'?'Fuori calendario':'Fuori stagione'}</small>`:''}</button>`;
    const inSeason = activeGroups().filter((g) => !outOfSeason(g.id)), outSeason = activeGroups().filter((g) => outOfSeason(g.id));
    const sw = (on) => `<span class="switch" aria-hidden="true" data-on="${on}"><i></i></span>`;
    const dirty = activeIds() !== null || PREFS.some(([k]) => state[k]) || !state.showDiscoveries;
    dlg.innerHTML = `<div class="filter-panel-head"><h2 id="full-filters-title">Filtri</h2><div class="fp-head-actions">${dirty ? '<button type="button" class="fp-reset" data-reset>Azzera</button>' : ''}<button type="button" class="btn ghost" data-close>Chiudi</button></div></div>
      <div class="fp-body">
      <label class="species-search-label sr-only" for="species-filter-search">Aggiungi una specie</label>
      <input id="species-filter-search" class="wiz-input" type="search" placeholder="${state.target==='piante'?'Cerca e aggiungi: ortica, more, Arbutus…':'Cerca e aggiungi: pioppino, spugnola, Boletus…'}" role="combobox" aria-autocomplete="list" aria-controls="species-filter-options" aria-expanded="false" autocomplete="off">
      <ul id="species-filter-options" class="species-options" role="listbox" aria-label="Specie commestibili" hidden></ul>
      ${activeIds() !== null ? `<h3 class="fp-h">Scelte</h3><div class="filter-panel-groups selected-species" aria-label="Specie selezionate">${selected.map(s=>`<button type="button" class="chip" data-remove-species="${s.id}" aria-label="Rimuovi ${esc(s.name)}"><span>${esc(s.name)}</span>${season(s)}<span aria-hidden="true">×</span></button>`).join('')}</div>` : ''}
      <h3 class="fp-h">In stagione <small>${fmtDate(date,{day:'numeric',month:'long'})}</small></h3>
      <div class="filter-panel-groups" role="group" aria-label="Gruppi di specie">
        <button type="button" class="chip" data-all aria-pressed="${activeIds() === null}">${state.target==='piante'?'Tutte le piante':'Tutti i commestibili'}</button>
        ${inSeason.map(groupChip).join('')}
      </div>
      ${outSeason.length ? `<details class="fp-more"><summary>Fuori stagione <small>${outSeason.length}</small></summary><div class="filter-panel-groups" role="group" aria-label="Gruppi fuori stagione">${outSeason.map(groupChip).join('')}</div></details>` : ''}
      <details class="fp-more catalog-all"><summary>Tutte le specie <small>${activeCatalog().length}</small></summary><div class="filter-panel-groups">${[...activeCatalog()].sort((a,b)=>a.name.localeCompare(b.name,'it')).map(chip).join('')}</div></details>
      <h3 class="fp-h">Uscita</h3>
      <ul class="fp-switches">
        ${PREFS.map(([k,label])=>`<li><button type="button" class="fp-switch" data-pref="${k}" aria-pressed="${!!state[k]}">${esc(label)}${sw(!!state[k])}</button></li>`).join('')}
        <li><label class="fp-switch"><span>Piante e alberi lungo il giro<small>Si affiancano ai funghi, senza cambiare l'indice.</small></span><input type="checkbox" class="switch-input" data-discoveries-toggle ${state.showDiscoveries?'checked':''}></label></li>
      </ul>
      <p class="small muted fp-note">Stagione indicativa: cambia con clima e quota. Il catalogo non comprende ogni specie.</p>
      </div>
      <div class="fp-foot"><span class="small muted" aria-live="polite">${selected.length} specie · ${selected.filter(s=>s.modelId).length} con indice</span><button type="button" class="btn primary big" data-close>Mostra i risultati</button></div>`;
    dlg.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dlg.close()));
    const changed = (focus) => { savePrefs(); if (series) compute(); outCache.clear(); renderFilterSummary(); renderAll(); paint(); dlg.querySelector(focus)?.focus(); };
    mountSpeciesAutocomplete({ input: dlg.querySelector('#species-filter-search'), list: dlg.querySelector('#species-filter-options'), catalog:activeCatalog(), date,
      onSelect: s => { addSpecies(s.id); changed('#species-filter-search'); } });
    dlg.querySelector('[data-discoveries-toggle]')?.addEventListener('change',ev=>{state.showDiscoveries=ev.target.checked;changed('[data-discoveries-toggle]');});
    dlg.querySelector('[data-all]').onclick = () => { setActiveIds(null); changed('[data-all]'); };
    // azzera: tutte le specie, nessuna preferenza, scoperte visibili (i valori di partenza)
    dlg.querySelector('[data-reset]')?.addEventListener('click', () => { setActiveIds(null); for (const [k] of PREFS) state[k] = false; state.showDiscoveries = true; changed('[data-close]'); });
    dlg.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{toggleGroup(b.dataset.group); changed(`[data-group="${b.dataset.group}"]`);});
    dlg.querySelectorAll('[data-remove-species]').forEach(b=>b.onclick=()=>{activeIds().delete(b.dataset.removeSpecies); if (!activeIds().size) setActiveIds(null); changed('#species-filter-search');});
    dlg.querySelectorAll('[data-catalog-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.catalogId; if(activeIds()?.has(id)){activeIds().delete(id);if(!activeIds().size)setActiveIds(null);}else addSpecies(id);changed('#species-filter-search');});
    dlg.querySelectorAll('[data-pref]').forEach(b=>b.onclick=()=>{const k=b.dataset.pref;state[k]=!state[k];changed(`[data-pref="${k}"]`);});
  };
  dlg.onclose = () => $(state.view === 'mappa' ? '#map-filters [data-more]' : '#active-filters [data-more]')?.focus();
  paint(); dlg.showModal();
}

let weatherUnavailable=false;
function prepareCalendarFallback(){
 if(!weatherUnavailable||state.target!=='piante')return;
 const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
 weatherZones??=zones;zones=weatherZones;
 series=Object.fromEntries(zones.map(z=>[z.id,z.bands.map(()=>({dates,todayIndex:62,issuedIndex:62,source:{expired:true,calendarOnly:true},...Object.fromEntries(['p','tmean','tmin','tmax','soilm','soilt'].map(k=>[k,Array(70).fill(null)]))}))]));
 $('#stale').hidden=false;$('#stale').textContent='Meteo non disponibile: consigli botanici basati sul paesaggio e sul calendario della fase. Nessun contributo climatico.';
}
let weatherRevision=0,weatherController=null,weatherBusy=false,weatherPainting=false,deferredWeatherView=false;
let lastWeatherSnapshot=null,weatherPaintTimer=null;
const weatherPanelOpen=()=>!!document.querySelector('dialog[open],.learning-panel:popover-open');
// Stato del meteo, con le stesse parole ovunque: in home nella riga sotto il titolo,
// nelle altre viste nella pillola in basso (in home la pillola resta nascosta, vedi CSS).
const WX_BUSY='Sto aggiornando il meteo…',WX_DONE='Meteo aggiornato';
let weatherWorkTimer=null;
function weatherWork(text,busy=false,done=false){
  const box=$('#weather-work');if(!box)return;clearTimeout(weatherWorkTimer);
  box.hidden=!text;box.classList.toggle('busy',busy);box.classList.toggle('done',done);box.querySelector('.weather-work-label').textContent=text||'';
  if(done)weatherWorkTimer=setTimeout(()=>{box.hidden=true;box.classList.remove('done');},3000);
}
// meteo arrivato solo in parte: una nota sotto la riga del meteo, con «Riprova»
function partialWeatherNotice(missing){
  const body=missing?'Per alcune zone il meteo non è arrivato: per ora non le valutiamo.':'Alcuni dati non sono arrivati: per quelli usiamo l’ultimo meteo salvato.';
  // zone mancanti: la riga del meteo dice già quante e offre Riprova; qui non la copriamo
  if(missing)return;
  const box=$('#stale');box.hidden=false;box.textContent=`${body} `;
  const retry=document.createElement('button');retry.type='button';retry.className='link-btn';retry.textContent='Riprova';retry.onclick=()=>refreshWeather(true);box.append(retry);
}
// la nota sul meteo (vecchio, parziale) sta sotto la riga del meteo in home; nelle altre viste resta in cima
let staleHome=null;
function placeStale(view){
  const box=$('#stale'),line=document.querySelector('.view[data-view="uscite"] .view-sub');if(!box||!line)return;
  staleHome??={parent:box.parentElement,next:box.nextSibling};
  if(view==='uscite'){if(box.previousElementSibling!==line)line.after(box);}
  else if(box.parentElement!==staleHome.parent)staleHome.parent.insertBefore(box,staleHome.next);
}
let stampTimer=null;
function weatherStamp(w,busy=weatherBusy,done=false){
  clearTimeout(stampTimer);if(done)stampTimer=setTimeout(()=>weatherStamp(w,false,false),4000);
  if(!w||!Number.isFinite(w.fetchedAt?.getTime()))return;
  const sameDay=todayISO(w.fetchedAt)===todayISO();
  const when=w.fetchedAt.toLocaleString('it-IT',sameDay?{hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  $('#updated').textContent=busy?WX_BUSY:`${done?WX_DONE:w.cached||w.offline?'Meteo salvato':'Meteo'} · ${when}`;
  $('#refresh').classList.toggle('is-done',!!done);
  $('#refresh').setAttribute('aria-busy',String(busy));
  $('#refresh').title='Meteo acquisito '+w.fetchedAt.toLocaleString('it-IT')+'. Tocca per aggiornarlo.';
  $('#stale').hidden=!w.stale&&!w.missingZones?.length;
  $('#stale').textContent=w.missingZones?.length?`Meteo disponibile per ${weatherZones.length-w.missingZones.length} ${weatherZones.length-w.missingZones.length===1?'zona':'zone'} su ${weatherZones.length}. Le altre non vengono valutate. `:busy?'Dati salvati; aggiornamento in corso.':'Dati meteo da aggiornare. Oltre 24 ore l’indice dei funghi non viene calcolato.';
  if(!$('#stale').hidden&&!busy){const retry=document.createElement('button');retry.type='button';retry.className='link-btn';retry.textContent='Riprova';retry.onclick=()=>refreshWeather(true);$('#stale').append(retry);}
}
function paintWeatherView(changed=new Set(zones.map(z=>z.id))){
  if(!results)return;
  if(state.view==='zona'||state.view==='mappa'&&sheetZone){
    const selected=state.view==='zona'?state.zoneId:sheetZone;
    if(changed.has(selected)&&weatherPanelOpen()){deferredWeatherView=true;weatherWork('Meteo ricevuto. La scheda si aggiorna alla chiusura del pannello.');return;}
  }
  weatherPainting=true;
  try{
    if(state.view==='uscite'){renderDays();renderHome();}
    else if(state.view==='zona'&&changed.has(state.zoneId))keepWeatherReadingPosition(renderDetail);
    else if(state.view==='mappa'){
      renderMapDays();renderMap(changed);renderLegend();
      if(sheetZone&&changed.has(sheetZone))keepWeatherReadingPosition(()=>sheetPoint?openPoint(sheetZone,currentSheetPoint()):openSheet(sheetZone));
    }
  }finally{weatherPainting=false;}
}
function queueWeatherPaint(changed){
  if(!changed.size)return;
  const pending=weatherPaintTimer?.changed||new Set();changed.forEach(id=>pending.add(id));
  if(weatherPaintTimer){weatherPaintTimer.changed=pending;return;}
  // in home e nella scheda della zona, mentre arriva il meteo: un solo ridisegno a fine scarico (o dopo 6 s), non uno per zona
  const wait=weatherBusy&&['uscite','zona'].includes(state.view)?6000:100;
  const handle=setTimeout(()=>{const ids=weatherPaintTimer?.changed||pending;weatherPaintTimer=null;paintWeatherView(ids);},wait);
  weatherPaintTimer={handle,changed:pending};
}
function receiveWeather(w,meta={}){
  const changed=new Set();
  for(const [id,ss] of Object.entries(w.series))if(JSON.stringify(series?.[id])!==JSON.stringify(ss))changed.add(id);
  const first=!results;
  weatherUnavailable=false;series=w.series;zones=weatherZones.filter(z=>series[z.id]);lastWeatherSnapshot=w;
  document.documentElement.classList.toggle('is-offline',!!w.offline);
  weatherStamp(w);$('#today-kicker').textContent=new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
  if(changed.size){compute(first?null:changed);if(first&&(meta.phase!=='network'||!['uscite','zona'].includes(state.view)))paintWeatherView(changed);else queueWeatherPaint(changed);}
}
async function refreshWeather(force){
  const revision=++weatherRevision;weatherController?.abort();weatherController=new AbortController();const signal=weatherController.signal;
  weatherZones??=zones;weatherBusy=true;$('#refresh').setAttribute('aria-busy','true');
  if(lastWeatherSnapshot)weatherStamp(lastWeatherSnapshot,true);else $('#updated').textContent=WX_BUSY;
  weatherWork(WX_BUSY,true);loadStep(1);
  // il messaggio "Meteo aggiornato" serve se l'hai chiesto o se cambia dati gia' sullo schermo, non al primo avvio
  let announce=force||!!lastWeatherSnapshot;
  let received=false,mainFailure=null,latest=null,outingPartial=false;
  const growth=loadWeather(weatherZones,{force,signal,onProgress:(done,total)=>{
    if(revision!==weatherRevision)return;const step=$('.loader [data-step="1"]');if(step)step.textContent=`Scarico il meteo delle zone · ${done}/${total}`;
  },onUpdate:(w,meta)=>{if(revision!==weatherRevision)return;received||=meta.phase==='network';if(meta.phase!=='network')announce=true;receiveWeather(w,meta);}}).then(w=>{if(revision===weatherRevision){latest=w;receiveWeather(w);}}).catch(err=>{mainFailure=err;});
  const practical=loadOuting(weatherZones,{force,signal,onUpdate:(data,meta)=>{
    if(revision!==weatherRevision)return;
    const changed=new Set(Object.keys(data).filter(id=>JSON.stringify(outing?.[id])!==JSON.stringify(data[id])));
    received||=meta.phase==='network';outing=data;
    for(const id of changed)for(const k of outCache.keys())if(k.startsWith(id+'|'))outCache.delete(k);
    if(results)queueWeatherPaint(changed);
  }}).then(data=>{if(revision!==weatherRevision)return;const changed=new Set(Object.keys(data||{}).filter(id=>JSON.stringify(outing?.[id])!==JSON.stringify(data[id])));outing=data;for(const id of changed)for(const k of outCache.keys())if(k.startsWith(id+'|'))outCache.delete(k);if(results)queueWeatherPaint(changed);outingPartial=weatherZones.some(z=>!data?.[z.id]||Date.now()-Date.parse(data[z.id].fetchedAt)>=3600000);});
  await Promise.allSettled([growth,practical]);if(revision!==weatherRevision)return;
  weatherBusy=false;$('#refresh').setAttribute('aria-busy','false');loadStep(2);
  if(weatherPaintTimer){clearTimeout(weatherPaintTimer.handle);const changed=weatherPaintTimer.changed;weatherPaintTimer=null;paintWeatherView(changed);}
  if(latest||lastWeatherSnapshot){
    const partial=latest?.stale||latest?.missingZones?.length||latest?.failedZones?.length||mainFailure||outingPartial;
    const done=!partial&&received&&announce;
    weatherStamp(latest||lastWeatherSnapshot,false,done);
    if(partial){$('#updated').textContent+=' · in parte';}
    if(!deferredWeatherView)weatherWork(done?WX_DONE:'',false,done);
    if(partial)partialWeatherNotice(latest?.missingZones?.length);
  }else{
    weatherWork('');$('#updated').textContent='';weatherUnavailable=true;prepareCalendarFallback();
    if(state.target==='piante'){compute();renderAll();return;}
    const msg=`<div class="error">${esc(weatherErrorMessage(mainFailure))} <button type="button" class="link-btn" data-retry>Riprova</button>.</div>`;
    $('#hero').innerHTML=msg;$('#detail').innerHTML=msg;document.querySelectorAll('[data-retry]').forEach(b=>b.addEventListener('click',()=>refreshWeather(true)));
  }
}
document.addEventListener('close',()=>{if(deferredWeatherView&&!weatherPanelOpen()){deferredWeatherView=false;paintWeatherView();weatherWork(weatherBusy?WX_BUSY:'',weatherBusy);}},{capture:true});
document.addEventListener('toggle',e=>{if(e.newState==='closed'&&deferredWeatherView&&!weatherPanelOpen()){deferredWeatherView=false;paintWeatherView();weatherWork(weatherBusy?WX_BUSY:'',weatherBusy);}},{capture:true});

const selectedSpecies = () => { const ids = new Set(selectedCatalog().map(s=>s.modelId).filter(Boolean)); return (state.target==='piante'?plantModels:SPECIES).filter(s=>ids.has(s.id)); };

// meteo della mattina dell'uscita per zona e giorno (null finche' le previsioni orarie non arrivano)
const outCache = new Map();
function wxOf(z, d) {
  if (!d) return null;
  const k = z.id + '|' + d.date;
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
// l'icona mostra il problema principale, nello stesso ordine di gravità del testo: mai il sole con vento forte o nebbia
const wxIcon = (w) => (!w?.available ? 'unknown' : w.thunder ? 'storm' : w.snow ? 'snow' : (w.rain >= 0.5 || w.prob >= 50) ? 'rain' : w.gust >= 40 ? 'wind' : w.fog ? 'fog' : w.prob >= 20 ? 'cloud' : 'sun');
// indice con il pallino del suo colore: lo stesso segno ovunque compare un indice
const idxDot = (sc) => `<span class="idx-dot" title="${esc(scoreLabel(sc))}"><i aria-hidden="true" style="background:var(${scoreVar(sc).replace('--s', '--ps')})"></i><b class="pc">${formatIndex(sc)}</b></span>`;

function compute(changed=null) {
  const sp = selectedSpecies();
  if(!changed)results={};else results ||= {};
  for(const id of Object.keys(results))if(!zones.some(z=>z.id===id))delete results[id];
  for (const z of zones) {
    if(changed&&!changed.has(z.id)&&results[z.id])continue;
    const sb = series[z.id];
    const t = sb[0].todayIndex;
    const days = [];
    if (t < 0) { results[z.id] = { todayIndex: t, days }; continue; }
    for (let i = Math.max(30, t - HISTORY_DAYS); i <= t + AHEAD_DAYS && i < sb[0].dates.length; i++) {
      const r = scoreZoneDay(z, habitat[z.id], sb, sp, i,{zoneId:z.id,observations:state.useBotanicalNotes?botanicalNotes:[]});
      // Indice della zona: il migliore delle specie selezionate, senza bonus dal numero di taxa.
      days.push({ i, date: sb[0].dates[i], ...r, score: combine(r.perSpecies.map((p) => p.score)) });
    }
    // fattore umano: accesso, comodita' e affollamento per ogni giorno
    const acc0 = access[z.id]?.[0];
    days.forEach((d, k) => {
      if (!d.best) return;
      d.access = accessFor(z, d.best.species, d.best.band);
      const referenceComfort = comfortScore({
        driveMin: acc0?.minutes ?? z.drive_min,
        walkM: d.access?.walkM ?? 800,
        surface: d.access?.surface ?? 0,
        unpavedKm: (acc0?.unpaved_tail_km ?? 0) + (acc0?.unpaved_other_km ?? 0),
      });
      const trip=zoneTrip(z);
      d.comfort=customBase() ? Number.isFinite(trip.minutes) ? comfortScore({driveMin:trip.minutes,walkM:d.access?.walkM??800,surface:d.access?.surface??0,unpavedKm:0}) : null : referenceComfort;
      const bi = bandIndex(z, d.best.band);
      d.crowd = crowding({
        dateStr: d.date, popularity: z.popularity ?? 0.5, comfort: referenceComfort.value,
        scores: state.target==='funghi'?days.slice(Math.max(0, k - 6), k + 1).map((x) => x.score):[],
        rainMm: state.target==='funghi'?(sb[bi].p[d.i]??0):0,
      });
    });
    results[z.id] = { todayIndex: t, days };
  }
}

const dayEntry = (zid, offset) => {
  const r = results?.[zid];
  return r?.days.find((d) => d.i === r.todayIndex + offset);
};
// indice "opportunita'": l'indice di fruttificazione corretto con le preferenze attive
// le stesse correzioni di adjusted(), una per una, per spiegarle
let prep = null, trailheads = {}, treesData = null, idData = null;
function prepGeneralHtml(rules) {
  const ord = [...rules].sort((a, b) => (a.level === 'obbligatorio' ? 0 : 1) - (b.level === 'obbligatorio' ? 0 : 1));
  return `<details class="prep-gen"><summary><h2>Prepararli e conservarli: le regole per tutti</h2></summary>
    <ol class="k-steps">${ord.map((r) => `<li class="${r.level === 'obbligatorio' ? 'must' : 'tip'}"><b>${esc(r.title)}</b> ${esc(r.text)}${r.why ? `<small>${esc(r.why)}</small>` : ''}<span class="k-src">${r.level === 'obbligatorio' ? '<span class="k-lv">indicazione di sicurezza</span>' : '<span class="k-lv tip">prudenziale</span>'}${r.sources?.length ? `<details class="k-src-d"><summary>Fonti (${r.sources.length})</summary>${sourceRows(r.sources)}</details>` : ''}</span></li>`).join('')}</ol>
  </details>`;
}
const adjParts = (zone, d) => {
  const out = [];
  if (state.distancePenalty) out.push({ label: 'vicino alla base', mult: proximityMultiplier(zone) });
  if (state.avoidCrowd && d?.crowd) out.push({ label: 'poca gente', mult: 1 - 0.45 * d.crowd.value });
  if (state.preferComfort && d?.comfort) out.push({ label: 'accesso comodo', mult: 0.55 + 0.45 * d.comfort.value });
  return out;
};
const preferenceRank = (zone, score, d) => {
  let v = score;
  if (state.distancePenalty) v *= proximityMultiplier(zone);
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
  if(state.target==='piante')return null; // coarse land cover cannot localise plant presence
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
function sampleFits(sp,e,cat,band){
 const plant=sp?.kind==='plant',range=plant?sp.elevationRange:sp?.elev;
 return sp?.forest&&(sp.forest[cat]||0)>=(plant?.2:.6)&&(!range||e>=range[0]-(plant?300:0)&&e<=range[1]+(plant?300:0))&&Math.abs(e-band)<=250;
}
function trailsFor(z, sp, band) {
  const tz = trails[z.id];
  if (!tz) return [];
  return tz.trails.map((t) => {
    let n = 0, lo = Infinity, hi = -Infinity;
    const cats = {};
    for (const [e, c] of t.samples) {
      const cat = c >= 0 ? tz.sample_categories[c] : 'non bosco';
      if(!sampleFits(sp,e,cat,band))continue;
      n++; lo = Math.min(lo, e); hi = Math.max(hi, e);
      cats[cat] = (cats[cat] || 0) + 1;
    }
    const mainCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    // i lunghi itinerari (E1, Sentiero Italia, cammini) ricalcano i sentieri CAI: precedenza ai locali
    const long = ['INT', 'NAT', 'REG'].includes(t.group);
    return { ...t, goodKm: n / 10, lo, hi, mainCat, long, rank: (n / 10) * (long ? 0.7 : 1) };
  }).filter((t) => t.goodKm >= 0.3).sort((a, b) => b.rank - a.rank);
}

function renderSpeciesGrid() {
  const box = $('#species-grid');
  if (!box) return;
  box.dataset.glossaryContext='Funghi';
  if (!box.querySelector('[data-catalog-search]')) {
    // ricerca contestuale: il campo filtra i funghi, «Anche in…» rimanda al resto dell'app
    box.innerHTML = `${searchFieldHtml('Cerca un fungo', 'Porcino, Amanita, nome dialettale…')}
      <div class="recognize-modes" role="group" aria-label="Quali funghi mostrare">${[['', 'Tutti'], ['edible', 'Commestibili'], ['other', 'Velenosi e sosia']].map(([v, l]) => `<button type="button" class="btn ghost small" data-fungi-group="${v}" aria-pressed="${(state.fungiGroup || '') === v}">${l}</button>`).join('')}</div>
      <p class="small muted" data-fungi-count role="status"></p><div class="card-grid" id="sp-cards"></div><div data-also-slot></div>`;
    const input = box.querySelector('[data-catalog-search]');
    input.value = state.fungiQuery || '';
    input.addEventListener('input', () => { state.fungiQuery = input.value; fillSpecies(); });
    box.querySelectorAll('[data-fungi-group]').forEach((b) => b.addEventListener('click', () => {
      state.fungiGroup = b.dataset.fungiGroup;
      box.querySelectorAll('[data-fungi-group]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      fillSpecies();
    }));
  }
  fillSpecies();
}
const assetSrc=f=>globalThis.FUNGAROLI_DATA?globalThis.FUNGAROLI_DATA.assets?.[f]||'':f;
const catalogPhoto = s=>speciesPhoto(s.modelId||s.id)||searchTaxa().find(t=>t.key===s.id)?.photo||fungusPhotos(s.id)[0];
// In cima a ogni sezione di Scopri: quante schede ci sono (dagli stessi dati che riempiono la pagina, anche se arrivano dal CMS)
function fillCatalogCounts() {
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const counts = {
    specie: `${catalog.length} commestibili · ${otherFungi().length} velenosi e sosia`,
    alberi: n(Object.keys(treesData?.trees || {}).length, 'albero in catalogo', 'alberi in catalogo'),
    piante: n(plants().length, 'pianta in catalogo', 'piante in catalogo'),
    glossario: n(glossaryTerms().length, 'voce', 'voci'),
    guide: n(guideCount(), 'guida', 'guide'),
    sfide: n(challengeList().length, 'sfida', 'sfide'),
  };
  document.querySelectorAll('[data-catalog-count]').forEach((el) => {
    const text = counts[el.dataset.catalogCount], k = parseInt(text, 10);
    el.hidden = !k; el.textContent = k ? text : '';
  });
}
// Impara: pagina indice a card, al primo livello. Ogni card porta a una sezione con il suo «indietro».
const LEARN_IC = {
  glossario: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 16h5"/>',
  guide: '<path d="M12 6C9 4 6 4 4 5v14c2-1 5-1 8 1 3-2 6-2 8-1V5c-2-1-5-1-8 1z"/><path d="M12 6v14"/>',
  bosco: '<path d="M12 3 6 12h3l-4 6h14l-4-6h3z"/><path d="M12 18v3"/>',
  sfide: '<circle cx="12" cy="10" r="6"/><path d="m9.5 10 1.8 1.8L15 8.2M8.5 15.5 7 21l5-2.5 5 2.5-1.5-5.5"/>',
  metodo: '<path d="M4 19V5M4 19h16"/><path d="m7 15 4-5 3 3 5-7"/>',
  info: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v5M12 16h.01"/>',
};
function renderLearnHub(box) {
  if (!box) return;
  const n = (k, one, many) => (k ? `${k} ${k === 1 ? one : many}` : '');
  const list = challengeList(), done = list.filter((c) => challengeProgressOf(c.id)?.complete).length;
  const cards = [
    ['glossario', '#/glossario', 'Glossario', 'Le parole di funghi, alberi e sentieri, con disegni e foto.', n(glossaryTerms().length, 'voce', 'voci')],
    ['guide', '#/guide', 'Guide', 'Piccole letture sul bosco e sulla passeggiata.', n(guideCount(), 'guida', 'guide')],
    ['bosco', '#/riconosci/bosco', 'Bosco e sentiero', 'Tracce, segni e dettagli che incontri camminando.', ''],
    ['sfide', '#/sfide', 'Sfide', 'Osserva, confronta e raccogli i timbri.', list.length ? `${done} di ${list.length} timbri` : ''],
    ['info', '#/info', 'Regole e sicurezza', 'Raccolta nel Lazio, ispettorato, cosa fare se stai male.', ''],
    ['metodo', '#/metodo', 'Come funziona l’indice', 'Dati, formule e limiti, per chi vuole approfondire.', ''],
  ];
  box.innerHTML = `<ul class="learn-cards">${cards.map(([id, href, t, sub, meta], i) => `<li class="${i < 2 ? 'lc-big' : ''}"><a class="learn-card" href="${href}" data-learn="${id}"><span class="lc-ic" aria-hidden="true"><svg viewBox="0 0 24 24">${LEARN_IC[id]}</svg></span><span class="lc-t">${t}</span><span class="lc-s">${sub}</span>${meta ? `<span class="lc-m">${meta}</span>` : ''}</a></li>`).join('')}</ul>`;
}
// velenosi e sosia di Riconosci che non sono gia' nel catalogo dei commestibili, con la loro etichetta di rischio
const TOX_LABEL = { mortale: 'Mortale', tossico: 'Tossico', 'non commestibile': 'Non commestibile' };
const otherFungi = () => searchTaxa().filter((t) => TOX_LABEL[t.toxicity] && !catalog.some((c) => c.id === t.key));
function fillSpecies() {
  const group = state.fungiGroup || '';
  const q = state.fungiQuery || '';
  const edible = group === 'other' ? [] : catalog.filter((s) => matchesQuery([s.name, s.latin, ...(s.aliases || [])], q));
  const others = group === 'edible' ? [] : otherFungi().filter((t) => matchesQuery([t.name, t.latin, ...(t.look || [])], q));
  const card = (href, name, latin, ph, badge = '') => `<a class="sp-card" href="${href}" aria-label="${esc(name)}">
      ${ph ? `<img data-src="${assetSrc(ph.file)}" alt="" loading="lazy" decoding="async">` : `<span class="catalog-placeholder" aria-hidden="true">${esc(name.slice(0,2))}</span>`}<span class="shade"></span>${badge}
      <span class="sp-card-body"><b>${esc(name)}</b><i>${esc(cardLatin(latin))}</i></span></a>`;
  $('#sp-cards').innerHTML = [
    ...edible.map((s) => card(s.href, s.name, s.latin, catalogPhoto(s))),
    ...others.map((t) => card(`#/fungo/${encodeURIComponent(t.key)}`, t.name || t.latin, t.latin, t.photo, `<span class="sp-card-tox tox-${esc(t.toxicity.replace(/\s/g, '-'))}">${TOX_LABEL[t.toxicity]}</span>`)),
  ].join('') || `<p class="muted empty-note">${q.trim() ? `Nessun fungo corrisponde a «${esc(q.trim())}».` : 'Nessuna specie in questo gruppo.'}</p>`;
  const total = edible.length + others.length, all = catalog.length + otherFungi().length;
  $('[data-fungi-count]').textContent = q.trim() || group ? `${total} ${total === 1 ? 'scheda' : 'schede'} su ${all}` : '';
  renderAlsoIn($('#species-grid [data-also-slot]'), q, ['fungo', 'velenoso']);
}

function renderEdiblePage(id, box=$('#edible-detail')) {
  const s = catalog.find(x=>x.id===id);
  if (!s) { box.dataset.glossaryContext='Funghi'; box.innerHTML='<p>Specie non presente nel catalogo.</p>';return; }
  // stessa pagina dei taxon di Riconosci: le sezioni senza dati non compaiono
  const extra = `<p class="small muted">Stagione indicativa da manualistica, non validata nel Reatino: clima e quota possono spostarla.</p>
    <h3>Le osservazioni aiutano a conoscerla</h3><p>L’indice di crescita non è ancora disponibile per questa specie. Puoi annotare ritrovamenti e ricerche a vuoto nel taccuino e scegliere di condividerli.</p><button class="btn primary" type="button" data-report data-species="${esc(s.id)}">Segnala un'osservazione</button>
    <p class="small muted">Commestibilità della specie, non dell’esemplare: foto e schede non confermano l’identità. Il controllo del raccolto e le indicazioni di preparazione spettano all’Ispettorato micologico ASL.</p>`;
  // se la scheda breve ha gia' i caratteri completi (taxon con lo stesso id) usa quelli
  const full = taxonByKey(s.id);
  renderTaxonView(box, full ? { ...full, sources: s.sources?.length ? s.sources : full.sources } : { key: s.id, name: s.name, latin: s.latin, toxicity: s.toxicity, caution: s.caution, sources: s.sources, traits: s.months?.length ? { season: s.months } : {} },
    { photos: fungusPhotos(id), habitatText: s.habitat || '', extra });
}

function renderAll() {
  if (!results) return;
  if (state.view === 'uscite') { renderDays(); renderHome(); }
  if (state.view === 'zona') renderDetail();
  if (state.view === 'mappa') { renderMapDays(); renderFilterBox($('#map-filters'), true); renderMap(); renderLegend(); if (sheetZone) sheetPoint?openPoint(sheetZone,currentSheetPoint()):openSheet(sheetZone); }
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
  const previous=weatherPainting?box:null,railScroll=box.scrollLeft;
  if(previous)box=document.createElement('div');
  box.innerHTML = '';
  const mk = (top, mid, o, sc) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.dayOffset=String(o);
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
  if(previous){reconcileChildren(previous,box);previous.scrollLeft=railScroll;}
  else box.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
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
const walkBrief = w => {
  if (!w) return 'Sentieri da verificare';
  const ref=w.t.ref && `Sentiero ${w.t.ref}`;
  const repeated=ref && w.microzone?.toLocaleLowerCase('it').includes(ref.toLocaleLowerCase('it'));
  return [repeated ? '' : ref || trailName(w.t),w.t.difficulty || 'difficoltà n.d.',`${fmtKm(w.t.in_zone_km)} km nella zona`].filter(Boolean).join(' · ');
};

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
  const img = (src) => (src ? `<img class="thumb" data-src="${src}" width="44" height="44" alt="" loading="lazy" decoding="async">` : '');
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
  for(const p of plants())items.push({kind:'pianta',title:p.name,sub:p.latin,hay:[...p.aliases,...p.recognize].join(' '),href:`#/pianta/${p.id}`,img:plantThumb(p.id)});
  for (const t of glossaryTerms()) items.push({kind:'termine',title:t.term,sub:t.category,hay:[...t.aliases,t.definition,t.observe].join(' '),href:`#/glossario/${t.id}`});
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
    ['Impara a riconoscere i funghi', 'Descrivi quello che vedi, anche se è velenoso', 'identificare trovato velenoso sosia caratteri lamelle pori volva anello sporata', '#/riconosci'],
    ['Emergenza e intossicazione', 'Cosa fare, chi chiamare', 'emergenza intossicazione avvelenamento centro antiveleni 118 112 pronto soccorso sintomi', '#/info'],
    ['Regole di raccolta nel Lazio', 'Attestato, contributo, limiti, orari', 'regole legge tesserino attestato contributo 3 kg limite orari divieti parchi aree protette', '#/info'],
    ['Controllo gratuito all\'ASL', 'Ispettorato micologico', 'asl ispettorato micologico controllo gratuito micologo', '#/info'],
    ['Come funziona l\'indice', 'Formule, parametri, fonti e limiti', 'metodo scienza scientifico indice calcolo formula pioggia temperatura suolo latenza innesco probabilita affidabilita fonti letteratura euristica', '#/metodo'],
    ['Glossario del bosco', 'Definizioni, caratteri e legenda delle difficoltà', 'impara glossario parole significato legenda', '#/glossario'],
    ['Impara a riconoscere gli alberi', 'Confronta foglie, corteccia e frutti', 'riconoscimento botanica foglia corteccia frutto gemme', '#/riconosci/alberi'],
    ['Piante e fiori','Caratteri, parti alimentari e sosia pericolosi','erbe bacche more ortica cicoria piante spontanee botanica','#/piante'],
    ['Gli alberi', 'Riconoscerli e cosa ci cresce sotto', 'alberi bosco piante', '#/alberi'],
    ['Prepararli e conservarli', 'Crudo, prebollitura, congelare, essiccare, sott\'olio', 'preparazione cucina cuocere cottura crudo prebollitura congelare surgelare essiccare seccare sottolio sott olio botulino conserve vasetti quantita bambini gravidanza alcol', '#/info'],
    ['Il mio taccuino', 'Annota ricerche, ritrovamenti e osservazioni', 'taccuino diario appunti uscite registrare raccolto storico esporta', '#/diario'],
    ['Guide del bosco', 'Alberi, piogge e preparazione della passeggiata', 'imparare guide passeggiate boschi editoriale', '#/guide'],
    ['La mappa', 'Zone, parcheggi, sentieri, Carta Forestale', 'mappa carta forestale parcheggio sosta', '#/mappa'],
    ['Installa l\'app', 'A tutto schermo e senza campo', 'installa app schermo home offline', '#/info'],
  ];
  for (const [title, sub, hay, href] of pages) items.push({ kind: 'pagina', title, sub, hay, href, img: '<span class="sr-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg></span>' });
  initSearch(items);
}

// la copertina scelta per un luogo e un giorno resta quella per tutta la sessione:
// il meteo che arriva dopo non deve cambiarla sotto gli occhi
const coverMemo = new Map();
function coverOf(z, spId, d) {
  // l'immagine del luogo segue stagione e meteo del giorno scelto (oggi, se non c'è un giorno)
  const date = d?.date || todayISO(), key = `${z.id}|${date}`, icon = d ? wxIcon(wxOf(z, d)) : 'sun';
  // finché il meteo dell'uscita non c'è, non si fissa niente: si usa la scelta provvisoria
  if (!coverMemo.has(key) && icon !== 'unknown') coverMemo.set(key, pickCover(zoneMedia[z.id], date, icon));
  const zm = coverMemo.get(key) || pickCover(zoneMedia[z.id], date, icon);
  if (zm) return { hd: zm.file_hd || zm.file, small: zm.file, credit: zm, alt: z.name };
  const p = speciesPhoto(spId);
  return p ? { hd: p.file_hd || p.file, small: p.file, credit: p, alt: '' } : null;
}
const ring = (s, big = true) => `<span class="ring${big ? '' : ' ring-sm'}" style="--c:var(${scoreVar(s).replace('--s', '--ps')});--p:${s ?? 0}" aria-label="Indice ${formatIndex(s)} su 10, ${scoreLabel(s)}">${big ? `<small class="ring-title">${state.target==='piante'?'Contesto':'Condizioni'}</small>` : ''}<b>${scoreText(s)}</b>${big ? `<small>${scoreShortLabel(s)}</small>` : ''}</span>`;
const IC = {
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v15M12 5C8 3 5 3 3 4v14c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-5-1-9 1Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
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
  wind: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/></svg>',
  fog: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 5.5 3.5 3.5 0 0 1 17.5 12z"/><path d="M4 16h16M6 20h12"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1 .5-9A6 6 0 0 1 19 10a4 4 0 0 1-.5 8z"/></svg>',
  snow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 7.5 3.5 3.5 0 0 1 17.5 14z"/><path d="M9 18h.01M12 20h.01M15 18h.01"/></svg>',
};
// affollamento in parole (il livello resta basso/medio/alto per i colori)
const CROWD = { basso: 'poca gente', medio: 'un po\' di gente', alto: 'molta gente' };
const crowdText = (c) => CROWD[c?.level] || '';
const fact = (ic, html) => `<span class="fact">${IC[ic]}${html}</span>`;
const creditLine = (m) => m ? `${m.generated ? `Stagione elaborata con AI dalla foto di ${esc(m.author || '')}` : `Foto: ${esc(m.author || '')}`}${m.license ? `, ${esc(m.license)}` : ''} · <a href="${esc(m.page)}" target="_blank" rel="noopener">${esc(m.source || 'fonte')}</a>` : '';

const discoveryItems=new Map();let openingDiscovery=null;
function discoveriesFor(z,d,walk){
 if(!state.showDiscoveries)return [];
 return outingDiscoveries({zone:z,zoneHabitat:habitat[z.id],trail:walk?.t,trailCategories:trails[z.id]?.sample_categories,seriesByBand:series?.[z.id],date:d?.date||todayISO(new Date(Date.now()+state.dayOffset*864e5)),models:plantModels,flora:plants(),trees:treesData?.trees,observations:state.useBotanicalNotes?botanicalNotes:[]});
}
function discoveriesHtml(z,d,walk,items=discoveriesFor(z,d,walk)){
 if(!items.length)return '';
 return `<p class="discovery-intro">Potresti incontrare anche queste specie. ${items[0].scope==='tracciato'?'Ambienti campionati sul tratto del sentiero':'Compatibilità con gli ambienti della zona'}: presenza da verificare.</p><ul class="discovery-grid">${items.map(item=>{
  const key=`${z.id}/${item.date}/${item.kind}/${item.id}`;discoveryItems.set(key,item);
  return `<li><a href="${esc(item.href)}" data-discovery="${esc(key)}" data-entity class="discovery-link">${item.kind==='pianta'?plantThumb(item.id,44):treeThumb(item.id,44)}<span><small>${item.kind==='albero'?'Albero':plantRecord(item.id)?.category||'Pianta'}</small><b>${esc(item.name)}</b><small>${esc(item.phase)}</small></span><span aria-hidden="true">›</span></a></li>`;
 }).join('')}</ul>${actRow('#/piante','leaf','Altre piante in Scopri','Erbe, fiori, frutti e arbusti')}`;
}
// Sfide: nome, foto e scheda di un albero, una pianta o un fungo (la scheda si apre nel pannello laterale).
function challengeEntity(kind,id){
 if(kind==='albero'){const t=treesData?.trees?.[id];return t?{name:t.name,latin:cardLatin(t.latin),href:`#/albero/${encodeURIComponent(id)}`,thumb:s=>treeThumb(id,s),photo:treePhotoSrc(id)}:null;}
 if(kind==='pianta'){const p=plantRecord(id);return p?{name:p.name,latin:cardLatin(p.latin),href:`#/pianta/${encodeURIComponent(id)}`,thumb:s=>plantThumb(id,s),photo:p.photos?.[0]?challengeAsset(p.photos[0].file):'',protected:p.category==='Fiori'}:null;}
 if(kind==='fungo'){
  const t=taxonByKey(id);if(!t)return null;
  const m=fungusPhotos(id)[0]||searchTaxa().find(x=>x.key===id)?.photo,href=catalog.find(x=>x.id===id)?.href||`#/fungo/${encodeURIComponent(id)}`;
  return {name:t.name||t.latin,latin:t.latin,href,photo:m?challengeAsset(m.file):''};
 }
 return null;
}
let challengeAsset=f=>f;
// In fondo a «Durante il giro»: una sola sfida non completata, adatta ai boschi principali della zona e al mese.
// Componenti da app: riga-azione (icona, titolo, sottotitolo, freccia) e pillola d'azione breve
const AR_IC={stamp:'<circle cx="12" cy="10" r="6"/><path d="m9.5 10 1.8 1.8L15 8.2M8.5 15.5 7 21l5-2.5 5 2.5-1.5-5.5"/>',rules:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',nav:'<path d="m3 11 18-8-8 18-2-8z"/>',pin:'<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',leaf:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19 13 11"/>',go:'<path d="M5 12h14M13 6l6 6-6 6"/>'};
const arIc=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${AR_IC[k]}</svg>`;
const actRow=(href,ic,t,sub='',ext=false)=>`<a class="act-row" href="${href}"${ext?' target="_blank" rel="noopener"':''}><span class="ar-ic">${arIc(ic)}</span><span class="ar-b"><span class="ar-t">${t}</span>${sub?`<span class="ar-s">${sub}</span>`:''}</span></a>`;
const actPill=(href,ic,t,ext=false)=>`<a class="act-pill" href="${href}"${ext?' target="_blank" rel="noopener"':''}>${arIc(ic)}<span>${t}</span></a>`;
function challengeHint(z,d){
 const date=d?.date||todayISO(new Date(Date.now()+state.dayOffset*864e5)),month=Number(String(date).slice(5,7));
 const ch=suggestedChallenge({forest:habitat?.[z.id]?.forest?.categorie_ha,month});
 return ch?actRow(`#/sfide/${encodeURIComponent(ch.id)}`,'stamp','Sfida per questo giro',esc(ch.title)):'';
}
function renderDiscoveries(box,z,d,walk){
 if(!box)return;const found=discoveriesHtml(z,d,walk),html=found&&found+challengeHint(z,d);box.hidden=!html;const markup=html?`<section class="outing-discoveries" aria-labelledby="during-walk-title"><h2 id="during-walk-title">Durante il giro</h2>${html}</section>`:'';if(weatherPainting)updateWeatherHTML(box,markup);else box.innerHTML=markup;
}
function discoverySection(z,d,walk){
 const items=discoveriesFor(z,d,walk);if(!items.length)return '';
 return section('scoperte',`<span class="discovery-summary"><b>Durante il giro</b><small>${items.map(i=>esc(i.name)).join(' · ')}</small></span>`,discoveriesHtml(z,d,walk,items));
}
function enhanceDiscoverySheet(body,href){
 const item=openingDiscovery;if(!item||item.href!==href)return;
 const container=body.querySelector('.pbody');if(!container)return;
 const context=document.createElement('aside');context.className='discovery-context';context.dataset.glossaryContext=item.kind==='pianta'?'Piante':'Alberi';
 context.innerHTML=`<p class="eyebrow">Durante il giro · ${esc(fmtDate(item.date,{day:'numeric',month:'long'}))}</p><p>${item.scope==='tracciato'?'Suggerimento dagli ambienti campionati sul tratto del sentiero':'Suggerimento dagli ambienti campionati nella zona'}. La compatibilità non dimostra la presenza della specie.</p>${item.model?`<details class="sec" name="plant-${item.id}"><summary>Perché potresti incontrarla qui</summary><div class="sec-body">${renderBotanicalWhy({r:item.r,sp:item.model})}</div></details>`:`<p class="small muted">${esc(item.mappingNote||item.phase)}</p>`}`;
 container.prepend(context);
 body.querySelectorAll('[data-note-kind]').forEach(b=>b.dataset.noteZone=item.zoneId);
}
document.addEventListener('click',e=>{
 const link=e.target.closest('a[data-discovery]');if(!link||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const item=discoveryItems.get(link.dataset.discovery);if(!item)return;
 openingDiscovery=item;try{if(openEntitySheet(item.href,link)){e.preventDefault();e.stopImmediatePropagation();}}finally{openingDiscovery=null;}
},true);

let homeProposalKeys=[];
function renderHome() {
  for(const el of document.querySelectorAll('#hero,#ranking,#season'))el.dataset.glossaryContext=state.target==='piante'?'Piante':'Funghi';
  let list = combosList();
  if(weatherPainting&&homeProposalKeys.length){
    const held=homeProposalKeys.map(k=>{const z=zones.find(z=>z.id===k.id),d=dayEntry(k.id,k.o);return z&&d?.best?{z,d,o:k.o,s:adjusted(z,d.score,d),walk:walkFor(z,d,k.trail)}:null;}).filter(Boolean);
    // Una proposta per zona e per sentiero, come combosList: se il meteo nuovo sposta
    // il giorno migliore di una zona già mostrata, resta la proposta già letta.
    const usedZones=new Set(held.map(c=>c.z.id)),usedTrails=new Set(held.map(c=>c.walk&&String(c.walk.t.id)).filter(Boolean));
    list=[...held,...list.filter(c=>!usedZones.has(c.z.id)&&!(c.walk&&usedTrails.has(String(c.walk.t.id))))];
  }
  homeProposalKeys=list.slice(0,8).map(c=>({id:c.z.id,o:c.o,trail:c.walk?.t.id}));
  const hero = list[0];
  const box = $('#hero');
  if (!hero) { $('#during-walk').hidden=true;$('#during-walk').innerHTML='';box.innerHTML = `<p class="notice">${selectedSpecies().length ? 'Le condizioni di crescita non sono calcolabili: mancano dati o meteo aggiornato.' : 'Per queste specie l’indice di crescita non è ancora disponibile. Puoi consultare le schede e contribuire con le osservazioni.'} Puoi comunque esplorare boschi e sentieri.</p><div class="explore-fallback">${zones.slice(0, 6).map((z) => `<a class="btn ghost" href="#/zona/${z.id}/${state.homeDay || 0}">${esc(z.title || z.name)}</a>`).join('')}</div>`; $('#ranking').innerHTML = ''; $('#others-h').hidden = true; renderSeason(); renderCommunityIntro(); return; }
  $('#others-h').hidden = false;
  const t = state.target==='funghi'&&hero.d.crowd ? timingAdvice({ dateStr: hero.d.date, lat: hero.z.lat, lon: hero.z.lon, crowd: hero.d.crowd }) : null;
  const a0 = access[hero.z.id]?.[0];
  const [title, sub] = splitName(hero.z);
  const cov = coverOf(hero.z, hero.d.best.species.id, hero.d);
  // le altre specie: testo con il pallino della classe, non pillole (non sono bottoni)
  const also = hero.d.perSpecies.slice(1, 3).map((p) => [p, spScore(hero.z, hero.d, p)]).filter(([, sc]) => sc >= 20)
    .map(([p, sc], k) => `<span class="sp-also">${k ? ' · ' : ''}${esc(p.species.name.split(' / ')[0].toLowerCase())} <span class="sp-also-score"><i aria-hidden="true" style="background:var(${scoreVar(sc).replace('--s', '--ps')})"></i><b class="pc">${formatIndex(sc)}</b></span></span>`);
  const w0 = wxOf(hero.z, hero.d);
  // il posto con l'indice piu' alto quel giorno, se il meteo della mattina l'ha fatto scendere: nota breve e cliccabile
  const g = list.filter((c) => c.o === hero.o).sort((a, b) => b.s - a.s)[0], wg = g && wxOf(g.z, g.d);
  const note = g && g.z.id !== hero.z.id && wg && wg.level !== 'ok'
    ? `<a class="cover-note" href="#/zona/${g.z.id}/${g.o}"><span>${wxi(wg)}<b>${esc(splitName(g.z)[0])}</b> <span class="pc-up">${formatIndex(g.s)}</span> ma ${esc(wg.short || wg.main)}</span><span aria-hidden="true">›</span></a>` : '';
  const heroHTML = `
    <div class="cover vtn" style="--vtn:cover">
      ${cov ? `<img class="cover-img" data-src="${cov.hd}" alt="${esc(cov.alt)}" fetchpriority="high">` : ''}
      <span class="shade"></span>
      <a class="cover-link" data-walk-zone="${hero.z.id}" href="${walkHref(hero.z, hero.o, hero.walk?.t)}" aria-label="${esc(title)}, ${esc(hero.walk?.microzone || sub)}, ${esc(dayLabel(hero.o, hero.d.date, true))}: i dettagli della passeggiata"></a>
      <span class="cover-top"><span class="pill glass">${esc(dayLabel(hero.o, hero.d.date, true))}</span>${ring(hero.s)}</span>
      <span class="cover-body">
        <span class="cover-title">${esc(title)}</span>${sub ? `<span class="cover-sub">${esc(sub)}</span>` : ''}
        ${hero.walk ? `<span class="cover-walk"><b>${esc(hero.walk.microzone)}</b><span>${esc(walkBrief(hero.walk))}</span></span>` : ''}
        <span class="cover-sp">${thumb(hero.d.best.species.id, 44)}<span><small>${hero.d.best.kind==='plant'?'Da osservare · '+esc(hero.d.best.phaseLabel)+' · indice sperimentale':'Da conoscere in questi boschi'}</small><span class="cover-sp-name"><b>${esc(hero.d.best.species.name)}</b>${Number.isFinite(hero.d.best.score) ? ` <span class="sp-also-score sp-main-score"><i aria-hidden="true" style="background:var(${scoreVar(hero.d.best.score).replace('--s', '--ps')})"></i><b class="pc">${formatIndex(hero.d.best.score)}</b></span>` : ''} ${reportBadge(hero.z.id, hero.d.best.species.id)}</span>
          <small>${intornoA(hero.d.best.band)} ${hero.d.best.band} m${also.length ? ` · anche ${also.join('')}` : ''}</small></span></span>
        <span class="facts" aria-label="L'uscita in breve">${t ? fact('clock', `<span class="fk">entro le </span><b>${fmtRough(t.arrive, 15, 'floor')}</b>`) : ''}${fact('car', `<span><b>${compactTravel(zoneTrip(hero.z,hero.walk))}</b></span>`)}${state.target==='funghi'&&hero.d.crowd ? fact('people', crowdText(hero.d.crowd)) : ''}${w0 ? `<span class="fact wx-${w0.level}" title="${esc(w0.text)}">${wxi(w0)}<span class="fx">${esc(w0.level === 'ok' ? w0.main : (w0.short || w0.main))}</span></span>` : ''}</span>
        ${note}
        <span class="cover-cta" aria-hidden="true">Vedi l’uscita <span>→</span></span>
      </span>
    </div>`;
  if(weatherPainting)updateWeatherHTML(box,heroHTML);else box.innerHTML=heroHTML;
  renderDiscoveries($('#during-walk'),hero.z,hero.d,hero.walk);
  const ol = $('#ranking');
  const rankingHTML = list.slice(1, 8).map((c) => {
    const cv = coverOf(c.z, c.d.best.species.id, c.d);
    return `<li data-weather-key="${c.z.id}|${c.o}" class="vtn" style="--vtn:t-${c.z.id}-${c.o}"><a class="tile" data-walk-zone="${c.z.id}" href="${walkHref(c.z, c.o, c.walk?.t)}">
      ${cv ? `<img data-src="${cv.small}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>${ring(c.s, false)}${(() => { const w = wxOf(c.z, c.d); return w && w.level !== 'ok' ? `<span class="tile-wx wx-${w.level}" title="${esc(w.text)}">${wxi(w)}${esc(OUTING_LABEL[w.level])}</span>` : ''; })()}
      <span class="tile-body"><span class="tile-day">${esc(dayLabel(c.o, c.d.date, true))}</span><b>${esc(splitName(c.z)[0])}</b>${c.walk ? `<span class="tile-micro">${esc(c.walk.microzone)}</span><small>${esc(walkBrief(c.walk))}</small>` : ''}<small>${esc(c.d.best.species.name)} · ${c.d.best.band} m</small></span>
    </a></li>`;
  }).join('');
  if(weatherPainting)updateWeatherHTML(ol,rankingHTML);else ol.innerHTML=rankingHTML;
  $('#others-h').hidden = list.length < 2;
  fitFacts($('#hero .facts'));
  renderSeason();if(!weatherPainting)renderCommunityIntro();
  fitCover();
}

function renderCommunityIntro() {
  const box = $('#community-intro');
  if (box) box.innerHTML = `<p class="eyebrow">${esc(contentCopy.communityEyebrow || 'Un bosco da conoscere insieme')}</p><h2>${esc(contentCopy.communityTitle || 'Ogni passeggiata aggiunge un pezzetto.')}</h2><p>${esc(contentCopy.communityIntro || 'Fronda aiuta a scegliere dove e quando andare a funghi e a conoscere il bosco durante l’uscita. Le segnalazioni, comprese le ricerche senza ritrovamenti, aiutano a migliorare i consigli.')}</p><p class="small muted">${esc(communityStatus())}</p><button class="btn primary" type="button" data-report>Segnala dal bosco</button> <button class="btn ghost" type="button" data-community-account>Il tuo profilo</button>`;
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
    for (const p of scoreZoneDay(z, habitat[z.id], series[z.id], selectedSpecies(), d.i,{zoneId:z.id,observations:state.useBotanicalNotes?botanicalNotes:[]}).perSpecies) {
      if (!best[p.species.id] || p.score > best[p.species.id].score) best[p.species.id] = { ...p, z };
    }
  }
  const arr = Object.values(best).filter((p) => p.score >= 15).sort((a, b) => b.score - a.score).slice(0, 10);
  $('#season-h').hidden = !arr.length;
  const html = arr.map((p) => {
    const ph = speciesPhoto(p.species.id);
    return `<li data-weather-key="season-${p.species.id}"><button type="button" class="portrait" data-species="${p.species.id}">
      ${ph ? `<img data-src="${assetSrc(ph.file)}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>${ring(p.score, false)}
      <span class="portrait-body"><b>${esc(p.species.name)}</b>${reportBadge(p.z.id, p.species.id)}<small>${esc(splitName(p.z)[0])}</small></span></button></li>`;
  }).join('');
  // Sempre riconciliata sul posto (le azioni sono delegate): le card che restano tengono la loro foto,
  // invece di sparire e ricomparire a ogni ridisegno (meteo, filtri, segnalazioni).
  updateWeatherHTML(box, html);
}

function renderMapDays() {
  // scelto il giorno, su telefono la fila si richiude (resta il chip del giorno in testa ai filtri)
  dayChips($('#map-days'), state.dayOffset, (o) => { state.dayOffset = o; $('.map-top')?.classList.remove('days-open'); renderAll(); renderFilterSummary(); });
}
// riquadro della zona aperto: su telefono la barra delle sezioni si toglie di mezzo (come fa Google Maps)
new MutationObserver(() => document.documentElement.classList.toggle('map-sheet-open', !$('#map-sheet')?.hidden))
  .observe(document.getElementById('map-sheet') || document.body, { attributes: true, attributeFilter: ['hidden'] });

// Riquadro dal basso sulla mappa: riassunto della zona e accesso alla scheda
let sheetZone = null, sheetPoint = null;
function currentSheetPoint(){
 const pt=sheetPoint;if(!pt?.t)return pt;
 const z=zones.find(z=>z.id===sheetZone),d=dayEntry(sheetZone,state.dayOffset);
 const t=d?.best?trailsFor(z,d.best.species,d.best.band).find(t=>String(t.id)===String(pt.t.id)):null;
 return {...pt,t:t||trails[sheetZone]?.trails.find(t=>String(t.id)===String(pt.t.id))||pt.t};
}
function openSheet(zid) {
  sheetPoint=null;sheetZone = zid;
  if (!results) return; // il meteo non e' ancora arrivato: renderAll riapre il riquadro
  const z = zones.find((x) => x.id === zid);
  const d = dayEntry(zid, state.dayOffset);
  const sh = $('#map-sheet');
  if (!z || !d?.best) { sh.hidden = true; return; }
  const sc = adjusted(z, d.score, d);
  const cv = coverOf(z, d.best.species.id, d);
  sh.innerHTML = `
    <button type="button" class="sheet-close" aria-label="Chiudi">✕</button>
    <a class="sheet-row" href="#/zona/${zid}/${state.dayOffset}">
      <span class="sheet-img">${cv ? `<img data-src="${cv.small}" alt="" loading="lazy" decoding="async">` : ''}${ring(sc, false)}</span>
      <span class="sheet-txt"><span class="eyebrow">${esc(dayLabel(state.dayOffset, d.date, true))}</span><b class="sheet-title">${esc(splitName(z)[0])}</b>
        <span class="small">${esc(d.best.species.name)} ~${d.best.band} m · ${esc(travelText(zoneTrip(z)))}${d.crowd ? ` · ${crowdText(d.crowd)}` : ''}</span>${wxOf(z, d) ? `<span class="small wx-line wx-${wxOf(z, d).level}">${wxi(wxOf(z, d))}${esc(wxOf(z, d).text)}</span>` : ''}</span>
    </a>
    ${forestOn ? forestHere(zid) : ''}
    <p class="sheet-key small"><span class="key-p">P</span> sosta <span class="key-walk">${IC.walk}</span> qui lasci l'auto <span class="key-trail"></span> sentiero consigliato <span class="muted">· tocca un segno</span></p>
    <a class="btn primary big" href="#/zona/${zid}/${state.dayOffset}">Apri il piano dell'uscita</a>`;
  sh.hidden = false;
  sh.querySelector('.sheet-close').addEventListener('click', () => { sh.hidden = true; sheetZone = null; state.zoneId = null; renderMap(); });
  if (state.zoneId !== zid) { state.zoneId = zid; renderMap(); }
}

function openPoint(zid, pt) {
  sheetZone=zid;sheetPoint=pt;
  const z = zones.find((x) => x.id === zid);
  const d = dayEntry(zid, state.dayOffset);
  const sh = $('#map-sheet');
  if (!z || !d?.best) return;
  const copyBtn = (lat, lon) => `<button type="button" class="btn ghost pt-copy" data-copy="${lat.toFixed(5)}, ${lon.toFixed(5)}" aria-label="Copia coordinate" title="Copia coordinate">${IC.copy}</button>`;
  let ic, eyebrow, title, text, actions, preview = '';
  if (pt.kind === 'parking') {
    ic = '<span class="pt-ic pt-p">P</span>'; eyebrow = 'Sosta per l\'auto'; title = pt.p.name;
    text = 'Parcheggio o slargo da cui partono i boschi della zona.';
    actions = `<a class="btn primary" href="${gmaps(pt.p.lat, pt.p.lon)}" target="_blank" rel="noopener" aria-label="Indicazioni stradali fin qui">${IC.car} Indicazioni</a>${copyBtn(pt.p.lat, pt.p.lon)}`;
  } else if (pt.kind === 'access') {
    const ax = d?.access;
    ic = `<span class="pt-ic pt-walk">${IC.walk}</span>`; eyebrow = 'Qui lasci l\'auto e prosegui a piedi'; title = ax.road || 'Punto più vicino al bosco adatto';
    text = `In auto ${ax.surface ? `su ${SURF_LABEL[ax.surface]}` : 'su asfalto'} fino a qui, poi ${ax.walkM < 50 ? `il bosco adatto è a bordo strada: ${esc((SHORT[ax.cat] || ax.cat || 'paesaggio non classificato').toLowerCase())} a ${ax.e} m` : `${walkTxt(ax.walkM)} in linea d'aria fino a ${esc((SHORT[ax.cat] || ax.cat || 'paesaggio non classificato').toLowerCase())} a ${ax.e} m`}, adatto a ${speciesLink(d.best.species, d.best.species.name.toLowerCase())}.`;
    actions = `<a class="btn primary" href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener" aria-label="Indicazioni stradali fin qui">${IC.car} Indicazioni</a>${copyBtn(ax.rlat, ax.rlon)}`;
  } else if (pt.kind === 'trailhead') {
    const h = pt.h, t = pt.t;
    ic = `<span class="pt-ic pt-th">${segnavia(t)}</span>`; eyebrow = 'Imbocco del sentiero'; title = trailName(t);
    text = `Qui il sentiero incontra una ${h.kind === 'strada' ? 'strada mappata' : 'strada sterrata mappata'}${h.road ? ` (${esc(h.road)})` : ''}${h.ele != null ? `, a circa ${Math.round(h.ele / 25) * 25} m` : ''}. Verifica transitabilità e possibilità di sosta.`;
    preview = pointTrailPreview(z, t, d, h);
    actions = `<a class="btn primary" href="${gmaps(h.lat, h.lon)}" target="_blank" rel="noopener" aria-label="Indicazioni stradali fin qui">${IC.car} Indicazioni</a>
      <a class="btn ghost" href="${walkHref(z, state.dayOffset, t)}" aria-label="Dettagli del sentiero">${IC.map} Dettagli del sentiero</a>${copyBtn(h.lat, h.lon)}`;
  } else {
    const t = pt.t;
    ic = null; eyebrow = 'Sentiero da esplorare'; title = '';
    text = trailCard(z, t, d, false);
    actions = `<a class="btn primary" href="${walkHref(z, state.dayOffset, t)}" aria-label="Dettagli del sentiero">${IC.map} Dettagli del sentiero</a>${trailLinks(z, t)}`;
  }
  sh.innerHTML = `
    <div class="sheet-nav"><button type="button" class="sheet-back">‹ ${esc(splitName(z)[0])}</button><button type="button" class="sheet-close" aria-label="Chiudi">✕</button></div>
    ${ic ? `<div class="pt-head">${ic}<div><span class="eyebrow">${eyebrow}</span><b class="sheet-title">${esc(title)}</b></div></div>
    <p class="small pt-text">${text}</p>` : `<span class="eyebrow">${eyebrow}</span>${text}`}
    ${preview}<div class="pt-actions">${actions}</div><p class="small muted pt-copy-status" role="status" data-copy-status></p>`;
  sh.hidden = false;
  sh.querySelector('.sheet-back').addEventListener('click', () => openSheet(zid));
  sh.querySelector('.sheet-close').addEventListener('click', () => { sh.hidden = true; sheetZone = null; state.zoneId = null; renderMap(); });
  sh.querySelector('[data-trail]')?.addEventListener('click', () => openPoint(zid, { kind: 'trail', t: pt.t, top: false }));
  sh.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    const b = e.currentTarget, status = sh.querySelector('[data-copy-status]');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(b.dataset.copy);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';
      b.setAttribute('aria-label', 'Coordinate copiate'); b.title = 'Coordinate copiate';
      status.textContent = 'Coordinate copiate.';
    } catch { status.textContent = `Coordinate: ${b.dataset.copy}`; }
  });
}

function pointTrailPreview(z, t, d, h) {
  const elevations = (t.samples || []).map(s => s[0]).filter(Number.isFinite);
  const range = elevations.length ? ` · ${Math.min(...elevations)}–${Math.max(...elevations)} m` : '';
  return `<div class="pt-preview"><p class="pt-preview-title">Tratto locale · ${fmtKm(t.in_zone_km)} km${range}</p>
    ${trailVisual(z, t, d, [h])}</div>`;
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
  map.on('moveend',syncCellBackdrop);
  // la carta cambia misura (barra in alto che sparisce, rotazione): Leaflet va avvisato
  new ResizeObserver(() => map.invalidateSize()).observe($('#map'));
  initCellInteractions();
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
          ${bases ? `<p class="eyebrow">Tipo di mappa</p><div class="mapctl-tiles">${bases.map(([n, img], k) => `<button type="button" class="mapctl-tile" data-base="${k}" aria-pressed="${k === 0}"><img data-src="${img}" alt="" width="64" height="64"><span>${n}</span></button>`).join('')}</div>` : ''}
          <p class="eyebrow">Dettagli della mappa</p>
          <div class="mapctl-tiles"><button type="button" class="mapctl-tile" data-act="forest" aria-pressed="false"><img data-src="assets/map-thumb-forest.jpg" alt="" width="64" height="64"><span>Carta Forestale</span></button></div>
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
  map.on('moveend',syncCellBackdrop);
  // la carta cambia misura (barra in alto che sparisce, rotazione): Leaflet va avvisato
  new ResizeObserver(() => map.invalidateSize()).observe($('#map'));
  initCellInteractions();
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
  if(state.target==='piante')return []; // coarse land cover cannot localise plant presence
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
let cellRenderer = null, cellsOut = false,mapRenderRevision=0;
function syncCellBackdrop() {
  if(!map)return;
  const el=$('#map'),bounds=map.getBounds();
  const visible=(el.classList.contains('cells-on')&&cellHits.some(({c,dLat,dLon})=>bounds.intersects([[c.lat-dLat,c.lon-dLon],[c.lat+dLat,c.lon+dLon]])))||(el.classList.contains('cells-peek')&&peekCellBounds.some(b=>bounds.intersects(b)));
  el.classList.toggle('cells-visible',visible);
}
// popover della mappa: titolo e percentuale grande, una riga per fungo con la barretta nella scala dell'indice, l'azione in fondo
function mapCard({ title, sub, pct, rows = [], more = 0, foot = '', interactive = false }) {
  return `<div class="mtt"${interactive ? '' : ' data-no-glossary'}><b class="mtt-t">${esc(title)}</b>${sub ? `<span class="mtt-s">${sub}</span>` : ''}
    <span class="mtt-p" style="--c:var(${scoreVar(pct)})"><b class="pc">${scoreText(pct)}</b><small>${esc(scoreLabel(pct).toLowerCase())}</small></span>
    ${rows.length ? `<ul class="mtt-rows">${rows.map((r) => `<li><span>${esc(r.name)}</span><i><i style="width:${r.v}%;background:var(${scoreVar(r.v)})"></i></i><b class="pc">${formatIndex(r.v)}</b></li>`).join('')}</ul>` : ''}
    ${more ? `<p class="mtt-more">e altri ${more}</p>` : ''}${foot ? `<p class="mtt-f" data-glossary="Bosco">${foot}</p>` : ''}</div>`;
}
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
// i riquadri sono disegnati su una tela che non prende il mouse (sotto ci sono cerchi e sentieri):
// il riquadro sotto il puntatore si trova dalla posizione (cellHits) e si evidenzia con un contorno a parte
let cellHits = [], peekCellBounds = [], cellHi = null, cellTip = null, cellPeek = null;
let cellCardTimer = null, cellPinned = false, cellDoubleClickZoom = false;
function cancelCellCardTimer() { clearTimeout(cellCardTimer); cellCardTimer = null; }
// al passaggio del mouse solo un'etichetta compatta; la scheda completa si apre col clic (o Invio)
function hideCellPeek() { cellPeek?.remove(); cellPeek = null; if (!cellTip) { cellHi?.remove(); cellHi = null; } map?.getContainer().classList.remove('cell-pointer'); }
function highlightCell({ c, dLat, dLon }) {
  const b = [[c.lat - dLat, c.lon - dLon], [c.lat + dLat, c.lon + dLon]];
  if (!cellHi) cellHi = L.rectangle(b, { interactive: false, color: '#fff', weight: 2.5, fill: false, className: 'cell-hi' }).addTo(map);
  else cellHi.setBounds(b);
}
function showCellPeek(h) {
  const { c, dLat } = h;
  if (cellPeek?._fz === c) return;
  highlightCell(h);
  const best = c.parts[0];
  const html = `<span class="cell-peek-p" style="--c:var(${scoreVar(c.v)})"><b class="pc">${scoreText(c.v)}</b>${best ? `<span>${esc(best.sp.name.split(' / ')[0])}</span>` : ''}</span><span class="cell-peek-s">${esc(c.cat)} · ${c.e} m s.l.m. · clic per i dettagli</span>`;
  const position = [c.lat + dLat, c.lon];
  if (!cellPeek) cellPeek = L.tooltip({ className: 'zone-tt cell-peek', interactive: false, permanent: true, direction: 'top', offset: [0, -6], opacity: 1 }).setLatLng(position).setContent(html).addTo(map);
  else cellPeek.setLatLng(position).setContent(html);
  cellPeek._fz = c; map.getContainer().classList.add('cell-pointer');
}
function closeCellCard() {
  cancelCellCardTimer(); cellPinned = false; hideCellPeek();
  const restoreFocus = cellTip?.getElement()?.contains(document.activeElement);
  const card = cellTip?.getElement();
  if (card) { card.inert = true; card.style.pointerEvents = 'none'; }
  cellHi?.remove(); cellHi = null; cellTip?.remove(); cellTip = null;
  // Restore after the current click has finished bubbling. Leaflet synthesises
  // double taps from clicks; interacting with the card must not zoom the map.
  if (cellDoubleClickZoom) setTimeout(() => { if (!cellTip) { map.doubleClickZoom.enable(); cellDoubleClickZoom = false; } }, 0);
  if (restoreFocus) map?.getContainer().focus({ preventScroll: true });
}
function deferCellCard(action = closeCellCard) {
  cancelCellCardTimer();
  if (!cellPinned) cellCardTimer = setTimeout(action, 250);
}
function initCellInteractions() {
  if (canHover) {
    map.on('mousemove', hoverCell);
    map.getContainer().addEventListener('mouseleave', hideCellPeek);
  }
  map.on('click', e => { if (!pinCellCard(e)) closeCellCard(); });
  map.on('dragstart zoomstart', closeCellCard); map.on('dragstart zoomstart', hideCellPeek);
  map.getContainer().setAttribute('aria-keyshortcuts', 'Enter');
  map.getContainer().setAttribute('aria-label', 'Mappa delle zone. Premi Invio per aprire l’area più vicina al centro.');
  map.getContainer().addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target !== map.getContainer() || !$('#map').classList.contains('cells-on')) return;
    const center = map.getCenter(), bounds = map.getBounds();
    const nearest = cellHits.filter(h => bounds.contains([h.c.lat, h.c.lon])).sort((a, b) => center.distanceTo([a.c.lat, a.c.lon]) - center.distanceTo([b.c.lat, b.c.lon]))[0];
    if (nearest) { e.preventDefault(); showCellCard(nearest); cellPinned = true; cellTip.getElement().querySelector('[data-cell-close]').focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cellTip && !document.querySelector('dialog[open],.learning-panel:popover-open')) {
      e.preventDefault(); closeCellCard();
    }
  });
  addEventListener('hashchange', closeCellCard);
}
function pinCellCard(e) {
  const h = $('#map').classList.contains('cells-on') && cellAt(e.latlng);
  if (!h) return false;
  cancelCellCardTimer(); cellPeek?.remove(); cellPeek = null; showCellCard(h); cellPinned = true;
  return true;
}
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
  // con la scheda aperta l'etichetta non serve: la scheda resta finché non si chiude
  if (cellTip) { if (cellPeek) { cellPeek.remove(); cellPeek = null; } return; }
  const target = e.originalEvent?.target;
  const h = map && $('#map').classList.contains('cells-on') && !target?.closest('.leaflet-control,.leaflet-marker-icon') ? cellAt(e.latlng) : null;
  if (h) showCellPeek(h); else hideCellPeek();
}
function showCellCard(h, preserveTimer = false) {
  if (!preserveTimer) cancelCellCardTimer();
  const { c } = h;
  highlightCell(h);
  const html = mapCard({ title: c.cat, sub: `${c.e} m s.l.m. · area ${c.size} × ${c.size} m`, pct: c.v, interactive: true,
    rows: c.parts.slice(0, 3).map((x) => ({ name: x.sp.name.split(' / ')[0], v: x.v })), more: Math.max(0, c.parts.length - 3),
    foot: 'Campione di habitat: verifica alberi ospiti, divieti e condizioni sul posto.' });
  const content = `${html}<button type="button" class="cell-card-close" data-cell-close aria-label="Chiudi la scheda dell’area">×</button>`;
  const position = [c.lat, c.lon];
  if (!cellTip) {
    cellDoubleClickZoom ||= map.doubleClickZoom.enabled(); map.doubleClickZoom.disable();
    cellTip = L.tooltip({ className: 'zone-tt cell-card', interactive: true, permanent: true, direction: 'center', opacity: 1 }).setLatLng(position).setContent(content).addTo(map);
    const card = cellTip.getElement();
    card.setAttribute('role', 'dialog');
    L.DomEvent.disableClickPropagation(card); L.DomEvent.disableScrollPropagation(card);
    card.addEventListener('mouseenter', cancelCellCardTimer);
    card.addEventListener('mouseleave', () => deferCellCard());
    card.addEventListener('focusin', () => { cancelCellCardTimer(); cellPinned = true; });
    card.addEventListener('click', e => { if (e.target.closest('[data-cell-close]')) closeCellCard(); else { cancelCellCardTimer(); cellPinned = true; } });
  } else { cellTip.setLatLng(position); if (cellTip._fhtml !== content) cellTip.setContent(content); }
  // Keep the card within the map even when its sample is near an edge.
  const card = cellTip.getElement(), point = map.latLngToContainerPoint(position), size = map.getSize();
  card.setAttribute('aria-label', `${c.cat}, ${c.e} metri: area di ${c.size} per ${c.size} metri`);
  const halfW = card.offsetWidth / 2, halfH = card.offsetHeight / 2;
  const x = Math.max(halfW + 8, Math.min(size.x - halfW - 8, point.x));
  const above = point.y - halfH - 10;
  const y = Math.max(halfH + 8, Math.min(size.y - halfH - 8, above - halfH >= 8 ? above : point.y + halfH + 10));
  cellTip.setLatLng(map.containerPointToLatLng([x, y]));
  cellTip._fz = c; cellTip._fhtml = content;
}

function renderMap(changed=null) {
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
  baseMarker?.remove();baseMarker=null;
  if(customBase())baseMarker=L.marker([origin.lat,origin.lon],{icon:L.divIcon({className:'map-base',html:'<span aria-hidden="true">⌂</span>',iconSize:[32,32],iconAnchor:[16,16]}),title:`Base di partenza: ${origin.name}`}).bindTooltip(`Base: ${esc(origin.name)}`).addTo(map);
  // passaggio cerchi pieni <-> riquadri: prima si anima (carta, cerchi, riquadri in dissolvenza), poi si ridisegna
  const mapEl = $('#map');
  const revision=++mapRenderRevision;
  const want = map.getZoom() >= 11.5 || !!state.zoneId;
  const displayedCell = cellTip?._fz;
  if (cellPeek) hideCellPeek(); // l'etichetta torna al prossimo movimento del mouse
  if (!want) closeCellCard();
  const had = mapEl.classList.contains('cells-on');
  const slow = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (had && !want && slow && !cellsOut) {
    cellsOut = true;
    mapEl.classList.remove('cells-on','cells-visible');
    setTimeout(() => { cellsOut = false; renderMap(); }, 420);
    return;
  }
  const previousHits=cellHits;
  for(const k in zoneLayers)if(!changed||changed.has(k)||!zones.some(z=>z.id===k)){zoneLayers[k].remove();delete zoneLayers[k];}
  cellHits = changed?previousHits.filter(h=>zoneLayers[h.z.id]):[];peekCellBounds=[];mapEl.classList.remove('cells-peek');
  // etichette delle zone in un livello sopra i segnavia e i pin: nome e indice restano sempre leggibili
  if (!map.getPane('zoneLabels')) map.createPane('zoneLabels').style.zIndex = 640;
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
    if(changed&&zoneLayers[z.id])continue;
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
    }).addTo(g).on('click', e => { if (!pinCellCard(e)) openSheet(z.id); });
    if (showCells && d) cellsLayer(z, d).addTo(g);
    else if (d && canHover) {
      // a volo d'uccello: passandoci sopra la zona si accende e mostra in anteprima i suoi riquadri
      let prev = null;
      circle.on('mouseover', () => { circle.setStyle({ weight: 3.5, dashArray: '6 6' }); circle.getElement()?.classList.add('peek'); prev ||= cellsLayer(z, d, false); prev.addTo(g);peekCellBounds=prev.getLayers().map(layer=>layer.getBounds());mapEl.classList.add('cells-peek');requestAnimationFrame(syncCellBackdrop); });
      circle.on('mouseout', () => { circle.setStyle({ weight: 2, dashArray: null }); circle.getElement()?.classList.remove('peek'); mapEl.classList.remove('cells-peek');syncCellBackdrop();setTimeout(() => { if (!mapEl.classList.contains('cells-peek')) prev?.remove(); }, 300); });
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
      interactive: false, pane: 'zoneLabels',
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
        const same = seenTh.find((q) => Math.abs(q.h.lat - h.lat) < 0.0015 && Math.abs(q.h.lon - h.lon) < 0.002);
        if (same) { if (!same.ts.includes(t)) same.ts.push(t); continue; }
        seenTh.push({ h, ts: [t] });
      }
      // Regola anti-sovrapposizione: gli imbocchi a meno di 26 px sullo schermo diventano un solo segnavia
      // con il conteggio («429 +2»). Toccarlo avvicina la carta finché si separano. Un segnavia che cade
      // sull'etichetta della zona scende sotto di essa; l'etichetta sta comunque in un livello più alto.
      const groups = [];
      for (const it of seenTh) {
        const pt = map.latLngToContainerPoint([it.h.lat, it.h.lon]);
        const gr = groups.find((q) => Math.abs(q.pt.x - pt.x) < 26 && Math.abs(q.pt.y - pt.y) < 26);
        if (gr) gr.items.push(it); else groups.push({ pt, items: [it] });
      }
      for (const gr of groups) {
        const [first] = gr.items, n = gr.items.length, t = first.ts[0];
        const box = placed.find((b) => Math.abs(b.x - gr.pt.x) < b.w / 2 + 11 && Math.abs(b.y - gr.pt.y) < 13 + 11);
        const dy = box ? Math.round(box.y + 13 + 14 - gr.pt.y) : 0; // sotto l'etichetta, mai sopra
        const names = [...new Set(gr.items.flatMap((x) => x.ts.map(trailName)))];
        const stripes = `<span class="map-th${first.h.kind === 'strada' ? '' : ' unpaved'}" aria-hidden="true"><i></i><i></i><i></i></span>`;
        const html = n > 1 ? `<span class="map-th-group" aria-hidden="true" style="--th-dy:${dy}px">${stripes}<b>${t.ref ? `${esc(t.ref)} ` : ''}+${n - 1}</b></span>` : stripes;
        const title = n > 1 ? `${n} imbocchi vicini: ${names.join(', ')}. Avvicina la carta per separarli` : `Imbocco: ${names.join(', ')}`;
        L.marker([first.h.lat, first.h.lon], { icon: L.divIcon({ className: '', html, iconSize: n > 1 ? null : [18, 22], iconAnchor: n > 1 ? null : [9, 11 - dy] }), keyboard: true, title })
          .addTo(g).on('click', () => {
            if (n > 1 && map.getZoom() < map.getMaxZoom()) map.flyToBounds(L.latLngBounds(gr.items.map((x) => [x.h.lat, x.h.lon])).pad(0.5), { maxZoom: Math.min(map.getMaxZoom(), map.getZoom() + 3), duration: 0.4 });
            else openPoint(z.id, { kind: 'trailhead', h: first.h, t });
          });
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
  if (displayedCell && cellTip) {
    const hit = cellHits.find(h => h.c.lat === displayedCell.lat && h.c.lon === displayedCell.lon);
    if (hit) showCellCard(hit, true); else closeCellCard();
  }
  const reveal=()=>{if(revision!==mapRenderRevision)return;mapEl.classList.toggle('cells-on',want);syncCellBackdrop();};
  // La tela Leaflet disegna al frame successivo: avvia la dissolvenza solo dopo.
  if(slow&&want&&!had)requestAnimationFrame(()=>requestAnimationFrame(reveal));else reveal();
}

function renderLegend() {
  const items = [...CLASSES].reverse().map((c) => `<span><span class="sw" style="background:var(${mapVar(c.min)})"></span>${c.label}${c.min ? ' ≥' + formatIndex(c.min) : ''}</span>`);
  $('#legend').innerHTML = items.join('') +
    (hasLeaflet() || !globalThis.FUNGAROLI_DATA ? '' : `<span class="muted">Schema: cerchi = zone, anelli = distanza in linea d’aria da ${esc(currentBase().name)}</span>`) +
    (hasLeaflet() &&state.target==='funghi' ? '<span class="lg-cells"><span class="sw sw-cell"></span>Riquadri campionati da 300–500 m: habitat potenziale, senza verifica di presenza o permesso di raccolta. Avvicinati o apri una zona per vederli.</span>' : '') +
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

// Il giro a colpo d'occhio, come nelle app outdoor: dati in una riga, profilo con la fascia della specie, boschi lungo il tratto.
// Solo dati del tratto nella zona: niente dislivello ricavato dai campioni (a passo fisso lo gonfierebbe);
// la salita della fonte riguarda l'itinerario completo e resta nella scheda aperta.
function walkGlance(z, t, d) {
  const sm = (t.samples || []).filter((x) => Number.isFinite(x[0]));
  const es = sm.map((x) => x[0]);
  // come nelle app outdoor: il numero sopra, l'etichetta piccola sotto (il testo letto resta «5,4 km nella zona»)
  const stat = (v, k) => `<li><span class="ws-v">${v}</span> <span class="ws-k">${k}</span></li>`;
  const stats = [
    stat(`${fmtKm(t.in_zone_km)}\u00a0km`, 'nella zona'),
    es.length ? stat(`${Math.min(...es)}–${Math.max(...es)}\u00a0m`, 'quote del tratto') : '',
    stat(t.difficulty ? difficultyLink(t.difficulty, t.difficulty) : 'n.d.', t.difficulty ? esc(DIFF[t.difficulty] || 'difficoltà') : 'difficoltà'),
  ].join('');
  const unlink = (html) => html.replace(/<a [^>]*>(.*?)<\/a>/g, '$1');
  const profile = unlink(trailProfile(z.id, t, d?.best?.species, d?.best?.band));
  const cats = trails[z.id]?.sample_categories || [];
  const counts = {};
  for (const [, c] of sm) { const k = c >= 0 ? cats[c] : 'non bosco'; if (k) counts[k] = (counts[k] || 0) + 1; }
  const n = Object.values(counts).reduce((a, b) => a + b, 0);
  // dentro <summary> niente link: la legenda resta testo, i collegamenti sono nella scheda aperta
  const forest = n >= 4 ? `<span class="ws-forest"><span class="ws-k">Boschi lungo il tratto</span>${unlink(forestBar(Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / n]))))}</span>` : '';
  return `<span class="walk-glance"><ul class="walk-stats">${stats}</ul>${profile}${forest}</span>`;
}

function renderWalkFocus(z, d, walk) {
  if (!walk) return `<p class="small muted">Non abbiamo ancora un sentiero documentato per questa zona.</p>`;
  const { t, h } = walk;
  return `<details class="sec walk-focus" data-glossary-context="Sentiero" name="zone-details" data-sec="passeggiata" data-walk-trail="${t.id}"${openSecs.has('passeggiata') ? ' open' : ''}>
    <summary><span class="walk-summary">
      <span class="eyebrow">La passeggiata, più da vicino</span><span class="walk-title">${esc(walk.microzone)}</span>
      <span class="walk-route">${segnavia(t)}<b>${esc(trailName(t))}</b></span>
      ${walkGlance(z, t, d)}
    </span></summary><div class="sec-body">
    <dl class="walk-facts">
      <div><dt>Difficoltà</dt><dd>${t.difficulty ? difficultyLink(t.difficulty, `${t.difficulty} · ${DIFF[t.difficulty] || 'classificazione della fonte'}`) : 'Non indicata nella fonte'}</dd></div>
      <div><dt>Tratto nella zona</dt><dd>${fmtKm(t.in_zone_km)} km${t.lines?.length > 1 ? ' · più segmenti separati' : ''}</dd></div>
      <div><dt>Itinerario completo</dt><dd>${t.total_km ? `${fmtKm(t.total_km)} km` : 'Lunghezza n.d.'}${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div>
      <div><dt>Imbocco mappato</dt><dd>${h ? `${h.ele != null ? `Circa ${Math.round(h.ele / 25) * 25} m · ` : ''}${esc(h.road || (h.kind === 'strada' ? 'su strada' : 'su sterrata'))}` : 'Non disponibile; le soste indicate riguardano la zona'}</dd></div>
    </dl>
    ${t.mainCat ? `<p class="small" data-glossary="${d?.best?.kind==='plant'?'Piante':'Funghi'}">Lungo il tracciato: ${linkTrees(t.mainCat.toLowerCase())} nei campioni tra circa ${Math.floor(t.lo / 25) * 25} e ${Math.ceil(t.hi / 25) * 25} m${d?.best?.species ? `, ${d.best.kind==='plant'?'proxy di paesaggio per':'compatibili con l’habitat di'} ${speciesLink(d.best.species, d.best.species.name.toLowerCase())}` : ''}.</p>` : ''}
    ${trailVisual(z, t, d, headsOf(z,t))}
    <button type="button" class="btn ghost" data-note-kind="zona" data-note-id="${z.id}" data-note-zone="${z.id}" data-note-href="${esc(walkHref(z,state.dayOffset,t))}" data-note-title="${esc(trailName(t))}">＋ Salva il giro nel taccuino</button>
    ${trailLinks(z, t)}
    <p class="small muted">Il GPX contiene solo il tratto nella zona. Tempi e dislivello, quando disponibili, riguardano l’itinerario completo. Verifica accesso, sosta e stato del sentiero prima di partire.</p>
    <p class="small muted">Tracciato OpenStreetMap / Waymarked Trails · imbocchi ricavati dalla rete stradale mappata. L’indice e le segnalazioni riguardano la zona, non questo singolo sentiero.</p>
    </div>
  </details>`;
}

function essentialSections(z, d, walk) {
  const best = d.best;
  const rows = [];
  rows.push({ sec: 'specie', icon: 'find', thumb: best.species.id, k: 'Cosa osservare', v: `<button type="button" class="sp-inline" data-species="${best.species.id}">${esc(best.species.name)}</button> ${intornoA(best.band)} <b>${best.band} m</b>`,
    sub: [whereSummary(best.species.id) && `<span class="plan-where">${linkTrees(whereSummary(best.species.id))}</span>`,
      attentionLine(criticalRuleOf(best.species.id)),
      (() => { const more = d.perSpecies.slice(1, 3).map((p) => [p, spScore(z, d, p)]).filter(([, sc]) => sc >= 20); return more.length ? `<span class="ent-chips">${more.map(([p, sc]) => `<a class="ent-chip" href="${p.species.kind==='plant'?p.species.href:'#/specie/'+encodeURIComponent(p.species.id)}">${thumb(p.species.id,28)}<span>${esc(p.species.name)}</span>${idxDot(sc)}</a>`).join('')}</span>` : ''; })()].filter(Boolean).join('') || esc(best.species.latin) });
  if (d.crowd &&state.target==='funghi') {
    const t = timingAdvice({ dateStr: d.date, lat: z.lat, lon: z.lon, crowd: d.crowd });
    rows.push({ sec: 'quando', icon: 'when', k: 'Quando', v: `Arriva <b>entro le ${fmtRough(t.arrive, 15, 'floor')}</b> <span class="badge crowd-${d.crowd.level}">${crowdText(d.crowd)}</span>`,
      sub: `alba verso le ${fmtRough(t.sunrise, 5)} · raccolta consentita dalle ${fmtRough(t.legal, 5, 'ceil')}` });
  }  const w = wxOf(z, d);
  if (w) {
    const alt = alternativeFor(z, state.dayOffset, d);
    rows.push({ sec: 'quando', svg: wxi(w), k: 'Meteo dell\'uscita', badge: `<span class="badge wx-b wx-${w.level}">${OUTING_SHORT[w.level]}</span>`,
      v: `${esc(w.text.replace(/^./, (c) => c.toUpperCase()))}`,
      sub: alt ? `<span class="plan-alt">Tempo migliore a ${esc(splitName(alt.z)[0])}: ${esc(alt.w.main)}, ${state.target==='piante'?'indice piante':'indice funghi'} ${idxDot(alt.s)}.</span>${actPill(`#/zona/${alt.z.id}/${state.dayOffset}`,'go',`Vai a ${esc(splitName(alt.z)[0])}`)}`
        : w.available ? `Mattina, dalle ${w.from}:00 alle 13 · quota centrale. Verifica percorso e rientro${w.thunder ? ' · uscita sconsigliata con temporali' : ''}` : 'Aggiorna le previsioni prima di decidere.' });
  }

  const a0 = access[z.id]?.[0];
  const ax = walk?.h ? null : d?.access;
  if (a0 || ax) {
    const unp = a0?.unpaved_tail_km > 0.2 ? `, ultimi ${fmtKm(a0.unpaved_tail_km)} km su strada bianca` : '';
    rows.push({ sec: 'accesso', icon: 'car', k: 'Come arrivare',
      v: walk?.h ? `All’imbocco del sentiero ${esc(walk.t.ref || '')}` : ax ? `In auto ${ax.road ? `su ${esc(ax.road)}` : 'fino al punto più vicino'}${ax.walkM < 50 ? ': habitat campionato vicino alla strada' : `, poi <b>${fmtM(ax.walkM)} in linea d’aria</b>`}` : `${esc(travelText(zoneTrip(z)))} fino a ${esc(a0.parking)}`,
      sub: `${a0 ? `${esc(travelText(zoneTrip(z,walk)))} da ${esc(currentBase().name)}${customBase()?'':unp}` : ''}${walk?.h ? actPill(gmaps(walk.h.lat, walk.h.lon),'nav','Indicazioni',true) : ax ? actPill(gmaps(ax.rlat, ax.rlon),'nav','Navigatore',true) : ''}`,
      badge: d.comfort ? `<span class="badge comfort-${d.comfort.level}">${d.comfort.level}</span>` : '' });
  }
  const bodies={specie:()=>zoneSpecies(z,d),quando:()=>renderHuman(z,d),accesso:()=>renderAccess(z,d)};
  return `<div class="essential-sections">${Object.keys(bodies).map(id=>{
    const group=rows.filter(r=>r.sec===id);if(!group.length)return '';
    const summary=group.map(r=>`<span class="essential-summary"><span class="plan-ic${r.thumb?' has-thumb':''}">${r.thumb?thumb(r.thumb,48):r.svg||ICON[r.icon]}</span><span class="plan-body"><span class="plan-k">${r.k}${r.badge?' '+r.badge:''}</span><span class="plan-v">${r.v}</span>${r.sub?`<span class="plan-sub">${r.sub}</span>`:''}</span></span>`).join('');
    return section(id,summary,bodies[id]()||'<p class="small muted">Verifica le previsioni aggiornate e le condizioni del percorso prima di partire.</p>');
  }).join('')}</div>`;
}

const section = (id, title, body, open = false) => body ? `
  <details class="sec" name="zone-details" data-sec="${id}"${['sentieri','accesso'].includes(id)?' data-glossary-context="Sentiero"':''}${openSecs.has(id) || (open && !openSecs.size) ? ' open' : ''}>
    <summary>${title}</summary><div class="sec-body">${body}</div>
  </details>` : '';
const openSecs = new Set();

function bindDetailSections(box, onOpen = () => {}) {
  const sections = [...box.querySelectorAll('details.sec[data-sec]')];
  const sync = (el) => {
    if(!el.isConnected||!box.contains(el))return;
    if (el.open) {
      // Also enforce exclusivity in browsers without native details[name] support.
      sections.forEach(other => { if (other !== el) other.open = false; });
      openSecs.clear(); openSecs.add(el.dataset.sec);
      onOpen(el.dataset.sec);
    } else openSecs.delete(el.dataset.sec);
  };
  sections.forEach(el => {
    el.addEventListener('toggle', () => sync(el));
    const summary=el.querySelector(':scope > summary');
    summary.addEventListener('click',e=>{
      if(e.target.closest('a,button,input')||e.defaultPrevented)return;
      const top=summary.getBoundingClientRect().top;
      // Chiudere una sezione più alta non deve far sparire quella appena aperta.
      requestAnimationFrame(()=>{if(summary.isConnected)scrollBy({top:summary.getBoundingClientRect().top-top,behavior:'instant'});});
    });
  });
  const current = sections.find(el => el.open);
  if (current) sync(current); else openSecs.clear();
}

function renderDetail() {
  $('#detail').dataset.glossaryContext=state.target==='piante'?'Piante':'Funghi';
  const z = (weatherZones||zones).find((x) => x.id === state.zoneId) || zones[0];
  const r = results[z.id];
  const d = dayEntry(z.id, state.dayOffset);
  const walk = walkFor(z, d, state.trailId);
  const box = $('#detail');
  if(box.querySelector('details.sec')){
    const current=box.querySelector('details.sec[open]');openSecs.clear();if(current)openSecs.add(current.dataset.sec);
  }
  if (!d?.best) {
    const missing = [...new Set((d?.perSpecies || []).flatMap((p) => p.quality?.missing || []))];
    box.innerHTML = `<h1>${esc(z.title || z.name)}</h1>${!series[z.id]?'<p class="notice">Meteo non disponibile per questa zona. <button type="button" class="link-btn" data-zone-weather-retry>Riprova</button></p>':''}<p class="notice">${selectedSpecies().length?'Indice non calcolabile':'Indice non ancora disponibile per le specie selezionate'}${missing.length ? ': mancano ' + esc(missing.join(', ')) : ' per questo giorno'}. Un dato mancante non indica assenza di ${state.target==='piante'?'piante':'funghi'}.</p><p><a href="#/mappa/${z.id}">Apri la mappa</a> · <a href="#/metodo">Metodo e limiti</a></p>${renderWalkFocus(z, d, walk)}${discoverySection(z,d,walk)}${z.protection ? `<p class="notice">${esc(z.protection)}</p>` : ''}<p data-glossary="Bosco">${linkTrees(z.description)}</p>${section('accesso','Accessi e soste',renderAccess(z,{access:null}))}${section('sentieri','Sentieri della zona',renderTrails(z,null),true)}`;
    box.querySelector('[data-zone-weather-retry]')?.addEventListener('click',()=>refreshWeather(true));
    bindDetailSections(box); return;
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
  const cov = coverOf(z, best.species.id, d);
  box.innerHTML = `
    <header class="phero">
      ${cov ? `<button type="button" class="phero-img" data-cover aria-label="Ingrandisci la foto"><img data-src="${cov.hd}" alt="${esc(cov.alt)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar"><a class="fab" href="#/mappa/${z.id}" aria-label="Mappa della zona">${IC.map}</a></div>
      <div class="phero-body"><span class="pill glass">${esc(dayLabel)}</span><h1 class="phero-title">${esc(title)}</h1>${sub ? `<p class="phero-sub">${esc(sub)}</p>` : ''}</div>
      ${ring(s)}
    </header>
    <div class="pbody">
    <div id="zone-days" class="days compact" role="tablist" aria-label="Giorno"></div>
    ${renderWalkFocus(z, d, walk)}
    ${essentialSections(z, d, walk)}
    ${discoverySection(z,d,walk)}
    ${best.kind==='plant'?`<p class="small muted">Indice di contesto sperimentale · fattori disponibili ${best.factors.filter(f=>f.value!=null).length}/${best.factors.length}${best.quality.climateUnavailable?' · meteo non disponibile':''}</p><div class="notice">${esc(best.species.parts)} ${esc(best.species.caution)}</div>`:''}
    <div class="zone-actions">
      ${best.kind==='plant'?`<button type="button" class="btn primary" data-note-kind="pianta" data-note-id="${best.species.plantId}" data-note-zone="${z.id}" data-note-title="${esc(best.species.name)}">Annota la fase nel taccuino</button>`:`<div class="zone-community"><button type="button" class="btn primary" data-report data-zone="${z.id}" data-species="${best.species.id}">Segnala dal bosco</button>${reportBadge(z.id, best.species.id)}</div>
      <button type="button" class="btn ghost" data-save-plan aria-label="Salva le condizioni nel taccuino"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v17l-5-3.5L7 21z"/></svg> Salva</button>`}
      <a class="btn ghost map-link" href="#/mappa/${z.id}" aria-label="Sentieri e accessi sulla mappa">${IC.map} Mappa</a>
    </div>
    ${best.kind==='plant'?'<p class="small muted">Confronta la pianta e verifica regole, tutela e permessi prima della raccolta.</p>':'<p class="small muted" data-plan-status></p>'}
    ${z.protection ? `<div class="notice">${esc(z.protection)}</div>` : ''}
    ${best.kind==='plant'?'':section('regole', 'Regole di raccolta', zoneLegal(z,d))}
    ${section('meteo', 'Perché questo indice', `${renderWhy({ r: best, s: sb, i: d.i, sp: best.species, band: best.band, dateStr: d.date, shown: s, agg: d.score, parts: d.perSpecies.map((p) => ({ name: p.species.name.split(' / ')[0], score: p.score })), prefs: adjParts(z, d), outing: wxRank(z, d) < 1 ? wxRank(z, d) : 0 })}
      <p class="small muted">${esc(best.kind==='plant'?'Indice sperimentale del contesto e della fase: non è una probabilità di raccolta.':contentCopy.indexExplanation || 'Condizioni di crescita: indice sperimentale 0–10.')}</p>
      <p class="sci-h">L'indice nei giorni</p><div id="charts"></div>${legal?.forecast_note ? `<p class="small muted">${esc(legal.forecast_note)}</p>` : ''}`)}
    ${section('sentieri', 'Sentieri della zona', renderTrails(z, d))}
    ${section('bosco', `Bosco a ${best.band} m (Carta Forestale)`, forestBar(hab.frac) + `<p class="small muted">${hab.n} punti nella fascia ±150 m. Campioni spazialmente correlati; composizione indicativa.</p>`)}
    ${section('zona', 'La zona', `<p class="small" data-glossary="Bosco">${esc(z.description)}</p>${treeChips(z.description)}
      <dl class="kv">
        <dt>Accesso</dt><dd>${esc(z.access)}</dd>
        <dt>Soste</dt><dd class="act-pills">${z.parking.map((p) => actPill(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`,'pin',esc(p.name),true)).join('')}</dd>
        <dt>Quote</dt><dd>${habitat[z.id].elevation.min}–${habitat[z.id].elevation.max} m (mediana ${habitat[z.id].elevation.median})</dd>
      </dl>${zoneMedia[z.id] ? `<p class="small muted">${creditLine(cov?.credit && zoneMedia[z.id] && cov.credit.page === zoneMedia[z.id].page ? cov.credit : zoneMedia[z.id])}</p>` : ''}`)}
    </div>`;
  box.querySelector('[data-cover]')?.addEventListener('click', () => openLightbox([{ src: cov.hd, alt: cov.alt, caption: captionHtml({ title: esc(z.name), credit: creditLine(cov.credit) }) }]));
  box.querySelector('[data-save-plan]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget, status = box.querySelector('[data-plan-status]');
    btn.disabled = true;
    try { await journal.savePlan(z.id, d.date, best.band); status.textContent = 'Previsione e dati salvati nel taccuino. Dopo l’uscita registra specie cercate, orario e ritrovamenti.'; }
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
  const drawCharts = () => $('#charts') && renderCharts($('#charts'), {
    dates: days.map((x) => x.date),
    rain: days.map((x) => sb.p[x.i]),
    score: days.map((x) => adjusted(z, x.score, x)),
    todayIndex: r.todayIndex - from,
    selectedIndex: r.todayIndex + state.dayOffset - from,
  });
  bindDetailSections(box, id => { if (id === 'meteo') drawCharts(); });
}

const fmtKm = (km) => km.toLocaleString('it-IT', { maximumFractionDigits: 1 });
const fmtM = (m) => (m >= 1000 ? `${fmtKm(m / 1000)} km` : `${Math.round(m / 10) * 10} m`);
// tratto a piedi in parole: sotto i 50 m il bosco e' praticamente a bordo strada
const walkTxt = (m) => (m < 50 ? 'il campione di habitat è <b>vicino alla strada</b>' : `circa <b>${fmtM(m)} in linea d’aria</b>`);
const SURF_LABEL = ['asfalto', 'strada bianca', 'sentiero o pista'];
const gmaps = directionsTo;

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
      <p class="muted small">Stima indicativa per la zona: giorno e festivi, notorietà stimata, facilità d’accesso, pioggia e andamento recente dell’indice. Non misuriamo le presenze.</p>
      <dl class="kv">
        <dt>Alba</dt><dd>verso le ${fmtRough(t.sunrise, 5)} · raccolta consentita dalle <b>${fmtRough(t.legal, 5, 'ceil')}</b> alle ${fmtRough(t.end, 5, 'floor')}</dd>
        <dt>Arrivo consigliato</dt><dd><b>entro le ${fmtRough(t.arrive, 15, 'floor')}</b>. ${esc(t.why)}</dd>
        ${(() => { const minutes=zoneTrip(z,walkFor(z,d,state.trailId)).minutes;if(!Number.isFinite(minutes))return `<dt>Partenza da ${esc(currentBase().name)}</dt><dd>Tempo in auto non disponibile: verifica nel navigatore.</dd>`;const dep = new Date(t.arrive.getTime() - (minutes + 10) * 6e4); return `<dt>Partenza da ${esc(currentBase().name)}</dt><dd>verso le ${fmtRough(dep, 15, 'floor')}</dd>`; })()}
      </dl>
      ${tips.length ? `<ul class="reasons">${tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

function renderAccess(z, d) {
  const acc = access[z.id] || [];
  const a0 = acc[0];
  const ax = d?.access;
  if (!a0 && !ax) return '';
  const lines = [];
  if (a0) {
    let txt = `Da ${esc(currentBase().name)} ${esc(travelText(travelTo(a0,a0)))}${!customBase()&&a0.roads.length ? ` via ${a0.roads.join(', ')}` : ''}.`;
    if(customBase())txt += ` Fino a ${esc(a0.parking)} (${a0.elevation} m). Verifica il fondo dell’ultimo accesso.`;
    else if (a0.unpaved_tail_km > 0.2) txt += ` Asfalto per ${fmtKm(a0.paved_km)} km${a0.transition?.after ? ` (fino a ${a0.transition.after})` : ''}, poi <b>${fmtKm(a0.unpaved_tail_km)} km di strada bianca</b>${a0.unpaved_surfaces.length ? ` (${a0.unpaved_surfaces.map((x) => ({ gravel: 'ghiaia', dirt: 'sterrato', compacted: 'fondo compatto' }[x] || x)).join(', ')})` : ''} fino a ${esc(a0.parking)}.`;
    else txt += ` Tutto su asfalto fino a ${esc(a0.parking)} (${a0.elevation} m).`;
    lines.push(txt);
  }
  if (ax) {
    lines.push(`<b>Punto più comodo per ${speciesLink(d.best.species, d.best.species.name.toLowerCase())}</b>: in auto ${ax.surface === 0 ? 'su asfalto' : `su ${SURF_LABEL[ax.surface]}`}${ax.road ? ` lungo ${esc(ax.road)}` : ''} fino al <a href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">punto sulla strada</a>, poi ${ax.walkM < 50 ? 'subito, a bordo strada,' : `<b>${fmtM(ax.walkM)} in linea d’aria</b> (in linea d'aria) fino a`} ${esc((SHORT[ax.cat] || ax.cat || 'paesaggio non classificato').toLowerCase())} a ${ax.e} m.`);
  }
  return `
    ${d.comfort ? `<p><span class="badge comfort-${d.comfort.level}">accesso ${d.comfort.level}</span></p>` : ''}
    <ul class="reasons access">${lines.map((x) => `<li>${x}</li>`).join('')}</ul>${customBase()?'<p class="small muted">Percorsi OSRM/OpenStreetMap, senza traffico. Se il percorso manca, la distanza è indicata in linea d’aria.</p>':''}
    ${acc.length > 1 ? `<p class="small muted">Altre soste: ${acc.slice(1).map((a) => `<a href="${gmaps(a.lat, a.lon)}" target="_blank" rel="noopener">${esc(a.parking)}</a> (${esc(travelText(travelTo(a,a)))}${!customBase()&&a.unpaved_tail_km > 0.2 ? `, ${fmtKm(a.unpaved_tail_km)} km di strada bianca` : ''})`).join(' · ')}</p>` : ''}`;
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

function trailProfile(zid, t, sp, band, heads = [], visualId = '') {
  const sm = t.samples || [];
  if (sm.length < 4 || sm.some(x => !Number.isFinite(x[0]))) return '';
  if (t.lines?.length > 1) return `<p class="small muted">Quote campionate tra ${Math.min(...sm.map(x => x[0]))} e ${Math.max(...sm.map(x => x[0]))} m su segmenti separati. Non costituiscono un profilo continuo.</p>`;
  const cats = trails[zid]?.sample_categories || [];
  const es = sm.map((x) => x[0]);
  const lo = Math.min(...es), hi = Math.max(...es);
  const W = 300, H = 70, n = sm.length;
  const X = (i) => (i / (n - 1)) * W;
  const Y = (e) => H - 6 - ((e - lo) / Math.max(1, hi - lo)) * (H - 18);
  const habitatKnown = sp?.forest && Number.isFinite(band);
  const ok = sm.map(([e, c]) => { const cat = c >= 0 ? cats[c] : 'non bosco'; return habitatKnown && sampleFits(sp,e,cat,band); });
  const line = sm.map(([e], i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(e).toFixed(1)}`).join('');
  const area = `${line}L${W} ${H}L0 ${H}Z`;
  const step = W / (n - 1);
  const good = sm.map(([e], i) => (ok[i] ? `<rect x="${(X(i) - step / 2).toFixed(1)}" y="${Y(e).toFixed(1)}" width="${step.toFixed(1)}" height="${(H - Y(e)).toFixed(1)}"/>` : '')).join('');
  // imbocchi sulla linea, numerati come i bottoni sotto il grafico
  const marks = heads.map((h, k) => { const x = headX(t, h); if (x == null) return ''; const i = Math.round(x * (n - 1)); return `<button type="button" class="tp-th" data-trail-head="${k}" aria-controls="${visualId}-head-${k}" aria-label="Mostra imbocco ${k + 1}${h.ele != null ? `, a ${h.ele} metri` : ''}" aria-pressed="false" style="--x:${(x * 100).toFixed(1)}%;top:${((Y(es[i]) / H) * 100).toFixed(1)}%">${k + 1}</button>`; }).join('');
  return `<figure class="tprof"><div class="tp-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Profilo del tratto nella zona: da ${es[0]} a ${es[n - 1]} m, tra ${lo} e ${hi} m">
      <path d="${area}" class="tp-area"/><g class="tp-good">${good}</g><path d="${line}" class="tp-line"/></svg>${marks}</div>
    <figcaption><span>${es[0]} m</span><span class="tp-key">${habitatKnown ? `<i></i><span>${sp.kind==='plant'?'paesaggio compatibile (proxy) per':'bosco compatibile con'} ${speciesLink(sp, sp.name.toLowerCase())}</span>` : 'Quote del tratto locale'}</span><span>${es[n - 1]} m</span></figcaption></figure>`;
}

let trailVisualId = 0;
const trailViews = new Map();
function trailVisual(z, t, d, heads = []) {
  const id = `trail-visual-${++trailVisualId}`, key = `${z.id}/${t.id}`;
  const view = trailViews.get(key) || 'profile', sketch = trailSketch(t, heads[0], heads.slice(1));
  const trace = sketch ? `<figure class="walk-sketch"><span class="trail-north" aria-hidden="true">N ↑</span><svg viewBox="${sketch.viewBox.map(n=>n.toFixed(1)).join(' ')}" role="img" aria-label="Schema del tratto locale orientato a nord${heads.length ? ', con accessi mappati numerati' : ''}">${sketch.paths.map(p => `<polyline points="${p}"/>`).join('')}${sketch.heads.map((p,k) => `<g class="trail-access" data-trail-head="${k}" aria-hidden="true"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8"/><text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central">${k+1}</text></g>`).join('')}</svg><figcaption>${sketch.paths.length > 1 ? 'Segmenti separati' : 'Tratto locale'}${heads.length ? ' · punti: accessi mappati' : ''}. Schema orientato a nord; usa la mappa del sentiero per orientarti.</figcaption></figure>` : '<p class="small muted">Tracciato non disponibile per questo tratto.</p>';
  const profile = trailProfile(z.id, t, d?.best?.species, d?.best?.band, heads,id) || '<p class="small muted">Profilo altimetrico non disponibile: mancano quote sufficienti per questo tratto.</p>';
  return `<div class="trail-visual" data-trail-view-key="${esc(key)}">
    <div class="trail-view-tabs" role="tablist" aria-label="Vista del tratto di ${esc(trailName(t))}">${[['profile','Profilo'],['trace','Tracciato']].map(([v,label]) => `<button type="button" role="tab" id="${id}-${v}-tab" data-trail-view="${v}" aria-selected="${view===v}" aria-controls="${id}-${v}" tabindex="${view===v?0:-1}">${label}</button>`).join('')}</div>
    <div class="trail-visual-panel" role="tabpanel" id="${id}-trace" data-trail-panel="trace" aria-labelledby="${id}-trace-tab" tabindex="0"${view!=='trace'?' hidden':''}>${trace}</div>
    <div class="trail-visual-panel" role="tabpanel" id="${id}-profile" data-trail-panel="profile" aria-labelledby="${id}-profile-tab" tabindex="0"${view!=='profile'?' hidden':''}>${profile}</div>
    ${heads.length ? `<div class="th-row"><span class="th-k">Imbocchi</span><div class="th-list">${heads.map((h,k)=>`<a class="th-chip" id="${id}-head-${k}" data-trail-head="${k}" data-trail-head-chip href="${gmaps(h.lat,h.lon)}" target="_blank" rel="noopener" aria-label="Indicazioni stradali per l’imbocco ${k+1}${h.ele!=null?`, a ${h.ele} metri`:''}"><i class="th-n">${k+1}</i>${h.kind==='strada'?IC.car:ICON.track}<span><b>${h.ele!=null?`${h.ele.toLocaleString('it-IT')} m`:'Imbocco'}</b><small>${esc(h.road||(h.kind==='strada'?'su strada':'su sterrata'))}</small></span></a>`).join('')}</div></div>` : ''}
  </div>`;
}
function selectTrailView(box, view) {
  trailViews.set(box.dataset.trailViewKey, view);
  document.querySelectorAll('.trail-visual').forEach(peer => {
    if (peer.dataset.trailViewKey !== box.dataset.trailViewKey) return;
    peer.querySelectorAll('[data-trail-view]').forEach(tab => { const selected=tab.dataset.trailView===view; tab.setAttribute('aria-selected',String(selected)); tab.tabIndex=selected?0:-1; });
    peer.querySelectorAll('[data-trail-panel]').forEach(panel => { panel.hidden=panel.dataset.trailPanel!==view; });
  });
}
function highlightTrailHead(box,index) {
  if(!box)return;
  box.querySelectorAll('[data-trail-head]').forEach(el=>{
    const active=el.dataset.trailHead===index;el.classList.toggle('is-active',active);
    if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(active));
  });
}
document.addEventListener('pointerover',e=>{
  const head=e.target.closest('[data-trail-head]');if(head)highlightTrailHead(head.closest('.trail-visual'),head.dataset.trailHead);
});
document.addEventListener('focusin',e=>{
  const head=e.target.closest('[data-trail-head]');if(head)highlightTrailHead(head.closest('.trail-visual'),head.dataset.trailHead);
});
document.addEventListener('click', e => {
  const head=e.target.closest('button[data-trail-head]');
  if(head){const box=head.closest('.trail-visual');highlightTrailHead(box,head.dataset.trailHead);box.querySelector(`[data-trail-head-chip][data-trail-head="${head.dataset.trailHead}"]`)?.focus({preventScroll:true});}
  const tab=e.target.closest('button[data-trail-view]');
  if(tab)selectTrailView(tab.closest('.trail-visual'),tab.dataset.trailView);
});
document.addEventListener('keydown', e => {
  const tab=e.target.closest('button[data-trail-view]');
  if(!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();
  const box=tab.closest('.trail-visual'),tabs=[...box.querySelectorAll('[data-trail-view]')],index=tabs.indexOf(tab);
  const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
  selectTrailView(box,next.dataset.trailView);next.focus();
});

function trailCard(z, t, d, top = false) {
  const facts = [
    t.difficulty && `<div><dt>Difficoltà</dt><dd>${difficultyLink(t.difficulty, `${t.difficulty} · ${DIFF[t.difficulty] || 'classificazione della fonte'}`)}</dd></div>`,
    t.total_km && t.total_km < 200 && `<div><dt>Intero</dt><dd>${fmtKm(t.total_km)} km${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div>`,
    `<div><dt>Nella zona</dt><dd>${fmtKm(t.in_zone_km)} km${t.goodKm != null ? `, di cui <b>${fmtKm(t.goodKm)} km</b> in ${d?.best?.kind==='plant'?'paesaggio compatibile (proxy)':'bosco adatto'}` : ''}</dd></div>`,
  ].filter(Boolean).join('');
  const heads = headsOf(z, t);
  return `<div data-glossary-context="Sentiero" class="tcard${top ? ' top' : ''}">
    <div class="tc-head">${segnavia(t)}<div class="tc-name"><b>${esc(trailName(t))}</b>${t.itinerary?.length > 2 ? `<small>${esc(t.itinerary.slice(1, -1).join(' · '))}</small>` : ''}${t.long ? '<small>tratto di un itinerario lungo</small>' : ''}${t.operator ? `<small>${esc(t.operator)}</small>` : ''}</div>${top ? '<span class="badge tc-top">In evidenza</span>' : ''}</div>
    <dl class="tc-facts">${facts}</dl>
    ${t.editorialNote?`<p class="small" data-glossary="Sentiero">${esc(t.editorialNote)}</p>`:''}
    ${trailVisual(z, t, d, heads)}

  </div>`;
}

function renderTrails(z, d) {
  const candidates = d?.best ? trailsFor(z, d.best.species, d.best.band) : (trails[z.id]?.trails || []);
  const walk = walkFor(z, d, state.trailId);
  const list = (walk ? [walk.t, ...candidates.filter(t => t.id !== walk.t.id)] : candidates).slice(0,4);
  if (!list.length) return trails[z.id] ? '<p class="small muted">Non risultano sentieri compatibili in questi dati: verifica tracciati, accessibilità e segnaletica sul posto.</p>' : '';
  return `
    <ol class="trails">${list.map((t, k) => `<li>${trailCard(z, t, d, k === 0)}<a class="more-row" href="${walkHref(z, state.dayOffset, t)}">Microzona e dettagli del sentiero</a>${trailLinks(z, t)}</li>`).join('')}</ol>
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
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Fronda" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${esc(name)}</name><desc>Tratto nella zona ${esc(z.name)}. Dati OpenStreetMap, licenza ODbL.</desc></metadata>${(t.lines || []).map((l) => `<trk><name>${esc(name)}</name><trkseg>${l.map((p) => `<trkpt lat="${p[0]}" lon="${p[1]}"/>`).join('')}</trkseg></trk>`).join('')}</gpx>`;
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
    <a class="tl-btn primary" href="${gmaps(go[0], go[1])}" target="_blank" rel="noopener" aria-label="${h ? 'Indicazioni stradali per l’accesso mappato' : 'Indicazioni per un punto sulla traccia: accesso non individuato'}">${h ? IC.car : IC.map}<span>${h ? 'Indicazioni' : 'Punto sulla traccia'}</span></a>
    <a class="tl-btn" href="${g.wm}" target="_blank" rel="noopener">${IC.map}<span>Mappa del sentiero</span></a>
    <a class="tl-btn" href="${g.gpx}" download="${esc(g.file)}">${ICON.download}<span>GPX del tratto locale</span></a>
    <a class="tl-btn" href="https://www.openstreetmap.org/relation/${t.id}" target="_blank" rel="noopener">${ICON.ext}<span>OpenStreetMap</span></a></div>`;
}

// --- testi legali e di sicurezza (data/legal.json, con ripiego prudente) ------
const LEGAL_KEY = 'fungaroli:legal-accepted';
function notebookPrivacyHtml(html) {
  // Solo testo editoriale: URL e identificativi dei vecchi diari restano validi.
  const template=document.createElement('template');template.innerHTML=String(html||'');
  const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) walker.currentNode.textContent=walker.currentNode.textContent.replace(/\b(diario|Diario)\b/g,word=>word==='Diario'?'Taccuino':'taccuino');
  return template.innerHTML;
}

function applyLegal() {
  const L = legal || {};
  if (L.home_strip) $('#home-legal .ar-s').textContent = L.home_strip;
  // emergenza e sezioni legali nella pagina Info
  const em = L.emergency;
  $('#emergency').innerHTML = `<h2>${esc(em?.title || 'Sospetto avvelenamento')}</h2>
    <ul class="reasons">${(em?.steps || ['Chiama subito il 112, anche senza sintomi.', 'Conserva i funghi avanzati, gli scarti e il resto del raccolto per i medici.']).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="em-numbers">${(em?.numbers || [{ label: 'Numero unico di emergenza', number: '112' }]).map((n) => `<a class="btn ${n.number === '112' ? 'primary' : 'ghost'}" href="tel:${esc(n.number.replace(/\s/g, ''))}">${esc(n.label)} · <b>${esc(n.number)}</b></a>`).join('')}</div>`;
  const zc = Object.entries(zoneMedia).map(([zid, m]) => `${esc(zones.find((z) => z.id === zid)?.name || zid)}: ${creditLine(m)}`);
  if (zc.length) $('#zone-credits').innerHTML = `<b>Foto dei luoghi</b> (Wikimedia Commons): ${zc.join(' · ')}.${Object.values(zoneMedia).some((m) => m.variants?.length) ? ' Le copertine delle altre stagioni e del meteo sono elaborate con AI a partire da queste foto, con la stessa attribuzione e licenza.' : ''}`;
  // preparazione e conservazione: regole per tutti i funghi (obbligatorie prima)
  if (prep?.general?.length && $('#prep-general')) $('#prep-general').innerHTML = prepGeneralHtml(prep.general);
  $('#legal-sections').innerHTML = (L.info_sections || []).map((x) => `<details><summary><h2>${esc(x.title)}</h2></summary><div class="method">${x.id==='privacy'?notebookPrivacyHtml(x.html).replace('Non chiediamo la tua posizione','Non richiediamo la posizione per usare l’app')+`<p>${esc(BASE_PRIVACY_TEXT)}</p>`:x.html}</div></details>`).join('');
  // primo avvio: avviso da confermare (si ripresenta se cambia la versione dei testi)
  const ver = String(L.version || 0) + (L.verified_on || '');
  let accepted = null;
  try { accepted = localStorage.getItem(LEGAL_KEY); } catch { /* ignora */ }
  if (accepted !== ver) {
    const dlg = $('#onboarding');
    dlg.querySelector('h2').textContent = L.onboarding?.title || 'Prima di usare l\'app';
    const sub = $('#ob-sub'); if (sub) { sub.textContent = L.onboarding?.subtitle || ''; sub.hidden = !sub.textContent; }
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
  const botanical=botanicalById(id);if(botanical)return;
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
  const message = `<div class="error">Errore di avvio: ${esc(e.message)}</div>`;
  $('#hero').innerHTML = message;
  $('#detail').innerHTML = message;
});
