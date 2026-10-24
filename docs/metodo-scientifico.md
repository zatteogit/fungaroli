# Il metodo e la validazione locale

## Quanto funziona: la prova sull'Italia 2023–2025

Ad ottobre 2026 abbiamo messo alla prova la parte meteo dell'indice su 973 ritrovamenti delle 14 specie in tutta Italia, tra il 2023 e il 2025 (iNaturalist e GBIF). Il protocollo è stato scritto prima di guardare i risultati. Per ogni ritrovamento abbiamo confrontato il giorno in cui la specie è stata trovata con le uscite di altri cercatori nella stessa zona e nello stesso periodo, in cui si sono trovati altri funghi.

**Fatto verificato.**

| Che cosa | Risultato |
|---|---|
| L'indice mette più in alto il giorno del ritrovamento? | Sì, ma di poco: il giorno del ritrovamento vince 57 confronti su 100, contro i 50 del caso. Vale in tutti e tre gli anni. |
| Il meteo aggiunge qualcosa alla sola stagione? | Non si può dire: la sola stagione vince 55 confronti su 100, il meteo ne aggiunge meno di 2 e la differenza non si distingue dal caso. |
| Per quali specie funziona meglio? | Porcino (63 su 100) e chiodino (68 su 100). Per le altre specie i dati non bastano a dirlo. |
| Lo shock termico del porcino aiuta? | No: con o senza, l'ordine dei giorni resta lo stesso. Dal modello 2.2.0 non c'è più. |
| Pioggia, temperatura, umidità del suolo | Pioggia e temperatura contano; l'umidità del suolo, da sola, non distingue i giorni di ritrovamento. |

**Che cosa vuol dire (Interpretazione).** L'indice è una buona guida di stagione: dice bene *in che periodo* e *in che bosco* cercare. Sul *giorno preciso* dentro il periodo il meteo aiuta poco, e non è ancora dimostrato. Una parte del vantaggio può dipendere da chi esce e quando: confrontando la stessa persona in giorni diversi, il vantaggio si dimezza.

**Limiti.** Sono dati di chi pubblica su iNaturalist e GBIF, non di cercatori tipici. Mancano le uscite a vuoto. Prevale il Nord: il Lazio ha 57 ritrovamenti, troppo pochi per un verdetto. I numeri valgono per le stagioni 2023–2025.

**Il passo successivo.** La conferma sul 2026, con il modello 2.2.0, è scritta prima di vedere i dati e si farà non prima di aprile 2027. Le uscite a vuoto che annoti nel Taccuino («La tua ricerca») sono il dato che oggi manca di più.

Dettagli, numeri e codice: `tools/prova-lazio/` nel repository (README, preregistrazioni, deviazioni).

## Modello 2.2.0 · 24 ottobre 2026

Il modello 2.2.0 toglie lo shock termico del porcino e del porcino rosso (sezione 6): nella prova sull'Italia non cambiava l'ordine dei giorni. Tutti gli altri fattori e parametri restano quelli del 2.1.0.

## Modello 2.1.0 · ottobre 2026

Il modello 2.1.0 cambia un solo fattore dell'indice: lo shock termico. Ora vale solo per porcino e porcino rosso e guarda la temperatura del suolo, non quella dell'aria (sezione 6). L'evidenza è debole e lo diciamo: è un'osservazione preliminare in Francia. Le previsioni salvate conservano l'indice con e senza shock, per decidere a fine stagione se tenerlo.

Le altre novità non toccano l'indice:

- l'app scarica anche l'umidità del suolo tra 9 e 27 cm e l'evapotraspirazione di riferimento (ET₀), e le salva nelle previsioni datate (sezione 3);
- mostra, con la fonte, struttura del bosco, esposizione, disturbi visti da satellite e aree protette; non le pesa (sezione 7);
- nel Parco Gran Sasso-Laga non propone punti in zona A e B, dove il Piano esclude il prelievo;
- descrive meglio l'ultimo tratto a piedi e controlla i tempi dei sentieri (sezione «Il fattore umano»).

Una prova offline sui porcini di Bielefeld ha misurato quanto la parte meteo dell'indice ordina i giorni con ritrovamenti (sezione «Una prova offline»). Non ha cambiato nessun parametro.

## Estensione del pilota Lazio · 19 ottobre 2026

Il pilota comprende 36 zone selezionate nelle cinque province: le 15 zone iniziali del Reatino e 21 nuove zone. Non rappresenta l’intero territorio regionale. Il filtro Provincia limita insieme proposte e mappa; la base predefinita resta Rieti, modificabile nel profilo.

Per le nuove zone, centri e riferimenti derivano da fonti degli enti gestori e tracce istituzionali. Il raggio è una scelta editoriale per campionare habitat e meteo, non il confine di un parco né un’autorizzazione di accesso. Tutte le 21 nuove zone hanno 317 punti reali di Carta Forestale e rilievo (6.657 in totale), con DEM Copernicus GLO90 omogeneo: la data di acquisizione non trasforma la carta in una rilevazione attuale della vegetazione.

L’indice fungino conserva i parametri sperimentali esistenti: non è calibrato né validato sui ritrovamenti nelle nuove zone. Non sono stati assegnati valori di notorietà alle nuove zone; affollamento e comodità restano assenti quando mancano gli ingressi verificati. Cinque soste documentate hanno itinerari stradali da Rieti; per gli altri luoghi non si inventano parcheggi, tempi di guida o fondo asfaltato. Un arco stradale vicino a un campione non prova il diritto di transito.

Le proposte mostrano le condizioni di raccolta locali. Cerasella e Verdesca sono un’uscita di osservazione per il pubblico generale: il disciplinare Circeo 2026 riserva la raccolta a specifiche categorie autorizzate e aree. Uno stato locale “da verificare” non equivale a permesso di raccolta. Le lunghezze dei sentieri importati descrivono il tratto nella zona, non necessariamente un giro completo. Le tracce OSM sono distinte dagli itinerari descritti dagli enti e non sostituiscono la segnaletica.

Fonti, richieste, limiti e verifiche sono registrati in `incoming/lazio-pilot-2026-10-19/integration/`. Le descrizioni dei modelli storici riportate più sotto spiegano le euristiche originarie del Reatino, non attestano una validazione regionale.

Fungaroli invita a passeggiare, scoprire sentieri e imparare. L’app ha lo scopo di diventare più accurata grazie alle osservazioni degli utenti. La validazione della trovabilità è ancora iniziale e nessuna percentuale di accuratezza è disponibile.

Questa pagina spiega come Fungaroli Rieti calcola l’indice pubblico 0–10 con un decimale (modello 2.2.0; internamente 0–100 per conservare i dati storici) e che cosa c'è dietro ogni numero. I valori citati sono quelli in uso nell'app al momento della stesura.

## Come leggere le etichette

Ogni elemento del modello porta una di queste etichette. Le uso in modo stretto: se un valore non ha una fonte che lo sostiene, è un'euristica, anche quando sembra ragionevole.

| Etichetta | Significato |
|---|---|
| **Letteratura** | Esiste almeno uno studio pubblicato che lo sostiene. Indico quale studio e in quale contesto vale, che spesso è più ristretto del nostro. |
| **Dato ufficiale** | Dato prodotto da un ente o da un servizio con metodo documentato (Regione Lazio, Open-Meteo, OpenStreetMap). È un fatto sul dato, non sulla sua precisione sul terreno. |
| **Euristica** | Valore scelto da manualistica micologica, pratica dei cercatori o buon senso. È un parametro da tarare, non un risultato. |
| **Interpretazione** | Una lettura, mia o del codice, che collega un risultato di letteratura a una scelta del modello. |
| **Parere** | Un'opinione su cosa conviene fare. |

In sintesi, prima di entrare nel dettaglio: i dati di ingresso (bosco, quote, meteo, strade) sono solidi come fonte, ma ognuno ha una data e una scala da conoscere. La relazione tra meteo e nascite ha un appoggio in letteratura soprattutto per *Boletus edulis*: una faggeta tedesca (preprint 2025) e abetine di abete bianco sul Monte Amiata (Salerni et al. 2023, effetto dei picchi di caldo). Anche lì l'appoggio è parziale. *B. edulis* non vive solo in faggeta: in una pineta di pino silvestre in Spagna ha fruttificato ogni anno dal 1995 al 2004 (Martínez-Peña et al. 2012). Per i macromiceti nel loro insieme c'è la finestra di 30 giorni dei querceti toscani (Salerni et al. 2002). Quasi tutto il resto è euristica dichiarata.

## Che cosa calcola

Per ogni combinazione di **zona × fascia di quota × specie × giorno** l'app calcola un indice di idoneità alla fruttificazione. Non è una probabilità di trovare funghi e non è una stima di quantità: è un punteggio relativo che dice quanto le condizioni di quel giorno somigliano a quelle in cui la specie di solito fruttifica.

Ogni zona ha tre fasce di quota. Per ogni specie l'app tiene la fascia con l'indice più alto.

### Più funghi insieme e passeggiate

La zona mostra il **massimo indice calcolabile** delle specie selezionate, senza bonus dal loro numero. È un indice di condizioni di crescita, non una probabilità di trovare almeno una specie. Aggiungere taxa simili non aumenta automaticamente il valore. Le specie possono avere la quota migliore in parti diverse della zona.

Le preferenze di distanza, comodità e folla cambiano solo l’ordine dei consigli. Le segnalazioni recenti della community possono modificare questa priorità, non il numero biologico. La mappa usa riquadri larghi quanto il reticolo originario della zona: 300–500 m. Il colore deriva da un campione di habitat e dal meteo della fascia; non verifica presenza, alberi ospiti puntuali, transitabilità o permesso di raccolta.

### La formula

```
indice pubblico = 10 × stagione × habitat × quota × pioggia × temperatura × suolo × gelo × caldo
```

Il prodotto è limitato tra 0 e 1. Internamente l'app conserva un intero 0–100; l’interfaccia lo divide per 10 e mostra un decimale italiano, per esempio 72 → 7,2. Fino al modello 2.1.0 c'era anche lo shock termico, l'unico fattore che poteva superare 1 (×1,15, solo porcino e porcino rosso): dal 2.2.0 non c'è più (sezione 6). Nessuno di questi coefficienti è stato calibrato nel Reatino.

Una conseguenza del prodotto, da tenere a mente: basta un fattore vicino a zero per azzerare l'indice. È voluto (senza bosco adatto o fuori stagione non ha senso andare), ma rende il modello severo. Un fattore a 0,5 dimezza tutto, anche se gli altri sono perfetti.

