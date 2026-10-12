import { SPECIES, GROUPS, FOREST } from './species.js';
import { scoreZoneDay, scoreSpecies, habitatAtBand, explain, classOf, CLASSES } from './model.js';
import { loadWeather } from './weather.js';
import { renderCharts } from './chart.js';
import { initJournal } from './journal.js';
import { renderSvgMap } from './svgmap.js';

const HISTORY_DAYS = 30;   // giorni passati mostrati nel grafico
const AHEAD_DAYS = 7;      // giorni futuri valutati
const PREFS_KEY = 'fungaroli:prefs:v1';

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
  groups: new Set(['porcini', 'ovolo', 'finferli']),
  dayOffset: 0,
  zoneId: null,
  distancePenalty: false,
};
try {
  const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
  if (p) { state.groups = new Set(p.groups); state.distancePenalty = !!p.distancePenalty; }
} catch { /* preferenze non disponibili */ }
const savePrefs = () => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ groups: [...state.groups], distancePenalty: state.distancePenalty })); } catch { /* ignora */ }
};

let zones, origin, habitat, series, results, map, zoneLayers = {};
const hasLeaflet = () => typeof globalThis.L !== 'undefined';

async function init() {
  $('#detail').innerHTML = '<div class="loading">Carico meteo e dati forestali…</div>';
  // versione Artifact: dati incorporati nella pagina (niente fetch esterni)
  const embedded = globalThis.FUNGAROLI_DATA;
  const [zj, hj] = embedded ? [embedded.zones, embedded.habitat] : await Promise.all([
    fetch('data/zones.json').then((r) => r.json()),
    fetch('data/habitat.json').then((r) => r.json()),
  ]);
  zones = zj.zones;
  origin = zj.origin;
  habitat = hj.zones;
  initMap();
  renderFilters();
  initJournal({ zones, predict, getZoneId: () => state.zoneId || zones[0].id });
  await refreshWeather(false);
  if (embedded) $('#refresh').hidden = true;
  else $('#refresh').addEventListener('click', () => refreshWeather(true));
  $('#distance-penalty').checked = state.distancePenalty;
  $('#distance-penalty').addEventListener('change', (e) => { state.distancePenalty = e.target.checked; savePrefs(); renderAll(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => results && renderDetail(), 200); });
}

async function refreshWeather(force) {
  try {
    $('#updated').textContent = 'Aggiornamento…';
    const w = await loadWeather(zones, { force });
    series = w.series;
    $('#updated').textContent = w.snapshot
      ? 'Meteo del ' + w.fetchedAt.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Meteo delle ' + w.fetchedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    $('#stale').hidden = !w.stale;
    compute();
    renderAll();
  } catch (err) {
    $('#updated').textContent = '';
    $('#detail').innerHTML = `<div class="error">Non riesco a scaricare il meteo (${esc(err.message)}). Controlla la connessione e riprova.</div>`;
  }
}

const selectedSpecies = () => SPECIES.filter((s) => state.groups.has(s.group));

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
    results[z.id] = { todayIndex: t, days };
  }
}

const dayEntry = (zid, offset) => {
  const r = results[zid];
  return r.days.find((d) => d.i === r.todayIndex + offset);
};
const adjusted = (zone, score) => (state.distancePenalty ? Math.round(score * (1 - 0.3 * Math.min(1, zone.drive_min / 120))) : score);

function renderFilters() {
  const box = $('#species-filter');
  box.innerHTML = '';
  for (const g of GROUPS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = g.label;
    b.setAttribute('aria-pressed', state.groups.has(g.id));
    b.addEventListener('click', () => {
      if (state.groups.has(g.id) && state.groups.size > 1) state.groups.delete(g.id); else state.groups.add(g.id);
      savePrefs();
      renderFilters();
      if (series) { compute(); renderAll(); }
    });
    box.appendChild(b);
  }
}

function renderAll() {
  if (!results) return;
  renderDays();
  renderRanking();
  renderMap();
  renderDetail();
  renderLegend();
}

