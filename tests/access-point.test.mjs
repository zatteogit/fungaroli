// Punto d'accesso e ultimo tratto a piedi (js/human.js, data/access-info.json, data/habitat-info.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseAccess, accessFieldIndex, accessRow, walkEqM, rowWalkEqM, walkKind, walkPhrase, trackNote, comfortScore,
  fmtDist, fmtRise, DETOUR_MAX, OFFNET_MAX_SHARE, ROADSIDE_M } from '../js/human.js';
import { dinHours } from '../js/walks.js';
import { prepareSiteInfo, alignedZones, excludedFn, infoRow } from '../js/site-info.js';
import { SPECIES } from '../js/species.js';

const json = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const habitat = json('habitat.json'), info = json('habitat-info.json'), ai = json('access-info.json'), zones = json('zones.json').zones;
const si = prepareSiteInfo(info, habitat), idx = accessFieldIndex(ai), aligned = alignedZones(ai, habitat);
const rowsFor = (zid) => aligned.has(zid) ? (i) => accessRow(ai.zones[zid].samples[i], idx, ai.zones[zid].strade) : null;
const sp = (id) => SPECIES.find((s) => s.id === id);
const pick = (zid, s, band, opts = {}) => chooseAccess({ hab: habitat.zones[zid], sp: s, band, rows: rowsFor(zid), excluded: excludedFn(si, zid), ...opts });

test('tempo a piedi DIN 33466 in metri equivalenti a 4 km/h: in piano e senza salita restano i metri', () => {
  assert.equal(walkEqM(1000), 1000);
  assert.equal(walkEqM(600, 0, 0), 600);
  // 1 km con 300 m di salita: 1 h di salita + 15 min di piano dimezzati → 1,125 h → 4500 m
  assert.equal(walkEqM(1000, 300, 0), 4500);
  assert.equal(walkEqM(2000, 120, 40), dinHours(2, 120, 40) * 4000);
  // senza percorso: la linea d'aria con il dislivello
  assert.equal(rowWalkEqM({ airM: 500, routeM: null, dh: 150 }), walkEqM(500, 150, 0));
  // la comodità ha la stessa forma: 2500 m equivalenti o più → f_piedi al minimo
  assert.equal(comfortScore({ driveMin: 20, walkM: walkEqM(1000, 300, 0), surface: 0 }).value, 0.3);
  assert.ok(comfortScore({ driveMin: 20, walkM: walkEqM(600), surface: 0 }).value > comfortScore({ driveMin: 20, walkM: walkEqM(600, 150, 0), surface: 0 }).value);
});

test('Laga: nessun punto proposto in zona A o B; alla fascia dei 1600 m il punto consentito è fuori fascia, con la sua quota', () => {
  for (const s of SPECIES) for (const band of [1100, 1350, 1600]) {
    const a = pick('laga', s, band);
    if (!a) continue;
    const r = infoRow(si, 'laga', a.i);
    assert.ok(!(r.area === 'pngsl' && ['A', 'B'].includes(r.zona)), `${s.id} ${band}: campione ${a.i} in zona ${r.zona}`);
    assert.equal(a.source, 'access-info');
  }
  const a = pick('laga', sp('edulis'), 1600);
  assert.ok(a.outOfBand, 'fuori fascia');
  assert.ok(a.e < 1450, `quota ${a.e}`);
  // senza esclusione il punto di prima era in zona B, dentro la fascia
  const before = chooseAccess({ hab: habitat.zones.laga, sp: sp('edulis'), band: 1600, rows: rowsFor('laga') });
  assert.equal(before.outOfBand, false);
  assert.equal(infoRow(si, 'laga', before.i).zona, 'B');
  // fuori fascia conta prima la quota: nessun campione consentito e servito più vicino alla fascia
  const allowed = habitat.zones.laga.samples.map((smp, i) => ({ e: smp[0], i, c: smp[1] })).filter(({ e, i, c }) => {
    const cat = c >= 0 ? habitat.zones.laga.sample_categories[c] : 'non bosco';
    return (sp('edulis').forest[cat] || 0) >= 0.6 && e >= 650 && e <= 1850 && !excludedFn(si, 'laga')(i) && rowsFor('laga')(i);
  });
  assert.ok(allowed.every(({ e }) => Math.abs(e - 1600) >= Math.abs(a.e - 1600) - 50));
});

test('con access-info il punto è sempre su una strada che non è una pista; i campioni fuori bosco non si propongono', () => {
  const usi = ai.legend.uso.valori;
  let n = 0;
  for (const z of zones) for (const s of SPECIES) for (const band of z.bands) {
    const a = pick(z.id, s, band);
    if (!a) continue;
    // zone aggiunte dopo l'estrazione (non nel file): ripiego su habitat.json
    if (!aligned.has(z.id)) { assert.equal(a.source, 'habitat', z.id); continue; }
    n++;
    const raw = ai.zones[z.id].samples[a.i];
    assert.ok(raw, `${z.id} ${s.id} ${band}: campione senza riga`);
    assert.ok(!['track', 'driveway'].includes(usi[raw[idx.uso]]));
    assert.ok(habitat.zones[z.id].samples[a.i][1] >= 0, 'campione di bosco');
    assert.ok(Number.isFinite(a.walkM) && a.walkM >= 0);
  }
  assert.ok(n > 500, `${n} combinazioni`);
  // mazza di tamburo: i prati (non bosco) non hanno un punto strada verificato
  const procera = pick('rascino', sp('procera'), 1150);
  if (procera) assert.ok(habitat.zones.rascino.samples[procera.i][1] >= 0);
});

