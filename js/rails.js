// Righe che scorrono di lato (giorni, filtri, card, sosia): con il mouse non basta la rotella,
// quindi ai bordi compaiono due frecce, solo quando c'e' altro da vedere in quella direzione.
// Nelle gallerie fotografiche le frecce cambiano invece la foto selezionata.
const SEL = '.days, .active-filters:not(.map-filters), .rail, .sp-strip, .tree-fungi, .cmp-pick, .filter-rail, .seg-nav';
const TOUCH_SEL = '.days, .rail, .sp-strip, .tree-fungi, .seg-nav';
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const CHEV = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const seen = new WeakSet();

function update(el, host) {
  const max = el.scrollWidth - el.clientWidth;
  const over = max > 4 && getComputedStyle(el).overflowX !== 'visible';
  host.style.setProperty('--rail-y', `${el.getBoundingClientRect().top - host.getBoundingClientRect().top + el.offsetHeight / 2}px`);
  const gallery=el.hasAttribute('data-inline-gallery');
  for(const [cls,hide,label] of [['rail-prev',!over||el.scrollLeft<=2,'Foto precedente'],['rail-next',!over||el.scrollLeft>=max-2,'Foto successiva']]){
    const button=host.querySelector(`.${cls}`);
    button.hidden=gallery?false:hide;
    button.tabIndex=gallery?0:-1;
    if(gallery)button.setAttribute('aria-label',label);
  }
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
    b.addEventListener('click', () => {
      if(el.hasAttribute('data-inline-gallery'))el.dispatchEvent(new CustomEvent('inline-gallery-step',{detail:dir}));
      else el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.75), behavior: reduce.matches ? 'auto' : 'smooth' });
    });
    host.append(b);
  }
  const up = () => update(el, host);
  el.addEventListener('scroll', up, { passive: true });
  new ResizeObserver(up).observe(el);
  new MutationObserver(up).observe(el, { childList: true, subtree: true, attributes:true, attributeFilter:['data-inline-gallery'] });
  up();
}

let t;
function scan() {
  clearTimeout(t);
  t = setTimeout(() => { document.querySelectorAll(fine.matches ? SEL : TOUCH_SEL).forEach(attach); }, 60);
}
new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
fine.addEventListener?.('change', scan);
scan();
