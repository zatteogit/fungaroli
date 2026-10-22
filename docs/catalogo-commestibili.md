# Catalogo dei commestibili

Verifica del 13 ottobre 2026: la versione precedente conteneva 61 taxa nel catalogo dei caratteri, di cui 18 commestibili e 6 commestibili con cautela; 12 non commestibili, 17 tossici e 8 mortali. Solo 14 voci, incluse alcune aggregazioni di specie, avevano parametri di crescita ed erano rappresentate negli 11 filtri.

Il selettore ora include **46 voci commestibili**: le 24 già documentate e 22 ulteriori voci in `data/edible-catalog.json`. La somma delle voci tassonomiche nei due cataloghi è 83. Le 22 aggiunte hanno schede sintetiche con fonti; non hanno una scheda completa dei caratteri di riconoscimento. I 61 taxa del riconoscimento restano separati dalla selezione dei commestibili.

## Copertura e fonti

Non è un catalogo esaustivo dei funghi italiani e non si confondono nomi, specie aggregate, sinonimi e specie biologiche distinte. Il dato “oltre mille specie” non prova che esistano altrettanti commestibili pertinenti all’app. Un volume ISPRA del 2020 riporta in un contesto divulgativo circa 5000 specie fungine conosciute e 200–300 commestibili: è una stima di riferimento, non un censimento completo aggiornato o un elenco di specie presenti nel Reatino.

