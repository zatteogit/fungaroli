# Prova offline dei porcini (Bielefeld)

Eseguita il 16 ottobre 2026 sul ramo `lavoro-benchmark`, seguendo la preregistrazione
[`preregistrazione.md`](preregistrazione.md) (commit `450a8ba`, scritta e rivista prima di qualsiasi risultato).
Rieseguita il 21 ottobre 2026 dopo la verifica indipendente (sezione «Verifica indipendente»): l'analisi principale e
le etichette non cambiano.
Riferimento: `docs/ipotesi/valutazione-modello-v3.md`, sezione 4.5.

**Nessun esito cambia l'app.** `js/model.js` e `js/species.js` non sono stati toccati: `fattori.mjs` li importa. Un
eventuale cambio di `tsd` di edulis resta la decisione D5 di Matteo. L'indice di Fronda è sperimentale (0–10) e
**non è una probabilità**: qui si misura solo come ordina i giorni dentro la stagione.

Legenda: **Fatto verificato** = controllato su dati, codice o fonte. **Interpretazione** = lettura nostra di un
fatto. **Ipotesi** = da mettere alla prova o non verificabile.

## In breve

Domanda: la parte meteo dell'indice per *Boletus edulis* (pioggia × temperatura × stagione) ordina bene i giorni con
ritrovamenti, sui dati che l'indice stesso cita?

Metrica che decide: AP stratificata (PR-AUC dentro la stagione), periodo 05/08–21/11, 1090 giorni, 155 con
ritrovamento. Un ordinamento a caso vale 0,211. Intervalli al 95%: **B** = bootstrap per stagione, **J** = jackknife
per stagione dell'intera procedura. Regola preregistrata (sezione 9.2), con θ̂ la differenza stimata e δ = 0,02:

- B e J tutti sopra 0 e θ̂ ≥ δ: «**ordina meglio**, su questi dati»;
- B e J tutti sopra 0 e θ̂ < δ: «**meglio, ma trascurabile** (sotto δ)»;
- B e J tutti sotto 0 e θ̂ ≤ −δ: «**ordina peggio**, su questi dati»;
- B e J tutti sotto 0 e θ̂ > −δ: «**peggio, ma trascurabile** (sotto δ)»;
- in ogni altro caso: «**non distinguibile** su questi dati». Se B e J stanno dentro (−δ; +δ) si aggiunge «la
  differenza resta sotto δ in tutto l'intervallo».

| Domanda | Differenza di AP stratificata | B | J | Esito preregistrato |
|---|---:|---|---|---|
| (a) indice (1) contro climatologia (0) | +0,101 | [0,013; 0,226] | [−0,044; 0,245] | **non distinguibile** su questi dati |
| (b) σ 2,0 (2) contro `tsd` 3,5 (1) | −0,047 | [−0,127; 0,012] | [−0,135; 0,042] | **non distinguibile** su questi dati |
| (b′) σ stimato fuori campione (2b) contro (1) | −0,041 | [−0,112; 0,013] | [−0,123; 0,042] | **non distinguibile** su questi dati |

- **Lettura congiunta di (b) e (b′), per D5** (sezione 9.4): «Nessun vantaggio dimostrato per la curva più
  stretta.» Nella stima puntuale la curva più stretta ordina un po' peggio, ma gli intervalli comprendono lo 0.
- **Nessuna sensibilità contraddice il principale** (sezione 10).
- «Non distinguibile» non vuol dire «uguali»: gli intervalli sono larghi. Con 10 stagioni era l'esito più probabile
  per (a) e (b′) (preregistrazione, 9.3).
- Gli zeri sono «nessun ritrovamento registrato», non visite a vuoto. Se dopo la pioggia si cercava di più, ogni
  modello con la pioggia riceve un vantaggio che misura i cercatori, non i funghi (4.3). Vale per ogni numero qui
  sotto.

## Dati e licenze

**Fatto verificato il 16/10/2026.**

