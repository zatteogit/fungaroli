# Revisione raster del confronto · 18 ottobre 2026

## Perimetro e metodo

Produzione raster `image_gen` prima di ogni vettore. Sono state completate le 188 combinazioni residue della prima coda, più due combinazioni di Morchella rilevate dal rapporto asset successivo: 190 nuove combinazioni, 380 disegni. Con il primo lotto sono disponibili 193 combinazioni e sei forme; si aggiungono quattro sostituzioni delle vecchie icone rosa/violetto del gruppo `virescens`.

Per ogni tavola: visione preventiva dei riferimenti approvati, prompt con valori documentati e vincoli anatomici per riga, visione diretta del risultato grande, controllo del tipo di imenoforo (lamelle, pori, pieghe o aculei), colori, anello/volva/reticolo, silhouette e corrispondenza fra cappello isolato e fungo intero. Il controllo delle componenti, trasparenza e margini è aggiuntivo: non sostituisce quello semantico. Fonti dei caratteri: `data/species-traits.json`, relativi `traits_notes` e fonti già citate; non sono stati introdotti dati scientifici.

Seconda passata: tutti i 380 nuovi disegni sono stati osservati anche in riduzione con lato massimo di 64 e 72 px, su sfondo avorio. I 14 fogli `audit-ui-64/72-1..7.png` documentano questa verifica. Le revisioni finali sono in `audit-ui-revisioni-64.png`. Riduzione e impaginazione sono operazioni tecniche; nessun raster è stato ricolorato o ridisegnato automaticamente.

## Errori individuati e corretti

1. **Tylopilus del primo lotto precedente:** la variante dichiarata crema+piano era ocra e ancora convessa. `vector_production` ha prodotto il raster r03 prima del vettore; `raster_production` lo ha confrontato indipendentemente con dati/fonti e a 64 px: crema, corona spianata, pori rosa, gambo clavato e reticolo bruno grossolano, senza anello/volva. Sorgente recepita in `incoming/icone/tylopilus-crema-piano-2026-10-18-r03.png`. La vecchia tavola forme02-r01 è bloccata; la copia `-celle-approvate` conserva il raster integro ma il manifest seleziona solo le quattro celle Amanita/Morchella corrette, mai le due Tylopilus errate.
2. **Aggregato virescens + cyanoxantha:** la prima passata copiava il mosaico poligonale anche sulle alternative rosa/violetto, come i vecchi riferimenti approvati. La lettura severa dei `traits_notes` ha distinto la cuticola areolata di virescens da quella liscia di cyanoxantha. Corrette le quattro combinazioni rosa/violetto × emisferico/imbuto e le quattro vecchie icone dei colori rosa/violetto nella forma convessa. Il mosaico resta nelle alternative grigie di virescens, non viene trasferito alle alternative cyanoxantha. Fonti già documentate: First Nature e Wikipedia di Russula cyanoxantha. Nessun campo dei dati è cambiato.
3. **Bozze delle correzioni:** combo64-r01 distribuiva le colonne male; colore-liscio-r01 aveva due funghi interi e profilo depresso; colore-liscio-r02 aveva lamelle isolate brunastre trasferite dal riferimento stilistico. Sono conservate e bloccate. Revisioni finali: combo63-r01, combo64-r02, colore-liscio-r03, ricontrollate anche da `vector_production` e a 64 px.

Vecchie approvazioni superate per i file `assets/traits/virescens-{cappello,gambo}-{rosa,violetto}.webp`: usare le quattro righe della tavola `virescens-colore-liscio-2026-10-18-r03.png` del manifest. Nessuna modifica agli asset dell’app è stata eseguita in questo ramo.

## Limiti espliciti

- Sono schemi di caratteri e alternative documentate, non ritratti diagnostici né prova che tutte le proprietà dell’aggregato coesistano in un singolo esemplare. Gli aggregati richiedono il controllo delle dipendenze fra attributi, come dimostrato dal caso virescens.
- I disegni conservano il linguaggio semplificato dei riferimenti: numero di lamelle, pori, squame, gocce e maglie non è quantitativo. Le strutture molto fini sono simboliche a 64 px; il testo resta necessario.
- I valori nulli di anello o altri caratteri non diventano false assenze o nuove presenze: nessuna struttura distinta è stata aggiunta per risolvere un dato sconosciuto. La sfumatura del cappello non modifica il gambo automaticamente.
- Lo stato «pronta da integrare» descrive la revisione progettuale delle illustrazioni, non una certificazione micologica. I raster sorgente, prompt, bozze scartate e hash restano conservati per revisioni successive.

## Import riproducibile

Usare sempre `load_rows(..., stato=True)` / `import_trait_icons.py --stato`, non tutto il manifest: contiene deliberatamente bozze superate. Le tavole bloccate non sono importabili. Il manifest finale seleziona 402 disegni distinti: 386 per 193 combinazioni, 12 per sei forme e quattro sostituzioni di colore.
