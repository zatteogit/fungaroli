// Scelta della data e orari pratici: non modifica gli indici di crescita.
import {roundTime} from './human.js';

// Stesso margine pratico già usato nel piano dell'uscita.
export function plannedDeparture(arrive, travelMinutes) {
  if (!Number.isFinite(travelMinutes)) return null;
  return roundTime(new Date(arrive.getTime() - (Math.max(0, travelMinutes) + 10) * 60000), 15, 'floor');
}

export function recommendedStartAvailable({date, today, arrive, travelMinutes, now = new Date()}) {
  if (date > today) return true;
  if (date < today) return false;
  const deadline = plannedDeparture(arrive, travelMinutes) || roundTime(arrive, 15, 'floor');
  return now.getTime() < deadline.getTime();
}

// Giorni di calendario, senza aggiungere 24 ore all'orologio locale nei cambi DST.
export function calendarDate(today, offset) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0,10);
}

// OUT-03, punto 1: dopo la fine della raccolta consentita (un'ora dopo il tramonto, L.R. Lazio 32/1998, art. 9,
// c. 1) non è «tardi», la raccolta è chiusa. Solo per chi cerca funghi: il divieto riguarda la raccolta, non il cammino.
// Il confronto usa la fine arrotondata per difetto ai 5 minuti: l'orario mostrato non è mai già passato.
export function lateLabel({date, today, end, mushrooms, now = new Date(), short = false}) {
  if (mushrooms && date === today && now.getTime() >= roundTime(end, 5, 'floor').getTime()) return 'Raccolta chiusa';
  return short ? 'Orario superato' : 'Orario consigliato superato';
}