- **Dati:** Brejon Lamartinière & Hoffman, «ebrejonl/Boletus_fruiting_triggers: Expansion of analysis», versione
  V1.2, Zenodo, record 20591123, DOI [10.5281/zenodo.20591123](https://doi.org/10.5281/zenodo.20591123). Licenza del
  deposito **CC BY 4.0** (`metadata.license.id = "cc-by-4.0"` nell'API Zenodo). File usato:
  `Data/Environmental_fruiting_data_jun8.csv`, SHA-256 `63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c`.
  Qui si pubblicano solo risultati aggregati, con questa attribuzione. I dati non sono stati modificati: le serie
  ricostruite (sezione 5 della preregistrazione) restano in `dati/`.
- **Meteo E-OBS.** Le colonne `Temp`, `Precip` e le medie mobili vengono da E-OBS a 0,1°. I termini E-OBS ammettono
  l'uso «strictly for use in non-commercial research and education projects only». Questa prova è ricerca non
  commerciale. La licenza CC BY del deposito non allarga i termini E-OBS e la ridistribuzione non è autorizzata in
  modo esplicito: **il CSV non entra nel repository**. Ringraziamento richiesto: «We acknowledge the E-OBS dataset and
  the data providers in the ECA&D project (https://www.ecad.eu)». Citazione: Cornes, R., G. van der Schrier,
  E.J.M. van den Besselaar, and P.D. Jones. 2018: An Ensemble Version of the E-OBS Temperature and Precipitation
  Datasets, J. Geophys. Res. Atmos., 123. doi:10.1029/2017JD028200.
- **Studio:** preprint bioRxiv v2 (8/6/2026), licenza **CC BY-NC 4.0**. Non se ne riproducono testo né figure.
- **Fuori dal repository** (`dati/`, esclusa da `.gitignore` di questa cartella): archivio, CSV, serie giornaliere,
  fattori per giorno, `esiti.json`. `tools/` è già escluso dalla pubblicazione del sito (`.assetsignore`).
- **Nel repository:** `esiti-riepilogo.json`, solo valori aggregati (metriche, intervalli, lettura, parametri per giro,
  medie per stagione). Fatto verificato il 21/10/2026: nessuna lista più lunga di 10 valori e nessun numero uguale a
  uno dei 26 070 valori meteo del CSV (`Temp`, `Precip`, medie mobili).

## File

| File | Che cosa fa |
|---|---|
| `preregistrazione.md` | Protocollo, scritto prima dei risultati. Non si modifica. |
| `scarica.py` | Scarica l'archivio da Zenodo (oppure usa `--zip FILE`), controlla dimensione, MD5 e SHA-256, estrae solo il CSV in `dati/` e ne controlla lo SHA-256. Solo libreria standard. |
| `fattori.mjs` | Importa `../../js/model.js` e `../../js/species.js` senza modificarli. Calcola `weatherFactors` e `seasonWeight` di edulis per ogni giorno, con `tsd` 3,5, 2,0 e i σ di (2b). Scrive `dati/fattori.json`. Lo lancia `valuta.py`. |
| `valuta.py` | Controlli bloccanti, ricostruzione, chiamata a Node, stime, validazione a stagione esclusa, metriche, bootstrap, jackknife, sensibilità, lettura preregistrata. Scrive `dati/esiti.json`, `dati/esiti-riepilogo.json` e una tabella su stdout. Solo libreria standard e numpy. |
| `esiti-riepilogo.json` | Copia versionata di `dati/esiti-riepilogo.json` dell'esecuzione del 21/10/2026: analisi, lettura, parametri per giro, ρ per stagione, metriche delle sensibilità, stagioni escluse dallo Spearman. Niente meteo giornaliero, niente sistema né commit. |

## Come si ripete

Dalla radice del repository. Serve Python con numpy (provato con Python 3.13.16 e numpy 2.3.5) e Node ≥ 22
(provato con 22.22.0). Dura circa 25 secondi.

```bash
python3 -m venv /tmp/venv-bielefeld
/tmp/venv-bielefeld/bin/pip install numpy==2.3.5
/tmp/venv-bielefeld/bin/python -I tools/benchmark-bielefeld/scarica.py
#   senza rete: … scarica.py --zip /percorso/Boletus_fruiting_triggers-V1.2.zip
/tmp/venv-bielefeld/bin/python -I tools/benchmark-bielefeld/valuta.py
#   stampa alla fine lo SHA-256 di esiti.json senza meta: è quello riproducibile
cmp tools/benchmark-bielefeld/dati/esiti-riepilogo.json tools/benchmark-bielefeld/esiti-riepilogo.json
```

- Lo scaricamento da Zenodo è stato provato il 16/10/2026 e ha funzionato. Anche `--zip` con l'archivio locale dà
  lo stesso CSV.
- `valuta.py` si ferma al primo controllo che non torna, compreso un cambio dei moduli congelati (per esempio dopo
  l'unione della 2.1.0).
- `--repliche N` serve solo per prove rapide. L'esito preregistrato usa 5000 repliche.
- **Hash riproducibile.** `meta` registra versioni, sistema, SHA-256 degli script, commit Git e file tracciati
  modificati: l'hash del file intero cambia con questi campi. Quello riproducibile è lo SHA-256 di `esiti.json`
  **senza `meta`**, scritto come lo scrive `valuta.py` (chiavi ordinate, `indent=1`, UTF-8, a capo finale). Sta in
  `meta.sha256_esiti_senza_meta` e in `esiti-riepilogo.json`. Per ricalcolarlo:
  `python3 -I -c "import json,hashlib,sys; e=json.load(open(sys.argv[1])); e.pop('meta'); print(hashlib.sha256((json.dumps(e,sort_keys=True,ensure_ascii=False,indent=1)+'\n').encode()).hexdigest())" tools/benchmark-bielefeld/dati/esiti.json`.
- **Determinismo (Fatto verificato il 21/10/2026).** Due esecuzioni consecutive hanno dato `esiti.json` e
  `esiti-riepilogo.json` identici byte per byte; lo stdout differiva solo per la cartella dei dati. SHA-256 senza
  `meta`: `c88b8f870b07eb879b2ebd87af7eed857c5aa5f318f30dab0c342e89f5ea2f19`. Il 16/10 due esecuzioni avevano dato lo
  stesso file intero (`36da7739…9e3c`); con numpy 2.5.3 tutte le sezioni tranne `meta` erano identiche.

## Controlli bloccanti (Fatto verificato)

Tutti superati prima di calcolare qualsiasi metrica (preregistrazione, sezione 11).

| # | Controllo | Risultato |
|---|---|---|
| 1 | SHA-256 del CSV | `63148586…0e4c`, uguale all'atteso |
| 2 | Numeri dell'audit e struttura | 3660 righe, 32 colonne, 1220 date. All: 155 giorni positivi, 1065 zeri, 1905 carpofori, massimo 78. Site_A 61/1159/545, Site_B 67/1153/283. Ogni stagione 1/8–30/11 senza buchi; meteo identico nei tre blocchi; All ≥ Site_A + Site_B in tutte le date |
| 3 | Ricostruzione 28/6–31/7 | Stime dello stesso giorno concordi entro 5,3·10⁻¹² °C e 1,2·10⁻¹² mm; stime di agosto contro i valori grezzi entro 3,5·10⁻¹² e 8,8·10⁻¹³; le 24 medie mobili ricalcolate entro 2,6·10⁻¹³ e 5,3·10⁻¹⁴. Pioggia ricostruita minima −2,9·10⁻¹³: 14 giorni portati a 0 |
| 4 | Moduli congelati | `MODEL_VERSION` 2.0.0; SHA-256 di `js/model.js`, `js/species.js`, `js/botanical-model.js`, `sigma_brejon.py` uguali a quelli preregistrati; profilo edulis e `PARAMS` come in 6, (1) |
| 5 | Allineamento JavaScript–Python, 1220 giorni | Scarti massimi: t20 7,1·10⁻¹⁵, r30 2,8·10⁻¹⁴, effRain 2,8·10⁻¹⁴, rain 2,2·10⁻¹⁶, temp 1,7·10⁻¹⁵, maxEvent identico. Legame con le righe del CSV per data: t20 contro `rollT_20` del giorno prima 9,9·10⁻¹⁴, P26 contro `rollP_26` del giorno prima 8,9·10⁻¹⁵. `seasonWeight` uguale ai 7 valori attesi nel 2015 e nel 2020. `inputQuality.missing` = suolo, Tmin, Tmax in ogni giorno. 156 valori di σ di (2b), nessuno infinito |
| 6 | Serie dei soli valori grezzi | 920 giorni (31/8–30/11, comprende i giorni di S2) con fattori identici a quelli della serie con ricostruzione |
| 7 | `sigma_brejon.py` eseguito senza modifiche | Il porting riproduce le cifre stampate in entrambi i periodi; σ non arrotondato dello script (05/08–21/11) uguale al porting entro 1,1·10⁻¹¹ |
| — | Riferimenti della sezione 3.6 (solo esito) | π e AP a caso uguali ai valori preregistrati per principale, S1, S2 e settimane; positivi per stagione uguali. Dal 21/10 il controllo viene prima delle metriche; nell'esecuzione del 16/10 veniva dopo (Deviazione 6) |

**Da quale periodo viene σ = 2,0 (Fatto verificato, controllo 7).** `sigma_brejon.py` stima σ su tutte e 10 le
stagioni:

| Periodo | σ non arrotondato | Stampato | Centro (Topt) | Risposta a ±4 °C stampata |
|---|---:|---:|---:|---:|
| 01/08–30/11 | 2,0046 °C | 2.00 | 13,75 °C | 0,14 |
| 05/08–21/11 | 2,0622 °C | 2.06 | 13,75 °C | 0,15 |

Il «σ ≈ 2,0» e lo «0,14 a ±4 °C» di `valutazione-modello-v3.md` (riga 103) vengono quindi dal periodo
01/08–30/11. In entrambi i periodi le stagioni di prova di questa validazione sono comprese nella stima.

## Esiti dell'analisi principale

Periodo 05/08–21/11, 1090 giorni, 155 positivi, prevalenza π 0,142. Serie giornaliera con i giorni di luglio
ricostruiti; tutti i modelli sugli stessi giorni.

**Modelli.** (0) climatologia stagionale (h = 7) stimata sulle 9 stagioni di training; (1) `S × rain × temp` di
`js/model.js`, `tsd` 3,5; (2) lo stesso con σ 2,0; (2b) lo stesso con σ stimato a ogni giro (GLM di Poisson); (3)
logistica su P26, T20, T20² stimata sul training. Riferimento a caso: AP stratificata 0,211; ROC-AUC 0,5.

### Metriche dentro la stagione

| Modello | AP stratificata | B | J | ROC-AUC stratificata | B | J | Spearman dentro la stagione | B | J | Valori distinti |
|---|---:|---|---|---:|---|---|---:|---|---|---:|
| (0) | 0,311 | [0,238; 0,390] | [0,121; 0,501] | 0,627 | [0,545; 0,720] | [0,462; 0,793] | 0,154 | [0,037; 0,286] | [−0,077; 0,384] | 66 |
| (1) | 0,412 | [0,312; 0,524] | [0,279; 0,546] | 0,780 | [0,728; 0,834] | [0,710; 0,850] | 0,357 | [0,297; 0,422] | [0,276; 0,439] | 1090 |
| (2) | 0,365 | [0,294; 0,475] | [0,242; 0,489] | 0,745 | [0,677; 0,818] | [0,652; 0,838] | 0,306 | [0,223; 0,398] | [0,190; 0,423] | 1090 |
| (2b) | 0,371 | [0,297; 0,481] | [0,261; 0,482] | 0,746 | [0,675; 0,821] | [0,659; 0,833] | 0,307 | [0,220; 0,401] | [0,201; 0,413] | 1090 |
| (3) | 0,451 | [0,348; 0,551] | [0,310; 0,591] | 0,764 | [0,701; 0,833] | [0,680; 0,847] | 0,334 | [0,256; 0,417] | [0,221; 0,447] | 1090 |

Nessuna replica bootstrap scartata; nessuna stagione esclusa dallo Spearman. Nelle sensibilità nessuna replica
scartata; in S2 il 2016 (nessun ritrovamento fra 31/08 e 21/11) è escluso dallo Spearman dentro la stagione per tutti
i modelli, 1 stagione su 10, e non pesa nell'AP stratificata.

### Differenze

| Differenza | AP stratificata | B | J | ROC-AUC strat. | B | J | Spearman strat. | B | J |
|---|---:|---|---|---:|---|---|---:|---|---|
| (a) (1)−(0) | 0,101 | [0,013; 0,226] | [−0,044; 0,245] | 0,152 | [0,084; 0,235] | [0,019; 0,285] | 0,204 | [0,095; 0,314] | [0,017; 0,390] |
| (b) (2)−(1) | −0,047 | [−0,127; 0,012] | [−0,135; 0,042] | −0,035 | [−0,064; −0,001] | [−0,075; 0,006] | −0,051 | [−0,093; −0,003] | [−0,109; 0,007] |
| (b′) (2b)−(1) | −0,041 | [−0,112; 0,013] | [−0,123; 0,042] | −0,034 | [−0,062; −0,001] | [−0,075; 0,007] | −0,051 | [−0,091; −0,002] | [−0,111; 0,009] |
| (c) (3)−(0) | 0,139 | [0,054; 0,238] | [0,002; 0,277] | 0,136 | [0,074; 0,217] | [−0,004; 0,276] | 0,181 | [0,084; 0,287] | [−0,023; 0,384] |
| (c) (3)−(1) | 0,038 | [−0,005; 0,091] | [−0,044; 0,121] | −0,016 | [−0,032; 0,003] | [−0,035; 0,003] | −0,023 | [−0,048; 0,004] | [−0,067; 0,020] |

Decide solo la colonna dell'AP stratificata; ROC-AUC e Spearman si riportano senza etichetta (9.5).

### Per stagione (descrittivo)

| Stagione | Positivi | Carpofori | AP a caso | AP (0) | AP (1) | AP (2) | AP (2b) | AP (3) | ROC (0) | ROC (1) | ROC (2) | ROC (2b) | ROC (3) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2015 | 12 | 146 | 0,145 | 0,236 | 0,350 | 0,303 | 0,303 | 0,353 | 0,617 | 0,823 | 0,759 | 0,760 | 0,822 |
| 2016 (instabile: 1 positivo) | 1 | 4 | 0,048 | 0,010 | 0,333 | 0,091 | 0,091 | 0,500 | 0,125 | 0,981 | 0,907 | 0,907 | 0,991 |
| 2017 | 16 | 134 | 0,181 | 0,299 | 0,321 | 0,296 | 0,296 | 0,341 | 0,678 | 0,737 | 0,727 | 0,729 | 0,713 |
| 2018 | 4 | 30 | 0,075 | 0,084 | 0,096 | 0,109 | 0,108 | 0,113 | 0,740 | 0,788 | 0,817 | 0,814 | 0,802 |
| 2019 | 16 | 180 | 0,181 | 0,427 | 0,359 | 0,350 | 0,349 | 0,396 | 0,771 | 0,838 | 0,837 | 0,836 | 0,831 |
| 2020 | 27 | 354 | 0,277 | 0,266 | 0,330 | 0,301 | 0,310 | 0,323 | 0,569 | 0,680 | 0,629 | 0,611 | 0,632 |
| 2021 | 18 | 296 | 0,198 | 0,166 | 0,692 | 0,372 | 0,411 | 0,636 | 0,482 | 0,874 | 0,788 | 0,811 | 0,850 |
| 2022 | 15 | 219 | 0,172 | 0,259 | 0,266 | 0,349 | 0,349 | 0,335 | 0,671 | 0,757 | 0,795 | 0,794 | 0,782 |
| 2023 | 25 | 276 | 0,260 | 0,325 | 0,349 | 0,292 | 0,294 | 0,519 | 0,458 | 0,695 | 0,593 | 0,599 | 0,650 |
| 2024 | 21 | 266 | 0,225 | 0,538 | 0,666 | 0,702 | 0,701 | 0,700 | 0,839 | 0,876 | 0,886 | 0,887 | 0,888 |

**Fatto verificato** (dalla tabella): (1) sta sopra l'AP a caso in tutte le 10 stagioni, (0) in 7. (1) supera (0)
in 9 stagioni su 10 (non nel 2019). (2) supera (1) in 3 stagioni (2018, 2022, 2024) e perde nelle altre 7; la
perdita più grande è nel 2021 (0,372 contro 0,692). Lo Spearman per stagione è in `esiti-riepilogo.json`.

### Metriche sul complesso (secondarie, senza verdetto)

Le 10 stagioni in un'unica classifica. **Avvertenza:** (0) e (3) sono penalizzati per costruzione (il livello
della stagione esclusa va al contrario dei suoi positivi); (2b) ha una scala diversa in ogni giro; tutte mescolano lo
sforzo, cresciuto fra le stagioni. Solo intervallo bootstrap. AP a caso 0,147 (π 0,142).

| Modello | AP | B | ROC-AUC | B | Spearman | B |
|---|---:|---|---:|---|---:|---|
| (0) | 0,172 | [0,112; 0,252] | 0,584 | [0,510; 0,680] | 0,101 | [0,007; 0,219] |
| (1) | 0,325 | [0,265; 0,429] | 0,796 | [0,738; 0,856] | 0,360 | [0,304; 0,416] |
| (2) | 0,307 | [0,244; 0,410] | 0,779 | [0,705; 0,847] | 0,339 | [0,269; 0,402] |
| (2b) | 0,304 | [0,241; 0,411] | 0,773 | [0,696; 0,847] | 0,332 | [0,258; 0,400] |
| (3) | 0,336 | [0,260; 0,416] | 0,761 | [0,686; 0,840] | 0,318 | [0,239; 0,391] |

| Differenza | AP | B | ROC-AUC | B | Spearman | B |
|---|---:|---|---:|---|---:|---|
| (a) (1)−(0) | 0,152 | [0,076; 0,256] | 0,212 | [0,122; 0,304] | 0,259 | [0,146; 0,359] |
| (b) (2)−(1) | −0,018 | [−0,047; 0,003] | −0,017 | [−0,052; 0,014] | −0,021 | [−0,065; 0,015] |
| (b′) (2b)−(1) | −0,021 | [−0,048; 0,003] | −0,023 | [−0,057; 0,013] | −0,028 | [−0,074; 0,014] |
| (c) (3)−(0) | 0,164 | [0,088; 0,248] | 0,177 | [0,095; 0,270] | 0,216 | [0,120; 0,311] |
| (c) (3)−(1) | 0,011 | [−0,054; 0,086] | −0,035 | [−0,065; −0,001] | −0,043 | [−0,084; −0,001] |

### Fra stagioni (descrittivo, senza verdetto)

Punteggio medio della stagione per (1) e (2), che non stimano nulla. Lo sforzo è cresciuto da 15 a 29 siti secondo
il testo dello studio (dato non verificabile sul CSV): il confronto fra stagioni lo mescola.

| Stagione | Positivi | Carpofori | Media di f₁ | Media di f₂ |
|---|---:|---:|---:|---:|
| 2015 | 12 | 146 | 0,345 | 0,196 |
| 2016 | 1 | 4 | 0,133 | 0,049 |
| 2017 | 16 | 134 | 0,482 | 0,373 |
| 2018 | 4 | 30 | 0,182 | 0,119 |
| 2019 | 16 | 180 | 0,339 | 0,281 |
| 2020 | 27 | 354 | 0,311 | 0,210 |
| 2021 | 18 | 296 | 0,308 | 0,165 |
| 2022 | 15 | 219 | 0,221 | 0,159 |
| 2023 | 25 | 276 | 0,362 | 0,171 |
| 2024 | 21 | 266 | 0,320 | 0,214 |

Spearman sulle 10 stagioni fra media e positivi: (1) 0,474; (2) 0,535. f₁ e f₂ non sono probabilità.

### Parametri stimati per giro

**(2b): σ_k e centro −bT / (2·bT2)** (il centro è solo descrittivo: (2b) usa sempre `topt` 13). Tutti i GLM sono
convergenti, nessun σ_k infinito.

| Stagione esclusa | Principale: σ_k | centro | giri | S1: σ_k | centro | giri | S2: σ_k | centro | giri | S2: escluse dal GLM |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 2015 | 2,019 | 13,67 | 9 | 1,976 | 13,64 | 9 | 2,399 | 14,07 | 8 | 2016 |
| 2016 | 2,065 | 13,75 | 8 | 2,007 | 13,75 | 9 | 2,253 | 13,94 | 8 | nessuna |
| 2017 | 2,083 | 13,80 | 9 | 2,027 | 13,80 | 9 | 2,288 | 14,01 | 8 | 2016 |
| 2018 | 2,066 | 13,78 | 8 | 2,008 | 13,77 | 9 | 2,275 | 13,99 | 8 | 2016 |
| 2019 | 2,050 | 13,77 | 9 | 1,991 | 13,77 | 9 | 2,229 | 13,97 | 8 | 2016 |
| 2020 | 1,760 | 14,04 | 9 | 1,725 | 14,03 | 9 | 1,798 | 14,12 | 9 | 2016 |
| 2021 | 2,209 | 13,59 | 9 | 2,135 | 13,61 | 9 | 2,335 | 13,46 | 8 | 2016 |
| 2022 | 2,059 | 13,88 | 9 | 2,002 | 13,86 | 9 | 2,293 | 14,09 | 8 | 2016 |
| 2023 | 2,084 | 13,64 | 9 | 2,018 | 13,66 | 9 | 2,186 | 13,73 | 8 | 2016 |
| 2024 | 2,153 | 13,64 | 9 | 2,077 | 13,66 | 9 | 2,353 | 13,87 | 8 | 2016 |

- In S2 il 2016 non ha conteggi: è escluso dal GLM in 9 giri su 10 (regola di 6, (2b)) e in 36 delle 45 stime del
  jackknife.
- Jackknife (45 stime per analisi, training di 8 stagioni): σ fra 1,654 e 2,376 nel principale, fra 1,625 e 2,263
  in S1, fra 1,695 e 2,641 in S2. Nessuna stima non convergente.

**(3): logistica.** Tutte le stime convergono senza penalità (7–9 iterazioni), anche nelle 45 del jackknife: il
ripiego L2 non è mai servito. I coefficienti per giro sono in `esiti-riepilogo.json` (`parametri_per_giro`).

## Sensibilità (descrittive, senza etichetta)

Differenze di AP stratificata con i due intervalli. Nessuna contraddice il principale secondo la regola della
sezione 10 (entrambi gli intervalli dalla parte di 0 opposta alla stima del principale).

**S1 (01/08–30/11, unico insieme che non dipende dall'esito), S2 (31/08–21/11, solo valori grezzi), S3 (settimane).**

| Differenza | S1 | B | J | S2 | B | J | S3 | B | J |
|---|---:|---|---|---:|---|---|---:|---|---|
| (a) (1)−(0) | 0,099 | [0,012; 0,222] | [−0,042; 0,240] | 0,085 | [−0,030; 0,227] | [−0,100; 0,269] | 0,120 | [0,063; 0,186] | [−0,100; 0,341] |
| (b) (2)−(1) | −0,047 | [−0,126; 0,012] | [−0,135; 0,042] | −0,043 | [−0,135; 0,021] | [−0,146; 0,060] | −0,039 | [−0,073; −0,008] | [−0,077; −0,001] |
| (b′) (2b)−(1) | −0,043 | [−0,119; 0,013] | [−0,129; 0,043] | −0,033 | [−0,108; 0,021] | [−0,115; 0,049] | −0,043 | [−0,079; −0,008] | [−0,088; 0,002] |
| (c) (3)−(0) | 0,133 | [0,047; 0,234] | [−0,004; 0,271] | 0,082 | [−0,030; 0,209] | [−0,071; 0,236] | 0,102 | [0,043; 0,169] | [−0,132; 0,335] |
| (c) (3)−(1) | 0,034 | [−0,009; 0,089] | [−0,075; 0,144] | −0,003 | [−0,030; 0,024] | [−0,090; 0,084] | −0,019 | [−0,038; 0,001] | [−0,061; 0,024] |

AP stratificata dei modelli: S1 (0) 0,312, (1) 0,411, (2) 0,365, (2b) 0,368, (3) 0,446, a caso 0,190. S2 (0) 0,338,
(1) 0,422, (2) 0,379, (2b) 0,389, (3) 0,420, a caso 0,249. S3 (0) 0,775, (1) 0,896, (2) 0,857, (2b) 0,853,
(3) 0,877, a caso 0,594. Le AP di insiemi diversi non si confrontano fra loro (8.2).

In S3 i numeri di (0) e delle differenze con (0) sono quelli con i pari merito arrotondati a 10⁻¹² (Deviazione 8).
Prima: (0) 0,776; (a) B [0,063; 0,185], J [−0,102; 0,342]; (c) (3)−(0) 0,101, J [−0,135; 0,337].

**S4–S7 (giorni del principale).**

| Differenza | AP stratificata | B | J |
|---|---:|---|---|
| S4 (1)−(0) con h = 3 | 0,138 | [0,054; 0,257] | [0,010; 0,266] |
| S4 (1)−(0) con h = 14 | 0,098 | [0,005; 0,218] | [−0,048; 0,243] |
| S5 (3′)−(3): colonne del CSV che includono il giorno d | −0,011 | [−0,041; 0,017] | [−0,064; 0,042] |
| S6 solo stagione − (0) | −0,019 | [−0,074; 0,037] | [−0,148; 0,109] |
| S6 solo stagione − (1) | −0,120 | [−0,202; −0,056] | [−0,215; −0,026] |
| S6 solo pioggia − (0) | −0,004 | [−0,135; 0,127] | [−0,240; 0,232] |
| S6 solo pioggia − (1) | −0,105 | [−0,229; −0,017] | [−0,247; 0,037] |
| S6 solo temperatura − (0) | 0,031 | [−0,002; 0,070] | [−0,074; 0,137] |
| S6 solo temperatura − (1) | −0,069 | [−0,173; 0,013] | [−0,186; 0,047] |
| S6 pioggia × temperatura senza stagione − (0) | 0,081 | [−0,012; 0,208] | [−0,070; 0,232] |
| S6 pioggia × temperatura senza stagione − (1) | −0,020 | [−0,041; −0,0003] | [−0,047; 0,007] |
| S7 (1) arrotondato come nell'app − (0) | 0,099 | [0,010; 0,224] | [−0,048; 0,246] |
| S7 (1) arrotondato come nell'app − (1) | −0,002 | [−0,007; 0,003] | [−0,008; 0,004] |

AP stratificata dei componenti: solo stagione 0,292; solo pioggia 0,307; solo temperatura 0,343; pioggia ×
temperatura 0,392; (1) arrotondato 0,410 (93 valori distinti). Climatologia con h = 3: 0,274; con h = 14: 0,315.
(3′): 0,440. Tutte le altre metriche delle sensibilità sono in `esiti-riepilogo.json`.

## Lettura secondo i criteri preregistrati

δ = 0,02 di AP stratificata (proposta della revisione; vedi «Deviazioni», punto 1).

**(a) Indice contro climatologia: non distinguibile su questi dati.**

- Fatto verificato: la stima puntuale +0,101 sta molto sopra δ. Il bootstrap sta tutto sopra 0 ([0,013; 0,226]), il
  jackknife no ([−0,044; 0,245]). La regola chiede entrambi: l'etichetta è «non distinguibile».
- ROC-AUC e Spearman dentro la stagione vanno nella stessa direzione dell'AP, con entrambi gli intervalli sopra 0
  (+0,152 e +0,204). Per la preregistrazione non decidono; non vanno in senso opposto.
- Interpretazione: il «non distinguibile» viene dalla variabilità fra le 10 stagioni, non dalla ristima della
  climatologia nel jackknife. Fatto verificato con un'analisi esplorativa, aggiunta dopo i risultati (Deviazione 4):
  con (0) non ristimata nel jackknife, J di (1)−(0) resta [−0,035; 0,236] (preregistrato [−0,044; 0,245]) e
  comprende ancora lo 0. La ristima allarga J per la sola (0): [0,121; 0,501] contro [0,215; 0,408] con (0) fissa.
- Interpretazione: il centro termico 13 °C e la finestra di 20 giorni dell'indice vengono da questo studio, stimati su
  tutte le stagioni. Un esito favorevole a (1) va letto come ottimistico (limite 13 della preregistrazione).
- Descrittivo, calcolato dopo i risultati (Deviazione 5): l'AP stratificata di (1) è 0,412 contro 0,211 di un
  ordinamento a caso. Differenza appaiata (1) − caso: +0,201, B [0,099; 0,321], J [0,056; 0,346].

**(b) σ 2,0 contro `tsd` 3,5: non distinguibile su questi dati.** Stima −0,047, B [−0,127; 0,012],
J [−0,135; 0,042]. La curva più stretta ordina un po' peggio nella stima puntuale. ROC-AUC (−0,035) e Spearman
(−0,051) vanno nella stessa direzione: il bootstrap sta tutto sotto 0, il jackknife comprende lo 0. Interpretazione:
(2) partiva avvantaggiato, perché 2,0 è stimato anche sulle stagioni di prova (6, (2)).

**(b′) σ stimato fuori dalla stagione di prova contro `tsd` 3,5: non distinguibile su questi dati.** Stima −0,041,
B [−0,112; 0,013], J [−0,123; 0,042]. σ_k fra 1,760 e 2,209 nei 10 giri. ROC-AUC e Spearman nella stessa direzione.

**(b) e (b′) insieme, per D5 (9.4): «Nessun vantaggio dimostrato per la curva più stretta.»** Nessuna delle due è
«ordina peggio» (servirebbero entrambi gli intervalli sotto 0). Gli intervalli vanno da −0,135 a +0,042 per (b) e da
−0,123 a +0,042 per (b′): non escludono uno svantaggio né un vantaggio della curva stretta maggiore di δ.

**(c) Riferimento, senza verdetto.** (3) − (0): +0,139, B [0,054; 0,238], J [0,002; 0,277]. (3) − (1): +0,038,
B [−0,005; 0,091], J [−0,044; 0,121]. Fra (3) e (1) la ROC-AUC stratificata va in senso opposto all'AP (−0,016,
B [−0,032; 0,003], J [−0,035; 0,003]). Interpretazione: la logistica mette più in alto alcuni positivi, l'indice
ordina un po' meglio l'insieme delle coppie. Una forma stimata sul training, con la stessa informazione, ha
differenze dall'indice con intervalli che comprendono lo 0.

**Sensibilità.** Nessuna contraddice il principale. Descrittivo, senza etichetta:

- S1 dà quasi gli stessi numeri del principale. È l'unico insieme che non dipende dall'esito.
- In S3 (settimane) entrambi gli intervalli di (b) stanno sotto 0 (−0,039, B [−0,073; −0,008], J [−0,077; −0,001]):
  stesso segno del principale. Per la preregistrazione è una sensibilità, quindi senza verdetto.
- In S4 l'esito di (a) dipende da h: con h = 3 entrambi gli intervalli stanno sopra 0 (+0,138, B [0,054; 0,257],
  J [0,010; 0,266]); con h = 14 J comprende lo 0 (+0,098, J [−0,048; 0,243]). Anche questa è una sensibilità,
  senza verdetto.
- S6: nessun componente da solo arriva a (1). Pioggia × temperatura senza stagione − (1): −0,020,
  B [−0,041; −0,0003], J [−0,047; 0,007]. La sola stagione dell'indice sta poco sotto la climatologia stimata (0,292
  contro 0,311), con intervalli larghi intorno a 0.
- S7: l'arrotondamento dell'app cambia l'AP di −0,002.
- S5: le colonne che includono il giorno d non aiutano la logistica (−0,011).

## Elementi per la decisione D5 di Matteo

Non è una raccomandazione: D5 resta di Matteo, e nulla vale per le faggete del Reatino.

1. **Fatto verificato.** Il «σ ≈ 2,0» viene da `sigma_brejon.py` sul periodo 01/08–30/11, stimato su tutte le 10
   stagioni (2,0046 °C). Sul periodo 05/08–21/11 lo stesso script dà 2,0622 °C.
2. **Fatto verificato.** Stimato fuori dalla stagione di prova, σ_k sta fra 1,76 e 2,21 °C (principale) e il centro
   fra 13,59 e 14,04 °C, sempre sopra il `topt` 13 dell'indice.
3. **Fatto verificato.** Sull'ordinamento dei giorni dentro la stagione non è dimostrato che σ 2,0 o σ_k ordinino
   meglio di `tsd` 3,5: «non distinguibile» in entrambi i casi. Le stime puntuali vanno nell'altro senso (−0,047 e
   −0,041 di AP stratificata). Gli intervalli vanno da −0,135 a +0,042 per (b) e da −0,123 a +0,042 per (b′): il
   limite superiore di J non esclude un vantaggio della curva stretta maggiore di δ (0,02). Lettura congiunta (9.4):
   «Nessun vantaggio dimostrato per la curva più stretta».
