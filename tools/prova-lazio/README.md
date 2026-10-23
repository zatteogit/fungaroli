# Prova retrospettiva dell'indice dei funghi sull'Italia (2023–2025)

Eseguita il 23 ottobre 2026 sul ramo `claude/serene-lamport-2ncpxr`, seguendo tre documenti scritti prima dei
risultati: [`preregistrazione.md`](preregistrazione.md) (Lazio, commit `0a187096`),
[`preregistrazione-italia.md`](preregistrazione-italia.md) (Italia, commit `3eaf3dfc`) e
[`deviazioni.md`](deviazioni.md) (D1–D21). Dove divergono fa fede l'ultimo. D19 e D20 sono state scritte e
pubblicate prima di leggere qualunque stima; D21 raccoglie le correzioni venute dopo le tre verifiche indipendenti,
**dopo** aver visto i risultati (nessun verdetto è cambiato).

**Nessun esito cambia l'app.** `js/model.js`, `js/species.js` e `js/weather.js` non sono stati toccati:
`fattori.mjs` li importa (SHA-256 uguali a quelli preregistrati, modello 2.1.0). L'indice di Fronda è sperimentale
(0–10) e **non è una probabilità**: qui si misura solo come ordina i giorni. Ogni cambiamento dell'app resta una
decisione di Matteo.

Legenda: **Fatto verificato** = controllato su dati, codice o fonte. **Interpretazione** = lettura nostra di un
fatto. **Ipotesi** = da mettere alla prova o non verificabile.

## In breve

**Domanda.** Il giorno in cui qualcuno ha trovato una specie, la parte meteo dell'indice di quella specie era più
alta che nelle uscite di altri osservatori di funghi nella stessa zona e nello stesso periodo?

- **Casi:** osservazioni *research grade* delle 14 specie dell'app (iNaturalist e GBIF), Italia, 2023–2025,
  incertezza ≤ 1000 m, raggruppate in uscite (osservatore, giorno, cella di 0,1°).
- **Controlli (P1):** uscite con altri Agaricomycetes nella stessa cella, stesso anno, a non più di 30 giorni.
- **Punteggio (1):** stagione × pioggia × temperatura × umidità del suolo × gelo × caldo × shock, come l'app, senza
  habitat né quota. Meteo storico Open-Meteo, modello `icon_seamless`.
- **Metrica:** AUC abbinata, cioè la probabilità che il caso superi un suo controllo (pari = ½; 0,5 = a caso).
- **Intervalli al 95%** con tre bootstrap per cluster: per cella (**C**), per osservatore (**O**), per regione × anno
  (**R**). Un verdetto solo se tutti e tre escludono lo zero dalla stessa parte (D4).
- δ = 0,05 per Q1, 0,03 per Q2–Q4.

**Esiti preregistrati, tutte le specie insieme** (973 casi in 433 celle, 2876 controlli):

| Domanda | Stima | C | O | R | Esito |
|---|---:|---|---|---|---|
| **Q1** (domanda principale): la parte meteo dell'indice è più alta nei giorni di ritrovamento? AUC(1) − 0,5 | **+0,066** (AUC 0,566) | [+0,041; +0,091] | [+0,042; +0,090] | [+0,043; +0,092] | **più alta nei giorni di ritrovamento**, su questi dati |
| Q2: il meteo aggiunge qualcosa alla sola stagione? AUC(1) − AUC(0) | +0,018 | [−0,007; +0,044] | [−0,007; +0,043] | [−0,010; +0,047] | non distinguibile |
| Q3: l'indice fa meglio della climatologia dei ritrovamenti? AUC(1) − AUC(2) | +0,025 | [−0,007; +0,057] | [−0,005; +0,056] | [−0,004; +0,057] | non distinguibile |
| Q4: lo shock termico aiuta? Porcino (110 casi) | +0,000 | [−0,009; +0,010] | [−0,010; +0,011] | [−0,009; +0,010] | non distinguibile (dopo Holm); la differenza resta sotto δ in tutto l'intervallo |
| Q4: porcino e porcino rosso insieme (132 casi) | −0,002 | [−0,012; +0,007] | [−0,012; +0,007] | [−0,011; +0,006] | non distinguibile (dopo Holm); la differenza resta sotto δ in tutto l'intervallo |

