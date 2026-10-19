# Foglie del bosco: revisione specialistica

19 ottobre 2026. Raster generati con image_gen, confrontati con matrice, fonti e fotografie realmente aperte. I 17 export restano candidati in attesa di revisione indipendente del coordinatore. Produzione conclusa e fermata; fonte, fotografia e hash per ogni combinazione sono nel registry e nel source-record.

## Mente e origano

Fonti primarie Info Flora / Flora Helvetica 2018 effettivamente aperte: https://www.infoflora.ch/it/flora/mentha-aquatica.html, https://www.infoflora.ch/it/flora/mentha-longifolia.html, https://www.infoflora.ch/it/flora/origanum-vulgare.html. Le descrizioni distinguono foglie ovato-lanceolate brevemente picciolate nella menta acquatica; oblungo-lanceolate più o meno sessili con denti acuti rivolti in avanti nella menta longifolia; ovali brevemente picciolate, intere oppure dentate nell'origano. Le corolle di entrambe le mente hanno quattro lobi; infiorescenza globosa nella prima, spiga cilindrica nella seconda.

Osservate fotografie reali locali: menta-acquatica-1/2 (fiori) e -3 (foglie), menta-longifolia-1 (spiga) e -2 (foglie), origano-1 (fiori), -2/-3 (foglie). V1 scartato per stile troppo materico e corolle non leggibili nel conteggio dei lobi. Correzione raster v2 mantiene le forme fogliari e chiarisce quattro lobi su poche corolle frontali; altri piccoli elementi sono boccioli stilizzati. Tutti i nove export provengono dal raster corretto, senza alterazioni anatomiche da codice. Il valore intero/dentato dell'origano ha due dettagli distinti: la figura intera è dichiarata esempio della variante debolmente dentata tramite caption.

Nel crop della foglia intera di Mentha longifolia era entrata una piccola porzione disgiunta della foglia di origano sottostante (236 pixel con alpha≥10, contro 56.756 del soggetto principale). È stata esclusa solo questa porzione fuori figura, nella finestra locale x230–300/y440–455 del crop (65,435,445,890): nessun pixel della foglia di menta appartiene a quella finestra e nessun suo contorno è stato alterato. Normalizzazione equivalente a un crop di isolamento del soggetto; non correzione anatomica.

## Alliaria

Fonte primaria consultata: https://www.infoflora.ch/it/flora/alliaria-petiolata.html (descrizione Flora Helvetica 2018). Foglie inferiori cordate o reniformi, sinuato-dentate, a lungo picciolo. Fotografia reale confrontata a piena risoluzione: `assets/plants/alliaria-1.webp`, mostra insieme foglie basali reniformi e superiori triangolari. La figura intera rappresenta ESPLICITAMENTE una foglia basale; il dettaglio mostra la dentatura sinuata, senza picciolo. Le due figure sono coerenti fra loro. La didascalia Foglia basale rende visibile la fase/posizione.

## Borragine

Fonte primaria consultata: https://www.infoflora.ch/it/flora/borago-officinalis.html (descrizione Flora Helvetica 2018). Foglie lanceolate attenuate nel picciolo, margine ondulato più o meno dentato, pianta con peli rigidi. Foto `assets/plants/borragine-1.webp` e `borragine-2.webp` osservate; la seconda mostra le foglie di un individuo fiorito. Master v1 SCARTATO per peli troppo grossi, triangolari, interpretabili come spine. Correzione raster v2 mantiene lamina singola e margine ondulato, riduce i peli a brevi tratti sottili. Nessuna modifica anatomica per codice.

## Piantaggine

Fonte primaria effettivamente aperta: https://www.infoflora.ch/it/flora/plantago-lanceolata.html, descrizione Flora Helvetica 2018. Foglie strettamente lanceolate attenuate nel picciolo, intere oppure con denti fini distanziati, nervature longitudinali parallele; spighe compatte con stami sporgenti giallo-pallidi e corolle minute brunastre. Foto locali `piantaggine-1.webp` (spighe) e `piantaggine-2.webp` (lamina con nervature) confrontate a piena risoluzione. Foglia intera e due dettagli di bordo rappresentano le due varianti documentate; la didascalia rende esplicito che il ritratto della foglia è un esempio dentato.

Master v1: approvati specialistici solo i tre organi fogliari. Fiore SCARTATO per elementi bianchi a stella simili a petali vistosi. Master v2 corregge SOLO la spiga, eliminando queste stelle improprie; rimane l'anello delle antere chiare su filamenti, coerente con la foto. Export della spiga dal v2; foglia e bordi dal v1. Capsule non prodotte: le foto consultate non mostrano i frutti con risoluzione sufficiente alla revisione anatomica.

## Normalizzazione

Soli crop geometrici della figura intera/dettaglio, centratura e ridimensionamento neutro. Canvas 384×384 RGBA, organo massimo 320px, WebP lossless con exact=True. Nessuna anatomia nascosta viene ricostruita. Nulla viene dedotto dai valori null.