4. **Interpretazione.** Il GLM descrive la forma del legame fra conteggi e T20, a parità di anno. La prova misura
   un'altra cosa: l'ordinamento del prodotto con pioggia e stagione, con il centro fermo a 13 °C. I due risultati non
   si contraddicono.
5. **Ipotesi, non provata.** Con il centro a 13 °C e i dati centrati intorno a 13,75 °C, una curva più stretta
   penalizza di più i giorni a 14–15 °C. Questo potrebbe spiegare parte dello svantaggio di (2). Provarlo sarebbe
   un'analisi esplorativa, non preregistrata.

## Limiti

- **Zeri** non osservati come tali: `Mnb = 0` = «nessun ritrovamento registrato». Possibile legame fra pioggia e
  visite.
- **Sforzo variabile.** All somma più siti, cresciuti da 15 a 29 secondo il testo dello studio. Le metriche dentro la
  stagione lo tolgono fra stagioni, non dentro la stagione.
- **Un'area, non un campione di boschi.** Faggete vicino a Bielefeld, una sola serie meteo, 10 stagioni, positivi
  molto squilibrati (2016: 1 giorno; 2020: 27). Il peso dell'AP stratificata segue i positivi.
- **Meteo E-OBS** a 0,1°, interpolato sul centroide dei siti, versione non dichiarata dagli autori. Meteo osservato,
  non previsto come nell'app.
