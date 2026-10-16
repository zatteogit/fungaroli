# Fronda Italia modello di previsione dei funghi

16 ottobre 2026. Base applicativa esaminata: `68e2b1c`, modello pubblico `2.0.0`.
Prototipo consegnato: `3.0.0-research`, eseguibile offline e separato dal sito.

Gli accessi approfonditi a testi integrali, supplementi e risorse riproducibili
sono raccolti in [accesso-studi.md](accesso-studi.md). Il registro distingue
lettura del paper, disponibilità dei dati e licenza del materiale.

Il [confronto delle 31 fonti inviate](confronto-fonti-utente.md) aggiunge due
omissioni prioritarie: Ambrosio 2024 sui boschi liguri e Qi 2025 su ospiti,
suolo e distribuzioni europee. Rafforzano il livello statico dell'habitat e
la previsione in luoghi nuovi; non forniscono percentuali giornaliere italiane.

## Si può prevedere in un luogo senza storico locale

Sì. Un bosco nuovo può ricevere una stima attraverso dati raccolti in boschi simili,
confrontando ospiti, clima, suolo, quota, stagione e condizioni recenti. La previsione
non richiede anni di osservazioni in ogni singolo punto. I dati locali migliorano e
correggono una stima trasferita; non sono una condizione necessaria per iniziare.

Un modello gerarchico può condividere informazione tra specie e regioni, con effetti
specifici dove esistono dati. In alternativa, relazioni pubblicate e pareri esperti
possono informare un modello iniziale con incertezza esplicita. La qualità dipende
da quanto il luogo nuovo assomiglia ai domini studiati. Una faggeta tedesca non basta
a rappresentare automaticamente una lecceta sarda. Questo è il significato pratico
della trasferibilità, non un divieto di fare previsioni fuori dai siti campionati.

Anche una probabilità preliminare è possibile. La verifica serve a stabilire quanto
le percentuali corrispondano alle frequenze reali e a correggerle. La calibrazione
può essere regionale o basata su ambienti comparabili; non occorre ripeterla in
ogni particella. Per affermare un miglioramento quantificato rispetto a Fronda
servono però confronti su esiti indipendenti. Il prototipo consente il trasferimento
a siti nuovi entro il dominio delle covariate apprese, mantenendo l'etichetta di ricerca.

## Quale presenza stiamo prevedendo

Per un fungo esistono almeno tre eventi differenti:

| Evento | Dati che aiutano a stimarlo | Significato dell'esito negativo |
|---|---|---|
| Presenza ecologica del taxon/micelio | Ospiti, suolo, distribuzione, storia del sito | Un mancato ritrovamento non ne dimostra l'assenza |
| Corpi fruttiferi presenti in quel periodo | Monitoraggio, meteo antecedente, stagione, comparsa e persistenza | Assenza di corpi fruttiferi nel supporto campionato |
| Almeno un ritrovamento durante un'uscita | Corpi fruttiferi disponibili, percorso, durata, osservatori e capacità di rilevamento | Non-rilevazione durante quella ricerca |

Fronda deve aiutare a scegliere **dove e quando cercare corpi fruttiferi**. Per
«crescita» qui si intende la loro comparsa e disponibilità, non l'accrescimento in
millimetri al giorno, il peso del raccolto o l'espansione del micelio. Per questi
altri obiettivi occorrono misure specifiche.

La catena concettuale è:

`P(ritrovamento) = P(presenza ecologica) × P(fruttificazione disponibile | presenza) × P(rilevamento | disponibilità, uscita)`.

È una scomposizione condizionale: le condizioni ambientali e l'uscita sono implicite
in ogni termine. I tre numeri non possono essere ricavati da tre punteggi arbitrari.
Con soli esiti di passeggiate, i fattori possono essere non identificabili: il primo
modello eseguibile stima quindi direttamente `P(almeno un rilevamento | specie,
ambiente, meteo, stagione, protocollo, durata, osservatori)`.

