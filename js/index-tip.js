// Spiegazione breve dell'indice: hover/focus per leggere, tap per tenerla aperta.
let tip, opener, pinned = false, timer;
const observer = new MutationObserver(() => { if (opener && !opener.isConnected) close(); });
function close() {
  clearTimeout(timer); observer.disconnect();
  if (tip?.showPopover && tip.matches(':popover-open')) tip.hidePopover();
  if (tip) { tip.hidden = true; tip.classList.remove('is-inline'); if (tip.parentElement !== document.body) document.body.append(tip); }
  opener?.setAttribute('aria-expanded','false'); opener?.removeAttribute('aria-describedby');
  opener = null; pinned = false;
}
function open(button, pin = false) {
  clearTimeout(timer);
  if (opener !== button) close();
  if (!tip) {
    tip = document.createElement('div'); tip.id = 'index-tip'; tip.className = 'index-tip';
    tip.setAttribute('role','tooltip'); tip.setAttribute('popover','manual');
    document.body.append(tip);
  }
  tip.textContent=button.dataset.indexKind==='growth'?'Quanto ambiente e meteo dei giorni precedenti favoriscono la crescita dei funghi. Non descrive il tempo dell’uscita e non garantisce ritrovamenti.':'Le condizioni dell’uscita uniscono il potenziale di crescita dei funghi al meteo previsto. Indicano bene periodo e bosco; sul giorno preciso il meteo aiuta poco, e non è ancora dimostrato (prova sul 2023–2025, in «Come calcoliamo»). Il maltempo abbassa il valore; senza meteo verificabile non mostriamo un numero. È una stima, non una garanzia di ritrovamento o sicurezza.';
  opener = button; pinned ||= pin;
  button.setAttribute('aria-expanded','true'); button.setAttribute('aria-describedby',tip.id);
  tip.hidden = false;
  // Le etichette «Condizioni … 0–10» aprono la spiegazione nel flusso, sotto l'etichetta: sposta il contenuto invece
  // di coprirlo (nel riquadro della mappa la bolla flottante copriva le card che spiega). Gli anelli restano flottanti.
  if (button.classList.contains('index-legend')) {
    if (tip.matches?.(':popover-open')) tip.hidePopover();
    tip.classList.add('is-inline'); tip.style.left = tip.style.top = '';
    button.after(tip);
    tip.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  } else {
    tip.classList.remove('is-inline');
    if (tip.parentElement !== document.body) document.body.append(tip);
    if (tip.showPopover && !tip.matches(':popover-open')) tip.showPopover();
    position();
  }
  observer.observe(button.closest('#detail, #hero') || document.body,{childList:true,subtree:true});
}
function position() {
  if (tip.classList.contains('is-inline')) return;
  const r = opener.getBoundingClientRect(), p = tip.getBoundingClientRect();
  tip.style.left = `${Math.max(12,Math.min(innerWidth-p.width-12,r.right-p.width))}px`;
  tip.style.top = `${r.bottom+p.height+8<=innerHeight-12?r.bottom+8:Math.max(12,r.top-p.height-8)}px`;
}
document.addEventListener('click', e => {
  const button = e.target.closest?.('[data-index-tip]');
  if (button) { e.preventDefault(); e.stopPropagation(); if (opener===button && pinned) close(); else open(button,true); }
  else if (!tip?.contains(e.target)) close();
},true);
document.addEventListener('pointerover', e => {
  if (e.pointerType!=='mouse' || !matchMedia('(hover:hover)').matches) return;
  const button = e.target.closest?.('[data-index-tip]');
  if (button) open(button); else if (tip?.contains(e.target)) clearTimeout(timer);
});
document.addEventListener('pointerout', e => {
  if (!opener || pinned || document.activeElement===opener) return;
  if ((opener.contains(e.target) || tip?.contains(e.target)) && !opener.contains(e.relatedTarget) && !tip?.contains(e.relatedTarget)) timer=setTimeout(close,160);
});
document.addEventListener('focusin', e => { if (e.target.matches?.('[data-index-tip]')) open(e.target); });
document.addEventListener('focusout', e => { if (e.target===opener) close(); });
document.addEventListener('keydown', e => { if (e.key==='Escape' && opener) { e.preventDefault(); close(); } });
addEventListener('hashchange',close); addEventListener('resize',close);
addEventListener('scroll',() => {
  if (!opener) return;
  const r = opener.getBoundingClientRect();
  if (r.bottom<=0 || r.top>=innerHeight) close(); else position();
},true);
