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

## D19. Pioggia diversa fra due giorni di scaricamento (decisione di Matteo, 23/10/2026)

**Fatto verificato.** Riunendo le risposte del Mac (D18), 46 richieste risultano scaricate da entrambe le macchine. 18
sono identiche: sono le risposte che il Mac ha ricevuto già pronte nello zip. Le altre 28 sono state scaricate davvero
due volte: qui il 22/10 fra le 07:55 e le 10:34 UTC, sul Mac il 23/10 fra le 12:09 e le 12:11 UTC. **Tutte e 28
differiscono, e solo nella pioggia giornaliera** (`precipitation_sum`):
- giorni diversi in media il 18,7%, scarto massimo 49,6 mm;
- temperature, umidità e temperatura del suolo identiche;
- in 19 coppie su 28 cambiano anche le coordinate della cella restituita: il 22/10 su una griglia regolare a 0,02°,
  il 23/10 su coordinate diverse;
- la differenza c'è anche nelle gemelle C-BM (`best_match`), con le coordinate uguali.

**Interpretazione, non verificata.** Fra il 22/10 pomeriggio e il 23/10 mezzogiorno il servizio ha cambiato la fonte
o l'elaborazione della pioggia storica. Non c'è un annuncio pubblico (ricerca del 23/10/2026). Non si può dire quale
delle due versioni sia «giusta»: entrambe sono pioggia di modello, non misurata. Non sappiamo se il cambio è
definitivo: da qui il limite giornaliero dell'indirizzo condiviso era esaurito e la verifica non si è potuta rifare.

**Quante risposte ne sono toccate.** Delle 880 risposte meteo usate nella prova, 869 sono state scaricate il 22/10
e 11 il 23/10 (10 P1 `icon_seamless` e 1 gemella C-BM `best_match`):
`2b43f63ab9e7b74b0fca3c39`, `2bb454859585af820946cd55`, `3bb78fd55a0edce56b81c9dd`, `57e442127fb23a439bcf204d`,
`6113eb3df9e4ff34f1425cb2`, `7b9f09f695095e2af781cb26`, `90fafa8a52e33fb34b37aa83`, `9745feff8e14f121e1b0e368`,
`b9f8340303812e93a40229d9`, `cf1bfe9cca1884e2d86c57ab` (P1) e `8d646499d69718a7ee71945b` (C-BM). Per le 28 doppie
resta la copia del 22/10 (regola di `unisci_meteo.py`): così la versione del 22/10 copre 869 risposte su 880.

**Decisione di Matteo.** Si tengono tutti i dati, come da preregistrazione, e si aggiunge una prova di sensibilità:
- **S-D19:** si ripete l'analisi principale togliendo le unità (casi e controlli) il cui meteo viene dalle 10
  richieste P1 del 23/10. Il controllo C-BM si ripete senza la gemella `8d646499d69718a7ee71945b` e la sua P1.
- Il README riporta entrambe, accanto. Se il verdetto di una specie cambia fra le due, il README lo dice e quella
  specie non ha un verdetto netto.

**Osservazione a margine (D17).** Sul Mac l'Elevation API ha risposto 4 volte «Minutely API request limit exceeded»
con richieste da 100 coordinate ogni 3 secondi. È compatibile con un peso per coordinata, ma 4 casi non bastano a
misurarlo: il peso prudente di D17 resta.

Scritta il 23/10/2026, prima di qualunque risultato: nessuna analisi è stata eseguita.

## D20. Scelte d'implementazione dove il protocollo lascia margine (23/10/2026)

Scritte dopo una prova dello script con B = 200 di cui si sono guardati **solo i numeri di struttura** (unità, celle,
completezza, controlli), **prima di leggere qualunque stima, intervallo o verdetto**. La struttura coincide con quella
di D2: 975 unità caso P1 con controlli in 435 celle, 2882 controlli abbinati, cluster effettivi 183,2 (cella), 172,1
(osservatore), 22,2 (regione × anno). Meteo completo per tutte le unità e le coppie (0% mancante); controllo 5
superato su 14 754 voci (scarto massimo 1,7 · 10⁻¹³); nessuna richiesta con il punto di ripiego; 880 risposte con
scarto orario 7200.

1. **Climatologia di un controllo.** c_k(t) si legge nella macro-area dell'unità stessa (regione del suo record con
   l'identificativo più basso), non in quella del caso; regione ignota → Italia. Casi e controlli stanno nella stessa
   cella, quindi quasi sempre coincidono.
