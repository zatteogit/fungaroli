# Fungaroli · Rieti

App per **passeggiare, esplorare i sentieri e imparare a conoscere i boschi** intorno a Rieti. Il taccuino personale e le segnalazioni collettive hanno lo scopo di migliorare gradualmente la validazione locale. Le condizioni di crescita sono stimate: accuratezza della trovabilità e abbondanza reale non sono ancora misurate.

La parte ambientale incrocia:

1. **Meteo** degli ultimi ~60 giorni + previsioni a 7 giorni (Open-Meteo), calcolato a **tre quote** per ogni zona;
2. **Carta Forestale su base tipologica** della Regione Lazio (WFS ufficiale), campionata su ~315 punti per zona per sapere quale bosco c'è a quale quota;
3. **Calendario ed ecologia** delle specie (habitat, quote, stagionalità, finestre di latenza dopo la pioggia).

Il risultato è un indice sperimentale 0–10 con un decimale italiano (es. 7,2) per ogni combinazione **zona × quota × specie × giorno**, con priorità di passeggiate da esplorare, mappa, grafico pioggia/indice e spiegazione dei fattori.

## Uso

**Online:** https://fungaroli.zatteo.workers.dev (Cloudflare Workers, ripubblicato a ogni push sul branch di produzione; configurazione in `wrangler.jsonc`, procedura in `docs/handoff-cloudflare.md`).

```bash
python3 -m http.server 8000   # oppure: npm start
# apri http://localhost:8000
```

Nessuna build, nessuna chiave API. Serve un server HTTP (i moduli ES e i JSON non si caricano da `file://`).

Pubblicazione: il workflow `.github/workflows/pages.yml` pubblica su GitHub Pages a ogni push su `main`. Va abilitato una volta in *Settings → Pages → Source: GitHub Actions*.

Test del modello: `npm test` (Node ≥ 22). Per il servizio completo: `npm ci` e `npx wrangler dev`; verifiche passkey e isolamento con `npm run test:browser`.

### Versione Artifact (claude.ai)

```bash
npm i && npm run build:artifact   # -> dist/fungaroli.html
```

Un Artifact non può chiamare API esterne né caricare tile di mappa, quindi la build incorpora JS, CSS, dati e una **fotografia del meteo** al momento della build; la mappa usa una base topografica e la Carta Forestale incorporate come immagini georeferenziate (`assets/`, generate una tantum con `python3 tools/build_basemap.py`). Per aggiornare il meteo si rilancia la build e si ripubblica. La versione Artifact è un’esportazione storica, con fotografia del meteo: non supporta il nuovo servizio della comunità. Il sito Cloudflare è la versione corrente.

## Diario delle uscite

Procedura guidata in 6 passi (zona → giorno → quota → ricerca → cosa e quanto → nota). Prima dell’uscita si può salvare una previsione immutabile con modello e input. Il diario confronta poi le specie cercate, distinguendo zeri espliciti, dati mancanti e ricostruzioni a posteriori. I conteggi sono esplorativi e non misurano l’accuratezza scientifica. Su GitHub Pages il diario resta nel browser: usa *Esporta* / *Importa*.

## Zone (prima versione)

| Zona | Quote valutate | Bosco prevalente (Carta Forestale) | Auto da Rieti* |
|---|---|---|---|
| Vallonina / Terminillo | 1200 · 1450 · 1650 m | Faggeta (~90% sotto i 1500 m) | 55 min |
| Poggio Bustone / Cantalice | 750 · 950 · 1200 m | Roverella in basso, faggeta sopra i 1000 m | 34 min |
| Antrodoco / Velino | 650 · 850 · 1100 m | Castagneto, ostrieto, lecceta | 42 min |
| Cicolano (Marcetelli, Ascrea, Collalto) | 750 · 900 · 1050 m | Castagneto (~37%), cerreta, ostrieto | 65 min |
| Altopiano di Rascino | 1250 · 1350 · 1450 m | Faggeta sui versanti, piana non boscata, pino nero marginale | 102 min (ultimi 2,6 km su strada bianca) |
| Monte Tancia | 650 · 850 · 1100 m | Ostrieto, cerreta; faggeta relitta in cima | 43 min |
| Monti della Laga (Amatrice) | 1100 · 1350 · 1600 m | Cerreta in basso, faggeta sopra i 1300 m | 93 min |

\* tempo calcolato con Valhalla (OpenStreetMap) fino al punto di sosta principale.

