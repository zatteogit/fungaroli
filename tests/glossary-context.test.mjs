import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildGlossaryIndex,resolveGlossaryTerm,relatedGlossaryTerms,linkableGlossaryTerm,normalizeGlossaryScope,termContexts,CATEGORY_SCOPES,GLOSSARY_CONTEXTS,GLOSSARY_SCOPES} from '../js/glossary-context.js';
import {readdirSync} from 'node:fs';
const terms=JSON.parse(readFileSync(new URL('../data/glossary.json',import.meta.url))).terms,index=buildGlossaryIndex(terms);
test('homonyms resolve by context, never by glossary order or the previous page',()=>{
 for(const list of [terms,[...terms].reverse()]){const i=buildGlossaryIndex(list);for(const word of ['aculei','Aculeo']){
 assert.equal(resolveGlossaryTerm(i,word,'Funghi').id,'aculei');for(const c of ['Piante','Alberi'])assert.equal(resolveGlossaryTerm(i,word,c).id,'aculei-piante');assert.equal(resolveGlossaryTerm(i,word),null);
 }assert.equal(resolveGlossaryTerm(i,'substrati','Piante').id,'substrato-piante');assert.equal(resolveGlossaryTerm(i,'substrato','Funghi').id,'substrato');}
});
test('exclusive meanings do not leak into other domains; shared ecological words stay available',()=>{
 for(const w of ['gambo','cappello','anello','lamelle','cespitosa']){assert.equal(resolveGlossaryTerm(index,w,'Piante'),null);assert.ok(resolveGlossaryTerm(index,w,'Funghi'));assert.equal(resolveGlossaryTerm(index,w),null);}
 for(const c of ['Funghi','Piante','Alberi']){assert.equal(resolveGlossaryTerm(index,'habitat',c).id,'habitat');assert.equal(resolveGlossaryTerm(index,'latifoglie',c).id,'latifoglie');}
 assert.equal(resolveGlossaryTerm(index,'polloni','Alberi').id,'pollone');assert.equal(resolveGlossaryTerm(index,'ceduo','Alberi').id,'ceduo');
});

test('related words preserve the incoming meaning through a chain of panels',()=>{
 const habitat=terms.find(t=>t.id==='habitat');
 assert.ok(relatedGlossaryTerms(index,terms,habitat,'Piante').some(t=>t.id==='substrato-piante'));
 assert.ok(relatedGlossaryTerms(index,terms,habitat,'Funghi').some(t=>t.id==='substrato'));
});

test('older authored glossaries without context metadata cannot send botanical terms to fungal definitions',()=>{
 const legacy=buildGlossaryIndex(terms.filter(t=>!['aculei-piante','substrato-piante'].includes(t.id)).map(({contexts,...t})=>t));
 assert.equal(resolveGlossaryTerm(legacy,'aculei','Piante'),null);assert.equal(resolveGlossaryTerm(legacy,'aculei','Funghi').id,'aculei');assert.equal(resolveGlossaryTerm(legacy,'anello','Sentiero'),null);assert.equal(resolveGlossaryTerm(legacy,'aculei'),null);
});

// Collegamento automatico nel testo: zone dichiarate (data-glossary) e ambito delle voci.
const link=(word,scope)=>linkableGlossaryTerm(index,word,scope)?.id??null;
test('scope names are normalized; anything unknown is the general scope',()=>{
 assert.equal(normalizeGlossaryScope('funghi'),'Funghi');assert.equal(normalizeGlossaryScope(' Alberi '),'Alberi');
 for(const v of ['',undefined,'Generale','mesi'])assert.equal(normalizeGlossaryScope(v),'Generale');
});
test('the default compatibility table follows the category of the term',()=>{
 for(const t of terms.filter(t=>!Array.isArray(t.contexts)&&!['latifoglie','conifere','caducifoglia','sempreverde','micorriza','saprotrofo','micelio','ifa'].includes(t.id)))
  assert.deepEqual(termContexts(t),CATEGORY_SCOPES[t.category],t.id);
 assert.deepEqual(CATEGORY_SCOPES.Funghi,['Funghi']);assert.deepEqual(CATEGORY_SCOPES.Alberi,['Piante','Alberi']);assert.deepEqual(CATEGORY_SCOPES.Bosco,GLOSSARY_CONTEXTS);
});
test('«ago» links to needles only in plant and tree zones, never in fungi, trail, forest or general text',()=>{
 for(const s of ['Alberi','Piante'])assert.equal(link('ago',s),'aghi');
 for(const s of ['Funghi','Bosco','Sentiero','Generale',undefined])assert.equal(link('ago',s),null);
 // la forma piena segue la stessa regola dell'ambito
 assert.equal(link('aghi','Alberi'),'aghi');assert.equal(link('aghi','Funghi'),null);assert.equal(link('aghi','Generale'),null);
});
test('short aliases stay in the home scope of their category, even when the term is shared',()=>{
 assert.equal(link('poro','Funghi'),'pori');assert.equal(link('poro','Piante'),null);
 assert.equal(link('ife','Funghi'),'ifa');for(const s of ['Bosco','Alberi','Piante'])assert.equal(link('ife',s),null);
 assert.equal(link('micelio','Bosco'),'micelio');assert.equal(link('micelio','Alberi'),'micelio');
 for(const w of ['lobo','pomo'])for(const s of ['Funghi','Sentiero','Generale'])assert.equal(link(w,s),null);
 assert.equal(link('lobo','Piante'),'lobi');assert.equal(link('pomo','Alberi'),'pomo');
 assert.equal(link('GPX','Sentiero'),'gpx');assert.equal(link('GPX','Funghi'),null);assert.equal(link('GPX','Generale'),null);
});
test('fungal words never link in plant zones; shared ecological words link everywhere',()=>{
 for(const w of ['gambo','cappello','lamelle','volva','pori','sporata'])for(const s of ['Piante','Alberi','Generale'])assert.equal(link(w,s),null,`${w} ${s}`);
 assert.equal(link('aculei','Piante'),'aculei-piante');assert.equal(link('aculei','Funghi'),'aculei');assert.equal(link('aculei','Generale'),null);
 for(const s of GLOSSARY_SCOPES){assert.equal(link('habitat',s),'habitat');assert.equal(link('dislivello',s),'dislivello');}
});
test('every declared glossary zone in the app uses a known scope',()=>{
 const dir=new URL('../js/',import.meta.url);let zones=0;
 for(const f of readdirSync(dir).filter(f=>f.endsWith('.js')))for(const m of readFileSync(new URL(f,dir),'utf8').matchAll(/data-glossary="([^"$<]*)"/g)){
  zones++;assert.ok(m[1]===''||GLOSSARY_SCOPES.includes(m[1]),`${f}: ${m[1]}`);
 }
 assert.ok(zones>=15,`zone dichiarate: ${zones}`);
});
