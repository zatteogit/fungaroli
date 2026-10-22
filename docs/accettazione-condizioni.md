# Avvisi, accettazione e installazione del prototipo

Decisioni del 18 ottobre 2026: Fronda è un esperimento personale di Matteo; l’uso serve esclusivamente a provare e migliorare il prototipo. Avvertenze, privacy e cookie policy hanno una sola conferma. Senza conferma l’interfaccia dell’app rimane bloccata.

## Testi e versione

`data/legal.json` contiene avvisi e informative. Dal 20 ottobre la versione editoriale del documento è **7**, mentre `acceptance_version:1` identifica separatamente le CGS da accettare (`cgs-1`). La verifica normativa rimane quella indicata dal documento: questa modifica dell’interfaccia non è una nuova verifica delle norme. `js/legal-notice.js` integra gli snapshot CMS precedenti con il minimo approvato, conservando norme e revisioni editoriali pubblicate.

Il 22/10/2026 l’informativa «Privacy e dati» è stata allineata al codice e completata (versione editoriale **8**, dettagli in [legale.md](legale.md), §6.6): `acceptance_version` resta 1, quindi nessuna nuova conferma. Cambia l’impronta SHA-256 dei testi: le nuove conferme registrano quella nuova, le ricevute già salvate conservano quella del testo letto allora.

Release, data editoriale e modifiche di copy non fanno decadere una conferma valida della stessa revisione delle CGS. Solo un cambiamento sostanziale delle condizioni richiede l’aumento esplicito di `acceptance_version` e una nuova conferma. La versione editoriale continua ad aumentare a ogni modifica del documento; la revisione delle CGS è positiva e non può diminuire o essere rimossa.

La cookie policy descrive i due cookie effettivi di `worker/community.js`: sfida passkey, 5 minuti; sessione, 30 giorni; entrambi Secure/HttpOnly/SameSite=Strict. Descrive anche localStorage, cache, copie locali, rimozione dei dati e servizi esterni. La conferma iniziale è una presa visione degli avvisi: non autorizza pubblicità, profilazione o condivisione automatica delle osservazioni.

## Blocco dell’interfaccia

HTML parte con `data-legal-pending` e header, navbar e viste `inert`. Uno stato di caricamento esterno alle viste resta raggiungibile, anche per riprovare dopo un errore di avvio. Il coordinatore modale permette solo l’avviso iniziale finché il blocco è attivo. Cookie policy, privacy e note legali si leggono dentro lo stesso dialog; non serve uscire verso una pagina dell’app. Escape, chiusura programmatica e cambio hash non sbloccano l’accesso. L’apertura mostra il titolo e il testo personale dall’inizio, senza scorrere automaticamente fino al primo controllo in fondo.

La ricevuta è riutilizzata in base alla revisione delle CGS. La SHA-256 conserva il testo effettivamente accettato a quel momento: non viene sostituita automaticamente dall’impronta del copy corrente. Le ricevute del precedente schema `62026-10-20` sono compatibili con `cgs-1`; la migrazione conserva versione originale, impronta e data, aggiungendo solo il collegamento locale `acceptanceVersion`. Un nuovo contratto `cgs-2` non accetta questa compatibilità. Le vecchie chiavi senza ricevuta sono conservate come storiche, con data e impronta sconosciute: non si inventano valori per sincronizzarle sul server.

Il pulsante «Ho letto, continua» resta sticky in fondo al pannello durante lo scroll dei testi e delle informative, rispettando l’area sicura del dispositivo.

È un blocco dell’interfaccia del prototipo, non una protezione degli asset pubblici o delle API autonome. Una ricevuta del browser non è una firma digitale e non prova da sola l’identità della persona che ha premuto il pulsante.

## Ricevuta e conservazione

`js/legal-access.js` conserva `fungaroli:legal-acceptance:v1`: versione originale, revisione CGS locale, SHA-256 dei contenuti legali normalizzati per ordine delle chiavi, data ISO dichiarata dal dispositivo, provenienza esplicita/storica e modalità browser/app installata. Mantiene la precedente chiave `fungaroli:legal-accepted` per compatibilità. Non viene aggiunto un identificativo persistente per visitatori anonimi.

Senza profilo la ricevuta resta locale. Se il browser impedisce di scrivere nella memoria, la conferma vale per l’apertura corrente e viene segnalata all’utente; al riavvio sarà richiesta di nuovo. Cambiamenti dei dati del sito fra schede vengono rilevati. Cancellare i dati del sito elimina la traccia locale.

Con un profilo, `POST /api/community/legal-acceptance` registra la ricevuta in `COMMUNITY_DB`, tabella `legal_acceptances` (migrazione 0009, inizializzata anche a runtime). Richiede sessione, origine e ID del profilo coerenti. La data del client resta distinta dalla prima ricezione sul server. L’inserimento è idempotente per profilo/versione/impronta: un nuovo invio non riscrive la prima ricevuta. Le vecchie conferme senza data restano esplicitamente storiche. L’eliminazione del profilo elimina le ricevute dal database operativo tramite cascata. Non vengono raccolti IP o user agent in questa tabella. Un invio fallito viene ritentato ai successivi aggiornamenti della sessione; la conferma locale già resa rimane valida.

## Installazione a tutto schermo

Il tutorial non viene proposto prima dell’accettazione e non può aprirsi sopra il disclaimer. Dopo la conferma, l’interfaccia viene sbloccata e può comparire il tutorial facoltativo già esistente, con un solo dialog visibile. Chiuderlo o rinviare l’installazione non cancella la conferma. In modalità standalone non viene riproposta l’installazione.

Safari e l’app installata possono avere memorie separate: l’installazione non viene usata come prova di accettazione. Se la ricevuta è disponibile, viene riutilizzata; se manca, il prototipo richiede nuovamente la conferma. Non si trasferiscono ricevute tramite URL o identificativi di tracciamento.

## Verifiche del 20 ottobre

Test unitari e browser coprono modifica del copy senza nuova richiesta, aumento della revisione sostanziale con blocco obbligatorio, migrazione senza alterare data/impronta, API vecchie e nuove e accessibilità del pulsante durante lo scroll. In caso di memoria cancellata o bloccata, nuovo browser o profilo standalone con archivio separato, la conferma può essere richiesta di nuovo: non è una nuova release delle CGS.
