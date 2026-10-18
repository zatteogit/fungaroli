# Fragolina: ottimizzazione conservativa SVG

**Proposta: da 1.452.053 a 576.986 byte, −60,3%.** Lo SVG proposto è `optimized/semantic.svg`. Originale conservato integralmente in `original-v1.svg`; nessuna sostituzione nel lotto precedente o nell’app. La versione proposta attende la revisione del coordinatore.

## Che cosa cambia

Lo stesso raster botanico approvato viene ricalcato di nuovo con i parametri originali. Il ricalco ha **SHA-256 identico** alla sorgente precedente. Rimangono identici tutti gli **885 path**, colori, ID, ruoli e riferimenti ai tracciati di origine. I quattro livelli restano acheni esterni, peduncolo, calice e ricettacolo. Nessun organo cancellato, ridisegno, tinta nuova, bitmap incorporato o clip.

La riduzione deriva dalla serializzazione delle coordinate risultanti dalle operazioni booleane: valori come `123.45600128173828` diventano `123.5`. Il confronto di **81.238 componenti numeriche** misura uno scarto massimo di **0,05 pixel sorgente per componente**. La coordinata conserva un decimale: non si cancellano curve né si approssima la forma con un altro disegno. A lato maggiore 656 px il sorgente ritagliato è visualizzato alla propria scala: scarto massimo per componente 0,05 px, prima dell’antialiasing.

Una compressione gzip controllata dei soli file passa da **459.792 a 164.865 byte**. È una misura comparativa locale, non una dichiarazione sulla configurazione del sito. Il file resta più pesante di un raster e mantiene 885 path: nessuna promessa di riduzione del costo di composizione o del numero di oggetti.

## Confronto mirato

`comparison/raster-before-after-{64,128,656}.png`: raster, SVG originale e proposta. **La misura è il lato maggiore**, quindi l’altezza per questo soggetto verticale. I precedenti rapporti del lotto descrivevano invece esplicitamente la larghezza di esportazione. Non confondere le due convenzioni.

`comparison-report.json` registra dimensioni effettive, sagome e differenze. Gli errori RGB sono misurati dopo composizione su bianco, scala 0–255. I colori numerici delle campiture sono identici; le piccole differenze fra i render provengono dalle coordinate e dall’antialiasing.

| Lato maggiore | Errore RGB originale → proposta | IoU originale / proposta contro raster |
|---|---:|---:|
| 64 px | 0,129 / 255 | 0,97286 / 0,97286 |
| 128 px | 0,111 / 255 | 0,98099 / 0,98073 |
| 656 px | 0,091 / 255 | 0,99315 / 0,99311 |

Il confronto diretto registra meno dello 0,06% dei pixel con differenza superiore a 12/255 su un canale. Le differenze sono localizzate ai bordi e alle giunzioni. Non si promette equivalenza pixel per pixel né indipendenza anatomica nuova: rimangono i confini grafici del prototipo precedente, compresi i suoi limiti dichiarati.

Le prove mirate sulle parti isolate e sulla tinta a 128 px sono in `optimized/verification.json` e nelle immagini `parts.png`/`part-*.png`: la modifica non attraversa i livelli. L’approvazione del raster non costituisce approvazione di questa nuova serializzazione SVG. Nessuna suite unit/browser, nessuna matrice generale dell’app eseguita.

## Alternative e scarti conservati

| Prova | Byte | Path | Esito |
|---|---:|---:|---|
| Solo coordinate a 0.01 px | 652.392 | 885 | Conservata come controllo: più pesante della proposta. nessuna semplificazione cromatica. |
| Ricalco 4 bit. layer difference 32 | 284.572 | 312 | Scartato: contorni bruni diventano rossi. campiture alterate. |
| Ricalco 5 bit. layer difference 16 | 465.927 | 574 | Non selezionato: riduce i path ma modifica ombre e riflessi. |

Gli scarti sono in `scarti/`, con raster identico, preset, tracciati, SVG, confronti e motivazioni. Le loro soglie geometriche generiche passavano: **questo non bastava**, perché il controllo visivo ha rilevato la deriva cromatica. Lo stato è stato quindi registrato come scartato, senza promuoverli a nuove illustrazioni approvate.

## Riproduzione

Dalla radice del worktree, con le dipendenze SVG già fissate e Inkscape:

```bash
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/optimize_fragolina_svg.py
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/compare_fragolina_optimization.py incoming/vettoriali/ottimizzazione-fragolina-frutto
```

Il primo comando ritorna al raster approvato e rifiuta un ricalco diverso dall’hash storico; il secondo confronta soltanto questo asset. Non toccano l’app. L’SVG originale e il vecchio lotto restano conservati. Fonti, prompt, licenza CC BY-SA 4.0 e revisione raster sono copiati insieme alla proposta; `manifest.json` lega hash e stati.

Non è avviata alcuna conversione dei nuovi raster in attesa di approvazione o degli Animali. Questo lavoro consegna una proposta di alleggerimento, non un import o una pubblicazione.
