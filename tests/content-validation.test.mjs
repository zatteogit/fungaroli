import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateContent} from '../worker/content-validation.js';
const read=id=>JSON.parse(readFileSync(new URL(`../data/${id}.json`,import.meta.url)));
test('article HTML cannot execute scripts, handlers or javascript links',()=>{
  const data=read('guides');
  data.guides[0].body='<h2>Un titolo</h2><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">Link</a><img src=x onerror="alert(1)">';
  const clean=validateContent('guides',data,read('guides')).value;
  assert.match(clean.guides[0].body,/<h2>Un titolo<\/h2>/);
  assert.doesNotMatch(clean.guides[0].body,/script|onclick|onerror|javascript/);
  data.guides[0].title='<img src=x onerror="alert(1)">';
  assert.throws(()=>validateContent('guides',data,read('guides')),/contiene HTML/);
});
test('a new edible taxon requires names, classification, sources and scientific review',()=>{
  const data=read('edible-catalog'),old=structuredClone(data);
  data.species.push({id:'test-species',name:'Nome di prova',latin:'Taxon test',toxicity:'commestibile',months:null,sources:[]});
  assert.throws(()=>validateContent('edible-catalog',data,old),/fonti/);
  data.species.at(-1).sources=['https://example.org/source'];
  assert.equal(validateContent('edible-catalog',data,old).needsReview,true);
  data.species.at(-1).toxicity='mortale';
  assert.throws(()=>validateContent('edible-catalog',data,old),/solo commestibili/);
});
test('mapped trail geometry is protected while editorial annotations remain editable',()=>{
  const old=read('trails'),data=structuredClone(old),id=Object.keys(data.zones)[0];
  data.zones[id].trails[0].editorialNote='Controlla la segnaletica sul posto.';
  assert.equal(validateContent('trails',data,old).value.zones[id].trails[0].editorialNote,data.zones[id].trails[0].editorialNote);
  data.zones[id].trails[0].lines=[];
  assert.throws(()=>validateContent('trails',data,old),/fonte del tracciato/);
});
test('legal updates require a new version and unsafe media URLs are rejected',()=>{
  const old=read('legal'),data=structuredClone(old);data.home_strip='Una nuova regola';
  assert.throws(()=>validateContent('legal',data,old),/versione/);
  data.version++;assert.equal(validateContent('legal',data,old).needsReview,true);
  const media=read('media');media.species.edulis.file='assets/x" onerror="alert(1)';
  assert.throws(()=>validateContent('media',media),/URL/);
});
test('glossary publication requires sources, unambiguous keywords and a complete difficulty legend',()=>{
  const original=read('glossary');
  assert.equal(validateContent('glossary',original).needsReview,false);
  const changed=structuredClone(original);changed.terms[0].definition+=' Una precisazione.';
  assert.equal(validateContent('glossary',changed,original).needsReview,true);
  changed.terms[0].sources=[];
  assert.throws(()=>validateContent('glossary',changed,original),/fonti/);
  const collision=structuredClone(original);collision.terms[0].aliases.push('volva');
  assert.throws(()=>validateContent('glossary',collision,original),/più voci/);
  const broken=structuredClone(original);broken.terms[0].related.push('voce-inesistente');
  assert.throws(()=>validateContent('glossary',broken,original),/collegate/);
  const incomplete=structuredClone(original);incomplete.terms=incomplete.terms.filter(t=>t.id!=='difficolta-eea');incomplete.terms.forEach(t=>t.related=t.related.filter(id=>id!=='difficolta-eea'));
  assert.throws(()=>validateContent('glossary',incomplete,original),/legenda CAI/);
  const unsafe=structuredClone(original);unsafe.terms[0].aliases.push('<img src=x onerror=alert(1)>');
  assert.throws(()=>validateContent('glossary',unsafe,original),/contiene HTML/);
});
test('glossary images require explanatory text, provenance and a reusable licence',()=>{
  const original=read('media-glossary');assert.equal(validateContent('media-glossary',original).needsReview,false);
  for(const key of ['alt','caption','author','license','page','licenseUrl']) {
    const changed=structuredClone(original);changed.terms.pliche.illustrations[0][key]='';
    assert.throws(()=>validateContent('media-glossary',changed,original),/Completa|origine|licenza/);
  }
  const unsafe=structuredClone(original);unsafe.terms.pliche.illustrations[0].file='assets/../worker/index.js';
  assert.throws(()=>validateContent('media-glossary',unsafe,original),/immagine/);
  const generated=structuredClone(original);generated.terms.pliche.illustrations[0].generated=true;
  assert.throws(()=>validateContent('media-glossary',generated,original),/schemi/);
  generated.terms.pliche.illustrations[0].kind='diagram';assert.equal(validateContent('media-glossary',generated,original).needsReview,true);
});
test('botanical model updates require scientific review and preserve unknown fields without inventing calendars',()=>{
 const data=read('botanical-models');assert.equal(validateContent('botanical-models',data).needsReview,true);assert.equal(validateContent('botanical-models',data,data).needsReview,false);
 assert.equal(data.models['plant-fragolina'].phaseMonths,null);
 for(const [key,value] of [['phaseMonths',[0,13]],['elevationRange',[1800,0]],['observationDays',0],['landscapeAffinity',{Lecceta:2}],['calendarOrigin','validated_probability']]){
  const altered=structuredClone(data);altered.models['plant-corbezzolo'][key]=value;assert.throws(()=>validateContent('botanical-models',altered,data));
 }
 const changed=structuredClone(data);changed.models['plant-corbezzolo'].phaseMonths=[10,11];assert.equal(validateContent('botanical-models',changed,data).needsReview,true);
});
test('glossary homonyms require disjoint explicit contexts, including normalized aliases',()=>{
 const original=read('glossary');assert.equal(validateContent('glossary',original).needsReview,false);
 const altered=structuredClone(original);altered.terms.find(t=>t.id==='aculei-piante').contexts.push('Funghi');assert.throws(()=>validateContent('glossary',altered,original),/stesso contesto/);
 const invalid=structuredClone(original);invalid.terms[0].contexts=['bad-context'];assert.throws(()=>validateContent('glossary',invalid,original),/Contesti/);
 const unscoped=structuredClone(original);delete unscoped.terms.find(t=>t.id==='aculei-piante').contexts;unscoped.terms.find(t=>t.id==='aculei-piante').category='Bosco';assert.throws(()=>validateContent('glossary',unscoped,original),/stesso contesto/);
});
