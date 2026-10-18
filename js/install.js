import {openModal} from './modal-flow.js';
// Modalita' app: installazione (Android/Chrome/Edge con il prompt del browser, iPhone con le istruzioni),
// service worker per l'uso senza rete e classi sull'<html> per adattare l'interfaccia al dispositivo.
const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true;
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
  // Il dialog segue l’area realmente visibile, anche con barre aperte o zoom.
  const invite = document.getElementById('install-invite');
  if (invite?.open) {
    invite.style.setProperty('--iv-height', `${h}px`);
    invite.style.setProperty('--iv-width', `${vv?.width || innerWidth}px`);
    invite.style.setProperty('--iv-top', `${vv?.offsetTop || 0}px`);
    invite.style.setProperty('--iv-left', `${vv?.offsetLeft || 0}px`);
  }
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

// --- Installazione: invito a tutto schermo con istruzioni per QUESTO telefono e browser -------------------
// Fonti verificate il 12/10/2026 (Apple, Google, sorgenti Chromium e Firefox): vedi docs/installazione.md.
// Safari 26+ congela la versione di iOS nel user agent a 18_x: la versione vera si legge da "Version/NN".
const IPAD_DESK = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
const IOS_THIRD = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
const IN_APP = /Instagram|FBAN|FBAV|FBIOS|FB_IAB|FB4A|musical_ly|BytedanceWebview|LinkedInApp|; wv\)/.test(ua)
  || (isIOS && !IOS_THIRD && !standalone() && !/Safari\//.test(ua));
function platform() {
  if (IN_APP) return { kind: 'inapp' };
  if (isIOS) {
    if (/CriOS/.test(ua)) return { kind: 'ios-chrome' };
    if (IOS_THIRD) return { kind: 'ios-other' };
    const v = +(ua.match(/Version\/(\d+)/)?.[1] || 0);
    return { kind: v >= 27 ? 'ios-27' : v === 26 ? 'ios-26' : 'ios-old', v, ipad: IPAD_DESK || /iPad/.test(ua) };
  }
  if (isAndroid) {
    if (/SamsungBrowser/.test(ua)) return { kind: 'and-samsung' };
    if (/EdgA/.test(ua)) return { kind: 'and-edge' };
    if (/Firefox\//.test(ua)) return { kind: 'and-firefox' };
    if (/Chrome\//.test(ua)) return { kind: 'and-chrome' };
    return { kind: 'and-other' };
  }
  if (/Edg\//.test(ua)) return { kind: 'desk-edge' };
  if (/Chrome\//.test(ua)) return { kind: 'desk-chrome' };
  if (/Firefox\//.test(ua)) return { kind: /Windows/.test(ua) ? 'desk-firefox-win' : 'desk-none' };
  if (/Safari\//.test(ua) && /Macintosh/.test(ua)) return { kind: 'desk-safari' };
  return { kind: 'desk-none' };
}
const P = platform();
const S = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  share: S('<path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/>'),
  pagemenu: S('<path d="M4 7h16M4 12h11M4 17h7"/>'),
  more: S('<circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/>'),
  kebab: S('<circle cx="12" cy="6" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="18" r="1.6" fill="currentColor"/>'),
  burger: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  add: S('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>'),
  toggle: S('<rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="16" cy="12" r="3.2" fill="currentColor"/>'),
  ok: S('<path d="m5 12 4.5 4.5L19 7"/>'),
  install: S('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 7v6M9 10l3 3 3-3M8 21h8"/>'),
  open: S('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
};
const step = (ic, html) => `<li><span class="iv-ic">${I[ic]}</span><span>${html}</span></li>`;
// La posizione delle barre non è rilevabile: descriviamo il controllo senza frecce sulla pagina.
function guide() {
  const iosDevice = P.ipad || IPAD_DESK || /iPad/.test(ua) ? 'iPad' : 'iPhone';
  const iosEnd = [step('add', 'Scorri e tocca <b>Aggiungi alla schermata Home</b> <small>(se non c\'è: in fondo, <b>Modifica azioni</b>)</small>')];
  const webApp = step('toggle', 'Lascia attivo <b>Apri come app web</b>, poi tocca <b>Aggiungi</b>');
  switch (P.kind) {
    case 'ios-27': return { title: `Su ${iosDevice}, in Safari`, steps: [
      step('pagemenu', 'Tocca <b>Menu della pagina</b>, a sinistra della barra dell\'indirizzo <small>Se vedi già l’icona Condividi, passa al punto successivo.</small>'), step('share', 'Tocca <b>Condividi</b>'), ...iosEnd, webApp] };
    case 'ios-26': return { title: `Su ${iosDevice}, in Safari`, steps: [
      step('more', 'Tocca <b>Altro</b> (•••) a destra della barra dell\'indirizzo <small>Se vedi già l’icona Condividi, passa al punto successivo.</small>'), step('share', 'Tocca <b>Condividi</b>'), ...iosEnd, webApp] };
    case 'ios-old': return { title: `Su ${iosDevice}, in Safari`, steps: [
      step('share', 'Tocca <b>Condividi</b> nella barra di Safari'), step('add', 'Scorri e tocca <b>Aggiungi alla schermata Home</b>'), step('ok', 'Tocca <b>Aggiungi</b>')] };
    case 'ios-chrome': return { title: `Su ${iosDevice}, in Chrome`, steps: [
      step('share', 'Tocca <b>Condividi</b>, a destra della barra dell\'indirizzo'), step('add', 'Tocca <b>Aggiungi alla schermata Home</b>'), step('ok', 'Tocca <b>Aggiungi</b>')] };
    case 'ios-other': return { title: `Su ${iosDevice}, nel browser`, steps: [
      step('share', 'Apri il menu del browser e tocca <b>Condividi</b>'), step('add', 'Tocca <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>')],
      note: 'Se non trovi la voce, apri la pagina in Safari: lì funziona sempre.' };
    case 'and-chrome': return { title: 'Su Android, in Chrome', steps: [
      step('kebab', 'Tocca <b>⋮</b> in alto a destra'), step('add', 'Tocca <b>Installa e crea scorciatoia</b> <small>(nelle versioni meno recenti: <b>Installa app</b> o <b>Aggiungi a schermata Home</b>)</small>'), step('install', 'Scegli <b>Installa</b>')] };
    case 'and-samsung': return { title: 'Su Android, in Samsung Internet', steps: [
      step('burger', 'Tocca <b>≡</b> in basso a destra'), step('add', 'Tocca <b>Aggiungi pagina a</b>, poi <b>Schermata Home</b>'), step('ok', 'Tocca <b>Aggiungi</b>')] };
    case 'and-firefox': return { title: 'Su Android, in Firefox', steps: [
      step('kebab', 'Tocca <b>⋮</b> (il menu di Firefox)'), step('add', 'Tocca <b>Aggiungi app alla schermata principale</b> <small>(se non la vedi, cercala sotto <b>Altro</b>)</small>'), step('ok', 'Conferma con <b>Aggiungi</b>')] };
    case 'and-edge': return { title: 'Su Android, in Edge', steps: [
      step('more', 'Tocca <b>…</b> in basso al centro'), step('add', 'Scorri e tocca <b>Aggiungi al telefono</b>'), step('install', 'Tocca <b>Installa</b>')] };
    case 'and-other': return { title: 'Su Android', steps: [
      step('kebab', 'Apri il menu del browser'), step('add', 'Cerca <b>Installa app</b> o <b>Aggiungi a schermata Home</b>')], note: 'Con Chrome è più semplice: apri lì questa pagina.' };
    case 'desk-chrome': return { title: 'Sul computer, in Chrome', steps: [
      step('install', 'Clicca l\'icona <b>Installa</b> a destra nella barra dell\'indirizzo'), step('kebab', 'Oppure: <b>⋮</b> → <b>Trasmetti, salva e condividi</b> → <b>Installa pagina come app…</b>')] };
    case 'desk-edge': return { title: 'Sul computer, in Edge', steps: [
      step('install', 'Clicca <b>App disponibile</b> nella barra dell\'indirizzo'), step('more', 'Oppure: <b>…</b> → <b>Applicazioni</b> → <b>Installa questo sito come app</b>')] };
    case 'desk-safari': return { title: 'Sul Mac, in Safari', steps: [
      step('share', 'Menu <b>File</b> → <b>Aggiungi al Dock</b> (o <b>Condividi</b> → <b>Aggiungi al Dock</b>)'), step('ok', 'Clicca <b>Aggiungi</b>')] };
    case 'desk-firefox-win': return { title: 'Sul computer, in Firefox', steps: [
      step('add', 'Clicca <b>Aggiungi scheda alla barra delle applicazioni</b> nella barra dell\'indirizzo')] };
    case 'inapp': return { inapp: true, title: 'Sei nel browser di un\'altra app', steps: [
      step('more', 'Tocca <b>⋯</b> o <b>⋮</b> in alto a destra'), step('open', `Scegli <b>Apri ${isIOS ? 'in Safari' : 'nel browser'}</b> <small>(o <b>Apri nel browser esterno</b>)</small>`), step('add', 'Da lì segui le istruzioni per installarla')],
      note: 'Da qui l\'app non si può installare. Se non trovi la voce, copia il link e incollalo nel browser.' };
    default: return null;
  }
}

export function initInstall() {
  addEventListener('fronda:legal-access',render);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname)) && !globalThis.FUNGAROLI_REVIEW && !globalThis.FUNGAROLI_DATA) {
    const register = () => navigator.serviceWorker.register('sw.js').then((reg) => {
      // l'app installata spesso viene solo ripresa dalla memoria, senza ricaricarsi: si controlla se c'e' una versione nuova
      // ogni volta che torna in primo piano e ogni mezz'ora (l'avviso "versione nuova" e' in refresh.js)
      const check = () => reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
      setInterval(check, 30 * 60e3);
    }).catch(() => { /* senza service worker l'app funziona lo stesso */ });
    // dopo l'evento load: alla prima visita il precache non contende la banda ai file dell'avvio (web.dev, «Service worker registration»)
    if (document.readyState === 'complete') register(); else addEventListener('load', register, { once: true });
  }
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; render(); });
  addEventListener('appinstalled', () => { deferred = null; markMode(); render(); document.getElementById('install-invite')?.close(); });
  render();
}

const LATER = 'fungaroli:install-later';
const embedded = () => !globalThis.FUNGAROLI_TEST_INSTALL && !!(globalThis.FUNGAROLI_REVIEW || globalThis.FUNGAROLI_DATA); // nelle copie di revisione niente invito (salvo test)
const dismissed = () => { try { return Date.now() - (+localStorage.getItem(KEY) || 0) < 30 * 864e5; } catch { return false; } };
const canOffer = () => !document.body.hasAttribute('data-legal-pending') && !standalone() && !embedded() && (!!deferred || !!guide());

function render() {
  const banner = document.getElementById('install-banner');
  const info = document.getElementById('install-info');
  if (info) {
    info.hidden = !canOffer();
    info.innerHTML = canOffer() ? `<h2>Installa l'app</h2><p class="small">Si apre a tutto schermo dalla schermata Home, senza la barra del browser, e mostra l'ultimo meteo scaricato anche dove non c'è campo.</p>
      <button type="button" class="btn primary big" data-install>Installa Fronda</button>` : '';
  }
  if (banner) {
    // banner solo su telefono e tablet: sul computer l'installazione resta in Info
    banner.hidden = !canOffer() || dismissed() || !(isIOS || isAndroid);
    banner.innerHTML = `<img src="assets/fronda-icon-192.png" alt="" width="44" height="44">
      <div><b>Fronda come app</b><span>A tutto schermo e anche senza campo</span></div>
      <button type="button" class="btn primary" data-install>Installa</button>
      <button type="button" class="ib-close" aria-label="Non ora">✕</button>`;
    banner.querySelector('.ib-close').onclick = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignora */ } banner.hidden = true; };
  }
  document.querySelectorAll('[data-install]').forEach((b) => { b.onclick = () => openInvite(true); });
}

