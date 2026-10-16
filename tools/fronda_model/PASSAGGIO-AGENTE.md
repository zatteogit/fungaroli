# Passaggio della ricerca Fronda al prossimo agente

16 ottobre 2026. Repository: https://github.com/zatteogit/fungaroli.
Ramo del pacchetto: `codex/fronda-modello-micologico-v3`.
Base applicativa studiata: `68e2b1c`, modello pubblico `2.0.0`.

## Prompt da usare

Assimila e valuta criticamente il lavoro in `tools/fronda_model/`. L'obiettivo
del progetto è migliorare Fronda per prevedere dove e quando cercare funghi in
Italia, anche in luoghi senza uno storico locale, usando informazioni provenienti
da ambienti analoghi. Occorre distinguere presenza ecologica, disponibilità dei
corpi fruttiferi e ritrovamento durante una ricerca con sforzo definito.

Leggi prima `AGENTS.md`, `docs/handoff-2026-10-14.md` e
`docs/handoff-fronda-2026-10-15.md`. Poi esamina, in questo ordine:

1. `tools/fronda_model/README.md` e `ricerca.md`.
2. `confronto-fonti-utente.md`: confronto di tutte le 31 fonti inviate dall'utente.
3. `accesso-studi.md`, `access-manifest.json`, `letteratura.md` e `studies.json`.
4. `dati-validazione.md`, `audit-fronda.md`, `audit-porcini.md` e `soil-sdm.json`.
5. `features.py`, `learning.py`, `survey.schema.json`, i test e `VERIFICA.md`.

Controlla il contenuto effettivo delle fonti e del codice; tratta le conclusioni
di questa ricerca come proposte da verificare. Individua ciò che è già utilizzabile,
ciò che richiede correzione e ciò che dipende da dati non ancora acquisiti.

Consegna una sintesi operativa che risponda a queste domande:

- Quali parti migliorano concretamente l'attuale Fronda e con quale evidenza?
- Come produrre stime iniziali per un bosco nuovo, sfruttando ospiti, suolo,
  substrato, topografia, clima e meteo? Lo storico abbondante del singolo punto
  non deve essere posto come requisito universale per cominciare.
- Quali probabilità preliminari sono stimabili e come rappresentare incertezza,
  trasferimento fra ambienti e differenza fra habitat e successo di un'uscita?
- Quali fonti e dati sono effettivamente accessibili e riutilizzabili adesso?
- Quali limiti o errori ci sono nel prototipo? Qual è il primo incremento
  implementabile nell'app, con dati richiesti, criteri di riuscita e verifiche?

Proponi una prima iterazione concreta e un elenco ordinato dei passi successivi,
con file interessati e criteri di accettazione. La richiesta di passaggio è una
richiesta di lettura critica e proposta operativa; non comprende merge o deploy.

## Stato concreto del pacchetto

- Ricerca e codice sono in `tools/`, escluso dagli asset pubblicati. Nessuna
  modifica a interfaccia, CMS, service worker o indice dell'app.
- Il prototipo Python è una baseline di ricerca: costruisce 31 covariate candidate
  e può apprendere un esito di ritrovamento per una specie e un protocollo.
- Non è stato addestrato un modello nazionale italiano né dimostrato un guadagno
  di accuratezza. Non sono già implementati il modello nazionale gerarchico,
  la disponibilità dinamica dei carpofori o gli ensemble meteorologici.
- `learning.py` usa trasformazioni apprese sul training, regressione logistica
  regolarizzata e calibrazione separata. Gli split dichiarati sono controllati
  per separazione di siti/blocchi, ordine temporale ed embargo di almeno 60 giorni.
- Richiede sforzo pianificato (`effort_basis=planned_protocol`) e ricerca conclusa
  per una mancata rilevazione. Siti nuovi sono ammessi entro il dominio delle
  covariate; i controlli marginali min/max non dimostrano trasferibilità nazionale.
- Le stime interne rimangono sperimentali. `public_probability` è sempre `null`:
  è una scelta del prototipo, non un'affermazione che stimare probabilità sia
  impossibile senza storico di ogni luogo.
- Lo snapshot Open-Meteo incluso è reale e attribuito, ma non documenta una corsa
  previsionale storica. Serve a verificare la trasformazione: non va rietichettato
  come archivio operativo per un backtest.
- I test usano fixture software, non osservazioni micologiche. Il notebook è
  eseguito e mostra controlli degli input, non accuratezza di previsione biologica.

## Risultati scientifici da non perdere

- Ambrosio 2024 (Liguria) e Qi 2025 (ospiti e distribuzioni europee) erano omissioni
  importanti della prima rassegna: sono state lette e aggiunte al registro accessi.
- Li 2025 motiva il suolo nel livello habitat; l'11% è quota indipendente della
  varianza dell'idoneità modellata, non +11 punti di accuratezza o ritrovamento.
- Morera 2021 è importante per validare il trasferimento ad ambienti nuovi.
- Il materiale pubblico sui porcini tedeschi richiede adattamento: aggregato e
  sottositi si sovrappongono, gli zeri non documentano tutti visite negative e
  le medie mobili comprendono il giorno contato. Il modello NB1 usa link log.
- Dati annuali di biomassa, presenze opportunistiche, eventi con non-rilevazioni,
  micelio e ritrovamenti di cercatori hanno target e processi di osservazione diversi.
- Consultazione di un paper, acquisizione di dati/codice e diritto di riuso sono
  stati registrati separatamente. Diverse risorse sono note solo da manifest;
  non sono dataset pronti e non è stata dichiarata una riproduzione completa.

## Verifiche eseguite

46 test Python, 196 test dell'app e dry-run Wrangler superati. Notebook eseguito
e render ispezionato; JSON e collegamenti locali controllati. Dettagli in
`VERIFICA.md`. Non è stata eseguita una nuova suite browser dell'app per questo
pacchetto, che non modifica il prodotto.

Per ripetere il controllo del codice, dalla radice del repository:

```bash
python -m venv /tmp/fronda-review-venv
/tmp/fronda-review-venv/bin/python -m pip install -r tools/fronda_model/requirements.txt
/tmp/fronda-review-venv/bin/python -m unittest discover -s tools/fronda_model -p 'test_*.py' -v
git diff --check
```

Conserva i file della ricerca e lavora su un ramo dedicato. Prima di eventuali
modifiche applicative confronta il pacchetto con la produzione corrente: l'audit
è ancorato alla base indicata sopra. Il ramo di produzione è specificato in
`AGENTS.md`; il suo merge avvia la pubblicazione del sito.
