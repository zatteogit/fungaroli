// Public trail context. These helpers never infer mushroom sightings or route safety.
export function uniquePlaceProposals(combos) {
  const seen = new Set();
  return [...combos].sort((a, b) => b.r - a.r || a.o - b.o).filter(c => {
    if (seen.has(c.z.id)) return false;
    seen.add(c.z.id);
    return true;
  });
}

// Within the compatible trails, prefer T/E routes with mapped access, then local routes.
// Keep the supplied environmental order as a tie-break. Difficulty remains visible.
export function chooseWalkTrail(compatible, all, headsFor) {
  const candidates = compatible.length ? compatible : all;
  const priority = t => [
    ['T', 'E'].includes(t.difficulty) ? 0 : 1,
    headsFor(t).length ? 0 : 1,
    t.total_km > 0 && t.in_zone_km / t.total_km >= .75 ? 0 : 1,
  ];
  return candidates.map((t, i) => ({ t, i, p: priority(t) })).sort((a, b) =>
    a.p[0] - b.p[0] || a.p[1] - b.p[1] || a.p[2] - b.p[2] || a.i - b.i
  )[0]?.t || null;
}

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
export function trailSketch(t, head) {
  const lines = (t.lines || []).filter(l => l.length >= 2);
  if (!lines.length) return null;
  const points = lines.flat();
  if (head) points.push([head.lat, head.lon]);
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const k = Math.cos(lat * Math.PI / 180);
  const xs = points.map(p => p[1] * k), ys = points.map(p => -p[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(312 / Math.max(maxX - minX, .0001), 152 / Math.max(maxY - minY, .0001));
  const dx = (360 - (maxX - minX) * scale) / 2, dy = (200 - (maxY - minY) * scale) / 2;
  const project = p => [(p[1] * k - minX) * scale + dx, (-p[0] - minY) * scale + dy];
  return { paths: lines.map(l => l.map(p => project(p).map(n => n.toFixed(1)).join(',')).join(' ')), head: head ? project([head.lat, head.lon]) : null };
}