- **Righe di `Climate.csv`:** la ricostruzione di luglio presuppone giorni consecutivi (Ipotesi, preregistrazione
  3.4). S2 non ne dipende e va nella stessa direzione.
- **(1) non è indipendente da questi dati:** centro 13 °C e finestra di 20 giorni vengono da questo studio. Anche
  le finestre di (3) sono state scelte dagli autori su tutte le stagioni.
- **Il peso stagionale dell'indice** è il calendario pensato per il Reatino; la climatologia è stimata qui.
- **Fattori mancanti:** suolo, gelo, caldo e shock. Si misura una parte dell'indice, non l'indice dell'app (che senza
  suolo è «Non calcolabile»).
- **Intervalli approssimati.** Con 10 stagioni il bootstrap percentile tende a essere troppo stretto; per questo
  servono entrambi gli intervalli. Potenza bassa: «non distinguibile» non prova l'equivalenza.
- Nessuna soglia, nessuna calibrazione, nessuna probabilità. AP e ROC-AUC misurano l'ordinamento, non l'affidabilità
  di un valore.

## Verifica indipendente (21/10/2026)

Tre verificatori indipendenti hanno ricontrollato la prova, ognuno da zero. **Esito: nessun numero dell'analisi
principale cambia, nessun rilievo bloccante.**

