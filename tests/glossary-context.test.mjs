import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildGlossaryIndex,resolveGlossaryTerm,relatedGlossaryTerms} from '../js/glossary-context.js';
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
