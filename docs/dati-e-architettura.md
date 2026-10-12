# Dati e architettura

Documento tecnico: da dove vengono i dati, come si rigenerano, che forma hanno, come è fatto il front-end, come si pubblica e come si estende. Per il modello vedi [metodo-scientifico.md](metodo-scientifico.md), per l'uso [guida-uso.md](guida-uso.md).

## In una frase

Un sito statico senza build: HTML, CSS e moduli ES che leggono tre file JSON precalcolati (`data/`) e chiedono il meteo a Open-Meteo dal browser. Gli script in `tools/` rigenerano i JSON quando cambiano le zone. Uno script Node impacchetta tutto in un unico HTML per la versione Artifact.

## Fonti dati e licenze

| Fonte | Cosa fornisce | Dove si usa | Licenza e condizioni |
|---|---|---|---|
| **Regione Lazio, Carta Forestale su base tipologica** | Poligoni dei tipi forestali (campi `categoria`, `tipologia`). WFS e WMS `geonode:tipi_forestali2` su `https://geoportale.regione.lazio.it/geoserver/ows`. | `build_habitat.py`, `build_trails.py` (WFS); `build_basemap.py` e mappa del sito (WMS); legenda (`GetLegendGraphic`) | Open data regionale. La scheda su dati.lazio.it al momento della verifica riportava "Nessuna licenza trovata" pur esponendo il badge CC BY 4.0 nel piè di pagina: conviene citare sempre "© Regione Lazio". Dataset creato nel 2015, dati modificati nel 2020. |
| **Open-Meteo Forecast API** | Pioggia giornaliera, temperatura media/min/max, umidità del suolo 3-9 cm e temperatura del suolo a 6 cm (orarie, aggregate per giorno). Parametri: `past_days=62`, `forecast_days=8`, `elevation` per fascia, `timezone=Europe/Rome`. | `js/weather.js` (sito, dal browser); `build_artifact.mjs` (fotografia) | Dati CC BY 4.0 con attribuzione a Open-Meteo. L'API gratuita è per uso non commerciale, con limiti indicativi di 10.000 chiamate al giorno. L'app fa una sola chiamata per tutte le 21 coppie zona-fascia. |
| **Open-Meteo Elevation API** | Quota dei punti (DEM Copernicus GLO-90, 90 m, modello di superficie). Fino a 100 coordinate per chiamata. | `build_habitat.py`, `build_access.py`, `build_trails.py` | Come sopra; va citato anche il programma Copernicus. |
| **OpenStreetMap** | Rete stradale e sentieristica. | tramite Valhalla, OSRM, Waymarked Trails, tile | ODbL 1.0, attribuzione "© OpenStreetMap contributors". |
| **Valhalla** (server pubblico FOSSGIS `valhalla1.openstreetmap.de`) | `/route` e `/trace_attributes` per tempi, strade e fondo del percorso Rieti-sosta; `/locate` per la strada carrozzabile più vicina a ogni punto campione. | `build_access.py`, `build_habitat.py` | Servizio gratuito senza garanzie, da usare con moderazione. Gli script inseriscono pause tra le richieste. |
| **OSRM** (server demo `router.project-osrm.org`) | Percorso auto Rieti-prima sosta. | `build_trails.py` (campo `drive`) | Server demo non adatto a uso intensivo; richiede attribuzione ODbL e OSRM. Nota: il campo `drive` prodotto non è usato dal front-end, che legge i tempi da `access.json` (Valhalla). |
| **Waymarked Trails** (`hiking.waymarkedtrails.org/api/v1`) | Elenco delle relazioni escursionistiche per area e geometria dettagliata di ciascuna. | `build_trails.py`; link "Tracciato e profilo" nella scheda | Dati OSM (ODbL). Software GPL v3. Non ho trovato condizioni d'uso esplicite per l'API. |
| **OpenTopoMap** | Tile topografiche. | Mappa del sito (online); `build_basemap.py` (mosaico zoom 12 per l'Artifact) | CC-BY-SA, attribuzione "© OpenStreetMap contributors, SRTM, © OpenTopoMap (CC-BY-SA)". Per usi più intensi del normale il progetto chiede di essere contattato. |
| **Leaflet 1.9.4** | Libreria della mappa. | Caricata da cdnjs sia nel sito sia nell'Artifact | BSD-2-Clause. |

Attribuzioni visibili: il piè di pagina di `index.html` cita OpenStreetMap, OpenTopoMap, Open-Meteo e Regione Lazio; nell'Artifact la riga sulle tile online viene tolta e l'attribuzione della base incorporata è quella di `assets/basemap.json`.

## Gli script di build

Tutti gli script stanno in `tools/`, leggono `data/zones.json` e scrivono un solo file. Vanno lanciati dalla radice del repository.

| Script | Produce | Dipendenze | Quando rilanciarlo |
|---|---|---|---|
| `build_habitat.py` | `data/habitat.json` | Python 3, `shapely`, `pyproj`, `curl` | Quando cambia centro, raggio o elenco delle zone, o quando la Regione aggiorna la Carta Forestale. |
| `build_access.py` | `data/access.json` | Python 3, `curl` (importa funzioni da `build_habitat.py`, quindi servono comunque `shapely` e `pyproj`) | Quando cambiano i punti di sosta o l'origine; ogni tanto, se OSM cambia la viabilità. |
| `build_trails.py` | `data/trails.json` | Python 3, `shapely`, `pyproj`, `curl` | Quando cambiano le zone; una o due volte l'anno per aggiornare i sentieri OSM. |
| `build_basemap.py` | `assets/basemap-topo.webp`, `assets/basemap-forest.webp`, `assets/forest-legend.png`, `assets/basemap.json` | Python 3, Pillow | Solo se una zona esce dal riquadro fisso `BBOX = (12.62, 42.10, 13.46, 42.72)` o se cambia la Carta Forestale. |
| `build_artifact.mjs` | `dist/fungaroli.html` | Node, `esbuild` 0.24.0 (`npm i`), `curl` | Ogni volta che si vuole aggiornare la versione Artifact (meteo compreso). |

### Cache e ripresa

`build_habitat.py` ha una funzione `get_json` che scarica con `curl` (più robusto dietro proxy), riprova fino a 8 volte con attesa crescente fino a 60 secondi e salva ogni risposta riuscita in `.cache/http/<sha1 dell'URL>.json`. Anche `build_access.py` e `build_trails.py` la usano per WFS, quota, liste Waymarked Trails e OSRM; i dettagli delle relazioni dei sentieri vanno in `.cache/wmt/<id>.json`. Le chiamate POST a Valhalla (`/locate`, `/route`, `/trace_attributes`) **non** passano dalla cache e vengono rifatte ogni volta.

Conseguenze pratiche: un build interrotto riparte in fretta; per forzare dati freschi (per esempio dopo un aggiornamento della Carta Forestale) bisogna cancellare `.cache/`. La cartella è esclusa da git.

### Cosa fa ciascuno, nel dettaglio

**`build_habitat.py`**

1. Per ogni zona scarica dal WFS i poligoni forestali dentro il quadrato che contiene il cerchio (`maxFeatures` 20000, coordinate in UTM 33N, EPSG:32633), corregge le geometrie non valide.
2. Calcola la composizione per area dentro il cerchio, per categoria e per tipologia, in ettari.
3. Posa una griglia di 21 × 21 punti sul quadrato e tiene quelli nel cerchio (313-317 per zona). Passo della griglia: 300 m per un raggio di 3 km, 500 m per 5 km.
4. Chiede la quota di ogni punto all'Elevation API (blocchi da 100) e trova la categoria forestale del poligono che lo contiene (indice spaziale STRtree).
5. Chiede a Valhalla `/locate` (blocchi da 40, costing `auto`) la strada carrozzabile più vicina: distanza, fondo, nome (preferendo SS, SR, SP) e punto agganciato sulla strada.
6. Calcola le statistiche di quota (min, quartili, mediana, max) e scrive il file.

**`build_access.py`**

Per ogni punto di sosta di ogni zona: percorso Valhalla da Rieti, strade principali (tratti di almeno 1,5 km), poi `trace_attributes` lungo il percorso per sapere tratto per tratto se è asfaltato. Separa il tratto finale continuo su strada bianca dagli eventuali tratti bianchi intermedi e registra dove finisce l'asfalto. Aggiunge la quota della sosta.

**`build_trails.py`**

Per ogni zona chiede a Waymarked Trails le relazioni escursionistiche nel riquadro (fino a 100), scarica la geometria di ognuna, la taglia sul cerchio della zona e scarta i sentieri con meno di 500 m dentro la zona e i frammenti sotto i 150 m. Campiona il tratto interno ogni 100 m: quota e categoria forestale. Registra numero, nome, itinerario, difficoltà CAI, durata, dislivello, lunghezza totale e interna, e la linea semplificata per la mappa. Infine calcola con OSRM il percorso auto alla prima sosta.

**`build_basemap.py`**

Scarica 110 tile OpenTopoMap a zoom 12 (11 × 10) con una pausa di 0,25 s tra l'una e l'altra, le cuce in un'immagine di 2816 × 2560 px, poi chiede al WMS regionale la Carta Forestale esattamente sullo stesso riquadro in EPSG:3857. Salva le due immagini in WebP, la legenda in PNG e i limiti geografici in JSON.

**`build_artifact.mjs`**

1. Forza il fuso `Europe/Rome`, sostituisce `fetch` con `curl` e simula `localStorage`.
2. Legge i quattro JSON di `data/`, chiama `loadWeather` di `js/weather.js` con `force: true` e ottiene le serie meteo.
3. Impacchetta `js/app.js` e i suoi moduli con esbuild (IIFE, minificato, ES2020).
4. Incorpora le immagini di `assets/` come data URI, scarica il CSS di Leaflet da cdnjs e lo mette inline.
5. Prende titolo, font e corpo di `index.html`, toglie gli script e la riga di attribuzione delle tile online, e scrive `dist/fungaroli.html` con `window.FUNGAROLI_DATA` (zone, habitat, accessi, sentieri, base cartografica, meteo con `fetchedAt`) seguito dal bundle.

Lo script legge `data/trails.json` senza controllare che esista: se il file manca, il build si ferma con un errore. Il sito invece tollera l'assenza (la sezione sentieri non compare).

La pubblicazione quotidiana dell'Artifact (routine alle 6:52) è configurata fuori dal repository: rilancia questo build e ripubblica il file allo stesso indirizzo.

## Formato dei file

### `data/zones.json` (scritto a mano)

```json
{
  "origin": { "name": "Rieti", "lat": 42.404, "lon": 12.8623 },
  "zones": [ {
    "id": "vallonina",
    "name": "Vallonina / Terminillo",
    "lat": 42.485, "lon": 13.005,
    "radius_m": 3000,
    "bands": [1200, 1450, 1650],
    "description": "...", "access": "...", "trails": "...",
    "parking": [ { "name": "Rifugio Maiolica (fondovalle)", "lat": 42.5005, "lon": 13.009 } ],
    "drive_min": 42, "drive_km": 33,
    "protection": null,
    "popularity": 1.0
  } ],
  "popularity_note": "..."
}
```

| Campo | Uso |
|---|---|
| `id` | Chiave in tutti gli altri file. Non cambiarlo senza rigenerare tutto (e il diario fa riferimento a questo id). |
| `lat`, `lon`, `radius_m` | Centro e raggio del cerchio di campionamento. Il meteo usa solo il centro. |
| `bands` | Esattamente tre quote in metri. Il meteo è chiesto a ciascuna quota. |
| `parking` | Punti di sosta. Il **primo** è quello principale (tempi in classifica, comodità, OSRM). |
| `drive_min`, `drive_km` | Valori di riserva, usati solo se `access.json` manca. |
| `protection` | Testo dell'avviso sulle aree protette, oppure `null`. |
| `popularity` | Notorietà 0-1 per la stima della folla (euristica). |
| `description`, `access`, `trails` | Testi mostrati nella scheda (`trails` al momento non è mostrato). |

Ci sono attualmente 7 zone con raggio tra 3 e 5 km.

### `data/habitat.json` (generato)

```json
{
  "generated": "2026-10-12",
  "source": "Carta Forestale ... ; Open-Meteo Elevation API",
  "zones": {
    "vallonina": {
      "forest": { "area_ha": 2827.1, "categorie_ha": { "Faggeta": 1252.4, ... }, "tipologie_ha": { ... } },
      "elevation": { "min": 979, "p25": 1571, "median": 1720, "p75": 1824, "max": 2150 },
      "sample_categories": ["Arbusteto e macchia alta", "Faggeta"],
      "road_names": ["SP10", ...],
      "samples": [ [1611, -1, 42.485, 12.96846, 1037, 2, 3, 42.49066, 12.97848], ... ]
    }
  }
}
```

Ogni campione è un array di 9 valori:

| Posizione | Contenuto |
|---|---|
| 0 | Quota in metri (DEM) |
| 1 | Indice in `sample_categories`, oppure −1 per "non bosco" (punto fuori da ogni poligono forestale) |
| 2, 3 | Latitudine e longitudine del punto |
| 4 | Distanza in metri dalla strada carrozzabile più vicina (in linea d'aria), oppure `null` |
| 5 | Fondo di quella strada: 0 asfalto, 1 strada bianca, 2 sentiero o pista; `null` se ignoto |
| 6 | Indice in `road_names`, oppure −1 se la strada non ha nome |
| 7, 8 | Latitudine e longitudine del punto agganciato sulla strada, oppure `null` |

I nomi in `sample_categories` sono quelli del campo `categoria` della Carta Forestale e devono coincidere con le chiavi di `FOREST` in `js/species.js`. Il front-end usa `samples`, `sample_categories`, `road_names` ed `elevation`; il blocco `forest` (ettari per categoria e tipologia) è prodotto ma al momento non è mostrato.

Un file nel vecchio formato a 4 valori per campione funziona ancora per l'indice; mancano solo il punto d'accesso e i metri a piedi.

### `data/access.json` (generato)

```json
{ "generated": "...", "source": "Valhalla / OpenStreetMap (ODbL); Open-Meteo Elevation",
  "zones": { "vallonina": [ {
    "parking": "Rifugio Maiolica (fondovalle)", "lat": 42.5005, "lon": 13.009,
    "minutes": 55, "km": 33.5, "roads": ["SR4 bis", "Turistica del Terminillo"],
    "paved_km": 33.5, "unpaved_tail_km": 0.0, "unpaved_other_km": 0, "unpaved_surfaces": [],
    "transition": null, "line": [[lat, lon], ...], "elevation": 1698
  } ] } }
```

Un elemento per sosta, nello stesso ordine di `parking` in `zones.json`. `transition` indica dove finisce l'asfalto prima del tratto bianco finale (`{lat, lon, after}`, con `after` il nome dell'ultima strada asfaltata). `line` è il percorso semplificato (circa 300 punti), oggi non disegnato sulla mappa.

### `data/trails.json` (generato)

```json
{ "generated": "...", "source": "...",
  "zones": { "vallonina": {
    "sample_categories": ["Arbusteto e macchia alta", "Faggeta", ...],
    "trails": [ {
      "id": 123456, "ref": "404", "name": "...", "itinerary": ["...", "..."], "group": "...",
      "operator": "CAI", "difficulty": "E", "total_km": 9.8, "duration": "03:30", "ascent": "650",
      "in_zone_km": 4.2,
      "samples": [[1450, 1], [1460, 1], ...],
      "lines": [[[lat, lon], ...], ...]
    } ],
    "drive": { "minutes": 45, "km": 33, "roads": [...], "line": [...] }
  } } }
```

`samples` ha un elemento ogni 100 m di sentiero dentro la zona: `[quota, indice categoria o −1]`. Gli indici si riferiscono al `sample_categories` di questo file, che elenca tutte le categorie presenti nei poligoni della zona e può differire da quello di `habitat.json`. I sentieri sono ordinati per `in_zone_km` decrescente. `id` è l'id della relazione OSM e viene usato per il link a Waymarked Trails. Nel momento in cui scrivo il file non è ancora presente nel repository.

### `assets/`

| File | Contenuto |
|---|---|
| `basemap.json` | `bounds` `[[sud, ovest], [nord, est]]`, `zoom` 12, `size` `[2816, 2560]`, `attribution` |
| `basemap-topo.webp` | Mosaico OpenTopoMap (circa 2,4 MB) |
| `basemap-forest.webp` | Carta Forestale WMS sullo stesso riquadro, con trasparenza (circa 1,7 MB) |
| `forest-legend.png` | Legenda ufficiale della Carta Forestale |

Servono solo all'Artifact. `.gitignore` esclude tutti i PNG tranne quelli in `assets/`.

## Il front-end

### Struttura

Nessun bundler e nessun framework per il sito: `index.html` carica Leaflet da cdnjs e `js/app.js` come modulo ES, che importa gli altri moduli. Serve un server HTTP (`npm start` avvia `python3 -m http.server 8000`) perché moduli e JSON non si caricano da `file://`.

| File | Ruolo |
|---|---|
| `index.html` | Struttura della pagina, regole di raccolta, spiegazione dell'indice. |
| `css/style.css` | Stile con token di colore per tema chiaro e scuro (classi dell'indice `--s0`...`--s5`, pioggia osservata e prevista). |
| `js/app.js` | Stato, filtri e preferenze, calcolo per tutte le zone e i giorni, striscia dei giorni, classifica, mappa, scheda zona, punto d'accesso e sentieri per specie. |
| `js/model.js` | Modello di idoneità: funzioni pure, nessun accesso al DOM, `PARAMS`, classi. |
| `js/species.js` | Le 14 specie, i 5 gruppi, le categorie forestali. |
| `js/human.js` | Alba e tramonto (NOAA), festivi, peso del giorno, affollamento, comodità, orario consigliato. Funzioni pure. |
| `js/weather.js` | Chiamata a Open-Meteo, cache, conversione in serie giornaliere; nella versione Artifact legge la fotografia incorporata. |
| `js/journal.js` | Diario: procedura guidata, archivio (locale o database), confronto previsto/trovato, esporta e importa. |
| `js/chart.js` | I due grafici SVG pioggia e indice con cursore condiviso. |
| `js/svgmap.js` | Mappa schematica SVG di riserva quando Leaflet non c'è. |

### Flusso dei dati

1. `init()` carica `zones`, `habitat`, `access`, `trails` da `data/` (oppure da `window.FUNGAROLI_DATA` nell'Artifact). Un file mancante diventa `null` e la relativa funzione si spegne.
2. `loadWeather()` costruisce una sola richiesta Open-Meteo con 21 località (7 zone × 3 quote) e restituisce, per zona, tre serie giornaliere `{dates, p, tmean, tmin, tmax, soilm, soilt, todayIndex}`. Le serie coprono 62 giorni passati, oggi e 7 giorni futuri.
3. `compute()` calcola, per ogni zona e per ogni giorno da 30 giorni fa a 7 giorni avanti, la miglior combinazione specie × quota (`scoreZoneDay`), poi aggiunge punto d'accesso, comodità e affollamento. I primi 30 giorni della serie servono solo come storico per la finestra di 30 giorni.
4. `adjusted()` applica le preferenze attive al momento del disegno; l'indice di base non cambia.
5. `renderAll()` ridisegna striscia, classifica, mappa, scheda e legenda.

### Stato nel browser

| Chiave `localStorage` | Contenuto |
|---|---|
| `fungaroli:prefs:v1` | Gruppi di specie e preferenze attive |
| `fungaroli:weather:v1` | Ultima risposta Open-Meteo, valida un'ora e per lo stesso giorno e le stesse località |
| `fungaroli:diario:v1` | Il diario, solo sul sito |

Ogni accesso a `localStorage` è protetto da `try/catch`: in navigazione privata l'app funziona, ma non ricorda niente.

### Versione Artifact

Lo stesso codice si accorge di girare nell'Artifact dalla presenza di `globalThis.FUNGAROLI_DATA`:

- `weather.js` usa la fotografia e ricalcola `todayIndex` sulla data corrente; se oggi non è nelle serie segnala `stale` e la pagina mostra l'avviso;
- `app.js` nasconde **Aggiorna meteo** e usa `initEmbeddedMap()` (immagini georeferenziate, zoom 9-14, pulsante per la Carta Forestale);
- `journal.js` cerca `claude.use('db')` e `claude.use('user')` e salva le uscite nella collezione `data/users/<id utente>/diario/uscite`, un documento per uscita; se non ci riesce ricade su `localStorage`. L'esportazione usa `claude.use('downloads')`.

### Formato di un'uscita del diario

```json
{
  "id": "m1x2y3z",
  "date": "2026-10-11",
  "zoneId": "vallonina",
  "band": 1450,
  "finds": { "edulis": 2, "mellea": 1 },
  "note": "versante nord, faggeta",
  "predicted": { "edulis": 58, "pinophilus": 41, "...": 0 },
  "savedAt": "2026-10-11T17:42:10.000Z"
}
```

`finds` usa 1 = pochi, 2 = discreti, 3 = tanti. `predicted` contiene l'indice di tutte le 14 specie (non solo dei gruppi attivi) alla quota indicata o alla migliore della zona se `band` è `null`; è vuoto se la data era fuori dai dati meteo. Il file esportato è `{ "version": 1, "entries": [ ... ] }`; l'importazione accetta anche un array semplice.

## I test

`npm test` esegue `node --test tests/*.test.mjs` (Node 20 o successivo; il workflow usa Node 22). Nessuna dipendenza da installare.

| File | Cosa verifica |
|---|---|
| `tests/model.test.mjs` | Pioggia 11-12 giorni prima con 13 °C in faggeta dà indice ≥ 50 per il porcino; senza pioggia < 10; la pioggia di ieri non conta ancora (latenza); le gelate dimezzano almeno l'indice; habitat non idoneo azzera; stagionalità interpolata; filtro per quota di `habitatAtBand`; decadimento di `elevationFit`. |
| `tests/human.test.mjs` | Alba 07:16 e tramonto 18:33 a Rieti il 12 ottobre 2026; Pasquetta e Santa Barbara; weekend più pesante dei feriali; livelli di folla attesi in tre scenari; buttata appena partita; livelli di comodità; arrivo all'apertura legale con folla alta. |
| `tests/journal.test.mjs` | Le tre etichette del confronto previsto/trovato e il riepilogo. |

I test controllano il comportamento qualitativo, non i valori dei parametri: si possono tarare i numeri senza romperli, finché le relazioni restano quelle.

## Pubblicare

### GitHub Pages

Il workflow `.github/workflows/pages.yml` parte a ogni push su `main` e a mano (`workflow_dispatch`). Fa checkout, installa Node 22, esegue `npm test`, carica l'intero repository come sito e lo pubblica. Se i test falliscono il sito non viene aggiornato.

Una volta sola: nel repository su GitHub, *Settings → Pages → Source: GitHub Actions*.

### Cloudflare Pages

1. Nel pannello Cloudflare: *Workers & Pages → Create → Pages → Connect to Git*, scegli il repository e il branch di produzione.
2. *Framework preset*: nessuno. *Build command*: vuoto. *Build output directory*: `/`.
3. Salva e pubblica. Ogni push sul branch scelto ripubblica; gli altri branch diventano anteprime.

Cloudflare non esegue i test: lanciali prima del push. In entrambi i casi i file `data/*.json` devono essere nel repository, perché nessuno dei due servizi esegue gli script Python.

### Artifact

`npm i` una volta, poi `npm run build:artifact` e pubblicazione di `dist/fungaroli.html`. Il file pesa qualche megabyte per via delle immagini incorporate. `dist/` è escluso da git.

## Aggiungere una zona

1. Aggiungi l'oggetto in `data/zones.json`: `id` univoco, centro, `radius_m` (3-5 km ha funzionato bene), tre `bands` dentro l'intervallo di quote reale dell'area, almeno un `parking` (il primo è il principale), testi, `popularity`, eventuale `protection`.
2. Rilancia `python3 tools/build_habitat.py`, poi `python3 tools/build_access.py` e `python3 tools/build_trails.py`. Grazie alla cache le zone già presenti costano poco, tranne le chiamate a Valhalla.
3. Controlla in `data/habitat.json` le statistiche `elevation` della nuova zona: se le tre fasce cadono dove ci sono pochi punti campione, spostale.
4. Se la zona esce dal riquadro `BBOX` di `tools/build_basemap.py` (longitudine 12,62-13,46, latitudine 42,10-42,72), allarga il riquadro e rilancia lo script; altrimenti nell'Artifact la zona resterebbe fuori dalla mappa.
5. Se la zona è fuori dall'area della mappa schematica, aggiungi eventualmente un paese di riferimento a `TOWNS` in `js/svgmap.js`.
6. Ricostruisci l'Artifact.

Il README indica solo il passo `build_habitat.py`: senza gli altri due la zona funziona, ma senza tempi Valhalla e senza sentieri.

## Aggiungere una specie

1. Aggiungi un oggetto a `SPECIES` in `js/species.js` con tutti i campi: `id` (diventa chiave del diario, non cambiarlo dopo), `group` (uno degli `id` di `GROUPS`, oppure aggiungi un gruppo), `name`, `latin`, `forest` (affinità 0-1 usando le costanti `FOREST`, che devono coincidere con i nomi della Carta Forestale), `months` (12 valori), `elev`, `topt`, `tsd`, `lag`, `eref`, `minCap`, eventualmente `frostTolerant`, `shockWeight`, `warning`, `evidence`.
2. Scrivi in `evidence` da dove vengono i parametri, anche solo "Euristica".
3. Se la specie è legata a un bosco non presente in `FOREST_COLORS` di `js/app.js`, la barra della composizione lo mostrerà come "Altro bosco/arbusteto".
4. Aggiungi un test se la specie ha un comportamento particolare (per esempio tollera il gelo).

Note: i campi `minCap` ed `evidence` oggi non sono mostrati nell'interfaccia. Per legge il verdone (*Russula virescens*) ha taglia minima 4 cm, mentre la voce colombina/verdone in `species.js` riporta `minCap: 3`.

## Tarare i parametri

Dove stanno i numeri:

| Cosa | Dove |
|---|---|
| Finestre, soglie meteo, fascia di quota | `PARAMS` in `js/model.js` |
| Curva della pioggia (pesi 0,6/0,4, innesco 15 mm), soglia habitat 0,45, decadimento quota 200 m, minimo del suolo 0,15, penalità di gelo e caldo, bonus shock 0,075 | dentro le funzioni di `js/model.js` |
| Classi dell'indice | `CLASSES` in `js/model.js` |
| Parametri di specie | `SPECIES` in `js/species.js` |
| Affidabilità (0,5 e 0,04 per giorno, minimo 0,2) | `confidence()` in `js/model.js`; soglie alta/media in `renderRanking()` di `js/app.js` |
| Peso dei giorni, folla, comodità, orari | `js/human.js` |
| Peso delle preferenze (0,3 distanza, 0,45 folla, 0,55/0,45 comodità) | `adjusted()` in `js/app.js` |
| Criteri del punto d'accesso (affinità ≥ 0,6, ±150 m, costo fondo 300 m) e dei sentieri (±250 m, minimo 0,3 km) | `accessFor()` e `trailsFor()` in `js/app.js` |
| Soglia "il modello dice di andare" | `FOUND_THRESHOLD` in `js/journal.js` |
| Giorni di storico e di previsione | `PAST_DAYS`, `FORECAST_DAYS` in `js/weather.js`; `HISTORY_DAYS`, `AHEAD_DAYS` in `js/app.js` |

Il metodo di taratura con il diario è descritto in [metodo-scientifico.md](metodo-scientifico.md#come-calibrarlo-con-il-diario). Due accorgimenti tecnici: dopo ogni modifica lancia `npm test`; e tieni presente che le uscite già salvate conservano l'indice calcolato con i parametri di allora, quindi per confrontare vecchio e nuovo modello sulle stesse uscite bisogna ricalcolare `predicted` a partire da zona, data e quota.
