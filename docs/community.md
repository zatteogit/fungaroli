# Taccuino privato e osservazioni collettive

Servizio attivo su https://fungaroli.zatteo.workers.dev dal 13 ottobre 2026: provisioning D1 e registrazione con passkey verificati sul dominio pubblico.

## Architettura

Il Worker esistente serve il sito e `/api/community/*`. **Cloudflare D1**, binding `COMMUNITY_DB`, contiene profili, chiavi pubbliche WebAuthn, sessioni, sfide, diario e segnalazioni. Il vecchio namespace KV `DIARIO` resta collegato perché ospita la cache meteo condivisa. Il vecchio diario con codice che usava lo stesso namespace è dismesso dal 22/10/2026: `/api/diario` risponde 410 «servizio dismesso» senza leggere né scrivere, e l’app non offre importazioni. Le voci `entry:` rimaste si esportano e poi si cancellano con Wrangler: procedura in [legale.md](legale.md), §6.5.

Wrangler 4.149.0 può creare automaticamente il database `fungaroli-community` al deploy quando il binding non ha `database_id`. Il token usato dal build Cloudflare deve poter creare e scrivere database D1. La migrazione idempotente `migrations/0001_community.sql` viene applicata al primo accesso all’API con un batch di istruzioni complete. Questa configurazione non garantisce una collocazione esclusivamente europea: per un vincolo di giurisdizione occorre configurare il servizio nel pannello Cloudflare.

Lo stesso database ospita le risposte al questionario per i cercatori esperti (`/questionario`, tabelle `survey_responses` e `survey_rate`, migrazione `0004_survey.sql`): invio senza profilo, lettura e cancellazione solo per gli amministratori del CMS. Vedi [questionario.md](questionario.md).

`APP_ORIGIN` fissa origine autorizzata e RP ID delle passkey. Modificarla cambia il dominio su cui funzionano le credenziali: non farlo a caso. Il nome del Worker e la configurazione del vecchio KV vengono preservati. Il cron quotidiano rimuove sfide, sessioni e contatori scaduti, compresi quelli del questionario.

## Identità e privacy

Passkey discoverable e verifica dell’utente obbligatoria; nessuna password, email, attestation obbligatoria o chiave privata sul server. SDK SimpleWebAuthn mantenuto, bundle browser locale. Token casuali di sessione/sfida in cookie `__Host-`, Secure, HttpOnly, SameSite=Strict; nel database restano solo hash SHA-256. Le mutazioni verificano l’origine, la sfida WebAuthn è consumata una sola volta e il contatore è aggiornato senza sovrascrivere accessi concorrenti. Sessione di 30 giorni e sfida di 5 minuti.

Ogni lettura e scrittura del diario usa l’account ricavato dalla sessione, mai un proprietario inviato dal client. Cache locale separata per account. Note e base di partenza private. La base facoltativa conserva nome e coordinate nel profilo su D1, arrotondate a 2 decimali (circa 1 km) da `normalizeBase` in client e server; il GPS viene richiesto solo con il pulsante scelto dall’utente. Le basi salvate prima del 22/10/2026 con 6 decimali vengono riscritte dalla migrazione idempotente `0014_base_precision.sql`, applicata a runtime, e arrotondate anche in lettura. La base non entra nella summary delle segnalazioni. La condivisione è una scelta esplicita. La summary pubblica espone soltanto aggregati per zona/specie (e per provincia, quando le zone non bastano) negli ultimi sette giorni, con almeno 3 profili distinti attivi da almeno 24 ore e 2 giorni diversi: le righe dei profili più recenti non entrano né nella soglia né nei totali (decisione del 22/10/2026). Nessun nome, identificativo personale, numero di contributori o di giorni: resta solo `establishedContributors`, troncato a 10, che serve al peso del segnale. Il gestore conserva accesso amministrativo al database.

Ritiro, cancellazione della voce ed eliminazione account rimuovono le segnalazioni dal database operativo mediante chiavi esterne e transazioni. Dal 22/10/2026 `DELETE /api/community/account` cancella esplicitamente, in un’unica transazione, osservazioni condivise, segnalazioni, conferme degli avvisi, base, taccuino, sessioni, passkey, sfide e contatori legati all’ID del profilo, senza dipendere solo da `ON DELETE CASCADE` (test `tests/community-account.test.mjs`, con chiavi esterne attive e disattivate). Il client toglie poi dal dispositivo la copia locale del taccuino e le sue foto (`clearNotebookStore` in `js/notebook-photo-store.js`). Restano fuori dalla cancellazione: le copie di Time Travel di D1 per il periodo del piano, la cache dei percorsi (sotto, al massimo 30 giorni) e, per editor e amministratori, l’ID nelle revisioni del CMS. Un cambiamento a giorno, zona o ritrovamenti ritira le vecchie segnalazioni prima di una nuova condivisione. Le copie di recupero dipendono dal piano Cloudflare; non promettere una cancellazione immediata dalle copie di backup.