test('senza access-info (file assente o non allineato) il punto torna quello di habitat.json, con l’esclusione se c’è', () => {
  const a = chooseAccess({ hab: habitat.zones.laga, sp: sp('edulis'), band: 1350, excluded: excludedFn(si, 'laga') });
  assert.equal(a.source, 'habitat');
  assert.equal(a.walkM, habitat.zones.laga.samples[a.i][4]);
  assert.notEqual(infoRow(si, 'laga', a.i).zona, 'B');
  const none = chooseAccess({ hab: habitat.zones.laga, sp: sp('edulis'), band: 1350 });
  assert.equal(none.source, 'habitat');
  assert.equal(chooseAccess({ hab: { samples: [[1000, 0]] }, sp: sp('edulis'), band: 1000 }), null);
});

test('frasi del punto d’accesso: percorso mappato, fuori sentiero (con i due numeri), a bordo strada, pista', () => {
  const base = { source: 'access-info', dh: 120, trackM: null };
  const route = walkPhrase({ ...base, airM: 400, netM: 560, offM: 40, routeM: 600, up: 120, down: 0 }, 'faggeta a 1350 m');
  assert.equal(walkKind({ ...base, airM: 400, netM: 560, offM: 40, routeM: 600 }), 'percorso');
  assert.equal(route.short, '600 m a piedi, +120 m');
  assert.equal(route.long, '600 m a piedi su sentieri e strade mappati, +120 m (400 m in linea d’aria), fino a faggeta a 1350 m.');
  // percorso oltre DETOUR_MAX volte la linea d'aria: fuori sentiero, ma con entrambi i numeri
  const detour = { ...base, airM: 300, netM: 2050, offM: 50, routeM: 2100, up: 190, down: 30 };
  assert.ok(detour.routeM > DETOUR_MAX * detour.airM);
  const p = walkPhrase(detour, 'faggeta a 1345 m');
  assert.equal(p.kind, 'fuori');
  assert.equal(p.short, 'ultimo tratto fuori sentiero, da verificare');
  assert.equal(p.long, 'Ultimo tratto fuori sentiero, da verificare, fino a faggeta a 1345 m: 300 m in linea d’aria, +120 m; il percorso mappato è di 2,1 km, +190 m, −30 m.');
  // nessun percorso sulla rete, o quasi tutto fuori rete
  assert.equal(walkKind({ ...base, airM: 200, netM: 0, offM: 200, routeM: 200 }), 'fuori');
  assert.match(walkPhrase({ ...base, airM: 200, netM: 0, offM: 200, routeM: 200 }).long, /nessun percorso mappato/);
  assert.equal(walkKind({ ...base, airM: 400, netM: 100, offM: 400, routeM: 500 }), 'fuori');
  assert.ok(400 > OFFNET_MAX_SHARE * 500);
  assert.equal(walkKind({ ...base, airM: 400, netM: null, offM: null, routeM: null }), 'fuori');
  // a bordo strada (soglia già in uso: 50 m)
  assert.equal(walkKind({ ...base, airM: ROADSIDE_M - 1, netM: 0, routeM: 0 }), 'strada');
  assert.equal(walkPhrase({ ...base, airM: 30, netM: 30, offM: 0, routeM: 30 }).long, 'Bosco adatto a bordo strada (30 m in linea d’aria).');
  // pista più vicina della strada: l'avvertenza con la legge
  assert.equal(trackNote({ ...base, trackM: 90 }), 'Il bosco è a 90 m da una pista forestale: transito in auto da verificare sul posto (L.R. Lazio 29/1987).');
  assert.equal(trackNote({ ...base, trackM: null }), '');
  // ripiego: niente frasi nuove (il punto potrebbe essere una pista)
  assert.equal(walkPhrase({ source: 'habitat', airM: 300 }), null);
  assert.equal(trackNote({ source: 'habitat', trackM: 10 }), '');
  // numeri all'italiana
  assert.equal(fmtDist(1647), '1,6 km');
  assert.equal(fmtDist(386), '390 m');
  assert.equal(fmtRise(-59), '−60 m');
  assert.equal(fmtRise(4), '0 m');
});

test('righe di access-info: campi per nome, null per i campioni fuori bosco', () => {
  assert.ok(idx);
  // tutte le zone di habitat.json, comprese le 21 del pilota Lazio
  assert.equal(aligned.size, Object.keys(habitat.zones).length);
  assert.deepEqual([...aligned].sort(), Object.keys(habitat.zones).sort());
  const laga = ai.zones.laga;
  assert.equal(accessRow(laga.samples[0], idx, laga.strade), null);
  const r = accessRow(laga.samples[1], idx, laga.strade);
  assert.deepEqual(Object.keys(r).sort(), ['airM', 'dh', 'down', 'netM', 'offM', 'rlat', 'rlon', 'road', 'roadEle', 'routeM', 'surface', 'trackM', 'up'].sort());
  assert.equal(r.routeM, r.netM + r.offM);
  assert.equal(accessFieldIndex({ fields: ['strada_m'] }), null);
});
