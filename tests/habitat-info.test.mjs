import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// data/habitat-info.json: informazioni sul bosco per ogni campione di data/habitat.json (tools/build_habitat_info.py).
const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const info = read('habitat-info.json');
const habitat = read('habitat.json');
const zones = read('zones.json').zones;

const FIELDS = ['strutt', 'copertura', 'pendenza', 'esposizione', 'disturbo_anno', 'disturbo_causa', 'area', 'zona', 'lazio'];
const F = Object.fromEntries(FIELDS.map((f, i) => [f, i]));
const SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Tutte le zone di habitat.json, comprese le 21 del pilota Lazio (estratte il 21/10/2026).
const covered = Object.entries(habitat.zones);
test('stesse zone e stesso numero di campioni di habitat.json, nello stesso ordine', () => {
  assert.deepEqual(Object.keys(info.zones), covered.map(([id]) => id));
  assert.equal(info.habitat.generated, habitat.generated, 'habitat.json è stato rigenerato: rilancia tools/build_habitat_info.py');
  for (const [id, z] of covered) {
    const zi = info.zones[id];
    assert.equal(zi.samples.length, z.samples.length, id);
    assert.equal(zi.n, z.samples.length, id);
    // somma delle coordinate (intere, in 1e-5 gradi): cambia se cambiano i campioni o il loro ordine
    const sum = (k) => z.samples.reduce((s, x) => s + Math.round(x[k] * 1e5), 0);
    assert.deepEqual(zi.check, [sum(2), sum(3)], `${id}: campioni diversi da habitat.json`);
  }
});

test('legenda e fonti presenti: ogni campo ha una fonte con licenza e data di estrazione', () => {
  assert.match(info.generated, DATE);
  assert.deepEqual(info.fields, FIELDS);
  assert.deepEqual(Object.keys(info.legend), FIELDS);
  const ids = new Set(info.sources.map((s) => s.id));
  for (const s of info.sources) {
    for (const k of ['id', 'nome', 'editore', 'url', 'licenza', 'estratto', 'attribuzione', 'limiti']) assert.ok(s[k], `${s.id}: manca ${k}`);
    assert.match(s.estratto, DATE, s.id);
  }
  for (const f of FIELDS) assert.ok(ids.has(info.legend[f].fonte), `${f}: fonte ${info.legend[f].fonte}`);
  // la soglia del piano non ha fonte: deve essere dichiarata come euristica
  assert.match(info.legend.esposizione.euristica, /scelta/);
});

test('valori ammessi per ogni campo', () => {
  const bad = [];
  for (const [id, z] of Object.entries(info.zones)) {
    let fuori = 0;
    z.samples.forEach((r, i) => {
      const at = `${id}#${i}`;
      if (r.length !== FIELDS.length) return bad.push(`${at}: ${r.length} valori`);
      const [strutt, cop, pend, esp, anno, causa, area, zona, lazio] = r;
      if (![1, 2, 3, null].includes(strutt)) bad.push(`${at} strutt ${strutt}`);
      if (![1, 2, 3, 4, null].includes(cop)) bad.push(`${at} copertura ${cop}`);
      if (!(Number.isInteger(pend) && pend >= 0 && pend <= 90)) bad.push(`${at} pendenza ${pend}`);
      if (!(esp === null || SECTORS.includes(esp))) bad.push(`${at} esposizione ${esp}`);
      // esposizione assente solo in piano, e sempre in piano
      if ((esp === null) !== (pend < 5)) bad.push(`${at} esposizione ${esp} con pendenza ${pend}`);
      if (!(anno === null || anno === 0 || (Number.isInteger(anno) && anno >= 1985 && anno <= 2024))) bad.push(`${at} anno ${anno}`);
      if (![1, 2, 3, null].includes(causa)) bad.push(`${at} causa ${causa}`);
      if (causa !== null && !anno) bad.push(`${at} causa senza disturbo`);
      if (!(area === null || info.aree[area])) bad.push(`${at} area ${area}`);
      if (zona !== null) {
        const zz = info.aree[area]?.zonazione?.zone;
        if (!zz || !(zona in zz)) bad.push(`${at} zona ${zona} non descritta per ${area}`);
      }
      if (![0, 1].includes(lazio)) bad.push(`${at} lazio ${lazio}`);
      if (lazio === 0) {
        fuori++;
        if (strutt !== null || cop !== null || area !== null || zona !== null) bad.push(`${at}: dati regionali fuori dal Lazio`);
      }
    });
    assert.equal(z.fuori_lazio, fuori, id);
  }
  assert.deepEqual(bad.slice(0, 20), []);
});

