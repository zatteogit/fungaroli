import {openModal} from './modal-flow.js';
const esc=value=>String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const km=value=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(value)+' km';
const duration=value=>`${Math.floor(value/60)?Math.floor(value/60)+' h':''}${value%60?' '+value%60+' min':''}`.trim();
const href=item=>'#/giri/'+encodeURIComponent(item.id);
const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7"/></svg>';
let outings=[],context={},shareDialog=null,shareOrigin=null;
export function initEditorialOutings(data,options){
  context=options;
  outings=(Array.isArray(data?.outings)?data.outings:[]).filter(item=>item.simulated===true&&/^[a-z0-9-]+$/.test(item.id)&&options.zones.some(z=>z.id===item.zoneId)&&options.trails[item.zoneId]?.trails?.some(t=>String(t.id)===item.trailId));
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-share-editorial]');if(!button)return;
    const item=outings.find(o=>o.id===button.dataset.shareEditorial);if(!item)return;
    const url=new URL(href(item),location.origin+'/').href,title=item.title;
    const text=`${title}\nMatteo · Redattore Fronda\nGiro simulato: proposta editoriale, non un’uscita realmente svolta.\n\n${item.intro}\n\n${url}`;
    if(navigator.share){try{await navigator.share({title,text});return;}catch(error){if(error.name==='AbortError')return;}}
    if(!shareDialog){shareDialog=document.createElement('dialog');shareDialog.className='wiz notebook-share-dialog';shareDialog.setAttribute('aria-label','Condividi il giro');document.body.append(shareDialog);shareDialog.addEventListener('close',()=>shareOrigin?.isConnected&&shareOrigin.focus({preventScroll:true}));addEventListener('hashchange',()=>shareDialog.close());}
    shareOrigin=button;shareDialog.innerHTML=`<div class="wiz-body"><h2>Questo giro, nella tua chat</h2><p>Il link apre la pagina pubblica, anche senza un profilo Fronda.</p><label for="editorial-share-text" class="sr-only">Testo del giro da condividere</label><textarea id="editorial-share-text" readonly rows="8">${esc(text)}</textarea><p class="small" role="status" data-copy-status></p><div class="wiz-nav"><button type="button" class="btn ghost" data-close>Chiudi</button><button type="button" class="btn primary" data-copy>Copia il messaggio</button></div></div>`;
    shareDialog.querySelector('[data-close]').onclick=()=>shareDialog.close();
    shareDialog.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(text);shareDialog.querySelector('[data-copy-status]').textContent='Copiato. Incollalo nella chat che preferisci.';}catch{shareDialog.querySelector('textarea').select();shareDialog.querySelector('[data-copy-status]').textContent='Seleziona e copia il messaggio per inviarlo.';}};
    openModal(shareDialog);
  });
}
export const editorialOutings=()=>outings;
export const editorialTitle=id=>outings.find(o=>o.id===id)?.title||'Giro non disponibile';
export function editorialReference(reference){
  const item=outings.find(o=>href(o)===reference);if(!item)return null;
  return {zoneId:item.zoneId,route:{href:`#/zona/${item.zoneId}/0/sentiero/${item.trailId}`,name:item.routeFacts.name,followed:false},reference:{href:href(item),title:`Giro simulato di Matteo · ${item.title}`}};
}
const author=item=>`<span class="editorial-byline"><span class="editorial-author-mark" aria-hidden="true">M</span><span><b>${esc(item.author.name)}</b><small>${esc(item.author.role)}</small></span></span>`;
const facts=item=>`<ul class="editorial-trip-facts"><li><b>${km(item.routeFacts.distanceKm)}</b><span>itinerario CAI</span></li><li><b>${duration(item.routeFacts.durationMinutes)}</b><span>tempo indicativo</span></li><li><b>${esc(item.routeFacts.difficulty)}</b><span>${item.routeFacts.difficulty==='T'?'turistico':'escursionistico'}</span></li></ul>`;
function card(item,index){
  const photo=context.photos[item.zoneId];
  return `<li class="editorial-trip-card"><a class="editorial-trip-link" href="${href(item)}"><div class="editorial-trip-photo">${photo?.file?`<img src="${esc(photo.file)}" alt="" loading="lazy" decoding="async">`:''}</div><div class="editorial-trip-card-body"><span class="editorial-trip-number" aria-hidden="true">0${index+1}</span><p class="editorial-kicker">${esc(item.eyebrow)}</p><h3>${esc(item.title)}</h3><p>${esc(item.intro)}</p>${facts(item)}<footer>${author(item)}<span class="editorial-open">Sfoglia il giro <span aria-hidden="true">↗</span></span></footer></div></a></li>`;
}
export function renderEditorialIndex(box,{home=false}={}){
  if(!box)return;box.hidden=!outings.length;
  box.innerHTML=`<header class="editorial-index-heading"><div><p class="editorial-kicker">Dalla redazione</p><${home?'h2':'h1'} class="${home?'':'view-title'}">${home?'Un giro da passarsi.':'I giri di Matteo'}</${home?'h2':'h1'}><p>Idee da salvare, condividere e trasformare nella tua prossima uscita.</p></div>${home?'<a class="editorial-all" href="#/giri">Tutti i giri ↗</a>':''}</header><ul class="editorial-trip-grid">${outings.map(card).join('')}</ul>`;
}
function routePlot(item){
  const trail=context.trails[item.zoneId].trails.find(t=>String(t.id)===item.trailId),lines=(trail.lines||[]).map(line=>line.filter(p=>p.length>=2&&p.every(Number.isFinite))).filter(line=>line.length>1),points=lines.flat();if(!points.length)return '';
  const cos=Math.cos(points[0][0]*Math.PI/180),xs=points.map(p=>p[1]*cos),ys=points.map(p=>p[0]),minX=Math.min(...xs),maxY=Math.max(...ys),scale=Math.min(432/(Math.max(...xs)-minX||1),192/(maxY-Math.min(...ys)||1));
  const left=(480-(Math.max(...xs)-minX)*scale)/2,top=(240-(maxY-Math.min(...ys))*scale)/2;
  const project=p=>[left+(p[1]*cos-minX)*scale,top+(maxY-p[0])*scale];
  const first=project(points[0]),last=project(points.at(-1));
  return `<figure class="editorial-route-map"><svg viewBox="0 0 480 240" role="img" aria-label="Schema del tratto mappato nella zona, non una traccia registrata"><path class="editorial-map-grid" d="M0 60H480M0 120H480M0 180H480M80 0V240M160 0V240M240 0V240M320 0V240M400 0V240"/>${lines.map(line=>`<polyline points="${line.map(p=>project(p).map(n=>n.toFixed(1)).join(',')).join(' ')}"/>`).join('')}<circle cx="${first[0]}" cy="${first[1]}" r="5"/><circle class="editorial-route-end" cx="${last[0]}" cy="${last[1]}" r="5"/></svg><figcaption>Tratto mappato nella zona · OpenStreetMap. Schema senza fondo cartografico; non è una registrazione di Matteo.</figcaption></figure>`;
}
export function renderEditorialPage(box,id){
  const item=outings.find(o=>o.id===id);
  if(!item){box.innerHTML='<div class="diary-empty"><h1 class="view-title">Giro non disponibile</h1><p>Questa proposta non è più nel catalogo.</p><a class="btn ghost" href="#/giri">Sfoglia i giri</a></div>';return;}
  const zone=context.zones.find(z=>z.id===item.zoneId),photo=context.photos[item.zoneId],ref=editorialReference(href(item));
  const tripAttrs=`data-trip-zone="${item.zoneId}" data-trip-href="${esc(ref.route.href)}" data-trip-title="${esc(ref.route.name)}" data-trip-source="${href(item)}"`;
  const photoLicense=photo?.licenseUrl||({'CC BY-SA 2.0':'https://creativecommons.org/licenses/by-sa/2.0/','CC BY-SA 3.0':'https://creativecommons.org/licenses/by-sa/3.0/'}[photo?.license]);
  const reading=item.reading.map(id=>context.species.find(s=>s.id===id)).filter(Boolean);
  box.innerHTML=`<article class="editorial-trip-page"><header class="editorial-trip-masthead"><p class="editorial-kicker">Giri d’autore · ${esc(zone.title||zone.name)}</p><h1 class="view-title">${esc(item.title)}</h1><p class="editorial-trip-lead">${esc(item.intro)}</p><div class="editorial-trip-signature">${author(item)}</div><p class="editorial-simulation-note">Un racconto di esempio per provare i giri di Fronda. Non documenta un’uscita realmente svolta, avvistamenti o condizioni attuali.</p><div class="editorial-trip-actions"><button class="btn primary" type="button" data-save-trip ${tripAttrs}>Salva questo giro</button><button class="btn ghost" type="button" data-share-editorial="${item.id}">${icon}Passalo in chat</button></div></header>
    ${photo?.file?`<figure class="editorial-trip-hero"><img src="${esc(photo.file_hd||photo.file)}" alt="Paesaggio di contesto: ${esc(zone.title||zone.name)}" decoding="async"><figcaption>Foto di contesto dal catalogo, non del giro simulato · ${esc(photo.author)} · ${photoLicense?`<a href="${esc(photoLicense)}" target="_blank" rel="noopener">${esc(photo.license)}</a>`:esc(photo.license)} · <a href="${esc(photo.page)}" target="_blank" rel="noopener">Fonte e crediti</a> · adattamento per il catalogo</figcaption></figure>`:''}
    <div class="editorial-trip-layout"><div class="editorial-trip-story"><section><p class="editorial-kicker">Come lo immagino</p><h2>Il taccuino di Matteo</h2>${item.story.map(p=>`<p class="editorial-prose">${esc(p)}</p>`).join('')}</section><section class="editorial-trip-moments"><h2>Tre momenti del giro</h2><ol>${item.moments.map((moment,i)=>`<li><span aria-hidden="true">0${i+1}</span><div><h3>${esc(moment.title)}</h3><p>${esc(moment.text)}</p></div></li>`).join('')}</ol></section><blockquote>${esc(item.takeaway)}<cite>Matteo · nel racconto simulato</cite></blockquote><section class="editorial-trip-reading"><p class="editorial-kicker">Prima di uscire</p><h2>Le schede che porterei con me</h2><p>Spunti per osservare e confrontare. Questi nomi non sono ritrovamenti segnalati lungo il percorso.</p><div>${reading.map(s=>`<a href="${esc(s.href||'#/specie/'+s.id)}" data-entity><b>${esc(s.name)}</b><i>${esc(s.latin)}</i><span aria-hidden="true">↗</span></a>`).join('')}</div></section></div>
    <aside class="editorial-trip-margin"><p class="editorial-kicker">Il sentiero documentato</p><h2>${esc(item.routeFacts.name)}</h2>${facts(item)}<p class="editorial-fact-source">Dati del riepilogo CAI Lazio · ${item.routeSource.year}. Tempi senza le soste di questo racconto; organizza anche il rientro. Il giro non è presentato come un anello.</p>${routePlot(item)}<a class="btn ghost" href="${ref.route.href}">Prepara questa uscita →</a><p class="small">Scegli il giorno e verifica meteo, accessi e regole nella scheda dell’uscita.</p><hr><p class="editorial-kicker">Solo nella simulazione</p><dl><div><dt>Fatica immaginata</dt><dd>${esc(item.mood)}</dd></div></dl><p class="small">Un dettaglio del racconto, distinto dalla difficoltà CAI del sentiero.</p><button type="button" class="link-btn" data-new-outing ${tripAttrs}>Ci sono stato: annota il tuo giro →</button></aside></div>
    <details class="editorial-trip-sources"><summary>Fonti del percorso e limiti</summary><p>Il racconto è simulato. I dati del sentiero provengono dal <a href="${item.routeSource.url}#page=${item.routeFacts.sourcePage}" target="_blank" rel="noopener">riepilogo CAI Lazio del 2022, pagina ${item.routeFacts.sourcePage}</a>. La geometria mostrata deriva dai tratti OpenStreetMap già presenti in Fronda e può coprire soltanto parte dell’itinerario completo. Le due fonti possono riportare misure e tempi diversi; qui i numeri sono quelli CAI. Lo stato attuale del sentiero non è verificato da questa simulazione.</p><p><a href="https://www.openstreetmap.org/relation/${item.trailId}" target="_blank" rel="noopener">Relazione OpenStreetMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors · ODbL</a></p></details>
    <footer class="editorial-trip-bottom"><div><p class="editorial-kicker">Da questa pagina al tuo giro</p><h2>Salvalo. Portalo con te. Poi racconta il tuo.</h2><p>Quando torni, bastano pochi dettagli. I ritrovamenti e la fatica saranno quelli che indichi tu.</p></div><div class="editorial-trip-actions"><button type="button" class="btn primary" data-save-trip ${tripAttrs}>Salva questo giro</button><button type="button" class="btn ghost" data-share-editorial="${item.id}">${icon}Passalo in chat</button></div></footer></article>`;
}
