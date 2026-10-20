import {geometrySignature} from './outing-route.js';
// Geometrie aperte, punti mappati e collegamenti editoriali restano evidenze distinte.
export const TRAIL_PLACE_KINDS={parking:'Parcheggio mappato',drinking_water:'Acqua potabile indicata in mappa',shelter:'Riparo mappato',toilets:'Servizi igienici mappati',alpine_hut:'Rifugio mappato',wilderness_hut:'Bivacco mappato',picnic_site:'Area picnic mappata'};
const fail=m=>{throw Object.assign(new Error(m),{status:422});};
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
export function trailHttps(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&!/[\s"'<>]/.test(value)&&u.hostname.includes('.');}catch{return false;}}
export function validateRelatedLinks(links){
 if(!Array.isArray(links)||links.length>8)fail('Massimo otto riferimenti per sentiero.');const seen=new Set();
 for(const l of links){
  if(!l||!['official_context','partly_overlapping'].includes(l.relationship)||!text(l.provider,80)||!text(l.label,120)||!text(l.note,600)||!trailHttps(l.url)||!day(l.checkedOn)||!['pending','reviewed'].includes(l.status)||l.authorLabel!=null&&!text(l.authorLabel,120)||l.caution!=null&&!text(l.caution,120))fail('Collegamento: indica pagina HTTPS, relazione con il sentiero, nota e verifica.');
  const u=new URL(l.url);if(seen.has(u.href))fail('Collegamento ripetuto.');seen.add(u.href);
  if(l.provider==='Wikiloc'&&(!/(^|\.)wikiloc\.com$/.test(u.hostname)||!/-\d+$/.test(u.pathname)))fail('Wikiloc richiede una scheda di percorso, non un link di ricerca.');
  if(l.provider==='Komoot'&&(u.hostname!=='www.komoot.com'&&u.hostname!=='www.komoot.it'||!/\/(tour|smarttour|tours)\//.test(u.pathname)))fail('Komoot richiede una scheda di percorso verificata.');
 }
 return links;
}
export function validateTrailContext(data){
 for(const z of Object.values(data.zones||{})){
  for(const t of z.trails||[]){
   const v=t.routeValidation;
   if(v){
    if(!['not_checked','network_correspondence_checked','needs_review'].includes(v.status)||v.geometrySignature!==geometrySignature(t.lines))fail('Verifica del percorso non coerente con la geometria corrente.');
    if(v.status!=='not_checked'&&(!day(v.checkedOn)||!day(v.sourceUpdatedOn)||!Number.isInteger(v.sourceVersion)||v.sourceUrl!==`https://www.openstreetmap.org/relation/${t.id}`||v.license!=='ODbL-1.0'||!Array.isArray(v.members)||!Array.isArray(v.cautions)||v.walkingTotalMinutes!==null||v.connector?.status!=='unverified'||v.connector?.minutes!==null||v.fieldValidation!==false))fail('Evidenze del percorso incomplete o stato dell’uscita non supportato.');
    if(v.status==='network_correspondence_checked'&&(!v.connectedSimpleChain||v.cautions.length||!Array.isArray(v.maxDeviationMeters)||v.maxDeviationMeters.length!==2||v.maxDeviationMeters.some(n=>!Number.isFinite(n)||n>16||n<0)))fail('Continuità del sentiero non dimostrata.');
   }
   if(t.relatedLinks)validateRelatedLinks(t.relatedLinks);
   const p=t.sourceEvidence;if(p&&(!day(p.checkedOn)||!day(p.sourceUpdatedOn)||!Number.isInteger(p.sourceVersion)||p.sourceVersion<1||p.sourceUrl!==`https://www.openstreetmap.org/relation/${t.id}`||p.license!=='ODbL-1.0'||p.licenseUrl!=='https://opendatacommons.org/licenses/odbl/1-0/'||p.geometryReacquired!==false))fail('Provenienza del sentiero incoerente con la relazione OSM.');
  }
  if(z.publicPlaces!=null){if(!Array.isArray(z.publicPlaces)||z.publicPlaces.length>100)fail('Punti mappati non validi.');const ids=new Set();
   for(const p of z.publicPlaces){
    if(!p||!/^osm:(node|way|relation):\d+$/.test(p.id)||ids.has(p.id)||!Object.hasOwn(TRAIL_PLACE_KINDS,p.kind)||!text(p.name,160)||!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.lon)||Math.abs(p.lon)>180||p.sourceUrl!==`https://www.openstreetmap.org/${p.id.slice(4).replace(':','/')}`||!day(p.checkedOn)||!day(p.sourceUpdatedOn)||p.license!=='ODbL-1.0'||p.status!=='mapped'||p.liveAvailability!==null||!['node','area_representative'].includes(p.positionMethod))fail('Punto mappato: fonte, tipo, posizione o stato non validi.');
    if(['no','private'].includes(p.mappedAccess))fail('Un punto ad accesso vietato o privato non entra nei servizi proposti.');ids.add(p.id);
   }
  }
 }
 return data;
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>day(s)?new Date(s+'T12:00:00Z').toLocaleDateString('it-IT'):'';
const externalArrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>';
export function renderTrailContext(t){
 const p=t.sourceEvidence;let links=[];try{links=validateRelatedLinks(t.relatedLinks||[]).filter(l=>l.status==='reviewed');}catch{/* Mai mostrare collegamenti che non passano il contratto. */}
 if(!p&&!links.length)return '';
 return `<div class="trail-provenance">
 ${p?`<div class="trail-source-line"><span>Tracciato</span><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">© OpenStreetMap ${externalArrow}</a><a class="trail-license" href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">ODbL</a></div>`:''}
 ${links.length?`<h4>Altri itinerari</h4><ul class="trail-related">${links.map(l=>`<li><a class="trail-related-link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(l.label)}"><span><b>${esc(l.provider)}</b><small>${l.relationship==='official_context'?'Tappa collegata':'Tratti in comune'}</small></span>${externalArrow}</a>${l.caution?`<span class="trail-link-caution"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 10 18H2zM12 9v5M12 17h.01"/></svg>${esc(l.caution)}</span>`:''}</li>`).join('')}</ul>`:''}
 <details class="trail-source-details"><summary>Fonti e dettagli</summary>
 ${p?`<dl class="trail-source-dates"><div><dt>Fonte aggiornata</dt><dd>${date(p.sourceUpdatedOn)}</dd></div><div><dt>Metadati consultati</dt><dd>${date(p.checkedOn)}</dd></div></dl><p>© contributori OpenStreetMap · ODbL. Consultazione, non verifica sul terreno.</p>`:''}
 ${links.length?`<p>Riferimenti a itinerari diversi. Non sono la fonte della geometria Fronda.</p>${links.map(l=>`<div class="trail-source-note"><b>${esc(l.provider)}</b>${l.authorLabel?` · ${esc(l.authorLabel)}`:''}<p>${esc(l.note)}</p><small>Link controllato il ${date(l.checkedOn)}</small></div>`).join('')}`:''}
 </details></div>`;
}
const placeIcon=kind=>kind==='parking'?'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/></svg>';
export function renderMappedPlaces(places=[]){
 const safe=places.filter(p=>p&&Object.hasOwn(TRAIL_PLACE_KINDS,p.kind)&&trailHttps(p.sourceUrl)&&!['no','private'].includes(p.mappedAccess));
 if(!safe.length)return '';
 return `<section class="mapped-places"><h3>Punti utili</h3><p class="mapped-place-status">Accesso e apertura da verificare</p><ul>${safe.map(p=>`<li><a class="mapped-place-link" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer"><span class="mapped-place-icon">${placeIcon(p.kind)}</span><span><b>${esc(p.name.replace(/^Parcheggio mappato presso /,'Parcheggio · '))}</b><small>${TRAIL_PLACE_KINDS[p.kind]}${p.elevation!=null?' · '+esc(p.elevation)+' m':''}</small></span>${externalArrow}</a></li>`).join('')}</ul><div class="trail-source-line"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© contributori OpenStreetMap · ODbL</a></div><details class="trail-source-details"><summary>Fonti e aggiornamenti</summary><p>Posizioni di riferimento in mappa; accesso, apertura e disponibilità attuale non verificati. I rifugi non sono parcheggi.</p>${safe.map(p=>`<div class="trail-source-note"><b>${esc(p.name)}</b><dl class="trail-source-dates"><div><dt>Fonte aggiornata</dt><dd>${date(p.sourceUpdatedOn)}</dd></div><div><dt>Consultata</dt><dd>${date(p.checkedOn)}</dd></div></dl></div>`).join('')}</details></section>`;
}
