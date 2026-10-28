// Il tema è una preferenza del Taccuino; Automatico segue il dispositivo.
import { toast } from './refresh.js';
const KEY = 'fungaroli:theme';
const root = document.documentElement;
const MODES = ['light', 'dark', 'auto'];
const LABEL = { auto: 'Tema automatico, come il dispositivo', light: 'Tema chiaro', dark: 'Tema scuro' };
const preference = matchMedia('(prefers-color-scheme: dark)');
const BG = { light: '#f7f4ea', dark: '#10271f' };
const read = () => { try { const saved = localStorage.getItem(KEY); return MODES.includes(saved) ? saved : 'auto'; } catch { return 'auto'; } };
let mode = read();
function apply() {
  if (mode === 'auto') delete root.dataset.theme; else root.dataset.theme = mode;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    m.content = mode === 'auto' ? BG[m.media.includes('dark') ? 'dark' : 'light'] : BG[mode];
  });
  const select = document.getElementById('theme-select');
  if (select) select.value = mode;
  dispatchEvent(new Event('themechange'));
}
apply();
document.getElementById('theme-select')?.addEventListener('change', event => {
  const next = event.currentTarget.value;
  if (!MODES.includes(next)) return;
  mode = next;
  try { localStorage.setItem(KEY, mode); } catch { /* scelta valida per questa sessione */ }
  root.classList.add('theme-swap');
  apply();
  toast(`<span>${LABEL[mode]}</span>`, 1800, 'top');
  setTimeout(() => root.classList.remove('theme-swap'), 400);
});
preference.addEventListener('change', () => { if (mode === 'auto') apply(); });
addEventListener('storage', event => { if (event.key === KEY || event.key === null) { mode = read(); apply(); } });
