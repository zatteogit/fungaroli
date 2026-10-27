import {assessWalkingRoute,driveAccessFor,documentedTrailStart} from './outing-route.js';

// Disponibilità documentale, separata da condizioni e ordinamento ambientale.
export function outingDocumentation(zone,{trails=[],access=[],trail=null}={}){
 const mapped=trails.filter(t=>t.lines?.some(line=>line.length>1));
 const route=trail?.lines?.some(line=>line.length>1)?trail:mapped[0];
 const arrival=driveAccessFor(access,zone.parking||[],documentedTrailStart(route));
 const hasAccess=!!arrival&&Number.isFinite(arrival.target?.lat)&&Number.isFinite(arrival.target?.lon);
 const assessment=route?assessWalkingRoute(route):null;
 return {
  label:!mapped.length&&!hasAccess?'Sentiero e accesso non documentati':!mapped.length?'Sentiero non documentato':!hasAccess?'Accesso auto non documentato':'Tratto mappato · giro da verificare',
  trailCount:mapped.length,hasAccess,
  missing:[!mapped.length&&'Sentiero',!hasAccess&&'Arrivo in auto',route&&assessment.parkingConnector==='unverified'&&'Raccordo dalla sosta al sentiero',route&&assessment.returnPlan==='undefined'&&'Ritorno',route&&assessment.walkingMinutes===null&&'Tempo totale a piedi'].filter(Boolean),
 };
}
