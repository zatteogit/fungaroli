# Meteo: cache e aggiornamento in background

## Revisione del 25 ottobre 2026 · frequenze approvate

Questa sezione descrive il ramo `codex/weather-sync-stable` e supera il flusso su richiesta descritto nella cronologia sotto. **Matteo ha confermato il rilascio e le frequenze: uscita ogni 30 minuti, crescita ogni 4 ore.** Le verifiche di produzione sono registrate nella sezione di rilascio.

### Responsabilità e dati

- Cloudflare acquisisce tutte le zone pubblicate anche senza visite. Il cron `* * * * *` distribuisce le zone: uscita ogni 30 minuti, crescita ogni 240 minuti, in slot UTC. Con 36 zone, un passaggio normale tratta al massimo tre profili/zona, senza scaricare ed elaborare tutto il catalogo insieme.
- Le copie compatte correnti stanno in `CMS_DB.weather_live_cache`, con chiave della query, acquisizione originale, scadenza e payload. D1 è già configurato: non si creano nuovi binding. Una scrittura meno recente non sostituisce una più nuova. La pulizia giornaliera elimina i record scaduti.
- KV `DIARIO` resta un ripiego di **sola lettura** per le copie anteriori al rilascio, incluse le migrazioni dei profili. Non riceve i rinnovi programmati: 36 zone ogni 30 minuti più la crescita supererebbero le 1.000 scritture giornaliere del piano KV gratuito. Non si presume quale piano abbia l’account.
- D1 `weather_refresh_jobs` assegna ogni lavoro con una scrittura condizionata atomica. Eventi duplicati o isolate diversi non avviano lo stesso slot due volte. Errori: due nuovi tentativi, dopo 2 e 10 minuti, massimo tre tentativi per slot; anche un lavoro interrotto è recuperabile alla scadenza della concessione. Un errore conserva l’ultima copia acquisita. Log `weather-refresh-incomplete` e metriche esistenti rendono visibili i fallimenti.
- `/api/weather/v1/forecast` distribuisce esclusivamente copie salvate, una zona alla volta. Non chiama Open-Meteo, neppure per una cache mancante, un vecchio client o l’header di aggiornamento forzato. Le vecchie richieste globali ricevono 409 e l’invito a ricaricare; non aprono una via alternativa al fornitore. Le copie mancanti ricevono 503 con codice riconoscibile, senza un secondo tentativo immediato del browser.

### Sincronizzazione nel dispositivo

Le copie locali di entrambi i profili vengono lette subito e mostrate nello stesso passaggio. Le risposte di rete aggiornano la cache locale per zona, ma la vista riceve insieme crescita e uscita al termine del tentativo, anche se parziale. Una risposta più vecchia, un errore o lo storage del dispositivo non disponibile non eliminano i dati già in memoria. Il controllo della revisione ignora i tentativi annullati.

Al primo avvio senza copie, i dati di crescita già ricevuti consentono di consultare la mappa mentre il meteo pratico è ancora in arrivo; non si inventano condizioni favorevoli. Gli aggiornamenti successivi conservano la vista disponibile fino alla ricezione congiunta.

La pagina visibile ricontrolla le copie ogni cinque minuti, al ritorno nell’app e dopo la riconnessione, senza sovrapporre sincronizzazioni. «Aggiorna» rilegge le copie del server: non provoca acquisizioni dal fornitore. La consegna resta suddivisa per zona, con concorrenza limitata; non rappresenta un’emissione simultanea di tutte le zone. Ogni serie conserva la propria data.

Le schede Funghi, Piante e Sentieri vengono aggiornate sul posto. Le sezioni hanno un’identità stabile anche quando una nota entra o esce dall’HTML. La barra dei giorni non viene ricentrata durante un aggiornamento. I cambiamenti che sostituirebbero le proposte della home attendono sempre «Aggiorna» nella barra delle nuove proposte, anche subito dopo l’apertura; gli avvisi di peggioramento restano immediati. Il pannello contestuale aperto rinvia l’aggiornamento della scheda fino alla chiusura.

### Freschezza, quota e avvio

La crescita è da rinnovare dopo quattro ore e resta inutilizzabile per gli indici correnti oltre 24 ore. Il meteo pratico mantiene le cautele già decise: da aggiornare oltre un’ora, inutilizzabile oltre tre. La conservazione di sei giorni non prolunga queste validità; nessun timestamp viene rinnovato dalla lettura.

