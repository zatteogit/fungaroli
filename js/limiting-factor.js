// Il motivo breve per cui una specie ha condizioni basse in una zona: il fattore del modello che pesa di più.
// Usa i fattori già calcolati da scoreSpecies (js/model.js) e le stesse soglie della spiegazione in js/science.js.
// Il bonus del calo di temperatura del suolo non è mai un motivo.
const REASONS = [
  ['season', (v) => v < 0.3 ? 'fuori periodo tipico' : 'ai margini del periodo'],
  ['elev', () => 'quota fuori dall’intervallo della specie'],
  ['habitat', () => 'poco bosco adatto a questa quota'],
  ['rain', () => 'poca pioggia nelle settimane prima'],
  ['temp', () => 'temperature lontane da quelle adatte'],
  ['moist', () => 'terreno asciutto'],
  ['frost', () => 'gelo recente'],
  ['heat', () => 'caldo recente'],
];

export function limitingReason(result) {
  if (!result) return '';
  let worst = null;
  for (const [key, text] of REASONS) {
    const v = result[key];
    if (!Number.isFinite(v) || v >= 1) continue;
    if (!worst || v < worst.v - 1e-9) worst = { v, text: text(v) };
  }
  return worst?.text || '';
}
