# Valutazione indipendente degli otto SVG · 18 ottobre 2026

## Decisione proposta al coordinatore

Conservare gli **otto SVG come sorgenti editabili**, mantenendo gli otto WebP già collegati alle schede e al confronto. Nessun nuovo carattere o specie è coperto da queste conversioni: contare otto SVG aggiuntivi come otto nuove illustrazioni visibili sarebbe scorretto. Il materiale disponibile è stato acquisito in `docs/assets/vettoriali-revisionati-2026-10-18/`, con raster di confronto, record originali, prompt, revisione raster, annotazioni anatomiche, hash e manifest di collegamento alla UI.

La richiesta del proprietario autorizza l'integrazione del materiale utile; questa valutazione è tecnica/editoriale e rimane sottoposta alla revisione finale del coordinatore. Non è una certificazione botanica/micologica né un'autorizzazione a generare nuove combinazioni di caratteri.

## Revisione svolta

Ispezionati individualmente tutti gli otto render SVG a larghezza 656 px e i confronti raster/SVG a 128 e 64 px, su superfici chiara e scura. Il foglio conservato usa i colori di fondo Fronda; non è una prova dell'intera pagina Safari. Non sono state eseguite suite automatiche o test browser, come richiesto dal proprietario.

Per le piante sono state aperte le fotografie effettive del catalogo: `assets/plants/fragolina-1.webp` (frutto), `fragolina-2.webp` (foglia), `finocchietto-1.webp` (fiori minuti), `rosa-canina-1.webp` (cinorrodo). Fonti testuali e precedenti revisioni sono nei record conservati e in `docs/assets/correzioni-botaniche-2026-10-18/REVISIONE.md`. Per le russule il controllo è limitato alla fedeltà della conversione del raster r03 già approvato e alle note dell'aggregato nei dati; non costituisce nuova validazione fotografica del taxon.

| Soggetto | Valutazione circoscritta |
|---|---|
| Fragolina, foglia | Tre foglioline dentate e picciolo conservati. Nessuna fogliolina aggiunta. Le nervature rimangono idealizzate e non attestano pelosità o scala. |
| Fragolina, frutto ottimizzato | Acheni esterni ancora distinguibili sul ricettacolo rosso, calice/peduncolo conservati. Non compare anatomia interna. La versione ottimizzata conserva la complessità del tracciato: 885 path. |
| Finocchietto, ombrella | Ramificazione composta e punti gialli conservati. I punti sono convenzioni grafiche, non corolle o numero botanico di petali. A 64 px i raggi sono sottili; nessuna nuova informazione rispetto al WebP. |
| Rosa canina, cinorrodo | Esterno ovale, residuo calicino e peduncolo agli estremi opposti. Non sono stati introdotti acheni esterni, cavità o peli interni. |
| Russula rosa, cappello/intero | Superficie liscia, lamelle chiare, gambo chiaro nell'intero. Nessun mosaico trasferito dalla sola virescens. |
| Russula violetto, cappello/intero | Stessi limiti del rosa. Il file interno `virescens` rappresenta un aggregato comprendente cyanoxantha: non trasformare queste immagini in un ritratto diagnostico della sola R. virescens. |

Tutti gli SVG contengono soltanto `svg`, `title`, `desc`, `metadata`, `g` e `path`; nessun riferimento esterno, bitmap incorporato, script, clip o maschera rilevato nell'ispezione XML. Il controllo non promuove automaticamente la precisione dei confini semantici: separare o nascondere gli organi non ricostruisce tessuti occlusi e non autorizza nuove tinte/forme.

## Peso e collegamento effettivo

| Asset | SVG, byte | WebP attuale, byte |
|---|---:|---:|
| Fragolina, frutto ottimizzato | 576986 | 9710 |
| Finocchietto, ombrella | 597200 | 9048 |
| Rosa canina, cinorrodo | 155956 | 6602 |
| Fragolina, foglia | 260169 | 12620 |
| Russula rosa, cappello | 112197 | 3520 |
| Russula rosa, intero | 123558 | 5086 |
| Russula violetto, cappello | 101630 | 3416 |
| Russula violetto, intero | 117249 | 4858 |

Confronto dei file locali non compressi: non misura il traffico HTTP né i tempi di composizione. Anche la fragolina ottimizzata pesa circa 59 volte il WebP. Alle dimensioni attuali delle tessere (64 px nel renderer botanico, `js/guided-key.js`) non emerge un miglioramento visibile tale da giustificare questo carico. Nessuna modifica a runtime, dati biologici, indici asset pubblici, cache o precache.

`data/plant-trait-icons.json` collega già i quattro raster specifici tramite `species`; il renderer sceglie questi override prima delle icone generiche. `data/trait-icons.json` include già entrambe le varianti di colore delle russule e i quattro WebP provengono dalla correzione liscia r03 documentata in `docs/assets/import-delta-funghi-2026-10-18.json`. Il nuovo manifest registra per ciascuno il file UI, il suo hash e la sorgente SVG: nessun asset resta presentato come nuova copertura in attesa di collegamento.

## Limiti residui

- Le conversioni sono utili per futura modifica editoriale o esportazione grande, non aggiungono fotografie o categorie mancanti.
- La revisione non autorizza riusi del cinorrodo per fragolina, dell'ombrella per altre specie o del fungo intero come conferma di inserzione delle lamelle.
- Nei `source-record.json` sono conservati anche percorsi assoluti del worktree produttore; per consultare l'archivio qui usare `source.png`, `semantic.svg`, `anatomy.json` e il manifest locale. Le pipeline originali di ricostruzione restano nel ramo produttore, senza duplicare l'intero laboratorio o gli scarti nel sito.
