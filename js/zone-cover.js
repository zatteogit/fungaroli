// Copertine dei luoghi: la foto segue la stagione del giorno scelto; il meteo è una velatura grafica sopra.
// Dati in data/media-zones.json: la foto base della zona può avere `season` (se si vede la stagione)
// e `seasons` con una foto per stagione (reale, oppure elaborata da una foto reale: `generated: true`).
export const SEASONS = ['inverno', 'primavera', 'estate', 'autunno'];
// stagioni meteorologiche: dicembre-febbraio inverno, marzo-maggio primavera, ecc.
export function seasonOf(dateStr) {
  const m = Number(String(dateStr || '').slice(5, 7)) || new Date().getMonth() + 1;
  return SEASONS[Math.floor((m % 12) / 3)];
}
// prima una foto reale della stagione, poi una elaborata, poi la foto base (che vale tutto l'anno)
export function pickCover(media, dateStr) {
  if (!media) return null;
  const s = seasonOf(dateStr);
  if (media.season === s) return media;
  const alt = media.seasons?.[s];
  return alt?.file ? { ...alt, alt_of: media } : media;
}
// meteo del giorno → velatura: solo grafica, sopra la foto, mai una foto diversa
const VEIL = { fog: 'fog', rain: 'rain', storm: 'rain', snow: 'snow', cloud: 'cloud' };
export const veilOf = (icon) => VEIL[icon] || '';
