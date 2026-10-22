# Prova retrospettiva: deviazioni dalla preregistrazione

Scritto il **22 ottobre 2026, prima di qualunque risultato**: finora si sono visti solo struttura e conteggi delle
osservazioni (unità, celle, abbinamenti, osservatori, nomi), nessun punteggio né meteo associato agli esiti. Le dodici
risposte meteo già salvate sono state lette solo per scarto orario, ore per giorno e valori mancanti del suolo, senza
legarle a casi o controlli.

Documenti di partenza: `preregistrazione.md` (Lazio, commit `0a187096`) e `preregistrazione-italia.md` (Italia,
commit `3eaf3dfc`), che non si modificano. Questo file raccoglie i cambiamenti che i due documenti mandavano nelle
«Deviazioni» del README: il README li riprenderà rimandando qui. Origine: i rilievi di due revisori indipendenti sul
protocollo e le decisioni di Matteo del 22/10/2026. Per la prova sull'Italia vale: preregistrazione del Lazio, poi
quella dell'Italia, poi questo file; dove divergono fa fede l'ultimo.

Legenda come nei due documenti: **Fatto verificato**, **Interpretazione**, **Ipotesi**, **Non verificato**.

**Numeri di struttura usati qui** (Fatto verificato, 22/10/2026, script nello scratchpad della sessione, fuori dal
repository; solo osservazioni, nessun meteo). Filtri di 2.3 del documento del Lazio sull'Italia, deduplica 1–3 di
2.4 (D9), sinonimi corretti (D10), abbinamento di 4.3: **975 unità caso con almeno un controllo abbinato** in
**435 celle**, 2882 unità controllo P1 abbinate (21 167 nel periodo), 251 unità caso su 1226 senza controlli.
Mediana di |M(c)| = 3. Casi P2 con almeno un controllo P2: **175** in 67 celle.

## D1. Una sola domanda principale: P2 torna secondaria e descrittiva

