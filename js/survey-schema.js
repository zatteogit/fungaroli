// Questionario per i cercatori esperti del Reatino: unica fonte dello schema delle risposte.
// Lo importano la pagina (/questionario) e il Worker (worker/survey.js). Modulo ES senza dipendenze.
//
// Regole della compilazione (richiesta di Matteo, 16/10/2026):
// - nessun numero preimpostato: i campi numerici sono vuoti (null) finché la persona non scrive;
// - le risposte rapide (QUICK_ANSWERS) sono categorie neutre che coprono tutto lo spettro,
//   sempre con «Non so» (DONT_KNOW) e con il testo libero accanto;
// - nessuna opzione preselezionata: lo schema non ha valori predefiniti.

export const SURVEY_ID = 'esperti-reatino';
export const SURVEY_VERSION = 1;
// Indirizzo dell'API (worker/survey.js): invio dalla pagina, esportazione e cancellazione dalla redazione.
export const SURVEY_ENDPOINT = '/api/survey/v1/responses';
export const MAX_BODY_BYTES = 64 * 1024;
// Nome e contatto facoltativi di chi risponde (lunghezza massima).
export const RESPONDENT_LIMITS = Object.freeze({ name: 80, contact: 120 });
// Anni ammessi dal contratto della versione 1 (episodi, buttate, uscite a vuoto).
export const YEAR_MIN = 2000, YEAR_MAX = 2026, NOTES_SINCE_MIN = 1950;

export const ZONES = Object.freeze([
  'Terminillo',
  'Leonessa',
  'Cittaducale, Antrodoco e valle del Velino',
  'Cicolano, valle del Salto e Turano',
  'Rascino',
  'Monti della Laga e Amatrice',
  'Cittareale e Alto Velino',
  'Monti Sabini (Tancia, Monte San Giovanni)',
]);

// catalogId: la voce corrispondente in data/species-traits.json (taxa), per collegare le risposte all'app.
export const SPECIES = Object.freeze([
  { id: 'edulis', label: 'Porcino (Boletus edulis)', catalogId: 'edulis' },
  { id: 'aereus', label: 'Porcino nero (B. aereus)', catalogId: 'aereus' },
  { id: 'reticulatus', label: 'Porcino estivo (B. reticulatus)', catalogId: 'aestivalis' },
  { id: 'pinophilus', label: 'Porcino rosso (B. pinophilus)', catalogId: 'pinophilus' },
  { id: 'caesarea', label: 'Ovolo buono', catalogId: 'caesarea' },
  { id: 'cantharellus', label: 'Finferlo, gallinaccio', catalogId: 'cibarius' },
  { id: 'armillaria', label: 'Chiodino', catalogId: 'mellea' },
  { id: 'procera', label: 'Mazza di tamburo', catalogId: 'procera' },
  { id: 'craterellus', label: 'Trombetta dei morti', catalogId: 'cornucopioides' },
  { id: 'hydnum', label: 'Steccherino dorato', catalogId: 'repandum' },
  { id: 'russula', label: 'Colombina, verdone', catalogId: 'virescens' },
  { id: 'suillus', label: 'Pinarolo', catalogId: 'suillus' },
  { id: 'terreum', label: 'Moretta', catalogId: 'terreum' },
  { id: 'nuda', label: 'Agarico violetto', catalogId: 'nuda' },
].map(Object.freeze));
export const SPECIES_IDS = Object.freeze(SPECIES.map((s) => s.id));
export const OTHER_SPECIES = 'altra';
export const speciesLabel = (id) => SPECIES.find((s) => s.id === id)?.label || null;

export const FORESTS = Object.freeze([
  'faggeta', 'castagneto', 'cerreta', 'roverella', 'carpino e orniello', 'leccio', 'pino nero o altre conifere piantate', 'misto',
]);

