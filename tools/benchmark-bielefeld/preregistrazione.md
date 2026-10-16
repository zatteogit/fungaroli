# Prova offline dei porcini: preregistrazione

Scritta il 16 ottobre 2026, **prima di qualsiasi risultato**. Ramo `lavoro-benchmark`, commit di partenza `2da612f`.
Riferimento: `docs/ipotesi/valutazione-modello-v3.md`, sezione 4.5.

**Che cosa è stato guardato finora.** Solo la struttura dei dati (sezione 3). Non è stato calcolato nessun legame fra
predittori ed esito: niente AUC, correlazioni, grafici, medie condizionate all'esito, niente modelli stimati. Nessun
fattore dell'indice è stato calcolato sui dati reali: `js/model.js` è stato importato una volta su una serie fittizia
costante, solo per controllare che l'import funzioni in Node.

**Regola.** Dopo il commit questo file non si modifica, nemmeno per errori materiali. Ogni cambiamento va nella
sezione «Deviazioni» del README (sezione 12).

Legenda: **Fatto verificato** = controllato oggi su dati, codice o fonte. **Interpretazione** = lettura nostra di un
fatto. **Ipotesi** = da mettere alla prova.

## 1. Scopo e confini

Domanda: la parte meteo dell'indice di Fronda per *Boletus edulis* ordina bene i giorni con ritrovamenti, sui dati
che l'indice stesso cita (Brejon Lamartinière & Hoffman)?

- È una prova di **ordinamento**. Non stima una probabilità e non calibra nulla. L'indice resta sperimentale (0–10)
  e non è una probabilità.
- Non trasferisce nulla al Reatino. È un solo sito di faggeta in pianura vicino a Bielefeld, con 10 stagioni.
- **Nessun esito cambia l'app.** `js/model.js` e `js/species.js` non si toccano. Un eventuale cambio di `tsd` di
  edulis è la decisione D5 di Matteo, non di questa prova.
- Con 10 stagioni gli intervalli saranno larghi. «Non distinguibile» è un esito valido, non un fallimento, e non
  vuol dire «uguali».

## 2. Dati

### 2.1 Fonte (Fatto verificato il 16/10/2026)

| Voce | Valore |
|---|---|
| Deposito | Zenodo, record 20591123, «ebrejonl/Boletus_fruiting_triggers: Expansion of analysis», versione V1.2, pubblicato l'8/6/2026 |
| DOI | `10.5281/zenodo.20591123` |
| Licenza del deposito | CC BY 4.0: `metadata.license.id = "cc-by-4.0"` nell'API `https://zenodo.org/api/records/20591123` |
| Archivio | `ebrejonl/Boletus_fruiting_triggers-V1.2.zip`, 712 920 byte |
| MD5 dell'archivio (dall'API, coincide con il file scaricato) | `a5299db56022af2620635a36274e811f` |
| SHA-256 dell'archivio | `ee19dfc414676cbcd4993eca75ea77a9fd1607d18bc4e0bdb7094a4ab07ee07a` |
| URL di scaricamento | `https://zenodo.org/api/records/20591123/files/ebrejonl/Boletus_fruiting_triggers-V1.2.zip/content` |
| File usato | `ebrejonl-Boletus_fruiting_triggers-7967c6d/Data/Environmental_fruiting_data_jun8.csv`, 1 734 999 byte |
| SHA-256 del CSV | `63148586ad0cd2533fb741070e95f900e53343f54a4ccdfe0944f3a8f0000e4c` |
| Codice R degli autori (solo lettura, non eseguito) | `…/Code_clean_Jun8.R`, SHA-256 `d71755e659194d93b396ace6c9c98a1093014241aa4b02ec2b4d7ae790ba300b` |
| Studio | Brejon Lamartinière & Hoffman, *Predicting porcini…*, preprint bioRxiv v2 (8/6/2026), licenza CC BY-NC 4.0: non si riproducono testo né figure |

Correzione rispetto a `audit-porcini.md` (commit `4465d2f`): l'audit scriveva «licenza non verificata». Oggi l'API
Zenodo riporta CC BY 4.0 per il deposito.

### 2.2 Termini E-OBS (Fatto verificato il 16/10/2026)

Il meteo del CSV viene da E-OBS a 0,1°, interpolato dagli autori sul sito (codice R, righe 31–57). Pagine lette:

- «Terms of use» in `https://surfobs.climate.copernicus.eu/dataaccess/access_eobs.php` e in
  `https://www.ecad.eu/download/ensembles/download.php`;
- «Data Policy for ECA&D and E-OBS», `https://www.ecad.eu/documents/ECAD_datapolicy.pdf` (ultimo aggiornamento
  indicato: 16/9/2019);