### I parametri globali

| Parametro | Valore | Etichetta |
|---|---|---|
| Finestra della pioggia cumulata | 30 giorni | Letteratura (Salerni et al. 2002) |
| Finestra della temperatura media | 20 giorni | Letteratura (preprint 2025, solo *B. edulis*) |
| Evento singolo che conta come innesco | 8 mm | Euristica |
| Sotto questo valore il suolo è secco | 0,10 m³/m³ | Euristica |
| Sopra questo valore il suolo è pienamente umido | 0,26 m³/m³ | Euristica |
| Minima che blocca o danneggia i carpofori | −1 °C | Euristica |
| Massima che secca lettiera e carpofori | 30 °C | Euristica |
| Calo della temperatura del suolo che conta come shock (solo porcino e porcino rosso) | 5 °C (non usato dal 2.2.0) | Euristica, con il valore di un'osservazione preliminare (Olivier et al. 1997) |
| Giorni tra il calo e il bonus | da 6 a 15 | Euristica, con i tempi della stessa osservazione |
| Giorni della media di riferimento prima del calo | 3 | Euristica (la fonte non lo dice) |
| Giorni su cui il calo può distribuirsi | 5 | Interpretazione delle «3–5 notti» della fonte |
| Bonus del giorno con shock | ×1,15 (non usato dal 2.2.0) | Euristica, senza fonte |
| Semiampiezza della fascia di quota per leggere il bosco | 150 m | Euristica |

## I fattori, uno per uno

### 1. Pioggia

È il fattore centrale. Combina due grandezze.

**La pioggia nella finestra di latenza.** Ogni specie ha un intervallo `lag = [min, max]` di giorni tra la pioggia e la nascita. Per il giorno *d* l'app somma la pioggia caduta tra *d − max* e *d − min* (estremi inclusi). Per il porcino `lag = [7, 21]`: conta la pioggia caduta da 21 a 7 giorni prima, cioè 15 giorni di pioggia. La pioggia degli ultimi 6 giorni per il porcino non conta ancora.

**La pioggia cumulata dei 30 giorni precedenti** (da *d − 30* a *d − 1*).

Le due grandezze entrano con curve a saturazione:

```
pioggia = 0,6 × (1 − e^(−latenza / eref)) + 0,4 × (1 − e^(−cumulata30 / (2 × eref)))
```

`eref` è specifico per specie:

- 30 mm per porcino (*edulis*), porcino rosso (*pinophilus*), finferlo, trombetta dei morti e steccherino dorato;
- 28 mm per porcino nero (*aereus*), porcino estivo (*aestivalis*) e ovolo buono;
- 25 mm per mazza di tamburo, chiodino, colombina e pinarolo, che hanno latenze brevi (da 4–5 a 14–15 giorni), e per moretta e agarico violetto, che hanno latenza 7–18 giorni.

Più pioggia aumenta sempre il fattore, ma con rendimenti decrescenti.

**L'innesco.** Pioggia diffusa e debole vale meno di un evento vero. L'app calcola

```
innesco = max( pioggia_max_giornaliera_nella_finestra / 8 mm , pioggia_nella_finestra / 15 mm )   (limitato a 1)
pioggia = pioggia × (0,5 + 0,5 × innesco)
```

Quindi il fattore si dimezza solo se nella finestra non c'è nessun giorno con almeno 8 mm **e** il totale della finestra è sotto i 15 mm. Tra questi estremi la penalità è graduale. Il testo nell'interfaccia ("senza un evento ≥ 8 mm il fattore si dimezza") semplifica: la seconda condizione sui 15 mm non è menzionata.

| Elemento | Etichetta | Base |
|---|---|---|
| Finestra cumulata di 30 giorni | **Letteratura** | Salerni et al. (2002), querceti mediterranei in Toscana: tra le finestre provate (5, 10, 15, 30 giorni) la correlazione tra numero di carpofori e pioggia è risultata più forte sui 30 giorni. Lo studio riguarda i macromiceti nel loro insieme, non il porcino. |
| Ordine di grandezza di 3-4 settimane | **Letteratura** | Brejon Lamartinière e Hoffman (2025, preprint): in una faggeta tedesca la fruttificazione di *B. edulis* cresce linearmente con la pioggia cumulata su una finestra di 26 giorni. |
| Finestra di latenza per specie (es. 7-21 gg) | **Euristica** | Nessuno degli studi citati fornisce questo intervallo. Viene dalla manualistica e dalla pratica ("i porcini escono dopo una o due settimane dalla pioggia buona"). |
| Pesi 0,6 / 0,4, `eref`, curva a saturazione | **Euristica** | Il preprint descrive un effetto lineare della pioggia; la saturazione è una scelta del modello per non premiare all'infinito i nubifragi. **Interpretazione**: è una scelta prudente, ma non è stata confrontata con dati. |
| Soglia di 8 mm e alternativa 15 mm | **Euristica** | Nessuna fonte. |

### 2. Temperatura

L'app calcola la temperatura media dell'aria dei 20 giorni precedenti (da *d − 20* a *d − 1*) e la confronta con l'ottimo della specie con una curva a campana:

```
temperatura = e^( −0,5 × ((T20 − topt) / tsd)² )
```

Con `topt = 13 °C` e `tsd = 3,5 °C` per il porcino: a 13 °C il fattore vale 1, a 9,5 o 16,5 °C vale circa 0,61, a 6 o 20 °C vale circa 0,14.

| Specie | `topt` (°C) | `tsd` (°C) | Etichetta |
|---|---|---|---|
| Porcino (*B. edulis*) | 13 | 3,5 | **Letteratura** per l'ottimo, **Euristica** per l'ampiezza |
| Porcino rosso (*B. pinophilus*) | 13 | 3,5 | Euristica (assimilato a *edulis*) |
| Porcino nero (*B. aereus*) | 18 | 3,5 | Euristica |
| Porcino estivo (*B. aestivalis*) | 17 | 3,5 | Euristica |
| Ovolo buono (*A. caesarea*) | 19 | 3,5 | Euristica |
| Finferlo (*C. cibarius*) | 15 | 4 | Euristica |
| Trombetta dei morti (*C. cornucopioides*) | 12 | 4 | Euristica |
| Steccherino dorato (*H. repandum*) | 11 | 4 | Euristica |
| Mazza di tamburo (*M. procera*) | 15 | 4,5 | Euristica |
| Chiodino (*A. mellea*) | 11 | 3,5 | Euristica |
| Colombina / verdone (*R. virescens*, *R. cyanoxantha*) | 17 | 4 | Euristica |
| Pinarolo (*Suillus* spp.) | 12 | 4 | Euristica |
| Moretta (*T. terreum*) | 9 | 3,5 | Euristica |
| Agarico violetto (*L. nuda*) | 8 | 3,5 | Euristica |

