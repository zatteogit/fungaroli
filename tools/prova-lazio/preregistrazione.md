# Prova retrospettiva sul Lazio: preregistrazione

Scritta il 21 ottobre 2026, **prima di calcolare qualsiasi legame fra meteo o indice ed esito**. Ramo locale
`lavoro-prova-lazio`, commit di partenza `4229457` (produzione v323, modello 2.1.0).
Decisione di Matteo del 21/10/2026: prova retrospettiva preregistrata sul Lazio con lo storico di iNaturalist e GBIF,
**per verificare l'indice, non per spingerlo**. Le segnalazioni esterne servono per la verifica, non per ordinare le
uscite. Modello di forma e rigore: `tools/benchmark-bielefeld/preregistrazione.md`.
Riferimenti: `docs/ipotesi/valutazione-modello-v3.md` (2.4 punto 9, 4.5, 5 passo 4),
`docs/registro-segnalazioni-esterne-2026-10-20.md`, `docs/metodo-scientifico.md`.

**Che cosa è stato guardato finora.** Solo conteggi (sezione 3): record per specie, anno, mese e provincia, precisione
delle coordinate, licenze, chiavi tassonomiche, documentazione e limiti di Open-Meteo. Una sola richiesta di prova,
per controllare i parametri dell'API, ha restituito i 6 record research grade del porcino: se ne sono letti
identificativo, data, licenza, precisione e oscuramento; le coordinate non sono state lette né conservate. Nessun dato meteo è stato scaricato per luoghi o date delle osservazioni: l'unica richiesta
meteo di prova (un punto fisso nel Reatino) ha ricevuto un rifiuto per quota esaurita (3.6). Nessun fattore
dell'indice è stato calcolato su dati reali: `js/model.js` e `js/weather.js` sono stati importati solo su una serie
fittizia, per provare che si caricano in Node. Gli script dei conteggi stanno nello scratchpad della sessione, fuori
dal repository; le query sono descritte qui.

**Regola.** Dopo il commit questo file non si modifica, nemmeno per errori materiali. Ogni cambiamento va nella
sezione «Deviazioni» del README (sezione 13).

Legenda: **Fatto verificato** = controllato oggi su dati, codice o fonte. **Interpretazione** = lettura nostra di un
fatto. **Ipotesi** = da mettere alla prova o non verificabile. **Non verificato** = dichiarato da una fonte, non
controllato da noi.

## 1. Scopo e confini

**Domanda principale.** Il giorno di un ritrovamento, la parte meteo dell'indice della specie trovata è più alta che
nei giorni di confronto? «Parte meteo» = il prodotto di `seasonWeight` e dei fattori di `weatherFactors` per quella
specie: pioggia × temperatura × umidità del suolo × gelo × caldo × shock (sezione 6).

- È una prova di **ordinamento**. Non stima una probabilità, non calibra nulla, non dà soglie. L'indice resta
  sperimentale (0–10) e non è una probabilità.
- **Nessun esito cambia l'app.** `js/model.js`, `js/species.js` e `js/weather.js` non si toccano: si importano. Un
  eventuale cambiamento richiede una decisione di Matteo.
- Le segnalazioni esterne (iNaturalist, GBIF) qui servono solo a verificare. Non entrano nell'ordine delle uscite e
  non modificano `externalFieldEvidence` né il registro del 20/10.
- I dati sono pochi (sezione 3). «Non distinguibile» e «non valutabile» sono esiti validi, non fallimenti, e non
  vogliono dire «uguali».

## 2. Dati

### 2.1 Fonti (Fatto verificato il 21/10/2026, salvo dove indicato)

| Fonte | Uso | Termini |
|---|---|---|
| iNaturalist API v1 (`https://api.inaturalist.org/v1/`) | osservazioni: casi e controlli | licenza scelta per record da chi osserva (sezione 2.6) |
| GBIF occurrence API (`https://api.gbif.org/v1/occurrence/`) | osservazioni di altri dataset | licenza per dataset (CC0, CC BY 4.0, CC BY-NC 4.0) |
| GBIF Backbone Taxonomy, versione del 28/08/2023 (dataset `d7dddbf4-2cf0-4f39-9b2a-bb099caae36c`, CC BY 4.0) | nomi accettati e sinonimi | CC BY 4.0 |
| Open-Meteo Historical Forecast API (`https://historical-forecast-api.open-meteo.com/v1/forecast`) | meteo principale | dati CC BY 4.0; API gratuita solo per uso non commerciale |
| Open-Meteo Historical Weather API, «Archive» (`https://archive-api.open-meteo.com/v1/archive`) | meteo di controllo | come sopra |
| Open-Meteo Elevation API (`https://api.open-meteo.com/v1/elevation`) | quota dei punti (2.5) | come sopra |
| Confine del Lazio: geometria del luogo iNaturalist 8670 («Lazio, IT») | filtro spaziale comune alle due fonti | scaricata una volta e conservata con hash in `dati/` |

### 2.2 Taxa

Solo le 14 specie fungine con un modello in `js/species.js` (nessuna pianta). Nomi accettati e sinonimi dal GBIF
Backbone; per iNaturalist il taxon indicato e tutti i suoi discendenti (sottospecie, varietà, forme).

| `id` dell'app | Nome nell'app | Nomi usati | iNaturalist (taxon id) | GBIF Backbone (chiave accettata) | Nota |
|---|---|---|---|---|---|
| edulis | Porcino | *Boletus edulis* | 48701 | 5954958 | |
| pinophilus | Porcino rosso | *Boletus pinophilus* | 335942 | 5954949 | |
| aereus | Porcino nero | *Boletus aereus* | 333772 | 8733688 | |
| aestivalis | Porcino estivo | *Boletus reticulatus* (= *B. aestivalis*) | 350216 | 5954691 | nel Backbone *B. aestivalis* è sinonimo di *B. reticulatus* |
| caesarea | Ovolo buono | *Amanita caesarea* | 204588 | 5240269 | |
| cibarius | Finferlo | *Cantharellus cibarius* | 47347 | 5249504 | *C. pallens* e *C. roseocanus* sono specie separate in iNaturalist: esclusi |
| cornucopioides | Trombetta dei morti | *Craterellus cornucopioides* | 48607 | 2554662 | |
| repandum | Steccherino dorato | *Hydnum repandum* | 48641 | 2554716 | *H. rufescens* e *H. albidum* separati: esclusi |
| procera | Mazza di tamburo | *Macrolepiota procera* | 63401 | 8914748 | |
| mellea | Chiodino | *Armillaria mellea* | 55950 | 2536891 | |
| virescens | Colombina | *Russula virescens*, *R. cyanoxantha* | 125720, 194437 | 2551423, 2551542 | due specie, un solo modello |
| suillus | Pinarolo | *Suillus luteus*, *S. granulatus*, *S. collinitus* | 53488, 179065, 363592 | 7777157, 8146046, 9104622 | tre specie, un solo modello |
| terreum | Moretta | *Tricholoma terreum* | 341797 | 5241808 | *T. scalpturatum* e *T. argyraceum* separati: esclusi |
| nuda | Agarico violetto | *Lepista nuda* (= *Collybia nuda* in iNaturalist) | 1525548 | 5242048 | «*Collybia nuda*» non ha corrispondenza nel Backbone 2023 |

**Fatto verificato** (`species/match` con `strict=true`, `kingdom=Fungi`): tutti i nomi hanno corrispondenza esatta,
con confidenza 100. Il numero di sinonimi del Backbone va da 7 (*R. virescens*) a 49 (*B. edulis*). Le liste
complete si salvano in `dati/taxa.json` all'esecuzione. Le ricerche GBIF per chiave accettata comprendono già i record
pubblicati con un sinonimo, perché GBIF li interpreta sul nome accettato.

