# Test con utenti invitati e feedback

Decisioni di Matteo del 27 ottobre 2026. Versione app v356, avvisi editoriali 11, stessa revisione delle CGS `cgs-1`.

Il benvenuto spiega che Fronda è un esperimento personale in prova con un piccolo gruppo di persone invitate. Lo scopo è raccogliere feedback e iniziare a raccogliere osservazioni per verificare l’indice. Questa descrizione non introduce un blocco degli accessi al sito: la distribuzione del link resta a cura di Matteo.

## Scelte iniziali

I capitoletti distinguono prova dell’app, prime osservazioni ed esempi dimostrativi. Icone, testo e titoli sono leggibili anche su telefono; il pulsante finale resta raggiungibile durante lo scroll. Le avvertenze scientifiche, le regole e le informative restano consultabili.

Le due caselle, inizialmente vuote e facoltative, permettono di esprimere l’intenzione di contribuire con osservazioni condivise e di partecipare allo Studio dell’indice. La presa visione degli avvisi sblocca l’app; se è selezionata almeno una scelta propone il profilo facoltativo. Si può continuare senza profilo.

L’intenzione resta soltanto nella memoria della pagina, non è un consenso sul server e si perde ricaricando. Dopo l’accesso, il profilo è nominato esplicitamente e le scelte si possono rivedere. Solo «Conferma le scelte» registra il consenso o il rifiuto allo Studio attraverso il servizio esistente (`fronda-research-v1`). Un errore non vale conferma; il testo resta e si può riprovare. L’intenzione di un profilo già noto non viene applicata a un altro profilo.

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

592 test unitari superati, inclusi API reali su SQLite, autorizzazioni CMS, paginazione con date uguali, idempotenza, limiti, cancellazione, conservazione, minimizzazione dei dati e separazione fra intenzione e consenso.

Cinque casi della suite browser su avviso e invito allo Studio. Controlli integrati a 320/390/768/1280, chiaro/scuro, e WebKit a 390: frontend con handler del feedback e database SQLite locali, sessioni controllate, errore e retry, conferma delle scelte, assenza di pubblicazioni, amministrazione privata, escaping del testo e assenza di overflow. Le prove non accedono a profili reali e non inviano feedback a persone esterne.

Schermate e risultati locali: `output/playwright/pilot-20261027/`.