| Controllo | Che cosa | Esito |
|---|---|---|
| Fattori | Fattori dell'indice ricalcolati in modo indipendente su 1220 giorni | Scarto massimo da `fattori.json` 3,8·10⁻¹³ |
| Protocollo | Fughe d'informazione dalla stagione di prova | Nessuna fuga: alterando esiti e conteggi della stagione di prova, le sue previsioni fuori campione non cambiano |
| Statistica | Ricalcolo da zero con scikit-learn e scipy, senza importare `valuta.py` | Tutti i numeri degli esiti del 16/10 riprodotti entro 3·10⁻¹⁵; due esecuzioni identiche byte per byte, salvo `meta.sistema` |

**Rilievi accolti** (tutti; nessuno respinto):

1. Lettura di (a): la larghezza di J per (1)−(0) non dipende dalla ristima della climatologia (Deviazione 4).
2. D5: tolto «Fatto verificato: né σ 2,0 né σ_k ordinano meglio»; ora «non è dimostrato», con gli intervalli.
3. «In breve»: regola completa della sezione 9.2, con la condizione su δ e le quattro etichette.
4. (1) contro un ordinamento a caso: differenza appaiata con B e J (Deviazione 5).
5. S6: tolto «aggiunge poco»; ora la differenza con i due intervalli.
6. Sensibilità: aggiunta S4, in cui l'esito di (a) dipende da h.
7. Deviazione 2: «nessuno script è cambiato» non è verificabile; data e momento alla Deviazione 3.
8. σ_k confrontati con il massimo di verosimiglianza, non con un GLM «entro 10⁻⁴».
9. Questa sezione.
10. Controllo dei riferimenti della sezione 3.6 prima delle metriche (Deviazione 6).
11. Commit Git in `meta` e SHA-256 degli esiti senza `meta` (Deviazione 7).
12. Pari merito con punteggi arrotondati a 10⁻¹² (Deviazione 8).
13. Riepilogo versionato senza meteo giornaliero, `esiti-riepilogo.json` (Deviazione 7).
14. `__pycache__` tolto dalla cartella e ignorato anche dal `.gitignore` di questa cartella.

