// Fattore umano: alba e orari di raccolta, festivi, affollamento stimato, comodità di accesso.
// Tutto qui e' EURISTICA dichiarata: non esistono studi sull'affollamento dei boschi reatini.
// Fatti: orari di raccolta (L.R. Lazio 32/98: da 1 h prima dell'alba a 1 h dopo il tramonto),
// calendario dei festivi, posizione del sole (algoritmo NOAA, errore ~1-2 min).
import { dinHours } from './walks.js';
import { PARAMS } from './model.js';

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

export const fmtTime = (date) => date.toLocaleTimeString('it-IT', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Rome' });
// orari "umani": nessuno va a funghi alle 06:22. step in minuti; mode 'floor' (prima), 'ceil' (dopo), 'round'
export function roundTime(date, step = 15, mode = 'round') {
  const ms = step * 6e4, f = mode === 'floor' ? Math.floor : mode === 'ceil' ? Math.ceil : Math.round;
  return new Date(f(date.getTime() / ms) * ms);
}
export const fmtRough = (date, step = 15, mode = 'round') => fmtTime(roundTime(date, step, mode));

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

// Comodità 0-1 dai minuti d'auto, dai metri a piedi fino al bosco adatto e dal fondo della strada del punto d'accesso.
// walkM: metri equivalenti a piedi (walkEqM, dal 16/10/2026) oppure, senza data/access-info.json, metri in linea d'aria.
export function comfortScore({ driveMin = 45, walkM = 500, surface = 0, unpavedKm = 0 }) {
  const fDrive = clamp(1 - (driveMin - 20) / 150, 0.4, 1);
  const fWalk = clamp(1 - walkM / 2500, 0.3, 1);
  const fSurf = [1, 0.85, 0.7][surface ?? 0] ?? 0.85;
  const fUnp = clamp(1 - unpavedKm / 12, 0.6, 1);
  const v = fDrive * fWalk * fSurf * fUnp;
  return { value: v, level: v >= 0.7 ? 'comodo' : v >= 0.45 ? 'medio' : 'impegnativo' };
}

// Finestra della raccolta consentita (L.R. Lazio 32/1998, art. 9, c. 1: vietata «da un'ora dopo il tramonto
// a un'ora prima della levata del sole»).
export function collectWindow(dateStr, lat, lon) {
  const { sunrise, sunset } = sunTimes(dateStr, lat, lon);
  return { sunrise, sunset, legal: new Date(sunrise.getTime() - 3600e3), end: new Date(sunset.getTime() + 3600e3) };
}

// Consiglio d'orario e tattiche contro la folla.
export function timingAdvice({ dateStr, lat, lon, crowd }) {
  const { sunrise, sunset, legal, end } = collectWindow(dateStr, lat, lon);
  let arrive, why;
  if (crowd.level === 'alto') {
    arrive = roundTime(legal, 15, 'ceil'); // mai prima dell'apertura della raccolta
    why = 'Giornata che stimiamo affollata: arrivare all’apertura può evitare parcheggi pieni e sentieri frequentati. A quell’ora è ancora buio: porta una luce.';
  } else if (crowd.level === 'medio') {
    arrive = sunrise;
    why = 'Affollamento medio stimato: arrivare con la prima luce può evitare le ore più frequentate.';
  } else {
    arrive = new Date(sunrise.getTime() + 2 * 3600e3);
    why = 'Poca concorrenza prevista: puoi partire con calma.';
  }
  return { sunrise, sunset, legal, end, arrive, why };
}

// ---- Orologio dell'uscita (audit OUT-03) ----
// Dalle 14, ora italiana, l'uscita del mattino di oggi è andata: la finestra meteo dell'uscita finisce alle 13
// (js/outing.js). È la soglia che la mappa usava già per il suo giorno: non è una soglia nuova.
export const TODAY_CUTOFF_H = 14;
const romeParts = (now) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Rome' })
  .formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, +p.value]));
