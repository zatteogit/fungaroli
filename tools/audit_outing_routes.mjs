import{readFileSync,writeFileSync}from'node:fs';import{assessWalkingRoute,geometrySignature}from'../js/outing-route.js';
const path=new URL('../data/trails.json',import.meta.url),data=JSON.parse(readFileSync(path));
for(const z of Object.values(data.zones))for(const t of z.trails){
 if(t.id===11098449&&geometrySignature(t.lines)==='9d05099a')t.wholeTrailEvidence={checkedOn:'2026-10-20',sourceUpdatedOn:'2024-07-18',sourceVersion:8,sourceUrl:'https://www.openstreetmap.org/relation/11098449',corroboratingUrl:'https://www.parchilazio.it/montinavegnacervia-schede-18437-334_ascrea_mirandella_f_te_le_forche_cai',scope:'whole_trail_one_way',minutes:120,direction:'Ascrea → Fonte le Forche',startNote:'Scalinata presso il cimitero di Ascrea',geometrySignature:'9d05099a',geometryCorrespondence:'checked_against_osm_full',parkingConnector:'unverified',fieldValidation:false};
 t.outingAssessment=assessWalkingRoute(t);
}
writeFileSync(path,JSON.stringify(data)+'\n');
const rows=Object.values(data.zones).flatMap(z=>z.trails);console.log(JSON.stringify({entries:rows.length,completeOutings:rows.filter(t=>t.outingAssessment.walkingMinutes!=null).length,wholeTrailTimesChecked:rows.filter(t=>t.outingAssessment.wholeTrailMinutes!=null).length}));
