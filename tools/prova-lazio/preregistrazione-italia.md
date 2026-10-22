# Prova retrospettiva: estensione all'Italia (preregistrazione aggiuntiva)

Scritta il 22 ottobre 2026, **prima di qualsiasi legame fra meteo o indice ed esito**. Ramo locale
`lavoro-prova-lazio`. Documento di partenza: `preregistrazione.md` (commit `0a187096`), qui «documento del Lazio».

**Decisioni di Matteo del 22/10/2026.** (1) Nel Lazio i casi sono troppo pochi (78 record nel 2023–2025, nessuna
specie con 30 casi, porcini 0): la prova si **allarga all'Italia**, 2023–2025, e il Lazio resta un sottogruppo **solo
descrittivo**. (2) Il meteo storico si scarica **da questo ambiente, piano piano**, con l'API gratuita: niente API a
pagamento, niente chiavi. Rispondono alla domanda 16.1 del documento del Lazio (scelta (b)) e alla 16.4 (né (a) né
(b): ambiente condiviso con ritmo lento, sezione 7).

**Regola.** Vale tutto il documento del Lazio, salvo quanto questo file cambia in modo esplicito. Dove i due documenti
divergono, per la prova sull'Italia fa fede questo. Dopo il commit questo file non si modifica: ogni cambiamento va
nelle «Deviazioni» del README (sezione 13 del documento del Lazio). La prova del Lazio come preregistrata (solo Lazio,
2015–2025) non si esegue: i suoi dati entrano qui come sottogruppo.

Legenda come nel documento del Lazio: **Fatto verificato**, **Interpretazione**, **Ipotesi**, **Non verificato**.

## 1. Che cosa è stato guardato prima di scrivere

Fatto verificato, 22/10/2026, script nello scratchpad della sessione (fuori dal repository), Python 3.13 con `-I`.

- **Casi** (le 14 specie, research grade, filtro di 2.3 del documento del Lazio, luogo iNaturalist 6973 «Italia»,
  01/01/2023–31/12/2025): 1231 record letti dall'API v1 di iNaturalist. Di ogni record si sono tenuti **solo** taxon,
  data, cella di 0,1° e luoghi iNaturalist (per la regione). Le coordinate sono servite a calcolare la cella e non sono
  state conservate; niente osservatori, licenze, foto.
- **Controlli e gruppo dei poliporacei perenni:** solo totali e istogrammi (`per_page=0`, `/observations/histogram`,
  `/observations/species_counts`).
- **GBIF:** solo totali e faccette (`limit=0`).
- **Meteo:** otto richieste di prova alla Historical Forecast API per **punti fissi** scelti a mano, non legati a
  osservazioni (Reatino 42,40 N 12,86 E; Trentino 46,05 N 11,15 E; Calabria 38,20 N 16,05 E), fra gennaio e aprile
  2024: quattro risposte, tre rifiuti 429 e un errore di rete (sezione 5.3). Nessun meteo per luoghi o date di
  osservazioni.
- Nessun fattore dell'indice è stato calcolato su dati reali.

## 2. Ambito e dati

### 2.1 Area e periodo

- **Area:** Italia = geometria del luogo iNaturalist 6973 per entrambe le fonti (scaricata una volta, con hash in
  `dati/`). Prefiltro GBIF `country=IT`. Comprende San Marino e Città del Vaticano se la geometria li comprende: il
  README lo dice.
- **Periodo principale:** date dal **01/01/2023 al 31/12/2025**. Motivo (Fatto verificato sulla documentazione,
  3.6 del documento del Lazio): nella Historical Forecast API ICON globale, ICON-EU e ICON-D2 sono archiviati dal
  **24/11/2022**. Le finestre dell'indice arrivano a 30 giorni prima del giorno valutato (`r30Days`, `lag` massimo
  24 giorni): dal 01/01/2023 cadono tutte dopo il 24/11/2022. Per lo stesso motivo nessuna richiesta meteo comincia
  prima del **25/11/2022** (sezione 5.2).
