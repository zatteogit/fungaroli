import test from 'node:test';
import assert from 'node:assert/strict';
import { sunTimes, holidayName, dayFactor, crowding, comfortScore, timingAdvice, fmtRough, todayGone, collectWindow, TODAY_CUTOFF_H } from '../js/human.js';

const hm = (d) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

test('alba e tramonto a Rieti (12 ottobre ~07:16 / 18:33)', () => {
  const { sunrise, sunset } = sunTimes('2026-10-12', 42.404, 12.862);
  assert.equal(hm(sunrise), '07:16');
  assert.equal(hm(sunset), '18:33');
});

test('festivi: Pasquetta mobile e patrona di Rieti', () => {
  assert.equal(holidayName('2027-03-29'), 'Pasquetta');
  assert.match(holidayName('2026-12-04'), /Santa Barbara/);
  assert.equal(holidayName('2026-10-13'), null);
});

test('il weekend pesa più dei feriali', () => {
  assert.ok(dayFactor('2026-10-18').f > dayFactor('2026-10-14').f * 2); // domenica vs mercoledi'
});

test('affollamento: domenica in zona famosa con buttata nota = alto; mercoledì = medio', () => {
  const scores = [50, 55, 60, 65, 70, 70, 72];
  assert.equal(crowding({ dateStr: '2026-10-18', popularity: 1, comfort: 1, scores }).level, 'alto');
  assert.equal(crowding({ dateStr: '2026-10-14', popularity: 1, comfort: 1, scores }).level, 'medio'); // pensionati e cercatori abituali
  assert.equal(crowding({ dateStr: '2026-10-14', popularity: 0.5, comfort: 0.5, scores: [10, 10, 10] }).level, 'basso');
});

test('buttata appena partita riduce la folla', () => {
  const base = { dateStr: '2026-10-18', popularity: 1, comfort: 1 };
  const fresh = crowding({ ...base, scores: [10, 15, 20, 20, 25, 40, 60] });
  assert.equal(fresh.fresh, true);
});

test('comodità: vicino e su asfalto = comodo; lontano e a piedi = impegnativo', () => {
  assert.equal(comfortScore({ driveMin: 25, walkM: 100, surface: 0 }).level, 'comodo');
  assert.equal(comfortScore({ driveMin: 100, walkM: 2000, surface: 1, unpavedKm: 4 }).level, 'impegnativo');
});

test('con folla alta si arriva al primo quarto d\'ora dopo l\'apertura legale (alba − 1 h), mai prima', () => {
  const crowd = { level: 'alto' };
  const t = timingAdvice({ dateStr: '2026-10-18', lat: 42.4, lon: 12.86, crowd });
  assert.equal(t.legal.getTime(), t.sunrise.getTime() - 3600e3);
  assert.ok(t.arrive >= t.legal);
  assert.ok(t.arrive - t.legal < 15 * 6e4);
  assert.equal(t.arrive.getTime() % (15 * 6e4), 0); // la scheda arrotonda per difetto: l'orario resta questo
  assert.equal(hm(t.arrive), '06:30'); // apertura 6:23 (scheda: «raccolta consentita dalle 6:25»)
  assert.doesNotMatch(t.why, /trova|nati nella notte/);
  assert.match(t.why, /stimiamo/);
  // in tutto l'anno l'arrivo consigliato non precede l'apertura della raccolta
  for (let d = Date.UTC(2026, 0, 1); d < Date.UTC(2027, 0, 1); d += 864e5) {
    const x = timingAdvice({ dateStr: new Date(d).toISOString().slice(0, 10), lat: 42.4, lon: 12.86, crowd });
    assert.ok(x.arrive >= x.legal && x.arrive - x.legal < 15 * 6e4);
  }
});

test('i consigli d\'orario non parlano di funghi trovati: descrivono solo la folla stimata', () => {
  for (const level of ['alto', 'medio', 'basso']) {
    const t = timingAdvice({ dateStr: '2026-10-18', lat: 42.4, lon: 12.86, crowd: { level } });
    assert.doesNotMatch(t.why, /trova|nati|davanti/);
  }
  const medio = timingAdvice({ dateStr: '2026-10-18', lat: 42.4, lon: 12.86, crowd: { level: 'medio' } });
  assert.equal(medio.arrive.getTime(), medio.sunrise.getTime());
});

// ---- OUT-03: oggi dopo le 14 e orari mai già passati ----
test('dalle 14, ora italiana, la mattina di oggi è passata', () => {
  assert.equal(TODAY_CUTOFF_H, 14);
  assert.equal(todayGone(new Date('2026-10-15T13:59:00+02:00')), false);
  assert.equal(todayGone(new Date('2026-10-15T14:00:00+02:00')), true);
  assert.equal(todayGone(new Date('2026-12-15T14:00:00+01:00')), true); // ora solare
  assert.equal(todayGone(new Date('2026-12-15T13:00:00Z')), true); // 14:00 a Roma, qualunque sia il fuso del dispositivo
  assert.equal(todayGone(new Date('2026-10-15T23:59:00+02:00')), true);
  assert.equal(todayGone(new Date('2026-10-16T00:00:00+02:00')), false);
});

test('finestra della raccolta', () => {
  const w = collectWindow('2026-10-15', 42.335, 13.15), t = timingAdvice({ dateStr: '2026-10-15', lat: 42.335, lon: 13.15, crowd: { level: 'alto' } });
  assert.equal(+w.legal, +t.legal); assert.equal(+w.end, +t.end);
  assert.equal(+w.legal, +w.sunrise - 3600e3); assert.equal(+w.end, +w.sunset + 3600e3);
});