Limiti per IP pseudonimizzato e account, corpi JSON fino a 250 KB, diario fino a 1000 voci, segnalazioni fino a 30 al giorno. IP trasformato con un sale privato e data quotidiana; non archiviato in chiaro nelle tabelle applicative. Non è una garanzia contro utenti con più dispositivi o identificazioni errate. Cloudflare può trattare log di connessione secondo le proprie impostazioni.

## Valore scientifico

Quantità ordinali 0–3, non conteggi di esemplari o biomassa. Zero soltanto con ricerca esplicita. Deduplicazione per account/giorno/zona/specie. I conteggi sono dichiarati e non certificati. Un account non equivale a un contributore indipendente.

Il segnale condiviso influenza soltanto l’ordine dei consigli, entro ±10%, dopo tre account con almeno 24 ore e due giorni diversi. Il numero 0–10 rimane un indice di condizioni di crescita non validato. Le previsioni salvate hanno data server; i confronti per specie richiedono un piano salvato prima dell’inizio dichiarato. Nessuna taratura automatica dei coefficienti biologici: serviranno dati di verifica indipendenti.

## Verifica e gestione

- `npm ci`, `npm test`, `npx wrangler deploy --dry-run`.
- Locale: `npx wrangler dev --local --port 8787 --var APP_ORIGIN:http://localhost:8787`.
- Browser: `npm run test:browser` avvia un Worker locale e usa un autenticatore WebAuthn virtuale Chromium.
- Dopo il deploy: `/api/community/status` deve rispondere `enabled:true`; `/summary` deve distinguere zero osservazioni da servizio indisponibile. Verificare creazione passkey, diario privato, logout e ritiro.
- Per backup e recupero usare esportazione D1 e [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), secondo il piano. Nessun backup a un secondo fornitore è configurato.

## Copia dei propri dati

Decisione di Matteo del 22/10/2026 (art. 15 e 20 GDPR). Nel profilo, «Scarica i miei dati» chiama `GET /api/community/export`: sessione obbligatoria, al massimo 5 file al giorno per profilo. Il file JSON `fronda-export-v1` contiene profilo (ID, nome, data di creazione), metadati delle passkey (data, trasporti, backup), base, voci del taccuino con le foto, segnalazioni con tutte le colonne utili, osservazioni condivise con versione e data del consenso, conferme degli avvisi. Esclusi hash delle sessioni, sfide, chiavi pubbliche, contatori e sale degli IP. Le voci arrivano in streaming a pagine di 50, ordinate per ID; l’ultimo campo `complete:true` permette al client di scartare un file troncato. Senza profilo, nel pannello del taccuino, «Scarica il taccuino» salva lo stesso formato con `scope:'device'`: voci di localStorage, foto da IndexedDB e ricevuta degli avvisi (`js/data-export.js`). Non esiste un’importazione.

Riferimenti: [provisioning automatico](https://developers.cloudflare.com/workers/wrangler/configuration/#automatic-provisioning), [D1](https://developers.cloudflare.com/d1/), [SimpleWebAuthn](https://simplewebauthn.dev/).

## Base di partenza

Dal profilo si cerca un comune/località con Photon oppure si usa la posizione attuale. Le coordinate vengono salvate con `PUT /api/community/profile`, legate esclusivamente all’account della sessione. Nome e coordinate si leggono nella propria sessione; si rimuovono con “Ripristina Rieti” o eliminando il profilo. Il nome del profilo e gli identificativi non vengono inviati ai servizi geografici.

`GET /api/community/places?q=…` inoltra una ricerca esplicita a Photon. `POST /api/community/travel` calcola una matrice OSRM/OpenStreetMap per massimo 50 destinazioni, usando la base salvata dal server. Autenticazione, controllo dell’origine e limiti di frequenza proteggono le richieste. I risultati stradali hanno una cache Cloudflare privata per account (`worker/travel-cache.js`): sono considerati freschi per 6 ore e conservati al massimo 30 giorni, come ripiego se OSRM non risponde. La chiave è un hash di profilo, base e destinazione; il valore contiene solo destinazione, minuti, chilometri e ora del calcolo. Le voci non vengono cancellate con il profilo e scadono da sole. Il browser ne tiene una copia in localStorage, con la stessa durata, rimossa quando cambiano profilo o base. Le risposte dell’API non sono messe in cache dal browser. Non sono tempi con traffico. Se il servizio non risponde o una destinazione non è raggiungibile, l’interfaccia indica i chilometri in linea d’aria e omette gli orari di partenza calcolati.

La preferenza “Vicino alla base”, la comodità personale e i navigatori usano la partenza scelta. L’indice ambientale e l’affollamento di riferimento della zona restano indipendenti dalla base personale. Le caratteristiche del tragitto stradale precalcolato da Rieti non vengono attribuite ai nuovi percorsi.