**La base per il porcino.** Brejon Lamartinière e Hoffman (2025) hanno analizzato dieci anni (2015-2024) di conteggi giornalieri di carpofori di *B. edulis* in una faggeta vicino a Bielefeld, in Germania, con modelli lineari generalizzati misti. Il picco di fruttificazione coincide con una temperatura media di circa 13 °C calcolata sui 20 giorni precedenti. Qui si usa la versione **bioRxiv v2**; al 13 ottobre 2026 la pagina del laboratorio degli autori indica il lavoro **in stampa su Fungal Ecology** (https://thehoffmanlab.com/publications/). Questo aggiornamento non valida il modello dell’app, e riguarda un solo sito di pianura centro-europea. Nella versione 2 (giugno 2026), che sostituisce la prima: ottimo termico di circa 13 °C sulla media dei 20 giorni (13,7 °C nella didascalia della Fig. 4: testo e figura non coincidono); effetto lineare e positivo della pioggia cumulata su 26 giorni (26-32 nei due siti più produttivi), **senza soglia di innesco né soglia superiore**; fruttificazioni concentrate tra 10 e 15 °C e 2-4 mm di pioggia media al giorno nella finestra. L'umidità del suolo non è misurata e lo **shock termico non compare** nel modello. **Conseguenza per l'app**: le soglie di innesco a 8 e 15 mm e il bonus per shock termico non vengono da questo lavoro. Le soglie di innesco restano euristiche di pratica micologica; per lo shock vedi la sezione 6. **Interpretazione**: applicarlo alle faggete del Terminillo o della Laga è un'estrapolazione ragionevole per la specie e l'habitat, meno per il clima (l'Appennino ha estati più calde e secche e un regime di piogge diverso).

**Il lato freddo, da verificare.** Nello stesso preprint le fruttificazioni di *B. edulis* sono quasi assenti con medie tra 5 e 10 °C. La curva dell'app è simmetrica: con `tsd` 3,5 dà ancora 0,61 a 9,5 °C e 0,36 a 8 °C. Anche Olivier et al. (1997) non osservano fruttificazioni di *B. edulis* con la temperatura del suolo sotto 10 °C, ma è un'altra grandezza. **Interpretazione**: la curva può essere troppo generosa sul lato freddo. È un limite da verificare con le uscite, non un parametro cambiato: il dato viene da un solo sito di pianura.

**Le altre specie.** Gli ottimi termici sono stime coerenti con la stagionalità nota (specie estive e termofile più alte, specie tardive più basse) ma non hanno una fonte puntuale. Per i quattro porcini Olivier et al. (1997) danno solo un ordine qualitativo: porcino nero "relativamente termofilo", porcino estivo più precoce nella stagione, porcino rosso soprattutto montano. È coerente con i valori dell'app, ma non li sostiene come numeri. Sono il primo candidato alla taratura.

### 3. Umidità del suolo

L'app usa l'umidità volumetrica del suolo tra 3 e 9 cm di profondità (variabile `soil_moisture_3_to_9cm` di Open-Meteo, in m³/m³), media giornaliera dei valori orari, mediata sui 3 giorni precedenti:

```
suolo = max( 0,15 , clamp((umidità − 0,10) / (0,26 − 0,10))^0,6 )
```

Sotto 0,10 il fattore resta a 0,15 (non scende a zero), sopra 0,26 vale 1. Se una finestra meteorologica necessaria è incompleta, l’indice è non calcolabile. Il dato mancante non viene trasformato in condizioni sfavorevoli o assenza di funghi.

| Elemento | Etichetta | Note |
|---|---|---|
| Variabile di umidità del suolo | **Dato ufficiale** | È l'uscita di un modello meteorologico, non una misura. Non conosce il suolo reale né il substrato: calcari e flysch trattengono l'acqua in modo diverso (vedi sotto). |
| Soglie 0,10 / 0,26, esponente 0,6, minimo 0,15 | **Euristica** | Nessuna fonte. Il minimo a 0,15 serve a non annullare l'indice quando il modello di suolo sbaglia. |

**Da dove viene il dato.** L'app non sceglie un modello: Open-Meteo usa la combinazione predefinita (*best match*). In una verifica del 15 ottobre 2026 a Vallonina lo strato 3–9 cm veniva dal modello tedesco DWD ICON: ICON-EU (celle di circa 7 km) fino a circa 5 giorni di previsione, poi ICON globale (circa 11 km). Gli altri modelli interrogati non davano questa variabile. Nel modello ICON questo è uno strato di suolo minerale: ogni cella ha una sola classe di tessitura, dalla sabbia all'argilla, presa dalla carta mondiale dei suoli FAO e uguale a tutte le profondità. Non c'è uno strato di lettiera, cioè di foglie a terra. Una volta al giorno un'analisi corregge l'umidità del suolo per migliorare la previsione della temperatura a 2 m. **Dato ufficiale** (documentazione Open-Meteo e manuale del modello ICON).

Open-Meteo annuncia che dopo il 30 novembre 2026 i modelli ICON useranno le griglie native: celle e serie possono cambiare. Va annotato per i confronti con le previsioni salvate.

**Dati registrati, non usati.** Dal modello 2.1.0 l'app scarica anche l'umidità del suolo tra 9 e 27 cm (`soil_moisture_9_to_27cm`, stesso controllo 0–1 e stesse 24 ore valide dello strato 3–9 cm) e l'evapotraspirazione di riferimento giornaliera (ET₀ FAO-56, `et0_fao_evapotranspiration`, mm al giorno). Sono **Dato ufficiale** di Open-Meteo, cioè uscite di modello. Non entrano nell'indice: si salvano nelle previsioni datate (scelta del 16/10/2026), per vedere poi sulle uscite se servono. Una copia meteo salvata prima di questo cambio non le ha: valgono come dato mancante.

**Il vento.** L'indice non ha un fattore vento. Vento, sole e aria secca agiscono solo attraverso l'evaporazione e la traspirazione calcolate dal modello di suolo. Per esempio, a Vallonina dopo circa 45 mm di pioggia (6–12 ottobre 2026) lo strato 3–9 cm del modello è sceso da 0,225 a 0,190 in circa 42 ore di vento (13–14 ottobre): un calo graduale. Non ho trovato studi che misurino un effetto del vento sulla fruttificazione, quindi l'app non aggiunge penalità per il vento.

**Le soglie sono uguali, le celle no.** Le soglie 0,10 e 0,26 valgono per tutte le zone, ma ogni cella ha una sua classe di suolo e quindi un suo intervallo. Tra il 3 e il 15 ottobre 2026, a 3–9 cm: Tancia (850 m) da 0,149 a 0,367; Laga (1350 m) da 0,100 a 0,235; Cicolano (900 m) da 0,110 a 0,310; Vallonina (1450 m) da 0,104 a 0,266. **Interpretazione**: con le stesse soglie il fattore suolo del Tancia difficilmente scende sotto 0,5, mentre quello della Laga arriva a fatica sopra 0,9. La differenza dipende dalla classe di suolo della cella, non dalla geologia reale.

**Il substrato.** Secondo la Carta Geologica d'Italia 1:100.000 (ISPRA), al centro delle zone non ci sono rocce vulcaniche come i tufi del Viterbese o dei Castelli Romani. Il contrasto vero è tra rocce carbonatiche, cioè calcari e dolomie (Vallonina, Leonessa, Poggio Bustone e Cantalice, Tancia, Antrodoco, Pian de' Rosce, Cinque Confini, Valle di Malito, Rascino), e rocce arenacee o marnose come i flysch (Laga, Cittareale, Domo, Cicolano, Pescorocchiano, Monte San Giovanni in Sabina). Dentro ogni cerchio le rocce possono essere miste. Non ho trovato studi che diano un peso numerico al substrato nella risposta dei funghi alla pioggia: resta un limite dichiarato, senza fattore nell'indice.

**Interpretazione**: questo fattore si sovrappone in parte alla pioggia. Serve soprattutto a cogliere i casi in cui la pioggia è caduta ma il suolo del modello si è già asciugato per caldo o vento.

### 4. Gelo

Se la temperatura minima di uno dei 5 giorni che terminano con *d* (da *d − 4* a *d*) scende sotto −1 °C, il fattore vale 0,35. Per le specie che tollerano il gelo (moretta e agarico violetto) vale 0,7. Altrimenti vale 1.

**Etichetta: Euristica.** È noto dalla pratica che le gelate fermano le nascite e rovinano i carpofori, ma la soglia, la finestra e i valori di penalità non hanno una fonte.

### 5. Caldo

Se la massima di uno dei 3 giorni precedenti (da *d − 3* a *d − 1*) supera 30 °C, il fattore vale 0,65.

**Etichetta: Euristica**, con un appoggio parziale. Salerni, Paoli e Perini (2023) hanno osservato in abetine artificiali di *Abies alba* che picchi improvvisi della temperatura massima sembrano deprimere la produttività di *B. edulis* dove il bosco non è diradato o lo è poco, mentre nei siti molto diradati le alte temperature sembrano favorirla a partire da circa 20 giorni dopo l'evento. **Interpretazione**: lo studio conferma che i picchi di caldo contano, ma dice anche che l'effetto dipende dalla gestione del bosco, che il modello non conosce. La penalità fissa è una semplificazione.

### 6. Shock termico: calo della temperatura del suolo (tolto dal modello 2.2.0)

**Dal modello 2.2.0 (24/10/2026) lo shock non entra più nell'indice.** Nella prova sull'Italia 2023–2025 (in apertura) l'ordine dei giorni era lo stesso con e senza bonus, entro ±0,01 su 110 ritrovamenti di porcino. La descrizione qui sotto resta come storia del modello 2.1.0.

Dal modello 2.1.0 lo shock vale **solo per porcino e porcino rosso** e guarda la temperatura del suolo a 6 cm, una media giornaliera di Open-Meteo. Per le altre 12 specie il fattore vale sempre 1.

Come lo calcola l'app, per il giorno *d*:

- per ogni giorno *k* confronta la temperatura del suolo con la «temperatura iniziale»: la media di 3 giorni più calda tra quelle che finiscono da 1 a 5 giorni prima di *k*;
- c'è un calo quando la differenza arriva ad almeno 5 °C e il giorno prima non ci arrivava;
- se un calo cade tra 15 e 6 giorni prima di *d*, il fattore vale 1,15; altrimenti 1. Più cali nella finestra non si sommano.

```
shock = 1,15   se un calo di almeno 5 °C cade tra d − 15 e d − 6   (solo porcino e porcino rosso)
shock = 1      in tutti gli altri casi
```

Se mancano dati della temperatura del suolo e nessun calo è dimostrato, il bonus non si applica e la scheda lo dice. L'indice resta calcolabile: questo fattore può solo aggiungere. Nelle ragioni dell'indice compare per ultimo, come «possibile innesco, osservazione preliminare», con l'etichetta Euristica.

**La fonte.** È l'unica osservazione di campo sui porcini che ho trovato a sostegno dell'idea: Olivier, Guinberteau, Rondet e Mamoun (1997). Su circa 50 parcelle di porcini nella Francia sud-occidentale e occidentale (Aquitania, Midi-Pirenei, Limosino, Poitou-Charentes), con termometri nel suolo e nell'aria, riportano che:

- serve una pioggia forte, oltre 50 mm in dieci giorni, che tenga umido il suolo;
- le nascite partono di solito dopo un calo di circa 5 °C della temperatura del suolo nei primi 10 cm, che dura in tutto circa 20 ore in 3–5 notti;
- il calo arriva in genere durante o dopo la pioggia;
- i primi carpofori compaiono dopo 6–15 giorni (6–10 con temperature sopra 15 °C, 8–15 sotto);
- un nuovo calo di almeno 3 °C durante la buttata la ferma;
- da giugno a metà agosto, per porcino nero e porcino estivo, lo shock sembra contare poco e conta soprattutto l'acqua;
- per i pinaroli (*Suillus*) non serve un vero shock termico.

Gli autori presentano questi dati come una base da affinare. Il preprint di Brejon Lamartinière e Hoffman non considera lo shock: non lo conferma e non lo smentisce.

**Un'evidenza debole, detta in chiaro.**

- **Una sola osservazione preliminare.** Nessuna analisi statistica, un clima diverso da quello dell'Appennino, specie seguite: porcino, porcino nero e porcino estivo. Il porcino rosso non c'era: è assimilato al porcino (**Euristica**).
- **Doppio conteggio con la pioggia.** Il calo arriva spesso con la pioggia, e la pioggia è già nel fattore 1. **Interpretazione**: una parte del bonus può premiare due volte lo stesso evento.
- **Sovrapposizione con la temperatura.** Il calo del suolo arriva di solito con un calo dell'aria, che sposta anche la media dei 20 giorni del fattore 2. **Interpretazione**: sopra l'ottimo di 13 °C i due fattori salgono insieme, sotto vanno in senso opposto. Quanto si sovrappongano non è stato misurato.
- **Metà della fonte non è implementata.** L'app non ferma la buttata con un nuovo calo di almeno 3 °C e non chiede che il calo arrivi durante o dopo la pioggia.
- **Il dato non è una misura.** La fonte misura a −10 cm, nel bosco. L'app usa la temperatura del suolo a 6 cm di un modello meteorologico (lo strato più vicino: gli altri sono a 0, 18 e 54 cm), in medie giornaliere. Le ore fredde sparse su più notti, con una media del giorno meno bassa, non si vedono: l'app vede meno cali, mai di più.
- **Il valore del bonus** (×1,15) non viene da nessuna fonte.

