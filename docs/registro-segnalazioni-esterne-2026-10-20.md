# Registro delle segnalazioni esterne

Richiesta di Matteo del 20 ottobre: cercare altre fonti, inserire le segnalazioni nel database, permettere consultazione e modifica dalla dashboard e conservare dati utilizzabili dal motore.

## Raccolta iniziale

88 voci: 14 sintesi Facebook già consultate nel Chrome di Matteo, 73 osservazioni iNaturalist e un bollettino FungoCenter. Campione esplorativo e limitato, non censimento del Lazio. Gli ID delle osservazioni, le query e i conteggi della copertura sono in `worker/external-observations-seed.json`; lo script di acquisizione è `tools/import-external-research.py`. Nessuna acquisizione periodica configurata.

iNaturalist: letti i 22 risultati fungini della provincia di Rieti dal 1 settembre al 20 ottobre 2026, i primi 30 risultati research grade del Lazio e i primi 30 research grade dei Basidiomycota laziali nello stesso intervallo. Deduplicati gli ID presenti in più query. Il taxon generale include anche licheni e microfunghi: non si attribuisce a tutti il significato di un ritrovamento di funghi da raccolta. La qualità è quella dichiarata dalla piattaforma al momento della consultazione.

Fonte API: https://api.inaturalist.org/v1/docs/; osservazioni collegate individualmente. Le date di osservazione sono distinte dalla pubblicazione. Le coordinate pubbliche sono state impiegate temporaneamente solo per verificare se punto e accuratezza dichiarata ricadessero completamente in un solo raggio del catalogo; coordinate, accuratezza e nomi degli osservatori non sono conservati. I punti oscurati non vengono ricondotti a una zona precisa. L’eventuale assenza di accuratezza lascia il record alla provincia. L’attribuzione e la licenza della fonte sono consultabili sul record originale; non vengono copiate fotografie o descrizioni originali.

FungoCenter: https://www.fungocenter.it/meteo-funghi-dal-5-all11-ottobre-2026-timidi-segnali-di-ripresa-lazio-in-evidenza. Il bollettino del 12 ottobre descrive alert meteorologici e notifiche: è registrato come contesto di un modello, non come presenza o assenza di funghi. Eventi, normative e altri siti di previsioni incontrati nella ricerca non sono stati trasformati in osservazioni.

Facebook: date relative o anni non esposti restano irrisolti, senza attribuire la data del post all’uscita. Gli “ovoli” e altri nomi comuni non vengono convertiti automaticamente in specie scientifiche. Le voci descrittive, le dichiarazioni senza uscita e il sentito dire conservano la propria categoria.

## Database e gestione

Si usa il D1 `COMMUNITY_DB` esistente. Migrazione idempotente `0010_external_observations.sql`: registro, storico e ricevuta d’importazione. Il seed versionato viene importato al primo accesso allo stato della comunità o al registro. È un’inizializzazione dei dati autorizzati e compilati nel Worker; il client non può inviare dati a questo percorso. La ricevuta `external-2026-10-20-v1` conserva il numero delle voci importate e il momento della scrittura. Ai successivi isolate il seed non viene riletto né riscritto. I salvataggi della redazione non vengono sovrascritti dai deploy.

Il riepilogo pubblico `/api/community/status` restituisce solo la ricevuta iniziale, senza record, fonti o dati amministrativi. Tutte le API del registro richiedono una sessione con ruolo amministratore e rispondono `no-store`. Le mutazioni verificano anche l’origine. Le credenziali agente esistenti non possono ottenere il ruolo admin con i propri scope.

Dashboard: `/redazione` → Dashboard → Registro delle segnalazioni. Ricerca per luogo/specie, filtri per fonte e stato, pagine da 30 voci, apertura delle fonti, creazione e modifica. Campi strutturati per date, esito, testimonianza, precisione territoriale, tassonomia, sforzo, licenza e gruppo evento. Accettare una voce non rende automaticamente risolti i suoi campi mancanti. Per ritirarla si usa “Esclusa”.

Ogni scrittura ha motivo obbligatorio, versione e audit atomico nello stesso batch D1. Una versione obsoleta restituisce 412. Il link canonico elimina il tracking e distingue i commenti; la stessa fonte non viene creata due volte. Le revisioni precedenti si possono riprendere nell’editor e salvare come nuova revisione. I testi delle fonti sono trattati come contenuti, mai come istruzioni.

## Contratto del motore

API amministrative:

- `GET /api/cms/v1/external-observations?q=&source=&status=&page=0`
- `POST /api/cms/v1/external-observations` con `{data,reason}`
- `GET /api/cms/v1/external-observations/:id` con storico
- `PATCH /api/cms/v1/external-observations/:id` con `{version,data,reason}`
- `GET /api/cms/v1/external-observations/engine` e pulsante “Esporta per il motore”

Il dataset `schemaVersion:1`, `purpose:occurrence_evidence` conserva presenze e ricerche a vuoto ammesse, data osservata, scala territoriale, taxon, fonte, versione e licenza. Ogni esclusione ha un motivo. Le presenze richiedono accettazione, giorno esatto, nome scientifico, luogo risolto, testimonianza diretta/identificazione e qualità confermata dalla fonte; le ricerche negative richiedono inoltre ricerca esplicita e durata. I duplicati evento/taxon/giorno vengono esclusi dall’export, conservando tutte le righe consultabili nel registro.

Il campione iniziale produce 32 osservazioni utilizzabili alla propria scala e 56 esclusioni, comprese le righe duplicate dello stesso evento. Due osservazioni hanno anche zona e taxon del catalogo risolti; risalgono al 29 settembre, quindi non sono evidenze recenti nella finestra di 7 giorni del 20 ottobre. Non si trasformano le osservazioni provinciali in presenze di ogni bosco della provincia.

`js/model.js` espone `externalFieldEvidence(dataset,zoneId,taxonId,day,options)`. `scoreZoneDay` riceve opzionalmente `context.externalObservations` e restituisce `fieldEvidence` per specie, usando solo record coerenti con zona, taxon e finestra temporale e senza dati successivi al giorno richiesto. Le specie senza osservazioni hanno copertura sconosciuta, non assenza. Il punteggio e i coefficienti restano invariati; `rankingEffect` è `none`. Il dataset amministrativo non è pubblicato nell’app e non entra negli aggregati reciproci o nei conteggi dei contributori Fronda. Una calibrazione richiederà un metodo e un campione indipendente.

## Verifiche

Controlli mirati: accesso, origine, schema, duplicati, persistenza, storico atomico, versioni concorrenti, campione del motore, finestra temporale e regressioni del modello. Nessuna lunga suite. Dry run del Worker riuscito. Il runtime Wrangler locale su questo Mac termina con `spawn EBADF`; la verifica UI usa lo stesso Worker sorgente con un adattatore HTTP e SQLite locali, profilo sintetico e database isolati, non i dati di produzione.

Browser: consultazione, ricerca Fistulina, modifica della sintesi, salvataggio, rilettura e storico; download reale del dataset; controllo a 320, 390 e 1280 pixel. La verifica finale del deploy e della ricevuta D1 va riportata separatamente dall’esito locale.
