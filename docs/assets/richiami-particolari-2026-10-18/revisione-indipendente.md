# Ancoraggi esterni dei caratteri del gambo · 18/10/2026

Proposta per il livello UI separato dal raster: nessun file in `assets/traits/` è stato modificato, ricolorato, ritagliato o rigenerato. Coordinate espresse in pixel del raster **128×128**, origine in alto a sinistra, da riscalare insieme all'immagine mantenendone proporzioni e intero contenuto.

## Controllo e copertura

Ispezionati tutti gli **88 raster base** `assets/traits/<specie>-gambo.webp` in cinque tavole. Poi controllati singolarmente i casi dubbi: Pleurotus ostreatus, P. cornucopiae, Craterellus cinereus, Coprinus comatus, Fistulina hepatica, Amanita rubescens. Anche edulis e caesarea sono stati ispezionati singolarmente all'inizio. Rilette tutte e cinque le anteprime annotate, corrette le quote che ricadevano sul margine del cappello e riportati i punti sul bordo destro del gambo o della struttura effettiva.

Le quote e le zone sono scelte **manualmente, per ogni raster**. L'ascissa è stata poi misurata al bordo destro visibile (alpha >128) della riga scelta: questo evita di confondere il bordo interno della tinta con il bordo esterno del contorno. Non esiste una quota predefinita per anello, volva o reticolo; non si trasferiscono i punti da una specie a un'altra. L'ordine dei campi nel JSON è anello, volva, reticolo; i colori nelle sole anteprime di controllo sono rosso, blu, verde.

**251 punti utilizzabili**, 13 null. Tutti e 36 i campi con valore `true` hanno una struttura riconoscibile nel raster e un punto di richiamo; nessuna grossolana omissione di anello/volva/reticolo presente nei dati è emersa in questa verifica. Questo è controllo editoriale di corrispondenza, non certificazione micologica o validazione dell'intera anatomia.

Null per tutti e tre i campi su:
- **Fistulina hepatica**: non è disegnata alcuna zona di gambo distinta; non indicare una parte immaginata.
- **Pleurotus ostreatus**: la vista mostra principalmente cappello e lamelle che raggiungono il margine inferiore; manca una superficie di gambo sufficientemente distinta. Non usare la punta del cappello come base del gambo.

Gli altri sette null derivano da dati ignoti/variabili e restano tali, anche se il disegno potrebbe suggerire una risposta. L'immagine non sostituisce il dato.

Per valore `false`, il punto indica **la zona dove osservare** l'assenza del carattere; non è il punto di un organo esistente. In particolare reticolo assente nelle specie con anello punta alla superficie del gambo sotto l'anello, evitando la volva. In Coprinus l'anello è molto basso e gli ancoraggi sono scelti di conseguenza.

## Limiti d'uso

- Usare il punto soltanto per il **file base esatto** indicato e con lo stesso SHA-256. Una variante, fase o combinazione non ispezionata non eredita l'ancoraggio.
- Non applicare crop, cambio proporzioni o `object-fit:cover` al raster se si usano queste coordinate.
- Il richiamo deve fermarsi all'esterno del bordo, non coprire il dettaglio con pennellate o indicatori opachi.
- Verificare in UI leggibilità e sovrapposizioni, anche per punti molto ravvicinati (anello assente/reticolo alto nei boleti) e immagini strette.
- Le anteprime sono strumenti di revisione con punti sovrapposti; non sono asset da pubblicare come nuove illustrazioni.

Provenienza: dati e file della working copy `/workspace/fungaroli` al momento del controllo; hash del dataset e dei singoli raster nel JSON. Nessun nuovo dato scientifico introdotto.

## Revisione della presentazione · 19/10/2026

Richiesta di Matteo: avvicinare le linee alle etichette e valutare il contrasto sul singolo disegno. Nel confronto compatto la distanza fra estremità della linea e testo passa da circa 15 a 3 pixel CSS, mantenendo invariata la miniatura da 44 pixel.

Il colore del punto viene scelto tra inchiostro scuro e avorio in base al colore appena all’interno del bordo revisionato, nel file realmente caricato. La linea sfuma verso l’inchiostro del tema sul fondo della scheda; un sottile contorno opposto conserva la leggibilità al passaggio tra disegno e carta. Non è una valutazione dei caratteri biologici. Se i pixel non sono leggibili viene usato il contrasto del tema. Al cambio di immagine o tema il richiamo viene aggiornato.

Non sono cambiati i raster, gli ancoraggi, i valori dei caratteri o la copertura degli asset. Le varianti prive di un ancoraggio revisionato continuano a non ricevere richiami.

Verifica manuale nel browser: confronti Trombetta dei morti / Craterello sinuoso e Craterello cenerino, Porcino / Tignosa verdognola; tonalità diverse riscontrate nei disegni scuri e chiari, tema scuro e schermo da 320 pixel. Distanza positiva di circa 3 pixel, nessun overflow orizzontale nei casi controllati. Nessuna suite di test o dry-run; controllo di sintassi e diff.