**Che cosa cambia rispetto al modello 2.0.0.** Prima lo shock usava la temperatura dell'aria (calo di 4 °C tra 14 e 4 giorni prima) e valeva per tutte le 14 specie, ×1,225 per il chiodino. **Fatto verificato** il 21/10/2026 sul meteo reale delle 36 zone, dall'11 al 28 ottobre 2026 (10 giorni passati e 8 di previsione, copia del servizio meteo dell'app): su 9.072 combinazioni zona × giorno × specie l'indice cambia in 635 (7,0%). Ne scendono 632 e ne salgono 3. Il nuovo calo del suolo scatta in 5 combinazioni di porcino o porcino rosso su 1.296 (Domo e Cittareale, calo di circa 5,8 °C il 27 settembre); il vecchio calo dell'aria in 118. L'indice mostrato per la zona cambia in 63 zone-giorno su 648 (9,7%), la classe in 24. Dove cambia, la differenza media è di 0,4 punti su 10, al massimo 1,6 (chiodino). **Interpretazione**: su questa serie quasi tutta la differenza viene dal bonus tolto, non da quello nuovo. Sono 18 giorni di un solo autunno: non dicono quanto spesso il calo scatti in una stagione intera.

**Il punto di decisione.** Le previsioni salvate conservano due indici: con e senza shock, oltre alla temperatura del suolo che lo ha deciso. A fine della prossima stagione, con uscite del Taccuino che abbiano zeri espliciti, si confrontano le due versioni sulle stesse uscite. Se la versione con shock non fa meglio, lo shock si toglie. **Esito** (24/10/2026): la prova sull'Italia ha anticipato la decisione e lo shock è stato tolto nel 2.2.0.

### 7. Habitat: la Carta Forestale campionata per fascia di quota

Questo è il fattore più solido come dato e il più originale come costruzione.

**Il dato.** Per ogni zona la preparazione dei dati scarica i poligoni della *Carta Forestale su base tipologica* della Regione Lazio (servizio WFS del geoportale regionale; descrive il bosco del 2005–2007) dentro un cerchio attorno al centro della zona, con il raggio della zona. Poi posa una griglia regolare di 21 × 21 punti sul quadrato che contiene il cerchio e tiene i punti che cadono nel cerchio (tra 313 e 317 per zona nei dati attuali). Per ogni punto registra la quota (Open-Meteo Elevation API, DEM Copernicus GLO-90 a 90 m) e la categoria forestale del poligono che lo contiene, oppure "non bosco".

**Il calcolo.** Per una fascia di quota (per esempio 1200 m) l'app prende i punti con quota entro ±150 m (1050-1350 m), calcola la frazione di ciascuna categoria e la pesa con l'affinità della specie:

```
idoneità = Σ (frazione_categoria × affinità_specie[categoria])
habitat  = min(1, idoneità / 0,45)
```

Il 45% di bosco pienamente idoneo nella fascia basta per un habitat "pieno".

**Le affinità.** Ogni specie ha un valore 0-1 per categoria. Esempio per il porcino: faggeta 1, castagneto 0,7, cerreta 0,6, rimboschimenti di conifere 0,6, roverella 0,4, bosco di forra 0,4, ostrieto 0,2, tutto il resto 0.

| Elemento | Etichetta | Note |
|---|---|---|
| Poligoni e categorie forestali | **Dato ufficiale** | Regione Lazio. Derivata dalla carta delle formazioni naturali e seminaturali con approfondimento al IV e V livello Corine Land Cover (metadati del dataset). Fotointerpretazione di immagini aeree del 2005–2007 e satellitari del 2005–2006, collaudo finale nel febbraio 2011: tagli, incendi e cambi successivi non si vedono. Scala nominale 1:10.000 (tavole di stampa 1:25.000), unità minima 0,5 ettari. |
| Ceduo o fustaia | **Dato ufficiale**, mostrato e non pesato | Ogni poligono ha anche la struttura del bosco (campo `strutt`: ceduo, fustaia o struttura composita) e il grado di copertura delle chiome. Dal modello 2.1.0 la scheda mostra la struttura, ma l'indice non la usa (vedi sotto). Nei cerchi delle zone le faggete sono quasi tutte fustaie (96%), cerrete e querceti di roverella quasi tutti cedui (calcolo sui dati del WFS, ottobre 2026). Non c'è un dato sull'età o sull'anno del taglio. |
| Quote dei punti | **Dato ufficiale** | Copernicus GLO-90 è un modello di superficie (include la chioma degli alberi), a 90 m di risoluzione. In un bosco d'alto fusto la quota può risultare qualche metro più alta del suolo; su un campionamento per fasce di 300 m l'errore è trascurabile. |
| Affinità specie-bosco | **Euristica** | Dalla manualistica micologica e dal documento di partenza. Sono plausibili come ordine (il porcino ama la faggeta, i pinaroli solo i pini) ma i valori intermedi sono scelte. Per i quattro porcini Olivier et al. (1997) confermano l'ordine solo a parole: porcino sotto latifoglie e conifere, in pianura e in media montagna; porcino nero ed estivo soprattutto sotto querce e castagni; porcino rosso sotto conifere, a volte sotto faggio. |
| Fascia ±150 m, soglia 45% | **Euristica** | |

**Perché per fascia di quota e non per area.** Una zona di montagna mescola boschi molto diversi: a Poggio Bustone la roverella domina in basso e la faggeta sopra i 1000 m. Una composizione media della zona direbbe "un po' di tutto"; il campionamento per quota dice quale bosco trovi alla quota a cui pensi di andare. **Parere**: è la scelta che rende l'app utile sul campo, più dell'accuratezza dei parametri meteo.

**Un dettaglio da sapere.** La griglia ha sempre 21 punti per lato, quindi la densità dipende dal raggio: un punto ogni 300 m nelle zone di raggio 3 km, ogni 500 m nel Cicolano (raggio 5 km). Nelle fasce di quota poco rappresentate i punti possono essere pochi, e la composizione diventa rumorosa. La scheda riporta il numero di campioni della fascia; non li tratta come osservazioni indipendenti e non deriva da essi una percentuale di affidabilità.

**Informazioni sul bosco, da leggere e non pesate.** Per ogni punto campione delle 15 zone del Reatino l'app conosce anche alcuni dati che mostra con la fonte, nella fascia della zona e nella sezione «La zona». Nessuno entra nell'indice e nessuno dice dove crescono funghi.

| Informazione | Fonte | Etichetta | Limiti |
|---|---|---|---|
| Ceduo, fustaia o struttura composita | Carta Forestale, Regione Lazio | **Dato ufficiale** | Bosco del 2005–2007; è un attributo del poligono, non del punto. |
| Pendenza ed esposizione | TINITALY 1.1, INGV, modello del terreno a 10 m (CC BY 4.0) | **Dato ufficiale** | Calcolate su 30 m attorno al punto. Sotto 5° il punto è «in piano»: la soglia è un'**Euristica**. |
| Ultimo disturbo visto da satellite (anno e causa: vento o insetti, incendio, taglio) | European Forest Disturbance Atlas v3.0, 1985–2024, pixel di 30 m (CC BY 4.0) | **Dato ufficiale** | Da Landsat si vedono meglio tagli a raso e incendi dei tagli parziali; la causa è una stima del modello; ci sono falsi positivi. L'app scrive sempre «da verificare sul posto» e non dice quando un bosco «torna buono». |
| Area protetta e zona del piano | Geoportale della Regione Lazio (perimetri PTPR Tav. B e zonazioni dei piani) | **Dato ufficiale** | Cartografia indicativa: fa fede quella dell'ente. Si ferma al confine del Lazio. |

Le 21 zone aggiunte il 19/10 non hanno ancora questi dati: per loro la scheda non li mostra e il punto d'accesso segue il metodo precedente.

**Zone A e B del Parco Gran Sasso-Laga.** Il Piano del Parco esclude il prelievo delle risorse naturali biotiche nelle zone A (riserva integrale) e B (riserva generale orientata), salvi usi civici e diritti reali (Normativa di attuazione, art. 7, c. 7 e art. 8, c. 7). L'app non propone questi punti come accesso o destinazione, per tutti gli interessi. **L'indice biologico non cambia**: descrive le condizioni del bosco, non il permesso di raccolta. Nella zona Laga sono 169 punti campione su 313 (23 in zona A, tutti fuori bosco; 146 in zona B, di cui 74 di bosco). Alla fascia dei 1.600 m tutto il bosco adatto ai funghi è in zona B: la scheda lo dice con la frase «In questa fascia il bosco adatto è in zona di riserva del Parco: la raccolta è esclusa». La mappa ha un livello «Aree protette» con perimetri e zone dei piani del Gran Sasso-Laga e della Duchessa, preso dal servizio WMS della Regione: è indicativo. Gli altri parchi con zone di riserva non sono stati verificati.

### 8. Quota

```
quota = 1                                se la fascia è dentro [min, max] della specie
quota = max(0, 1 − distanza / 200 m)     se è fuori
```

Il porcino ha quote da 700 a 1800 m: a 600 m il fattore vale 0,5, a 500 m vale 0.

**Etichetta: Euristica** (range dalla manualistica e dal documento di partenza, decadimento su 200 m scelto).

### 9. Stagionalità

Ogni specie ha 12 pesi mensili (gennaio-dicembre), interpretati come valori al giorno 15 di ogni mese e interpolati linearmente usando la durata reale tra queste date. Il porcino, per esempio, vale 0 da gennaio ad aprile, 0,1 a maggio, poi sale fino a 1 a settembre e ottobre, 0,4 a novembre, 0 a dicembre.

**Etichetta: Euristica** basata sul documento di partenza e sulla manualistica locale.

**Cosa dice la letteratura sul tema.** Kauserud et al. (2012), su oltre 746.000 segnalazioni datate di 486 specie autunnali in quattro paesi europei, hanno osservato tra il 1970 e il 2007 un allungamento della stagione di fruttificazione e uno spostamento in avanti della data media. Büntgen et al. (2013), su inventari svizzeri 1975-2006, riportano un ritardo autunnale medio di 12 giorni dopo il 1991. La rassegna di Boddy et al. (2014) conclude che la fenologia sta cambiando in molti paesi europei, con stagioni mediamente più lunghe ma risposte diverse tra specie e luoghi. **Interpretazione**: pesi mensili fissi, presi da manuali scritti con il clima di qualche decennio fa, rischiano di chiudere la stagione troppo presto in autunno. Se il diario mostra nascite a novembre con indice basso, il primo sospetto è la stagionalità.

### 10. Completezza dei dati e incertezza

La vecchia percentuale di affidabilità è stata rimossa: non misurava gli errori del modello. Ora il calcolo distingue completezza delle finestre, uso di meteo previsto, data di acquisizione e numero di campioni forestali. Il giorno dell’acquisizione contiene ancora previsioni e non è etichettato come osservato.

Devono essere completi pioggia antecedente, temperatura media, umidità del suolo, minime e massime nelle finestre richieste. Un giorno di suolo richiede almeno 24 valori orari validi. Un habitat privo di campioni produce stato non calcolabile. Non si sostituiscono pioggia mancante con zero, suolo mancante con 0,5 o estremi mancanti con assenza di gelo/caldo.

La cache conserva il timestamp originale. Dati biologici più vecchi di 24 ore non producono indici per oggi e il futuro. Se la data corrente non è nella serie non viene associata al primo giorno. I dati meteorologici passati restano uscite di modello. L’accuratezza della trovabilità deve essere misurata con dati locali e un protocollo di ricerca.

## Il meteo dell'uscita

L'indice usa il meteo **passato** (che fa nascere i funghi). Separatamente l'app legge le **previsioni orarie** Open-Meteo per la mattina dell'uscita, alla quota centrale di ogni zona, dall’ora intera di apertura della raccolta (un’ora prima del sorgere del sole) alle 13: pioggia, probabilità di pioggia, temporali, neve, nebbia (codici WMO), raffiche e temperatura. Pioggia, probabilità e raffiche orarie di Open-Meteo si riferiscono all’ora precedente: la finestra effettiva comincia quindi un’ora prima. Con il sorgere del sole alle 7:16, per esempio, pioggia e raffiche vengono lette dalle 5 alle 13.

| Livello | Quando | Effetto |
|---|---|---|
| meteo senza criticità segnalate | nessuna delle condizioni sotto, previsione aggiornata | nessuno |
| tempo incerto | pioggia da 1 mm nella finestra, probabilità almeno 50%, raffiche da 40 km/h, nebbia per almeno due ore | ordine dei consigli × 0,85 |
| uscita sconsigliata | temporali, neve, pioggia da 5 mm, raffiche da 60 km/h | ordine dei consigli × 0,55 |
| meteo non verificabile | previsione mancante, incompleta, senza data o più vecchia di 3 ore; oppure senza criticità ma più vecchia di un’ora | ordine dei consigli × 0,75 |

**Euristica**: soglie e pesi scelti per sicurezza e comodità in bosco, non da letteratura. Il livello cambia solo l’ordine dei consigli, non l’indice mostrato. La finestra mattutina alla quota centrale non sostituisce la previsione del percorso e del rientro. Una previsione incompleta o senza data valida non diventa mai «senza criticità». Una previsione con criticità resta in uso fino a tre ore dall’acquisizione; dopo la prima ora porta l’avviso che va aggiornata. Quando il meteo di una zona non è senza criticità, l’app propone un’alternativa nello stesso giorno: una zona senza criticità segnalate, con indice almeno il 70% di quello della prima e non sotto 3,0. Nella scheda compare come «Tempo migliore a …».

## Come sono state scelte le zone

Le prime 7 zone vengono dal documento di partenza. Il 12 ottobre 2026 ne sono state aggiunte 8 incrociando due fonti indipendenti.

1. **Dove va la gente**. Ricerca sulle testate locali (RietInVetrina, La Provincia di Rieti, Format Rieti, Sabina Magazine, Frontiera, Il Messaggero Rieti): soccorsi, sanzioni e sequestri di cercatori di funghi indicano dove si raccoglie, non quanto si trova. **Fatto** per i luoghi citati; la popolarità assegnata a ogni zona è un'**interpretazione**.
2. **Dove c'è il bosco giusto alla quota giusta**. Reticolo di punti ogni 1 km entro 55 km da Rieti: tipo di bosco dalla Carta Forestale e quota dal DEM Copernicus. Per ogni punto l'idoneità di ogni specie (affinità bosco × quota, le stesse tabelle del modello), pesata per interesse (porcini e ovolo 1, finferli 0,8, altre 0,6, pineta 0,5) e sommata nel raggio di 2,5 km. **Euristica**: non tiene conto di accessi, proprietà, età del bosco.

Zone aggiunte:
- con fonti e dati coerenti: Pian de' Rosce / Terminillo ovest, Cinque Confini / Monte Bove, Cittareale, Pescorocchiano, Valle di Malito, Monte San Giovanni in Sabina;
- solo dai dati, segnate come meno battute: faggete di Leonessa, Domo / valle del Tronto.

Colle Rinaldo (Borgo Velino) e i castagneti di Tonnicoda (Petrella Salto), il nucleo più esteso trovato dallo scanner, ricadono già nei cerchi di Antrodoco e del Cicolano. Le fasce di quota delle zone nuove sono il 20°, 50° e 80° percentile delle quote dei punti di bosco nel cerchio.

## Il fattore umano

Questi fattori non entrano nell'indice di fruttificazione. Servono a correggere la classifica in base alle preferenze attive e a dare consigli pratici. **Sono tutti euristiche**: non esistono studi sull'affollamento dei boschi reatini.

### Orari di raccolta, sorgere e tramonto del sole

**Fatto (Dato ufficiale e norma)**: la raccolta nel Lazio è vietata da un'ora dopo il tramonto a un'ora prima del sorgere del sole (L.R. 32/1998, art. 9 c.1, testo vigente: «levata del sole»). L'app calcola sorgere e tramonto per il centro della zona con le formule NOAA (errore di 1-2 minuti, rifrazione standard di 90,833°), e il test verifica per Rieti il 12 ottobre 2026 sorgere alle 07:16 e tramonto alle 18:33.

L'app non tiene conto dell'orizzonte reale: in una valle stretta il sole arriva più tardi, ma la formula usa il sorgere convenzionale del sole a un orizzonte standard (non il crepuscolo astronomico). Non certifica l’illuminazione del sentiero.

### Giorno della settimana e festivi

Peso del giorno: domenica e festivi 1; sabato 0,95; venerdì 0,55; lunedì 0,45; giovedì 0,4; martedì e mercoledì 0,35. I festivi sono quelli nazionali più Pasquetta (calcolata) e Santa Barbara, patrona di Rieti, il 4 dicembre.

**Etichetta**: il calendario è un **fatto**; i pesi sono **euristica**.

### Affollamento

```
folla = notorietà × peso_giorno × (0,45 + 0,55 × passaparola) × (0,6 + 0,4 × comodità)
        × 0,7 se la buttata è appena partita
        × 0,6 se nel giorno sono previsti almeno 5 mm di pioggia
```

- `notorietà`: da 0,4 (Rascino) a 1 (Vallonina). Euristica locale: Terminillo e Tancia più frequentati per vicinanza a Rieti e Roma.
- `passaparola`: quanti degli ultimi 7 giorni hanno avuto indice ≥ 45, diviso 4 (massimo 1). Più giorni buoni di fila, più la notizia gira.
- `buttata appena partita`: indice di oggi ≥ 45 e indice di due giorni prima < 30.
- `comodità`: quella calcolata da Rieti (vedi sotto), anche con una base personale.
- Livelli: alto da 0,5, medio da 0,25, basso sotto.

Con la preferenza **Poca gente** la priorità in classifica viene moltiplicata per `1 − 0,45 × folla`, con un effetto massimo del 45% sull’ordine; il valore biologico rimane invariato.

**Etichetta: Euristica** in ogni sua parte. **Interpretazione** da Egli et al. (2006): in uno studio di lungo periodo in due riserve svizzere la raccolta in sé non ha ridotto le raccolte degli anni successivi, mentre il calpestio, in esperimenti precedenti richiamati dallo stesso lavoro, ha avuto effetti negativi sulla produzione di carpofori. La folla quindi conta per quello che trovi tu quel giorno (concorrenza) più che per la salute della fungaia. Non ho potuto leggere il testo integrale, quindi non riporto numeri sul calpestio.

### Comodità di accesso

```
comodità = f_auto × f_piedi × f_fondo × f_sterrato
f_auto     = clamp(1 − (minuti_auto − 20) / 150, 0,4, 1)
f_piedi    = clamp(1 − metri_a_piedi / 2500, 0,3, 1)
f_fondo    = 1 asfalto, 0,85 strada bianca, 0,7 sentiero o pista
f_sterrato = clamp(1 − km_di_strada_bianca / 12, 0,6, 1)
```

Livelli: comodo da 0,7, medio da 0,45, impegnativo sotto.

Da dove vengono i dati:

- **minuti d'auto e km di strada bianca, da Rieti**: percorso Valhalla (router su dati OpenStreetMap) da Rieti al primo punto di sosta della zona. **Dato ufficiale** nel senso di dato OSM elaborato da un router; i tempi reali in montagna sono spesso più lunghi.
- **minuti d'auto, da una base personale**: li calcola un altro motore, OSRM, sempre su dati OpenStreetMap. I km di strada bianca non sono noti e contano come zero. I due motori danno tempi diversi: in un confronto sugli stessi tragitti, da Rieti alle prime soste, i tempi di un server OSRM calcolati durante la preparazione dei dati erano più brevi di quelli di Valhalla dal 9 al 35%. Se il percorso non è disponibile, la comodità non viene calcolata.
- **metri a piedi, nelle 15 zone del Reatino** (dal modello 2.1.0): per ogni punto di bosco la preparazione dei dati cerca il punto più vicino su una strada percorribile in auto che **non sia una pista** (Valhalla `/locate` su OpenStreetMap; restano fuori `highway=track`, gli accessi privati, le strade riservate e le autostrade). Poi chiede a Valhalla il percorso a piedi su strade, piste e sentieri mappati (profilo pedonale, sentieri fino a difficoltà T2), misura in linea d'aria il tratto fuori dalla rete e somma salita e discesa dal DEM TINITALY a 10 m. **Dato ufficiale** nel senso di dato OSM elaborato da un router: la rete dei sentieri nei boschi è incompleta e l'assenza di divieti mappati non vuol dire accesso libero. Per la comodità i metri diventano «metri equivalenti»: il tempo a piedi del riferimento DIN 33466, moltiplicato per 4 km/h. In piano e senza salita restano gli stessi metri. Il riferimento usato dal codice: 4 km/h in piano, 300 m/h in salita, 500 m/h in discesa; il minore dei due tempi (orizzontale e verticale) si dimezza e si somma al maggiore. Fonti lette il 16/10/2026: DAV Sektion München & Oberland, *alpinwelt* 3/2024, «Grundwissen Beschilderung», e Bergwelten, «Wegzeitberechnung beim Wandern» (2021). Il testo della norma, a pagamento, non è stato consultato. **Euristica**: la norma dà tempi da cartello per chi cammina su sentiero, non per chi cerca funghi. L'app non mostra questo tempo come tempo di percorrenza.
- **la frase dell'ultimo tratto**: «bosco a bordo strada» sotto 50 m in linea d'aria; «tanti metri a piedi su sentieri e strade mappati», con salita e discesa; «**ultimo tratto fuori sentiero, da verificare**» quando manca un percorso mappato, quando più di metà del tratto è fuori dalla rete o quando il percorso è più di 3 volte la linea d'aria (probabile giro lungo). Nel caso «da verificare» la scheda mostra sempre la linea d'aria con il dislivello e, se c'è, il percorso mappato con la salita. Le tre soglie sono **Euristica**: sui punti di bosco a più di 50 m dalla strada il rapporto tra percorso e linea d'aria ha mediana di circa 2,6, e i tornanti allungano anche un sentiero diretto. Sui 3.276 punti di bosco del Reatino: 217 a bordo strada, 1.086 con percorso mappato, 1.973 con l'ultimo tratto da verificare. Se una pista è più vicina della strada, la scheda lo dice: transito in auto da verificare sul posto (L.R. Lazio 29/1987).
- **la scelta del punto**: tra i punti di bosco adatti alla specie (affinità ≥ 0,6, quota compatibile ±50 m) l'app sceglie quello che minimizza `metri equivalenti + 300 × fondo`, prima entro ±150 m dalla fascia dell'indice. Se nella fascia non c'è un punto consentito, prende quello più vicino in quota alla fascia, poi il più comodo, e lo segnala. Non propone i punti nelle zone A e B del Parco Gran Sasso-Laga (vedi la sezione 7). Il peso 300 del fondo è l'**Euristica** già in uso.
- **metri a piedi, nelle 21 zone aggiunte il 19/10** (o se mancano i dati del Reatino): metodo precedente. Per ogni punto campione della Carta Forestale, Valhalla ha indicato l'arco carrozzabile più vicino. Può essere una strada asfaltata, una strada bianca o una pista: Valhalla tratta come percorribili in auto anche le piste di OpenStreetMap senza divieti mappati. Una pista sulla mappa non è per questo aperta alle auto: transito e sosta vanno verificati sul posto. La L.R. Lazio 29/1987, art. 1, vieta di circolare con veicoli a motore fuori dalle strade carrozzabili nelle aree vincolate che elenca, tra cui i boschi; nelle stesse aree il divieto vale anche per sentieri, mulattiere, piste di esbosco segnalate e viali tagliafuoco. L'app sceglie il punto di bosco adatto alla specie (affinità ≥ 0,6, quota compatibile ±50 m, possibilmente entro ±150 m dalla fascia) che minimizza `distanza + 300 × fondo`. La distanza va dal punto campione al punto più vicino su quell'arco ed è **in linea d'aria**, non lungo un sentiero. Non tiene conto del dislivello: sui punti ad almeno 50 m dalla strada la pendenza lungo la linea d'aria è in mediana del 29% (stima sul modello di superficie Copernicus a 30 m, che include la chioma).
- **fondo**: è il fondo dell'arco più vicino al punto di bosco scelto, non quello del percorso da Rieti.
- **il tratto che manca**: il punto d'accesso non coincide con la sosta. Il tratto in auto dalla prima sosta al punto d'accesso non entra né nei minuti d'auto né nei km di strada bianca. In mediana è di 2,0 km in linea d'aria, fino a 7,7 km.
- **pesi e soglie**: **Euristica**.

Con la preferenza **Accesso comodo** la priorità in classifica viene moltiplicata per `0,55 + 0,45 × comodità`. Con **Vicino alla base** viene moltiplicata per `1 − 0,3 × min(1, minuti / 120)` se parti da Rieti; con una base personale per `1 − 0,3 × min(1, km / 100)`, con i km su strada di OSRM o, se mancano, in linea d'aria.

Nel riepilogo di «Regole e metodo» la comodità ha due etichette: dati OSM per gli ingressi e formula euristica per il calcolo.

### Orario di arrivo consigliato

- folla alta: arrivare all'apertura legale (sorgere del sole − 1 h), arrotondata al quarto d'ora successivo;
- folla media: arrivare al sorgere del sole;
- folla bassa: sorgere del sole + 2 h.

All'apertura legale è ancora buio: il crepuscolo civile comincia circa mezz'ora prima del sorgere del sole. Per questo la scheda invita a portare una luce. La partenza suggerita è l'arrivo meno i minuti d'auto dalla base meno 10 minuti, arrotondata al quarto d'ora precedente. **Parere** codificato come euristica: quando sono attese più persone conviene arrivare presto per trovare parcheggio e sentieri meno frequentati; non è una stima dei ritrovamenti.

### Sentieri: fascia di quota e tempi della fonte

**La fascia del sentiero è quella del modello.** Per i funghi un tratto di sentiero è «in bosco adatto» se passa a ±150 m dalla quota dell'indice, la stessa fascia usata per leggere il bosco (sezione 7), con affinità del bosco ≥ 0,6 e quota dentro l'intervallo della specie. Fino al 16/10/2026 la fascia dei sentieri era ±250 m: il profilo colorava come adatto bosco che l'indice non guarda. Un sentiero conta come compatibile da 0,3 km in bosco adatto (**Euristica** già in uso). Se il sentiero mostrato non passa dalla fascia dell'indice, la scheda lo scrive: l'indice è della zona, non del sentiero. Per le piante la regola non cambia (±250 m), perché il loro indice ha un altro motore.

**I tempi della fonte si controllano.** Nei dati del sentiero il tempo indicato in OpenStreetMap si mostra solo se è plausibile. Non si mostra, e la scheda scrive «tempo della fonte da verificare», quando:

- il formato non si legge;
- l'andata ha più salita del ritorno ma un tempo più breve: i due tempi sembrano invertiti;
- il tempo è sotto la metà del riferimento DIN 33466 per lunghezza e dislivello.

La soglia della metà è una scelta redazionale del 16/10/2026, non un valore della norma: serve solo a segnalare incoerenze evidenti. Al posto del tempo scartato l'app non mette un tempo stimato. Limite noto: il controllo vale nei dati del sentiero; il tempo a piedi mostrato nella copertina e nelle card non passa ancora da qui.

## Un esempio numerico

Porcino, 10 ottobre, fascia 1300 m. Pioggia: 25 mm dodici giorni prima e 15 mm undici giorni prima, nient'altro. Temperatura media costante 12 °C, minime 6, massime 18. Umidità del suolo 0,22. Nella fascia il 50% dei punti è faggeta, il 17% ostrieto, il resto non bosco.

| Fattore | Valore | Perché |
|---|---|---|
| Stagione | 1 | ottobre |
| Habitat | 1 | idoneità 0,53 (0,50 × 1 + 0,17 × 0,2), sopra la soglia di 0,45 |
| Quota | 1 | 1300 m dentro 700-1800 |
| Pioggia | 0,64 | 40 mm in latenza e 40 mm in 30 giorni, innesco presente |
| Temperatura | 0,96 | 12 °C contro un ottimo di 13 |
| Suolo | 0,84 | 0,22 m³/m³ |
| Gelo, caldo, shock | 1 | nessun evento |
| **Indice** | **5,1** | classe "Condizioni discrete" |

L'indice resta a metà scala nonostante tutto sia favorevole: 40 mm sono una pioggia discreta, non abbondante, e la curva a saturazione del fattore pioggia arriva a 0,9 solo con circa 100 mm nella finestra. **Interpretazione**: il modello è tarato per dare valori pubblici sopra 7,5 solo in annate davvero piovose. Se nella pratica trovate porcini già con indice 3,5–4,0, le soglie delle classi o `eref` vanno abbassati.

## Limiti

Messi in ordine di importanza, secondo me.

1. **Nessuna validazione locale.** Nessun parametro è stato confrontato con raccolte reali nel Reatino; la prova sull'Italia (in apertura) misura come l'indice ordina i giorni, non tara i parametri. Gli unici numeri presi da uno studio sul porcino vengono da un preprint su una faggeta tedesca.
2. **Meteo da modello, non da stazione.** Open-Meteo fornisce dati di modelli meteorologici con correzione statistica per la quota. In montagna i temporali estivi molto locali possono essere sbagliati di decine di millimetri, e il fattore pioggia ne risente subito.
3. **Pochi punti meteo per zona, scelti dal servizio.** La richiesta usa il centro della zona con le tre quote delle fasce. Open-Meteo sceglie la cella del modello anche in base alla quota: le tre fasce possono ricevere celle diverse, a qualche chilometro dal centro e anche fuori dal cerchio della zona. Il 15 ottobre 2026 a Vallonina la fascia dei 1200 m aveva una cella e quelle dei 1450 e 1650 m un'altra, entrambe a circa 5 km dal centro; per l'8 ottobre davano 19,2 e 6,3 mm di pioggia. Le fasce possono quindi avere pioggia e suolo diversi, ma non per questo rappresentano i versanti: un versante esposto alla pioggia e uno in ombra pluviometrica nello stesso cerchio non vengono distinti.
4. **Cosa il modello non vede.** Esposizione e pendenza, età e struttura del bosco (l'app mostra ceduo o fustaia, esposizione e disturbi visti da satellite, ma l'indice non li usa; il rilievo della Carta è del 2005–2007), diradamenti, substrato e suolo reale, microclima di valle, singole fungaie, pressione di raccolta reale. Salerni et al. (2023) mostrano che la gestione forestale cambia la risposta al caldo: è un esempio concreto di variabile che manca. Per l'esposizione ci sono studi su pinete di pino silvestre dei Pirenei: Bonet et al. (2008) trovano più funghi con quota maggiore e versanti a nord e meno con pendenze forti; Bonet et al. (2010) indicano pendenza, quota ed esposizione tra i fattori importanti. I loro coefficienti non sono trasferibili alle faggete e ai querceti dell'Appennino.
5. **Specie diverse dal porcino.** Ottimi termici, latenze e affinità sono euristiche. Per ovolo, finferlo, chiodino e le specie di pineta anche la struttura comune va confrontata con risposte specifiche per specie e gruppo trofico.
6. **Stagionalità rigida.** I pesi mensili non si adattano agli anni anomali né alla tendenza documentata verso stagioni più lunghe.
7. **Indice relativo, non quantità.** 7,0 non vuol dire "il doppio dei funghi di 3,5". Vuol dire "condizioni più vicine all'ottimo".
8. **Affollamento e comodità non misurati.** Sono stime ragionevoli, non osservazioni.

## Il taccuino personale e la community

Il diario è privato per il profilo autenticato con passkey. Una voce rimane personale finché l’utente sceglie di condividere i dati della ricerca. La community vede solo conteggi aggregati per zona approssimativa e specie; nomi, note e punti GPS non vengono pubblicati.

Le segnalazioni contengono quantità ordinali (pochi, discreti, tanti) e zeri espliciti per le specie cercate. Sono dichiarazioni degli utenti, non identificazioni certificate, conteggi standardizzati o misure di abbondanza. Un contributore conta al massimo una volta per zona, specie e giorno; una nuova segnalazione aggiorna la precedente. I dati storici condivisi possono servire alla futura validazione; solo gli ultimi sette giorni influenzano le priorità attuali.

Un segnale entra nell’ordine delle passeggiate con almeno tre contributori i cui profili hanno almeno 24 ore, su almeno due giorni distinti. Il moltiplicatore è `1 + 0,1 × (ritrovamenti − zeri) / osservazioni × min(1, contributori / 10)`, scegliendo il segnale di maggiore ampiezza tra le specie selezionate, senza sommare bonus. L’effetto è limitato a ±10%. Sono euristiche di priorità, senza interpretazione probabilistica. Passkey, limiti di frequenza e deduplicazione riducono abusi e duplicati; non provano l’indipendenza dei contributori o la correttezza dei ritrovamenti.

## Come costruire la validazione

Prima della passeggiata si possono salvare indice, parametri, versione del modello, input meteo e habitat. Nel servizio collettivo la previsione è immutabile e datata dal server.

Dal modello 2.1.0 la previsione salvata contiene, per ogni fascia, 31 giorni di pioggia, temperature, umidità del suolo a 3–9 e a 9–27 cm, temperatura del suolo ed ET₀. Contiene l'indice di ogni specie **con e senza shock** e, per porcino e porcino rosso, il calo che ha deciso il bonus; dal modello 2.2.0 nessuna specie ha lo shock e i due indici coincidono. Così a fine stagione si possono confrontare le due versioni sulle stesse uscite (sezione 6). **In corso** (21/10/2026): il salvataggio automatico. È previsto una volta per zona e giorno, quando si apre l'uscita o si crea un ricordo, solo per oggi e i giorni futuri. Senza account la previsione resta sul dispositivo. Dopo l’uscita si annotano specie effettivamente cercate, inizio, durata, numero di cercatori e quantità. Per una specie cercata senza ritrovamenti lo zero è esplicito; per una specie non cercata il dato è mancante. La verifica dipende da orari e osservazioni dichiarati dall’utente, non certificati.

Il confronto automatico è per specie e richiede una previsione salvata prima dell’inizio dichiarato. Una ricostruzione a posteriori o una vecchia voce senza provenance non viene chiamata previsione corretta. La soglia esplorativa è 3,0/10 (30 nella scala interna), non calibrata. I conteggi di concordanza non misurano accuratezza scientifica e non trattano uscite della stessa buttata come indipendenti.

La futura taratura richiede riferimenti semplici (calendario e habitat; pioggia e temperatura), confronto con il modello completo, separazione per periodo/sito, valutazione su uscite future e controllo degli errori per specie e sforzo. Quindici o venti uscite possono suggerire ipotesi, ma non bastano a validare tutte le specie e i coefficienti. Le segnalazioni modificano oggi la priorità; i parametri biologici non vengono addestrati automaticamente su segnalazioni non verificate.

## Una prova offline: i porcini di Bielefeld

**Che cosa misura.** Se la parte meteo dell'indice per il porcino (stagione × pioggia × temperatura, con i parametri dell'app) mette più in alto i giorni con ritrovamenti, dentro la stagione. Usa i dati dello studio che l'indice cita: dieci stagioni (2015–2024) di conteggi giornalieri in faggete vicino a Bielefeld, in Germania (Brejon Lamartinière e Hoffman, deposito Zenodo V1.2, CC BY 4.0), con meteo osservato E-OBS. Periodo 5 agosto–21 novembre: 1.090 giorni, 155 con ritrovamento. Il protocollo e i criteri di lettura sono stati scritti e rivisti prima di vedere i risultati. Prova eseguita il 16/10/2026 e ricontrollata da tre verifiche indipendenti il 21/10/2026: nessun numero è cambiato.

