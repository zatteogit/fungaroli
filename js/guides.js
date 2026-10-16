let GUIDES = [], copy = {};
export const guideCount = () => GUIDES.length;
const esc = s => String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function initGuideContent(data,labels={}) {
  // Anche le release CMS già pubblicate usano la nuova terminologia di navigazione.
  GUIDES=(Array.isArray(data?.guides)?data.guides:[]).map(g=>({...g,
    category:g.category==='Taccuino di campo'?'Osservare il bosco':g.category,
    body:String(g.body||'').replaceAll('Apri il taccuino degli alberi','Conosci gli alberi').replaceAll('Apri il tuo diario','Apri il tuo taccuino')
      .replaceAll('Puoi usare il diario come taccuino della passeggiata:','Nel tuo taccuino puoi annotare la passeggiata:')}));
  copy={...labels,editorialEyebrow:['Il taccuino del bosco','Guide del bosco'].includes(labels.editorialEyebrow)?'Approfondimenti sul bosco':labels.editorialEyebrow};
}

export const guideTitle = (id) => GUIDES.find((g) => g.id === id)?.title || 'Approfondimenti';
export function renderGuideCards(box) {
  if (!box) return;
  box.innerHTML = `<p class="eyebrow">${esc(copy.editorialEyebrow || "Approfondimenti sul bosco")}</p><h2>${esc(copy.editorialTitle || "Una cosa da imparare, a ogni giro.")}</h2><div class="editorial-cards">${GUIDES.map((g, i) => `<a class="editorial-card ec-${i}" href="#/guide/${g.id}"><span class="eyebrow">${esc(g.category)}</span><h3>${esc(g.title)}</h3><p>${esc(g.excerpt)}</p><span class="editorial-read">Leggi →</span></a>`).join('')}</div>`;
}
export function renderGuide(box, id) {
  const g = GUIDES.find((g) => g.id === id);
  box.innerHTML = `<a class="small" href="#/guide">← Approfondimenti</a>` + (g ? `<article class="editorial-article" data-glossary="Generale"><p class="eyebrow" data-no-glossary>${esc(g.category)}</p><h1>${esc(g.title)}</h1><p class="article-lede">${esc(g.excerpt)}</p>${g.body}</article>` : '<p>Questo approfondimento non è disponibile.</p>');
}
