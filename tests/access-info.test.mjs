import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// data/access-info.json: punto strada (non pista), pista più vicina, percorso a piedi e dislivello per ogni
// campione di bosco di data/habitat.json (tools/build_access_info.py). Dato statico, fuori dal CMS.
const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const info = read('access-info.json');
const habitat = read('habitat.json');
const zones = Object.fromEntries(read('zones.json').zones.map((z) => [z.id, z]));

const FIELDS = ['strada_m', 'strada_lat', 'strada_lon', 'fondo', 'classe', 'uso', 'strada', 'pista_m',
  'quota_strada', 'dislivello', 'piedi_m', 'fuori_rete_m', 'salita_m', 'discesa_m'];
const F = Object.fromEntries(FIELDS.map((f, i) => [f, i]));
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const int = (v) => Number.isInteger(v);
// distanza geodetica (haversine), come in tools/build_access_info.py
const meters = (a, b) => {
  const r = Math.PI / 180, dp = (b[0] - a[0]) * r, dl = (b[1] - a[1]) * r;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dl / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
};
const each = (fn) => {
  for (const [id, z] of Object.entries(info.zones)) z.samples.forEach((r, i) => fn(r, `${id}#${i}`, habitat.zones[id].samples[i], id));
};

test('stesse zone e stessi campioni di habitat.json, nello stesso ordine; null solo fuori bosco', () => {
  assert.deepEqual(Object.keys(info.zones), Object.keys(habitat.zones));
  assert.equal(info.mancanti, undefined, `zone non calcolate: ${info.mancanti}`);
  assert.equal(info.habitat.generated, habitat.generated, 'habitat.json è stato rigenerato: rilancia tools/build_access_info.py');
  for (const [id, z] of Object.entries(habitat.zones)) {
    const za = info.zones[id];
    assert.equal(za.n, z.samples.length, id);
    assert.equal(za.samples.length, z.samples.length, id);
    // somma delle coordinate (intere, in 1e-5 gradi): cambia se cambiano i campioni o il loro ordine
    const sum = (k) => z.samples.reduce((s, x) => s + Math.round(x[k] * 1e5), 0);
    assert.deepEqual(za.check, [sum(2), sum(3)], `${id}: campioni diversi da habitat.json`);
    z.samples.forEach((s, i) => {
      if (s[1] < 0) assert.equal(za.samples[i], null, `${id}#${i}: fuori bosco, deve essere null`);
      else assert.ok(Array.isArray(za.samples[i]) && za.samples[i].length === FIELDS.length, `${id}#${i}: campione di bosco senza dati`);
    });
  }
});