- **2015–2022:** solo per la climatologia (punteggio (2), sezione 4.3), che non usa il meteo. Le osservazioni si
  scaricano quindi dal 2015 al 2025.
- **2026:** riservato a una conferma, come 2.3 del documento del Lazio (risposta (a) alla domanda 16.5).

### 2.2 Taxa, filtri, deduplica, licenze e privacy

Invariati (sezioni 2.2, 2.3, 2.4 e 2.6 del documento del Lazio), con l'Italia al posto del Lazio. Altre precisazioni:

- **Regione** di un record: per iNaturalist il luogo di livello amministrativo 10 dentro l'Italia fra i `place_ids`
  del record (20 regioni; Fatto verificato: i 1231 casi ne toccano 20, uno non ne ha nessuno). Per GBIF il campo
  `gadm.level1`, ricondotto alle stesse 20 regioni. Senza regione: «regione ignota», contato.
- **Unità d'analisi, cella, uscita, abbinamento:** invariati (4.2 e 4.3 del documento del Lazio): cella di 0,1°,
  stesso anno solare, ±30 giorni, uscita = (osservatore, data, cella).
- **User-Agent** delle richieste: `Fronda-prova-retrospettiva/<versione> (+https://fungaroli.zatteo.workers.dev;
  ricerca non commerciale)`. Nessun indirizzo personale.

### 2.3 Macro-aree (fissate ora)

Le tre ripartizioni ISTAT, con Nord-ovest e Nord-est unite:

| Macro-area | Regioni |
|---|---|
| Nord | Valle d'Aosta, Piemonte, Lombardia, Trentino-Alto Adige, Veneto, Friuli-Venezia Giulia, Liguria, Emilia-Romagna |
| Centro | Toscana, Umbria, Marche, Lazio |
| Sud e isole | Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna |

**Motivo.** Sono confini amministrativi stabili e verificabili, non scelti sui dati. **Interpretazione:** non sono
zone climatiche vere (le Alpi e la costa ligure stanno insieme), ma separano in modo grezzo l'Appennino centrale, dove
nasce l'indice, dal resto. Una partizione climatica più fine non reggerebbe i numeri (sezione 3).

### 2.4 Fasce di quota (fissate ora)

Come la sezione 11 del documento del Lazio: **< 500 m, 500–999 m, 1000–1399 m, ≥ 1400 m**. Quota = DEM di Open-Meteo
nel punto dell'unità caso (API Elevation, 2.5 del documento del Lazio). Le stesse fasce valgono per l'analisi
descrittiva. **Motivo:** stesse fasce del Lazio per confrontare; una fascia sopra i 1800 m avrebbe pochi casi.

## 3. Fattibilità (Fatto verificato, 22/10/2026)

Numeri **prima** del raggruppamento in uscite, dell'abbinamento e della deduplica: sono **limiti superiori** delle
unità caso.

### 3.1 Casi per specie e macro-area, 2023–2025 (iNaturalist, research grade, filtro di 2.3)

| Specie | Record | Celle 0,1° | Nord | Centro | Sud e isole | di cui Lazio | 2023 | 2024 | 2025 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| edulis | 149 | 103 | 131 | 11 | 7 | 0 | 51 | 47 | 51 |
| pinophilus | 26 | 21 | 19 | 2 | 5 | 0 | 5 | 7 | 14 |
| aereus | 46 | 41 | 10 | 27 | 9 | 10 | 15 | 17 | 14 |
| aestivalis | 54 | 49 | 37 | 11 | 6 | 3 | 20 | 21 | 13 |
| caesarea | 56 | 48 | 31 | 20 | 5 | 6 | 15 | 20 | 21 |
| cibarius | 92 | 70 | 69 | 16 | 7 | 7 | 23 | 52 | 17 |
| cornucopioides | 81 | 60 | 52 | 24 | 5 | 6 | 11 | 50 | 20 |
| repandum | 30 | 24 | 24 | 4 | 2 | 2 | 11 | 10 | 9 |
| procera | 410 | 257 | 324 | 46 | 40 | 26 | 145 | 136 | 129 |
| mellea | 125 | 99 | 76 | 26 | 23 | 7 | 33 | 41 | 51 |
| virescens | 56 | 45 | 39 | 15 | 1 | 5 | 24 | 12 | 20 |
| suillus | 60 | 45 | 24 | 19 | 17 | 4 | 27 | 23 | 10 |
| terreum | 17 | 16 | 11 | 3 | 3 | 1 | 4 | 9 | 4 |
| nuda | 29 | 27 | 22 | 4 | 3 | 1 | 10 | 15 | 4 |
| **Totale** | **1231** | **580** | **869** | **228** | **133** | **78** | **394** | **460** | **377** |

