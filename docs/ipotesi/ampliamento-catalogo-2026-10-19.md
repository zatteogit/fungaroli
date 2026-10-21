# Ampliamento del catalogo e selezione fotografica — 19 ottobre 2026

Mandato: catalogo misto, priorità funghi, fonti autorevoli e qualità fotografica; nessuna suite di test o dry-run. Base sincronizzata con produzione: 1ae354fe47fb96b6aeed381ae34ba3c195c6984c (v228).

## Valutazione editoriale

Le proposte dei tre agenti sono state confrontate con gli inventari esistenti. Accolte 12 specie fungine nuove, 8 piante e 9 animali con foto adeguate. Moscardino conservato soltanto nel bundle di ricerca, fuori dal catalogo pubblicabile perché nessuna fotografia candidata supera la selezione. Non si contano sinonimi o specie già comprese in aggregazioni come nuove acquisizioni.

Per i funghi: morfologia e habitat da Regione Campania, giudizi alimentari dalla guida micotossicologica Regione Piemonte; nomi comuni istituzionali dove attestati. Fonti puntuali e localizzatori in incoming/catalog-expansion-2026-10-19/funghi/claim-evidence.json. Testo originale in forma di osservazioni verificabili; niente assaggio come metodo. Divergenze delle fonti esplicitate. Nessun coefficiente, modello, presenza regionale o mese dedotto dalle fotografie o da specie simili. Le stagioni letterali restano testo. Nessuna illustrazione generata e nessuna fase strutturata inventata; le illustrazioni base mancanti sono pendenze dichiarate.

Piante: Dryades/Università di Trieste per profili italiani, BfN/FloraWeb e Kew per caratteri puntuali. Nessuna autorizzazione alimentare implicita. Animali: PNALM, Forestas e Parco Bosco delle Querce; ogni affermazione rimanda alle fonti del record. Nessuna presenza su un sentiero viene inferita dalla località di una foto.

## Fotografie

Commons API e originali rispondono HTTP 200; acquisizioni seriali separate per host, senza aggirare blocchi. I profili e i fatti biologici non dipendono dalle sole etichette fotografiche Commons/iNaturalist. Fotografie botaniche Dryades con licenza specifica. Originali, licenze, crediti e hash conservati nei bundle; ICC convertiti a sRGB prima della rimozione dei metadati, dove presenti.

Accettazione: soggetto nitido, luce e colori leggibili, composizione e separazione dal fondo, utilità di ogni vista. Dettagli possono prevalere sulla bellezza di copertina; fasi nominate soltanto se la fonte le documenta. Ogni nuova foto approvata ha sei ritagli e miniatura osservati dall’agente; tavole indipendenti del coordinatore archiviate nella cartella new-photo-review. Due foto del Macaone riutilizzate con crediti e file invariati, non contate come nuove acquisizioni.

Revisione esistenti: screening visivo di 327 fotografie fungine, seguito da controllo HD dei candidati dubbi e confronto con le alternative. Foto del Porcino segnalata dall’utente esclusa; file, provenienza e crediti restano archiviati. Decisioni ed esclusioni individuali nei JSON quality-review e photo-exclusions.

## Verifica prevista

Solo validazione diretta dei JSON, rapporto asset, verifica hash/metadati, controllo delle modifiche e lettura manuale dell’app. Nessuna suite, neppure nella CI. Controllo del rilascio e delle schede nel browser dopo integrazione.

## Esito locale

Integrate 29 nuove schede (12 funghi, 8 piante, 9 animali), 55 fotografie nuove e 2 riusi. Escluse 69 fotografie vecchie dalle gallerie; originali e file restano conservati. Le cinque sostituzioni ulteriori riguardano satanas, virescens, felleus e aereus, con macro separata del reticolo di felleus. Verificati nuovamente gli hash dei 165 export importati e i metadati WebP. Record scientifici preesistenti invariati. Validazione diretta dei quattro documenti riuscita; rapporto asset senza mancanze non elencate, incoerenze o disegni da rifare. Restano dichiarate 36 illustrazioni base future e le pendenze pregresse. Schede Vescia, Viola e Martora osservate nel browser locale, compreso visore del dettaglio dello sperone e crediti. Nessuna suite o dry-run eseguiti.

## Correzione del visore fotografico

Durante il riscontro online della v229 è emerso che la griglia del visore lasciava crescere la riga fino all’altezza intrinseca dell’immagine: fotografia verticale 900×1200 mostrata a 900×1200 dentro una finestra alta 720, con gambo nascosto. La griglia ora limita righe e colonne allo spazio disponibile: la stessa foto è mostrata intera a 540×720. Controllati manualmente nel browser anche zoom/riduzione e una foto orizzontale; nessuna suite. Shell v230.
