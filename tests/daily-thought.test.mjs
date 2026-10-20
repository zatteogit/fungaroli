import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {romeDay, seasonOf, findThoughts, selectDailyThought, thoughtErrors} from '../js/daily-thought.js';
import {validateContent} from '../worker/content-validation.js';
const db = JSON.parse(readFileSync(new URL('../data/daily-thoughts.json', import.meta.url)));

test('archivio: testi unici, tag recuperabili e attribuzioni documentate', () => {
  assert.equal(db.schemaVersion, 1);
  assert.deepEqual(thoughtErrors(db), []);
  assert.deepEqual(validateContent('daily-thoughts', db).value, db);
  assert.equal(new Set(db.items.map(i => i.id)).size, db.items.length);
  assert.equal(new Set(db.items.map(i => i.text.toLowerCase())).size, db.items.length);
  assert.deepEqual(findThoughts(db), db.items);
  for (const item of db.items) {
    assert.ok(['citazione','aforisma','battuta','barzelletta'].includes(item.type));
    assert.equal(item.language, 'it');
    for (const key of ['tags','tones','contexts','moments','seasons']) {
      assert.ok(Array.isArray(item[key]) && item[key].length);
      assert.ok(item[key].every(v => typeof v === 'string' && v.trim()));
    }
    assert.ok(item.seasons.every(v => ['tutte','primavera','estate','autunno','inverno'].includes(v)));
    if (item.type === 'citazione') {
      assert.ok(item.source.title && item.source.verifiedOn);
      assert.equal(item.rights, 'pubblico-dominio');
    } else {
      assert.equal(item.author, 'Fronda');
      assert.equal(item.rights, 'originale-fronda');
    }
  }
});

test('giorno di Roma: mezzanotte e cambio ora, indipendenti dal fuso del dispositivo', () => {
  assert.equal(romeDay(new Date('2026-10-20T22:30:00Z')), '2026-10-21');
  assert.equal(romeDay(new Date('2026-12-20T22:30:00Z')), '2026-12-20');
  assert.equal(romeDay(new Date('2026-10-25T01:30:00Z')), '2026-10-25');
  assert.equal(seasonOf('2026-12-21'), 'inverno');
  assert.equal(seasonOf('2026-03-21'), 'primavera');
  assert.equal(seasonOf('2026-06-21'), 'estate');
  assert.equal(seasonOf('2026-10-20'), 'autunno');
});

test('rotazione stabile: niente ripetizioni nello stesso ciclo e niente testi fuori stagione', () => {
  const seen = new Set();
  for (let day = 1; day <= 27; day++) {
    const date = `2026-10-${String(day).padStart(2,'0')}`;
    const item = selectDailyThought(db, date);
    assert.deepEqual(item, selectDailyThought(db, date));
    assert.notEqual(item.id, 'citazione-pascoli-sole');
    seen.add(item.id);
  }
  assert.equal(seen.size, 27);
  assert.equal(selectDailyThought(db, '2026-02-31'), null);
  assert.equal(selectDailyThought(db, 'invalid'), null);
});

test('recupero per contesto, tono, tipo e tag; nessun ripiego incompatibile', () => {
  const items = findThoughts(db, {type:['battuta','barzelletta'], tones:['ironico'], tags:['cammino']});
  assert.ok(items.length > 0);
  assert.ok(items.every(i => i.tags.includes('cammino') && i.tones.includes('ironico')));
  assert.equal(selectDailyThought(db, '2026-10-20', 'avviso-rischio'), null);
  const bad = structuredClone(db.items.find(i => i.type === 'citazione'));
  bad.source.verified = false;
  assert.deepEqual(findThoughts({items:[bad, {...db.items[0],status:'draft'}, {...db.items[0],text:12}]}), []);
  assert.throws(() => validateContent('daily-thoughts', {schemaVersion:1,items:[bad]}), /verifica/);
  assert.throws(() => validateContent('daily-thoughts', {...db,items:[db.items[0],db.items[0]]}), /duplicato/);
});
