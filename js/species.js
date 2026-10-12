// Specie commestibili considerate e parametri del modello.
//
// Cosa e' verificato e cosa no:
// - Pioggia cumulata sui 30 giorni precedenti: correlazione piu' forte per i macromiceti
//   dei querceti toscani (Salerni et al. 2002, non specifico per il porcino).
// - B. edulis in faggeta: picco con T media ~13 °C sui 20 giorni e pioggia su ~26 giorni
//   (Brejon Lamartinière & Hoffman, preprint bioRxiv 2025, non ancora revisionato).
// - Finestre di latenza e soglia d'innesco (8 mm): euristiche.
// - Habitat, fasce di quota e stagionalita' nel Reatino: documento di partenza
//   (MyBoletus, AMER, Alta Valle del Velino) + manualistica micologica.
// - Temperature ottimali delle altre specie, finestre di latenza e pesi: EURISTICHE,
//   da calibrare con le proprie uscite. Sono parametri, non fatti.
//
// forest: affinita' 0-1 con le categorie della Carta Forestale Regione Lazio.
// months: peso stagionale gen..dic (0-1).
// elev: [min, max] quota in metri.
// topt/tsd: media e tolleranza (°C) della T media aria dei 20 giorni precedenti.
// lag: [min, max] giorni tra pioggia efficace e nascita.
// eref: mm di pioggia efficace che portano il fattore pioggia a ~63%.
// minCap: diametro minimo cappello per legge (L.R. Lazio 32/98, art. 3), cm; 0 = nessuna taglia minima (art. 3 c. 2 bis).

export const FOREST = {
  FAG: 'Faggeta',
  CAS: 'Castagneto',
  CER: 'Cerreta',
  ROV: 'Querceto a roverella',
  OST: 'Ostrieto',
  LEC: 'Lecceta',
  CON: 'Rimboschimenti di pini e/o altre conifere montane',
  PIN: 'Pineta termofila',
  FOR: 'Bosco di forra',
  RIP: 'Bosco alveale e ripariale',
  ARB: 'Arbusteto e macchia alta',
  PSM: 'Pseudo-macchia',
  NON: 'non bosco',
};

const F = FOREST;
const m = (...v) => v; // 12 pesi mensili

