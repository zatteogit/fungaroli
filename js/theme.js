// Tema: automatico (segue il telefono), chiaro o scuro. Un bottone piccolo nella barra in alto passa dall'uno all'altro.
const KEY = 'fungaroli:theme';
const root = document.documentElement;
const MODES = ['auto', 'light', 'dark'];
const LABEL = { auto: 'Tema automatico, come il telefono', light: 'Tema chiaro', dark: 'Tema scuro' };
const ICON = {
  auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  dark: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
};
const BG = { light: '#f3efe7', dark: '#0f110d' };
const read = () => { try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; } };

function apply(mode) {
  if (mode === 'auto') delete root.dataset.theme; else root.dataset.theme = mode;
  // la barra del browser segue il tema scelto (in automatico tornano le due varianti per sistema)
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = mode === 'auto' ? BG[m.media.includes('dark') ? 'dark' : 'light'] : BG[mode];
  });
  const b = document.getElementById('theme-btn');
  if (b) { b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[mode]}</svg>`; b.title = `${LABEL[mode]} (tocca per cambiare)`; b.setAttribute('aria-label', `${LABEL[mode]}. Cambia tema`); }
  dispatchEvent(new Event('themechange'));
}

apply(read());
document.getElementById('theme-btn')?.addEventListener('click', () => {
  const next = MODES[(MODES.indexOf(read()) + 1) % MODES.length];
  try { localStorage.setItem(KEY, next); } catch { /* resta per questa sessione */ }
  root.classList.add('theme-swap');
  apply(next);
  setTimeout(() => root.classList.remove('theme-swap'), 400);
});
