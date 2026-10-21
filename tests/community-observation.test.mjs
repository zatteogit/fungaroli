import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNotebookNote} from '../js/notebook-entry.js';
import {sharedObservation,normalizeFieldRecord} from '../js/community-observation.js';
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
