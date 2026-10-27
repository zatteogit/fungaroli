# Test con utenti invitati e feedback

Decisioni di Matteo del 27 ottobre 2026. Flusso semplificato in v363, avvisi editoriali 11, stessa revisione delle CGS `cgs-1`.

Il benvenuto spiega che Fronda è un esperimento personale in prova con un piccolo gruppo di persone invitate. Lo scopo è raccogliere feedback e iniziare a raccogliere osservazioni per verificare l’indice. Questa descrizione non introduce un blocco degli accessi al sito: la distribuzione del link resta a cura di Matteo.

## Scelte iniziali

I capitoletti distinguono prova dell’app, prime osservazioni ed esempi dimostrativi. Icone, testo e titoli sono leggibili anche su telefono; il pulsante finale resta raggiungibile durante lo scroll. Le avvertenze scientifiche, le regole e le informative restano consultabili.

Il profilo è facoltativo e consigliato per conservare online il Taccuino e condividere osservazioni. «Ho letto, continua» sblocca direttamente l’app, anche selezionando le caselle: non apre la registrazione o un altro dialog di conferma.

Per un ospite le caselle sono interessi facoltativi, inizialmente spenti, ricordati solo nella memoria della pagina. Nessun consenso scientifico viene assegnato a un profilo sconosciuto. Se la persona decide in seguito di accedere, l’interesse per lo Studio si può attivare per quel profilo con una sola scelta, senza schermata finale da chiudere. Il solo interesse a contribuire non fa aprire un dialog dello Studio.

Se il profilo è già noto nel benvenuto, viene nominato e la casella dello Studio riflette lo stato restituito dal servizio. Una modifica esplicita si salva direttamente tramite `fronda-research-v1`, senza seconda conferma; non si riscrive una scelta non toccata. L’eventuale arrivo della sessione aggiorna il modulo solo finché non è stato modificato. Un cambio di profilo non trasferisce la scelta a un’altra persona. Un errore di salvataggio viene segnalato e si può riprovare dal profilo, mentre l’app rimane utilizzabile.

Nel pannello di accesso «Continua senza profilo» è un pulsante subito accanto alle azioni di registrazione e accesso. Il benvenuto non genera inviti automatici allo Studio durante la stessa apertura; chi ha espresso un interesse può completarlo solo dopo un accesso scelto volontariamente.

La prima casella esprime un’intenzione di contribuire, non attiva una pubblicazione globale. Anche dopo la conferma, ogni nota resta privata finché l’utente non sceglie di condividere quella singola osservazione dal Taccuino. Il consenso allo Studio riguarda esclusivamente ciò che viene condiviso e si modifica o revoca dal profilo. Nessuna modifica alle soglie della community o al modello.

## Esempi simulati

La nota «Tre esempi firmati Matteo…» e il badge «Giro simulato» sono rimossi dalle card. Il benvenuto dichiara che i giri firmati Matteo · Redattore Fronda sono racconti dimostrativi simulati, su sentieri documentati: non sono uscite realmente svolte, ritrovamenti o condizioni attuali. La marcatura `simulated:true`, le distinzioni fra fonti e simulazione e la dichiarazione nel testo condivisibile restano nei dati e nei rispettivi contesti; gli esempi non diventano osservazioni reali.

## Feedback sull’app

«Invia feedback» è disponibile nella barra, nei confronti, nei controlli della mappa, in home e in Info. Il modulo funziona senza profilo e raccoglie tipo e testo del messaggio. Facoltativamente allega soltanto il nome generico della sezione e la versione dell’app. Non allega URL, query, identificativi di note, coordinate, foto, appunti, user agent o identità del profilo. La richiesta non invia cookie.

Il modulo distingue invio in corso, errore con testo conservato e conferma successiva al salvataggio. Il codice della richiesta rende idempotente il retry dopo una risposta persa. La bozza rimane nella memoria della pagina, non viene inviata automaticamente né accodata per l’invio futuro.

Il feedback è separato dalle osservazioni scientifiche. Gli amministratori lo leggono da **Redazione → Feedback del test**, lo segnano come letto o lo eliminano con conferma. Membri, editor e credenziali agenti senza ruolo amministratore non possono leggerlo. L’API pubblica non espone elenchi o letture.

- Invio: `POST /api/feedback/v1/messages`.
- Gestione riservata: `GET /api/cms/v1/feedback`, `PATCH` o `DELETE /api/cms/v1/feedback/:id`.
- Tabelle nel database community UE già configurato: migrazione `0018_app_feedback.sql`, inizializzazione idempotente al primo uso.
- Conservazione: 90 giorni, poi rimozione con la pulizia giornaliera successiva; eliminazione anticipata dalla Redazione.
- Protezione dagli abusi: JSON limitato e validato, origine verificata, 20 invii/ora per connessione e 200/giorno complessivi. I tentativi oltre il limite della connessione non consumano il tetto comune. I contatori usano hash con sale privato e scadenza, senza IP in chiaro. Nessun nuovo binding o servizio esterno.

L’informativa descrive il nuovo canale anche quando viene letto uno snapshot CMS precedente. La revisione delle CGS non cambia: le conferme esistenti restano valide.

## Verifiche

In v363: 592 test unitari e 22 casi browser del percorso iniziale. Verificate tutte le combinazioni delle caselle per un ospite, ingresso diretto senza profilo, accesso manuale facoltativo, salvataggio diretto sul profilo noto, errore non bloccante, cambio account senza trasferimento del consenso, sessione riconosciuta in ritardo senza pannelli automatici, consenso già attivo conservato e completamento successivo con retry senza schermata finale. Il test dello snapshot precedente usa il catalogo come fixture anche su server statico, senza dipendere da un endpoint CMS locale.

Verifica originaria v356:

592 test unitari superati, inclusi API reali su SQLite, autorizzazioni CMS, paginazione con date uguali, idempotenza, limiti, cancellazione, conservazione, minimizzazione dei dati e separazione fra intenzione e consenso.

Cinque casi della suite browser su avviso e invito allo Studio. Controlli integrati a 320/390/768/1280, chiaro/scuro, e WebKit a 390: frontend con handler del feedback e database SQLite locali, sessioni controllate, errore e retry, conferma delle scelte, assenza di pubblicazioni, amministrazione privata, escaping del testo e assenza di overflow. Le prove non accedono a profili reali e non inviano feedback a persone esterne.

Schermate e risultati locali: `output/playwright/pilot-20261027/`.