export const MONTHS = Object.freeze(['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']);
export const MONTH_PARTS = Object.freeze(['inizio', 'metà', 'fine']);
export const QUANTITIES = Object.freeze(['pochi (1–5)', 'discreti (6–20)', 'tanti (oltre 20)']);
export const EVENT_KINDS = Object.freeze(['calo di temperatura', 'gelata', 'vento secco', 'caldo', 'altro']);
export const SEEN = Object.freeze(['visto di persona', 'sentito dire']);
export const DATE_FROM = Object.freeze(['foto o appunti', 'memoria']);
export const ATTESTATO = Object.freeze(['sì', 'no', 'non dico']);
export const ASL_CHECK = Object.freeze(['sempre', 'a volte', 'mai', 'non dico']);
export const NOTE_KINDS = Object.freeze(['quaderno', 'foto con data', 'telefono', 'niente']);
// Cancello delle domande delicate della parte «Rischi» (intossicazioni, specie evitate): il testo si chiede
// solo dopo «sì». Dice se c'è qualcosa da raccontare, non che cosa: niente nomi da scegliere.
export const RISK_GATE = Object.freeze(['sì', 'no', 'non dico']);
// Altri cancelli, aggiunti il 16/10/2026 nella versione 1 (facoltativi): «La stagione è cambiata negli anni?»
// nelle schede specie e «Ricordi un episodio…?» della parte «Temperatura, vento e secco». Si salva anche il
// «no»: così chi risponde «no» si distingue da chi non ha risposto. Il dettaglio si chiede solo dopo «sì».
export const SEASON_GATE = Object.freeze(['sì', 'no', 'non so']);
export const WEATHER_GATE = Object.freeze(['sì', 'no']);
// Classifica «tocca in ordine di importanza»: posti 1–7 distinti, anche solo i primi.
export const RANKING_FACTORS = Object.freeze([
  { key: 'rain', label: 'Pioggia delle settimane prima' },
  { key: 'temperature', label: 'Temperatura degli ultimi giorni' },
  { key: 'forestType', label: 'Tipo di bosco' },
  { key: 'elevation', label: 'Quota' },
  { key: 'aspect', label: 'Versante' },
  { key: 'year', label: 'Annata' },
  { key: 'crowd', label: 'Quanta gente è passata' },
].map(Object.freeze));

// «Non so» è ammesso in ogni domanda aperta e non si combina con altre risposte rapide.
export const DONT_KNOW = 'non so';

// Risposte rapide per domanda: categorie, non stime. options = valori ammessi (oltre a DONT_KNOW),
// exclusive = valori che non si combinano con altri, single = al massimo una scelta.
// L'ordine alterna le direzioni (prima/dopo, più/meno) per non indicare una risposta «giusta».
const quick = (options, { exclusive = [], single = false } = {}) => Object.freeze({ options: Object.freeze(options), exclusive: Object.freeze(exclusive), single });
export const QUICK_ANSWERS = Object.freeze({
  'profile.mentor': quick(['un familiare', 'amici o compaesani', 'un gruppo micologico o un corso', 'libri o guide', 'ho imparato da solo']),
  'species.changed': quick(['comincia prima', 'comincia più tardi', 'finisce prima', 'finisce più tardi', 'dura di più', 'dura di meno',
    'si trova più in alto', 'si trova più in basso', 'è più irregolare', 'è più regolare', 'non è cambiata'], { exclusive: ['non è cambiata'] }),
  'rain.goodRain': quick(['un temporale forte', '2–3 giorni di pioggia', 'pioggia leggera e continua', 'più piogge a pochi giorni di distanza', 'dipende dalla stagione']),
  'rain.drySummer': quick(['serve più pioggia del solito', 'basta una pioggia normale', 'poi ne escono di meno', 'poi ne escono di più',
    'i funghi escono prima', 'i funghi escono più tardi', 'la stagione salta', 'non cambia molto', 'dipende dalla zona']),
  'rain.flushEnd': quick(['il freddo', 'una gelata', 'il vento secco', 'il caldo', 'la mancanza di pioggia', 'troppa pioggia', 'troppa gente', 'finisce da sola dopo un po\'']),
  'rain.lowRainSpecies': quick([...SPECIES.map((s) => s.label), 'nessuna'], { exclusive: ['nessuna'] }),
  'weatherEvents.effect': quick(['i funghi sono diminuiti', 'i funghi sono aumentati', 'i funghi si sono fermati', 'i funghi sono ripartiti',
    'i funghi si sono rovinati', 'nessun effetto visibile'], { exclusive: ['nessun effetto visibile'] }),
  'flushes.weatherBefore': quick(['temporali', 'piogge di più giorni', 'pioggia leggera', 'poca pioggia', 'caldo', 'fresco', 'nebbia o umidità', 'vento']),
  'emptyTrips.why': quick(['troppo secco', 'troppo bagnato', 'troppo freddo', 'troppo caldo', 'troppo presto nella stagione', 'troppo tardi nella stagione',
    'era già passata altra gente', 'posto sbagliato per quel periodo']),
  // I quattro versanti con lo stesso peso, a inizio e a fine stagione.
  'forest.aspect': quick(['inizio stagione: meglio a nord', 'inizio stagione: meglio a sud', 'inizio stagione: meglio a est', 'inizio stagione: meglio a ovest',
    'inizio stagione: il versante non conta', 'fine stagione: meglio a nord', 'fine stagione: meglio a sud', 'fine stagione: meglio a est', 'fine stagione: meglio a ovest',
    'fine stagione: il versante non conta', 'il versante non conta', 'dipende dalla quota'], { exclusive: ['il versante non conta'] }),
  'forest.cutAge': quick(['bosco tagliato da poco', 'ceduo vecchio', 'alto fusto', 'non fa differenza'], { exclusive: ['non fa differenza'] }),
  'forest.microsites': quick(['bordi del bosco e radure', 'lungo sentieri e strade forestali', 'fossi e avvallamenti', 'dossi e crinali',
    'sotto alberi grandi', 'tra muschio e foglie', 'pendii ripidi', 'zone in piano']),
  'forest.soil': quick(['sassoso', 'argilloso, pesante', 'sabbioso, sciolto', 'con tante foglie o aghi', 'con muschio', 'non ci faccio caso'], { exclusive: ['non ci faccio caso'] }),
  'forest.reliableSpots': quick(['sì, alcuni posti rendono quasi ogni anno', 'no, i posti buoni cambiano da un anno all\'altro'], { single: true }),
  // Segni creduti: si chiede anche quanto spesso hanno funzionato, per distinguere esperienza e credenza.
  'forest.indicators': quick(['altri funghi già nati', 'piante o fiori del sottobosco', 'umidità e odore del bosco', 'fasi della luna',
    'funziona quasi sempre', 'funziona a volte', 'funziona di rado', 'non ho contato quante volte ha funzionato', 'non uso segni'], { exclusive: ['non uso segni'] }),
  'access.gates': quick(['strade con sbarra', 'divieti di transito', 'terreni privati recintati', 'chiusure in certi periodi', 'non ne conosco'], { exclusive: ['non ne conosco'] }),
  'access.navigators': quick(['portano su strade chiuse', 'portano su sterrati difficili', 'sbagliano il punto di partenza', 'sbagliano i tempi', 'non ne conosco'], { exclusive: ['non ne conosco'] }),
  'access.localRules': quick(['serve un permesso del comune', 'serve un permesso degli usi civici o dell\'ASBUC', 'raccolta riservata ai residenti',
    'permesso a pagamento', 'non ne conosco'], { exclusive: ['non ne conosco'] }),
  'access.parks': quick(['in alcune zone la raccolta è vietata', 'serve un\'autorizzazione', 'ci sono controlli frequenti', 'non ne conosco'], { exclusive: ['non ne conosco'] }),
  'access.crowding': quick(['poco affollato', 'abbastanza affollato', 'molto affollato', 'più gente nei fine settimana', 'più gente dopo le piogge', 'arrivano cercatori da fuori']),
  'access.parking': quick(['nessun problema', 'pochi posti', 'parcheggi pieni nei giorni di punta', 'auto parcheggiate lungo la strada'], { exclusive: ['nessun problema'] }),
  // Scambi, intossicazioni e specie evitate restano solo testo: un elenco di nomi suggerirebbe la risposta.
  // Intossicazioni e specie evitate hanno prima un cancello sì/no (RISK_GATE), che non suggerisce contenuti.
  'risks.beginnerErrors': quick(['raccolgono funghi che non conoscono', 'non fanno controllare il raccolto', 'raccolgono esemplari troppo vecchi',
    'usano buste di plastica', 'rovinano il bosco', 'si perdono o restano fuori al buio']),
  'risks.mountainDangers': quick(['nebbia e orientamento', 'pendii ripidi e scivolosi', 'buio', 'temporali e fulmini', 'animali (cani da pastore, vipere, cinghiali)',
    'caccia', 'nessuno in particolare'], { exclusive: ['nessuno in particolare'] }),
  'followUp.knowsOthers': quick(['sì, gli passo il link', 'sì, ne parliamo quando mi ricontattate', 'no'], { single: true }),
});

