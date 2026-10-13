# Taccuino privato e osservazioni collettive

Servizio attivo su https://fungaroli.zatteo.workers.dev dal 13 ottobre 2026: provisioning D1 e registrazione con passkey verificati sul dominio pubblico.

## Architettura

Il Worker esistente serve il sito e `/api/community/*`. **Cloudflare D1**, binding `COMMUNITY_DB`, contiene profili, chiavi pubbliche WebAuthn, sessioni, sfide, diario e segnalazioni. Il vecchio namespace KV e la sua API rimangono separati per preservare i diari con codice. Non vengono trasferiti o pubblicati automaticamente. Il profilo offre un’importazione esplicita con il vecchio codice, che legge la copia KV senza modificarla.

Wrangler 4.149.0 può creare automaticamente il database `fungaroli-community` al deploy quando il binding non ha `database_id`. Il token usato dal build Cloudflare deve poter creare e scrivere database D1. La migrazione idempotente `migrations/0001_community.sql` viene applicata al primo accesso all’API con un batch di istruzioni complete. Questa configurazione non garantisce una collocazione esclusivamente europea: per un vincolo di giurisdizione occorre configurare il servizio nel pannello Cloudflare.

`APP_ORIGIN` fissa origine autorizzata e RP ID delle passkey. Modificarla cambia il dominio su cui funzionano le credenziali: non farlo a caso. Il nome del Worker e la configurazione del vecchio KV vengono preservati. Il cron quotidiano rimuove sfide, sessioni e contatori scaduti.

## Identità e privacy

Passkey discoverable e verifica dell’utente obbligatoria; nessuna password, email, attestation obbligatoria o chiave privata sul server. SDK SimpleWebAuthn mantenuto, bundle browser locale. Token casuali di sessione/sfida in cookie `__Host-`, Secure, HttpOnly, SameSite=Strict; nel database restano solo hash SHA-256. Le mutazioni verificano l’origine, la sfida WebAuthn è consumata una sola volta e il contatore è aggiornato senza sovrascrivere accessi concorrenti. Sessione di 30 giorni e sfida di 5 minuti.

Ogni lettura e scrittura del diario usa l’account ricavato dalla sessione, mai un proprietario inviato dal client. Cache locale separata per account. Note private, niente GPS raccolto. La condivisione è una scelta esplicita. La summary pubblica espone soltanto aggregati per zona/specie negli ultimi sette giorni, anche se derivano da una singola osservazione; nessun nome o identificativo personale. Il gestore conserva accesso amministrativo al database.

Ritiro, cancellazione della voce ed eliminazione account rimuovono le segnalazioni dal database operativo mediante chiavi esterne e transazioni. Un cambiamento a giorno, zona o ritrovamenti ritira le vecchie segnalazioni prima di una nuova condivisione. Le copie di recupero dipendono dal piano Cloudflare; non promettere una cancellazione immediata dalle copie di backup.

Limiti per IP pseudonimizzato e account, corpi JSON fino a 250 KB, diario fino a 1000 voci, segnalazioni fino a 30 al giorno. IP trasformato con un sale privato e data quotidiana; non archiviato in chiaro nelle tabelle applicative. Non è una garanzia contro utenti con più dispositivi o identificazioni errate. Cloudflare può trattare log di connessione secondo le proprie impostazioni.

## Valore scientifico

Quantità ordinali 0–3, non conteggi di esemplari o biomassa. Zero soltanto con ricerca esplicita. Deduplicazione per account/giorno/zona/specie. I conteggi sono dichiarati e non certificati. Un account non equivale a un contributore indipendente.

Il segnale condiviso influenza soltanto l’ordine dei consigli, entro ±10%, dopo tre account con almeno 24 ore e due giorni diversi. Il numero 0–10 rimane un indice di condizioni di crescita non validato. Le previsioni salvate hanno data server; i confronti per specie richiedono un piano salvato prima dell’inizio dichiarato. Nessuna taratura automatica dei coefficienti biologici: serviranno dati di verifica indipendenti.

## Verifica e gestione

- `npm ci`, `npm test`, `npx wrangler deploy --dry-run`.
- Locale: `npx wrangler dev --local --port 8787 --var APP_ORIGIN:http://localhost:8787`.
- Browser: `npm run test:browser` avvia un Worker locale e usa un autenticatore WebAuthn virtuale Chromium.
- Dopo il deploy: `/api/community/status` deve rispondere `enabled:true`; `/summary` deve distinguere zero osservazioni da servizio indisponibile. Verificare creazione passkey, diario privato, logout e ritiro.
- Per backup e recupero usare esportazione D1 e [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), secondo il piano; il diario offre anche export individuale. Nessun backup a un secondo fornitore è configurato.

Riferimenti: [provisioning automatico](https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning), [D1](https://developers.cloudflare.com/d1/), [SimpleWebAuthn](https://simplewebauthn.dev/).
