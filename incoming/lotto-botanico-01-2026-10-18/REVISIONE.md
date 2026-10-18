# Lotto botanico 1 · checkpoint del 18 ottobre 2026

## Fragolina · portamento e rosetta

Raster r00 scartato: il disegno conteneva una fogliolina centrale isolata, interpretabile come foglia semplice; questa ambiguità contrasta con le foglie trifogliate documentate. Raster r01 revisionato: tre foglie composte su tre piccioli distinti, ciascuna con tre foglioline dentate, che convergono in una corona basale; nessun fusto legnoso, ramo aereo con foglie semplici, radice o stolone inventato. L'esatto numero di tre foglie è una scelta compositiva dell'esempio, non un carattere fisso della specie. La corona stilizzata non raffigura anatomia interna. Fonte dati: `recognize-plants.json` (erba, rosetta_basale, composta, dentato), `plants.json` (tre foglioline dentate), foto3 della specie, foglia già revisionata per lo stile.

Piena risoluzione e prova128/64px: trifogliatura e convergenza basale leggibili; dentellatura semplificata alla scala piccola. Prova nella UI reale a390px nei temi chiaro e scuro, tramite sostituzione del solo DOM in browser, senza editare o pubblicare file dell'app. I due campi candidati sono growth_form:erba e leaf_arrangement:rosetta_basale. Nessun uso proposto per altezza o specie diverse. Il file è revisionato dall'agente; l'integrazione richiede ancora controllo indipendente del coordinatore.

Riferimenti: Università di Trieste, Flora di Roma, https://dryades.units.it/Roma/index.php?id=2073&procedure=taxon_page; foto Andrea Moro / Dipartimento di Scienze della Vita Università di Trieste, CC BY-SA4.0. I metadati completi e hash sono nel manifest.

## Quattro casi sospesi per riferimenti insufficienti

- Finocchietto portamento: le tre foto catalogate mostrano dettagli di fiori e frutti verdi, non pianta intera. Il dato «erba alta e ramificata» non autorizza a inventare disposizione delle foglie, ramificazione dettagliata o organi della base.
- Finocchietto foglia filiforme: dato testuale presente, nessuna foto locale mostra il particolare. Serve riferimento botanico specifico con foglia completa, non riuso della foglia finemente divisa di una specie diversa.
- Finocchietto frutto secco: foto2 e foto3 mostrano frutti verdi; non usate per dedurre colore, costolatura completa e struttura del frutto secco maturo. Non generato.
- Rosa canina foglia composta: foto1 e3 non mostrano foglia intera; foto2 ha foglie laterali parzialmente coperte e tagliate. Il solo campo «composta» non stabilisce numero e disposizione delle foglioline. Non generata.

Tentativi alle due pagine di fonte Dryades (finocchietto id3527, rosa id1972): tunnel del proxy restituisce403Forbidden. Nessun aggiramento. I quattro casi restano «da documentare», non «raster prodotto».

## Possibile riuso fiore rosa canina

Lo schema esistente `flower_shape-cinque_petali.webp` può essere riusato esclusivamente come schema dei cinque petali, coerenti con testo catalogo e foto2; colore bianco-crema è ammesso dal campo flower_color:[rosa,bianco]. Non rappresenta tutti i caratteri del fiore: gli stami della foto sono numerosi, il centro dell'icona è semplificato. Proposta di revisione favorevole per il campo flower_shape:cinque_petali, soggetta al controllo indipendente del coordinatore; non approvazione di ritratto del fiore né riuso automatico su altre specie.

## Metodo e limite

Nessuna modifica dei dati biologici. Generazione soltanto raster con image_gen; normalizzazione meccanica128WebP losslessalpha, massimo lato112, margine8. Nessun SVG prodotto prima della revisione raster. Originali, prompt, scarto, hash e preview sono conservati. Non si trasforma un blocco di documentazione in anatomia plausibile inventata.