Un caso (*virescens*) non cade in nessuna regione. Le celle del totale sono quelle distinte (una cella può avere più
specie).

**Casi per regione:** Trentino-Alto Adige 235, Piemonte 235, Lombardia 201, Toscana 119, Lazio 78, Veneto 71,
Emilia-Romagna 60, Liguria 41, Sardegna 39, Campania 33, Marche 22, Sicilia 20, Calabria 18, Valle d'Aosta 15,
Friuli-Venezia Giulia 11, Abruzzo 10, Umbria 9, Molise 5, Puglia 5, Basilicata 3, ignota 1. Le tabelle per specie e
regione si salvano in `dati/` e il README le riporta.

**Celle con almeno un caso:** 580 (Lazio 38). Casi per cella: 1 in 344 celle, 2–4 in 185, 5–9 in 40, ≥ 10 in 11;
massimo 30. Coppie cella–anno con almeno un caso: 771.

### 3.2 Controlli (Agaricomycetes, research + needs_id, filtro di 2.3, Italia)

| | 2023 | 2024 | 2025 | Totale |
|---|---:|---:|---:|---:|
| Agaricomycetes | 11 352 | 15 054 | 15 672 | 42 078 |
| senza le 18 specie in prova | 10 781 | 14 301 | 14 852 | 39 934 |

Osservatori distinti 2023–2025: 6374. Mesi (tre anni insieme): massimo in ottobre (10 526) e settembre (7854);
minimo in febbraio (981). L'esclusione dei record identificati solo al genere (2.2 del documento del Lazio) toglie
ancora qualcosa: la si conta all'esecuzione. Quanti controlli cadono nelle 580 celle dei casi si sa solo dopo lo
scaricamento.

### 3.3 GBIF (Italia, 2023–2025, incertezza ≤ 1000 m)

| Gruppo | Record | dal dataset iNaturalist | da altri dataset |
|---|---:|---:|---:|
| 14 specie | 861 | 793 | 68 (NABU naturgucker 43, Observation.org 18, Società micologica danese 4, FunDive 3) |
| Agaricomycetes | 11 352 | 10 267 | 1085 (NABU naturgucker 450, Observation.org 409, Società micologica danese 135, FunDive 82, altri) |

**Interpretazione:** dopo deduplica GBIF aggiunge al più qualche decina di casi e un migliaio di controlli.

### 3.4 Poliporacei perenni (gruppo P2, sezione 4.1)

Research + needs_id, filtro di 2.3, Italia 2023–2025, per i taxa scelti in 4.1: *Fomes* 322, *Fomitopsis pinicola*
355, *Ganoderma applanatum* 78, *G. adspersum* 29, *G. pfeifferi* 0, *Phellinus*
136, *Fomitiporia* 48, *Fuscoporia* 152, *Porodaedalea* 13: circa **1130 record**. Esclusi perché annuali o non
verificati (4.1): *Fomitopsis betulina* 136, *F. quercina* 70, altre *Fomitopsis* 14, *Ganoderma resinaceum* 100,
*G. lucidum* 87, altri *Ganoderma* 7 più i record al solo genere. Mesi: presenti tutto l'anno (gruppo per generi, da 82
a 267 record al mese).

### 3.5 Conseguenze (Interpretazione)

- **Undici specie** superano 30 record in almeno 5 celle: edulis, aereus, aestivalis, caesarea, cibarius,
  cornucopioides, repandum (esattamente 30), procera, mellea, virescens, suillus. Sono limiti superiori: dopo il
  raggruppamento in uscite e l'abbinamento alcune scenderanno sotto la soglia (repandum quasi certamente a rischio).
  pinophilus, terreum e nuda restano nell'analisi complessiva.
