# Fotografie reali · lotto locale del 18 ottobre 2026

Base aggiornata dalla produzione: `aaade0c` (PR134). Nuovo ramo `codex/foto-materiali-2026-10-18`. La cartella di lavoro è `/Users/matteo/Documents/ChatGPT/fronda/fungaroli`; il checkout storico `immagini` conserva le modifiche locali preesistenti.

## Acquisizione e decisioni

Accesso effettivo ai due domini Commons verificato dalla rete ordinaria di questo Mac: API dei metadati e 20 originali scaricati, con SHA-1 verificati contro Commons e SHA-256 conservati. Non è una modifica della policy del precedente container cloud. Nessun proxy, percorso o hostname alterato.

Sono integrate **18 fotografie distinte**, con 54 WebP fra normale, HD e miniatura. Gli originali e le ricevute stanno in `incoming/photo-enrichment-2026-10-18/`; il conteggio non comprende derivati, disegni o ritagli della stessa foto.

| Scheda | Prima | Dopo |
|---|---:|---:|
| Porcino estivo (`aestivalis`) | 1 | 5 |
| Agarico violetto (`nuda`) | 1 | 4 |
| Amanita phalloides | 1 | 3 |
| Amanita virosa | 1 | 2 |
| Amanita verna | 1 | 2 |
| Tylopilus felleus | 1 | 2 |
| Rubroboletus satanas | 1 | 2 |
| Omphalotus olearius | 1 | 2 |
| Bucaneve | 2 | 3 |
| Aristolochia | 2 | 3 |
| Erba trinità | 2 | 3 |
| Agrifoglio | 3 | 4 |

14 foto fungine e 4 botaniche. Viste complementari del cappello, pori/lamelle, gambo e base; non si attribuiscono fasi biologiche o caratteri nascosti. Due foto di AnRo0002 mostrano separatamente la vista dall’alto e dal basso: sono scatti distinti, non ritagli. dHash, URL e hash aiutano a verificare i duplicati; la decisione include il confronto visivo.

Le foto hanno autore, pagina della fonte, licenza, link alla licenza, attribuzione, hash originale e modifiche. Esportazione con orientamento, ridimensionamento e compressione; nessuna correzione di colore o generazione. EXIF/XMP assenti nei 54 export. L’HD del bucaneve è ridotto ulteriormente per stare sotto 220 kB. Originali conservati senza alterazione; non sono asset pubblici del sito.

Tre candidature non integrate: `Amanita virosa-03.jpg` non acquisita perché manca `LicenseUrl`; foto dell’acero acquisita ma fonte alla sola specie, mentre la scheda è alla sottospecie; veduta Tancia acquisita e osservata ma non sostituisce la copertina corrente e non viene contata come foto disponibile nella scheda. Le due candidature storiche ambigue indicate nell’handoff non sono state riprese.

## Integrazione e verifiche circoscritte

- `data/media.json`: gallerie funghi/sosia nell’elenco legacy `inat`, letto dai renderer esistenti; ogni voce dichiara correttamente `source: Wikimedia Commons`. Nessuna modifica al renderer o alle relazioni scientifiche.
- `data/plants.json`, `data/media-trees.json`: foto collegate ai rispettivi cataloghi; miniature e punti di ritaglio nei sei formati esistenti, preservando quelli precedenti.
- `media`, `plants` e `media-trees` rientrano già in `REPOSITORY_REFRESHED`: CMS aggiorna soltanto seed e documenti dell’ultima release, proteggendo revisioni degli autori. Importabilità dei tre JSON controllata tramite il validatore di contenuto esistente, senza suite.
- Tutte le foto osservate e tutti i ritagli esaminati nelle cinque tavole `crop-review-*.jpg`. Le anteprime ritagliate possono escludere parti dei gruppi; nel visore resta la foto completa, senza attribuire al ritaglio caratteri che non mostra.
- Ispezione nell’app locale per porcino estivo (5 foto), nuda (4), Amanita phalloides (3); visori di nuove foto con autori/licenze visibili. Schermate locali conservate; nessuna verifica di Safari dichiarata.
- Rapporto asset: zero incoerenze, zero disegni da rifare, zero mancanze non elencate. Nessuna pendenza minima rimossa perché le schede avevano già almeno una foto. Le 18 mancanze fotografiche Animali restano aperte.
- Shell e meta `app-version` aggiornati insieme a **v226**.
- Nessuna suite unit/browser e nessun dry-run avviati, come richiesto. Commit e merge con `[skip ci]` per non attivare indirettamente le suite GitHub; controlli mirati sopra descritti, senza dichiarare test verdi.

Prima del rilascio lo snapshot pubblico mostrava ancora una foto per `aestivalis` e `nuda`. Esito di PR, deploy e verifica dello snapshot dopo rilascio da riportare nel seguito di questo documento.

## Lavoro successivo

Restano 23 record principali con due foto e 45 sosia con una foto: cercare viste complementari, prima nei sosia ancora poveri, poi nelle altre schede. Restano 10 piante con due foto e 18 schede Animali senza foto. Le candidature animali e i blocchi tassonomici documentati non sono consegne acquisite. Non rifare le fasi fungine, raster botanici, copertine o SVG già adottati dalla PR133.

## Rilascio del lotto

PR135 unita nel commit `df8628e`. Le istruzioni generiche per saltare la CI hanno omesso anche Workers Builds; il sito è rimasto a v225. Credenziale Wrangler locale scaduta, nessuna modifica delle credenziali o delle protezioni. Per il seguito si usa il trailer GitHub `skip-checks: true`, documentato per omettere le suite Actions senza modificare il workflow. Si chiarisce anche la provenienza nel campo storico `inat` di media.json. Shell/meta v227. La pubblicazione effettiva viene verificata separatamente: un merge da solo non la dimostra.
