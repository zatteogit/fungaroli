# Audit tecnico e scientifico Fronda — 16 ottobre 2026

Audit in sola lettura di `/workspace/fungaroli`, base aggiornata a `68e2b1cad1e99f281ed4eb65f8a95ba9f3195aee`, ramo `codex/fronda-modello-micologico-v3`. Nessuna modifica ai file del repository. Letti `AGENTS.md`, entrambi gli handoff del 14–15 ottobre e il codice effettivo. Le proposte seguenti non attestano una maggiore accuratezza biologica.

## Catena effettiva di calcolo

| File / simbolo | Contratto e ruolo |
|---|---|
| `js/species.js:40` / `SPECIES` | 14 profili numerici, 11 gruppi di selezione. `months`, `forest`, `elev`, `topt`, `tsd`, `lag`, `eref`, eventuali `shockWeight`, `frostTolerant`. Alcuni profili aggregano più specie (`virescens`, `suillus`). Le affinità forestali sono specifiche delle categorie della Carta Forestale Lazio. |
| `js/model.js:6` | Versione biologica attuale `2.0.0`, non calibrata localmente. |
| `js/model.js:71` / `weatherFactors(species,s,i)` | Pioggia della finestra di latenza inclusiva, cumulata 30 gg, T media 20 gg, umidità suolo 3 gg, gelo/caldo e bonus da shock. |
| `js/model.js:114` / `inputQuality(species,s,i)` | Completezza delle finestre richiesta; distinzione valori previsti sulla base del giorno di acquisizione. Non è una misura di accuratezza. |
| `js/model.js:137` / `scoreSpecies` | Moltiplica stagione × habitat × quota × pioggia × temperatura × suolo × gelo × caldo × shock. Intero 0–100 se input completi, altrimenti `null`. |
| `js/model.js:157` / `scoreZoneDay` | Migliore quota per ciascuna specie, massimo di tutte le specie come `best`; `perSpecies` ordinato. |
| `js/model.js:177` / `combine` | Massimo dei punteggi disponibili, non unione probabilistica. Aggiungere copie di una specie non gonfia il numero. |
| `js/model.js:194` / `formatIndex` | Scala pubblica 0–10, un decimale e virgola italiana. |
| `js/app.js:869` / `compute` | Calcola tutte le zone, fasce e giorni; usa i dati `series[z.id]`. Preferenze pratiche e community cambiano soltanto ordinamento. |
| `js/app.js:2673` / `predict` | Per il diario, restituisce `Record<speciesId,score|null>`. Quota assente = massimo delle fasce della zona. |
| `js/app.js:2692` / `captureForecast` | Snapshot prospettico con `scores`, `scoresByBand`, 31 giorni di input, parametri, profili specie, habitat e versione modello. |
| `js/science.js` / `renderWhy`, `drawWhyCharts` | Render scientifico e quattro grafici. Esplicita che indice non è probabilità. |
| `js/community-signal.js` / `communityMultiplier` | Moltiplicatore della sola priorità, limitato, con requisiti minimi di account/giorni; non calibra la biologia. |

`scoreSpecies` smista le piante a `scoreBotanical`: cambiare indiscriminatamente l'interfaccia del modello coinvolgerebbe anche botanica e scoperte. Il namespace indipendente `tools/fronda_model/` evita questa dipendenza.

## Meteo e geografia

- `worker/weather-provider.js:5–13`: Open-Meteo forecast, 62 giorni precedenti + 8 previsti, timezone Europe/Rome. Per ogni zona ripete le stesse coordinate a tre quote, usando il parametro `elevation`. Il cambio quota non equivale a tre stazioni o a un modello di microclima del sottobosco.
- `js/weather.js:14–38`: `toDaily` restituisce `dates,p,tmean,tmin,tmax,soilm,soilt,todayIndex,issuedIndex,source`. `soilm` è VWC modellata 3–9 cm; `soilt` a 6 cm è acquisita ma non entra nell'indice fungino corrente.
- `js/weather-data.js:2–17`: `compactGrowth` aggrega le ore del suolo sul Worker per ridurre payload; la cache è separata per zona e quota.
- `js/weather-cache.js` e `worker/weather-provider.js`: controlli di forma e data di cache, limiti di età, risposte parziali e provenance acquisizione già ben separati dal numero biologico.
- `data/zones.json`: 15 zone locali, non una griglia nazionale. `data/habitat.json`: categorie della Carta Forestale Lazio, campioni sistematici e quote. Nessun layer nazionale di host trees, pH, suolo, copertura nevosa, substrato, gestione forestale o fruttificazione osservata.
- La configurazione Worker ammette solo coordinate delle zone pubblicate: un prototipo nazionale richiede un nuovo ingest offline/API dedicata, non può riusare il proxy locale come servizio arbitrario per tutta Italia.

