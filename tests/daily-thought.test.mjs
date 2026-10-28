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
  const count=findThoughts(db,{contexts:['home'],seasons:[seasonOf('2026-10-01')]}).length;
  for (let day = 1; day <= count; day++) {
    const date = `2026-10-${String(day).padStart(2,'0')}`;
    const item = selectDailyThought(db, date);
    assert.deepEqual(item, selectDailyThought(db, date));
    assert.ok(item.seasons.includes('tutte') || item.seasons.includes(seasonOf(date)));
    seen.add(item.id);
  }
  assert.equal(seen.size, count);
  assert.equal(selectDailyThought(db, '2026-02-31'), null);
  assert.equal(selectDailyThought(db, 'invalid'), null);
});

test('recupero per contesto, tono, tipo e tag; nessun ripiego incompatibile', () => {
  const items = findThoughts(db, {type:['citazione'], tones:['poetico'], tags:['montagna']});
  assert.ok(items.length > 0);
  assert.ok(items.every(i => i.tags.includes('montagna') && i.tones.includes('poetico')));
  assert.equal(selectDailyThought(db, '2026-10-20', 'avviso-rischio'), null);
  const bad = structuredClone(db.items.find(i => i.type === 'citazione'));
  bad.source.verified = false;
  assert.deepEqual(findThoughts({items:[bad, {...db.items[0],status:'draft'}, {...db.items[0],text:12}]}), []);
  assert.throws(() => validateContent('daily-thoughts', {schemaVersion:1,items:[bad]}), /verifica/);
  assert.throws(() => validateContent('daily-thoughts', {...db,items:[db.items[0],db.items[0]]}), /duplicato/);
});

// Il nuovo catalogo sostituisce tutti gli originali senza fonte: nessuna attribuzione generica Fronda.
test('solo citazioni documentate; i testi tradotti conservano originale e credito',()=>{
 assert.ok(db.items.length>=10);
 for(const item of db.items){
  assert.equal(item.type,'citazione');assert.notEqual(item.author,'Fronda');
  assert.equal(item.source.verified,true);assert.equal(item.source.verifiedOn,'2026-10-25');
  if(item.source.translationCredit)assert.ok(item.source.originalText);
 }
 for(const topic of ['funghi','piante','montagna'])assert.ok(db.items.some(i=>i.tags.includes(topic)));
});
