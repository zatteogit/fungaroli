// Informazioni sul bosco e aree protette (js/site-info.js, data/habitat-info.json): fuori dall'indice biologico.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { prepareSiteInfo, alignedZones, checkSums, excludedFn, warnedFn, bandReserve, RESERVE_BAND_TEXT, WARNING_TEXT, reserveLead,
  reserveAccessText, reserveLegendText, bandForestInfo, bandForestLines, zoneSiteInfo, zoneSiteLines, siteSources, inArea, infoRow } from '../js/site-info.js';
import { SPECIES } from '../js/species.js';
import { scoreSpecies } from '../js/model.js';
import { chooseAccess } from '../js/human.js';

const json = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const habitat = json('habitat.json'), info = json('habitat-info.json');
const si = prepareSiteInfo(info, habitat);
const sp = (id) => SPECIES.find((s) => s.id === id);

test('il file vale solo se descrive gli stessi campioni di habitat.json', () => {
  assert.ok(si, 'file allineato');
  // tutte le zone di habitat.json, comprese le 21 del pilota Lazio
  assert.equal(si.zones.size, Object.keys(habitat.zones).length);
  assert.deepEqual([...si.zones].sort(), Object.keys(habitat.zones).sort());
  // una zona che il file non descrive: nessuna esclusione, senza errori
  assert.equal(excludedFn(si, 'zona-inesistente')(0), null);
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

test('disturbi in parole: un solo evento senza «più recenti», la causa non si ripete, gli anni non diventano soglie', () => {
  const si = { zones: new Set(['z']), idx: { strutt: 0, copertura: 1, pendenza: 2, esposizione: 3, disturbo_anno: 4, disturbo_causa: 5, area: 6, zona: 7, lazio: 8 },
    info: { zones: { z: { samples: [] } } } };
  const hab = { sample_categories: ['Faggeta'], samples: [] };
  const lines = (rows) => {
    si.info.zones.z.samples = rows; hab.samples = rows.map(() => [1000, 0]);
    return bandForestLines(bandForestInfo({ hab, si, zid: 'z', sp: null, band: 1000 }), si).find((l) => l.k === 'disturbo')?.text;
  };
  const r = (anno, causa) => [1, 3, 20, 'N', anno, causa, null, null, 1];
  assert.equal(lines([r(1986, 3), r(0, null)]), 'Disturbo rilevato da satellite in 1 punto su 2: taglio nel 1986, da verificare sul posto.');
  assert.equal(lines([r(2018, 2), r(2016, 3), r(2010, 3)]),
    'Disturbo rilevato da satellite in 3 punti su 3, da verificare sul posto. Più recenti: incendio nel 2018, taglio nel 2016 e nel 2010.');
  assert.equal(lines([r(2017, 3), r(2017, 3), r(2015, 3), r(2012, 3), r(1990, 2)]),
    'Disturbo rilevato da satellite in 5 punti su 5, da verificare sul posto. Più recenti: taglio nel 2017 (2 punti), nel 2015 e nel 2012; l’altro nel 1990.');
  // anno null = fuori dalla maschera forestale del satellite: «non valutato», mai «nessun disturbo»
  assert.equal(lines([r(null, null), r(0, null)]), 'Nessun disturbo rilevato da satellite dal 1985 al 2024 nell’unico punto valutato.');
  assert.match(lines([r(2001, 3), r(1995, 2), r(1990, 3), r(1988, 3), r(1988, 3)]), /; gli altri nel 1988\.$/);
});

// Intento dell'uscita (PR #101): con piante e passeggiata non c'è un punto di raccolta proposto, ma le informazioni
// della zona (bosco, aree protette, punti fuori dal Lazio) valgono lo stesso e non dipendono dalla specie.
test('piante e passeggiata: riepilogo della zona senza specie; nessuna esclusione calcolata per le piante', () => {
  const lines = zoneSiteLines(zoneSiteInfo({ hab: habitat.zones.laga, si, zid: 'laga' }), si).map((l) => l.text).join(' ');
  assert.match(lines, /Parco nazionale Gran Sasso e Monti della Laga \(zone del piano: A \d+, B \d+/);
  assert.match(lines, /fuori dal Lazio/);
  // passeggiata: nessuna specie, il riepilogo della fascia riguarda tutto il bosco
  const f = bandForestInfo({ hab: habitat.zones.laga, si, zid: 'laga', sp: null, band: 1600 });
  assert.equal(f.scope, 'fascia');
  assert.match(bandForestLines(f, si)[0].text, /^Bosco della fascia dei 1600 m: \d+ punti campione\.$/);
  // piante: il punto di raccolta non si calcola (presenza non localizzabile), quindi neanche la riserva della fascia
  assert.equal(bandReserve({ hab: habitat.zones.laga, sp: { kind: 'plant', forest: { Faggeta: 1 } }, band: 1600, excluded: excludedFn(si, 'laga') }), null);
});

// Decisione del 21/10/2026 (ricerca sui testi primari, docs/legale.md §2.5): esclusi come la Laga i campioni in zona di
// riserva del Parco d'Abruzzo (A, B), dei Simbruini (R1, R2, R4) e dei Lucretili (A, A1); solo avviso nelle zone B e B1
// dei Lucretili e B1 e B2 di Veio. Un campione per regola, dai dati veri: indice nella zona di habitat.json.
const EXCLUDED = [['pnalm-settefrati-canneto', 224, 'pnalm', 'A'], ['pnalm-settefrati-canneto', 129, 'pnalm', 'B'],
  ['simbruini-filettino-fiumata', 0, 'simbruini', 'R1'], ['simbruini-filettino-fiumata', 4, 'simbruini', 'R2'], ['simbruini-filettino-fiumata', 2, 'simbruini', 'R4'],
  ['gennaro-roccagiovine', 75, 'lucretili', 'A'], ['gennaro-roccagiovine', 20, 'lucretili', 'A1']];
const WARNED = [['gennaro-roccagiovine', 2, 'lucretili', 'B'], ['gennaro-roccagiovine', 1, 'lucretili', 'B1'],
  ['veio-monte-musino', 0, 'veio', 'B1'], ['veio-monte-musino', 52, 'veio', 'B2']];

test('riserve dei parchi: esclusioni (PNALM A e B, Simbruini R1, R2 e R4, Lucretili A e A1) e avvisi (Lucretili B e B1, Veio B1 e B2)', () => {
  for (const [zid, i, area, zona] of EXCLUDED) {
    assert.deepEqual([infoRow(si, zid, i).area, infoRow(si, zid, i).zona], [area, zona], `${zid} ${i}`);
    const r = excludedFn(si, zid)(i);
    assert.ok(r && r.area === area && r.zone.includes(zona), `${area} ${zona} esclusa`);
    assert.equal(warnedFn(si, zid)(i), null, `${area} ${zona} senza avviso`);
  }
  for (const [zid, i, area, zona] of WARNED) {
    assert.deepEqual([infoRow(si, zid, i).area, infoRow(si, zid, i).zona], [area, zona], `${zid} ${i}`);
    assert.equal(excludedFn(si, zid)(i), null, `${area} ${zona} non esclusa`);
    const w = warnedFn(si, zid)(i);
    assert.ok(w && w.area === area && w.zone.includes(zona), `${area} ${zona} con avviso`);
  }
  // le altre zone degli stessi parchi: niente esclusione e niente avviso
  for (const [zid, zona] of [['gennaro-roccagiovine', 'C1'], ['veio-monte-musino', 'C1'], ['veio-monte-musino', 'D5'], ['livata-tufai', 'L5'], ['cervara-prataglia', 'L3']]) {
    const i = habitat.zones[zid].samples.findIndex((_, k) => infoRow(si, zid, k).zona === zona);
    assert.ok(i >= 0, `${zid} ${zona} nei dati`);
    assert.equal(excludedFn(si, zid)(i), null); assert.equal(warnedFn(si, zid)(i), null);
  }
  // forma delle regole: zone, effetto, motivo con il dubbio sui funghi come flora, fonti con titolo, certezza per zona, eccezioni
  const rules = [...info.esclusioni, ...info.avvisi];
  assert.deepEqual(info.esclusioni.map((e) => `${e.area}:${e.zone.join(',')}`), ['pngsl:A,B', 'pnalm:A,B', 'simbruini:R1,R2,R4', 'lucretili:A,A1']);
  assert.deepEqual(info.avvisi.map((e) => `${e.area}:${e.zone.join(',')}`), ['lucretili:B,B1', 'veio:B1,B2']);
  for (const r of rules) {
    assert.ok(info.aree[r.area], `area ${r.area} nei dati`);
    for (const z of r.zone) assert.ok(z in (info.aree[r.area].zonazione?.zone || {}), `zona ${r.area} ${z} nei dati`);
    assert.ok(r.effetto && r.motivo && r.eccezioni && r.fonti.length && r.fonti.every((f) => f.titolo && (f.url === null || /^https:\/\//.test(f.url))), r.area);
    if (r.area !== 'pngsl') {
      assert.deepEqual(Object.keys(r.certezza), r.zone, `${r.area}: certezza per zona`);
      assert.match(r.motivo, /funghi.*L\.R\. 29\/1997/, `${r.area}: dubbio sui funghi come flora`);
      assert.match(r.eccezioni, /usi civici/i);
    }
  }
});

test('riserve dei parchi: fascia, punto proposto e frasi; l’indice biologico non cambia', () => {
  // Simbruini, Filettino-Fiumata: tutti i 317 campioni sono in zona R1, R2 o R4. Tutto escluso, nessun punto proposto.
  const sim = 'simbruini-filettino-fiumata', hab = habitat.zones[sim];
  assert.ok(hab.samples.every((_, i) => excludedFn(si, sim)(i)));
  const r = bandReserve({ hab, sp: sp('edulis'), band: 1200, excluded: excludedFn(si, sim), warned: warnedFn(si, sim) });
  assert.ok(r.all && r.suitable > 0 && r.warned === 0 && r.point === null);
  assert.equal(reserveLead(r), RESERVE_BAND_TEXT);
  assert.equal(chooseAccess({ hab, sp: sp('edulis'), band: 1200, excluded: excludedFn(si, sim) }), null);
  // Parco d'Abruzzo: una parte esclusa, nessun avviso
  const pn = 'pnalm-settefrati-canneto';
  const p = bandReserve({ hab: habitat.zones[pn], sp: sp('edulis'), band: 1200, excluded: excludedFn(si, pn), warned: warnedFn(si, pn) });
  assert.ok(p.excluded > 0 && p.excluded < p.suitable && p.warned === 0 && p.rule.area === 'pnalm');
  assert.match(reserveAccessText(p), new RegExp(`^${p.excluded} punti su ${p.suitable} del bosco adatto della fascia sono in zona di riserva del Parco: il Piano esclude la raccolta`));
  // Veio: nessuna esclusione, avviso sui punti in zona B1 e B2, anche per il punto proposto
  const ve = 'veio-monte-musino', vh = habitat.zones[ve];
  const v = bandReserve({ hab: vh, sp: sp('mellea'), band: 300, excluded: excludedFn(si, ve), warned: warnedFn(si, ve), at: 0 });
  assert.ok(v.excluded === 0 && v.warned > 0 && !v.all && v.warning.area === 'veio' && v.point.area === 'veio');
  assert.equal(reserveLead(v), WARNING_TEXT);
  assert.equal(reserveLead(v, ' '), `${WARNING_TEXT} `);
  assert.match(WARNING_TEXT, /^Zona di riserva del Parco: verifica il regolamento dell’ente prima di raccogliere\.$/);
  assert.match(reserveAccessText(v), /del bosco adatto della fascia sono in zona di riserva del Parco dove la raccolta dipende dal regolamento dell’ente/);
  assert.doesNotMatch(reserveAccessText(v), /esclude/);
  const vc = vh.samples.findIndex((_, k) => infoRow(si, ve, k).zona === 'C1');
  assert.equal(bandReserve({ hab: vh, sp: sp('mellea'), band: 300, warned: warnedFn(si, ve), at: vc }).point, null);
  // l'avviso non toglie il punto: il punto proposto a Veio è lo stesso con o senza avvisi
  assert.deepEqual(chooseAccess({ hab: vh, sp: sp('mellea'), band: 300, excluded: excludedFn(si, ve) }), chooseAccess({ hab: vh, sp: sp('mellea'), band: 300 }));
  const vt = bandForestLines(bandForestInfo({ hab: vh, si, zid: ve, sp: sp('mellea'), band: 300 }), si);
  assert.ok(vt.some((l) => l.k === 'avviso' && /^In zona B1( e B2)?, di riserva del Parco, le regole sulla raccolta rinviano a un regolamento dell’ente: verificalo/.test(l.text)));
  assert.ok(!vt.some((l) => l.k === 'riserva'));
  // Lucretili: esclusione (A, A1) e avviso (B, B1) nella stessa fascia
  const lu = 'gennaro-roccagiovine';
  const l = bandReserve({ hab: habitat.zones[lu], sp: sp('edulis'), band: 1000, excluded: excludedFn(si, lu), warned: warnedFn(si, lu) });
  assert.ok(l.excluded > 0 && l.warned > 0 && l.excluded + l.warned <= l.suitable && !l.all);
  assert.equal(reserveAccessText(l), `${l.excluded} punti su ${l.suitable} del bosco adatto della fascia sono in zona di riserva del Parco: il Piano esclude la raccolta, quindi non si propongono. Altri ${l.warned} sono in zona di riserva del Parco dove la raccolta dipende dal regolamento dell’ente: verificalo prima di raccogliere.`);
  const lt = bandForestLines(bandForestInfo({ hab: habitat.zones[lu], si, zid: lu, sp: sp('edulis'), band: 1000 }), si);
  assert.ok(lt.some((x) => x.k === 'riserva' && /^In zona A1? (e A1? )?il Piano del Parco esclude la raccolta/.test(x.text)));
  assert.ok(lt.some((x) => x.k === 'avviso'));
  // legenda della mappa: tutte le regole, con i nomi delle aree; senza file la frase di prima sul Gran Sasso-Laga
  const leg = reserveLegendText(si);
  for (const t of ['Gran Sasso e Monti della Laga, zone A e B', 'Abruzzo, Lazio e Molise, zone A e B', 'Monti Simbruini, zone R1, R2 e R4', 'Monti Lucretili, zone A e A1', 'Monti Lucretili, zone B e B1', 'Veio, zone B1 e B2']) assert.ok(leg.includes(t), t);
  assert.match(reserveLegendText(null), /^Nel Gran Sasso-Laga il Piano del Parco esclude in zona A e B/);
  // senza file allineato: nessuna esclusione e nessun avviso
  assert.equal(warnedFn(null, ve)(0), null);
  assert.equal(reserveAccessText(null), '');
  // l'indice biologico non legge il file e non cambia: stesso punteggio, campioni non toccati dal calcolo della riserva
  assert.doesNotMatch(readFileSync(new URL('../js/model.js', import.meta.url), 'utf8'), /site-info|habitat-info/);
  const s = { dates: Array.from({ length: 40 }, (_, k) => `2026-09-${String(k % 30 + 1).padStart(2, '0')}`), p: Array(40).fill(5), tmean: Array(40).fill(13), tmin: Array(40).fill(8), tmax: Array(40).fill(18), soilm: Array(40).fill(0.3), soilt: Array(40).fill(12), todayIndex: 39 };
  for (const [zid, band, id] of [[sim, 1200, 'edulis'], [pn, 1200, 'edulis'], [lu, 1000, 'edulis'], [ve, 300, 'mellea']]) {
    const before = JSON.stringify(habitat.zones[zid]), score = scoreSpecies(sp(id), s, 35, habitat.zones[zid], band);
    bandReserve({ hab: habitat.zones[zid], sp: sp(id), band, excluded: excludedFn(si, zid), warned: warnedFn(si, zid) });
    assert.equal(JSON.stringify(habitat.zones[zid]), before);
    assert.deepEqual(scoreSpecies(sp(id), s, 35, habitat.zones[zid], band), score);
    assert.ok(Number.isFinite(score.score));
  }
});
