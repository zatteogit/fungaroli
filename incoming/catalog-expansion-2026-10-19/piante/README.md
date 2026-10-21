# Proposte botaniche del 19 ottobre 2026

Otto nuove schede per boschi e margini italiani: bugola strisciante, acetosella dei boschi, geranio di San Roberto, sanicola, viola silvestre, pervinca minore, cariofillata comune e stellina odorosa. I binomi e il sinonimo Asperula odorata sono stati confrontati con i cataloghi correnti: nessun doppione individuato.

`proposals.json` contiene record compatibili con `plants.json` e una mappa per ciascun carattere, habitat e periodo di fioritura. Le descrizioni sono parafrasi originali. Dryades / Università di Trieste fornisce il contesto italiano e i mesi; FloraWeb del Bundesamt für Naturschutz fornisce la morfologia di sette specie, Kew quella di Geranium robertianum. Non sono trasferiti all’Italia mesi di fioritura, distribuzioni o norme tedesche e irachene.

Le fotografie sono scelte per nitidezza, luce, sfondo e complementarità. Le tavole `review-*.jpg` confrontano 94 anteprime campionate lungo le gallerie complete; `selected.json` esplicita punto, riquadro, ruolo e didascalia di ogni scelta. Le tavole `crop-review-*.jpg` mostrano originale e sei ritagli reali. Per le corolle sono utili viste frontali e laterali; per le foglie, la lamina leggibile; sono documentati anche stolone della bugola e peli del geranio. Un particolare isolato della sanicola è rimasto tra i rigetti: la didascalia non attesta una fase precisa e la coppia fiore–foglia è più utile per i caratteri della scheda. Non sono dedotti età, stagione o calendario di fruttificazione dall’aspetto di una foto.

Le singole fotografie Dryades recano autore, credito universitario e licenza CC BY-SA 4.0 verificati sulla pagina esatta. Questa licenza fotografica non è estesa al testo di Dryades, FloraWeb o Kew. Gli HTML in `sources/` sono evidenze di ricerca; non sono testo proposto per l’app. Per Kew la lettura online è riuscita, mentre il successivo tentativo di archiviazione HTML ordinaria ha restituito HTTP 403: nessun ulteriore tentativo sullo stesso host. La nota di lettura conserva riferimento e fatti usati. Tutte le fotografie provengono da Dryades; nessuna acquisizione Commons.

Usi alimentari e sicurezza d’impiego non valutati, salvo riportare la tossicità esplicita di Vinca minor e l’avvertenza sugli ossalati di Oxalis acetosella. Nessun impiego alimentare o medicinale proposto. `protection: null` significa ricognizione normativa territoriale non svolta, non assenza di tutela. Nessuna presenza su un sentiero Fronda viene dedotta da queste fonti.

Originali conservati identici, con SHA-256 e SHA-1 locale: Dryades non fornisce un checksum remoto di confronto. Eventuali profili ICC diversi da sRGB sono convertiti prima della rimozione dei metadati. WebP normale con lato massimo 560 px e limite 80 kB; HD 1200 px e limite 220 kB; miniatura quadrata 160 px. Nessun EXIF, XMP o ICC negli export. Nessuna suite di test o dry-run; solo controlli dei materiali del bundle. Nessun file canonico modificato.

## Consegna congelata

20 fotografie approvate e 60 WebP per 8 schede. Acquisiti 21 originali: uno scartato e conservato con motivazione. Tutte le 20 foto approvate sono prive di ICC all’origine: nessuna conversione necessaria; sRGB assunto ed esplicitato. Controllati hash, limiti dimensionali e di peso, sei ritagli e assenza di metadati nei file esportati. Corretti i punti dei formati larghi di pervinca laterale e portamento della stellina per mantenere i fiori visibili.

| Scheda | Foto | Ruoli approvati |
|---|---:|---|
| Bugola strisciante | 3 | Fusto fiorito e disposizione dei fiori; Dettaglio della foglia; Stolone e foglie |
| Acetosella dei boschi | 2 | Dettaglio dei fiori; Portamento e foglie nel sottobosco |
| Geranio di San Roberto | 3 | Dettaglio del fiore; Foglia e sue divisioni; Peli sul fusto |
| Sanicola | 2 | Ombrellette fiorali; Foglia basale |
| Viola silvestre | 3 | Fiore visto di fronte; Fiore laterale e sperone; Foglia e base della lamina |
| Pervinca minore | 2 | Dettaglio frontale della corolla; Fusto fiorito, di lato |
| Cariofillata comune | 2 | Fiore visto di fronte; Foglia basale e segmento terminale |
| Stellina odorosa | 3 | Macro dei fiori; Verticillo fogliare; Portamento del fusto e verticilli |

La prima foto di ogni scheda nel manifest è la copertina editoriale proposta. `proposals.json` e `manifest.json` sono i materiali finali; gli script documentano il lavoro ma non vanno rieseguiti per importare. `SUMMARY.json` contiene gli hash finali. Nessun downloader autonomo attivo.