Con 36 zone e 108 fasce: stima prudente già usata dalle metriche, crescita 540 × 6 = 3.240, uscita 36 × 48 = 1.728, archivio quotidiano 108: **5.076 chiamate ponderate al giorno**, prima degli errori e dei tentativi aggiuntivi. È una stima, non una misura o garanzia di quota. I tentativi sono limitati per lavoro; un guasto prolungato va controllato nelle metriche. Nessun piano a pagamento è attivato.

Per il rilascio: applicare la migrazione 0017 a `CMS_DB` (le tabelle hanno anche inizializzazione idempotente), verificare trigger e acquisizioni reali. Il riempimento iniziale distribuito richiede fino a quattro ore per la crescita e 30 minuti per l’uscita: prima di dichiarare il passaggio concluso verificare 72 copie correnti per le geometrie pubblicate e la loro età, oltre a home, zona e mappa. Le copie KV esistenti attenuano la transizione, ma non garantiscono che tutte le zone siano già coperte. I test locali non provano l’esecuzione dei cron di produzione.

**Verifiche locali del ramo (25/10).** 571 test unitari superati, compreso il percorso HTTP pubblico senza chiamate al fornitore. Dry-run Wrangler superato con `ESBUILD_WORKER_THREADS=0`; `git diff --check` pulito. 32 scenari browser pertinenti esercitati con esito positivo su server statico e API simulate: stati home, cache, errore e recupero, applicazione congiunta, calendario, pannelli mappa, schede Funghi/Piante/Sentieri. Il primo scenario home è passato al rilancio singolo dopo un errore di caricamento iniziale nel gruppo. I due vecchi casi di navigazione che cercano `.tab-search` (assente nell’HTML corrente) restano esclusi dal gruppo mirato; nessuna modifica alla navigazione per farli passare. Il server Workers locale non si avvia in questo ambiente (`spawn EBADF` di esbuild/workerd): i browser non validano i binding Cloudflare reali e non è stata eseguita la suite completa. Il cron e la copertura del server di produzione restano da verificare dopo l’approvazione e il rilascio.