**Nota:** i dati della Carta Forestale correggono in parte il documento di partenza. A Poggio Bustone/Cantalice i castagneti sono marginali (≈1% dell'area), mentre nel Cicolano il castagneto prevale sulla cerreta. A Rascino domina la faggeta e il pino nero è solo in nuclei.

## Documentazione

- [Metodo scientifico](docs/metodo-scientifico.md): modello, parametri, fonti, limiti, calibrazione
- [Guida d'uso](docs/guida-uso.md): come leggere l'app, diario, regole di raccolta
- [Dati e architettura](docs/dati-e-architettura.md): fonti, licenze, script, pubblicazione

## Il modello

Per ogni specie e giorno *d*:

```
indice pubblico = 10 × stagione × habitat × quota × pioggia × temperatura × suolo × gelo × caldo × shock
```

| Fattore | Come si calcola | Base |
|---|---|---|
| Pioggia | mm nella finestra di latenza della specie (porcini: 7–21 gg prima) + cumulata 30 gg; scende gradualmente fino a metà se manca un evento ≥ 8 mm (o 15 mm in finestra) | Salerni et al. 2002 (30 gg, macromiceti dei querceti); preprint 2025 (~26 gg); latenza e soglie euristiche |
| Temperatura | media aria dei 20 gg precedenti vs ottimo specie (porcino ≈ 13 °C, gaussiana) | preprint 2025 per *B. edulis*; **euristica** per le altre specie |
| Suolo | umidità 3–9 cm degli ultimi 3 gg (modello Open-Meteo) | euristica |
| Gelo / caldo | min < −1 °C negli ultimi 5 gg → ×0,35; max > 30 °C → ×0,65 | euristica |
| Shock termico | calo ≥ 4 °C della media 3 gg, 4–14 gg prima → bonus | pratica micologica, non verificata |
| Habitat | frazione di bosco idoneo nella fascia ±150 m (punti campione Carta Forestale × affinità specie) | dato ufficiale + affinità da manualistica |
| Stagione, quota | pesi mensili e range altimetrico per specie | documento di partenza, manualistica |

**Incertezza:** la vecchia percentuale di affidabilità è rimossa. Si mostrano completezza degli input, uso delle previsioni, timestamp e campioni forestali; senza dati necessari l’indice è non calcolabile. I punteggi interni e i vecchi diari restano 0–100, l’interfaccia divide per 10.

**Community:** Cloudflare D1 conserva account con passkey, sessioni protette e diari privati. Solo le osservazioni condivise entrano negli aggregati pubblici. Una segnalazione per persona/zona/specie/giorno; conteggi degli ultimi sette giorni. Un segnale sufficiente modifica al massimo del 10% l’ordine delle passeggiate, senza cambiare l’indice biologico. Non c’è addestramento automatico dei parametri su dati non verificati. Configurazione e limiti in [community.md](docs/community.md).

### Cosa è fatto, cosa è ipotesi

- **Fatti verificati:** composizione forestale e quote (Carta Forestale, DEM); meteo (modello Open-Meteo, non stazioni a terra); regole di raccolta (L.R. Lazio 32/1998, testo vigente; dettagli e fonti in `docs/legale.md`).
- **Da letteratura, ma con limiti:** la relazione pioggia 26–30 gg e T ≈ 13 °C vale per *B. edulis* in faggete; il codice cita bioRxiv v2; la pagina degli autori lo indica ora in stampa su Fungal Ecology.
- **Licenza della Carta Forestale da chiarire:** la risorsa shapefile su dati.lazio.it è dichiarata CC BY 4.0, ma la scheda metadati allegata allo stesso dataset (aggiornata a dicembre 2012) limita l'uso a fini non commerciali e vieta distribuzione e modifica. `data/habitat.json`, `data/trails.json` e le immagini in `assets/` ne derivano: prima di diffondere l'app conviene una conferma scritta della Regione. Dettagli in `docs/legale.md`, sezione licenze.
- **Euristiche:** ottimi termici delle altre specie, finestre di latenza, pesi di habitat, bonus shock. Sono in `js/species.js` e `js/model.js` (`PARAMS`): **vanno calibrati sulle uscite reali**.
- **Cosa il modello non vede:** esposizione e pendenza, età e gestione del bosco, pressione di raccolta, singole fungaie, microclima di valle.

## Struttura

```
index.html            interfaccia
css/style.css         stile (token light/dark)
js/app.js             UI: filtri, giorni, classifica, mappa Leaflet, dettaglio
js/model.js           modello (funzioni pure)
js/species.js         specie e parametri
js/weather.js         Open-Meteo + cache locale 1 h
js/chart.js           grafici SVG pioggia / indice
js/journal.js         diario: procedura guidata, archivio, confronto previsto/trovato
js/svgmap.js          mappa schematica di riserva
js/human.js           alba e orari legali, festivi, affollamento, comodità
assets/               base topografica + Carta Forestale per l'Artifact
tools/build_basemap.py  rigenera assets/ (solo se cambia l'area)
tools/build_artifact.mjs  build della versione Artifact
data/zones.json       zone, quote, accessi, soste, vincoli
data/habitat.json     generato: composizione forestale e campioni quota/bosco
tools/build_habitat.py  rigenera habitat.json (pip install shapely pyproj)
tools/build_access.py   accessi in auto e fondo stradale (Valhalla) -> data/access.json
tools/build_trails.py   sentieri OSM incrociati con bosco e quota -> data/trails.json
tools/build_media.py    foto reali, osservazioni GBIF, modelli 3D -> data/media.json
tests/                test del modello
```

Per aggiungere una zona: inserirla in `data/zones.json` (centro, raggio, tre quote, soste) e rilanciare `build_habitat.py`, `build_access.py` e `build_trails.py`. Dettagli in `docs/dati-e-architettura.md`.

## Avvertenze

Strumento di supporto alla pianificazione, **non di identificazione**. Raccolta solo con attestato micologico e contributo regionale (L.R. Lazio 32/98 e s.m.i.), max 3 kg/giorno. Far controllare il raccolto all'Ispettorato Micologico ASL Rieti (Via del Terminillo 42, blocco 4; lun–ven 8:30–9:30; tel. 0746 279801), gratuito per i privati secondo il Ministero della Salute. Nelle riserve (Navegna-Cervia, Duchessa) e nel Parco Gran Sasso-Laga valgono zonizzazioni e regolamenti propri.

## Fonti

- Salerni E., Laganà A., Perini C., Loppi S., De Dominicis V. (2002). *Effects of temperature and rainfall on fruiting of macrofungi in oak forests of the Mediterranean area*. Israel Journal of Plant Sciences 50(3): 189–198. https://usiena-air.unisi.it/handle/11365/3048
- Salerni E., Paoli L., Perini C. (2023). Produttività di *B. edulis* in abetine e risposta a eventi termici estremi. Italian Journal of Mycology. https://doaj.org/article/8b44d1d6b39e4739ab56842f048e3336
- Regione Lazio. *Carta Forestale su base tipologica* — WFS/WMS `geonode:tipi_forestali2`. https://geoportale.regione.lazio.it ; https://dati.lazio.it/dataset/carta-forestale-su-base-tipologica-della-regione-lazio
- Open-Meteo. Forecast API ed Elevation API (CC BY 4.0). https://open-meteo.com
- OpenStreetMap (ODbL) via Valhalla per accessi e fondo stradale, via Waymarked Trails per i sentieri; OpenTopoMap per la base cartografica.
- Brejon Lamartinière E., Hoffman J. I. (2026). *Predicting porcini: a decade of sporocarp monitoring reveals the meteorological triggers of Boletus edulis fruiting in central European beech forests*. bioRxiv, preprint non revisionato, **versione 2 dell'8 giugno 2026**. La v1 (14/12/2025) usava finestre di 5 giorni e un ottimo di 13,2 °C; i valori di 20 e 26 giorni usati dal modello vengono dalla v2. https://doi.org/10.64898/2025.12.12.693895 ; https://www.biorxiv.org/content/10.64898/2025.12.12.693895v2.full
- L.R. Lazio 5 agosto 1998, n. 32, testo coordinato vigente (Consiglio regionale del Lazio). https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=8275&sv=vigente
- ASL Rieti, *Ispettorato Micologico* (pagina aggiornata il 24/09/2026). https://www.asl.rieti.it/organizzazione-aziendale/dipartimenti-aree-e-staff/dipartimento-della-prevenzione/uosd-igiene-degli-alimenti-e-della-nutrizione/ispettorato-micologico/
- MyBoletus, *Funghi nel Lazio*; AMER, *Report uscita micologica Altopiano di Rascino* (2018); Alta Valle del Velino, *Andar per funghi* — per habitat e stagionalità locali (vedi documento di partenza).
