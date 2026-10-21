import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNotebookNote} from '../js/notebook-entry.js';
import {normalizeNotebookPhoto} from '../js/notebook-photo.js';
import {renderNotebook} from '../js/notebook-view.js';
const photo={data:'data:image/jpeg;base64,'+btoa('\xff\xd8test\xff\xd9'),width:800,height:600};
const note={id:'photo-note-1',kind:'note',category:'fungo',title:'Un fungo da conoscere',date:'2026-10-20',zoneId:null,note:'',reference:null,photo};
test('una foto personale basta per una nota privata senza nome e senza luogo',()=>{
 const saved=normalizeNotebookNote(note);assert.deepEqual(saved.photo,photo);assert.equal(saved.reference,null);assert.equal(saved.zoneId,null);assert.equal(saved.forecast,undefined);
 assert.throws(()=>normalizeNotebookNote({...note,photo:null}));
});
test('fotografie: niente URL, SVG, payload troppo grandi o dimensioni senza limiti',()=>{
 for(const p of [{...photo,data:'https://example.org/photo.jpg'},{...photo,data:'data:image/svg+xml;base64,PHN2Zz4='},{...photo,width:1281},{...photo,height:0},{...photo,data:photo.data+'x'.repeat(160_024)},{...photo,data:'data:image/jpeg;base64,'+btoa('not a jpeg')}])assert.throws(()=>normalizeNotebookPhoto(p));
 assert.equal(normalizeNotebookPhoto(null),null);
});
test('la fotografia personale precede il catalogo e conserva il formato nella pagina',()=>{
 const params={entries:[{...note,reference:{href:'#/fungo/porcino',title:'Porcino'}}],zones:[],species:[],zoneImage:()=>'/catalog.jpg',referenceImage:()=>({file:'/catalog.jpg'}),route:{base:'#/diario',demo:false,id:'photo-note-1'}};
 const detail=renderNotebook(params);assert.match(detail.html,/La tua fotografia/);assert.match(detail.html,/is-personal/);assert.doesNotMatch(detail.html,/catalog.jpg/);assert.doesNotMatch(detail.html,/href="undefined"/);
 const cards=renderNotebook({...params,route:{...params.route,id:''}});assert.match(cards.html,/Foto tua/);assert.doesNotMatch(cards.html,/Dal catalogo/);
});
test('il meteo conservato rimane legato al luogo e giorno della nota',()=>{
 const weather={date:note.date,zoneId:'tancia',icon:'rain',tmin:8,tmax:13,capturedAt:'2026-10-20T08:00:00Z'};
 assert.deepEqual(normalizeNotebookNote({...note,zoneId:'tancia',weather}).weather,weather);
 assert.throws(()=>normalizeNotebookNote({...note,weather}));
 assert.throws(()=>normalizeNotebookNote({...note,zoneId:'tancia',weather:{...weather,date:'2026-10-19'}}));
});