**Regola per i record GBIF con nome non interpretato.** Un record il cui `scientificName` verbatim è un sinonimo del
Backbone o «*Collybia nuda*» ma che GBIF ha assegnato solo al genere entra con la specie del nome verbatim. Ogni altro
record assegnato solo al genere non è un caso.

**Esclusioni dai controlli** (sezione 4.2): le osservazioni identificate come una delle 18 specie qui sopra (con i
discendenti), oppure identificate solo a un rango fra il genere e la specie di uno degli 11 generi in prova (*Boletus*,
*Amanita*, *Cantharellus*, *Craterellus*, *Hydnum*, *Macrolepiota*, *Armillaria*, *Russula*, *Suillus*, *Tricholoma*,
*Collybia*/*Lepista*), per esempio «*Boletus* sect. *Boletus*» o «*Boletus*». Le altre specie di quei generi restano
controlli. **Interpretazione:** un'osservazione di un sosia (per esempio *C. pallens*) può essere una specie in prova
identificata in modo diverso. Fra i controlli spinge l'AUC verso ½: rende la prova più severa, non più favorevole.

### 2.3 Filtri (fissati ora)

- **Periodo dei dati:** date di osservazione dal 01/01/2015 al 31/12/2025. Il **2026 non si usa** (stagione in corso,
  identificazioni non assestate): resta riservato a una conferma con questo stesso protocollo, non prima del
  31/03/2027, decisa da Matteo.
- **Data:** un giorno solo. iNaturalist: `observed_on` presente. GBIF: `eventDate` di un giorno (anno, mese e giorno
  presenti; niente intervalli).
- **Luogo:** punto dentro la geometria del luogo iNaturalist 8670 (Lazio), per entrambe le fonti. Per le richieste GBIF
  il prefiltro è `gadmGid=ITA.8_1`.
- **Qualità dei casi:** iNaturalist `quality_grade = research`. GBIF: `basisOfRecord` HUMAN_OBSERVATION o
  PRESERVED_SPECIMEN, `occurrenceStatus = PRESENT`, `hasGeospatialIssue = false`.
- **Qualità dei controlli:** iNaturalist `research` o `needs_id` (mai `casual`, che comprende coltivati e record senza
  data o luogo); GBIF come per i casi.
- **Precisione delle coordinate: incertezza dichiarata e ≤ 1000 m.** iNaturalist: `positional_accuracy` presente e
  ≤ 1000, `obscuration = none` (niente coordinate oscurate o private, né per scelta di chi osserva né per il taxon).
  GBIF: `coordinateUncertaintyInMeters` presente e ≤ 1000. Senza incertezza dichiarata il record è escluso.
  **Motivo:** la cella del confronto (4.2) è di circa 11 × 8 km e le celle dei modelli meteo da 2 a 11 km; in
  montagna 1 km di errore può voler dire qualche centinaio di metri di quota, cioè più di 1 °C. Sensibilità con
  ≤ 250 m (sezione 10).
- **Taxon dei controlli:** classe Agaricomycetes (iNaturalist 50814, GBIF 186), meno le esclusioni di 2.2.

### 2.4 Deduplica (fissata ora)

1. **iNaturalist fa fede per i suoi record.** Da GBIF si toglie il dataset «iNaturalist Research-grade Observations»
   (`50c9509d-22c7-4a22-a47d-8c48425ef4a7`) e ogni record con `inaturalist.org` in `occurrenceID`, `references` o
   `catalogNumber`.
2. **Duplicati fra dataset GBIF:** fra i record segnati da GBIF `isInCluster = true` con la stessa specie e la stessa
   data, si tiene quello con `gbifID` più basso.
3. **Duplicati fra GBIF e iNaturalist:** un record GBIF con la stessa specie dell'app (o, per i controlli, lo stesso
   taxon), la stessa data e a meno di 1000 m da un record iNaturalist si toglie.
4. Le unità d'analisi (4.2) raccolgono poi tutte le osservazioni di una stessa uscita: le foto multiple dello stesso
   fungo contano una volta.

### 2.5 Quota

Per ogni punto meteo (5.3) la quota è quella restituita da Open-Meteo per la coordinata richiesta, senza passare
`elevation`: Open-Meteo usa allora il suo modello digitale del terreno (Copernicus GLO-90, **Non verificato** sulla
risposta, si legge dalla documentazione). Per l'analisi descrittiva (sezione 11), che riguarda anche anni senza meteo,
la quota viene dall'API `https://api.open-meteo.com/v1/elevation` (stesso DEM, fino a 100 coordinate per chiamata).
**Motivo:** l'app usa lo stesso DEM per le zone del pilota Lazio; la quota dichiarata dagli osservatori manca quasi
sempre in iNaturalist.

### 2.6 Licenze e privacy

- **Licenze per record** (**Fatto verificato** sui conteggi, 3.1 e 3.2): in iNaturalist CC0, CC BY, CC BY-NC e le
  varianti SA/ND, oppure **nessuna licenza** («tutti i diritti riservati»); in GBIF CC0, CC BY 4.0, CC BY-NC 4.0 per
  dataset. La licenza di ogni record si conserva in `dati/` e il README riporta i conteggi per licenza.
- **Che cosa si conserva:** solo identificativo del record, fonte, taxon, data, coordinate, incertezza, licenza,
  qualità, dataset e un'impronta dell'osservatore (sotto). **Niente foto, descrizioni, commenti, nomi.**
- **Interpretazione:** data, luogo e taxon sono fatti, non opere. Anche i record iNaturalist senza licenza entrano
  nell'analisi: se ne usano solo questi fatti, e nulla si ridistribuisce. Sensibilità senza di loro (sezione 10).
- **Privacy:** l'osservatore serve solo a definire le uscite (4.2) e il bootstrap (8.2). In `dati/` si salva
  `SHA-256(sale ‖ identificativo)`, con un sale casuale generato all'esecuzione e salvato solo in `dati/`. Nei file
  versionati non compaiono nomi, login, identificativi di osservatori o di singoli record.
- **Nulla si ridistribuisce.** `dati/` è esclusa da git (`.gitignore` di questa cartella); `tools/` è già esclusa
  dalla pubblicazione del sito (`.assetsignore`). Il README pubblica solo valori aggregati: conteggi, AUC, intervalli.
  Nessuna tabella per record o per uscita, nessun valore meteo giornaliero.
- **Open-Meteo:** dati CC BY 4.0, attribuzione nel README. L'API gratuita è solo per uso non commerciale: questa prova
  è ricerca non commerciale (**Interpretazione**; l'app è gratuita e senza pubblicità).

## 3. Controlli di fattibilità fatti prima di scrivere (Fatto verificato il 21/10/2026)

Solo totali e istogrammi per data: `per_page=0` e `/observations/histogram` per iNaturalist, `limit=0` con faccette
per GBIF. Nessuna coordinata individuale, nessun meteo.

Script nello scratchpad della sessione: `taxa.py`, `conteggi_inat.py`, `conteggi_inat2.py`, `conteggi_gbif.py`
(Python 3.13.16, `-I`, solo libreria standard), con le risposte delle API salvate in cache. Filtro di 2.3 applicato
con i parametri iNaturalist `acc_below=1001` e `obscuration=none`; il filtro sul poligono e la deduplica non sono
applicabili ai conteggi, quindi i numeri qui sotto sono **limiti superiori** delle unità.

### 3.1 iNaturalist: casi possibili per specie, 2015–2025

Luogo 8670 (Lazio), date di osservazione dal 01/01/2015 al 31/12/2025, salvo la colonna 2026.

| Specie | Research grade | senza incertezza | oscurate | incertezza ≤ 1000 m e non oscurate (filtro) | filtro, 2023–2025 | research grade 2026 | needs_id |
|---|---:|---:|---:|---:|---:|---:|---:|
| edulis | 6 | 0 | 0 | 5 | 0 | 0 | 0 |
| pinophilus | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| aereus | 13 | 2 | 0 | 11 | 10 | 0 | 0 |
| aestivalis | 5 | 1 | 0 | 3 | 3 | 1 | 3 |
| caesarea | 24 | 6 | 0 | 15 | 6 | 1 | 0 |
| cibarius | 20 | 5 | 1 | 12 | 7 | 0 | 1 |
| cornucopioides | 11 | 2 | 0 | 9 | 6 | 0 | 0 |
| repandum | 2 | 0 | 0 | 2 | 2 | 0 | 1 |
| procera | 49 | 10 | 0 | 37 | 26 | 1 | 48 |
| mellea | 25 | 8 | 0 | 14 | 7 | 0 | 44 |
| virescens | 14 | 5 | 0 | 9 | 5 | 0 | 13 |
| suillus | 8 | 0 | 0 | 8 | 4 | 0 | 12 |
| terreum | 3 | 1 | 0 | 2 | 1 | 0 | 4 |
| nuda | 3 | 2 | 0 | 1 | 1 | 0 | 10 |
| **Totale** | **183** | **42** | **1** | **128** | **78** | **3** | **136** |

Le colonne «senza incertezza», «oscurate», «filtro» e i record con incertezza oltre 1000 m sommano il research grade.
Precisione dei 183 record research grade (incertezza dichiarata): 84 sotto 100 m, 103 sotto 250 m, 116 sotto
500 m, 128 fino a 1000 m, 138 sotto 5000 m.

**Record con il filtro, per anno:**

| Specie | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| edulis | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 2 | 0 | 0 | 0 |
| pinophilus | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| aereus | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 4 | 3 | 3 |
| aestivalis | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 2 |
| caesarea | 0 | 0 | 0 | 1 | 0 | 4 | 1 | 3 | 0 | 4 | 2 |
| cibarius | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 2 | 2 | 4 | 1 |
| cornucopioides | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 4 | 2 |
| repandum | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| procera | 1 | 1 | 0 | 1 | 1 | 2 | 1 | 4 | 5 | 11 | 10 |
| mellea | 0 | 0 | 0 | 2 | 2 | 2 | 1 | 0 | 2 | 3 | 2 |
| virescens | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 2 | 2 | 0 | 3 |
| suillus | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 1 | 3 | 0 | 1 |
| terreum | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| nuda | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| Agaricomycetes, research + needs_id (controlli, prima delle esclusioni) | 6 | 41 | 17 | 154 | 174 | 328 | 233 | 402 | 908 | 964 | 975 |

**Licenze e province** (research grade, senza filtro):

| Specie | CC0 | CC BY | CC BY-NC | altre CC | nessuna licenza | Rieti | Roma | Viterbo | Latina | Frosinone |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| edulis | 0 | 0 | 2 | 0 | 4 | 1 | 1 | 1 | 3 | 0 |
| pinophilus | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| aereus | 0 | 0 | 7 | 0 | 6 | 0 | 9 | 3 | 0 | 1 |
| aestivalis | 0 | 0 | 4 | 0 | 1 | 0 | 3 | 1 | 0 | 1 |
| caesarea | 1 | 1 | 11 | 0 | 11 | 3 | 8 | 7 | 5 | 1 |
| cibarius | 0 | 1 | 8 | 0 | 11 | 3 | 8 | 5 | 3 | 1 |
| cornucopioides | 0 | 0 | 5 | 0 | 6 | 5 | 2 | 3 | 0 | 1 |
| repandum | 0 | 0 | 2 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| procera | 0 | 0 | 32 | 0 | 17 | 0 | 32 | 8 | 3 | 6 |
| mellea | 1 | 0 | 12 | 0 | 12 | 0 | 18 | 6 | 1 | 0 |
| virescens | 1 | 0 | 10 | 0 | 3 | 1 | 8 | 3 | 2 | 0 |
| suillus | 0 | 1 | 4 | 0 | 3 | 1 | 4 | 1 | 0 | 0 |
| terreum | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| nuda | 0 | 0 | 1 | 0 | 2 | 0 | 2 | 1 | 0 | 0 |
| **Totale specie** | **3** | **4** | **100** | **0** | **76** | **14** | **97** | **39** | **17** | **14** |
| Agaricomycetes (research grade) | 27 | 80 | 1207 | 2 | 721 | 86 | 1373 | 351 | 99 | 125 |

**Mesi** (research grade, senza filtro, 2015–2025; solo descrittivo, nessun confronto con i pesi fatto ora):

| Specie | gen | feb | mar | apr | mag | giu | lug | ago | set | ott | nov | dic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| edulis | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 5 | 0 | 0 |
| aereus | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 6 | 3 | 3 | 0 |
| aestivalis | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 3 | 0 | 0 | 0 |
| caesarea | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 10 | 13 | 0 | 0 |
| cibarius | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 1 | 5 | 9 | 1 | 1 |
| cornucopioides | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 7 | 3 | 0 |
| repandum | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| procera | 0 | 0 | 0 | 10 | 1 | 1 | 0 | 1 | 9 | 11 | 9 | 7 |
| mellea | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 11 | 6 |
| virescens | 0 | 0 | 0 | 0 | 0 | 6 | 1 | 1 | 4 | 2 | 0 | 0 |
| suillus | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 2 | 3 | 0 |
| terreum | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| nuda | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| Agaricomycetes (research + needs_id) | 183 | 157 | 210 | 587 | 413 | 256 | 120 | 200 | 897 | 1495 | 1236 | 584 |

### 3.2 GBIF: che cosa aggiunge

Filtri: `gadmGid=ITA.8_1`, anni 2015–2025, `basisOfRecord` HUMAN_OBSERVATION o PRESERVED_SPECIMEN,
`occurrenceStatus=PRESENT`, `hasCoordinate=true`, `hasGeospatialIssue=false`.

| Gruppo | Record | dal dataset iNaturalist | da altri dataset | altri dataset con incertezza ≤ 1000 m | 2026 |
|---|---:|---:|---:|---:|---:|
| 14 specie in prova (somma) | 114 | 105 | 9 | 1 (*H. repandum*) | 1 |
| Agaricomycetes | 1740 | 1265 | 475 | 31 | 120 |
| Fungi | 2321 | 1725 | 596 | 36 | 297 |

- Altri dataset di Agaricomycetes: collezioni micologiche dell'Università di Tartu (424 record), Observation.org (24),
  Società micologica austriaca (11), Società micologica danese (11), altri sotto 5. Quasi tutti senza incertezza
  dichiarata. 273 record di Agaricomycetes sono segnati `isInCluster`.
- Per licenza, Agaricomycetes: CC0 26, CC BY 4.0 505, CC BY-NC 4.0 1209.
- **Interpretazione:** dopo deduplica e filtro GBIF aggiunge al più un caso e qualche decina di controlli. Il dataset
  iNaturalist su GBIF ha meno record dell'API perché iNaturalist pubblica su GBIF solo le osservazioni con licenza
  CC0, CC BY o CC BY-NC (**Non verificato** su una fonte scritta; coerente con le licenze qui sopra).

### 3.3 Gruppo dei controlli e gruppo S-G2

- Agaricomycetes, research + needs_id, filtro di 2.3: 4202 record 2015–2025; **2847 nel 2023–2025** (Roma 2011,
  Viterbo 488, Frosinone 173, Rieti 114, Latina 58), con **702 osservatori** distinti.
- Mesi 2023–2025: il massimo è in autunno (ottobre–novembre 2023: 357; settembre–ottobre 2024: 505;
  settembre 2025: 243), con un secondo picco in aprile (97, 105, 168).
- Gruppo S-G2 (i sette generi della sezione 10, taxon id iNaturalist 127511, 118056, 48475, 118087, 352247, 328266, 118086),
  research + needs_id, filtro: 247 record 2015–2025, di cui **180 nel 2023–2025** (53, 55, 72). Mesi: presenti
  tutto l'anno (da 5 a 57 per mese).

### 3.4 Fuori dal Lazio (solo per una decisione di Matteo, sezione 16)

Le 14 specie, research grade, filtro di 2.3, 2015–2025: Italia **2811** (2023–2025: **1231**); Toscana 324,
Campania 66, Marche 29, Abruzzo 23, Umbria 16, Molise 7; Lazio 128 (2023–2025: 78).

### 3.5 Tassonomia

Vedi 2.2. *Lepista nuda* è «*Collybia nuda*» (taxon 1525548) in iNaturalist; *Boletus aestivalis* è sinonimo di
*B. reticulatus* sia nel Backbone sia in iNaturalist. Su iNaturalist *Cantharellus cibarius*, *Hydnum repandum* e
*Tricholoma terreum* hanno specie affini separate che non entrano.

### 3.6 Meteo storico (documentazione letta il 21/10/2026)

**Fatto verificato sulla documentazione** (pagine «Historical Forecast API», «Historical Weather API», «Terms»,
«Pricing» di open-meteo.com):

- **Historical Forecast API:** «Past weather forecasts from 2022 onwards»; secondo il modello, dati dal 2021 o dal
  2022. Disponibili dal: ICON globale, ICON-EU e ICON-D2 **24/11/2022**; GFS 23/03/2021; ARPEGE Europe 13/11/2022;
  IFS 0,4° 07/11/2022; IFS HRES 9 km 01/01/2017; UKMO Global 01/03/2022; ItaliaMeteo-ARPAE ICON 2I **13/04/2025**.
  Variabili: tra le altre «Soil Moisture (3-9 cm)», «Soil Moisture (9-27 cm)», «Soil Temperature (6 cm)»: le stesse
  dell'app.
- **Historical Weather API (archivio):** ERA5 0,25° dal 1940, ERA5-Land 0,1° dal 1950, IFS 9 km dal 2017; il best
  match combina IFS HRES, ERA5 ed ERA5-Land; ERA5 ed ERA5-Land arrivano con 5 giorni di ritardo. Suolo solo negli
  strati 0–7, 7–28, 28–100, 100–255 cm: **niente 3–9 cm, niente 6 cm**.
- **Limiti:** meno di 10 000 chiamate al giorno, 5 000 all'ora, 600 al minuto; 300 000 al mese (oggi non applicato,
  secondo la pagina Pricing). Più di 10 variabili o più di 2 settimane per punto valgono più chiamate, in modo
  frazionario.

**Fatto verificato sulla rete:** il 21/10/2026 alle 21:34 UTC Historical Forecast, Archive, Forecast ed Elevation
rispondevano tutte 429 «Daily API request limit exceeded» da questo ambiente. **Non verificato** quindi con una
richiesta: le date di inizio reali delle variabili del suolo per un punto del Lazio con il best match, la presenza di
buchi, la quota restituita. `scarica.py` le controlla per prime (sezione 12, controllo 8) e il README le riporta.

### 3.7 Conseguenze per il disegno (Interpretazione)

- **Nessuna specie arriva a 30 casi** nel periodo principale: il massimo è la mazza di tamburo con 26 record. Ci si
  aspetta nessuna etichetta per specie. Porcino e porcino rosso non hanno casi nel periodo principale: **Q4 (shock) non
  sarà valutabile**.
- Nell'analisi complessiva i casi sono al più 78 record (meno dopo il raggruppamento in uscite e l'abbinamento). Con n
  casi e molti controlli, l'errore standard dell'AUC sotto l'ipotesi di nessun segnale è circa 0,29 / √n: 0,033 con
  80 casi, 0,041 con 50, prima dell'effetto dei cluster. Gli intervalli saranno larghi almeno ±0,07–0,10:
  «non distinguibile» è l'esito più probabile, salvo effetti grandi (AUC ≥ 0,6 circa).
- Più della metà dei record research grade (97 su 183) sta nella provincia di Roma; il Reatino, dove nasce l'indice,
  ne ha 14 in 11 anni. Due record non cadono in nessuna provincia di iNaturalist.

## 4. Disegno principale: casi e controlli dallo stesso gruppo di osservatori

### 4.1 Perché questo disegno

Chi osserva funghi esce dopo la pioggia, d'autunno e nei fine settimana. Un ritrovamento dice che qualcuno è uscito e
ha trovato, non quando il fungo c'era. Confrontare i giorni dei ritrovamenti con giorni qualsiasi premierebbe ogni
modello con la pioggia per il solo comportamento di chi osserva.

Il disegno principale usa quindi un **gruppo di confronto dello stesso tipo di dati** («target-group background»):
i controlli sono uscite in cui qualcuno ha osservato **altri funghi**, nella stessa cella e nello stesso periodo.
Casi e controlli nascono dallo stesso processo di osservazione: il confronto tiene conto di quando e dove la gente
esce.

**Interpretazione, da leggere accanto a ogni esito.** I controlli sono anche funghi, che in buona parte nascono dopo
la pioggia come le specie in prova. Il disegno toglie lo sforzo, ma toglie anche la parte del segnale meteo comune a
tutti i funghi. Misura se l'indice della specie mette i ritrovamenti di quella specie sopra le uscite in cui si sono
trovati altri funghi: una prova di **specificità**, severa. Un fattore pioggia giusto ma uguale per tutti i funghi
qui vale poco. Per questo ci sono due analisi secondarie con un altro bersaglio (sezione 10): il gruppo dei
poliporacei perenni (S-G2), visibili tutto l'anno, e il case-crossover (S-CC).

**Perché il principale non è il case-crossover.** Il case-crossover confronta lo stesso punto in giorni diversi: il
giorno del ritrovamento contro giorni in cui nessuno, forse, era nel bosco. Abbinando il giorno della settimana toglie
l'effetto del fine settimana, ma non quello delle uscite decise dopo la pioggia: ogni modello con la pioggia ne trae
vantaggio. Resta un'analisi secondaria, con questo limite scritto accanto.

### 4.2 Unità: l'uscita osservata

- **Cella:** griglia regolare di 0,1° di latitudine × 0,1° di longitudine, allineata ai gradi interi (circa
  11,1 × 8,2 km a 42° N). Cella = (⌊lat × 10⌋, ⌊lon × 10⌋), con le coordinate del record.
- **Uscita:** (osservatore, data, cella). Per GBIF l'osservatore è `recordedBy` normalizzato (minuscole, spazi
  compressi); senza `recordedBy` ogni record è un'uscita a sé.
- **Unità caso della specie X:** un'uscita con almeno un'osservazione di X che passa i filtri di 2.3 come caso. Per i
  modelli con più specie (colombina, pinarolo) conta l'uscita, non la specie.
- **Unità controllo:** un'uscita con almeno un'osservazione di Agaricomycetes che passa i filtri come controllo e non
  è esclusa da 2.2.
- **Punto dell'unità:** quello dell'osservazione con l'identificativo più basso fra quelle che definiscono l'unità
  (deterministico).
- Un'uscita può essere caso per X e insieme controllo (se l'osservatore ha visto anche altri funghi). Il controllo
  della **stessa uscita** (stesso osservatore e stessa data) non si abbina al suo caso: è la stessa uscita, non una
  misura indipendente dello sforzo.

### 4.3 Abbinamento

Per ogni unità caso c della specie X l'insieme dei controlli M(c) contiene le unità controllo:

- della **stessa cella**;
- dello **stesso anno solare**;
- con data a **non più di 30 giorni** da quella del caso (finestra di 61 giorni);
- diverse dall'uscita del caso (4.2).

**Motivi.** Stessa cella: stessa area e quasi lo stesso meteo di fondo, quindi il confronto riguarda soprattutto il
momento. Stesso anno: gli anni hanno sforzo molto diverso (iNaturalist cresce di anno in anno, 3.2). ±30 giorni:
abbastanza stretto da seguire lo sforzo stagionale, abbastanza largo perché stagione, pioggia e temperatura varino.
Un caso senza controlli abbinati è escluso e contato.

Il punteggio di ogni controllo è quello **della specie X**, calcolato nel punto e nel giorno del controllo.

### 4.4 Periodo dell'analisi principale

**Unità con data dal 01/01/2023 al 31/12/2025, con il meteo della Historical Forecast API.** Motivi:

- **Fatto verificato** (documentazione, tabella dei modelli): nella Historical Forecast API i modelli ICON (globale,
  ICON-EU, ICON-D2) sono archiviati dal **24/11/2022**. Il 15/10/2026 lo strato 3–9 cm dell'app veniva da ICON-EU
  (`docs/metodo-scientifico.md`, sezione 3). Prima di quella data le finestre di umidità e temperatura del suolo non
  verrebbero dallo stesso modello.
- Le finestre usate dall'indice arrivano a 30 giorni prima del giorno valutato (pioggia), 23 per lo shock: dal
  01/01/2023 stanno tutte dopo il 24/11/2022.
- Il 2022 e gli anni prima entrano solo nell'analisi con l'archivio (S-ARC, sezione 10) e nella climatologia (6, (2)),
  che non usa il meteo.

### 4.5 Soglie sulle specie (fissate ora)

Contano le unità caso con almeno un controllo abbinato, nel periodo principale:

- **≥ 30 unità caso in almeno 5 celle diverse:** la specie ha metriche ed etichetta proprie (sezione 9);
- **da 5 a 29:** la specie entra solo nell'analisi complessiva e nelle tabelle descrittive;
- **meno di 5:** la specie è esclusa da tutte le analisi con il meteo; resta nei conteggi e nell'analisi descrittiva
  (sezione 11).
- **Analisi complessiva:** etichetta solo con **almeno 50 unità caso in almeno 10 celle** (somma delle specie
  incluse). Sotto, «non valutabile»: si riportano i numeri senza etichetta.

Le stesse soglie valgono, con i loro insiemi, nelle analisi secondarie.

## 5. Meteo

### 5.1 Prodotto principale: Historical Forecast API

**Motivo.** È il prodotto più vicino a quello che l'app usa: la Forecast API con `past_days`, che per i giorni passati
restituisce le prime ore delle corse precedenti. La Historical Forecast API archivia le stesse prime ore, con lo
stesso «best match» (**Non verificato**: la scelta dei modelli del best match nel passato non è documentata giorno per
giorno e la risposta non la dichiara).

Richiesta con le variabili dell'app che entrano nell'indice (`js/weather-data.js`, profilo `growth`; l'app chiede
anche lo strato 9–27 cm ed ET₀, che l'indice non usa). Differenze dall'app: il periodo (`start_date`, `end_date` al
posto di `past_days` e `forecast_days`) e la quota (l'app passa la quota della fascia; qui vale il DEM nel punto, 2.5).

- `daily=precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max`;
- `hourly=soil_moisture_3_to_9cm,soil_temperature_6cm`;
- `timezone=Europe/Rome`, `start_date`, `end_date`; nessun `models` (best match); nessun `elevation` (2.5).

La serie giornaliera si costruisce con `toDaily` di `js/weather.js`, importato senza modifiche: medie del suolo con
almeno 24 valori orari validi, umidità valida solo fra 0 e 1, pioggia negativa = mancante. **Fatto verificato**
(lettura del codice): nel giorno del passaggio all'ora legale il giorno locale ha 23 ore, quindi suolo mancante in
quel giorno. È il comportamento dell'app e si conserva.

### 5.2 Prodotto di controllo: Archive

- Stesse variabili giornaliere, `timezone=Europe/Rome`, nessun `models` (best match dell'archivio: IFS HRES dal 2017,
  ERA5 ed ERA5-Land; **Fatto verificato** sulla documentazione), nessun `elevation`.
- **Niente suolo.** L'archivio ha solo strati 0–7, 7–28 cm di ERA5/ERA5-Land: le soglie 0,10 e 0,26 dell'app sono
  pensate per lo strato 3–9 cm di ICON e non si trasferiscono. Lo shock (6 cm) non è calcolabile.
- **Perché serve.** Copre tutti gli anni dal 2015, ma è un altro prodotto: nei 45 punti del Reatino, dal 20/08 al
  10/10/2026, l'archivio aveva una pioggia mediana di 107 mm contro 69 mm della Forecast API, rapporto mediano 1,55
  (`valutazione-modello-v3.md`, 2.4 punto 9). Qui si misura lo stesso scarto sulle unità del periodo principale
  (controllo C-PROD, sezione 12), solo sui predittori.

### 5.3 Punti e finestre

- **Punto meteo:** coordinate dell'unità arrotondate a 0,01° (circa 1 km, sotto la soglia di precisione di 2.3).
  Unità con lo stesso punto arrotondato condividono la serie.
- **Finestra:** per ogni giorno valutato d servono i 62 giorni prima e il giorno stesso, come l'app
  (`PAST_DAYS = 62`); per le unità caso anche i giorni di confronto del case-crossover (d ± 14, d ± 28), quindi da
  d − 90 a d + 28.
- Per punto e anno si chiede un solo intervallo, dal primo giorno necessario all'ultimo, se i giorni scoperti in
  mezzo sono meno di 63; altrimenti più intervalli.
- **Indice dei giorni:** la serie passa a `js/model.js` con il giorno valutato all'indice i; `issuedIndex` = −1
  (nessun giorno è una previsione: la data di scaricamento non sta nella serie).

### 5.4 Limiti di chiamata e ritmo (Fatto verificato sulla documentazione, 21/10/2026)

- API gratuita: **meno di 10 000 chiamate al giorno, 5 000 all'ora, 600 al minuto**, solo uso non commerciale
  (Terms of Use). Una richiesta con più di 10 variabili o più di 2 settimane per punto vale più chiamate, in modo
  frazionario: 4 settimane = 2 chiamate (pagina Pricing). Qui le variabili sono 6 (meno di 10): peso = giorni / 14
  per punto, con minimo 1.
- **Ritmo fissato:** al massimo 300 chiamate pesate al minuto, 4 000 all'ora, 8 000 al giorno; una richiesta alla volta.
  Ogni risposta si salva in `dati/meteo/` con l'URL e l'ora; una richiesta già in cache non si ripete. Su un 429 lo
  scaricamento si ferma e riprende il giorno dopo dalla cache.
- **Fatto verificato:** il 21/10/2026 ogni endpoint Open-Meteo, chiamato da questo ambiente, rispondeva 429 «Daily API
  request limit exceeded»: l'indirizzo d'uscita è condiviso. Lo scaricamento va fatto da una rete con un indirizzo
  proprio, oppure con l'API a pagamento (chiave solo in una variabile d'ambiente, mai nei file). Non cambia nulla nel
  protocollo.

**Stima delle chiamate** (limite superiore: ogni record un'unità con un punto suo, nessuna serie condivisa;
peso = giorni / 14 per punto, sezione 5.4):

| Blocco | Unità (limite superiore, 3.1 e 3.3) | Giorni per unità | Chiamate pesate |
|---|---:|---:|---:|
| Principale, controlli 2023–2025 (Historical Forecast) | 2847 | 63 | 12 812 |
| Principale, casi 2023–2025, con i giorni del case-crossover | 78 | 119 | 663 |
| S-G2, controlli 2023–2025 | 180 | 63 | 810 |
| S-ARC e S-PROD, controlli 2015–2025 (archivio) | 4202 | 63 | 18 909 |
| S-ARC e S-PROD, casi 2015–2025 (archivio) | 128 | 63 | 576 |
| Quote per l'analisi descrittiva (API Elevation, 100 punti a richiesta) | 4577 | — | 46 |
| **Totale** | | | **33 816** |

- Al ritmo di 5.4 (8 000 al giorno) servono **almeno 5 giorni** di scaricamento.
- Si scarica il meteo solo per i controlli abbinabili a un caso con la definizione più larga usata (celle di 0,2°,
  ±30 giorni, stesso anno; per S-ARC lo stesso dal 2015); punti arrotondati e intervalli uniti (5.3) riducono ancora.
  Il README riporta le chiamate effettive.
- La Historical Forecast API per il 2023–2025 vale al più 13 475 chiamate (14 285 con S-G2): entra in 2 giorni.

### 5.5 Completezza

- Un giorno valutato entra solo se `inputQuality(specie, s, i).complete` è vero: pioggia, temperatura media, umidità
  del suolo, minime e massime complete nelle finestre dell'app. È la regola dell'app: senza dati l'indice è «non
  calcolabile», non zero.
- Lo shock con temperatura del suolo incompleta vale 1, come nell'app (`bonusUnavailable`).
- Nell'archivio la regola è la stessa senza l'umidità del suolo (che lì non c'è).
- Un'unità (caso o controllo) senza meteo completo si esclude e si conta, per specie e anno. **Blocco:** se nel
  periodo principale manca più del 20% delle unità caso o delle unità controllo abbinabili, l'esecuzione si ferma e il
  seguito è una deviazione.

## 6. I punteggi

Per la specie X, nel punto e nel giorno d dell'unità (con s la serie di 5.3 e i l'indice di d):

- **(0) Solo stagione:** S = `seasonWeight(X.months, d)`.
- **(1) Parte meteo dell'indice 2.1.0:** f₁ = min(1; S × rain × temp × moist × frost × heat × shock), con i fattori di
  `weatherFactors(X, s, i)`. È l'indice dell'app con habitat e quota uguali a 1, prima dell'arrotondamento.
  Continuo.
- **(1b) Senza shock:** come (1) con shock = 1. Differisce da (1) solo per porcino e porcino rosso.
- **(A) Senza suolo e senza shock:** min(1; S × rain × temp × frost × heat). Serve per l'archivio (5.2) e per il
  confronto fra prodotti sulle stesse unità.
- **(2) Climatologia empirica dei ritrovamenti, corretta per lo sforzo:** per il giorno dell'anno t e l'anno di prova k,
  c_k(t) = (unità caso di X degli anni di training con giorno dell'anno a non più di 15 giorni da t) / (tutte le unità,
  caso di qualunque specie in prova o controllo, degli stessi anni e giorni), su tutto il Lazio. Training = tutti gli
  anni dal 2015 al 2025 tranne k (la climatologia non usa il meteo). Distanza fra giorni dell'anno circolare; il 29/02
  vale come 28/02. Denominatore 0: c = 0.

Habitat (`habitatScore`) e quota (`elevationFit`) restano fuori: dipendono dalla Carta Forestale delle zone, non dal
punto dell'osservazione, e la domanda riguarda il meteo. **Interpretazione:** la temperatura dipende dalla quota del
punto, quindi una parte della quota entra comunque attraverso `temp`.

## 7. Validazione

- (0), (1), (1b) e (A) non stimano nulla.
- (2) si stima **un anno escluso alla volta**: per le unità dell'anno k si usa c_k.
- Nessuna scelta si fa guardando l'esito: finestre, celle, soglie, δ e periodo sono fissati qui.

## 8. Metriche e intervalli

### 8.1 AUC abbinata

Per il caso c con punteggio x_c e i suoi controlli M(c):

U_c = (1 / |M(c)|) · Σ_{m ∈ M(c)} [1(x_c > x_m) + ½ · 1(x_c = x_m)].

- **AUC della specie X** = media di U_c sulle sue unità caso con |M(c)| ≥ 1. È la probabilità che il caso superi un
  controllo dello stesso luogo e periodo, con i pari merito a ½. A caso vale 0,5.
- **AUC complessiva** = media di U_c su tutte le unità caso delle specie incluse (4.5), ogni caso con peso 1.
- Ogni caso pesa 1 qualunque sia il numero dei suoi controlli: una cella con molti osservatori non conta di più.
- **Differenza fra punteggi:** stessa media sulle differenze U_c(a) − U_c(b), sugli stessi casi e controlli.
- Il README riporta per ogni specie: unità caso, unità controllo abbinate, celle, anni, mediana di |M(c)|, casi
  esclusi per mancanza di controlli o di meteo, valori distinti di ogni punteggio.

### 8.2 Intervalli al 95%

Due bootstrap per cluster, B = 5000 repliche ciascuno, `numpy.random.default_rng(20261021)`, ogni analisi riparte dal
seme. Intervallo percentile (2,5 e 97,5, metodo `linear`). Stesse estrazioni per tutti i punteggi: le differenze sono
appaiate.

- **B-cella:** si estraggono con reinserimento le celle che contengono almeno un caso; ogni cella porta tutti i suoi
  casi con i loro U_c.
- **B-osservatore:** si estraggono con reinserimento gli osservatori dei casi; ogni osservatore porta tutti i suoi
  casi.

**Perché non per anno.** Il periodo principale ha 3 anni: un bootstrap su 3 cluster non dà un intervallo utilizzabile.
L'anno entra (a) nell'abbinamento (4.3), (b) in una tabella per anno senza etichetta e (c) in un controllo di
stabilità: se togliendo un anno la stima puntuale cambia segno rispetto a 0,5 (o a 0 per le differenze), il README lo
scrive accanto al verdetto. Nell'analisi con l'archivio (S-ARC, 11 anni) si aggiunge il bootstrap per anno.
**Perché per osservatore.** Pochi osservatori molto attivi possono fare buona parte dei casi: i loro ritrovamenti non
sono indipendenti.

Repliche senza casi si scartano e si contano.

## 9. Domande e criteri di lettura (decisi ora)

Si leggono sull'analisi principale (4.4), complessiva e per le specie con almeno 30 casi.

| | Domanda | Quantità | Riferimento |
|---|---|---|---|
| (Q1) | La parte meteo dell'indice (1) è più alta nei giorni di ritrovamento che nelle uscite di confronto? | AUC(1) − 0,5 | 0 |
| (Q2) | Il meteo aggiunge qualcosa alla sola stagione? | AUC(1) − AUC(0) | 0 |
| (Q3) | L'indice fa meglio della climatologia empirica dei ritrovamenti? | AUC(1) − AUC(2) | 0 |
| (Q4) | Lo shock aiuta? Solo porcino e porcino rosso | AUC(1) − AUC(1b) | 0 |

**Differenze minime d'interesse:** δ₁ = 0,05 per Q1 (AUC 0,55 contro 0,5); δ = 0,03 per Q2, Q3 e Q4. Proposte qui;
la scelta spetta a Matteo e si può cambiare solo prima dello scaricamento delle osservazioni, con una voce datata
nelle «Deviazioni».

Regola, con θ̂ la stima puntuale e i due intervalli B-cella e B-osservatore:

- entrambi gli intervalli tutti sopra 0 e θ̂ ≥ δ: «**meglio**, su questi dati» (Q1: «**più alta nei giorni di
  ritrovamento**, su questi dati»);
- entrambi tutti sopra 0 e θ̂ < δ: «**meglio, ma trascurabile** (sotto δ)»;
- entrambi tutti sotto 0 e θ̂ ≤ −δ: «**peggio**, su questi dati» (Q1: «**più bassa nei giorni di ritrovamento**»);
- entrambi tutti sotto 0 e θ̂ > −δ: «**peggio, ma trascurabile** (sotto δ)»;
- in ogni altro caso: «**non distinguibile** su questi dati»; se entrambi gli intervalli stanno dentro (−δ; +δ) si
  aggiunge «la differenza resta sotto δ in tutto l'intervallo»;
- sotto le soglie di 4.5: «**non valutabile**», con i numeri e senza etichetta.

Il README riporta sempre stima e intervalli, non solo l'etichetta, e tutti i risultati preregistrati, anche quelli
sfavorevoli all'indice.

**Famiglia dei test.** La domanda principale è Q1 sull'analisi complessiva. Q2–Q4 e le etichette per specie sono
domande distinte, senza correzione per confronti multipli: con k specie etichettate, una o più etichette possono
venire dal caso, e il README lo scrive accanto alla tabella per specie.

**Lettura di Q1 nel disegno principale** (Interpretazione, sezione 4.1): «non distinguibile» o «peggio» non vuol dire
che l'indice non segua i funghi; può voler dire che non distingue la specie dagli altri funghi osservati nelle stesse
settimane. Il README la mette accanto a S-G2 e S-CC.

## 10. Analisi secondarie (elenco chiuso, senza etichetta)

Stesse metriche e stessi intervalli, **senza etichetta**. Una secondaria **contraddice** il principale quando
entrambi i suoi intervalli stanno dalla parte opposta di 0 rispetto alla stima puntuale del principale: il README lo
scrive accanto al verdetto.

| | Che cosa cambia | Punteggi |
|---|---|---|
| S-G2 | Controlli = uscite con poliporacei perenni (generi *Fomes*, *Fomitopsis*, *Ganoderma*, *Phellinus*, *Fomitiporia*, *Fuscoporia*, *Porodaedalea*), stessa cella, anno e ±30 giorni. Corpi fruttiferi visibili tutto l'anno: misurano soprattutto lo sforzo | (0), (1), (1b), (2) |
| S-CC | Case-crossover: per ogni caso, lo stesso punto nei giorni d − 28, d − 14, d + 14, d + 28 (stesso giorno della settimana, stesso anno) | (0), (1), (1b) |
| S-ARC | Archivio: unità dal 2015 al 2025, disegno principale, bootstrap anche per anno | (0), (A), (2) |
| S-PROD | Stesse unità del principale, (A) con Historical Forecast contro (A) con l'archivio | (A) |
| S-QUOTA | Solo controlli con quota a non più di 300 m da quella del caso | (0), (1), (1b), (2) |
| S-CELLA | Celle di 0,2° | (0), (1), (1b), (2) |
| S-FIN | Finestra ±15 giorni invece di ±30 | (0), (1), (1b), (2) |
| S-PREC | Incertezza delle coordinate ≤ 250 m | (0), (1), (1b), (2) |
| S-LIC | Senza i record iNaturalist privi di licenza | (0), (1), (1b), (2) |
| S-SPEC | Analisi complessiva come media delle AUC delle specie (ogni specie con peso 1) | (0), (1), (1b), (2) |
| S-ARR | (1) arrotondato come nell'app: `Math.round(f₁ · 100)` | (1) |
| S-COMP | Componenti di (1): S; rain; temp; moist; frost × heat; rain × temp × moist senza S | componenti |

**S-G2.** Che quei generi abbiano corpi fruttiferi perenni o persistenti va controllato su una fonte prima
dell'esecuzione (per esempio Ryvarden & Melo, *Poroid fungi of Europe*, 2ª ed., 2017); un genere non confermato si
toglie dalla lista, con una voce nelle «Deviazioni» datata prima dei risultati. **Interpretazione:** anche chi
fotografa un poliporo è spesso uscito dopo la pioggia per cercare funghi: S-G2 corregge lo sforzo meglio del
case-crossover, ma non del tutto.

**S-CC: limiti.** Non corregge lo sforzo (4.1). Le finestre di 30 giorni di d e d ± 14 si sovrappongono per metà:
i punteggi sono correlati e l'AUC tende a ½. I giorni dopo d sono ammessi perché il meteo non dipende dal
ritrovamento.

Ogni altra analisi fatta dopo aver visto i risultati è esplorativa: va nelle «Deviazioni» con questa etichetta.

## 11. Analisi descrittiva separata (senza verdetto)

**Domanda.** In quali mesi si trovano le specie nel Lazio, per fascia di quota, rispetto ai pesi mensili `months` di
`js/species.js`?

- Unità caso e unità controllo dal 2015 al 2025 (filtri di 2.3), senza meteo.
- Fasce di quota: < 500 m, 500–999 m, 1000–1399 m, ≥ 1400 m (quota da 2.5).
- Per specie, mese m e fascia: **quota corretta per lo sforzo** q(m) = unità caso di X / tutte le unità (casi di
  qualsiasi specie in prova e controlli) nel mese e nella fascia. È la stessa logica del gruppo di confronto.
- Si riportano: conteggi grezzi, q(m), q(m) diviso per il suo massimo, e i pesi `months` della specie. Celle con meno
  di 10 unità totali: «pochi dati», senza q.
- Nessuna metrica di accordo, nessuna etichetta. Un mese con ritrovamenti e peso 0 si segnala come fatto, non come
  errore del calendario.

## 12. Riproducibilità

**File previsti** (sezione 15) e ruoli:

- `scarica.py` (`python -I`, solo libreria standard): scarica osservazioni, geometria del Lazio, quote e meteo, con
  cache, ritmo e log degli scaricamenti (URL, ora, codice di risposta) in `dati/`. Scrive un'istantanea congelata
  `dati/istantanea/` con lo SHA-256 di ogni file.
- `fattori.mjs` (Node ≥ 22): importa `../../js/model.js`, `../../js/species.js`, `../../js/weather.js` senza
  modificarli; per ogni unità e specie calcola S, i fattori, (1), (1b), (A) e `inputQuality`. Scrive in `dati/`.
- `valuta.py` (`python -I`, libreria standard e numpy): controlli, abbinamento, climatologia, metriche, bootstrap,
  secondarie, descrittiva. Scrive `dati/esiti.json` e `dati/esiti-riepilogo.json` (solo aggregati, copiato nel
  repository con il README).

**Controlli bloccanti prima di qualsiasi metrica:**

1. SHA-256 dei moduli importati, uguali a quelli del commit `4229457`:
   - `js/model.js` `2f9a8a540eca4a4bbc248231f8dd97ac963de6c2ede8d21c28874addc5458bcc` (`MODEL_VERSION` 2.1.0)
   - `js/species.js` `10f451b8867f7ed1f156a2a1073d699bd5925896335b8c13a8922cfbb1817907`
   - `js/botanical-model.js` `75466dcd22524be0472443bb1f54559c4401d8b88dbc3de0075cf5ff5e558a64`
   - `js/external-observation.js` `ef04cf5202df0dda514f4ee26c6d38cab0a8698ad5a1991b3dca1cd6798fb954`
   - `js/weather.js` `73dd78c53a742fe0bdaeed7dfea082b86b782c48a1ce1477fb051b6c4b17869d`
   - `js/weather-data.js` `13c30d25462a44d5a77bff14047bf6751a99e101c8e2b4b12fdef65196eaf0e4`
   Un modulo cambiato ferma l'esecuzione; proseguire è una deviazione, ammessa solo dopo un `git diff` che mostri
   invariati i fattori usati.
2. SHA-256 dell'istantanea congelata.
3. Taxa: chiavi e id della tabella di 2.2; nessun record caso con un taxon fuori dalla tabella; nessun controllo con un
   taxon escluso.
4. Filtri e deduplica: nessun record fuori dal Lazio, senza incertezza, con incertezza > 1000 m, oscurato, fuori dal
   periodo, del 2026, `casual`, o del dataset iNaturalist dentro GBIF; nessuna coppia GBIF–iNaturalist della stessa
   specie e data a meno di 1000 m.
5. Allineamento JavaScript–Python sui predittori, giorno per giorno: pioggia a 30 giorni, effRain, maxEvent, T media a
   20 giorni, umidità media a 3 giorni ricalcolate in Python dalla serie (tolleranza 10⁻⁹); `seasonWeight` ai giorni
   15 dei mesi uguale ai pesi mensili (10⁻⁹).
6. C-PROD (solo predittori): rapporto mediano, archivio su Historical Forecast, della pioggia a 30 giorni sulle unità
   del periodo principale, con quartili. Si riporta, non blocca.
7. Nessun file versionato contiene nomi, login o identificativi di osservatori o record, né valori meteo giornalieri:
   controllo automatico su `esiti-riepilogo.json` e README prima del commit.
8. Disponibilità del meteo, prima di scaricare tutto: per un punto fisso nel Reatino (42,40° N, 12,86° E) e per i
   primi 20 punti delle unità, primo giorno con valori di ogni variabile, giorni mancanti per anno e quota restituita,
   per i due prodotti. Se nella Historical Forecast API umidità 3–9 cm o temperatura del suolo a 6 cm mancano dopo il
   01/12/2022, l'esecuzione si ferma e il seguito è una deviazione. Il README riporta la tabella.

**Determinismo.** Seme fisso; ordini fissi (specie, poi data, poi identificativo); JSON con chiavi ordinate. Due
esecuzioni consecutive sulla stessa istantanea danno file di esiti identici byte per byte; i due SHA-256 vanno nel
README. Uno scaricamento ripetuto in un altro giorno può dare dati diversi (identificazioni cambiate): fa fede
l'istantanea, con le date di scaricamento.

**Il README registra:** date di scaricamento di ogni fonte, versioni di Python, numpy, Node e sistema operativo, commit,
hash dei moduli e dell'istantanea, versione del Backbone, conteggi per licenza, attribuzione Open-Meteo.

## 13. Deviazioni

- Questo file non si riscrive dopo il commit.
- Ogni cambiamento va nella sezione «Deviazioni» del README: data; che cosa cambia; perché; se è deciso prima o dopo
  aver visto un risultato; effetto sull'esito. Quando si può, il README riporta sia il risultato preregistrato sia
  quello con la deviazione.
- Gli errori materiali di questo file si correggono lì.

## 14. Limiti dichiarati prima

- **Solo presenze.** Nessuna uscita a vuoto: un'unità controllo dice che qualcuno ha visto altri funghi, non che X
  mancava. Niente zeri creati dai buchi dei dati (`valutazione-modello-v3.md`, sezione 6).
- **Osservatori, non cercatori.** Chi fotografa per iNaturalist cerca specie diverse, in luoghi diversi e con
  intenzioni diverse da chi raccoglie. Le specie da raccolta sono probabilmente sottorappresentate: chi le trova le
  raccoglie, non le pubblica.
- **Identificazioni.** «Research grade» vuol dire accordo della comunità su una foto, non controllo micologico. Sosia
  e specie separate di recente (2.2) restano un rumore.
- **Precisione spaziale.** Fino a 1000 m; il punto può essere il parcheggio o la casa, non il bosco.
- **Il meteo storico non è quello dell'app.** La Historical Forecast API è il prodotto più vicino ma non uguale: il
  best match può cambiare modelli nel tempo (per esempio ItaliaMeteo-ARPAE ICON 2I, archiviato dal 13/04/2025) e la
  risposta non dice quale modello è stato usato. L'archivio è un prodotto diverso, con più pioggia nel Reatino (5.2).
- **Specificità, non presenza** (4.1): il disegno principale toglie anche il segnale meteo comune a tutti i funghi.
- **Pochi dati** (sezione 3): molte specie saranno escluse o «non valutabili»; per le altre gli intervalli saranno
  larghi.
- **Una parte dell'indice.** Habitat e quota restano fuori (6).
- **Nessun trasferimento a probabilità**, a soglie o a parametri. **Nessun esito cambia l'app** senza una decisione di
  Matteo.

## 15. File previsti

In `tools/prova-lazio/`:

- `preregistrazione.md` (questo file, committato prima di qualsiasi script e di qualsiasi scaricamento di
  osservazioni);
- `.gitignore` con `dati/`;
- `scarica.py`, `fattori.mjs`, `valuta.py`;
- `README.md` con esiti, versioni, hash, «Deviazioni», attribuzioni;
- `esiti-riepilogo.json`, solo aggregati;
- `dati/`, esclusa da git: osservazioni, geometria, quote, meteo, istantanea, punteggi ed esiti per unità.

## 16. Decisioni che restano a Matteo prima dell'esecuzione

Domande a scelta; la prima è quella consigliata. Le risposte si registrano nelle «Deviazioni» del README **prima**
di scaricare le osservazioni; senza risposta vale quanto scritto qui.

1. **Area.** Nel Lazio ci sono al più 78 casi nel periodo principale e nessuna specie arriva a 30 (3.7); in Italia
   1231.
   - (a) Eseguire sul Lazio così com'è, accettando che l'esito più probabile sia «non distinguibile» o «non
     valutabile», e preparare una seconda preregistrazione su tutta l'Italia con lo stesso disegno (consigliata: la
     prova del Lazio resta pulita e la seconda ha una potenza vera).
   - (b) Allargare subito all'Italia con una nuova preregistrazione, senza eseguire questa.
   - (c) Eseguire solo sul Lazio e fermarsi.
2. **δ.** (a) δ₁ = 0,05 per Q1 e δ = 0,03 per Q2–Q4, come qui (consigliata); (b) valori diversi.
3. **Record senza licenza** (76 casi su 183 research grade): (a) inclusi, usando solo i fatti, con la sensibilità
   S-LIC (consigliata); (b) esclusi dall'analisi principale.
4. **Meteo.** (a) Scaricare da una rete con un indirizzo proprio, con l'API gratuita e il ritmo di 5.4, in almeno 5
   giorni (consigliata); (b) usare l'API a pagamento, con la chiave solo in una variabile d'ambiente; (c) solo la
   Historical Forecast API (2 giorni), rinunciando a S-ARC e S-PROD.
5. **2026.** (a) Riservato a una conferma dopo il 31/03/2027 con questo protocollo (consigliata); (b) non usarlo mai.
