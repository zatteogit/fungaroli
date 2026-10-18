// Tema: automatico (predefinito, segue il dispositivo), chiaro o scuro.
// Un bottone piccolo nella barra in alto passa dall'uno all'altro e dice a quale sei passato.
import { toast } from './refresh.js';
const KEY = 'fungaroli:theme';
const root = document.documentElement;
const MODES = ['light', 'dark', 'auto'];
const LABEL = { auto: 'Tema automatico, come il telefono', light: 'Tema chiaro', dark: 'Tema scuro' };
const preference = matchMedia('(prefers-color-scheme: dark)');
const systemDark = () => preference.matches;
const ICON = {
  auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  dark: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
};
const BG = { light: '#f7f4ea', dark: '#10271f' };
// Senza una scelta valida si segue il tema del dispositivo.
const read = () => { try { const saved = localStorage.getItem(KEY); return MODES.includes(saved) ? saved : 'auto'; } catch { return 'auto'; } };

// Il primo tocco cambia sempre l’aspetto, anche partendo da Automatico.
// Il ciclo resta ancorato al tema visibile all’avvio, così Auto rimane il terzo passo.
let mode = read(), cycle, cycleIndex;
function resetCycle() {
  const visible = mode === 'auto' ? (systemDark() ? 'dark' : 'light') : mode;
  cycle = [visible, visible === 'light' ? 'dark' : 'light', 'auto'];
  cycleIndex = 0;
}
resetCycle();

function apply(mode) {
  if (mode === 'auto') delete root.dataset.theme; else root.dataset.theme = mode;
  // la barra del browser segue il tema scelto (in automatico tornano le due varianti per sistema)
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = mode === 'auto' ? BG[m.media.includes('dark') ? 'dark' : 'light'] : BG[mode];
  });
  const b = document.getElementById('theme-btn');
  if (b) { b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[mode]}</svg>`; const next = cycle[(cycleIndex + 1) % cycle.length]; b.title = `${LABEL[mode]}. Passa a: ${LABEL[next].toLowerCase()}`; b.setAttribute('aria-label', b.title); }
  dispatchEvent(new Event('themechange'));
}

apply(mode);
document.getElementById('theme-btn')?.addEventListener('click', () => {
  cycleIndex = (cycleIndex + 1) % cycle.length;
  const next = mode = cycle[cycleIndex];
  try { localStorage.setItem(KEY, next); } catch { /* resta per questa sessione */ }
  root.classList.add('theme-swap');
  apply(next);
  const b = document.getElementById('theme-btn');
  b?.classList.add('spin'); setTimeout(() => b?.classList.remove('spin'), 460);
  toast(`${b?.innerHTML || ''}<span>${next === 'auto' ? `Automatico (ora ${systemDark() ? 'scuro' : 'chiaro'})` : next === 'dark' ? 'Tema scuro' : 'Tema chiaro'}</span>`, 1800, 'top');
  setTimeout(() => root.classList.remove('theme-swap'), 400);
});

// Se cambia il dispositivo mentre siamo in Auto, il prossimo tocco cambia ancora aspetto.
preference.addEventListener('change', () => { if (mode === 'auto') { resetCycle(); apply(mode); } });
addEventListener('storage', e => { if (e.key === KEY || e.key === null) { mode = read(); resetCycle(); apply(mode); } });
