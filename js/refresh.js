// Ricarica "pulita": tocco sul logo, da qualunque pagina (funzione nascosta): torna in home e ricarica tutto.
// Svuota le copie dell'app (non le mappe, non il diario), chiede al service worker di aggiornarsi,
// ricarica e al riavvio riscarica anche il meteo. Se arriva una versione nuova mentre l'app e' aperta, lo dice.
const FLAG = 'fungaroli:fresh';
// ogni passo ha un tempo massimo: su Safari l'aggiornamento del service worker a volte non risponde mai
const within = (p, ms) => Promise.race([Promise.resolve(p).catch(() => {}), new Promise((r) => setTimeout(r, ms))]);

export function toast(html, ms = 3200, placement = 'bottom', { countdown = false } = {}) {
  let t = document.getElementById('app-toast');
  if (!t) { t = document.createElement('div'); t.id = 'app-toast'; t.className = 'app-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.classList.toggle('app-toast-top', placement === 'top');
  t._stop?.();
  t.innerHTML = html;
  t.classList.add('on');
  clearTimeout(t._h);
  const hide = () => { t._stop?.(); t.classList.remove('on'); };
  // con il conto alla rovescia: barra che si svuota, pausa sotto il dito o col focus, chiusura a mano
  t.classList.toggle('has-timer', !!(countdown && ms));
  if (countdown && ms) {
    t.style.setProperty('--toast-ms', `${ms}ms`);
    t.insertAdjacentHTML('beforeend', '<button type="button" class="toast-close" aria-label="Chiudi avviso">×</button><span class="toast-timer" aria-hidden="true"></span>');
    t.querySelector('.toast-close').onclick = hide;
    let left = ms, since = Date.now(), paused = false;
    const pause = () => { if (paused) return; paused = true; clearTimeout(t._h); left -= Date.now() - since; t.classList.add('paused'); };
    const resume = () => { if (!paused || t.matches(':hover,:focus-within')) return; paused = false; since = Date.now(); t.classList.remove('paused'); t._h = setTimeout(hide, Math.max(left, 0)); };
    const events = [['pointerenter', pause], ['focusin', pause], ['pointerleave', resume], ['focusout', () => setTimeout(resume)]];
    events.forEach(([e, f]) => t.addEventListener(e, f));
    t._stop = () => { clearTimeout(t._h); events.forEach(([e, f]) => t.removeEventListener(e, f)); t.classList.remove('paused'); t._stop = null; };
    t._h = setTimeout(hide, ms);
  } else if (ms) t._h = setTimeout(hide, ms);
  return t;
}

export async function hardRefresh() {
  toast('<span class="spin" aria-hidden="true"></span>Ricarico l\'app…', 0);
  try {
    const regs = (await within(navigator.serviceWorker?.getRegistrations(), 800)) || [];
    await within(Promise.all(regs.map((r) => r.update().catch(() => {}))), 1500);
  } catch { /* niente service worker */ }
  try {
    const keys = (await within(globalThis.caches?.keys(), 800)) || [];
    await within(Promise.all(keys.filter((k) => !k.includes('tiles')).map((k) => caches.delete(k))), 1500);
  } catch { /* cache non disponibile */ }
  try { sessionStorage.setItem(FLAG, String(Date.now())); } catch { /* privato */ }
  // in home e da capo (replace: il tasto indietro non torna alla pagina prima della ricarica)
  location.replace(`${location.pathname}${location.search}#/`);
  location.reload();
}

// al riavvio dopo una ricarica pulita: il meteo va riscaricato anche se la copia ha meno di un'ora
export function consumeFresh() {
  try { const v = sessionStorage.getItem(FLAG); if (v) { sessionStorage.removeItem(FLAG); return true; } } catch { /* privato */ }
  return false;
}
export const freshDone = () => toast('App ricaricata: file e meteo appena scaricati');

document.addEventListener('click', (e) => {
  const a = e.target.closest('.brand');
  if (!a) return;
  e.preventDefault();
  hardRefresh();
});

// versione nuova presa dal service worker mentre l'app e' aperta (non al primo avvio)
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let shown = false;
  // la pagina arriva prima dalla rete: spesso e' gia' la versione nuova e il cambio di service worker
  // avviene subito dopo il caricamento. L'avviso serve solo se la versione del nuovo worker e' diversa da questa.
  const mine = document.querySelector('meta[name="app-version"]')?.content || '';
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    if (shown) return;
    const next = await fetch('sw.js', { cache: 'no-store' }).then((r) => r.text()).then((t) => t.match(/fungaroli-shell-v\d+/)?.[0] || '').catch(() => '');
    if (shown || !next || next === mine) return;
    shown = true;
    const t = toast('C\'è una versione nuova dell\'app <button type="button" class="link-btn">Ricarica</button>', 12000);
    t.querySelector('button')?.addEventListener('click', () => location.reload());
  });
}
