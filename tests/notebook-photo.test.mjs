import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNotebookNote} from '../js/notebook-entry.js';
import {normalizeNotebookPhoto,stripJpegMetadata} from '../js/notebook-photo.js';
import {renderNotebook} from '../js/notebook-view.js';
// JPEG minimo ma con la struttura a segmenti vera: SOI, APP0 JFIF, scansione (con 0xFF00 e un RST), EOI.
const seg=(marker,body)=>String.fromCharCode(0xff,marker,(body.length+2)>>8,(body.length+2)&255)+body;
const JFIF=seg(0xe0,'JFIF\0\x01\x01\0\0\x01\0\x01\0\0'),QUANT=seg(0xdb,'\0'+'\x01'.repeat(64));
const SCAN=seg(0xda,'\x01\x01\0\0\x3f\0')+'ab\xff\x00cd\xff\xd0ef';
const jpeg=(...segments)=>'\xff\xd8'+segments.join('')+SCAN+'\xff\xd9';
const dataOf=raw=>'data:image/jpeg;base64,'+btoa(raw),rawOf=photo=>atob(photo.data.split(',')[1]);
const photo={data:dataOf(jpeg(JFIF,QUANT)),width:800,height:600};
const note={id:'photo-note-1',kind:'note',category:'fungo',title:'Un fungo da conoscere',date:'2026-10-20',zoneId:null,note:'',reference:null,photo};
test('una foto personale basta per una nota privata senza nome e senza luogo',()=>{
 const saved=normalizeNotebookNote(note);assert.deepEqual(saved.photo,photo);assert.equal(saved.reference,null);assert.equal(saved.zoneId,null);assert.equal(saved.forecast,undefined);
 assert.throws(()=>normalizeNotebookNote({...note,photo:null}));
});
test('fotografie: niente URL, SVG, payload troppo grandi o dimensioni senza limiti',()=>{
 for(const p of [{...photo,data:'https://example.org/photo.jpg'},{...photo,data:'data:image/svg+xml;base64,PHN2Zz4='},{...photo,width:1281},{...photo,height:0},{...photo,data:photo.data+'x'.repeat(160_024)},{...photo,data:'data:image/jpeg;base64,'+btoa('not a jpeg')},{...photo,data:dataOf('\xff\xd8test\xff\xd9')}])assert.throws(()=>normalizeNotebookPhoto(p));
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

// Decisione del 22/10/2026: il server non si fida del browser. Una chiamata diretta all'API con una foto piena di
// metadati (Exif con coordinate GPS, XMP, IPTC) salva una copia ripulita; colori e immagine restano.
const EXIF=seg(0xe1,'Exif\0\0MM\0*\0\0\0\x08GPSLatitude 42.567812 GPSLongitude 12.964834');
const XMP=seg(0xe1,'http://ns.adobe.com/xap/1.0/\0<x:xmpmeta><exif:GPSLatitude>42,34N</exif:GPSLatitude></x:xmpmeta>');
const IPTC=seg(0xed,'Photoshop 3.0\x008BIM\x04\x04 autore e luogo');
const ICC=seg(0xe2,'ICC_PROFILE\0\x01\x01sRGB'),ADOBE=seg(0xee,'Adobe\0\x64\0\0\0\0\x01');
test('foto: Exif, XMP e IPTC tolti anche lato server; JFIF, profilo colore e dati dell’immagine restano',()=>{
 const dirty={...photo,data:dataOf(jpeg(JFIF,EXIF,ICC,XMP,QUANT,IPTC,ADOBE))},clean=normalizeNotebookPhoto(dirty);
 assert.equal(rawOf(clean),jpeg(JFIF,ICC,QUANT,ADOBE));
 for(const leak of ['Exif','GPSLatitude','xmpmeta','8BIM'])assert.ok(!rawOf(clean).includes(leak),leak);
 assert.ok(!rawOf(clean).includes('\xff\xe1'),'nessun segmento APP1');
 assert.deepEqual([clean.width,clean.height],[photo.width,photo.height]);
 // Già pulita: la stessa stringa, senza ricodifica. Ripulire due volte non cambia nulla.
 assert.equal(normalizeNotebookPhoto(photo).data,photo.data);
 assert.deepEqual(normalizeNotebookPhoto(clean),clean);
 // Anche la nota normalizzata (browser e API) porta la copia ripulita.
 assert.equal(normalizeNotebookNote({...note,photo:dirty}).photo.data,clean.data);
});
test('foto: struttura JPEG controllata; i dati dopo la fine dell’immagine non vengono conservati',()=>{
 const trailer=stripJpegMetadata(jpeg(JFIF)+'GPS 42.56\xff\xd9');
 assert.equal(trailer.raw,jpeg(JFIF));assert.equal(trailer.removed,true);
 assert.deepEqual(stripJpegMetadata(jpeg(JFIF)),{raw:jpeg(JFIF),removed:false});
 for(const raw of ['\xff\xd8'+JFIF+'x'+SCAN+'\xff\xd9','\xff\xd8\xff\xe1\xff\xff\xff\xd9','\xff\xd8'+JFIF+'\xff\x00'+SCAN+'\xff\xd9','\xff\xd8'+JFIF])
  assert.throws(()=>stripJpegMetadata(raw),/Fotografia non valida/);
});
