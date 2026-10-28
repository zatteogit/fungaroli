# Avvio e aggiornamento del meteo · 26 ottobre 2026

## Problema misurato sulla v351

Nel browser Chrome sul sito online, una prima misura ha trovato lo snapshot CMS a 4.838 ms e 72 richieste meteo: iniziate a 6.340 ms e terminate a 13.245 ms. Una seconda apertura senza le copie applicative ha confermato 72 richieste, catalogo a 2.733 ms, ultima risposta meteo a 10.297 ms e `fronda:boot-ready` a 10.911 ms. Sono misure di laboratorio su questa connessione, non percentili dei dispositivi degli utenti.

Il catalogo veniva sempre atteso dalla rete prima di usare la copia pubblica. Ogni nuovo isolate CMS rieseguiva la revisione dei seed. Il meteo faceva un viaggio HTTP per zona e per profilo. Infine la prima crescita ricevuta poteva produrre una classifica prima del completamento del meteo dell’uscita; la protezione contro i riordini trattava anche questo completamento come una nuova proposta da confermare. Una condizione nel renderer ignorava inoltre l’eccezione già prevista per la pagina appena aperta.

## Correzione v352

- Catalogo coerente dalla Cache API subito, con rinnovo in background per l’apertura successiva. Una nuova versione delle CGS ricevuta in background richiede comunque la conferma nella sessione corrente. Cache indisponibile: rete, poi consueti file inclusi nella release.
- Revisione dei seed CMS una volta per shell, registrata solo dopo il completamento; gli isolate successivi leggono i documenti pubblicati. Le modifiche degli autori e il comportamento delle nuove release restano protetti dalle regole esistenti.
- Due letture pubbliche `/api/weather/v1/snapshot?profile=growth|outing` dal deposito D1, con una query per profilo e righe progressive. Nessuna chiamata al provider; ogni zona conserva la propria acquisizione. Trasporto testuale con formato dichiarato per consentire la compressione standard di Cloudflare senza serializzare nuovamente il catalogo meteo nel Worker. I vecchi endpoint restano disponibili e il client ripiega su di essi soltanto con server precedenti (404/405).
- Le copie locali vengono deserializzate una sola volta finché il loro contenuto non cambia. Nessuna modifica a scadenze, soglie scientifiche o frequenze del cron.
- Il primo risultato visibile comprende entrambi i profili. Le copie locali complete possono essere mostrate subito; una copia parziale non diventa una classifica provvisoria. Le risposte interrotte conservano le zone ricevute e le ultime copie valide.
- Durante un aggiornamento successivo i numeri e il meteo dei luoghi visibili si aggiornano senza cambiare la copertina o l’ordine già letto. «Mostra proposte» riguarda esclusivamente un nuovo ordine, non un download o una ricarica della pagina. Peggioramenti segnalati subito.

## Verifiche

580 test unitari; 12 casi browser mirati a 390/1280 px su primo avvio con i due flussi separati, catalogo lento con copia locale, apertura successiva, calendario e card conservati, cache assente, richiesta bloccata, recupero parziale e nuova versione delle CGS. Verificato inoltre che la card originale resti connessa al DOM e mostri il meteo peggiorato prima di applicare le nuove proposte. Dry-run Worker e controllo diff.

Il runtime Wrangler locale continua a fallire con `spawn EBADF`: le verifiche browser locali usano un server statico e API controllate; le letture D1 sono coperte dai test SQLite. La consegna e i tempi vengono ricontrollati sul Worker online dopo il deploy, senza modificare dati privati o consensi degli utenti.

## Controllo sul Worker pubblicato e completamento v353

La pubblicazione automatica della PR #272 non è partita; il commit unito `7b4fccd1` è stato pubblicato da un archivio Git pulito con la configurazione versionata. Worker `4329bab7-3f1c-4510-845c-db98a3812a23`. I due endpoint hanno restituito HTTP 200, 36 zone ciascuno e compressione Brotli. Prima apertura misurata: 6.356 ms al boot pronto; ripetizione senza copie applicative: 4.294 ms (2 richieste, catalogo 1.486 ms). Nessun invito a riordinare all’avvio.

La verifica della riapertura ha trovato un ultimo blocco: i dati coerenti della cache erano già renderizzati, ma l’overlay globale attendeva ancora il controllo di rete (2.943 ms al boot). La v353 segnala la disponibilità appena appare la prima generazione coerente, installando prima i controlli di aggiornamento/tema/viewport. Il nuovo test trattiene sia il catalogo remoto sia il meteo dell’uscita durante la riapertura e verifica che la home salvata sia effettivamente accessibile, non soltanto presente sotto l’overlay.

## Avvio in parallelo v354

La v353 pubblicata ha confermato una riapertura consultabile a 1.252 ms, con il controllo di rete completato a 2.776 ms e nessun invito a riordinare. Un primo accesso immediatamente dopo il deploy, comprendente la revisione iniziale dei seed CMS, ha richiesto 7.698 ms.

La v354 anticipa le due letture meteo in parallelo al catalogo, riutilizzando le stesse risposte quando le zone sono inizializzate: non raddoppia i download. Non precarica se le copie locali sono state acquisite da meno di cinque minuti. Il controllo del marker CMS precede anche la creazione idempotente dello schema, evitando quel viaggio D1 quando la release è già pronta. Il test trattiene completamente il catalogo assente e verifica che entrambe le letture meteo siano già partite.