// --- Autocomplete della zona -------------------------------------------------------------------
// Comuni della provincia di Rieti con codice statistico ISTAT (codice provincia 057): 73 comuni.
// Fonte: ISTAT, «Elenco dei comuni italiani», file CSV
// https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
// (file aggiornato al 26/01/2024, consultato il 16/10/2026; righe con sigla automobilistica RI).
// Licenza: Creative Commons Attribuzione 4.0 (https://www.istat.it/note-legali/).
export const MUNICIPALITIES_SOURCE = Object.freeze({
  title: 'ISTAT, Elenco dei comuni italiani',
  url: 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv',
  updated: '2024-01-26', consulted: '2026-10-16', count: 73,
  license: 'CC BY 4.0', licenseUrl: 'https://www.istat.it/note-legali/',
});
export const MUNICIPALITIES = Object.freeze([
  ['057001', 'Accumoli'], ['057002', 'Amatrice'], ['057003', 'Antrodoco'], ['057004', 'Ascrea'], ['057005', 'Belmonte in Sabina'],
  ['057006', 'Borbona'], ['057007', 'Borgorose'], ['057008', 'Borgo Velino'], ['057009', 'Cantalice'], ['057010', 'Cantalupo in Sabina'],
  ['057011', 'Casaprota'], ['057012', 'Casperia'], ['057013', 'Castel di Tora'], ['057014', 'Castelnuovo di Farfa'], ['057015', 'Castel Sant\'Angelo'],
  ['057016', 'Cittaducale'], ['057017', 'Cittareale'], ['057018', 'Collalto Sabino'], ['057019', 'Colle di Tora'], ['057020', 'Collegiove'],
  ['057021', 'Collevecchio'], ['057022', 'Colli sul Velino'], ['057023', 'Concerviano'], ['057024', 'Configni'], ['057025', 'Contigliano'],
  ['057026', 'Cottanello'], ['057027', 'Fara in Sabina'], ['057028', 'Fiamignano'], ['057029', 'Forano'], ['057030', 'Frasso Sabino'],
  ['057031', 'Greccio'], ['057032', 'Labro'], ['057033', 'Leonessa'], ['057034', 'Longone Sabino'], ['057035', 'Magliano Sabina'],
  ['057036', 'Marcetelli'], ['057037', 'Micigliano'], ['057038', 'Mompeo'], ['057039', 'Montasola'], ['057040', 'Montebuono'],
  ['057041', 'Monteleone Sabino'], ['057042', 'Montenero Sabino'], ['057043', 'Monte San Giovanni in Sabina'], ['057044', 'Montopoli di Sabina'], ['057045', 'Morro Reatino'],
  ['057046', 'Nespolo'], ['057047', 'Orvinio'], ['057048', 'Paganico Sabino'], ['057049', 'Pescorocchiano'], ['057050', 'Petrella Salto'],
  ['057051', 'Poggio Bustone'], ['057052', 'Poggio Catino'], ['057053', 'Poggio Mirteto'], ['057054', 'Poggio Moiano'], ['057055', 'Poggio Nativo'],
  ['057056', 'Poggio San Lorenzo'], ['057057', 'Posta'], ['057058', 'Pozzaglia Sabina'], ['057059', 'Rieti'], ['057060', 'Rivodutri'],
  ['057061', 'Roccantica'], ['057062', 'Rocca Sinibalda'], ['057063', 'Salisano'], ['057064', 'Scandriglia'], ['057065', 'Selci'],
  ['057066', 'Stimigliano'], ['057067', 'Tarano'], ['057068', 'Toffia'], ['057069', 'Torricella in Sabina'], ['057070', 'Torri in Sabina'],
  ['057071', 'Turania'], ['057072', 'Vacone'], ['057073', 'Varco Sabino'],
].map(([code, name]) => Object.freeze({ code, name })));

