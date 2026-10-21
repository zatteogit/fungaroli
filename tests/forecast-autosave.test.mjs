// Previsioni datate salvate in automatico (js/forecast-autosave.js, decisione del 21/10/2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { planFor, shouldCapture, autoPlanEntry, autoSaveMode, localPlansToDrop, outingStart, linkedForecast, bytesOf,
  MAX_PLAN_BYTES, LOCAL_AUTO_BYTES, LOCAL_KEEP_DAYS, ACCOUNT_AUTO_STOP, ACCOUNT_ENTRY_LIMIT } from '../js/forecast-autosave.js';

const forecast = (capturedAt, extra = {}) => ({ mode: 'prospective', capturedAt, modelVersion: 'test',
  scores: { edulis: 62, mellea: 18 }, scoresByBand: { 1100: { edulis: 40 }, 1350: { edulis: 62 } }, ...extra });
const plan = (id, zoneId, date, capturedAt, extra = {}) => ({ id, kind: 'plan', auto: true, zoneId, date, band: 1350,
  finds: {}, note: '', predicted: {}, forecast: forecast(capturedAt), savedAt: capturedAt, ...extra });

test('una sola previsione per zona e giorno', () => {
  const entries = [plan('a', 'tancia', '2026-10-23', '2026-10-21T08:00:00Z')];
  assert.equal(shouldCapture({ entries, zoneId: 'tancia', date: '2026-10-23', today: '2026-10-21' }), false);
  // un piano salvato a mano con le versioni precedenti vale lo stesso: niente doppione
  assert.equal(shouldCapture({ entries: [{ ...entries[0], auto: undefined }], zoneId: 'tancia', date: '2026-10-23', today: '2026-10-21' }), false);
  // altra zona o altro giorno: sì
  assert.equal(shouldCapture({ entries, zoneId: 'laga', date: '2026-10-23', today: '2026-10-21' }), true);
  assert.equal(shouldCapture({ entries, zoneId: 'tancia', date: '2026-10-24', today: '2026-10-21' }), true);
  assert.equal(planFor(entries, 'tancia', '2026-10-23').id, 'a');
  assert.equal(planFor(entries, 'tancia', '2026-10-24'), null);
});

test('mai per giorni passati; oggi e i giorni futuri sì; date non valide no', () => {
  const base = { entries: [], zoneId: 'tancia', today: '2026-10-21' };
  assert.equal(shouldCapture({ ...base, date: '2026-10-20' }), false);
  assert.equal(shouldCapture({ ...base, date: '2026-10-21' }), true);
  assert.equal(shouldCapture({ ...base, date: '2026-10-27' }), true);
  for (const date of ['2026-02-30', '21/10/2026', '', null]) assert.equal(shouldCapture({ ...base, date }), false, String(date));
  assert.equal(shouldCapture({ ...base, zoneId: '', date: '2026-10-22' }), false);
});

test('la voce ha la forma dei piani di prima, segnata come automatica, entro il limite del server', () => {
  const f = forecast('2026-10-21T08:00:00Z');
  const e = autoPlanEntry({ id: 'x1y2', zoneId: 'tancia', date: '2026-10-22', band: 1350, forecast: f });
  assert.deepEqual(Object.keys(e).sort(), ['auto', 'band', 'date', 'finds', 'forecast', 'id', 'kind', 'note', 'predicted', 'savedAt', 'zoneId']);
  assert.equal(e.kind, 'plan');
  assert.equal(e.auto, true);
  assert.equal(e.savedAt, f.capturedAt);
  assert.deepEqual(e.predicted, f.scores);
  assert.equal(autoPlanEntry({ id: 'x', zoneId: 'tancia', date: '2026-10-22', forecast: null }), null);
  assert.equal(autoPlanEntry({ id: 'x', zoneId: 'tancia', date: '2026-10-22', forecast: { scores: {} } }), null);
  // oltre i 250 000 byte del server (worker/community.js, MAX_BYTES) non si salva
  assert.equal(MAX_PLAN_BYTES, 250_000);
  const big = forecast('2026-10-21T08:00:00Z', { inputs: 'x'.repeat(MAX_PLAN_BYTES) });
  assert.equal(autoPlanEntry({ id: 'x', zoneId: 'tancia', date: '2026-10-22', forecast: big }), null);
  // i byte si contano in UTF-8, come li conta il server
  assert.equal(bytesOf('è'), 4);
});

test('senza profilo: solo in locale; con profilo: nel diario, finché c’è spazio; altri archivi: niente', () => {
  assert.equal(autoSaveMode('local', []), 'local');
  assert.equal(autoSaveMode('community', []), 'account');
  assert.ok(ACCOUNT_AUTO_STOP < ACCOUNT_ENTRY_LIMIT);
  assert.equal(autoSaveMode('community', Array.from({ length: ACCOUNT_AUTO_STOP }, (_, k) => ({ id: String(k) }))), null);
  assert.equal(autoSaveMode('remote', []), null);
  assert.equal(autoSaveMode('db', []), null);
  assert.equal(autoSaveMode(undefined, []), null);
});