// Invito a tutto schermo: a ogni nuova sessione finche' non e' installata, ma non piu' di una volta al giorno
export function maybeInvite() {
  // solo su telefono e tablet: sul computer si propone dal banner e da Info, senza interrompere
  if (!canOffer() || !(isIOS || isAndroid)) return;
  try {
    if (sessionStorage.getItem(LATER)) return;
    if (Date.now() - (+localStorage.getItem(LATER) || 0) < 20 * 3600e3) return;
  } catch { /* storage non disponibile: si mostra */ }
  // Chrome/Edge su Android annunciano l'installabilita' un attimo dopo: si aspetta un po' prima di decidere
  setTimeout(() => openInvite(false), deferred || !isAndroid ? 600 : 2500);
}

function openInvite(fromButton) {
  if (!canOffer()||document.querySelector('#onboarding[open]')||(!fromButton&&document.querySelector('dialog[open]:modal'))) return;
  let dlg = document.getElementById('install-invite');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'install-invite'; dlg.className = 'install-invite'; dlg.setAttribute('aria-labelledby', 'iv-title'); document.body.append(dlg); }
  const g = guide();
  const native = !!deferred && !g?.inapp;
  dlg.innerHTML = `<div class="iv-toolbar"><span>Installa Fronda</span><button type="button" class="iv-close" data-later aria-label="Chiudi le istruzioni di installazione">${S('<path d="m6 6 12 12M18 6 6 18"/>')}</button></div>
    <div class="iv-scroll"><div class="iv-in">
    <img class="iv-icon" src="assets/fronda-icon-192.png" alt="" width="84" height="84">
    <h2 id="iv-title" tabindex="-1">${g?.inapp ? 'Aprila nel browser,<br>poi installala' : 'Fronda è meglio<br>come app'}</h2>
    <ul class="iv-why">
      <li>Si apre in un tocco, a tutto schermo</li>
      <li>Nel bosco, senza campo, ti mostra l'ultimo meteo e le zone</li>
      <li>Niente barra del browser che ruba spazio alla mappa</li>
    </ul>
    ${native ? '<button type="button" class="btn primary big iv-go" data-native>Installa adesso</button>' : ''}
    ${g ? `<div class="iv-how${native ? ' alt' : ''}">${native ? '<p class="iv-or">Se non parte, a mano:</p>' : ''}<p class="iv-t">${g.title}</p><ol class="iv-steps">${g.steps.join('')}</ol>${g.note ? `<p class="iv-note">${g.note}</p>` : ''}
      ${g.inapp ? '<button type="button" class="btn big iv-copy" data-copy>Copia il link</button>' : ''}</div>` : ''}
    <button type="button" class="iv-later" data-later>${fromButton ? 'Chiudi' : 'Lo faccio dopo, intanto do un\'occhiata…'}</button>
  </div></div>`;
  dlg.querySelector('[data-native]')?.addEventListener('click', async () => {
    deferred.prompt();
    const r = await deferred.userChoice.catch(() => null);
    deferred = null;
    if (r?.outcome === 'accepted') dlg.close(); else render();
  });
  dlg.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); e.target.textContent = 'Link copiato'; } catch { e.target.textContent = location.host; }
  });
  const dismiss = () => {
    try { sessionStorage.setItem(LATER, '1'); localStorage.setItem(LATER, String(Date.now())); } catch { /* ignora */ }
    dlg.close();
  };
  dlg.querySelectorAll('[data-later]').forEach(button => button.addEventListener('click', dismiss));
  dlg.oncancel = event => { event.preventDefault(); dismiss(); };
  if (!dlg.open) openModal(dlg);
  trackViewport();
  dlg.querySelector('.iv-scroll').scrollTop = 0;
  dlg.querySelector('.iv-close').focus({ preventScroll: true });
}
