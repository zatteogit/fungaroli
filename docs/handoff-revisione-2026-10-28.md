# Handoff · correzioni dalla revisione del 28/10/2026

Il 28/10 ho rivisto le PR del 26–28/10 (circa 36, quasi tutte di Codex), dal commit `bc82f3c` a `7c1d2eb`. Hanno lavorato due revisori in parallelo: moduli campo/meteo/TypeScript e navigazione/UI.

Questo documento è la coda di lavoro che ne è uscita. Ogni punto ha un'etichetta di stato:

- **Verificato**: ho ricontrollato io il codice e il percorso dell'errore.
- **Segnalato**: il revisore l'ha tracciato nel codice, ma io non l'ho rifatto. Va riprodotto prima di correggere.
- **Decisione**: serve la scelta di Matteo. Non va fatto prima, va chiesto con domande a scelta, come dice AGENTS.md.

## Prima di iniziare

- Leggi `AGENTS.md`, `docs/handoff-2026-10-14.md` e `docs/ambienti-ed-edizioni.md`.
- **Il ramo di produzione è `main`** (dal 28/10). Parti da `main` aggiornato e apri una PR verso `main` per ogni gruppo di correzioni. Ogni merge pubblica la produzione.
- Per provare una PR su Cloudflare prima del merge: `git push --force origin <ramo>:staging`. Va su https://fungaroli-staging.zatteo.workers.dev, con database propri.
- Verifiche rapide prima di ogni push:
  - `npm test`
  - `node docs/fronda/scripts/check.mjs`
  - `node docs/fronda/scripts/guard-test.mjs`
  - `npx wrangler deploy --dry-run --env=""`
  - `npx wrangler deploy --dry-run --env staging`
  - `git diff --check`
- Se cambia un file dell'app pubblicata, aumenta `SHELL` in `sw.js` e `<meta name="app-version">` in `index.html` (oggi v381).
- I moduli con intestazione «Generated from» in `js/` si modificano solo in `src/js/*.ts`, poi `npm run build:typescript`. Nel commit vanno sia il `.ts` sia il `.js`.
- **Limite noto dei container cloud.** Il meteo esterno non è raggiungibile, quindi in home non compare `#hero .cover-link` e molti spec browser falliscono anche su `main`. Prima di attribuire un fallimento a una modifica, rilancia lo stesso spec sul commit di base. Nella PR scrivi cosa hai potuto verificare e cosa no.

## Priorità 1: funzioni rotte

### 1. Gli avvisi meteo dell'uscita non partono mai (verificato)
- **Dove:** `worker/outing-alerts.js`, funzione `weather()` (riga 115 circa).
- **Cosa succede:** legge il meteo con `weatherStorage(env).get(forecastParams([zone], "outing").toString())`, cioè con la query grezza come chiave. Il meteo però è salvato sotto `weather:v3:<sha256 dei parametri>` (`worker/weather-provider.js:81-85`, `worker/weather-snapshot.js:4-11`).
- **Effetti:**
  - ogni iscrizione risponde 409 «Aspetta che il meteo dell’uscita sia disponibile…»;
  - `sendOutingAlerts` non invia nulla.
- **Perché i test passano:** `tests/outing-alerts.test.mjs` scrive i dati di prova con la stessa chiave sbagliata.
- **Correzione:**
  - estrai un unico helper per la chiave (`weather:v3:` + SHA-256 esadecimale di `params.toString()`) e usalo in provider, snapshot e avvisi;
  - nel test scrivi i dati di prova tramite l'helper, non a mano;
  - aggiungi un test che fallisce con il codice attuale.
- **Collegati, da valutare nella stessa PR:**
  - `worker/index.js:76-80`: gli avvisi partono solo se `refreshSavedWeather` non lancia errori. Spostali in un `ctx.waitUntil` separato.
  - Le quattro `DELETE` di pulizia girano ogni minuto: spostale nel cron notturno `17 3 * * *` (segnalato).
  - Il link della notifica usa `/#/zona/<id>/<offset>` con l'offset del giorno di invio. Aperto il giorno dopo, porta all'uscita sbagliata (`worker/outing-alerts.js`, segnalato). Serve un riferimento per data.

### 2. Il meteo a pacchetto non ha ripiego (segnalato, alta probabilità)
- **Dove:** `src/js/weather-request.ts`, `fetchForecast` e `requestSnapshot`.
- **Cosa succede:** nel browser l'app usa solo il pacchetto snapshot. Torna alle richieste per zona soltanto su 404/405 o se la risposta non è ndjson. Quindi:
  - un 5xx passeggero, il timeout di 20 secondi o una promessa di prefetch fallita all'avvio fanno fallire tutto il caricamento;
  - con uno snapshot parziale, le zone mancanti restano `null` e non vengono richieste;
  - aggiornare una sola zona scarica lo snapshot di tutte.
- **Correzione:** se lo snapshot fallisce (senza abort) o arriva incompleto, esegui il ciclo per gruppi già esistente solo per le zone mancanti. Aggiungi test unitari per 5xx, timeout e snapshot parziale.

