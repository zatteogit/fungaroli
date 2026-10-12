// Ricarica "pulita": tocco sul logo quando sei gia' in home (funzione nascosta).
// Svuota le copie dell'app (non le mappe, non il diario), chiede al service worker di aggiornarsi,
// ricarica e al riavvio riscarica anche il meteo. Se arriva una versione nuova mentre l'app e' aperta, lo dice.
const FLAG = 'fungaroli:fresh';
const isHome = () => ['', '#', '#/'].includes(location.hash);

function toast(html, ms = 3200) {
  let t = document.getElementById('app-toast');
  if (!t) { t = document.createElement('div'); t.id = 'app-toast'; t.className = 'app-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.innerHTML = html;
  t.classList.add('on');
  clearTimeout(t._h);
  if (ms) t._h = setTimeout(() => t.classList.remove('on'), ms);
  return t;
}

export async function hardRefresh() {
  toast('<span class="spin" aria-hidden="true"></span>Ricarico l\'app…', 0);
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) || [];
    await Promise.all(regs.map((r) => r.update().catch(() => {})));
  } catch { /* niente service worker */ }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !k.includes('tiles')).map((k) => caches.delete(k)));
  } catch { /* cache non disponibile */ }
  try { sessionStorage.setItem(FLAG, String(Date.now())); } catch { /* privato */ }
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
  if (!a || !isHome()) return;
  e.preventDefault();
  hardRefresh();
});

// versione nuova presa dal service worker mentre l'app e' aperta (non al primo avvio)
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let shown = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (shown) return; shown = true;
    const t = toast('C\'è una versione nuova dell\'app <button type="button" class="link-btn">Ricarica</button>', 12000);
    t.querySelector('button')?.addEventListener('click', () => location.reload());
  });
}
