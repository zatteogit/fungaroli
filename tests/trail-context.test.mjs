import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{validateTrailContext,validateRelatedLinks,renderTrailContext,renderMappedPlaces}from'../js/trail-context.js';
import{validateContent}from'../worker/content-validation.js';
const read=p=>JSON.parse(readFileSync(new URL('../data/'+p+'.json',import.meta.url)));const trails=read('trails'),zone=trails.zones.vallonina,route=zone.trails.find(t=>t.id===10645640);
test('lotto aperto: tre relazioni con provenienza OSM, geometrie e data della fonte distinte dalla consultazione',()=>{
 assert.equal(validateTrailContext(trails),trails);const ids=new Set(Object.values(trails.zones).flatMap(z=>z.trails.filter(t=>t.sourceEvidence).map(t=>t.id)));assert.equal(ids.size,3);
 assert.equal(route.sourceEvidence.sourceUpdatedOn,'2024-03-31');assert.equal(route.sourceEvidence.checkedOn,'2026-10-20');assert.equal(route.sourceEvidence.geometryReacquired,false);assert.equal(route.relatedLinks.length,2);
 assert.deepEqual(validateContent('trails',trails).value,trails);
});
test('punti comodi: due rifugi distinti da un parcheggio; nessuna promessa di apertura o transito',()=>{
 assert.equal(zone.publicPlaces.length,3);assert.equal(zone.publicPlaces.filter(p=>p.kind==='parking').length,1);assert.equal(zone.publicPlaces.filter(p=>p.kind==='alpine_hut').length,2);
 assert.ok(zone.publicPlaces.every(p=>p.liveAvailability===null&&p.status==='mapped'));
 const z=read('zones').zones.find(z=>z.id==='vallonina');assert.equal(z.parking.length,1);assert.equal(z.parking[0].sourceUrl,'https://www.openstreetmap.org/way/132609641');assert.equal(z.drive_min,null);assert.equal(z.drive_km,null);assert.deepEqual(read('access').zones.vallonina,[]);assert.equal(zone.drive,null);
 const html=renderMappedPlaces(zone.publicPlaces);assert.match(html,/I rifugi non sono parcheggi/);assert.doesNotMatch(html,/maps\/dir|Indicazioni stradali/);
});
test('link editoriali: HTTPS, host, contesto, revisione e niente attribuzione della geometria al sito collegato',()=>{
 const html=renderTrailContext(route);assert.match(html,/Altro itinerario su Wikiloc/);assert.match(html,/Non sono la fonte della geometria Fronda/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/fb1947/);assert.doesNotMatch(html,/<iframe|<img/);
 const l=route.relatedLinks[1];for(const patch of [{url:'javascript:alert(1)'},{url:'https://it.wikiloc.com.attacker.test/x-123'},{url:'https://it.wikiloc.com/percorsi-escursionismo/ricerca'},{checkedOn:'2026-02-30'},{relationship:'same_route'},{note:''},{status:'unchecked'}])assert.throws(()=>validateRelatedLinks([{...l,...patch}]),JSON.stringify(patch));
 assert.doesNotMatch(renderTrailContext({...route,relatedLinks:[{...l,status:'pending'}]}),/Altro itinerario su Wikiloc/);
});
test('revisione CMS dei riferimenti ed impossibilità di falsificare geometria, provenienza e punti generati',()=>{
 let d=structuredClone(trails);d.zones.vallonina.trails.find(t=>t.id===route.id).relatedLinks[1].note='Riferimento pertinente controllato dalla redazione.';assert.equal(validateContent('trails',d,trails).needsReview,true);
 for(const mutate of [t=>t.zones.vallonina.trails[1].sourceEvidence.sourceUpdatedOn='2025-01-01',t=>t.zones.vallonina.publicPlaces[0].lat=0,t=>t.zones.vallonina.trails[1].lines=[]]){d=structuredClone(trails);mutate(d);assert.throws(()=>validateContent('trails',d,trails),/fonte del tracciato/);}
 d=structuredClone(trails);d.zones.vallonina.trails[0].relatedLinks=[];assert.deepEqual(validateContent('trails',d,trails).value,trails);
});
test('punti privati e attribuzioni di fonte false non sono accettati',()=>{
 let d=structuredClone(trails);d.zones.vallonina.publicPlaces[0].mappedAccess='private';assert.throws(()=>validateTrailContext(d));d=structuredClone(trails);d.zones.vallonina.trails.find(t=>t.id===route.id).sourceEvidence.sourceUrl='https://www.wikiloc.com/route-123';assert.throws(()=>validateTrailContext(d));
});
