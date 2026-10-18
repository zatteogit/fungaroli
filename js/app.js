import {initAnimals,animals,animalName,animalSearchItems,renderAnimals,renderAnimalPage} from './animals.js';
import {configureLegalAccess,acceptLegalNotice,hasLegalAcceptance} from './legal-access.js';
import {currentLegalNotice,legalNoticeVersion,legalNoticeFingerprint} from './legal-notice.js';
import {rememberNavigationContext,recordNavigationPage,restoreNavigationContext,contextualBackTitle,returningNavigation,restoredNavigationScroll,backNavigation} from './navigation-context.js';
import {openModal} from './modal-flow.js';
import {speciesFeatures} from './species-search.js';
import './modal-scroll.js';
import {factCards,enhanceContentReading} from './content-ui.js';
import {enhanceEntityAccordions} from './entity-accordions.js';
import {plannedDeparture, recommendedStartAvailable, calendarDate} from './planning-time.js';
import {speciesObservationContext} from './species-context.js';
import { mapQuery, mountMapResults, compactMapFilters } from './map-experience.js';
import './index-tip.js';
import { leafGlyph, notebookGlyph, carGlyph } from './ui-icons.js';
import {fungusGlyph, progressCircle, weatherGlyphs} from './indicators.js';
import { INTENTS, validIntent, normalizeInterests, primaryInterest, toggleInterest, seasonalSelection, matchesWalk, compareOutdoor } from './outing-intent.js';
import './rails.js';
import {outingDiscoveries} from './outing-discoveries.js';
import {renderBotanicalWhy} from './botanical-explanation.js';
import {initPlants,plants,plantName,plantRecord,plantThumb,plantHeroSrc,renderPlants,renderPlantPage} from './plants.js';
import {botanicalModels} from './botanical-model.js';
import './theme.js';
import './images.js';
import { consumeFresh, freshDone } from './refresh.js';
import {updateWeatherHTML,updateHTMLTracked,reconcileChildren,keepWeatherReadingPosition} from './weather-dom.js';
import { SPECIES, GROUPS, FOREST } from './species.js';
import { scoreZoneDay, scoreSpecies, habitatAtBand, habitatPotential, elevationFit, combine, classOf, scoreLabel, scoreShortLabel, formatIndex, MODEL_VERSION, PARAMS, CLASSES } from './model.js';
import { todayISO, loadWeather } from './weather.js';
import { weatherErrorMessage } from './weather-request.js';
import { initJournal } from './journal.js';
import { renderSvgMap } from './svgmap.js';
import { initSpeciesCards, thumb as fungusThumb, renderSpeciesDetail, speciesHeroSrc, whereSummary, criticalRule as fungusCriticalRule, criticalRuleOf as fungusCriticalRuleOf, speciesPhoto as fungusPhoto, speciesPhotos as fungusPhotos } from './speciescard.js';
import { speciesLink } from './species-link.js';
import { initEntitySheets, openEntitySheet } from './entity-sheet.js';
import {initBaseLocation,currentBase,customBase,travelTo,travelText,directionsTo,BASE_PRIVACY_TEXT} from './base-location.js';
import { initLearning, renderGlossary, renderFieldIdentify, difficultyLink, glossaryTerms, glossaryTitle, enhanceGlossary } from './learning.js';
import { openLightbox, captionHtml } from './lightbox.js';
import { initInstall, maybeInvite } from './install.js';
import { loadOuting, outingFor, OUTING_LABEL, OUTING_SHORT, OUTING_RANK } from './outing.js';
import { initIdentify, renderIdentify, renderComparisonStart, setCompare, searchTaxa, openTaxon, renderTaxonPage, renderTaxonView, taxonHeroSrc, taxonName, taxonByKey, attentionLine, sourceRows } from './identify.js';
import { initSearch } from './search.js';
import { renderGuidedKey } from './guided-key.js';
import { renderWhy, renderMethod, drawWhyCharts } from './science.js';
import { navigate, soft, setCoverResolver } from './motion.js';
import { applyCrop } from './images.js';
import { FOREST_LEGEND } from './forest-legend.js';
import { initTrees, renderTreeGrid, renderTreePage, linkTrees, treeChips, treeForCategory, treeThumb, treePhotoSrc, treeHeroSrc } from './trees.js';
import { crowding, comfortScore, timingAdvice, sunTimes, fmtTime, fmtRough, intornoA } from './human.js';
import { initCommunity, communityStatus, communityRank, communityHasZone, communityDataAvailable, reportBadge } from './community.js';
import { guideTitle, renderGuideCards, renderGuide, initGuideContent, guideCount } from './guides.js';
import { buildEdibleCatalog, seasonStatus, seasonLabel } from './edible-catalog.js';
import { mountSpeciesAutocomplete } from './species-autocomplete.js';
import { uniquePlaceProposals, chooseWalkTrail, walkContext, trailSketch, fullTrailKm } from './walks.js';
import { cardLatin } from './names.js';
import { pickCover } from './zone-cover.js';
import { initAmbilight, ambiFollow } from './ambilight.js';
import { initChallenges, renderChallengeList, renderChallenge, challengeTitle, challengeList, challengeProgressOf, suggestedChallenge } from './challenges.js';

const HISTORY_DAYS = 30;   // giorni passati mostrati nel grafico
const AHEAD_DAYS = 7;      // giorni futuri valutati
const PREFS_KEY = 'fungaroli:prefs:v2'; // v2: si parte con tutti i gruppi

const $ = (s) => document.querySelector(s);

function addNotebookReference(box,kind,id,title){if(!box||!title||box.querySelector('[data-note-kind]'))return;const button=box.querySelector('.notebook-context-action')||document.createElement('button');button.type='button';button.className='btn ghost notebook-context-action';button.dataset.noteKind=kind;button.dataset.noteId=id;button.dataset.noteTitle=title;button.innerHTML=notebookGlyph+'<span>'+esc(({fungo:'Annota questo fungo nel taccuino',specie:'Annota questo fungo nel taccuino',commestibile:'Annota questo fungo nel taccuino',pianta:'Annota questa pianta nel taccuino',albero:'Annota questo albero nel taccuino',guide:'Salva questa lettura nel taccuino'}[kind]||'Aggiungi una nota al taccuino'))+'</span>';const hero=box.querySelector('.phero-body'),target=box.querySelector('.pbody'),lead=box.querySelector('.article-lede');if(hero){button.classList.add('notebook-hero-action');hero.append(button);}else if(target)target.prepend(button);else if(lead)lead.after(button);else box.append(button);}
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
const hasInterest=id=>state.interests.includes(id);
const plantCatalog=()=>plantModels.map(p=>({...p,modelId:p.id,aliases:plantRecord(p.plantId)?.aliases||[],months:p.phaseMonths}));
const activeCatalog=()=>[...(hasInterest('funghi')?catalog:[]),...(hasInterest('piante')?plantCatalog():[])];
const selectionFor=id=>botanicalById(id)?state.plantIds:state.speciesIds;
const setSelectionFor=(id,ids)=>{if(botanicalById(id))state.plantIds=ids;else state.speciesIds=ids;};
const activeIds=()=>{
  if((!hasInterest('funghi')||state.speciesIds===null)&&(!hasInterest('piante')||state.plantIds===null))return null;
  return new Set(activeCatalog().filter(s=>selectionFor(s.id)===null||selectionFor(s.id).has(s.id)).map(s=>s.id));
};
const setActiveIds=ids=>{if(hasInterest('funghi'))state.speciesIds=ids===null?null:new Set([...ids].filter(id=>!botanicalById(id)));if(hasInterest('piante'))state.plantIds=ids===null?null:new Set([...ids].filter(id=>botanicalById(id)));};
const activeGroups=()=>[...(hasInterest('funghi')?GROUPS:[]),...(hasInterest('piante')?plantModels.map(p=>({id:p.group,label:p.name,rep:p.id})):[])];
let homeDateManual = false, mapDateManual = false;
const state = {
  target: 'funghi',interests:['funghi'],easyTrails:false,shortTrails:false,seasonOverride:null,seasonSuspended:null,plantIds:null,useBotanicalNotes:false,showDiscoveries:true,communityOnly:false,
  speciesIds: null, // null = tutto il catalogo; Set = selezione individuale
  // La prima data viene adattata agli orari pratici appena i dati sono disponibili.
  dayOffset: 0,
  zoneId: null,
  trailId: null,
  distancePenalty: false,
  avoidCrowd: false,
  preferComfort: false,
  homeDay: 0,   // null = settimana, quando scelta esplicitamente
  view: 'uscite',
};
try {
  const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
  if (p) {
    state.interests=normalizeInterests(p.interests,p.target);state.target=primaryInterest(state.interests);state.easyTrails=p.easyTrails===true;state.shortTrails=p.shortTrails===true;state.seasonOverride=p.seasonOverride||null;state.seasonSuspended=p.seasonSuspended&&INTENTS.some(i=>i.id===p.seasonSuspended.target)?{target:p.seasonSuspended.target,ids:Array.isArray(p.seasonSuspended.ids)?p.seasonSuspended.ids.filter(x=>typeof x==='string'):null}:null;state.plantIds=Array.isArray(p.plantIds)?new Set(p.plantIds.filter(x=>typeof x==='string')):null;
    state.communityOnly=p.communityOnly===true;state.useBotanicalNotes=p.useBotanicalNotes===true;state.showDiscoveries=p.showDiscoveries!==false;
    if ('speciesIds' in p) state.speciesIds = Array.isArray(p.speciesIds) ? new Set(p.speciesIds.filter(x => typeof x === 'string')) : null;
    else {
      const groups = (p.groups || []).filter(g => GROUPS.some(x => x.id === g));
      if (groups.length && groups.length !== GROUPS.length) state.speciesIds = new Set(SPECIES.filter(s => groups.includes(s.group)).map(s => s.id));
    }
    state.distancePenalty = !!p.distancePenalty; state.avoidCrowd = !!p.avoidCrowd; state.preferComfort = !!p.preferComfort;
  }
} catch { /* preferenze non disponibili */ }
const savePrefs = () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ interests:state.interests,target:state.target,easyTrails:state.easyTrails,shortTrails:state.shortTrails,seasonOverride:state.seasonOverride,seasonSuspended:state.seasonSuspended,showDiscoveries:state.showDiscoveries,communityOnly:state.communityOnly,useBotanicalNotes:state.useBotanicalNotes,plantIds:state.plantIds===null?null:[...state.plantIds],speciesIds: state.speciesIds === null ? null : [...state.speciesIds], distancePenalty: state.distancePenalty, avoidCrowd: state.avoidCrowd, preferComfort: state.preferComfort })); } catch { /* ignora */ }
};
const selectedCatalog = () => activeIds()===null?activeCatalog():activeCatalog().filter(s=>activeIds().has(s.id));
const filterDate = () => calendarDate(todayISO(), state.view === 'uscite' ? state.homeDay || 0 : state.dayOffset);
const groupMembers = (id) => activeCatalog().filter(s => s.group === id);
const groupSelection = (id) => {
  const selection=activeIds(),members = groupMembers(id), n = members.filter(s => selection === null || selection.has(s.id)).length;
  return n === members.length ? 'full' : n ? 'partial' : 'none';
};
function toggleGroup(id) {
  const members=groupMembers(id);if(!members.length)return;
  let selection=selectionFor(members[0].id);
  if(selection===null)selection=new Set(members.map(s=>s.id));
  else {const remove=members.every(s=>selection.has(s.id));members.forEach(s=>remove?selection.delete(s.id):selection.add(s.id));if(!selection.size)selection=null;}
  setSelectionFor(members[0].id,selection);
}
function addSpecies(id) {
  if(!activeCatalog().some(s=>s.id===id))return;
  const selection=new Set(selectionFor(id)||[]);selection.add(id);setSelectionFor(id,selection);
}
function removeSpecies(id) {
  const selection=selectionFor(id);if(!selection)return;
  selection.delete(id);setSelectionFor(id,selection.size?selection:null);
}
const outOfSeason = (id) => { const members = groupMembers(id); return members.length && members.every(s => seasonStatus(s, filterDate()) === 'out'); };

let zones, weatherZones, origin, habitat, access, trails, traits, legal, series, results, map, zoneLayers = {}, zoneMedia = {}, outing = null;
let baseMarker=null;
function zoneTrip(z,walk=null) {
  const a=access?.[z.id]?.[0],target=customBase()&&walk?.h ? walk.h : a||z.parking?.[0]||z;
  return travelTo(target,{minutes:a?.minutes??z.drive_min,km:a?.km??z.drive_km});
}
function practicalTiming(z, d, walk = null) {
  const trip = zoneTrip(z, walk);
  let arrive;
  if (state.target === 'funghi' || !walk?.t?.duration) {
    arrive = timingAdvice({dateStr:d.date, lat:z.lat, lon:z.lon, crowd:d.crowd || {level:'basso'}}).arrive;
  } else {
    const [hours, minutes = 0] = String(walk.t.duration).split(':').map(Number);
    const duration = hours * 60 + minutes;
    const sunset = sunTimes(d.date, z.lat, z.lon).sunset;
    arrive = new Date(sunset.getTime() - (Number.isFinite(duration) ? duration : 0) * 60000);
  }
  const departure = plannedDeparture(arrive, trip.minutes);
  return {arrive, departure, available:recommendedStartAvailable({date:d.date, today:todayISO(), arrive, travelMinutes:trip.minutes})};
}
function syncAutomaticDates() {
  if (!results || !zones?.length) return false;
  const availableToday = bestOfDay(0, true);
  let day = availableToday ? 0 : 1;
  if (!availableToday) {
    for (let o = 1; o <= AHEAD_DAYS; o++) if (bestOfDay(o)) { day = o; break; }
  }
  let changed = false;
  if (!homeDateManual && state.homeDay !== day) {
    state.homeDay = day; homeProposalKeys = []; changed = true;
  }
  if (!mapDateManual) {
    const zone = zones.find(z => z.id === state.zoneId), today = zone && dayEntry(zone.id, 0);
    const mapDay = today ? (practicalTiming(zone, today, walkFor(zone,today)).available ? 0 : 1) : day;
    if (state.dayOffset !== mapDay) { state.dayOffset = mapDay; changed = true; }
  }
  return changed;
}
let planningDate = todayISO();
function refreshPlanningClock() {
  if (document.hidden || !results) return;
  const nextDate = todayISO(), newDate = nextDate !== planningDate;
  planningDate = nextDate;
  if (newDate) homeProposalKeys = [];
  if (syncAutomaticDates() || newDate) { renderAll(); renderFilterSummary(); }
}
setInterval(refreshPlanningClock, 60000);
document.addEventListener('visibilitychange', refreshPlanningClock);
addEventListener('focus', refreshPlanningClock);

const compactTravel=t=>Number.isFinite(t.minutes)?`${t.minutes}<span class="fk2"> min</span><span class="fk3">′</span>`:`${fmtKm(t.airKm)} km <abbr title="In linea d’aria" aria-label="in linea d’aria">l.d.</abbr>`;
function proximityMultiplier(z) {
  const t=zoneTrip(z),distance=customBase()?(t.km??t.airKm)/100:(t.minutes??0)/120;
  return 1-0.3*Math.min(1,distance);
}
const hasLeaflet = () => typeof globalThis.L !== 'undefined';

// caricamento iniziale: i passi del loader si spuntano man mano (index.html, .loader)
function loadStep(n) {
  // l'avvio prosegue: via l'avviso del controllo a tempo di index.html (rete lenta, non ferma), torna il caricamento
  document.querySelector('#hero .boot-fail')?.remove();
  $('#hero')?.classList.remove('boot-stalled');
  document.querySelectorAll('.loader .ld-steps li').forEach((li) => {
    const k = +li.dataset.step;
    li.classList.toggle('done', k < n); li.classList.toggle('now', k === n);
  });
}
async function init() {
  initAmbilight();
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
  initGuideContent(embedded?.guides || await load('guides'),contentCopy,embedded?(f)=>embedded.assets?.[f]||'':null);
  for(const[selector,key]of [['#home-h','homeTitle'],['#others-h','otherPlacesTitle'],['#season-h','speciesTitle']])if(contentCopy[key]&&$(selector))$(selector).textContent=contentCopy[key];
  legal = currentLegalNotice(embedded ? embedded.legal : await load('legal'));
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
  document.addEventListener('fungaroli:community', () => { renderCommunityIntro(); if(state.communityOnly)outCache.clear();if (results) paintWeatherView(); });
  initIdentify({
    traits: stj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, thumb, zones, banner: legal?.identify_banner,
    howTo: (eid, latin) => idj?.species?.[eid]?.lookalikes?.find((l) => l.latin === latin)?.how_to_tell || '',
    potential: (sid, zid) => { const sp = SPECIES.find((x) => x.id === sid); const z = zones.find((x) => x.id === zid); return sp && z ? potentialOf(sp, z) : null; },
  });
  renderSpeciesGrid();
  await applyLegal();
  initTrees({ trees: trj, media: mj, assetUrl: embedded ? (f) => embedded.assets?.[f] || '' : (f) => f, zones, habitat, thumb });
  initAnimals(embedded?.animals||await load('animals'),embedded?(f)=>embedded.assets?.[f]||'':(f)=>f);
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

  checkSavedSeason();
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
    const file=image?.file_hd||image?.file||image?.thumb;return file?{file:assetSrc(file)}:null;
  };
  journal = initJournal({ noteCatalogs:()=>({fungo:Object.entries(stj.taxa).map(([id,t])=>({name:t.name||t.latin,latin:t.latin,href:t.edible_id&&!t.lookalike_of?.length?'#/specie/'+t.edible_id:'#/fungo/'+id})),botanica:plants().map(p=>({name:p.name,latin:p.latin,href:'#/pianta/'+p.id})),albero:Object.entries(trj.trees).map(([id,t])=>({name:t.name,latin:t.latin,href:'#/albero/'+id}))}),onEntries:entries=>{botanicalNotes=entries.filter(e=>e.kind==='note'&&e.observation);if(series){compute();outCache.clear();if(weatherBusy)paintWeatherView();else renderAll();}},zones, speciesCatalog: catalog, predict, captureForecast, getZoneId: () => state.zoneId || zones[0].id, zoneImage:zid=>assetSrc(zoneMedia[zid]?.file_hd||zoneMedia[zid]?.file||''),referenceImage:notebookReferenceImage });
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
// il ritorno ripristina la posizione salvata dall'app, non quella del browser (che arriverebbe prima della transizione, con uno scatto)
try { history.scrollRestoration = 'manual'; } catch { /* non supportato */ }
// navigazione partita da un tocco o da un tasto dentro l'app: solo allora il focus segue la pagina nuova
let userNavAt = -1e9, userNavTo = '';
function initShell() {
  addEventListener('hashchange', () => { navDepth++; route(); });
  // la riga dell'età del meteo nella scheda della zona segue la rete
  ['online', 'offline'].forEach((ev) => addEventListener(ev, () => { if (state.view === 'zona' && results) keepWeatherReadingPosition(renderDetail); }));
  document.addEventListener('click', (e) => {
    // il link toccato (o «indietro»): conta solo se è proprio lui a cambiare pagina, non se apre una scheda sopra
    const nav = e.target.closest('a[href^="#/"], [data-back]');
    if (nav) { userNavAt = performance.now(); userNavTo = nav.matches('[data-back]') ? 'back' : nav.getAttribute('href'); }
    // sezione già aperta toccata di nuovo nella barra: torna in cima, come nelle app
    const tab = e.target.closest('.tabbar a[aria-current="page"]');
    if (tab && tab.getAttribute('href') === (location.hash || '#/')) { e.preventDefault(); scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); return; }
    if (!e.target.closest('[data-back]')) return;
    // indietro vero se la pagina precedente e' nell'app, altrimenti la pagina "madre"
    if (!backNavigation()) location.hash = parentOf(prev);
  });
  renderFilterSummary();
}

// Scopri: tre cataloghi con riconoscimento in pannello; Guide raccoglie i contenuti sul bosco.
const SCOPRI = [['funghi', '#/specie', 'Funghi'], ['piante', '#/piante', 'Piante e fiori'], ['alberi', '#/alberi', 'Alberi'], ['animali', '#/animali', 'Animali'], ['impara', '#/impara', 'Guide']];
const SCOPRI_SUB = {
  funghi: [['#/specie', 'Sfoglia'], ['#/riconosci', 'Impara a riconoscere'], ['#/confronta','Confronta']],
  piante: [['#/piante', 'Sfoglia'], ['#/riconosci/piante', 'Impara a riconoscere']],
  alberi: [['#/alberi', 'Sfoglia'], ['#/riconosci/alberi', 'Impara a riconoscere']],
  animali: [],
  impara: [['#/glossario', 'Glossario'], ['#/guide', 'Approfondimenti'], ['#/riconosci/bosco', 'Bosco e sentiero'], ['#/sfide', 'Sfide']],
};
const RECOGNIZE_HEAD = {
  funghi: ['Funghi', 'Descrivi quello che vedi: le domande restringono il confronto e mostrano i sosia.'],
  piante: ['Piante e fiori', 'Cerca per caratteri: foglie, fiori, frutti e ambiente.'],
  alberi: ['Alberi', 'Foglie, corteccia e frutti: confronta i caratteri passo per passo.'],
  bosco: ['Bosco e sentiero', 'Tracce, segni e dettagli che incontri camminando.'],
};
function scopriPlace(r) {
  if (r.view === 'riconosci' && r.compareStart) return ['funghi','#/confronta'];
  if (r.view === 'riconosci') return [r.recognizeMode === 'bosco' ? 'impara' : r.recognizeMode, r.recognizeMode === 'bosco' ? '#/riconosci/bosco' : SCOPRI_SUB[r.recognizeMode][1][0]];
  return { animali:['animali','#/animali'], specie: ['funghi', '#/specie'], piante: ['piante', '#/piante'], alberi: ['alberi', '#/alberi'], impara: ['impara', '#/impara'], glossario: ['impara', '#/glossario'], 'guide-list': ['impara', '#/guide'], sfide: ['impara', '#/sfide'] }[r.view] || null;
}
function paintScopriNav(r) {
  const place = scopriPlace(r), view = document.querySelector(`.view[data-view="${r.view}"]`);
  if (!place || !view) return;
  const [sec, here] = place, cur = (on) => (on ? ' aria-current="page"' : '');
  const nav = view.querySelector('[data-scopri-nav]'), sub = view.querySelector('[data-scopri-sub]');
  // dentro Impara (glossario, guide, bosco e sentiero, sfide) niente terzo livello: resta solo la riga delle sotto-schede;
  // la riga delle sezioni di Scopri sta nella pagina indice di Impara, raggiungibile con «indietro» o dalla barra
  const inLearning = sec === 'impara' && r.view !== 'impara';
  if (nav) { nav.hidden = inLearning; nav.innerHTML = inLearning ? '' : SCOPRI.map(([id, href, label]) => `<a href="${href}" data-section="${id}"${cur(id === sec)}>${label}</a>`).join(''); }
  // la pagina indice di Impara mostra già le sue parti come card: sotto-schede solo nelle pagine interne
  if (sub) {
    const catalog = ['specie','piante','alberi'].includes(r.view);
    sub.classList.toggle('recognize-entry', catalog);
    sub.innerHTML = catalog ? `<button type="button" class="btn ghost" data-open-recognition="${sec}" aria-haspopup="dialog"><svg class="recognize-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>${sec === 'funghi' ? '<path d="M6 11c0-5 8-5 8 0ZM9 11v3h2v-3"/>' : '<path d="M7 13c-2-4 0-7 6-7 0 6-2 8-6 7Zm0 0 4-4"/>'}</svg><span>Impara a riconoscere</span><span aria-hidden="true">→</span></button>` : sec !== 'impara' || r.view === 'impara' ? '' : SCOPRI_SUB[sec].map(([href, label]) => `<a href="${href}"${cur(href === here)}>${label}</a>`).join('');
    if(catalog && sec==='funghi') sub.insertAdjacentHTML('beforeend','<a class="btn ghost compare-entry" href="#/confronta">Confronta <span aria-hidden="true">↔</span></a>');
  }
}

let recognitionDialog, recognitionOrigin;
document.addEventListener('click', e => {
  const trigger=e.target.closest('[data-open-recognition]');if(!trigger)return;
  const mode=trigger.dataset.openRecognition;
  if(!recognitionDialog){
    recognitionDialog=document.createElement('dialog');recognitionDialog.className='entity-sheet recognition-sheet';recognitionDialog.setAttribute('aria-labelledby','recognition-title');
    recognitionDialog.innerHTML='<header class="entity-toolbar"><h2 id="recognition-title"></h2><button type="button" class="icon-btn" data-close-recognition aria-label="Chiudi Impara a riconoscere">×</button></header><div class="recognition-content"></div>';
    document.body.append(recognitionDialog);
    recognitionDialog.querySelector('[data-close-recognition]').addEventListener('click',()=>recognitionDialog.close());
    recognitionDialog.addEventListener('close',()=>{recognitionDialog.querySelector('.recognition-content').replaceChildren();document.documentElement.classList.remove('recognition-open');recognitionOrigin?.isConnected&&recognitionOrigin.focus({preventScroll:true});});
    addEventListener('hashchange',()=>recognitionDialog.close());
  }
  recognitionOrigin=trigger;
  recognitionDialog.querySelector('#recognition-title').textContent=`Impara a riconoscere · ${RECOGNIZE_HEAD[mode][0]}`;
  const box=document.createElement('div');box.className='recognition-content';recognitionDialog.querySelector('.recognition-content').replaceWith(box);
  // Un solo percorso attivo: evita ID duplicati con le pagine raggiunte da vecchi link.
  $('#identify').replaceChildren();$('#field-identify').replaceChildren();
  if(mode==='funghi'){setCompare('','');renderIdentify(box);}
  else if(mode==='piante')renderGuidedKey(box,'piante',{items:plants().map(p=>({id:p.id,name:p.name,latin:cardLatin(p.latin),href:`#/pianta/${encodeURIComponent(p.id)}`,danger:p.category==='Pericolose'})),thumb:plantThumb});
  else renderGuidedKey(box,'alberi',{items:Object.entries(treesData?.trees||{}).map(([id,t])=>({id,name:t.name,latin:cardLatin(t.latin),href:`#/albero/${encodeURIComponent(id)}`})),thumb:treeThumb});
  openModal(recognitionDialog);document.documentElement.classList.add('recognition-open');enhanceGlossary(box);
});

