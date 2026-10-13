import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateContent} from '../worker/content-validation.js';
import {normalizeNotebookNote} from '../js/notebook-entry.js';
import {speciesAgreement,summary} from '../js/journal.js';
import {searchPlants} from '../js/plant-catalog.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/plants.json',import.meta.url)));
const note={id:'note1234',kind:'note',title:'Da ritrovare',category:'botanica',date:'2026-10-10',zoneId:null,note:'Fiori e frutti verdi insieme.',reference:{href:'#/pianta/corbezzolo',title:'Corbezzolo'},observation:{taxonId:'corbezzolo',phases:[{code:'open_flowers',status:'present'},{code:'unripe_fruits',status:'present'}],availability:'unknown',minutes:10,patchLabel:'Arbusto alla curva'}};
test('botanical publication requires parts, sources, safe media and valid comparison references',()=>{
  assert.equal(validateContent('plants',catalog).needsReview,true);
  assert.equal(validateContent('plants',catalog,catalog).needsReview,false);
  for(const change of [p=>p.sambuco.foodUse.parts='',p=>p.ebbio.foodUse.parts='frutti',p=>p.ortica.sources=[],p=>p.finocchietto.lookalikes=['inesistente'],p=>p.rovo.photos[0].licenseUrl='javascript:alert(1)']){
    const data=structuredClone(catalog);change(data.plants);assert.throws(()=>validateContent('plants',data,catalog));
  }
});
test('plant search includes scientific aliases and dangerous taxa, without invented growth parameters',()=>{
  const rows=Object.entries(catalog.plants).map(([id,p])=>({...p,id}));
  assert.equal(searchPlants(rows,'Foeniculum vulgare')[0].id,'finocchietto');
  assert.equal(searchPlants(rows,'cicuta')[0].foodUse.status,'mortale');
  assert.equal(searchPlants(rows,'more','Frutti')[0].id,'rovo');
  assert.ok(rows.every(p=>!('score' in p)&&!('model' in p)));
});
test('private botanical notes preserve simultaneous phases and strip forged forecasts, reports and consent',()=>{
  const saved=normalizeNotebookNote({...note,finds:{porcino:3},forecast:{mode:'prospective'},predicted:{porcino:100},observation:{...note.observation,identification:'expert',researchConsent:true}});
  assert.equal(saved.observation.phases.length,2);
  assert.equal(saved.observation.identification,'unreviewed');
  assert.equal(saved.observation.researchConsent,false);
  assert.equal(saved.forecast,undefined);assert.equal(saved.finds,undefined);
  assert.deepEqual(speciesAgreement({...saved,forecast:{mode:'prospective'}}),[]);
  assert.equal(summary([saved]).total,0);
});
test('notes reject invalid dates, injected links, duplicated phases and unrecognized taxa or places',()=>{
  for(const change of [n=>n.date='2026-02-30',n=>n.reference.href='https://evil.invalid',n=>n.reference.href='#/pianta/x" onclick="bad',n=>n.observation.phases.push(n.observation.phases[0]),n=>n.observation.minutes=-1,n=>n.date='2099-01-01']){
    const n=structuredClone(note);change(n);assert.throws(()=>normalizeNotebookNote(n));
  }
  assert.throws(()=>normalizeNotebookNote(note,{plantIds:new Set(['rovo'])}));
  assert.throws(()=>normalizeNotebookNote({...note,zoneId:'laga'},{zoneIds:new Set(['tancia'])}));
  const free=normalizeNotebookNote({...note,category:'appunto',observation:null,reference:null,note:'Idea per la prossima passeggiata'});
  assert.equal(free.zoneId,null);
});