2. **Climatologia delle secondarie.** P2 usa il denominatore P2 (D5). S-GEN usa come denominatore i controlli P1 senza
   quelli identificati solo sopra il genere. S-PREC e S-LIC ricalcolano la climatologia sulle loro unità. Le altre
   secondarie (S-FIN, S-CELLA, S-QUOTA, S-CC, S-SPEC, S-MACRO, Lazio, S-D19) usano quella del principale.
3. **Blocco al 20%** (5.5 del Lazio, D1): si conta sulle unità caso con controlli e sulle coppie caso–controllo
   (un controllo vale per la specie del caso), non sulle unità controllo in astratto.
4. **S-CC** usa tutte le unità caso 2023–2025 con una serie (1226), non solo quelle con controlli P1: il
   case-crossover non ha bisogno di controlli. I giorni d ± 14 e d ± 28 fuori dall'anno si tolgono (D8).
5. **Soglie nelle secondarie.** «Incluse nella complessiva» (≥ 5 unità) si ricalcola sull'insieme dei casi di ogni
   analisi (4.5 del Lazio: «con i loro insiemi»). Per questo P2 ha 165 casi nella complessiva su 175 con controlli
   P2: le specie con meno di 5 casi P2 restano fuori.
6. **Q4** (edulis e porcini insieme) usa le soglie della complessiva, compresi i 15 cluster effettivi di D3.
7. **Holm.** Una delle dieci specie «non valutabile» resta nella famiglia con p = 1 (D3: la famiglia ha sempre 10
   membri).
8. **«Eterogeneo fra anni»** (D4) si controlla sui verdetti «meglio/peggio» della complessiva e delle specie che
   passano Holm, con l'intervallo B-cella dentro ogni anno (stesso seme, ripartito per ogni anno).
9. **S-SPEC:** in ogni replica la media delle AUC delle specie presenti nella replica.
10. **S-COMP e S-ARR:** AUC di ogni componente e di (1) arrotondato contro 0,5, con i tre intervalli, senza etichetta.
11. **S-CELLA:** il bootstrap B-cella estrae le celle di 0,2°.
12. **Quote:** quella del punto dell'unità dall'API Elevation (priorità 3 e 4, tutte presenti per casi e controlli
    abbinati). S-QUOTA e le fasce di S-MACRO usano queste.
13. **P1 sugli stessi casi di P2** (D1): le unità caso, per specie, con almeno un controllo P2.
14. **Analisi descrittiva** (11 del Lazio, D17): le quote 2015–2025 della priorità 5 non sono ancora scaricate (1 su
    353 richieste). Si riporta la tabella sulle unità con quota (5137 su 41 520) e la si rifà quando le quote
    arrivano. Nessun verdetto dipende da questa analisi.

## D21. Correzioni dopo le tre verifiche indipendenti (23/10/2026, **dopo aver visto i risultati**)

Tre verifiche indipendenti sugli esiti del 23/10 (commit `c0877363`): una reimplementazione da zero, una revisione del
codice contro questo protocollo, una serie di controlli avversari sui dati. La reimplementazione ha ritrovato tutti i
numeri del principale entro 10⁻¹²; la prova nulla (casi e controlli scambiati a caso) dà AUC 0,500; nessuna fuga
d'informazione dal futuro. Nessun rilievo cambiava un verdetto. Le correzioni qui sotto sono state fatte **dopo** aver
visto stime e verdetti: servono a stare al protocollo, non a cambiare un esito. Il README riporta i numeri prima e
dopo dove cambiano.

