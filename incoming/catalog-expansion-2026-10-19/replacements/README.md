# Copertine fungine: proposte sostitutive

Scouting mirato su quattro schede con fotografie deboli: Rubroboletus satanas, Russula virescens, Tylopilus felleus e Boletus aereus. Le fonti già presenti in `data/media.json` sono escluse dalla consegna. Nessun file canonico è modificato.

Le tavole dei candidati e `existing-covers.jpg` rendono confrontabile il salto fotografico: soggetti grandi e leggibili, cappello e gambo nello stesso quadro, esposizione utile e dettagli nitidi. Sono state esaminate 36 anteprime. Per Tylopilus felleus la ricerca è stata estesa perché il primo gruppo comprendeva esemplari danneggiati, ingombri o immagini poco complementari. Non si aggiungono varianti solo per raggiungere due foto per taxon.

Le singole pagine Commons sono state lette e confrontate con autore, licenza e attestazione del taxon nell’API. La descrizione storica Boletus satanas è accompagnata dall’attuale categoria e dal dato strutturato Rubroboletus satanas. Russula viridirubrolimbata, un preparato da museo e un candidato asiatico ambiguo di Russula sono stati esclusi. Per Russula virescens duo è stata verificata anche la fonte primaria iNaturalist 134413554: identificazione attuale R. virescens, research grade, Romania, foto 229109186 CC BY-SA. Per Tylopilus felleus 11.jpg è stata verificata iNaturalist 94886653: identificazione attuale T. felleus, research grade, foto 157455599 CC BY. La pagina Commons segnala che la precedente etichetta CC BY-SA non era verificata: si usa la licenza CC BY 4.0 effettivamente attestata dalla revisione e dalla fonte primaria.

I file provengono da Commons, comprese le due foto originariamente pubblicate su iNaturalist. Gli originali Commons rimangono identici: SHA-1 confrontato con l’API e SHA-256 locale. Nel caso di Russula virescens duo il file Commons è già un ritaglio dichiarato dalla fonte; non viene considerato una nuova osservazione né una fase distinta. Nessuna età, stagione o presenza italiana viene ricavata dall’aspetto.

Download strettamente seriali, con almeno 8 secondi tra richieste a upload.wikimedia.org. Arresto immediato previsto su HTTP 403/429 e conservazione di Retry-After, senza retry o varianti di URL. Nessuna suite di test o dry-run. Il bundle piante già congelato non è stato toccato.

Gli export applicano orientamento EXIF e conversione ICC a sRGB prima della rimozione dei metadati, quando necessaria. Limiti: normale 560 px / 80 kB, HD 1200 px / 220 kB, miniatura quadrata 160 px. I sei formati sono calcolati con `import_crop_points.positions`. Le tavole mostrano i ritagli reali; il formato 16:7 privilegia cappello e parte alta del gambo per le fotografie verticali. L’originale completo rimane disponibile nel visore.

## Lotto finale congelato

5 fotografie approvate, 15 WebP e 30 posizioni di ritaglio. Un profilo ICC sRGB presente, quattro originali senza profilo: nessuna conversione da altri spazi colore necessaria. SHA-1 dei cinque originali identico all’API Commons; SHA-256 e dimensioni degli export in `file-audit.json`. Zero errori 403/429; nessun Retry-After; nessun processo di download attivo.

| Taxon | Foto | Scelta |
|---|---:|---|
| Rubroboletus satanas | 1 | Holger Krisp — Copertina proposta: cappello e gambo leggibili |
| Russula virescens | 1 | xulescu_g — Copertina proposta: due esemplari nitidi |
| Tylopilus felleus | 2 | Pfefferdose — Copertina proposta: esemplare nel muschio; Annie Weissman (wearethechampignons) — Complementare: cappello, pori e reticolo |
| Boletus aereus | 1 | Paffka — Copertina proposta: esemplare nel sottobosco |

I quattro punti delle immagini verticali o a due soggetti sono stati rifiniti e riguardati: cappello conservato nelle copertine 16:7; per il dettaglio complementare di T. felleus il formato largo concentra invece pori e reticolo. `manifest.json` è congelato; `SUMMARY.json` contiene l’hash. La valutazione è una proposta editoriale, nessuna copertina è stata già sostituita.
