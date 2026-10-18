# Primo lotto botanico SVG · 18 ottobre 2026

**Quattro SVG prodotti e verificati tecnicamente; revisione indipendente SVG del coordinatore ancora da svolgere.** I quattro raster specifici erano già stati approvati prima della conversione. Nessuna sostituzione negli asset dell’app.

| Disegno | Livelli semantici | Path |
|---|---|---:|
| Fragolina, foglia | picciolo/raccordi; fogliolina terminale; sinistra; destra | 43 |
| Fragolina, falso frutto | acheni esterni; peduncolo; calice; ricettacolo esterno | 885 |
| Finocchietto, ombrella | gruppi dei fiori minuti; raggi principali/secondari; peduncolo | 208 |
| Rosa canina, cinorrodo | residuo calicino; corpo esterno; peduncolo/breve tratto di fusto | 77 |

Tutti sono geometrie SVG reali con ID stabili e livelli Inkscape. Nessun `<image>`, bitmap incorporato, clip, maschera o copia completa nascosta del soggetto. Le intersezioni booleane ritagliano i tracciati nelle parti effettive; si conserva la pila di campiture del ricalco all’interno di ogni parte per evitare crepe di antialiasing. Questa sottopittura grafica non ricostruisce tessuti nascosti.

## Fonti e revisione raster

Ogni cartella conserva il master PNG, crop esatto, hash, prompt originale, provenienza e copia della revisione editoriale indipendente di `illustration_corrections`. Master e hash sono quelli dei manifest approvati, non versioni scartate. Le fonti botaniche e i riferimenti fotografici del catalogo sono nei `source-record.json`; non sono stati aggiunti dati biologici. Il coordinatore resta responsabile della revisione indipendente dei nuovi SVG.

- Foglia della fragolina: esattamente tre foglioline dentate. Nervature schematiche; nessuna pelosità o scala dedotta.
- Fragolina: acheni esterni sul ricettacolo rosso; niente sezione, semi interni o cavità inventate.
- Finocchietto r02: ombrella composta gialla. I punti e brevi raccordi ai pedicelli sono segni illustrativi di fiori minuti, non un disegno dei singoli organi né un conteggio botanico.
- Cinorrodo: esterno intero con residuo calicino opposto al peduncolo; niente anatomia interna o peli dedotti.

Le annotazioni sono manuali sul raster esatto. Per i piccoli dettagli si usano candidati da colore e contorni dei pixel entro riquadri ispezionati: due falsi candidati rosa del ricettacolo sono stati respinti come riflessi, non acheni. La selezione è registrata; non è riconoscimento automatico botanico. I confini illustrativi nei punti di contatto possono includere brevissimi raccordi o sottili frammenti di contorno: da valutare isolando i livelli, senza attribuire loro significato botanico.

## Verifiche e limiti

`verification.json` per ciascun disegno verifica master/crop, unicità degli ID, assenza di bitmap/clip, livelli non vuoti e tinta confinata alla parte scelta, a 128 px. Render e confronto sono verificati anche a 64 e 656 px. Le metriche misurano fedeltà grafica, non correttezza botanica.

IoU della sagoma a 64 px: foglia 0,947; fragolina 0,977; cinorrodo 0,983; ombrella 0,869. Nell’ombrella i raggi sottili e l’antialiasing rendono il confronto binario instabile alla scala minima: a 128 px IoU 0,940, a 656 px 0,981. Il confronto semantico/ricalco a 64 px ha errore RGB medio circa 0,56/255. La soglia specifica di 0,85 a 64 px è dichiarata nel verificatore, non un’approvazione botanica né una promessa di equivalenza pixel per pixel.

Le modifiche di tinta nell’inspector sono **prove tecniche**, non nuove varianti botaniche ammesse dai dati. Non si deforma arbitrariamente la forma. Nascondere o spostare un livello può lasciare vuoti; non si inventa il tessuto che nel raster è coperto. I contorni scuri restano protetti durante la tinta; nella foglia sono protetti anche i dettagli chiari delle nervature.

Il frutto della fragolina conserva molti dettagli e gradienti: 885 path, senza ottimizzazione distruttiva dei piccoli acheni. Il peso va valutato prima di qualsiasi integrazione runtime. Il raster rimane la fonte visiva approvata.

## Ispezione e riproduzione

Con le dipendenze fissate di `../requirements.txt`, Python 3.12 e Inkscape 1.4:

```bash
python -m http.server 8796 --directory incoming/vettoriali
```

Aprire `http://127.0.0.1:8796/botanici-lotto-01/inspector.html`: confronto affiancato, temi chiaro/scuro, livelli, tinta confinata e download. `review-128-64.png` mostra raster e SVG alle dimensioni reali. Ogni cartella contiene `comparison.png`, `parts.png`, i render e i singoli livelli isolati.

Per ricostruire uno dei quattro disegni dalla sorgente già conservata:

```bash
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/prepare_botanical_crop.py incoming/vettoriali/botanici-lotto-01/rosa-canina-cinorrodo
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/trace_botanical_svg.py incoming/vettoriali/botanici-lotto-01/rosa-canina-cinorrodo
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/build_botanical_svg.py incoming/vettoriali/botanici-lotto-01/rosa-canina-cinorrodo
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_botanical_svg.py incoming/vettoriali/botanici-lotto-01/rosa-canina-cinorrodo
```

Il ricalco della foglia conserva il preset a 16 colori registrato in `source-record.json`; il tool lo rispetta. Non passare a un preset diverso senza nuova revisione delle annotazioni. Per tutti i disegni il build rifiuta un hash del ricalco diverso da quello annotato. I due SVG dei dettagli sono conservati; `extract_botanical_details.py` permette di ripetere l’adattamento da pixel, ma **azzera l’approvazione visiva dei candidati**: serve controllarli e vincolare i nuovi hash prima del build.

`manifest.json` distingue raster approvato da SVG in attesa di revisione e lega ogni sorgente alle sue parti e al file SVG. La licenza delle illustrazioni resta CC BY-SA 4.0, Fronda/Fungaroli. Nessun merge, pubblicazione o import runtime è incluso in questo lotto.