### 3. Un solo record locale non valido blocca il Taccuino (segnalato)
- **Dove:** `src/js/notebook-photo-store.ts` (`metadata()`, `isEntry`, `write()`) e `js/journal.js:88`.
- **Cosa succede:**
  - prima del port `metadata()` restituiva `[]` sul JSON non valido; ora lancia un errore, anche quando una sola riga non passa `isEntry`;
  - in `journal.js:88` `await local.replace(entries)` non ha `try`, e il ripiego `local.list()` lancia di nuovo. Il risultato è che le voci scaricate dal server non si vedono e salvare o cancellare è bloccato;
  - `write()` salva foto senza controllare che `width`/`height` siano numeri finiti, mentre la lettura le rifiuta.
- **Correzione:**
  - `try/catch` su `local.replace` come alla riga 139;
  - valida in `write()`;
  - in lettura salta o metti da parte le righe non valide invece di fallire tutta la lista.

### 4. Una copia offline non valida blocca l'archivio offline (segnalato)
- **Dove:** `src/js/field-store.ts`, `listFieldPacks` e `saveFieldPack`.
- **Correzione:**
  - nell'elenco salta i pacchetti non validi, ma offri comunque «Rimuovi»;
  - `removeFieldPack` deve cancellare senza fare il parse.

## Priorità 2: comportamento e testi

### 5. «Annota» contestuale non riconosce i pulsanti nella pagina (segnalato)
- **Dove:** `src/js/contextual-navigation.ts:178` cerca solo `[data-annotate],.notebook-context-action`.
- **Cosa manca:** i pulsanti di pianta (`js/plants.js`, `data-note-kind="pianta"`), animale (`.animal-note-action`) e zona (`.zone-note-action`). Su quelle pagine la barra mostra Annota anche quando il pulsante nella pagina è visibile, e i dati del contesto copiati restano vuoti.
- **Correzione:** allarga il selettore, oppure dai a quei pulsanti la classe `notebook-context-action`. Poi `npm run build:typescript`.
- **Collegato:** il calcolo delle etichette desktop (`fitDesktop` dentro `choose()`) gira a ogni callback dell'IntersectionObserver, quindi anche durante lo scroll. Il commento del file e `docs/navigazione-contestuale.md` lo vietano. Chiamalo solo quando cambia il target.

### 6. Feedback inviato mentre il dialog si chiude (segnalato)
- **Dove:** `js/feedback.js:8` tiene aperto il dialog su `hashchange` mentre `busy`, ma `js/modal-flow.js:124` lo chiude comunque.
- **Cosa succede:** se l'utente torna indietro durante l'invio, l'esito finisce in un dialog chiuso. In caso di successo la bozza è già cancellata.
- **Correzione:** alla risposta, se `!dialog.open`, mostra un avviso breve con l'esito.

### 7. Scelta «Mi interessa contribuire con osservazioni» ignorata (segnalato)
- **Dove:** `js/app.js:4056` salva `share`, ma `js/research-consent-invite.js:20` legge solo `research`, e senza `research` cancella tutto.
- **Decisione:** usarla (per esempio un invito dal Taccuino dopo il profilo) o togliere la casella da `js/pilot-onboarding.js`.

### 8. L'avviso iniziale indica un pulsante che non esiste più (verificato)
- **Dove:** `js/legal-notice.js:9` e `data/legal.json:21`: «Trovi «Invia feedback» nella barra dell’app». Il pulsante nella testata è stato tolto (commit `eebcf96`). Oggi il feedback sta in home, in Info, nelle preferenze del Taccuino e nei controlli della mappa.
- **Decisione:** il testo fa parte dell'impronta dell'avviso, quindi cambiarlo chiede a tutti una nuova conferma. Proponi a Matteo se correggerlo subito o insieme alla prossima versione dell'avviso.

### 9. Listener dell'onboarding che si accumulano (segnalato)
- **Dove:** `js/app.js:4042-4067`. Ogni `applyLegal()` aggiunge un listener `fungaroli:community` e sostituisce `dlg.onclose`, ma viene rimosso solo l'ultimo.
- **Cosa succede:** se l'avviso si ricarica con il dialog aperto (nuova versione dal CMS o da un'altra scheda), un listener vecchio può riscrivere le scelte già fatte.
- **Correzione:** gestore unico a livello di modulo, oppure un `AbortController` annullato all'inizio di `applyLegal`.

### 10. Service worker (segnalato)
- `sw.js:111`: per ogni richiesta `/assets/` cerca prima nei pacchetti offline, che non si rivalutano mai. Una foto sostituita allo stesso percorso resta vecchia per sempre, anche online. Usa i pacchetti solo come ripiego offline.
- `sw.js:142`: il clic su una notifica apre sempre una nuova finestra. Prima `clients.matchAll({type:'window', includeUncontrolled:true})`, poi `navigate` e `focus` sul client esistente.