- **Q4 (shock) diventa valutabile** per il porcino (149 record in 103 celle) e per «porcini insieme»
  (edulis + pinophilus, 175 record), sezione 4.4.
- Con circa 1000 unità caso l'errore standard dell'AUC sotto nessun segnale scende a circa 0,29 / √1000 ≈ 0,009 prima
  dell'effetto dei cluster; con le celle come cluster gli intervalli saranno più larghi, presumibilmente ±0,03–0,04.
  δ₁ = 0,05 diventa distinguibile.
- Il **71% dei casi sta al Nord** (Alpi e Prealpi), il 19% al Centro, l'11% al Sud e isole. L'indice nasce nel
  Reatino: un esito complessivo parla soprattutto del Nord. Le tabelle per macro-area servono a leggerlo.

## 4. Disegno: le 12 questioni aperte della fase precedente

Ogni voce dice la scelta e il motivo. «Confermata» = resta come nel documento del Lazio.

### 4.1 Q1 · Potenza

Vedi 3.5. Soglie invariate (4.5 del documento del Lazio): etichetta per specie con **≥ 30 unità caso in ≥ 5 celle**,
analisi complessiva con **≥ 50 unità caso in ≥ 10 celle**; da 5 a 29 solo nella complessiva; sotto 5 esclusa. Le
soglie si applicano dopo l'abbinamento, separatamente per P1 e P2 (4.2). Il README riporta per ogni specie quante
unità caso restano.

### 4.2 Q2 · Specificità e poliporacei perenni: due disegni co-principali

**Scelta: sì, due disegni principali con etichetta propria.**

- **P1 (specificità)** = il disegno principale del Lazio (4.1–4.3): controlli = uscite con altri Agaricomycetes.
  Domanda: l'indice della specie mette i suoi ritrovamenti sopra le uscite in cui si sono trovati altri funghi?
- **P2 (quando escono i funghi)** = l'analisi S-G2 del Lazio promossa a principale: controlli = uscite con almeno un
  poliporaceo perenne della lista sotto, stessa cella, stesso anno, ±30 giorni, diverse dall'uscita del caso.
  Domanda: **l'indice riconosce i giorni in cui escono i funghi**, rispetto a giorni in cui qualcuno era nel bosco e
  ha fotografato un fungo visibile comunque?

**Motivo.** P1 toglie anche il segnale meteo comune a tutti i funghi (4.1 del documento del Lazio): da solo non
risponde alla domanda dell'app, cioè se l'indice segue le nascite. P2 corregge lo sforzo con un bersaglio che non
dipende dal meteo recente. **Interpretazione, da leggere accanto a ogni esito di P2:** anche chi fotografa un poliporo
spesso è uscito dopo la pioggia per cercare funghi; P2 corregge lo sforzo meglio del case-crossover, non del tutto.
Un esito favorevole in P2 e non in P1 vuol dire «segue le nascite, ma non distingue la specie».

**Lista dei taxa P2, verificata su fonti** (corpi fruttiferi lignicoli che durano più anni):

| Taxon (iNaturalist) | Fonte e frase verificata il 22/10/2026 |
|---|---|
| *Fomes* (genere, 127511): *F. fomentarius*, *F. inzengae* | Peintner U. et al. (2019) How to resolve cryptic species of polypores: an example in *Fomes*. IMA Fungus 10:17, doi:10.1186/s43008-019-0016-4: per entrambe «Basidiomes perennial, sessile, ungulate, tough, woody». |
| *Phellinus* (118087), *Fomitiporia* (352247), *Fuscoporia* (328266), *Porodaedalea* (118086) | Fiasson J.L. & Niemelä T. (1984) The Hymenochaetales: a revision of the European poroid taxa. Karstenia 24(1):14–28, doi:10.29203/ka.1984.224: i quattro generi stanno nelle Phellinaceae, «fruit bodies stipitate, bracket-shaped or resupinate; perennial or seldom annual». |
| *Fomitopsis pinicola* (1098280) | Kuo M. (2022) *Fomitopsis pinicola*, MushroomExpert.com: «this fungus is perennial, developing a new pore surface each year»; legno morto di conifere e latifoglie. Fonte divulgativa: **Non verificato** su una monografia. |
| *Ganoderma applanatum* (48473), *G. adspersum* (63509), *G. pfeifferi* (781305) | Articolo in J. Fungi 9:1023 (2023), «How Different Molecular Markers Estimate the Diversity of European Species of the *Ganoderma* Genus», doi:10.3390/jof9101023: *G. pfeifferi* «perennial basidioma», *G. adspersum* «similar perennial basidiomata», *G. applanatum* con strati di tubuli «when the basidiomata are more than two years old». |