**Regola della prima versione.** Con la regola della prima versione della preregistrazione (commit `fc2e574`: solo
intervallo bootstrap, AP sul complesso) (a) sarebbe risultata «ordina meglio»: il bootstrap della differenza sta
sopra 0 sia sul complesso ([0,076; 0,256]) sia dentro la stagione ([0,013; 0,226]). La revisione `450a8ba` ha
aggiunto J. Secondo le date di file e commit è stata fatta prima dei risultati: commit alle 08:45:16 del 16/10,
`valuta.py` modificato l'ultima volta alle 12:14:04, `esiti.json` alle 12:21:11 (UTC).

**Verifiche fatte qui sulle correzioni (21/10/2026).**

- Due esecuzioni di `valuta.py` in cartelle separate: `esiti.json` ed `esiti-riepilogo.json` identici byte per byte.
- Confronto con `esiti.json` del 16/10, sezione per sezione, senza `meta`: cambiano solo i valori della Deviazione 8.
  `serie.json`, `sigma.json` e `fattori.json` identici byte per byte.
- Numeri delle Deviazioni 4 e 5 ricalcolati con le funzioni di `valuta.py`, in uno script fuori dal repository.
- σ_k: in tutte le 165 stime di (2b) (validazione e jackknife di principale, S1, S2) lo scarto dal massimo di
  verosimiglianza senza il termine 10⁻⁸·I è al più 2,8·10⁻⁷. Nei 10 giri del principale l'ordine dei giorni della
  stagione di prova è identico.

