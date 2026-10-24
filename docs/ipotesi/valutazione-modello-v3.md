# Valutazione del modello «v3»: pacchetto Codex (A) e documento «Fronda 3.0» (B)

> **Stato: ipotesi valutate.** Né A né B sono adottati. Ciò che entra nell'app passa da una PR verso produzione con le decisioni della sezione 9. Registro: [README.md](README.md).
>
> **Aggiornamento del 21/10/2026:** stato delle decisioni e della prima integrazione nella sezione 10. D5 è chiusa: `tsd` del porcino resta 3,5.

16 ottobre 2026. Sintesi per Matteo di tre analisi indipendenti (codice e test, fonti, impianto scientifico) e di alcune verifiche fatte per questa sintesi. Nessun file dell'app né del pacchetto A è stato modificato per questa valutazione.

Dove stanno le cose citate:

- **A**: commit `4465d2f`, ramo `codex/fronda-modello-micologico-v3`. I percorsi `tools/fronda_model/…` sono di quel commit.
- **B**: `docs/ricerca-modello-micologico-italia.md` del ramo `claude/ricerca-modello-micologico` (commit `8c0ba55`). «B r.NNN» indica la riga di quel file.
- **App**: i percorsi `js/…`, `worker/…`, `docs/…`, `migrations/…` e i numeri di riga si riferiscono al commit `e5f9552` (PR #96, prima tornata di correzioni). Dopo la seconda tornata alcune righe si spostano.
- Script delle analisi: `tools/ipotesi/valutazione-v3/` (vedi il README lì). I dati scaricati e gli esiti intermedi non sono nel repository.

| Etichetta | Significato |
|---|---|
| **Fatto verificato** | Controllato su codice, dati, Crossref/DataCite/Zenodo o testo della fonte. |
| **Ipotesi** | Plausibile, va misurata. |
| **Da costruire** | Oggi manca. |
| **Parere** | Raccomandazione mia. La decisione è tua. |

## 1. Sintesi

- **A è una buona base di ricerca, non un modello.** Codice corretto e testato: 46 test, nessuna fuga dal test, `public_probability` sempre nullo. Dei 56 DOI di articoli e libri, 55 sono su Crossref (54 identici, uno con l'anno diverso) e uno su DataCite; i 9 DOI di dati sono su DataCite. Manca un modello addestrato, e mancano i dati per addestrarlo.
- Per lo scopo dichiarato (boschi senza storico) manca il pezzo centrale. Il dominio si controlla una variabile alla volta: Codex lo dichiara, ma non lo risolve. Non c'è un percorso per il meteo previsto. Platt può invertire l'ordine senza un avviso esplicito. Gli split richiedono almeno 2 stagioni di uscite, realisticamente 3, prima della prima valutazione.
- **B non è adottabile.** Una citazione non esiste. Un'altra ha autori, anno e rivista giusti, ma titolo, volume, pagine, DOI e contenuto sbagliati. La «falesia» descritta da B (7 fattori a 0,8) non compare nei casi calcolati con il codice reale (stagione 2017 e 17 settembre–15 ottobre 2026). La «trovabilità %» non ha coefficienti, non è una probabilità e viola AGENTS.md.
- **Cosa fare: prima registrare, poi cambiare.** Quattro passi piccoli: archivio quotidiano delle previsioni, previsione salvata con 60 giorni di ingressi, uscite con zeri e sforzo nel Taccuino, «bosco adatto» e «condizioni meteo» separati e senza percentuali. In parallelo, una prova offline dell'indice sui porcini tedeschi. L'indice resta com'è.
- Di probabilità calibrata si potrà parlare solo dopo più stagioni di uscite standard con zeri e sforzo, più un test prospettico congelato.

## 2. Il pacchetto A: valutazione scientifica e tecnica

### 2.1 Che cosa contiene

**Fatto verificato.**

- Il commit aggiunge 30 file, tutti sotto `tools/fronda_model/` (`git diff --stat 68e2b1c 4465d2f`). Non tocca l'app.
- `tools` sta in `.assetsignore`: la cartella non viene pubblicata.
- Contenuto:
  - `features.py`: 31 covariate meteo e di contesto per sito e giorno;
  - `learning.py`: regressione logistica con penalità ridge, calibrazione di Platt (una correzione logistica delle uscite) e controllo del dominio;
  - una CLI, un notebook e `survey.schema.json`;
  - i documenti di ricerca: `ricerca.md`, `dati-validazione.md`, `audit-fronda.md`, `audit-porcini.md`, letteratura e manifest delle fonti.
- Non esiste un modello addestrato, e il pacchetto lo dichiara (`PASSAGGIO-AGENTE.md:46-61`).

### 2.2 Codice e test: cosa regge

**Fatto verificato** (analisi del codice).

- **Test e pubblicazione.**
  - 46 test Python superati (25 in `test_features.py`, 21 in `test_learning.py`), anche con `-W error`. Versioni di `requirements.txt`; Python 3.13 al posto di 3.12.
  - 196 test dell'app superati. `npx wrangler deploy --dry-run` esce con 0. `git diff --check` è pulito.
- **Notebook.** Rieseguito, dà output identici. Lo sha256 dello snapshot meteo coincide con `metadata.sha256_rows`. I numeri dichiarati tornano: 82 righe, 16 giorni nulli (2–17 agosto), 19 covariate su 31 il 16/10.
- **Covariate costruite come dichiarato.**
  - Le finestre sono disgiunte: 7, 7, 16 e 30 giorni (`features.py:36`, `:255-265`).
  - Il giorno D resta sempre fuori (`:245-253`).
  - Un aggregato si calcola solo con tutti i giorni (`:169-171`).
  - Uno zero resta zero, un dato mancante resta `None`.
  - P−ET₀ si calcola solo se ci sono entrambe le serie (`:265`).
- **Nessuna fuga d'informazione dal test.**
  - Le trasformazioni si stimano solo sul training (`learning.py:241-247`), Platt solo sulla calibrazione (`:274-287`).
  - Rilievi, siti e blocchi sono disgiunti fra gli split (`:106-109`).
  - Gli split seguono l'ordine cronologico, con un embargo di almeno 60 giorni (`:116-118`, `:177-178`).
  - I test lo coprono: `test_learning.py:68-90`, `:185-208`, `:244-251`.
- **Nessuna probabilità pubblica.** `public_probability` vale sempre `None` (`learning.py:254`, `:297`, `:312`). Fuori dominio la stima manca e porta un motivo: non vale zero (`:310-338`).
- **Dati dubbi.** Le righe dubbie vengono escluse e contate, mai trasformate in negativi (`:219-229`). Un `not_detected` senza ricerca conclusa viene rifiutato (`:213-214`).
- **Platt.** È implementato correttamente. Su 20 semi simulati, con 400 righe per split:
  - senza cambiamento fra periodi è neutro: Brier 0,1118 grezzo contro 0,1120 calibrato;
  - con l'intercetta spostata corregge: Brier da 0,1872 a 0,1618.
- **Portabilità.** L'inferenza si porta in JavaScript con circa 20 righe. Su 49 previsioni la differenza massima con Python è 5,55·10⁻¹⁷. L'addestramento resta in Python, offline.

### 2.3 Impianto: cosa regge

**Fatto verificato** (analisi dell'impianto).

- **Tre eventi distinti:** presenza ecologica, carpofori disponibili, ritrovamento con sforzo definito (`ricerca.md:36-66`, `dati-validazione.md:7-17`).
  - Il quadro è coerente con la letteratura sul rilevamento imperfetto (MacKenzie 2002, Guillera-Arroita 2017).
  - Codex dichiara i limiti giusti: con uscite singole i tre fattori non si separano (`ricerca.md:56-59`); i carpofori non restano per settimane (`:63-64`); le probabilità di più specie non si sommano (`:64-66`).
- **Il quadro nell'app.** Il primo livello esiste già in forma statica: `habitatPotential`, `js/model.js:212-226`. L'indice giornaliero approssima il secondo (`js/model.js:137-154`). Il terzo manca.
- **Zeri.** La regola è la stessa dell'app: uno zero vale solo per i taxa cercati (`README.md:38-49`; `js/journal.js:361`; `worker/community.js:64-70`).
- **Validazione ben disegnata.** Blocchi temporali, spaziali e ambientali, verifiche preregistrate, confronto con Fronda congelata e con la climatologia (`ricerca.md:188-210`, `dati-validazione.md:75-104`). Lo sostengono Roberts 2017 e Morera 2021.
- **Variabili nuove.** P−ET₀ e le altre restano candidate, senza soglie né bonus (`ricerca.md:159-165`).
- **Fonti chiave.** Karavani 2018 ha il riferimento giusto (`ricerca.md:101-103`).

### 2.4 Errori e punti deboli

| # | Problema | Prova | Gravità |
|---|---|---|---|
| 1 | **Il dominio si controlla solo una variabile alla volta.** Il controllo guarda minimo e massimo di ogni covariata presa da sola, quindi non riconosce un «bosco analogo» falso. Codex lo dichiara (`learning.py:264`, `domain_limit`; `PASSAGGIO-AGENTE.md:57-58`), ma è proprio il caso d'uso dichiarato (`README.md:3`). È una lacuna nota, non un errore nascosto. | `learning.py:121-131`. Nel training quota e temperatura sono correlate. La combinazione mai vista «1700 m con T20 a 19 °C» riceve p = 0,369 senza astensione; «350 m con T20 a 8 °C» riceve 0,017 (`tools/ipotesi/valutazione-v3/codice-test/joint_domain.py`). Non c'è pooling: un taxon e un protocollo alla volta (`:232-235`). | alta |
| 2 | **Manca un percorso per il meteo previsto in uso.** | Sono ammesse solo le provenienze `forecast_archive` e `reanalysis` (`learning.py:40`, `:89-90`). Con `current_forecast` la query non è valida. Un artefatto addestrato su rianalisi si astiene su `forecast_archive` (`:324-325`). Non esiste un orizzonte di previsione (grep `lead\|horizon`: nulla), mentre `dati-validazione.md:70` chiede valutazioni separate per giorno 0, +1, +3, +7. | alta |
| 3 | **Platt può invertire l'ordine senza un avviso esplicito.** | `learning.py:284`: L-BFGS-B senza vincolo sul segno. Ho invertito la relazione nella sola calibrazione: la pendenza −0,275 viene accettata e la PR-AUC del test scende da 0,431 a 0,066 (`edge_learning.py`, caso D; il caso è costruito apposta). Il rapporto mostra le metriche grezze accanto a quelle calibrate (`learning.py:303`), quindi l'inversione si vede se si leggono; manca un controllo che la blocchi. | media |
| 4 | **Non c'è un minimo di dati.** | `learning.py:238-240` chiede solo entrambe le classi in ogni split. Un addestramento con 3 righe per split e 1 positivo viene accettato. Manca il bootstrap per cluster (`no_cluster_bootstrap_computed`). | media |
| 5 | **Il legame features → learning è solo dichiarato.** | `learning.py` non legge `feature_schema_version` (emessa a `features.py:323`). `features_as_of` e `weather_provenance` sono dichiarati dalla riga (`learning.py:86-90`). Righe senza `available_at` vengono usate anche quando c'è `issued_at` (`features.py:250`): `features.py` le segnala con `availability_audit_status = "unknown"` (`:303-311`), ma `learning.py` non legge quello stato. | media |
| 6 | **Gli split richiedono almeno 2 stagioni, realisticamente 3.** | La sequenza training < calibrazione < test, con 60 giorni di embargo fra ciascuno e siti e blocchi disgiunti (`learning.py:106-118`), non sta in una stagione di circa 120 giorni. Con 2 stagioni passa solo se training e calibrazione stanno nella stessa stagione a 60 giorni di distanza: training ad agosto 2027, calibrazione a novembre 2027 e test ad agosto 2028 vengono accettati (`tools/ipotesi/valutazione-v3/scettico/due_stagioni.py`). Così però la calibrazione vede solo la fine della stagione. Con uno split di una stagione intera ciascuno servono 3 stagioni. Non c'è cross-fitting né origine mobile, che pure `dati-validazione.md:79-85` propone. | media |
| 7 | **Mancano covariate che l'indice usa già.** | Tmin e Tmax vengono validate (`features.py:137-146`) ma nessuna covariata le usa. Mancano pioggia massima giornaliera, giorni piovosi, temperatura del suolo (che l'app scarica: `worker/weather-provider.js:6`), gelo e caldo. `audit-fronda.md:206` li chiede. | media |
| 8 | **La finestra 30–60 giorni non si calcola con l'endpoint forecast.** | Richiesta reale del 16/10 (past_days = 92): valori nulli dal 16/07 al 18/08. Per D = 16/10 restano vuote le 3 covariate `lag_30_60` e la temperatura media a 60 giorni. Il notebook non ne spiega la causa. | media |
| 9 | **Lo storico proposto non è il prodotto usato in produzione.** | Stessi 45 punti, 20/08–10/10/2026. Archivio Open-Meteo (best_match: IFS, ERA5, ERA5-Land): pioggia mediana 107 mm. Giorni passati della Forecast API usata dall'app: 69 mm. Il rapporto mediano è 1,55 (da 0,67 a 3,67). Il fattore pioggia dell'indice vale 0,49 contro 0,19. ET₀ e temperatura sono simili. Codex propone ERA5-Land (`dati-validazione.md:23`) senza trattare questo scarto. | media |
| 10 | **Lo sforzo deve essere deciso prima dell'uscita.** Così oggi nessuna uscita reale è idonea. | `learning.py:80-81` e `survey.schema.json:17-19` vogliono `effort_basis = planned_protocol`. Il Taccuino registra la durata effettiva, facoltativa (`js/journal.js:298`). Lo sforzo entra come termine lineare nella logistica (`learning.py:42`, `:248`). | media |
| 11 | **Le fasce non ricevono la stessa cella meteo.** `audit-fronda.md:27` descrive correttamente la richiesta (stesse coordinate a tre quote), ma non dice che Open-Meteo risponde con celle diverse. | I 45 punti cadono in 23 celle Open-Meteo diverse. Vallonina: 1200 m in una cella, 1450 e 1650 m in un'altra. Le fasce ricevono pioggia e suolo diversi. | media |
| 12 | Lo schema mescola osservazione e analisi. | `survey.schema.json:6` rende obbligatori `features`, `split` e `weather_provenance` dentro la riga dell'uscita. Ha valori fissi per `searched`, `effort_basis` e `research_consent` (righe 15, 18, 24). Mancano area, percorso, quota e precisione. L'esito è solo sì/no e scarta i livelli 1–3 del Taccuino. | bassa |
| 13 | Lo stesso osservatore può finire in più split. | `learning.py:106` raggruppa solo per rilievo, sito e blocco (caso H: 7 osservatori condivisi accettati). `dati-validazione.md:81` chiede un test su osservatori mai visti. | bassa |
| 14 | I controlli di plausibilità sono deboli. | Accetta Kelvin (T7 = 283,15), quota 99 999 m, umidità del suolo 0,9 m³/m³. `soil_moisture` non dichiara la profondità (l'app usa 3–9 cm; la seconda tornata aggiunge 9–27 cm). | bassa |
| 15 | Gli iperparametri sono fissi. | C = 1,0 (`learning.py:248`), finestre fisse. T20 e T20² hanno correlazione 0,988 (`features.py:280`). Le interazioni non sono centrate (`:291-296`). | bassa |
| 16 | La data locale è dichiarata ma non imposta. | `learning.py:204-205`: un inizio alle 23:30Z viene accettato con la data UTC. | bassa |
| 17 | La curva termica di edulis è descritta in modo ambiguo. | `audit-porcini.md:119` scrive «quadratica sul log della media, non la curva gaussiana con ampiezza 3,5 °C». Letta in fretta sembra una differenza di forma, ma exp(a+bT+cT²) con c<0 è una gaussiana: la differenza vera è l'ampiezza. Dai dati σ ≈ 2,0 °C (stima dell'analisi dell'impianto con un GLM di Poisson ed effetti fissi per anno, non il modello NB1 con anno casuale degli autori: `tools/ipotesi/valutazione-v3/impianto-scientifico/sigma_brejon.py`), contro `tsd` 3,5 dell'app (`js/species.js:46`). A ±4 °C dall'ottimo i dati danno 0,14 e Fronda 0,52. | bassa |

### 2.5 Fonti del pacchetto

**Fatto verificato** (analisi delle fonti, più la mia verifica Crossref di 32 DOI citati qui).

- **Metadati.** Delle 56 voci con DOI controllate su Crossref, 54 corrispondono in autori, anno, rivista, volume, pagine e DOI. Salerni, Paoli & Perini 2023 non è su Crossref ma su DataCite, dove corrisponde. Zambonelli & Bonito è del 2012 su Crossref (record creato a gennaio 2013), il pacchetto scrive 2013: una sfumatura. I 9 DOI di dati (Zenodo, Dryad, EnviDat, GBIF, USDA, CORA) risolvono su DataCite. Non ci sono citazioni inesistenti né attribuite al lavoro sbagliato.
- **Contenuto.** Oltre 15 fonti controllate sul testo o sull'abstract dicono quello che il pacchetto riporta: Morera 2021, Li 2025, Qi 2025, Ambrosio 2024, Sánchez-González 2019, Karavani 2018, Olano 2020, Salerni 2002 e 2023, Martínez-Peña 2012, Ágreda 2015 e altre.
- **Porcini tedeschi.** L'audit si riproduce numero per numero sui file Zenodo, che hanno gli stessi hash: 3660 righe, 1220 date; nel blocco All 155 giorni positivi, 1065 zeri, 1905 carpofori.

Errori:

- **Licenza dei dati Brejon (media).** Il pacchetto la dà per «non verificata» e per prudenza vieta il riuso (`access-manifest.json:353-354`, `:364`, `:373`, `:392-393`; `audit-porcini.md:29-31`). Non è un'affermazione falsa: è una verifica non riuscita (API non disponibile, `access-manifest.json:354`), e il repository GitHub in effetti non ha un file LICENSE. I tre record Zenodo sono però CC BY 4.0. L'ho riverificato oggi con l'API Zenodo: 20591123, 17881359 e 17881340 riportano tutti `cc-by-4.0`. Restano da verificare i termini E-OBS per le colonne meteo del CSV.
- **Licenza di Qi 2025.** È CC BY 4.0 (Crossref), non «non esposta» (`access-manifest.json:930`).
- **DOI di Salerni 2002.** `10.1092/GV8J-VPKL-UV98-WVU1` è un alias che rimanda a `10.1560/…`. Va indicato come forma non canonica, non come errore (`studies.json:24`).
- **`bibliografia.bib` non si importa.** Gli autori sono separati da virgole e mancano journal, volume e pagine. Sette voci non hanno autore e una dozzina di fonti usate non c'è.
- **Morera 2024.** Le cinque specie sono attribuite senza aver letto il testo (`studies.json:291`), contro la regola del pacchetto stesso (`ricerca.md:122-124`).

Lacune utili allo scopo:

- **Morera 2021.** Il pacchetto omette il risultato principale: i modelli ad albero vanno meglio anche fuori dal campo spaziale e climatico del campione. Anche lì la produzione è una probabilità di comparsa moltiplicata per la resa condizionata.
- **Qi 2025.** Ha un deposito CC0 con modelli di distribuzione europei a 2,5′ (circa 5 km), B. edulis compreso. Può servire come prior grossolano di presenza. Mancano però castagno, leccio, cerro e sughera.
- **Morera 2024.** È CC BY 4.0 e non è stato letto. È lo studio mediterraneo per specie più vicino all'obiettivo.
- **Salerni 2023 e Salerni & Perini 2004.** Condividono i dati del 2000–2001: non sono prove indipendenti.

### 2.6 Calcolabilità con i dati dell'app

**Fatto verificato.**

- **Covariate.** Con le variabili che l'app scarica oggi (pioggia, temperatura media, suolo 3–9 cm, quota della fascia) si calcolano 17 covariate su 31. Con `et0_fao_evapotranspiration` si arriva a 24. Con un archivio proprio dei giorni 30–60 si arriva a 28.
- **Bosco e ospite.** Da `data/habitat.json` (4735 campioni, 1459 «non bosco», 12 categorie) esce la frazione di bosco, non la copertura delle chiome. La mappatura categoria → ospite va documentata. Il pH del suolo manca.
- **Cambio del profilo meteo.** Rompe le pagine già aperte: il Worker accetta solo query identiche al profilo e risponde 422 alle altre (`worker/weather-provider.js:35-41`). Serve un profilo vecchio di transizione.
- **Taccuino.** Nessun record attuale è addestrabile. Oltre allo sforzo pianificato (2.4, punto 10), `learning.py` rifiuta righe senza `research_consent = true` e zeri senza `search_completed = true` (`learning.py:193-196`, `:213-214`): il Taccuino non registra né l'uno né l'altro.

**Ipotesi.** L'endpoint forecast conserva circa 58–59 giorni di passato per punto. Il limite avanza di un giorno fra due richieste a poche ore di distanza. La causa non è documentata.

### 2.7 Giudizio

**Parere.** A è il miglior punto di partenza disponibile per la ricerca. Le protezioni contro le scorciatoie ci sono e funzionano. Ma è un banco di prova, non un modello. Oggi non può dare né una probabilità né una stima per un bosco nuovo. Le correzioni dei punti 1–7 vanno fatte prima di usarlo su dati reali.

## 3. Parti utilizzabili, errori, lacune

### 3.1 Pacchetto A

**Già utilizzabile**

| Parte | Uso | Condizione |
|---|---|---|
| `features.py` | Calcolo offline delle covariate dagli ingressi salvati (sezioni 4.1 e 4.2) | Aggiungere Tmin/Tmax, pioggia massima, temperatura del suolo e profondità del suolo; controllare `feature_schema_version` |
| Contratto delle uscite (`dati-validazione.md:54-58`) | Base per il protocollo del Taccuino (4.3) | Separare osservazione e analisi (2.4, punto 12) |
| Disegno di validazione e soglie di rilascio (`dati-validazione.md:75-104`) | Regole della valutazione (passi 3 e 7) | Preregistrare prima di guardare i risultati |
| Split ed embargo di `learning.py` | Modello per lo script di valutazione | Aggiungere origine mobile e raggruppamento per osservatore |
| `audit-porcini.md` | Guida ai dati dei porcini tedeschi (4.5) | Correggere la licenza |
| `access-manifest.json` | Registro delle fonti | Correggere le licenze di Brejon e Qi |
| Inferenza (circa 20 righe) | Futuro calcolo nell'app, in ombra | Solo dopo un artefatto validato |

**Errori da correggere:** punti 1–17 della tabella 2.4 e gli errori sulle fonti in 2.5.

**Lacune**

- Nessun confronto con Fronda congelata né con una climatologia stagionale nel codice. Si confronta solo con la prevalenza del training (`learning.py:296`, `:304`).
- Mancano le covariate statiche per riconoscere ambienti analoghi: normali climatiche, esposizione, pendenza, governo del bosco, disturbo, ospite, substrato. `CONTEXT_FIELDS` ha 4 campi (`features.py:45`).
- I test coprono le protezioni, non la statistica. Mancano:
  - un test dall'inizio alla fine (features → learning) e uno della CLI;
  - il recupero di un modello noto;
  - la pendenza di Platt negativa;
  - l'embargo a 59 contro 60 giorni;
  - il supporto congiunto.
- Nessun modello per l'esito ordinale (Pochi, Discreti, Tanti) né per lo sforzo in forma cloglog con log(sforzo). Sono **Ipotesi** dell'analisi dell'impianto.
- Non si considera la raccolta da parte di altri cercatori, che toglie carpofori.

### 3.2 Documento B

**Utilizzabile, solo come idee da provare**

- Variabili candidate: P−ET₀ (già in A), pioggia massima giornaliera, domanda evaporativa, fine stagione guidata dalla temperatura. Vanno valutate come covariate su dati con split separati, non fissate a mano in `js/model.js`.
- Mostrare separati ambiente e condizioni: in Fronda c'è già, con `habitatPotential`.
- L'osservazione che Brejon non misura l'umidità del suolo è corretta.

**Errori** (Fatto verificato)

1. **Fonti.**
   - «de-Miguel et al. 2014, Annals of Forest Science» non esiste (B r.56, r.354).
   - Karavani 2018 è sbagliato in titolo, volume, pagine e DOI (B r.64-67, r.356). Autori, anno e rivista sono giusti; cambia solo l'ordine degli autori (de-Miguel è ultimo, non secondo). Il DOI citato è di Zhang et al., sulla respirazione del suolo. Il vero Karavani non dice che il bilancio idrico migliori «notevolmente» la previsione: confronta modelli con pioggia o con umidità del suolo misurata, e trova la resa legata a meteo e umidità dello stesso mese, con la pioggia in ritardo di un mese. Ágreda 2015 trova pioggia e bilancio equivalenti sui dati osservati.
   - I 746.297 record di Kauserud 2012 e il ritardo di 12 giorni di Büntgen 2013 (funghi svizzeri, dopo il 1991 rispetto a prima) sono fusi in un «12–20 giorni verso i mesi invernali» che non c'è in nessuno dei due (B r.91). Kauserud dà spostamenti di pochi giorni per decennio (da 1,1 a 6,4 giorni per la fine stagione, 1970–2007).
   - Salerni 2023 riguarda abetine di *Abies alba* sul Monte Amiata, non «faggete tosco-emiliane», e non ha la soglia «>28–30 °C» (B r.35-40).
   - Il prodotto P×H è attribuito a Karavani e de-Miguel (B r.301), che modellano invece P(produzione) × resa condizionata.
   - Martínez-Peña 2012 riceve una probabilità «giornaliera per appezzamento» (B r.60): è un modello di resa annua.
   - Le affermazioni marcate «Letteratura» su shock, latenze, gelo e caldo non hanno fonte (B r.133-141).
2. **Diagnosi.** La «falesia moltiplicativa» nella forma di B (B r.161-164: 7 fattori su 8 a 0,80, indice 2,1) non c'è. Ho controllato 118 440 casi della stagione 2017, 1° giugno–5 dicembre (14 specie × 45 fasce × 188 giorni). Nessuno ha 7 fattori fra 0,7 e 0,9: al massimo 5. Nel 17,3% delle zone-giorno l'indice arriva a 7,5 o più, con massimo 10. Nei casi in stagione, in habitat e in quota, il deficit logaritmico rispetto a 10 viene da pioggia (52%), temperatura (28%) e suolo (9%), cioè dalle variabili che l'indice deve misurare.
   - *Limiti di questa verifica.* È una sola stagione: le altre annate non si sono scaricate per il limite giornaliero di Open-Meteo. Usa l'archivio (ERA5, suolo 0–7 cm), che ha più pioggia del prodotto usato in produzione (2.4, punto 9). Sui dati del prodotto di produzione (Forecast API, suolo ICON 3–9 cm; 29 giorni calcolabili, 17 settembre–15 ottobre 2026; 18 270 casi) la conclusione regge: al massimo 4 fattori fra 0,7 e 0,9. Ma le zone-giorno a 7,5 o più scendono al 3,9%, con massimo 8,9, e il suolo pesa di più (32% del deficit). Il 2026 è stato un autunno secco, quindi neanche questo dato è rappresentativo.
   - *Trasformazione di B* (lettura illustrativa: B non dà i β della sua logistica). Ha correlazione di rango 0,96–0,99 con l'indice attuale e alza i valori di 8–12 punti su 100 senza nuova evidenza. Non è però neutra sui consigli: il punto migliore (zona e fascia) per specie e giorno resta lo stesso solo nel 70–89% dei casi.
3. **Trovabilità %.** I coefficienti β del logit non hanno valori (B r.227). Con condizioni fisse e β plausibili la «probabilità» va dal 57% al 91%. H è un'idoneità euristica e non c'è lo sforzo. Mostrarla in percentuale (B r.297-312, r.344) viola AGENTS.md e `docs/metodo-scientifico.md:23`.
4. **Formule.**
   - T_fit è detta asimmetrica ma è una gaussiana simmetrica (B r.251).
   - Le soglie del suolo lasciano scoperti gli intervalli 0,10–0,14 e 0,28–0,38. Sono soglie assolute, mentre le celle ICON hanno intervalli diversi: Tancia 0,149–0,367, Laga 0,100–0,235.
   - La formula finale moltiplica ancora per «Stagione» (B r.309).
5. **Bilancio idrico Σmax(0, P−Evap).** Azzera ogni giorno secco, quindi non sottrae l'evaporazione. «Evap» non è definita. Su 45 punti ha correlazione di rango 0,92–0,975 con la pioggia grezza.
6. **Vento secco.**
   - La regola è ambigua (B r.261-264). Letta sulle raffiche scatta nel 56–62% dei giorni, quasi sempre vicino al tetto; letta sul vento massimo non scatta mai.
   - Non usa la direzione.
   - Conta due volte il vento, che è già dentro ET₀.
   - Il profilo meteo dell'app non scarica né vento né umidità per i giorni passati (`worker/weather-provider.js:6-7`).
7. **Tabella delle specie** (B r.318-331).
   - Copre 12 profili su 14: mancano virescens e suillus.
   - Non ha fonti.
   - Dà un bonus di shock a quasi tutte le specie, fino a +0,80 per Armillaria, mentre Olivier 1997 riguarda solo i porcini.
   - Introduce soglie nuove: innesco a 10 mm (B r.237), suolo in valori assoluti (B r.244-246).

**Lacune.** Non ci sono test, né un percorso per stimare o validare i parametri, né sforzo, rilevamento o incertezza.

### 3.3 Dove le analisi divergono

| Tema | Posizioni | Come la tratto |
|---|---|---|
| Licenza dei dati Brejon | A: «non verificata, non riusare». Analisi delle fonti: CC BY 4.0. Analisi dell'impianto: usati solo in locale, senza ridistribuire. | CC BY 4.0 (riverificato oggi con l'API Zenodo). Restano aperti i termini E-OBS, quindi niente CSV nel repository. |
| DOI di Salerni 2002 | Analisi delle fonti: `10.1092/…` è un alias valido. Analisi dell'impianto: «non esiste su Crossref». | Entrambe concordano sulla forma canonica `10.1560/GV8J-VPKL-UV98-WVU1`, che ho verificato su Crossref. |
| Sforzo nel protocollo | Analisi del codice (e Codex): durata decisa prima dell'uscita. Analisi dell'impianto: durata effettiva, motivo di fine e minuti al primo ritrovamento (Garrard 2008). | Decisione D3 in 4.6. |
| Covariate nell'app | Analisi del codice: portare subito `features.py` in `js/features.js` e salvare le covariate nel piano. | **Parere**: salvare subito gli ingressi grezzi e portare il codice dopo, quando il set di covariate è stabile (vedi 4.2). |
| Base storica | Codex: ERA5-Land. Analisi del codice: Historical Forecast (dal 2022) per il giorno 0 e Previous Runs (dal 2024) per gli anticipi. Analisi dell'impianto: l'archivio ha il 55% di pioggia in più della Forecast API. | Nessuno ha ancora misurato lo scarto fra Historical Forecast e Forecast API. **Da costruire** (passo 4). |
| Famiglia di modelli | A: logistica regolarizzata. Analisi delle fonti: Morera 2021 favorisce i modelli ad albero in estrapolazione. Analisi dell'impianto: modelli gerarchici, cloglog per lo sforzo, logit ordinale. | Tutte **Ipotesi** da confrontare nella stessa valutazione (passo 3). |
| Coordinate delle fasce | `audit-fronda.md:27`: stesse coordinate nella richiesta. Analisi dell'impianto: 23 celle per 45 punti nella risposta. | Entrambe vere. Conta la risposta: celle diverse (Open-Meteo sceglie per ogni quota una cella vicina con quota simile). |

## 4. Proposta: la prima integrazione nell'app

**Principio: registrare, non cambiare.** L'indice, i parametri e i numeri visibili restano identici. Si aggiungono solo dati registrati e un'etichetta più chiara. È lo stesso principio della seconda tornata, che registra l'umidità a 9–27 cm senza usarla nell'indice.

**Coerenza con la seconda tornata**

- Umidità a 9–27 cm: entra nell'archivio (4.1) e nella previsione salvata (4.2). Non entra nell'indice.
- Dati statici per punto campione (ceduo o fustaia, esposizione, pendenza, ultimo disturbo): un'uscita può indicare il punto o l'accesso usato (4.3). Così ogni uscita eredita quei dati come covariate di contesto, che oggi mancano in A (`features.py:45`).
- Aree protette e zone A/B del Parco Gran Sasso-Laga: restano escluse anche come luoghi del protocollo e come futuri siti sentinella.
- Shock da Olivier: la previsione salvata conserva temperatura del suolo e versione del modello. La variante «senza shock» si potrà ricalcolare offline, senza cambiare l'app.
- Accessi con percorso a piedi e dislivello: l'accesso scelto dà distanza e dislivello. È un primo indicatore dello sforzo di spostamento, non dell'area cercata.

### 4.0 Prima di tutto: tre difetti già noti

**Fatto verificato:** sono ancora presenti nel commit `e5f9552`.

1. `js/app.js:2700` mostra `indice oggi ${today}` sulla scala 0–100. Va usato `formatIndex`.
2. Il valore giornaliero compatto del suolo non viene controllato nell'intervallo 0–1: `js/weather-data.js:12`, `js/weather.js:33`, `worker/weather-provider.js:25`. La via oraria lo controlla (`js/weather.js:23`).
3. Se si modificano minuti, persone o inizio, la segnalazione condivisa resta con lo sforzo vecchio. Il ritiro scatta solo se cambiano zona, data, ritrovamenti o specie cercate (`worker/community.js:270`; contesto copiato a `:303`). Con i campi nuovi di 4.3 il problema crescerebbe.

**Verifiche.** Per ciascun difetto, un test che fallisce prima e passa dopo (`tests/weather.test.mjs`, `tests/weather-provider.test.mjs`, `tests/community-request.test.mjs`). Poi `npm test` e gli spec `weather` e `community` con `-g`.

### 4.1 Archivio quotidiano delle previsioni (punto b, lato server)

**Cosa.** Il cron esiste già (`wrangler.jsonc:13`, `17 3 * * *`; oggi esegue solo `cleanupCommunity`, `worker/index.js:27`). Gli si aggiunge un compito. Una volta al giorno chiede il profilo `growth` per tutte le zone e fasce (45 punti) e salva per ogni punto:

- giorno di emissione e `fetched_at`;
- fornitore e modello (oggi «Open-Meteo auto», `js/weather.js:38`);
- cella restituita: latitudine, longitudine e quota della risposta;
- versione del profilo;
- valori giornalieri dal giorno prima (D−1) a D+7, per ogni variabile del profilo, con i nulli conservati come nulli.

**Perché.**

- È l'unico archivio prospettico dello stesso prodotto usato in produzione: evita lo scarto del 55% (2.4, punto 9).
- Dà gli anticipi da 0 a +7 giorni che A non gestisce (2.4, punto 2).
- Dopo 60 giorni risolve la finestra 30–60 (2.4, punto 8).
- Dopo una stagione fornisce la climatologia dello stesso prodotto.
- Non dipende da quante previsioni salvano gli utenti.

**Dati.** Open-Meteo, accessibili oggi.

- *Fatto verificato* (open-meteo.com/en/licence e /en/terms, letti oggi): i dati dell'API sono CC BY 4.0. L'API gratuita è per uso non commerciale ed è limitata a 10 000 chiamate al giorno.
- Open-Meteo pesa le richieste: ogni punto conta come una chiamata per ogni 14 giorni chiesti e ogni 10 variabili (blog di Open-Meteo, https://openmeteo.substack.com/p/weather-data-for-multiple-locations; formula da ricontrollare sulla documentazione attuale). Con 45 punti e 70 giorni (62 passati e 8 previsti) l'archivio pesa circa 225 chiamate al giorno, non poche decine. Resta circa il 2% del limite giornaliero, ma si somma alle richieste dell'app. Valgono anche i limiti di 5000 chiamate all'ora, 600 al minuto e 300 000 al mese. L'app è gratuita e senza pubblicità.
- Nella documentazione va citata la fonte, con il link alla licenza.

**File.**

- Nuovi: `worker/forecast-archive.js`, `migrations/0004_forecast_archive.sql`, `tests/forecast-archive.test.mjs`.
- Da modificare: `worker/index.js` (aggiungere il compito nel `waitUntil` accanto a `cleanupCommunity`); `docs/meteo-cache.md` e `docs/dati-e-architettura.md` (documentazione).
- Il compito riusa `forecastParams` e la validazione di `worker/weather-provider.js`.
- Attenzione: `COMMUNITY_DB` e `CMS_DB` condividono `migrations_dir` (`wrangler.jsonc:9-10`). La tabella nascerebbe in entrambi i database: è innocuo, ma va saputo (decisione D1).
- I file del Worker sono esclusi dagli asset (`.assetsignore`): non serve cambiare `SHELL`.

**Risultati attesi.** 45 righe al giorno, chiave unica (punto, giorno di emissione). La dimensione è stimata in circa 1 KB per riga, da misurare. Indice e interfaccia invariati.

**Accettazione e verifiche.**

- Test unitari con un fetcher finto:
  - 45 righe con i campi attesi;
  - un `null` resta `null`, mai 0;
  - un errore di Open-Meteo non lascia righe parziali e viene registrato;
  - un secondo giro nello stesso giorno non duplica;
  - `cleanupCommunity` viene ancora chiamata.
- `npx wrangler d1 migrations apply fungaroli-community --local`, poi `npm test` e `npx wrangler deploy --dry-run`.
- Dopo il rilascio: 7 giorni consecutivi con 45 righe ciascuno (`SELECT issued_on, COUNT(*) … GROUP BY issued_on`) e la dimensione reale annotata nella documentazione.

### 4.2 Previsione salvata nel piano: ingressi completi (punto b, lato app)

**Fatto verificato: esiste già.**

- `captureForecast` (`js/app.js:2741-2755`) salva la versione del modello, `PARAMS`, `SPECIES`, i punteggi per fascia e gli ingressi grezzi degli ultimi 31 giorni (pioggia, Tmedia, Tmin, Tmax, umidità e temperatura del suolo) con la fonte.
- Il server data il piano e lo rende immutabile (`worker/community.js:248-257`). Un'uscita successiva si lega al piano solo se il piano precede l'inizio della ricerca (`:259-263`).

**Cosa cambiare.**

1. Ingressi su 60 giorni (da i−60 a i) quando ci sono: `PAST_DAYS` vale già 62 (`js/weather.js:8`). I giorni mancanti restano `null`.
2. Le variabili nuove: umidità 9–27 cm dalla seconda tornata, ET₀ se decidi di aggiungerla (D2).
3. `leadDays`: giorni fra la cattura e la data prevista, calcolati in Europe/Rome.
4. Prodotto meteo e cella.
5. `inputsSchemaVersion`.
6. L'identificativo del punto o accesso scelto, se c'è.

**Parere: niente covariate calcolate nell'app, per ora.** Con gli ingressi grezzi e la versione si ricalcola offline qualunque versione di `features.py` e qualunque variante dell'indice. Per esempio σ = 2,0 per edulis, senza shock, o un solo termine per l'acqua: sono le varianti proposte nell'analisi dell'impianto. Il set di covariate di A deve ancora cambiare (2.4, punto 7). Portarlo ora in JS vorrebbe dire rifarlo due volte. Il porting verrà quando il set sarà stabile, con un test di parità su dati di riferimento.

**Dati.** Gli stessi dell'app. Nessuna licenza nuova.

**File.**

- `js/app.js` (`captureForecast`), estraendo la costruzione dello snapshot in un modulo puro, per esempio `js/forecast-snapshot.js`, così diventa testabile.
- `tests/forecast-snapshot.test.mjs` (nuovo) e `tests/journal.test.mjs`.
- `sw.js`: `SHELL` al valore successivo a quello di produzione al momento della PR (oggi `v78`; la seconda tornata in corso cambia `js/app.js` e lo incrementerà), più il nuovo modulo in `PRECACHE`. Anche i numeri di riga di `js/app.js` citati qui possono spostarsi dopo la seconda tornata.
- `index.html`: `<meta name="app-version">` allineato.
- Se si aggiunge ET₀: `worker/weather-provider.js:6` (profilo), `js/weather.js` (parametri e conversione giornaliera), `js/weather-cache.js:11` (campi obbligatori). Va tenuto un profilo vecchio di transizione per le pagine aperte, altrimenti ricevono 422 (`worker/weather-provider.js:41`).

**Risultati attesi.** I piani salvati dopo il rilascio contengono fino a 61 giorni per variabile e i metadati della previsione. I punteggi sono identici a prima.

**Accettazione e verifiche.**

- **Test d'oro:** sullo stesso input, punteggi identici al codice attuale.
- `leadDays` corretto attorno al cambio d'ora del 25/10/2026 e alla mezzanotte locale.
- `null` conservati.
- **Dimensione:** il limite di una richiesta è 250 000 byte (`worker/community.js:15`), e l'uscita prospettica copia la previsione del piano. Il piano con tre fasce deve stare sotto la metà del limite.
- `tests/app-version.test.mjs` verde.
- Spec browser del Taccuino che salvano un piano (`community.spec.mjs`, `notebook-layout.spec.mjs` con `-g`). Con ET₀ anche `weather.spec.mjs` e `weather-background.spec.mjs`, più `tests/weather-provider.test.mjs` e `tests/weather-local-cache.test.mjs`.

### 4.3 Protocollo d'uscita nel Taccuino (punto a)

**Fatto verificato: c'è già.**

- Specie cercate, zeri espliciti solo per quelle (`js/journal.js:361`).
- Inizio, minuti e cercatori, facoltativi (`:296-299`).
- Collegamento a una previsione salvata prima dell'inizio (`:347-352`).
- Identificativo dell'account sul server (`worker/community.js:300-303`).
- Sulle segnalazioni condivise c'è già una dichiarazione sì/no «caratteri controllati» (`identificationChecked`: `js/community.js:153-161`, `worker/community.js:70`, `:301`; colonna `identification_checked` in `migrations/0001_community.sql:31`). Il campo `identification` proposto sotto la estende all'uscita privata e a tre livelli: va allineato a questo, non aggiunto accanto.
- Le note botaniche hanno già «Cercato, non osservato» e un gruppo da ritrovare (`js/journal.js:189`, `:199`): è il modello da imitare.

**Cosa aggiungere.** Tutto facoltativo, salvo quanto decidi in D3.

| Campo | Domanda nell'app | Perché |
|---|---|---|
| `effort.completed` | «Hai finito di cercare le specie indicate?» Sì / Mi sono fermato prima | Senza, uno zero non distingue «cercato e non trovato» da «ricerca interrotta» (`dati-validazione.md:58`) |
| `effort.stopReason` | Tempo previsto finito / Ho trovato quello che cercavo / Meteo / Altro | Toglie il problema che Codex risolve scartando le durate effettive (2.4, punto 10) |
| `effort.minutes` (c'è già) | Obbligatorio, in classi (<30, 30–60, 60–120, >120), solo se ci sono specie cercate senza ritrovamento | Oggi uno zero può avere durata nulla |
| `effort.plannedMinutes` (nel piano) | «Quanto pensi di cercare?» | Rende possibile anche il protocollo di Codex |
| `place` | Punto campione o accesso della seconda tornata | Luogo ripetibile dentro la zona; dati statici ereditati |
| `identification` per specie trovata | «Ho controllato i caratteri sulla scheda» / «Non sono sicuro» / «Confermato da un esperto o da un gruppo micologico» | È una dichiarazione dell'utente. L'app non identifica e non certifica (AGENTS.md). |
| `disturbance` | «Altri cercatori o tracce di raccolta?» | Nessuna delle due proposte considera la raccolta altrui |
| `researchConsent` | Casella separata dalla condivisione, spenta di default, revocabile | `docs/community.md:23-27` oggi esclude l'uso per tarare i modelli |
| `protocolVersion` | Non visibile | Per riconoscere i dati raccolti con regole diverse |

**Esportazione.**

- Nuovo `js/survey-export.js` con `toObservationRows(entry)`.
- Uno schema dell'osservazione, `docs/schema/uscita-osservazione.schema.json`. Deriva da `survey.schema.json` ma senza i campi d'analisi (`features`, `split`, `weather_provenance`). Ha `effort_basis` con due valori (`planned_protocol` e `actual_with_stop_reason`), il luogo, l'identificazione e l'esito ordinale.
- Uno zero diventa `not_detected` solo con `completed = true` e minuti presenti; altrimenti diventa `unknown`.
- Per ora nessuna esportazione dal server.

**Dati.** Raccolti dagli utenti. Servono il consenso e il testo nella privacy (`docs/legale.md`, `docs/community.md`): decisione D4.

**File.**

- `js/journal.js` (passo «ricerca», `save()`, modulo del piano) e `js/survey-export.js`.
- `worker/community.js`: validazione dei campi nuovi accanto a `:236-246`; ritiro o aggiornamento della segnalazione quando cambiano sforzo o protocollo (4.0, punto 3); contesto a `:303`.
- `docs/protocollo-uscite.md` e lo schema.
- Test: `tests/journal.test.mjs`, `tests/community-request.test.mjs`, `tests/diario-api.test.mjs`, nuovo `tests/survey-export.test.mjs`.
- `sw.js` (`SHELL`, `PRECACHE`) e `index.html` (`app-version`).

**Risultati attesi.** Dalla prossima uscita ogni zero ha uno stato chiaro: non cercato, cercato e interrotto, cercato e concluso. Le uscite diventano utilizzabili con uno dei due protocolli.

**Accettazione e verifiche.**

- **Unitari:**
  - ogni combinazione di `completed`/`stopReason`/`minutes` produce l'esito atteso;
  - una specie non cercata non genera mai una riga;
  - le righe rispettano lo schema;
  - il server rifiuta valori fuori elenco;
  - modificare lo sforzo aggiorna o ritira la segnalazione.
- **Browser:** compilazione completa della procedura con e senza ritrovamenti (`community.spec.mjs`, `notebook-layout.spec.mjs` con `-g`).
- **Linguaggio:** nessun testo nuovo usa «identificato», «certificato», «commestibile» o percentuali.
- **Tempo di compilazione:** al massimo una schermata in più rispetto a oggi.

### 4.4 «Bosco adatto» e «condizioni meteo» nell'interfaccia (punto c)

**Fatto verificato: la separazione esiste già in parte.** La lista «dove cercarla» della specie mostra un'etichetta statica da `habitatPotential` (`js/app.js:2661`: «habitat molto adatto», «habitat adatto», «habitat scarso», «quasi assente») accanto all'«indice oggi», che però ha il difetto di 4.0, punto 1. Nessun test copre questa lista.

**Cosa.**

- Due righe con un'etichetta ciascuna, ovunque compaiono insieme:
  - «Bosco adatto: molto adatto», dalla Carta Forestale, che non cambia con il meteo;
  - «Condizioni meteo oggi: 7,2 su 10», indice sperimentale.
- Nessuna percentuale e nessun numero nuovo.
- Dove manca un dato resta «Non calcolabile».
- I dati statici della seconda tornata compaiono come fatti descrittivi («fustaia, esposizione nord»). Non modificano «Bosco adatto» finché non c'è una fonte o una validazione.

**Dati.** Già presenti. **File:** `js/app.js` (righe 2661 e 2695-2700, più le schede di zona se mostrano entrambi), `sw.js`, `index.html`.

**Risultati attesi.** Chi legge distingue «dove ha senso cercare» da «come sono le condizioni oggi», senza che nessuno dei due sembri una probabilità.

**Accettazione e verifiche.**

- Un test nuovo sulla lista: l'indice è formattato con la virgola e su 10, mai su 100. Nessun valore è seguito da «%». «Probabilità» compare solo in frasi negative («non è una probabilità»).
- Uno spec browser con `-g` sulla scheda specie.
- `tests/app-version.test.mjs`.

**Ipotesi per dopo, non ora:** mostrare l'indice come posizione rispetto ai giorni dello stesso periodo («meglio del 90% dei giorni di ottobre»). Richiede la climatologia dello stesso prodotto, quindi almeno una stagione di archivio (4.1).

### 4.5 Prova offline dell'indice sui porcini tedeschi (punto d, fuori dall'app)

**Cosa.** Prima di toccare i parametri, misurare se la parte meteo dell'indice ordina bene i giorni con ritrovamenti, proprio sui dati che l'indice cita.

**Dati.**

- Brejon Lamartinière & Hoffman, Zenodo V1.2 (`10.5281/zenodo.20591123`), CC BY 4.0. SHA-256 del CSV: `63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c`.
- Accessibili oggi. Il CSV contiene solo temperatura media e precipitazione E-OBS: niente suolo, quindi niente shock. Le coordinate del sito non sono pubbliche.
- I termini E-OBS non sono verificati: il CSV non entra nel repository. Lo script lo scarica e ne controlla l'hash.

**Limiti dichiarati** (Fatto verificato, `audit-porcini.md:69-71`).

- `Mnb = 0` vuol dire «nessun ritrovamento registrato», non «visita senza ritrovamenti». I siti erano visitati 2–4 volte a settimana.
- Il periodo ha due definizioni: 01/08–30/11 nel codice, 05/08–21/11 nel testo.
- È un solo sito di faggeta in pianura, con 10 stagioni.
- La prova misura l'ordinamento, non una probabilità, e non trasferisce nulla al Reatino.

**Protocollo**, da scrivere e salvare prima di guardare i risultati:

- **Esito:** giorno con almeno un ritrovamento nel blocco All. Periodo principale 05/08–21/11, 01/08–30/11 come controllo.
- **Validazione:** una stagione esclusa alla volta (10 giri).
- **Confronti:**
  - (0) climatologia stagionale stimata sulle stagioni di training;
  - (1) fattori pioggia × temperatura × stagione di `js/model.js` per edulis, con `tsd` 3,5 e finestra da i−20 a i−1;
  - (2) la stessa cosa con σ = 2,0;
  - (3) la forma di Brejon (pioggia media su 26 giorni, T20 e T20²) stimata solo sulle stagioni di training.
- **Metriche:** PR-AUC con la prevalenza dichiarata, ROC-AUC, correlazione di Spearman sui conteggi; intervalli con bootstrap per stagione.
- **Codice Python di A:** `features.py` si può usare per le finestre. `learning.py` no: richiederebbe righe con `planned_protocol`, cioè un'etichetta falsa.

**File.**

- In `tools/benchmark-bielefeld/`, esclusa dalla pubblicazione: `preregistrazione.md`, `scarica.py`, `valuta.py` (da eseguire con `python3 -I`), `fattori.mjs` (importa `js/model.js` senza modificarlo) e `README.md` con gli esiti.
- `.gitignore` per i dati.

**Risultati attesi.** Il risultato non è prevedibile e non va promesso. Si saprà se l'indice batte la climatologia stagionale sui dati che cita. Si saprà anche se la curva più stretta dei dati (σ ≈ 2,0) regge fuori campione: oggi è solo una stima sugli stessi dati.

**Accettazione.**

- Lo script riproduce per primi i numeri dell'audit (3660 righe, 1220 date; nel blocco All 155 positivi, 1065 zeri, 1905 carpofori). Due esecuzioni danno lo stesso output (seme fisso).
- La preregistrazione è nel repository prima degli esiti.
- Nessun cambiamento a `js/species.js`. Un eventuale cambio di `tsd` resta una tua decisione (D5).

### 4.6 Decisioni che ti servono

**D1. Dove tenere l'archivio delle previsioni?**

1. **(consigliata)** Una tabella in `COMMUNITY_DB` con la migrazione `0004`. Nessun binding nuovo; la tabella nasce anche in `CMS_DB`, ed è innocuo.
2. Un database D1 nuovo, con un binding versionato in `wrangler.jsonc`, da creare su Cloudflare.
3. Rimandare l'archivio e affidarsi solo ai piani degli utenti.

**D2. ET₀ nel profilo meteo?**

1. **(consigliata)** Sì, nella stessa modifica che aggiunge l'umidità a 9–27 cm. La transizione (profilo vecchio, `SHELL`, `app-version`) si paga una volta sola.
2. Sì, ma in una modifica separata dopo la seconda tornata.
3. No per ora: le covariate calcolabili restano 17 su 31.

**D3. Come registrare lo sforzo?**

1. **(consigliata)** Durata effettiva in classi, ricerca conclusa e motivo di fine. Durata obbligatoria solo quando ci sono specie cercate senza ritrovamento. Durata prevista facoltativa nel piano.
2. Il protocollo di Codex: durata decisa prima, obbligatoria, più ricerca conclusa.
3. Lasciare tutto facoltativo come oggi.

**D4. Consenso alla ricerca?**

1. **(consigliata)** Una casella separata, spenta di default e revocabile, con un testo nuovo in `docs/legale.md`.
2. Rimandare finché non c'è un'analisi pronta. Nel frattempo i dati raccolti non sono utilizzabili.

**D5. Curva termica di edulis (`tsd` 3,5 contro σ ≈ 2,0 nei dati di Brejon)?**

1. **(consigliata)** Nessun cambio: prima la prova 4.5 e le varianti ricalcolate dagli ingressi salvati.
2. Passare subito a 2,0. L'indice diventa più selettivo, ma estende alle faggete appenniniche di 1100–1600 m una stima ricavata da un solo sito tedesco di pianura.

### 4.7 Ordine delle modifiche

1. PR con i difetti di 4.0.
2. PR «registrare»: 4.2, più ET₀ se D2 = 1, dopo la seconda tornata o insieme. Poi 4.1.
3. PR con il protocollo (4.3) e le etichette (4.4).
4. In parallelo, fuori dall'app: 4.5.

Ogni PR passa `npm test`, il dry-run e gli spec delle parti toccate. La suite completa gira una volta, prima del rilascio, in un worktree separato (AGENTS.md).

## 5. Sequenza dei passi successivi

| Passo | Cosa | Si esce quando |
|---|---|---|
| 0 | Difetti noti (4.0) | Test nuovi verdi e spec toccati verdi |
| 1 | Prima integrazione (4.1–4.4) e prova offline (4.5) | L'archivio ha 45 righe al giorno per 30 giorni consecutivi. I piani hanno 60 giorni di ingressi. Il protocollo è attivo con consenso. Il test d'oro conferma l'indice invariato. La prova offline è pubblicata con la preregistrazione. |
| 2 | Correggere A, poi unirlo al ramo di produzione (`tools/` non viene pubblicato) | Le correzioni hanno ciascuna un test: pendenza di Platt > 0; minimo di eventi per split e per covariata; controllo di `feature_schema_version` e della provenienza; provenienza `operational_forecast` con anticipo in giorni; raggruppamento per osservatore; dominio congiunto (MESS o area di applicabilità); Tmin/Tmax, pioggia massima, temperatura e profondità del suolo; data in Europe/Rome; test end-to-end, della CLI e del confine 59/60 giorni. Corrette anche licenze, `bibliografia.bib` e DOI di Salerni; letto Morera 2024. |
| 3 | Script di valutazione: origine mobile per stagione, cross-fitting a blocchi per zona o sito, adattatore che fa girare `js/model.js` congelato, climatologia stagionale e «habitat + calendario» come riferimenti. Confronto fra famiglie di modelli: logistica, alberi, gerarchico. | Su dati sintetici con risposta nota recupera i parametri. Sui primi dati reali due esecuzioni danno gli stessi numeri. |
| 4 | Storico coerente con il prodotto: Historical Forecast (dal 2022) per il giorno 0, Previous Runs (dal 2024) per gli anticipi, confrontati con l'archivio proprio | Una tabella dello scarto per variabile e zona. Decisione documentata: correzione per quantili oppure addestramento solo sull'archivio proprio. |
| 5 | Contesto statico e somiglianza: dati per punto della seconda tornata; tabella categoria forestale → ospite, con le categorie ambigue segnate (Ostrieto, Bosco di forra, Arbusteto); pH da SoilGrids (licenza da verificare sul prodotto); area di applicabilità rispetto ai dati di riferimento; Qi 2025 come prior grossolano, dopo aver aperto l'archivio | Ogni fonte nel manifest con licenza. Somiglianza calcolata per zona e fascia. Nessun cambiamento all'indice. |
| 6 | Stagione 2027: siti sentinella fuori dalle aree escluse, protocollo preregistrato, simulazione di potenza prima di fissare siti e visite (`dati-validazione.md:60`) | La simulazione indica il numero di uscite. Il numero viene raggiunto con zeri, sforzo e consenso. |
| 7 | Primo modello interno, in ombra: le stime si salvano, non si mostrano | Soglie 1–3 di `dati-validazione.md:99-101`: provenienza riproducibile, zeri interpretabili, miglioramento su climatologia e su Fronda congelata, con intervalli per cluster sul test temporale e geografico |
| 8 | La parola «probabilità» in pubblico | Soglie 4–6 (`dati-validazione.md:102-104`) su un test prospettico congelato |

**Quando si potrà parlare di probabilità calibrata.**

- **Che cosa.** La probabilità di vedere almeno un carpoforo del taxon in un'uscita definita: durata, cercatori e luogo dichiarati. Vale nel dominio validato (zone, stagioni, anticipo) e con un intervallo. Non la probabilità che il fungo «ci sia», e non per un bosco fuori dall'area di applicabilità: lì si scrive «dati insufficienti», non 0.
- **Con quali dati.**
  - Uscite con zeri espliciti, sforzo, motivo di fine, luogo ripetibile, identificazione dichiarata e consenso.
  - Previsioni salvate prima dell'uscita, dallo stesso prodotto meteo.
  - Con gli split attuali di A servono almeno 2 stagioni (calibrazione solo a fine stagione), realisticamente 3: una per training, calibrazione e test. Con origine mobile e cross-fitting (passo 3) bastano meno stagioni per l'addestramento, ma una stagione di test prospettico congelato resta necessaria.
- **Quanti eventi.** Non esiste oggi un numero sostenuto da fonti o calcoli. Lo darà la simulazione di potenza (**Da costruire**).
- **Ipotesi dell'analisi del codice:** con meno di 100 eventi di calibrazione, correggere solo l'intercetta potrebbe essere più stabile della pendenza libera.
- **Fatto verificato:** oggi i record GBIF in Italia sono pochi (B. edulis 689; da 1 a 5 per specie nel riquadro del Reatino) e senza alcuna assenza. Non bastano per nessuna probabilità, solo per grandezze relative.

## 6. Cosa NON fare adesso

- **Non adottare B, nemmeno in parte, come modello.** Restano fuori P×H, le percentuali di buttata e di trovabilità, la penalità per la Tramontana, Σmax(0, P−ET₀), le soglie del suolo e la tabella delle specie. AGENTS.md: l'indice non è una probabilità, niente soglie inventate, fonti verificabili.
- **Non mostrare percentuali né la parola «probabilità»** per l'indice o per stime di A. `public_probability` resta nullo finché non passano le soglie di `dati-validazione.md:99-104`.
- **Non cambiare i parametri dell'indice** (`tsd` di edulis, bilancio idrico, vento) sulla base di un sito tedesco o di simulazioni. Prima le varianti offline (4.5 e passo 3).
- **Non estendere lo shock termico ad altre specie.** Olivier 1997 riguarda solo i porcini; per Armillaria c'è solo un esperimento di laboratorio. AGENTS.md: niente bonus da folklore.
- **Non addestrare `learning.py` sui record attuali del Taccuino.** Non sono idonei. Non etichettare il meteo previsto in uso come `forecast_archive` per farlo passare: sarebbe un'etichetta falsa.
- **Non generare zeri dai buchi di GBIF** né dagli zeri del CSV dei porcini tedeschi: non sono uscite a vuoto. AGENTS.md: dato mancante non è zero.
- **Non addestrare su ERA5 o sull'archivio per poi applicare il modello alle previsioni dell'app** senza aver misurato e corretto lo scarto (passo 4).
- **Non presentare «boschi analoghi»** finché il dominio si controlla una variabile alla volta.
- **Non aggiungere vento e umidità al profilo meteo** per la penalità di B: senza fonte, e il vento è già in ET₀.
- **Non portare ora `features.py` o `learning.py` dentro l'app.** Il set di covariate deve ancora cambiare (**Parere**; su questo l'analisi del codice diverge).
- **Non copiare nel repository il CSV dei porcini tedeschi con il meteo E-OBS** finché i termini E-OBS non sono verificati. Non ripubblicare testo o figure del preprint, che è CC BY-NC.
- **Non unire A al ramo di produzione così com'è.** I documenti contengono affermazioni di licenza sbagliate e una bibliografia non importabile.

## 7. Fonti

Ho verificato oggi su Crossref i metadati di tutte le voci con DOI elencate qui sotto (`tools/ipotesi/valutazione-v3/crossref.py`). Il contenuto attribuito l'hanno verificato le analisi, salvo dove indicato.

### 7.1 Fonti verificate

**Rilevamento e sforzo**

- MacKenzie et al. 2002. *Ecology* 83(8):2248–2255. doi:10.1890/0012-9658(2002)083[2248:ESORWD]2.0.CO;2
- Guillera-Arroita 2017. *Ecography* 40(2):281–295. doi:10.1111/ecog.02445
- Garrard et al. 2008. *Austral Ecology* 33(8):986–998. doi:10.1111/j.1442-9993.2008.01869.x. Tempo al primo rilevamento per fissare lo sforzo minimo.
- Phillips et al. 2009. *Ecological Applications* 19(1):181–197. doi:10.1890/07-2153.1

**Meteo e fruttificazione**

- Karavani et al. 2018. *Agricultural and Forest Meteorology* 248:432–440. doi:10.1016/j.agrformet.2017.10.024. Resa legata a meteo e umidità del mese stesso, con la pioggia in ritardo di un mese. Non dice che il bilancio idrico migliori nettamente la previsione.
- Ágreda et al. 2015. *Global Change Biology* 21(9):3499–3510. doi:10.1111/gcb.12960. Pioggia e bilancio idrico si equivalgono sul periodo osservato.
- Salerni et al. 2002. *Israel Journal of Plant Sciences* 50(3):189–198. doi:10.1560/GV8J-VPKL-UV98-WVU1. Finestra di 30 giorni per il numero di carpofori.
- Salerni, Paoli & Perini 2023. doi:10.6092/issn.2531-7342/16464 (DataCite, CC BY 4.0). Abetine di *Abies alba*, Monte Amiata; dati in parte condivisi con Salerni & Perini 2004.
- Martínez-Peña et al. 2012. *Forest Ecology and Management* 282:63–69. doi:10.1016/j.foreco.2012.06.034. Modelli di resa annua.
- Sánchez-González et al. 2019. *Forest Ecosystems* 6:52. doi:10.1186/s40663-019-0211-1. Modello a due parti per parcella e anno.
- Olivier et al. 1997. *Revue forestière française* XLIX (numero speciale):222–234. doi:10.4267/2042/5671. Calo della temperatura del suolo nei porcini; osservazioni preliminari.
- Brejon Lamartinière & Hoffman 2025, preprint bioRxiv. doi:10.64898/2025.12.12.693895 (CC BY-NC 4.0). Dati e codice: Zenodo doi:10.5281/zenodo.20591123 (CC BY 4.0, riverificato oggi). «In stampa su Fungal Ecology» non è verificato.
- Kauserud et al. 2012. *PNAS* 109(36):14488–14493. doi:10.1073/pnas.1200789109
- Büntgen et al. 2013. *Global Change Biology* 19(9):2785–2794. doi:10.1111/gcb.12263
- Andrew et al. 2018. *Ecology* 99(6):1306–1315. doi:10.1002/ecy.2237
- Boddy et al. 2014. *Fungal Ecology* 10:20–33. doi:10.1016/j.funeco.2013.10.006. Rassegna.
- Egli et al. 2006. *Biological Conservation* 129(2):271–276. doi:10.1016/j.biocon.2005.10.042. Raccolta e produzioni future.
- Ambrosio, Pietras & Feest 2024. *Dendrobiology* 91:16–31. doi:10.12657/denbio.091.002. Licenza di riuso non chiarita.

**Trasferimento e validazione**

- Morera et al. 2021. *Forest Ecosystems* 8:21. doi:10.1186/s40663-021-00297-w (CC BY 4.0)
- Morera et al. 2024. *Ecological Informatics* 81:102557. doi:10.1016/j.ecoinf.2024.102557 (CC BY 4.0). Metadati verificati; testo da leggere.
- Roberts et al. 2017. *Ecography* 40(8):913–929. doi:10.1111/ecog.02881
- Elith et al. 2010 (MESS). *Methods in Ecology and Evolution* 1(4):330–342. doi:10.1111/j.2041-210X.2010.00036.x
- Mesgaran et al. 2014. *Diversity and Distributions* 20(10):1147–1159. doi:10.1111/ddi.12209
- Meyer & Pebesma 2021. *Methods in Ecology and Evolution* 12(9):1620–1633. doi:10.1111/2041-210X.13650
- Yates et al. 2018. *Trends in Ecology & Evolution* 33(10):790–802. doi:10.1016/j.tree.2018.08.001

**Distribuzione, ospiti e suolo**

- Li et al. 2025. *Journal of Biogeography* 52(6):e15124. doi:10.1111/jbi.15124 (CC BY 4.0). Dati: Dryad doi:10.5061/dryad.9p8cz8wrv (CC0); EnviDat doi:10.16904/envidat.484 (CC BY-SA 4.0).
- Qi et al. 2025. *Ecology and Evolution* 15(12):e72743. doi:10.1002/ece3.72743 (CC BY 4.0). Dati: Dryad doi:10.5061/dryad.bcc2fqzpp (CC0). Contenuto dei raster non ancora aperto.
- Mauri et al. 2017, EU-Forest. *Scientific Data* 4:160123. doi:10.1038/sdata.2016.123

**Per le fasi successive** (riferimenti solidi; l'uso proposto è un'Ipotesi)

- Ovaskainen et al. 2017. *Ecology Letters* 20(5):561–576. doi:10.1111/ele.12757
- Isaac et al. 2020. *Trends in Ecology & Evolution* 35(1):56–67. doi:10.1016/j.tree.2019.08.006
- Hemming et al. 2018. *Methods in Ecology and Evolution* 9(1):169–180. doi:10.1111/2041-210X.12857. Utile per il questionario dei cercatori, se chiede intervalli e fiducia.

**Dati e servizi**

- Open-Meteo: dati API CC BY 4.0; uso gratuito non commerciale, limite di 10 000 chiamate al giorno. https://open-meteo.com/en/licence e https://open-meteo.com/en/terms, letti il 16/10/2026.
- ISPRA, *Linee guida per il censimento e il monitoraggio dei macromiceti in Italia*, Manuali e linee guida 203/2023, ISBN 978-88-448-1175-4.

### 7.2 Fonti da scartare o correggere

| Citazione | Problema | Che cosa usare |
|---|---|---|
| «Karavani et al. 2018, *Predicting mushroom productivity from soil water balance*, AFM 259:236–244, doi 10.1016/j.agrformet.2018.05.005» (B r.356) | Il DOI è di Zhang et al. 2018, AFM 259:184–195, sulla respirazione del suolo. Titolo, volume e pagine sono sbagliati; autori, anno e rivista sono giusti, in ordine diverso. La tesi attribuita non c'è. | Karavani 2018, doi:10.1016/j.agrformet.2017.10.024 |
| «de-Miguel et al. 2014, *Predicting mushroom yields in forest stands using two-stage models*, Annals of Forest Science» (B r.354) | Non esiste su Crossref. | Il lavoro esistente più vicino è de-Miguel et al. 2014, FEM 330:218–227, doi:10.1016/j.foreco.2014.07.014, sulla gestione forestale e la produttività. Non è verificato che sostenga quello che B gli attribuisce. |
| «Oltre 746.000 record, ritardo di 12–20 giorni» (B r.91) | Fonde Kauserud 2012 (746.297 record, spostamenti di pochi giorni per decennio) e Büntgen 2013 (12 giorni, funghi svizzeri). L'intervallo «12–20 giorni» non c'è in nessuno dei due. | I due lavori, citati separatamente |
| Salerni 2023 come «faggete tosco-emiliane» e «>28–30 °C» (B r.35-40) | Ambito e soglia sbagliati | Salerni, Paoli & Perini 2023 per quello che dice: TXx, abetine del Monte Amiata |
| P×H «secondo Karavani e de-Miguel» (B r.301) | Attribuzione errata | Nessuna |
| «NdM/ISPRA 2021–2026» (B r.42-45) | Fonte non identificata, periodo sbagliato | Manuale ISPRA 203/2023 |
| Shock, latenze, gelo, caldo, tabella delle specie di B | Nessuna fonte | Olivier 1997 per lo shock, solo porcini |
| Salerni 2002 con `10.1092/…` (B r.359; A `studies.json:24`) | Alias non canonico | `10.1560/GV8J-VPKL-UV98-WVU1` |
| A: licenza di Brejon «non verificata» | Verifica non riuscita, ora superata | CC BY 4.0 per i record Zenodo |
| A: licenza di Qi 2025 «non esposta» | Verifica incompleta: Crossref la espone | CC BY 4.0 |
| A: Zambonelli & Bonito «2013» | Anno diverso da Crossref (sfumatura) | 2012 come su Crossref, doi:10.1007/978-3-642-33823-6 |
| A: le cinque specie di Morera 2024 | Non lette nel testo | Leggere il testo (CC BY 4.0) prima di citarle |
| Brejon «in stampa su Fungal Ecology» (A e B) | Non verificato: la bioRxiv API dà `published = NA` | Citare il preprint |

## 8. Controllo indipendente

16 ottobre 2026. Revisione scettica di questa sintesi, fatta dopo la sua stesura: ho ricontrollato su codice, dati e fonti le affermazioni che reggono le conclusioni. Le correzioni sono già applicate nel testo sopra. Script: `tools/ipotesi/valutazione-v3/scettico/`. Il pacchetto è stato estratto con `git archive 4465d2f`, senza modificare nulla.

| # | Affermazione | Come l'ho controllata | Esito |
|---|---|---|---|
| 1 | 46 test Python (25 + 21), 196 test dell'app, dry-run, `git diff --check`, commit solo sotto `tools/fronda_model/` | `python -W error -m unittest discover` sull'estratto (Python 3.13, numpy 2.3.5, scipy 1.17.0, scikit-learn 1.8.0); `npm test` (Node 22.22.0); `wrangler deploy --dry-run` con configurazione temporanea; `git diff --check` e `--name-only 68e2b1c 4465d2f`; `.assetsignore:7` | **Confermata.** 46/46, 196/196, dry-run uscita 0, diff pulito, 30 file tutti sotto `tools/fronda_model/` |
| 2 | Errori del codice: dominio marginale, Platt senza vincolo, minimo di dati, provenienze ammesse | Rilette le righe citate di `learning.py`; rieseguiti `joint_domain.py`, `edge_learning.py` (casi C2, D, H, I) e `calib_seeds.py` sull'estratto | **Confermata nei numeri** (p = 0,227/0,369/0,017 senza astensione; pendenza −0,275 e PR-AUC 0,431 → 0,066; 3 righe per split accettate; Brier 0,1118/0,1120 e 0,1872/0,1618). **Sfumata:** Codex dichiara il limite del dominio (`learning.py:264`, `PASSAGGIO-AGENTE.md:57-58`); il rapporto mostra metriche grezze e calibrate affiancate, quindi l'inversione di Platt è visibile anche se non bloccata; `features.py` segnala le righe senza `available_at` (`:303-311`) |
| 3 | «Servono circa 3 stagioni» | Script `due_stagioni.py`: training agosto 2027, calibrazione novembre 2027, test agosto 2028 | **Corretta.** `fit_encounter` accetta 2 stagioni. Ho scritto «almeno 2, realisticamente 3» nella sintesi, al punto 6 di 2.4 e nella sezione 5 |
| 4 | Citazioni di B giudicate false | Crossref (`api.crossref.org/works/…` e ricerca per titolo), Semantic Scholar per gli abstract, testo integrale di Kauserud 2012 (PMC3437857) e PDF di Salerni 2023 (italianmycology.unibo.it) | **Confermata** per de-Miguel 2014 in *Annals of Forest Science* (nessuna corrispondenza), per il DOI di «Karavani» (è Zhang et al., AFM 259:184–195), per la tesi attribuita a Karavani (l'abstract non la contiene), per «12–20 giorni» (assente in Kauserud e in Büntgen) e per Salerni 2023 (abetine di *Abies alba*, Monte Amiata, 2000–2002, nessuna soglia 28–30 °C). **Corretta:** gli autori di Karavani in B sono gli stessi cinque, in ordine diverso; quindi non «sbagliata in tutto». In 7.2 il numero 746.297 c'è in Kauserud: manca solo l'intervallo 12–20 |
| 5 | Citazioni e licenze di A | Crossref, DataCite, Zenodo API (tre record), registro AGRIS di Morera 2024 | **Confermata** con una precisazione: 54 DOI identici su Crossref, Salerni 2023 su DataCite, Zambonelli & Bonito con l'anno diverso; 9 DOI di dati su DataCite. Brejon: i record 20591123, 17881359 e 17881340 sono `cc-by-4.0`; il preprint è CC BY-NC 4.0. Qi 2025 e Morera 2024 sono CC BY 4.0 su Crossref (Semantic Scholar indica CC BY-NC-ND per Morera 2024: vale l'editore, da ricontrollare sul PDF). **Sfumata:** per Brejon e Qi il pacchetto dichiara una verifica non riuscita, non una licenza sbagliata. L'abstract di Morera 2024 nomina solo *B. edulis* e *L. deliciosus*: le altre tre specie vengono da sezioni indicizzate, quindi il rilievo regge |
| 6 | «Falesia moltiplicativa» assente: 118 440 casi, massimo 5 fattori fra 0,7 e 0,9, 17,3% di zone-giorno a 7,5 o più, 52/28/9%, ρ 0,96–0,99, +8–12 punti | Rieseguito `falesia.mjs` sul 2017 (output identico campo per campo); rilette le uscite 2026 e `deficit.json`; contati i giorni calcolabili del file ICON | **Confermata nei numeri** (118 440 = 14 × 45 × 188). **Esagerata nella portata:** è una sola stagione su dati d'archivio con più pioggia della produzione (le altre annate sono fallite per il limite di Open-Meteo, e oggi lo sono anche le mie richieste: HTTP 429). Sui dati di produzione (17/09–15/10/2026) la conclusione strutturale regge (massimo 4 fattori), ma le zone-giorno a 7,5 o più sono il 3,9%. Le quote 52/28/9 sono del deficit logaritmico, non della frequenza del fattore limitante (64/28/1). La trasformazione di B cambia il punto migliore (zona e fascia) nell'11–30% dei casi specie-giorno. Testo di 3.2 riscritto con questi limiti |
| 7 | Scarto fra prodotti meteo e celle delle fasce | Ricalcolo indipendente da `current.json` e `archive_2026.json` (`tools/ipotesi/valutazione-v3/scettico/celle.py`) | **Confermata:** 23 celle per 45 punti; rapporto mediano 1,54 (la sintesi dice 1,55), intervallo 0,67–3,71 (3,67): differenze di arrotondamento. **Sfumata:** `audit-fronda.md:27` descrive la richiesta, che è davvero a coordinate uguali |
| 8 | Compatibilità col Taccuino e difetti di 4.0 | Rilette le righe citate nel commit `e5f9552` (`js/journal.js:296-299`, `:347-352`, `:361`; `worker/community.js:15`, `:248-263`, `:270`, `:303`; `js/app.js:2700`, `:2741-2756`; `js/weather.js:23`, `:33`; `js/weather-data.js:12`; `worker/weather-provider.js:6`, `:25`, `:41`) | **Confermata.** Il piano salva 31 giorni di ingressi; il ritiro non scatta se cambia solo lo sforzo; l'indice in elenco è su 100. **Aggiunte:** il Taccuino non ha `research_consent` né `search_completed`, che `learning.py` richiede; esiste già `identificationChecked` sulle segnalazioni condivise, a cui va allineato il campo proposto in 4.3; `SHELL` e numeri di riga di `js/app.js` cambieranno con la seconda tornata (in corso, modifica `js/app.js`) |
| 9 | Condizioni Open-Meteo e costo dell'archivio | `open-meteo.com/en/terms` letto oggi; blog di Open-Meteo sul peso delle richieste | **Corretta in parte:** licenza CC BY 4.0 e limite di 10 000 al giorno confermati; ci sono anche limiti orari, al minuto e mensili. Con il peso per giorni e punti l'archivio vale circa 225 chiamate al giorno, non «poche decine» |

**Riferimenti di riga corretti:** `dati-validazione.md:69` → `:70`; `dati-validazione.md:83` → `:81`; `audit-fronda.md:204` → `:206`.

**Non ricontrollato** (resta come dichiarato dalle analisi): le covariate calcolabili (17, 24 e 28 su 31), la rilettura del notebook, l'analisi del vento (56–62%), l'intervallo 57–91% della «trovabilità», il numero esatto di 689 record GBIF (oggi l'API dà 716 record per *B. edulis* in Italia, nessuna assenza; il filtro sulle coordinate è fallito), le pagine 222–234 di Olivier 1997 (Crossref dà solo la pagina iniziale), le cinque specie di Morera 2024 (testo non accessibile: ScienceDirect risponde 403).

**Giudizio sulla sintesi.** Le conclusioni reggono: A è un banco di prova ben costruito ma senza modello né dati; B non è adottabile; il piano «prima registrare, poi cambiare» non dipende da nessuna delle affermazioni corrette qui. Le correzioni tolgono tre esagerazioni (Karavani «sbagliata in tutto», le «3 stagioni», la «falesia» data per assente in generale da una sola stagione d'archivio) e restituiscono a Codex due limiti che aveva dichiarato da sé.


## 9. Decisioni di Matteo (16 ottobre 2026)

- **D1:** archivio delle previsioni in una tabella di `COMMUNITY_DB` (migrazione `0005`, perché `0004` è del questionario).
- **D2:** ET₀ entra nel profilo meteo insieme all'umidità 9–27 cm, nella seconda tornata. Registrata, non usata nell'indice.
- **D3:** sforzo come durata effettiva in classi, ricerca conclusa e motivo di fine; durata obbligatoria solo con specie cercate senza ritrovamento; durata prevista facoltativa nel piano.
- **D4:** consenso alla ricerca con una casella separata, spenta di default e revocabile, con testo nuovo in `docs/legale.md`.
- **D5:** non chiesta; resta `tsd` 3,5 finché la prova offline (4.5) non dice altro.

## 10. Stato al 21 ottobre 2026

Controllato sul ramo locale `lavoro-fase-b` (commit `a23cea0`, seconda tornata unita alla produzione v319) e sulla produzione `71608ba`. Nessuna di queste voci cambia l'indice, salvo lo shock termico, deciso a parte il 16/10 (vedi sotto).

| Voce | Stato | Dove |
|---|---|---|
| 4.0.1 Indice su 100 nella lista «dove cercarla» | **Corretto** in produzione: usa `formatIndex` | `js/app.js`, riga «indice oggi» |
| 4.0.2 Controllo 0–1 dell'umidità giornaliera compatta | **Corretto** nella seconda tornata (in PR): `soilFraction` per strato 3–9 e 9–27 cm, nel Worker, nel KV e nel browser | `js/weather-data.js`, `js/weather.js`, `worker/weather-provider.js` |
| 4.0.3 Segnalazione condivisa con lo sforzo vecchio | **Corretto** nella seconda tornata (in PR): la segnalazione si ritira anche quando cambiano minuti, cercatori o inizio | `sharedFieldsChanged` in `worker/community.js` |
| D1 / 4.1 Archivio quotidiano delle previsioni | **Costruito il 24/10:** 108 punti (36 zone), D−1…D+7, cron a passaggi brevi per il limite di CPU; migrazione 0016 invece di 0005 | `worker/forecast-archive.js`, [meteo-cache.md](../meteo-cache.md#archivio-quotidiano-delle-previsioni--dal-24-ottobre-2026) |
| D2 / 4.2 Previsione salvata con 9–27 cm ed ET₀ | **Costruito** nella seconda tornata (in PR): profilo `growth` con le due variabili, profilo di transizione `growthLegacy`; la previsione salvata ha 31 giorni (non 60) di ingressi, l'indice con e senza shock e i fattori dello shock. **In corso**: salvataggio automatico una volta per zona e giorno | `js/forecast-capture.js`, [meteo-cache.md](../meteo-cache.md) |
| D3, D4 / 4.3 Sforzo e consenso alla ricerca | **D3 costruita il 24/10** nell'appunto sul fungo (decisione di Matteo: non nel ricordo d'uscita, che dal 20/10 non registra più le specie cercate): durata in classi, obbligatoria solo per «Cercato, non osservato», ricerca conclusa e motivo di fine; appunti `fronda-field-note-v2`. **D4 costruita il 24/10:** «Studio dell'indice» nel profilo, separato dalla condivisione, spento e revocabile, solo per le osservazioni condivise; le condivisioni precedenti escluse fino al consenso nuovo ([legale.md](../legale.md), §6.7). **Rimandata** (decisione del 24/10): durata prevista nel piano, perché oggi il piano si salva da solo, è immutabile e nessuno lo compila. **Da costruire:** `js/survey-export.js` e lo schema dell'osservazione, con il filtro sul consenso | `js/community-observation.js`, `js/notebook-composer.js`, [ux-taccuino.md](../ux-taccuino.md) |
| 4.4 «Bosco adatto» e «condizioni meteo» | Non riverificato in questo aggiornamento. I dati statici della seconda tornata compaiono come fatti descrittivi, con la fonte, e non cambiano l'indice | `js/site-info.js` |
| D5 / 4.5 Prova offline e curva termica | **Prova eseguita** (16/10, verificata il 21/10) e in PR con la seconda tornata. **D5 chiusa: `tsd` resta 3,5** | `tools/benchmark-bielefeld/README.md`, [metodo-scientifico.md](../metodo-scientifico.md#una-prova-offline-i-porcini-di-bielefeld) |

**Esiti della prova offline** (Fatto verificato sul README della prova, commit `ff52daf`). AP stratificata dentro la stagione, 1.090 giorni, 155 positivi, a caso 0,211; intervalli bootstrap (B) e jackknife (J) per stagione.

- (a) indice contro climatologia: +0,101, B [0,013; 0,226], J [−0,044; 0,245]: **non distinguibile** su questi dati.
- (b) σ 2,0 contro `tsd` 3,5: −0,047, B [−0,127; 0,012], J [−0,135; 0,042]: **non distinguibile**.
- (b′) σ stimato fuori campione contro 3,5: −0,041, B [−0,112; 0,013], J [−0,123; 0,042]: **non distinguibile**. Lettura congiunta preregistrata: «Nessun vantaggio dimostrato per la curva più stretta».
- Deviazione dichiarata dal README: δ = 0,02 non è stato confermato da Matteo prima dell'esecuzione; le etichette non dipendono da δ.

**Shock termico (decisione del 16/10/2026, modello 2.1.0).** Solo porcino e porcino rosso, calo di 5 °C della temperatura del suolo a 6 cm, bonus ×1,15 da 6 a 15 giorni dopo, mai cumulato, etichetta Euristica. È coerente con la riga «Shock» della tabella 7.2 («Olivier 1997 per lo shock, solo porcini»). Le previsioni salvate conservano l'indice con e senza shock: a fine della prossima stagione, con uscite che abbiano zeri espliciti, si confrontano; se la versione con shock non fa meglio, si toglie. Dettagli e limiti in [metodo-scientifico.md](../metodo-scientifico.md), sezione 6.

**Avvertenza per chi ripete la prova.** `valuta.py` controlla l'impronta dei moduli congelati (`js/model.js` 2.0.0) e con la 2.1.0 si ferma. La parte misurata (stagione × pioggia × temperatura) non cambia con la 2.1.0, ma il controllo va aggiornato dichiarandolo come deviazione.
