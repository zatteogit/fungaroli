let GUIDES = [], copy = {};
const esc = s => String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function initGuideContent(data,labels={}) { GUIDES=Array.isArray(data?.guides)?data.guides:[]; copy=labels; }

export const guideTitle = (id) => GUIDES.find((g) => g.id === id)?.title || 'Taccuino del bosco';
export function renderGuideCards(box) {
  if (!box) return;
  box.innerHTML = `<p class="eyebrow">${esc(copy.editorialEyebrow || "Il taccuino del bosco")}</p><h2>${esc(copy.editorialTitle || "Una cosa da imparare, a ogni giro.")}</h2><div class="editorial-cards">${GUIDES.map((g, i) => `<a class="editorial-card ec-${i}" href="#/guide/${g.id}"><span class="eyebrow">${esc(g.category)}</span><h3>${esc(g.title)}</h3><p>${esc(g.excerpt)}</p><span class="editorial-read">Leggi il taccuino →</span></a>`).join('')}</div>`;
}
export function renderGuide(box, id) {
  const g = GUIDES.find((g) => g.id === id);
  box.innerHTML = g ? `<article class="editorial-article"><p class="eyebrow">${esc(g.category)}</p><h1>${esc(g.title)}</h1><p class="article-lede">${esc(g.excerpt)}</p>${g.body}</article>` : '<p>Questo articolo non è disponibile.</p>';
}
