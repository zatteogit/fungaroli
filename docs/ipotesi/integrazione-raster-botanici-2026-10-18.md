# Valutazione e integrazione dei raster botanici · 18 ottobre 2026

## Decisione e perimetro

Matteo chiede «aggiungi quanto più materiale possibile per ogni categoria». Si adotta il materiale corretto dei lotti botanici01–03, dopo una revisione indipendente rispetto all’agente produttore. Cinque nuovi WebP vengono collegati a sei valori documentati; uno schema già pubblicato viene autorizzato anche per il fiore della rosa canina. Totale: sette nuovi collegamenti per quattro specie. Nessun nuovo dato biologico, fotografia o vettore; nessuna variazione dell’indice.

La revisione ha osservato separatamente i sei master a risoluzione originale, le fotografie locali indicate dai manifest, i WebP a128 e64px sui fondi chiaro/scuro. La tavola allegata conserva il confronto. I64px corrispondono alla dimensione usata da `traitTilesHtml`; è una prova visiva degli asset alla scala della scheda, non una dichiarazione di verifica browser. Non eseguite suite automatiche o prove browser, su istruzione dell’utente. L’agente produttore aveva documentato anteprime UI dei primi lotti, distinte dalla presente revisione.

## Materiale adottato

| Specie | Campo | Valutazione indipendente e limite |
|---|---|---|
| Fragolina | Portamento erbaceo; rosetta basale | Tre foglie trifogliate complete su piccioli convergenti alla corona, coerenti con foto3. Non assegnate ad altezza, stoloni o altre specie. Tre foglie è composizione esemplificativa, non conteggio costante. |
| Sambuco nero | Fiore/infiorescenza | Ramificazione ripetuta a quote diverse e insieme di piccoli fiori chiari, coerente con il corimbo in foto1. Categoria chiusa `ombrella` comprende il corimbo; il dato non viene riscritto. Vista frontale, non profilo laterale o anatomia degli stami. |
| Ebbio | Foglia composta | Rachide con terminale e quattro coppie di foglioline strette dentate, confrontato con foto3. Nove è un esempio; nessuna promessa di conteggio costante o identificazione. |
| Ebbio | Portamento erbaceo | Fusto verde eretto e non legnoso, foglie composte contrapposte e infiorescenza chiara. Foto1/3 supportano il carattere. Schema semplificato: non numero fisso di nodi né descrizione delle parti sotterranee. Non trasferito automaticamente al campo disposizione fogliare. |
| Rosa canina | Foglia composta | Sette foglioline ovali dentate su rachide imparipennato. Fonte locale fotografica parziale dichiarata; le due fonti istituzionali lette durante questa revisione documentano esplicitamente architettura e intervallo5–7. Nessuna modifica dei dati. |
| Rosa canina | Schema cinque petali, file esistente | Foto2 e dati ammettono cinque petali chiari. Autorizzato solo come schema della categoria; il centro semplificato non riproduce i numerosi stami, né afferma che tutti i fiori siano bianchi. |

Dentatura e nervature sono semplificate a64px; restano distinguibili corona basale, rachide e portamento. I colori botanici continuano a essere campioni, i valori null rimangono assenti. Il renderer esistente legge i collegamenti `species` senza nuovo codice.

## Materiale respinto

**Sambuco portamento r02 non importato.** I rami legnosi e la chioma migliorano il confronto con l’ebbio, ma diversi gruppi periferici appaiono trifogliati o disposti a ventaglio, invece di mostrare inequivocabilmente foglie pennate. Le masse interne sono neutre, ma il dettaglio involontario resta ambiguo. La revisione favorevole del produttore è un’ipotesi distinta: non sufficiente per pubblicare questo raster. Il master rimane nella consegna originale, la tavola di revisione ne conserva l’aspetto; nessuna sostituzione inventata.

I blocchi per portamento/foglia/frutto del finocchietto e frutti maturi di sambuco/ebbio restano aperti: non sono risolti da questi cinque asset. Nessuna voce di `asset-pending.json` corrisponde esattamente ai nuovi collegamenti botanici: non vengono eliminate pendenze micologiche o fotografiche estranee.

## Provenienza verificabile

Originali, prompt, normalizzazione, manifest del produttore e ricevuta con SHA256 di master/WebP/foto: `docs/assets/botanici-integrati-2026-10-18/`. I cinque WebP sono copie byte per byte delle consegne; nessun ritocco anatomico successivo. Illustrazioni generate con image_gen dal progetto, pubblicate CC BY-SA4.0. Fotografie di riferimento già nel catalogo: Andrea Moro / Dipartimento di Scienze della Vita, Università di Trieste, CC BY-SA4.0; crediti completi e URL per ciascun file nella ricevuta. Non acquisite nuove foto e non sostituite foto con immagini sintetiche.

Fonti botaniche canoniche già in catalogo:

- [Fragaria vesca, Università di Trieste](https://dryades.units.it/Roma/index.php?id=2073&procedure=taxon_page).
- [Sambucus nigra, Università di Trieste](https://dryades.units.it/Roma/index.php?id=5142&procedure=taxon_page).
- [Sambucus ebulus, Università di Trieste](https://dryades.units.it/Roma/index.php?id=5141&procedure=taxon_page).
- [Rosa canina, Università di Trieste](https://dryades.units.it/Roma/index.php?id=1972&procedure=taxon_page).

Riferimenti di produzione aggiuntivi della foglia di rosa canina, letti con il connettore web il18/10/2026: [Parco regionale dei Castelli Romani](https://www.parcocastelliromani.it/s/content/92003020580/1658828918.182), foglie imparipennate in genere5/7 foglioline; [Regione Sardegna / SardegnaForeste](https://www.sardegnaforeste.it/flora/rosa-canina),5–7 foglioline ovali/ellittiche dentellate. Usati solo per la morfologia illustrata, senza importare altre affermazioni delle pagine.

Rapporto asset eseguito come inventario, non suite: nessuna incoerenza immagini/dati, nessun dato cambiato dopo il disegno; piante-valori51/51 disponibili e piante-foto70/70. Il rapporto generale resta basato sulla produzione iniziale e mostra103fasi fungine mancanti, oggetto dell’import separato del coordinatore. La ricevuta botanica rende visibili i collegamenti per specie, non contabilizzati separatamente da quella riga aggregata. Il report completo è conservato accanto alla ricevuta.
