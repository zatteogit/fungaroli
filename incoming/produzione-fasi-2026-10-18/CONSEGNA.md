# Fasi funghi — consegna raster del 18 ottobre 2026

**30 tessere recuperate e revisionate +73 nuove =103 candidate in 18 tavole.** Zero modifiche al runtime o ai dati biologici, zero SVG prodotti, nessun merge da questo agente. Il controllo indipendente del coordinatore e l'import nell'app restano successivi. Nessuna delle85 combinazioni integrate viene riprodotta.

## Conteggi effettivi

- Recupero: fasi31–34dal commit caa6f6833a7942ba6c6d5050c7cbe7255c98e7f8,30 tessere5specie/10fasi, nessuna rigenerazione necessaria.
- Nuovi boleti:37tessere (satana6,fiele6,porcino nero9,estivo7,edulis7,pinophilus2).
- Nuove altre specie:36tessere (finferlo4,coprino9,pioppino6,falso chiodino3,chiodino4,pleuroto4,moretta6).
-14 chiamate image_gen concluse:11 prime tavole73tessere +3 correzioni di2tessere ciascuna =79 sprite nuovi realmente prodotti,6 scartati,73 selezionati. Identificativo del modello specifico non esposto dal tool, registrato esplicitamente.

## Selezione definitiva per import

| Tavola | Celle selezionate | Tessere |
|---|---|---:|
| fasi31,32,33 | 0–8 ciascuna |27|
| fasi34 |0,1,2|3|
| fasi35-r01 |0,1,2,3,4,5|6|
| fasi36-r01 |0,2,3,5|4|
| fasi36-r02 |0,6|2|
| fasi37-r01 |0–8|9|
| fasi38-r01 |0,1,2,3,4,5,6|7|
| fasi39-r01 |0,1,2,3,4,5,6|7|
| fasi40-r01 |0,3,6|3|
| fasi41-r01 |0,3,4,5,6,7,8|7|
| fasi42-r01 |0–8|9|
| fasi43-r01 |0,3,6|3|
| fasi44-r01 |0,1,3,4,6,7|6|
| fasi45-r01 |3,4,5,6,7,8|6|
| fasi-cibarius-r02 |0,1|2|
| fasi-pleurotus-r02 |0,1|2|

Sorgenti in incoming/icone/, manifest selettivo in incoming/manifest.json e ultimo stato di ciascuna tavola in incoming/bozze/STATO.md. Usare il manifest, non importare tutte le componenti trovate nel PNG.

## Scarti conservati e approvazioni superate

1. fasi36-r01celle1,4: dettaglio dei pori con gambo intero inappropriato. Sostituiti dai dischi36-r02celle0,6.
2. fasi40-r01cella7 e41-r01cella1: pliche troppo regolari/simili a lamelle. Approvazione iniziale del giovane superata per iscritto, entrambe escluse. Sostituite da cibarius-r02celle0,1con pliche chiaramente spesse/biforcate contro foto inat3.
3. fasi45-r01celle0,1: trama pelosa/striature trasferite dal Tricholoma al cappello di Pleurotus, cap_surface non documentata. Mai ammesse in manifest. Sostituite da pleurotus-r02celle0,1con campiture neutre.

## Verifiche e limiti

Ogni tavola visionata a piena risoluzione e ogni tessera a64px. Coerenza specimen/età tra cap isolato/intero, pori vs lamelle vs pliche, reticolo e suo colore, anello/volva e silhouette controllati singolarmente. Geometria verificata tramite sheet_cells, nessun bordo mozzato o bbox sovrapposto, trasparenza reale. fit128/WebP90method6 usati soltanto per ritaglio tecnico, hash degli output e verifica finale64con margini reali, senza scrivere assets/app. I riferimenti e gli estratti dei dati stanno negli snapshot, le revisioni specifiche nei md. La verifica nella vista reale dell'app compete al coordinatore dopo il controllo indipendente, non è dichiarata eseguita da questo agente.

I disegni sono schemi, non identificazioni né ritratti diagnostici. Numero di lamelle/pori/squame e proporzioni non misurabili. Inserzione delle lamelle non garantita dal disco generico. Le età non visibili nelle foto locali seguono i stages con fonte già documentata; FirstNature non rileggibile via proxy403, nessuna nuova verifica online dichiarata. Campo null rimane sconosciuto: Terreum stem_ring e Pleurotus cap_surface non vengono completati da un disegno neutro né trasformati in label di assenza/liscio.

Ricevuta-finale-103.json contiene per ogni target hash della sorgente e del WebP atteso, cella, fonte di fase e revisione; output-previsti/ è una preview tecnica, non un secondo master. I raster originali restano nei percorsi generated_images indicati nelle revisioni, oltre alle copie incoming versionate. Raster revisionato → controllo indipendente → import → eventuale vettore, senza invertire l'ordine.

## Import del coordinatore

Dopo approvazione indipendente e snapshot git immutabile:

```sh
python tools/import_stage_icons.py /tmp/<snapshot>/incoming --stato
```

Importare SOLO le righe fase. L'importer generale delle varianti potrebbe toccare consegne precedenti non oggetto di questo lotto. Confrontare103 hash di output della ricevuta prima di aggiornare pending/indice; poi rapporto asset e verifiche pertinenti dell'app. Questa procedura non è stata eseguita da questo agente.
