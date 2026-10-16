# Fronda Italia ricerca e prototipo del modello

Un luogo nuovo può essere previsto usando dati di ambienti simili: lo storico
locale non è indispensabile. Questo prototipo prepara e apprende le relazioni
ambientali per una probabilità di ritrovamento per uscita. La calibrazione italiana
e il miglioramento rispetto all'indice attuale non sono ancora misurati.

- [Prompt e stato per il prossimo agente](PASSAGGIO-AGENTE.md)
- [Confronto delle 31 fonti inviate e omissioni integrate](confronto-fonti-utente.md)
- [Accesso ai testi integrali più applicabili](accesso-studi.md)
- [Ricerca e modello proposto](ricerca.md)
- [19 studi verificati e limiti di trasferimento](letteratura.md), [registro strutturato](studies.json)
- [Fonti italiane e piano di validazione](dati-validazione.md)
- [Audit del codice Fronda attuale](audit-fronda.md)
- [Quaderno eseguito con meteo reale su Rieti](fronda-ricerca.ipynb)
- [Contratto dati delle uscite](survey.schema.json)

## Eseguire

Python 3.12. Da radice repository:

```bash
python -m venv .venv-fronda
.venv-fronda/bin/python -m pip install -r tools/fronda_model/requirements.txt
.venv-fronda/bin/python -m tools.fronda_model features \
  --weather tools/fronda_model/data/weather-rieti-2026-10-16.json \
  --context tools/fronda_model/data/context-rieti.json \
  --date 2026-10-16 --out /tmp/fronda-features.json
.venv-fronda/bin/python -m unittest discover -s tools/fronda_model -p 'test_*.py' -v
```

`features` usa solo la libreria standard; le dipendenze servono per training e
notebook. Aggiungere `--issued-at` con timestamp e fuso per controllare il cutoff:
senza `available_at` dei singoli input, la disponibilità storica resta ignota.

## Addestrare con visite vere

Una riga JSONL rappresenta una visita e un taxon dichiarato cercato. `target_taxon`
e `taxon_id` usano lo stesso ID canonico. `not_detected` è mancato ritrovamento dopo
ricerca, non assenza del micelio; `unknown` viene escluso. Identificazioni positive
non controllate non entrano nel training; un controllo autodichiarato non equivale
a verifica esperta. `research_consent` è distinto dalla condivisione community.

Una mancata rilevazione richiede `search_completed: true`: la ricerca del taxon
deve essere conclusa secondo il protocollo. Una ricerca interrotta senza
ritrovamento resta `unknown`; una checklist incompleta non crea assenze per i
taxa omessi. `effort_basis: "planned_protocol"` indica che la durata è stata
fissata prima dell'esito. Se si termina al primo successo, registrare separatamente
fine effettiva e motivo: non usare la durata fino al ritrovamento come predittore.

L'output di `features` contiene `values`, `quality` e `provenance`: il campo
`features` della riga di training riceve solo `values`, conservando gli altri
campi per l'audit. Scegliere le covariate nel training; quelle sempre mancanti
non sono addestrabili. `features_as_of` è il cutoff informativo, non l'ora di
download di una rianalisi. Lo snapshot incluso è `current_api_snapshot` senza
corsa identificata: dimostra la trasformazione, non è un archivio valido di
previsioni storiche e non diventa tale cambiandone soltanto l'etichetta.

Preparare split `train`, `calibration`, `test` con blocchi e siti disgiunti,
cronologici e separati da almeno 60 giorni. Le trasformazioni sono apprese sul
training, la calibrazione sul calibration e le metriche soltanto sul test.
Selezionare prima i nomi delle covariate da `features.FEATURE_NAMES` in un JSON array,
senza usare esiti del test per sceglierli. Il modello include lo sforzo.

```bash
python -m tools.fronda_model train --input /percorso/visite-consentite.jsonl \
  --feature-list /percorso/variabili.json --taxon edulis --out-dir /tmp/fronda-fit
python -m tools.fronda_model predict --artifact /tmp/fronda-fit/artifact.json \
  --input /percorso/uscita.json --out /tmp/fronda-prediction.json
```

Il modello è di ricerca: l'output pubblico resta `null`. Le stime interne riguardano
un evento con sforzo definito; non presenza biologica, biomassa o commestibilità.
L'astensione fuori dominio non significa probabilità zero. I controlli min/max
delle covariate non costituiscono prova di trasferibilità nazionale né modellano
tutte le combinazioni ecologiche. Gli artefatti sono JSON, senza pickle.
Le dichiarazioni del protocollo e dei timestamp sono controllate come input;
il software non può certificare da solo che un protocollo sia stato rispettato
o che una corsa archivistica sia autentica.

## Rigenerare il quaderno

```bash
python tools/fronda_model/build_notebook.py
python -m jupyter nbconvert --execute --to notebook --inplace \
  tools/fronda_model/fronda-ricerca.ipynb
```

La prima istruzione rigenera le celle e rimuove gli output; la seconda li ricalcola
e salva. Il quaderno non accede a dati privati e non richiede rete.

## Dati e limiti

Lo snapshot meteo incluso proviene da [Open-Meteo](https://open-meteo.com/),
licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Sono stati rinominati
i campi giornalieri, conservando i valori nulli. Fonte, richiesta, acquisizione e
checksum sono nel JSON. La licenza del dato e i termini del servizio API sono
distinti. Nessuna fonte biologica nazionale è stata scaricata o inclusa.

Il prototipo vive in `tools/`, escluso dagli asset del sito. Non cambia CMS,
service worker, dati del Taccuino o indice pubblico di Fronda.