**Correzioni che cambiano un numero**
1. **Geometria anche per iNaturalist** (2.1 dell'Italia: «per entrambe le fonti»; controllo 4). `comune.py` la
   applicava solo a GBIF. 213 record iNaturalist validi cadevano fuori dalla geometria salvata, quasi tutti sui
   confini con Svizzera e Slovenia (la geometria dell'API è semplificata: 26 poligoni, 422 vertici). Ora la geometria
   vale per tutti, in `valuta.py`; `comune.py` e `richieste.json` non cambiano. P1: da 975 a 973 casi, da 435 a 433
   celle (cambiano procera e mellea).
2. **C-BM:** ogni giorno di ogni richiesta conta una volta, solo i giorni di casi e controlli del principale (prima
   un giorno valutato per più specie o per più secondarie pesava più volte).
3. **Analisi descrittiva:** il denominatore conta le uscite distinte (un'uscita con due specie una volta sola);
   tabelle per tutta l'Italia e per macro-area (4.9 dell'Italia), con i pesi `months` accanto (11 del Lazio).
4. **Cluster effettivi:** la soglia di 15 (D3) si applica al valore non arrotondato.
5. **Blocco al 20%:** al numeratore anche i casi che perdono tutti i controlli per meteo mancante.

**Parti preregistrate che mancavano**
6. **S-D19** ora ha gli stessi verdetti e la stessa correzione di Holm del principale (D19 chiede se un verdetto
   cambia).
7. **Q4:** controllo «eterogeneo fra anni» anche qui; le specie non rifiutate da Holm riportano anche «la differenza
   resta sotto δ in tutto l'intervallo» quando vale (9 del Lazio).
8. **Secondarie di P2** (4.9 dell'Italia: «per P1 e per P2»): S-FIN, S-CELLA, S-QUOTA, S-PREC, S-LIC, S-SPEC,
   S-COMP, S-MACRO; S-CC è comune ai due disegni. Descrittive, senza etichetta e senza «contraddice».
9. **S-ARR** con il controllo «contraddice» su Q1; **valori distinti** di ogni punteggio per specie (8.1 del Lazio).
10. **Controlli bloccanti più forti.** 2: istantanea congelata `dati/istantanea.json` con lo SHA-256 di ogni file,
    creata il 23/10 (dopo i risultati; da qui in avanti un file cambiato ferma l'esecuzione; le quote della priorità
    5 che arrivano dopo sono ammesse). 3: taxa del codice confrontati con la tabella 2.2 e la lista P2; nessun record
    dei controlli con un taxon escluso. 7: cerca anche id di record in ogni posizione, chiavi delle richieste, celle e
    serie meteo; il riepilogo `esiti-riepilogo.json` si scrive accanto allo script.

**Scelte non coperte, ora scritte**
11. La regione di un'uscita è quella del suo record con l'identificativo più basso: vale per la climatologia (D20.1),
    per il cluster regione × anno, per S-MACRO e per il Lazio. 63 uscite hanno record in regioni diverse.
12. «Contraddice» (D13) si valuta sulla complessiva delle secondarie, non per specie.
13. `fattori.mjs` chiede, oltre a `inputQuality`, che la finestra più lunga stia dentro la serie: nessuna unità
    esclusa per questo.
14. **Fatti da sapere, nessuna modifica:** il gelo (`frost`) usa anche la minima del giorno stesso, come l'app
    (togliendola l'AUC(1) cambia di −0,0015); 14 record iNaturalist di *Hydnum rufescens* e *H. pallidum* restano fra
    i controlli (specie distinte in iNaturalist, sinonimi di *H. repandum* nel Backbone); in 739 coppie su 5533 il
    controllo è un'uscita in cui lo stesso osservatore ha trovato anche una specie in prova (voluto dal disegno, spinge
    verso 0,5).

**Analisi esplorativa nuova (dopo i risultati, senza etichetta)**
15. **E-STESSO-OSS / E-ALTRI-OSS:** il principale con i soli controlli dello stesso osservatore del caso (in altri
    giorni) oppure con i soli controlli di altri osservatori. Nasce da un rilievo della verifica avversaria: contro le
    uscite dello stesso osservatore il vantaggio dell'indice sembrava più piccolo. Serve a leggere Q1, non la cambia.

## D22. Priorità 5 da due parti, attese sull'orologio di sistema, virgole in chiaro (24/10/2026)

Riguarda solo la priorità 5 (quote 2015–2025 per la descrittiva, D17) e il modo di scaricare: nessun effetto sui dati,
sulle richieste o sulle analisi della prova principale (P1–P4 complete su entrambe le macchine).

**Fatti verificati** (log del Mac riferiti dalla sessione che lo segue, 24/10, 12:25 UTC; log di qui):
- **Mac.** P1–P4 complete; P5: 108 fatte su 353. Il 24/10, per decisione di Matteo, il Mac è passato alla rete di
  casa (un altro indirizzo IP) e dalle 06:49 alle 12:11 UTC ha girato una volta sola con `--max-giorno 16000
  --max-richieste 80`, perché il tetto dello script contava anche le chiamate del 23/10 fatte dall'altro indirizzo.
  Risultato: 80 richieste salvate e 5 rifiutate con 429, circa 8500 chiamate pesate su quell'indirizzo, sotto le
  10 000 pubblicate. Poi il Mac è tornato ai parametri di D18 e continua dal fondo dell'elenco (`--al-contrario`).
  Testo completo sul Mac, in `~/fronda-meteo/DEVIAZIONE-MAC-24-10.txt`.
- **429 sul Mac.** 11 in tutto, tutti «Minutely API request limit exceeded» su quote da 100 coordinate dopo 6–7
  richieste: il peso di 1 per coordinata (D17) è realistico.
- **Cloud.** Per richiesta di Matteo anche qui si scarica la P5, **dall'inizio** dell'elenco e senza `--al-contrario`,
  con i parametri di sempre (`--max-ora 150 --max-giorno 1500 --intervallo 20`): circa 15 richieste da 100 quote al
  giorno. Le due macchine si incontrano a metà; `unisci_meteo.py` unisce come per le altre priorità.

**Correzioni allo script** (`scarica_meteo.py`, nessun effetto sulle richieste né sulle risposte):
- **Attese sull'orologio di sistema.** Le attese usavano `threading.Event.wait`, che si appoggia all'orologio monotono:
  su macOS si ferma quando il Mac dorme. Il 23/10 il processo del Mac è rimasto fermo per ore, due volte, ad attesa
  già scaduta (rimedio usato allora: `kill -TERM` e rilancio). Ora `aspetta()` attende a pezzi di al massimo 60 s e
  ricontrolla `time.time()`: al risveglio l'attesa finisce entro un minuto.
- **Virgole in chiaro nell'URL.** Dal proxy di uscita del cloud una richiesta con le virgole codificate (`%2C`) resta
  appesa finché la connessione cade dopo circa 30 s (`SSLEOFError`); la stessa richiesta con le virgole in chiaro
  risponde in meno di un secondo (provato il 24/10 su quote da 1 e da 100 coordinate, e sul meteo). Per Open-Meteo
  le due forme sono la stessa richiesta. L'URL è salvato solo come annotazione: `unisci_meteo.py` confronta chiave,
  richiesta e risposta, non l'URL. *Interpretazione*: spiega anche gli `SSLEOFError` intermittenti del 22/10.
- `prova_scarica_meteo.py`: 31/31 controlli superati con le due correzioni.

Scritta mentre la P5 è ancora in corso; l'analisi descrittiva non è stata rifatta.

**Aggiornamento del 24/10, sera.** Unito lo zip del Mac con `unisci_meteo.py`: 107 risposte copiate, 896 identiche,
28 diverse (le stesse coppie di D19, solo pioggia), nessuna scartata; `richieste.json` identico sulle due macchine.
P5 a 109 richieste su 353. `valuta.py` rifatto: cambiano solo l'istantanea (108 quote aggiunte, ammesse) e la
descrittiva (15 231 uscite con quota); verdetti, AUC e intervalli identici. La descrittiva parziale non è
rappresentativa per area (vedi README) e non si commenta finché la P5 non è completa. Qui lo scaricamento si era
fermato (nessun processo dopo le 16:11 UTC, probabilmente per un riavvio del contenitore) ed è stato rilanciato con gli
stessi parametri.


## D23. Modello 2.1.0 congelato per la prova; conferma 2026 preregistrata (24/10/2026, **dopo i risultati**)

Decisione di Matteo del 24/10/2026: togliere dall'app lo shock termico (modello 2.2.0) e giudicare il modello nuovo
sul 2026, con `preregistrazione-2026.md` scritta prima della modifica.

- **Copia congelata.** Cambiare `js/model.js` e `js/species.js` farebbe fallire il controllo 1 e cambierebbe i
  punteggi della prova 2023–2025, che va rifatta quando la priorità 5 è completa. Gli otto moduli che la prova usa
  (i sei controllati più `weather-request.js` e `weather-cache.js`, importati da `weather.js`) sono copiati senza
  modifiche in `modello-2.1.0/`. `fattori.mjs` importa da lì e il controllo 1 confronta i file della copia con gli
  stessi SHA-256 preregistrati. **Fatto verificato:** `valuta.py` sulla copia dà un riepilogo identico al
  precedente, salvo i percorsi del controllo 1.
- **SHA-256 del modello 2.2.0** (per il controllo 1 della conferma 2026), registrati il 24/10/2026 sul ramo di
  produzione al commit `adc7ddd1` (unione di #254), prima di scaricare qualunque dato del 2026. Fatto verificato:
  - `js/model.js` `e3bbeb858b83eef410af82f8576b2d2a8bacb7573146b3d0801ddf693577a2be`
  - `js/species.js` `e4b5a0aadbe62f4eb78cb17264e5889519917f62ac63bab6fabf81ddae631ca6`
  - invariati dal 2.1.0: `js/botanical-model.js`, `js/external-observation.js`, `js/weather.js`, `js/weather-data.js`
    (stessi SHA-256 della tabella `HASH_MODULI` di `valuta.py`).
  Se prima della conferma uno di questi file cambia, la modifica va registrata qui con il nuovo SHA-256 e il motivo.

## Che cosa non cambia

Domanda principale, disegno P1, unità, celle, finestre, δ, punteggi (0), (1), (1b), seme del bootstrap, completezza,
dati e periodo. Nessun codice dell'app (`js/model.js`, `js/species.js`, `js/weather.js`) è cambiato.
