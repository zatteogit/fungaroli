import test from 'node:test';
import assert from 'node:assert/strict';
import {plannedDeparture,recommendedStartAvailable,calendarDate,lateLabel} from '../js/planning-time.js';

const arrive = new Date('2026-10-17T08:00:00+02:00');
const input = {date:'2026-10-17',today:'2026-10-17',arrive,travelMinutes:60};
test('il limite usa viaggio e margine, arrotondati come la partenza mostrata',()=>{
  assert.equal(plannedDeparture(arrive,60).toISOString(),'2026-10-17T04:45:00.000Z');
  assert.equal(recommendedStartAvailable({...input,now:new Date('2026-10-17T06:44:00+02:00')}),true);
  assert.equal(recommendedStartAvailable({...input,now:new Date('2026-10-17T06:45:00+02:00')}),false);
  assert.equal(recommendedStartAvailable({...input,now:new Date('2026-10-17T07:00:00+02:00')}),false);
});
test('un giorno futuro resta proponibile e uno passato no',()=>{
  assert.equal(recommendedStartAvailable({...input,date:'2026-10-18',now:new Date('2026-10-17T23:00:00+02:00')}),true);
  assert.equal(recommendedStartAvailable({...input,date:'2026-10-16'}),false);
});
test('senza durata del viaggio non inventa una partenza, ma esclude un arrivo già passato',()=>{
  assert.equal(plannedDeparture(arrive,null),null);
  assert.equal(recommendedStartAvailable({...input,travelMinutes:null,now:new Date('2026-10-17T08:01:00+02:00')}),false);
});
test('gli orari assoluti mantengono il confronto coerente nel cambio di ora legale',()=>{
  const autumn={date:'2026-10-25',today:'2026-10-25',arrive:new Date('2026-10-25T08:00:00+01:00'),travelMinutes:60};
  assert.equal(recommendedStartAvailable({...autumn,now:new Date('2026-10-25T06:44:00+01:00')}),true);
  assert.equal(recommendedStartAvailable({...autumn,now:new Date('2026-10-25T06:46:00+01:00')}),false);
});

test('la data successiva segue il calendario italiano anche a cavallo del cambio ora',()=>{
  assert.equal(calendarDate('2026-10-25',1),'2026-10-26');
  assert.equal(calendarDate('2026-12-31',1),'2027-01-01');
});

test('OUT-03, punto 1: «Raccolta chiusa» solo per i funghi, solo oggi, dopo la fine della raccolta consentita',()=>{
  const end=new Date('2026-10-24T18:12:00+02:00'),base={date:'2026-10-24',today:'2026-10-24',end,mushrooms:true};
  assert.equal(lateLabel({...base,now:new Date('2026-10-24T18:09:59+02:00')}),'Orario consigliato superato');
  assert.equal(lateLabel({...base,now:new Date('2026-10-24T18:10:00+02:00')}),'Raccolta chiusa','fine arrotondata per difetto ai 5 minuti');
  assert.equal(lateLabel({...base,now:new Date('2026-10-24T18:20:00+02:00'),short:true}),'Raccolta chiusa');
  assert.equal(lateLabel({...base,mushrooms:false,now:new Date('2026-10-24T20:00:00+02:00'),short:true}),'Orario superato');
  assert.equal(lateLabel({...base,date:'2026-10-23',now:new Date('2026-10-24T20:00:00+02:00')}),'Orario consigliato superato');
});
