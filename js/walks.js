// Public trail context. These helpers never infer mushroom sightings or route safety.
import { PARAMS } from './model.js';

export function uniquePlaceProposals(combos) {
  const seen = new Set();
  return [...combos].sort((a, b) => b.r - a.r || a.o - b.o).filter(c => {
    if (seen.has(c.z.id)) return false;
    seen.add(c.z.id);
    return true;
  });
}

// Lunghezza dell'itinerario completo, solo se coerente: un intero non è più corto del suo tratto
// nella zona. Altrimenti null («Lunghezza n.d.»): protegge anche dai dati futuri del CMS.
export const fullTrailKm = t => (t?.total_km > 0 && t.total_km >= (t.in_zone_km || 0)) ? t.total_km : null;

// Within the compatible trails, prefer T/E routes with mapped access, then local routes.
// Keep the supplied environmental order as a tie-break. Difficulty remains visible.
export function chooseWalkTrail(compatible, all, headsFor) {
  const candidates = compatible.length ? compatible : all;
  const priority = t => [
    ['T', 'E'].includes(t.difficulty) ? 0 : 1,
    headsFor(t).length ? 0 : 1,
    fullTrailKm(t) && t.in_zone_km / fullTrailKm(t) >= .75 ? 0 : 1,
  ];
  return candidates.map((t, i) => ({ t, i, p: priority(t) })).sort((a, b) =>
    a.p[0] - b.p[0] || a.p[1] - b.p[1] || a.p[2] - b.p[2] || a.i - b.i
  )[0]?.t || null;
}

// ---- Sentieri e fascia di quota dell'indice (audit OUT-11) ----
// I campioni dei sentieri sono uno ogni 100 m (tools/build_trails.py, STEP_M): km = campioni / 10.
// Un sentiero conta come compatibile da 3 campioni adatti (0,3 km). Euristica dell'app, già in uso prima
// dell'audit: non viene da una fonte.
export const MIN_GOOD_SAMPLES = 3;

// Campione di sentiero adatto alla specie del consiglio.
// Funghi: stessa fascia del modello (±PARAMS.bandHalfWidth = 150 m attorno alla quota dell'indice, come
// habitatAtBand e accessFor in js/app.js), affinità del bosco ≥ 0,6 e quota dentro l'intervallo della
// specie (species.elev), come prima. Fino al 16/10/2026 la fascia dei sentieri era ±250 m: il profilo
// colorava come «compatibile» bosco che l'indice non guarda.
// Piante: regola invariata (±250 m, intervallo ±300 m, affinità ≥ 0,2); il loro indice ha un altro motore.
export function sampleFits(sp, e, cat, band) {
  const plant = sp?.kind === 'plant', range = plant ? sp?.elevationRange : sp?.elev, pad = plant ? 300 : 0;
  return !!sp?.forest && (sp.forest[cat] || 0) >= (plant ? .2 : .6)
    && (!range || e >= range[0] - pad && e <= range[1] + pad)
    && Math.abs(e - band) <= (plant ? 250 : PARAMS.bandHalfWidth);
}

// Quote in cui un campione può essere adatto a un fungo: la fascia dell'indice tagliata sull'intervallo della specie.
export function fitRange(sp, band) {
  if (!sp || sp.kind === 'plant' || !Number.isFinite(band)) return null;
  const lo = Math.max(band - PARAMS.bandHalfWidth, sp.elev?.[0] ?? -Infinity), hi = Math.min(band + PARAMS.bandHalfWidth, sp.elev?.[1] ?? Infinity);
  return lo <= hi ? [lo, hi] : null;
}

const sampleCategory = (c, categories) => c >= 0 ? categories?.[c] : 'non bosco';

// Sentieri di una zona ordinati per km in bosco adatto alla specie, alla quota dell'indice.
// tz: voce di data/trails.json per la zona ({ sample_categories, trails }).
export function compatibleTrails(tz, sp, band) {
  if (!tz?.trails) return [];
  return tz.trails.map((t) => {
    let n = 0, lo = Infinity, hi = -Infinity;
    const cats = {};
    for (const [e, c] of t.samples || []) {
      const cat = sampleCategory(c, tz.sample_categories);
      if (!sampleFits(sp, e, cat, band)) continue;
      n++; lo = Math.min(lo, e); hi = Math.max(hi, e);
      cats[cat] = (cats[cat] || 0) + 1;
    }
    const mainCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
    // i lunghi itinerari (E1, Sentiero Italia, cammini) ricalcano i sentieri CAI: precedenza ai locali
    const long = ['INT', 'NAT', 'REG'].includes(t.group);
    return { ...t, goodKm: n / 10, goodSamples: n, lo, hi, mainCat, long, rank: (n / 10) * (long ? 0.7 : 1) };
  }).filter((t) => t.goodSamples >= MIN_GOOD_SAMPLES).sort((a, b) => b.rank - a.rank);
}