## Deviazioni

Elenco aggiornato al 21/10/2026: le voci 1–3 sono del 16/10, le voci 4–8 vengono dalla verifica indipendente.
Formato della sezione 12: data, che cosa, perché, prima o dopo i risultati, effetto.

1. **δ non confermato da Matteo.** 16/10/2026, prima dell'esecuzione. La preregistrazione (9.2 e 15) lascia
   δ = 0,02 alla conferma di Matteo prima di `valuta.py`. La conferma non c'è stata: questa sessione non poteva
   chiederla. Si è usato il valore preregistrato. **Effetto: nessuno sulle etichette.** (a), (b) e (b′) sono «non
   distinguibile» perché il jackknife comprende lo 0, e lì δ non entra: le etichette restano le stesse con qualsiasi
   δ. Cambierebbe solo la nota «la differenza resta sotto δ in tutto l'intervallo»: per (b′) con δ sopra 0,123, per
   (b) e per la frase aggiuntiva della lettura congiunta (9.4) con δ sopra 0,135, per (a) con δ sopra 0,245.
2. **Esecuzione di prova.** 16/10/2026, prima dell'esecuzione preregistrata. `valuta.py` è stato lanciato una volta
   con `--repliche 200` per provare il codice, e i risultati di quella prova sono stati visti. Poi si sono fatti i
   controlli dei revisori (sotto) e le due esecuzioni con 5000 repliche. **Non è verificabile che dopo la prova
   nessuno script sia cambiato:** gli script sono entrati in Git insieme agli esiti (commit `2c3c5ed`, 12:29:14 UTC).
   Si sa questo: `valuta.py` ha data di modifica 12:14:04; un `__pycache__` di `valuta.py` è delle 12:16:52;
   `esiti.json` è delle 12:21:11. Gli SHA-256 in `esiti.json` sono quelli dei file del commit: legano gli esiti a
   quegli script, non dicono se prima della prova gli script erano diversi. Un ricalcolo indipendente da zero
   (scikit-learn, scipy, senza importare `valuta.py`) ha riprodotto tutti i numeri entro 3·10⁻¹⁵ (sezione «Verifica
   indipendente»). Effetto noto della prova: gli intervalli bootstrap differivano per il numero di repliche.
3. **Controllo 6 su più giorni.** 16/10/2026, scrivendo `valuta.py`, prima dei risultati (il controllo usa solo i
   predittori). La preregistrazione lo chiede per i giorni di S2 (830). È fatto su tutti i giorni dal 31/8 al 30/11
   (920), che li comprendono. Controllo più stretto, nessun effetto.
4. **Analisi esplorativa: (0) fissa nel jackknife.** 21/10/2026, dopo i risultati. Che cosa: J di (1)−(0) e di (0)
   con le previsioni di (0) della validazione principale (training di 9 stagioni), senza ristimarla su 8. Perché:
   capire da dove viene la larghezza di J per (a). Risultato: (1)−(0) J [−0,035; 0,236] (preregistrato
   [−0,044; 0,245]); (0) J [0,215; 0,408] (preregistrato [0,121; 0,501]). Effetto sull'esito preregistrato: nessuno.
5. **Analisi esplorativa: (1) contro un ordinamento a caso.** 21/10/2026, dopo i risultati. Differenza appaiata fra
   l'AP stratificata di (1) e quella attesa a caso (3.6), con le stesse estrazioni bootstrap e lo stesso jackknife:
   +0,201, B [0,099; 0,321], J [0,056; 0,346]. Descrittiva, senza etichetta. Effetto sull'esito: nessuno.
6. **Controllo dei riferimenti della sezione 3.6 prima delle metriche.** 21/10/2026, dopo i risultati. Il 16/10 il
   controllo (solo esito) veniva dopo il calcolo delle metriche, mentre questo README diceva «tutti superati prima di
   calcolare qualsiasi metrica». Ora viene prima, con le stesse soglie, calcolato dalle sole etichette. **Dopo i
   risultati, nessun numero cambia** (verificato con il confronto sopra).