- licenza E-OBS del Copernicus Climate Data Store (scheda `insitu-gridded-observations-europe`, PDF
  «licence-to-use-E-OBS-products», ultimo aggiornamento indicato: 27/1/2020), con lo stesso contenuto sui punti
  qui sotto.

Che cosa dicono:

- i dati sono «strictly for use in non-commercial research and education projects only»;
- «Scientific results based on these data must be submitted for publication in the open literature without delay»;
- chi pubblica risultati deve citare Cornes et al. 2018 (doi:10.1029/2017JD028200) e scrivere: «We acknowledge the
  E-OBS dataset and the data providers in the ECA&D project (https://www.ecad.eu)»;
- non c'è una clausola esplicita sulla ridistribuzione dei dati o dei valori derivati.

**Interpretazione.**

- Questa prova offline è ricerca non commerciale: l'uso è compatibile con i termini. Il README pubblicherà i
  risultati aggregati con la citazione e il ringraziamento richiesti.
- La licenza CC BY 4.0 del deposito non può allargare i termini E-OBS per le colonne meteo. La ridistribuzione non
  è autorizzata in modo esplicito: il CSV resta fuori dal repository.
- Non è stabilito se Fronda, come app, rientri in «non-commercial research and education». Nessun dato E-OBS entra
  nell'app (come oggi).

**Non verificato:** la versione di E-OBS usata dagli autori. Il codice chiama `climateExtract` con `ecad_v = NULL`
(righe 31–37, commentate) e non registra la versione.

### 2.3 Che cosa non entra nel repository

- Archivio, CSV e codice R degli autori.
- Valori derivati da E-OBS giorno per giorno: serie ricostruite (sezione 5), fattori giornalieri, predizioni per
  giorno.
- Tutto questo sta in `tools/benchmark-bielefeld/dati/`, esclusa da git con `tools/benchmark-bielefeld/.gitignore`.
- Entrano: questa preregistrazione, gli script, il README con metriche aggregate, intervalli e parametri stimati per
  giro. `tools/` è già escluso dalla pubblicazione del sito (`.assetsignore`).

## 3. Controlli strutturali fatti prima di scrivere (Fatto verificato)

Python 3.13.16, numpy 2.3.5, opzione `-I`. Script di sola lettura nello scratchpad della sessione, fuori dal
repository. `valuta.py` li ripeterà tutti prima di calcolare qualsiasi metrica (sezione 11).

### 3.1 Numeri dell'audit di Codex, riprodotti

| Controllo | Atteso (audit) | Trovato |
|---|---:|---:|
| SHA-256 del CSV | `63148586…0e4c` | uguale |
| Righe | 3660 | 3660 |
| Colonne | 32 | 32 |
| Date uniche | 1220 | 1220 |
| Blocco All: giorni con `Mnb > 0` | 155 | 155 |
| Blocco All: giorni con `Mnb = 0` | 1065 | 1065 |
| Blocco All: carpofori (somma di `Mnb`) | 1905 | 1905 |
| Blocco All: massimo giornaliero | 78 | 78 |
| Site_A: positivi, zeri, carpofori | 61, 1159, 545 | uguali |
| Site_B: positivi, zeri, carpofori | 67, 1153, 283 | uguali |

### 3.2 Struttura

- Tre blocchi `site` (All, Site_A, Site_B), 1220 righe ciascuno. Chiave (`site`, `date`) unica.
- Nessuna cella vuota o NA. `Date` = `date` in tutte le righe. `month` e `year` coerenti con la data. `Mnb` intero.
- Ogni stagione (2015–2024) va dal 1/8 al 30/11: 122 giorni consecutivi, senza buchi.
- Meteo e medie mobili identici nei tre blocchi per la stessa data.
- `Temp` fra −3,26 e 25,82 °C. `Precip` fra 0 e 45,59 mm, nessun valore negativo.

### 3.3 Medie mobili del CSV

- **Codice R** (righe 62 e 69–73): `group_by(year)`, poi `rollmean(x, w, align = "right", fill = NA)` per
  w = 2, 5, 8, …, 35. Sono **medie** (mm al giorno per la pioggia), non somme. La finestra **include il giorno
  stesso**: `rollT_w[d] = media(Temp[d−w+1 … d])`. Il ritaglio agosto–novembre (righe 85–92) viene dopo il calcolo:
  le medie dei primi giorni di agosto contengono i giorni di luglio.
- **Verifica numerica** sulle finestre tutte dentro la stagione: scarto massimo dalla media che include il giorno d
  5,7·10⁻¹⁴ °C e 5,3·10⁻¹⁴ mm/giorno, per tutte le 24 colonne. Con la finestra che si ferma a d−1 lo scarto medio
  sarebbe 0,38 °C e 0,39 mm/giorno.
- Valori di `rollP` minuscoli e negativi (ordine di 10⁻¹⁵): arrotondamento della media mobile, già segnalato
  dall'audit.

### 3.4 I giorni prima del 1/8 si ricostruiscono dalle medie mobili

Per ogni variabile x (Temp, Precip), finestra w e giorno d dal 2/8 in poi vale l'identità
`x[d−w] = x[d] − w · (roll_w[d] − roll_w[d−1])`. Con w fino a 35 si ottengono i **34 giorni dal 28/6 al 31/7** di
ogni stagione, quasi tutti con più stime indipendenti.

| Controllo | Scarto massimo |
|---|---:|
| Stime diverse dello stesso giorno (T; P) | 5,5·10⁻¹²; 1,2·10⁻¹² |
| Stime di giorni di agosto noti, contro il valore grezzo (T; P) | 3,5·10⁻¹²; 8,8·10⁻¹³ |
| Tutte le 24 colonne di medie mobili, ricalcolate dalla serie ricostruita + grezza (T; P) | 2,6·10⁻¹³; 5,3·10⁻¹⁴ |
| Pioggia ricostruita minima | −2,9·10⁻¹³ |

**Interpretazione:** sono gli stessi valori giornalieri che gli autori avevano in `Climate.csv`, recuperati per
identità aritmetica. Non sono stime né imputazioni, e non aggiungono dati esterni.

### 3.5 Giorni con le finestre giornaliere complete

`weatherFactors` (in `js/model.js`) usa per il giorno i la pioggia giornaliera da i−30 a i−1 (r30; la finestra di
latenza i−21 … i−7 sta dentro) e la temperatura media da i−20 a i−1 (t20).

| Serie disponibile | Primo giorno completo | Giorni per stagione 01/08–30/11 | Giorni per stagione 05/08–21/11 |
|---|---|---:|---:|
| Solo valori grezzi del CSV (dal 1/8) | 31/8 | 92 | 83 |
| Con i 34 giorni ricostruiti (dal 28/6) | 1/8 | 122 | 109 |

Attenzione: `sum` e `mean` di `js/model.js` saltano i valori mancanti senza segnalarlo. Su una finestra incompleta il
fattore verrebbe calcolato lo stesso, sbagliato. Per questo serve una regola esplicita (sezione 5).

### 3.6 Prevalenza dell'esito per periodo (riferimento della PR-AUC)

| Insieme di giorni (blocco All) | Giorni | Positivi | Prevalenza | Carpofori |
|---|---:|---:|---:|---:|
| Principale 05/08–21/11 | 1090 | 155 | 0,1422 | 1905 |
| Controllo 01/08–30/11 | 1220 | 155 | 0,1270 | 1905 |
| Sensibilità «solo valori grezzi» 31/08–21/11 | 830 | 135 | 0,1627 | 1619 |
| Settimane fisse, periodo principale (sezione 4.4) | 150 settimane | 65 | 0,4333 | — |

Giorni positivi per stagione nel periodo principale: 2015: 12; 2016: 1; 2017: 16; 2018: 4; 2019: 16; 2020: 27;
2021: 18; 2022: 15; 2023: 25; 2024: 21. Tutti i 130 giorni fuori dal periodo principale sono zeri (come
nell'audit). Nel sottoinsieme «solo valori grezzi» il 2016 non ha positivi.

## 4. Esito, unità e periodi

### 4.1 Unità ed esito

- **Unità:** il giorno d della stagione y (y = 2015 … 2024), nel blocco **All**.
- **Esito:** Y = 1 se `Mnb > 0`, altrimenti 0. Si chiama «giorno con ritrovamento registrato».
- I conteggi `Mnb` servono solo per la correlazione di Spearman.
- Site_A e Site_B non si usano, nemmeno come sensibilità: sono sottoinsiemi di All con lo stesso meteo, non siti
  indipendenti (audit, Fatto verificato in 3.2).

### 4.2 Periodi

- **Principale:** 05/08–21/11, l'intervallo del testo dello studio. 109 giorni × 10 stagioni = 1090 giorni.
- **Controllo:** 01/08–30/11, l'intervallo del codice R. 1220 giorni (sensibilità S1).

### 4.3 Giorni senza visita

**Fatto verificato** (codice R, righe 78–92): `Mnb` conta i record per data; le date senza record ricevono 0.
Nel CSV non ci sono visite, durata, osservatori né siti attivi. I siti erano visitati 2–4 volte a settimana.

- `Mnb = 0` vuol dire «nessun ritrovamento registrato», non «visita senza ritrovamenti».
- Non si creano zeri, non si scartano giorni, non si stima la rilevabilità. Tutti i giorni del periodo entrano con
  la loro etichetta.
- **Interpretazione:** gli zeri mescolano giorni senza visita e visite a vuoto. Il rumore pesa su tutti i modelli.
  Ma se le visite fossero più frequenti dopo la pioggia, ogni modello con la pioggia riceverebbe un vantaggio che
  misura il comportamento dei cercatori, non la fruttificazione. Il README lo ricorderà accanto a ogni esito.

### 4.4 Analisi secondaria per settimane (S3)

Una settimana con 2–4 visite è più vicina a «cercato e non trovato» di un giorno singolo (**Interpretazione**).

- Blocchi fissi di 7 giorni consecutivi dentro ogni stagione, a partire dal 05/08. 15 blocchi per stagione; gli
  ultimi 4 giorni (18/11–21/11) restano fuori. 150 blocchi, 65 positivi.
- Esito del blocco: almeno un giorno con `Mnb > 0`.
- Punteggio del blocco: media dei punteggi giornalieri fuori campione, sulla scala propria di ogni modello
  (frequenza per (0), prodotto dei fattori per (1), (2), (2b), probabilità stimata per (3)).
- Spearman sul totale settimanale dei carpofori. I modelli non si ristimano a livello settimanale.

## 5. Le finestre: una regola unica

**Regola.** Per ogni stagione si costruisce la serie giornaliera dal 28/6 al 30/11 (156 giorni):

- dal 28/6 al 31/7 i valori ricostruiti (sezione 3.4). Per ogni giorno si prende la mediana delle stime
  disponibili;
- dal 1/8 al 30/11 le colonne grezze `Temp` e `Precip`.

Controlli bloccanti, con tolleranza 10⁻⁹: le stime di uno stesso giorno concordano; le stime dei giorni di agosto
coincidono con i valori grezzi; tutte le 24 colonne di medie mobili si ricalcolano dalla serie. La pioggia
ricostruita fra −10⁻⁹ e 0 diventa 0; sotto −10⁻⁹ l'esecuzione si ferma.

**Conseguenza.** Tutti i giorni di entrambi i periodi hanno le finestre complete. **Tutti i confronti si valutano
sullo stesso insieme di giorni**: 1090 nel principale, 1220 nel controllo.

**Motivi.**

1. È un'identità verificata a 10⁻¹¹: niente dati nuovi, niente imputazioni.
2. Mantiene il periodo dichiarato. La regola «solo valori grezzi» toglierebbe 26 giorni per stagione dal periodo
   principale: 260 giorni, 20 dei 155 positivi, compreso l'unico giorno positivo del 2016.
3. La stessa serie alimenta tutti i modelli.

**Sensibilità S2 («solo valori grezzi»).** Solo i giorni dal 31/08 al 21/11 (830 giorni, 135 positivi), le cui
finestre stanno tutte nei valori grezzi del CSV. Per questi giorni i fattori dell'indice non dipendono dalla
ricostruzione; S2 dice se l'esito dipende dai primi giorni di agosto. (0), (2b) e (3) si ristimano su questi giorni.

**Informazione disponibile.** Tutti i predittori meteo usano i giorni fino a d−1, come l'indice. Le medie di Brejon
nel CSV includono il giorno d: si usano così solo in (2b), per stimare σ come in `sigma_brejon.py`, e in (3′),
sensibilità S5.

## 6. I confronti

Il giorno d ha indice i(d) nella serie della sua stagione (28/6 = 0, quindi 1/8 = 34). Lo scostamento
o(d) = giorni dal 1/8 (da 0 a 121) evita il problema degli anni bisestili.

- Senza stima: (1) e (2).
- Stimati sulle 9 stagioni di training di ogni giro: (0), (2b) e (3).

### (0) Climatologia stagionale

Per la stagione esclusa k e lo scostamento o:

`c_k(o) = (positivi delle 9 stagioni di training con o′ in A e |o′ − o| ≤ h) / (9 · numero di o′ in A con |o′ − o| ≤ h)`

- A = scostamenti dell'insieme d'analisi (principale: 4 … 112).
- **h = 7**: finestra di 15 giorni, troncata ai bordi del periodo. Nessun'altra lisciatura.
- Sensibilità S4: h = 3 e h = 14.

### (1) Parte meteo dell'indice, `tsd` 3,5

`fattori.mjs` importa `js/model.js` e `js/species.js` senza modificarli. Per ogni giorno:

- `s = { p: Precip giornaliera, tmean: Temp giornaliera }`, senza `soilm`, `tmin`, `tmax`, `soilt`;
- `w = weatherFactors(edulis, s, i)` e `S = seasonWeight(edulis.months, "AAAA-MM-GG")`;
- **punteggio f₁(d) = S × w.rain × w.temp**, continuo, senza arrotondamento.

Profilo edulis letto da `js/species.js`: `topt` 13, `tsd` 3,5, `lag` [7, 21], `eref` 30, pesi mensili
0,8 / 1 / 1 / 0,4 per agosto … novembre. Dentro `weatherFactors` (versione 2.0.0):

- pioggia: effRain = somma da i−21 a i−7, evento d'innesco 8 mm, r30 = somma da i−30 a i−1;
- temperatura: exp(−½ · ((t20 − 13) / 3,5)²), con t20 = media da i−20 a i−1.

f₁ sta fra 0 e 1. Corrisponde all'indice 0–10 diviso per 10, prima dell'arrotondamento e con gli altri fattori a 1.
**Non è una probabilità.** `scoreSpecies` non si chiama: senza suolo moltiplicherebbe per `moist = null`, cioè 0.

### (2) Come (1), con σ = 2,0

Una copia in memoria `{ ...edulis, tsd: 2 }`. `topt` resta 13: D5 riguarda solo l'ampiezza.

**Fatto verificato:** σ = 2,0 viene da `tools/ipotesi/valutazione-v3/impianto-scientifico/sigma_brejon.py`, stimato
su **tutte e 10 le stagioni**, comprese quelle che qui fanno da prova. (2) parte quindi avvantaggiato. Per questo
c'è (2b).

### (2b) Come (1), con σ ristimato a ogni giro

Su ogni training si ripete la procedura di `sigma_brejon.py`, portata in numpy:

- GLM di Poisson sui conteggi `Mnb`: log μ = a_anno + bP · rollP_26 + bT · rollT_20 + bT2 · rollT_20²;
- effetti fissi per anno; colonne del CSV così come sono (finestra che include d); giorni dell'insieme d'analisi;
- IRLS come nello script: partenza a_anno = log(max(media di Mnb; 10⁻³)), altri coefficienti 0; termine 10⁻⁸ · I;
  arresto quando il massimo |Δβ| < 10⁻⁹; al massimo 100 iterazioni.

Poi:

- σ_k = √(−1 / (2 · bT2)) se bT2 < 0. Se bT2 ≥ 0, σ_k = +∞ e il fattore temperatura vale 1.
- f₂b(d) = come (1) con `tsd` = σ_k e `topt` 13, sempre calcolato con `js/model.js`.
- Il README riporta σ_k, il centro stimato −bT / (2 · bT2) (solo descrittivo), iterazioni e convergenza di ogni giro.

### (3) Forma di Brejon, stimata sul training

- Predittori dalla serie giornaliera, fino a d−1: P26(d) = media della pioggia da i−26 a i−1 (mm al giorno);
  T20(d) = media della temperatura da i−20 a i−1 (uguale a `w.t20`).
- Standardizzazione con media e deviazione standard (ddof = 0) delle righe di training: zP, zT.
- Regressione logistica sull'esito binario: logit P(Y = 1) = β0 + β1 · zP + β2 · zT + β3 · zT². Stesso spazio di
  P26, T20 e T20²: le predizioni non cambiano.
- Massima verosimiglianza **senza penalità**, Newton–IRLS in numpy. Partenza β0 = logit(media di Y nel training),
  altri 0. Arresto quando il massimo |Δβ| < 10⁻¹⁰; al massimo 100 iterazioni.
- Ripiego deciso ora: se non converge o un |β| supera 30, penalità L2 con λ = 1 su β1 … β3 (non su β0). Il README
  dice in quali giri è successo.
- Punteggio f₃(d) = predittore lineare (stesso ordinamento della probabilità stimata). Per le settimane si usa la
  probabilità stimata.
- Niente effetto dell'anno: quello della stagione di prova non è noto. Il modello NB1 con anno casuale degli autori
  non si replica.
- Logistica e non conteggi: l'esito di questa prova è binario.

### (3′) Come (3), con le colonne del CSV (sensibilità S5)

`rollP_26` e `rollT_20` del CSV, che includono il giorno d, come nel codice degli autori. È una replica
associativa. Ha un giorno di informazione in più degli altri modelli, quindi non entra in nessuna domanda.

### Fattori dell'indice che restano fuori

| Fattore in `js/model.js` | Qui | Perché |
|---|---|---|
| Habitat (`habitatScore`) e quota (`elevationFit`) | 1 | Un solo sito: sarebbero costanti, non cambiano l'ordinamento. |
| Umidità del suolo (`moist`, `soilm` da i−3 a i−1) | escluso (1) | Il CSV non ha il suolo. Nell'app senza suolo l'indice è «Non calcolabile»: qui si misura solo una parte dell'indice. |
| Gelo (`frost`, `tmin` da i−4 a i) | escluso (1) | Niente Tmin. **Interpretazione:** a novembre l'app potrebbe applicare 0,35 nei giorni con Tmin sotto −1 °C; qui no. |
| Caldo (`heat`, `tmax` da i−3 a i−1) | escluso (1) | Niente Tmax. |
| Shock termico | escluso (1) | Nella 2.0.0 usa la `tmean` e sarebbe calcolabile. Ma la 2.1.0 lo sostituisce con la temperatura del suolo, che manca, e la valutazione definisce il confronto senza shock. |
| Arrotondamento `Math.round(clamp(raw) · 100)` | non nel principale | Si usa il prodotto continuo. L'arrotondamento dell'app è la sensibilità S7. |

**Fatto verificato:** la seconda tornata (versione 2.1.0, modifiche non ancora committate nel worktree locale
`/home/user/fronda-b`, `git diff -- js/model.js js/species.js` del 16/10/2026) cambia solo lo shock: versione,
parametri e codice dello shock, `inputQuality`, `explain`, e aggiunge `soilShock` a edulis. Pioggia, temperatura,
stagione e i parametri `topt`, `tsd`, `lag`, `eref`, `months` di edulis restano identici.
**Interpretazione:** se la 2.1.0 arriva così, l'esito vale anche per lei, per la parte confrontata.

## 7. Validazione

- **Una stagione esclusa alla volta:** 10 giri, 2015 … 2024.
- In ogni giro (0), (2b) e (3) si stimano solo sulle righe di training dell'insieme d'analisi. (1) e (2) non
  stimano nulla.
- Le predizioni sulla stagione esclusa si raccolgono: un vettore fuori campione per modello, sugli stessi giorni.
- Ogni analisi (principale, S1, S2) ridefinisce l'insieme di giorni: stima e valutazione usano solo quello.
- Nessuna scelta si fa guardando la stagione di prova. Finestre, h, σ e predittori sono fissati qui.
- **Interpretazione:** il giro usa anche stagioni successive per prevedere quelle precedenti. Misura quanto
  l'ordinamento regge da una stagione all'altra, non una previsione in avanti. E il meteo è quello osservato
  (E-OBS), non una previsione come nell'app.

## 8. Metriche e intervalli

Ogni metrica si calcola sull'insieme fuori campione delle 10 stagioni (**principale**) e su ogni stagione da sola
(descrittiva).

- **PR-AUC = average precision a gradini.** Valori distinti del punteggio t₁ > t₂ > … > t_m. Per ogni t_j:
  TP_j e FP_j contano i positivi e i negativi con punteggio ≥ t_j; P_j = TP_j / (TP_j + FP_j);
  R_j = TP_j / N_pos; R_0 = 0. **AP = Σ_j (R_j − R_{j−1}) · P_j.** I pari merito formano un solo gradino. È la
  definizione di `average_precision_score` di scikit-learn, senza interpolazione trapezoidale.
- **Riferimento della PR-AUC:** la prevalenza π dello stesso insieme (sezione 3.6). Un ordinamento a caso ha AP
  attesa vicina a π. Il README riporta sempre AP e π affiancate.
- **ROC-AUC:** statistica di Mann–Whitney, i pari merito fra positivo e negativo valgono ½. Con i ranghi medi:
  (somma dei ranghi dei positivi − N_pos · (N_pos + 1) / 2) / (N_pos · N_neg).
- **Spearman:** correlazione di Pearson fra i ranghi medi del punteggio e quelli di `Mnb`, zeri compresi. Non
  definita se una delle due variabili è costante.
- **Secondaria descrittiva:** la media non pesata delle ROC-AUC per stagione, cioè l'ordinamento dentro la stagione.
  Nel bootstrap è la media sulle stagioni estratte, ripetizioni comprese.
- Per stagione: se una stagione non ha positivi o non ha negativi, le sue metriche sono «non definite». Il 2016 ha un
  solo giorno positivo nel principale: le sue metriche si riportano, segnate come instabili.

**Bootstrap per stagione.**

- B = 5000 repliche, `numpy.random.default_rng(20261016)`. Ogni analisi riparte dallo stesso seme.
- Ogni replica estrae 10 stagioni con reinserimento (`rng.integers(0, 10, 10)` sulle stagioni in ordine di anno) e
  concatena le loro righe fuori campione, ripetizioni comprese.
- Stesse estrazioni per tutti i modelli: le differenze sono appaiate.
- Intervallo percentile al 95%: percentili 2,5 e 97,5 di `numpy.percentile` (metodo `linear`).
- Le repliche senza positivi o senza negativi si scartano e si contano.
- Le predizioni non si ristimano dentro le repliche (limite in sezione 13).
- Stima puntuale = metrica sull'insieme originale. Si riportano anche le differenze fra modelli con il loro
  intervallo.

**Controllo dei revisori (non negli script consegnati):** AP, ROC-AUC e Spearman si possono confrontare con
`average_precision_score`, `roc_auc_score` di scikit-learn e `spearmanr` di scipy.

## 9. Domande e criteri di lettura (decisi ora)

Si leggono **solo sull'analisi principale**: periodo 05/08–21/11, giorni, serie con ricostruzione.

| | Ipotesi | Differenza | Metrica che decide | Secondaria |
|---|---|---|---|---|
| (a) | La parte meteo dell'indice (1) ordina meglio della climatologia (0) | (1) − (0) | AP | ROC-AUC |
| (b) | σ 2,0 (2) ordina meglio di `tsd` 3,5 (1) | (2) − (1) | AP | ROC-AUC |
| (b′) | Come (b), con σ stimato fuori dalla stagione di prova (2b) | (2b) − (1) | AP | ROC-AUC |

**Regola per ogni riga**, sull'intervallo bootstrap al 95% della differenza:

- tutto sopra 0: «ordina meglio, su questi dati»;
- tutto sotto 0: «ordina peggio, su questi dati»;
- contiene 0: «non distinguibile su questi dati».

La ROC-AUC si legge con la stessa regola e si riporta accanto. Se AP e ROC-AUC danno verdetti diversi, il README
riporta entrambi; il titolo segue l'AP.

**Lettura congiunta di (b) e (b′).**

- (b) e (b′) sopra 0: la curva più stretta ordina meglio anche con σ stimato fuori campione.
- (b) sopra 0, (b′) no: il vantaggio non è dimostrato fuori campione. Dipende almeno in parte dall'aver stimato σ
  sulle stesse stagioni.
- (b) non sopra 0: nessun vantaggio dimostrato per σ 2,0.
- In ogni caso nessuna conclusione vale per le faggete del Reatino, e D5 resta di Matteo.

**(c) Riferimento.** (3) contro (0) e (3) contro (1), con gli intervalli, **senza verdetto**. Dice quanto ordina un
modello stimato con la stessa informazione dell'indice.

- Nessuna correzione per confronti multipli: le domande sono due, (a) e (b) con (b′); il resto è descrittivo.
- Il README riporta tutti i risultati preregistrati, anche quelli sfavorevoli all'indice.

## 10. Sensibilità (elenco chiuso, solo descrittive)

Stesse metriche e stessi intervalli, senza verdetto. Se una sensibilità dà un verdetto diverso dal principale, il
README lo scrive in chiaro.

| | Che cosa cambia | Modelli |
|---|---|---|
| S1 | Periodo di controllo 01/08–30/11 (1220 giorni) | (0), (1), (2), (2b), (3) |
| S2 | Solo i giorni con finestre nei valori grezzi, 31/08–21/11 (830 giorni) | (0), (1), (2), (2b), (3) |
| S3 | Blocchi settimanali, periodo principale (sezione 4.4) | (0), (1), (2), (2b), (3) |
| S4 | Climatologia con h = 3 e h = 14 | (0) |
| S5 | (3′): colonne del CSV che includono il giorno d | (3′) |
| S6 | Componenti di (1): solo stagione S; solo pioggia; solo temperatura; pioggia × temperatura senza stagione | componenti |
| S7 | (1) arrotondato come nell'app: `Math.round(f₁ · 100)` | (1) |

Ogni altra analisi fatta dopo aver visto i risultati è esplorativa: va nelle «Deviazioni» con l'etichetta
«esplorativa».

## 11. Riproducibilità

**File e ruoli.**

- `scarica.py` (solo libreria standard): scarica l'archivio dall'URL della sezione 2.1 in `dati/`. Controlla
  dimensione, MD5 e SHA-256 dell'archivio. Estrae solo il CSV e ne controlla lo SHA-256. Non esegue nulla
  dell'archivio. Si ferma se un controllo fallisce.
- `fattori.mjs` (Node ≥ 22): importa `../../js/model.js` e `../../js/species.js`. Legge le serie da `dati/` e scrive
  i fattori in `dati/`.
- `valuta.py` (`python3 -I`, solo libreria standard e numpy): fa i controlli, chiama `node fattori.mjs`, stima,
  valuta e scrive i risultati.

**Controlli bloccanti di `valuta.py`, prima di qualsiasi metrica:**

1. SHA-256 del CSV.
2. Numeri dell'audit: 3660 righe, 1220 date; blocco All con 155 positivi, 1065 zeri, 1905 carpofori.
3. Ricostruzione dei giorni prima del 1/8 (sezione 5).
4. `MODEL_VERSION` = 2.0.0 e SHA-256 dei moduli congelati (commit `2da612f`):
   - `js/model.js` `3d4785be55b77fe590a7892db7a4cbc2191d971a5b7877e41022456f634b6fcd`
   - `js/species.js` `d43868bd15e202e57bc0b49ff5c404d985d714543e383d5af59e0ab86c5f3cc7`
   - `js/botanical-model.js` (importato da `model.js`) `75466dcd22524be0472443bb1f54559c4401d8b88dbc3de0075cf5ff5e558a64`
5. Allineamento fra JavaScript e Python, giorno per giorno: `t20`, `r30` ed `effRain` di `model.js` uguali alle
   medie e somme ricalcolate in Python (tolleranza 10⁻⁹); `temp` uguale a exp(−½ · ((t20 − 13) / tsd)²)
   (tolleranza 10⁻¹²); `seasonWeight` vale 0,8 il 15/08, 1 il 15/09 e 0,4 il 15/11.
6. Per i giorni di S2, i fattori calcolati su una serie senza i giorni ricostruiti coincidono con quelli del
   principale.

**Determinismo.**

- Seme fisso, ordini fissi (stagione, poi data), JSON con chiavi ordinate.
- Due esecuzioni consecutive devono dare file di risultati identici byte per byte. Lo SHA-256 dei due file va nel
  README.
- Il README registra versioni di Python, numpy, Node e sistema operativo, commit, hash dei dati e dei moduli.

Se un modulo congelato cambia (per esempio dopo l'unione della 2.1.0), l'esecuzione si ferma. Proseguire è una
deviazione, ammessa solo dopo aver verificato con `git diff` che pioggia, temperatura e stagione sono invariate.

## 12. Deviazioni

- Questo file non si riscrive dopo il commit.
- Ogni cambiamento al protocollo va nella sezione «Deviazioni» del README, con: data; che cosa cambia; perché; se
  è stato deciso prima o dopo aver visto un risultato; effetto sull'esito.
- Quando si può, il README riporta sia il risultato preregistrato sia quello con la deviazione.
- Gli errori materiali di questo file si correggono lì, non qui.

## 13. Limiti noti in anticipo

- **Zeri** non osservati come tali (sezione 4.3). Possibile legame fra pioggia e visite.
- **Un solo sito**, faggeta di pianura, 10 stagioni, abbondanza molto variabile fra anni (2016: 4 carpofori). Le
  metriche sul complesso mescolano l'ordinamento dentro la stagione e quello fra stagioni.
- **Meteo E-OBS a 0,1°**, interpolato: non è misurato nel bosco. Versione non dichiarata dagli autori.
- **(1) non è del tutto indipendente da questi dati.** Il centro termico 13 °C e la finestra di 20 giorni
  dell'indice vengono da questo studio, stimati su tutte le stagioni: (1) parte avvantaggiato. Latenza, innesco
  8 mm, r30 ed `eref` sono euristiche non tratte da questi dati.
- **Le finestre di 20 e 26 giorni di (3)** sono state scelte dagli autori con l'AIC su tutte le stagioni:
  piccolo vantaggio anche per (3).
- **Il peso stagionale dell'indice** è il calendario pensato per il Reatino, non stimato qui. La climatologia è
  stimata su questo sito: sulla parte stagionale (0) parte avvantaggiata.
- **Fattori mancanti:** suolo, gelo, caldo e shock (sezione 6). Si misura una parte dell'indice, non l'indice
  completo dell'app.
- **Bootstrap con predizioni fisse:** non conta la variabilità della stima di (0), (2b) e (3). Con 10 stagioni gli
  intervalli percentili possono anche essere un po' troppo stretti (**Interpretazione**).
- Nessuna soglia, nessuna calibrazione, nessuna probabilità. AP e ROC-AUC misurano l'ordinamento, non
  l'affidabilità di un valore.

## 14. File previsti

In `tools/benchmark-bielefeld/`:

- `preregistrazione.md` (questo file, commit prima degli script);
- `.gitignore` con `dati/`;
- `scarica.py`, `fattori.mjs`, `valuta.py`;
- `README.md` con esiti, versioni, hash, «Deviazioni» e la citazione E-OBS;
- `dati/`, esclusa da git: archivio, CSV, serie, fattori, predizioni e risultati per giorno.

Ringraziamento richiesto da E-OBS, da riportare nel README: «We acknowledge the E-OBS dataset and the data providers
in the ECA&D project (https://www.ecad.eu)». Cornes, R., G. van der Schrier, E.J.M. van den Besselaar, and P.D.
Jones. 2018: An Ensemble Version of the E-OBS Temperature and Precipitation Datasets, J. Geophys. Res. Atmos., 123.
doi:10.1029/2017JD028200.