// Il sentiero mostrato passa dalla fascia su cui è calcolato l'indice della zona?
// Conta i campioni nella fascia (qualunque bosco) e quelli adatti alla specie; non calcola un indice
// del sentiero (i campioni del tratto sono pochi e vicini tra loro). null per le piante o senza dati.
export function trailBandFit(t, categories, sp, band) {
  if (!sp?.forest || sp.kind === 'plant' || !Number.isFinite(band)) return null;
  const sm = (t?.samples || []).filter((s) => Number.isFinite(s?.[0]));
  if (!sm.length) return null;
  let inBand = 0, fit = 0;
  for (const [e, c] of sm) {
    if (Math.abs(e - band) <= PARAMS.bandHalfWidth) inBand++;
    if (sampleFits(sp, e, sampleCategory(c, categories), band)) fit++;
  }
  const es = sm.map((s) => s[0]);
  return { band, half: PARAMS.bandHalfWidth, inBand, fit, lo: Math.min(...es), hi: Math.max(...es), off: fit < MIN_GOOD_SAMPLES };
}

// Etichetta per il sentiero che non passa dalla fascia dell'indice (anche quando lo sceglie l'utente).
export function bandFitNote(fit) {
  if (!fit?.off) return '';
  const where = !fit.inBand ? '' : fit.fit ? ' e a quella quota attraversa poco bosco adatto' : ' e a quella quota non attraversa bosco adatto';
  return `Indice della zona a ${fit.band} m; questo sentiero sta tra ${fit.lo} e ${fit.hi} m${where}. L’indice non è calcolato sul sentiero.`;
}

// Ripiego (nessun sentiero compatibile): a parità delle altre priorità di chooseWalkTrail, prima i sentieri
// che arrivano più vicino alla quota dell'indice. Ordinamento stabile; senza quote in fondo.
export function nearBandFirst(list, band) {
  if (!Number.isFinite(band)) return list;
  const gap = (t) => {
    const es = (t.samples || []).map((s) => s?.[0]).filter(Number.isFinite);
    if (!es.length) return Infinity;
    const lo = Math.min(...es), hi = Math.max(...es);
    return band < lo ? lo - band : band > hi ? band - hi : 0;
  };
  return list.map((t, i) => ({ t, i, g: gap(t) })).sort((a, b) => a.g - b.g || a.i - b.i).map((x) => x.t);
}