test('legenda e fonti presenti: ogni campo ha una fonte con licenza, URL e data di estrazione', () => {
  assert.match(info.generated, DATE);
  assert.deepEqual(info.fields, FIELDS);
  assert.deepEqual(Object.keys(info.legend), FIELDS);
  const ids = new Set(info.sources.map((s) => s.id));
  for (const s of info.sources) {
    for (const k of ['id', 'nome', 'editore', 'url', 'licenza', 'licenza_url', 'estratto']) assert.ok(s[k], `${s.id}: manca ${k}`);
    assert.match(s.estratto, DATE, s.id);
    assert.match(s.url, /^https:\/\//, s.id);
  }
  for (const f of FIELDS) assert.ok(ids.has(info.legend[f].fonte), `${f}: fonte ${info.legend[f].fonte}`);
  assert.ok(ids.has('valhalla') && ids.has('tinitaly'));
  assert.match(info.sources.find((s) => s.id === 'valhalla').licenza, /ODbL/);
  assert.match(info.sources.find((s) => s.id === 'tinitaly').licenza, /CC BY 4\.0/);
  // la decisione (percorso mancante o troppo lungo) spetta all'interfaccia: nel dato nessuna soglia
  assert.match(info.uso, /Nessuna soglia/);
});

test('nessun punto strada su una pista', () => {
  const uses = info.legend.uso.valori;
  for (const u of ['track', 'driveway', 'path', 'footway']) assert.equal(uses.includes(u), false, u);
  assert.equal(info.legend.classe.valori[0], 'motorway');
  const bad = [];
  let wasTrack = 0;
  each((r, at, s) => {
    if (!r || r[F.strada_m] === null) return;
    if (!(int(r[F.uso]) && r[F.uso] >= 0 && r[F.uso] < uses.length)) bad.push(`${at} uso ${r[F.uso]}`);
    if (!(int(r[F.classe]) && r[F.classe] >= 1 && r[F.classe] < info.legend.classe.valori.length)) bad.push(`${at} classe ${r[F.classe]}`);
    const pista = r[F.pista_m];
    if (pista !== null && !(pista <= r[F.strada_m])) bad.push(`${at}: pista a ${pista} m non più vicina della strada a ${r[F.strada_m]} m`);
    // habitat.json (12/10) prendeva l'arco più vicino di qualunque tipo: se quello era la pista, il punto deve essere cambiato
    if (pista !== null && s[4] !== null && Math.abs(s[4] - pista) <= 2) {
      wasTrack++;
      if (meters([s[7], s[8]], [r[F.strada_lat], r[F.strada_lon]]) < 2) bad.push(`${at}: punto strada uguale al vecchio punto su pista`);
    }
  });
  assert.deepEqual(bad.slice(0, 20), []);
  assert.ok(wasTrack > 1000, `punti vecchi su pista riconosciuti: ${wasTrack}`);
});

test('valori numerici plausibili e coerenti tra loro', () => {
  const bad = [];
  let walks = 0;
  each((r, at, s, id) => {
    if (!r) return;
    const z = zones[id];
    const v = Object.fromEntries(FIELDS.map((f) => [f, r[F[f]]]));
    if (v.strada_m === null) {
      if (FIELDS.some((f) => f !== 'pista_m' && v[f] !== null)) bad.push(`${at}: senza strada ma con altri valori`);
      return;
    }
    if (!(int(v.strada_m) && v.strada_m >= 0 && v.strada_m <= 10000)) bad.push(`${at} strada_m ${v.strada_m}`);
    if (Math.abs(v.strada_lat - z.lat) > 0.15 || Math.abs(v.strada_lon - z.lon) > 0.2) bad.push(`${at} punto strada lontano dalla zona`);
    // la distanza dichiarata è quella tra campione e punto strada
    if (Math.abs(meters([s[2], s[3]], [v.strada_lat, v.strada_lon]) - v.strada_m) > 3) bad.push(`${at} strada_m incoerente con le coordinate`);
    if (![0, 1, 2, null].includes(v.fondo)) bad.push(`${at} fondo ${v.fondo}`);
    const names = info.zones[id].strade;
    if (!(v.strada === -1 || (int(v.strada) && v.strada >= 0 && v.strada < names.length))) bad.push(`${at} strada ${v.strada}`);
    if (!(int(v.quota_strada) && v.quota_strada >= 100 && v.quota_strada <= 2500)) bad.push(`${at} quota_strada ${v.quota_strada}`);
    if (!(int(v.dislivello) && Math.abs(v.dislivello) <= 1500)) bad.push(`${at} dislivello ${v.dislivello}`);
    // quota del campione (TINITALY 10 m) contro quella di habitat.json (Copernicus 90 m): stesso ordine di grandezza
    if (Math.abs(v.quota_strada + v.dislivello - s[0]) > 250) bad.push(`${at} quota del campione ${v.quota_strada + v.dislivello} contro ${s[0]}`);
    const walk = ['piedi_m', 'fuori_rete_m', 'salita_m', 'discesa_m'];
    if (v.piedi_m === null) {
      if (walk.some((f) => v[f] !== null)) bad.push(`${at}: percorso a metà`);
      return;
    }
    walks++;
    for (const f of walk) if (!(int(v[f]) && v[f] >= 0 && v[f] <= 30000)) bad.push(`${at} ${f} ${v[f]}`);
    // il percorso (rete + tratti fuori rete) non è più corto della linea d'aria
    if (v.piedi_m + v.fuori_rete_m < v.strada_m - 3) bad.push(`${at}: percorso ${v.piedi_m}+${v.fuori_rete_m} m più corto della linea d'aria ${v.strada_m} m`);
    // salita meno discesa lungo la traccia = dislivello tra gli estremi (stesso DEM), a meno degli arrotondamenti
    if (Math.abs(v.salita_m - v.discesa_m - v.dislivello) > 3) bad.push(`${at}: salita ${v.salita_m} - discesa ${v.discesa_m} ≠ dislivello ${v.dislivello}`);
    if (v.salita_m < Math.max(0, v.dislivello) - 3) bad.push(`${at}: salita ${v.salita_m} minore del dislivello ${v.dislivello}`);
  });
  assert.deepEqual(bad.slice(0, 20), []);
  assert.ok(walks > 2500, `percorsi a piedi: ${walks}`);
});