function renderDays() {
  const box = $('#days');
  box.innerHTML = '';
  for (let o = 0; o <= AHEAD_DAYS; o++) {
    let best = null;
    for (const z of zones) {
      const d = dayEntry(z.id, o);
      if (!d) continue;
      const s = adjusted(z, d.score);
      if (!best || s > best.s) best = { s, z, d };
    }
    if (!best) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'day';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', o === state.dayOffset);
    const label = o === 0 ? 'Oggi' : o === 1 ? 'Domani' : fmtDate(best.d.date, { weekday: 'short' });
    b.innerHTML = `<span class="d1">${label}</span><span class="d2">${fmtDate(best.d.date, { day: 'numeric', month: 'short' })}</span>
      <span class="d3"><span class="dot" style="background:var(${scoreVar(best.s)})"></span><b>${best.s}</b> ${esc(best.z.name.split(/[/–(]/)[0].trim())}</span>`;
    b.addEventListener('click', () => { state.dayOffset = o; renderAll(); });
    box.appendChild(b);
  }
}

function renderRanking() {
  const combos = [];
  for (const z of zones) {
    for (let o = 0; o <= AHEAD_DAYS; o++) {
      const d = dayEntry(z.id, o);
      if (d?.best) combos.push({ z, o, d, s: adjusted(z, d.score) });
    }
  }
  combos.sort((a, b) => b.s - a.s || a.o - b.o);
  // al massimo 2 giorni per zona, per dare varieta'
  const perZone = {};
  const top = combos.filter((c) => (perZone[c.z.id] = (perZone[c.z.id] || 0) + 1) <= 2).slice(0, 8);
  const ol = $('#ranking');
  ol.innerHTML = '';
  for (const c of top) {
    const li = document.createElement('li');
    li.className = 'rank-item' + (c.z.id === state.zoneId && c.o === state.dayOffset ? ' active' : '');
    li.tabIndex = 0;
    const day = c.o === 0 ? 'oggi' : c.o === 1 ? 'domani' : fmtDate(c.d.date, { weekday: 'long', day: 'numeric' });
    const conf = c.d.best.confidence;
    li.innerHTML = `<span class="score-pill"><span class="dot" style="background:var(${scoreVar(c.s)})"></span>${c.s}</span>
      <div><div class="t1">${esc(c.z.name)} · ${day}</div>
      <div class="t2">${esc(c.d.best.species.name)} intorno ai ${c.d.best.band} m · ${c.z.drive_min} min da Rieti</div></div>
      <span class="conf">affidabilità<br>${conf >= 0.8 ? 'alta' : conf >= 0.55 ? 'media' : 'bassa'}</span>`;
    const go = () => { state.zoneId = c.z.id; state.dayOffset = c.o; renderAll(); map?.flyTo([c.z.lat, c.z.lon], 12, { duration: 0.6 }); };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    ol.appendChild(li);
  }
  if (!state.zoneId && top[0]) state.zoneId = top[0].z.id;
}

function initMap() {
  const bm = globalThis.FUNGAROLI_DATA?.basemap;
  if (hasLeaflet() && bm) { initEmbeddedMap(bm); return; }
  if (!hasLeaflet()) { document.querySelector('.map-panel').classList.add('schematic'); return; }
  map = L.map('map', { scrollWheelZoom: true, zoomControl: true }).setView([42.4, 13.05], 10);
  const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17, attribution: '© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)',
  }).addTo(map);
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
  const forest = L.tileLayer.wms('https://geoportale.regione.lazio.it/geoserver/ows', {
    layers: 'geonode:tipi_forestali2', format: 'image/png', transparent: true, opacity: 0.55,
    attribution: 'Carta Forestale © Regione Lazio',
  });
  L.control.layers({ 'Topografica': topo, 'OpenStreetMap': osm }, { 'Carta Forestale (Regione Lazio)': forest }, { collapsed: true }).addTo(map);
  map.on('zoomend', () => results && renderMap());
  map.on('overlayadd', (e) => { if (e.layer === forest) $('#legend .wms').hidden = false; });
  map.on('overlayremove', (e) => { if (e.layer === forest) $('#legend .wms').hidden = true; });
}