**Tolti rispetto ai sette generi del Lazio** (voce che il documento del Lazio prevedeva, 10, S-G2): il resto di
*Ganoderma* (*G. lucidum*, *G. resinaceum* e altri: il genere comprende specie annuali; Sci. Rep. 2021,
doi:10.1038/s41598-021-92237-5: «These bracket fungi grow annually or can be perennial») e il resto di *Fomitopsis*
(*F. betulina*, *F. quercina* e altre: non verificate come perenni). **Limite:** «seldom annual» per le Phellinaceae
lascia qualche specie annuale (per esempio *Fuscoporia ferruginosa*, 4 record). Non si cambia la lista dopo aver visto
i dati. I nomi di GBIF si risolvono sul Backbone con `species/match` all'esecuzione e si salvano in `dati/taxa.json`.

**Famiglia dei test.** Le domande principali diventano due: Q1 complessiva in P1 e Q1 complessiva in P2. Nessuna
correzione per confronti multipli; il README lo scrive.

### 4.3 Q3 · Modello meteo: `models=icon_seamless`

**Scelta:** tutte le variabili da `models=icon_seamless` (ICON-D2 dove copre, poi ICON-EU, poi ICON globale), al posto
del best match del documento del Lazio (5.1).

**Motivi.**
- Le variabili del suolo dell'app (umidità 3–9 cm, temperatura a 6 cm) sono dei modelli ICON (`docs/metodo-scientifico.md`,
  sezione 3: il 15/10/2026 lo strato 3–9 cm veniva da ICON-EU). Con `icon_seamless` pioggia, temperatura e suolo
  vengono dalla stessa famiglia per tutto il periodo e tutta l'Italia.
- Il best match nel passato non è documentato giorno per giorno e cambia nel tempo: per esempio ItaliaMeteo-ARPAE ICON
  2I è archiviato solo dal 13/04/2025 (Fatto verificato sulla documentazione). Un cambio di modello a metà 2025
  potrebbe spostare i predittori fra anni e fra celle.
- Fatto verificato su una risposta: nel Reatino dal 25/03 al 05/04/2024 best match e `icon_seamless` hanno dato valori
  identici di pioggia, umidità e temperatura del suolo (coordinate di griglia dichiarate diverse). Non si sa se valga
  nel 2025 o al Nord.

**Controllo C-BM (non blocca, nessun esito).** Su un campione fisso del **10% delle richieste** (estratte con
`random.Random(20261022)` dall'elenco ordinato delle richieste) si scarica anche il best match con gli stessi
intervalli. Si riportano, sui soli predittori dei giorni valutati, mediana e quartili della differenza di pioggia a
30 giorni, T media a 20 giorni e umidità media a 3 giorni, per anno e macro-area. Nessuna AUC con il best match.
**Limite:** l'app usa il best match; se C-BM mostra scarti grandi nel 2025 lo si scrive accanto agli esiti.

### 4.4 Q4 · Domande e punteggi

Confermati Q1–Q4 e i punteggi (0), (1), (1b), (2) (sezioni 6 e 9 del documento del Lazio), per P1 e P2. Il punteggio
(A) serviva all'archivio, che qui non si usa (4.9). Q4 (shock) si legge sul porcino e su «porcini insieme» (edulis e
pinophilus, ogni caso con il punteggio della sua specie), con le soglie dell'analisi complessiva (≥ 50 unità in
≥ 10 celle).