## Limiti scientifici concreti

1. **Il prodotto di fattori è un indice euristico.** Le funzioni, i pesi e le soglie non sono un modello stimato su dati di incontro. Nessuna trasformazione monotona dell'indice, divisione per 100 o sigmoide con coefficienti scelti a mano lo rende una probabilità.
2. **Dipendenze replicate.** Stagione, T, quota, suolo e pioggia sono correlati. Moltiplicarli può contare più volte la stessa condizione; non giustifica assunzioni d'indipendenza.
3. **Pioggia obbligatoria nel prodotto.** Con `p=0` nelle finestre il fattore pioggia è zero anche se il suolo modellato è umido. Specie lignicole e saprotrofe ricevono lo stesso impianto meteo delle ectomicorriziche, senza legno/substrato o disponibilità ospite osservati.
4. **Soglie e shock non convalidati.** 8/15 mm di innesco, plateau dell'habitat a 45%, VWC assoluta 0,10/0,26, gelo/caldo e bonus shock sono euristiche. Aggiungere nuove soglie all'audit non è un miglioramento dimostrato. Il bonus shock favorisce ogni profilo, non soltanto quelli con evidenza specifica.
5. **Tassonomia e dominio.** `virescens` mescola R. virescens / cyanoxantha e `suillus` almeno tre taxa. Un modello nazionale per singola specie non può trattare questi gruppi come osservazioni della stessa specie. Quota e calendario appenninici non si trasferiscono invariati ad Alpi, coste, isole e altre regioni climatiche.
6. **Massimo per zona.** Corretta protezione contro gonfiamento da taxa duplicati, ma massimo di fasce/specie non descrive l'esito di un percorso o protocollo di ricerca. Un visitatore può percorrere un'altra parte della zona; habitat e meteo sono allineati alla quota, non necessariamente al tragitto visitato.
7. **Modello meteo senza ensemble.** Oggi c'è una sola serie puntuale, non un intervallo di incertezza della fruttificazione. L'età della cache e il numero di dati completi non quantificano la calibrazione o l'incertezza statistica.
8. **Passato meteo e leakage.** `past_days` è meteo modellato disponibile oggi, non archivio della previsione realmente disponibile allora. Gli snapshot prospettici già presenti sono un buon inizio. Per backtest servono issue time/vintage espliciti, senza sostituire un input storico con rianalisi successiva e poi chiamarlo forecast.
9. **Conteggi di concordanza.** `js/journal.js:15,21–39`: soglia esplorativa 30/100 e concordanze non indipendenti. Non sono Brier, log loss, calibrazione o accuratezza della probabilità e non possono selezionare da soli il modello nazionale.

## Difetti tecnici riprodotti / lacune d'integrità

### A. Suolo fuori range accettato dal percorso compatto

- `js/weather-data.js:12–13` controlla soltanto `Number.isFinite`, non 0≤VWC≤1. `js/weather.js:33` accetta la media giornaliera compatta se finita senza ripetere il range check.
- `js/model.js:127` verifica finitezza ma non range per `soilm`. Un'intera finestra VWC=1,5 è `quality.complete=true` e produce lo stesso indice alto di VWC=0,3.
- La via oraria non compatta applica invece il range check (`js/weather.js:23`), quindi le due vie non sono semanticamente equivalenti per dati malformati.
- Nel nuovo modulo: validazione per variabile e unità; VWC fuori range → missing/invalid con motivo, mai saturazione silenziosa.

### B. Finestra per numero di righe, non per date verificabili

- `inputQuality` non verifica date uniche, ordinate, reali e giornalmente contigue. Server e cache controllano stringhe/forma, non continuità o stessa griglia temporale per tutte le quote.
- Riproduzione: 40 righe con la stessa `dates` e array numerici sono `quality.complete=true`; il conteggio viene presentato come 30/20 giorni pur rappresentando righe duplicate.
- Nel nuovo modulo: join per ISO date valida; controllare giorni mancanti/duplicati/inversioni, range richiesto e allineamento di ogni variabile. Non affidarsi a `i` condiviso tra fasce senza confronto date.

