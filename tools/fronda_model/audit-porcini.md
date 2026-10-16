# Accesso e audit dello studio sui porcini — 16 ottobre 2026

## Esito

Accesso ottenuto al **testo integrale autoriale e al supplemento Table S1** della versione estesa di *Predicting porcini* (Brejon Lamartinière e Hoffman, bioRxiv v2, 8 giugno 2026), tramite copia pubblica caricata dall'autore il 9 giugno 2026. Sono stati letti anche codice R e CSV locali del repository degli autori. Nessun codice R eseguito, nessun download meteo avviato, nessun file del repository Fronda modificato, nessun CSV o codice degli autori redistribuito.

Il nuovo riferimento archivistico corretto è **[Zenodo 20591123 — Expansion of analysis](https://zenodo.org/records/20591123)**, corrispondente a **[GitHub release V1.2](https://github.com/ebrejonl/Boletus_fruiting_triggers/releases/tag/V1.2)**. I record 17881340 e 17881359 sono depositi iniziali del dicembre 2025 e non descrivono da soli la versione estesa di giugno 2026.

Il dataset è utile per un **benchmark estero esplorativo della relazione meteo–conteggi registrati**, con importanti limiti di osservazione e riproducibilità. Non fornisce una calibrazione italiana della probabilità di incontro durante una ricerca.

## Fonti e stato dell'accesso

| Risorsa | Verifica e contenuto |
|---|---|
| [bioRxiv v2](https://www.biorxiv.org/content/10.64898/2025.12.12.693895v2) | Metadati, abstract, data e licenza CC BY-NC 4.0 verificati attraverso l'indice web. La lettura diretta di full/PDF ha restituito 403/non accessibile. |
| [Copia pubblica autoriale su ResearchGate](https://www.researchgate.net/publication/398679307_Predicting_porcini_a_decade_of_sporocarp_monitoring_reveals_the_meteorological_triggers_of_Boletus_edulis_fruiting_in_central_European_beech_forests) | Testo integrale e Table S1 effettivamente consultati. La pagina indica caricamento da Etienne Brejon Lamartinière il 9 giugno 2026 e CC BY-NC 4.0. Nessun aggiramento di paywall; PDF binario non scaricato. |
| [Pubblicazioni del laboratorio](https://thehoffmanlab.com/publications/) | La voce 188 indica ancora “in press”, *Fungal Ecology*. Non fornisce DOI della versione finale. |
| [Record istituzionale Bielefeld](https://pub.uni-bielefeld.de/record/3012537) | Indicizzato come preprint; accesso diretto bloccato da protezione Anubis. Non è stato aggirato. |
| [Zenodo 17881340](https://zenodo.org/records/17881340) | 10 dicembre 2025, software v1.0.0, ZIP 4,5 kB. Vecchia release. |
| [Zenodo 17881359](https://zenodo.org/records/17881359) | 10 dicembre 2025, dataset v2, `Data_ready.csv`, 99,9 kB. Segnala versione successiva. È distinto dal CSV esteso attuale. |
| [Zenodo 20591123](https://zenodo.org/records/20591123) | 8 giugno 2026, V1.2, software, archivio `ebrejonl/Boletus_fruiting_triggers-V1.2.zip`, 712,9 kB; MD5 riportato `a5299db56022af2620635a36274e811f`. Linkato dallo studio. Lettura pagina intermittente; API/export non accessibili nella sessione. |
| [Repository GitHub](https://github.com/ebrejonl/Boletus_fruiting_triggers) | Locale in `checkout temporaneo degli autori`; main e V1.2 puntano a `7967c6d1ed61ac9cce802bdd7ba08d7d8df59064`. Confermato con `git ls-remote`; altro tag disponibile `v1.0.0`. Non risultano tag/branch successivi nel repository verificato. |

Stato editoriale da usare: **“preprint v2 disponibile; gli autori lo indicano in stampa su Fungal Ecology; versione finale e suo DOI non verificati”**. Non affermare che il lavoro non sia mai stato revisionato, né presentare il preprint come versione finale. Ricerca mirata per titolo, autori e *Fungal Ecology* non ha identificato un record editoriale finale aggiornato; l'assenza nei risultati non prova che non esista.

### Licenze: documento diverso da dataset e software

- Testo autoriale/preprint: CC BY-NC 4.0 verificata; linkare l'originale con attribuzione, senza riversare articolo o supplemento nel prodotto.
- **Codice e CSV GitHub attuali: licenza specifica non verificata.** L'albero Git verificato contiene `.gitignore`, `Code_clean_Jun8.R`, `Data/Environmental_fruiting_data_jun8.csv`; nessun LICENSE, CITATION o `.zenodo.json`.
- Le pagine Zenodo estratte mostrano la sezione Rights/License senza un valore leggibile per questi record. Il default generale di Zenodo non è una verifica della licenza del singolo deposito. Non attribuire CC BY a CSV/R per deduzione.
- Non copiare dati o script nel repository Fronda o in un allegato pubblico finché la licenza del deposito/versione specifica non sia verificata o sia stata ottenuta autorizzazione degli autori. Analisi aggregata e implementazione originale delle idee statistiche sono distinte dalla redistribuzione del materiale.

[Policy ufficiale Zenodo](https://about.zenodo.org/policies/) e [FAQ sui permessi](https://support.zenodo.org/help/en-gb/2-content/21-can-i-get-permission-to-use-a-specific-record) confermano che il riuso dipende dalla licenza del record, non dal semplice accesso aperto. Nessun autore è stato contattato in questa attività.

## Contenuto dello studio: sintesi strettamente applicabile

Il lavoro riguarda B. edulis in boschi prevalentemente di faggio presso Bielefeld, Germania, 2015–2024. I siti attivi venivano visitati 2–4 volte a settimana; il loro numero è cresciuto da 15 a 29. Il meteo è E-OBS a 0,1°, interpolato sulla stessa area. Il disegno riguarda conteggi registrati, non uscite di cercatori con sforzo standardizzato.

Il modello principale seleziona finestre di 20 giorni per temperatura e 26 per precipitazione. Table S1 precisa un massimo termico del modello aggregato a 13,70482 °C, coerente con 13,7 °C della figura; “circa 13 °C” è un'approssimazione. Per il sito A la finestra di precipitazione migliore è 32 giorni; per B 26. Queste sono stime locali e selezione AIC interna, non validazione in Italia. [Testo e supplemento autoriali](https://www.researchgate.net/publication/398679307_Predicting_porcini_a_decade_of_sporocarp_monitoring_reveals_the_meteorological_triggers_of_Boletus_edulis_fruiting_in_central_European_beech_forests).

## Audit indipendente del CSV locale

File degli autori: `Data/Environmental_fruiting_data_jun8.csv` (non incluso).

SHA-256: `63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c`.

Calcoli effettuati con Python standard library, senza fitting o esecuzione di codice R.

### Schema e granularità verificati

- **3660 righe, 32 colonne, 1220 date uniche**.
- Tre etichette `site`: `All`, `Site_A`, `Site_B`, ciascuna con 1220 righe = 122 giorni × 10 anni.
- Ogni anno comprende **1 agosto–30 novembre**. Chiave `(site,date)` unica; `Date` e `date` duplicate ma coerenti; nessuna cella vuota/NA nel CSV letto.
- Colonne: `Temp`, `Precip`, `Date`, `date`, `year`; 12 coppie di medie mobili `rollT_w`,`rollP_w` per w=2,5,8,11,14,17,20,23,26,29,32,35; `Mnb`, `month`, `site`.
- Stessa data: tutte le colonne ambientali, le finestre e i metadati temporali sono **identici nei tre blocchi**.

| Blocco | Righe | Giorni Mnb>0 | Giorni Mnb=0 | Totale Mnb | Massimo giornaliero |
|---|---:|---:|---:|---:|---:|
| All | 1220 | 155 | 1065 | 1905 | 78 |
| Site_A | 1220 | 61 | 1159 | 545 | 48 |
| Site_B | 1220 | 67 | 1153 | 283 | 25 |

`All` contiene i due sottoinsiemi A/B. Verificato per ogni data: `All ≥ A+B`; il residuo totale è 1077 carpofori registrati. Non trattare `All`, A e B come tre siti indipendenti da concatenare in train/test. Non contare 3660 prove indipendenti, né sommare i totali dei tre blocchi.

I conteggi aggregati annuali All sono 146, 4, 134, 30, 180, 354, 296, 219, 276, 266 dal 2015 al 2024. Forte variabilità fra anni e 10 sole stagioni: un bootstrap per singola riga renderebbe l'incertezza troppo ottimistica.

### Zeri: significato reale e intervallo da riconciliare

Il [codice degli autori, righe 78–94](https://github.com/ebrejonl/Boletus_fruiting_triggers/blob/7967c6d1ed61ac9cce802bdd7ba08d7d8df59064/Code_clean_Jun8.R#L78) costruisce un conteggio degli eventi registrati per data, fa left join sul calendario meteo e sostituisce gli NA dei conteggi con 0. Nel CSV non esistono `visited`, durata, osservatore, sito attivo, area perlustrata, completezza di checklist o data dell'ultima visita.

**Conclusione dell'audit:** `Mnb=0` significa nessun evento nel calendario dei record, non visita quotidiana documentata senza ritrovamento. Non è consentito convertirlo automaticamente in “cercato e non trovato”. I dati non distinguono giornate non visitate, assenza dopo visita e periodi fuori monitoraggio effettivo. Frequenza di campionamento dichiarata intensiva non equivale a un registro completo dello sforzo.

Differenza verificata tra calendario dati/codice e testo:

- CSV/codice: 122 giorni/anno, 1 agosto–30 novembre; zero All 1065/1220 = **87,2951%**.
- Ritaglio 5 agosto–21 novembre, intervallo dei metodi: 109 giorni/anno, 1090 righe All; zero 935/1090 = **85,7798%**.
- Tutti i 130 giorni All fuori quel ritaglio sono zero. Il secondo rapporto riproduce l'85,8% del testo; il primo no.

Questo riscontro non dimostra quale insieme sia entrato nel fitting finale: è una discrepanza di riproducibilità da chiarire, non un'accusa d'errore biologico. Per un benchmark pubblicare esplicitamente entrambe le definizioni come sensibilità e non dichiarare replica esatta degli AIC finché non siano riconciliati.

### Medie mobili: il giorno target è incluso

Nel [codice righe 69–74](https://github.com/ebrejonl/Boletus_fruiting_triggers/blob/7967c6d1ed61ac9cce802bdd7ba08d7d8df59064/Code_clean_Jun8.R#L69), `rollmean(..., align='right')` viene applicata direttamente senza lag. Pertanto una finestra w al giorno d è:

`mean(x[d-w+1], ..., x[d])`

e non `mean(x[d-w], ..., x[d-1])`.

Verifica numerica indipendente su finestre completamente ricostruibili all'interno di ogni stagione:

| Feature | Errore massimo usando giorno target incluso | Errore medio assoluto usando solo giorni precedenti |
|---|---:|---:|
| rollT_2 | 5,33×10⁻¹⁴ °C | 1,253 °C |
| rollT_20 | 5,33×10⁻¹⁴ °C | 0,2033 °C |
| rollP_26 | 5,77×10⁻¹⁵ mm/giorno | 0,1362 mm/giorno |

Un forecast operativo emesso prima della giornata non può usare T/precipitazione giornaliera effettivamente realizzata nello stesso giorno. Serve spostare le finestre a d−1 oppure usare il vintage di previsione meteorologica disponibile al momento. Entrambe le scelte cambiano il task rispetto al fitting contemporaneo dello studio. Non chiamare una replica con meteo realizzato “previsione prospettica”.

Il CSV include le medie già calcolate per inizio agosto ma manca il meteo grezzo di luglio: non si possono ricostruire integralmente dall'archivio i primi 19 valori/anno della media T20 e i primi 25 della P26. Per audit esatto chiedere anche serie giornaliera continua e versione di E-OBS.

Minuscoli valori negativi nelle medie di precipitazione (fino a circa −3×10⁻¹⁵) sono coerenti con errore di arrotondamento della media mobile; la precipitazione giornaliera raw è non negativa. Un ingest può normalizzare a zero solo con tolleranza dichiarata e conservando il raw, senza confonderli con misure negative reali.

## Audit del codice statistico

File degli autori: `Code_clean_Jun8.R` (non incluso).

SHA-256: `d71755e659194d93b396ace6c9c98a1093014241aa4b02ec2b4d7ae790ba300b`.

### Formula effettiva e unità

[Righe 105–112 e 245–253](https://github.com/ebrejonl/Boletus_fruiting_triggers/blob/7967c6d1ed61ac9cce802bdd7ba08d7d8df59064/Code_clean_Jun8.R#L105): modello binomiale negativo NB1, `Mnb ~ rP + T + T² + (1|year)`, separatamente per All/A/B. La [documentazione ufficiale glmmTMB](https://glmmtmb.github.io/glmmTMB/reference/nbinom2.html) conferma che `nbinom1()` usa link log per default e varianza μ(1+φ).

Quindi:

`log(μ[d]) = α + βP · Pmean26[d] + βT · Tmean20[d] + βT2 · Tmean20[d]² + u_year`

- `rP` è **media mm/giorno** della finestra, non somma mm. A lunghezza fissa sono equivalenti dopo una riscalatura del coefficiente; non lo sono usando lo stesso coefficiente. Per sostituire media con cumulata su 26 giorni occorre dividere βP per 26.
- “Effetto lineare della pioggia” riguarda il predittore logaritmico: sulla media dei conteggi `μ` l'effetto è moltiplicativo/esponenziale. Non copiare la frase come se il codice fosse una regressione lineare sulla quantità osservata.
- La curva T è quadratica sul log della media, non la curva gaussiana con ampiezza 3,5 °C del modello Fronda attuale. Una trasformazione per idoneità relativa non trasferisce intercetta, dispersione, detection o dominio italiano.
- La funzione `fit_best` usa 20/26 per tutti i blocchi, anche se il minimo AIC di Site_A è 20/32. Distinguere esplorazione per sito e curva comparativa a finestra comune.
- `windows` ha 12 valori: **144 combinazioni per blocco**, 432 fit se tutti eseguiti. Il commento “All 64 combinations” è obsoleto.
- Il codice non include interazione T×P, suolo, shock termico, trigger 8 mm, gelo/caldo, host/substrato, quota, visite/sforzo o offset d'area. Non presentare queste componenti Fronda come coefficienti forniti da questo studio.
- `(1|year)` è intercetta casuale per anno, non correzione completa dell'autocorrelazione temporale entro stagione. La selezione di finestre su tutti gli anni e poi la valutazione sugli stessi anni non è validazione esterna.

### Riproducibilità pratica

- Lo script inizia leggendo `Data/Note_data_no_env_Nov21.csv` e poi `Data/Climate.csv`, **assenti nel checkout distribuito**. Non legge direttamente il CSV esteso disponibile. Per eseguire downstream sul CSV serve un adattamento esplicito, originale, documentato; non si può dichiarare esecuzione senza interventi.
- Il file chiama `renv::status()` ma non distribuisce lockfile delle dipendenze. I pacchetti richiesti sono numerosi; mancano manifest di ambiente e dataset version metadata.
- Scrive figure in `Figures/`, directory assente; alcune densità usano jitter senza seed esplicito; parallelismo fissato a 20 core. Questi aspetti influenzano portabilità/riproducibilità grafica.
- I controlli di convergenza assegnano `converged=TRUE` quando il fit non genera un errore; non verificano in modo completo Hessiana/convergence code o warning. Un nuovo benchmark deve distinguere fit non convergenti e parametri incerti.
- Il supplemento riporta coefficienti e AIC arrotondati, ma non è un artefatto fitted completo con intercetta/dispersione/varianza casuale sufficienti per distribuire previsioni verificabili di conteggi.

## Benchmark utilizzabile senza confonderlo con una calibrazione italiana

1. **Target iniziale onesto:** prevedere conteggi/eventi registrati nel calendario tedesco oppure un indicatore `Mnb>0`, con etichetta esplicita `recorded_sighting_day`. Non chiamarlo `survey_not_detected` né probabilità per 60 minuti di ricerca.
2. **Una rappresentazione per analisi:** All come endpoint aggregato; A e B come analisi separate di sensibilità. Vietato addestrare All e validare su A/B della stessa data. Non simulare un test geografico con siti che condividono lo stesso meteo e sono inclusi nel totale.
3. **Temporalità:** split per stagioni intere. Per forecast reale, training anni passati e test anno successivo; scelta finestre/regularizzazione dentro training. Un leave-one-year-out bidirezionale valuta generalizzazione fra stagioni, non necessariamente forecasting in avanti.
4. **Due analisi dichiarate:** replica associativa con feature inclusive originali; previsione con feature terminate al giorno precedente e cutoff di emissione. Non confrontare i punteggi delle due come se ricevessero la stessa informazione.
5. **Zero sensitivity:** report sia 1 agosto–30 novembre sia 5 agosto–21 novembre. In assenza di visit logs evitare modelli occupancy/detection; valutare il target di registrazione e riconoscere il campionamento.
6. **Baseline:** tasso/conteggio medio del solo training, calendario stagionale, modello T/P semplice, poi flessibilità aggiuntiva. Confronto su stessi fold e stessa informazione disponibile; nessun tune del test.
7. **Metriche:** per conteggi log predictive density/deviance e MAE; per `Mnb>0`, Brier/log loss/calibrazione e PR-AUC con prevalenza dichiarata. Incertezza cluster per anno, con limiti delle 10 stagioni. Non scegliere una soglia dai dati test e chiamarla accuratezza.
8. **Nuovo anno:** per un random effect non osservato dichiarare predizione marginale/condizionale e integrazione dell'incertezza; non usare l'effetto stimato dell'anno test dai suoi conteggi.
9. **Italia:** solo dopo protocollo prospettico multi-sito con effort, checklist cercata e nondetection esplicite, identificazioni verificate, meteo disponibile as-of, e test per regione/stagione/osservatore. La prova tedesca può supportare prior e feature candidate; non certifica trasferibilità, probabilità di incontro o crescita nazionale.

Una probabilità `P(Mnb>0)` derivata correttamente da NB1 richiede μ e dispersione φ: `P(0)=(1+φ)^(-μ/φ)`, condizionatamente al random effect. Non usare automaticamente `1−exp(−μ)` (formula Poisson). E anche la probabilità NB1 resta quella del conteggio registrato secondo quel disegno; non diventa encounter di un cercatore né presenza del micelio.

## Passi concreti rimasti

- Verificare metadata Rights della versione Zenodo 20591123 e corrispondenza dell'archivio alla licenza; se assenti, predisporre una richiesta agli autori. L'invio richiede istruzione esplicita dell'utente, non è stato effettuato.
- Richiedere/ottenere registro visite e siti attivi, regola di attribuzione degli avvistamenti ai giorni, eventuale gestione dei carpofori già registrati, serie meteo continua con versione E-OBS e fitted artefact completo. Senza questi campi un miglioramento del fit non dimostra migliore previsione biologica.
- Ottenere la versione finale *Fungal Ecology* appena il record editoriale è verificabile, confrontare metodi e supplementi con v2 prima di aggiornare parametri o fonti canoniche.
- Il materiale già accessibile basta per costruire un adapter e un audit locale sperimentale, mantenendo esclusi raw CSV/R da pubblicazione e mantenendo invariati indice/UI Fronda fino a validazione.

## Comandi di sola lettura eseguiti

```bash
git -C /tmp/fronda-boletus ls-tree -r HEAD
git -C /tmp/fronda-boletus ls-remote --tags origin
git -C /tmp/fronda-boletus ls-remote --heads origin
sha256sum /tmp/fronda-boletus/Code_clean_Jun8.R /tmp/fronda-boletus/Data/Environmental_fruiting_data_jun8.csv
```

Script Python in stdin: schema, unicità, conteggi/zeri, sottoinsiemi All≥A+B, uguaglianza del meteo, confronto rolling inclusivo/esclusivo e sensibilità dell'intervallo stagionale. Nessun modello addestrato e nessun risultato di performance biologica dichiarato.