export const SPECIES = [
  {
    id: 'edulis', group: 'porcini', name: 'Porcino', latin: 'Boletus edulis',
    forest: { [F.FAG]: 1, [F.CAS]: 0.7, [F.CER]: 0.6, [F.CON]: 0.6, [F.ROV]: 0.4, [F.OST]: 0.2, [F.FOR]: 0.4 },
    months: m(0, 0, 0, 0, 0.1, 0.4, 0.6, 0.8, 1, 1, 0.4, 0),
    elev: [700, 1800], topt: 13, tsd: 3.5, lag: [7, 21], eref: 30, minCap: 4,
    evidence: 'Trigger T e pioggia da letteratura (faggete).',
  },
  {
    id: 'pinophilus', group: 'porcini', name: 'Porcino rosso', latin: 'Boletus pinophilus',
    forest: { [F.CON]: 1, [F.FAG]: 0.8, [F.CAS]: 0.5, [F.CER]: 0.3 },
    months: m(0, 0, 0, 0, 0.1, 0.4, 0.6, 0.9, 1, 0.8, 0.2, 0),
    elev: [900, 1800], topt: 13, tsd: 3.5, lag: [7, 21], eref: 30, minCap: 4,
    evidence: 'Parametri assimilati a B. edulis (euristica).',
  },
  {
    id: 'aereus', group: 'porcini', name: 'Porcino nero', latin: 'Boletus aereus',
    forest: { [F.CAS]: 1, [F.ROV]: 1, [F.CER]: 0.9, [F.LEC]: 0.8, [F.OST]: 0.4, [F.FAG]: 0.2 },
    months: m(0, 0, 0, 0, 0.1, 0.5, 0.7, 0.8, 1, 0.8, 0.3, 0),
    elev: [300, 1100], topt: 18, tsd: 3.5, lag: [7, 18], eref: 28, minCap: 4,
    evidence: 'Specie termofila: T ottimale euristica.',
  },
  {
    id: 'aestivalis', group: 'porcini', name: 'Porcino estivo', latin: 'Boletus aestivalis (reticulatus)',
    forest: { [F.CAS]: 1, [F.CER]: 0.9, [F.ROV]: 0.8, [F.FAG]: 0.7, [F.OST]: 0.3 },
    months: m(0, 0, 0, 0, 0.6, 1, 0.8, 0.6, 0.8, 0.5, 0.1, 0),
    elev: [400, 1300], topt: 17, tsd: 3.5, lag: [7, 18], eref: 28, minCap: 4,
    evidence: 'Stagionalita\' dal documento; T euristica.',
  },
  {
    id: 'caesarea', group: 'ovolo', name: 'Ovolo buono', latin: 'Amanita caesarea',
    forest: { [F.CAS]: 1, [F.CER]: 1, [F.ROV]: 1, [F.LEC]: 0.6, [F.OST]: 0.4 },
    months: m(0, 0, 0, 0, 0, 0.4, 0.8, 0.8, 1, 0.6, 0.1, 0),
    elev: [300, 1000], topt: 19, tsd: 3.5, lag: [7, 18], eref: 28, minCap: 4,
    warning: 'Mai raccogliere ovoli chiusi: confondibili con Amanita phalloides (mortale) e A. muscaria.',
    evidence: 'Termofila, inizio autunno (letteratura); soglie euristiche.',
  },
  {
    id: 'cibarius', group: 'finferlo', name: 'Finferlo / gallinaccio', latin: 'Cantharellus cibarius',
    forest: { [F.FAG]: 1, [F.CAS]: 0.9, [F.CER]: 0.8, [F.CON]: 0.6, [F.ROV]: 0.5 },
    months: m(0, 0, 0, 0, 0.1, 0.7, 1, 0.9, 0.9, 0.6, 0.2, 0),
    elev: [400, 1700], topt: 15, tsd: 4, lag: [7, 24], eref: 30, minCap: 0,
    warning: 'Attenzione a Omphalotus olearius (tossico, cespitoso su ceppaie).',
    evidence: 'Euristica.',
  },
  {
    id: 'cornucopioides', group: 'trombetta', name: 'Trombetta dei morti', latin: 'Craterellus cornucopioides',
    forest: { [F.FAG]: 1, [F.CER]: 0.8, [F.FOR]: 0.8, [F.CAS]: 0.7, [F.ROV]: 0.6, [F.OST]: 0.5 },
    months: m(0, 0, 0, 0, 0, 0, 0.1, 0.4, 0.8, 1, 0.8, 0.1),
    elev: [400, 1500], topt: 12, tsd: 4, lag: [7, 21], eref: 30, minCap: 0,
    evidence: 'Euristica.',
  },
  {
    id: 'repandum', group: 'steccherino', name: 'Steccherino dorato', latin: 'Hydnum repandum',
    forest: { [F.FAG]: 0.9, [F.CER]: 0.9, [F.CAS]: 0.8, [F.CON]: 0.7, [F.ROV]: 0.6 },
    months: m(0, 0, 0, 0, 0, 0, 0.1, 0.4, 0.8, 1, 0.8, 0.2),
    elev: [400, 1600], topt: 11, tsd: 4, lag: [7, 21], eref: 30, minCap: 0,
    evidence: 'Euristica.',
  },
  {
    id: 'procera', group: 'mazza', name: 'Mazza di tamburo', latin: 'Macrolepiota procera',
    forest: { [F.ARB]: 0.7, [F.CAS]: 0.7, [F.CER]: 0.7, [F.ROV]: 0.7, [F.NON]: 0.6, [F.FAG]: 0.4, [F.OST]: 0.4 },
    months: m(0, 0, 0, 0, 0, 0.1, 0.4, 0.7, 1, 1, 0.4, 0),
    elev: [200, 1500], topt: 15, tsd: 4.5, lag: [4, 14], eref: 25, minCap: 5,
    warning: 'Solo esemplari ≥ 5 cm: le piccole Lepiota sono tossiche o mortali. Gambo non commestibile.',
    evidence: 'Euristica.',
  },
  {
    id: 'mellea', group: 'chiodino', name: 'Chiodino', latin: 'Armillaria mellea',
    forest: { [F.CAS]: 1, [F.CER]: 0.9, [F.ROV]: 0.9, [F.OST]: 0.8, [F.FAG]: 0.8, [F.RIP]: 0.6, [F.LEC]: 0.5 },
    months: m(0, 0, 0, 0, 0, 0, 0, 0.1, 0.5, 1, 0.9, 0.2),
    elev: [200, 1500], topt: 11, tsd: 3.5, lag: [5, 15], eref: 25, minCap: 0, shockWeight: 3,
    warning: 'Tossico crudo o poco cotto: sbollentare e scartare l\'acqua prima della cottura.',
    evidence: 'Euristica; buttate legate al primo freddo.',
  },
  {
    id: 'virescens', group: 'colombina', name: 'Colombina / verdone', latin: 'Russula virescens, R. cyanoxantha',
    forest: { [F.CAS]: 1, [F.CER]: 1, [F.FAG]: 0.9, [F.ROV]: 0.8 },
    months: m(0, 0, 0, 0, 0.1, 0.7, 0.9, 0.8, 1, 0.6, 0.1, 0),
    elev: [300, 1600], topt: 17, tsd: 4, lag: [5, 14], eref: 25, minCap: 4,
    warning: 'Le russule verdi si confondono con Amanita phalloides: controlla sempre base e volva.',
    evidence: 'Euristica.',
  },
  {
    id: 'suillus', group: 'pinarolo', name: 'Pinarolo', latin: 'Suillus luteus, S. granulatus, S. collinitus',
    forest: { [F.CON]: 1, [F.PIN]: 1 },
    months: m(0, 0, 0, 0, 0.1, 0.3, 0.3, 0.4, 0.8, 1, 0.8, 0.2),
    elev: [300, 1700], topt: 12, tsd: 4, lag: [5, 14], eref: 25, minCap: 3,
    warning: 'Togliere la cuticola; in alcune persone ha effetto lassativo.',
    evidence: 'Euristica; legato solo ai pini.',
  },
  {
    id: 'terreum', group: 'moretta', name: 'Moretta', latin: 'Tricholoma terreum',
    forest: { [F.CON]: 1, [F.PIN]: 1 },
    months: m(0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.9, 1, 0.6),
    elev: [300, 1600], topt: 9, tsd: 3.5, lag: [7, 18], eref: 25, minCap: 3, frostTolerant: true,
    warning: 'Confondibile con Tricholoma pardinum (tossico): farla controllare all\'ASL.',
    evidence: 'Euristica; specie tardiva.',
  },
  {
    id: 'nuda', group: 'violetto', name: 'Agarico violetto', latin: 'Lepista nuda',
    forest: { [F.CON]: 0.9, [F.FAG]: 0.7, [F.CAS]: 0.6, [F.CER]: 0.6, [F.ARB]: 0.5, [F.NON]: 0.3 },
    months: m(0.1, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.8, 1, 0.7),
    elev: [200, 1600], topt: 8, tsd: 3.5, lag: [7, 18], eref: 25, minCap: 3, frostTolerant: true,
    warning: 'Da consumare solo ben cotto. Confondibile con cortinari violetti.',
    evidence: 'Euristica; specie tardiva.',
  },
];

// un filtro per fungo, con il nome che usano tutti (i porcini restano insieme); rep = la foto della chip
export const GROUPS = [
  { id: 'porcini', label: 'Porcini', rep: 'edulis' },
  { id: 'ovolo', label: 'Ovolo', rep: 'caesarea' },
  { id: 'finferlo', label: 'Finferlo', rep: 'cibarius' },
  { id: 'trombetta', label: 'Trombetta', rep: 'cornucopioides' },
  { id: 'steccherino', label: 'Steccherino', rep: 'repandum' },
  { id: 'mazza', label: 'Mazza di tamburo', rep: 'procera' },
  { id: 'chiodino', label: 'Chiodino', rep: 'mellea' },
  { id: 'colombina', label: 'Colombina', rep: 'virescens' },
  { id: 'pinarolo', label: 'Pinarolo', rep: 'suillus' },
  { id: 'moretta', label: 'Moretta', rep: 'terreum' },
  { id: 'violetto', label: 'Agarico violetto', rep: 'nuda' },
];
