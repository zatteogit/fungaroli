# Prova offline dei porcini: preregistrazione

Prima versione scritta il 16 ottobre 2026, **prima di qualsiasi risultato** (commit `fc2e574`). Rivista lo stesso
giorno, **ancora prima di qualsiasi risultato**, dopo i rilievi di due revisori indipendenti: elenco, esito e motivi
nella sezione 15. Ramo `lavoro-benchmark`, commit di partenza `2da612f`.
Riferimento: `docs/ipotesi/valutazione-modello-v3.md`, sezione 4.5.

**Che cosa è stato guardato finora.** Solo la struttura dei dati (sezione 3). Non è stato calcolato nessun legame fra
predittori ed esito: niente AUC, correlazioni, grafici, medie condizionate all'esito, niente modelli stimati sui dati
reali. Nessun fattore dell'indice è stato calcolato sui dati reali: `js/model.js` è stato importato solo su serie
fittizie. Per la revisione si sono aggiunti tre tipi di controllo, sempre senza legare predittori ed esito:

- solo esito: date dei giorni con ritrovamento e confronto fra i blocchi All, Site_A e Site_B (sezioni 3.2 e 4.2);
- solo predittori: le medie del giorno prima, ricalcolate dalla serie grezza, contro le colonne del CSV (sezione 11);
- simulazioni su dati sintetici e prove di `js/model.js` su serie fittizie (sezione 15). Gli script stanno nello
  scratchpad della sessione, fuori dal repository; le formule usate sono scritte qui.

**Regola.** La prima versione diceva che il file non si modifica dopo il commit. La revisione della sezione 15 è
l'unica eccezione: è fatta prima di eseguire `valuta.py` e prima di qualsiasi risultato. La prima versione resta
leggibile con `git show fc2e574:tools/benchmark-bielefeld/preregistrazione.md`. Dopo il commit di questa revisione il
file non si modifica più, nemmeno per errori materiali. Ogni cambiamento va nella sezione «Deviazioni» del README
(sezione 12).

Legenda: **Fatto verificato** = controllato oggi su dati, codice o fonte. **Interpretazione** = lettura nostra di un
fatto. **Ipotesi** = da mettere alla prova o non verificabile.

## 1. Scopo e confini

Domanda: la parte meteo dell'indice di Fronda per *Boletus edulis* ordina bene i giorni con ritrovamenti, sui dati
che l'indice stesso cita (Brejon Lamartinière & Hoffman)?

- È una prova di **ordinamento** dei giorni **dentro la stagione** (sezione 8). Non stima una probabilità e non
  calibra nulla. L'indice resta sperimentale (0–10) e non è una probabilità.
- Non trasferisce nulla al Reatino. I dati vengono da un'area di boschi prevalentemente di faggio vicino a Bielefeld:
  più siti di raccolta sommati nel blocco All (da 15 a 29 attivi secondo il testo dello studio; dato non verificabile
  sul CSV), una sola serie meteo E-OBS per tutti, 10 stagioni.
- **Nessun esito cambia l'app.** `js/model.js` e `js/species.js` non si toccano. Un eventuale cambio di `tsd` di
  edulis è la decisione D5 di Matteo, non di questa prova.
- Le unità indipendenti sono 10 stagioni: gli intervalli saranno larghi (sezione 9.3). «Non distinguibile» è un esito
  valido, non un fallimento, e non vuol dire «uguali».

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

Il meteo del CSV viene da E-OBS a 0,1°. Gli autori l'hanno estratto con interpolazione bilineare sul centroide dei
punti di raccolta (codice R, righe 22–24 e 46–50): una sola serie per tutta l'area. Pagine lette:

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
- All somma più siti (codice R, righe 78–82): All = tutti i record; Site_A = siti 3 e 23; Site_B = sito 6.
  All ≥ Site_A + Site_B in tutte le 1220 date; 1077 carpofori su 1905 stanno fuori da A e B (controllo della
  revisione, solo esito).

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

