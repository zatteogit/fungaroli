# Campionamenti incrementali Lazio, 19 ottobre 2026

Il procedimento legge i centri e i raggi editoriali documentati in `../zone-seeds.json`. I cerchi definiscono il campionamento dell'app: non sono confini dei parchi, fondi accessibili o aree dove la raccolta è autorizzata.

- Habitat: Carta Forestale tipologica Regione Lazio, WFS `https://geoportale.regione.lazio.it/geoserver/ows`, layer `geonode:tipi_forestali2`; poligoni proiettati UTM33N, composizione per intersezione con il cerchio come nel generatore corrente. Fonte storica, non rilievo odierno. Riuso CC BY 4.0 dichiarato dal Geoportale regionale: https://www.regione.lazio.it/cittadini/urbanistica/sistema-informativo-territoriale-regionale/geoportale-regionale .
- Quote: DEM Copernicus GLO-90, edizione2021, risoluzione90m, servito da Open-Meteo Elevation API: https://open-meteo.com/en/docs/elevation-api . Griglia regolare21×21 ritagliata al cerchio:317 punti per zona. Quote in metri arrotondate all'intero come nel generatore esistente. Nessuna API meteo interrogata. Pacing delle richieste DEM100punti ogni13secondi; dopo risposta esplicita di limite al minuto, attesa60secondi e riuso delle risposte già acquisite.
- Fasce suggerite: p25, mediana e p75 dei317campioni, indice quantile `int(f*(n-1))` come nel generatore corrente. Arrotondamento alla decina più vicina con metà verso l'alto. Sono quote rappresentative del cerchio, non soglie biologiche o quote ufficiali del sentiero.
- Strade: Valhalla `/locate`, profilo auto. Distanza/fondo/nome/punto correlato sono dati cartografici OSM, non verifica di accessibilità o sosta. Il fondo resta `null` quando manca la classificazione; nessun asfalto dedotto. Eventuali risposte assenti lasciano `[null,null,-1,null,null]` e il blocco è registrato.
- Sentieri: dati indipendenti OSM via Waymarked Trails, https://hiking.waymarkedtrails.org/api/v1 . Import solo per corrispondenza del segnavia documentato nella fonte istituzionale, oppure nome distintivo documentato (Felceto/Bandita/Bicione/Verdesca). https://www.openstreetmap.org/copyright , ODbL-1.0, © OpenStreetMap contributors. Il match non certifica identità puntuale con il GPX ufficiale, stato attuale o apertura. Nessuna traccia GPX/KML senza licenza specifica è stata ridistribuita. Il cerchio ritaglia il tracciato; si conservano componenti di almeno150m e campioni ogni circa100m come nel generatore corrente. La lista WMT è limitata a100relazioni: nessuna pretesa di censimento completo.
- `total_km` descrive la relazione completa OSM/tag distance coerente; `in_zone_km` solo le componenti conservate nel cerchio. Un tratto di percorso lungo non diventa un giro chiuso. Durata/dislivello/difficoltà mancanti restano `null`. `trails:[]` significa nessuna geometria importata con match documentato, non assenza di sentieri sul territorio.

`requests.jsonl` contiene URL/query o corpo POST, istante UTC, tentativo, durata, dimensione e SHA-256 dei byte. `responses/` conserva le risposte riuscite con chiave SHA-256 della richiesta. Il manifest registra esiti e blocchi per zona; i pacchetti separati permettono riesame dei campioni. Un fallimento DEM impedisce l'integrazione della zona, senza sostituzioni con zeri.

Le15zone preesistenti restano inalterate. Solo l'oggetto `zones` dei due JSON applicativi viene esteso: data di generazione storica del file non riscritta per non attribuire una nuova rilevazione ai vecchi dati; il manifest distingue i nuovi tempi di estrazione.

## Eventuale fonte DEM alternativa

Solo dopo un limite orario/giornaliero esplicito di Open-Meteo, il procedimento passa alle nuove zone ancora incomplete usando **SRTM Version3, 3arcsecondi (circa90m), via OpenTopoData**, interpolazione bilineare. Si ricalcola integralmente la zona interessata: nessun cerchio o tracciato mescola Copernicus e SRTM. Il cambio, la causa e l'istante vengono salvati in `dem-provider.json`; ogni audit registra `demProvider` e `demResolutionM`. Le zone già complete restano Copernicus.

Fonti: https://www.opentopodata.org/datasets/srtm/ (provider dichiara esplicitamente SRTM V3 per30/90m), https://www.opentopodata.org/api/ , https://www.opentopodata.org/ (100località/richiesta,1richiesta/secondo,1000richieste/giorno); https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm (USGS/NASA, origine e distribuzione dei dati). Il modello non è un rilievo attuale né una misura GPS, e non ha la stessa data/metodologia di Copernicus.

## Stato definitivo, 19 ottobre 2026 alle 11:13 UTC circa

Il WFS è tornato disponibile dopo il backoff (HTTP200, 11:08:42UTC). Sono state completate **tutte le21nuove zone**:6657campioni della griglia forestale/DEM, modello CopernicusGLO90 omogeneo per tutte;36zone totali in habitat e trails;17relazioni OSM importate e652campioni lungo i sentieri. Nessun fallbackSRTM effettivamente usato. Gli stati `pending_wfs` registrati durante il guasto sono superati dal manifest finale.

È conservata anche la soglia del generatore corrente: almeno500m di geometria nella zona, oltre alle componenti singole di almeno150m. Per questo i piccoli ritagli di260(0,2km) eBicione(0,4km) acquisiti nella prima fase non fanno parte dei dati finali.

Il catalogo `sample_categories` di habitat contiene solo le categorie osservate nei campioni della griglia, con indici riallineati, come nel generatore esistente. Le15zone iniziali non sono state ricampionate. Il manifest riporta la conservazione dei22record presenti alla ripresa finale (le15iniziali più le7nuove giàcomplete).

Sono riusati i6routing reali del pacchetto accessi (Valhalla), senza duplicare richieste: Diosilla, LaValle/Itri, Prato diCampoli eFonteSantaSerena, Faete eRoccagiovine. Provengono dalla partenza storica Rieti; non rappresentano il tempo da una partenza selezionata dall'utente.

Per la consegna fanno fede `release-data-summary.json`, `manifest.json`, `dem-bands.json`, gli audit per zona e iJSONapplicativi. `requests.jsonl` registra i tentativi HTTP conclusi; le richieste interrotte senza risposta conservata non hanno hash della risposta. `responses/` è cache locale: non va versionata né pubblicata.
