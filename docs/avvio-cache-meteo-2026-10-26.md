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
