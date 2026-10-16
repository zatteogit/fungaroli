// Informazioni sul bosco e aree protette (js/site-info.js, data/habitat-info.json): fuori dall'indice biologico.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareSiteInfo, alignedZones, checkSums, excludedFn, bandReserve, RESERVE_BAND_TEXT, bandForestInfo, bandForestLines,
  zoneSiteInfo, zoneSiteLines, siteSources, inArea, infoRow } from '../js/site-info.js';
import { SPECIES } from '../js/species.js';
import { scoreSpecies } from '../js/model.js';

const json = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const habitat = json('habitat.json'), info = json('habitat-info.json');
const si = prepareSiteInfo(info, habitat);
const sp = (id) => SPECIES.find((s) => s.id === id);

test('il file vale solo se descrive gli stessi campioni di habitat.json', () => {
  assert.ok(si, 'file allineato');
  assert.equal(si.zones.size, Object.keys(habitat.zones).length);
  // data di generazione diversa (habitat dallo snapshot del CMS): nessuna zona
  assert.equal(alignedZones(info, { ...habitat, generated: '2026-01-01' }).size, 0);
  assert.equal(prepareSiteInfo(info, { ...habitat, generated: undefined }), null);
  // un campione spostato in una zona: solo quella zona si ignora
  const moved = structuredClone(habitat);
  moved.zones.laga.samples[0][2] += 0.001;
  const ids = alignedZones(info, moved);
  assert.ok(!ids.has('laga') && ids.has('vallonina'));
  assert.deepEqual(checkSums(habitat.zones.laga.samples), info.zones.laga.check);
  // senza file o con campi mancanti: niente, senza errori
  assert.equal(prepareSiteInfo(null, habitat), null);
  assert.equal(prepareSiteInfo({ ...info, fields: info.fields.slice(1) }, habitat), null);
  assert.equal(excludedFn(null, 'laga')(0), null);
  assert.equal(bandForestInfo({ hab: habitat.zones.laga, si: null, zid: 'laga', sp: sp('edulis'), band: 1600 }), null);
});

test('Laga: alla fascia dei 1600 m tutto il bosco adatto è in zona B ed è escluso; a 1100 m solo una parte', () => {
  const excluded = excludedFn(si, 'laga');
  for (const id of ['edulis', 'pinophilus', 'mellea']) {
    const r = bandReserve({ hab: habitat.zones.laga, sp: sp(id), band: 1600, excluded });
    assert.ok(r.suitable > 0, id);
    assert.equal(r.all, true, id);
    assert.deepEqual(r.rule.zone, ['A', 'B']);
  }
  const low = bandReserve({ hab: habitat.zones.laga, sp: sp('edulis'), band: 1100, excluded });
  assert.ok(low.excluded > 0 && low.excluded < low.suitable && !low.all);
  // la regola del file: solo zone A e B del Gran Sasso-Laga; Duchessa (C1) e Navegna (senza zone) non escludono
  for (const zid of ['malito', 'cicolano', 'vallonina']) {
    const ex = excludedFn(si, zid);
    assert.ok(habitat.zones[zid].samples.every((_, i) => ex(i) === null), zid);
  }
  assert.match(RESERVE_BAND_TEXT, /^In questa fascia il bosco adatto è in zona di riserva del Parco: la raccolta è esclusa\.$/);
  // l'esclusione non tocca l'indice: lo stesso calcolo con o senza file
  const s = { dates: Array.from({ length: 40 }, (_, k) => `2026-09-${String(k % 30 + 1).padStart(2, '0')}`), p: Array(40).fill(5), tmean: Array(40).fill(13), tmin: Array(40).fill(8), tmax: Array(40).fill(18), soilm: Array(40).fill(0.3), soilt: Array(40).fill(12), todayIndex: 39 };
  assert.ok(Number.isFinite(scoreSpecies(sp('edulis'), s, 35, habitat.zones.laga, 1600).score));
});

test('informazioni sul bosco della fascia: struttura, esposizione, disturbi e aree protette, come frasi', () => {
  const f = bandForestInfo({ hab: habitat.zones.laga, si, zid: 'laga', sp: sp('edulis'), band: 1600 });
  assert.equal(f.scope, 'adatto');
  assert.equal(f.areas.length, 1);
  assert.deepEqual(f.areas[0].zones.map((z) => [z.zona, z.excluded]), [['B', true]]);
  const text = bandForestLines(f, si).map((l) => l.text).join('\n');
  assert.match(text, /Struttura: fustaia \d+%/);
  assert.match(text, /Nella fascia dei 1600 m il bosco adatto è per il \d+% su versanti esposti a (nord|nord-est|est|sud-est|sud|sud-ovest|ovest|nord-ovest)/);
  assert.match(text, /Tutti i \d+ punti sono nel Parco nazionale Gran Sasso e Monti della Laga: zona B \(riserva generale orientata\)/);
  assert.match(text, /In zona B il Piano del Parco esclude la raccolta, salvi usi civici/);
  assert.doesNotMatch(text, /probabil|trover|garant/i);
  // disturbi: anno e causa, «da verificare sul posto», nessuna soglia d'anni
  const low = bandForestLines(bandForestInfo({ hab: habitat.zones.laga, si, zid: 'laga', sp: sp('edulis'), band: 1100 }), si).map((l) => l.text).join('\n');
  assert.match(low, /Disturbo rilevato da satellite in \d+ punti su \d+, da verificare sul posto\. Più recenti: taglio nel 20\d\d/);
  assert.match(low, /non valutati: il satellite non li classifica come bosco/);
  // grammatica delle aree: «nella Riserva», «nel Parco»
  assert.equal(inArea(si, 'navegna-cervia'), 'nella Riserva naturale Monte Navegna e Monte Cervia');
  assert.equal(inArea(si, 'pngsl'), 'nel Parco nazionale Gran Sasso e Monti della Laga');
  const cic = bandForestLines(bandForestInfo({ hab: habitat.zones.cicolano, si, zid: 'cicolano', sp: sp('edulis'), band: 1000 }), si).map((l) => l.text).join('\n');
  assert.match(cic, /nella Riserva naturale Monte Navegna e Monte Cervia \(zone del piano non disponibili\)/);
  assert.doesNotMatch(cic, /esclude la raccolta/);
});

test('zona intera e fonti: i punti fuori dal Lazio sono dichiarati, le fonti hanno un link', () => {
  const lines = zoneSiteLines(zoneSiteInfo({ hab: habitat.zones.laga, si, zid: 'laga' }), si).map((l) => l.text);
  assert.ok(lines.some((t) => /punti campione su 313 sono nel Parco nazionale Gran Sasso e Monti della Laga \(zone del piano: A \d+, B \d+/.test(t)));
  assert.ok(lines.some((t) => /20 punti campione sono fuori dal Lazio/.test(t)));
  const src = siteSources(si);
  assert.deepEqual(src.map((s) => s.id), ['carta-forestale', 'tinitaly', 'efda', 'aree-protette']);
  assert.ok(src.every((s) => /^https:\/\//.test(s.url)));
  assert.match(src.find((s) => s.id === 'aree-protette').label, /fa fede la cartografia dell’ente/);
  // le righe del file hanno i campi attesi
  const r = infoRow(si, 'laga', 1);
  assert.deepEqual(Object.keys(r), ['strutt', 'copertura', 'pendenza', 'esposizione', 'anno', 'causa', 'area', 'zona', 'lazio']);
});