// Versione Artifact: base topografica e Carta Forestale incorporate come immagini georeferenziate.
function initEmbeddedMap(bm) {
  const bounds = L.latLngBounds(bm.bounds);
  map = L.map('map', { maxBounds: bounds.pad(0.05), minZoom: 9, maxZoom: 14, zoomSnap: 0.5 }).fitBounds(bounds);
  L.imageOverlay(bm.topo, bounds, { className: 'basemap', attribution: bm.attribution }).addTo(map);
  const forest = L.imageOverlay(bm.forest, bounds, { opacity: 0.55, className: 'forestmap' });
  map.setView([42.42, 13.03], 10);
  const Toggle = L.Control.extend({
    onAdd() {
      const b = L.DomUtil.create('button', 'map-toggle');
      b.type = 'button';
      b.textContent = 'Carta Forestale';
      b.setAttribute('aria-pressed', 'false');
      L.DomEvent.disableClickPropagation(b);
      b.addEventListener('click', () => {
        const on = !map.hasLayer(forest);
        if (on) forest.addTo(map); else forest.remove();
        b.setAttribute('aria-pressed', String(on));
        $('#legend .wms').hidden = !on;
      });
      return b;
    },
  });
  new Toggle({ position: 'topright' }).addTo(map);
  map.on('zoomend', () => results && renderMap());
}

