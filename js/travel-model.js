export const DEFAULT_BASE = {name:'Rieti',lat:42.404,lon:12.8623};
export function validPoint(p) {
  return !!p && Number.isFinite(p.lat) && Math.abs(p.lat)<=90 && Number.isFinite(p.lon) && Math.abs(p.lon)<=180;
}
// La base personale si salva arrotondata a 2 decimali, circa 1 km (decisione di Matteo del 22/10/2026):
// basta per distanze e tempi verso zone larghe 1,5–5 km e non conserva il punto esatto (spesso casa).
// Vale per client e server; l'origine di riferimento del catalogo non è un dato personale e resta precisa.
export const BASE_DECIMALS = 2;
export function normalizeBase(b,{decimals=BASE_DECIMALS}={}) {
  if(b===null)return null;
  if(!validPoint(b)||typeof b.name!=='string'||!b.name.trim()||b.name.length>100)throw new Error('Scegli una base con nome e posizione validi.');
  return {name:b.name.trim(),lat:+b.lat.toFixed(decimals),lon:+b.lon.toFixed(decimals)};
}
export const pointKey = p => `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
export function airDistanceKm(a,b) {
  if(!validPoint(a)||!validPoint(b))return null;
  const rad=x=>x*Math.PI/180,dl=rad(b.lat-a.lat),dn=rad(b.lon-a.lon);
  const h=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dn/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function drivingDirections(base, target) {
  if(!validPoint(base)||!validPoint(target))return '';
  return `https://www.google.com/maps/dir/?api=1&origin=${base.lat},${base.lon}&destination=${target.lat},${target.lon}&travelmode=driving`;
}
