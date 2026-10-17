import {enhanceContentReading} from './content-ui.js';
let GUIDES = [], copy = {}, ASSET = (f) => f;
export const guideCount = () => GUIDES.length;
const esc = s => String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function initGuideContent(data,labels={},assetUrl) {
  if (assetUrl) ASSET = assetUrl;
  // Anche le release CMS già pubblicate usano la nuova terminologia di navigazione.
  GUIDES=(Array.isArray(data?.guides)?data.guides:[]).map(g=>({...g,
    category:g.category==='Taccuino di campo'?'Osservare il bosco':g.category,
    body:String(g.body||'').replaceAll('Apri il taccuino degli alberi','Conosci gli alberi').replaceAll('Apri il tuo diario','Apri il tuo taccuino')
      .replaceAll('Puoi usare il diario come taccuino della passeggiata:','Nel tuo taccuino puoi annotare la passeggiata:')}));
  copy={...labels,editorialEyebrow:['Il taccuino del bosco','Guide del bosco'].includes(labels.editorialEyebrow)?'Approfondimenti sul bosco':labels.editorialEyebrow};
}

// illustrazione d'apertura (facoltativa): file in assets/, testo alternativo e crediti
const IMG_RE = /^assets\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpe?g)$/;
const imageOf = (g) => (g.image && IMG_RE.test(g.image.file || '') && ASSET(g.image.file)) ? g.image : null;
const credit = (m) => `${m.generated ? 'Illustrazione generata' : 'Immagine'}: ${esc(m.author)} · ${/^https:\/\//.test(m.licenseUrl || '') ? `<a href="${esc(m.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a>` : esc(m.license)}${m.note ? ` · ${esc(m.note)}` : ''}`;

export const guideTitle = (id) => GUIDES.find((g) => g.id === id)?.title || 'Approfondimenti';
export function renderGuideCards(box) {
  if (!box) return;
  box.innerHTML = `<div class="editorial-cards">${GUIDES.map((g, i) => `<a class="editorial-card ec-${i}" href="#/guide/${g.id}">${imageOf(g) ? `<img class="editorial-card-img" src="${esc(ASSET(g.image.file))}" alt="" width="1600" height="900" loading="lazy" decoding="async">` : ''}<span class="eyebrow">${esc(g.category)}</span><h3>${esc(g.title)}</h3><p>${esc(g.excerpt)}</p><span class="editorial-read">Leggi →</span></a>`).join('')}</div>`;
}
export function renderGuide(box, id) {
  const g = GUIDES.find((g) => g.id === id);
  box.innerHTML = `<a class="small" href="#/guide">← Approfondimenti</a>` + (g ? `<article class="editorial-article" data-glossary="Generale"><p class="eyebrow" data-no-glossary>${esc(g.category)}</p><h1>${esc(g.title)}</h1><p class="article-lede">${esc(g.excerpt)}</p>${imageOf(g) ? `<figure class="guide-hero" data-no-glossary><img src="${esc(ASSET(g.image.file))}" alt="${esc(g.image.alt)}" width="1600" height="900" decoding="async"><figcaption>${credit(g.image)}</figcaption></figure>` : ''}${g.body}</article>` : '<p>Questo approfondimento non è disponibile.</p>');
  enhanceContentReading(box.querySelector('.editorial-article'));
}