const shortName = (z) => z.name.split(/[/–(]/)[0].trim();

function renderMap() {
  if (!hasLeaflet()) {
    renderSvgMap($('#map'), {
      zones, origin,
      items: zones.map((z) => {
        const d = dayEntry(z.id, state.dayOffset);
        const s = adjusted(z, d?.score ?? 0);
        return {
          z, score: s, color: `var(${scoreVar(s)})`, selected: z.id === state.zoneId,
          tooltip: `${z.name} · indice ${s}${d?.best ? ` · ${d.best.species.name} ~${d.best.band} m` : ''}`,
        };
      }),
      onSelect: (id) => { state.zoneId = id; renderAll(); },
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
    const s = adjusted(z, d?.score ?? 0);
    const color = cssVar(scoreVar(s));
    const g = L.layerGroup().addTo(map);
    const selected = z.id === state.zoneId;
    L.circle([z.lat, z.lon], {
      radius: z.radius_m, color: selected ? cssVar('--text') : color, weight: selected ? 3 : 2,
      fillColor: color, fillOpacity: 0.5,
    }).addTo(g).on('click', () => { state.zoneId = z.id; renderAll(); })
      .bindTooltip(`<b>${esc(z.name)}</b><br>Indice ${s} · ${d?.best ? esc(d.best.species.name) + ' ~' + d.best.band + ' m' : '—'}`, { className: 'zone-tt', sticky: true });
    L.marker(labelPos[z.id], {
      icon: L.divIcon({ className: '', html: `<span class="zone-label"><span class="dot" style="background:${color}"></span> ${s} <span class="zone-name">${esc(shortName(z))}</span></span>`, iconSize: null }),
      interactive: false,
    }).addTo(g);
    if (selected) {
      for (const p of z.parking) {
        L.circleMarker([p.lat, p.lon], { radius: 6, color: cssVar('--surface'), weight: 2, fillColor: cssVar('--accent'), fillOpacity: 1 })
          .addTo(g).bindTooltip('P · ' + esc(p.name));
      }
    }
    zoneLayers[z.id] = g;
  }
}

function renderLegend() {
  const items = [...CLASSES].reverse().map((c) => `<span><span class="sw" style="background:var(${scoreVar(c.min)})"></span>${c.label}${c.min ? ' ≥' + c.min : ''}</span>`);
  $('#legend').innerHTML = items.join('') +
    (hasLeaflet() || !globalThis.FUNGAROLI_DATA ? '' : '<span class="muted">Schema: cerchi = zone, anelli = distanza in linea d\'aria da Rieti</span>') +
    `<span class="wms" hidden><img alt="Legenda Carta Forestale" style="max-width:100%;display:block;margin-top:6px" src="${globalThis.FUNGAROLI_DATA?.basemap?.legend || 'https://geoportale.regione.lazio.it/geoserver/ows?service=WMS&request=GetLegendGraphic&format=image/png&layer=geonode:tipi_forestali2'}"></span>`;
}

function forestBar(frac) {
  const entries = Object.entries(frac).sort((a, b) => b[1] - a[1]);
  const named = entries.filter(([k]) => FOREST_COLORS[k] || k === 'non bosco');
  const other = entries.filter(([k]) => !FOREST_COLORS[k] && k !== 'non bosco').reduce((s, [, v]) => s + v, 0);
  if (other > 0) named.push(['Altro bosco/arbusteto', other]);
  named.sort((a, b) => (a[0] === 'non bosco') - (b[0] === 'non bosco') || b[1] - a[1]);
  const bar = named.map(([k, v]) => `<span style="flex:${v};background:${forestColor(k)}" title="${esc(k)} ${Math.round(v * 100)}%"></span>`).join('');
  const leg = named.filter(([, v]) => v >= 0.03).map(([k, v]) => `<span><span class="dot" style="background:${forestColor(k)};border-radius:3px"></span> ${esc(SHORT[k] || k)} ${Math.round(v * 100)}%</span>`).join('');
  return `<div class="forest">${bar}</div><div class="forest-legend">${leg}</div>`;
}

function renderDetail() {
  const z = zones.find((x) => x.id === state.zoneId) || zones[0];
  const r = results[z.id];
  const d = dayEntry(z.id, state.dayOffset);
  const box = $('#detail');
  if (!d?.best) { box.innerHTML = '<p class="muted">Nessun dato per questo giorno.</p>'; return; }
  const best = d.best;
  const s = adjusted(z, d.score);
  const dayLabel = state.dayOffset === 0 ? 'oggi' : fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' });
  const hab = habitatAtBand(habitat[z.id], best.band);
  const rows = d.perSpecies.map((p) => `
    <tr>
      <td><div>${esc(p.species.name)}</div><div class="latin">${esc(p.species.latin)}</div>
        ${p.species.warning ? `<div class="warnline">⚠ ${esc(p.species.warning)}</div>` : ''}</td>
      <td class="num">${p.band} m</td>
      <td><div class="bar"><i style="width:${p.score}%;background:var(${scoreVar(p.score)})"></i></div></td>
      <td class="num"><b>${p.score}</b></td>
    </tr>`).join('');

  const sb = series[z.id][bandIndex(z, best.band)];
  const from = Math.max(0, r.todayIndex - HISTORY_DAYS);
  const days = r.days.filter((x) => x.i >= from);

  box.innerHTML = `
    <h2>${esc(z.name)}</h2>
    <p class="meta">${dayLabel} · ${z.drive_min} min / ${z.drive_km} km da Rieti (stima OSRM)</p>
    <p><span class="score-pill" style="font-size:20px"><span class="dot" style="width:14px;height:14px;background:var(${scoreVar(s)})"></span>${s}</span>
      <span class="muted"> ${CLASSES[classOf(s)].label} · ${esc(best.species.name)} intorno ai <b>${best.band} m</b></span></p>
    <ul class="reasons">${explain(best).map((x) => `<li>${esc(x)}</li>`).join('')}
      <li>affidabilità ${Math.round(best.confidence * 100)}%${best.confidence < 1 ? ' (dipende anche da pioggia prevista)' : ''}</li></ul>
    ${z.protection ? `<div class="notice">${esc(z.protection)}</div>` : ''}
    <div id="charts"></div>
    <h3>Specie (miglior quota per ciascuna)</h3>
    <table class="sp-table"><thead><tr><th>Specie</th><th>Quota</th><th></th><th>Indice</th></tr></thead><tbody>${rows}</tbody></table>
    <h3>Bosco a ${best.band} m ±150 (Carta Forestale)</h3>
    ${forestBar(hab.frac)}
    <h3>Come arrivare</h3>
    <p class="small">${esc(z.description)}</p>
    <dl class="kv">
      <dt>Accesso</dt><dd>${esc(z.access)}</dd>
      <dt>Sosta</dt><dd>${z.parking.map((p) => `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join(' · ')}</dd>
      <dt>Sentieri</dt><dd>${esc(z.trails)}</dd>
      <dt>Quote zona</dt><dd>${habitat[z.id].elevation.min}–${habitat[z.id].elevation.max} m (mediana ${habitat[z.id].elevation.median})</dd>
    </dl>`;

  renderCharts($('#charts'), {
    dates: days.map((x) => x.date),
    rain: days.map((x) => sb.p[x.i] ?? 0),
    score: days.map((x) => adjusted(z, x.score)),
    todayIndex: r.todayIndex - from,
    selectedIndex: r.todayIndex + state.dayOffset - from,
  });
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
