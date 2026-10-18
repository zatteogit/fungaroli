# Avvisi, accettazione e installazione del prototipo

Decisioni del 18 ottobre 2026: Fronda è un esperimento personale di Matteo; l’uso serve esclusivamente a provare e migliorare il prototipo. Avvertenze, privacy e cookie policy hanno una sola conferma. Senza conferma l’interfaccia dell’app rimane bloccata.

## Testi e versione

`data/legal.json` contiene avvisi e informative. La versione passa a **4**; `verified_on` rimane **2026-10-16**, data dell’ultima verifica delle norme, senza far passare questa revisione di interfaccia per un nuovo controllo normativo. `js/legal-notice.js` integra anche snapshot CMS precedenti con il minimo approvato: natura del prototipo, cookie policy e trattamento delle ricevute. Non sostituisce le norme pubblicate. Le nuove revisioni editoriali rimangono autorevoli.

La cookie policy descrive i due cookie effettivi di `worker/community.js`: sfida passkey, 5 minuti; sessione, 30 giorni; entrambi Secure/HttpOnly/SameSite=Strict. Descrive anche localStorage, cache, copie locali, rimozione dei dati e servizi esterni. La conferma iniziale è una presa visione degli avvisi: non autorizza pubblicità, profilazione o condivisione automatica delle osservazioni.

## Blocco dell’interfaccia

HTML parte con `data-legal-pending` e header, navbar e viste `inert`. Uno stato di caricamento esterno alle viste resta raggiungibile, anche per riprovare dopo un errore di avvio. Il coordinatore modale permette solo l’avviso iniziale finché il blocco è attivo. Cookie policy, privacy e note legali si leggono dentro lo stesso dialog; non serve uscire verso una pagina dell’app. Escape, chiusura programmatica e cambio hash non sbloccano l’accesso. L’apertura mostra il titolo e il testo personale dall’inizio, senza scorrere automaticamente fino al primo controllo in fondo.

Una ricevuta con impronta viene confrontata con i testi correnti prima di aprire l’app. Se i testi differiscono, anche mantenendo lo stesso numero di versione, si richiede una nuova conferma e non si riscrive silenziosamente la ricevuta precedente. Le conferme storiche con la sola chiave/versione restano riconoscibili, senza inventare una data.

È un blocco dell’interfaccia del prototipo, non una protezione degli asset pubblici o delle API autonome. Una ricevuta del browser non è una firma digitale e non prova da sola l’identità della persona che ha premuto il pulsante.

## Ricevuta e conservazione

`js/legal-access.js` conserva `fungaroli:legal-acceptance:v1`: versione, SHA-256 dei contenuti legali normalizzati per ordine delle chiavi, data ISO dichiarata dal dispositivo, provenienza esplicita/storica e modalità browser/app installata. Mantiene la precedente chiave `fungaroli:legal-accepted` per compatibilità. Non viene aggiunto un identificativo persistente per visitatori anonimi.

Senza profilo la ricevuta resta locale. Se il browser impedisce di scrivere nella memoria, la conferma vale per l’apertura corrente e viene segnalata all’utente; al riavvio sarà richiesta di nuovo. Cambiamenti dei dati del sito fra schede vengono rilevati. Cancellare i dati del sito elimina la traccia locale.

Con un profilo, `POST /api/community/legal-acceptance` registra la ricevuta in `COMMUNITY_DB`, tabella `legal_acceptances` (migrazione 0009, inizializzata anche a runtime). Richiede sessione, origine e ID del profilo coerenti. La data del client resta distinta dalla prima ricezione sul server. L’inserimento è idempotente per profilo/versione/impronta: un nuovo invio non riscrive la prima ricevuta. Le vecchie conferme senza data restano esplicitamente storiche. L’eliminazione del profilo elimina le ricevute dal database operativo tramite cascata. Non vengono raccolti IP o user agent in questa tabella. Un invio fallito viene ritentato ai successivi aggiornamenti della sessione; la conferma locale già resa rimane valida.

## Installazione a tutto schermo

Il tutorial non viene proposto prima dell’accettazione e non può aprirsi sopra il disclaimer. Dopo la conferma, l’interfaccia viene sbloccata e può comparire il tutorial facoltativo già esistente, con un solo dialog visibile. Chiuderlo o rinviare l’installazione non cancella la conferma. In modalità standalone non viene riproposta l’installazione.

Safari e l’app installata possono avere memorie separate: l’installazione non viene usata come prova di accettazione. Se la ricevuta è disponibile, viene riutilizzata; se manca, il prototipo richiede nuovamente la conferma. Non si trasferiscono ricevute tramite URL o identificativi di tracciamento.