**Decisione di Matteo (22/10/2026).** La prova ha **una sola domanda principale: Q1 complessiva in P1**.
P2 (poliporacei perenni, 4.2 del documento dell'Italia) torna analisi **secondaria descrittiva, senza etichetta**.

**Perché.** Fatto verificato sulla struttura: il **72%** delle uscite-controllo P2 abbinate a un caso (83 su 116)
contiene anche Agaricomycetes non perenni (sul totale delle uscite P2 del periodo, il 45%). Chi ha fotografato il
poliporo era quasi sempre in cerca di funghi: P2 non misura uno sforzo indipendente dalla pioggia. In più i casi con
controlli P2 sono 175, con |M(c)| mediano 1: la differenza minima distinguibile della complessiva è circa 0,07 (D2).

**Conseguenze.**
- P2 si riporta con stime e i tre intervalli (D4), senza etichetta, con questa frase accanto: «Il 72% delle
  uscite-controllo P2 contiene anche altri Agaricomycetes: P2 non misura lo sforzo indipendente dalla pioggia».
- Le regole di 4.2 del documento dell'Italia su «due disegni co-principali» e «famiglia di due domande principali» non
  valgono più. Il blocco al 20% di meteo mancante (5.2 dell'Italia) vale solo per P1; per P2 si riportano i conteggi.
- **Lettura congiunta:** niente tabella P1 × P2 e niente frase «segue le nascite, ma non distingue la specie».
  Al suo posto, solo descrittivo: **P1 sugli stessi 175 casi di P2** (stessi casi, controlli P1), accanto a P2, così
  che una differenza fra le due non dipenda da casi diversi.
- P2 resta una secondaria come S-G2 del Lazio: la regola «contraddice» (D13) si applica anche a lei.

## D2. Errori standard e differenze minime distinguibili corretti

**Errore.** Il documento del Lazio (3.7) e quello dell'Italia (3.5) stimavano l'errore standard dell'AUC sotto
nessun segnale come 0,29 / √n, cioè con varianza 1/12 per caso. È la varianza con infiniti controlli per caso.

**Correzione.** Con m controlli abbinati, sotto nessun segnale (punteggi indipendenti e continui)
Var(U_c) = 1/12 + 1/(6m) = **(m + 2) / (12 m)**: con m = 3 vale 0,139 invece di 0,083. Per un'AUC media di n casi,
nell'ipotesi di casi indipendenti, σ₀ = √(Σ_c (m_c + 2)/(12 m_c)) / n.

Casi diversi della stessa cella condividono controlli, e le uscite con più specie (D12) sono correlate: σ₀ della
formula è un limite inferiore. Stime per simulazione (punteggi casuali sulla struttura reale dei controlli condivisi):
le nostre (2000 repliche, punteggi indipendenti) coincidono con la formula entro il 5%; quelle dei revisori, con
correlazione fra punteggi, danno **0,013–0,014 per P1 complessiva**, ≈ 0,036 per edulis, ≈ 0,062 per repandum.
Con la stima prudente **MDE ≈ 0,026 per P1 complessiva**.

**MDE** qui = 1,96 · σ₀: la più piccola distanza da 0,5 che un intervallo al 95% sotto nessun segnale esclude (potenza
50%). Per una potenza dell'80% serve 2,80 · σ₀ (ultima colonna). Gli intervalli bootstrap per cluster (D4) saranno più
larghi, quindi queste MDE sono ottimiste.

| Specie | Unità caso con controlli | Celle | m mediano | σ₀ (formula) | **MDE = 1,96 σ₀** | σ₀ (simulazione) | 2,80 σ₀ | Cluster effettivi: cella | osservatore | regione × anno (eff.) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| edulis | 110 | 82 | 3 | 0,037 | **0,072** | 0,037 | 0,103 | 63,7 | 64,4 | 21 (10,4) |
| pinophilus | 22 | 19 | 3,5 | 0,082 | 0,161 | 0,083 | 0,232 | 17,3 | 16,1 | 13 (10,1) |
| aereus | 34 | 30 | 3 | 0,066 | **0,130** | 0,067 | 0,187 | 27,5 | 25,1 | 16 (10,7) |
| aestivalis | 39 | 35 | 2 | 0,068 | **0,132** | 0,069 | 0,194 | 31,0 | 26,7 | 21 (15,1) |
| caesarea | 41 | 35 | 4 | 0,059 | **0,116** | 0,059 | 0,166 | 30,6 | 35,8 | 16 (9,3) |
| cibarius | 74 | 59 | 3 | 0,046 | **0,091** | 0,045 | 0,125 | 48,9 | 44,9 | 23 (13,4) |
| cornucopioides | 67 | 49 | 3 | 0,048 | **0,095** | 0,049 | 0,136 | 36,5 | 38,4 | 23 (11,9) |
| repandum | 30 | 26 | 3 | 0,071 | 0,140 | 0,071 | 0,198 | 23,7 | **14,5** | 18 (14,5) |
| procera | 323 | 203 | 3 | 0,022 | **0,043** | 0,022 | 0,062 | 114,3 | 124,3 | 44 (16,8) |
| mellea | 102 | 79 | 4 | 0,037 | **0,073** | 0,039 | 0,108 | 57,2 | 68,4 | 32 (21,7) |
| virescens | 45 | 34 | 4 | 0,058 | **0,113** | 0,059 | 0,164 | 22,8 | 24,4 | 22 (15,0) |
| suillus | 54 | 42 | 2,5 | 0,055 | **0,108** | 0,056 | 0,156 | 33,1 | 27,5 | 25 (17,6) |
| terreum | 13 | 12 | 6 | 0,100 | 0,195 | 0,099 | 0,278 | 11,3 | 8,0 | 9 (6,3) |
| nuda | 21 | 20 | 3 | 0,080 | 0,157 | 0,079 | 0,221 | 19,2 | 16,3 | 13 (9,4) |
| **P1 complessiva** | **975** | **435** | 3 | 0,0125 | 0,025 (prudente **0,026**) | 0,0125 (revisori 0,013–0,014) | 0,035–0,039 | 183,2 | 172,1 | 55 (22,2) |
| P2 complessiva (D1) | 175 | 67 | 1 | 0,036 | 0,070 | 0,037 | 0,104 | 24,8 | 34,0 | 34 (13,5) |

Cluster effettivi = 1 / Σ p², con p la quota di casi di ogni cluster; un'uscita GBIF senza `recordedBy` è un cluster a
sé. In grassetto le MDE delle specie con etichetta (D3).

**Interpretazione.** δ₁ = 0,05 resta distinguibile solo nella complessiva e, per le specie, al più per procera.
Per le altre specie un'etichetta richiede effetti di 0,07–0,13 sopra 0,5: «non distinguibile» resta l'esito atteso.
δ non cambia (4.10 dell'Italia: si poteva cambiare solo prima dello scaricamento delle osservazioni).

## D3. Soglie per specie, elenco delle specie con etichetta e confronti multipli

**Soglia in più.** Oltre a ≥ 30 unità caso in ≥ 5 celle (4.5 del Lazio), una specie ha l'etichetta solo con
**≥ 15 cluster effettivi per cella e ≥ 15 per osservatore** (1/Σp², D2). **Perché:** il bootstrap per cluster con
pochi cluster dominanti dà intervalli troppo stretti. La stessa regola vale per la complessiva (soddisfatta: 183 e
172). Specie sotto la nuova soglia ma con ≥ 5 unità restano nella complessiva, come quelle da 5 a 29.

**Elenco fissato ora.** Undici specie superano ≥ 30 unità in ≥ 5 celle sulla struttura dei dati: edulis, aereus,
aestivalis, caesarea, cibarius, cornucopioides, repandum, procera, mellea, virescens, suillus (Fatto verificato,
tabella di D2; pinophilus 22, nuda 21, terreum 13 restano sotto). **repandum non supera la nuova soglia**: 30 unità
(esattamente la soglia) ma **14,5 cluster effettivi per osservatore** (pochi osservatori fanno molti casi). Le specie
con etichetta sono quindi **dieci: edulis, aereus, aestivalis, caesarea, cibarius, cornucopioides, procera, mellea,
virescens, suillus**. repandum entra nella complessiva e nelle tabelle, senza etichetta.

- L'elenco non cambia dopo il meteo. Se una delle dieci, dopo la completezza del meteo (5.5 del Lazio), scende sotto
  una soglia, è «non valutabile» ma resta nel conto della correzione: la famiglia ha sempre 10 membri.
- Nessuna specie fuori elenco può ottenere un'etichetta, qualunque sia il numero finale.

**Confronti multipli: Holm per domanda.** Per ognuna delle domande Q1, Q2 e Q3 le dieci etichette per specie formano
una famiglia con correzione di **Holm** al 5%. Q4 (shock) ha la sua famiglia di due: edulis e «porcini insieme».
La domanda principale (Q1 complessiva in P1) è una sola e non si corregge.

- p-value bootstrap di una specie per un intervallo: p = min(1; 2 · min((1 + #{θ* ≤ r}), (1 + #{θ* ≥ r})) / (B + 1)),
  con r il riferimento (0,5 o 0) e θ* le B = 5000 repliche. Per i tre intervalli (D4) si prende il **massimo** dei
  tre p. Holm sui dieci massimi: l'etichetta «meglio/peggio» (con le regole di δ di 9 del Lazio) solo alle specie
  rifiutate da Holm; alle altre «non distinguibile (dopo la correzione di Holm)».
- Il README riporta per ogni specie stima, i tre intervalli al 95% non corretti, p e p corretto.

**Perché Holm e non la regola «specie solo se la complessiva ha un'etichetta per la stessa domanda».**
(a) Holm controlla la probabilità di almeno un'etichetta falsa fra le dieci per qualunque dipendenza fra specie;
la regola a cancello no: passato il cancello, le dieci etichette restano senza correzione. (b) La complessiva è fatta
per un terzo di procera (323 su 975) e per il 73% di casi del Nord: il cancello farebbe dipendere l'etichetta di
caesarea o di aereus dall'esito di procera e delle Alpi. (c) Holm è uniformemente più potente di Bonferroni e non
chiede ipotesi in più.

## D4. Terzo intervallo: bootstrap per regione × anno

**Cambia** 8.2 del documento del Lazio: si aggiunge **B-regione×anno**, che estrae con reinserimento le coppie
(regione, anno) che contengono almeno un caso; ogni coppia porta tutti i suoi casi. Stesso seme, B = 5000, stesse
estrazioni per tutti i punteggi, nell'ordine B-cella, B-osservatore, B-regione×anno. Regione = 2.2 dell'Italia; casi
senza regione formano il cluster «ignota» per anno.

**Perché.** Casi della stessa regione e della stessa stagione condividono il meteo di fondo (la stessa estate secca
del Nord, per esempio): cella e osservatore non lo colgono. P1 complessiva: 55 coppie, 22,2 effettive.

**Regola di 9 del Lazio, adattata.** «Entrambi gli intervalli» diventa **«tutti e tre gli intervalli»**: un verdetto
(meglio/peggio, anche «trascurabile») solo se B-cella, B-osservatore e B-regione×anno escludono il riferimento **dalla
stessa parte**; «la differenza resta sotto δ in tutto l'intervallo» solo se tutti e tre stanno dentro (−δ; +δ).

**Frase obbligatoria accanto agli esiti:** «Gli intervalli sono condizionati alle stagioni 2023–2025: non dicono
come andrebbe in anni con un andamento diverso».

**Regola «eterogeneo fra anni».** Per ogni anno si calcolano stima e intervallo B-cella dentro l'anno.
- Se almeno un anno ha la stima dalla parte opposta del riferimento rispetto alla stima complessiva **e** il suo
  intervallo B-cella esclude il riferimento, il verdetto «meglio/peggio» è sostituito da «**eterogeneo fra anni**»,
  con le stime per anno.
- Se solo il controllo di stabilità di 8.2 del Lazio (togliere un anno) porta la stima dall'altra parte, il verdetto
  resta e accanto si scrive «non stabile fra anni».

## D5. Climatologia (2): il denominatore è il gruppo di confronto del disegno

**Cambia** 6, punteggio (2), del Lazio e 4.7 dell'Italia. c_k(t) = unità caso di X negli anni di training a non più
di 15 giorni da t / **unità controllo del disegno** negli stessi anni e giorni, per macro-area (4.7 dell'Italia,
compreso il ripiego sull'Italia sotto 10 unità caso). P1: uscite con altri Agaricomycetes (4.2 del Lazio); P2: uscite
con poliporacei perenni. Le unità caso delle specie in prova non entrano più nel denominatore.

**Perché.** La climatologia deve correggere lo sforzo con lo stesso gruppo con cui l'AUC confronta i casi; mescolare
nel denominatore i casi di altre specie lo rende un ibrido fra i due e lo fa dipendere da quante specie sono in prova.

## D6. Pari merito

Il README riporta, per ogni punteggio, analisi e specie, la **quota di coppie caso–controllo pari** per punteggio
(media sui casi della quota di controlli con x_m = x_c, come l'AUC). **Perché:** (0) ha pesi mensili a gradini e (2)
può valere 0; molti pari spingono l'AUC verso 0,5 e lo si deve vedere.

## D7. Sensibilità senza i controlli identificati solo sopra il genere

Nuova secondaria **S-GEN**, senza etichetta, per P1, punteggi (0), (1), (1b), (2): si tolgono le unità controllo i cui
record sono tutti identificati a un rango sopra il genere (famiglia, ordine, classe…). **Perché:** un controllo
«Boletaceae» o «Agaricomycetes» può essere una specie in prova. Struttura: 238 delle 2882 unità controllo P1 abbinate;
14 casi restano senza controlli. Rientra nella regola «contraddice» (D13).

## D8. Confini d'anno

L'abbinamento (4.3 del Lazio) vuole lo **stesso anno solare**: per i casi a meno di 30 giorni dal 1° gennaio o dal
31 dicembre la finestra è troncata da un lato (42 delle 975 unità caso P1). Si conserva come preregistrato e il README
lo conta. Per lo stesso motivo nel case-crossover (S-CC) i giorni d ± 14 e d ± 28 che cadono nell'anno prima o dopo
non si usano; la climatologia (2) usa invece la distanza circolare fra giorni dell'anno, come preregistrato.

## D9. Deduplica 2 e 3

La deduplica 2 (`isInCluster`, stessa specie e data, si tiene il `gbifID` più basso) e la 3 (record GBIF a meno di
1000 m da un record iNaturalist della stessa specie e data) di 2.4 del Lazio **non erano negli script di
scaricamento**: si implementano in `valuta.py`, prima dell'abbinamento. «Stesso taxon» per i controlli: la stessa
specie dell'app per le 14 specie, altrimenti lo stesso nome canonico accettato (le due tassonomie a volte divergono:
qualche duplicato può restare; **Interpretazione:** effetto trascurabile). Struttura: 5 record tolti dalla 2 e 24
dalla 3, su 77 124 validi.

**Controllo bloccante** (si aggiunge al 4 di 12 del Lazio): nessuna coppia di record GBIF `isInCluster` con lo stesso
taxon e la stessa data, e nessuna coppia GBIF–iNaturalist con lo stesso taxon e la stessa data a meno di 1000 m.

`dati/richieste.json` è costruito senza queste deduplicazioni: una cella con un caso solo duplicato ha una richiesta
in più, che `valuta.py` non usa. Nessun effetto sugli esiti.

## D10. Nomi verbatim GBIF e sinonimi

**Errore.** La tabella dei sinonimi degli script del 22/10 mattina troncava ogni nome a due parole e, nelle
collisioni, l'ultima specie sovrascriveva le altre: *boletus edulis* → aestivalis (da *Boletus edulis reticulatus*),
*russula vesca* → virescens, *tricholoma scalpturatum* → terreum, *tricholoma sordidum* → nuda, *amanita bulbosa* →
caesarea (da trinomi sinonimi), e altri dello stesso tipo. In più la ricerca GBIF non restituisce il nome verbatim:
la regola di 2.2 del Lazio non si applicava mai.

**Correzione.**
- Nomi canonici completi, come `canonicalName` del Backbone: genere, epiteto ed eventuale epiteto infraspecifico,
  senza autori né marcatori di rango, **senza troncamento**. Un nome che compare sotto due specie è ambiguo e non dà
  un caso (Fatto verificato: solo *Boletus edulis reticulatus*, sinonimo sia di *B. reticulatus* sia di *B. aereus*).
- Il nome verbatim si legge da `/occurrence/{key}/verbatim` (`dwc:scientificName`) per i record GBIF assegnati solo
  a uno dei generi in prova che passano i filtri di base, in tutti gli anni 2015–2025 (servono anche alla
  climatologia): **54 chiamate**, una al secondo, con cache.
- **Scelta nuova:** un nome verbatim con «agg.», «s.l.», «cf.», «aff.», «group», «sp.», «indet.» e simili non è la
  specie e non dà un caso (resta escluso dai controlli come record al genere). **Perché:** «*Armillaria mellea* agg.»
  comprende altre *Armillaria*.
- **Fatto verificato:** dei 54 nomi verbatim nessuno diventa un caso (4 sono «*Armillaria mellea* agg.», gli altri
  sono generi, sezioni o specie fuori prova). Sui dati attuali la correzione non cambia i casi; impedisce errori su
  un nuovo scaricamento.

**Esclusione di *Cantharellus cibarius* var. *pallidus*.** Esclusa sia dai casi sia dai controlli (2 record GBIF in
Italia, nessuno in iNaturalist). **Perché:** è il finferlo pallido che iNaturalist tiene separato come *C. pallens*,
già escluso in 2.2 del Lazio (**Interpretazione**: la corrispondenza fra i due nomi non è verificata su una
monografia).

## D11. Scarto orario delle risposte e C-BM

**Fatto verificato su dodici risposte** salvate il 22/10/2026 fra le 06:17 e le 06:54 UTC: tutte hanno
`utc_offset_seconds` = 7200 (CEST), anche quelle che coprono soprattutto o soltanto l'ora solare (dal 25/09 al
31/12/2023: 64 giorni su 98; dal 31/10/2023 al 31/01/2024: tutti). **Interpretazione:** lo scarto lo decide l'ora della richiesta, non le
date richieste. Dal 25/10/2026 (fine dell'ora legale) le risposte nuove potrebbero arrivare con 3600: si verificherà
sulle prime risposte dopo quella data.

**Conseguenze.**
- Dentro una cella casi e controlli usano la stessa risposta: il confronto principale non cambia (4.12 dell'Italia).
- **C-BM** confronta best match e `icon_seamless` sugli stessi giorni locali: con scarti diversi i giorni sarebbero
  spostati di un'ora. Ogni gemella C-BM si scarica **subito dopo la sua richiesta P1** (le gemelle di richieste P1 già
  salvate passano per prime) e **C-BM confronta solo coppie con lo stesso `utc_offset_seconds`**; le coppie con scarti
  diversi si contano e si escludono.
- La gemella C-BM **eredita il punto della sua richiesta P1**: se la P1 è stata salvata con il punto di ripiego (4.6
  dell'Italia), la gemella usa quel punto e non tenta un ripiego proprio. Se la P1 è sospesa, la gemella non si
  scarica.
- Il README riporta il numero di risposte per scarto.

## D12. Uscite contate più volte nella complessiva

Un'uscita con due specie in prova è un'unità caso per ciascuna (4.2 del Lazio): nella complessiva P1 **64 uscite**
contano più di una volta (82 unità in più su 975). Si conserva come preregistrato (ogni caso pesa 1). Le copie di
un'uscita stanno nella stessa cella, con lo stesso osservatore e nella stessa regione e anno: i tre bootstrap le
estraggono insieme, quindi gli intervalli ne tengono conto. Il README lo scrive.

## D13. Regola «contraddice»

Si adatta 10 del Lazio ai tre intervalli: una secondaria (compresa P2, D1, e S-GEN, D7) **contraddice** il principale
quando **tutti e tre** i suoi intervalli stanno dalla parte opposta del riferimento rispetto alla stima puntuale del
principale. **Nota sul caso:** se il principale è «non distinguibile», il README scrive «va nella direzione opposta
alla stima del principale», non «contraddice il verdetto», perché un verdetto non c'è; se la stima del principale è
uguale al riferimento, la regola non si applica.

## D14. Controllo di disponibilità 5.3, a posteriori su tutte le risposte

**Cambia** 5.3 dell'Italia (e 8 di 12 del Lazio).
- Le **7 richieste che cominciano il 25/11/2022** (il periodo più vicino all'inizio dell'archivio ICON) si scaricano
  per prime fra quelle mancanti, così il controllo le guarda subito.
- Il controllo resta sulle **prime 20 risposte P1 salvate** (nell'ordine del log: le dodici già salvate, poi le 7,
  poi le successive): se in una di loro umidità 3–9 cm o temperatura a 6 cm mancano in più del 5% dei giorni dal
  01/12/2022 (giorno senza suolo = meno di 24 valori orari validi), lo scaricamento **si ferma da solo** e il seguito
  è una deviazione. Una risposta senza suolo in nessun giorno anche nel punto di ripiego è il caso del punto in mare
  (4.6 dell'Italia): si conta lì, non blocca.
- **A posteriori, su tutte le risposte:** giorni senza suolo per risposta, nel log di ogni risposta e nel comando
  `--stato`; il README riporta la distribuzione. Le unità con giorni senza suolo cadono sotto la completezza (5.5 del
  Lazio, blocco al 20% per P1).
- Fatto verificato: le dodici risposte già salvate hanno tutti i valori orari del suolo.

## D15. Correzione del «giorno di 23 ore»

5.1 del Lazio diceva, dalla lettura del codice, che nel giorno del passaggio all'ora legale il giorno locale ha 23
ore e il suolo manca. **Non è così** con Open-Meteo: ogni risposta ha un solo scarto orario e 24 valori per ogni
giorno locale. **Fatto verificato** su risposte reali: 31/03/2024 (4.12 dell'Italia), 26/03/2023 e 29/10/2023 (nelle
risposte di D11), sempre 24 valori. Nessun giorno perde il suolo per il cambio d'ora; `toDaily` resta invariato.

## D16. Ritmo, ordine e robustezza dello scaricamento

- **Tetto giornaliero su finestra mobile di 24 ore**, non sul giorno UTC (7 dell'Italia): lo script lo applicava già
  così. È più severo o uguale: nessuna finestra di 24 ore supera 1500 chiamate pesate. `--stato` riporta entrambi.
- **Ordine mescolato** con seme fisso (`random.Random(20261022)`) dentro ogni priorità, dopo le 7 richieste di D14,
  con le gemelle C-BM subito dopo la loro P1 (D11). **Perché:** prima l'ordine seguiva le celle da sud a nord; se lo
  scaricamento si ferma a metà, le celle mancanti devono essere un campione a caso, non un'area. Le risposte già
  salvate restano in cache e non si ripetono.
- **Errori:** i 4xx diversi da 400 e 404 (per esempio un 403 del proxy) e gli errori di rete sono transitori, con la
  stessa scala di pause; 6 errori sulla stessa richiesta la mettono in sospeso; dopo 8 rifiuti di fila (esclusi i
  429) lo scaricamento si ferma con un messaggio chiaro nel log, invece di sospendere una richiesta dopo l'altra.
  Opzione `--riprova-sospese` per rimetterle in coda. 400 e 404 restano rifiuti definitivi.
- 429 su `api.open-meteo.com` (Elevation) il 22/10/2026 alle 06:54 UTC, mentre l'API storica rispondeva: **Fatto
  verificato** con una richiesta di prova su un punto fisso (Reatino). **Interpretazione:** le quote sono per servizio.

## D17. Quote 2015–2025 per l'analisi descrittiva (decisione 2 di Matteo)

**Decisione di Matteo (22/10/2026).** Le quote dei punti di tutte le unità 2015–2025 (casi di ogni specie in prova e
controlli P1, tutta l'Italia) servono all'analisi descrittiva per fascia di quota (11 del Lazio, 4.9 dell'Italia) e si
scaricano **in coda, dopo tutto il resto** (priorità 5), con lo stesso ritmo lento.

- Struttura: 39 409 punti distinti, 4182 già nelle quote dei casi e dei controlli (priorità 3 e 4): **35 227 punti
  nuovi**, 353 richieste da 100 coordinate.
- **Peso.** Matteo ha chiesto di misurare dal log il peso reale di una richiesta Elevation e di usare 1 per richiesta
  se il log lo mostra. **Fatto verificato:** il log registra solo il peso stimato da noi; Open-Meteo non restituisce
  il conteggio nella risposta né in un'intestazione (controllato su una risposta del 22/10), e le pagine «Elevation
  API» e «Pricing» lette il 22/10/2026 non dicono come si conta una richiesta con più coordinate. Il peso reale non è
  misurabile: **resta quello prudente, 1 chiamata per coordinata** (100 per richiesta). Circa **23–24 giorni** al tetto
  di 1500 al giorno, dopo le priorità 1–4. Se la documentazione lo chiarisce, il cambio del peso è una nuova voce qui.
- Se le quote non arrivano tutte, la descrittiva per fascia si fa sulle unità con quota e il README dice quante
  mancano.

## D18. Seconda macchina per lo scaricamento (decisione di Matteo, 22/10/2026)

**Perché.** Qui lo scaricamento va avanti solo mentre la sessione è viva: il 22/10 il processo si è fermato due volte
in 40 minuti (riavvio del container e del worker). Al ritmo di 1500 chiamate pesate al giorno la prova principale
chiederebbe circa 8 giorni di funzionamento continuo, che qui non sono garantiti. Matteo ha deciso di far girare lo
stesso script anche dal suo computer; il piano Standard di Open-Meteo (29 €) non include la Historical Forecast API
(pagina Pricing letta il 22/10/2026), il Professional non è stato scelto.

**Come.**
- Stesso `scarica_meteo.py`, stesso `richieste.json`, stessa API, stesso modello, stessi controlli (5.3, ripiego,
  pause). La seconda macchina usa la propria connessione e quindi il limite gratuito di quell'indirizzo; tetti
  `--max-giorno 8000 --max-ora 1500 --intervallo 3`, sotto i limiti pubblicati (10 000 al giorno, 5000 all'ora,
  600 al minuto).
- `--al-contrario`: la seconda macchina percorre lo stesso elenco dal fondo dentro ogni priorità, con le gemelle C-BM
  sempre subito dopo la loro P1 sulla stessa macchina. Le due macchine si incontrano a metà invece di ripetere le
  stesse richieste. L'ordine resta casuale (lo stesso mescolamento, letto al contrario), quindi una fermata a metà
  lascia ancora un campione a caso di celle mancanti (D16).
- `unisci_meteo.py` porta qui le risposte dell'altra macchina: copia solo quelle che mancano, dopo aver controllato
  che la richiesta salvata sia identica a quella dell'elenco; se una richiesta è stata scaricata da entrambe, tiene
  quella di qui e confronta le due risposte (senza `generationtime_ms`). Il README riporterà quante coppie ci sono e
  quante sono identiche: è anche una piccola prova di riproducibilità del servizio. Il log dell'altra macchina si
  conserva a parte (`meteo-<nome>.log`) e non entra nei tetti di qui.
- Il lucchetto del processo usa `msvcrt` su Windows e `fcntl` altrove. Il percorso Windows non è provato qui (nessun
  Windows disponibile): è un **dato non verificato** finché non gira sul computer di Matteo.
- Lo scarto orario delle risposte dipende dal momento della richiesta, non dalla macchina: la regola di D11 (confronto
  C-BM solo fra risposte con lo stesso scarto) resta valida così com'è.

Scritta prima di qualunque risultato: nessuna analisi è stata eseguita.

## Che cosa non cambia

Domanda principale, disegno P1, unità, celle, finestre, δ, punteggi (0), (1), (1b), seme del bootstrap, completezza,
dati e periodo. Nessun codice dell'app (`js/model.js`, `js/species.js`, `js/weather.js`) è cambiato.
