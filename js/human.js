// Fattore umano: alba e orari di raccolta, festivi, affollamento stimato, comodità di accesso.
// Tutto qui e' EURISTICA dichiarata: non esistono studi sull'affollamento dei boschi reatini.
// Fatti: orari di raccolta (L.R. Lazio 32/98: da 1 h prima dell'alba a 1 h dopo il tramonto),
// calendario dei festivi, posizione del sole (algoritmo NOAA, errore ~1-2 min).

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// Alba e tramonto (UTC Date) per una data locale YYYY-MM-DD.
export function sunTimes(dateStr, lat, lon) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const n = Math.floor((d - start) / 864e5) + 1;
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = Math.acos(Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl));
  const mid = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const rise = 720 - 4 * (lon + deg(ha)) - eq;
  const set = 720 - 4 * (lon - deg(ha)) - eq;
  return { sunrise: new Date(mid + rise * 6e4), sunset: new Date(mid + set * 6e4) };
}

export const fmtTime = (date) => date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

// Pasqua (algoritmo di Meeus/Jones/Butcher)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}

export function holidayName(dateStr) {
  const [y, mo, da] = dateStr.split('-').map(Number);
  const fixed = {
    '01-01': 'Capodanno', '01-06': 'Epifania', '04-25': 'Liberazione', '05-01': 'Festa del lavoro', '06-02': 'Festa della Repubblica',
    '08-15': 'Ferragosto', '11-01': 'Ognissanti', '12-04': 'Santa Barbara (patrona di Rieti)', '12-08': 'Immacolata', '12-25': 'Natale', '12-26': 'Santo Stefano',
  };
  const key = `${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
  if (fixed[key]) return fixed[key];
  const em = new Date(easter(y).getTime() + 864e5);
  if (em.getUTCMonth() + 1 === mo && em.getUTCDate() === da) return 'Pasquetta';
  return null;
}

// Peso del giorno: quanta gente esce a funghi (euristica).
export function dayFactor(dateStr) {
  if (holidayName(dateStr)) return { f: 1, label: holidayName(dateStr) };
  const wd = new Date(dateStr + 'T12:00:00').getDay(); // 0 = domenica
  return [
    { f: 1, label: 'domenica' }, { f: 0.45, label: 'lunedì' }, { f: 0.35, label: 'martedì' }, { f: 0.35, label: 'mercoledì' },
    { f: 0.4, label: 'giovedì' }, { f: 0.55, label: 'venerdì' }, { f: 0.95, label: 'sabato' },
  ][wd];
}

// Affollamento atteso 0-1.
// popularity: notorieta' della zona (0-1, in zones.json); comfort: facilita' d'accesso (0-1);
// scores: indice della zona nei giorni fino a d (ultimo = d), per capire se la "buttata" e' nota.
export function crowding({ dateStr, popularity = 0.5, comfort = 0.7, scores = [], rainMm = 0 }) {
  const day = dayFactor(dateStr);
  const last = scores.slice(-7);
  const goodDays = last.filter((s) => s >= 45).length;
  const buzz = clamp(goodDays / 4);
  const now = last[last.length - 1] ?? 0;
  const before = last[last.length - 3] ?? now;
  const fresh = now >= 45 && before < 30; // buttata appena partita: pochi lo sanno
  let c = popularity * day.f * (0.45 + 0.55 * buzz) * (0.6 + 0.4 * comfort);
  if (fresh) c *= 0.7;
  if (rainMm >= 5) c *= 0.6; // con la pioggia esce meno gente
  c = clamp(c);
  return { value: c, level: c >= 0.5 ? 'alto' : c >= 0.25 ? 'medio' : 'basso', day, buzz, fresh, goodDays };
}

// Comodità 0-1 dai minuti d'auto, dai metri a piedi fino al bosco adatto e dal fondo dell'ultimo tratto.
export function comfortScore({ driveMin = 45, walkM = 500, surface = 0, unpavedKm = 0 }) {
  const fDrive = clamp(1 - (driveMin - 20) / 150, 0.4, 1);
  const fWalk = clamp(1 - walkM / 2500, 0.3, 1);
  const fSurf = [1, 0.85, 0.7][surface ?? 0] ?? 0.85;
  const fUnp = clamp(1 - unpavedKm / 12, 0.6, 1);
  const v = fDrive * fWalk * fSurf * fUnp;
  return { value: v, level: v >= 0.7 ? 'comodo' : v >= 0.45 ? 'medio' : 'impegnativo' };
}

// Consiglio d'orario e tattiche contro la folla.
export function timingAdvice({ dateStr, lat, lon, crowd }) {
  const { sunrise, sunset } = sunTimes(dateStr, lat, lon);
  const legal = new Date(sunrise.getTime() - 3600e3);
  const end = new Date(sunset.getTime() + 3600e3);
  let arrive, why;
  if (crowd.level === 'alto') {
    arrive = legal;
    why = 'Giornata affollata: chi arriva per primo trova i funghi nati nella notte.';
  } else if (crowd.level === 'medio') {
    arrive = sunrise;
    why = 'Affollamento medio: arrivare con la luce del mattino ti mette davanti alla maggior parte dei cercatori.';
  } else {
    arrive = new Date(sunrise.getTime() + 2 * 3600e3);
    why = 'Poca concorrenza prevista: puoi partire con calma.';
  }
  return { sunrise, sunset, legal, end, arrive, why };
}

// "intorno ai 1100 m" ma "intorno agli 800 m": l'articolo segue la pronuncia del numero
// (otto-, ottanta, ottocento, ottomila e undici iniziano per vocale).
export const intornoA = (m) => `intorno ${/^8/.test(String(Math.round(m))) || Math.round(m) === 11 ? 'agli' : 'ai'}`;
