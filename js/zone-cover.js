// Copertine dei luoghi: l'immagine segue stagione e meteo del giorno scelto.
// Dati in data/media-zones.json: la foto base della zona (reale) può dire `season` e `weather`;
// `variants` elenca le altre immagini {season, weather, file, generated, autore e licenza della foto di partenza}.
export const SEASONS = ['inverno', 'primavera', 'estate', 'autunno'];
export const WEATHERS = ['sereno', 'nuvoloso', 'nebbia', 'pioggia', 'neve'];
// stagioni meteorologiche: dicembre-febbraio inverno, marzo-maggio primavera, ecc.
export function seasonOf(dateStr) {
  const m = Number(String(dateStr || '').slice(5, 7)) || new Date().getMonth() + 1;
  return SEASONS[Math.floor((m % 12) / 3)];
}
// icona del meteo del giorno → tempo dell'immagine (il vento non si fotografa: vale come nuvoloso)
const WX = { sun: 'sereno', cloud: 'nuvoloso', wind: 'nuvoloso', fog: 'nebbia', rain: 'pioggia', storm: 'pioggia', snow: 'neve' };
export const weatherOf = (icon) => WX[icon] || 'sereno';
// prima stagione e tempo esatti, poi la stessa stagione con tempo sereno, poi qualsiasi della stagione, poi la foto base.
// A parità, una foto reale vale più di una elaborata.
export function pickCover(media, dateStr, icon = 'sun') {
  if (!media) return null;
  const s = seasonOf(dateStr), w = weatherOf(icon);
  const all = [{ ...media, generated: false }, ...(media.variants || [])].filter((v) => v.file);
  const rank = (v) => (v.season === s ? 0 : 3) + (v.weather === w ? 0 : v.weather === 'sereno' || !v.weather ? 1 : 2) + (v.generated ? 0.5 : 0);
  const best = all.filter((v) => v.season === s || v === all[0]).sort((a, b) => rank(a) - rank(b))[0];
  return best === all[0] ? media : best;
}
