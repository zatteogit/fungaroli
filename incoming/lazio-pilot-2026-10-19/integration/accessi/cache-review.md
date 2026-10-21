# Cache dello snapshot pubblico — 19 ottobre 2026

## Problema e modifica

Le 22 risorse CMS presenti al momento della revisione contavano circa 2,89 milioni di caratteri JSON, rispetto a 2,37 milioni in HEAD. La sola copia UTF-16 supera 5 MiB, prima delle cache meteo: il precedente `localStorage.setItem` poteva fallire lasciando una copia precedente come ripiego.

Il blocco di caricamento iniziale di `js/app.js` conserva ora lo snapshot completo e validato con Cache API:

- cache dedicata `fungaroli-content-v1`;
- chiave `/api/content/v1/snapshot`;
- prima risposta ricevuta e validata, poi salvataggio facoltativo nella cache;
- rimozione della vecchia chiave localStorage quando viene ricevuto uno snapshot completo;
- se la richiesta non produce uno snapshot valido: lettura della nuova cache;
- soltanto senza una nuova copia utilizzabile: lettura della chiave legacy e migrazione facoltativa verso Cache API;
- nessuna nuova scrittura dello snapshot in localStorage;
- indisponibilità o errore della cache non scarta i dati già ricevuti; senza copie valide restano i dati inclusi nella release.

In `sw.js` il nome della cache dedicata è incluso nella lista conservata durante `activate`; gli aggiornamenti della shell non la cancellano. Il percorso di rete dello snapshot e la cache runtime già esistenti rimangono compatibili con questo ripiego validato dall’applicazione.

## Verifica svolta

Ispezione del blocco iniziale e della lista di conservazione del service worker; controllo di sintassi di `js/app.js` e `sw.js` riuscito. Nessuna suite, test, dry-run o scrittura allo storage del browser. Nessuna affermazione di persistenza live: la verifica nella release distribuita resta al coordinatore.

Modifica puntuale soltanto al blocco snapshot e alle due righe necessarie del service worker; gli altri blocchi modificati contemporaneamente dal coordinatore sono preservati. Versione shell e meta app-version sono gestiti dal coordinatore nel rilascio comune.