// Località principali (frazioni e luoghi noti ai cercatori), con il comune in cui ricadono.
// Comune verificato su OpenStreetMap (Nominatim, consultato il 16/10/2026; dati © OpenStreetMap, ODbL).
// Rilievi, laghi e valli stanno su più comuni: municipality null.
export const PLACES_SOURCE = Object.freeze({
  title: 'OpenStreetMap (Nominatim)', url: 'https://nominatim.openstreetmap.org/', consulted: '2026-10-16',
  license: 'ODbL 1.0', licenseUrl: 'https://www.openstreetmap.org/copyright',
});
export const PLACES = Object.freeze([
  ['Pian de\' Valli', 'Rieti'], ['Campoforogna', 'Rieti'], ['Lisciano', 'Rieti'], ['Pian de\' Rosce', 'Rieti'],
  ['San Giovanni Reatino', 'Rieti'], ['Poggio Fidoni', 'Rieti'], ['Vallonina', 'Leonessa'], ['Albaneto', 'Leonessa'],
  ['Piana di Rascino', 'Fiamignano'], ['Corvaro', 'Borgorose'], ['Sant\'Anatolia', 'Borgorose'], ['Leofreni', 'Pescorocchiano'],
  ['Tonnicoda', 'Pescorocchiano'], ['Fiumata', 'Petrella Salto'], ['Rocca di Corno', 'Antrodoco'], ['Colle Rinaldo', 'Borgo Velino'],
  ['Sigillo', 'Posta'], ['Domo', 'Amatrice'], ['Configno', 'Amatrice'], ['Torrita', 'Amatrice'], ['Grisciano', 'Accumoli'],
  ['Monte Terminillo', null], ['Monte Tancia', null], ['Monte Navegna', null], ['Lago del Salto', null], ['Lago del Turano', null],
].map(([name, municipality]) => Object.freeze({ name, municipality })));

// Suggerimenti per i campi «zona» (datalist o combobox): macro-zone, località con il comune, comuni.
// Il campo accetta anche testo libero (al massimo 80 caratteri).
export const ZONE_SUGGESTIONS = Object.freeze([...new Set([
  ...ZONES,
  ...PLACES.map((p) => p.municipality ? `${p.name} (${p.municipality})` : p.name),
  ...MUNICIPALITIES.map((m) => m.name),
])]);

// --- Schema delle risposte ---------------------------------------------------------------------
// Limiti delle liste (completa) e della versione breve. La breve è solo una scelta della pagina:
// passando alla completa non si perde nulla, e il server accetta sempre i limiti della completa.
export const LIST_LIMITS = Object.freeze({ species: 15, weatherEvents: 10, flushes: 10, emptyTrips: 10 });
export const SHORT_LIMITS = Object.freeze({ species: 3, flushes: 3, emptyTrips: 1 });