test('i punti fuori bosco non hanno struttura né copertura', () => {
  let bosco = 0;
  let conStrutt = 0;
  for (const [id, z] of covered) {
    z.samples.forEach((s, i) => {
      const r = info.zones[id].samples[i];
      if (s[1] < 0) {
        assert.equal(r[F.strutt], null, `${id}#${i}`);
        assert.equal(r[F.copertura], null, `${id}#${i}`);
      } else {
        bosco++;
        if (r[F.strutt] !== null) conStrutt++;
      }
    });
  }
  // gli arbusteti non hanno struttura; il resto del bosco sì
  assert.ok(conStrutt / bosco > 0.9, `struttura su ${conStrutt} punti di bosco su ${bosco}`);
});

test('fuori dal Lazio: la Laga e Rascino hanno punti non coperti dai dati regionali', () => {
  assert.ok(info.zones.laga.fuori_lazio > 0);
  assert.ok(info.zones.rascino.fuori_lazio > 0);
  for (const r of info.zones.laga.samples) if (r[F.lazio] === 0) assert.equal(r[F.area], null);
  // la Carta Forestale si ferma al confine: in habitat.json i punti fuori dal Lazio sono «non bosco»
  for (const [id, z] of covered) {
    z.samples.forEach((s, i) => { if (s[1] >= 0) assert.equal(info.zones[id].samples[i][F.lazio], 1, `${id}#${i}`); });
  }
});

test('allineamento: alla Laga, fascia dei 1.600 m, il bosco è (quasi) tutto in zona B del Parco', () => {
  // dato verificato da due audit indipendenti sul WFS del Geoportale (35 punti di bosco su 35)
  const laga = zones.find((z) => z.id === 'laga');
  assert.ok(laga.bands.includes(1600));
  const h = habitat.zones.laga.samples;
  const band = h.map((s, i) => [s, info.zones.laga.samples[i]]).filter(([s]) => s[1] >= 0 && Math.abs(s[0] - 1600) <= 150);
  const inB = band.filter(([, r]) => r[F.area] === 'pngsl' && r[F.zona] === 'B').length;
  assert.ok(band.length >= 30, `${band.length} punti di bosco nella fascia`);
  assert.ok(inB / band.length >= 0.95, `${inB} su ${band.length} in zona B`);
  // nessun punto di bosco della Laga è in zona A (sono tutti oltre i 2.000 m, fuori bosco)
  h.forEach((s, i) => {
    if (s[1] >= 0) assert.notEqual(info.zones.laga.samples[i][F.zona], 'A');
  });
});

test('le zone a e b del Gran Sasso-Laga sono escluse dai consigli, con fonte', () => {
  const ex = info.esclusioni.find((e) => e.area === 'pngsl');
  assert.deepEqual(ex.zone, ['A', 'B']);
  assert.ok(ex.fonti.length && ex.fonti.every((f) => f.url.startsWith('https://')));
  assert.ok(info.aree.pngsl.zonazione.zone.A && info.aree.pngsl.zonazione.zone.B);
});

test('pilota Lazio: aree protette e zone dei piani dove la Regione le pubblica; altrove «non disponibili», mai zero', () => {
  // zonazioni del Geoportale aggiunte il 21/10/2026: PNALM (versante laziale), Veio, Monti Simbruini; Lucretili c'era già
  for (const id of ['pnalm', 'veio', 'simbruini', 'lucretili']) assert.ok(info.aree[id]?.zonazione?.strato, id);
  // aree senza zonazione digitalizzata: zona sempre null (l'app scrive «zone del piano non disponibili»)
  for (const id of ['castelli-romani', 'circeo', 'monti-aurunci', 'monti-ausoni-e-lago-di-fondi', 'bracciano-martignano']) {
    assert.ok(info.aree[id], id);
    assert.equal(info.aree[id].zonazione, null, id);
    for (const z of Object.values(info.zones)) for (const r of z.samples) if (r[F.area] === id) assert.equal(r[F.zona], null, id);
  }
  // le zone del pilota dentro un parco hanno i loro punti nell'area giusta
  const share = (zid, area) => info.zones[zid].samples.filter((r, i) => habitat.zones[zid].samples[i][1] >= 0 && r[F.area] === area).length;
  assert.ok(share('circeo-cerasella-verdesca', 'circeo') > 200);
  assert.ok(share('faete-rocca-papa', 'castelli-romani') > 150);
  assert.ok(share('simbruini-filettino-fiumata', 'simbruini') > 300);
  assert.ok(share('pnalm-settefrati-canneto', 'pnalm') > 100);
  // nessuna esclusione nuova senza una fonte verificata: dal 21/10/2026 (decisione dopo la lettura dei testi primari)
  // anche PNALM, Simbruini e Lucretili; avvisi senza esclusione per Lucretili e Veio. Ogni regola ha fonti e certezza.
  assert.deepEqual(info.esclusioni.map((e) => e.area), ['pngsl', 'pnalm', 'simbruini', 'lucretili']);
  assert.deepEqual(info.avvisi.map((e) => e.area), ['lucretili', 'veio']);
  for (const r of [...info.esclusioni.slice(1), ...info.avvisi]) assert.ok(r.fonti.length && r.fonti.every((f) => f.titolo) && r.certezza, r.area);
});
