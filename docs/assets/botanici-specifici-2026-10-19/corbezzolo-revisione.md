# Corbezzolo: revisione delle figure

19 ottobre 2026. Generazione raster con il tool integrato image_gen; nessun SVG disegnato per codice.

## Fonti realmente consultate

- Regione Sardegna / SardegnaForeste: https://www.sardegnaforeste.it/sites/default/files/3_68_20130916114432.pdf, pagina 2.
- Comune di Poggio a Caiano: https://www.comune.poggio-a-caiano.po.it/pagina2453_ericaceae.html, sezione Arbutus unedo e fotografia istituzionale collegata.
- Fotografie Dryades locali: `assets/plants/corbezzolo-1.webp`, `corbezzolo-2.webp`, `corbezzolo-3.webp`; Andrea Moro, Università di Trieste, CC BY-SA 4.0. Le prime due permettono confronto della superficie del frutto e del bordo; la terza delle foglie intere. La fotografia del Comune mostra inoltre fiori penduli e forma della corolla. Non è ridistribuita in assenza di licenza individuata.

## Sequenza e scarti

1. Master v1 scartato: texture realistica eccessiva per il linguaggio Fronda; corolle lunghe, imbocco troppo aperto.
2. Master v2: contorno bruno marcato e riempimenti semplici, anatomia esterna chiaramente leggibile. Dopo revisione indipendente sono approvati foglia intera, ingrandimento del margine e frutto; il fiore resta scartato perché l'orlo inferiore è troppo largo e i lobi sono troppo grandi per un'orcia urceolata.
3. Master v3: correzione raster mirata della sola corolla. Collo inferiore stretto, piccola bocca e dentini minuti ricurvi: approvato dal coordinatore dopo confronto indipendente con foto e fonte primaria. Il solo export del fiore proviene dal v3; gli altri tre rimangono derivati dal v2.

## Figure approvate

- `leaf_type:semplice`: lamina singola ellittico-lanceolata con dentatura rappresentata, picciolo breve. La dentatura viene mantenuta anche nella figura che spiega la foglia semplice per evitare la contraddizione segnalata dall'utente.
- `leaf_margin:dentato`: solo un ingrandimento parziale del margine seghettato; tagli sinistro e inferiore chiaramente rettilinei, nessun picciolo. Non raffigura una seconda foglia intera.
- `fruit_type:carnoso`: bacca globosa arancio-rossa con superficie esterna tubercolata. Sono stilizzati numero e dimensione dei tubercoli; nessuna struttura interna viene dedotta.
- `flower_shape:campanula`: corolle bianco-crema urceolate pendule con strozzatura inferiore e apertura minuta. I tre fiori sono una scelta compositiva, non il conteggio biologico dell'infiorescenza.

I crop e il ridimensionamento sono neutri: nessuna modifica di anatomia o colore dopo l'approvazione raster. WebP lossless con trasparenza reale, margini entro canvas 384×384. I quattro export sono controllati a dimensione piena e nella tavola di contatto; verifica UI affidata all'integrazione del parent.

La normalizzazione finale usa `exact=True`: il primo encoding WebP lasciava RGB non nulli sotto alpha zero, visualizzati come una linea fuori figura dal visore. Il nuovo encoding conserva correttamente i pixel trasparenti e la riapertura dell'export conferma l'assenza della linea. Nessun contorno botanico è stato ridisegnato.

## Fuori ambito

Nessuna inferenza da null. Nessuna rappresentazione di radici, peli, organi interni, misure, conteggi fissi o fasi non documentate. I campioni di colore rimangono dati UI e non sono sostituiti da queste figure. Le illustrazioni non certificano l'identificazione.
