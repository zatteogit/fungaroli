import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNotebookNote} from '../js/notebook-entry.js';
import {sharedObservation,normalizeFieldRecord,effortClassFor,FIELD_NOTE_V2} from '../js/community-observation.js';
const record={presence:'observed',amount:2,minutes:30,people:2,elevation:950,habitat:'broadleaf'};
const note={id:'field-note-01',kind:'note',title:'Il mio punto segreto',category:'fungo',date:'2026-10-10',zoneId:'rascino',note:'Coordinate e dettagli privati',reference:{href:'#/fungo/agaricus-campestris',title:'Prataiolo'},record};
test('field observations retain unknown and searched-absent as different states',()=>{
 assert.equal(normalizeFieldRecord({...record,presence:'unknown',amount:null}).amount,null);
 assert.equal(normalizeFieldRecord({...record,presence:'searched_absent',amount:null}).amount,0);
 for(const input of [{...record,amount:0},{...record,minutes:0},{...record,people:101},{...record,elevation:5000},{...record,habitat:'inventato'},{...record,presence:'unknown'}])assert.throws(()=>normalizeFieldRecord(input));
});
test('public snapshot contains structured observations, without private text or fabricated validation',()=>{
 const normalized=normalizeNotebookNote({...note,record:{...record,identification:'expert',researchConsent:true}});
 assert.equal(normalized.record.identification,'unreviewed');assert.equal(normalized.record.researchConsent,undefined);
 const publicData=sharedObservation(normalized,{now:Date.parse('2026-10-17T12:00:00Z'),references:new Set([note.reference.href]),zoneIds:new Set(['rascino'])});
 assert.equal(publicData.validation,'unreviewed');assert.equal(publicData.minutes,30);for(const key of ['title','note','savedAt','accountId','patchLabel','lat','lon','researchConsent'])assert.equal(publicData[key],undefined);
 assert.equal(JSON.stringify(publicData).includes('segreto'),false);
});
test('publication rejects missing context, unknown observations, future dates and unsupported taxa',()=>{
 for(const changed of [{zoneId:null},{reference:null},{record:{...record,presence:'unknown',amount:null}},{date:'2099-01-01'},{category:'appunto'}])assert.throws(()=>sharedObservation({...note,...changed}));
 assert.throws(()=>sharedObservation(note,{references:new Set(),zoneIds:new Set(['rascino'])}));
 assert.throws(()=>sharedObservation(note,{references:new Set([note.reference.href]),zoneIds:new Set()}));
});
// D3 (16 e 24/10/2026): sforzo dell'appunto sul fungo.
test('appunto sul fungo v2: durata in classi obbligatoria solo per la ricerca a vuoto',()=>{
 const absent={presence:'searched_absent',amount:0,minutes:null,people:null,elevation:null,habitat:'unknown',protocolVersion:FIELD_NOTE_V2};
 assert.throws(()=>normalizeFieldRecord(absent,'fungo'),/per quanto tempo/);
 assert.equal(normalizeFieldRecord(absent,'animale').effortClass,null);
 assert.equal(normalizeFieldRecord({...absent,protocolVersion:undefined},'fungo').protocolVersion,'fronda-field-note-v1');
 const ok=normalizeFieldRecord({...absent,effortClass:'60-120',completed:true,stopReason:'planned_time'},'fungo');
 assert.deepEqual([ok.protocolVersion,ok.effortClass,ok.completed,ok.stopReason],[FIELD_NOTE_V2,'60-120',true,'planned_time']);
 assert.equal(normalizeFieldRecord({...absent,minutes:45},'fungo').effortClass,'30-60');
 assert.equal(normalizeFieldRecord({...record,presence:'observed',amount:1,protocolVersion:FIELD_NOTE_V2},'fungo').effortClass,'30-60');
});
test('appunto sul fungo: classi coerenti con i minuti e motivi ammessi',()=>{
 assert.deepEqual([1,29,30,60,61,120,121,1440,0,null].map(effortClassFor),['lt30','lt30','30-60','30-60','60-120','60-120','gt120','gt120',null,null]);
 for(const changed of [{effortClass:'lt30'},{effortClass:'mezzora'},{completed:'yes'},{stopReason:'stanchezza'},{presence:'unknown',amount:null,completed:false},{presence:'searched_absent',amount:0,stopReason:'found_target'}])
  assert.throws(()=>normalizeFieldRecord({...record,...changed},'fungo'));
 assert.equal(normalizeFieldRecord({...record,stopReason:'found_target'},'fungo').stopReason,'found_target');
 const once=normalizeFieldRecord({...record,presence:'unknown',amount:null},'fungo');
 assert.deepEqual(normalizeFieldRecord(once,'fungo'),once);
});
test('lo snapshot condiviso porta classe, ricerca conclusa e motivo di fine',()=>{
 const shared=sharedObservation(normalizeNotebookNote({...note,record:{...record,presence:'searched_absent',amount:0,minutes:null,effortClass:'lt30',completed:false,stopReason:'weather',protocolVersion:FIELD_NOTE_V2}}),{now:Date.parse('2026-10-17T12:00:00Z'),references:new Set([note.reference.href]),zoneIds:new Set(['rascino'])});
 assert.deepEqual([shared.presence,shared.effortClass,shared.completed,shared.stopReason,shared.protocolVersion],['searched_absent','lt30',false,'weather',FIELD_NOTE_V2]);
});