### C. Provenance assente interpretata come passato noto

- `inputQuality`: `issuedIndex=-1` impedisce di marcare qualunque riga come forecast. Se manca `fetchedAt`, i fattori numerici possono ancora risultare completi e `usesForecast=false`.
- Per un backtest questo deve essere `provenance_unknown` e impedire qualifiche prospettiche, non una rassicurazione implicita sul passato.

### D. Copertura oraria rigida

- `compactGrowth` e `toDaily` chiedono almeno 24 valori finiti. Una giornata locale completa di 23 ore viene scartata; una serie duplicata a 24 righe passa.
- Riprodotto con una serie esplicita del 29 marzo 2026 senza ora 02: valore giornaliero `null`. **Ambito da verificare col provider:** se Open-Meteo restituisce sempre una griglia artificiale a 24 righe anche nei cambi d'ora, l'impatto su quell'endpoint è diverso. Il requisito attuale resta inadeguato per input orari reali/offset-aware italiani. Il nuovo ingest deve usare timestamp UTC con offset e verificare copertura temporale attesa, non un generico `count>=24`.

### E. Snapshot prospettico non ancora audit scientifico server

- `worker/community.js:255–263` data e rende immutabile il piano, poi riusa gli score del piano antecedente all'inizio dichiarato: è utile.
- Il server non ricalcola score/input e non valida struttura approfondita del piano (`forecast`, scale, versione, hash): i numeri restano ricevuti dal client. Non chiamare lo snapshot certificazione del modello.
- `effort.startedAt` è autodichiarato e può essere rieditato; il server verifica passato/finitezza ma non corrispondenza al giorno `entry.date`, durata temporale, timezone o fascia visitata (`239–245`).
- Per lo studio: receipt server, hash del payload canonico, forecast issuance, input hash e visit protocol version; distinguere auto-report e record da protocollo controllato.

### F. Report condiviso e diario possono divergere nello sforzo

- `worker/community.js:270–271` ritira report soltanto se cambiano zona/data/finds/searched. Modificando minuti/persone/inizio si mantiene il report precedente, il cui `validation_context` ha ancora effort copiato alla condivisione (`302–303`).
- L'estrazione training deve usare un record di survey versionato e coerente, non mischiare `reports.validation_context` vecchio e payload diario nuovo.

### G. Dettaglio scala UI isolato

- `js/app.js:2651` (`whereToFind`) scrive `indice oggi ${today}` e non `formatIndex(today)`: visualizza ancora 0–100 in quel testo. Non è oggetto della nuova ricerca offline; annotarlo per una correzione UI separata con aggiornamento cache e test browser.

## Osservazioni già disponibili e cosa manca

Il taccuino non parte da zero:

```text
entry.kind = outing | plan | note
entry.zoneId, date, band
entry.searched = [taxon/group ID dichiarati cercati]
entry.effort = { startedAt, minutes, people }  // facoltativi
entry.finds = { ID: 0..3 }                  // 1 Pochi, 2 Discreti, 3 Tanti
entry.predicted = { ID: score 0..100|null }
entry.forecast = { mode, capturedAt, planId?, modelVersion?, scoresByBand?, inputs?... }
```

- `js/journal.js:346–364`: per taxa cercati nessuna quantità diventa zero; gli altri restano non osservati. Campo `searched` preserva la distinzione fondamentale.
- `migrations/0001_community.sql:25–35`: tabella `reports` con amount 0–3, searched, identification_checked, validation_context, dedup account×giorno×zona×specie.
- `worker/community.js:64–70`: zero richiede ricerca esplicita. `identificationChecked` è un booleano inviato dal client, non revisione esperta documentata.
- Dedup per account×giorno×zona×taxon sovrascrive visite ripetute nello stesso giorno: summary/report non consentono stima di detection con repeated surveys. Usare survey originali con identificatori distinti.
- Manca durata obbligatoria e definizione del protocollo; manca area o traccia effettivamente cercata, site/patch ripetibile, osservatore/gruppo identificabile pseudonimo, checklist completa, esperienza dell'osservatore, stadio/freschezza carpofori, conferma tassonomica documentata e consenso di ricerca distinto dalla condivisione community.
- `0` significa non rilevato dopo ricerca, non assenza biologica. Le quantità ordinali non possono diventare conteggi o kg. Gruppi misti non possono diventare singola specie.
- Note private e osservazioni botaniche hanno destinazioni/consensi distinti: nessuna estrazione automatica per training dal diario.

