// Modalita' app: installazione (Android/Chrome/Edge con il prompt del browser, iPhone con le istruzioni),
// service worker per l'uso senza rete e classi sull'<html> per adattare l'interfaccia al dispositivo.
const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const KEY = 'fungaroli:install-dismissed';
let deferred = null;

const html = document.documentElement;
html.classList.toggle('is-ios', isIOS);
html.classList.toggle('is-android', isAndroid);
const markMode = () => html.classList.toggle('is-standalone', standalone());
markMode();
matchMedia('(display-mode: standalone)').addEventListener?.('change', markMode);

// Tastiera: area visibile reale in --vvh, classe kb-open mentre si scrive (la barra in basso si toglie di mezzo)
const isText = (el) => el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file', 'range'].includes(el.type)));
let tallest = { portrait: 0, landscape: 0 };
function trackViewport() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : innerHeight;
  const o = innerWidth > innerHeight ? 'landscape' : 'portrait';
  tallest[o] = Math.max(tallest[o], h, innerHeight);
  html.style.setProperty('--vvh', `${Math.round(h)}px`);
  const kb = isText(document.activeElement) && h < tallest[o] * 0.78;
  if (kb !== html.classList.contains('kb-open')) {
    html.classList.toggle('kb-open', kb);
    // il campo in cui si scrive sale in cima: sotto restano visibili i risultati
    if (kb && !document.activeElement.closest('dialog')) setTimeout(() => document.activeElement?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 60);
  }
}
window.visualViewport?.addEventListener('resize', trackViewport);
window.visualViewport?.addEventListener('scroll', trackViewport);
addEventListener('resize', trackViewport);
addEventListener('focusin', () => setTimeout(trackViewport, 250));
addEventListener('focusout', () => setTimeout(trackViewport, 100));
trackViewport();

export function initInstall() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname)) && !globalThis.FUNGAROLI_REVIEW && !globalThis.FUNGAROLI_DATA) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* senza service worker l'app funziona lo stesso */ });
  }
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; render(); });
  addEventListener('appinstalled', () => { deferred = null; markMode(); render(); });
  render();
}

const dismissed = () => { try { return Date.now() - (+localStorage.getItem(KEY) || 0) < 30 * 864e5; } catch { return false; } };
const canOffer = () => !standalone() && (deferred || isIOS);

function render() {
  const banner = document.getElementById('install-banner');
  const info = document.getElementById('install-info');
  if (info) {
    info.hidden = !canOffer();
    info.innerHTML = canOffer() ? `<h2>Installa l'app</h2><p class="small">Si apre a tutto schermo dalla schermata Home, senza la barra del browser, e mostra l'ultimo meteo scaricato anche dove non c'è campo.</p>
      <button type="button" class="btn primary big" data-install>Installa Fungaroli</button>` : '';
  }
  if (banner) {
    banner.hidden = !canOffer() || dismissed();
    banner.innerHTML = `<img src="assets/icon-192.png" alt="" width="44" height="44">
      <div><b>Fungaroli come app</b><span>A tutto schermo e anche senza campo</span></div>
      <button type="button" class="btn primary" data-install>Installa</button>
      <button type="button" class="ib-close" aria-label="Non ora">✕</button>`;
    banner.querySelector('.ib-close').onclick = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignora */ } banner.hidden = true; };
  }
  document.querySelectorAll('[data-install]').forEach((b) => { b.onclick = install; });
}

async function install() {
  if (deferred) {
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    render();
    return;
  }
  if (isIOS) document.getElementById('ios-install').showModal();
}
