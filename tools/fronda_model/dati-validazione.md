# Fronda Italia: dati, probabilità di incontro e validazione

Ricerca verificata il 16 ottobre 2026. Documento di progetto, non risultati di un modello addestrato. Nessun dataset nazionale è stato scaricato o dichiarato disponibile in questa ricerca; sono stati verificati cataloghi, documentazione e condizioni di accesso. Nessuna modifica all'app.

## La decisione che cambia il modello

Il target utile è: **probabilità di osservare almeno un corpo fruttifero appartenente a un insieme dichiarato di specie durante un'uscita con durata, percorso e capacità di osservazione dichiarati**. Non equivale alla probabilità che il micelio viva nel suolo e non misura la crescita in millimetri o la biomassa. Per questi ultimi target servono rilievi ripetuti di individui identificati o campioni quantitativi.

Separare tre processi:

1. **Distribuzione ecologica / presenza di lungo periodo**: ospiti, substrato, suolo, gestione forestale, storia del sito. Un habitat compatibile è una covariata, non una presenza accertata.
2. **Disponibilità dei corpi fruttiferi oggi**: comparsa, persistenza, senescenza e rimozione. Dipende da meteo antecedente, stagionalità e specie. I funghi lignicoli perenni richiedono uno stato differente dagli sporocarpi effimeri.
3. **Rilevamento durante l'uscita**: attraversare effettivamente l'habitat, cercare, vedere, riconoscere, documentare. Dipende da sforzo, esperienza, visibilità e protocollo. Un'uscita senza ritrovamenti è una non-rilevazione, non prova dell'assenza del micelio.

La catena concettuale per una specie s è `P(incontro | uscita) = P(presenza ecologica) × P(corpi fruttiferi disponibili | presenza, meteo, stagione) × P(rilevamento | disponibilità, percorso, sforzo)`, quando le variabili e le condizioni sono definite coerentemente. **Non basta stimare tre punteggi e moltiplicarli**: senza dati separati i fattori non sono identificabili. Nella prima fase si può stimare direttamente l'esito dell'uscita standardizzata e mantenere i fattori come struttura del modello e dei dati. Per la probabilità di almeno una specie del gruppo non sommare le probabilità delle singole specie; usare un esito di gruppo osservato o un modello con dipendenze.