function parseRoute(hash = location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  const [a, b, c] = parts;
  if (a === 'zona' && (weatherZones||zones).some((z) => z.id === b)) return { view: 'zona', zoneId: b, offset: Math.max(0, Math.min(AHEAD_DAYS, +c || 0)), trailId: parts[3] === 'sentiero' && (trails[b]?.trails || []).some(t => String(t.id) === parts[4]) ? parts[4] : null };
  if (a === 'mappa') return { view: 'mappa', zoneId: b };
  if (a === 'specie' && b) return { view: 'specie-dettaglio', speciesId: b };
  if (a === 'specie' || a === 'scopri') return { view: 'specie' };
  if (a === 'impara') return { view: 'impara' };
  if (a === 'glossario') return { view: 'glossario', termId: b };
  if (a === 'albero' && b) return { view: 'albero', treeId: b };
  if (a === 'animali') return {view:'animali'};
  if (a === 'animale' && b) return {view:'animale',animalId:b};
  if (a === 'piante') return {view:'piante'};
  if (a === 'pianta' && b) return {view:'pianta',plantId:b};
  if (a === 'alberi') return { view: 'alberi' };
  if (a === 'confronta') return b&&c&&b!==c
    ? {view:'riconosci',recognizeMode:'funghi',compare:b,pick:c}
    : {view:'riconosci',recognizeMode:'funghi',compareStart:true,compareLeft:b,compareRight:c};
  if (a === 'riconosci') return { view: 'riconosci', recognizeMode: ['alberi','piante','bosco'].includes(b) ? b : 'funghi', compareStart:b==='confronta'&&!c, compare: b === 'confronta' ? c : '', pick: b === 'confronta' ? parts[3] : '' };
  if (a === 'guide') return b ? { view: 'guide', guideId: b } : { view: 'guide-list' };
  if (a === 'sfide') return { view: 'sfide', challengeId: b || '' };
  if (a === 'diario') return { view: 'diario', notebookDemo:b==='esempio', notebookEntry:['pagina','esempio'].includes(b)?c||'':'' };
  if (a === 'info') return { view: 'info' };
  if (a === 'metodo') return { view: 'metodo' };
  if (a === 'commestibile' && b) return { view: 'commestibile', speciesId: b };
  if (a === 'fungo' && b) return { view: 'fungo', taxonId: b };
  return { view: 'uscite' };
}

// profondita' e posizione delle viste: decidono la direzione della transizione
const LEVEL = { animale:1, pianta:1, commestibile: 1, guide: 2, zona: 1, 'specie-dettaglio': 1, albero: 1, info: 1, metodo: 2, fungo: 1, glossario: 1, 'guide-list': 1, sfide: 1 };
const TABS = ['uscite', 'mappa', 'specie', 'diario'];
// posizione delle schede di Scopri (Funghi, Piante, Alberi, Impara e le loro sotto-schede): tra loro si passa in dissolvenza
const SUB = { animali:8, specie: 0, alberi: 1, piante:2, riconosci: 3, glossario: 4, 'guide-list': 5, sfide: 6, impara: 7 };
// una sfida aperta è un livello sotto l'elenco delle sfide
const levelOf = (r) => (LEVEL[r.view] || 0) + (r.compare ? 2 : 0) + (r.challengeId ? 1 : 0) + (r.notebookEntry ? 1 : 0) + (r.view === 'riconosci' && r.recognizeMode === 'bosco' ? 1 : 0);
const scrollMem = new Map();
let prev = null;
function navKind(a, b) {
  if (!a) return 'none';
  const la = levelOf(a), lb = levelOf(b);
  const ta = TABS.indexOf(a.tab), tb = TABS.indexOf(b.tab);
  // tocco sulla barra delle sezioni (la radice di un'altra sezione): dissolvenza, anche partendo da una pagina interna
  if (ta !== tb && ta >= 0 && tb >= 0 && lb === 0) return tb > ta ? 'right' : 'left';
  if (lb > la) return 'push';
  if (lb < la) return 'pop';
  // stessa vista: cambia solo il catalogo di «Impara a riconoscere» (funghi, piante, alberi) è una scheda accanto
  if(a.view==='diario'&&b.view==='diario'&&(a.notebookEntry!==b.notebookEntry||a.notebookDemo!==b.notebookDemo))return 'right';
  if (a.view === b.view) return a.view === 'riconosci' && a.recognizeMode !== b.recognizeMode ? 'right' : 'none';
  if (ta !== tb && ta >= 0 && tb >= 0) return tb > ta ? 'right' : 'left';
  if (a.view in SUB && b.view in SUB) return SUB[b.view] > SUB[a.view] ? 'right' : 'left';
  return 'none';
}

// La barra mobile lascia spazio scendendo e torna dopo un breve movimento verso l'alto.
const mobileHeader = matchMedia('(max-width:899px)');
let headerScrollAnchor = 0;
let headerScrollDirection = 0;
let headerLastY = 0;
function revealHeader() {
  document.documentElement.classList.remove('header-away');
  headerScrollAnchor = Math.max(0, scrollY);
  headerScrollDirection = 0;
  headerLastY = headerScrollAnchor;
}
function updateHeaderScroll() {
  const y = Math.max(0, scrollY);
  if (!mobileHeader.matches || watchedTitle?.isConnected || y < 64 || ['mappa','uscite'].includes(document.body.dataset.page) || document.querySelector('.appbar[data-context="comparison"]') || document.querySelector('.appbar :focus-visible')) {
    revealHeader();
    return;
  }
  const direction = Math.sign(y - headerLastY);
  const previousY = headerLastY;
  headerLastY = y;
  if (!direction) return;
  if (direction !== headerScrollDirection) {
    headerScrollDirection = direction;
    headerScrollAnchor = previousY;
  }
  if (Math.abs(y - headerScrollAnchor) >= 20) {
    document.documentElement.classList.toggle('header-away', direction > 0);
    headerScrollAnchor = y;
  }
}
$('.appbar').addEventListener('focusin', revealHeader);
addEventListener('hashchange', revealHeader);
mobileHeader.addEventListener('change', revealHeader);
// Sulle pagine con la foto in testata la barra diventa piena solo dopo la foto.
function onScrollBar() {
  updateCompactTitle();
  updateHeaderScroll();
  const h = document.querySelector('.view:not([hidden]) .phero');
  document.documentElement.classList.toggle('scrolled', !h || scrollY > h.offsetHeight - 70);
}
let headerFrame=0;
function scheduleHeader(){if(!headerFrame)headerFrame=requestAnimationFrame(()=>{headerFrame=0;onScrollBar();});}
addEventListener('scroll',scheduleHeader,{passive:true});
addEventListener('resize',scheduleHeader,{passive:true});
globalThis.visualViewport?.addEventListener('resize',scheduleHeader,{passive:true});

