import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentLegalNotice,COOKIE_POLICY_HTML,COMMUNITY_PRIVACY_HTML,PROTOTYPE_NOTICE,LEGAL_NOTICE_VERSION,MODEL_NOTICE,legalNoticeVersion,compatibleLegalVersions,legalNoticeFingerprint} from '../js/legal-notice.js';
import {validateContent} from '../worker/content-validation.js';
const seed=JSON.parse(readFileSync(new URL('../data/legal.json',import.meta.url)));
test('snapshot legale precedente: avviso aggiornato senza sostituire le norme pubblicate',()=>{
 const old={version:3,verified_on:'2026-10-16',onboarding:{title:'Avvisi pubblicati',points:['Norme della redazione']},info_sections:[{id:'normativa',title:'Norme',html:'<p>Testo pubblicato</p>'}]},before=structuredClone(old),result=currentLegalNotice(old);
 assert.equal(result.version,LEGAL_NOTICE_VERSION);assert.equal(result.onboarding.prototype_notice,PROTOTYPE_NOTICE);assert.equal(result.onboarding.points[0],MODEL_NOTICE);assert.deepEqual(result.info_sections[0],old.info_sections[0]);assert.equal(result.info_sections.find(s=>s.id==='cookie').html,COOKIE_POLICY_HTML);assert.deepEqual(old,before);
});
test('seed e ripiego hanno la stessa informativa, sanificabile dal CMS',()=>{
 assert.equal(seed.onboarding.prototype_notice,PROTOTYPE_NOTICE);assert.equal(seed.info_sections.find(s=>s.id==='cookie').html,COOKIE_POLICY_HTML);
 const clean=validateContent('legal',seed).value;assert.equal(clean.onboarding.prototype_notice,PROTOTYPE_NOTICE);assert.match(clean.info_sections.find(s=>s.id==='cookie').html,/__Host-fungaroli_session/);
});
test('una revisione legale più recente rimane autorevole e non duplica la policy',()=>{
 const newer={...seed,version:seed.version+1,onboarding:{...seed.onboarding,prototype_notice:'Esperimento personale: revisione editoriale'},info_sections:[...seed.info_sections]};
 const result=currentLegalNotice(newer);assert.equal(result.version,seed.version+1);assert.equal(result.onboarding.prototype_notice,newer.onboarding.prototype_notice);assert.equal(result.info_sections.filter(s=>s.id==='cookie').length,1);
});

test('CGS separate da release, data e modifiche editoriali; nuova revisione richiede consenso',async()=>{
 const first=currentLegalNotice(seed),copy={...first,version:first.version+1,verified_on:'2026-10-21',onboarding:{...first.onboarding,subtitle:'Una formulazione più chiara'}};
 assert.equal(legalNoticeVersion(first),'cgs-1');assert.equal(legalNoticeVersion(copy),'cgs-1');assert.notEqual(await legalNoticeFingerprint(first),await legalNoticeFingerprint(copy));
 assert.deepEqual(compatibleLegalVersions(first),['62026-10-20']);assert.equal(legalNoticeVersion({...copy,acceptance_version:2}),'cgs-2');assert.deepEqual(compatibleLegalVersions({...copy,acceptance_version:2}),[]);
});
test('la revisione CGS deve essere positiva e non può diminuire',()=>{
 const previous={...seed,acceptance_version:2};for(const acceptance_version of [0,-1,1,1.5,null])assert.throws(()=>validateContent('legal',{...previous,version:previous.version+1,acceptance_version},previous));
 assert.equal(validateContent('legal',{...previous,version:previous.version+1,acceptance_version:3},previous).needsReview,true);
});

// Revisione del 22/10/2026 (audit privacy, decisioni di Matteo): l'informativa dice quello che il codice fa.
test('privacy: soglia reale, foto, provincia, base arrotondata, copia dei dati e diritti',()=>{
 const privacy=seed.info_sections.find(s=>s.id==='privacy').html,plain=privacy.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 assert.doesNotMatch(plain,/una sola osservazione/);
 assert.doesNotMatch(plain,/Google Fonts|Open-Meteo \(meteo delle zone\)/,'font locali e meteo dal Worker');
 assert.doesNotMatch(plain,/Esporta il vecchio diario|usa il vecchio diario/);
 for(const [what,re] of [
  ['soglia',/almeno 3 profili distinti, attivi da almeno 24 ore, e 2 giorni diversi/],
  ['provincia',/per provincia/],
  ['foto',/Fotografie:[^<]*metadati dello scatto[^.]*GPS/],
  ['metadati lato server',/Il server toglie comunque i metadati Exif e XMP/],
  ['base arrotondata',/arrotondate a circa 1 km/],
  ['copia del profilo',/«Scarica i miei dati»/],
  ['copia senza profilo',/«Scarica il taccuino»/],
  ['copia locale cancellata',/«Elimina profilo e dati» la toglie da questo dispositivo/],
  ['diritti',/accesso[^.]*portabilità[^.]*rettifica, la cancellazione e la limitazione/],
  ['opposizione',/opporti al trattamento/],
  ['trasferimenti',/fuori dall’Unione europea[^.]*Stati Uniti[\s\S]*Data Privacy Framework UE-USA[\s\S]*clausole contrattuali standard/],
  ['reclamo',/reclamo al Garante per la protezione dei dati personali/],
  ['vecchio diario dismesso',/codice condiviso \(Workers KV\) è stata dismessa/],
  ['titolare',/Il titolare del trattamento e gestore del servizio è Matteo Sgambato/],
 ])assert.match(plain,re,what);
 assert.match(privacy,/<a href="https:\/\/www\.garanteprivacy\.it\/" target="_blank" rel="noopener">/);
 assert.match(COMMUNITY_PRIVACY_HTML,/con un profilo attivo da almeno 24 ore/);
 assert.equal(seed.info_sections.find(s=>s.id==='community-sharing').html,COMMUNITY_PRIVACY_HTML);
 assert.doesNotMatch(COOKIE_POLICY_HTML,/Esporta ciò che vuoi conservare/);
});
test('revisione del testo: nuova versione editoriale, stessa revisione delle CGS e nessuna nuova conferma',()=>{
 const notice=currentLegalNotice(seed);
 assert.equal(seed.version,9);assert.equal(seed.acceptance_version,1);
 assert.match(seed.info_sections.find(s=>s.id==='privacy').html,/Studio dell’indice/);assert.doesNotMatch(seed.info_sections.find(s=>s.id==='privacy').html,/per studiare il modello/);
 assert.equal(legalNoticeVersion(notice),'cgs-1');
 assert.equal(notice.info_sections.find(s=>s.id==='privacy').html,seed.info_sections.find(s=>s.id==='privacy').html,'la sezione del repository passa invariata');
});