const int = (min, max) => ({ t: 'int', min, max });
const dec = (min, max) => ({ t: 'dec', min, max });
const text = (max) => ({ t: 'text', max });
const open = (max, key) => ({ t: 'open', max, key });
const oneOf = (values, required = false) => ({ t: 'enum', values, required });
const setOf = (values, exclusive = []) => ({ t: 'set', values, exclusive });
const month = { t: 'month' };
const list = (max, item, check) => ({ t: 'list', max, item, check });
const obj = (fields, check) => ({ t: 'obj', fields, check });

// Le precisazioni restano accanto alle risposte della stessa scheda, senza cambiare il tipo dei valori.
// «Non pertinente» è distinto da una casella lasciata vuota. «Altro» può accompagnare una risposta.
const questions = (fields, check) => obj({ ...fields,
  clarifications: list(Object.keys(fields).length, obj({
    field: oneOf(Object.keys(fields).filter((k) => !fields[k].required && k !== 'notApplicableParts'), true),
    kind: oneOf(['other', 'not_applicable'], true), text: text(600),
  })),
}, (item, err) => {
  check?.(item, err);
  const seen = new Set();
  for (const note of item.clarifications || []) {
    if (seen.has(note.field)) err('clarifications', 'Una sola precisazione per domanda.');
    seen.add(note.field);
    if (note.kind === 'other' && !note.text) err('clarifications', 'Specifica la risposta «Altro».');
    if (note.kind === 'not_applicable' && hasSurveyAnswers(item[note.field]))
      err('clarifications', 'Una domanda non pertinente non può avere anche una risposta.');
  }
});

// Cancello → domanda che apre (parte «Rischi»).
export const RISK_GATES = Object.freeze([['knowsPoisonings', 'poisonings'], ['avoidsSpecies', 'avoided']]);

const elev = int(0, 3000), lag = int(0, 60), year = int(YEAR_MIN, YEAR_MAX), monthNum = int(1, 12), week = int(1, 5), hours = dec(0, 24);
const zoneText = text(80);

// Vero se i valori presenti (non null) sono in ordine crescente o uguali.
function ordered(item, keys) {
  const values = keys.map((k) => item[k]).filter((v) => v != null);
  return values.every((v, i) => i === 0 || values[i - 1] <= v);
}

