# Pilota Lazio · rilascio v238

Il mandato del 19 ottobre autorizza verifiche, integrazione e pubblicazione. Il pilota comprende 36 zone selezionate nelle cinque province: 15 Rieti, 10 Roma, 3 Viterbo, 4 Latina e 4 Frosinone. Non è una copertura continua del Lazio.

## Integrazione applicativa

- Centri documentati, raggi dichiarati editoriali, province e fonti nei record. Nessun centro viene proposto come parcheggio o destinazione stradale automatica.
- Quote su griglia di 317 punti per nuova zona: 6.657 punti Copernicus GLO90 reali, con provenienza e richieste archiviate.
- Cinque soste documentate con rotte reali da Rieti. Nelle altre 16 nuove zone nessun tempo di guida, sosta o fondo asfaltato inventati. Nessun nuovo imbocco dedotto dalla sola vicinanza di un parcheggio.
- 13 copertine reali / 39 derivati WebP. Otto copertine ancora mancanti, con motivazioni in `foto/pending.json` e `data/asset-pending.json`. Crediti, fonte, licenza e modifiche consultabili; nessuna variante stagionale generata.
- Filtro Provincia condiviso fra home e mappa; catalogo geografico e ricerca comprendono tutte le zone pubblicate. La base rimane Rieti finché il profilo non la modifica.
- Regole locali prima del piano: Circeo come osservazione, limiti del PNALM espliciti, raccolta locale ignota indicata come da verificare. Riferimenti alle dieci ASL senza orari discordanti presentati come certi.
- Aggiornamento degli snapshot CMS per habitat, accessi e imbocchi oltre a zone e sentieri. Gli aggiornamenti dal repository rispettano le bozze o pubblicazioni degli autori.
- Snapshot pubblico trasferito da localStorage a Cache API; cache preservata dal service worker e copie antecedenti agli avvisi Lazio escluse dal ripiego compatibile.
- L’indice biologico conserva i parametri precedenti. Nessuna notorietà assegnata alle nuove zone; comodità/affollamento assenti quando mancano dati. Accessi con fondo ignoto restano ignoti.

## Verifiche senza suite

Ispezione dei dati normalizzati e delle fonti; confronto strutturale dei 15 record originari; controllo JSON, schema CMS, limiti di dimensione/complessità e sintassi dei file toccati; rapporto asset e revisione del foglio fotografico. Navigazione manuale su browser separato, telefono e desktop, chiaro/scuro, filtro Provincia, zone con e senza campionamento, crediti e regole locali. Il server statico locale non eroga API meteo: questo limite non è confuso con una verifica del Worker live.

Nessuna suite, test unitario, dry-run o CI richiesti o avviati. Il commit di integrazione e quello di merge usano il trailer `skip-checks: true`. Il rilascio è distinto dalle verifiche live, che vengono registrate separatamente dopo il build Cloudflare.

## Campionamento e interruzione della fonte

Il WFS regionale ha interrotto il servizio dopo i primi sette pacchetti, prima con timeout e poi con HTTP503. Il client gestisce anche zone esplorabili senza habitat, senza assegnare un indice. Le quote sono state completate separatamente senza dati forestali sostitutivi. Dopo il ripristino del WFS, il processo ha ripreso gli altri 14 pacchetti dalla cache delle quote. Il recupero è riuscito: tutte le 21 nuove zone sono complete. I file applicativi contengono 36 zone con habitat, 17 nuove tracce OSM e 652 campioni sui sentieri. Nessuna fascia è rimasta senza rilievo o senza composizione forestale. Le risposte di sei percorsi auto sono evidenza acquisita: soltanto cinque destinazioni con sosta documentata sono pubblicate; la rotta Faete alla piazza è stata esclusa nella revisione del coordinatore.

## Rapporto asset finale

Zero mancanze non registrate, zero incoerenze e zero illustrazioni da rifare per dati cambiati. Le otto foto locali mancanti e le 221 varianti stagionali/meteo non prodotte sono registrate fra le pendenze. Restano le pendenze storiche degli altri cataloghi, senza duplicare le consegne già integrate.
