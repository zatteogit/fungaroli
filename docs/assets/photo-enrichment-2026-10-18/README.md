# Arricchimento fotografico · 18 ottobre 2026

**Stato: ricerca avviata, acquisizione bloccata dalla rete. Zero nuove foto scaricate o pubblicate.**

Base: produzione `bcd1488` (PR 119, shell v175). Nessuna modifica ai dati scientifici, ai cataloghi pubblici o al CMS. I candidati non diventano foto dell’app prima dell’acquisizione, del controllo visivo e dell’integrazione.

## Copertura effettiva

Inventario riproducibile in `coverage.json`, ottenuto da **tutti** i contenitori `ref`, `inat`, `commons`, `photos`, non dal nome della fonte. Anche Dryades può comparire nel contenitore storico `commons`.

| Ambito | Copertura |
|---|---|
| Funghi principali: 36 record | 2 hanno una foto; 23 ne hanno due; 1 ne ha tre; 10 ne hanno quattro |
| Sosia: 51 record | Tutti hanno una sola foto |
| Inocybe spp. | Nessuna: eccezione approvata per il genere intero; non aggiungere la foto di una sola specie |
| Piante: 70 schede | 13 hanno due foto; 53 tre; 2 quattro; 2 cinque |
| Alberi: 39 schede | 20 hanno tre foto; 11 quattro; 8 cinque |
| Luoghi: 15 | 9 hanno una foto reale; 6 nessuna |

Le varianti di stagione/meteo generate non contano come nuove fotografie reali. Tutti i file fotografici riferiti dall’inventario esistono. Nessun duplicato binario interno alle gallerie. Cento record fotografici storici non esplicitano `licenseUrl`: il dato è una pendenza documentale, non prova di assenza di licenza.

Priorità: Porcino estivo e Agarico violetto (una foto), sosia (una foto, puntare su parti diverse), tredici piante con due foto, luoghi con foto mancanti. Per questi ultimi rispettare le eccezioni già documentate: non usare panorami di altre zone o foto dei centri abitati per riempire un vuoto. Gli alberi hanno già almeno tre immagini; nuove foto devono aggiungere un dettaglio utile.

## Primo lotto: 12 candidati, non acquisiti

`candidates.json` contiene pagine del **singolo file** Commons lette e confrontate con autore, licenza e descrizione: sei foto di funghi, tre di piante, due di alberi e una del Monte Tancia. Solo CC BY / CC BY-SA. La coda conserva anche pagina originale iNaturalist/Flickr/GBIF/BioLib quando indicata. `original_file_link` risolve il file Commons; l’URL binario effettivo e il suo hash saranno registrati solo dopo l’acquisizione API.

Controllo visivo, ritagli e qualità **non sono ancora verificati**: nessuna foto è approvata per il prodotto. Le descrizioni di dettaglio sono limitate a quanto afferma la fonte (habitat, portamento, fiori); gli altri caratteri restano non assegnati. L’acero è identificato alla specie: la sottospecie della scheda richiede un controllo prima dell’uso. L’agrifoglio conserva l’attribuzione richiesta **© Hans Hillewaert**. La foto del Tancia è un contesto geografico documentato, non un’osservazione corrente.

Scartati in ricerca: `Lepista nuda 60878.jpg` descrive fibre da velo universale in maniera sospetta per il taxon; `Boletus aestivalis 8.jpg` appare usato anche sotto *Imperator torosus*. Non basta il nome del file per sciogliere questi dubbi. Nessuno dei due entra nella coda. Esclusa anche la foto della foglia di Acer inizialmente caricata come pianta ignota: preferita una fonte con identificazione più chiara. Queste sono cautele di selezione, non nuove determinazioni scientifiche.

## Blocco di rete verificato

Richieste HTTPS dirette dal container: **Tunnel connection failed: 403 Forbidden** prima di ricevere i byte della risorsa.

- `https://api.inaturalist.org/v1/observations` (qualità research e licenza fotografica libera);
- `https://commons.wikimedia.org/w/api.php` (metadati per file);
- host immagini `upload.wikimedia.org`, `static.inaturalist.org`, `inaturalist-open-data.s3.amazonaws.com`;
- `https://dryades.units.it`.

La lettura testuale delle pagine Commons tramite strumento web funziona; il download binario via shell no. Nessun cambio proxy, gateway alternativo o caricamento su servizi esterni. L’esito esatto della prima acquisizione è in `incoming/photo-enrichment-2026-10-18/acquisition.json`. Nessun originale locale aggiuntivo con provenienza certa trovato: le cinque foto storiche in `inbox/` sono già presenti nei cataloghi e non sono state contate come nuove.

## Ripresa

```bash
python3 tools/photo-enrichment.py inventory
python3 tools/photo-enrichment.py acquire --limit 12
python3 tools/photo-enrichment.py prepare
```

`acquire` controlla di nuovo autore/licenza del singolo file via API, registra URL originale, SHA-256 e dimensioni, verifica SHA-1 della fonte e conserva gli originali. In caso di metadati cambiati si ferma per revisione; sul primo 403 interrompe il lotto. Non salva GPS o EXIF nei registri. L’originale rimane materiale interno di provenienza, non asset pubblico.

Dopo il download bisogna ispezionare ogni immagine, confrontarla con quelle già presenti, confermare soggetto/attribuzione e compilare `visual_review` con `approved`, `attribution_approved`, `punto` e `riquadro` 0–1. Non impostarli soltanto per completare la coda. `prepare` rifiuta le foto prive di revisione/ritagli validi: crea WebP 560 px e HD fino a 1600 px, miniatura 160×160 centrata con lo stesso algoritmo del progetto, punti di ritaglio nei sei formati, metadati di modifiche e attribuzione. Nessun ingrandimento artificiale o ritocco generativo; gli output ricopiano solo i pixel orientati, senza EXIF.

Prima dell’integrazione: verificare i sei ritagli e confrontare con l’originale, conservare strutture essenziali, garantire alternative alle quasi-duplicazioni. Copiare gli asset accettati nei percorsi finali e aggiornare insieme catalogo, `crop-points.json` ed eventuali pendenze. Conservare la licenza SA delle derivazioni, autore originale e autore dell’eventuale ritaglio; dichiarare ridimensionamento/compressione/ritaglio. Non rimuovere cautele o attribuzioni per ottenere una card più compatta.

CMS: i cataloghi fotografici e le piante sono `REPOSITORY_REFRESHED`, ma il deploy non sovrascrive documenti modificati da un autore o con bozza pendente. Prima di pubblicare verificare che lo snapshot pubblico includa le nuove foto; se serve intervenire sul CMS, usare il flusso con revisione autorizzato, senza scritture dirette a D1. La pipeline di questo lotto prepara soltanto file locali e non modifica il CMS.

## Verifiche

- Inventario completo generato: 212 record, inclusa l’eccezione Inocybe.
- Candidature: autore, licenza con URL e pagina fonte su tutti i 12 record; nessuna approvazione visiva falsa.
- Acquisizione: 403 confermato; preparazione restituisce zero asset.
- Prova locale della pipeline su una foto già presente, in cartella temporanea: dimensioni, EXIF assente, hash, miniatura e controllo approvazione verificati (nessuna foto di prova entra nel lotto).
- `node tools/asset-report.mjs`: nessuna incoerenza, nessun asset da rifare; rapporto base completo allegato. Non è una prova di acquisizione delle candidature.
- Nessuna suite completa o modifica all’app.
