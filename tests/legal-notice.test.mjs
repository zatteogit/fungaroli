import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentLegalNotice,COOKIE_POLICY_HTML,PROTOTYPE_NOTICE} from '../js/legal-notice.js';
import {validateContent} from '../worker/content-validation.js';
const seed=JSON.parse(readFileSync(new URL('../data/legal.json',import.meta.url)));
test('snapshot legale precedente: avviso aggiornato senza sostituire le norme pubblicate',()=>{
 const old={version:3,verified_on:'2026-10-16',onboarding:{title:'Avvisi pubblicati',points:['Norme della redazione']},info_sections:[{id:'normativa',title:'Norme',html:'<p>Testo pubblicato</p>'}]},before=structuredClone(old),result=currentLegalNotice(old);
 assert.equal(result.version,4);assert.equal(result.onboarding.prototype_notice,PROTOTYPE_NOTICE);assert.deepEqual(result.onboarding.points,old.onboarding.points);assert.deepEqual(result.info_sections[0],old.info_sections[0]);assert.equal(result.info_sections.find(s=>s.id==='cookie').html,COOKIE_POLICY_HTML);assert.deepEqual(old,before);
});
test('seed e ripiego hanno la stessa informativa, sanificabile dal CMS',()=>{
 assert.equal(seed.onboarding.prototype_notice,PROTOTYPE_NOTICE);assert.equal(seed.info_sections.find(s=>s.id==='cookie').html,COOKIE_POLICY_HTML);
 const clean=validateContent('legal',seed).value;assert.equal(clean.onboarding.prototype_notice,PROTOTYPE_NOTICE);assert.match(clean.info_sections.find(s=>s.id==='cookie').html,/__Host-fungaroli_session/);
});
test('una revisione legale più recente rimane autorevole e non duplica la policy',()=>{
 const newer={...seed,version:6,onboarding:{...seed.onboarding,prototype_notice:'Esperimento personale: revisione editoriale'},info_sections:[...seed.info_sections]};
 const result=currentLegalNotice(newer);assert.equal(result.version,6);assert.equal(result.onboarding.prototype_notice,newer.onboarding.prototype_notice);assert.equal(result.info_sections.filter(s=>s.id==='cookie').length,1);
});