Fonti tecniche verificate il 25/10/2026: [KV, limiti](https://developers.cloudflare.com/kv/platform/limits/), [KV, consistenza](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [D1, limiti](https://developers.cloudflare.com/d1/platform/limits/), [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Open-Meteo, quota e pesi](https://open-meteo.com/en/pricing).

## Cronologia precedente al 25 ottobre

Aggiornamento del 14 ottobre 2026. L'interfaccia non attende tutte le zone prima di mostrare i dati disponibili. La copia locale viene letta subito; il servizio aggiorna soltanto le zone mancanti o da aggiornare. Le risposte riuscite vengono salvate anche quando altre zone falliscono.

## Due profili indipendenti

- **Crescita**: 62 giorni passati e 8 di previsione per ogni fascia di quota. Giornalieri: pioggia, temperatura media, minima e massima, ET₀ FAO-56. Orari, ridotti a medie giornaliere: umidità del suolo a 3–9 e a 9–27 cm, temperatura del suolo a 6 cm. L'umidità a 9–27 cm e l'ET₀ si aggiungono dal modello 2.1.0 (seconda tornata): si salvano nelle previsioni datate, non entrano nell'indice.
- **Uscita**: previsione oraria alla fascia centrale; pioggia, probabilità, codici WMO, raffiche e temperatura. Il suo ritardo non impedisce di mostrare i dati di crescita.

Entrambi si aggiornano dopo un'ora. La data mostrata è quella di acquisizione originale, mai quella di rilettura della cache. L'indicazione globale usa la data più vecchia tra le zone disponibili; ciascuna serie conserva il proprio timestamp.

## Server

`worker/weather-provider.js` accetta esclusivamente coordinate, quote e profili pubblicati. Le richieste correnti sono per zona. KV `DIARIO` conserva `weather:v3:<SHA-256 della query>`: il cambio di giorno non invalida una previsione che copre già la nuova data. La lettura migra anche la precedente chiave giornaliera v2.

Una copia entro un'ora viene restituita subito. Una copia più vecchia, conservata fino a sei giorni anche se non copre più oggi, viene restituita subito e aggiornata con `ctx.waitUntil`. Le richieste concomitanti sullo stesso isolate condividono il download. L'header `x-weather-refreshing: 1` fa richiedere al browser il risultato con `x-weather-refresh: 1`; il follow-up attende lo stesso lavoro. In caso di errore rimane la copia datata. Non è un lock distribuito tra isolate o regioni Cloudflare.

Timeout upstream 15 secondi. I grandi batch delle pagine precedenti restano un percorso di compatibilità in streaming, senza cache: aggiornare l'app per usare il nuovo flusso per zona. Le medie del suolo richiedono almeno 24 ore valide; dati mancanti non diventano zero.

### Profilo di transizione per le pagine aperte

La query di crescita è cambiata con il modello 2.1.0 (due variabili in più). Il Worker accetta solo le query che conosce, quindi tiene due profili:

- `growth`: la query nuova, con `et0_fao_evapotranspiration` e `soil_moisture_9_to_27cm` (`GROWTH_DAILY` e `GROWTH_HOURLY` in `js/weather-data.js`, condivisi da browser e Worker);
- `growthLegacy`: la query della versione precedente (fino alla v319), con gli stessi luoghi. Una scheda rimasta aperta durante il rilascio continua a ricevere il meteo invece di un errore 422, finché non si ricarica.

La chiave KV dipende dalla query, quindi la query nuova parte senza copia. Se trova la copia salvata con la query precedente (stessi luoghi e quote), la restituisce subito come copia datata, ma mai come `hit`: l'aggiornamento parte sempre e porta i campi nuovi. La copia vecchia si valida con la propria query: le medie del suolo richieste sono quelle degli strati orari di quella query. Nel browser le copie salvate prima del cambio restano valide con la stessa chiave: i campi nuovi sono facoltativi e valgono una serie di `null`, cioè dato mancante. Si rinnovano alla scadenza normale.

L'umidità del suolo è una frazione di volume: vale solo tra 0 e 1. Un valore fuori intervallo è un dato non valido e vale `null`, sia ora per ora sia nelle medie giornaliere compatte del Worker, del KV e del browser (`soilFraction` in `js/weather-data.js`). Prima della seconda tornata il controllo c'era solo nella via oraria.

**Interpretazione**: finché restano aperte pagine della versione precedente, lo stesso luogo può essere rinnovato con due query diverse, quindi pesare il doppio sulla quota di Open-Meteo. Dura fino a quando quelle pagine si ricaricano.

## Dispositivo

`js/weather-cache.js` conserva record per zona nelle chiavi `fungaroli:weather:zones:v3` e `fungaroli:outing:zones:v3`, con firma di coordinate e quote. Migra le vecchie copie v2 quando la geometria corrisponde, poi le elimina; elimina anche quelle scadute. Conservazione massima sei giorni, distinta dalla validità scientifica. JSON malformato, campi obbligatori mancanti, timestamp futuri e geometrie diverse vengono rifiutati (la data inviata dal server, se è avanti rispetto all'orologio del dispositivo, viene prima riportata all'ora del dispositivo: altrimenti una copia appena scaricata risulterebbe dal futuro); una risposta meno recente non sovrascrive una copia più nuova. Storage disabilitato o pieno non impedisce l'uso dei dati live.

Il browser esegue al massimo tre richieste per profilo contemporaneamente, con 20 secondi per zona e 45 secondi complessivi per profilo; crescita e uscita partono insieme. Un nuovo aggiornamento annulla quello precedente; le risposte obsolete non devono ridisegnare la pagina.

## Interfaccia e limiti

La data e il pulsante di aggiornamento indicano il lavoro in corso; una piccola barra di stato segnala il lavoro in background. I primi dati disponibili fanno sparire il loader iniziale. Un aggiornamento completo o parziale riceve un feedback breve.

Durante l'aggiornamento rimane l'ordine delle proposte già visualizzate; i valori vengono ricalcolati. Cambiare giorno o filtri ricalcola anche l'ordine. Le foto e i link corrispondenti della home vengono conservati. Nelle schede rimangono accordion e posizione di lettura; le schede sotto un pannello contestuale si aggiornano quando viene chiuso. Sulla mappa si aggiornano le zone interessate e rimane il tipo di pannello aperto (zona, sentiero o imbocco).

Il calendario della home e della zona usa tre righe: giorno, data, indice e meteo affiancati. Lo spazio del meteo resta vuoto quando i dati mancano; il loro arrivo non sposta data e indice né cambia l'altezza delle tile. Le tessere sono alte 88 px, con nomi dei giorni per esteso e un solo simbolo del fungo accanto all'indice. «Settimana» centra il proprio indice, senza inventare un meteo unico per l'intero periodo. Il calendario della mappa, composto solo dalle date, rimane distinto.

- Oltre **24 ore** non viene calcolato l'indice fungino per oggi e il futuro.
- Il meteo pratico più vecchio di **un'ora** viene dichiarato non aggiornato; oltre **tre ore** non è utilizzabile per valutare l’uscita. La conservazione della copia sul server resta di sei giorni, come sul dispositivo, e non rinnova la data originale.
- Dati mancanti non significano tempo asciutto, assenza di funghi o assenza di piante.
- Anche senza copie meteo, la modalità Funghi mostra le zone esplorabili e le schede, con un avviso esplicito e il tentativo di aggiornamento; non inventa previsioni o indici.
- Non sono stati introdotti prefetch periodici, quote di servizio a pagamento o una garanzia di disponibilità del provider.

## Misure

Aggiornamento del 14/10/2026. Il Worker conta, per ora e per profilo, ogni risposta all'app e ogni chiamata a Open-Meteo. I contatori stanno in D1 (`CMS_DB`, tabella `weather_metrics`, schema in `migrations/0006_weather_metrics.sql`, creata al primo uso) e vengono cancellati dopo 180 giorni dal cron giornaliero. Non contengono IP, account o identificativi. Una scrittura fallita non blocca né rallenta il meteo: avviene in `waitUntil` e gli errori vengono ignorati. D1 condivide il budget di scritture con account, diario e redazione. Per questo le risposte all'app, circa 30 per apertura, si sommano in memoria e si scrivono al massimo una volta al minuto per isolate, oppure insieme alla successiva chiamata a Open-Meteo. Se l'isolate si chiude prima, si perdono i conteggi di quel minuto: i numeri sulle risposte sono quindi un minimo, non un totale esatto. Le chiamate a Open-Meteo si scrivono una per una.

- **Risposte all'app** (`served:*`): `hit` (copia entro un'ora), `stale` (copia valida restituita subito, aggiornamento in background), `miss` (l'app ha aspettato Open-Meteo), `stale-fallback` (Open-Meteo ha fallito, restituita la copia precedente), `legacy` (vecchie pagine in streaming), `error`.
- **Chiamate a Open-Meteo** (`upstream:*`): `ok`, `429`, `error` (altri stati HTTP), `timeout`, `network`, `aborted` (annullata perché un'altra parte dello stesso download era fallita), `invalid` (risposta incompleta). Per ognuna: durata fino ai dati letti, punti richiesti e peso stimato.

**Dove leggerle.** Da amministratore, con la sessione attiva nel browser: `https://fungaroli.zatteo.workers.dev/api/cms/v1/metrics/weather?days=30`. Per ogni giorno restituisce:
- chiamate, quota giornaliera stimata, ora di picco;
- errori e 429;
- latenza media e massima, quota sotto 1, 3 e 10 secondi;
- quota di risposte servite senza attesa (`hit` + `stale`).

Le righe orarie complete sono nel campo `rows`. In alternativa, dal pannello Cloudflare (D1 → `fungaroli-content` → Console): `SELECT day, profile, event, SUM(count), SUM(weighted) FROM weather_metrics GROUP BY 1,2,3 ORDER BY 1 DESC`.

**Quota di Open-Meteo.** Il piano gratuito, per uso non commerciale, ha questi limiti: 600 chiamate al minuto, 5.000 all'ora, 10.000 al giorno, 300.000 al mese. Una richiesta conta come più chiamate se supera 10 variabili o 2 settimane di dati per punto, in modo frazionario (Open-Meteo, pagina prezzi, letta il 14/10/2026: https://open-meteo.com/en/pricing). La documentazione non dice come vengano contati i punti di una richiesta multipla. *Ipotesi prudente* usata nelle metriche: ogni punto conta come una chiamata, moltiplicata per `max(1, variabili/10) × max(1, giorni/14)`.

Con 15 zone (45 fasce di quota) un aggiornamento completo pesava circa:
- **crescita:** 45 punti × 5 = **225**, perché 6 variabili su 70 giorni (62 passati e 8 di previsione) valgono 5 chiamate per punto;
- **uscita:** 15 punti × 1 = **15**;
- **totale:** circa **240** chiamate stimate.

Il server rinnova ogni zona al massimo una volta l'ora, quindi il tetto teorico con visite continue era circa **5.800 al giorno** e 240 all'ora.

**Aggiornamento del 21/10/2026.** Con il modello 2.1.0 la crescita chiede 8 variabili invece di 6: restano sotto 10, quindi il peso per punto non cambia (5). Le zone però sono 36 dal 19/10 (108 fasce di quota). Con la stessa ipotesi prudente un aggiornamento completo pesa circa 108 × 5 = **540** per la crescita più **36** per l'uscita, cioè **576**. *Interpretazione*: il tetto teorico con visite continue diventa circa **13.800 al giorno**, sopra il limite giornaliero di 10.000. Non vuol dire che oggi lo si superi: dipende dalle visite, e le misure dicono quanto davvero si consuma. È un motivo in più per guardarle prima di aggiungere zone o variabili. *Interpretazione*: il margine sul limite giornaliero è meno ampio di quanto sembri, per due motivi:
- un doppio download tra isolate diversi (limite noto, vedi «Server») può avvicinare o superare le 10.000 chiamate;
- il grosso del peso viene dai 62 giorni passati, riscaricati a ogni rinnovo anche se cambiano poco.

Prima di scegliere prefetch, lock distribuito, piano a pagamento o una finestra passata scaricata una sola volta al giorno, guardare almeno due settimane di misure:
- `weightedEstimate` e `peakHourWeightedEstimate` rispetto ai limiti;
- `rateLimited`;
- `servedWithoutWaiting`.

## Archivio quotidiano delle previsioni · dal 24 ottobre 2026

Decisione D1 di Matteo (16/10/2026): l'unico archivio prospettico dello stesso prodotto meteo usato dall'app, indipendente dalle previsioni salvate dagli utenti. Non cambia indice né interfaccia.

- **Cosa salva.** Per ogni zona e fascia di quota, una volta al giorno: valori giornalieri del profilo di crescita dal giorno prima (D−1) a D+7, con le medie del suolo e l'ET₀, nulli conservati come nulli. Più giorno di emissione (Europe/Rome), ora del download, fornitore, modello (`best_match`), versione del profilo (`growth-v2`) e cella restituita da Open-Meteo (latitudine, longitudine, quota).
- **Dove.** Tabella `forecast_archive` in `COMMUNITY_DB` (migrazione 0016, creata anche a runtime), chiave unica zona + fascia + giorno di emissione. Nessun dato personale.
- **Quando.** Cron `*/5 4,5 * * *`: un passaggio ogni 5 minuti fra le 4 e le 5:55 UTC, due zone per volta (`worker/forecast-archive.js`). Un passaggio solo con tutte le zone rischierebbe il limite di CPU del Worker, com'è già successo al meteo globale. Un passaggio fallito lascia le zone mancanti al successivo; a lavoro finito il cron non chiama più Open-Meteo. Le pulizie restano sul cron delle 3:17.
- **Costo.** *Interpretazione* con la regola di peso di `requestWeight`: 108 punti, 8 variabili e 9 giorni, cioè circa **108 chiamate al giorno**, l'1% del limite gratuito. Le chiamate finiscono nelle misure con il profilo `archive`.
- **Da verificare dopo il rilascio.** Per 7 giorni: `SELECT issued_on, COUNT(*) FROM forecast_archive GROUP BY issued_on` deve dare 108 righe al giorno. Annotare qui la dimensione reale di una riga.
- **Fonte.** Open-Meteo, CC BY 4.0 (https://open-meteo.com/en/licence).

## Verifiche riproducibili

`npm test`; `npx playwright test tests/browser/weather.spec.mjs tests/browser/weather-background.spec.mjs tests/browser/map-popover.spec.mjs`.

Copertura: cache immediata prima di rete bloccata; salvataggio parziale e riapertura; timestamp/quote/limiti; storage pieno; risposta vecchia; refresh server coalescente; cambio di giorno; timeout/429/retry; foto e consiglio stabili a 390 e 1280 px; pannelli della mappa utilizzabili durante l'arrivo del meteo. Misure (`tests/weather-metrics.test.mjs`, su SQLite reale): schema allineato alla migrazione, aggregazione oraria e giornaliera, peso delle richieste, eventi `served`/`upstream` per hit, miss, 429, errore e risposta non valida, database assente o guasto senza effetti sul meteo, pulizia dopo 180 giorni.

## Recupero in caso di disservizio · 20 ottobre 2026

La conservazione KV è stata separata dai limiti di utilizzo: prima le copie venivano eliminate dopo 24 ore (crescita) e tre ore (uscita), impedendo il recupero da un dispositivo nuovo durante un guasto più lungo. Ora entrambi i profili restano disponibili per sei giorni, senza cambiare timestamp, soglie dei modelli o indicazioni di validità. Le copie senza il giorno corrente possono essere consultate ma non producono un indice corrente.

Il recupero meteo non viene più interrotto da un errore nella lettura delle zone dal CMS: in quel caso usa il catalogo distribuito con la release, con le stesse restrizioni delle coordinate. Se non esiste alcuna copia, anche la modalità Funghi usa il calendario senza dati climatici: valori nulli, nessun indice o meteo favorevole inventato, collegamenti alle zone e alle schede. L’avviso spiega il limite e offre Riprova.

La nuova durata si applica alle copie salvate dopo la pubblicazione: non ricrea record KV già eliminati. Non è possibile attribuire retroattivamente un errore a una specifica causa senza i log della richiesta del dispositivo.