- [ISPRA, Memorie del Progetto Speciale Funghi, volume I](https://www.isprambiente.gov.it/files2020/pubblicazioni/quaderni/quaderni-15-20-memorie-del-psf-i-volume-rev22-01-21/%40%40download/file/Quaderni%2015-20%20Memorie_del_PSF_I_Volume_rev22-01-21.pdf).
- [Regione Piemonte, Guida ragionata alla commestibilità dei funghi (2021)](https://www.regione.piemonte.it/web/media/24510/download), revisione micotossicologica utilizzata nella formazione dei micologi. Distingue commestibili, commestibili dopo trattamenti e categorie escluse dal selettore. Le indicazioni sono riassunte, non riprodotte come ricette.
- Fonti di stagione e habitat per ogni voce aggiuntiva: manualistica First Nature e pagine enciclopediche italiane, linkate in `sources`. I calendari europei, compresi periodi mediterranei quando documentati, non sono una validazione fenologica locale.

## Regole del selettore

`js/edible-catalog.js` riunisce i cataloghi ed esclude i taxa non classificati esattamente come `commestibile` o `commestibile con cautela`. Non deduce la commestibilità dal nome, da un riconoscimento automatico o dalla presenza su GBIF.

La ricerca con autocomplete usa nome comune, nome scientifico e sinonimi. Consente singole specie, compresi i singoli porcini. I gruppi restano scorciatoie; “Tutte le specie del catalogo” (fino al 22/10 “Tutti i commestibili”) include il catalogo completo. Sotto «Alla ricerca di…», con Funghi attivo, il pannello ricorda: «Scegli cosa cercare, non cosa mangiare: fai controllare il raccolto all’Ispettorato micologico ASL.» Le preferenze precedenti per gruppi vengono migrate senza perdere la selezione. Tastiera, touch, rimozione e persistenza sono supportati.

“Fuori stagione” si riferisce al calendario indicativo della specie e alla data scelta, non a una certezza di assenza. Un calendario mancante è mostrato come “Stagione n.d.”; non viene sostituito da un intervallo inventato. Clima, quota e coltivazione possono cambiare i periodi reali.

## Modello, diario e segnalazioni

L’indice rimane calcolabile soltanto per le **14 voci con modello**: aggiungere una specie al catalogo non le attribuisce coefficienti biologici per analogia. Se sono selezionate soltanto altre specie, l’app mostra “Indice non disponibile”, le schede, il taccuino e i sentieri consultabili senza suggerire idoneità per quei funghi.

Tutte le 46 voci possono essere annotate nel diario e segnalate alla comunità. Il server applica lo stesso catalogo dei commestibili e rifiuta i taxa tossici. Una nuova specie non entra nei confronti prospettici finché non esiste un valore previsto valido. La commestibilità di una specie non conferma l’identità di un esemplare: restano controllo micologico e preparazioni specifiche.

Per ampliare il catalogo si aggiungono record con ID stabile, nome scientifico, nomi comuni/sinonimi, classificazione verificata, fonti, cautele ed eventuale calendario. Non si aggiungono automaticamente tutti i nomi di una banca dati tassonomica: questa non fornisce necessariamente un giudizio di commestibilità.

## Estensione al Lazio: fonti verificate e percorso proposto

Ricognizione del 13 ottobre 2026. Il riferimento storico regionale è Onofri e Ripa, *Gli studi micologici nel Lazio: stato dell’arte*, Informatore Botanico Italiano 43, suppl. 1 (2011), pp. 88–89, basato sulla checklist del 2005: **1.169 specie**, all’interno di 1.238 entità comprendenti anche sottospecie, varietà e forme. Il censimento era circoscritto ai macrofunghi basidiomiceti; non rappresenta tutti i funghi del Lazio, tutti i commestibili o un conteggio attuale. Comprendeva 3.646 segnalazioni, che non sono altrettante specie. Il confronto con le 46 voci del selettore non è una percentuale di copertura significativa.

Fonti da incrociare, non da importare indiscriminatamente:

- [Onofri e Ripa (2011), atti della Società Botanica Italiana](https://www.societabotanicaitaliana.it/sbi/IBI%2043%20S1%202011/077-139%20-%20Atti%20Convegno%20Sezione%20Laziale%20Giuliano%20Montelucci%202010.pdf): riferimento per la checklist regionale e bibliografia degli studi dei parchi e delle associazioni laziali. Il PDF documenta il conteggio, ma non pubblica qui l’intero elenco regionale strutturato.
- [ISPRA, Sistema Informativo Funghi](https://ndm.isprambiente.it/sif/): rilievi con determinazione, ubicazione, data e habitat. La nomenclatura viene controllata secondo Index Fungorum. La pagina precisa che l’accesso ai dati completi va richiesto al Network con motivazione: non presumere un export libero completo. [L’elenco pubblico](https://ndm.isprambiente.it/sif/elenco-specie-sif/) riporta 1.301 specie e 7.340 rilievi al 23 aprile 2026 per il SIF nazionale, non per il Lazio e non per l’intera micoflora italiana.
- [ISPRA, abbinamento macromiceti–habitat (2014)](https://www.isprambiente.gov.it/files/pubblicazioni/manuali-lineeguida/AbbinamentoFunghiHabitat_26012015_testo_I_parte.pdf), appendice A: descrive anche un archivio di 17.894 record principalmente laziali. Sono osservazioni ecologiche, non un conteggio di specie né coefficienti predittivi già validati.
- [GBIF Italia](https://www.gbif.it/) e pubblicazioni locali: ulteriori evidenze di presenza. Selezionare i record ricadenti nei confini regionali, controllando incertezza geografica, identificazione, provenienza, duplicati e licenza del dataset. Un record cittadino, anche con foto, resta una segnalazione da valutare.
- [Regione Lazio, DGR 547/2022](https://www.regione.lazio.it/documenti/78046): fonte per la commercializzazione; la lista delle specie vendibili non è una checklist regionale né l’elenco completo dei commestibili. Per il giudizio micotossicologico resta necessaria la verifica separata sulle fonti sanitarie, con aggiornamenti e revisione di un micologo.

Procedura proposta:

1. Costruire un elenco di **candidati** separato dal catalogo pubblicato, includendo anche gli ascomiceti macroscopici. Per ciascuno conservare nome originale, nome accettato, ID tassonomico esterno, sinonimi, livello tassonomico, riferimento della presenza laziale, data/località del rilievo, precisione geografica e condizioni di riuso. Le aggregazioni attuali dell’app devono essere esplicite; una revisione o scissione tassonomica non deve riassegnare automaticamente vecchi ritrovamenti a una specie diversa.
2. Verificare indipendentemente presenza regionale e commestibilità. Stati distinti: `da verificare`, `documentata`, `controversa`; per il giudizio alimentare: commestibile, dopo trattamenti, sconsigliata, tossica, sconosciuta. Pubblicare nel filtro soltanto le prime due categorie con fonti concordanti e cautele. Gli altri taxa possono entrare nelle schede didattiche e dei sosia, senza entrare nella selezione alimentare.
3. Aggiungere schede curate per lotti, iniziando dalle specie documentate nei territori già coperti. Fotografie con licenza verificata, nomi comuni e sinonimi ricercabili, habitat, substrato e periodo con fonte. Senza calendario documentato mantenere “Stagione n.d.”. Senza modello mantenere “Indice non disponibile”.
4. Estendere poi le zone di passeggiata al resto del Lazio con accessi, tracciati, habitat e meteo propri: una specie presente sul litorale non è automaticamente pertinente al Reatino. Registrare provincia/ecoregione e tipo di evidenza, senza esporre coordinate delle segnalazioni personali.
5. Aggiornare il modello separatamente attraverso osservazioni prospettiche, specie effettivamente cercate, durata della ricerca e ricerche senza ritrovamenti, con verifica su dati non usati nella calibrazione. Nessuna equivalenza tra numero di segnalazioni, abbondanza reale e probabilità di trovarle.

Cloudflare D1, già usato per la comunità, può ospitare candidati, fonti e revisioni; il catalogo pubblico può continuare a essere esportato in JSON versionato e disponibile offline. Questa è una proposta di estensione: non sono stati importati o dichiarati verificati altri taxa regionali. Il traguardo misurabile è coprire tutte le specie commestibili **documentate nell’elenco di riferimento versionato**, mostrando quanti candidati rimangono da verificare, senza promettere la totalità della biodiversità regionale.
