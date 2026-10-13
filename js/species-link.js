// Link contestuale alla specie già identificata dal modello, senza dedurre nomi dal testo.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function speciesLink(species, label = species.name) {
  return `<a class="species-link" href="#/specie/${encodeURIComponent(species.id)}">${esc(label)}</a>`;
}
