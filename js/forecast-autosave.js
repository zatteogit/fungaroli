// Previsioni datate salvate in automatico (decisione di Matteo, 21/10/2026): quando si apre la scheda di un'uscita
// (zona + giorno) o si salva un giro nel Taccuino, l'app conserva in silenzio la previsione di quella zona e di quel
// giorno, una sola volta, e solo prima dell'uscita (mai per giorni passati). Il ricordo dell'uscita si collega poi
// a quella previsione, con la stessa regola del server (worker/community.js): stessa zona, stesso giorno e
// previsione salvata prima dell'inizio dell'uscita.
// Funzioni pure, senza DOM né archivio: tests/forecast-autosave.test.mjs. js/journal.js le usa.

// Limite del server per una richiesta (worker/community.js, MAX_BYTES): una previsione più grande non si salva.
export const MAX_PLAN_BYTES = 250_000;
// Senza profilo le previsioni stanno nella stessa memoria del diario locale (localStorage, pochi MB per sito):
// al massimo LOCAL_AUTO_BYTES in tutto (una previsione pesa circa 18 kB: una trentina), e quelle di giorni passati
// da più di LOCAL_KEEP_DAYS giorni si tolgono. Il ricordo collegato ne conserva una copia, quindi togliere la
// previsione non toglie il confronto. Valori scelti per non riempire la memoria del browser: non vengono da una fonte.
export const LOCAL_AUTO_BYTES = 600_000;
export const LOCAL_KEEP_DAYS = 14;
// Con un profilo il server accetta al massimo 1000 voci per diario: le previsioni automatiche si fermano prima,
// per lasciare spazio alle voci scritte dall'utente.
export const ACCOUNT_ENTRY_LIMIT = 1000;
export const ACCOUNT_AUTO_STOP = 900;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const validDay = (d) => { const t = typeof d === 'string' && ISO_DAY.test(d) ? Date.parse(`${d}T12:00:00Z`) : NaN; return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === d; };
export const bytesOf = (value) => new TextEncoder().encode(JSON.stringify(value)).length;
const capturedOf = (e) => Date.parse(e?.forecast?.capturedAt);

// Previsione già salvata per zona e giorno (automatica o salvata a mano con le versioni precedenti): la più recente.
export function planFor(entries, zoneId, date) {
  return (entries || []).filter((e) => e?.kind === 'plan' && e.zoneId === zoneId && e.date === date && Number.isFinite(capturedOf(e)))
    .sort((a, b) => capturedOf(b) - capturedOf(a))[0] || null;
}

// Si salva? Solo per oggi o un giorno futuro, una volta per zona e giorno.
export function shouldCapture({ entries, zoneId, date, today }) {
  if (!zoneId || !validDay(date) || !validDay(today) || date < today) return false;
  return !planFor(entries, zoneId, date);
}

// La voce del Taccuino per la previsione automatica: stessa forma dei piani di prima (kind 'plan'), con auto: true
// perché non è una pagina scritta dall'utente e non si mostra nell'elenco del Taccuino.
// null se la previsione manca o se la voce supera il limite del server.
export function autoPlanEntry({ id, zoneId, date, band = null, forecast }) {
  if (!forecast || !Number.isFinite(Date.parse(forecast.capturedAt))) return null;
  const entry = { id, kind: 'plan', auto: true, zoneId, date, band: band ?? null, finds: {}, note: '',
    predicted: forecast.scores || {}, forecast, savedAt: forecast.capturedAt };
  return bytesOf(entry) <= MAX_PLAN_BYTES ? entry : null;
}

// Con un profilo: ci sono ancora voci libere per una previsione automatica?
export const accountHasRoom = (entries) => (entries || []).length < ACCOUNT_AUTO_STOP;
// Dove va la previsione automatica, secondo l'archivio del Taccuino: 'local' senza profilo (memoria del diario
// locale), 'account' con un profilo (diario sul server, come i piani di prima). Il vecchio diario con codice e
// l'archivio della versione Artifact non ricevono previsioni automatiche: null.
export function autoSaveMode(storeKind, entries) {
  if (storeKind === 'local') return 'local';
  if (storeKind === 'community') return accountHasRoom(entries) ? 'account' : null;
  return null;
}

// Senza profilo: quali previsioni automatiche togliere dalla memoria locale. Prima quelle di giorni passati da più di
// keepDays giorni; poi, se lo spazio occupato supera maxBytes, le più vecchie (per giorno, poi per salvataggio).
// Le previsioni salvate a mano con le versioni precedenti (senza auto) non si toccano.
export function localPlansToDrop(entries, { today, keepDays = LOCAL_KEEP_DAYS, maxBytes = LOCAL_AUTO_BYTES } = {}) {
  const auto = (entries || []).filter((e) => e?.kind === 'plan' && e.auto);
  const limit = validDay(today) ? new Date(Date.parse(`${today}T12:00:00Z`) - keepDays * 86400000).toISOString().slice(0, 10) : null;
  const drop = new Set(auto.filter((e) => limit && String(e.date) < limit).map((e) => e.id));
  const kept = auto.filter((e) => !drop.has(e.id))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || capturedOf(a) - capturedOf(b));
  let total = kept.reduce((s, e) => s + bytesOf(e), 0);
  for (const e of kept) {
    if (total <= maxBytes) break;
    drop.add(e.id); total -= bytesOf(e);
  }
  return [...drop];
}

// Inizio dell'uscita usato per il collegamento. Il ricordo non chiede più l'ora d'inizio (19/10/2026): se manca,
// vale l'inizio del giorno dell'uscita sul dispositivo. È un limite inferiore: una previsione salvata prima di quel
// momento precede di certo l'uscita; una salvata lo stesso giorno non si collega (non si sa se veniva prima).
export function outingStart(entry) {
  const given = Date.parse(entry?.effort?.startedAt);
  if (Number.isFinite(given)) return { startedAt: new Date(given).toISOString(), bound: entry.effort.startedAtBound || null };
  if (!validDay(entry?.date)) return null;
  const [y, m, d] = entry.date.split('-').map(Number);
  return { startedAt: new Date(y, m - 1, d).toISOString(), bound: 'inizio-del-giorno' };
}

// Collegamento del ricordo alla previsione salvata (stessa regola di worker/community.js): stessa zona, stesso giorno,
// previsione salvata prima dell'inizio. Ritorna i campi da mettere nel ricordo, o null.
export function linkedForecast(outing, entries) {
  const start = Date.parse(outing?.effort?.startedAt);
  if (!Number.isFinite(start)) return null;
  const p = (entries || []).filter((e) => e?.kind === 'plan' && e.zoneId === outing.zoneId && e.date === outing.date && capturedOf(e) < start)
    .sort((a, b) => capturedOf(b) - capturedOf(a))[0];
  if (!p) return null;
  return { forecast: { ...p.forecast, mode: 'prospective', planId: p.id },
    predicted: outing.band == null ? p.forecast.scores || {} : p.forecast.scoresByBand?.[outing.band] || {} };
}
