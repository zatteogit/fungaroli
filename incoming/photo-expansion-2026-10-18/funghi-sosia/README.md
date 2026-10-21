# Acquisizione fotografica dei sosia fungini · 18 ottobre 2026

Bundle separato: nessun catalogo pubblico, codice dell’app, Git o deploy modificato da questo agente.

- `metadata/`: risposte Commons dei singoli file, autore, licenza, SHA1 e categorie. La proprietà API `categories` può essere troncata dalla continuazione globale; `imageinfo.extmetadata.Categories` conserva l’elenco completo fornito dalla fonte.
- `download-plan.json`: coda Commons coordinata centralmente. Le prime 41 candidature coprono 41 taxa, poi vengono le viste aggiuntive. Una candidatura o un URL non è una foto acquisita.
- `originals/`: byte originali; acquisizione seriale eseguita dal coordinatore. SHA1 confrontato con Commons e SHA256 conservato nel manifest.
- `derived/`: WebP normale fino a lato 560 / 80 kB, HD fino a lato 1200 / 220 kB; dimensioni ridotte ulteriormente quando necessario. Miniature quadrate 160 px centrate. Nessun EXIF/XMP negli export.
- `review/`: tavole dei byte effettivi e dei sei ritagli della UI. `review-decisions.json` conserva le decisioni per il file esatto. Nessuna fase biologica dedotta.
- `manifest.json`: aggiornamento atomico; solo foto acquisite e approvate. `prepare.py` e `finalize.py` lavorano offline e non modificano `data/`.
- `inat-metadata/`, `inat-download-plan.json`: seconda fonte indipendente, scoperta tramite API iNaturalist. Research grade è uno stato comunitario, non una determinazione micologica ufficiale. Controllo del nome scientifico esatto, rango species, area europea e licenza della singola foto; nessun riuso di un’osservazione già veicolata da Commons.

## Scarti e limiti

Non si riprendono i sei sosia già arricchiti nel primo lotto, né disegni/fasi/ritagli già consegnati. Niente suite, dry-run, installazioni o modifiche di rete/credenziali.

La prima raccolta concorrente Commons è stata interrotta su richiesta del coordinatore dopo il rate limit osservato dal gruppo. In quel momento nessun originale era stato conservato dal collector. Il gate singolo aveva ricevuto byte HTTP 200 da `upload.wikimedia.org`; API Commons HTTP 200. Nessun valore Retry-After è stato osservato da questo agente e nessuna durata viene inventata.

`Inocybe lilacina` è esplicitamente di rango **complex** nell’API iNaturalist (taxon 1366614). Le relative nuove fotografie sono escluse dall’adozione come singola specie; il catalogo esistente resta invariato. `Chlorophyllum venenatum`: la sola candidatura Commons europea trovata è la stessa fotografia di riferimento già integrata. Alcune fonti per Sarcodon scabrosus e Tricholoma pardinum erano extraeuropee: scartate. Una fonte di Cortinarius orellanus aveva categoria Accuracy disputes: scartata, insieme alla stessa serie fotografica.

Licenze e attribuzioni si conservano come dichiarate dalla singola fonte; il nome Commons «Björn S...» non viene espanso sulla base di supposizioni. Per file dichiarati come focus stack la natura fotografica della fonte resta documentata nei metadati, senza dichiararli scatti singoli.

## Lotto congelato

Acquisiti **140 originali**. Approvate **125 fotografie distinte per 43 taxa**: 67 Commons e 58 iNaturalist. Scartate 15; nessuna revisione pendente. I 375 WebP approvati occupano 24.897.728 byte. Osservati 750 ritagli e 125 miniature reali. Audit con zero problemi.

I 15 profili Display P3 / Adobe RGB sono stati convertiti in sRGB per preservare la resa sul Web; nessun ritocco creativo. Originali invariati, EXIF/XMP assenti negli export. La conversione è dichiarata nel campo changes delle foto interessate.

Manifest SHA256: `4903f2d32513945abe4824f1fffc572902f62c512256787e4a83bec332037b02`.

Stato definitivo in `freeze.json`, integrità e pesi in `audit.json`, confronti per contenuto in `duplicate-audit.json`. Nessun processo di acquisizione o preparazione attivo. Non riavviare `collect.py`: conserva il tentativo iniziale concorrente; i download Commons del lotto sono stati coordinati serialmente dal parent.