export const ANSWERS_SPEC = questions({
  notApplicableParts: setOf(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
  profile: questions({
    years: int(0, 80), mentor: open(300, 'profile.mentor'), zones: setOf(ZONES), zonesOther: text(200),
    tripsGoodYear: int(0, 300), tripsBadYear: int(0, 300), speciesSought: setOf(SPECIES_IDS),
    attestato: oneOf(ATTESTATO), aslCheck: oneOf(ASL_CHECK), notes: setOf(NOTE_KINDS, ['niente']), notesSince: int(NOTES_SINCE_MIN, YEAR_MAX),
  }),
  species: list(LIST_LIMITS.species, questions({
    id: oneOf([...SPECIES_IDS, OTHER_SPECIES], true), name: text(60),
    start: month, peak: month, end: month, seasonChanged: oneOf(SEASON_GATE), changed: open(300, 'species.changed'),
    elevMin: elev, elevMax: elev, elevMode: elev, forests: setOf(FORESTS), forestsNever: setOf(FORESTS),
    lagMin: lag, lagTyp: lag, lagMax: lag, flushDays: lag, confidence: int(1, 5),
  }, (item, err) => {
    if (item.id === OTHER_SPECIES && !item.name) err('name', 'Scrivi il nome della specie.');
    if (item.seasonChanged && item.seasonChanged !== 'sì' && item.changed != null) err('changed', 'Hai risposto «No» o «Non so» sulla stagione: «Come è cambiata?» va lasciata vuota.');
    if (!ordered(item, ['elevMin', 'elevMax'])) err('elevMax', 'La quota massima non può essere più bassa della minima.');
    else if (!ordered(item, ['elevMin', 'elevMode', 'elevMax'])) err('elevMode', 'La quota più frequente deve stare tra la minima e la massima.');
    if (!ordered(item, ['lagMin', 'lagTyp', 'lagMax'])) err('lagMax', 'I giorni vanno in ordine: minimo, di solito, massimo.');
    const never = new Set(item.forestsNever || []);
    if ((item.forests || []).some((f) => never.has(f))) err('forestsNever', 'Un bosco non può stare sia tra quelli dove la trovi sia tra quelli dove non la trovi mai.');
  }), (items, err) => {
    const ids = items.map((s) => s.id).filter((id) => id !== OTHER_SPECIES);
    const twice = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (twice.length) err(`${describe([...new Set(twice)].map(speciesLabel))}: c'è già una scheda per questa specie.`);
  }),
  rain: questions({
    goodRain: open(600, 'rain.goodRain'), drySummer: open(600, 'rain.drySummer'),
    flushEnd: open(600, 'rain.flushEnd'), lowRainSpecies: open(600, 'rain.lowRainSpecies'),
  }),
  weatherRemembers: oneOf(WEATHER_GATE),
  weatherEvents: list(LIST_LIMITS.weatherEvents, questions({
    year, month: monthNum, zone: zoneText, kind: oneOf(EVENT_KINDS), effect: open(400, 'weatherEvents.effect'),
    daysAfter: lag, seen: oneOf(SEEN),
  })),
  flushes: list(LIST_LIMITS.flushes, questions({
    year, month: monthNum, week, zone: zoneText, elev, forest: oneOf(FORESTS), species: text(60),
    quantity: oneOf(QUANTITIES), hours, weatherBefore: open(300, 'flushes.weatherBefore'), dateFrom: oneOf(DATE_FROM),
  })),
  emptyTrips: list(LIST_LIMITS.emptyTrips, questions({
    year, month: monthNum, week, zone: zoneText, elev, forest: oneOf(FORESTS), speciesSought: setOf(SPECIES_IDS),
    hours, why: open(300, 'emptyTrips.why'), dateFrom: oneOf(DATE_FROM),
  })),
  forest: questions({
    aspect: open(600, 'forest.aspect'), cutAge: open(600, 'forest.cutAge'), microsites: open(600, 'forest.microsites'),
    soil: open(600, 'forest.soil'), reliableSpots: open(600, 'forest.reliableSpots'), indicators: open(600, 'forest.indicators'),
    ranking: obj(Object.fromEntries(RANKING_FACTORS.map((f) => [f.key, int(1, RANKING_FACTORS.length)])), (item, err) => {
      const seen = new Map();
      for (const f of RANKING_FACTORS) {
        const v = item[f.key];
        if (v == null) continue;
        if (seen.has(v)) err(f.key, `Il posto ${v} è già stato dato a «${seen.get(v)}».`);
        else seen.set(v, f.label);
      }
    }),
  }),
  access: questions({
    gates: open(800, 'access.gates'), navigators: open(600, 'access.navigators'), localRules: open(800, 'access.localRules'),
    parks: open(600, 'access.parks'), crowding: open(600, 'access.crowding'), parking: open(600, 'access.parking'),
  }),
  // knowsPoisonings e avoidsSpecies: cancelli aggiunti il 16/10/2026, facoltativi. Una risposta senza cancello
  // (testo e basta) resta valida; con «no» o «non dico» il testo non c'è.
  risks: questions({
    confusions: open(800, 'risks.confusions'), knowsPoisonings: oneOf(RISK_GATE), poisonings: open(800, 'risks.poisonings'),
    beginnerErrors: open(800, 'risks.beginnerErrors'), avoidsSpecies: oneOf(RISK_GATE), avoided: open(600, 'risks.avoided'),
    mountainDangers: open(800, 'risks.mountainDangers'),
  }, (item, err) => {
    for (const [gate, key] of RISK_GATES) if (item[gate] && item[gate] !== 'sì' && item[key] != null)
      err(key, 'Hai risposto «No» o «Preferisco non dirlo»: questa risposta va lasciata vuota.');
  }),
  followUp: questions({ knowsOthers: open(300, 'followUp.knowsOthers') }),
}, (item, err) => {
  const partFields = {A:['profile'], B:['species'], C:['rain'], D:['weatherRemembers','weatherEvents'], E:['flushes','emptyTrips'], F:['forest'], G:['access'], H:['risks']};
  for (const part of item.notApplicableParts || [])
    if (partFields[part].some((key) => hasSurveyAnswers(item[key]))) err('notApplicableParts', 'Una parte non pertinente non può contenere risposte.');
  if (item.weatherRemembers === 'no' && item.weatherEvents?.length) err('weatherEvents', 'Hai risposto di non ricordare episodi: l’elenco va lasciato vuoto.');
});

// Regole di un campo dal suo percorso, senza indici: fieldSpec('rain.goodRain').max → 600,
// fieldSpec('species.elevMin') → {t:'int', min:0, max:3000}. Serve alla pagina per maxlength, min e max.
export function fieldSpec(path) {
  let spec = ANSWERS_SPEC;
  for (const key of String(path).split('.')) {
    if (spec?.t === 'list') spec = spec.item;
    spec = spec?.t === 'obj' && Object.hasOwn(spec.fields, key) ? spec.fields[key] : undefined;
  }
  return spec || null;
}

// La scelta «non conta» esclude solo i versanti della stessa fase; quella globale resta compatibile
// con le risposte già raccolte. Pagina e server condividono la stessa regola.
export function quickChoicesConflict(key, a, b) {
  if (a === b) return false;
  const q = QUICK_ANSWERS[key];
  if ([a, b].some((v) => v === DONT_KNOW || q?.exclusive.includes(v))) return true;
  return key === 'forest.aspect' && ['inizio stagione', 'fine stagione'].some((phase) =>
    a.startsWith(phase + ':') && b.startsWith(phase + ':') && [a, b].includes(phase + ': il versante non conta'));
}

// Conta anche zero e «no», ma non contenitori, spazi o schede senza risposte.
export function hasSurveyAnswers(value) {
  if (typeof value === 'string') return cleanText(value).length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(hasSurveyAnswers);
  return value != null && typeof value === 'object' && Object.values(value).some(hasSurveyAnswers);
}

export const SURVEY_RETENTION = Object.freeze({ contactUntil: '2028-01-01T00:00:00.000Z', answersUntil: '2029-01-01T00:00:00.000Z' });

// --- Validazione -------------------------------------------------------------------------------
// Testo: forma NFC, a capo uniformi, niente caratteri di controllo né di direzione del testo.
// L'HTML non viene interpretato: resta testo, e chi lo mostra deve usare textContent.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;
export const cleanText = (value) => String(value).normalize('NFC').replace(/\r\n?/g, '\n').replace(CONTROL, '').trim();
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
const describe = (values) => values.map((v) => `«${v}»`).join(', ');

function toNumber(v, decimals) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return NaN;
  const s = v.trim();
  if (!(decimals ? /^\d+(?:[.,]\d+)?$/ : /^\d+$/).test(s)) return NaN;
  return Number(s.replace(',', '.'));
}

