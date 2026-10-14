// Ricerca contestuale dei cataloghi di Scopri: un campo nella pagina filtra la griglia,
// e sotto «Anche in…» dice dove altro compare la stessa parola (apre la ricerca generale già filtrata).
import { openSearch, hitsByKind } from './search.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const normText = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ');
// tutte le parole devono comparire in almeno uno dei campi
export const matchesQuery = (fields, q) => {
  const words = normText(q).split(/\s+/).filter(Boolean), hay = normText(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w));
};
export const searchFieldHtml = (label, placeholder) => `<label class="search-box catalog-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input type="search" data-catalog-search aria-label="${esc(label)}" autocomplete="off" enterkeyhint="search" placeholder="${esc(placeholder)}"></label>`;

export function renderAlsoIn(slot, q, ownKinds) {
  if (!slot) return;
  const groups = q.trim().length >= 2 ? hitsByKind(q, ownKinds) : [];
  slot.innerHTML = groups.length ? `<p class="also-in"><span>Anche in</span>${groups.map(([kind, label, n]) => `<button type="button" class="chip" data-also="${esc(kind)}">${esc(label)} <b>${n}</b></button>`).join('')}</p>` : '';
  slot.querySelectorAll('[data-also]').forEach((b) => b.addEventListener('click', () => openSearch(q, b.dataset.also)));
}
