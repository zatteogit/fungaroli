import test from 'node:test';
import assert from 'node:assert/strict';
import { sunTimes, holidayName, dayFactor, crowding, comfortScore, timingAdvice } from '../js/human.js';

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

test('con folla alta si arriva all\'apertura legale (alba − 1 h)', () => {
  const crowd = { level: 'alto' };
  const t = timingAdvice({ dateStr: '2026-10-18', lat: 42.4, lon: 12.86, crowd });
  assert.equal(t.arrive.getTime(), t.sunrise.getTime() - 3600e3);
});