function checkValue(spec, v, path, errors) {
  const err = (message, at = path) => { errors.push({ field: at, message }); return undefined; };
  switch (spec.t) {
    case 'int': case 'dec': {
      if (v == null || v === '') return null;
      const n = toNumber(v, spec.t === 'dec');
      const ok = Number.isFinite(n) && n >= spec.min && n <= spec.max && (spec.t === 'dec' || Number.isInteger(n));
      if (!ok) return err(spec.t === 'int'
        ? `Scrivi un numero intero da ${spec.min} a ${spec.max}, oppure lascia vuoto.`
        : `Scrivi un numero da ${spec.min} a ${spec.max}, oppure lascia vuoto.`);
      return spec.t === 'dec' ? Math.round(n * 100) / 100 : n;
    }
    case 'text': {
      if (v == null) return null;
      if (typeof v !== 'string') return err('Serve un testo.');
      const s = cleanText(v);
      if (s.length > spec.max) return err(`Testo troppo lungo: al massimo ${spec.max} caratteri.`);
      return s || null;
    }
    case 'open': {
      if (v == null) return null;
      let quickValues = [], raw = v;
      if (isPlainObject(v)) {
        const extra = Object.keys(v).filter((k) => k !== 'quick' && k !== 'text');
        if (extra.length) return err(`Campo sconosciuto: ${extra.join(', ')}.`);
        quickValues = v.quick == null ? [] : v.quick;
        raw = v.text == null ? '' : v.text;
      }
      if (typeof raw !== 'string') return err('Serve un testo.');
      const s = cleanText(raw);
      if (s.length > spec.max) return err(`Testo troppo lungo: al massimo ${spec.max} caratteri.`, path + '.text');
      const q = QUICK_ANSWERS[spec.key] || quick([]);
      const chosen = checkSet(quickValues, [...q.options, DONT_KNOW], [...q.exclusive, DONT_KNOW], path + '.quick', errors);
      if (chosen === undefined) return undefined;
      if (chosen.some((a, i) => chosen.slice(i + 1).some((b) => quickChoicesConflict(spec.key, a, b))))
        return err('Le scelte della stessa fase non si combinano.', path + '.quick');
      if (q.single && chosen.length > 1) return err('Scegli una sola risposta.', path + '.quick');
      return chosen.length || s ? { quick: chosen, text: s } : null;
    }
    case 'enum': {
      if (v == null || v === '') return spec.required ? err('Scegli una voce.') : null;
      if (typeof v !== 'string' || !spec.values.includes(v)) return err('Scelta non valida.');
      return v;
    }
    case 'set': return checkSet(v, spec.values, spec.exclusive, path, errors);
    case 'month': {
      if (v == null) return null;
      if (!isPlainObject(v)) return err('Indica il mese.');
      const extra = Object.keys(v).filter((k) => k !== 'month' && k !== 'part');
      if (extra.length) return err(`Campo sconosciuto: ${extra.join(', ')}.`);
      const m = toNumber(v.month, false);
      if (!Number.isInteger(m) || m < 1 || m > 12) return err('Indica un mese da 1 a 12.', path + '.month');
      if (v.part != null && v.part !== '' && !MONTH_PARTS.includes(v.part)) return err('Scegli inizio, metà o fine.', path + '.part');
      return { month: m, part: v.part || null };
    }
    case 'list': {
      if (v == null) return [];
      if (!Array.isArray(v)) return err('Serve un elenco.');
      if (v.length > spec.max) return err(`Al massimo ${spec.max} voci.`);
      const out = [];
      v.forEach((item, i) => {
        const value = checkValue(spec.item, item, `${path}[${i}]`, errors);
        if (value && Object.values(value).some((x) => !empty(x))) out.push(value);
      });
      spec.check?.(out, (message) => err(message));
      return out;
    }
    case 'obj': {
      if (v == null) return null;
      if (!isPlainObject(v)) return err('Serve un gruppo di risposte.');
      const out = {};
      for (const key of Object.keys(v)) {
        if (!Object.hasOwn(spec.fields, key)) { err('Campo sconosciuto.', `${path}.${key}`); continue; }
        const value = checkValue(spec.fields[key], v[key], `${path}.${key}`, errors);
        if (value !== undefined) out[key] = value;
      }
      for (const [key, field] of Object.entries(spec.fields)) if (field.required && !Object.hasOwn(v, key)) err('Scegli una voce.', `${path}.${key}`);
      spec.check?.(out, (key, message) => err(message, `${path}.${key}`));
      return out;
    }
    default: throw new Error('Tipo di campo sconosciuto: ' + spec.t);
  }
}