### 11. Stato degli avvisi nel client che si allontana dal server (segnalato)
- **Dove:** `src/js/field-alerts.ts`.
- **Cosa succede:** il server elimina dispositivi e giorni passati, ma l'elenco locale non si aggiorna mai. La UI continua a mostrare «Avvisi attivi».
- **Correzione:** pota le date passate. Su 409 da token perso, rifai l'iscrizione push.
- Da fare dopo il punto 1.

### 12. Cache meteo in memoria (segnalato, minore)
- **Dove:** `src/js/weather-cache.ts`.
- **Cosa succede:** `saveZoneWeather` modifica l'oggetto in memoria prima di `setItem`. Se lo spazio è esaurito, la memoria tiene dati mai salvati.
- **Correzione:** clona prima di modificare.

## Priorità 3: privacy e decisioni (non procedere senza Matteo)

### 13. Posizione GPS delle note e notifiche push nell'informativa (decisione)
- `src/js/notebook-entry.ts` (`normalizePosition`) conserva la posizione della nota. `worker/community.js` la salva in `diary_entries`, a quanto risulta a piena precisione.
- L'informativa (`data/legal.json`, sezione privacy) elenca i campi sincronizzati del Taccuino senza la posizione, e non parla delle iscrizioni push salvate dal server. `docs/funzioni-dispositivo.md` invece le descrive.
- **Da fare:**
  - verifica esattamente cosa viene salvato e con quale precisione;
  - proponi a Matteo: arrotondare come la base (circa 1 km) oppure conservare e dichiarare;
  - aggiorna `data/legal.json` (nuova versione dell'avviso) e i documenti.
- Da chiudere prima di allargare il test ad altri utenti.

### 14. Cautela della zona dentro un `<details>` chiuso (decisione)
- **Dove:** `js/app.js`, `zoneCollectionNotice(..., {compact:true})`.
- **Cosa succede:** «Raccolta da verificare con il gestore» finisce chiusa. AGENTS.md chiede che le cautele restino leggibili integralmente. Chiedi conferma.

## Pulizia (nessuna decisione necessaria)

- **Codice morto lasciato da PR superate:**
  - `.theme-btn` in `css/style.css` (righe 1784, 2114-2115, 3487, 3489 circa);
  - `.auth-dialog .auth-dismiss` (`css/style.css:2169`);
  - la regola per `.appbar-actions > a[href="#/info"]` in `css/navigation-dock.css:70-71`;
  - `.onboarding .ob-prototype`, duplicato fra `css/style.css:3495` e `css/pilot-test.css:5`;
  - il listener `fronda:pilot-choices`, mai emesso (`js/research-consent-invite.js:69`).

  Prima di togliere, cerca ogni selettore con `grep` per escludere usi dinamici.
- **Chiavi duplicate** nelle mappe di etichette di `js/content-schema.js` (`caution`, `checkedOn`, `status`): Wrangler le segnala a ogni build. Vale l'ultima: verifica quale etichetta deve restare.
- `docs/typescript.md`: aggiungi `navigation-dock.d.ts` fra le dichiarazioni scritte a mano.
- `tools/build-typescript.mjs --check` non trova un `js/*.js` «Generated from» il cui `.ts` è stato cancellato: aggiungi il controllo.
- `aria-label` sul `summary` di `.outing-context-help`: nasconde ai lettori di schermo il testo visibile delle specie.

## Già chiarito, non rifare

- **Regressioni grafiche del passaggio a TypeScript.** Ho confrontato a schermo la versione prima delle PR #289/#290 e quella subito dopo (390, 1024 e 1280 px; chiaro e scuro; home, zona, specie, taccuino, scopri, mappa). Il markup generato è identico. L'unica differenza era la barra fra 900 e 1279 px, con le voci ridotte a icone dal CSS entrato nella #290. La correzione «Keep navigation labels whenever the header has room» l'ha già risolta. Le altre differenze attuali (scheda community scura, strumenti del bosco compatti, azioni globali spostate nel Taccuino) sono scelte delle PR successive, documentate in `docs/navigazione-contestuale.md` e `docs/uscita-gerarchia.md`.
- **Già in regola:** `PRECACHE` completo per i moduli dell'app; `SHELL` allineato; nessuno `showModal()` diretto fuori dal coordinatore; nessun colore fisso nei CSS nuovi; `EXTERNAL_RANKING_WEIGHT` sempre a 0; i JavaScript generati coincidono con i sorgenti.

## Ordine consigliato delle PR

1. Punto 1 (avvisi) con i collegati e il punto 11.
2. Punti 2, 3 e 4 (robustezza di meteo, Taccuino e archivio offline).
3. Punti 5, 6, 9, 10 e 12.
4. Pulizia.
5. Punti 7, 8, 13 e 14 solo dopo le decisioni di Matteo, raccolte con domande a scelta all'inizio del lavoro, così non bloccano il resto.

Ogni PR: provata in staging, rapporto delle verifiche fatte e non fatte nella descrizione, nessun merge senza mandato.
