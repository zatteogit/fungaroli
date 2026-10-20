# Confronto tra piante

Il confronto si apre da Piante e fiori → Confronta, dalle singole schede e dai collegamenti delle specie simili. Rotte: `#/confronta/piante`, `#/confronta/piante/<riferimento>` e `#/confronta/piante/<riferimento>/<altra-specie>`.

Il selettore usa ricerca e componenti del confronto fungino, con lessico botanico e priorità alle relazioni di somiglianza già documentate. È possibile scegliere liberamente altre specie: questa scelta non crea una relazione di sosia. I due menu permettono di cambiare entrambi i lati.

I caratteri derivano da `recognize-plants.json`; foto, cautele e fonti dalle schede pubblicate. I filtri distinguono valori uguali, differenti, parzialmente sovrapposti e mancanti. Un valore `null` resta «Non documentato», senza dedurre presenza o assenza. Le varianti sovrapposte compaiono sia in «Differenze» sia in «In comune», con etichetta esplicita.

Le illustrazioni usano lo stesso renderer delle schede: campioni di colore, schemi generici dove ammessi, anatomie revisionate per specie dove richiesto. Nessuna nuova illustrazione è stata creata o approvata. Si veda la [ricognizione dei caratteri](ricognizione-illustrazioni-caratteri-2026-10-20.md), che distingue asset assenti, schemi generici e autorizzazioni mancanti.

Verifica del 20 ottobre 2026: selezione di entrambi i lati, priorità ai sosia documentati, filtri del confronto aglio orsino/colchico e assenza di overflow a 390 e 1280 px; bundle Worker riuscito. Suite completa non avviata, come richiesto dall’utente.