Il principio di non-rilevamento e i modelli a visite ripetute sono formalizzati da [MacKenzie et al., 2002](https://pubs.usgs.gov/publication/5224176). Il trasferimento ai funghi richiede attenzione: fra due visite i corpi fruttiferi possono comparire, sparire o essere raccolti; l'ipotesi di stato chiuso non può essere assunta per settimane. Usare repliche ravvicinate o doppi osservatori su siti sentinella, oppure un modello dinamico con persistenza esplicita.

## Fonti prioritarie verificate

| Fonte primaria | Risoluzione / contenuto verificato | Accesso e licenza | Ruolo e limite |
|---|---|---|---|
| [ERA5-Land, CDS](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land?tab=overview) | Orario, dal 1950, 0,1° (circa 9 km); quattro strati del suolo 0–7, 7–28, 28–100, 100–289 cm | Catalogo con licenza CC BY; accesso CDS da configurare e versione della licenza da registrare nel manifest | Base storica omogenea per temperatura, acqua nel suolo e bilancio idrico. Le celle non misurano il sottobosco del singolo versante. |
| [Open-Meteo Historical Forecast](https://open-meteo.com/en/docs/historical-forecast-api) | Serie ottenuta cucendo le prime ore delle corse; copertura diversa per modello. ICON 2I 2 km indicato dal 13/04/2025 | Documentazione pubblica; dati CC BY 4.0, condizioni del servizio separate | Utile per coerenza delle covariate recenti, **non ricostruisce da sola il meteo previsto a +3/+7 giorni al tempo dell'emissione**. |
| [Open-Meteo Previous Runs](https://open-meteo.com/en/docs/previous-runs-api) e [Single Runs](https://open-meteo.com/en/docs/single-runs-api) | Previous Runs: lead time 1–7 giorni, copertura in prevalenza da gennaio 2024; Single Runs conserva la corsa scelta | [Termini](https://open-meteo.com/en/terms) e [piani](https://open-meteo.com/en/pricing): endpoint gratuito per uso non commerciale; quota e assenza di garanzia di uptime. Distinguere licenza del dato dal diritto d'uso dell'endpoint | Fonte necessaria per un backtest realistico delle previsioni. Verificare ogni combinazione modello/variabile/periodo e salvare le corse da ora. |
| [ECMWF Open Data](https://www.ecmwf.int/en/forecasts/datasets/open-data) | Sottoinsieme IFS/AIFS pubblico; prodotti generalmente a 0,25°, GRIB2, salvo indicazioni specifiche | CC BY 4.0 e termini ECMWF | Ensemble per propagare l'incertezza meteo. Non confondere disponibilità della griglia nativa con risoluzione dell'endpoint pubblico selezionato. |
| [SCIA ISPRA](https://scia.isprambiente.it/), [help griglie](https://www.scia.isprambiente.it/wwwrootscia/help_griglie_giornaliere.html) | Help storico: Tmin/Tmax 5 km, precipitazione 10 km; periodi lì documentati 1981–2013 e 1961–2010 | Il [vecchio help inglese](https://www.scia.isprambiente.it/wwwrootscia/help_griglie_giornaliere_eng.html) riporta divieti di commercializzazione e ridistribuzione. Condizioni attuali da verificare per singolo prodotto/fornitore | Potenziale confronto nazionale e controllo con stazioni. Non dichiarare dataset aggiornato, pronto o liberamente ripubblicabile dalla sola presenza del download. |
| [SoilGrids ISRIC](https://isric.org/explore/soilgrids/), [documentazione accesso](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html) | Mappe a 250 m, sei intervalli di profondità; proprietà e incertezza per pixel | CC BY 4.0; preferire download/VRT/servizi raster a dipendenza per richiesta dall'API complementare | pH, carbonio, tessitura e proprietà idriche come covariate statiche. Sono stime cartografiche: non sensori dell'umidità attuale. |
| [CLMS Forest Type](https://land.copernicus.eu/en/products/high-resolution-layer-forests-and-tree-cover/forest-type-2018-present-raster-10-m-europe-3-yearly), [Dominant Leaf Type](https://land.copernicus.eu/en/products/high-resolution-layer-forests-and-tree-cover?tab=dominant_leaf_type) | 10 m dal riferimento 2018; latifoglie/conifere e copertura forestale | Prodotti Copernicus, citazione e condizioni del prodotto da acquisire con i metadati; accesso CDSE/OData/S3 documentato | Maschera e composizione generale del bosco. NON distingue castagno, faggio, quercia o singole specie di pino: servono carte forestali regionali/ospiti rilevati. |
| [CORINE Land Cover 2018](https://land.copernicus.eu/en/products/corine-land-cover/clc2018) | Raster 100 m o vettori, unità minima 25 ha e larghezza minima 100 m | Catalogo CLMS, metadati/citazione da conservare | Copertura nazionale omogenea e controlli ampi; inadeguato per promettere piccoli castagneti o habitat sul tratto di sentiero. |
| [JRC, Tree species distribution data and maps for Europe, seconda edizione](https://publications.jrc.ec.europa.eu/repository/handle/JRC132444) | Panoramica di mappe di distribuzione, dati inventariali e prodotti modellati | Licenza e formato da verificare sul singolo dataset, non assumere che tutte le mappe abbiano identico significato | Prior per ospiti e lacune. Una probabilità modellata dell'albero non è un albero censito nel punto né una densità fungina. |
| [Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM), [documentazione DEM](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM.html) | GLO-30 è un modello della superficie a 30 m, inclusa vegetazione/infrastrutture | Licenza DEM specifica, non generico CC BY. [Avviso luglio 2026](https://dataspace.copernicus.eu/news/2026-7-17-copernicus-dem-30m-view-service-license-acceptance): condizioni del servizio di visualizzazione cambiate | Quota, esposizione e pendenza, preferendo DTM regionali se disponibili. Non confondere DSM con quota del terreno forestale. Verificare il canale d'accesso effettivo. |
| [GBIF](https://techdocs.gbif.org/en/data-use/), [accordo dati](https://www.gbif.org/terms/data-user) | Occorrenze con data, coordinate, taxon e metadati; alcuni dataset sono eventi di campionamento | Licenza per dataset: CC0/CC BY/CC BY-NC; download con DOI e attribuzioni | Distribuzione e fenologia osservata. Duplicati, errori tassonomici e sforzo disomogeneo da trattare; non generare zeri dalle celle senza record. |
| [iNaturalist: export verso GBIF](https://help.inaturalist.org/en/support/solutions/articles/151000170346) | Occorrenze research grade con licenza riutilizzabile esportate a GBIF | Licenza del dato distinta dalle fotografie; [geoprivacy](https://www.inaturalist.org/pages/geoprivacy) altera la precisione pubblica | Evitare il doppio conteggio iNaturalist+GBIF. Research grade non significa identificazione micologica certificata. Escludere localizzazioni oscurate dalle analisi fini o integrare sul dominio d'incertezza, senza ricostruire i punti privati. |
| [Sistema Informativo Funghi, ISPRA NDM](https://ndm.isprambiente.it/sif/) | Rilievi con contesto ecologico; revisione della nomenclatura con Index Fungorum e habitat EUNIS; distinti dati di campo/archivio, con/senza campione | Mappa e tabella consultabili. La pagina richiede una richiesta motivata a NDM per i dati completi: export/licenza/sforzo/negativi non verificati | Fonte italiana prioritaria per partnership, ecologia e validazione. Consultabile non implica bulk già disponibile o copertura rappresentativa. Nessun contatto inviato. |
| [Carta della Natura ISPRA](https://www.isprambiente.gov.it/it/servizi/sistema-carta-della-natura/cartografia) | Cartografia a scala nazionale, regionale e locale | Accesso pubblico al sistema; date, scale, copertura e condizioni da verificare per layer | Habitat come covariate; non presenze fungine né omogeneità garantita fra carte regionali. |

Il protocollo nazionale da confrontare prima di disegnare le uscite è [ISPRA/SBI, Manuali e linee guida 203/2023](https://www.isprambiente.gov.it/it/pubblicazioni/manuali-e-linee-guida/linee-guida-per-il-censimento-e-il-monitoraggio-dei-macromiceti-in-italia), ISBN 978-88-448-1175-4. Pagina ufficiale verificata; il PDF da 14 MB non è stato letto integralmente in questa sottoricerca, quindi nessuna raccomandazione specifica su numero/frequenza dei transetti viene attribuita al manuale.

## Cosa acquisire prima di addestrare

**Un manifest per sorgente/versione**: URL, DOI, proprietario, licenza precisa e data di verifica, condizioni del servizio, data di acquisizione, checksum, CRS, risoluzione nativa, copertura temporale, unità, valori mancanti, profondità e intervallo di accumulo. Per meteo: modello, versione, corsa/emissione, valid time, lead time, quota della griglia e metodo di estrazione. Per dati biologici: fonte originaria, ID stabile, tassonomia/versione, qualità della determinazione, supporto/voucher, precisione spaziale e temporale.

**Dati grezzi immutabili**, poi tabelle curate riproducibili. Conservare separatamente `observed_at`, `published_at`/`received_at` e `fetched_at`: una segnalazione di ieri caricata domani non era una covariata disponibile nella previsione di oggi. Dati del taccuino privati possono entrare solo secondo il consenso già previsto dal prodotto; non considerarli dati aperti.

**Orario di inizializzazione non uguale a disponibilità**: la [documentazione Single Runs](https://open-meteo.com/en/docs/single-runs-api) distingue la corsa inizializzata alle 00 UTC dalla pubblicazione dopo il calcolo. Un backtest alle 01 UTC non può usare automaticamente quella corsa. Inoltre il catalogo indica per il periodo iniziale IFS hindcast del ciclo 49R1: identificare i dati ricalcolati a posteriori e separarli dall'archivio delle corse operative effettivamente distribuite. Un hindcast è utile, ma non dimostra che il modello sarebbe stato disponibile in quella data storica.

**Controlli biologici**: solo eventi terrestri plausibili in Italia, date valide, coordinate compatibili e incertezza nota; distinguere osservazioni recenti da esemplari storici e segnalazioni con sola località amministrativa. Normalizzare sinonimi, preservare nome originale e mapping. Complessi come Boletus edulis s.l., Cantharellus e Morchella non vanno separati oltre il supporto della determinazione. Deduplicare su occurrenceID/ID originario e, quando manca, su fonte-osservatore-data-luogo-taxon con revisione dei casi ambigui. Le ripetizioni vere del protocollo non sono duplicati.

**Controlli geospaziali**: calcolare covariate sulla porzione effettivamente campionata del percorso; per presenze a precisione grossolana usare aggregati/integrazione sul buffer di incertezza oppure escludere dal modello fine. Una UI da 250 m non trasforma pioggia da 9 km in misura da 250 m. Conservare per ogni risultato risoluzione meteo, risoluzione habitat e supporto biologico separati.

## Il dataset che manca: uscite anche senza successo

Tabella `survey_event`: ID evento, osservatore pseudonimo, inizio/fine, fuso orario, percorso/area cercata, minuti di ricerca attiva, distanza, numero osservatori, protocollo, gruppo di taxa cercato, lista completa sì/no, esperienza su scala dichiarata, habitat/ospiti verificati, visibilità/lettiera, eventuali interruzioni, consenso. GPS facoltativo con qualità esplicita; non pubblicare tracce private per addestrare il modello.

Tabella `survey_observation`: ID evento, taxon o gruppo, numero o classe di quantità coerente, presenza/non-rilevazione, identificazione e livello di certezza, foto/voucher eventuale, substrato, fase dei corpi fruttiferi, modalità osservata/raccolta. La quantità non va usata come biomassa senza metodo e unità. In mancanza di identificazione, il gruppo o il genere è un dato migliore di una specie inventata.

Gli zeri si generano **solo per taxa nel campo di ricerca dell'evento completo**. `Nessuna uscita`, `uscita non registrata`, `ricerca incompleta`, `specie non cercata` e `nessun ritrovamento dopo ricerca completa` sono stati diversi. Una semplice passeggiata senza osservazioni caricate non crea assenze. Anche i tentativi falliti devono poter essere inseriti con poco attrito nel Taccuino, senza premiare solo i ritrovamenti.

Disegno proposto: pannello sentinella stratificato per grandi ambiti climatici, fasce di quota, foreste ospiti e isole; siti scelti anche fuori dai luoghi già popolari; visite ripetute lungo la stagione e repliche di osservazione su un sottoinsieme. Tenere un pannello di test prospettico fuori dall'addestramento. Fare simulazioni di potenza/precisione prima di fissare il numero di siti e uscite; molti record dello stesso osservatore nello stesso bosco non equivalgono ad altrettante osservazioni indipendenti.

Dati occasionali e uscite standardizzate possono convivere in un modello integrato con processi di osservazione diversi; non unirli in una tabella binaria fingendo lo stesso protocollo. Il [manuale GBIF per survey ed eventi](https://docs.gbif.org/guide-publishing-survey-data/en/) documenta sforzo, campo tassonomico e condizioni per inferire mancate rilevazioni. La scelta del background cambia i modelli presence-only, come mostrano [Phillips et al., 2009](https://doi.org/10.1890/07-2153.1); background o pseudo-assenze non sono uscite negative osservate.

## Modello incrementale eseguibile

1. **Fotografare Fronda attuale**: versione del modello, input, specie, regole e output congelati. Definire un benchmark di ordinamento delle uscite e lasciare l'indice attuale etichettato come sperimentale.
2. **Mappa ecologica**: modelli di idoneità per specie/gruppo con ospiti, terreno, quota, substrato e stagionalità; presenze opportunistiche con modello esplicito del campionamento, thinning o target-group background come sensibilità. Output relativo, non percentuale di incontro.
3. **Modello evento semplice**: GAM/GLMM o modello bayesiano gerarchico per l'esito di uscite standardizzate, con smooth stagionale, effetti per specie/ecoregione e osservatore, meteo con ritardi regolarizzati. Le finestre antecedenti sono iperparametri da selezionare nei soli fold di training: nessun universale “dopo X mm e Y giorni”.
4. **Stato dinamico e detectability**: introdurre disponibilità/persistenza dei corpi fruttiferi e componente di rilevamento quando repliche e dati ne permettono l'identificazione. Conteggi eventualmente con hurdle/negative binomial ed esposizione allo sforzo, dopo controllo del protocollo.
5. **Previsione**: eseguire il modello sulle corse/ensemble disponibili all'emissione, integrare l'incertezza delle covariate e dei parametri. Giorno 0, +1, +3 e +7 hanno valutazioni separate. Non fornire +7 se il modello meteo scelto non ha quell'orizzonte; un altro modello va dichiarato e validato.
6. **Output**: probabilità di incontro per evento standard dichiarato, intervallo d'incertezza, ambito geografico/tassonomico validato, stato dei dati e motivi principali. Fuori dominio: “dati insufficienti”, non 0%. Un'indicazione ecologica può restare disponibile come tale.

Per il percorso non usare la media delle percentuali delle celle come probabilità di trovare almeno un fungo. Un modello puntuale può integrare un'intensità di disponibilità e rilevamento sul tratto cercato, con dipendenze spaziali e sforzo; il modello evento diretto evita inizialmente di fingere indipendenza fra celle contigue.

## Validazione che autorizza la parola probabilità

Il disegno dei test deve riflettere il caso d'uso di trasferimento: [Roberts et al., 2017](https://doi.org/10.1111/ecog.02881) descrive la necessità di split che rispettino le dipendenze. Proposta operativa:

- **Backtest temporale rolling origin**: addestramento su anni/stagioni precedenti, previsione sulla successiva; nessun meteo futuro osservato come sostituto della previsione emessa. Archivi di corse per valutare l'intera catena operativa. Conservare anche un esperimento con meteo osservato per quantificare quanto errore arriva dal meteo, ma etichettarlo separatamente.
- **Blocchi geografici**: fold per ecoregione/bacino/cluster di siti, con buffer scelto sulla scala di autocorrelazione dei dati; non fissare arbitrariamente pochi chilometri. Tutte le visite e i punti dello stesso sito/percorso nel fold appropriato. Un test geografico tenuto fuori misura il trasferimento in aree nuove.
- **Osservatori**: test separato su osservatori mai visti, oltre a quello su utenti già noti; bootstrap per cluster sito/osservatore/stagione. Duplicati e fotografie dello stesso ritrovamento restano nello stesso split.
- **Nested training**: preprocessing, selezione dei ritardi, iperparametri, imputazione e calibrazione avvengono dentro il training. Calibration set e test sono distinti, o si usa cross-fitting. Mai calibrare sulle uscite del test.
- **Test prospettico congelato**: previsioni timestampate prima delle uscite, con esiti raccolti indipendentemente, anche nei periodi sfavorevoli. Il modello non deve imparare solo da chi esce perché l'app ha già suggerito un posto.

Metriche per ogni specie/gruppo, area, stagione e lead time con campione e intervalli:

| Domanda | Metrica |
|---|---|
| Le percentuali corrispondono alle frequenze? | Brier score e log loss; curve di affidabilità con intervalli, intercept/slope di calibrazione. Un solo ECE aggregato non basta. |
| Ordina meglio le uscite? | PR-AUC con prevalenza esplicitata, ROC-AUC secondaria, precisione delle prime k proposte e tasso di uscite riuscite a sforzo comparabile. |
| Migliora l'attuale Fronda? | Stessi eventi e split: confronto con indice congelato per ranking; eventuale trasformazione del suo score in probabilità stimata solo nel training. |
| Migliora un'alternativa banale? | Climatologia stagionale per area, habitat+calendario, ultimo dato disponibile/persistenza. Brier skill score relativo a baseline dichiarata. |
| Le quantità hanno senso? | MAE/deviance per protocollo e unità, controllo sovradispersione e calibrazione dei quantili; non mescolare numero, peso e cestini. |
| L'incertezza è credibile? | Copertura e ampiezza degli intervalli predittivi per conteggi; incertezza dei bin di calibrazione per esiti binari. Non verificare l'intervallo di probabilità contro un singolo 0/1. |
| Il servizio funziona realmente? | Disponibilità del dato, latenza, quota di astensione, input mancanti, previsione oltre validità e cambio di provider/versione. |

**Gate di rilascio proposti, da preregistrare prima del test**:

1. Licenze/provenienza risolte e lineage riproducibile; nessuna feature disponibile dopo l'emissione e nessun leakage fra fold.
2. Sforzo e campo tassonomico sufficienti per interpretare gli zeri; nessuna conversione automatica dei buchi di GBIF in assenze.
3. Miglioramento su baseline stagionale e Fronda congelata con intervallo per cluster, su test temporale e geografico; nessuna percentuale di miglioramento promessa in anticipo. Se l'intervallo non distingue il miglioramento da zero, esito non dimostrato.
4. Calibrazione con precisione utile all'utente nei gruppi che si intende mostrare; una tolleranza operativa (per esempio errore di calibrazione entro 10 punti percentuali in fasce ampie) è una scelta di prodotto da dichiarare, non una legge micologica. Il campione richiesto deriva dall'intervallo desiderato e dalla dipendenza dei dati.
5. Verifica prospettica sul dominio dichiarato. Dove gli intervalli restano troppo ampi o il dominio manca, mostrare idoneità sperimentale o astensione; non generalizzare la validazione di una regione a tutta Italia.
6. Monitoraggio di calibrazione e drift per stagione, ecoregione, modello meteo e gruppo tassonomico; nuova versione e nuova valutazione quando cambiano protocollo, feature o provider.

## Consegne concrete del primo ciclo

- `sources_manifest` con stato `verified_catalog`, `access_pending`, `downloaded`, `quality_checked`; non segnare downloaded finché il file non esiste ed è controllato.
- Schema e modulo eventi con non-rilevazioni, scope e sforzo; export riproducibile per analisi e campionamento prospettico.
- Pipeline iniziale su 2–3 domini pilota contrastanti, con carta di copertura dei dati e lacune, senza dichiararla già nazionale.
- Dataset congelato, baseline, split versionati, script di training e report di calibrazione; notebook o workflow rieseguibile quando i dati sono acquisiti.
- Modello v2 inizialmente in shadow mode: conserva previsioni/esiti, permette confronto con Fronda, promuove percentuali solo nei domini che superano i gate.

La risorsa decisiva non è aggiungere coefficienti al punteggio attuale: è ottenere un campione di uscite con esiti positivi e negativi, un protocollo interpretabile e previsioni archiviate al momento dell'emissione. Questo permette di misurare il miglioramento invece di dichiararlo.