Il principio delle visite ripetute e della rilevabilità imperfetta viene da
[MacKenzie et al. 2002](https://pubs.usgs.gov/publication/5224176). Per carpofori
effimeri va verificata la persistenza fra visite: non si assume uno stato chiuso
per settimane. La probabilità di trovare almeno una fra diverse specie richiede
un esito di gruppo o dipendenze esplicite; sommare percentuali o assumere indipendenza
fra celle contigue produrrebbe risultati fuorvianti.

## Che cosa cambia rispetto a Fronda attuale

La base esistente è già prudente nel chiamare il numero un indice sperimentale.
Il limite è la struttura: moltiplica fattori con diverse soglie e optima fissati
a mano. La letteratura non giustifica una sola curva per ogni specie e per tutta
l'Italia. Il confronto completo del codice è in [audit-fronda.md](audit-fronda.md).

| Fronda 2 | Nuova direzione | Stato concreto della consegna |
|---|---|---|
| Prodotto fisso di fattori | Relazioni apprese e regolarizzate | Baseline logistica addestrabile, senza pesi biologici inventati |
| Pioggia sempre favorevole fino alla saturazione | Memoria idrica, domanda evaporativa, interazioni e possibili effetti non lineari | Finestre disgiunte e P−ET₀, temperatura quadratica e interazioni implementate |
| Optimum termico impostato per specie | Risposta specifica da dati e pooling dove supportato | Training separato per taxon; gerarchia nazionale progettata, non ancora implementata |
| Fascia migliore di una zona | Supporto ambientale e percorso effettivamente cercato | Contratto evento/sito; nessuna nuova mappa di precisione simulata |
| Indice 0–10 | Probabilità di un esito definito con sforzo | Stima interna disponibile per artefatti addestrati; percentuale pubblica `null` nel prototipo |
| Confronti esplorativi del Taccuino | Training, calibrazione e test distinti | Split espliciti, blocchi/siti separati e controllo temporale |
| Input mancanti segnalati, controlli migliorabili | Assenza di informazione distinta da condizioni sfavorevoli | `None`, unità, duplicati, calendario e disponibilità temporale controllati |

Le finestre climatiche di 7/14/30/60 giorni sono **scelte ingegneristiche candidate**,
non soglie micologiche universali. Il loro massimo determina l'embargo del prototipo.
La complessità non prova un guadagno di accuratezza. Il nuovo codice rende possibile
misurarlo e correggere il modello senza accumulare coefficienti manuali.

## Le evidenze che guidano le scelte

La ricerca ha verificato **19 studi e review ecologiche**, con accesso al testo
effettivamente disponibile documentato in [studies.json](studies.json). Non è una
revisione sistematica esaustiva di tutta la micologia; si concentra su fruttificazione,
fenologia e previsione in Italia, nel Mediterraneo e in ambienti europei pertinenti.
Il dossier [letteratura.md](letteratura.md) riporta risultati e limiti per studio.

- Nei querceti toscani, [Salerni et al. 2002](https://doi.org/10.1560/GV8J-VPKL-UV98-WVU1)
  sostiene l'importanza della pioggia antecedente. Non stabilisce un innesco nazionale
  di 8 mm o l'uscita dei porcini dopo un numero fisso di giorni.
- [Ágreda et al. 2015](https://doi.org/10.1111/gcb.12960) e
  [Karavani et al. 2018](https://doi.org/10.1016/j.agrformet.2017.10.024)
  motivano domanda evaporativa, stato idrico e temperatura dipendente dalla stagione.
- [Olano et al. 2020](https://doi.org/10.1016/j.agrformet.2020.108015) motiva la
  verifica di produttività pregressa degli ospiti e umidità. NDVI non è ancora acquisito.
- [Sánchez-González et al. 2019](https://doi.org/10.1186/s40663-019-0211-1) usa una
  struttura a due parti per presenza di produzione e quantità positiva. Il supporto
  parcella×anno non coincide con una probabilità di incontro durante un'uscita.
- [Morera et al. 2024](https://doi.org/10.1016/j.ecoinf.2024.102557) amplia l'evidenza
  a modelli specifici di più specie in foreste mediterranee.
- Il lavoro di [Brejon Lamartinière e Hoffman, v2 2026](https://www.biorxiv.org/content/10.64898/2025.12.12.693895v2)
  resta pertinente a *B. edulis* in faggeta centroeuropea. Il laboratorio lo elenca
  in stampa; una versione finale con DOI non è stata verificata. Il suo optimum
  termico non viene imposto agli altri porcini o a tutte le foreste italiane.

L'approfondimento di [Morera et al. 2021](https://link.springer.com/article/10.1186/s40663-021-00297-w)
aggiunge un riferimento particolarmente utile: confronta anche blocchi ambientali
per verificare la previsione oltre i luoghi campionati. La scelta del modello e
delle covariate va valutata in questo scenario. Il suo target annuo non sostituisce
la probabilità di successo di una singola uscita.

Alcune pubblicazioni condividono reti di parcelle. Diciannove paper non equivalgono
a diciannove esperimenti indipendenti. Diverse verifiche si basano sull'abstract
originale riprodotto in repository o indici istituzionali; non si attribuiscono
risultati numerici a full text non consultati.

## Dati per lavorare in Italia

La tabella completa di risoluzioni, licenze e accessi è in
[dati-validazione.md](dati-validazione.md). Le priorità sono:

1. **Meteo e acqua:** ERA5-Land per storico omogeneo, corse previsionali archiviate
   e fonti italiane per controllo. Una rianalisi retrospettiva non dimostra come
   avrebbe funzionato una previsione emessa allora. Per +3/+7 occorre la corsa
   effettivamente disponibile all'emissione, non solo la serie cucita delle prime ore.
2. **Bosco, ospiti e terreno:** carte forestali regionali, CLMS, SoilGrids e DEM.
   Latifoglie/conifere non identifica faggio, castagno o quercia. P−ET₀ non sostituisce
   una misura o un modello calibrato dell'acqua nel suolo.
3. **Biologia:** [Sistema Informativo Funghi ISPRA](https://ndm.isprambiente.it/sif/),
   atlanti e dataset GBIF/iNaturalist con licenze e precisione tracciate. Il SIF richiede
   una richiesta motivata per i dati completi: non è già acquisito. Gli archivi di
   presenze aiutano distribuzione e fenologia, senza trasformare buchi cartografici in zeri.
4. **Uscite:** specie cercate, durata attiva, osservatori, contesto, identificazione,
   non-rilevazioni e consenso per ricerca. Il Taccuino già conserva parte dello sforzo;
   i report community aggregati perdono singole visite e non sostituiscono gli eventi.

Per iniziare non serve coprire ogni bosco: serve coprire i domini che vogliamo
ragionevolmente rappresentare. Il disegno proposto stratifica Alpi, Appennino e
Mediterraneo, isole, quote e boschi ospiti, con siti sentinella e visite ripetute.
Il numero di visite va dimensionato sulla precisione desiderata e sulla dipendenza
dei dati, non deciso con una soglia nazionale arbitraria.

Una cella cartografica piccola non migliora da sola il meteo: conservare risoluzioni
di habitat, clima e osservazioni separatamente. La probabilità riguarda l'area e il
protocollo dichiarati, non il centimetro in cui crescerà un esemplare.

## Prototipo verificabile

`features.py` costruisce 31 variabili candidate: precipitazione, ET₀ e differenza
nelle quattro finestre; temperatura e variazioni; umidità del suolo facoltativa;
stagione; quota, chioma, ospiti e pH; interazioni. Non impone soglie di innesco,
bonus da shock termico o optima nazionali. Date e unità impossibili sono rifiutate.
Gli aggregati incompleti rimangono mancanti; le date dal giorno bersaglio in poi
sono escluse. `available_at` consente un audit del cutoff: senza timestamp l'esito
è «ignoto», non «prospettico verificato».

`learning.py` fornisce una baseline per una specie e un protocollo: preprocessing
appreso solo sul training, sforzo come covariata, regressione logistica regolarizzata,
calibrazione separata e metriche sul test. Non stima separatamente micelio,
fruttificazione e rilevabilità, né quantità/biomassa. Il modello nazionale gerarchico,
la componente dinamica e gli ensemble meteo sono passi successivi motivati dalla
ricerca, non funzionalità già completate.

Il quaderno [fronda-ricerca.ipynb](fronda-ricerca.ipynb) usa uno snapshot reale
Open-Meteo su Rieti: 82 giorni restituiti, 16 valori mancanti per pioggia,
19 variabili su 31 calcolabili al 16 ottobre. Quote locali, ospiti, chioma, pH e
umidità del suolo non sono stati acquisiti per quel punto. La qualità della fonte
rimane distinta dalla prestazione biologica. I dati e le trasformazioni sono
inclusi, con attribuzione e checksum, per esecuzione offline.

Il [dataset pubblico tedesco degli autori](https://github.com/ebrejonl/Boletus_fruiting_triggers)
è stato ispezionato separatamente: commit `7967c6d`, file
`Data/Environmental_fruiting_data_jun8.csv`, 3.660 righe, aggregato e sottositi.
Licenza del dataset non verificata; dati e codice non sono redistribuiti qui e
non sono usati per addestrare un modello italiano. Aggregato e sottositi non
possono essere trattati come repliche indipendenti della stessa data.

## Come misurare il miglioramento

[Roberts et al. 2017](https://doi.org/10.1111/ecog.02881) motiva validazioni che
rispettino la struttura geografica e temporale dei dati. Il prototipo richiede
tre insiemi espliciti, train/calibration/test, con siti e blocchi disgiunti e
separazione temporale coerente con i ritardi. Non è una validazione nazionale
automatica: servono anche test per ecoregione, stagione, specie e orizzonte.

Confrontare sugli stessi eventi: Fronda congelata per ordinamento, climatologia,
habitat+calendario e nuovo modello. Per confrontare Brier score occorre calibrare
anche il vecchio indice sui soli dati di sviluppo: dividere il suo 7,2 per dieci
non lo trasforma in una probabilità validata.

Misurare Brier score, log loss, precision-recall, affidabilità delle percentuali,
qualità delle prime uscite consigliate e quota di astensione, con campione e
incertezza per cluster. Il primo codice restituisce metriche puntuali e bin di
affidabilità; intervalli per cluster e analisi di potenza sono ancora da completare
con i dati reali. Nessun test software sostituisce un test micologico prospettico.

Un test su un bosco nuovo può verificare il trasferimento senza aver mai usato
lo storico di quel bosco per il training. Non si promette un guadagno «esponenziale»:
si verifica se il nuovo modello ordina meglio le uscite, è meglio calibrato e sa
riconoscere i casi in cui l'evidenza è debole.

## Stato della consegna

Ricerca, sorgenti, contratto dati, costruzione delle variabili, baseline addestrabile,
test e quaderno eseguito sono disponibili nel repository. Non sono stati acquisiti
dati italiani di visite idonei al training. Non è quindi consegnato un modello
nazionale già calibrato, e il miglioramento biologico resta da misurare.

Il codice è escluso dagli asset pubblicati perché risiede in `tools/`. L'app e il
suo indice non sono stati sostituiti. La documentazione individua anche problemi
da correggere nei vecchi input e nei report; non dichiara risolti quei percorsi.
