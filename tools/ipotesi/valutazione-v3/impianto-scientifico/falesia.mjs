// Distribuzione dell'indice Fronda 2.0.0 (codice del repository, sola lettura)
// su serie meteo Open-Meteo reali. Uso: node falesia.mjs <dataset.json> <ids.json> <soil: icon|era5> [from] [to]
import fs from 'node:fs';
const FIX = process.env.FRONDA_DIR || process.cwd();
const { scoreSpecies, CLASSES } = await import(FIX + '/js/model.js');
const { SPECIES } = await import(FIX + '/js/species.js');
const habitat = JSON.parse(fs.readFileSync(FIX + '/data/habitat.json', 'utf8')).zones;
const zones = JSON.parse(fs.readFileSync(FIX + '/data/zones.json', 'utf8')).zones;

const [file, idsFile, soil, from = '0000', to = '9999'] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
const fungi = SPECIES.filter((s) => s.kind !== 'plant');

function series(loc) {
  const d = loc.daily, h = loc.hourly || {};
  const fin = (v) => (Number.isFinite(v) ? v : null);
  let soilm;
  if (soil === 'icon') {
    const by = {};
    (h.time || []).forEach((t, k) => {
      const day = t.slice(0, 10), v = h.soil_moisture_3_to_9cm?.[k];
      const b = (by[day] ||= { m: 0, n: 0 });
      if (Number.isFinite(v) && v >= 0 && v <= 1) { b.m += v; b.n++; }
    });
    soilm = d.time.map((x) => (by[x]?.n >= 24 ? by[x].m / by[x].n : null));
  } else soilm = d.time.map((_, k) => fin(d.soil_moisture_0_to_7cm_mean?.[k]));
  return {
    dates: d.time,
    p: d.time.map((_, k) => (d.precipitation_sum?.[k] >= 0 ? fin(d.precipitation_sum[k]) : null)),
    tmean: d.time.map((_, k) => fin(d.temperature_2m_mean?.[k])),
    tmin: d.time.map((_, k) => fin(d.temperature_2m_min?.[k])),
    tmax: d.time.map((_, k) => fin(d.temperature_2m_max?.[k])),
    soilm, todayIndex: d.time.length - 1, issuedIndex: d.time.length - 1, source: {},
  };
}

const FACT = ['season', 'habitat', 'elev', 'rain', 'temp', 'moist', 'frost', 'heat'];
const rows = [];
const byPoint = {};
data.forEach((loc, k) => {
  const [zid, band] = ids[k].split('|');
  const s = series(loc);
  byPoint[ids[k]] = s;
  for (let i = 0; i < s.dates.length; i++) {
    if (s.dates[i] < from || s.dates[i] > to) continue;
    for (const sp of fungi) {
      const r = scoreSpecies(sp, s, i, habitat[zid], +band, {});
      if (r.score == null) continue;
      rows.push({ zid, band: +band, date: s.dates[i], sp: sp.id, score: r.score,
        f: Object.fromEntries(FACT.map((x) => [x, r[x]])), shock: r.shock });
    }
  }
});
const q = (a, p) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(p * b.length))]; };
const pct = (n, d) => (d ? (100 * n / d).toFixed(1) + '%' : 'n/d');
const out = { file, soil, from, to, cases: rows.length, days: new Set(rows.map((r) => r.date)).size };

// 1. Distribuzione dell'indice (specie x fascia x giorno)
const sc = rows.map((r) => r.score);
out.score_quantiles = Object.fromEntries([0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1].map((p) => [p, q(sc, p)]));
out.classes_all = CLASSES.map((c, j) => [c.shortLabel, pct(rows.filter((r) => r.score >= c.min && (j === 0 || r.score < CLASSES[j - 1].min)).length, rows.length)]);