**Ipotesi** (non verificabile con l'archivio): le righe di `Climate.csv` di giugno e luglio sono giorni consecutivi,
senza buchi né doppioni. Il codice R (righe 59–73) calcola `rollmean` per anno sulle righe ordinate per data, non sul
calendario: l'identità vale riga per riga. Un giorno mancante sposterebbe le date dei valori ricostruiti senza far
fallire nessun controllo, perché anche la concordanza delle stime e il ricalcolo delle 24 colonne lavorano riga per
riga. `Climate.csv` non è nell'archivio. I valori mancanti sono esclusi: le medie di agosto, che coprono luglio, non
hanno NA (3.2). Le righe mancanti no. La sensibilità S2 non dipende da questa ipotesi.

**Correzione** rispetto a `audit-porcini.md` riga 99, che scriveva: «non si possono ricostruire integralmente
dall'archivio i primi 19 valori/anno della media T20 e i primi 25 della P26». Sotto l'ipotesi qui sopra si
ricostruiscono, per identità aritmetica.

### 3.5 Giorni con le finestre giornaliere complete

`weatherFactors` (in `js/model.js`) usa per il giorno i la pioggia giornaliera da i−30 a i−1 (r30; la finestra di
latenza i−21 … i−7 sta dentro) e la temperatura media da i−20 a i−1 (t20).

| Serie disponibile | Primo giorno completo | Giorni per stagione 01/08–30/11 | Giorni per stagione 05/08–21/11 |
|---|---|---:|---:|
| Solo valori grezzi del CSV (dal 1/8) | 31/8 | 92 | 83 |
| Con i 34 giorni ricostruiti (dal 28/6) | 1/8 | 122 | 109 |

Attenzione: `sum` e `mean` di `js/model.js` saltano i valori mancanti senza segnalarlo, `?? 0` tratta un `null` come
0 nel massimo dell'evento, e gli indici delle finestre si tagliano a 0. Su una finestra incompleta il fattore verrebbe
calcolato lo stesso, sbagliato. Per questo servono una regola esplicita (sezione 5) e i controlli della sezione 11.

### 3.6 Prevalenza dell'esito e AP di un ordinamento a caso (riferimenti della PR-AUC)

| Insieme di giorni (blocco All) | Giorni | Positivi | Prevalenza π | AP attesa a caso | Carpofori |
|---|---:|---:|---:|---:|---:|
| Principale 05/08–21/11 | 1090 | 155 | 0,1422 | 0,1474 | 1905 |
| Controllo 01/08–30/11 | 1220 | 155 | 0,1270 | 0,1318 | 1905 |
| Sensibilità «solo valori grezzi» 31/08–21/11 | 830 | 135 | 0,1627 | 0,1690 | 1619 |
| Settimane fisse, periodo principale (sezione 4.4) | 150 settimane | 65 | 0,4333 | 0,4508 | — |

Giorni positivi per stagione nel periodo principale: 2015: 12; 2016: 1; 2017: 16; 2018: 4; 2019: 16; 2020: 27;
2021: 18; 2022: 15; 2023: 25; 2024: 21. Tutti i 130 giorni fuori dal periodo principale sono zeri (come
nell'audit). Nel sottoinsieme «solo valori grezzi» il 2016 non ha positivi.

L'AP attesa a caso si calcola in forma esatta da N e R (sezione 8.2). Per stagione è molto sopra π: 2016 0,0484
(π 0,0092), 2018 0,0748 (π 0,0367), 2020 0,2775 (π 0,2477). Per l'AP stratificata del principale, media pesata per
i positivi, vale 0,2111; in S1 0,1900. La ROC-AUC di un ordinamento a caso vale 0,5.

## 4. Esito, unità e periodi

### 4.1 Unità ed esito

- **Unità:** il giorno d della stagione y (y = 2015 … 2024), nel blocco **All**.
- **Esito:** Y = 1 se `Mnb > 0`, altrimenti 0. Si chiama «giorno con ritrovamento registrato».
- I conteggi `Mnb` servono per la correlazione di Spearman e per stimare σ in (2b). L'esito valutato resta binario.
- Site_A e Site_B non si usano, nemmeno come sensibilità: sono sottoinsiemi di All con lo stesso meteo, non siti
  indipendenti (audit, Fatto verificato in 3.2).

### 4.2 Periodi

- **Principale:** 05/08–21/11, l'intervallo del testo dello studio. 109 giorni × 10 stagioni = 1090 giorni.
- **Controllo:** 01/08–30/11, l'intervallo del codice R. 1220 giorni (sensibilità S1).

**Fatto verificato** (solo esito): il periodo principale va dal primo giorno dell'anno con un ritrovamento nelle 10
stagioni (05/08, nel 2023) all'ultimo (21/11, nel 2020). L'insieme di giorni dipende quindi dall'esito, anche delle
stagioni che fanno da prova, e toglie per costruzione i giorni a zero ai bordi. **Interpretazione:** non è stato
scelto per favorire un modello; l'effetto sui confronti non è noto. S1 è l'unico insieme di giorni che non dipende
dall'esito. Se S1 contraddice il principale (sezione 10), il README lo scrive accanto al verdetto.

### 4.3 Giorni senza visita e sforzo

**Fatto verificato** (codice R, righe 78–92): `Mnb` conta i record per data; le date senza record ricevono 0.
Nel CSV non ci sono visite, durata, osservatori né siti attivi. Secondo il testo dello studio (riportato
dall'audit, riga 37) i siti attivi erano visitati 2–4 volte a settimana e il loro numero è cresciuto da 15 a 29.
Questi due dati non sono verificabili sul CSV.

- `Mnb = 0` vuol dire «nessun ritrovamento registrato», non «visita senza ritrovamenti».
- Non si creano zeri, non si scartano giorni, non si stima la rilevabilità. Tutti i giorni del periodo entrano con
  la loro etichetta.
- **Interpretazione:** gli zeri mescolano giorni senza visita e visite a vuoto. Il rumore pesa su tutti i modelli.
  Ma se le visite fossero più frequenti dopo la pioggia, ogni modello con la pioggia riceverebbe un vantaggio che
  misura il comportamento dei cercatori, non la fruttificazione. Il README lo ricorderà accanto a ogni esito.
- **Interpretazione:** con più siti attivi, la quota di giorni con ritrovamento può crescere fra le stagioni per lo
  sforzo, non per il meteo. Per questo le metriche che decidono confrontano solo giorni della stessa stagione
  (sezione 8). Restano possibili cambi di sforzo dentro una stagione.

### 4.4 Analisi secondaria per settimane (S3)

Una settimana con 2–4 visite è più vicina a «cercato e non trovato» di un giorno singolo (**Interpretazione**).

- Blocchi fissi di 7 giorni consecutivi dentro ogni stagione, a partire dal 05/08. 15 blocchi per stagione; gli
  ultimi 4 giorni (18/11–21/11) restano fuori. 150 blocchi, 65 positivi.
- Esito del blocco: almeno un giorno con `Mnb > 0`.
- Punteggio del blocco: media dei punteggi giornalieri fuori campione, sulla scala propria di ogni modello
  (frequenza per (0), prodotto dei fattori per (1), (2), (2b), probabilità stimata per (3)).
- Spearman sul totale settimanale dei carpofori. I modelli non si ristimano a livello settimanale.
- Metriche come nel principale: dentro la stagione (15 blocchi per stagione), sezione 8.

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

1. È un'identità verificata a 10⁻¹¹: niente dati nuovi, niente imputazioni (con l'ipotesi di 3.4 sulle righe).
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
- Stimati sulle m stagioni di training di ogni giro: (0), (2b) e (3). m = 9 nella validazione (sezione 7), m = 8 nel
  jackknife (sezione 8.4).

### (0) Climatologia stagionale

Per la stagione esclusa k e lo scostamento o:

`c_k(o) = (positivi delle m stagioni di training con o′ in A e |o′ − o| ≤ h) / (m · numero di o′ in A con |o′ − o| ≤ h)`

- A = scostamenti dell'insieme d'analisi (principale: 4 … 112).
- **h = 7**: finestra di 15 giorni, troncata ai bordi del periodo. Nessun'altra lisciatura.
- Sensibilità S4: h = 3 e h = 14.
- **Fatto verificato** (algebra): con Y(o) i positivi di tutte le stagioni nella finestra e Y_k(o) quelli della
  stagione esclusa, nella validazione c_k(o) = (Y(o) − Y_k(o)) / (9 · n_o). Fra due stagioni, allo stesso o, il
  punteggio più alto va a quella con meno positivi: (0) è penalizzato per costruzione nelle metriche sul complesso,
  non in quelle dentro la stagione (sezione 8).
- **Fatto verificato** (algebra): per o da 11 a 105 (950 giorni del principale) il denominatore è sempre
  9 · 15 = 135. c_k ha quindi pochi valori distinti e molti pari merito: l'AP ne tiene conto (sezione 8.1).

### (1) Parte meteo dell'indice, `tsd` 3,5

`fattori.mjs` importa `js/model.js` e `js/species.js` senza modificarli. Per ogni giorno:

- `s = { p: Precip giornaliera, tmean: Temp giornaliera, dates: date "AAAA-MM-GG" }`, senza `soilm`, `tmin`,
  `tmax`, `soilt`;
- `w = weatherFactors(edulis, s, i)` e `S = seasonWeight(edulis.months, "AAAA-MM-GG")`, con la stringa `date`
  della riga del CSV;
- **punteggio f₁(d) = S × w.rain × w.temp**, continuo, senza arrotondamento.

Profilo edulis letto da `js/species.js`: `topt` 13, `tsd` 3,5, `lag` [7, 21], `eref` 30, pesi mensili
0 / 0 / 0 / 0 / 0,1 / 0,4 / 0,6 / 0,8 / 1 / 1 / 0,4 / 0 da gennaio a dicembre. Dentro `weatherFactors`
(versione 2.0.0, `js/model.js` righe 71–86):

- pioggia: effRain = somma da i−21 a i−7; maxEvent = massimo giornaliero da i−21 a i−7; r30 = somma da i−30 a i−1;
  innesco trig = max(min(maxEvent / 8; 1); min(effRain / 15; 1)): scatta anche senza un evento di 8 mm, con 15 mm
  diffusi nella finestra di latenza;
  **rain = [0,6 · (1 − e^(−effRain/30)) + 0,4 · (1 − e^(−r30/60))] · (0,5 + 0,5 · trig)**, con 60 = 2 · `eref`;
- temperatura: **temp = exp(−½ · ((t20 − 13) / 3,5)²)**, con t20 = media da i−20 a i−1.

Peso stagionale (`js/model.js` righe 28–37): interpolazione lineare fra i giorni 15 dei mesi (ore 12 UTC), con i
pesi mensili. Prima del 15/8 entra luglio (0,6), dopo il 15/11 entra dicembre (0). **Fatto verificato** su `js/model.js`
con le sole date: 01/08 0,709677; 05/08 0,735484; 15/08 0,8; 15/11 0,4; 21/11 0,32; 30/11 0,2, uguali nel 2015,
nel 2016 e nel 2020. Nel principale S va quindi da circa 0,74 (05/08) a 1 (dal 15/9 al 15/10) e scende a 0,32 (21/11).

f₁ sta fra 0 e 1. Corrisponde all'indice 0–10 diviso per 10, prima dell'arrotondamento e con gli altri fattori a 1.
**Non è una probabilità.** `scoreSpecies` non si chiama: senza suolo moltiplicherebbe per `moist = null`, cioè 0.

### (2) Come (1), con σ = 2,0

Una copia in memoria `{ ...edulis, tsd: 2 }`. `topt` resta 13: D5 riguarda solo l'ampiezza.

**Provenienza di 2,0.** Valore dichiarato in `valutazione-modello-v3.md`, riga 103 (D5): «σ ≈ 2,0», da
`tools/ipotesi/valutazione-v3/impianto-scientifico/sigma_brejon.py`. Il periodo di stima non è registrato.

- **Fatto verificato** (lettura del codice): lo script stima σ su **tutte e 10 le stagioni**, comprese quelle che qui
  fanno da prova, in due periodi (01/08–30/11 e 05/08–21/11). Stampa una riga per periodo, con σ arrotondato a due
  decimali. Nel repository non c'è nessuna uscita registrata.
- **Fatto verificato** (aritmetica): la riga 103 dice che a ±4 °C dall'ottimo «i dati danno 0,14». Con 0,14
  arrotondato a due decimali, σ sta fra circa 2,00 e 2,04.
- **Non verificato:** quale dei due periodi dia 2,0. Verificarlo oggi vorrebbe dire calcolare un legame con l'esito.
  `valuta.py` riporterà nel README σ non arrotondato nei due periodi (sezione 11, controllo 7).
- (2) resta fisso a 2,0, come chiede la valutazione. (2) parte avvantaggiato, perché 2,0 viene anche dalle stagioni di
  prova. Per questo c'è (2b), stimato nello stesso periodo dell'analisi.

### (2b) Come (1), con σ ristimato a ogni giro

Su ogni training si ripete la procedura di `sigma_brejon.py`, portata in numpy:

- GLM di Poisson sui conteggi `Mnb`: log μ = a_anno + bP · rollP_26 + bT · rollT_20 + bT2 · rollT_20²;
- effetti fissi per anno; colonne del CSV così come sono (finestra che include d); giorni dell'insieme d'analisi,
  quindi lo stesso periodo dell'analisi (05/08–21/11 nel principale, 01/08–30/11 in S1);
- **le stagioni di training con somma di `Mnb` = 0 si escludono dal GLM.** È un equivalente esatto: nella Poisson a
  effetti fissi una stagione senza conteggi ha effetto dell'anno che tende a −∞ e non dà informazione sulle pendenze.
  Succede solo in S2, dove il 2016 non ha positivi. Il README dice in quali giri;
- IRLS come nello script: partenza a_anno = log(max(media di Mnb; 10⁻³)), altri coefficienti 0; termine 10⁻⁸ · I;
  al massimo 100 iterazioni. **Arresto quando il massimo |Δ| delle sole pendenze (bP, bT, bT2) è < 10⁻⁹.**
- Se le pendenze non convergono entro 100 iterazioni: σ_k = 3,5, cioè il giro coincide con (1) e la sua differenza
  in (b′) vale 0. Il giro è segnalato nel README. Regola scelta perché spinge verso «nessuna differenza».

Poi:

- σ_k = √(−1 / (2 · bT2)) se bT2 < 0. Se bT2 ≥ 0, σ_k = +∞ e il fattore temperatura vale 1.
- f₂b(d) = come (1) con `tsd` = σ_k e `topt` 13, sempre calcolato con `js/model.js`.
- σ_k passa da `valuta.py` a `fattori.mjs` come stringa: il `repr` Python del numero, oppure `"inf"`. `fattori.mjs`
  la converte con `Number()` o in `Infinity` e si ferma su qualsiasi altro valore. Motivo: in JSON +∞ non esiste
  (`json.dumps` scrive `Infinity`, che `JSON.parse` rifiuta; un `null` darebbe temp = 0, un NaN temp = NaN).
- Il README riporta σ_k, il centro stimato −bT / (2 · bT2) (solo descrittivo), iterazioni, convergenza e stagioni
  escluse di ogni giro, nel principale e in S1.

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
  non si replica. L'intercetta segue la prevalenza del training: come (0), (3) è penalizzato per costruzione nelle
  metriche sul complesso, non in quelle dentro la stagione.
- Logistica e non conteggi: l'esito di questa prova è binario.

### (3′) Come (3), con le colonne del CSV (sensibilità S5)

`rollP_26` e `rollT_20` del CSV, che includono il giorno d, come nel codice degli autori. È una replica
associativa. Ha un giorno di informazione in più degli altri modelli, quindi non entra in nessuna domanda.

### Fattori dell'indice che restano fuori

| Fattore in `js/model.js` | Qui | Perché |
|---|---|---|
| Habitat (`habitatScore`) e quota (`elevationFit`) | 1 | All somma più siti con una sola serie meteo; habitat e quota per sito non sono nel CSV. Sarebbero costanti e non cambiano l'ordinamento. |
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
- Ogni giro produce le predizioni di una sola stagione. Le metriche che decidono confrontano solo giorni della stessa
  stagione (sezione 8): le differenze fra giri (livello della climatologia, intercetta di (3), σ_k di (2b)) non
  entrano nel confronto.
- Ogni analisi (principale, S1, S2) ridefinisce l'insieme di giorni: stima e valutazione usano solo quello.
- Nessuna scelta si fa guardando la stagione di prova. Finestre, h, σ, predittori e δ (sezione 9) sono fissati qui.
- **Interpretazione:** il giro usa anche stagioni successive per prevedere quelle precedenti. Misura quanto
  l'ordinamento regge da una stagione all'altra, non una previsione in avanti. E il meteo è quello osservato
  (E-OBS), non una previsione come nell'app.

## 8. Metriche e intervalli

### 8.1 Average precision (PR-AUC) con i pari merito

- Per un insieme di giorni con N giorni e R positivi, l'AP è l'**AP attesa su tutte le rotture casuali dei pari
  merito**, in forma esatta (McSherry & Najork 2008, ECIR, LNCS 4956). È l'equivalente del ½ della ROC-AUC.
- Calcolo: i valori distinti del punteggio, dal più alto. Per un gruppo di n giorni a pari merito, con a positivi,
  preceduto da TP₀ positivi e N₀ giorni, il contributo è
  Σ_{p=1…n} (a / n) · [TP₀ + 1 + (p − 1) · (a − 1) / (n − 1)] / (N₀ + p), con (a − 1) / (n − 1) = 0 se n = 1.
  **AP = (somma dei contributi) / R.** Senza pari merito coincide con `average_precision_score` di scikit-learn.
- Motivo: l'AP a gradini della prima versione dà a ogni gruppo di pari merito la precisione di fine gruppo. Non è
  neutra: penalizza i punteggi con molti pari merito, come (0), S6 («solo stagione») e S7 (sezione 15, rilievo 2).
- Il README riporta quanti valori distinti ha ogni punteggio.

### 8.2 Metriche che decidono: dentro la stagione

- **AP stratificata = Σ_k R_k · AP_k / Σ_k R_k.** AP_k è l'AP (8.1) della stagione k sui suoi giorni fuori campione,
  R_k i suoi positivi. È la media, su tutti i giorni positivi, della precisione dentro la propria stagione. Una
  stagione senza positivi ha peso 0.
- **ROC-AUC stratificata** = statistica di Mann–Whitney sulle sole coppie positivo–negativo della stessa stagione;
  i pari merito valgono ½. Equivale a Σ_k R_k · N_k · AUC_k / Σ_k R_k · N_k, con N_k i negativi della stagione.
- **Spearman dentro la stagione** = Σ_k R_k · ρ_k / Σ_k R_k. ρ_k è la correlazione di Pearson fra i ranghi medi del
  punteggio e quelli di `Mnb`, zeri compresi, nella stagione k. Stagioni con `Mnb` o punteggio costante: escluse e
  contate.
- **Riferimento a caso** per ogni AP: l'AP attesa di un ordinamento a caso, cioè di un punteggio costante, in forma
  esatta: E[AP](N, R) = (1 / N) · Σ_{p=1…N} [1 + (p − 1) · (R − 1) / (N − 1)] / p. Per l'AP stratificata si usa la
  media pesata per R_k degli E[AP](N_k, R_k). Valori in 3.6. π si riporta accanto, ma non è il riferimento: per
  stagione e per settimane l'AP a caso sta ben sopra π. Per la ROC-AUC il riferimento è 0,5.
- **Nessun confronto di AP fra insiemi di giorni diversi** (principale, S1, S2, settimane, singole stagioni).

### 8.3 Metriche secondarie (descrittive, senza verdetto)

- **Sul complesso** (le 10 stagioni in un'unica classifica): AP, ROC-AUC e Spearman come nella prima versione, con
  l'AP di 8.1. Avvertenza scritta accanto a ogni valore: (0) e (3) sono penalizzati per costruzione (6, (0) e (3));
  (2b) ha una scala diversa in ogni giro; tutte mescolano lo sforzo, cresciuto fra le stagioni (4.3).
- **Per stagione:** AP_k con il suo riferimento a caso, ROC-AUC_k, ρ_k. Se una stagione non ha positivi o non ha
  negativi, le sue metriche sono «non definite». Il 2016 ha un solo giorno positivo nel principale: le sue metriche
  si riportano, segnate come instabili.
- **Fra stagioni:** tabella di 10 righe con positivi, carpofori e punteggio medio della stagione per (1) e (2), che
  non stimano nulla, più la correlazione di Spearman sulle 10 stagioni fra punteggio medio e positivi. Senza
  verdetto, ricordando lo sforzo cresciuto da 15 a 29 siti (4.3). Per (0), (2b) e (3) il confronto fra stagioni non
  si riporta: è falsato per costruzione.

### 8.4 Intervalli

Per ogni metrica di 8.2 e per ogni differenza fra modelli si riportano la stima puntuale e **due intervalli al 95%**.
Stima puntuale = metrica sull'analisi completa (10 giri).

**Bootstrap per stagione (intervallo percentile).**

- B = 5000 repliche, `numpy.random.default_rng(20261016)`. Ogni analisi riparte dallo stesso seme.
- Ogni replica estrae 10 stagioni con reinserimento (`rng.integers(0, 10, 10)` sulle stagioni in ordine di anno).
  Le metriche stratificate della replica sono le stesse medie pesate di 8.2 sulle stagioni estratte, ripetizioni
  comprese. Le metriche sul complesso concatenano le righe fuori campione delle stagioni estratte.
- Stesse estrazioni per tutti i modelli: le differenze sono appaiate.
- Percentili 2,5 e 97,5 di `numpy.percentile` (metodo `linear`).
- Le repliche senza positivi o senza negativi si scartano e si contano.
- Le predizioni non si ristimano dentro le repliche.

**Jackknife per stagione dell'intera procedura.**

- Per ogni stagione j: si toglie j. Sulle 9 restanti si rifà la validazione a stagione esclusa (9 giri, training di
  8 stagioni), con (0), (2b) e (3) ristimati con le stesse regole. Si calcolano le metriche stratificate e le
  differenze su quelle 9 stagioni: θ_(j).
- Errore jackknife: SE_J = √(9/10 · Σ_j (θ_(j) − θ̄)²), con θ̄ la media dei 10 θ_(j).
- Intervallo: θ̂ ± 2,262 · SE_J (t di Student con 9 gradi di libertà), con θ̂ la stima puntuale.
- Motivo: con 10 stagioni l'intervallo percentile tende a essere troppo stretto (Cameron, Gelbach & Miller 2008,
  Rev. Econ. Stat. 90(3):414–427) e ignora quanto variano le stime di (0), (2b) e (3). Il jackknife ne tiene conto.
  Non esiste uno stimatore non distorto della varianza della validazione incrociata (Bengio & Grandvalet 2004,
  JMLR 5:1089–1105): i due intervalli restano approssimati.

**Controllo dei revisori (non negli script consegnati):** AP, ROC-AUC e Spearman si possono confrontare con
`average_precision_score`, `roc_auc_score` di scikit-learn e `spearmanr` di scipy. Per l'AP solo su punteggi senza
pari merito, oppure con la media di `average_precision_score` su molte rotture casuali dei pari merito.

## 9. Domande e criteri di lettura (decisi ora)

Si leggono **solo sull'analisi principale**: periodo 05/08–21/11, giorni, serie con ricostruzione.

### 9.1 Domande

| | Ipotesi | Differenza | Metrica che decide | Riportata accanto, senza etichetta |
|---|---|---|---|---|
| (a) | La parte meteo dell'indice (1) ordina meglio della climatologia (0) | (1) − (0) | AP stratificata | ROC-AUC stratificata, Spearman dentro la stagione, metriche sul complesso |
| (b) | σ 2,0 (2) ordina meglio di `tsd` 3,5 (1) | (2) − (1) | AP stratificata | come sopra |
| (b′) | Come (b), con σ stimato fuori dalla stagione di prova (2b) | (2b) − (1) | AP stratificata | come sopra |

### 9.2 Regola per ogni riga

**Differenza minima d'interesse: δ = 0,02 di AP stratificata.** Valore proposto dalla revisione, circa una deviazione
standard dell'AP stratificata di un ordinamento a caso (9.3). La scelta spetta a Matteo: si può cambiare solo prima
di eseguire `valuta.py`, con una voce nelle «Deviazioni» del README datata prima dei risultati.

Sulla differenza di AP stratificata, con θ̂ la stima puntuale e i due intervalli di 8.4:

- entrambi gli intervalli tutti sopra 0 e θ̂ ≥ δ: «**ordina meglio**, su questi dati»;
- entrambi gli intervalli tutti sopra 0 e θ̂ < δ: «**meglio, ma trascurabile** (sotto δ)»;
- entrambi gli intervalli tutti sotto 0 e θ̂ ≤ −δ: «**ordina peggio**, su questi dati»;
- entrambi gli intervalli tutti sotto 0 e θ̂ > −δ: «**peggio, ma trascurabile** (sotto δ)»;
- in ogni altro caso: «**non distinguibile** su questi dati». Se entrambi gli intervalli stanno dentro (−δ; +δ), si
  aggiunge: «la differenza resta sotto δ in tutto l'intervallo».

Il README riporta sempre la differenza con i due intervalli, non solo l'etichetta.

### 9.3 Potenza (Interpretazione, da simulazioni sintetiche)

- Le unità indipendenti sono 10 stagioni, con positivi molto squilibrati (da 1 a 27).
- Con i positivi per stagione di 3.6 e punteggi casuali, l'AP stratificata ha media 0,211 (il valore esatto di 3.6)
  e deviazione standard 0,017 (20 000 repliche sintetiche).
- Con etichette sintetiche a ondate (stessi positivi per stagione) e punteggi casuali, l'intervallo al 95% della
  differenza fra due punteggi indipendenti senza segnale è largo in media 0,083 (percentile) e 0,105 (jackknife).
- Fra modelli poco correlati, come in (a), serve quindi una differenza di circa 0,04–0,05 per un verdetto.
  «Non distinguibile» è l'esito più probabile per (a) e (b′), e non prova l'equivalenza.
- In (b), (1) e (2) condividono stagione e pioggia: gli intervalli saranno più stretti. Per questo serve δ.

### 9.4 Lettura congiunta di (b) e (b′), per D5

Conta l'intersezione: la curva più stretta è sostenuta solo se (b) **e** (b′) sono «ordina meglio». È un test di
intersezione-unione: non serve nessuna correzione per confronti multipli.

| (b) | (b′) | Lettura |
|---|---|---|
| ordina meglio | ordina meglio | La curva più stretta ordina meglio anche con σ stimato fuori campione, su questi dati. |
| ordina meglio | non «ordina meglio» e non «ordina peggio» | Vantaggio non dimostrato fuori campione: dipende almeno in parte dall'aver stimato σ sulle stesse stagioni. |
| non «ordina meglio» e non «ordina peggio» | ordina meglio | Un σ stimato sul training ordina meglio di 3,5, ma il valore 2,0 no: nessun sostegno al valore 2,0. Il README riporta i σ_k. |
| «ordina peggio» in almeno una delle due | qualsiasi | Prova contraria alla curva più stretta, su questi dati. Il README dice in quale delle due. |
| tutti gli altri casi | | Nessun vantaggio dimostrato per la curva più stretta. Se (b) e (b′) restano sotto δ in tutto l'intervallo: per l'ordinamento la scelta fra 3,5 e 2,0 conta poco, su questi dati. |

«ordina peggio» prevale sulle altre righe. In ogni caso nessuna conclusione vale per le faggete del Reatino, e D5
resta di Matteo.

### 9.5 Famiglia dei test e riferimento

- (a) è un solo test principale. Per D5 conta l'intersezione di (b) e (b′) (9.4). Nessuna correzione per confronti
  multipli: sono due domande distinte.
- ROC-AUC, Spearman, metriche sul complesso e sensibilità riportano la differenza con i due intervalli, **senza
  etichetta**. Se la ROC-AUC stratificata va in senso opposto all'AP, il README lo scrive accanto al verdetto.
- **(c) Riferimento.** (3) contro (0) e (3) contro (1), con gli intervalli, **senza verdetto**. Dice quanto ordina un
  modello stimato con la stessa informazione dell'indice.
- Il README riporta tutti i risultati preregistrati, anche quelli sfavorevoli all'indice.

## 10. Sensibilità (elenco chiuso, solo descrittive)

Stesse metriche (sezione 8) e stessi due intervalli della differenza, **senza etichetta**. Una sensibilità
**contraddice** il principale quando entrambi i suoi intervalli stanno interamente dalla parte di 0 opposta alla
stima puntuale del principale. In quel caso il README lo scrive accanto al verdetto. S1 è l'unico insieme di giorni
che non dipende dall'esito (4.2).

Differenze riportate: in S1, S2 e S3 quelle di (a), (b), (b′) e (c); in S4 (1) − (0) con h = 3 e con h = 14; in S5
(3′) − (3); in S6 e S7 ogni componente, e (1) arrotondato, meno (0) e meno (1).

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
- `fattori.mjs` (Node ≥ 22): importa `../../js/model.js` e `../../js/species.js`. Legge da `dati/` le serie e la
  lista dei σ (stringhe, sezione 6, (2b)); scrive in `dati/` i fattori per giorno, con la stringa della data.
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
   - `tools/ipotesi/valutazione-v3/impianto-scientifico/sigma_brejon.py` (controllo 7)
     `e3be0295a448654884ada9d97cac06878a283cd29ccfba0cd594cfff499bb34b`
5. Allineamento fra JavaScript e Python, giorno per giorno:
   - `t20`, `r30` ed `effRain` di `model.js` uguali alle medie e somme ricalcolate in Python (tolleranza 10⁻⁹);
     `maxEvent` uguale al massimo della pioggia da i−21 a i−7; `rain` uguale alla formula di 6, (1), ricalcolata in
     Python; `temp` uguale a exp(−½ · ((t20 − 13) / tsd)²) (tolleranza 10⁻¹² per queste ultime tre);
   - **legame con le righe del CSV**, unendo per stringa di data e non per posizione: per ogni giorno dal 2/8,
     |t20 di Node − `rollT_20` del giorno d−1| < 10⁻⁹ e |P26 di (3) − `rollP_26` del giorno d−1| < 10⁻⁹
     (**Fatto verificato** sulla serie grezza: scarto massimo 5,3·10⁻¹⁴ e 5,8·10⁻¹⁵ su 960 giorni; la versione che
     include il giorno d dista in media 0,20 °C, audit riga 94). La data passata a `seasonWeight` e scritta da
     `fattori.mjs` è uguale a `date` della riga del CSV;
   - `seasonWeight`: 01/08 = 0,709677; 05/08 = 0,735484; 15/08 = 0,8; 15/09 = 1; 15/11 = 0,4; 21/11 = 0,32;
     30/11 = 0,2 (tolleranza 10⁻⁶), nel 2015 e nel 2020 (anno bisestile);
   - prima di chiamare `model.js`: `p` e `tmean` sono numeri finiti in tutta la serie; ogni giorno valutato ha
     i ≥ 30, quindi nessuna finestra si taglia a 0 (anche nella serie senza giorni ricostruiti del controllo 6);
   - dopo: tutti i fattori usati (`rain`, `temp`, `effRain`, `maxEvent`, `r30`, `t20`, S) sono numeri finiti;
   - `inputQuality(edulis, s, i).missing` è esattamente [«umidità del suolo», «temperature minime», «temperature
     massime»] per ogni giorno valutato: la regola di completezza dell'app stessa;
   - nei giri di (2b) con σ_k = +∞: temp = 1 in tutti i giorni.
6. Per i giorni di S2, i fattori calcolati su una serie senza i giorni ricostruiti coincidono con quelli del
   principale.
7. Il porting di (2b) riproduce `sigma_brejon.py`. `valuta.py` esegue lo script senza modificarlo (`runpy`, stesso
   interprete, il CSV come argomento) e ne cattura l'uscita. Su tutte e 10 le stagioni, in ciascuno dei due periodi:
   Topt, σ e bP del porting, formattati come nello script, coincidono con le cifre stampate. Per il periodo
   05/08–21/11, l'ultimo del ciclo, σ non arrotondato (lasciato dallo script nelle sue variabili) coincide entro
   10⁻⁶. Il README riporta σ non arrotondato nei due periodi: così si legge da quale viene 2,0. Questo controllo
   calcola un legame con l'esito, quindi si fa solo nell'esecuzione, dopo questa preregistrazione.

**Determinismo.**

- Seme fisso, ordini fissi (stagione, poi data), JSON con chiavi ordinate.
- Due esecuzioni consecutive devono dare file di risultati identici byte per byte. Lo SHA-256 dei due file va nel
  README.
- Il README registra versioni di Python, numpy, Node e sistema operativo, commit, hash dei dati e dei moduli.

Se un modulo congelato cambia (per esempio dopo l'unione della 2.1.0), l'esecuzione si ferma. Proseguire è una
deviazione, ammessa solo dopo aver verificato con `git diff` che pioggia, temperatura e stagione sono invariate.

## 12. Deviazioni

- Questo file non si riscrive dopo il commit della revisione (sezione 15).
- Ogni cambiamento al protocollo va nella sezione «Deviazioni» del README, con: data; che cosa cambia; perché; se
  è stato deciso prima o dopo aver visto un risultato; effetto sull'esito.
- Quando si può, il README riporta sia il risultato preregistrato sia quello con la deviazione.
- Gli errori materiali di questo file si correggono lì, non qui.

## 13. Limiti noti in anticipo

- **Zeri** non osservati come tali (sezione 4.3). Possibile legame fra pioggia e visite.
- **Sforzo variabile.** All somma più siti, cresciuti da 15 a 29 secondo il testo dello studio (dato non
  verificabile sul CSV). Le metriche sul complesso ne risentono; quelle dentro la stagione no, salvo cambi di sforzo
  dentro una stagione.
- **Un'area, non un campione di boschi.** Boschi prevalentemente di faggio vicino a Bielefeld, una sola serie meteo,
  10 stagioni, abbondanza molto variabile fra anni (2016: 4 carpofori).
- **Meteo E-OBS a 0,1°**, interpolato sul centroide dei siti: non è misurato nel bosco. Versione non dichiarata
  dagli autori.
- **Righe di `Climate.csv`:** la ricostruzione di luglio presuppone giorni consecutivi (Ipotesi, 3.4). S2 non ne
  dipende.
- **(1) non è del tutto indipendente da questi dati.** Il centro termico 13 °C e la finestra di 20 giorni
  dell'indice vengono da questo studio, stimati su tutte le stagioni: (1) parte avvantaggiato. **Interpretazione:**
  in (a) un verdetto favorevole a (1) va letto come ottimistico. Latenza, innesco 8 mm, r30 ed `eref` sono
  euristiche non tratte da questi dati.
- **Le finestre di 20 e 26 giorni di (3)** sono state scelte dagli autori con l'AIC su tutte le stagioni:
  piccolo vantaggio anche per (3).
- **Il peso stagionale dell'indice** è il calendario pensato per il Reatino, non stimato qui. La climatologia è
  stimata su questo sito: sulla parte stagionale (0) parte avvantaggiata.
- **Fattori mancanti:** suolo, gelo, caldo e shock (sezione 6). Si misura una parte dell'indice, non l'indice
  completo dell'app.
- **Intervalli approssimati.** Con 10 stagioni l'intervallo percentile tende a essere troppo stretto: in una
  simulazione sintetica con pesi come i positivi di 3.6 ha coperto il 90% invece del 95%; il jackknife con t a 9
  gradi di libertà il 95%. Per un verdetto servono entrambi (9.2).
- **Potenza bassa** (9.3): «non distinguibile» è l'esito più probabile per (a) e (b′).
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

## 15. Revisione prima dei risultati

16 ottobre 2026. Due revisori indipendenti hanno letto la prima versione (commit `fc2e574`) prima di qualsiasi
risultato. Ogni rilievo è stato ricontrollato qui, senza calcolare legami fra predittori ed esito: algebra sulle
formule, lettura di `js/model.js`, `sigma_brejon.py` e del codice R, prove di `js/model.js` su serie fittizie,
simulazioni su dati sintetici, controlli sul solo esito o sui soli predittori. Gli script delle verifiche stanno nello
scratchpad della sessione, fuori dal repository.

**Esito: 18 rilievi, 15 accolti e 3 accolti in parte. Nessuno respinto per intero.** Le parti respinte sono in fondo.

| # | Rilievo | Esito | Verifica fatta qui | Dove cambia |
|---|---|---|---|---|
| 1 | Le metriche sul complesso mescolano i 10 giri: per costruzione (0) ordina al contrario fra stagioni, e così (3) attraverso l'intercetta; (2b) cambia scala; lo sforzo cresce da 15 a 29 siti | **Accolto in parte** | Algebra di c_k confermata. Simulazione sintetica: rispetto alla stessa forma stagionale senza stima, (0) perde 0,041 di AP e 0,041 di ROC-AUC sul complesso, 0,009 e 0,010 dentro la stagione; il livello di c_k ha correlazione −1,00 con i positivi della stagione esclusa. Sforzo: audit riga 37 | Metriche che decidono dentro la stagione (8.2); complesso secondario con avvertenza (8.3); fra stagioni solo descrittivo (8.3); sforzo in 4.3 e 13; (1) ottimistico in 13 |
| 2 | L'AP a gradini non è neutra con i pari merito | Accolto | Formula esatta dell'AP attesa uguale al Monte Carlo (0,3489 contro 0,3489). Su dati sintetici l'AP a gradini sta sotto l'attesa di 0,0009, 0,0038, 0,0090 e 0,0211 con 400, 100, 40 e 15 livelli. c_k ha 59 valori distinti su 1090 giorni in una replica sintetica | 6, (0); 8.1 |
| 3 | L'intervallo percentile con 10 stagioni è troppo stretto e ignora la stima di (0), (2b), (3) | Accolto | Simulazione sintetica, media pesata su 10 stagioni: copertura 90,4% per il percentile, 95,0% per il jackknife con t a 9 gradi di libertà | 8.4 (jackknife dell'intera procedura); 9.2 (servono entrambi gli intervalli) |
| 4 | Manca una differenza minima d'interesse; potenza non quantificata | Accolto | Simulazione sintetica dell'AP stratificata (9.3) | 9.2 (δ = 0,02, da confermare da Matteo); 9.3; 13 |
| 5 | In S2 il 2016 non ha positivi: il GLM di (2b) non converge; manca la regola | Accolto | Simulazione sintetica: con arresto su tutti i coefficienti nessuna convergenza in 100 iterazioni; con arresto sulle pendenze 20 iterazioni; togliendo la stagione 7 iterazioni, σ uguale entro 3·10⁻⁸ | 6, (2b) |
| 6 | π non è il riferimento dell'AP per stagione e per settimane | Accolto | Forma esatta: principale 0,1474, S2 0,1690, settimane 0,4508, 2016 0,0484, 2018 0,0748, 2020 0,2775; stratificata 0,2111 | 3.6; 8.2 |
| 7 | Il periodo principale coincide con il primo e l'ultimo ritrovamento: dipende dall'esito | Accolto | Solo esito: primo per giorno dell'anno 05/08 (2023), ultimo 21/11 (2020) | 4.2; 10 |
| 8 | Lettura congiunta incompleta; famiglia dei test non dichiarata; sensibilità «senza verdetto» ma con «verdetto diverso» | Accolto | Lettura del testo della prima versione | 9.4; 9.5; 10 |
| 9 | Non si sa da quale periodo venga σ = 2,0; nessun controllo che il porting riproduca `sigma_brejon.py` | **Accolto in parte** | `sigma_brejon.py` righe 6–25: due periodi, σ stampato con due decimali, nessuna uscita registrata | 6, (2); 11, controllo 7 |
| 10 | «Un solo sito» è sbagliato: All somma più siti, cresciuti da 15 a 29 | **Accolto in parte** | Codice R righe 78–82; All ≥ A + B in tutte le date, 1077 carpofori fuori da A e B (solo esito); audit riga 37 | 1; 3.2; 4.3; tabella dei fattori in 6; 13 |
| 11 | Il controllo 5 non lega l'uscita di Node alle righe del CSV | Accolto | Solo predittori: t20 = `rollT_20`(d−1) e P26 = `rollP_26`(d−1) entro 5,3·10⁻¹⁴ e 5,8·10⁻¹⁵ su 960 giorni | 11, controllo 5 |
| 12 | La ricostruzione di luglio presuppone righe consecutive in `Climate.csv`; manca la correzione all'audit | Accolto | Codice R righe 59–73; `Climate.csv` non è nell'archivio | 3.4; 5; 13 |
| 13 | La formula della pioggia è incompleta; il controllo 5 non prova `maxEvent` né `rain` | Accolto | `js/model.js` righe 74–83; con 1,2 mm al giorno effRain = 18 e l'innesco scatta senza eventi di 8 mm | 6, (1); 11, controllo 5 |
| 14 | `seasonWeight` interpola anche con luglio e dicembre; il controllo prova solo i giorni 15 | Accolto | Valori misurati su `js/model.js` con le sole date, nel 2015, 2016 e 2020 | 6, (1); 11, controllo 5 |
| 15 | σ = +∞ non passa in JSON; NaN e `null` nella pioggia danno fattori sbagliati senza errore | Accolto | Su `js/model.js`: `tsd` Infinity dà temp 1, `null` dà 0, `"inf"` dà NaN; un NaN nella finestra di latenza dà `maxEvent` e `rain` NaN; un `null` dà `maxEvent` senza quel giorno; `inputQuality` senza suolo, Tmin e Tmax segnala esattamente quei tre | 6, (2b); 11, controllo 5 |
| 16 | L'origine di σ = 2,0 era segnata come «Fatto verificato» senza esserlo | Accolto | Come per il rilievo 9 | 6, (2) |
| 17 | In S2 l'intercetta del 2016 non è identificabile in (2b) (stesso caso del rilievo 5) | Accolto | Come per il rilievo 5; scelta: escludere le stagioni di training senza conteggi | 6, (2b) |
| 18 | Contraddizione: `Mnb` «solo per Spearman», ma (2b) lo usa | Accolto | Lettura del testo | 4.1 |

**Che cosa non è stato accolto, e perché.**

- **Rilievo 1, «un verdetto favorevole è un limite superiore».** Accolta l'avvertenza, non la formula: con 10
  stagioni il rumore può spingere la stima anche sotto il valore vero, quindi non è un limite in senso stretto. Il
  testo dice «va letto come ottimistico» (13). Non adottata nemmeno l'alternativa di tenere il complesso come
  metrica principale per (b): lo sforzo cresciuto pesa anche lì, e una sola metrica per tutte le domande è più
  semplice da leggere.
- **Rilievo 9, «dire nell'emendamento da quale riga di output viene 2,0 e il valore non arrotondato».** Oggi non si
  può: servirebbe eseguire `sigma_brejon.py`, cioè stimare un legame con l'esito prima dei risultati. È rimandato
  all'esecuzione (controllo 7) e il README lo riporterà. Il controllo «entro 10⁻⁶» vale solo per il periodo
  05/08–21/11: lo script stampa σ con due decimali e lascia nelle sue variabili solo l'ultimo periodo del ciclo.
- **Rilievo 10, «una sola cella meteo E-OBS».** Il codice R estrae il meteo con interpolazione bilineare sul
  centroide dei punti di raccolta (righe 22–24 e 46–50), cioè dalle celle vicine. Il testo dice «una sola serie
  meteo», non «una sola cella».

**Proposte alternative dei revisori non adottate** (non sono errori dei rilievi): per il rilievo 3, il t sulle 10
differenze per stagione con il test dei segni (si usa il jackknife dell'intera procedura, che tiene conto delle
stime); per il rilievo 5, σ_k = +∞ in caso di mancata convergenza (si usa σ_k = 3,5, che spinge verso «nessuna
differenza» invece di togliere la temperatura).

**Resta aperto:** δ = 0,02 è una proposta. La conferma, o un altro valore, spetta a Matteo prima di eseguire
`valuta.py`. Anche `docs/ipotesi/valutazione-modello-v3.md`, sezione 4.5, scrive «un solo sito»: non si corregge qui,
perché il file sta fuori da questa cartella.