// tasto indietro in alto a sinistra: freccia + nome della pagina a cui torni
const TITLES = { animali:'Animali', piante:'Piante e fiori', uscite: 'Uscite', mappa: 'Mappa', specie: 'Funghi', alberi: 'Alberi', riconosci: 'Riconosci', impara: 'Guide', glossario: 'Glossario', 'guide-list': 'Approfondimenti', sfide: 'Sfide', diario: 'Taccuino', info: 'Regole e metodo', metodo: 'Come funziona' };
function titleOf(r) {
  if (!r) return '';
  if (r.view === 'diario' && r.notebookEntry) return journal?.entryTitle(r.notebookEntry,r.notebookDemo)||'Pagina del taccuino';
  if (r.view === 'diario' && r.notebookDemo) return 'Diario di prova';
  if (r.view === 'zona') { const z = (weatherZones||zones).find((x) => x.id === r.zoneId); return z ? splitName(z)[0] : 'Zona'; }
  if (r.view === 'specie-dettaglio') return SPECIES.find((x) => x.id === r.speciesId)?.name || 'Specie';
  if (r.view === 'commestibile') return catalog.find(s => s.id === r.speciesId)?.name || 'Specie';
  if (r.view === 'fungo') return taxonName(r.taxonId) || 'Specie';
  if (r.view === 'guide') return guideTitle(r.guideId);
  if (r.view === 'glossario' && r.termId) return glossaryTitle(r.termId);
  if (r.view === 'animale') return animalName(r.animalId)||'Scheda non disponibile';
  if (r.view === 'pianta') return plantName(r.plantId)||'Pianta';
  if (r.view === 'albero') return treesData?.trees?.[r.treeId]?.name || 'Albero';
  if (r.view === 'riconosci' && (r.compare || r.compareStart)) return 'Confronta';
  if (r.view === 'sfide' && r.challengeId) return challengeTitle(r.challengeId) || 'Sfida';
  return TITLES[r.view] || '';
}
// titolo della scheda del browser: «Pagina · Fronda» (cronologia, preferiti, più schede); in home solo «Fronda»
function pageTitle(r) { const t = r.view === 'uscite' ? '' : titleOf(r); return t ? `${t} · Fronda` : 'Fronda'; }
function parentOf(r) {
  if (!r) return '#/';
  if(r.view==='diario' && r.notebookEntry) return r.notebookDemo?'#/diario/esempio':'#/diario';
  if(r.view==='diario' && r.notebookDemo) return '#/diario';
  if (r.view === 'specie-dettaglio' || r.view === 'fungo' || r.view === 'commestibile') return '#/specie';
  if (r.view === 'animale') return '#/animali';
  if (r.view === 'pianta') return '#/piante';
  if (r.view === 'albero') return '#/alberi';
  if (r.view === 'guide') return '#/guide';
  if (['glossario','guide-list','sfide'].includes(r.view) && !r.challengeId || r.view === 'riconosci' && r.recognizeMode === 'bosco') return '#/impara';
  if (r.view === 'riconosci' && r.compare) return '#/confronta';
  if (r.view === 'riconosci' && r.compareStart) return '#/specie';
  if (r.view === 'sfide' && r.challengeId) return '#/sfide';
  if (['specie','alberi','piante','animali','riconosci','glossario','guide-list','sfide'].includes(r.view)) return '#/scopri';
  return '#/';
}
const PARENT_TITLE = (r) => ({ '#/diario':'Taccuino', '#/diario/esempio':'Diario di prova', '#/scopri': 'Scopri', '#/specie': 'Funghi', '#/alberi': 'Alberi', '#/animali':'Animali', '#/piante':'Piante e fiori', '#/riconosci': 'Impara a riconoscere', '#/confronta':'Confronta', '#/guide': 'Approfondimenti', '#/sfide': 'Sfide', '#/impara': 'Guide', '#/': 'Uscite' }[parentOf(r)]);
// Quando il titolo della pagina passa sotto la barra, lo mostriamo compatto al centro su telefono e tablet.
let watchedTitle = null, compactTitle = false;
function updateCompactTitle(initial=false) {
  const h=watchedTitle,bar=$('.appbar');
  if(!h?.isConnected||!bar)return;
  // Altezza di layout: non cambia se un’animazione trasla visivamente la barra.
  const edge=bar.offsetHeight+(parseFloat(getComputedStyle(bar).top)||0);
  const rect=h.getBoundingClientRect();
  // Isteresi spaziale: il titolo deve rientrare davvero prima di togliere il compatto.
  const next=rect.height>0&&scrollY>0&&(initial?rect.bottom<=edge:compactTitle?rect.bottom<edge+16:rect.bottom<=edge-4);
  if(next!==compactTitle||initial){compactTitle=next;document.documentElement.classList.toggle('title-in-bar',next);}
}
function watchTitle() {
  const bar=$('.appbar-title');if(!bar)return;
  const v=$('.view:not([hidden])');
  const h=(state.view==='uscite'?v?.querySelector('#active-filters'):null)||v?.querySelector('.cmp-title')||v?.querySelector('.phero-title')||v?.querySelector('.view-title');
  const changed=h!==watchedTitle;watchedTitle=h||null;
  if(!h){compactTitle=false;document.documentElement.classList.remove('title-in-bar');return;}
  bar.textContent=state.view==='uscite'?'Dove andare':h.textContent.trim();
  updateCompactTitle(changed);
  revealHeader();
}
// Le pagine operative espongono l'azione pertinente al contenuto nella barra.
function updateHeaderActions(r) {
  const appbar=$('.appbar'), action=$('[data-appbar-action]');
  const comparison=r.view==='riconosci' && !!r.compare;
  appbar.dataset.context=comparison?'comparison':r.view==='uscite'?'home':'default';
  action.hidden=!comparison;
  if (comparison) {
    action.textContent='Cambia';
    action.setAttribute('aria-label','Cambia i due funghi del confronto');
    action.href='#/confronta';
  } else {
    action.removeAttribute('href');
    action.removeAttribute('aria-label');
    action.textContent='';
  }
}
function updateBack(r, nav) {
  updateHeaderActions(r);
  const deep = levelOf(r) > 0;
  // stesso «indietro» in due posti: nella barra su telefono, sopra il titolo della pagina su desktop (la barra tiene le sezioni)
  const back = contextualBackTitle() || PARENT_TITLE(r);
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

addEventListener('fronda:navigation-context',()=>{if(prev)updateBack(prev,'none');});

function route() {
  // un ridisegno del meteo in sospeso (in home aspetta fino a 6 s) non deve cadere sulla pagina nuova: questa si disegna gia' con i dati aggiornati
  if (weatherPaintTimer) { clearTimeout(weatherPaintTimer.handle); weatherPaintTimer = null; }
  const r = parseRoute();
  r.tab = { animali:'specie', animale:'specie', impara: 'specie', piante:'specie', pianta:'specie', zona: 'uscite', glossario: 'specie', 'specie-dettaglio': 'specie', alberi: 'specie', albero: 'specie', riconosci: 'specie', info: '', metodo: '', guide: 'specie', 'guide-list': 'specie', sfide: 'specie', fungo: 'specie', commestibile: 'specie' }[r.view] ?? r.view;
  r.hash = location.hash || '#/';
  const nav = returningNavigation()?'pop':navKind(prev,r), back = prev?.hash || '';
  rememberNavigationContext();
  if (prev) scrollMem.set(prev.hash, scrollY);
  prev = r;
  const user = performance.now() - userNavAt < 1500 && (userNavTo === 'back' || userNavTo === r.hash);
  userNavAt = -1e9;
  navigate(() => { muteLive(); recordNavigationPage(titleOf(r)); routeNow(r, nav); updateBack(r, nav); watchTitle(); document.title = pageTitle(r); focusPage(nav, back, user); restoreNavigationContext(); }, { nav, back });
}

// Le regioni live (#hero, #detail) annunciano gli aggiornamenti del meteo dentro la pagina. Cambiando pagina il
// contenuto nuovo lo legge il titolo che riceve il focus: niente secondo annuncio dell'intera pagina.
let liveT = null;
function muteLive() {
  const live = document.querySelectorAll('#hero, #detail');
  live.forEach((el) => el.setAttribute('aria-live', 'off'));
  clearTimeout(liveT);
  liveT = setTimeout(() => live.forEach((el) => el.setAttribute('aria-live', 'polite')), 800);
}
// Focus dopo un cambio di pagina: al titolo della pagina nuova; tornando indietro, alla card da cui eri partito;
// tra sezioni resta sul comando toccato. Solo per le navigazioni fatte nell'app (o se il focus è rimasto nella pagina nascosta).
function focusPage(nav, back, user) {
  const view = document.querySelector('.view:not([hidden])'), active = document.activeElement;
  if (!view) return;
  const stranded = !!active?.closest?.('.view[hidden]');
  if (!user && !stranded) return;
  if ((nav === 'left' || nav === 'right') && !stranded) return;
  if (nav === 'pop' && back) {
    const link = view.querySelector(`a[href="${CSS.escape(back)}"]`);
    if (link?.getClientRects().length) { link.focus({ preventScroll: true }); return; }
  }
  const h = view.querySelector('.cmp-title') || view.querySelector('.phero-title') || view.querySelector('h1, .view-title');
  if (!h) return;
  if (!h.hasAttribute('tabindex')) { h.setAttribute('tabindex', '-1'); h.dataset.navFocus = ''; }
  h.focus({ preventScroll: true });
}

function syncNavIndicator(){
  const bar=$('.tabbar'),tab=bar?.querySelector('a[aria-current="page"]');
  if(!bar||!tab){bar?.removeAttribute('data-indicator-ready');return;}
  for(const [key,value] of Object.entries({x:tab.offsetLeft,y:tab.offsetTop,w:tab.offsetWidth,h:tab.offsetHeight}))bar.style.setProperty('--tab-'+key,value+'px');
  bar.dataset.indicatorReady='';
}
const navIndicatorObserver=new ResizeObserver(syncNavIndicator);
document.querySelectorAll('.tabbar, .tabbar a').forEach(el=>navIndicatorObserver.observe(el));
document.fonts.ready.then(syncNavIndicator);

function routeNow(r, nav) {
  state.view = r.view;
  if (r.zoneId) state.zoneId = r.zoneId;
  if (r.view === 'zona' || r.view === 'mappa') state.trailId = r.trailId || null;
  if (r.view === 'zona') { state.dayOffset = r.offset; mapDateManual = true; }
  document.querySelectorAll('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== r.view; });
  const tab = r.tab;
  document.querySelectorAll('[data-tab]').forEach((t) => {
    if (t.dataset.tab === tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  $('.tabbar')?.style.setProperty('--ti', TABS.indexOf(tab));
  document.body.dataset.page = r.view;
  syncNavIndicator();
  placeStale(r.view);
  if(r.view==='diario')journal?.refresh();
  if (r.view === 'specie-dettaglio') renderSpeciesDetail($('#species-detail'), r.speciesId);
  if (r.view === 'animali') renderAnimals($('#animal-grid'));
  if (r.view === 'animale') renderAnimalPage($('#animal-detail'),r.animalId);
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
    const rt = r.compareStart?['Confronta','Scegli due specie e guarda differenze e somiglianze, una accanto all’altra.']:RECOGNIZE_HEAD[r.recognizeMode];
    $('[data-recognize-title]').textContent = rt[0]; $('[data-recognize-sub]').textContent = rt[1];
    $('#identify').hidden = r.recognizeMode !== 'funghi';
    $('#field-identify').hidden = r.recognizeMode === 'funghi';
    if(r.recognizeMode==='funghi') {if(r.compareStart)renderComparisonStart($('#identify'),r.compareLeft,r.compareRight);else{setCompare(r.compare,r.pick);renderIdentify($('#identify'));}}
    // piante e alberi: lo stesso percorso guidato dei funghi, una domanda alla volta
    else if(r.recognizeMode==='piante') renderGuidedKey($('#field-identify'),'piante',{items:plants().map(p=>({id:p.id,name:p.name,latin:cardLatin(p.latin),href:`#/pianta/${encodeURIComponent(p.id)}`,danger:p.category==='Pericolose'})),thumb:plantThumb});
    else if(r.recognizeMode==='alberi') renderGuidedKey($('#field-identify'),'alberi',{items:Object.entries(treesData?.trees||{}).map(([id,t])=>({id,name:t.name,latin:cardLatin(t.latin),href:`#/albero/${encodeURIComponent(id)}`})),thumb:treeThumb});
    else renderFieldIdentify($('#field-identify'));
  }
  const referenceBox=document.querySelector(`.view[data-view="${r.view}"]`);
  const noteRoute={'albero':['albero',r.treeId],'specie-dettaglio':['specie',r.speciesId],'fungo':['fungo',r.taxonId],'commestibile':['commestibile',r.speciesId],'guide':['guide',r.guideId]}[r.view];
  if(noteRoute)addNotebookReference(referenceBox.querySelector('.sp-page,#guide-body,#edible-detail')||referenceBox,noteRoute[0],noteRoute[1],titleOf(r));
  if(!['animali','animale'].includes(r.view))enhanceGlossary(referenceBox);
  const learningNav=document.querySelector(`.view[data-view="${r.view}"] .seg-nav`),selectedSection=learningNav?.querySelector('[aria-current="page"]');
  if(selectedSection) learningNav.scrollLeft=selectedSection.offsetLeft-(learningNav.clientWidth-selectedSection.offsetWidth)/2;
  if (r.view === 'mappa') {
    requestAnimationFrame(() => {
      if(state.view!=='mappa')return;
      map?.invalidateSize({pan:false});
      const lb = $('.legend-box');
      // chiusa di default ovunque: la carta prima di tutto (si apre a mano o accendendo la Carta Forestale)
      if (lb && !lb.dataset.touched) lb.open = false;
      const z = zones.find((x) => x.id === r.zoneId);
      if(z&&map){chooseMapZone(z.id,{animate:false});mapInitialFrameDone=true;}
      else if(map&&!mapInitialFrameDone)mapInitialFrameDone=fitMapResults({animate:false});
    });
  }
  renderAll();
  // indietro e tra sezioni: torni dove eri; avanti: dall'inizio (o alla voce del glossario richiesta).
  // Avviene dentro l'aggiornamento della transizione: la pagina nuova entra già nella posizione giusta.
  if (r.view !== 'mappa') {
    // Il glossario riparte dall’inizio; un termine esplicito resta una destinazione precisa.
    const keep = r.view !== 'glossario' && (restoredNavigationScroll() !== undefined || nav === 'pop' || nav === 'left' || nav === 'right');
    scrollTo({ top: keep ? (restoredNavigationScroll() ?? scrollMem.get(r.hash) ?? 0) : 0, behavior: 'instant' });
    if (r.view === 'glossario' && r.termId) document.getElementById(`glossary-term-${r.termId}`)?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
}

// copertina della pagina di destinazione, per prepararla al tocco (motion.js): la stessa scelta dei renderer
setCoverResolver((hash) => {
  const r = parseRoute(hash);
  if (r.view === 'zona') {
    const z = results && (weatherZones || zones).find((x) => x.id === r.zoneId), d = z && dayEntry(z.id, r.offset);
    return d?.best ? coverOf(z, d.best.species.id, d)?.hd || '' : '';
  }
  if (r.view === 'specie-dettaglio') return speciesHeroSrc(r.speciesId);
  if (r.view === 'fungo') return taxonHeroSrc(r.taxonId);
  if (r.view === 'commestibile') return taxonHeroSrc(r.speciesId, fungusPhotos(r.speciesId));
  if (r.view === 'pianta') return plantHeroSrc(r.plantId);
  if (r.view === 'albero') return treeHeroSrc(r.treeId);
  return '';
});

const go = (hash) => { location.hash = hash; };

function intentButtons() {
  return INTENTS.map(i=>`<button type="button" class="chip" data-intent="${i.id}" aria-label="${esc(i.label)}" aria-pressed="${hasInterest(i.id)}">${esc(i.label)}</button>`).join('');
}
function changeIntent(value) {
  const focusBox=document.activeElement?.closest('#active-filters,#map-filters')?.id;
  state.interests=toggleInterest(state.interests,value);state.target=primaryInterest(state.interests);state.seasonSuspended=null;
  state.seasonOverride=seasonKey();
  homeProposalKeys=[];sheetPoint=null;outCache.clear();
  savePrefs();prepareCalendarFallback();if(series)compute();renderFilterSummary();renderAll();
  if(focusBox)document.querySelector(`#${focusBox} [data-intent="${value}"]`)?.focus();
}
const seasonKey=()=>`${filterDate().slice(0,7)}|${state.target}|${[...(activeIds()||[])].sort().join(',')}`;
function checkSavedSeason() {
  if(state.interests.length!==1||state.target==='passeggiata'||state.seasonOverride===seasonKey())return;
  const dates=state.view==='uscite'&&state.homeDay==null?Array.from({length:AHEAD_DAYS+1},(_,o)=>outdoorDate(o)):[filterDate()];
  const decision=seasonalSelection(activeCatalog(),activeIds(),dates);
  if(!decision)return;
  const previous={target:state.target,ids:activeIds()===null?null:[...activeIds()]};
  if(decision.clearSpecies)setActiveIds(null);
  if(decision.suspendIntent){state.interests=['passeggiata'];state.target='passeggiata';}
  state.seasonSuspended=previous;savePrefs();
  if(series)compute();renderFilterSummary();
  const show=()=>{
    if(state.seasonSuspended!==previous)return;
    if(document.querySelector('dialog[open]')){setTimeout(show,500);return;}
    const dlg=document.createElement('dialog');dlg.className='full-filters season-dialog';dlg.setAttribute('aria-labelledby','season-dialog-title');
    dlg.innerHTML=`<div class="fp-body"><h2 id="season-dialog-title">La stagione è cambiata</h2><p>${decision.suspendIntent?'Abbiamo sospeso la scelta salvata e aperto Sentieri.':'Abbiamo tolto il filtro salvato sulle specie, lasciando la tua attività.'}</p><p>${esc(decision.names.slice(0,4).join(', '))}${decision.names.length>4?' e altre specie':''}: fuori dal calendario indicativo di ${esc(fmtDate(filterDate(),{month:'long'}))}. Clima e quota possono spostarlo: questo non dimostra assenza.</p><p>La scelta precedente resta recuperabile.</p><div class="fp-head-actions"><button type="button" class="btn ghost" data-restore-season>Ripristina la mia scelta</button><button type="button" class="btn primary" data-accept-season>Continua</button></div></div>`;
    document.body.append(dlg);dlg.querySelector('[data-restore-season]').onclick=()=>{restoreSeason();dlg.close();};dlg.querySelector('[data-accept-season]').onclick=()=>dlg.close();dlg.onclose=()=>{dlg.remove();$('#home-filter-action [data-more]')?.focus();};openModal(dlg);
  };
  setTimeout(show,0);
}
function restoreSeason() {
  const prev=state.seasonSuspended;if(!prev)return;
  state.interests=[validIntent(prev.target)];state.target=primaryInterest(state.interests);setActiveIds(Array.isArray(prev.ids)?new Set(prev.ids):null);
  state.seasonSuspended=null;state.seasonOverride=seasonKey();savePrefs();prepareCalendarFallback();if(series)compute();renderFilterSummary();renderAll();
}
function outdoorDate(o) {return calendarDate(todayISO(),o);}
function outdoorDay(z,o) {const d=dayEntry(z.id,o);return {...d,date:d?.date||outdoorDate(o),best:null,perSpecies:[],score:null};}
function outdoorDiscoveries(z,d,walk) {
  const models=hasInterest('piante')?plantModels.filter(m=>state.plantIds===null||state.plantIds.has(m.id)):plantModels;
  return outingDiscoveries({zone:z,zoneHabitat:habitat[z.id],trail:walk?.t,trailCategories:trails[z.id]?.sample_categories,seriesByBand:series?.[z.id],date:d.date,models,
    flora:hasInterest('piante')&&state.plantIds!==null?[]:plants(),trees:treesData?.trees,observations:state.useBotanicalNotes?botanicalNotes:[]});
}
function communityEmptyHtml(){return `<div class="notice community-empty"><b>Dati community Fronda · In sviluppo</b><p>${communityDataAvailable()?'Non ci sono ancora osservazioni recenti per queste zone. I contributi compariranno qui quando saranno disponibili.':'Le osservazioni non sono disponibili in questo momento. Puoi continuare a esplorare tutte le zone.'}</p><button type="button" class="btn ghost" data-clear-community>Mostra tutte le zone</button></div>`;}
document.addEventListener('click',event=>{if(event.target.closest('[data-clear-community]')){state.communityOnly=false;savePrefs();outCache.clear();renderFilterSummary();renderAll();}});
function matchesInterests(z,d,walk) {
  if(state.communityOnly&&['uscite','mappa'].includes(state.view)&&!communityHasZone(z.id))return false;
  if((hasInterest('passeggiata')||state.easyTrails||state.shortTrails)&&!walk)return false;
  return !hasInterest('piante')||state.plantIds===null||outdoorDiscoveries(z,d||{date:filterDate()},walk).some(i=>i.kind==='pianta');
}
function outdoorProposals(day=state.homeDay, onlyUpcoming=false) {
  const list=[];
  for(const z of weatherZones||zones){
    for(const o of day==null?Array.from({length:AHEAD_DAYS+1},(_,i)=>i):[day]){
      const d=outdoorDay(z,o),routes=(trails[z.id]?.trails||[]).filter(t=>matchesWalk(t,state));
      for(const t of routes){
        const walk=walkContext(z,t,headsOf(z,t)),items=outdoorDiscoveries(z,d,walk),botanical=items.filter(i=>i.kind==='pianta');
        // An explicit botanical selection may have no compatible mapped trail.
        if(!matchesInterests(z,d,walk))continue;
        if(o===0 && (onlyUpcoming || day==null) && !practicalTiming(z,d,walk).available)continue;
        list.push({z,d,o,walk,items,botanicalRank:Math.max(0,...botanical.map(i=>i.rank||0)),weatherRank:wxRank(z,d),minutes:zoneTrip(z,walk).minutes,crowd:d.crowd?.value??z.popularity,comfort:d.comfort?.value});
      }
    }
  }
  list.sort((a,b)=>compareOutdoor(a,b,state));
  const seenZones=new Set(),seenTrails=new Set();
  return list.filter(c=>{const id=String(c.walk.t.id);if(seenZones.has(c.z.id)||seenTrails.has(id))return false;seenZones.add(c.z.id);seenTrails.add(id);return true;});
}
function arrangeHome() {
  const view=$('[data-view="uscite"]');view.dataset.intent=state.target;
  const during=$('#during-walk');
  const legalStrip=$('#home-legal'),legalTitle=legalStrip.querySelector('.ar-t'),legalText=legalStrip.querySelector('.ar-s');
  legalStrip._fungiCopy||=[legalTitle.textContent,legalText.textContent];
  legalTitle.textContent=state.target==='funghi'?legalStrip._fungiCopy[0]:'Prima di uscire';
  legalText.textContent=state.target==='funghi'?legalStrip._fungiCopy[1]:'Accessi, aree protette e regole locali: verifica le indicazioni per il luogo e l’attività.';
  // Keep the same hierarchy when switching between fungi and plants.
  view.insertBefore($('#season-h'),$('#community-intro'));view.insertBefore($('#season').closest('.rail-host')||$('#season'),$('#community-intro'));
  // In walking mode the discoveries follow the main proposal, before alternatives.
  view.insertBefore(during,state.target==='passeggiata'?$('#others-h'):$('#season-h'));
  $('#others-h').textContent=state.target==='piante'?'Altri sentieri da esplorare':contentCopy.otherPlacesTitle||'Altre buone uscite';
  $('#season-h').textContent=hasInterest('funghi')&&hasInterest('piante')?'Funghi e piante da osservare':state.target==='piante'?'Piante da osservare in questo periodo':contentCopy.speciesTitle||'Nei boschi in questi giorni';
}
function homeCover({c,photo,body,score=null,extraClass=''}) {
  const title=splitName(c.z)[0];
  return `<div class="cover cover-editorial vtn ${extraClass}" style="--vtn:cover">
    ${extraClass.includes('outdoor-hero')?outdoorBackdrop():''}${photo?`<img class="cover-img" data-src="${photo.hd}" alt="${esc(photo.alt||'')}" fetchpriority="high">`:''}<span class="shade"></span>
    <a class="cover-link" data-walk-zone="${c.z.id}" href="${walkHref(c.z,c.o,c.walk?.t)}" aria-label="${esc(title)}, ${esc(dayLabel(c.o,c.d.date,true))}: i dettagli della passeggiata"></a>
    <span class="cover-top"><span class="pill glass">${esc(dayLabel(c.o,c.d.date,true))}</span>${score===null?'':`<button type="button" class="cover-index" data-index-tip aria-expanded="false" aria-label="Indice funghi ${formatIndex(score)} su 10: come leggerlo">${fungusGlyph}<b>${formatIndex(score)}</b></button>`}</span>
    <span class="cover-body">${body}</span></div>`;
}
function outdoorCover(c) {
  const zone=coverOf(c.z,null,c.d);
  if(zone)return zone;
  // A contextual species photo is a fallback, never a photo of the place.
  const preferred=state.target==='piante'?'pianta':'albero';
  for(const item of [...c.items.filter(i=>i.kind===preferred),...c.items.filter(i=>i.kind!==preferred)]){
    const hd=item.kind==='pianta'?plantHeroSrc(item.id):item.kind==='albero'?treeHeroSrc(item.id):'';
    if(hd)return {hd,small:hd,alt:item.name};
  }
  return null;
}
const outdoorBackdrop=()=>`<span class="outdoor-backdrop" aria-hidden="true">${IC.map}</span>`;
function plantCoverHint(c) {
  if(!hasInterest('piante'))return '';
  const plant=(c.items||outdoorDiscoveries(c.z,c.d,c.walk)).find(i=>i.kind==='pianta');
  return plant?`<span class="cover-sp cover-plant">${plantThumb(plant.id,44)}<span><small>Da osservare</small><span class="cover-sp-name"><b>${esc(plant.name)}</b></span><small>${esc(plant.phase)} · presenza da verificare</small></span></span>`:'';
}
function outdoorTile(c,hero=false) {
  const cv=outdoorCover(c),w=wxOf(c.z,c.d);
  if(hero){
    const [title,sub]=splitName(c.z);
    const body=`<span class="cover-title">${esc(title)}</span>${sub?`<span class="cover-sub">${esc(sub)}</span>`:''}
      <span class="cover-walk"><b>${esc(c.walk.microzone)}</b><span>${esc(walkBrief(c.walk))}</span></span>
      ${plantCoverHint(c)}
      <span class="facts" aria-label="L’uscita in breve">${fact('car',`<span><b>${compactTravel(zoneTrip(c.z,c.walk))}</b></span>`)}${w?`<span class="fact wx-${w.level}" title="${esc(w.text)}">${wxi(w)}<span class="fx">${w.available?esc(w.level==='ok'?w.main:w.short||w.main):'Meteo non disponibile'}</span></span>`:''}</span>
      <span class="cover-cta" aria-hidden="true">Dai uno sguardo <span>→</span></span>`;
    return homeCover({c,photo:cv,body,extraClass:'outdoor-hero'});
  }
  const brief=`${c.walk.t.difficulty||'Difficoltà n.d.'} · ${fmtKm(c.walk.t.in_zone_km)} km nel tratto`;
  return `<a class="tile outdoor-tile" data-walk-zone="${c.z.id}" href="${walkHref(c.z,c.o,c.walk.t)}">${outdoorBackdrop()}${cv?`<img data-src="${cv.small}" alt="" loading="lazy">`:''}<span class="shade"></span>${w&&w.level!=='ok'?`<span class="tile-wx wx-${w.level}" title="${esc(w.text)}">${wxi(w)}${esc(OUTING_LABEL[w.level])}</span>`:''}<span class="tile-body"><span class="tile-day">${esc(dayLabel(c.o,c.d.date,true))}</span><b>${esc(splitName(c.z)[0])}</b><small>${esc(brief)}</small></span></a>`;
}
function plantRailItems(list) {
  const seen=new Set();return list.flatMap(c=>c.items||outdoorDiscoveries(c.z,c.d,c.walk)).filter(i=>i.kind==='pianta'&&!seen.has(i.id)&&seen.add(i.id)).slice(0,8);
}
const plantRailHtml=items=>items.map(i=>`<li data-weather-key="plant-${i.id}"><a class="portrait outdoor-plant" href="${esc(i.href)}" data-entity>${plantHeroSrc(i.id)?`<img data-src="${esc(plantHeroSrc(i.id))}" alt="" loading="lazy" decoding="async">`:''}<span class="shade"></span><span class="portrait-body"><b>${esc(i.name)}</b><small>${esc(i.phase)}</small><small>Presenza da verificare</small></span></a></li>`).join('');
function outdoorPlantRail(list) {
  const items=plantRailItems(list);$('#season-h').hidden=!items.length;
  updateWeatherHTML($('#season'),plantRailHtml(items));
}
function renderOutdoorHome() {
  let list=outdoorProposals(state.homeDay,!homeDateManual);
  if(weatherPainting&&homeProposalKeys.length){
    const held=homeProposalKeys.map(k=>list.find(c=>c.z.id===k.id)).filter(Boolean),seen=new Set(held.map(c=>c.z.id));
    list=[...held,...list.filter(c=>!seen.has(c.z.id))];
  }
  homeProposalKeys=list.slice(0,8).map(c=>({id:c.z.id,o:c.o,trail:c.walk?.t.id}));
  const hero=list[0],box=$('#hero');
  const status=state.seasonSuspended?'<p class="notice">Una scelta salvata è stata sospesa fuori dal calendario indicativo. <button type="button" class="link-btn" data-season-restore>Ripristina la scelta</button></p>':'';
  updateWeatherHTML(box,status+(hero?outdoorTile(hero,true):`<p class="notice">Nessun sentiero mappato corrisponde ai filtri. Puoi ampliarli o consultare le schede.</p><button class="btn ghost" type="button" data-outdoor-filters>Rivedi i filtri</button>`));
  box.querySelector('[data-outdoor-filters]')?.addEventListener('click',openFullFilters);box.querySelector('[data-season-restore]')?.addEventListener('click',restoreSeason);
  updateWeatherHTML($('#ranking'),list.slice(1,8).map(c=>`<li data-weather-key="${c.z.id}|${c.o}">${outdoorTile(c)}</li>`).join(''));$('#others-h').hidden=list.length<2;
  if(hero)renderDiscoveries($('#during-walk'),hero.z,hero.d,hero.walk);else {$('#during-walk').hidden=true;$('#during-walk').innerHTML='';}
  if(hasInterest('piante'))outdoorPlantRail(list);
  else {$('#season-h').hidden=false;updateWeatherHTML($('#season'),`<li>${actRow('#/piante','leaf','Piante spontanee','Sfoglia il catalogo')}</li><li>${actRow('#/alberi','leaf','Gli alberi del bosco','Caratteri da osservare')}</li><li>${actRow('#/specie','go','Funghi in Scopri','Schede e confronti')}</li>`);}
  renderCommunityIntro();fitFacts($('#hero .facts'));fitCover();
}
function renderOutdoorDetail() {
  const z=(weatherZones||zones).find(z=>z.id===state.zoneId);if(!z)return;
  const d=outdoorDay(z,state.dayOffset),walk=walkFor(z,d,state.trailId),box=$('#detail'),w=wxOf(z,d);
  delete box.dataset.zone;detailCtx=null;lastDetailHtml='';box.dataset.glossaryContext=state.target==='piante'?'Piante':'Sentieri';
  const discoveries=walk?outdoorDiscoveries(z,d,walk):[];
  const photo=outdoorCover({z,d,walk,items:discoveries});
  box.innerHTML=`<header class="phero outing-hero">${photo?`<div class="phero-img outdoor-cover-img"><img data-src="${esc(photo.hd)}" alt="${esc(photo.alt||'')}"></div>`:''}<div class="phero-body"><span class="pill glass">${esc(fmtDate(d.date,{weekday:'long',day:'numeric',month:'long'}))}</span><h1 class="phero-title">${esc(z.title||z.name)}</h1></div>${heroIndicators(z,d)}</header><div class="pbody">${!w?.available?'<p class="notice">Meteo da verificare prima di partire.</p>':''}<p>${esc(travelText(zoneTrip(z,walk)))}</p>${state.target==='piante'?discoveriesHtml(z,d,walk,discoveries):''}${walk?renderWalkFocus(z,{...d,best:null},walk):'<p class="notice">Nessun sentiero corrisponde ai filtri attivi.</p>'}${z.protection?`<p class="notice">${esc(z.protection)}</p>`:''}<p>${linkTrees(z.description)}</p>${state.target==='passeggiata'?discoverySection(z,d,walk):''}${section('accesso','Accessi e soste',renderAccess(z,{access:null}))}${section('sentieri','Sentieri della zona',renderTrails(z,null),true)}<p><a href="#/mappa/${z.id}">Vedi sulla mappa</a></p></div>`;
  bindDetailSections(box);
}
function openOutdoorSheet(zid) {
  sheetPoint=null;sheetZone=zid;const z=(weatherZones||zones).find(z=>z.id===zid);if(!z)return;
  const d=outdoorDay(z,state.dayOffset),walk=walkFor(z,d,state.trailId),items=walk?outdoorDiscoveries(z,d,walk):[],sh=$('#map-sheet');
  sh.innerHTML=`<button type="button" class="sheet-close" aria-label="Chiudi">✕</button><h2>${esc(splitName(z)[0])}</h2><p>${esc(walkBrief(walk))}</p><p>${esc(wxOf(z,d)?.text||'Meteo non disponibile')}</p>${hasInterest('piante')?discoveriesHtml(z,d,walk,mapPlants(z,d,walk),{compact:true}):''}${forestOn?forestHere(zid):''}<a class="btn primary" href="${walkHref(z,state.dayOffset,walk?.t)}">Esplora l’uscita</a>`;
  sh.hidden=false;sh.querySelector('.sheet-close').onclick=()=>{sh.hidden=true;sheetZone=null;state.zoneId=null;renderMap();};
  if(state.zoneId!==zid){state.zoneId=zid;renderMap();}
}
function mapPlants(z,d,walk) {
  return hasInterest('piante')?outdoorDiscoveries(z,d||{date:filterDate()},walk).filter(i=>i.kind==='pianta'):[];
}
function mapPlantBadge(z,d,walk) {
  const found=mapPlants(z,d,walk);
  return found.length?`<span class="map-plant-badge" title="${esc('Da osservare: '+found.map(i=>i.name).join(', '))}">${arIc('leaf')}</span>`:'';
}
function mapPlantNote() {
  return hasInterest('piante')?`<details class="context-note map-plant-note"><summary>Piante: come leggere la mappa</summary><p>Gli spunti collegano specie, ambienti campionati e calendari indicativi. Non sono avvistamenti confermati. La copertura è parziale: puoi incontrare anche altre piante.</p></details>`:'';
}
function renderOutdoorMap() {
  scheduleMapResults();
  const all=weatherZones||zones,items=all.filter(z=>{const d=outdoorDay(z,state.dayOffset);return matchesInterests(z,d,walkFor(z,d));}).map(z=>{const d=outdoorDay(z,state.dayOffset),walk=walkFor(z,d,z.id===state.zoneId?state.trailId:null),found=walk?outdoorDiscoveries(z,d,walk):[];return {z,walk,found,score:null,color:'var(--link)',selected:z.id===state.zoneId,label:hasInterest('piante')?'Piante da osservare':'Sentieri',tooltip:`${z.name} · ${walkBrief(walk)}`};});
  if(!hasLeaflet()){renderSvgMap($('#map'),{zones:all,origin,items,onSelect:chooseMapZone});return;}
  baseMarker?.remove();baseMarker=null;
  if(customBase())baseMarker=L.marker([origin.lat,origin.lon],{icon:L.divIcon({className:'map-base',html:'<span aria-hidden="true">⌂</span>',iconSize:[32,32],iconAnchor:[16,16]}),title:`Base di partenza: ${origin.name}`}).addTo(map);
  ++mapRenderRevision;closeCellCard();hideCellPeek();cellHits=[];peekCellBounds=[];$('#map').classList.remove('cells-on','cells-visible','cells-peek');syncCellBackdrop();
  for(const g of Object.values(zoneLayers))g.remove();zoneLayers={};
  if(!map.getPane('zoneLabels'))map.createPane('zoneLabels').style.zIndex=640;
  for(const it of items){
    const {z,walk,found}=it,g=L.layerGroup().addTo(map);zoneLayers[z.id]=g;
    L.circle([z.lat,z.lon],{radius:z.radius_m,color:cssVar('--link'),weight:it.selected?3:1,fillOpacity:.06,dashArray:'5 5'}).addTo(g).on('click',()=>chooseMapZone(z.id));
    L.marker([z.lat,z.lon],{icon:L.divIcon({className:'',html:`<span class="zone-label">${mapPlantBadge(z,outdoorDay(z,state.dayOffset),walk)}<span class="zone-name">${esc(shortName(z))}</span></span>`,iconSize:null}),pane:'zoneLabels',title:[z.name,...found.filter(i=>i.kind==='pianta').map(i=>'Da osservare: '+i.name)].join(' · ')}).addTo(g).on('click',()=>chooseMapZone(z.id));
    if(!it.selected&&map.getZoom()<11.5)continue;
    for(const t of (trails[z.id]?.trails||[]).filter(t=>matchesWalk(t,state)&&matchesInterests(z,outdoorDay(z,state.dayOffset),walkContext(z,t,headsOf(z,t))))){
      for(const line of t.lines||[])L.polyline(line,{color:cssVar('--link'),weight:walk?.t.id===t.id?5:3,opacity:.8}).addTo(g).on('click',()=>{state.trailId=t.id;openOutdoorSheet(z.id);renderMap();}).bindTooltip(esc(trailName(t)));
      for(const h of headsOf(z,t))L.marker([h.lat,h.lon],{icon:L.divIcon({className:'',html:'<span class="map-p">↗</span>',iconSize:[28,28]}),title:`Imbocco: ${trailName(t)}`}).addTo(g).on('click',()=>{location.hash=walkHref(z,state.dayOffset,t);});
    }
  }
}

// Tre intenti sempre esposti, preferenze e specie nel pannello avanzato.
const PREFS = [['avoidCrowd', 'Poca gente', 'Poca gente'], ['preferComfort', 'Accesso comodo', 'Comodo'], ['distancePenalty', 'Vicino a me', 'Vicino a me']];
const mapToolbarObserver=new ResizeObserver(entries=>{
  for(const {target} of entries)target.closest('.view-map')?.style.setProperty('--map-toolbar-bottom',`${target.offsetTop+target.offsetHeight+12}px`);
});
function renderFilterSummary() {
  renderFilterBox($('#active-filters'));
  renderFilterBox($('#map-filters'), true);
}
function renderFilterBox(box, onMap = false) {
  if (!box) return;
  if(onMap&&box.closest('.map-top'))mapToolbarObserver.observe(box.closest('.map-top'));
  const count = (hasInterest('funghi')?state.speciesIds?.size||0:0)+(hasInterest('piante')?state.plantIds?.size||0:0) + PREFS.filter(([k])=>state[k]).length + Number(state.easyTrails) + Number(state.shortTrails)+Number(state.communityOnly);
  if (onMap) {
    box.innerHTML = mapQuery({ interests: INTENTS.filter(i => hasInterest(i.id)).map(i => i.label), day: dayLabel(state.dayOffset, outdoorDate(state.dayOffset), true), count });
    box.querySelector('[data-more]').onclick = openFullFilters;
    const day = box.querySelector('[data-days]');
    day.setAttribute('aria-expanded', String(box.closest('.map-top').classList.contains('days-open')));
    day.onclick = () => { const open = box.closest('.map-top').classList.toggle('days-open'); day.setAttribute('aria-expanded', String(open)); if (open) $('#map-days [aria-selected="true"]')?.focus({preventScroll:true}); };
    return;
  }
  const sliders='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 7h5m4 0h9M3 17h9m4 0h5"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/></svg>';
  const more=`<button type="button" class="home-filter-button" data-more aria-haspopup="dialog" aria-label="Filtri avanzati${count?`, ${count} attivi`:``}"${count?` title="${count} filtri attivi"`:''}>${sliders}<span>Filtri</span>${count?`<span class="af-filter-count" aria-hidden="true">${count}</span>`:''}</button>`;
  const icons={avoidCrowd:IC.people,preferComfort:IC.walk,distancePenalty:IC.home};
  const prefs=PREFS.filter(([k])=>state[k]).map(([k,label,short])=>`<button type="button" class="chip pref" data-p="${k}" aria-label="${esc(k==='avoidCrowd'?'Poca gente':label)}" title="${esc(label)}" aria-pressed="${!!state[k]}"><span class="pref-icon" aria-hidden="true">${icons[k]}</span><span class="pref-label-full">${esc(label)}</span><span class="pref-label-short" aria-hidden="true">${esc(short)}</span></button>`).join('');
  box.innerHTML=`<div class="af-group-row intent-row" role="group" aria-label="Cosa cerchi">${intentButtons()}</div><span id="home-filter-action">${more}</span>${prefs?`<div class="af-pref-row" role="group" aria-label="Preferenze attive, tocca per rimuovere">${prefs}</div>`:''}`;
  box.querySelectorAll('[data-intent]').forEach(b=>b.onclick=()=>changeIntent(b.dataset.intent));
  box.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>soft(()=>{state[b.dataset.p]=!state[b.dataset.p];savePrefs();outCache.clear();renderFilterSummary();renderAll();}));
  for (const action of document.querySelectorAll('#home-filter-action, #appbar-home-filters')) {
    action.innerHTML=more;
    action.querySelector('[data-more]').onclick=openFullFilters;
  }
}

// Il pannello si riconfigura per attività, conservando le altre selezioni.
function openFullFilters() {
  let dlg = $('#full-filters');
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.id = 'full-filters'; dlg.className = 'full-filters';
    dlg.setAttribute('aria-labelledby', 'full-filters-title'); document.body.appendChild(dlg);
  }
  const mapMode = state.view === 'mappa';
  dlg.classList.toggle('map-filter-panel', mapMode);
  const paint = () => {
    const expanded = [...dlg.querySelectorAll('.map-filter-section[open] > summary')].map(s=>s.textContent);
    const filterScroll = dlg.querySelector('.fp-body')?.scrollTop || 0;
    const selected = selectedCatalog(), explicitSelected=selected.filter(s=>selectionFor(s.id)!==null), date = filterDate();
    const season = (s) => `<small class="season-badge ${seasonStatus(s,date)==='out'?'season-out':''}">${botanicalById(s.id)?({in:'Fase nel calendario',out:'Fuori calendario indicativo',unknown:'Calendario n.d.'})[seasonStatus(s,date)]:seasonLabel(s,date)}</small>`;
    const chip = (s) => `<button type="button" class="chip species-choice" data-catalog-id="${s.id}" aria-pressed="${activeIds() === null || activeIds().has(s.id)}"><span>${esc(s.name)}${s.toxicity==='commestibile con cautela'?'<small>Preparazione specifica</small>':''}</span>${season(s)}</button>`;
    // pannello in stile app: cerca, gruppi in stagione, il resto richiuso; preferenze come interruttori
    const groupChip = (g) => `<button type="button" class="chip" data-group="${g.id}" aria-pressed="${groupSelection(g.id)!=='none'}">${thumb(g.rep,32)}<span>${esc(g.label)}${g.id==='porcini'?' (4 specie)':''}</span>${outOfSeason(g.id)?`<small class="season-badge season-out">${state.target==='piante'?'Fuori calendario':'Fuori periodo tipico'}</small>`:''}</button>`;
    const inSeason = activeGroups().filter((g) => !outOfSeason(g.id)), outSeason = activeGroups().filter((g) => outOfSeason(g.id));
    const sw = (on) => `<span class="switch" aria-hidden="true" data-on="${on}"><i></i></span>`;
    const dirty = state.communityOnly || state.easyTrails || state.shortTrails || activeIds() !== null || PREFS.some(([k]) => state[k]) || !state.showDiscoveries;
    dlg.innerHTML = `<div class="filter-panel-head"><h2 id="full-filters-title">Filtri avanzati</h2><div class="fp-head-actions">${dirty ? '<button type="button" class="fp-reset" data-reset>Azzera</button>' : ''}<button type="button" class="btn ghost" data-close>Chiudi</button></div></div>
      <div class="fp-body">
      ${state.seasonSuspended?'<p class="notice">Una scelta salvata è sospesa. <button type="button" class="link-btn" data-filter-season-restore>Ripristina la scelta</button></p>':''}<h3 class="fp-h">Alla ricerca di…</h3><div class="intent-row filter-panel-groups" role="group" aria-label="Alla ricerca di">${intentButtons()}</div>
      <p class="small muted">${hasInterest('funghi')&&hasInterest('piante')?'Scegli funghi e piante da cercare. L’indice riguarda solo i funghi.':state.target==='funghi'?'Scegli i funghi da cercare. L’indice resta sperimentale.':state.target==='piante'?'Cerca piante con fase e calendario documentati. Le altre sono consultabili in Scopri.':'Scegli il giro per sentieri, accesso e meteo, senza indice fungino.'}</p>
      ${state.target!=='passeggiata'?`<label class="species-search-label sr-only" for="species-filter-search">Aggiungi una specie</label>
      <input id="species-filter-search" class="wiz-input" type="search" placeholder="${hasInterest('funghi')&&hasInterest('piante')?'Cerca funghi o piante…':state.target==='piante'?'Cerca e aggiungi: ortica, more, Arbutus…':'Cerca e aggiungi: pioppino, spugnola, Boletus…'}" role="combobox" aria-autocomplete="list" aria-controls="species-filter-options" aria-expanded="false" autocomplete="off">
      <ul id="species-filter-options" class="species-options" role="listbox" aria-label="Specie da cercare" hidden></ul>
      ${activeIds() !== null ? `<h3 class="fp-h">Scelte</h3><div class="filter-panel-groups selected-species" aria-label="Specie selezionate">${explicitSelected.map(s=>`<button type="button" class="chip" data-remove-species="${s.id}" aria-label="Rimuovi ${esc(s.name)}"><span>${esc(s.name)}</span>${season(s)}<span aria-hidden="true">×</span></button>`).join('')}</div>` : ''}
      <h3 class="fp-h">${hasInterest('piante')?'Nel calendario indicativo':'Nel periodo tipico'} <small>${fmtDate(date,{day:'numeric',month:'long'})}</small></h3>
      <div class="filter-panel-groups" role="group" aria-label="Gruppi di specie">
        <button type="button" class="chip" data-all aria-pressed="${activeIds() === null}">${hasInterest('funghi')&&hasInterest('piante')?'Tutte le specie':state.target==='piante'?'Tutte le piante':'Tutti i commestibili'}</button>
        ${inSeason.map(groupChip).join('')}
      </div>
      ${outSeason.length ? `<details class="fp-more"><summary>${state.target==='piante'?'Fuori stagione':'Fuori periodo tipico'} <small>${outSeason.length}</small></summary><div class="filter-panel-groups" role="group" aria-label="${state.target==='piante'?'Gruppi fuori stagione':'Gruppi fuori periodo tipico'}">${outSeason.map(groupChip).join('')}</div></details>` : ''}
      <details class="fp-more catalog-all"><summary>Tutte le specie <small>${activeCatalog().length}</small></summary><div class="filter-panel-groups">${[...activeCatalog()].sort((a,b)=>a.name.localeCompare(b.name,'it')).map(chip).join('')}</div></details>
      `:''}
      <h3 class="fp-h">Sentieri</h3><ul class="fp-switches">${[['easyTrails','Solo difficoltà T · turistica'],['shortTrails','Tratto nella zona entro 5 km']].map(([k,label])=>`<li><button type="button" class="fp-switch" data-pref="${k}" aria-pressed="${!!state[k]}">${label}${sw(!!state[k])}</button></li>`).join('')}</ul><p class="small muted">La lunghezza riguarda il tratto mappato nella zona, non un giro completo. Dati mancanti esclusi quando il relativo filtro è attivo.</p>
      <h3 class="fp-h">Uscita</h3>
      <ul class="fp-switches">
        ${PREFS.map(([k,label])=>`<li><button type="button" class="fp-switch" data-pref="${k}" aria-pressed="${!!state[k]}">${esc(label)}${sw(!!state[k])}</button></li>`).join('')}
        <li><label class="fp-switch"><span>Dati community Fronda <small>In sviluppo · osservazioni dichiarate degli ultimi 7 giorni. La copertura è ancora limitata.</small></span><input type="checkbox" class="switch-input" data-community-filter ${state.communityOnly?'checked':''}></label></li><li><label class="fp-switch"><span>Scoperte secondarie lungo il giro<small>Mostra anche piante e alberi come spunti da osservare.</small></span><input type="checkbox" class="switch-input" data-discoveries-toggle ${state.showDiscoveries?'checked':''}></label></li>
      </ul>
      <p class="small muted fp-note">${state.target==='piante'?'Stagione indicativa: cambia con clima e quota.':'Mesi indicativi da manuali europei, non verificati nel Reatino: clima e quota li spostano.'} Il catalogo non comprende ogni specie.</p>
      </div>
      <div class="fp-foot"><span class="small muted" aria-live="polite">${state.target==='passeggiata'?'Sentieri e accessi':hasInterest('funghi')&&hasInterest('piante')?selected.filter(s=>!botanicalById(s.id)).length+' funghi · '+selected.filter(s=>botanicalById(s.id)).length+' piante':state.target==='piante'?selected.length+' piante · calendario indicativo':selected.length+' specie · '+selected.filter(s=>s.modelId).length+' con indice'}</span><button type="button" class="btn primary big" data-close>Mostra i risultati</button></div>`;
    if (mapMode) { compactMapFilters(dlg); for (const d of dlg.querySelectorAll('.map-filter-section')) d.open=expanded.includes(d.querySelector('summary').textContent); dlg.querySelector('.fp-body').scrollTop=filterScroll; }
    dlg.querySelector('[data-filter-season-restore]')?.addEventListener('click',()=>{restoreSeason();paint();});
    dlg.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dlg.close()));
    const changed = (focus) => { state.seasonOverride=seasonKey();savePrefs(); if (series) compute(); outCache.clear(); renderFilterSummary(); renderAll(); paint(); dlg.querySelector(focus)?.focus(); };
    dlg.querySelectorAll('[data-intent]').forEach(b=>b.onclick=()=>{changeIntent(b.dataset.intent);paint();dlg.querySelector(`[data-intent="${b.dataset.intent}"]`)?.focus();});
    if(state.target!=='passeggiata')mountSpeciesAutocomplete({ input: dlg.querySelector('#species-filter-search'), list: dlg.querySelector('#species-filter-options'), catalog:activeCatalog(), date,
      onSelect: s => { addSpecies(s.id); changed('#species-filter-search'); } });
    dlg.querySelector('[data-community-filter]')?.addEventListener('change',ev=>{state.communityOnly=ev.target.checked;changed('[data-community-filter]');});
    dlg.querySelector('[data-discoveries-toggle]')?.addEventListener('change',ev=>{state.showDiscoveries=ev.target.checked;changed('[data-discoveries-toggle]');});
    if(dlg.querySelector('[data-all]'))dlg.querySelector('[data-all]').onclick = () => { setActiveIds(null); changed('[data-all]'); };
    // azzera: tutte le specie, nessuna preferenza, scoperte visibili (i valori di partenza)
    dlg.querySelector('[data-reset]')?.addEventListener('click', () => { if(state.target!=='passeggiata')setActiveIds(null);state.easyTrails=false;state.shortTrails=false; for (const [k] of PREFS) state[k] = false; state.showDiscoveries = true;state.communityOnly=false; changed('[data-close]'); });
    dlg.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{toggleGroup(b.dataset.group); changed(`[data-group="${b.dataset.group}"]`);});
    dlg.querySelectorAll('[data-remove-species]').forEach(b=>b.onclick=()=>{removeSpecies(b.dataset.removeSpecies); changed('#species-filter-search');});
    dlg.querySelectorAll('[data-catalog-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.catalogId; if(selectionFor(id)?.has(id))removeSpecies(id);else addSpecies(id);changed('#species-filter-search');});
    dlg.querySelectorAll('[data-pref]').forEach(b=>b.onclick=()=>{const k=b.dataset.pref;state[k]=!state[k];changed(`[data-pref="${k}"]`);});
  };
  dlg.onclose = () => {
    const selector=state.view==='mappa'?'#map-filters [data-more]':mobileHeader.matches && document.documentElement.classList.contains('title-in-bar')?'#appbar-home-filters [data-more]':'#home-filter-action [data-more]';
    $(selector)?.focus({preventScroll:true});
  };
  paint(); openModal(dlg);
}

let weatherUnavailable=false;
function prepareCalendarFallback(){
 if(!weatherUnavailable||state.target==='funghi')return;
 const dates=Array.from({length:70},(_,i)=>todayISO(new Date(Date.now()+(i-62)*864e5)));
 weatherZones??=zones;zones=weatherZones;
 series=Object.fromEntries(zones.map(z=>[z.id,z.bands.map(()=>({dates,todayIndex:62,issuedIndex:62,source:{expired:true,calendarOnly:true},...Object.fromEntries(['p','tmean','tmin','tmax','soilm','soilt'].map(k=>[k,Array(70).fill(null)]))}))]));
 $('#stale').hidden=false;$('#stale').textContent='Meteo non disponibile. Sentieri e spunti botanici restano consultabili.';
}
let weatherRevision=0,weatherController=null,weatherBusy=false,weatherPainting=false,deferredWeatherView=false;
let lastWeatherSnapshot=null,weatherPaintTimer=null;
const weatherPanelOpen=()=>!!document.querySelector('dialog[open],.learning-panel:popover-open');
// Stato del meteo, con le stesse parole ovunque: in home nella riga sotto il titolo,
// nelle altre viste nella pillola in basso (in home la pillola resta nascosta, vedi CSS).
const WX_BUSY='Sto aggiornando il meteo…',WX_DONE='Dati meteo aggiornati';
let weatherWorkTimer=null;
function weatherWork(text,busy=false,done=false){
  const box=$('#weather-work');if(!box)return;clearTimeout(weatherWorkTimer);
  box.hidden=!text;box.classList.toggle('busy',busy);box.classList.toggle('done',done);box.querySelector('.weather-work-label').textContent=text||'';
  if(done)weatherWorkTimer=setTimeout(()=>{box.hidden=true;box.classList.remove('done');},3000);
}
// In home la nota breve condivide la riga del meteo; la mappa ha il suo approfondimento.
let staleHome=null;
function placeStale(view){
  const box=$('#stale'),line=document.querySelector('.view[data-view="uscite"] .home-weather-status');if(!box||!line)return;
  staleHome??={parent:box.parentElement,next:box.nextSibling};
  if(view==='uscite'){if(box.parentElement!==line)line.append(box);}
  else if(view==='mappa'){ const target=$('#map-weather-detail'); if(target&&box.parentElement!==target)target.append(box); }
  else if(box.parentElement!==staleHome.parent)staleHome.parent.insertBefore(box,staleHome.next);
}
let stampTimer=null;
function weatherStamp(w,busy=weatherBusy,done=false){
  clearTimeout(stampTimer);if(done)stampTimer=setTimeout(()=>weatherStamp(w,false,false),4000);
  if(!w||!Number.isFinite(w.fetchedAt?.getTime()))return;
  const sameDay=todayISO(w.fetchedAt)===todayISO();
  const when=w.fetchedAt.toLocaleString('it-IT',sameDay?{hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  $('#updated').textContent=busy?WX_BUSY:`${done?'Meteo aggiornato':w.cached||w.offline?'Meteo salvato':'Meteo'} · ${when}`;
  $('#refresh').classList.toggle('is-done',!!done);
  $('#refresh').setAttribute('aria-busy',String(busy));
  $('#refresh').title='Meteo acquisito '+w.fetchedAt.toLocaleString('it-IT')+'. Tocca per aggiornarlo.';
  $('#stale').hidden=!w.stale&&!w.missingZones?.length;
  $('#stale').textContent=w.missingZones?.length?`Meteo parziale: ${weatherZones.length-w.missingZones.length}/${weatherZones.length} zone. `:busy?'Aggiornamento…':'Meteo da aggiornare. ';
  $('#stale').title=w.missingZones?.length?'Le zone senza meteo non vengono valutate.':'Oltre 24 ore l’indice dei funghi non viene calcolato.';
  if(!$('#stale').hidden&&!busy){const retry=document.createElement('button');retry.type='button';retry.className='link-btn';retry.textContent='Riprova';retry.onclick=()=>refreshWeather(true);$('#stale').append(retry);}
}
// nel dettaglio della zona: età del meteo e copia salvata senza rete (in home lo dice la riga sotto il titolo)
function weatherAgeHtml(z, band) {
  const at = new Date(series?.[z.id]?.[bandIndex(z, band)]?.source?.fetchedAt);
  if (!Number.isFinite(at.getTime())) return '';
  const same = todayISO(at) === todayISO();
  const when = at.toLocaleString('it-IT', same ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const off = navigator.onLine === false || !!lastWeatherSnapshot?.offline;
  return `<p class="small muted wx-age">${off ? 'Senza rete: meteo salvato' : 'Meteo'} · ${same ? 'alle ' : ''}${when}</p>`;
}
function paintWeatherView(changed=new Set(zones.map(z=>z.id))){
  if(!results)return;
  if(state.view==='zona'||state.view==='mappa'&&sheetZone){
    const selected=state.view==='zona'?state.zoneId:sheetZone;
    if(changed.has(selected)&&weatherPanelOpen()){deferredWeatherView=true;weatherWork('Meteo ricevuto. La scheda si aggiorna alla chiusura del pannello.');return;}
  }
  syncAutomaticDates();
  weatherPainting=true;
  try{
    if(state.view==='uscite'){renderDays();renderHome();}
    else if(state.view==='zona'&&changed.has(state.zoneId))keepWeatherReadingPosition(renderDetail);
    else if(state.view==='mappa'){
      renderMapDays();renderFilterBox($('#map-filters'),true);renderMap(changed);renderLegend();
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
  }else{
    weatherWork('');$('#updated').textContent='';weatherUnavailable=true;prepareCalendarFallback();
    if(state.target!=='funghi'){compute();renderAll();return;}
    if(state.view==='mappa'){renderAll();$('#stale').hidden=false;$('#stale').textContent='Meteo non disponibile. Puoi esplorare zone, sentieri e accessi.';}
    const msg=`<div class="error">${esc(weatherErrorMessage(mainFailure))} <button type="button" class="link-btn" data-retry>Riprova</button>.</div>`;
    $('#hero').innerHTML=msg;$('#detail').innerHTML=msg;document.querySelectorAll('[data-retry]').forEach(b=>b.addEventListener('click',()=>refreshWeather(true)));
  }
}
document.addEventListener('close',()=>{if(deferredWeatherView&&!weatherPanelOpen()){deferredWeatherView=false;paintWeatherView();weatherWork(weatherBusy?WX_BUSY:'',weatherBusy);}},{capture:true});
document.addEventListener('toggle',e=>{if(e.newState==='closed'&&deferredWeatherView&&!weatherPanelOpen()){deferredWeatherView=false;paintWeatherView();weatherWork(weatherBusy?WX_BUSY:'',weatherBusy);}},{capture:true});

function weatherIndicator(w,key) {
  if(!w?.available || !Number.isFinite(w.tmax) || !Number.isFinite(w.tmin))return '';
  const angle=t=>135+Math.max(0,Math.min(1,(t+10)/50))*270;
  const point=t=>{const a=angle(t)*Math.PI/180;return [50+46*Math.cos(a),50+46*Math.sin(a)];};
  const arc=(a,b)=>{const p=point(a),q=point(b);return `M${p.join(' ')} A46 46 0 ${angle(b)-angle(a)>180?1:0} 1 ${q.join(' ')}`;};
  const mark=point(w.tmax), temp=Math.abs(w.tmax), negative=w.tmax<0;
  const label={sun:'Asciutto',cloud:'Nuvoloso',rain:'Pioggia',snow:'Neve',storm:'Temporali',wind:'Vento',fog:'Nebbia'}[wxIcon(w)]||'Meteo';
  return `<span class="weather-indicator" data-weather-key="weather-indicator"><span class="ring weather-ring" aria-label="Massima della mattina ${w.tmax} gradi; minima ${w.tmin}. Anello termico da meno 10 a 40 gradi."><svg class="indicator-ring" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="thermal-${esc(key)}"><stop class="thermal-cool" offset="0"/><stop class="thermal-warm" offset="1"/></linearGradient></defs><path class="indicator-track" d="${arc(-10,40)}"/><path class="thermal-range" stroke="url(#thermal-${esc(key)})" d="${arc(w.tmin,w.tmax)}"/><circle class="thermal-marker" cx="${mark[0]}" cy="${mark[1]}" r="3.5"/></svg>${wxi(w)}<b class="temperature">${negative?'<span class="temperature-sign">−</span>':''}${temp}<span class="temperature-unit">°</span></b></span><span class="weather-caption">${label}<small>${w.tmin}–${w.tmax} °C · mattina</small>${w.gust>=40?'<strong>Vento forte</strong>':''}</span></span>`;
}
function heroIndicators(z,d,score=null) {
  const weather=weatherIndicator(wxOf(z,d),z.id);
  return weather||Number.isFinite(score)?`<div class="hero-indicators">${weather}${Number.isFinite(score)?ring(score,true,true):''}</div>`:'';
}

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
const wxi = (w) => `<span class="wxi wxi-${wxIcon(w)}">${weatherGlyphs[wxIcon(w)]||IC[wxIcon(w)]}</span>`;
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
      const r = state.target==='passeggiata'?{perSpecies:[],best:null}:scoreZoneDay(z, habitat[z.id], sb, sp, i,{zoneId:z.id,observations:state.useBotanicalNotes?botanicalNotes:[]});
      // Indice della zona: il migliore delle specie selezionate, senza bonus dal numero di taxa.
      days.push({ i, date: sb[0].dates[i], ...r, score: combine(r.perSpecies.map((p) => p.score)) });
    }
    // fattore umano: accesso, comodita' e affollamento per ogni giorno
    const acc0 = access[z.id]?.[0];
    days.forEach((d, k) => {
      if (!d.best && state.target==='funghi') return;
      d.access = d.best?accessFor(z, d.best.species, d.best.band):null;
      const referenceComfort = comfortScore({
        driveMin: acc0?.minutes ?? z.drive_min,
        walkM: d.access?.walkM ?? 800,
        surface: d.access?.surface ?? 0,
        unpavedKm: (acc0?.unpaved_tail_km ?? 0) + (acc0?.unpaved_other_km ?? 0),
      });
      const trip=zoneTrip(z);
      d.comfort=customBase() ? Number.isFinite(trip.minutes) ? comfortScore({driveMin:trip.minutes,walkM:d.access?.walkM??800,surface:d.access?.surface??0,unpavedKm:0}) : null : referenceComfort;
      const bi = d.best?bandIndex(z, d.best.band):0;
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
  const date = outdoorDate(offset);
  return r?.days.find(d => d.date === date);
};
// indice "opportunita'": l'indice di fruttificazione corretto con le preferenze attive
// le stesse correzioni di adjusted(), una per una, per spiegarle
let prep = null, trailheads = {}, treesData = null, idData = null;
function prepGeneralHtml(rules) {
  const ord = [...rules].sort((a, b) => (a.level === 'obbligatorio' ? 0 : 1) - (b.level === 'obbligatorio' ? 0 : 1));
  return `<details class="prep-gen"><summary><h2>Prepararli e conservarli: le regole per tutti</h2></summary>
    <ol class="content-prep-rules">${ord.map(r=>`<li${r.level==='obbligatorio'?' class="content-prep-required"':''}><span class="content-prep-kind">${r.level==='obbligatorio'?'Indicazione di sicurezza':'Indicazione prudenziale'}</span><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>${r.why?`<aside class="content-observe"><b>Perché</b><p>${esc(r.why)}</p></aside>`:''}${r.sources?.length?`<details class="content-explain"><summary>Fonti (${r.sources.length})</summary>${sourceRows(r.sources)}</details>`:''}</li>`).join('')}</ol>
  </details>`;
}
const adjParts = (zone, d) => {
  const out = [];
  if (state.distancePenalty) out.push({ label: 'vicino a me', mult: proximityMultiplier(zone) });
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
  if (!box.querySelector('#sp-cards')) {
    box.innerHTML = `      <div class="recognize-modes" role="group" aria-label="Quali funghi mostrare">${[['', 'Tutti'], ['edible', 'Commestibili'], ['other', 'Velenosi e sosia']].map(([v, l]) => `<button type="button" class="btn ghost small" data-fungi-group="${v}" aria-pressed="${(state.fungiGroup || '') === v}">${l}</button>`).join('')}</div>
      <p class="small muted" data-fungi-count role="status"></p><div class="card-grid" id="sp-cards"></div>`;
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
    animali: n(animals().length, 'scheda in catalogo', 'schede in catalogo'),
    piante: n(plants().length, 'pianta in catalogo', 'piante in catalogo'),
    glossario: n(glossaryTerms().length, 'voce', 'voci'),
    guide: n(guideCount(), 'approfondimento', 'approfondimenti'),
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
    ['guide', '#/guide', 'Approfondimenti', 'Piccole letture sul bosco e sulla passeggiata.', n(guideCount(), 'approfondimento', 'approfondimenti')],
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
  const edible = group === 'other' ? [] : catalog;
  const others = group === 'edible' ? [] : otherFungi();
  const card = (href, name, latin, ph, badge = '') => `<a class="sp-card" href="${href}" aria-label="${esc(name)}">
      ${ph ? `<img data-src="${assetSrc(ph.file)}" alt="" loading="lazy" decoding="async">` : `<span class="catalog-placeholder" aria-hidden="true">${esc(name.slice(0,2))}</span>`}<span class="shade"></span>${badge}
      <span class="sp-card-body"><b>${esc(name)}</b><i>${esc(cardLatin(latin))}</i></span></a>`;
  $('#sp-cards').innerHTML = [
    ...edible.map((s) => card(s.href, s.name, s.latin, catalogPhoto(s))),
    ...others.map((t) => card(`#/fungo/${encodeURIComponent(t.key)}`, t.name || t.latin, t.latin, t.photo, `<span class="sp-card-tox tox-${esc(t.toxicity.replace(/\s/g, '-'))}">${TOX_LABEL[t.toxicity]}</span>`)),
  ].join('') || `<p class="muted empty-note">Nessuna specie in questo gruppo.</p>`;
  const total = edible.length + others.length, all = catalog.length + otherFungi().length;
  $('[data-fungi-count]').textContent = group ? `${total} ${total === 1 ? 'scheda' : 'schede'} su ${all}` : '';
}

function renderEdiblePage(id, box=$('#edible-detail')) {
  const s = catalog.find(x=>x.id===id);
  if (!s) { box.dataset.glossaryContext='Funghi'; box.innerHTML='<p>Specie non presente nel catalogo.</p>';return; }
  // stessa pagina dei taxon di Riconosci: le sezioni senza dati non compaiono
  const extra = `<p class="species-index-unavailable"><span aria-hidden="true">—</span> Indice non ancora disponibile per questa specie.</p>${speciesObservationContext(s.id)}`;
  // se la scheda breve ha gia' i caratteri completi (taxon con lo stesso id) usa quelli
  const full = taxonByKey(s.id);
  renderTaxonView(box, full ? { ...full, sources: s.sources?.length ? s.sources : full.sources } : { key: s.id, name: s.name, latin: s.latin, toxicity: s.toxicity, caution: s.caution, sources: s.sources, traits: s.months?.length ? { season: s.months } : {} },
    { photos: fungusPhotos(id), habitatText: s.habitat || '', extra });
}

function renderAll() {
  if (!results && state.view !== 'mappa') return;
  syncAutomaticDates();
  if (state.view === 'uscite') { renderDays(); renderHome(); }
  if (state.view === 'zona') renderDetail();
  if (state.view === 'mappa') { renderMapDays(); renderFilterBox($('#map-filters'), true); renderMap(); renderLegend(); if (sheetZone) sheetPoint?openPoint(sheetZone,currentSheetPoint()):openSheet(sheetZone); }
}

function bestOfDay(o, onlyUpcoming=false) {
  if(state.target!=='funghi'){const c=outdoorProposals(o, onlyUpcoming)[0];return c?{...c,s:null}:null;}
  let best = null;
  for (const z of zones) {
    const d = dayEntry(z.id, o);
    if (!d?.best||!matchesInterests(z,d,walkFor(z,d))) continue;
    if(onlyUpcoming && o===0 && !practicalTiming(z,d,walkFor(z,d)).available)continue;
    const sc = adjusted(z, d.score, d);
    const rank = preferenceRank(z, sc, d) * wxRank(z, d) * communityRank(z.id, selectedCatalog().filter(s=>!botanicalById(s.id)).map(s=>s.id));
    if (!best || rank > best.rank) best = { s: sc, rank, z, d, o };
  }
  return best;
}

const dayLabel = (o, date, long = false) => (o === 0 ? 'Oggi' : o === 1 ? 'Domani'
  : fmtDate(date, long ? { weekday: 'long', day: 'numeric' } : { weekday: 'short' }));

function calendarWeather(z,d) {
  const w=wxOf(z,d);
  return w?.available ? `<span class="d-weather" aria-label="Meteo ${esc(z.title||z.name)}: ${esc(w.text)}">${wxi(w)}<span>${w.tmax}°</span></span>` : '';
}

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
    // L’indice conserva la propria classe; la selezione usa il polline.
    if (sc != null && state.target==='funghi') { b.dataset.lv = scoreVar(sc).slice(3); b.style.setProperty('--sel', `var(${scoreVar(sc)})`); }
    b.innerHTML = `<span class="d1">${top}</span><span class="d2">${mid}</span>${sc != null && state.target==='funghi' ? `<span class="d3">${fungusGlyph}<span class="dot" style="--dc:var(${scoreVar(sc)});--dcs:var(${scoreVar(sc).replace('--s', '--ps')})"></span><b class="pc">${formatIndex(sc)}</b></span>` : '<span class="d3">uscita</span>'}`;
    b.addEventListener('click', () => onPick(o));
    box.appendChild(b);
  };
  if (withAll) {
    // la settimana intera: intervallo di date e miglior indice del periodo
    const bests = [...Array(AHEAD_DAYS + 1).keys()].map((o) => bestOfDay(o, o === 0)).filter(Boolean);
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
    if (best) { mk(o === 0 ? 'Oggi' : o === 1 ? 'Domani' : fmtDate(best.d.date, { weekday: 'long' }).replace('.', ''), fmtDate(best.d.date, { day: 'numeric' }), o, best.s);
    box.lastChild.insertAdjacentHTML('beforeend',calendarWeather(best.z,best.d)); }
  }
  if(previous){reconcileChildren(previous,box);previous.scrollLeft=railScroll;}
  else box.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

// Un riscontro anche su iOS, dove le View Transitions sono disattivate.
const dateFeedbackAnimations = new WeakMap();
let dateFeedbackRevision=0;
function dateChangeFeedback(calendar, content = '') {
  const revision=++dateFeedbackRevision;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Il nuovo DOM deve essere visibile prima del riscontro, anche senza snapshot su iOS.
  requestAnimationFrame(()=>{
    if(revision!==dateFeedbackRevision)return;
    const animate = (el, frames, duration) => {
      if (!el?.isConnected || !el.getClientRects().length) return;
      dateFeedbackAnimations.get(el)?.cancel();
      dateFeedbackAnimations.set(el, el.animate(frames, {duration, easing:'ease-out'}));
    };
    const selected=document.querySelector(calendar);
    animate(selected, [{transform:'scale(.95)',backgroundColor:'var(--surface-2)'},{transform:'scale(1.025)',offset:.45},{transform:'scale(1)'}], 380);
    if(content)document.querySelectorAll(content).forEach(el=>animate(el,[{opacity:.45,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],320));
  });
}

function renderDays() {
  dayChips($('#days'), state.homeDay, (o) => { homeDateManual = true; if (o === state.homeDay) return; state.homeDay = o; checkSavedSeason(); renderAll(); $('#days [aria-selected="true"]')?.focus({preventScroll:true}); dateChangeFeedback('#days [aria-selected="true"]', '#hero'); }, { withAll: true });
}

function combosList() {
  const combos = [];
  for (const z of zones) {
    for (let o = 0; o <= AHEAD_DAYS; o++) {
      if (state.homeDay != null && o !== state.homeDay) continue;
      const d = dayEntry(z.id, o);
      if (d?.best) { if(o===0 && (state.homeDay==null || !homeDateManual) && !practicalTiming(z,d,walkFor(z,d)).available)continue; const s = adjusted(z, d.score, d); combos.push({ z, o, d, s, r: preferenceRank(z, s, d) * wxRank(z, d) * communityRank(z.id, selectedCatalog().filter(s=>!botanicalById(s.id)).map(s=>s.id)) }); }
    }
  }
  const seenTrails = new Set(), list = [];
  for (const c of uniquePlaceProposals(combos)) {
    const walk = walkFor(c.z, c.d, null, seenTrails);
    if(!matchesInterests(c.z,c.d,walk))continue;
    if (!walk && trails[c.z.id]?.trails.length) continue; // same mapped route already featured elsewhere
    if (walk) seenTrails.add(String(walk.t.id));
    list.push({ ...c, walk });
  }
  return list;
}

const walkHref = (z, o, t) => `#/zona/${z.id}/${o}${t ? '/sentiero/' + t.id : ''}`;
function walkFor(z, d, trailId = null, excluded = new Set()) {
  const all = (trails[z.id]?.trails || []).filter(t => !excluded.has(String(t.id)) && matchesWalk(t,state)&&matchesInterests(z,d,walkContext(z,t,headsOf(z,t))));
  const compatible = state.target==='funghi' && d?.best ? trailsFor(z, d.best.species, d.best.band).filter(t=>all.some(a=>String(a.id)===String(t.id))) : [];
  if(state.target==='piante')all.sort((a,b)=>{const rank=t=>Math.max(0,...outdoorDiscoveries(z,{date:d?.date||filterDate()},walkContext(z,t,headsOf(z,t))).filter(i=>i.kind==='pianta').map(i=>i.rank||0));return rank(b)-rank(a);});
  const selected = trailId && all.find(t => String(t.id) === String(trailId));
  const t = selected ? compatible.find(t => t.id === selected.id) || selected
    : state.target==='piante'?all[0]:chooseWalkTrail(compatible, all, t => headsOf(z, t));
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
  items.push(...animalSearchItems());
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
    ['Confronta','Scegli due specie dal catalogo','confronto sosia differenze comparare funghi riferimento master','#/confronta'],
    ['Impara a riconoscere i funghi', 'Descrivi quello che vedi, anche se è velenoso', 'identificare trovato velenoso sosia caratteri lamelle pori volva anello sporata', '#/riconosci'],
    ['Emergenza e intossicazione', 'Cosa fare, chi chiamare', 'emergenza intossicazione avvelenamento centro antiveleni 118 112 pronto soccorso sintomi', '#/info'],
    ['Regole di raccolta nel Lazio', 'Attestato, contributo, limiti, orari', 'regole legge tesserino attestato contributo 3 kg limite orari divieti parchi aree protette', '#/info'],
    ['Controllo gratuito all\'ASL', 'Ispettorato micologico', 'asl ispettorato micologico controllo gratuito micologo', '#/info'],
    ['Come funziona l\'indice', 'Formule, parametri, fonti e limiti', 'metodo scienza scientifico indice calcolo formula pioggia temperatura suolo latenza innesco probabilita affidabilita fonti letteratura euristica', '#/metodo'],
    ['Glossario del bosco', 'Definizioni, caratteri e legenda delle difficoltà', 'impara glossario parole significato legenda', '#/glossario'],
    ['Impara a riconoscere gli alberi', 'Confronta foglie, corteccia e frutti', 'riconoscimento botanica foglia corteccia frutto gemme', '#/riconosci/alberi'],
    ['Piante e fiori','Caratteri, parti alimentari e sosia pericolosi','erbe bacche more ortica cicoria piante spontanee botanica','#/piante'],
    ['Animali','Impollinatori, osservazione e convivenza','animali insetti fauna impollinatori prudenza api bombi zecche','#/animali'],
    ['Gli alberi', 'Riconoscerli e cosa ci cresce sotto', 'alberi bosco piante', '#/alberi'],
    ['Prepararli e conservarli', 'Crudo, prebollitura, congelare, essiccare, sott\'olio', 'preparazione cucina cuocere cottura crudo prebollitura congelare surgelare essiccare seccare sottolio sott olio botulino conserve vasetti quantita bambini gravidanza alcol', '#/info'],
    ['Il mio taccuino', 'Annota ricerche, ritrovamenti e osservazioni', 'taccuino diario appunti uscite registrare raccolto storico esporta', '#/diario'],
    ['Approfondimenti sul bosco', 'Alberi, piogge e preparazione della passeggiata', 'imparare guide passeggiate boschi editoriale', '#/guide'],
    ['La mappa', 'Zone, parcheggi, sentieri, Carta Forestale', 'mappa carta forestale parcheggio sosta', '#/mappa'],
    ['Installa l\'app', 'A tutto schermo e senza campo', 'installa app schermo home offline', '#/info'],
  ];
  for (const [title, sub, hay, href] of pages) items.push({ kind: 'pagina', title, sub, hay, href, img: '<span class="sr-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg></span>' });
  for(const item of items) {
    if(!['fungo','velenoso','pianta','albero'].includes(item.kind))continue;
    const id=decodeURIComponent(item.href.split('/').pop());
    const record=item.kind==='pianta'?plants().find(p=>p.id===id):item.kind==='albero'?trj?.trees?.[id]:taxonByKey(id);
    const entry=catalog.find(s=>s.id===id);
    item.searchNames=[item.title,record?.latin,...(record?.aliases||[]),...(entry?.aliases||[]),...(idj?.species?.[id]?.aka||[])].filter(Boolean).join(' ');
    item.features=speciesFeatures(record || entry || {});
  }
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
const ring = (s, big = true, interactive = false) => `<${interactive?'button type="button" data-index-tip aria-expanded="false"':'span'} data-weather-key="fungi-indicator" class="ring${big ? '' : ' ring-sm'}" style="--c:var(${scoreVar(s).replace('--s', '--ps')});--p:${s ?? 0}" aria-label="Indice funghi ${formatIndex(s)} su 10, ${scoreLabel(s)}${interactive?': come leggerlo':''}">${progressCircle(s)}${fungusGlyph}<b>${scoreText(s)}</b>${big ? `<span class="ring-caption">Condizioni<br>${scoreShortLabel(s)}</span>` : ''}</${interactive?'button':'span'}>`;
const IC = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v15M12 5C8 3 5 3 3 4v14c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-5-1-9 1Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
  unknown: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  car: carGlyph,
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
 if(!state.showDiscoveries&&!hasInterest('piante'))return [];
 if(hasInterest('piante'))return outdoorDiscoveries(z,d,walk);
 return outingDiscoveries({zone:z,zoneHabitat:habitat[z.id],trail:walk?.t,trailCategories:trails[z.id]?.sample_categories,seriesByBand:series?.[z.id],date:d?.date||todayISO(new Date(Date.now()+state.dayOffset*864e5)),models:plantModels,flora:plants(),trees:treesData?.trees,observations:state.useBotanicalNotes?botanicalNotes:[]});
}
function discoveriesHtml(z,d,walk,items=discoveriesFor(z,d,walk),{compact=false,featured=false}={}){
 if(!items.length)return '';
 return `${compact?'<h3 class="map-discoveries-title">Da osservare</h3>':`<p class="discovery-intro">Potresti incontrare anche queste specie. ${items[0].scope==='tracciato'?'Ambienti campionati sul tratto del sentiero':'Compatibilità con gli ambienti della zona'}: presenza da verificare.</p>`}<ul class="discovery-grid">${items.map(item=>{
  const key=`${z.id}/${item.date}/${item.kind}/${item.id}`;discoveryItems.set(key,item);
  return `<li><a href="${esc(item.href)}" data-discovery="${esc(key)}" data-entity class="discovery-link">${featured&&(item.kind==='pianta'?plantHeroSrc(item.id):treeHeroSrc(item.id))?`<img class="discovery-photo" data-src="${esc(item.kind==='pianta'?plantHeroSrc(item.id):treeHeroSrc(item.id))}" alt="" loading="lazy" decoding="async">`:item.kind==='pianta'?plantThumb(item.id,44):treeThumb(item.id,44)}<span><small>${item.kind==='albero'?'Albero':plantRecord(item.id)?.category||'Pianta'}</small><b>${esc(item.name)}</b><small>${esc(item.phase)}</small></span><span aria-hidden="true">›</span></a></li>`;
 }).join('')}</ul>${compact?'':actRow('#/piante','leaf','Scopri altre piante','Erbe, fiori, frutti e arbusti')}`;
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
 if(!box)return;const found=discoveriesHtml(z,d,walk,discoveriesFor(z,d,walk),{featured:true}),html=found&&found+challengeHint(z,d);box.hidden=!html;const markup=html?`<section class="outing-discoveries" aria-labelledby="during-walk-title"><h2 id="during-walk-title">Durante il giro</h2>${html}</section>`:'';if(weatherPainting)updateWeatherHTML(box,markup);else box.innerHTML=markup;
}
const expandedObservations=new Set();
document.addEventListener('toggle',e=>{
 const el=e.target;if(!el.matches?.('.observation-discoveries'))return;
 if(el.open)expandedObservations.add(el.dataset.discoveryGroup);else expandedObservations.delete(el.dataset.discoveryGroup);
},{capture:true});
function discoverySection(z,d,walk,embedded=false){
 const items=discoveriesFor(z,d,walk);if(!items.length)return '';
 if(embedded){
  const key=`${z.id}/${walk?.t?.id||'zona'}`;
  return `<details class="observation-discoveries" data-discovery-group="${esc(key)}"${expandedObservations.has(key)?' open':''}><summary><span class="discovery-summary"><b>Piante e alberi lungo il giro</b><small>${items.map(i=>esc(i.name)).join(' · ')}</small></span></summary><div class="observation-discovery-body">${discoveriesHtml(z,d,walk,items)}</div></details>`;
 }
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
  if(state.communityOnly&&!zones.some(z=>communityHasZone(z.id))){
    updateWeatherHTML($('#hero'),communityEmptyHtml());updateWeatherHTML($('#ranking'),'');$('#others-h').hidden=true;$('#season-h').hidden=true;updateWeatherHTML($('#season'),'');$('#during-walk').hidden=true;return;
  }
  arrangeHome();
  if(state.target!=='funghi'){renderOutdoorHome();return;}
  for(const el of document.querySelectorAll('#hero,#ranking,#season'))el.dataset.glossaryContext=state.target==='piante'?'Piante':'Funghi';
  let list = combosList();
  if(weatherPainting&&homeProposalKeys.length){
    const held=homeProposalKeys.map(k=>{const z=zones.find(z=>z.id===k.id),d=dayEntry(k.id,k.o);return z&&d?.best&&(!state.communityOnly||communityHasZone(z.id))&&(k.o!==0||(homeDateManual&&state.homeDay===0)||practicalTiming(z,d,walkFor(z,d,k.trail)).available)?{z,d,o:k.o,s:adjusted(z,d.score,d),walk:walkFor(z,d,k.trail)}:null;}).filter(Boolean);
    // Una proposta per zona e per sentiero, come combosList: se il meteo nuovo sposta
    // il giorno migliore di una zona già mostrata, resta la proposta già letta.
    const usedZones=new Set(held.map(c=>c.z.id)),usedTrails=new Set(held.map(c=>c.walk&&String(c.walk.t.id)).filter(Boolean));
    list=[...held,...list.filter(c=>!usedZones.has(c.z.id)&&!(c.walk&&usedTrails.has(String(c.walk.t.id))))];
  }
  homeProposalKeys=list.slice(0,8).map(c=>({id:c.z.id,o:c.o,trail:c.walk?.t.id}));
  const hero = list[0];
  if(!hero&&hasInterest('piante')){renderOutdoorHome();return;}
  const box = $('#hero');
  if (!hero) { $('#during-walk').hidden=true;$('#during-walk').innerHTML='';box.innerHTML = `<p class="notice">${selectedSpecies().length ? 'Le condizioni di crescita non sono calcolabili: mancano dati o meteo aggiornato.' : 'Per queste specie l’indice di crescita non è ancora disponibile. Puoi consultare le schede e contribuire con le osservazioni.'} Puoi comunque esplorare boschi e sentieri.</p><div class="explore-fallback">${zones.slice(0, 6).map((z) => `<a class="btn ghost" href="#/zona/${z.id}/${state.homeDay || 0}">${esc(z.title || z.name)}</a>`).join('')}</div>`; $('#ranking').innerHTML = ''; $('#others-h').hidden = true; renderSeason(); renderCommunityIntro(); return; }
  $('#others-h').hidden = false;
  const t = state.target==='funghi'&&hero.d.crowd ? timingAdvice({ dateStr: hero.d.date, lat: hero.z.lat, lon: hero.z.lon, crowd: hero.d.crowd }) : null;
  const a0 = access[hero.z.id]?.[0];
  const [title, sub] = splitName(hero.z);
  const cov = coverOf(hero.z, hero.d.best.species.id, hero.d);
  const w0 = wxOf(hero.z, hero.d);
  // il posto con l'indice piu' alto quel giorno, se il meteo della mattina l'ha fatto scendere: nota breve e cliccabile
  const g = list.filter((c) => c.o === hero.o).sort((a, b) => b.s - a.s)[0], wg = g && wxOf(g.z, g.d);
  const note = g && g.z.id !== hero.z.id && wg && wg.level !== 'ok'
    ? `<a class="cover-note" href="#/zona/${g.z.id}/${g.o}"><span>${wxi(wg)}<b>${esc(splitName(g.z)[0])}</b> <span class="pc-up">${formatIndex(g.s)}</span> ma ${esc(wg.short || wg.main)}</span><span aria-hidden="true">›</span></a>` : '';
  const heroHTML = `${state.seasonSuspended?'<p class="notice">Filtro sulle specie sospeso fuori dal calendario indicativo. <button type="button" class="link-btn" data-season-restore>Ripristina la scelta</button></p>':''}${homeCover({c:hero,photo:cov,score:hero.s,body:`
        <span class="cover-title">${esc(title)}</span>${sub ? `<span class="cover-sub">${esc(sub)}</span>` : ''}
        ${hero.walk ? `<span class="cover-walk"><b>${esc(hero.walk.microzone)}</b><span>${esc(walkBrief(hero.walk))}</span></span>` : ''}
        <span class="cover-sp">${thumb(hero.d.best.species.id, 44)}<span><small>${hero.d.best.kind==='plant'?'Da osservare':'Da conoscere in questi boschi'}</small><span class="cover-sp-name"><b>${esc(hero.d.best.species.name)}</b>${Number.isFinite(hero.d.best.score) ? ` <span class="sp-also-score sp-main-score"><i aria-hidden="true" style="background:var(${scoreVar(hero.d.best.score).replace('--s', '--ps')})"></i><b class="pc">${formatIndex(hero.d.best.score)}</b></span>` : ''} ${reportBadge(hero.z.id, hero.d.best.species.id)}</span>
          <small>${hero.d.best.kind==='plant'?`Periodo indicativo: ${esc(hero.d.best.phaseLabel.toLowerCase())}`:`${intornoA(hero.d.best.band)} ${hero.d.best.band} m`}${hero.d.best.kind!=='plant' && pineHostUnsure(hero.z, hero.d.best.species, hero.d.best.band) ? ' · la carta non conferma i pini' : ''}</small></span></span>
        ${plantCoverHint(hero)}
        <span class="facts" aria-label="L'uscita in breve">${t ? fact('clock', practicalTiming(hero.z,hero.d,hero.walk).available ? `<span class="fk">entro le </span><b>${fmtRough(t.arrive,15,'floor')}</b>` : '<b>Orario superato</b>') : ''}${fact('car', `<span><b>${compactTravel(zoneTrip(hero.z,hero.walk))}</b></span>`)}${state.target==='funghi'&&hero.d.crowd ? `<span class="fact" title="${esc(crowdText(hero.d.crowd))}">${IC.people}<span class="fc">${crowdText(hero.d.crowd)}</span></span>` : ''}${w0 ? `<span class="fact wx-${w0.level}" title="${esc(w0.text)}">${wxi(w0)}<span class="fx">${esc(w0.level === 'ok' ? w0.main : (w0.short || w0.main))}</span></span>` : ''}</span>
        ${note}
        <span class="cover-cta" aria-hidden="true">Dai uno sguardo <span>→</span></span>`})}`;
  if(weatherPainting)updateWeatherHTML(box,heroHTML);else box.innerHTML=heroHTML;
  box.querySelector('[data-season-restore]')?.addEventListener('click',restoreSeason);
  renderDiscoveries($('#during-walk'),hero.z,hero.d,hero.walk);
  const ol = $('#ranking');
  const rankingHTML = list.slice(1, 8).map((c) => {
    const cv = coverOf(c.z, c.d.best.species.id, c.d);
    const trail = c.walk?.t;
    const brief = trail ? `${trail.difficulty || 'Difficoltà n.d.'} · ${fmtKm(trail.in_zone_km)} km nel tratto` : '';
    return `<li data-weather-key="${c.z.id}|${c.o}" class="vtn" style="--vtn:t-${c.z.id}-${c.o}"><a class="tile" data-walk-zone="${c.z.id}" href="${walkHref(c.z, c.o, c.walk?.t)}">
      ${cv ? `<img data-src="${cv.small}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>${ring(c.s, false)}${(() => { const w = wxOf(c.z, c.d); return w && w.level !== 'ok' ? `<span class="tile-wx wx-${w.level}" title="${esc(w.text)}">${wxi(w)}${esc(OUTING_LABEL[w.level])}</span>` : ''; })()}
      <span class="tile-body"><span class="tile-day">${esc(dayLabel(c.o, c.d.date, true))}</span><b>${esc(splitName(c.z)[0])}</b>${brief ? `<small>${esc(brief)}</small>` : ''}</span>
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
  if (box) box.innerHTML = `<span class="community-leaf" aria-hidden="true">${leafGlyph}</span><h2>${esc(contentCopy.communityTitle || 'Condividi dal bosco')}</h2><p class="community-purpose">Aiuta Fronda a verificare le previsioni con ciò che osservi nel bosco. Anche una ricerca a vuoto è utile.</p><p class="small muted">${esc(communityStatus())}</p><div class="community-actions">${state.target==='funghi'?`<button class="btn primary" type="button" data-report>${notebookGlyph}<span>Annota un’osservazione nel taccuino</span></button>`:`<button class="btn primary" type="button" data-new-note>${notebookGlyph}<span>Aggiungi una nota al taccuino</span></button>`}</div>`;
}

// barra delle info: se non ci sta, toglie prima "entro le", poi "min", poi il testo del meteo quando e' bello (resta l'icona)
function fitFacts(el) {
  if (!el) return;
  el.classList.remove('t1', 't2', 't3', 't4');
  for (const c of ['t1', 't2', 't3', 't4']) { if (el.scrollWidth <= el.clientWidth + 1) break; el.classList.add(c); }
}
addEventListener('resize', () => fitFacts($('#hero .facts')));
document.fonts?.ready.then(() => fitFacts($('#hero .facts'))); // misurata col font giusto, non con quello di riserva
// Copertina della home alta quanto serve per arrivare esatta sopra la barra in basso, su ogni telefono
function fitCover() {
  const c = $('#hero .cover');
  if (!c || state.view !== 'uscite' || c.classList.contains('cover-editorial')) return;
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
  const botanical=hasInterest('piante')?plantRailItems(combosList()):[];
  $('#season-h').hidden=!arr.length&&!botanical.length;
  const html = arr.map((p) => {
    const ph = speciesPhoto(p.species.id);
    return `<li data-weather-key="season-${p.species.id}"><button type="button" class="portrait" data-species="${p.species.id}">
      ${ph ? `<img data-src="${assetSrc(ph.file)}" alt="" loading="lazy" decoding="async">` : ''}<span class="shade"></span>${ring(p.score, false)}
      <span class="portrait-body"><b>${esc(p.species.name)}</b>${reportBadge(p.z.id, p.species.id)}<small>${esc(splitName(p.z)[0])}</small></span></button></li>`;
  }).join('')+plantRailHtml(botanical);
  // Sempre riconciliata sul posto (le azioni sono delegate): le card che restano tengono la loro foto,
  // invece di sparire e ricomparire a ogni ridisegno (meteo, filtri, segnalazioni).
  updateWeatherHTML(box, html);
}

function renderMapDays() {
  const box = $('#map-days');
  const html = Array.from({length:AHEAD_DAYS+1}, (_,o) => { const date = outdoorDate(o); return `<button type="button" class="day" role="tab" data-day-offset="${o}" aria-selected="${o === state.dayOffset}" aria-label="${esc(fmtDate(date,{weekday:'long',day:'numeric',month:'long'}))}"><span class="d1">${o===0?'Oggi':o===1?'Domani':esc(fmtDate(date,{weekday:'long'}))}</span><span class="d2">${esc(fmtDate(date,{day:'numeric'}))}</span></button>`; }).join('');
  if (box.innerHTML !== html) box.innerHTML = html;
  box.querySelectorAll('[data-day-offset]').forEach(b => b.onclick = () => { mapDateManual=true;$('.map-top').classList.remove('days-open');if(state.dayOffset===Number(b.dataset.dayOffset)){$('#map-filters [data-days]')?.setAttribute('aria-expanded','false');$('#map-filters [data-days]')?.focus({preventScroll:true});return;}state.dayOffset=Number(b.dataset.dayOffset);checkSavedSeason();renderAll();renderFilterSummary();dateChangeFeedback('#map-filters [data-days]', '#map-results');$('#map-filters [data-days]')?.focus({preventScroll:true}); });
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
  closeCellCard();
  if(state.target!=='funghi'){openOutdoorSheet(zid);return;}
  sheetPoint=null;sheetZone = zid;
  if (!results) { openOutdoorSheet(zid); return; }
  const z = zones.find((x) => x.id === zid);
  const d = dayEntry(zid, state.dayOffset);
  const sh = $('#map-sheet');
  if (!z) { sh.hidden = true; return; }
  if (!d?.best) { openOutdoorSheet(zid); return; }
  const sc = adjusted(z, d.score, d);
  const cv = coverOf(z, d.best.species.id, d),walk=walkFor(z,d,state.trailId);
  sh.innerHTML = `
    <button type="button" class="sheet-close" aria-label="Chiudi">✕</button>
    <a class="sheet-row" href="#/zona/${zid}/${state.dayOffset}">
      <span class="sheet-img">${cv ? `<img data-src="${cv.small}" alt="" loading="lazy" decoding="async">` : ''}${ring(sc, false)}</span>
      <span class="sheet-txt"><span class="eyebrow">${esc(dayLabel(state.dayOffset, d.date, true))}</span><b class="sheet-title">${esc(splitName(z)[0])}</b>
        <span class="small">${esc(d.best.species.name)} ~${d.best.band} m · ${esc(travelText(zoneTrip(z)))}${d.crowd ? ` · ${crowdText(d.crowd)}` : ''}</span>${wxOf(z, d) ? `<span class="small wx-line wx-${wxOf(z, d).level}">${wxi(wxOf(z, d))}${esc(wxOf(z, d).text)}</span>` : ''}</span>
    </a>
    ${hasInterest('piante')?discoveriesHtml(z,d,walk,mapPlants(z,d,walk),{compact:true}):''}
    ${forestOn ? forestHere(zid) : ''}
    <p class="sheet-key small"><span class="key-p">P</span> sosta <span class="key-walk">${IC.walk}</span> qui lasci l'auto <span class="key-trail"></span> sentiero consigliato <span class="muted">· tocca un segno</span></p>
    <a class="btn primary big" href="#/zona/${zid}/${state.dayOffset}">Apri il piano dell'uscita</a>`;
  sh.hidden = false;
  sh.querySelector('.sheet-close').addEventListener('click', () => { sh.hidden = true; sheetZone = null; state.zoneId = null; renderMap(); });
  if (state.zoneId !== zid) { state.zoneId = zid; renderMap(); }
}

function openPoint(zid, pt) {
  closeCellCard();
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
    // un sentiero o una pista non si propone come strada da fare in auto: lo stato di una pista forestale si verifica sul posto
    ic = `<span class="pt-ic pt-walk">${IC.walk}</span>`; eyebrow = ax.surface === 2 ? 'Punto d’accesso su sentiero o pista' : 'Qui lasci l\'auto e prosegui a piedi'; title = ax.road || 'Punto più vicino al bosco adatto';
    text = `${ax.surface === 2 ? 'Questo punto è su un sentiero o una pista: non è detto che ci si arrivi in auto. Da qui' : `In auto ${ax.surface ? `su ${SURF_LABEL[ax.surface]}` : 'su asfalto'} fino a qui, poi`} ${ax.walkM < 50 ? `il bosco adatto è ${ax.surface === 2 ? 'subito accanto' : 'a bordo strada'}:${esc((SHORT[ax.cat] || ax.cat || 'paesaggio non classificato').toLowerCase())} a ${ax.e} m` : `${walkTxt(ax.walkM)} fino a ${esc((SHORT[ax.cat] || ax.cat || 'paesaggio non classificato').toLowerCase())} a ${ax.e} m`}, adatto a ${speciesLink(d.best.species, d.best.species.name.toLowerCase())}. ${ACCESS_CHECK}`;
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
    ${trailVisual(z, t, d, [h], 'map')}</div>`;
}

let mapExperience=null,mapResultsQueued=false,mapInitialFrameDone=false;
function mapCandidates() {
  return (weatherZones||zones||[]).map(z=>{
    const d=dayEntry(z.id,state.dayOffset),day=d||{date:outdoorDate(state.dayOffset)},walk=walkFor(z,day,z.id===state.zoneId?state.trailId:null);
    if(!matchesInterests(z,day,walk))return null;
    const score=hasInterest('funghi')?d?.score:null,trip=zoneTrip(z,walk);
    return {z,d,walk,score,trip,o:state.dayOffset,rank:Number.isFinite(score)?preferenceRank(z,score,d)*wxRank(z,d)*communityRank(z.id,selectedCatalog().filter(s=>!botanicalById(s.id)).map(s=>s.id)):-Infinity,weatherRank:wxRank(z,day),botanicalRank:hasInterest('piante')?Math.max(0,...mapPlants(z,day,walk).map(i=>i.rank||0)):0,minutes:trip.minutes,crowd:d?.crowd?.value??z.popularity,comfort:d?.comfort?.value};
  }).filter(Boolean).sort((a,b)=>hasInterest('funghi')?b.rank-a.rank||compareOutdoor(a,b,state):compareOutdoor(a,b,state));
}
function scheduleMapResults(){
  if(mapResultsQueued)return;mapResultsQueued=true;
  requestAnimationFrame(()=>{mapResultsQueued=false;renderMapResults();});
}
function renderMapResults(){
  if(!mapExperience||state.view!=='mappa')return;
  const status=$('#map-weather-status');status.hidden=$('#stale').hidden&&!$('#weather-work').classList.contains('busy');status.querySelector('summary').textContent=!$('#stale').hidden?'Meteo da verificare':'Aggiornamento meteo…';
  const all=mapCandidates();
  // Al primo accesso i contributi possono arrivare dopo la carta: inquadra
  // i risultati appena disponibili, senza ricentrare le visite successive.
  if(map&&!mapInitialFrameDone&&all.length){map.invalidateSize({pan:false});mapInitialFrameDone=frameMapZones(all.map(r=>r.z),{overview:true,animate:false});}
  const visible=map?all.filter(r=>map.getBounds().contains([r.z.lat,r.z.lon])):all;
  const prefs=PREFS.filter(([key])=>state[key]).map(([,name])=>name.toLowerCase());
  const order=prefs.length?`Ordinate anche per ${prefs.join(', ')}. L’indice dei funghi non cambia.`:hasInterest('funghi')?'Indice dei funghi e condizioni dell’uscita. Le zone senza indice restano esplorabili.':hasInterest('piante')?'Ambienti e spunti botanici, senza un indice delle piante.':'Zone con i tratti mappati, accessi e condizioni dell’uscita.';
  mapExperience.render({total:all.length,order:(state.communityOnly?'Dati community Fronda · In sviluppo. Osservazioni dichiarate degli ultimi 7 giorni. ':'')+order,rows:visible.map(r=>({id:r.z.id,name:shortName(r.z),selected:r.z.id===state.zoneId,index:Number.isFinite(r.score)?`${fungusGlyph}${idxDot(r.score)}`:'',meta:[Number.isFinite(r.trip.minutes)?`${r.trip.minutes} min in auto`:'',r.walk?`${r.walk.t.difficulty||'Sentiero'} · ${fmtKm(r.walk.t.in_zone_km)} km nel tratto`:'Scheda della zona',hasInterest('funghi')&&!Number.isFinite(r.score)?'Indice non disponibile':'',state.avoidCrowd&&r.d?.crowd?crowdText(r.d.crowd):''].filter(Boolean).join(' · ')}))});
  if(state.communityOnly&&!all.length){const empty=mapExperience.host.querySelector('[data-map-empty]');empty.hidden=false;empty.innerHTML=communityEmptyHtml();}
}
function mapCameraOptions({animate=true,maxZoom=12.5}={}){
  const box=map.getContainer().getBoundingClientRect(),toolbar=$('.map-top'),sheet=$('#map-sheet');
  let right=24,bottom=24;
  if(!sheet.hidden){
    if(box.width>=900&&box.width-sheet.offsetWidth>360)right=sheet.offsetWidth+32;
    else bottom=Math.min(sheet.offsetHeight+24,box.height*.5);
  }else{
    for(const el of [$('.tabbar'),mapExperience?.host]){
      if(!el||el.hidden)continue;const r=el.getBoundingClientRect();
      if(r.top>box.top&&r.top<box.bottom&&r.bottom>box.top)bottom=Math.max(bottom,Math.min(box.bottom-r.top+16,box.height*.4));
    }
  }
  return {paddingTopLeft:[24,toolbar.offsetTop+toolbar.offsetHeight+20],paddingBottomRight:[right,bottom],maxZoom,animate:animate&&!reduceMotion(),duration:.3,easeLinearity:.3};
}
function frameMapZones(items,{overview=false,animate=true}={}){
  if(!map||!items.length)return false;
  const bounds=L.latLngBounds([]);
  for(const z of items)bounds.extend(L.latLng(z.lat,z.lon).toBounds(z.radius_m*2.3));
  map.stop();map.fitBounds(bounds,mapCameraOptions({animate,maxZoom:overview?11:12.5}));return true;
}
function fitMapResults({animate=true}={}){
  return frameMapZones(mapCandidates().map(r=>r.z),{overview:true,animate});
}
function chooseMapZone(id,{animate=true}={}){
  if(mapExperience)mapExperience.host.open=false;
  const toolbar=$('.map-top');toolbar.classList.remove('days-open');toolbar.querySelector('[data-days]')?.setAttribute('aria-expanded','false');
  openSheet(id);
  const z=(weatherZones||zones).find(z=>z.id===id);
  if(map&&z)frameMapZones([z],{animate});
}
function initMapExperience(){
  if(mapExperience)return;
  mapExperience=mountMapResults($('.view-map'),{choose:chooseMapZone,fit:fitMapResults,filters:openFullFilters});
  if(!hasLeaflet())$('#map-results .map-results-body').append($('.legend-box'));
  const status=$('#map-weather-status');
  const sync=()=>{if(state.view!=='mappa')return;status.hidden=$('#stale').hidden&&!$('#weather-work').classList.contains('busy');status.querySelector('summary').textContent=!$('#stale').hidden?'Meteo da verificare':'Aggiornamento meteo…';scheduleMapResults();};
  const observer=new MutationObserver(sync);
  observer.observe($('#stale'),{attributes:true,childList:true,subtree:true});observer.observe($('#weather-work'),{attributes:true,childList:true,subtree:true});
  mapExperience.host.addEventListener('toggle',()=>{if(mapExperience.host.open)renderMapResults();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){const top=$('.map-top');if(top?.classList.contains('days-open')){top.classList.remove('days-open');$('#map-filters [data-days]')?.setAttribute('aria-expanded','false');$('#map-filters [data-days]')?.focus();}}});
  sync();scheduleMapResults();
}

function initMap() {
  initMapExperience();
  const bm = globalThis.FUNGAROLI_DATA?.basemap || globalThis.FUNGAROLI_REVIEW?.basemap;
  if (hasLeaflet() && bm) { initEmbeddedMap(bm); return; }
  if (!hasLeaflet()) { document.querySelector('.view-map')?.classList.add('schematic'); return; } // senza Leaflet: mappa schematica
  map = L.map('map', { scrollWheelZoom: true, zoomControl: false, zoomSnap:.5 }).setView([42.4, 13.05], 10);
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
  map.on('moveend',()=>{syncCellBackdrop();scheduleMapResults();});
  // la carta cambia misura (barra in alto che sparisce, rotazione): Leaflet va avvisato
  new ResizeObserver(() => map.invalidateSize({pan:false})).observe($('#map'));
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
      const legend=$('.legend-box');if(legend)panel.append(legend);
      return box;
    },
  });
  new Ctl({ position: 'topright' }).addTo(map);
}


// Versione Artifact: base topografica e Carta Forestale incorporate come immagini georeferenziate.
function initEmbeddedMap(bm) {
  const bounds = L.latLngBounds(bm.bounds);
  map = L.map('map', { maxBounds: bounds.pad(0.05), minZoom: 9, maxZoom: 14, zoomSnap: 0.5, zoomControl: false }).setView([42.42,13.03],10);
  L.imageOverlay(bm.topo, bounds, { className: 'basemap', attribution: bm.attribution }).addTo(map);
  const forest = L.imageOverlay(bm.forest, bounds, { opacity: 0.55, className: 'forestmap' });
  mapControls({ forest });
  map.on('zoomend', () => results && state.view === 'mappa' && renderMap());
  map.on('moveend',()=>{syncCellBackdrop();scheduleMapResults();});
  // la carta cambia misura (barra in alto che sparisce, rotazione): Leaflet va avvisato
  new ResizeObserver(() => map.invalidateSize({pan:false})).observe($('#map'));
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
      if (cat === FOREST.CON && PINE_HOSTS[p.species.id]) continue; // categoria mista: presenza di pini non confermata
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
  cellHi?.remove(); cellHi = null;
  const leaving=cellTip;cellTip=null;
  if(card&&!reduceMotion()){card.classList.add('is-leaving');setTimeout(()=>leaving?.remove(),120);}else leaving?.remove();
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
  map.on('click', e => { if (!pinCellCard(e)) {closeCellCard();} });
  map.on('dragstart zoomstart', closeCellCard); map.on('dragstart zoomstart', hideCellPeek);
  map.getContainer().setAttribute('aria-keyshortcuts', 'Enter');
  map.getContainer().setAttribute('aria-label', 'Mappa delle zone. Premi Invio per selezionare la zona più vicina al centro; con una zona selezionata, premi Invio per aprire un’area al suo interno.');
  map.getContainer().addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target !== map.getContainer()) return;
    const center = map.getCenter(), bounds = map.getBounds();
    if(!state.zoneId){
      const zone=mapCandidates().filter(r=>bounds.contains([r.z.lat,r.z.lon])).sort((a,b)=>center.distanceTo([a.z.lat,a.z.lon])-center.distanceTo([b.z.lat,b.z.lon]))[0]?.z;
      if(zone){e.preventDefault();chooseMapZone(zone.id);}
      return;
    }
    if(!$('#map').classList.contains('cells-on'))return;
    const nearest = cellHits.filter(h => h.z.id===state.zoneId && bounds.contains([h.c.lat, h.c.lon])).sort((a, b) => center.distanceTo([a.c.lat, a.c.lon]) - center.distanceTo([b.c.lat, b.c.lon]))[0];
    if (nearest) { e.preventDefault(); selectCell(nearest,{keyboard:true}); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cellTip && !document.querySelector('dialog[open],.learning-panel:popover-open')) {
      e.preventDefault(); closeCellCard();
    }
  });
  addEventListener('hashchange',()=>{closeCellCard();});
}
function selectCell(h,{keyboard=false}={}){
  // Il campione approfondisce una zona già scelta; non seleziona una zona implicitamente.
  if(!h||h.z.id!==state.zoneId)return;
  map.stop();closeCellCard();
  sheetZone=null;sheetPoint=null;
  const toolbar=$('.map-top');toolbar.classList.remove('days-open');toolbar.querySelector('[data-days]')?.setAttribute('aria-expanded','false');
  $('#map-sheet').hidden=true;
  if(mapExperience)mapExperience.host.open=false;
  const current=cellHits.find(x=>x.z.id===h.z.id&&x.c.lat===h.c.lat&&x.c.lon===h.c.lon);
  if(!current)return;
  showCellCard(current);cellPinned=true;
  if(keyboard)cellTip?.getElement()?.querySelector('[data-cell-close]')?.focus({preventScroll:true});
}

function pinCellCard(e) {
  if(e.originalEvent?._frondaCellHandled)return true;
  const h = $('#map').classList.contains('cells-on') && cellAt(e.latlng,e.target?.options?.zoneId);
  if (!h) return false;
  if(e.originalEvent)e.originalEvent._frondaCellHandled=true;
  selectCell(h);return true;
}
function cellsLayer(z, d, interactive = true) {
  if (!map.getPane('cells')) map.createPane('cells').style.zIndex = 410; // sopra i cerchi, sotto le etichette
  cellRenderer ||= L.canvas({ padding: 0.3, pane: 'cells' });
  const lg = L.layerGroup();
  const size = cellSize(z);
  const dLat = size / 2 / 111320, dLon = size / 2 / (111320 * Math.cos(z.lat * Math.PI / 180));
  for (const c of zoneCells(z, d)) {
    L.rectangle([[c.lat - dLat, c.lon - dLon], [c.lat + dLat, c.lon + dLon]], {
      renderer: cellRenderer, interactive: false, stroke: false, zoneId:z.id, fillColor: cssVar(mapVar(c.v)), fillOpacity: 0.5 + 0.4 * Math.min(1, c.v / 80),
    }).addTo(lg);
    if (interactive) cellHits.push({ z, c, dLat, dLon });
  }
  return lg;
}
function cellAt(ll,preferred=state.zoneId) {
  if(!state.zoneId||preferred!==state.zoneId)return null;
  return cellHits.find(h=>h.z.id===state.zoneId&&Math.abs(ll.lat-h.c.lat)<=h.dLat&&Math.abs(ll.lng-h.c.lon)<=h.dLon)||null;
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
  const html = mapCard({ title: c.cat, sub: `${esc(shortName(h.z))} · ${c.e} m s.l.m. · area ${c.size} × ${c.size} m`, pct: c.v, interactive: true,
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
  const toolbar=$('.map-top'),topInset=Math.min(toolbar.offsetTop+toolbar.offsetHeight+12,size.y-card.offsetHeight-16);
  const y = Math.max(halfH + Math.max(8,topInset), Math.min(size.y - halfH - 8, above - halfH >= topInset ? above : point.y + halfH + 10));
  cellTip.setLatLng(map.containerPointToLatLng([x, y]));
  cellTip._fz = c; cellTip._zoneId=h.z.id; cellTip._fhtml = content;
}

function renderMap(changed=null) {
  scheduleMapResults();
  const mapZones=weatherZones||zones;
  if(state.target!=='funghi'){renderOutdoorMap();return;}
  if (!hasLeaflet()) {
    renderSvgMap($('#map'), {
      zones:mapZones, origin,
      items: mapZones.filter(z=>matchesInterests(z,dayEntry(z.id,state.dayOffset),walkFor(z,dayEntry(z.id,state.dayOffset)))).map((z) => {
        const d = dayEntry(z.id, state.dayOffset);
        const s = adjusted(z, d?.score ?? null, d);
        return {
          z, score: s, color: `var(${mapVar(s)})`, selected: z.id === state.zoneId,
          tooltip: `${z.name} · ${scoreText(s)}/10 ${scoreLabel(s).toLowerCase()}${d?.best ? ` · ${d.best.species.name} ~${d.best.band} m` : ''}`,
        };
      }),
      onSelect: (id) => chooseMapZone(id),
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
  for(const k in zoneLayers)if(!changed||changed.has(k)||!mapZones.some(z=>z.id===k)){zoneLayers[k].remove();delete zoneLayers[k];}
  cellHits = changed?previousHits.filter(h=>zoneLayers[h.z.id]):[];peekCellBounds=[];mapEl.classList.remove('cells-peek');
  // etichette delle zone in un livello sopra i segnavia e i pin: nome e indice restano sempre leggibili
  if (!map.getPane('zoneLabels')) map.createPane('zoneLabels').style.zIndex = 640;
  if (!map.getPane('zoneFocus')) map.createPane('zoneFocus').style.zIndex = 420;
  // etichette con nome: spostamento verticale greedy (in pixel) per evitare sovrapposizioni
  const placed = [];
  const labelPos = {};
  for (const z of mapZones) {
    const pt = map.latLngToContainerPoint([z.lat, z.lon]);
    const w = 40 + shortName(z).length * 7 + (hasInterest('piante')?22:0);
    let y = pt.y;
    const hit = (yy) => placed.some((b) => Math.abs(b.x - pt.x) < (b.w + w) / 2 + 4 && Math.abs(b.y - yy) < 26);
    for (let k = 1; hit(y) && k < 8; k++) y = pt.y + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 26;
    placed.push({ x: pt.x, y, w });
    labelPos[z.id] = map.containerPointToLatLng([pt.x, y]);
  }
  for (const z of mapZones) {
    if(changed&&zoneLayers[z.id])continue;
    const d = dayEntry(z.id, state.dayOffset);
    if(!matchesInterests(z,d,walkFor(z,d)))continue;
    const s = adjusted(z, d?.score ?? null, d);
    const color = cssVar(mapVar(s));
    const g = L.layerGroup().addTo(map);
    const selected = z.id === state.zoneId;
    // il cerchio e' l'area di cui si parla, non il posto dei funghi: da vicino resta solo il contorno, dentro i riquadri
    const near = map.getZoom() >= 11.5;
    const showCells = near || selected;
    const circle = L.circle([z.lat, z.lon], {
      radius: z.radius_m, pane:selected?'zoneFocus':'overlayPane', color: selected ? cssVar('--text') : color, weight: selected ? 2.5 : 2,
      dashArray: showCells ? '6 6' : null, fillColor: color, fillOpacity: 0.28, zoneId:z.id,className: `zone-c${showCells ? ' has-cells' : ''}${selected?' is-selected':''}`,
    }).addTo(g).on('click', e => {
      if(z.id===state.zoneId&&pinCellCard(e))return;
      // Lo stesso clic non deve selezionare il cerchio e aprire anche il campione nel bubbling.
      if(e.originalEvent)e.originalEvent._frondaCellHandled=true;
      chooseMapZone(z.id);
    });
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
      icon: L.divIcon({ className: '', html: `<span class="zone-label${state.zoneId && !selected ? ' zone-label-min' : ''}${selected ? ' zone-label-sel' : ''}">${mapPlantBadge(z,d,walkFor(z,d))}<span class="dot" style="background:${color}"></span> ${Number.isFinite(s)?`<b class="pc">${formatIndex(s)}</b>`:''}${state.zoneId && !selected ? '' : ` <span class="zone-name">${esc(shortName(z))}</span>`}</span>`, iconSize: null }),
      interactive:true,pane:'zoneLabels',title:z.name,
    }).addTo(g).on('click',()=>chooseMapZone(z.id));
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
            if (n > 1 && map.getZoom() < map.getMaxZoom()) map.fitBounds(L.latLngBounds(gr.items.map((x) => [x.h.lat, x.h.lon])).pad(0.5),mapCameraOptions({maxZoom:Math.min(map.getMaxZoom(),map.getZoom()+2)}));
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
    const hit = cellHits.find(h => h.z.id===cellTip._zoneId && h.c.lat === displayedCell.lat && h.c.lon === displayedCell.lon);
    if (hit) showCellCard(hit, true); else closeCellCard();
  }
  const reveal=()=>{if(revision!==mapRenderRevision)return;mapEl.classList.toggle('cells-on',want);syncCellBackdrop();};
  // La tela Leaflet disegna al frame successivo: avvia la dissolvenza solo dopo.
  if(slow&&want&&!had)requestAnimationFrame(()=>requestAnimationFrame(reveal));else reveal();
}

function renderLegend() {
  if(state.target!=='funghi'){$('#legend').innerHTML=`<span>${hasInterest('piante')?'Ambienti e piante da osservare.':'Zone e sentieri mappati.'}</span><span>Le linee mostrano i tratti nella zona, non giri completi.</span>${mapPlantNote()}<div class="wms"${forestOn?'':' hidden'}>${forestLegend()}</div>`;return;}
  const items = [...CLASSES].reverse().map((c) => `<span><span class="sw" style="background:var(${mapVar(c.min)})"></span>${c.label}${c.min ? ' ≥' + formatIndex(c.min) : ''}</span>`);
  $('#legend').innerHTML = (hasInterest('piante')?'<span>Indice dei funghi · piante da osservare</span>':'') + items.join('') +
    (hasLeaflet() || !globalThis.FUNGAROLI_DATA ? '' : `<span class="muted">Schema: cerchi = zone, anelli = distanza in linea d’aria da ${esc(currentBase().name)}</span>`) +
    (hasLeaflet() &&state.target==='funghi' ? '<span class="lg-cells"><span class="sw sw-cell"></span>Riquadri campionati da 300–500 m: habitat potenziale, senza verifica di presenza o permesso di raccolta. Avvicinati o apri una zona per vederli.</span>' : '') +
    mapPlantNote()+`<div class="wms"${forestOn ? '' : ' hidden'}>${forestLegend()}</div>`;
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
  car: carGlyph,
  trail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20c2-4 8-3 8-7s-6-3-6-7"/><circle cx="17" cy="5" r="1.5"/></svg>',
};

// Dati del tratto sempre in testata; gli imbocchi sono un'anteprima del selettore nel grafico aperto.
// Solo dati del tratto nella zona: niente dislivello ricavato dai campioni (a passo fisso lo gonfierebbe);
// la salita della fonte riguarda l'itinerario completo e resta nella scheda aperta.
function walkGlance(z, t) {
  const sm = (t.samples || []).filter((x) => Number.isFinite(x[0]));
  const es = sm.map((x) => x[0]);
  // come nelle app outdoor: il numero sopra, l'etichetta piccola sotto (il testo letto resta «5,4 km nella zona»)
  const stat = (v, k) => `<li><span class="ws-v">${v}</span> <span class="ws-k">${k}</span></li>`;
  const stats = [
    stat(`${fmtKm(t.in_zone_km)}\u00a0km`, 'nella zona'),
    es.length ? stat(`${Math.min(...es)}–${Math.max(...es)}\u00a0m`, 'quote del tratto') : '',
    stat(t.difficulty ? difficultyLink(t.difficulty, t.difficulty) : 'n.d.', t.difficulty ? esc(DIFF[t.difficulty] || 'difficoltà') : 'difficoltà'),
  ].join('');
  const heads=headsOf(z,t);
  const entrances=heads.length?`<span class="walk-entrances"><span class="ws-k">${heads.length===1?'Imbocco mappato':'Imbocchi mappati'}</span><span class="walk-entrance-list">${heads.map((h,i)=>`<span class="walk-entrance"><i class="th-n">${i+1}</i><span><b>${esc(h.road||(h.kind==='strada'?'Su strada':'Su sterrata'))}</b>${h.ele!=null?`<small>${h.ele.toLocaleString('it-IT')} m</small>`:''}</span></span>`).join('')}</span></span>`:'<span class="walk-entrances"><span class="ws-k">Imbocco mappato</span><span class="small muted">Non disponibile; le soste indicate riguardano la zona</span></span>';
  return `<span class="walk-glance"><ul class="walk-stats">${stats}</ul>${entrances}</span>`;
}

function walkForest(z,t){
  const cats=trails[z.id]?.sample_categories||[],counts={};
  for(const [,c] of (t.samples||[]).filter(x=>Number.isFinite(x[0]))){const k=c>=0?cats[c]:'non bosco';if(k)counts[k]=(counts[k]||0)+1;}
  const n=Object.values(counts).reduce((a,b)=>a+b,0);
  return n>=4?`<div class="ws-forest"><p class="small muted">Boschi lungo il tratto</p>${forestBar(Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v/n])))}</div>`:'';
}

function renderWalkFocus(z, d, walk) {
  if (!walk) return `<p class="small muted">Non abbiamo ancora un sentiero documentato per questa zona.</p>`;
  const { t } = walk;
  return `<details class="sec walk-focus" data-glossary-context="Sentiero" name="zone-details" data-sec="passeggiata" data-walk-trail="${t.id}"${openSecs.has('passeggiata') ? ' open' : ''}>
    <summary><span class="walk-summary">
      <span class="eyebrow">La passeggiata, più da vicino</span><span class="walk-title">${esc(walk.microzone)}</span>
      <span class="walk-route">${segnavia(t)}<b>${esc(trailName(t))}</b></span>
      ${walkGlance(z, t)}
    </span></summary><div class="sec-body">
    <dl class="walk-facts"><div><dt>Itinerario completo</dt><dd>${fullTrailKm(t) ? `${fmtKm(fullTrailKm(t))} km` : 'Lunghezza n.d.'}${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div></dl>
    ${t.lines?.length > 1 ? '<p class="small muted">Il tratto nella zona comprende più segmenti separati.</p>' : ''}
    ${t.mainCat ? `<p class="small" data-glossary="${d?.best?.kind==='plant'?'Piante':'Funghi'}">Lungo il tracciato: ${linkTrees(t.mainCat.toLowerCase())} nei campioni tra circa ${Math.floor(t.lo / 25) * 25} e ${Math.ceil(t.hi / 25) * 25} m${d?.best?.species ? `, ${d.best.kind==='plant'?'proxy di paesaggio per':'compatibili con l’habitat di'} ${speciesLink(d.best.species, d.best.species.name.toLowerCase())}` : ''}.</p>` : ''}
    ${trailVisual(z, t, d, headsOf(z,t), 'focus')}
    ${walkForest(z,t)}
    <button type="button" class="btn ghost" data-note-kind="zona" data-note-id="${z.id}" data-note-zone="${z.id}" data-note-href="${esc(walkHref(z,state.dayOffset,t))}" data-note-title="${esc(trailName(t))}">${notebookGlyph}<span>Salva il giro nel taccuino</span></button>
    ${trailLinks(z, t)}
    <p class="small muted">Verifica accesso, sosta e stato del sentiero prima di partire.</p>
    <details class="context-note walk-data"><summary>Tracciato e limiti dei dati</summary><p>Il GPX contiene solo il tratto nella zona. Tempi e dislivello, quando disponibili, riguardano l’itinerario completo.</p><p>Tracciato OpenStreetMap / Waymarked Trails · imbocchi ricavati dalla rete stradale mappata.${state.target==='funghi'?' L’indice e le segnalazioni riguardano la zona, non questo singolo sentiero.':''}</p></details>
    </div>
  </details>`;
}

function essentialSections(z, d, walk) {
  const best = d.best, hostNote = pineHostNote(z, best.species, best.band);
  const observationRule = criticalRuleOf(best.species.id);
  // Gli avvisi brevi restano completi; quelli lunghi mantengono il titolo
  // nel riepilogo e il testo integrale nel dettaglio, senza riscrivere i dati.
  const expandedWarning = observationRule?.title && observationRule.text?.length > 120;
  const rows = [];
  rows.push({ sec: 'specie', icon: 'find', thumb: best.species.id, k: 'Cosa osservare', v: `<span class="primary-species"><button type="button" class="sp-inline" data-species="${best.species.id}">${esc(best.species.name)}</button>${best.kind!=='plant'&&Number.isFinite(best.score)?idxDot(best.score):''}</span> ${intornoA(best.band)} <b>${best.band} m</b>`,
    sub: attentionLine(expandedWarning ? {...observationRule, text:observationRule.title, title:''} : observationRule) });
  if (d.crowd &&state.target==='funghi') {
    const t = timingAdvice({ dateStr: d.date, lat: z.lat, lon: z.lon, crowd: d.crowd });
    rows.push({ sec: 'quando', icon: 'when', k: 'Quando', v: `<span>${practicalTiming(z,d,walk).available?`Arriva <b>entro le ${fmtRough(t.arrive,15,'floor')}</b>`:'<b>Orario consigliato superato</b>'}</span><span class="badge crowd-${d.crowd.level}">${crowdText(d.crowd)}</span>` });
  }
  const w=wxOf(z,d);
  if(w){
    const weatherText=esc(w.text.replace(/^./,c=>c.toUpperCase())),when=rows.find(r=>r.sec==='quando');
    if(when)when.sub=`<span class="when-weather wx-${w.level}">${wxi(w)}<span>${weatherText}</span></span>`;
    else rows.push({sec:'quando',svg:wxi(w),k:'Quando',v:weatherText});
  }

  const a0 = access[z.id]?.[0];
  const ax = walk?.h ? null : d?.access;
  if (a0 || ax || walk?.h || z.access || z.parking?.length) {
    const unp = a0?.unpaved_tail_km > 0.2 ? `, ultimi ${fmtKm(a0.unpaved_tail_km)} km su strada bianca` : '';
    rows.push({ sec: 'accesso', icon: 'car', k: 'Come arrivare',
      v: walk?.h ? `All’imbocco del sentiero ${esc(walk.t.ref || '')}` : ax ? `${ax.surface === 2 ? `Su sentiero o pista${ax.road ? ` (${esc(ax.road)})` : ''}, transito in auto da verificare` : `In auto ${ax.road ? `su ${esc(ax.road)}` : 'fino al punto più vicino'}`}${ax.walkM < 50 ? `: habitat campionato vicino ${ax.surface === 2 ? 'al punto d’accesso' : 'alla strada'}` :`, poi <b>${fmtM(ax.walkM)} in linea d’aria</b>`}` : a0 ? `${esc(travelText(zoneTrip(z)))} fino a ${esc(a0.parking)}` : 'Accessi e soste da verificare sul posto',
      sub: `${a0 ? `<span class="plan-travel">${esc(travelText(zoneTrip(z,walk)))} da ${esc(currentBase().name)}${customBase()?'':unp}</span>` : ''}${walk?.h ? actPill(gmaps(walk.h.lat, walk.h.lon),'nav','Indicazioni',true) : ax ? actPill(gmaps(ax.rlat, ax.rlon),'nav','Navigatore',true) : ''}`,
      badge: d.comfort ? `<span class="badge comfort-${d.comfort.level}">${d.comfort.level}</span>` : '' });
  }
  const observationContext = [expandedWarning && attentionLine({...observationRule,title:''}), whereSummary(best.species.id) && `<p class="plan-where">${linkTrees(whereSummary(best.species.id))}</p>`, hostNote && `<p class="plan-host">${esc(hostNote)}</p>`].filter(Boolean).join('');
  const bodies={specie:()=>`<div class="observation-context">${observationContext}</div>`+zoneSpecies(z,d)+discoverySection(z,d,walk,true),quando:()=>renderHuman(z,d)||renderWhenWeather(z,d),accesso:()=>renderAccess(z,d,{summarized:true,walk})};
  return `<div class="essential-sections"><h2 class="outing-section-title">Il piano in breve</h2>${Object.keys(bodies).map(id=>{
    const group=rows.filter(r=>r.sec===id);if(!group.length)return '';
    const summary=group.map(r=>`<span class="essential-summary"><span class="plan-ic${r.thumb?' has-thumb':''}">${r.thumb?thumb(r.thumb,48):r.svg||ICON[r.icon]}</span><span class="plan-body"><span class="plan-k">${r.k}${r.badge?' '+r.badge:''}</span><span class="plan-v">${r.v}</span>${r.sub?`<span class="plan-sub">${r.sub}</span>`:''}${id==='specie'?'<span class="observation-toggle" aria-hidden="true"><span class="observation-expand">Esplora specie e habitat</span><span class="observation-collapse">Chiudi dettagli</span></span>':''}</span></span>`).join('');
    return section(id,summary,bodies[id]()||'<p class="small muted">Verifica le previsioni aggiornate e le condizioni del percorso prima di partire.</p>');
  }).join('')}</div>`;
}

const section = (id, title, body, open = false) => body ? `
  <details class="sec" name="zone-details" data-sec="${id}"${['sentieri','accesso'].includes(id)?' data-glossary-context="Sentiero"':''}${openSecs.has(id) || (open && !openSecs.size) ? ' open' : ''}>
    <summary>${title}</summary><div class="sec-body">${body}</div>
  </details>` : '';
const openSecs = new Set();

// Idempotente: la scheda della zona si aggiorna sul posto e le sezioni restano gli stessi nodi, quindi ogni sezione
// riceve i suoi gestori una volta sola; l'azione all'apertura (es. i grafici del giorno scelto) è sempre l'ultima.
const boundSecs = new WeakSet();
function bindDetailSections(box, onOpen = () => {}) {
  box._onSecOpen = onOpen;
  const sections = [...box.querySelectorAll('details.sec[data-sec]')];
  const sync = (el) => {
    if(!el.isConnected||!box.contains(el))return;
    if (el.open) {
      // Also enforce exclusivity in browsers without native details[name] support.
      box.querySelectorAll('details.sec[data-sec]').forEach(other => { if (other !== el) other.open = false; });
      openSecs.clear(); openSecs.add(el.dataset.sec);
      box._onSecOpen(el.dataset.sec);
    } else openSecs.delete(el.dataset.sec);
  };
  sections.forEach(el => {
    if (boundSecs.has(el)) return;
    boundSecs.add(el);
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

let lastDetailHtml = '';
// ---- scheda della zona: aggiornamento sul posto e azioni delegate
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let detailCtx = null, detailAnimate = false;
// azioni della scheda delegate su #detail: un solo gestore, qualunque cosa venga aggiornata (niente azioni doppie)
$('#detail')?.addEventListener('click', (e) => {
  const day = e.target.closest('#zone-days [data-day-offset]');
  if (day) {
    const o = +day.dataset.dayOffset, c = detailCtx;
    if (!c || o === state.dayOffset) return;
    history.replaceState(null, '', walkHref(c.z, o, state.trailId ? c.walk?.t : null));
    mapDateManual = true; state.dayOffset = o; detailAnimate = true;
    try { renderDetail(); dateChangeFeedback('#zone-days [aria-selected="true"]'); } finally { detailAnimate = false; }
    return;
  }
  if (e.target.closest('[data-zone-weather-retry]')) { refreshWeather(true); return; }
  const c = detailCtx;
  if (!c) return;
  if (e.target.closest('[data-cover]') && c.cov) { openLightbox([{ src: c.cov.hd, alt: c.cov.alt, caption: captionHtml({ title: esc(c.z.name), credit: creditLine(c.cov.credit) }) }]); return; }

});
function updateDetailInPlace(box, html, cov) {
  const ring = box.querySelector(':scope > .phero .hero-indicators > .ring'), before = ring?.querySelector('b')?.textContent;
  // copertina diversa (stagione, meteo): la vecchia resta finché la nuova, già decodificata, non le sfuma sopra
  const img = box.querySelector(':scope > .phero .phero-img img'), oldSrc = img && (img.getAttribute('data-src') || img.getAttribute('src'));
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const nextImg = tpl.content.querySelector('.phero-img img'), newSrc = nextImg?.getAttribute('data-src');
  const swap = img && newSrc && oldSrc && newSrc !== oldSrc;
  if (swap) nextImg.setAttribute('data-src', oldSrc);
  const changed = updateHTMLTracked(box, tpl.innerHTML);
  if (swap) crossfadeCover(img, newSrc);
  if (!detailAnimate || reduceMotion()) return;
  if (ring && before) countRing(ring, before);
  // il resto: breve dissolvenza dove il testo è cambiato (il numero dell'anello conta, non sfuma)
  for (const el of changed) {
    if (el.closest('.ring b') || el.closest('#zone-days') || !el.getClientRects().length) continue;
    el.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
  }
}
// il numero dell'anello conta dal valore di prima al nuovo (~400 ms), con la virgola e cifre a larghezza fissa
function countRing(ring, fromText) {
  const b = ring.querySelector('b'), final = b.textContent;
  const from = Number(String(fromText).replace(',', '.')), to = Number(final.replace(',', '.'));
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return;
  const token = ring._count = {}, t0 = performance.now(), dur = 400;
  const fmt = (v) => v.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const step = (t) => {
    if (ring._count !== token || !b.isConnected) return;
    const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3;
    b.textContent = k === 1 ? final : fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  b.textContent = fmt(from);
  requestAnimationFrame(step);
}
function crossfadeCover(img, src) {
  const token = img._swap = {};
  const next = new Image();
  next.decoding = 'async';
  next.alt = ''; next.setAttribute('aria-hidden', 'true'); next.className = 'phero-xfade';
  next.src = src;
  const done = () => { if (img._swap !== token) return; img.dataset.imageFast = '1'; img.src = src; img.decode?.().catch(() => {}).finally(() => next.remove()); };
  next.decode().then(() => {
    if (img._swap !== token || !img.isConnected) return;
    // la foto nuova entra già pronta: il MutationObserver delle immagini la trova caricata, niente scheletro
    next.dataset.imageState = 'ready'; next.dataset.imageFast = '1';
    applyCrop(next);
    img.after(next);
    // l'alone dietro la testata cambia foto insieme alla copertina, con la stessa dissolvenza
    ambiFollow(img.closest('.phero'), src);
    if (reduceMotion()) { done(); return; }
    next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }).finished.then(done, done);
  }, () => { if (img._swap === token) img.src = src; });
}

function renderDetail() {
  if(state.target!=='funghi'){renderOutdoorDetail();return;}
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
    delete box.dataset.zone;detailCtx=null;lastDetailHtml='';
    box.innerHTML = `<h1>${esc(z.title || z.name)}</h1>${!series[z.id]?'<p class="notice">Meteo non disponibile per questa zona. <button type="button" class="link-btn" data-zone-weather-retry>Riprova</button></p>':''}<p class="notice">${selectedSpecies().length?'Indice non calcolabile':'Indice non ancora disponibile per le specie selezionate'}${missing.length ? ': mancano ' + esc(missing.join(', ')) : ' per questo giorno'}. Un dato mancante non indica assenza di ${state.target==='piante'?'piante':'funghi'}.</p><p><a href="#/mappa/${z.id}">Apri la mappa</a> · <a href="#/metodo">Metodo e limiti</a></p>${renderWalkFocus(z, d, walk)}${discoverySection(z,d,walk)}${z.protection ? `<p class="notice">${esc(z.protection)}</p>` : ''}<p>${linkTrees(z.description)}</p>${section('accesso','Accessi e soste',renderAccess(z,{access:null}))}${section('sentieri','Sentieri della zona',renderTrails(z,null),true)}`;
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
  // stesso asse dei giorni per tutti i grafici della sezione: ultimi HISTORY_DAYS e i giorni previsti
  const whyDays = days.map((x) => ({ date: x.date, i: x.i, score: adjusted(z, x.score, x) }));

  const [title, sub] = splitName(z);
  const cov = coverOf(z, best.species.id, d);
  const zoneTrees=treeChips(z.description);
  const treeNames=[...document.createRange().createContextualFragment(zoneTrees).querySelectorAll('.ent-chip > span')].map(el=>el.textContent);
  const zonePreview=[treeNames.slice(0,3).join(' · '),treeNames.length>3?`+${treeNames.length-3} alberi`:''].filter(Boolean).join(' · ');
  const forestNames=[...new Set(Object.entries(hab.frac).sort((a,b)=>b[1]-a[1]).map(([cat])=>treesData?.trees?.[treeForCategory(cat)]?.name).filter(Boolean))].slice(0,3).join(' · ');
  const preview=(title,detail)=>`<span class="section-preview"><span class="section-preview-title">${esc(title)}</span>${detail?`<span class="section-preview-detail">${esc(detail)}</span>`:''}</span>`;
  // giorni della zona: cambiano il giorno senza aggiungere voci di cronologia (clic delegato su #detail)
  const zoneDays = Array.from({ length: AHEAD_DAYS + 1 }, (_, o) => {
    const x = dayEntry(z.id, o);
    if (!x?.best) return '';
    const sc = adjusted(z, x.score, x);
    return `<button type="button" class="day" role="tab" data-day-offset="${o}" aria-selected="${o === state.dayOffset}"><span class="d1">${o === 0 ? 'Oggi' : o === 1 ? 'Domani' : fmtDate(x.date, { weekday: 'long' }).replace('.', '')}</span><span class="d2">${fmtDate(x.date, { day: 'numeric' })}</span><span class="d3">${fungusGlyph}<span class="dot" style="--dc:var(${scoreVar(sc)});--dcs:var(${scoreVar(sc).replace('--s', '--ps')})"></span><b class="pc">${formatIndex(sc)}</b></span>${calendarWeather(z,x)}</button>`;
  }).join('');
  const html = `
    <header class="phero outing-hero">
      ${cov ? `<button type="button" class="phero-img" data-cover aria-label="Apri foto e crediti"><img data-src="${cov.hd}" alt="${esc(cov.alt)}"></button>` : ''}
      <span class="shade"></span>
      <div class="phero-bar"><a class="fab" href="#/mappa/${z.id}" aria-label="Mappa della zona">${IC.map}</a></div>
      <div class="phero-body"><span class="pill glass">${esc(dayLabel)}</span><h1 class="phero-title">${esc(title)}</h1>${sub ? `<p class="phero-sub">${esc(sub)}</p>` : ''}</div>
      ${heroIndicators(z,d,s)}
    </header>
    <div class="pbody">
    <div id="zone-days" class="days compact" role="tablist" aria-label="Giorno">${zoneDays}</div>
    ${weatherAgeHtml(z, best.band)}
    ${renderWalkFocus(z, d, walk)}
    ${essentialSections(z, d, walk)}
    ${best.kind==='plant'?`<p class="small muted">Indice di contesto sperimentale · fattori disponibili ${best.factors.filter(f=>f.value!=null).length}/${best.factors.length}${best.quality.climateUnavailable?' · meteo non disponibile':''}</p><div class="notice">${esc(best.species.parts)} ${esc(best.species.caution)}</div>`:''}
    <section class="zone-actions" aria-label="Taccuino e mappa">
      <h2 class="outing-section-title">Taccuino e mappa</h2>
      ${best.kind==='plant'?`<button type="button" class="btn primary zone-note-action" data-note-kind="pianta" data-note-id="${best.species.plantId}" data-note-zone="${z.id}" data-note-title="${esc(best.species.name)}">${notebookGlyph}<span>Annota la fase nel taccuino</span><span aria-hidden="true">→</span></button>`:`<div class="zone-community"><button type="button" class="btn primary zone-note-action" data-report data-zone="${z.id}" data-species="${best.species.id}">${notebookGlyph}<span>Annota nel taccuino</span><span aria-hidden="true">→</span></button>${reportBadge(z.id, best.species.id)}</div>`}
      <p class="zone-note-hint">${best.kind==='plant'?'Nel taccuino puoi annotare le fasi della pianta e le ricerche a vuoto, con luogo e giorno dell’osservazione.':'Nel taccuino puoi registrare specie cercate, ritrovamenti e ricerche a vuoto, con luogo e giorno dell’uscita.'}</p>
      <div class="zone-secondary-actions">
        <a class="zone-secondary-action" href="#/mappa/${z.id}" aria-label="Sentieri e accessi sulla mappa">${IC.map}<span><b>Apri la mappa</b><small>Sentieri e accessi</small></span></a>
      </div>
      ${best.kind==='plant'?'<p class="small muted">Confronta la pianta e verifica regole, tutela e permessi prima della raccolta.</p>':''}
    </section>
    ${z.protection ? `<div class="notice">${esc(z.protection)}</div>` : ''}
    <section class="zone-more" aria-label="Approfondimenti sulla zona"><h2 class="outing-section-title">Approfondimenti</h2>
    ${best.kind==='plant'?'':section('regole', preview('Regole di raccolta','Quantità · orari · documenti · contributo e divieti'), zoneLegal(z,d))}
    ${section('meteo', preview('Perché questo indice','Meteo, habitat e condizioni di crescita'), `${renderWhy({ r: best, s: sb, i: d.i, sp: best.species, band: best.band, dateStr: d.date, shown: s, agg: d.score, parts: d.perSpecies.map((p) => ({ name: p.species.name.split(' / ')[0], score: p.score })), prefs: adjParts(z, d), outing: wxRank(z, d) < 1 ? wxRank(z, d) : 0, days: whyDays, todayIndex: r.todayIndex })}
      <p class="small muted">${esc(best.kind==='plant'?'Indice sperimentale del contesto e della fase: non è una probabilità di raccolta.':contentCopy.indexExplanation || 'Condizioni di crescita: indice sperimentale 0–10.')}</p>
      ${legal?.forecast_note ? `<p class="small muted">${esc(legal.forecast_note)}</p>` : ''}`)}
    ${section('sentieri', preview('Sentieri della zona',(trails[z.id]?.trails?.length||0)+' tratti mappati · difficoltà e profili'), renderTrails(z, d))}
    ${section('bosco', preview(`Boschi intorno a ${best.band} m`,forestNames||'Composizione indicativa sulla carta'), forestBar(hab.frac) + factCards([{label:'Carta Forestale',value:`${hab.n} punti campionati`,icon:'leaf'},{label:'Fascia osservata',value:`${best.band-150}–${best.band+150} m`,icon:'pin'}]) + `<p class="small muted">Le percentuali descrivono i punti sulla carta, non il numero degli alberi. Punti vicini possono descrivere lo stesso bosco: la composizione è indicativa.</p>`)}
    ${section('zona', preview('Paesaggio e alberi',zonePreview||`${habitat[z.id].elevation.min}–${habitat[z.id].elevation.max} m`), `${factCards([{label:'Paesaggio',value:z.description,icon:'leaf',wide:true},{label:'Quote della zona',value:`${habitat[z.id].elevation.min}–${habitat[z.id].elevation.max} m`,icon:'pin'}],{glossary:'Bosco'})}${zoneTrees}`)}
    </section>
    </div>`;
  // Stessa zona già sulla pagina (cambio di giorno, meteo nuovo): si aggiornano solo le parti cambiate. Copertina,
  // anello, titoli, giorni e sezioni aperte restano gli stessi nodi; niente ridisegno completo né scatti.
  detailCtx = { z, d, best, cov, walk };
  const inPlace = box.dataset.zone === z.id && !!box.querySelector(':scope > .phero');
  // dati che non cambiano ciò che si vede (comunità, taccuino): nessun aggiornamento
  if (inPlace && html === lastDetailHtml) return;
  lastDetailHtml = html;
  if (inPlace) updateDetailInPlace(box, html, cov);
  else { box.innerHTML = html; box.dataset.zone = z.id; }
  const zd = $('#zone-days'), sel = zd.querySelector('[aria-selected="true"]');
  // solo in orizzontale, dentro la barra dei giorni: la pagina non si muove
  if (sel) { const zr = zd.getBoundingClientRect(), br = sel.getBoundingClientRect(); zd.scrollTo({ left: zd.scrollLeft + br.left - zr.left - (zr.width - br.width) / 2, behavior: inPlace && !reduceMotion() ? 'smooth' : 'instant' }); }
  const drawCharts = () => drawWhyCharts(box.querySelector('[data-sec="meteo"]'), { s: sb, sp: best.species, days: whyDays, todayIndex: r.todayIndex, i: d.i });
  bindDetailSections(box, id => { if (id === 'meteo') drawCharts(); });
}

const fmtKm = (km) => km.toLocaleString('it-IT', { maximumFractionDigits: 1 });
const fmtM = (m) => (m >= 1000 ? `${fmtKm(m / 1000)} km` : `${Math.round(m / 10) * 10} m`);
// tratto a piedi in parole: sotto i 50 m il bosco e' praticamente a bordo strada
const walkTxt = (m) => (m < 50 ? 'il campione di habitat è <b>vicino alla strada</b>' : `circa <b>${fmtM(m)} in linea d’aria</b>`);
const SURF_LABEL = ['asfalto', 'strada bianca', 'sentiero o pista'];
// stessa avvertenza degli imbocchi: la rete stradale mappata non dice se una pista è aperta al traffico (L.R. Lazio 29/1987)
const ACCESS_CHECK = 'Verifica transitabilità e divieti sul posto: le piste forestali possono essere chiuse al traffico.';
const driveTo = (ax) => ax.surface === 2 ? 'su sentiero o pista (transito in auto da verificare)' : `in auto ${ax.surface === 0 ? 'su asfalto' : `su ${SURF_LABEL[ax.surface]}`}`;
const gmaps = directionsTo;

// Tutti gli accessi al navigatore passano dalla stessa conferma, anche nelle schede modali.
let directionsDialog;
function confirmDirections(event) {
  if(event.defaultPrevented || event.button>1)return;
  const link=event.target.closest?.('a[href]');
  if(!link || link.hasAttribute('data-confirmed-directions'))return;
  const url=new URL(link.href,location.href);
  if(url.protocol!=='https:' || url.hostname!=='www.google.com' || !url.pathname.startsWith('/maps/dir/'))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(!directionsDialog){
    directionsDialog=document.createElement('dialog');
    directionsDialog.id='directions-confirm';directionsDialog.className='community-dialog directions-confirm';
    directionsDialog.setAttribute('aria-labelledby','directions-confirm-title');
    directionsDialog.setAttribute('aria-describedby','directions-confirm-description');
    directionsDialog.innerHTML='<h2 id="directions-confirm-title">Aprire il navigatore?</h2><p id="directions-confirm-description">Le indicazioni si apriranno in Google Maps.</p><p class="small muted" data-directions-destination></p><div class="directions-confirm-actions"><button type="button" class="btn ghost" data-directions-cancel autofocus>Resta qui</button><a class="btn primary" data-confirmed-directions target="_blank" rel="noopener noreferrer">Apri navigatore</a></div>';
    document.body.append(directionsDialog);
    directionsDialog.querySelector('[data-directions-cancel]').onclick=()=>directionsDialog.close();
    directionsDialog.querySelector('[data-confirmed-directions]').onclick=()=>directionsDialog.close();
  }
  directionsDialog.querySelector('[data-confirmed-directions]').href=url.href;
  directionsDialog.querySelector('[data-directions-destination]').textContent=link.getAttribute('aria-label')||link.textContent.trim();
  openModal(directionsDialog);
}
document.addEventListener('click',confirmDirections,true);
document.addEventListener('auxclick',confirmDirections,true);


function renderWhenWeather(z,d) {
  const w=wxOf(z,d);if(!w)return '';
  const alt=alternativeFor(z,state.dayOffset,d);
  return `<div class="when-weather-details"><p class="small muted">${w.available?`Meteo ${w.from}:00–13:00 · quota centrale. Verifica anche il rientro.`:'Aggiorna le previsioni prima di decidere.'}</p>${w.thunder?'<p class="small">Uscita sconsigliata con temporali.</p>':''}${alt?`<p>Tempo migliore a ${esc(splitName(alt.z)[0])}: ${esc(alt.w.main)}.</p>${actPill(`#/zona/${alt.z.id}/${state.dayOffset}`,'go',`Vai a ${esc(splitName(alt.z)[0])}`)}`:''}</div>`;
}

function renderHuman(z, d) {
  if (!d.crowd) return '';
  const t = timingAdvice({ dateStr: d.date, lat: z.lat, lon: z.lon, crowd: d.crowd });
  // alternativa: un giorno con meno gente e indice simile
  let alt = null;
  for (let o = 0; o <= AHEAD_DAYS; o++) {
    const x = dayEntry(z.id, o);
    if (!x?.crowd || x.date === d.date || !practicalTiming(z,x,walkFor(z,x)).available) continue;
    if (x.crowd.value < d.crowd.value - 0.15 && x.score >= d.score - 10 && (!alt || x.score > alt.score)) alt = x;
  }
  const tips = [];
  if (d.crowd.fresh) tips.push('Indice in aumento: possibile maggiore affluenza.');
  else if (d.crowd.goodDays >= 3) tips.push(`Indice favorevole da ${d.crowd.goodDays} giorni: possibile maggiore affluenza.`);
  if ((series[z.id][bandIndex(z, d.best.band)].p[d.i] ?? 0) >= 5) tips.push('Pioggia prevista: attrezzati e verifica il fondo.');
  const minutes=zoneTrip(z,walkFor(z,d,state.trailId)).minutes;
  const planned=plannedDeparture(t.arrive,minutes), available=practicalTiming(z,d,walkFor(z,d,state.trailId)).available;
  const departure=planned?fmtTime(planned):null;
  return `<div class="human timing-layout">
    ${!available?`<p class="notice">L’orario consigliato è passato. Puoi consultare le condizioni di oggi oppure <a href="${walkHref(z,1,state.trailId)}">vedere domani</a>.</p>`:''}
    <dl class="timing-facts">
      <div><dt>Partenza · ${esc(currentBase().name)}</dt><dd>${departure?`${available?'verso le':'era verso le'} <b>${departure}</b>`:'Verifica nel navigatore'}</dd></div>
      <div><dt>Alba</dt><dd>verso le <b>${fmtRough(t.sunrise,5)}</b></dd></div>
      <div><dt>Orario consentito di raccolta</dt><dd><b>${fmtRough(t.legal,5,'ceil')}–${fmtRough(t.end,5,'floor')}</b></dd></div>
    </dl>
    ${t.arrive<t.sunrise?'<p class="timing-light">Arrivo prima dell’alba: porta una luce.</p>':''}
    ${renderWhenWeather(z,d)}
    ${alt?`<p class="timing-alternative"><b>Preferisci meno gente?</b> ${fmtDate(alt.date,{weekday:'long',day:'numeric'})} · indice ${formatIndex(alt.score)} · ${crowdText(alt.crowd)}.</p>`:''}
    <div class="timing-method"><p class="small muted"><b>Affollamento stimato.</b> Calendario, notorietà, accessi, pioggia e indice; presenze e passaparola non misurati.</p>${tips.length?`<ul class="timing-signals">${tips.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>
  </div>`;
}

function renderAccess(z, d, {summarized=false,walk=null} = {}) {
  const acc = access[z.id] || [];
  const a0 = acc[0];
  const ax = walk?.h ? null : d?.access;
  if (!a0 && !ax && !walk?.h && !z.access && !z.parking?.length) return '';
  const lines = [];
  if(z.access)lines.push(esc(z.access));
  if(walk?.h){
    const h=walk.h;
    lines.push(`${h.road?`Accesso da ${esc(h.road)}.`:h.kind==='strada'?'Imbocco collegato alla rete stradale mappata.':'Imbocco su sterrata: verifica dove lasciare l’auto.'} ${ACCESS_CHECK} La presenza di un imbocco non garantisce una sosta consentita.`);
  } else if (a0) {
    let txt = summarized ? (!customBase()&&a0.roads.length ? `Strade di accesso: ${esc(a0.roads.join(', '))}.` : '') : `Da ${esc(currentBase().name)} ${esc(travelText(travelTo(a0,a0)))}${!customBase()&&a0.roads.length ? ` via ${esc(a0.roads.join(', '))}` : ''}.`;
    if(customBase())txt += ` Fino a ${esc(a0.parking)} (${a0.elevation} m). Verifica il fondo dell’ultimo accesso.`;
    else if (a0.unpaved_tail_km > 0.2) txt += ` Asfalto per ${fmtKm(a0.paved_km)} km${a0.transition?.after ? ` (fino a ${a0.transition.after})` : ''}, poi <b>${fmtKm(a0.unpaved_tail_km)} km di strada bianca</b>${a0.unpaved_surfaces.length ? ` (${a0.unpaved_surfaces.map((x) => ({ gravel: 'ghiaia', dirt: 'sterrato', compacted: 'fondo compatto' }[x] || x)).join(', ')})` : ''} fino a ${esc(a0.parking)}.`;
    else txt += ` Tutto su asfalto fino a ${esc(a0.parking)} (${a0.elevation} m).`;
    lines.push(txt);
  }
  if (ax) {
    lines.push(`<b>Punto più comodo per ${speciesLink(d.best.species, d.best.species.name.toLowerCase())}</b>: ${driveTo(ax)}${ax.road ? ` lungo ${esc(ax.road)}` : ''} fino al <a href="${gmaps(ax.rlat, ax.rlon)}" target="_blank" rel="noopener">${ax.surface === 2 ? 'punto d’accesso' : 'punto sulla strada'}</a>, poi ${ax.walkM < 50 ? (ax.surface === 2 ? 'subito, lì accanto,' : 'subito, a bordo strada,') :`<b>${fmtM(ax.walkM)} in linea d’aria</b> fino a`} ${esc((SHORT[ax.cat] || ax.cat || 'paesaggio non classificato').toLowerCase())} a ${ax.e} m.${ax.surface ? ` ${ACCESS_CHECK}` : ''}`);
  }
  return `
    ${d.comfort && !summarized ? `<p><span class="badge comfort-${d.comfort.level}">accesso ${d.comfort.level}</span></p>` : ''}
    <ul class="reasons access">${lines.map((x) => `<li>${x}</li>`).join('')}</ul>${customBase()?'<p class="small muted">Percorsi OSRM/OpenStreetMap, senza traffico. Se il percorso manca, la distanza è indicata in linea d’aria.</p>':''}
    ${z.parking?.length?`<div class="zone-stops"><p class="small muted">Soste indicate nella zona · verifica i divieti sul posto</p><div class="act-pills">${z.parking.map(p=>actPill(gmaps(p.lat,p.lon),'pin',esc(p.name),true)).join('')}</div></div>`:''}
    ${(walk?.h?acc:acc.slice(1)).length ? `<p class="small muted">Altre soste nella zona: ${(walk?.h?acc:acc.slice(1)).map((a) => `<a href="${gmaps(a.lat, a.lon)}" target="_blank" rel="noopener">${esc(a.parking)}</a> (${esc(travelText(travelTo(a,a)))}${!customBase()&&a.unpaved_tail_km > 0.2 ? `, ${fmtKm(a.unpaved_tail_km)} km di strada bianca` : ''})`).join(' · ')}</p>` : ''}`;
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
  if (t.lines?.length > 1) return '';
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

const trailViews = new Map();
// id stabile (punto della pagina, zona, sentiero): un ridisegno con gli stessi dati produce lo stesso HTML
function trailVisual(z, t, d, heads = [], where = 'list') {
  const id = `trail-visual-${where}-${`${z.id}-${t.id}`.replace(/[^\w-]/g, '_')}`, key = `${z.id}/${t.id}`;
  const view = trailViews.get(key) || 'profile', sketch = trailSketch(t, heads[0], heads.slice(1));
  const trace = sketch ? `<figure class="walk-sketch"><span class="trail-north" aria-hidden="true">N ↑</span><svg viewBox="${sketch.viewBox.map(n=>n.toFixed(1)).join(' ')}" role="img" aria-label="Schema del tratto locale orientato a nord${heads.length ? ', con accessi mappati numerati' : ''}">${sketch.paths.map(p => `<polyline points="${p}"/>`).join('')}${sketch.heads.map((p,k) => `<g class="trail-access" data-trail-head="${k}" aria-hidden="true"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8"/><text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="middle" dominant-baseline="central">${k+1}</text></g>`).join('')}</svg><figcaption><details class="trail-sketch-info"><summary>Info sul tracciato</summary><p>${sketch.paths.length > 1 ? 'Segmenti separati. ' : ''}${heads.length ? 'I numeri indicano gli imbocchi mappati. ' : ''}Schema orientato a nord: per orientarti usa la mappa del sentiero.</p></details></figcaption></figure>` : '<p class="small muted">Tracciato non disponibile per questo tratto.</p>';
  const profile = trailProfile(z.id, t, d?.best?.species, d?.best?.band, heads,id);
  const elevations=(t.samples||[]).map(sample=>sample[0]).filter(Number.isFinite);
  const quotes=elevations.length?`<dl class="trail-elevation-summary"><div><dt>Quota minima</dt><dd>${Math.min(...elevations).toLocaleString('it-IT')} <span>m</span></dd></div><div><dt>Quota massima</dt><dd>${Math.max(...elevations).toLocaleString('it-IT')} <span>m</span></dd></div></dl><p class="small muted">${t.lines?.length>1?'Quote campionate su segmenti separati. Non costituiscono un profilo continuo.':'Quote campionate nel tratto della zona; mancano campioni sufficienti per un profilo continuo.'}</p>`:'<p class="small muted">Quote non disponibili: mancano quote sufficienti per questo tratto.</p>';
  const elevationLabel=profile?'Profilo':'Quote';
  return `<div class="trail-visual" data-trail-view-key="${esc(key)}">
    <div class="trail-view-tabs" role="tablist" aria-label="Vista del tratto di ${esc(trailName(t))}">${[['profile',elevationLabel],['trace','Tracciato']].map(([v,label]) => `<button type="button" role="tab" id="${id}-${v}-tab" data-trail-view="${v}" aria-selected="${view===v}" aria-controls="${id}-${v}" tabindex="${view===v?0:-1}">${label}</button>`).join('')}</div>
    <div class="trail-visual-panel" role="tabpanel" id="${id}-trace" data-trail-panel="trace" aria-labelledby="${id}-trace-tab" tabindex="0"${view!=='trace'?' hidden':''}>${trace}</div>
    <div class="trail-visual-panel${profile?'':' trail-visual-panel--quotes'}" role="tabpanel" id="${id}-profile" data-trail-panel="profile" aria-labelledby="${id}-profile-tab" tabindex="0"${view!=='profile'?' hidden':''}>${profile||quotes}</div>
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
  // lunghezza dell'intero itinerario solo se coerente con il tratto nella zona (js/walks.js); oltre 200 km non si mostra
  const full = fullTrailKm(t);
  const facts = [
    t.difficulty && `<div><dt>Difficoltà</dt><dd>${difficultyLink(t.difficulty, `${t.difficulty} · ${DIFF[t.difficulty] || 'classificazione della fonte'}`)}</dd></div>`,
    (full == null || full < 200) && `<div><dt>Intero</dt><dd>${full == null ? 'Lunghezza n.d.' : `${fmtKm(full)} km`}${t.duration ? ` · ${fmtDur(t.duration)}` : ''}${t.ascent ? ` · +${esc(t.ascent)} m` : ''}</dd></div>`,
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
  const candidates = (state.target==='funghi'&&d?.best ? trailsFor(z, d.best.species, d.best.band) : (trails[z.id]?.trails || [])).filter(t=>matchesWalk(t,state));
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
function notebookPrivacyHtml(html) {
  // Solo testo editoriale: URL e identificativi dei vecchi diari restano validi.
  const template=document.createElement('template');template.innerHTML=String(html||'');
  const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) walker.currentNode.textContent=walker.currentNode.textContent.replace(/\b(diario|Diario)\b/g,word=>word==='Diario'?'Taccuino':'taccuino');
  return template.innerHTML;
}
// La base di partenza ha la sua voce nel testo della privacy (data/legal.json). Una copia pubblicata prima di quella
// voce la riceve dentro l'elenco della sezione, non in coda al paragrafo finale.
function privacyHtml(html) {
  const out = notebookPrivacyHtml(html);
  if (/Base di partenza/.test(out)) return out;
  const end = out.lastIndexOf('</ul>');
  return end < 0 ? `${out}<p>${esc(BASE_PRIVACY_TEXT)}</p>` : `${out.slice(0, end)}<li>${esc(BASE_PRIVACY_TEXT)}</li>${out.slice(end)}`;
}

async function applyLegal() {
  const L = legal || {};
  if (L.home_strip) $('#home-legal .ar-s').textContent = L.home_strip;
  // emergenza e sezioni legali nella pagina Info
  const em = L.emergency;
  $('#emergency').innerHTML = `<h2>${esc(em?.title || 'Sospetto avvelenamento')}</h2>
    <ol class="content-action-steps">${(em?.steps || ['Chiama subito il 112, anche senza sintomi.', 'Conserva i funghi avanzati, gli scarti e il resto del raccolto per i medici.']).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    <div class="em-numbers">${(em?.numbers || [{ label: 'Numero unico di emergenza', number: '112' }]).map((n) => `<a class="btn ${n.number === '112' ? 'primary' : 'ghost'}" href="tel:${esc(n.number.replace(/\s/g, ''))}">${esc(n.label)} · <b>${esc(n.number)}</b></a>`).join('')}</div>`;
  const zc = Object.entries(zoneMedia).map(([zid, m]) => `${esc(zones.find((z) => z.id === zid)?.name || zid)}: ${creditLine(m)}`);
  if (zc.length) $('#zone-credits').innerHTML = `<b>Foto dei luoghi</b> (Wikimedia Commons): ${zc.join(' · ')}.${Object.values(zoneMedia).some((m) => m.variants?.length) ? ' Le copertine delle altre stagioni e del meteo sono elaborate con AI a partire da queste foto, con la stessa attribuzione e licenza.' : ''}`;
  // preparazione e conservazione: regole per tutti i funghi (obbligatorie prima)
  if (prep?.general?.length && $('#prep-general')) $('#prep-general').innerHTML = prepGeneralHtml(prep.general);
  // versione pilota: la stessa frase dell'avviso iniziale, in cima a Regole e metodo (ci porta l'etichetta «Rieti» della testata)
  const pilot = $('#info-pilot'); if (pilot) { pilot.textContent = [L.onboarding?.prototype_notice,L.onboarding?.subtitle].filter(Boolean).join(' '); pilot.hidden = !pilot.textContent; }
  $('#legal-sections').innerHTML = (L.info_sections || []).map((x) => `<details><summary><h2>${esc(x.title)}</h2></summary><div class="method">${x.id==='normativa'?zoneLegal({}):''}${x.id==='privacy'?privacyHtml(x.html):x.html}</div></details>`).join('');
  $('#legal-sections').querySelectorAll('.method').forEach(enhanceContentReading);
  enhanceEntityAccordions($('#legal-sections'));
  // primo avvio: avviso da confermare (si ripresenta se cambia la versione dei testi)
  const ver=legalNoticeVersion(L),accepted=await configureLegalAccess(ver,legalNoticeFingerprint(L));
  if (!accepted) {
    const dlg = $('#onboarding');
    dlg.querySelector('h2').textContent = L.onboarding?.title || 'Prima di usare l\'app';
    const sub = $('#ob-sub'); if (sub) { sub.textContent = L.onboarding?.subtitle || ''; sub.hidden = !sub.textContent; }
    $('#ob-prototype').textContent=L.onboarding.prototype_notice;
    $('#ob-cookie-summary').textContent=L.onboarding.cookie_summary;
    $('#ob-cookie-policy').innerHTML=(L.info_sections||[]).find(section=>section.id==='cookie')?.html||'';
    dlg.querySelector('.ob-points').innerHTML = (L.onboarding?.points || [
      'Le previsioni sono stime: non garantiscono che troverai funghi.',
      'Schede e ricerca aiutano a orientarsi ma non sono un\'identificazione: prima di mangiare fai controllare i funghi all\'Ispettorato Micologico ASL.',
      'Nel Lazio si raccoglie con attestato micologico, documento e ricevuta del contributo annuale (esenti i residenti dai 65 anni); sotto i 14 anni solo se accompagnati. Massimo 3 kg di funghi commestibili a persona al giorno (L.R. 32/1998).',
      'In montagna la sicurezza e il rispetto delle regole di parchi e riserve sono tua responsabilità.',
    ]).map((x) => `<li>${esc(x)}</li>`).join('');
    $('#ob-accept').textContent = L.onboarding?.accept || 'Ho capito';
    $('#ob-legal-details').innerHTML=(L.info_sections||[]).filter(section=>section.id!=='cookie').map(section=>`<section><h3>${esc(section.title)}</h3>${section.id==='privacy'?privacyHtml(section.html):section.html}</section>`).join('');
    $('#ob-accept').onclick=async()=>{
      const button=$('#ob-accept');button.disabled=true;
      try{const {persisted}=await acceptLegalNotice();dlg.close();if(!persisted){const note=document.createElement('div');note.className='app-toast on';note.setAttribute('role','status');note.textContent='Conferma valida per questa apertura. Il browser non permette di conservarla.';document.body.append(note);setTimeout(()=>note.remove(),7000);}}catch{$('#ob-status').textContent='Non riesco a registrare la conferma. Riprova.';}finally{button.disabled=false;}
    };
    dlg.addEventListener('cancel', (e) => e.preventDefault());
    dlg.onclose=()=>{if(hasLegalAcceptance())maybeInvite();else queueMicrotask(()=>{if(!dlg.open&&!hasLegalAcceptance())openModal(dlg);});};
    openModal(dlg);dlg.scrollTop=0;dlg.querySelector('h2').focus({preventScroll:true});
  } else maybeInvite();
}
addEventListener('fronda:legal-required',()=>{if(legal)applyLegal();});
addEventListener('fronda:legal-access',event=>{if(event.detail.accepted&&$('#onboarding')?.open)$('#onboarding').close();});

function zoneLegal(z) {
  const L = legal || {};
  const items = L.zone_legal || ['Massimo 3 kg di funghi commestibili a persona al giorno, salvo un solo esemplare o un solo cespo.', 'Vietato raccogliere da un\'ora dopo il tramonto a un\'ora prima del sorgere del sole.', 'Porta con te attestato micologico (o vecchio tesserino), ricevuta del contributo e documento.'];
  const brief=text=>{
    const kg=text.match(/^Massimo\s+([\d,.]+\s*kg)/i);
    if(kg)return [kg[1]+' al giorno','Commestibili · a persona · salvo eccezioni'];
    if(/^Funghi non commestibili:/i.test(text))return ['Non commestibili','Solo studio autorizzato'];
    if(/^Vietato raccogliere.*tramonto.*sorgere del sole/i.test(text))return ['Orario di raccolta','Alba −1 h → tramonto +1 h'];
    if(/^Porta con te attestato/i.test(text))return ['Documenti con te','Attestato, ricevuta e documento'];
    if(/^Contributo annuale:/i.test(text)){const fees=text.match(/\d+\s*€/g);return [fees?.join(' / ')||'Contributo annuale','Residenti Lazio / altri · previste esenzioni'];}
    if(/^Rispetta cartelli e divieti/i.test(text))return ['Divieti locali','Verifica prima di raccogliere'];
    return [text.split(/\s+/).slice(0,7).join(' ')+'…','Leggi condizioni e dettagli'];
  };
  const card=(title,hint,text)=>`<li><button type="button" class="legal-fact" data-legal-rule data-legal-title="${esc(title)}" data-legal-text="${esc(text)}"><b>${esc(title)}</b><span>${esc(hint)}</span><small>Dettagli <span aria-hidden="true">↗</span></small></button></li>`;
  return `<div class="zone-legal"><ul class="legal-facts">${items.map(text=>card(...brief(text),text)).join('')}${z.protection?card('Area protetta','Verifica le regole dell’ente',z.protection+' '+(L.protected_area_note||'')):''}</ul>${z.id?'<a class="small" href="#/info">Regole complete e fonti</a>':''}</div>`;
}

// Un dettaglio alla volta: il testo normativo completo resta quello del contenuto pubblicato.
let legalRuleDialog;
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-legal-rule]');if(!button)return;
  if(!legalRuleDialog){legalRuleDialog=document.createElement('dialog');legalRuleDialog.className='wiz legal-rule-dialog';legalRuleDialog.setAttribute('aria-labelledby','legal-rule-title');document.body.append(legalRuleDialog);addEventListener('hashchange',()=>legalRuleDialog.close());}
  legalRuleDialog.innerHTML='<header class="report-header"><h2 id="legal-rule-title"></h2><button type="button" class="profile-close" data-legal-close aria-label="Chiudi">×</button></header><p class="legal-rule-text"></p><a class="link-btn" href="#/info">Regole complete e fonti →</a>';
  legalRuleDialog.querySelector('h2').textContent=button.dataset.legalTitle;
  legalRuleDialog.querySelector('.legal-rule-text').textContent=button.dataset.legalText;
  legalRuleDialog.querySelector('[data-legal-close]').onclick=()=>legalRuleDialog.close();
  legalRuleDialog.onclose=()=>button.isConnected&&button.focus({preventScroll:true});
  openModal(legalRuleDialog);
});

// Dove trovare una specie: idoneita' dell'habitat per zona + indice di oggi (se il meteo e' caricato).
const POT_LABEL = { alta: 'habitat molto adatto', media: 'habitat adatto', bassa: 'habitat scarso', scarsa: 'quasi assente' };
function potentialOf(sp, z) { return habitatPotential(sp, habitat[z.id], habitat[z.id].forest?.area_ha); }
// Pinarolo e moretta crescono sotto i pini, ma la categoria della Carta Forestale «Rimboschimenti di pini e/o altre
// conifere montane» non dice se ci sono pini. Se il loro bosco adatto viene solo da lì (in una fascia, o in tutta la
// zona con band null) l'app lo dice accanto al consiglio: i pesi del modello non cambiano (la mappa salta già la categoria).
const PINE_HOSTS = { suillus: 'Il pinarolo cresce solo sotto i pini.', terreum: 'La moretta cresce sotto i pini.' };
function pineHostUnsure(z, sp, band = null) {
  const hab = habitat?.[z.id];
  if (!PINE_HOSTS[sp?.id] || !hab?.samples) return false;
  let con = 0, other = 0;
  for (const [e, c] of hab.samples) {
    if (band != null && !(Number.isFinite(e) && Math.abs(e - band) <= PARAMS.bandHalfWidth)) continue;
    const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    if (!((sp.forest[cat] || 0) > 0)) continue;
    if (cat === FOREST.CON) con++; else other++;
  }
  return con > 0 && other === 0;
}
const pineHostNote = (z, sp, band = null) => pineHostUnsure(z, sp, band) ? `Qui il bosco adatto è un rimboschimento di conifere: la carta forestale non dice se sono pini. ${PINE_HOSTS[sp.id]}` : '';
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
    return { sp, pot, score: p.score, band: p.band, host: pineHostNote(z, sp) };
  }).filter((r) => r.pot.level !== 'scarsa').sort((a, b) => b.score - a.score || b.pot.score - a.pot.score);
  return `<h3 class="observation-heading">Funghi nel bosco</h3><p class="small muted observation-caption">Condizioni del giorno · habitat e segnalazioni degli ultimi 7 giorni</p><ul class="zsp">${rows.map(({ sp, pot, score, host }) => `
    <li><a href="#/specie/${sp.id}" class="zsp-row">${thumb(sp.id, 40)}
      <span class="zsp-body"><b>${esc(sp.name)}</b>${reportBadge(z.id, sp.id)}<span class="small muted">${POT_LABEL[pot.level]}${pot.ha ? ` · ~${pot.ha.toLocaleString('it-IT')} ha` : ''}</span>${host ? `<span class="small zsp-host">${esc(host)}</span>` : ''}</span>
      <span class="score-pill" style="--index-color:var(${scoreVar(score).replace('--s','--ps')})" aria-label="Indice funghi ${formatIndex(score)} su 10">${fungusGlyph}<b class="pc">${formatIndex(score)}</b></span></a></li>`).join('')}</ul>
    `;
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

// avvio non riuscito (dati mancanti o illeggibili): un messaggio in italiano con «Riprova»; il dettaglio tecnico resta nella console
init().catch((e) => {
  console.error('Avvio di Fronda non riuscito', e);
  const message = '<div class="error boot-error" role="alert"><p>Fronda non è riuscita a caricare boschi, sentieri e funghi. Controlla la connessione e riprova.</p><button type="button" class="btn primary" data-boot-retry>Riprova</button></div>';
  $('#legal-loading').innerHTML=message;
  $('#hero').innerHTML = message;
  $('#detail').innerHTML = message;
  document.querySelectorAll('[data-boot-retry]').forEach((b) => b.addEventListener('click', () => location.reload()));
});