## Contratto JSONL raccomandato per `tools/fronda_model/`

Una riga per **survey_id × target taxon_id**, con i taxa della medesima visita sempre nello stesso fold. La riga descrive un rilevamento durante uno sforzo documentato; niente zeri per taxa non cercati.

```json
{
  "schema_version": "fronda-survey-v1",
  "survey_id": "visit-2026-10-15-001",
  "survey_revision": 1,
  "site_id": "private-patch-001",
  "spatial_block_id": "coarse-validation-block",
  "observer_group_id": "pseudonymous-group",
  "date": "2026-10-15",
  "timezone": "Europe/Rome",
  "region_code": "IT-62",
  "location": {"precision_m": 1000, "elevation_m": 1200},
  "effort": {
    "protocol_version": "fronda-targeted-search-v1",
    "started_at": "2026-10-15T08:00:00+02:00",
    "duration_minutes": 60,
    "observer_count": 1,
    "searched_distance_m": null,
    "searched_area_m2": null,
    "checklist_complete": true
  },
  "taxon_id": "Boletus edulis",
  "taxon_resolution": "species",
  "target_declared": true,
  "outcome": "not_detected",
  "count": null,
  "amount_ordinal": 0,
  "identification": {"status": "not_applicable", "verification_ref": null},
  "forecast": {
    "captured_at": "2026-10-14T20:00:00Z",
    "server_received_at": "2026-10-14T20:00:01Z",
    "weather_issued_at": "2026-10-14T18:00:00Z",
    "model_version": "fronda-research-v3",
    "input_hash": "sha256:...",
    "feature_schema_version": "fronda-features-v1"
  },
  "research_consent": true,
  "source_type": "prospective_protocol"
}
```

Regole richieste:

- `outcome`: `detected`, `not_detected`, `unknown`; `unknown` non è una classe negativa e va escluso dal fitting supervisionato.
- `target_declared=true` e `checklist_complete=true` richiesti per nondetection. Per encounter la lista target e la definizione di esito devono essere fissate in anticipo; un ritrovamento opportunistico conserva source_type separato.
- Durata strettamente positiva e numero osservatori intero positivo; timestamp con offset; giorno locale coerente; durata compatibile con eventuale ended_at; receipt del forecast antecedente alla visita per valutazione prospettica.
- Se duration/observers mancanti, il dato può restare descrittivo ma non addestrare probabilità di incontro condizionata allo sforzo.
- `identification.status`: `unreviewed`, `self_reported_checked`, `expert_verified`, `not_applicable`; l'ultimo solo per non-rilevamento. Positivi della valutazione primaria preferibilmente verificati con riferimento revisione. I positivi non verificati restano distinti, non certificati da un booleano.
- `count=null` per gli amount ordinali del diario; count intero soltanto se contato secondo protocollo. Nessuna conversione Pochi→2 o Tanti→10.
- Precisione, coordinate e quota non falsamente dedotte da centro zona/miglior fascia. Site_id può essere pseudonimo; le coordinate esatte non servono a essere pubbliche. Un sito ripetibile è necessario per occupancy/detection.
- `research_consent` non si ricava da shared=true. I record privati restano esclusi salvo consenso esplicito.
- Conservare tutte le visite, anche senza ritrovamenti. Eventuale dedup sceglie revisione di una visita, mai collassa diverse visite nello stesso giorno.
- Hash dei dati, identità dataset/versione, modello e parametri, vintage meteo e split devono entrare nell'artefatto di valutazione.

Definizione del target: `P(almeno un carpoforo del taxon rilevato durante una ricerca secondo quel protocollo, durata, numero osservatori e dominio)`. Non confondere con `P(presenza del micelio)`, `P(fruttificazione biologica)` o `P(trovare un fungo commestibile/identificato)`.

## Integrazione compatibile proposta

Nessun import dai nuovi moduli dentro `js/model.js` o `js/app.js` finché manca una calibrazione indipendente. Il prototipo può essere completamente offline e testabile.

