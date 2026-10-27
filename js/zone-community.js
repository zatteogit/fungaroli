import {infoGlyph} from './ui-icons.js';
import {PROVINCES,zoneProvince} from './community-aggregate.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=(n,one,many)=>`${Number(n)||0} ${Number(n)===1?one:many}`;

// Only published aggregates from the existing access-controlled summary. Never infer
// local observations from habitat, predictions or another zone in the same province.
export function zoneCommunityHtml({zone,summary,status,enabled,authenticated,resolve=()=>null}){
 const granted=summary?.access==='granted',province=zoneProvince(zone);
 const outings=granted?(summary.reports||[]).filter(r=>r.zoneId===zone.id):[];
 const notes=granted?(summary.observations||[]).filter(r=>r.zoneId===zone.id):[];
 const local=outings.length+notes.length;
 const wideOutings=granted&&!local?(summary.provinceReports||[]).filter(r=>r.province===province):[];
 const wideNotes=granted&&!local?(summary.provinceObservations||[]).filter(r=>r.province===province):[];
 const rows=(items,note)=>`<ul class="zone-community-list">${items.map(r=>{
  const category=note?r.category:'fungo',id=note?r.taxonId:r.speciesId,item=resolve(category,id);
  const name=item?.name||id?.replaceAll('-',' ')||'Osservazione';
  return `<li><span>${item?.href?`<a href="${esc(item.href)}" data-entity>${esc(name)}</a>`:`<b>${esc(name)}</b>`}${note?`<small>${esc(({fungo:'Funghi',botanica:'Piante',albero:'Alberi',animale:'Animali'})[category]||'Dal Taccuino')}</small>`:''}</span><span>${count(r.sightings,note?'presenza dichiarata':'ritrovamento dichiarato',note?'presenze dichiarate':'ritrovamenti dichiarati')}<small>${count(r.zeros,'ricerca a vuoto','ricerche a vuoto')}</small></span></li>`;
 }).join('')}</ul>`;
 const series=(reports,observations)=>`${reports.length?`<h3>Uscite condivise</h3>${rows(reports,false)}`:''}${observations.length?`<h3>Osservazioni dal Taccuino</h3>${rows(observations,true)}`:''}`;
 const content=!granted?`<p class="zone-community-status">${esc(status)}</p>`:local?series(outings,notes):`<p class="zone-community-status">Non ci sono ancora osservazioni sufficienti per un riepilogo di questa zona. Non significa che non ci siano funghi o altre specie.</p>${wideOutings.length+wideNotes.length?`<div class="zone-community-province"><h3>In provincia di ${esc(PROVINCES[province]||province)}</h3><p>Riepilogo provinciale, non un dato di ${esc(zone.title||zone.name)}. Può comprendere altre zone già pubblicate.</p>${series(wideOutings,wideNotes)}</div>`:''}`;
 return `<section class="zone-community" aria-labelledby="zone-community-title"><header><span class="eyebrow">Dal Taccuino condiviso</span><h2 id="zone-community-title">Cosa dicono gli altri su ${esc(zone.title||zone.name)}</h2><p class="zone-community-scope">Ultimi 7 giorni · tutte le specie della zona</p></header>${content}<div class="zone-community-actions">${enabled?`<button type="button" class="btn primary" data-report data-zone="${esc(zone.id)}">${granted?'Racconta la tua uscita':'Condividi e scopri'}</button>${!authenticated?'<button type="button" class="btn ghost" data-community-account>Accedi</button>':''}`:''}<a href="#/diario">Apri il tuo Taccuino →</a></div><p class="zone-community-caution">Osservazioni dichiarate: non confermano la presenza attuale. I tuoi punti GPS restano privati.</p><details class="zone-community-method" data-weather-preserve-open><summary>${infoGlyph}<span>Dati e privacy</span></summary><div><p>Ultimi 7 giorni · tutte le specie condivise nella zona, indipendentemente dal giorno e dai filtri dell’uscita.</p><p class="zone-community-limits">Solo riepiloghi per zona ampia, con almeno 3 contributori e 2 giorni diversi. Le osservazioni sono dichiarate e non confermano la presenza attuale. Uscite e note possono descrivere lo stesso giro: i conteggi restano separati. Nessun punto GPS, nome o testo privato viene mostrato.</p><button type="button" class="link-btn" data-home-how-open>Come funziona la condivisione →</button></div></details></section>`;
}