// 2. Fattori < 1 per caso
const below = (r, t = 0.99) => FACT.filter((x) => r.f[x] < t).length;
const hist = (arr) => { const h = {}; arr.forEach((v) => (h[v] = (h[v] || 0) + 1)); return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, pct(v, arr.length)])); };
out.n_factors_below_0_99_all = hist(rows.map((r) => below(r)));
// casi "pertinenti": in stagione, in habitat, in quota
const rel = rows.filter((r) => r.f.season >= 0.8 && r.f.habitat >= 0.8 && r.f.elev === 1);
out.relevant_cases = rel.length;
out.n_factors_below_0_99_relevant = hist(rel.map((r) => below(r)));
out.n_factors_below_0_9_relevant = hist(rel.map((r) => below(r, 0.9)));
out.relevant_score_quantiles = Object.fromEntries([0.5, 0.9, 0.99, 1].map((p) => [p, q(rel.map((r) => r.score), p)]));
out.factor_stats_relevant = Object.fromEntries(FACT.map((x) => {
  const v = rel.map((r) => r.f[x]);
  return [x, { median: +q(v, 0.5).toFixed(3), p90: +q(v, 0.9).toFixed(3), max: +Math.max(...v).toFixed(3), share_lt_0_99: pct(v.filter((y) => y < 0.99).length, v.length), share_lt_0_8: pct(v.filter((y) => y < 0.8).length, v.length) }];
}));
out.shock_active_relevant = pct(rel.filter((r) => r.shock > 1).length, rel.length);
// fattore limitante (minimo) nei casi pertinenti
const lim = {};
rel.forEach((r) => { const m = FACT.reduce((a, b) => (r.f[b] < r.f[a] ? b : a)); lim[m] = (lim[m] || 0) + 1; });
out.limiting_factor_relevant = Object.fromEntries(Object.entries(lim).map(([k, v]) => [k, pct(v, rel.length)]));
// casi come l'esempio del documento B: almeno 7 fattori tra 0,7 e 0,9
out.docB_example_7_factors_0_7_0_9 = rows.filter((r) => FACT.filter((x) => r.f[x] >= 0.7 && r.f[x] < 0.9).length >= 7).length;
out.max_factors_in_0_7_0_9 = Math.max(...rows.map((r) => FACT.filter((x) => r.f[x] >= 0.7 && r.f[x] < 0.9).length));

// 3. Valore della zona (massimo su specie e fasce), come in combine()
const zd = {};
rows.forEach((r) => { const k = r.zid + '|' + r.date; zd[k] = Math.max(zd[k] ?? -1, r.score); });
const zv = Object.values(zd);
out.zone_day_best_quantiles = Object.fromEntries([0.1, 0.5, 0.9, 1].map((p) => [p, q(zv, p)]));
out.zone_day_classes = CLASSES.map((c, j) => [c.shortLabel, pct(zv.filter((v) => v >= c.min && (j === 0 || v < CLASSES[j - 1].min)).length, zv.length)]);

// 4. Proposta B come trasformazione: 10 x P^0,6 x H^0,4 x Stagione, con P = parte meteo, H = habitat x quota
// (illustrativa: B non fornisce i beta della sua logistica)
const spearman = (a, b) => {
  const rk = (v) => { const o = v.map((x, i) => [x, i]).sort((x, y) => x[0] - y[0]); const r = Array(v.length); let i = 0; while (i < o.length) { let j = i; while (j + 1 < o.length && o[j + 1][0] === o[i][0]) j++; for (let k = i; k <= j; k++) r[o[k][1]] = (i + j) / 2; i = j + 1; } return r; };
  const ra = rk(a), rb = rk(b), n = a.length, ma = (n - 1) / 2;
  let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - ma); da += (ra[i] - ma) ** 2; db += (rb[i] - ma) ** 2; }
  return num / Math.sqrt(da * db);
};
const bScore = (r) => { const P = r.f.rain * r.f.temp * r.f.moist * r.f.frost * r.f.heat * Math.min(1, r.shock); const H = r.f.habitat * r.f.elev; return 100 * Math.pow(P, 0.6) * Math.pow(H, 0.4) * r.f.season; };
const rhoAll = spearman(rows.map((r) => r.score), rows.map(bScore));
// per giorno e specie: ordine delle 45 fasce
const groups = {};
rows.forEach((r) => { (groups[r.date + '|' + r.sp] ||= []).push(r); });
const rhos = Object.values(groups).filter((g) => g.length >= 10 && new Set(g.map((r) => r.score)).size > 3).map((g) => spearman(g.map((r) => r.score), g.map(bScore)));
// top-1 della zona uguale?
const top = {}; rows.forEach((r) => { const k = r.date + '|' + r.sp; const b = bScore(r); if (!top[k] || r.score > top[k].a.score) top[k] = { ...(top[k] || {}), a: r }; if (!top[k].b || b > top[k].bv) { top[k].b = r; top[k].bv = b; } });
const same = Object.values(top).filter((t) => t.a.zid === t.b.zid && t.a.band === t.b.band).length;
out.docB_transform = { spearman_all_cases: +rhoAll.toFixed(3), spearman_within_day_species_median: +q(rhos, 0.5).toFixed(3), spearman_within_day_species_p10: +q(rhos, 0.1).toFixed(3), groups: rhos.length,
  same_best_band_share: pct(same, Object.keys(top).length),
  median_B_minus_current_relevant: +q(rel.map((r) => bScore(r) - r.score), 0.5).toFixed(1) };
console.log(JSON.stringify(out, null, 1));
