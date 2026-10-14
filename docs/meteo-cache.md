# Meteo: cache e aggiornamento in background

Aggiornamento del 14 ottobre 2026. L'interfaccia non attende tutte le zone prima di mostrare i dati disponibili. La copia locale viene letta subito; il servizio aggiorna soltanto le zone mancanti o da aggiornare. Le risposte riuscite vengono salvate anche quando altre zone falliscono.

## Due profili indipendenti

- **Crescita**: 62 giorni passati e 8 di previsione; pioggia, temperature e medie giornaliere del suolo per ogni fascia di quota.
- **Uscita**: previsione oraria alla fascia centrale; pioggia, probabilità, codici WMO, raffiche e temperatura. Il suo ritardo non impedisce di mostrare i dati di crescita.

Entrambi si aggiornano dopo un'ora. La data mostrata è quella di acquisizione originale, mai quella di rilettura della cache. L'indicazione globale usa la data più vecchia tra le zone disponibili; ciascuna serie conserva il proprio timestamp.

## Server

`worker/weather-provider.js` accetta esclusivamente coordinate, quote e profili pubblicati. Le richieste correnti sono per zona. KV `DIARIO` conserva `weather:v3:<SHA-256 della query>`: il cambio di giorno non invalida una previsione che copre già la nuova data. La lettura migra anche la precedente chiave giornaliera v2.

Una copia entro un'ora viene restituita subito. Una copia più vecchia, ancora entro il limite del profilo e completa per oggi, viene restituita subito e aggiornata con `ctx.waitUntil`. Le richieste concomitanti sullo stesso isolate condividono il download. L'header `x-weather-refreshing: 1` fa richiedere al browser il risultato con `x-weather-refresh: 1`; il follow-up attende lo stesso lavoro. In caso di errore rimane la copia datata. Non è un lock distribuito tra isolate o regioni Cloudflare.

Timeout upstream 15 secondi. I grandi batch delle pagine precedenti restano un percorso di compatibilità in streaming, senza cache: aggiornare l'app per usare il nuovo flusso per zona. Le medie del suolo richiedono almeno 24 ore valide; dati mancanti non diventano zero.

## Dispositivo

`js/weather-cache.js` conserva record per zona nelle chiavi `fungaroli:weather:zones:v3` e `fungaroli:outing:zones:v3`, con firma di coordinate e quote. Migra le vecchie copie v2 quando la geometria corrisponde, poi le elimina; elimina anche quelle scadute. Conservazione massima sei giorni, distinta dalla validità scientifica. JSON malformato, campi obbligatori mancanti, timestamp futuri e geometrie diverse vengono rifiutati (la data inviata dal server, se è avanti rispetto all'orologio del dispositivo, viene prima riportata all'ora del dispositivo: altrimenti una copia appena scaricata risulterebbe dal futuro); una risposta meno recente non sovrascrive una copia più nuova. Storage disabilitato o pieno non impedisce l'uso dei dati live.

Il browser esegue al massimo tre richieste per profilo contemporaneamente, con 20 secondi per zona e 45 secondi complessivi per profilo; crescita e uscita partono insieme. Un nuovo aggiornamento annulla quello precedente; le risposte obsolete non devono ridisegnare la pagina.

## Interfaccia e limiti

La data e il pulsante di aggiornamento indicano il lavoro in corso; una piccola barra di stato segnala il lavoro in background. I primi dati disponibili fanno sparire il loader iniziale. Un aggiornamento completo o parziale riceve un feedback breve.

Durante l'aggiornamento rimane l'ordine delle proposte già visualizzate; i valori vengono ricalcolati. Cambiare giorno o filtri ricalcola anche l'ordine. Le foto e i link corrispondenti della home vengono conservati. Nelle schede rimangono accordion e posizione di lettura; le schede sotto un pannello contestuale si aggiornano quando viene chiuso. Sulla mappa si aggiornano le zone interessate e rimane il tipo di pannello aperto (zona, sentiero o imbocco).

- Oltre **24 ore** non viene calcolato l'indice fungino per oggi e il futuro.
- Il meteo pratico più vecchio di **un'ora** viene dichiarato non aggiornato; oltre **tre ore** non è utilizzabile.
- Dati mancanti non significano tempo asciutto, assenza di funghi o assenza di piante.
- Il sistema attenua ritardi e indisponibilità del provider; una prima apertura senza copie salvate richiede comunque almeno una risposta valida.
- Non sono stati introdotti prefetch periodici, quote di servizio a pagamento o una garanzia di disponibilità del provider.

## Verifiche riproducibili

`npm test`; `npx playwright test tests/browser/weather.spec.mjs tests/browser/weather-background.spec.mjs tests/browser/map-popover.spec.mjs`.

Copertura: cache immediata prima di rete bloccata; salvataggio parziale e riapertura; timestamp/quote/limiti; storage pieno; risposta vecchia; refresh server coalescente; cambio di giorno; timeout/429/retry; foto e consiglio stabili a 390 e 1280 px; pannelli della mappa utilizzabili durante l'arrivo del meteo.
