import { searchEdibleCatalog, seasonLabel, seasonStatus } from './edible-catalog.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// An editable combobox: keyboard focus remains in the input, options also work by touch.
export function mountSpeciesAutocomplete({ input, list, catalog, date, onSelect }) {
  let matches = [], active = -1;
  const select = (i) => { if (matches[i]) onSelect(matches[i]); };
  const highlight = () => {
    list.querySelectorAll('[role="option"]').forEach((n, i) => n.setAttribute('aria-selected', String(i === active)));
    if (active >= 0) {
      const option = list.querySelector(`[data-option="${active}"]`);
      input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({block:'nearest'});
    } else input.removeAttribute('aria-activedescendant');
  };
  const render = () => {
    matches = searchEdibleCatalog(catalog, input.value, { date }); active = -1;
    const queried = !!input.value.trim(); list.hidden = !queried;
    input.setAttribute('aria-expanded', String(queried));
    input.removeAttribute('aria-activedescendant');
    list.innerHTML = matches.map((s,i) => `<li role="presentation"><button type="button" role="option" id="${list.id}-option-${i}" data-option="${i}" aria-selected="false"><span><b>${esc(s.name)}</b><i>${esc(s.latin)}</i></span><span class="season-badge ${seasonStatus(s,date)==='out'?'season-out':''}">${seasonLabel(s,date)}</span></button></li>`).join('') || '<li role="presentation" class="small muted">Nessun commestibile nel catalogo con questo nome.</li>';
    list.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',()=>select(+b.dataset.option)));
  };
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!matches.length) return;
      active = active < 0 ? (e.key==='ArrowDown'?0:matches.length-1) : (active + (e.key==='ArrowDown'?1:-1) + matches.length) % matches.length; highlight();
    } else if (e.key==='Enter' && matches.length) { e.preventDefault(); select(active < 0 ? 0 : active); }
    else if (e.key==='Escape' && !list.hidden) { e.preventDefault(); e.stopPropagation(); input.value=''; render(); }
  });
  render();
}