test('memoria locale: si tolgono le previsioni vecchie e, oltre il limite di spazio, le più vecchie', () => {
  const today = '2026-10-21';
  const old = plan('old', 'tancia', '2026-10-01', '2026-09-30T08:00:00Z');
  const recentPast = plan('recent', 'tancia', '2026-10-15', '2026-10-14T08:00:00Z');
  const manual = { ...plan('manual', 'laga', '2026-09-01', '2026-08-31T08:00:00Z'), auto: undefined };
  const note = { id: 'n', kind: 'note', date: '2026-01-01' };
  assert.deepEqual(localPlansToDrop([old, recentPast, manual, note], { today }), ['old']);
  assert.ok(LOCAL_KEEP_DAYS >= 7, 'il tempo per scrivere il ricordo dopo l’uscita');
  // limite di spazio: tiene le più recenti
  const many = Array.from({ length: 6 }, (_, k) => plan(`p${k}`, 'tancia', `2026-10-${String(20 + k).padStart(2, '0')}`, `2026-10-19T0${k}:00:00Z`));
  const one = bytesOf(many[0]);
  const drop = localPlansToDrop(many, { today, maxBytes: one * 3 + 10 });
  assert.deepEqual(drop, ['p0', 'p1', 'p2']);
  // con il limite vero una previsione reale (circa 18 kB) ci sta molte volte
  assert.ok(LOCAL_AUTO_BYTES >= 20 * 18_000);
});

test('inizio dell’uscita: quello indicato, altrimenti l’inizio del giorno sul dispositivo', () => {
  assert.deepEqual(outingStart({ date: '2026-10-21', effort: { startedAt: '2026-10-21T07:30:00Z' } }), { startedAt: '2026-10-21T07:30:00.000Z', bound: null });
  const s = outingStart({ date: '2026-10-21', effort: {} });
  assert.equal(s.bound, 'inizio-del-giorno');
  const local = new Date(s.startedAt);
  assert.deepEqual([local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes()], [2026, 9, 21, 0, 0]);
  assert.equal(outingStart({ date: 'ieri' }), null);
});

test('il ricordo si collega alla previsione salvata della stessa zona e giorno, solo se la precede', () => {
  const dayStart = outingStart({ date: '2026-10-23' }).startedAt;
  const before = plan('before', 'tancia', '2026-10-23', '2026-10-21T08:00:00Z');
  const sameDay = plan('same', 'tancia', '2026-10-23', new Date(Date.parse(dayStart) + 3600_000).toISOString());
  const otherZone = plan('other', 'laga', '2026-10-23', '2026-10-20T08:00:00Z');
  const otherDay = plan('day', 'tancia', '2026-10-22', '2026-10-20T08:00:00Z');
  const outing = { kind: 'outing', zoneId: 'tancia', date: '2026-10-23', band: null, effort: { startedAt: dayStart } };
  const link = linkedForecast(outing, [sameDay, otherZone, otherDay, before]);
  assert.equal(link.forecast.planId, 'before');
  assert.equal(link.forecast.mode, 'prospective');
  assert.equal(link.forecast.capturedAt, before.forecast.capturedAt);
  assert.deepEqual(link.predicted, before.forecast.scores);
  // con una fascia: l'indice di quella fascia
  assert.deepEqual(linkedForecast({ ...outing, band: 1100 }, [before]).predicted, { edulis: 40 });
  // salvata dopo l'inizio (lo stesso giorno, senza ora d'inizio): nessun collegamento
  assert.equal(linkedForecast(outing, [sameDay]), null);
  // nessuna previsione della stessa zona e giorno
  assert.equal(linkedForecast(outing, [otherZone, otherDay]), null);
  // senza inizio: nessun collegamento (il server fa lo stesso)
  assert.equal(linkedForecast({ ...outing, effort: {} }, [before]), null);
  // la più recente tra quelle che precedono
  const later = plan('later', 'tancia', '2026-10-23', '2026-10-22T08:00:00Z');
  assert.equal(linkedForecast(outing, [before, later]).forecast.planId, 'later');
});

test('stessa regola del server: collegamento solo se capturedAt < startedAt, con la stessa zona e lo stesso giorno', async () => {
  // il controllo del Worker (worker/community.js) sulla voce che il client invia
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../worker/community.js', import.meta.url), 'utf8');
  assert.match(src, /p\?\.kind === 'plan' && p\.zoneId === entry\.zoneId && p\.date === entry\.date && Date\.parse\(p\.forecast\.capturedAt\) < Date\.parse\(entry\.effort\?\.startedAt\)/);
  assert.match(src, /MAX_BYTES = 250_000/);
});
