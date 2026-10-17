// Righe che scorrono di lato (giorni, filtri, card, sosia): con il mouse non basta la rotella,
// quindi ai bordi compaiono due frecce, solo quando c'e' altro da vedere in quella direzione.
const SEL = '.days, .active-filters, .rail, .sp-strip, .tree-fungi, .cmp-pick, .filter-rail';
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const CHEV = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const seen = new WeakSet();

function update(el, host) {
  const max = el.scrollWidth - el.clientWidth;
  const over = max > 4 && getComputedStyle(el).overflowX !== 'visible';
  host.style.setProperty('--rail-y', `${el.getBoundingClientRect().top - host.getBoundingClientRect().top + el.offsetHeight / 2}px`);
  host.querySelector('.rail-prev').hidden = !over || el.scrollLeft <= 2;
  host.querySelector('.rail-next').hidden = !over || el.scrollLeft >= max - 2;
}

function attach(el) {
  if (seen.has(el)) return;
  seen.add(el);
  const host = document.createElement('div');
  host.className = 'rail-host';
  el.before(host);
  host.append(el);
  for (const [cls, dir, label, d] of [['rail-prev', -1, 'Scorri indietro', 'M15 5 8 12l7 7'], ['rail-next', 1, 'Scorri avanti', 'M9 5l7 7-7 7']]) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `rail-arrow ${cls}`; b.hidden = true; b.setAttribute('aria-label', label); b.tabIndex = -1;
    b.innerHTML = CHEV(d);
    b.addEventListener('click', () => el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.75), behavior: reduce.matches ? 'auto' : 'smooth' }));
    host.append(b);
  }
  const up = () => update(el, host);
  el.addEventListener('scroll', up, { passive: true });
  new ResizeObserver(up).observe(el);
  new MutationObserver(up).observe(el, { childList: true, subtree: true });
  up();
}

let t;
function scan() {
  clearTimeout(t);
  t = setTimeout(() => { if (fine.matches) document.querySelectorAll(SEL).forEach(attach); }, 60);
}
new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
fine.addEventListener?.('change', scan);
scan();