// ---- Tempi della fonte (audit OUT-02) ----
// Tempo dichiarato in OpenStreetMap (tag duration): «H», «H:MM» o «HH:MM». Altri formati (es. «0300») non si leggono.
export function sourceHours(s) {
  const m = /^(\d{1,2})(?::([0-5]\d))?$/.exec(String(s ?? '').trim());
  const h = m ? +m[1] + (+m[2] || 0) / 60 : null;
  return h > 0 ? h : null;
}
const metres = (x) => {
  const n = x == null || x === '' ? NaN : Number(String(x).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// Riferimento dei tempi di cammino della norma DIN 33466, usata per i cartelli dai club alpini di lingua
// tedesca: 4 km/h in piano, 300 m/h in salita, 500 m/h in discesa; dei due tempi (orizzontale e verticale)
// il minore si dimezza e si somma al maggiore. Fonti lette il 16/10/2026:
// - DAV Sektion München & Oberland, alpinwelt 3/2024, «Grundwissen Beschilderung» (L. Brechtel):
//   https://www.alpenverein-muenchen-oberland.de/alpinwelt/archiv/alpinwelt-3-2024-bergmagazin-alpenverein-muenchen-oberland/grundwissen-beschilderung
// - Bergwelten, «Wegzeitberechnung beim Wandern» (29/06/2021):
//   https://www.bergwelten.com/a/berg-know-how-wie-lange-geht-s-noch
// Il testo della norma (a pagamento) non è stato consultato. Serve solo a scartare tempi incoerenti:
// l'app non mostra mai questo valore come tempo di percorrenza.
export function dinHours(km, up = 0, down = 0) {
  const h = (km || 0) / 4, v = (up || 0) / 300 + (down || 0) / 500;
  return Math.max(h, v) + Math.min(h, v) / 2;
}
// Soglia di controllo redazionale, scelta dal proprietario (decisione su OUT-02, 16/10/2026): un tempo
// sotto la metà del riferimento DIN non si mostra. Non è un valore della norma.
export const MIN_SHARE_OF_DIN = 0.5;

// Si può mostrare il tempo della fonte? null = sì; altrimenti il motivo.
// - 'illeggibile': formato non riconosciuto.
// - 'verso': la fonte dà anche il tempo di ritorno (duration_back) e la discesa, e il tempo di andata è più
//   breve anche se l'andata ha più salita (a parità di km, per DIN il verso con più salita chiede più tempo):
//   andata e ritorno sono probabilmente invertiti.
// - 'troppo breve': tempo sotto MIN_SHARE_OF_DIN del riferimento DIN. Se la discesa non è nota il
//   riferimento la conta zero, cioè il più breve possibile: si segnala solo un'incoerenza certa.
// Senza lunghezza intera coerente (fullTrailKm) il controllo «troppo breve» non si fa.
export function sourceTimeIssue(t) {
  if (t?.duration == null || t.duration === '') return null;
  const f = sourceHours(t.duration);
  if (f == null) return 'illeggibile';
  const up = metres(t.ascent), down = metres(t.descent), back = sourceHours(t.duration_back);
  if (back != null && up != null && down != null && up > down && f < back) return 'verso';
  const km = fullTrailKm(t);
  if (!km) return null;
  return f < MIN_SHARE_OF_DIN * dinHours(km, up || 0, down || 0) ? 'troppo breve' : null;
}
// Spiegazione breve, senza il numero scartato.
export const SOURCE_TIME_NOTE = {
  illeggibile: 'Il tempo indicato dalla fonte ha un formato non leggibile.',
  verso: 'Nella fonte il tempo di andata è più breve di quello di ritorno, anche se l’andata ha più salita: i due tempi sembrano invertiti.',
  'troppo breve': 'Il tempo indicato dalla fonte è troppo breve per lunghezza e dislivello, secondo il riferimento dei club alpini (norma DIN 33466).',
};

export function distanceMeters(a, b) {
  const rad = Math.PI / 180;
  const x = Math.sin((b.lat - a.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}

export function walkContext(z, t, heads) {
  if (!t) return null;
  const h = heads[0] || null;
  const parking = h ? (z.parking || []).map(p => ({ p, distance: distanceMeters(h, p) }))
    .sort((a, b) => a.distance - b.distance)[0] : null;
  const microzone = h && parking?.distance <= 500 ? `Dintorni di ${parking.p.name}`
    : h?.road ? `Imbocco su ${h.road}`
      : h ? `Imbocco del sentiero${t.ref ? ' ' + t.ref : ''}`
        : `Tratto nella zona di ${z.title || z.name}`;
  return { t, h, microzone, parking: parking?.distance <= 500 ? parking.p : null };
}

// Separate polylines stay separate: a clipped relation is not necessarily a loop.
export function trailSketch(t, head, extraHeads = []) {
  const lines = (t.lines || []).filter(l => l.length >= 2);
  if (!lines.length) return null;
  const points = lines.flat();
  const heads = [head, ...extraHeads].filter(h => h && Number.isFinite(h.lat) && Number.isFinite(h.lon));
  heads.forEach(h => points.push([h.lat, h.lon]));
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const k = Math.cos(lat * Math.PI / 180);
  const xs = points.map(p => p[1] * k), ys = points.map(p => -p[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(312 / Math.max(maxX - minX, .0001), 152 / Math.max(maxY - minY, .0001));
  const dx = (360 - (maxX - minX) * scale) / 2, dy = (200 - (maxY - minY) * scale) / 2;
  const project = p => [(p[1] * k - minX) * scale + dx, (-p[0] - minY) * scale + dy];
  const projected = points.map(project), px = projected.map(p => p[0]), py = projected.map(p => p[1]);
  const width = Math.max(80, Math.max(...px)-Math.min(...px)+32), height = Math.max(80, Math.max(...py)-Math.min(...py)+32);
  const viewBox = [(Math.max(...px)+Math.min(...px)-width)/2,(Math.max(...py)+Math.min(...py)-height)/2,width,height];
  return { paths: lines.map(l => l.map(p => project(p).map(n => n.toFixed(1)).join(',')).join(' ')), head: head && Number.isFinite(head.lat) && Number.isFinite(head.lon) ? project([head.lat, head.lon]) : null, heads: heads.map(h => project([h.lat, h.lon])), viewBox };
}