### 4.5 Q5 · Abbinamento, unità e periodo

Confermati (4.2–4.4 del documento del Lazio). **Strati:** gli esiti si riportano anche per macro-area (2.3) e per
fascia di quota del caso (2.4), con stima e intervalli **senza etichetta**; ogni caso entra nello strato della sua
macro-area e della sua quota, con i suoi controlli. **Lazio:** solo tabelle descrittive (unità, celle, AUC con
intervalli), senza etichetta e senza contare come domanda.

### 4.6 Q6 · Punto meteo: una serie per cella

**Corretto.** Il documento del Lazio chiedeva un punto per unità (5.3, coordinate arrotondate a 0,01°). Qui: **una
serie per cella di 0,1°**, condivisa da casi e controlli della cella.

- **Punto meteo della cella:** media delle coordinate delle unità caso della cella (tutti gli anni 2023–2025),
  arrotondata a 0,01°. Se la risposta non ha valori di umidità del suolo in nessun giorno (punto in mare per il
  modello), si ripete una volta con il punto dell'unità caso con l'identificativo più basso; il README conta questi
  casi.
- **Quota del punto meteo:** quella che Open-Meteo restituisce (DEM, nessun `elevation`), come 2.5 del documento del
  Lazio.
- **Motivi.** (a) Il confronto avviene dentro la cella: con una serie sola casi e controlli differiscono solo per il
  giorno, cioè proprio per ciò che si vuole misurare. (b) Le chiamate: con un punto per unità servirebbero decine di
  migliaia di richieste, con una serie per cella sono 779 (sezione 6). **Limite (Interpretazione):** in montagna una
  cella copre centinaia di metri di dislivello; la temperatura della serie è quella della quota del punto, non di
  ogni unità.
- **Una richiesta per cella e anno.** Per ogni unità caso del giorno d dell'anno y l'intervallo necessario va da
  max(d − 30, 01/01/y) − 62 giorni a min(d + 30, 31/12/y): copre la finestra di 62 giorni dell'app (`PAST_DAYS`) per
  il caso, per tutti i controlli abbinabili (±30 giorni, stesso anno) e per il case-crossover (d ± 28). Gli intervalli
  della stessa cella e dello stesso anno si uniscono se lo spazio scoperto fra loro è meno di 63 giorni; altrimenti
  restano richieste separate. Nessuna richiesta comincia prima del 25/11/2022.
- **S-CELLA** (celle di 0,2°): un controllo di una cella vicina usa la serie della cella del caso. Nessuna chiamata
  in più; il README lo scrive.
- **S-QUOTA:** confermata, con la quota DEM del punto di ogni unità (API Elevation, priorità bassa, sezione 7). Se le
  quote dei controlli non arrivano entro la fine dello scaricamento, S-QUOTA è «non eseguita» e il README lo dice.

### 4.7 Q7 · Climatologia (2)

**Corretta.** Il denominatore e il numeratore si contano **per macro-area** (2.3), non su tutta l'Italia: il
calendario delle nascite al Nord e al Sud è diverso. Training = anni dal 2015 al 2025 tranne quello del caso, come nel
Lazio (sezione 7). Se in una macro-area una specie ha meno di 10 unità caso negli anni di training, si usa la
climatologia di tutta l'Italia per quella specie e macro-area, e il README lo conta. **Motivo:** una climatologia
nazionale darebbe al Sud il calendario delle Alpi e favorirebbe l'indice nel confronto Q3 senza merito.

### 4.8 Q8 · Licenze, record senza licenza e fonti

Confermati (2.6 del documento del Lazio; risposta (a) alla domanda 16.3): i record iNaturalist senza licenza entrano
usando solo i fatti, con la sensibilità S-LIC. GBIF con la deduplica di 2.4 del documento del Lazio.

### 4.9 Q9 · Analisi secondarie

- **S-G2** diventa P2 (4.2). **S-CC, S-CELLA, S-FIN, S-PREC, S-LIC, S-SPEC, S-ARR, S-COMP, S-QUOTA:** confermate,
  per P1 e per P2, senza etichetta.
