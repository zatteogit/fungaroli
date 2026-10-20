// Valutazione documentale: una linea in mappa non prova accesso, raccordo o apertura.
import {distanceMeters} from './walks.js';
export function geometrySignature(lines){const s=JSON.stringify(lines||[]);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16).padStart(8,'0');}
export function assessWalkingRoute(t){
 const lines=(t.lines||[]).filter(l=>l.length>1),sameLength=Number.isFinite(t.total_km)&&Number.isFinite(t.in_zone_km)&&Math.abs(t.total_km-t.in_zone_km)<.05;
 const e=t.wholeTrailEvidence,verified=!!e&&e.geometrySignature===geometrySignature(t.lines)&&sameLength&&lines.length===1&&e.scope==='whole_trail_one_way'&&Number.isFinite(e.minutes)&&e.minutes>0;
 const v=t.routeValidation,network=verified&&v?.status==='network_correspondence_checked'&&v.geometrySignature===geometrySignature(t.lines)&&v.connectedSimpleChain&&!(v.cautions||[]).length;
 const sourceReturn=v?.sourceDurations?.['duration:backward'],parts=typeof sourceReturn==='string'&&/^(\d+):([0-5]\d)$/.exec(sourceReturn),sourceReturnMinutes=parts?Number(parts[1])*60+Number(parts[2]):null;
 const back=network&&v.return?.status==='same_trail_reversed'&&v.return.geometrySignature===v.geometrySignature&&v.return.sourceTag==='duration:backward'&&Number.isFinite(v.return.minutes)&&v.return.minutes>0&&v.return.minutes===sourceReturnMinutes?v.return.minutes:null;
 return {version:2,networkStatus:v?.geometrySignature===geometrySignature(t.lines)?v.status:'not_checked',outboundMinutes:verified?e.minutes:null,returnMinutes:back,trailRoundTripMinutes:back!==null?e.minutes+back:null,trailRoundTripKm:back!==null?t.total_km*2:null,parkingStatus:v?.parking?.status||'unverified',status:lines.length!==1?'segments_to_review':!sameLength?'local_fragment':'whole_route_to_review',sourceDurationScope:'whole_relation',wholeTrailMinutes:verified?e.minutes:null,walkingMinutes:null,parkingConnector:'unverified',returnPlan:back!==null?'same_trail_reversed':'undefined',fieldValidation:false,reason:lines.length!==1?'connection_not_proven':!sameLength?'source_duration_is_not_local_duration':'access_and_return_not_defined'};
}
export function driveAccessFor(routes=[],parking=[],head=null){
 const candidates=routes.map(a=>{const end=a.line?.at(-1),target=end&&end.every(Number.isFinite)?{lat:end[0],lon:end[1]}:{lat:a.lat,lon:a.lon};return{reference:a,target,name:a.parking||'Arrivo del percorso auto',kind:'drive_endpoint'};});
 if(candidates.length)return head?candidates.sort((a,b)=>distanceMeters(head,a.target)-distanceMeters(head,b.target))[0]:candidates[0];
 const points=parking.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));if(!points.length)return null;
 const target=head?[...points].sort((a,b)=>distanceMeters(head,a)-distanceMeters(head,b))[0]:points[0];return{reference:null,target,name:target.name||'Sosta mappata',kind:'mapped_stop'};
}

export function documentedTrailStart(t){const v=t?.routeValidation;return v?.orientation!=='not_established'&&v?.status==='network_correspondence_checked'&&v.geometrySignature===geometrySignature(t.lines)&&Array.isArray(v.start)&&v.start.length===2&&v.start.every(Number.isFinite)?{lat:v.start[0],lon:v.start[1]}:null;}
