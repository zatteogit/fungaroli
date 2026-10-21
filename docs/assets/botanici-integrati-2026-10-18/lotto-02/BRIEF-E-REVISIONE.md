# Lotto 2 · Sambuco nero ed Ebbio · 18 ottobre 2026

## Brief anatomico comparato prima della produzione

I dati chiusi assegnano a entrambe foglie opposte, composte e dentate, infiorescenze chiare, frutti carnosi neri. Non bastano a disegnare una specie come l'altra. Il catalogo distingue sambuco nero arbusto/piccolo albero con fusti legnosi ed ebbio erbacea perenne con fusti non legnosi. Per sambuco i frutti sono spesso in infruttescenze pendenti; non si deduce da ciò che ogni infruttescenza dell'ebbio sia eretta. Nessun numero fisso di foglioline presente nei dati: un numero scelto per l'icona è un esempio, non nuovo valore di schema.

Ispezionate le sei fotografie catalogate, poi ingranditi sambuco1 (corimbo), sambuco3 (portamento), ebbio1 (portamento) ed ebbio3 (foglia). Non presenti foto di frutti neri maturi. Sambuco2 mostra fiore singolo, ebbio2 soprattutto infiorescenza con boccioli. Ebbio3 permette di osservare foglioline strette e allungate su rachide comune; non attribuire un numero invariabile alla specie.

## Raster revisionati dall'agente, in attesa del coordinatore

- **Sambuco infiorescenza r00**: molte piccole corolle chiare, ramificazione ripetuta a quote diverse, insieme osservato frontalmente/dall'alto come in foto1. Non è l'ombrella generica con tutti i raggi dallo stesso punto. La sagoma tondeggiante della vista non descrive il profilo laterale. Schema per `flower_shape:ombrella`, categoria dello schema che comprende il corimbo; non cambia i dati. A64px restano visibili massa chiara e ramificazione; il singolo conteggio di petali è sotto la scala leggibile. Full master e foto sono stati confrontati: le piccole corolle sono semplificate, non anatomia degli stami.
- **Ebbio foglia r00**: rachide centrale con numerose foglioline separate strette, appuntite e dentate, una terminale e quattro coppie nell'esempio illustrato. Confronto con foto3. La composizione a nove foglioline non afferma che tutte le foglie della specie ne abbiano nove. Coerente con `leaf_type:composta`, non foglia palmata o semplice lobata. A64px rimangono leggibili rachide, foglioline distinte e forma allungata; dentatura e nervature sono semplificate.

Entrambi controllati nel renderer corrente a390px, tema chiaro e scuro, sostituendo gli asset solo nel DOM di un browser di prova. Non sono stati modificati file runtime, dati, cache o sito pubblicato. Anteprime conservate. La UI conserva il testo completo, i colori restano campioni e i valori sconosciuti restano assenti. L'approvazione dell'agente richiede ancora revisione indipendente del coordinatore.

## Portamenti: non approvati

- **Sambuco r00 scartato**: foglie esplicitamente palmate/lobate simili a un acero. Fusto legnoso corretto non compensa il carattere fogliare errato.
- **Sambuco r01 da correggere/revisionare**: riduce l'errore e aggiunge foglie composte in periferia, ma conserva silhouette lobate ambigue in alcune masse interne; non promosso automaticamente ad approvato. Nessun WebP pubblicabile.
- **Ebbio r00 scartato**: inserzioni poco leggibili e fogliame eccessivamente confuso per distinguere foglia composta da foglie semplici sul fusto; contorni troppo fini rispetto alla libreria.
- **Ebbio r01 scartato**: semplifica il portamento erbaceo e le coppie opposte, ma le foglioline convergono in ventagli quasi palmati invece di distribuirsi chiaramente sul rachide. Nessun WebP pubblicabile.

Le prove non approvate sono conservate solo per documentare l'errore e la correzione richiesta. Non vanno convertite in SVG o importate per aumentare il numero delle consegne.

## Blocchi documentali

Frutti maturi di entrambe: nessuna foto locale di frutti neri; non generati da fotografie di fiori o frutti verdi. Foglia completa del sambuco: nelle foto correnti i dettagli sono parziali o piccoli; non usata una foglia generica a sette foglioline come sostituto. Infiorescenza dell'ebbio: la foto2 mostra principalmente boccioli, la foto1 permette il portamento ma non un dettaglio completo del corimbo aperto; nessuna variante di quella del sambuco dedotta automaticamente. Richiedere foto/documentazione sufficiente prima del dettaglio.

## Fonti, consegna e limiti

Fonti canoniche già in catalogo: Università di Trieste, Flora di Roma, sambuco id5142 ed ebbio id5141. Attribuzione e licenza del singolo riferimento fotografico sono nel manifest, copiate dai record originali. Non è stata acquisita nuova fotografia. Il conteggio botanico non viene cambiato per adeguarlo ai raster. Illustrazioni generate con image_gen, originali e prompt conservati, hash vincolanti, WebP128losslessalpha con contenuto massimo112 e margine8; nessun SVG antecedente alla revisione raster.