**Come si legge.** La misura che decide è la precisione media dentro la stagione (AP stratificata): un ordinamento a caso vale 0,211. Ogni differenza ha due intervalli al 95%: bootstrap per stagione (B) e jackknife per stagione (J). Per dire «ordina meglio» o «ordina peggio» servono entrambi gli intervalli dalla stessa parte di 0; altrimenti l'esito è «non distinguibile su questi dati».

| Confronto | Differenza di AP | B | J | Esito scritto prima |
|---|---|---|---|---|
| Indice dell'app contro un calendario medio della stagione | +0,101 | da 0,013 a 0,226 | da −0,044 a 0,245 | non distinguibile su questi dati |
| Curva termica stretta (σ 2,0 °C) contro quella dell'app (3,5 °C) | −0,047 | da −0,127 a 0,012 | da −0,135 a 0,042 | non distinguibile su questi dati |
| σ stimato senza la stagione di prova contro 3,5 °C | −0,041 | da −0,112 a 0,013 | da −0,123 a 0,042 | non distinguibile su questi dati |

**Fatto verificato**: l'indice dell'app ha AP 0,412 (calendario 0,311, a caso 0,211) e supera il calendario in 9 stagioni su 10. «Non distinguibile» non vuol dire «uguali»: gli intervalli sono larghi e con 10 stagioni era l'esito più probabile. **Interpretazione**: il vantaggio sul calendario è probabile ma non dimostrato; è anche ottimistico, perché centro termico (13 °C) e finestra di 20 giorni vengono da questi stessi dati. Per la curva più stretta la lettura congiunta scritta prima è: «nessun vantaggio dimostrato». Nella stima puntuale ordina un po' peggio.