export const romeHour = (now = new Date()) => romeParts(now).hour;
export const todayGone = (now = new Date()) => romeHour(now) >= TODAY_CUTOFF_H;
// Giorno proposto quando non è indicato (mappa, link senza giorno, settimana in home): oggi o domani.
export const defaultDayOffset = (now = new Date()) => (todayGone(now) ? 1 : 0);
// Millisecondi alla prossima soglia del giorno (le 14 o la mezzanotte, ora italiana). Nei giorni del cambio
// d'ora può sbagliare di un'ora: chi lo usa ricontrolla lo stato quando scatta.
export function msToNextDayChange(now = new Date()) {
  const { hour, minute, second } = romeParts(now);
  const target = hour < TODAY_CUTOFF_H ? TODAY_CUTOFF_H : 24;
  return ((target - hour) * 3600 - minute * 60 - second) * 1000 - (now.getTime() % 1000);
}
export const addDays = (dateStr, n) => new Date(Date.parse(dateStr + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);

// Gli orari si mostrano arrotondati per difetto (arrivo al quarto d'ora, fine della raccolta ai 5 minuti):
// lo stato si decide sugli stessi valori, così l'orario mostrato non è mai già passato.
export const shownArrive = (t) => roundTime(t.arrive, 15, 'floor');
export const shownEnd = (t) => roundTime(t.end, 5, 'floor');
// 'ok' prima dell'arrivo consigliato; 'tardi' fino alla fine della raccolta consentita; poi 'chiuso'.
// Per i giorni futuri è sempre 'ok'.
export function timingState(t, now = new Date()) {
  return now < shownArrive(t) ? 'ok' : now < shownEnd(t) ? 'tardi' : 'chiuso';
}
// Partenza dalla base per arrivare entro l'orario consigliato (minuti d'auto più 10 di margine, come prima).
// 'at': partenza futura (at = orario arrotondato per difetto, mai già passato); 'now': parti adesso;
// 'late': non si arriva più entro l'orario consigliato.
export function departureAdvice(t, minutes, now = new Date()) {
  if (!Number.isFinite(minutes)) return null;
  const dep = new Date(shownArrive(t).getTime() - (minutes + 10) * 6e4);
  if (dep <= now) return { kind: 'late', dep };
  const at = roundTime(dep, 15, 'floor');
  return at <= now ? { kind: 'now', dep } : { kind: 'at', dep, at };
}

// "intorno ai 1100 m" ma "intorno agli 800 m": l'articolo segue la pronuncia del numero
// (otto-, ottanta, ottocento, ottomila e undici iniziano per vocale).
export const intornoA = (m) => `intorno ${/^8/.test(String(Math.round(m))) || Math.round(m) === 11 ? 'agli' : 'ai'}`;

// ---- Punto d'accesso e ultimo tratto a piedi (data/access-info.json, decisione del 16/10/2026) ----
// Il file (tools/build_access_info.py) dà per ogni campione di bosco di habitat.json il punto più vicino su una
// strada percorribile in auto che non sia una pista (Valhalla /locate su OpenStreetMap), il percorso a piedi sulla
// rete mappata (Valhalla /route pedestrian), il tratto fuori rete e salita/discesa dal DEM TINITALY 1.1.
// Nessuna di queste informazioni entra nell'indice biologico: servono a proporre il punto e a stimare la comodità.
export const ACCESS_FIELDS = ['strada_m', 'strada_lat', 'strada_lon', 'fondo', 'classe', 'uso', 'strada', 'pista_m', 'quota_strada', 'dislivello', 'piedi_m', 'fuori_rete_m', 'salita_m', 'discesa_m'];
export function accessFieldIndex(info) {
  const f = info?.fields;
  if (!Array.isArray(f)) return null;
  const idx = Object.fromEntries(ACCESS_FIELDS.map((n) => [n, f.indexOf(n)]));
  return Object.values(idx).every((k) => k >= 0) ? idx : null;
}
// Riga di un campione come oggetto (null: campione fuori bosco o senza strada valida). roads: zones.<id>.strade.
export function accessRow(raw, idx, roads = []) {
  if (!Array.isArray(raw) || !idx) return null;
  const v = (k) => raw[idx[k]];
  if (!Number.isFinite(v('strada_m'))) return null;
  const net = Number.isFinite(v('piedi_m')) ? v('piedi_m') : null, off = Number.isFinite(v('fuori_rete_m')) ? v('fuori_rete_m') : null;
  return { airM: v('strada_m'), rlat: v('strada_lat'), rlon: v('strada_lon'), surface: v('fondo') ?? null,
    road: v('strada') >= 0 ? roads[v('strada')] ?? null : null, trackM: Number.isFinite(v('pista_m')) ? v('pista_m') : null,
    roadEle: v('quota_strada'), dh: v('dislivello'), netM: net, offM: off,
    routeM: net == null ? null : net + (off || 0), up: v('salita_m') ?? null, down: v('discesa_m') ?? null };
}

// Tempo a piedi secondo il riferimento DIN 33466 (js/walks.js, dinHours: lunghezza del percorso, salita e discesa)
// convertito in metri equivalenti a 4 km/h, la velocità in piano della stessa norma: così f_piedi = 1 − metri/2500
// in comfortScore non cambia forma (in piano e senza salita i metri restano gli stessi). EURISTICA dichiarata
// (decisione del 16/10/2026): la norma dà tempi da cartello per chi cammina su sentiero, non per chi cerca funghi.
export const walkEqM = (routeM, up = 0, down = 0) => dinHours((routeM || 0) / 1000, up || 0, down || 0) * 4000;
// Metri equivalenti di una riga: percorso mappato più tratto fuori rete; senza percorso, la linea d'aria con il dislivello.
export function rowWalkEqM(a) {
  if (a.routeM != null) return walkEqM(a.routeM, a.up, a.down);
  const dh = a.dh || 0;
  return walkEqM(a.airM, Math.max(dh, 0), Math.max(-dh, 0));
}

// Scelta del punto d'accesso per la specie e la fascia dell'indice.
// Campioni candidati: affinità del bosco ≥ 0,6, quota della specie ±50 m (regole di prima); prima quelli entro
// ±150 m dalla fascia, poi gli altri (fuori fascia, segnalati con outOfBand: prima i più vicini in quota alla fascia,
// poi i più comodi; prima del 16/10/2026 contava solo la comodità). Esclusi i campioni in una zona dove
// il piano di un parco esclude la raccolta (excluded(i) → regola o null): restano nell'indice, non si propongono.
// Costo: con access-info, metri equivalenti DIN + 300 × fondo; senza (file assente o non allineato), metri in linea
// d'aria dall'arco più vicino di habitat.json + 300 × fondo, come prima del 16/10/2026. Il peso 300 del fondo è
// l'euristica già in uso. Con access-info i campioni senza riga (fuori bosco) non si propongono: il loro punto
// strada non è verificato e potrebbe essere una pista.
// rows: (i) => riga di accessRow, oppure null se il file non vale per la zona.
export function chooseAccess({ hab, sp, band, rows = null, excluded = () => null, half = PARAMS.bandHalfWidth }) {
  if (!hab?.samples?.[0] || hab.samples[0].length < 5 || !sp?.forest) return null;
  let bestIn = null, bestOut = null, n = 0, far = 0;
  hab.samples.forEach((smp, i) => {
    const [e, c, lat, lon, dist, surf, ri, rlat, rlon] = smp;
    const cat = c >= 0 ? hab.sample_categories[c] : 'non bosco';
    if ((sp.forest[cat] || 0) < 0.6) return;
    if (!Number.isFinite(e) || e < sp.elev[0] - 50 || e > sp.elev[1] + 50) return;
    if (excluded(i)) return;
    const inBand = Math.abs(e - band) <= half;
    let a;
    if (rows) {
      const r = rows(i);
      if (!r) return;
      a = { ...r, walkM: rowWalkEqM(r), source: 'access-info' };
    } else {
      if (dist == null) return;
      a = { airM: dist, walkM: dist, surface: surf || 0, road: ri >= 0 ? hab.road_names?.[ri] ?? null : null, rlat, rlon, source: 'habitat' };
    }
    // bosco adatto lontano dalle strade (meno battuto): stessa distanza in linea d'aria del punto proposto
    if (inBand) { n++; if (a.airM > 600) far++; }
    const cost = a.walkM + 300 * (a.surface || 0);
    // fuori fascia conta prima la quota: la scelta consentita più vicina alla fascia dell'indice, a passi di 50 m
    // (euristica: le condizioni cambiano con la quota più che con qualche centinaio di metri di cammino)
    const gap = inBand ? 0 : Math.ceil((Math.abs(e - band) - half) / 50);
    const cand = { ...a, i, e, cat, lat, lon, cost, gap, outOfBand: !inBand };
    if (inBand) { if (!bestIn || cost < bestIn.cost) bestIn = cand; }
    else if (!bestOut || gap < bestOut.gap || (gap === bestOut.gap && cost < bestOut.cost)) bestOut = cand;
  });
  const best = bestIn || bestOut;
  return best ? { ...best, farShare: n ? far / n : 0 } : null;
}

// ---- Frasi del punto d'accesso ----
// Euristiche dichiarate, servono solo a scegliere la frase (i numeri si mostrano sempre tutti):
// - ROADSIDE_M: sotto i 50 m il bosco è «a bordo strada» (soglia già in uso nell'app);
// - DETOUR_MAX: un percorso mappato oltre 3 volte la linea d'aria è probabilmente un giro lungo, e chi va
//   a funghi taglia per il bosco: «ultimo tratto fuori sentiero, da verificare». Il valore non viene da una fonte
//   (sui campioni di bosco il rapporto ha mediana 2,6; i tornanti in salita allungano anche un sentiero diretto);
// - OFFNET_MAX_SHARE: oltre metà del tratto è fuori dalla rete mappata.
export const ROADSIDE_M = 50;
export const DETOUR_MAX = 3;
export const OFFNET_MAX_SHARE = 0.5;
const fmtKmIt = (km) => km.toLocaleString('it-IT', { maximumFractionDigits: 1 });
export const fmtDist = (m) => (m >= 1000 ? `${fmtKmIt(m / 1000)} km` : `${Math.round(m / 10) * 10} m`);
// dislivello con il segno: «+120 m», «−40 m», «0 m» (arrotondato a 10 m: il DEM è a 10 m)
export const fmtRise = (m) => { const r = Math.round((m || 0) / 10) * 10; return r > 0 ? `+${r} m` : r < 0 ? `−${-r} m` : '0 m'; };
const climb = (a) => `${fmtRise(a.up)}${Math.round((a.down || 0) / 10) * 10 >= 10 ? `, ${fmtRise(-a.down)}` : ''}`;

// Tipo di ultimo tratto: 'strada' (bosco a bordo strada), 'percorso' (percorso mappato), 'fuori' (da verificare).
export function walkKind(a) {
  if (!a) return null;
  if (a.airM < ROADSIDE_M) return 'strada';
  if (a.netM == null || a.netM === 0) return 'fuori';
  if (a.offM != null && a.offM > OFFNET_MAX_SHARE * a.routeM) return 'fuori';
  if (a.routeM > DETOUR_MAX * a.airM) return 'fuori';
  return 'percorso';
}
// Ultimo tratto a piedi, testo semplice (l'app protegge i caratteri): long per la scheda, short per le righe compatte.
// dest: dove si arriva («faggeta a 1350 m»), facoltativo. Nel caso «fuori» si mostrano sempre i due numeri:
// linea d'aria con dislivello e percorso mappato con salita.
export function walkPhrase(a, dest = '') {
  if (!a || a.source !== 'access-info') return null;
  const kind = walkKind(a), air = `${fmtDist(a.airM)} in linea d’aria`;
  if (kind === 'strada') return { kind, short: 'bosco a bordo strada', long: `Bosco adatto a bordo strada${a.airM >= 10 ? ` (${air})` : ''}${dest ? `: ${dest}` : ''}.` };
  if (kind === 'percorso') return { kind, short: `${fmtDist(a.routeM)} a piedi, ${fmtRise(a.up)}`,
    long: `${fmtDist(a.routeM)} a piedi su sentieri e strade mappati, ${climb(a)} (${air})${dest ? `, fino a ${dest}` : ''}.` };
  const route = a.netM ? `; il percorso mappato è di ${fmtDist(a.routeM)}, ${climb(a)}` : '; nessun percorso mappato';
  return { kind, short: 'ultimo tratto fuori sentiero, da verificare', long: `Ultimo tratto fuori sentiero, da verificare${dest ? `, fino a ${dest}` : ''}: ${air}, ${fmtRise(a.dh)}${route}.` };
}
// Avvertenza sulla pista più vicina del bosco della strada (L.R. Lazio 29/1987, art. 1).
export function trackNote(a) {
  return a?.source === 'access-info' && a.trackM != null
    ? `Il bosco è a ${fmtDist(a.trackM)} da una pista forestale: transito in auto da verificare sul posto (L.R. Lazio 29/1987).` : '';
}