```text
tools/fronda_model/
  README.md                  # target, scala, fonti, dominio, limiti, comandi
  evidence.json              # fonte, DOI/URL, paese, taxa, disegno, revisione, trasferibilità
  schema-survey.json          # contratto survey e consenso
  schema-features.json        # date, unità, profondità, provenienza, missingness
  features.py                # estrazione raw per finestre; nessun indice pubblico nuovo
  survey.py                  # validazione/normalizzazione e motivi di esclusione
  baseline.py                # baseline stagionale/dominio; tuning solo training
  fit.py                     # fitting sperimentale se dati idonei
  evaluate.py                # blocchi temporali/spaziali/osservatore + score probabilistici
  predict.py                 # gate e risultato esplicito non_calibrated/out_of_domain
  tests/                     # qualità dati, leakage, unità e gate; dataset sintetico dichiarato
```

Interfacce stabili raccomandate:

```python
validate_survey(row) -> {valid, errors, training_eligible, exclusion_reasons}
build_features(series, target_date, forecast_as_of, context) -> {
    feature_schema_version, features, units, provenance, missing, invalid,
    forecast_horizon_days, domain_flags
}
fit(training_rows, feature_spec, split_spec) -> model_artifact
evaluate(model_artifact, held_out_rows, split_spec) -> evaluation_artifact
predict(model_artifact_or_none, feature_row, effort) -> {
    status, encounter_probability, interval, reasons, model_id,
    feature_schema_version, calibration_scope, forecast_as_of
}
```

Prima della calibrazione `encounter_probability:null`, `interval:null`, `status:"not_calibrated"`. Per fuori dominio status distinto e ragione. Un coefficiente zero o un flag editoriale `calibrated:true` non sono evidenza sufficiente a pubblicare una percentuale. Un dataset sintetico dimostra esecuzione e controlli, non performance reale.

Si possono già esportare feature raw utili e source-backed: pioggia 3/7/14/21/30/60 gg, giorni secchi e piovosi con soglia esplicita e fonte/ipotesi, T aria/suolo, min/max estremi, VWC con profondità e unità, deficit idrico se ET0 è disponibile, calendario ciclico, quota, habitat e host osservato. Definizioni di feature non sono coefficienti biologici. La scelta delle finestre va stimata nel training e confrontata con baseline, non ottimizzata sul set di test.

La probabilità di incontro può iniziare da un modello di detection condizionato allo sforzo; occupancy con repeated visits o un modello point-process richiedono dati e assunzioni aggiuntivi. Non identificare separatamente occupazione e detection da singole presenze opportunistiche. Non unire probabilità taxa con `1-∏(1-p)` senza un modello della dipendenza o una validazione del target multiclasse/any-target.

## Verifica effettuata

Eseguito, 38 test superati:

```bash
node --test tests/model.test.mjs tests/weather.test.mjs tests/weather-provider.test.mjs tests/journal.test.mjs tests/community-signal.test.mjs
```

Inoltre script Node ad hoc in stdin ha riprodotto: VWC=1,5 accettata con indice alto; date tutte duplicate accettate come complete; issuedIndex=-1 senza provenance etichettato usesForecast=false; serie locale esplicita a 23 ore aggregata a null. Nessun file test o sorgente modificato.

I test correnti verificano comportamento software e cache; non accuratezza micologica. Test da aggiungere al prototipo: nessun dato≠zero, temporalità a 1/7/30 giorni e rolling windows, date duplicate/gap/febbraio bisestile/cambi d'ora, unità/range/soil depth, previsione vintage dopo as-of respinta, sforzo zero/nullo, taxon gruppo vs specie, assenze non cercate, survey comune nello stesso fold, consenso, unreviewed separato, guardia percentuali, nessun import/UI modificato.

Comandi utili per il lavoro successivo:

```bash
python3 -m unittest discover -s tools/fronda_model/tests
npm test
npx wrangler deploy --dry-run
git diff --check
```

Se si modifica soltanto `tools/fronda_model/` escluso dagli asset, nessun bisogno di cambiare shell/meta/versione o avviare browser dell'app. Per una futura integrazione UI: test mirati `tests/browser/weather.spec.mjs`, `weather-background.spec.mjs`, `community.spec.mjs`, `botanical-notebook.spec.mjs` e suite completa prima del rilascio, con un solo Wrangler su porta 8788, secondo AGENTS. Nuovi campi pubblici via CMS richiedono schema/renderer/seed/snapshot insieme; non necessari al prototipo offline.