AUC dei punteggi: stagione sola (0) 0,548; indice (1) 0,566; climatologia empirica (2) 0,541.

**Gli intervalli sono condizionati alle stagioni 2023–2025: non dicono come andrebbe in anni con un andamento
diverso** (D4). Q1 è positiva in ciascun anno: 2023 +0,063 [+0,020; +0,106], 2024 +0,086 [+0,043; +0,128],
2025 +0,044 [+0,004; +0,083] (intervalli B-cella dentro l'anno). Nessun «eterogeneo» né «non stabile fra anni».

**Per specie** (le dieci con etichetta di D3; correzione di Holm per domanda):

| Specie | Casi | Celle | AUC(1) | Q1 | C | O | R | p Holm | Esito Q1 |
|---|---:|---:|---:|---:|---|---|---|---:|---|
| porcino (edulis) | 110 | 82 | 0,629 | **+0,129** | [+0,061; +0,191] | [+0,064; +0,193] | [+0,063; +0,194] | 0,004 | **più alta nei giorni di ritrovamento** |
| chiodino (mellea) | 101 | 78 | 0,679 | **+0,179** | [+0,110; +0,249] | [+0,113; +0,241] | [+0,105; +0,257] | 0,004 | **più alta nei giorni di ritrovamento** |
| ovolo buono (caesarea) | 41 | 35 | 0,648 | +0,148 | [+0,048; +0,249] | [+0,040; +0,244] | [+0,076; +0,242] | 0,058 | non distinguibile dopo Holm |
| mazza di tamburo (procera) | 322 | 202 | 0,535 | +0,035 | [−0,004; +0,077] | [−0,004; +0,075] | [+0,007; +0,077] | 0,61 | non distinguibile dopo Holm |
| porcino estivo (aestivalis) | 39 | 35 | 0,597 | +0,097 | [−0,030; +0,222] | [−0,030; +0,224] | [−0,010; +0,202] | 0,83 | non distinguibile dopo Holm |
| porcino nero (aereus) | 34 | 30 | 0,580 | +0,080 | [−0,038; +0,192] | [−0,039; +0,193] | [−0,004; +0,178] | 0,98 | non distinguibile dopo Holm |
| pinarolo (suillus) | 54 | 42 | 0,548 | +0,048 | [−0,056; +0,150] | [−0,046; +0,146] | [−0,050; +0,138] | 1 | non distinguibile dopo Holm |
| finferlo (cibarius) | 74 | 59 | 0,539 | +0,039 | [−0,048; +0,122] | [−0,051; +0,127] | [−0,039; +0,132] | 1 | non distinguibile dopo Holm |
| trombetta dei morti (cornucopioides) | 67 | 49 | 0,516 | +0,016 | [−0,075; +0,106] | [−0,070; +0,095] | [−0,104; +0,129] | 1 | non distinguibile dopo Holm |
| colombina (virescens) | 45 | 34 | 0,482 | −0,018 | [−0,133; +0,095] | [−0,129; +0,094] | [−0,154; +0,083] | 1 | non distinguibile dopo Holm |

Q2 e Q3 per specie: **nessuna specie** passa Holm (il porcino è il più vicino: Q2 +0,074, p corretto 0,54; Q3
+0,114, p corretto 0,33). Fuori dall'elenco con etichetta, nella sola complessiva: repandum (30 casi, AUC(1) 0,471),
pinophilus (22; 0,499), nuda (21; 0,548), terreum (13; 0,678). Con dieci specie una o più etichette possono venire
dal caso: Holm lo tiene sotto il 5% per domanda, non lo esclude.

**Che cosa dice e che cosa non dice (Interpretazione).**

- **Q1 è un risultato vero ma modesto.** Un'AUC di 0,566 vuol dire che il giorno del ritrovamento batte un'uscita di
  confronto 57 volte su 100 invece di 50. Supera δ = 0,05, ma di poco: il limite inferiore degli intervalli è circa
  +0,04.
- **Gran parte del vantaggio sta già nella stagione.** La sola stagione arriva a 0,548; il meteo aggiunge +0,018,
  non distinguibile da zero (Q2). Anche una climatologia costruita dai ritrovamenti degli altri anni fa quasi lo
  stesso (Q3). Detto in modo semplice: oggi l'indice sa bene *in che periodo* cercare, e sul *quale giorno* del
  periodo aggiunge poco che si possa dimostrare.
- **Fra i fattori** (S-COMP, AUC − 0,5): stagione +0,048, pioggia +0,041, temperatura +0,026, umidità del suolo
  −0,003, gelo e caldo +0,003. Pioggia × temperatura × umidità senza stagione +0,059. L'umidità del suolo, presa da
  sola, non distingue i giorni di ritrovamento.
- **Lo shock termico del porcino non cambia nulla** (Q4): con o senza il bonus l'ordinamento è lo stesso, entro
  ±0,01.
- **Porcino e chiodino** sono le specie in cui l'indice distingue di più (+0,13 e +0,18). L'ovolo buono va nella
  stessa direzione, ma dopo la correzione non basta.
- **Disegno severo.** I controlli sono uscite in cui si sono trovati *altri funghi*, nate spesso dalla stessa
  pioggia: P1 misura la **specificità**, non solo «nascono funghi». Un fattore pioggia giusto ma uguale per tutte
  le specie qui vale poco.
- **Solo presenze.** Nessuna uscita a vuoto: un controllo dice che qualcuno ha visto altri funghi, non che la specie
  mancava. Chi pubblica su iNaturalist non è un cercatore tipico (preregistrazione del Lazio, 14).
- **Prevale il Nord** (713 casi su 973): l'esito parla soprattutto di Alpi e Prealpi. Il Lazio da solo (57 casi) resta
  descrittivo.

## Analisi secondarie (senza etichetta)

Stessi casi e metriche, una cosa cambiata. «Contraddice» (D13) = tutti e tre gli intervalli dalla parte opposta
della stima del principale: **nessuna secondaria contraddice il principale**.

| Analisi | Casi | Q1 | Q2 | Q3 |
|---|---:|---|---|---|
| Principale (P1) | 973 | +0,066 [+0,041; +0,092] | +0,018 [−0,010; +0,047] | +0,025 [−0,007; +0,057] |
| S-FIN: finestra ±15 giorni | 861 | +0,040 [+0,013; +0,066] | +0,005 [−0,024; +0,038] | +0,025 [−0,011; +0,064] |
| S-CELLA: celle di 0,2° | 1145 | +0,067 [+0,046; +0,088] | +0,023 [+0,001; +0,046] | +0,043 [+0,016; +0,071] |
| S-QUOTA: controlli entro 300 m di quota | 870 | +0,068 [+0,041; +0,095] | +0,028 [+0,000; +0,060] | +0,025 [−0,009; +0,061] |
| S-GEN: senza controlli identificati sopra il genere | 959 | +0,068 [+0,042; +0,093] | +0,020 [−0,009; +0,051] | +0,033 [+0,001; +0,067] |
| S-PREC: incertezza ≤ 250 m | 785 | +0,055 [+0,025; +0,083] | +0,008 [−0,023; +0,041] | +0,014 [−0,023; +0,053] |
| S-LIC: senza i record iNaturalist privi di licenza | 665 | +0,056 [+0,025; +0,087] | +0,004 [−0,028; +0,037] | +0,015 [−0,026; +0,054] |
| S-SPEC: media delle specie, ognuna con peso 1 | 973 | +0,068 [+0,035; +0,103] | +0,028 [−0,009; +0,070] | +0,039 [−0,004; +0,082] |
| S-D19: senza le 11 risposte meteo del 23/10 | 961 | +0,065 [+0,039; +0,090] | +0,019 [−0,009; +0,049] | +0,024 [−0,008; +0,057] |
| S-CC: stesso punto a d ± 14 e d ± 28 giorni | 1224 | +0,184 [+0,162; +0,208] | +0,054 [+0,030; +0,082] | — |
| S-ARR: (1) arrotondato come l'app | 973 | +0,067 [+0,042; +0,092] | — | — |

Per ogni riga l'intervallo è l'unione dei tre (estremo più basso e più alto fra C, O e R); i tre separati stanno in
`esiti-riepilogo.json`.

- **S-D19** dà gli stessi verdetti del principale, compresi porcino e chiodino; le 11 risposte con la pioggia
  diversa (D19) non spostano nulla.
- **S-CC** non corregge lo sforzo: chi esce dopo la pioggia premia ogni modello con la pioggia. Il suo +0,18 è atteso
  e non va letto come una prova in più (preregistrazione del Lazio, 4.1 e 10).
- **S-FIN** (finestra stretta) riduce Q1 a +0,040, ancora sopra zero: dentro due settimane i giorni si somigliano di
  più.

**Strati** (senza etichetta; intervallo = unione dei tre, i tre separati in `esiti-riepilogo.json`):

| Strato | Casi | Q1 |
|---|---:|---|
| Nord | 713 | +0,064 [+0,035; +0,096] |
| Centro | 171 | +0,075 [+0,016; +0,133] |
| Sud e isole | 88 | +0,066 [−0,026; +0,152] |
| < 500 m | 332 | +0,108 [+0,065; +0,149] |
| 500–999 m | 281 | +0,032 [−0,020; +0,079] |
| 1000–1399 m | 222 | +0,072 [+0,018; +0,130] |
| ≥ 1400 m | 138 | +0,025 [−0,046; +0,117] |
| Lazio (descrittivo) | 57 | +0,086 [−0,018; +0,180] |

**P2, controlli con poliporacei perenni** (secondaria descrittiva, D1). Il 72% delle uscite-controllo P2 contiene
anche altri Agaricomycetes: P2 non misura lo sforzo indipendente dalla pioggia. 165 casi (intervallo = unione dei tre):

| | Q1 | Q2 | Q3 |
|---|---|---|---|
| P2 | +0,041 [−0,047; +0,145] | −0,114 [−0,214; +0,016] | −0,052 [−0,161; +0,080] |
| P1 sugli stessi 165 casi | +0,060 [+0,012; +0,120] | −0,021 [−0,072; +0,033] | −0,012 [−0,075; +0,056] |

In P2 la sola stagione va meglio dell'indice nella stima (Q2 −0,114), e uno dei tre intervalli (O) esclude lo zero;
gli altri due no. Con 165 casi e un controllo P2 per caso (mediana) è un segnale debole: va tenuto d'occhio, non
letto come un verdetto. Le varianti di P2 (S-FIN, S-CELLA, S-QUOTA, S-PREC, S-LIC, S-SPEC, S-COMP, strati) sono in
`esiti-riepilogo.json`.

**Esplorativa, dopo i risultati (D21, 15; intervalli = unione dei tre):** contro le uscite dello **stesso osservatore** in altri giorni (552
casi) Q1 vale +0,041 [+0,005; +0,076] e la sola stagione fa un po' meglio dell'indice (Q2 −0,026 [−0,063; +0,012]);
contro le uscite di **altri osservatori** (813 casi) Q1 vale +0,078 [+0,043; +0,117], con Q2 e Q3 sopra zero.
**Interpretazione:** confrontando la stessa persona, che esce con le sue abitudini, il vantaggio dell'indice si
dimezza e il contributo del meteo oltre la stagione sparisce. Una parte del +0,066 può venire da *chi* esce e *quando*,
non dal meteo. Non cambia nessun verdetto preregistrato, ma è il limite principale nel leggere Q1.

## Controllo C-BM (best match contro `icon_seamless`)

Sui giorni valutati di 60 richieste con la gemella best match (nessuna coppia esclusa per scarto orario):
temperatura media a 20 giorni e umidità media a 3 giorni **identiche** in tutti i giorni; pioggia a 30 giorni
diversa, con mediana fra 0 e 1,7 mm e terzo quartile fino a 2,3 mm, più al Nord. **Interpretazione:** per questi
giorni il best match dell'app usa gli stessi dati di temperatura e suolo di `icon_seamless`; la pioggia viene in parte
da un'altra fonte, con scarti piccoli rispetto ai 30–100 mm tipici della finestra.

## Dati, licenze e attribuzioni

**Fatto verificato.**

- **iNaturalist** (API v1, scaricata il 22/10/2026): osservazioni con licenza scelta da chi osserva (CC0, CC BY,
  CC BY-NC e varianti, o nessuna licenza). Si usano solo fatti (taxon, data, luogo, qualità); niente foto, testi o
  nomi. I record senza licenza entrano, con la sensibilità S-LIC (sopra). Fra i record caso: CC BY-NC 1620, nessuna
  licenza 865, CC BY 138, CC0 46, altre CC 136 (record caso 2015–2025).
- **GBIF** (occurrence API, 22/10/2026): licenze per dataset, CC BY 4.0 e CC BY-NC 4.0 fra i record caso (154 e 31).
  Nomi e sinonimi dal **GBIF Backbone Taxonomy** (CC BY 4.0).
- **Open-Meteo**: Historical Forecast API ed Elevation API, dati **CC BY 4.0**, «Weather data by Open-Meteo.com»
  (https://open-meteo.com/). API gratuita per uso non commerciale: questa prova è ricerca non commerciale e Fronda è
  gratuita e senza pubblicità (Interpretazione).
- **Nulla si ridistribuisce.** `dati/` è esclusa da git; `tools/` non è pubblicata con il sito. Nel repository solo
  aggregati: `esiti-riepilogo.json`. Il controllo 7 verifica che non contenga identificativi di osservatori, record,
  richieste meteo o celle, né serie meteo.

## Struttura e controlli (Fatto verificato)

- **Record:** 97 643 letti; 76 882 validi dopo filtri, geometria (213 record iNaturalist fuori dai confini, D21),
  deduplica 2 (5) e 3 (24).
- **Unità:** 1224 unità caso 2023–2025; 251 senza controlli; 973 con almeno un controllo. 21 121 unità controllo P1
  nel periodo, 2876 abbinate; |M(c)| mediano 3. 64 uscite contano per più specie (82 unità in più, D12). Cluster
  effettivi: cella 182,5, osservatore 171,4, regione × anno 22,1.
- **Meteo:** 878 serie usate, tutte con scarto orario 7200; nessun punto di ripiego; meteo completo per tutti i casi e
  tutte le coppie (0% mancante, sotto il blocco del 20%). Dei 880 file meteo P1 e C-BM, 869 scaricati il 22/10 e
  11 il 23/10 (D19), in parte da un secondo computer (D18).
- **Pari** (D6): quota media di controlli pari al caso: (0) 17,4%, (1) 5,8%, (2) 5,4%, (1) arrotondato 11,5%.
- **Climatologia:** ripiego sull'Italia per le combinazioni con meno di 10 casi negli anni di training nella
  macro-area (elenco in `esiti-riepilogo.json`).
- **Controlli bloccanti** (12 del Lazio, D9, D21): 1 moduli (6 SHA-256 uguali ai preregistrati); 2 istantanea
  congelata `dati/istantanea.json` (SHA-256 `9264cf8c…3d`, creata il 23/10 dopo i risultati); 3 taxa uguali alle
  tabelle dei documenti, nessun controllo con un taxon escluso; 4 filtri, geometria e deduplica; 5 allineamento
  JavaScript–Python dei predittori su 14 720 voci (scarto massimo 1,7 · 10⁻¹³); 7 riservatezza del riepilogo.
- **Determinismo:** due esecuzioni consecutive danno file identici: `esiti-riepilogo.json` SHA-256
  `1acc3eb1a1eabb784cae62bf82222adb69de2d0697640b721b65cc579c368353`, `dati/esiti.json`
  `bb8c9f34cab3e92bc4dc2d3c59302f00780286966f347b2b63e4fe7bec16d4af`.
- **Versioni:** Python 3.13.16, numpy 2.5.3, Node v22.22.0, Linux 6.18; modello dell'app 2.1.0.

## Verifiche indipendenti

Tre verifiche indipendenti, il 23/10, sugli esiti prima di D21:

1. **Reimplementazione da zero**, senza leggere `valuta.py` né `fattori.mjs`: tutti i numeri del principale (casi,
   celle, AUC complessive e per specie, intervallo B-cella di Q1) coincidono entro 10⁻¹². Ha segnalato la geometria non
   applicata a iNaturalist (corretta in D21: Q1 da +0,0663 a +0,0659).
2. **Revisione del codice contro il protocollo:** nessun errore cambia un verdetto. Rilievi corretti in D21: S-D19
   senza verdetti, secondarie di P2 mancanti, controlli bloccanti 2, 3 e 7 più deboli del previsto, doppi conteggi in
   C-BM e nella descrittiva. Segnala che **caesarea Q1 è il verdetto più vicino alla soglia** (Holm 0,058).
3. **Controlli avversari sui dati:**
   - scambiando a caso caso e controlli l'AUC torna a 0,500 (200 semi, deviazione standard 0,011; l'osservato sta
     circa 6 deviazioni sopra);
   - nessuna fuga d'informazione dal futuro; ricalcolo indipendente di f₁ uguale su tutte le voci;
   - abbinamento verificato a mano;
   - togliendo una specie, un'area o i primi osservatori l'AUC(1) resta fra 0,55 e 0,58;
   - ha proposto il confronto con lo stesso osservatore (esplorativa, sopra).

## Che cosa resta da fare

- **Analisi descrittiva** (mesi × fasce di quota, 11 del Lazio): le quote 2015–2025 della priorità 5 non sono ancora
  scaricate (4379 uscite con quota su 39 946). La tabella parziale è in `esiti-riepilogo.json`; si rifà quando arrivano
  le quote (D17, D20.14). Nessun verdetto dipende da lei.
- **Conferma sul 2026**, con questo stesso protocollo, non prima del 31/03/2027 (2.3 del Lazio), se Matteo lo decide.

## File

| File | Che cosa fa |
|---|---|
| `preregistrazione.md`, `preregistrazione-italia.md` | Protocollo, scritto prima dei risultati. Non si modificano. |
| `deviazioni.md` | D1–D21: cambiamenti datati, con il momento (prima o dopo i risultati). |
| `scarica_osservazioni.py`, `richieste.py`, `scarica_meteo.py`, `unisci_meteo.py`, `comune.py` | Scaricamento lento e con cache di osservazioni, richieste, meteo e quote; unione delle risposte di un secondo computer. Solo libreria standard. |
| `prova_scarica_meteo.py` | Prova dello scaricamento con un server finto. |
| `fattori.mjs` | Importa `js/model.js`, `js/species.js`, `js/weather.js` senza modificarli e calcola i punteggi. Lo lancia `valuta.py`. |
| `valuta.py` | Controlli bloccanti, unità, abbinamento, climatologia, AUC, tre bootstrap, Holm, verdetti, secondarie, C-BM, descrittiva. Scrive `dati/esiti.json` ed `esiti-riepilogo.json`. Libreria standard e numpy. |
| `esiti-riepilogo.json` | Solo aggregati dell'esecuzione del 23/10/2026. |

Riproduzione (con `dati/` presente):

```bash
cd tools/prova-lazio
python3 -I valuta.py            # B = 5000; circa 10 minuti
```