**Decisione.** La larghezza della curva termica del porcino (`tsd`) resta 3,5 °C: è la decisione presa da Matteo dopo la prova. Nessun parametro dell'app è cambiato per questa prova.

**Limiti.**

- Gli zeri sono «nessun ritrovamento registrato», non uscite a vuoto. Se dopo la pioggia si cercava di più, ogni modello con la pioggia ne trae vantaggio: misura i cercatori, non solo i funghi.
- Un'area di pianura in Germania, una sola serie meteo, 10 stagioni molto diverse (2016: un solo giorno con ritrovamenti). Nulla si trasferisce al Reatino.
- Si misura una parte dell'indice: suolo, gelo, caldo e shock mancano. Il meteo è osservato, mentre l'app usa anche previsioni.
- L'ordinamento non è una probabilità e non dà soglie.

Script, preregistrazione ed esiti completi: `tools/benchmark-bielefeld/` (README della prova). I dati meteo E-OBS non entrano nel repository: i loro termini ammettono solo ricerca non commerciale e non autorizzano la ridistribuzione.

## Riferimenti

Studi peer-reviewed, verificati (ho controllato almeno titolo, autori, rivista e abstract):

- Boddy L., Büntgen U., Egli S., Gange A.C., Heegaard E., Kirk P.M., Mohammad A., Kauserud H. (2014). *Climate variation effects on fungal fruiting*. Fungal Ecology 10: 20-33. https://doi.org/10.1016/j.funeco.2013.10.006
- Bonet J.A., Pukkala T., Fischer C.R., Palahí M., Martínez de Aragón J., Colinas C. (2008). *Empirical models for predicting the production of wild mushrooms in Scots pine (Pinus sylvestris L.) forests in the Central Pyrenees*. Annals of Forest Science 65(2): 206. https://doi.org/10.1051/forest:2007089 (citazione verificata su Crossref; il risultato su quota, esposizione e pendenza viene dalla lettura del testo nella verifica del 15/10/2026.)
- Bonet J.A., Palahí M., Colinas C., Pukkala T., Fischer C.R., Miina J., Martínez de Aragón J. (2010). *Modelling the production and species richness of wild mushrooms in pine forests of the Central Pyrenees in northeastern Spain*. Canadian Journal of Forest Research 40(2): 347-356. https://doi.org/10.1139/X09-198
- Büntgen U., Peter M., Kauserud H., Egli S. (2013). *Unraveling environmental drivers of a recent increase in Swiss fungi fruiting*. Global Change Biology 19(9): 2785-2794. https://boris.unibe.ch/49641
- Egli S., Peter M., Buser C., Stahel W., Ayer F. (2006). *Mushroom picking does not impair future harvests: results of a long-term study in Switzerland*. Biological Conservation 129: 271-276. (Verificati citazione e conclusione principale tramite fonti secondarie e il titolo; il testo integrale non era raggiungibile.)
- Kauserud H., Heegaard E., Büntgen U. et al. (2012). *Warming-induced shift in European mushroom fruiting phenology*. PNAS 109(36): 14488-14493. https://doi.org/10.1073/pnas.1200789109
- Martínez-Peña F., Ágreda T., Águeda B., Ortega-Martínez P., Fernández-Toirán L.M. (2012). *Edible sporocarp production by age class in a Scots pine stand in Northern Spain*. Mycorrhiza 22(3): 167-174. https://doi.org/10.1007/s00572-011-0389-8 (letto l'abstract su PubMed. Il sito è una pineta di pino silvestre che l'abstract colloca nella «zona nord-orientale della penisola iberica»; gli autori sono del centro di ricerca forestale di Valonsadero, a Soria. *B. edulis* ha fruttificato ogni anno dal 1995 al 2004, in media 40 kg/ha l'anno. L'abstract non parla del meteo.)
- Salerni E., Laganà A., Perini C., Loppi S., De Dominicis V. (2002). *Effects of temperature and rainfall on fruiting of macrofungi in oak forests of the Mediterranean area*. Israel Journal of Plant Sciences 50(3): 189-198. https://doi.org/10.1092/GV8J-VPKL-UV98-WVU1 ; https://usiena-air.unisi.it/handle/11365/3048
- Salerni E., Paoli L., Perini C. (2023). *Combined impact of forest management and climate change on Boletus edulis productivity: may mycosilviculture mitigate the effects of climate extremes?* Italian Journal of Mycology 52(1): 76-88. https://doi.org/10.6092/issn.2531-7342/16464

