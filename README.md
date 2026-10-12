# Fungaroli · Rieti

Web app statica che indica **dove e quando** andare a funghi (commestibili) intorno a Rieti, incrociando:

1. **Meteo** degli ultimi ~60 giorni + previsioni a 7 giorni (Open-Meteo), calcolato a **tre quote** per ogni zona;
2. **Carta Forestale su base tipologica** della Regione Lazio (WFS ufficiale), campionata su ~315 punti per zona per sapere quale bosco c'è a quale quota;
3. **Calendario ed ecologia** delle specie (habitat, quote, stagionalità, finestre di latenza dopo la pioggia).

Il risultato è un indice 0–100 per ogni combinazione **zona × quota × specie × giorno**, con classifica delle migliori uscite, mappa, grafico pioggia/indice e spiegazione dei fattori.

## Uso

**Online:** https://fungaroli.zatteo.workers.dev (Cloudflare Workers, ripubblicato a ogni push sul branch di produzione; configurazione in `wrangler.jsonc`, procedura in `docs/handoff-cloudflare.md`).

```bash
python3 -m http.server 8000   # oppure: npm start
# apri http://localhost:8000
```

Nessuna build, nessuna chiave API. Serve un server HTTP (i moduli ES e i JSON non si caricano da `file://`).

Pubblicazione: il workflow `.github/workflows/pages.yml` pubblica su GitHub Pages a ogni push su `main`. Va abilitato una volta in *Settings → Pages → Source: GitHub Actions*.

Test del modello: `npm test` (Node ≥ 20).

### Versione Artifact (claude.ai)

```bash
npm i && npm run build:artifact   # -> dist/fungaroli.html
```

Un Artifact non può chiamare API esterne né caricare tile di mappa, quindi la build incorpora JS, CSS, dati e una **fotografia del meteo** al momento della build; la mappa usa una base topografica e la Carta Forestale incorporate come immagini georeferenziate (`assets/`, generate una tantum con `python3 tools/build_basemap.py`). Per aggiornare il meteo si rilancia la build e si ripubblica. Il diario nell'Artifact è salvato nel db privato dell'utente (`data/users/<id>/diario/uscite`), quindi resta tra dispositivi e Claude può leggerlo per tarare il modello.

## Diario delle uscite

Procedura guidata in 5 passi (zona → giorno → quota → cosa e quanto → nota). Al salvataggio l'app memorizza anche l'indice che il modello prevedeva per quella zona e quel giorno, così l'elenco mostra se la previsione era giusta, ottimista o pessimista. Su GitHub Pages il diario resta nel browser: usa *Esporta* / *Importa*.

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
indice = 100 × stagione × habitat × quota × pioggia × temperatura × suolo × gelo × caldo × shock
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

**Affidabilità:** per i giorni futuri la pioggia che conta è in gran parte già caduta (latenza 1–3 settimane), quindi l'indice a 3–7 giorni è ragionevolmente robusto. L'app abbassa l'affidabilità quando una parte della pioggia efficace è solo prevista.

### Cosa è fatto, cosa è ipotesi

- **Fatti verificati:** composizione forestale e quote (Carta Forestale, DEM); meteo (modello Open-Meteo, non stazioni a terra); regole di raccolta (dal documento di partenza, fonte AMER 2025).
- **Da letteratura, ma con limiti:** la relazione pioggia 26–30 gg e T ≈ 13 °C vale per *B. edulis* in faggete; lo studio del 2025 è un preprint non ancora revisionato.
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

Strumento di supporto alla pianificazione, **non di identificazione**. Raccolta solo con attestato micologico e contributo regionale (L.R. Lazio 32/98 e s.m.i.), max 3 kg/giorno. Far controllare il raccolto all'Ispettorato Micologico ASL Rieti (SIAN), gratuito. Nelle riserve (Navegna-Cervia, Duchessa) e nel Parco Gran Sasso-Laga valgono zonizzazioni e regolamenti propri.

## Fonti

- Salerni E., Laganà A., Perini C., Loppi S., De Dominicis V. (2002). *Effects of temperature and rainfall on fruiting of macrofungi in oak forests of the Mediterranean area*. Israel Journal of Plant Sciences 50(3): 189–198. https://usiena-air.unisi.it/handle/11365/3048
- *Predicting porcini: a decade of sporocarp monitoring reveals the meteorological triggers of Boletus edulis fruiting in central European beech forests* (2025). bioRxiv, preprint. https://www.biorxiv.org/content/10.64898/2025.12.12.693895v1
- Salerni E., Paoli L., Perini C. (2023). Produttività di *B. edulis* in abetine e risposta a eventi termici estremi. Italian Journal of Mycology. https://doaj.org/article/8b44d1d6b39e4739ab56842f048e3336
- Regione Lazio. *Carta Forestale su base tipologica* — WFS/WMS `geonode:tipi_forestali2`. https://geoportale.regione.lazio.it ; https://dati.lazio.it/dataset/carta-forestale-su-base-tipologica-della-regione-lazio
- Open-Meteo. Forecast API ed Elevation API (CC BY 4.0). https://open-meteo.com
- OpenStreetMap (ODbL) via Valhalla per accessi e fondo stradale, via Waymarked Trails per i sentieri; OpenTopoMap per la base cartografica.
- Brejon Lamartinière E., Hoffman J. I. (2025). *Predicting porcini…* bioRxiv, preprint (autori verificati sull'abstract).
- AMER (2025). *Raccolta funghi nel Lazio: le regole in vigore nel 2025*. https://www.ameronlus.it/blog/2025/01/14/raccolta-funghi-nel-lazio-le-regole-in-vigore/
- MyBoletus, *Funghi nel Lazio*; AMER, *Report uscita micologica Altopiano di Rascino* (2018); Alta Valle del Velino, *Andar per funghi* — per habitat e stagionalità locali (vedi documento di partenza).
