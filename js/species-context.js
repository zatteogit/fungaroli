import {factCards,monthCalendar} from './content-ui.js';
// Shared presentation for factual context and expandable notes on fungus pages.
const esc = value => String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const paths = {
  habitat: '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
  safety: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  notebook: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M3 7h4m-4 5h4m-4 5h4m6-10h3m-3 4h3"/>',
};
const glyph = name => `<svg class="species-context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;

export function speciesHabitat({habitat = '', trees = '', months = ''} = {}) {
  const facts = [
    habitat?.length && {icon:'pin',label:'Ambiente',...(Array.isArray(habitat)?{items:habitat}:{value:habitat}),wide:true},
    trees?.length && {icon:'leaf',label:'Alberi associati',...(Array.isArray(trees)?{items:trees}:{value:trees})},
    typeof months==='string' && months && {icon:'calendar',label:'Periodo indicativo',value:months},
  ].filter(Boolean);
  if (!facts.length && !months?.length) return '';
  return `<section class="species-habitat"><h3>Dove e quando</h3>${factCards(facts,{glossary:'Funghi'})}${Array.isArray(months)?monthCalendar(months):''}</section>`;
}

function contextNote({icon, title, preview, body, extraClass = ''}) {
  return `<details class="context-note species-context ${extraClass}"><summary>${glyph(icon)}<span class="species-context-heading"><b>${title}</b><span>${preview}</span></span></summary><div class="species-context-body">${body}</div></details>`;
}

export function speciesSafetyNote(copy = '') {
  return contextNote({icon:'safety', title:'Prima del consumo', preview:'Controllo micologico ASL · gratuito per i privati', extraClass:'species-safety', body:
    copy ? `<p>${esc(copy)}</p><a href="#/info">Regole ed emergenze →</a>` : '<p>Foto e caratteri non identificano un esemplare. La commestibilità descritta riguarda la specie, non il fungo raccolto.</p><p>Fai controllare tutto il raccolto all’Ispettorato micologico ASL: per i privati è gratuito. Chiedi anche le indicazioni di preparazione.</p><a href="#/info">Regole ed emergenze →</a>'});
}

export function speciesObservationContext(speciesId) {
  return `${contextNote({icon:'calendar', title:'Periodo indicativo', preview:'Non ancora validato nel Reatino', body:'<p>Clima e quota possono anticipare o ritardare la stagione indicata.</p>'})}
    <section class="species-observations" aria-label="Le tue osservazioni"><div class="species-observations-heading">${glyph('notebook')}<h3>Le tue osservazioni</h3></div><p>Anche una ricerca senza ritrovamenti è utile.</p><button class="btn ghost" type="button" data-report data-species="${esc(speciesId)}">Annota nel taccuino <span aria-hidden="true">→</span></button><small>Appunti privati. Scegli tu se condividere le osservazioni.</small></section>`;
}