function checkSet(v, values, exclusive, path, errors) {
  const err = (message) => { errors.push({ field: path, message }); return undefined; };
  if (v == null) return [];
  if (!Array.isArray(v)) return err('Serve un elenco di scelte.');
  if (v.some((x) => typeof x !== 'string' || !values.includes(x))) return err('Scelta non valida.');
  if (new Set(v).size !== v.length) return err('Hai scelto due volte la stessa voce.');
  const alone = v.filter((x) => exclusive.includes(x));
  if (alone.length && v.length > 1) return err(`${describe(alone)} non si combina con altre scelte.`);
  return [...v];
}

// La chiave resta «anonymousUse» (contratto della versione 1), ma il testo non dice «anonimo»: le risposte
// restano legate alla ricevuta e, se dati, a nome e contatto. Sono dati personali (vedi l'informativa).
const CONSENT_MISSING = 'Per inviare serve il tuo consenso: spunta la casella qui sopra.';
const BODY_KEYS = ['survey', 'version', 'startedAt', 'website', 'respondent', 'consent', 'answers'];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

// validateSurvey(body) → {ok, value, errors}: errors = [{field, message}] con il percorso del campo
// (es. «answers.species[0].elevMin»). value è il corpo normalizzato, senza il campo trappola.
export function validateSurvey(body) {
  const errors = [];
  const err = (field, message) => errors.push({ field, message });
  if (!isPlainObject(body)) return { ok: false, value: null, errors: [{ field: '', message: 'Richiesta non valida.' }] };
  for (const key of Object.keys(body)) if (!BODY_KEYS.includes(key)) err(key, 'Campo sconosciuto.');
  if (body.survey !== SURVEY_ID) err('survey', 'Questionario sconosciuto.');
  if (body.version !== SURVEY_VERSION) err('version', 'Versione del questionario non valida: ricarica la pagina.');
  // L'ora di inizio serve solo a stimare la durata: se non è valida si ignora, senza bloccare l'invio.
  const startedAt = typeof body.startedAt === 'string' && ISO.test(body.startedAt) && Number.isFinite(Date.parse(body.startedAt))
    ? new Date(Date.parse(body.startedAt)).toISOString() : null;
  if (body.website != null && (typeof body.website !== 'string' || body.website.trim() !== '')) err('website', 'Questo campo deve restare vuoto.');
  const respondent = checkValue(obj({ name: text(RESPONDENT_LIMITS.name), contact: text(RESPONDENT_LIMITS.contact) }), body.respondent, 'respondent', errors) || {};
  let consent = null;
  if (!isPlainObject(body.consent)) err('consent.anonymousUse', CONSENT_MISSING);
  else {
    for (const key of Object.keys(body.consent)) if (!['anonymousUse', 'recontact', 'diary'].includes(key)) err(`consent.${key}`, 'Campo sconosciuto.');
    if (body.consent.anonymousUse !== true) err('consent.anonymousUse', CONSENT_MISSING);
    for (const key of ['recontact', 'diary']) if (body.consent[key] != null && typeof body.consent[key] !== 'boolean') err(`consent.${key}`, 'Rispondi sì o no.');
    consent = { anonymousUse: true, recontact: body.consent.recontact === true, diary: body.consent.diary === true };
  }
  let answers = null;
  if (!isPlainObject(body.answers)) err('answers', 'Mancano le risposte.');
  else answers = checkValue(ANSWERS_SPEC, body.answers, 'answers', errors);
  if (errors.length) return { ok: false, value: null, errors };
  // Il contatto serve solo per ricontattare o per il taccuino delle uscite: senza uno dei due «sì»
  // non si salva (minimizzazione dei dati). La pagina lo chiede solo dopo un «sì».
  const contact = consent.recontact || consent.diary ? respondent.contact ?? null : null;
  return { ok: true, errors: [], value: {
    survey: SURVEY_ID, version: SURVEY_VERSION, startedAt,
    respondent: { name: respondent.name ?? null, contact }, consent, answers,
  } };
}
