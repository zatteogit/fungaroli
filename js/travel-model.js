export const DEFAULT_BASE = {name:'Rieti',lat:42.404,lon:12.8623};
export function validPoint(p) {
  return !!p && Number.isFinite(p.lat) && Math.abs(p.lat)<=90 && Number.isFinite(p.lon) && Math.abs(p.lon)<=180;
}
export function normalizeBase(b) {
  if(b===null)return null;
  if(!validPoint(b)||typeof b.name!=='string'||!b.name.trim()||b.name.length>100)throw new Error('Scegli una base con nome e posizione validi.');
  return {name:b.name.trim(),lat:+b.lat.toFixed(6),lon:+b.lon.toFixed(6)};
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
