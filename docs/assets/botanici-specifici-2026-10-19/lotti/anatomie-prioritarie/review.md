# Anatomie prioritarie — revisione produttore, 19 ottobre 2026

25 specie, 73 raster per 75 caratteri.12 raster erano già approvati indipendentemente;61 raster nuovi restano in `candidates/` e richiedono revisione indipendente prima di qualunque integrazione. Il registro propone i percorsi canonici ma distingue `candidatePath` e stato. Non sono stati modificati dati, indice, JavaScript, CSS, serviceworker; nessuna suite, test, dry-run, commit o pubblicazione.

## Metodo

Foto reali osservate e confrontate con fonti botaniche primarie, poi image_gen raster, revisione e correzioni raster. Esportazioni 384 × 384 RGBA lossless/exact, hash verificati. Le tavole mostrano anche una riduzione 64 px. I dettagli isolati in geometria mantengono i pixel anatomici del master. Nessuna foglia o fiore costruito con SVG o disegnato in codice. Fonti e foto per ogni carattere in `registry-proposal.json`; hash dei master e dei prompt in `generation-log.json`.

Le nuove foto di documentazione sono conservate fuori dal repository in `fronda/output/botanical-references/anatomie-prioritarie/`. Il registro cita gli URL; non sono state consegnate nel repository fotografie senza licenza. I riferimenti già presenti nel catalogo sono rimasti al loro posto.

## Correzioni ed esclusioni significative

- Genziana maggiore e veratro: foglie e nervature diverse, disposizione opposta/alternata distinta; il veratro è V.lobelianum nel catalogo.
- Aglio orsino: correzione delle nervature longitudinali arcuate; capsula trilobata SOLO in formazione, provata nella foto 4 e approvata indipendentemente da parent/root. Il colore del frutto resta nullo. Didascalia «Capsula in formazione».
- Digitale gialla: taxon effettivo Digitalis micrantha, non D.lutea; foglie strette debolmente dentate e piccole corolle con macchie all'imboccatura, come fonte Provincia di Prato e foto reali.
- Tarassaco: corpo dell'achenio ridimensionato in raster; pappo con peli semplici, mai peli ramificati botanicamente piumosi. Didascalia «Achenio con pappo».
- Anemone: lamina larga divisa in 3 segmenti principali, non foglia simile a felce; il fiore singolo con tepali numerosi non diventa un capolino.
- Hepatica: lamina CONTINUA trilobata, non 3 foglioline da trifoglio, corretta con image_gen.
- Scilla: due correzioni fino a 6 antere separate e uno stilo centrale; master finale separato.
- Giglio rosso: correzione fino a 6 antere, poi una revisione isolata per togliere l'antera eccedente.
- Croco:6 tepali, 3 antere e stilo trifido; la foglia ha striscia centrale bianca.
- Orchidee: labelli e caschi confrontati con foto ravvicinate reali; non usati fiori generici. Queste figure restano particolarmente soggette a revisione indipendente.
- Datura: calice del primo raster errato a sepali liberi, sostituito via image_gen con calice TUBOLARE dentato. Capsula verde spinosa rappresenta una fase immatura, non altera il colore nullo del frutto.
- Gigaro: infruttescenza colonnare a bacche in maturazione da foto primaria Andrea Moro, Università di Trieste, 23/07/2005, CC BY-SA 4.0; successiva correzione allo stile piatto.
- Colchico:3 tentativi del fiore aperto con conteggi errati di stami/stili sono scartati. L'ultimo candidato mostra SOLO il perigonio in vista laterale di fiore semichiuso:6 tepali visibili, stami/stili naturalmente nascosti. Non usare per confrontare il numero degli stami con Crocus. Revisore indipendente deve valutare se la rappresentazione è abbastanza utile.

## Blocchi

22 caratteri in `blocked.json`, distinti da quanto è pronto.19 sono frutti non documentati con fotografia sufficiente nella selezione esaminata; non è una dichiarazione che non esistano foto online. Prima di generare una capsula serve una nuova fotografia primaria che ne mostri forma e fase. Gli altri 3 sono 2 caratteri della foglia di Aristolochia e il frutto di Helleborus con conflitto nei dati.

Aristolochia: il dato dice dentato, GoBotany/NativePlantTrust dice intero;Meller 2014 citaNardi 1984 per margine MINUTAMENTE dentato nelle piante italiane. Occorre chiarire scala e variabilità, senza disegnare grandi denti arbitrari. Anche la foglia intera è sospesa per la coerenza con la scheda. Helleborus: fonte FloraHelvetica descrive 3–8 follicoli, mentre il catalogo indica capsula. Nessun dato alterato per adattarlo alla figura.

## Tavole

`contact-sheet-final.png` riunisce i 73 raster. Tavole di lotto: `candidates-contact-sheet.png`, `new-leaves 1-contact.png`, `new-leaves 2-contact.png`, `new-leaves 3-contact.png`, `new-flowers 1-contact.png`, `new-flowers 2-contact.png`, `new-other-organs-contact.png`. Il registro e la tavola finale sono autorevoli per lo stato; alcuni master intermedi conservati contengono parti scartate e NON vanno esportati indiscriminatamente.