- **S-ARC e S-PROD tolte** per l'Italia: richiederebbero l'archivio per 2015–2025 (decine di migliaia di chiamate in
  più) e con il ritmo della sezione 7 allungherebbero lo scaricamento di settimane. Il loro scopo (confronto fra
  prodotti) resta in parte coperto da C-BM (4.3).
- **Nuova, descrittiva:** S-MACRO, cioè le tabelle per macro-area e quota di 4.5.
- **Analisi descrittiva** (sezione 11 del documento del Lazio): confermata, su tutta l'Italia 2015–2025, per macro-area
  e fascia di quota.

### 4.10 Q10 · δ e soglie

**Confermati come proposta: δ₁ = 0,05 per Q1, δ = 0,03 per Q2–Q4**, e le soglie di 4.1. È una proposta: Matteo può
cambiarli **prima dello scaricamento delle osservazioni**, con una voce datata nelle «Deviazioni». Senza risposta
valgono questi.

### 4.11 Q11 · Scaricamento lento da questo ambiente

**Corretto.** Il ritmo di 5.4 del documento del Lazio (300 chiamate pesate al minuto, 4000 all'ora, 8000 al giorno)
è troppo alto per un indirizzo d'uscita condiviso. Vale la sezione 7.

### 4.12 Q12 · Ora legale

**Confermato: come l'app.** Si chiede `timezone=Europe/Rome` e la serie passa a `toDaily` di `js/weather.js` senza
modifiche; nessuna correzione per il cambio d'ora.

- **Fatto verificato su quattro risposte** (25/03–05/04/2024): Open-Meteo ha restituito 24 valori orari per ogni giorno
  locale, anche il 31/03/2024, con un solo `utc_offset_seconds` (7200) per tutta la risposta. Il giorno di 23 ore
  previsto in 5.1 del documento del Lazio (dalla lettura del codice) **non** si presenta: la correzione va nelle
  «Deviazioni». Non è verificato da che cosa dipenda lo scarto scelto (data della richiesta o date richieste).
- **Regola.** Ogni risposta salva `utc_offset_seconds`. Casi e controlli della stessa cella usano la stessa risposta,
  quindi lo stesso scarto: un'ora di differenza fra celle non sposta il confronto dentro la cella. Il README riporta
  quante risposte hanno ciascuno scarto. Un giorno con meno di 24 valori orari validi resta senza suolo, come
  nell'app.

## 5. Meteo: richiesta e controlli

### 5.1 Richiesta

`https://historical-forecast-api.open-meteo.com/v1/forecast` con
`daily=precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max`,
`hourly=soil_moisture_3_to_9cm,soil_temperature_6cm`, `timezone=Europe/Rome`, `models=icon_seamless`,
`start_date`, `end_date`, nessun `elevation`. Sei variabili. C-BM: stessa richiesta con `models=best_match`.

### 5.2 Completezza

Invariata (5.5 del documento del Lazio), compreso il **blocco al 20%** di unità caso o controllo senza meteo completo,
separatamente per P1 e P2.

### 5.3 Controllo di disponibilità (sostituisce il controllo 8 del documento del Lazio)

Prima dello scaricamento completo: le prime 20 richieste dell'elenco ordinato. Per ognuna: primo giorno con valori di
ogni variabile, giorni mancanti, quota e coordinate di griglia restituite, `utc_offset_seconds`. Se umidità 3–9 cm o
temperatura a 6 cm mancano in più del 5% dei giorni dopo il 01/12/2022, lo scaricamento si ferma e il seguito è una
deviazione. **Fatto verificato** il 22/10/2026 su quattro risposte (Reatino, Trentino, Calabria, marzo–aprile 2024):
le due variabili del suolo avevano tutti i 288 valori orari. Quattro richieste su otto hanno avuto 429 «Daily API request
limit exceeded» o un errore di rete, a pochi minuti da risposte buone: la quota condivisa si esaurisce di continuo.

## 6. Stima delle chiamate

**Regola di Open-Meteo** (pagina Pricing, Fatto verificato il 21/10/2026): una richiesta vale
max(1; variabili / 10) × max(1; giorni / 14) chiamate per punto, in modo frazionario. Qui 6 variabili: peso =
max(1; giorni / 14). Calcolo sui 1231 casi (3.1) con le regole di 4.6:

| Blocco | Richieste | Giorni-punto | Chiamate pesate |
|---|---:|---:|---:|
| P1 e P2, una richiesta per cella e anno (intervalli uniti) | 779 | 102 982 | 7356 |
| C-BM, 10% delle richieste con il best match | 78 | — | 746 |
| Quote dei punti delle unità caso (API Elevation, ≤ 100 coordinate per richiesta) | ~13–130 | — | 13–1231 (peso non documentato) |
| **Totale senza le quote dei controlli** | | | **≈ 8100–9300** |

- Durata mediana di una richiesta 123 giorni, massima 302 (peso medio ≈ 9,4).
- P2, S-CC, S-CELLA, S-FIN e le altre secondarie usano le stesse serie: nessuna chiamata in più.
- **Quote dei controlli** per S-QUOTA: dopo lo scaricamento delle osservazioni, in coda. Il peso di una richiesta
  Elevation con molte coordinate non è documentato: si stima per prudenza 1 chiamata per coordinata, finché la
  documentazione o il log non mostrano altro.
- **Tempo previsto** al ritmo della sezione 7 (1500 chiamate pesate al giorno): P1 e P2 circa **5 giorni**, con C-BM
  e le quote dei casi **6 giorni circa**, senza contare le pause per 429. Con molti 429 (quota condivisa) il tempo può
  raddoppiare o più. Il numero vero di richieste si conosce dopo lo scaricamento delle osservazioni (dedup, GBIF,
  uscite) e il README lo riporta.

## 7. Ritmo dello scaricamento (sostituisce 5.4 del documento del Lazio)

- Una richiesta alla volta, **al massimo una ogni 20 secondi**.
- Tetti di chiamate pesate configurabili, con default **150 all'ora e 1500 al giorno** (giorno = UTC): circa un sesto
  dei limiti gratuiti, perché l'indirizzo d'uscita è condiviso con altri.
- Su **429**: pausa crescente 15 minuti, 30, 60, 120, 240, poi 360 minuti per ogni 429 successivo; dopo una risposta
  buona si riparte da 15. Su errori di rete o 5xx: stessa scala, al massimo 6 tentativi per richiesta prima di
  segnarla in sospeso.
- Cache per richiesta (file per chiave, scrittura atomica); una richiesta già salvata non si ripete; ripartenza da dove
  si è fermato. Log `dati/meteo.log` con ogni richiesta, peso stimato ed esito.
- Ordine: P1/P2 prima, poi C-BM, poi quote dei casi, poi quote dei controlli.
- Osservazioni: iNaturalist al più una richiesta al secondo (raccomandazione dell'API) e GBIF una ogni mezzo secondo,
  con cache.

## 8. File in più (in `tools/prova-lazio/`)

- `scarica_osservazioni.py` (iNaturalist API v1 e GBIF, cache su disco), `richieste.py` (elenco delle richieste meteo),
  `scarica_meteo.py` (scaricamento lento, `--stato`). Solo libreria standard, `python -I`.
- `fattori.mjs` e `valuta.py` del documento del Lazio, estesi a P2, macro-aree e quote.
- `dati/` resta esclusa da git.

## 9. Limiti in più, dichiarati prima

- **Prevale il Nord** (3.5): l'esito complessivo dice poco del Reatino; il Lazio da solo resta non valutabile.
- **Una serie per cella** (4.6): la quota delle unità entra solo nelle sensibilità.
- **Un modello solo** (4.3): non è il best match dell'app; C-BM misura lo scarto solo sui predittori.
- **P2 non è uno sforzo puro** (4.2): chi fotografa un poliporo spesso cerca funghi dopo la pioggia.
- **Quota condivisa di Open-Meteo:** lo scaricamento può durare molto più della stima; il protocollo non cambia.
