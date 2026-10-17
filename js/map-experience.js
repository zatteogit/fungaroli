// Mappa: controlli essenziali, risultati della sola area visibile e dettagli su richiesta.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mapQuery({ interests, day, count }) {
  const label = interests.length ? interests.join(' + ') : 'Esplora le zone';
  return `<button type="button" class="map-query" data-more aria-haspopup="dialog" aria-label="Filtri della mappa: ${esc(label)}${count ? `, ${count} filtri attivi` : ''}"><span class="map-query-copy"><small>Alla ricerca di…</small><b>${esc(label)}</b></span>${count ? `<span class="map-filter-count">${count}</span>` : ''}<span class="ui-icon ui-icon-chevron-right" aria-hidden="true"></span></button><button type="button" class="map-date" data-days aria-expanded="false" aria-controls="map-days" aria-label="Cambia giorno: ${esc(day)}">${esc(day)}<svg class="map-date-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>`;
}

export function mountMapResults(root, { choose, fit, filters }) {
  const host = document.createElement('details');
  host.id = 'map-results'; host.className = 'map-results';
  host.innerHTML = '<summary><span data-map-count aria-live="polite"></span><b>Elenco <span aria-hidden="true">⌃</span></b></summary><div class="map-results-body"><p class="map-results-order" data-map-order></p><ol data-map-rows></ol><p data-map-empty hidden></p><button type="button" class="btn ghost" data-map-fit>Mostra tutte le zone</button></div>';
  root.append(host);
  host.addEventListener('click', e => {
    const row = e.target.closest('[data-map-zone]');
    if (row) { host.open = false; choose(row.dataset.mapZone); }
    if (e.target.closest('[data-map-fit]')) fit();
    if (e.target.closest('[data-map-filters]')) filters();
  });
  host.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); host.open = false; host.querySelector('summary').focus(); } });
  return {
    host,
    render({ rows, total, order }) {
      const count = host.querySelector('[data-map-count]');
      const title = `${rows.length} ${rows.length === 1 ? 'zona' : 'zone'} nell’area`;
      if (count.textContent !== title) count.textContent = title;
      host.querySelector('[data-map-order]').textContent = order;
      const list = host.querySelector('[data-map-rows]');
      const html = rows.map(r => `<li><button type="button" data-map-zone="${esc(r.id)}"${r.selected ? ' aria-current="true"' : ''}><span class="map-result-name">${esc(r.name)}</span>${r.index ? `<span class="map-result-index">${r.index}</span>` : ''}<span class="map-result-meta">${esc(r.meta)}</span></button></li>`).join('');
      if (list.innerHTML !== html) { const top = host.querySelector('.map-results-body').scrollTop; list.innerHTML = html; host.querySelector('.map-results-body').scrollTop = top; }
      const empty = host.querySelector('[data-map-empty]'); empty.hidden = !!rows.length;
      empty.innerHTML = total ? 'Nessuna zona in quest’area. Sposta la carta o mostra tutte le zone.' : 'Nessuna zona corrisponde alle scelte. <button type="button" class="link-btn" data-map-filters>Rivedi i filtri</button>.';
      host.querySelector('[data-map-fit]').hidden = !total || rows.length === total;
    },
  };
}

// Gli stessi controlli e gli stessi eventi del filtro condiviso, con sezioni richiuse.
export function compactMapFilters(dialog) {
  const body = dialog.querySelector('.fp-body');
  if (!body) return;
  const wrap = (start, end, title) => {
    if (!start) return;
    const details = document.createElement('details'); details.className = 'map-filter-section';
    const summary = document.createElement('summary'); summary.textContent = title; details.append(summary);
    start.before(details);
    for (let node = start; node && node !== end;) { const next = node.nextSibling; details.append(node); node = next; }
  };
  const headings = [...body.querySelectorAll(':scope > h3')];
  const trails = headings.find(h => h.textContent === 'Sentieri');
  const practical = headings.find(h => h.textContent === 'Uscita');
  const species = body.querySelector(':scope > .species-search-label');
  wrap(species, trails, 'Quali specie');
  wrap(trails, practical, 'Tipo di sentiero');
  if (practical) { practical.textContent = 'Preferenze per l’elenco'; const note = document.createElement('p'); note.className = 'small muted'; note.textContent = 'Cambiano l’ordine delle zone. L’indice dei funghi resta invariato.'; practical.after(note); }
}