7. **Commit Git, hash senza `meta`, riepilogo versionato.** 21/10/2026, dopo i risultati. `meta` registra
   `git rev-parse HEAD` e i file tracciati modificati; `valuta.py` calcola lo SHA-256 degli esiti senza `meta` e
   scrive `esiti-riepilogo.json`. **Dopo i risultati, nessun numero cambia**; cambia l'hash del file intero.
8. **Pari merito con punteggi arrotondati a 10⁻¹².** 21/10/2026, dopo i risultati. Che cosa: `metriche_insieme`
   arrotonda i punteggi a 10⁻¹² prima di cercare i pari merito. Perché: valori uguali in aritmetica esatta ma diversi
   nell'ultima cifra binaria contavano come diversi (`seasonWeight` interpolato in S6, medie settimanali della
   climatologia in S3). Verifica: in tutte le chiamate di un'esecuzione di prova i valori fusi distano fra loro al più
   7,8·10⁻¹⁶, due valori arrotondati diversi distano almeno 7,4·10⁻¹¹, e i gruppi coincidono con quelli dei valori a
   meno di 10⁻¹² l'uno dall'altro. **Effetto:** analisi principale di (0)–(3), S1, S2, etichette, lettura congiunta e
   contraddizioni invariate. Cambiano:
   - S6 «solo stagione»: AP stratificata 0,29202 → 0,29196, ROC-AUC 0,63453 → 0,63439; valori distinti 72 → 66.
     Nessuna cifra mostrata in questo README cambia. «Solo pioggia»: Spearman entro 2·10⁻⁶, valori distinti 961 → 959.
   - S3, (0) e differenze con (0) (sensibilità, senza etichetta): AP di (0) 0,776 → 0,775; (a) B [0,063; 0,185] →
     [0,063; 0,186], J [−0,102; 0,342] → [−0,100; 0,341]; (c) (3)−(0) 0,101 → 0,102, J [−0,135; 0,337] →
     [−0,132; 0,335]. Valori distinti di (0) 92 → 81. Il README mostra i valori nuovi.

**Precisazioni d'implementazione** (la preregistrazione non le fissa; decise scrivendo il codice, prima dei
risultati, salvo i pari merito; nessuna cambia un'etichetta):

- Penalità del ripiego di (3): −(λ/2)·(β1² + β2² + β3²) con λ = 1. Non è mai servita.
- Pari merito: fino al 16/10 valori del punteggio esattamente uguali in virgola mobile; dal 21/10 punteggi arrotondati
  a 10⁻¹² (Deviazione 8).
- Metriche sul complesso: solo intervallo bootstrap. Il jackknife di 8.4 riguarda le metriche stratificate.
- «ROC-AUC in senso opposto all'AP» (9.5): segno opposto delle stime puntuali. Non è successo per (a), (b), (b′).
- Regola di contraddizione (10) applicata dove c'è un corrispettivo nel principale: S1, S2, S3 per (a), (b), (b′),
  (c); S4 e S7 «(1) arrotondato − (0)» contro (a). S5, S6 e S7 «− (1)» non hanno un corrispettivo.
- (2b) in S3 usa i σ_k del principale, perché le settimane usano le predizioni giornaliere del principale (4.4).
- Ricostruzione: mediana delle stime con `numpy.median`.

**Controlli indipendenti dei revisori** (16/10/2026, fuori dagli script consegnati, nello scratchpad della sessione,
con scikit-learn, scipy e pandas): AP, ROC-AUC e Spearman per stagione di (1) e (2) uguali a
`average_precision_score`, `roc_auc_score` e `spearmanr` entro 10⁻¹²; ROC-AUC stratificata uguale al conteggio
diretto delle coppie; AP con i pari merito uguale alla media esatta su tutte le permutazioni in 300 casi piccoli e
alla media di 100 000 rotture casuali per la climatologia del 2015 (0,23636 contro 0,23635 ± 0,00002); logistica (3)
uguale a `LogisticRegression` senza penalità; σ_k di (2b) uguali entro 3·10⁻⁷ al massimo di verosimiglianza: lo
scarto viene dal termine 10⁻⁸·I dell'IRLS, uguale a `sigma_brejon.py`, e non cambia l'ordine dei giorni; bootstrap e
jackknife di (1) e metriche sul complesso ricalcolati da zero, uguali; jackknife di (0) e della differenza (a), con
la climatologia ristimata su 8 stagioni, ricalcolato in modo indipendente: uguale entro 10⁻¹⁴. Tutti questi
controlli sono stati rifatti sugli esiti finali del 16/10 con 5000 repliche.

## Versioni e hash

- Python 3.13.16, numpy 2.3.5, Node v22.22.0, Linux 6.18.44 x86_64.
- `js/model.js` (2.0.0) `3d4785be55b77fe590a7892db7a4cbc2191d971a5b7877e41022456f634b6fcd`;
  `js/species.js` `d43868bd15e202e57bc0b49ff5c404d985d714543e383d5af59e0ab86c5f3cc7`;
  `js/botanical-model.js` `75466dcd22524be0472443bb1f54559c4401d8b88dbc3de0075cf5ff5e558a64`;
  `sigma_brejon.py` `e3be0295a448654884ada9d97cac06878a283cd29ccfba0cd594cfff499bb34b`.
- Archivio Zenodo `ee19dfc414676cbcd4993eca75ea77a9fd1607d18bc4e0bdb7094a4ab07ee07a` (MD5
  `a5299db56022af2620635a36274e811f`); CSV `63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c`.
- Script: `scarica.py` `54a70915cabf0040718b09d71eee88fec9913cde6aa50ae687bca6c04da84f73`; `fattori.mjs`
  `a74199018b16689b1dd07a04bb6a8760465905eb4f67d8735af839e48f927434`; `valuta.py` del 21/10
  `7e1d4b0c99ca5dcc6ecaaf0507b442e3d858945c995dac375500191810ffe797` (del 16/10:
  `8c2ba557bcf8fb20a1f770752b37133d8ab908f85ad07d6596fcf5657182d194`); `preregistrazione.md`
  `bdcfb75c461c5a25a790ff249ec2ce4bcf6cc51310fdff85c011d8dfa7851a80`.
- 21/10/2026: `esiti.json` senza `meta` `c88b8f870b07eb879b2ebd87af7eed857c5aa5f318f30dab0c342e89f5ea2f19` (due
  esecuzioni, riproducibile); `esiti-riepilogo.json`
  `12a157251b8a0d22a36c5a7cc3b572dca53d1b390f3ccafda363de32902dc5ad`; `fattori.json`
  `15d57a76014778588b8d1e6eee30f86ec3ee3fac437a0eb53df16c711dc55cfe` (uguale al 16/10).
- 16/10/2026: `esiti.json` intero `36da7739f24e454d904bdebebe5146f6c30484547101b6cfaa909a4c3f019e3c` (due
  esecuzioni).
- Bootstrap: 5000 repliche, `numpy.random.default_rng(20261016)`; jackknife con t = 2,262.
