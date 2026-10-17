// Un solo approfondimento principale aperto per scheda; i dettagli annidati restano nel loro contesto.
let groupId = 0;
const boundRoots = new WeakSet();
export function enhanceEntityAccordions(root) {
  root.classList.add('entity-accordion-root');
  const name = `fronda-entity-${++groupId}`;
  for (const detail of root.querySelectorAll('details')) {
    const parent = detail.parentElement.closest('details');
    if (parent && root.contains(parent)) continue;
    detail.dataset.entityAccordion = '';
    detail.name = name;
  }
  if (boundRoots.has(root)) return;
  boundRoots.add(root);
  // Anche sui browser che non supportano ancora i gruppi nativi di <details>.
  root.addEventListener('toggle', event => {
    const current = event.target;
    if (!current.matches('details[data-entity-accordion]') || !current.open) return;
    root.querySelectorAll('details[data-entity-accordion][open]').forEach(other => {
      if (other !== current && other.name === current.name) other.open = false;
    });
  }, true);
}