Rivista tecnica forestale, testo integrale letto:

- Olivier J.-M., Guinberteau J., Rondet J., Mamoun M. (1997). *Vers l'inoculation contrôlée des cèpes et bolets comestibles ?* Revue forestière française XLIX, numero speciale: 222-234. https://doi.org/10.4267/2042/5671 ; testo su HAL (hal-03443958): https://hal.science/hal-03443958 (letto il 16/10/2026; DOI verificato su Crossref il 21/10/2026: Crossref dà solo la pagina iniziale 222). Osservazioni preliminari su una rete di parcelle, senza analisi statistica. È l'unica fonte dello shock termico del modello 2.1.0.

Versione bibliografica usata dal modello:

- Brejon Lamartinière E., Hoffman J.I. (2025; v2 8 giugno 2026). *Predicting porcini: a decade of sporocarp monitoring reveals the meteorological triggers of Boletus edulis fruiting in central European beech forests*. bioRxiv v2, CC BY-NC 4.0; pagina degli autori: in stampa su Fungal Ecology. https://doi.org/10.64898/2025.12.12.693895 — v2: https://www.biorxiv.org/content/10.64898/2025.12.12.693895v2.full (letta per sezioni il 12/10/2026).

Dati e servizi:

- Regione Lazio. *Carta Forestale su base tipologica*, WFS/WMS `geonode:tipi_forestali2`. https://geoportale.regione.lazio.it ; https://dati.lazio.it/dataset/carta-forestale-su-base-tipologica-della-regione-lazio
- Regione Lazio. *Informazioni tecniche e metadatazione sulla Carta forestale* (date del rilievo, scala, unità minima, attributi struttura e copertura). https://geoportale.regione.lazio.it/api/v2/assets/94/link
- Open-Meteo. Forecast API (https://open-meteo.com/en/docs), pagina dei modelli DWD ICON (https://open-meteo.com/en/docs/dwd-api) ed Elevation API, basata su Copernicus DEM GLO-90 (https://open-meteo.com/en/docs/elevation-api). Dati CC BY 4.0.
- DWD. *ICON Database Reference* (strati e classi di suolo del modello ICON). https://www.dwd.de/DWD/forschung/nwv/fepub/icon_database_main.pdf
- ISPRA. *Carta Geologica d'Italia 1:100.000*, servizio di consultazione (interrogato il 15/10/2026). https://sinacloud.isprambiente.it/arcgisgeo/rest/services/geo/SGI_ISPRA_geologia100K/MapServer
- Valhalla su server FOSSGIS (`valhalla1.openstreetmap.de`), dati OpenStreetMap (ODbL).
- OSRM su server FOSSGIS (`routing.openstreetmap.de`), dati OpenStreetMap (ODbL), per i percorsi da una base personale.
- NOAA Global Monitoring Laboratory, *General Solar Position Calculations* (formule usate per alba e tramonto).
- Tarquini S., Isola I., Favalli M., Battistini A., Dotta G. (2023). *TINITALY, a digital elevation model of Italy with a 10 meters cell size* (versione 1.1). INGV, CC BY 4.0. https://doi.org/10.13127/tinitaly/1.1 (DOI verificato su DataCite il 21/10/2026). Pendenza, esposizione, salita e discesa.
- *European Forest Disturbance Atlas* v3.0.0 (2026), CC BY 4.0. https://doi.org/10.5281/zenodo.21722408 (DataCite, verificato il 21/10/2026). Metodo: Viana-Soto A., Senf C. (2025). *The European Forest Disturbance Atlas: a forest disturbance monitoring system using the Landsat archive*. Earth System Science Data 17: 2373-2404. https://doi.org/10.5194/essd-17-2373-2025 (Crossref, verificato il 21/10/2026).
- Regione Lazio, Geoportale: perimetri delle aree naturali protette (PTPR Tav. B, `geonode:aree_naturali_protette1`) e zonazioni dei piani (`geonode:zoning_pngsl`, `geonode:zoning_montagne_duchessa0` e altre). Indicativi: fa fede la cartografia dell'ente. https://geoportale.regione.lazio.it
- DAV Sektion München & Oberland, *alpinwelt* 3/2024, «Grundwissen Beschilderung» (L. Brechtel); Bergwelten, «Wegzeitberechnung beim Wandern» (29/06/2021). Riferimento dei tempi DIN 33466, letti il 16/10/2026; testo della norma non consultato.

Dati della prova offline (non usati dall'app):

- Brejon Lamartinière E., Hoffman J.I. *ebrejonl/Boletus_fruiting_triggers: Expansion of analysis*, V1.2. Zenodo, CC BY 4.0. https://doi.org/10.5281/zenodo.20591123 (DataCite, verificato il 21/10/2026).
- Cornes R.C., van der Schrier G., van den Besselaar E.J.M., Jones P.D. (2018). *An Ensemble Version of the E-OBS Temperature and Precipitation Data Sets*. Journal of Geophysical Research: Atmospheres 123: 9391-9409. https://doi.org/10.1029/2017JD028200 (Crossref, verificato il 21/10/2026). Dati E-OBS: solo ricerca e istruzione non commerciali.

Norma:

- L.R. Lazio 5 agosto 1998, n. 32 e successive modifiche, testo coordinato vigente (Consiglio regionale del Lazio). https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=8275&sv=vigente
- L.R. Lazio 30 marzo 1987, n. 29, *Disciplina della circolazione fuoristrada dei veicoli a motore*, art. 1, testo vigente (Consiglio regionale del Lazio). https://www.consiglio.regione.lazio.it/?vw=leggiregionalidettaglio&id=8794&sv=vigente
- Ente Parco Nazionale del Gran Sasso e Monti della Laga, *Piano per il Parco*, Normativa di attuazione, art. 7, c. 7 e art. 8, c. 7. https://www.gransassolagapark.it/pdf/Piano-Parco/Normativa-Attuazione.pdf ; per il Lazio approvato con DCR 7 agosto 2019, n. 7. Dettagli in `docs/legale.md`, sezione 2.3.

Fonti che ho cercato ma non ho potuto verificare nei contenuti, e che quindi non uso a sostegno di nessun parametro:

- Martínez de Aragón J., Bonet J.A., Fischer C.R., Colinas C. (2007). *Productivity of ectomycorrhizal and selected edible saprotrophic fungi in pine forests of the pre-Pyrenees mountains, Spain*. Forest Ecology and Management 252: 239-256. Citazione confermata, abstract non letto.

## Per chi sviluppa

Questa sezione non compare nella pagina «Come funziona l'indice» dell'app: il renderer in `js/science.js` si ferma a questo titolo. Qui stanno i riferimenti al codice tolti dal testo per gli utenti.

- I valori citati sono quelli di `js/model.js`, `js/species.js`, `js/human.js`, `js/outing.js` e `js/app.js`. Se cambiate un parametro nel codice, questo documento va aggiornato.
- Fasce di quota delle zone: `data/zones.json`, campo `bands`. Notorietà: campo `popularity` nello stesso file. Zone proposte solo dai dati: `proposed_by: "dati"`.
- Parametri globali: `PARAMS` in `js/model.js` — `r30Days` (30 giorni), `tDays` (20), `triggerMm` (8 mm), `moistDry` (0,10), `moistWet` (0,26), `frostC` (−1 °C), `heatC` (30 °C), `bandHalfWidth` (150 m); per lo shock `shockSoilDropC` (5 °C), `shockLagDays` ([6, 15]), `shockRefDays` (3), `shockOnsetDays` (5), `shockBonus` (1,15). `MODEL_VERSION` è `2.1.0`.
- Specie che tollerano il gelo: flag `frostTolerant`. Shock termico: flag `soilShock`, nessuna specie dal 2.2.0 (fino al 2.1.0 `edulis` e `pinophilus`; il calcolo resta e i test lo provano su copie con il flag); `shockWeight` non esiste più (fino alla 2.0.0: predefinito 2, chiodino 3). Calcolo in `soilDrop()` e `soilTemperatureShock()` di `js/model.js`; stati `calo`, `nessun calo`, `dati incompleti`, `non previsto`; `inputQuality().bonusUnavailable` segnala la temperatura del suolo incompleta. Quote della specie: `elev`. Affinità per categoria forestale: `js/species.js`. La vecchia percentuale rimossa si chiamava `confidence`.
- Il README descrive lo shock termico come "pratica micologica, non verificata": va allineato alla 2.1.0.
- Habitat: script `tools/build_habitat.py`, servizio WFS `geonode:tipi_forestali2`, raggio della zona `radius_m`. Accessi: `data/access.json`.
- Scelta delle zone: `inbox/zone-candidate.md` (testate locali) e `tools/scan_province.py` (scanner).
- Meteo dell'uscita: `js/outing.js`, livelli in `OUTING_LABEL`, pesi in `OUTING_RANK`. Fattore umano: commento in testa a `js/human.js`; peso del giorno `dayFactor`; alba e tramonto in `sunTimes`; arrivo in `timingAdvice`.
- Comodità e preferenza «Vicino alla base»: `compute()` e `proximityMultiplier()` in `js/app.js`; percorsi da una base personale in `js/base-location.js` e `worker/travel-provider.js` (OSRM).
- Open-Meteo: il parametro `elevation` serve alla correzione statistica per la quota e, con `cell_selection=land` predefinito, sceglie anche la cella del modello. Il profilo `growth` di `worker/weather-provider.js` non passa `models`, quindi vale *best match*.
- Shock termico: dalla 2.1.0 il modello usa la temperatura del suolo a 6 cm (`soilt`). Previsioni datate: `captureForecastData()` in `js/forecast-capture.js` salva `scores`/`scoresByBand` (con shock), `scoresNoShock`/`scoresByBandNoShock` (stesso calcolo con `soilShock` spento), `shock.byBand` e gli ingressi `FORECAST_INPUTS` (`p`, `tmean`, `tmin`, `tmax`, `soilm`, `soilt`, `soilm9to27`, `et0`) da d−30 a d. Confronto con la 2.0.0 sul meteo del 21/10/2026: script nello scratchpad della sessione, non nel repository; numeri nella sezione 6.
- Informazioni sul bosco ed esclusioni: `js/site-info.js` (`data/habitat-info.json`, regola in `esclusioni`); accessi: `chooseAccess()`, `walkPhrase()`, `walkEqM()` in `js/human.js` (`data/access-info.json`); fascia e tempi dei sentieri: `sampleFits()`, `trailBandFit()`, `sourceTimeIssue()`, `dinHours()` in `js/walks.js`. I due file `*-info.json` valgono solo se descrivono gli stessi campioni di `habitat.json` (`generated` e somme di controllo): altrimenti l'app li ignora.
- Prova offline sui porcini: `tools/benchmark-bielefeld/` (README, preregistrazione, `esiti-riepilogo.json`). `valuta.py` controlla l'impronta di `js/model.js` 2.0.0 e si ferma con la 2.1.0: per ripeterla va aggiornato il controllo dei moduli congelati, dichiarandolo come deviazione.
- Lettura del preprint Brejon Lamartinière e Hoffman: note in `inbox/README.md`.
