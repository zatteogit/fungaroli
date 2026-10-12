# Il metodo: come l'app stima la fruttificazione

Questo documento spiega come Fungaroli Rieti calcola l'indice 0-100 e che cosa c'è dietro ogni numero. I valori citati sono quelli del codice al momento della stesura (`js/model.js`, `js/species.js`, `js/human.js`, `js/app.js`). Se cambiate un parametro nel codice, questo documento va aggiornato.

## Come leggere le etichette

Ogni elemento del modello porta una di queste etichette. Le uso in modo stretto: se un valore non ha una fonte che lo sostiene, è un'euristica, anche quando sembra ragionevole.

| Etichetta | Significato |
|---|---|
| **Letteratura** | Esiste almeno uno studio pubblicato che lo sostiene. Indico quale studio e in quale contesto vale, che spesso è più ristretto del nostro. |
| **Dato ufficiale** | Dato prodotto da un ente o da un servizio con metodo documentato (Regione Lazio, Open-Meteo, OpenStreetMap). È un fatto sul dato, non sulla sua precisione sul terreno. |
| **Euristica** | Valore scelto da manualistica micologica, pratica dei cercatori o buon senso. È un parametro da tarare, non un risultato. |
| **Interpretazione** | Una lettura, mia o del codice, che collega un risultato di letteratura a una scelta del modello. |
| **Parere** | Un'opinione su cosa conviene fare. |

In sintesi, prima di entrare nel dettaglio: i dati di ingresso (bosco, quote, meteo, strade) sono solidi come fonte. La relazione tra meteo e nascite è sostenuta dalla letteratura solo per *Boletus edulis* in faggeta, e anche lì solo in parte. Quasi tutto il resto è euristica dichiarata.

## Che cosa calcola

Per ogni combinazione di **zona × fascia di quota × specie × giorno** l'app calcola un indice di idoneità alla fruttificazione. Non è una probabilità di trovare funghi e non è una stima di quantità: è un punteggio relativo che dice quanto le condizioni di quel giorno somigliano a quelle in cui la specie di solito fruttifica.

Ogni zona ha tre fasce di quota (in `data/zones.json`, campo `bands`). Per ogni zona e giorno l'app tiene la combinazione quota × specie con l'indice più alto, e quella è l'indice della zona.

### La formula

```
indice = 100 × stagione × habitat × quota × pioggia × temperatura × suolo × gelo × caldo × shock
```

Il risultato è limitato tra 0 e 100 e arrotondato. Lo shock termico è l'unico fattore che può superare 1 (vale al massimo 1,15), quindi in condizioni ideali il prodotto può sforare 100 ed essere tagliato a 100.

Una conseguenza del prodotto, da tenere a mente: basta un fattore vicino a zero per azzerare l'indice. È voluto (senza bosco adatto o fuori stagione non ha senso andare), ma rende il modello severo. Un fattore a 0,5 dimezza tutto, anche se gli altri sono perfetti.

### I parametri globali (`PARAMS` in `js/model.js`)

| Parametro | Valore | Uso | Etichetta |
|---|---|---|---|
| `r30Days` | 30 giorni | finestra della pioggia cumulata | Letteratura (Salerni et al. 2002) |
| `tDays` | 20 giorni | finestra della temperatura media | Letteratura (preprint 2025, solo *B. edulis*) |
| `triggerMm` | 8 mm | evento singolo che conta come innesco | Euristica |
| `moistDry` | 0,10 m³/m³ | sotto questo valore il suolo è secco | Euristica |
| `moistWet` | 0,26 m³/m³ | sopra questo valore il suolo è pienamente umido | Euristica |
| `frostC` | −1 °C | minima che blocca o danneggia i carpofori | Euristica |
| `heatC` | 30 °C | massima che secca lettiera e carpofori | Euristica |
| `shockDropC` | 4 °C | calo di temperatura media che conta come shock | Euristica |
| `bandHalfWidth` | 150 m | semiampiezza della fascia di quota per leggere il bosco | Euristica |

## I fattori, uno per uno

### 1. Pioggia

È il fattore centrale. Combina due grandezze.

**La pioggia nella finestra di latenza.** Ogni specie ha un intervallo `lag = [min, max]` di giorni tra la pioggia e la nascita. Per il giorno *d* l'app somma la pioggia caduta tra *d − max* e *d − min* (estremi inclusi). Per il porcino `lag = [7, 21]`: conta la pioggia caduta da 21 a 7 giorni prima, cioè 15 giorni di pioggia. La pioggia degli ultimi 6 giorni per il porcino non conta ancora.

**La pioggia cumulata dei 30 giorni precedenti** (da *d − 30* a *d − 1*).

Le due grandezze entrano con curve a saturazione:

```
pioggia = 0,6 × (1 − e^(−latenza / eref)) + 0,4 × (1 − e^(−cumulata30 / (2 × eref)))
```

`eref` è specifico per specie (30 mm per i porcini *edulis* e *pinophilus*, 28 per *aereus*, *aestivalis* e ovolo, 25 per le specie a latenza breve). Più pioggia aumenta sempre il fattore, ma con rendimenti decrescenti.

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

**La base per il porcino.** Brejon Lamartinière e Hoffman (2025) hanno analizzato dieci anni (2015-2024) di conteggi giornalieri di carpofori di *B. edulis* in una faggeta vicino a Bielefeld, in Germania, con modelli lineari generalizzati misti. Il picco di fruttificazione coincide con una temperatura media di circa 13 °C calcolata sui 20 giorni precedenti. Il lavoro è un **preprint su bioRxiv, non ancora revisionato**, e riguarda un solo sito di pianura centro-europea. Nella versione 2 (giugno 2026), che sostituisce la prima: ottimo termico di circa 13 °C sulla media dei 20 giorni (13,7 °C nella didascalia della Fig. 4: testo e figura non coincidono); effetto lineare e positivo della pioggia cumulata su 26 giorni (26-32 nei due siti più produttivi), **senza soglia di innesco né soglia superiore**; fruttificazioni concentrate tra 10 e 15 °C e 2-4 mm di pioggia media al giorno nella finestra. L'umidità del suolo non è misurata e lo **shock termico non compare** nel modello. **Conseguenza per l'app**: le soglie di innesco a 8 e 15 mm e il bonus per shock termico non vengono da questo lavoro; restano euristiche di pratica micologica. **Interpretazione**: applicarlo alle faggete del Terminillo o della Laga è un'estrapolazione ragionevole per la specie e l'habitat, meno per il clima (l'Appennino ha estati più calde e secche e un regime di piogge diverso).

**Le altre specie.** Gli ottimi termici sono stime coerenti con la stagionalità nota (specie estive e termofile più alte, specie tardive più basse) ma non hanno una fonte puntuale. Sono il primo candidato alla taratura.

### 3. Umidità del suolo

L'app usa l'umidità volumetrica del suolo tra 3 e 9 cm di profondità (variabile `soil_moisture_3_to_9cm` di Open-Meteo, in m³/m³), media giornaliera dei valori orari, mediata sui 3 giorni precedenti:

```
suolo = max( 0,15 , clamp((umidità − 0,10) / (0,26 − 0,10))^0,6 )
```

Sotto 0,10 il fattore resta a 0,15 (non scende a zero), sopra 0,26 vale 1. Se il dato manca vale 0,5.

| Elemento | Etichetta | Note |
|---|---|---|
| Variabile di umidità del suolo | **Dato ufficiale** | È l'uscita di un modello meteorologico, non una misura. Non conosce il suolo reale: una faggeta su arenaria della Laga e un querceto su calcare del Tancia trattengono l'acqua in modo diverso. |
| Soglie 0,10 / 0,26, esponente 0,6, minimo 0,15 | **Euristica** | Nessuna fonte. Il minimo a 0,15 serve a non annullare l'indice quando il modello di suolo sbaglia. |

**Interpretazione**: questo fattore si sovrappone in parte alla pioggia. Serve soprattutto a cogliere i casi in cui la pioggia è caduta ma il suolo si è già asciugato per caldo o vento.

### 4. Gelo

Se la temperatura minima di uno dei 5 giorni che terminano con *d* (da *d − 4* a *d*) scende sotto −1 °C, il fattore vale 0,35. Per le specie marcate `frostTolerant` (moretta e agarico violetto) vale 0,7. Altrimenti vale 1.

**Etichetta: Euristica.** È noto dalla pratica che le gelate fermano le nascite e rovinano i carpofori, ma la soglia, la finestra e i valori di penalità non hanno una fonte.

### 5. Caldo

Se la massima di uno dei 3 giorni precedenti (da *d − 3* a *d − 1*) supera 30 °C, il fattore vale 0,65.

**Etichetta: Euristica**, con un appoggio parziale. Salerni, Paoli e Perini (2023) hanno osservato in abetine artificiali di *Abies alba* che picchi improvvisi della temperatura massima sembrano deprimere la produttività di *B. edulis* dove il bosco non è diradato o lo è poco, mentre nei siti molto diradati le alte temperature sembrano favorirla a partire da circa 20 giorni dopo l'evento. **Interpretazione**: lo studio conferma che i picchi di caldo contano, ma dice anche che l'effetto dipende dalla gestione del bosco, che il modello non conosce. La penalità fissa è una semplificazione.

### 6. Shock termico

L'app cerca, tra 14 e 4 giorni prima di *d*, un giorno *j* in cui la media dei 3 giorni successivi è più bassa di almeno 4 °C rispetto alla media dei 3 giorni precedenti. Se lo trova applica un bonus:

```
shock = 1 + 0,075 × shockWeight      (shockWeight predefinito 2, quindi ×1,15)
```

**Etichetta: Euristica** da pratica micologica. L'idea che un calo brusco di temperatura dopo la pioggia "sblocchi" le nascite è molto diffusa tra i cercatori e nei siti di previsione, ma non ho trovato studi che la quantifichino. Il README la descrive correttamente come "pratica micologica, non verificata".

Nota sul codice: il chiodino ha `shockWeight: 2`, cioè lo stesso valore predefinito di tutte le altre specie. Il commento della specie dice "buttate legate al primo freddo", ma di fatto il chiodino non riceve un bonus maggiore. Se l'intenzione era differenziarlo, il valore va alzato.

### 7. Habitat: la Carta Forestale campionata per fascia di quota

Questo è il fattore più solido come dato e il più originale come costruzione.

**Il dato.** Per ogni zona lo script `tools/build_habitat.py` scarica i poligoni della *Carta Forestale su base tipologica* della Regione Lazio (servizio WFS `geonode:tipi_forestali2`) dentro un cerchio di raggio `radius_m` attorno al centro della zona. Poi posa una griglia regolare di 21 × 21 punti sul quadrato che contiene il cerchio e tiene i punti che cadono nel cerchio (tra 313 e 317 per zona nei dati attuali). Per ogni punto registra la quota (Open-Meteo Elevation API, DEM Copernicus GLO-90 a 90 m) e la categoria forestale del poligono che lo contiene, oppure "non bosco".

**Il calcolo.** Per una fascia di quota (per esempio 1200 m) l'app prende i punti con quota entro ±150 m (1050-1350 m), calcola la frazione di ciascuna categoria e la pesa con l'affinità della specie:

```
idoneità = Σ (frazione_categoria × affinità_specie[categoria])
habitat  = min(1, idoneità / 0,45)
```

Il 45% di bosco pienamente idoneo nella fascia basta per un habitat "pieno".

**Le affinità.** Ogni specie ha in `species.js` un valore 0-1 per categoria. Esempio per il porcino: faggeta 1, castagneto 0,7, cerreta 0,6, rimboschimenti di conifere 0,6, roverella 0,4, bosco di forra 0,4, ostrieto 0,2, tutto il resto 0.

| Elemento | Etichetta | Note |
|---|---|---|
| Poligoni e categorie forestali | **Dato ufficiale** | Regione Lazio. Derivata dalla carta delle formazioni naturali e seminaturali con approfondimento al IV e V livello Corine Land Cover (metadati del dataset). |
| Quote dei punti | **Dato ufficiale** | Copernicus GLO-90 è un modello di superficie (include la chioma degli alberi), a 90 m di risoluzione. In un bosco d'alto fusto la quota può risultare qualche metro più alta del suolo; su un campionamento per fasce di 300 m l'errore è trascurabile. |
| Affinità specie-bosco | **Euristica** | Dalla manualistica micologica e dal documento di partenza. Sono plausibili come ordine (il porcino ama la faggeta, i pinaroli solo i pini) ma i valori intermedi sono scelte. |
| Fascia ±150 m, soglia 45% | **Euristica** | |

**Perché per fascia di quota e non per area.** Una zona di montagna mescola boschi molto diversi: a Poggio Bustone la roverella domina in basso e la faggeta sopra i 1000 m. Una composizione media della zona direbbe "un po' di tutto"; il campionamento per quota dice quale bosco trovi alla quota a cui pensi di andare. **Parere**: è la scelta che rende l'app utile sul campo, più dell'accuratezza dei parametri meteo.

**Un dettaglio da sapere.** La griglia ha sempre 21 punti per lato, quindi la densità dipende dal raggio: un punto ogni 300 m nelle zone di raggio 3 km, ogni 500 m nel Cicolano (raggio 5 km). Nelle fasce di quota poco rappresentate i punti possono essere pochi, e la composizione diventa rumorosa. Il modello non usa il numero di punti per abbassare l'affidabilità.

### 8. Quota

```
quota = 1                                se la fascia è dentro [min, max] della specie
quota = max(0, 1 − distanza / 200 m)     se è fuori
```

Il porcino ha `elev = [700, 1800]`: a 600 m il fattore vale 0,5, a 500 m vale 0.

**Etichetta: Euristica** (range dalla manualistica e dal documento di partenza, decadimento su 200 m scelto).

### 9. Stagionalità

Ogni specie ha 12 pesi mensili (gennaio-dicembre), interpretati come valori al giorno 15 di ogni mese e interpolati linearmente tra un mese e l'altro. Il porcino, per esempio, vale 0 da gennaio ad aprile, 0,1 a maggio, poi sale fino a 1 a settembre e ottobre, 0,4 a novembre, 0 a dicembre.

**Etichetta: Euristica** basata sul documento di partenza e sulla manualistica locale.

**Cosa dice la letteratura sul tema.** Kauserud et al. (2012), su oltre 746.000 segnalazioni datate di 486 specie autunnali in quattro paesi europei, hanno osservato tra il 1970 e il 2007 un allungamento della stagione di fruttificazione e uno spostamento in avanti della data media. Büntgen et al. (2013), su inventari svizzeri 1975-2006, riportano un ritardo autunnale medio di 12 giorni dopo il 1991. La rassegna di Boddy et al. (2014) conclude che la fenologia sta cambiando in molti paesi europei, con stagioni mediamente più lunghe ma risposte diverse tra specie e luoghi. **Interpretazione**: pesi mensili fissi, presi da manuali scritti con il clima di qualche decennio fa, rischiano di chiudere la stagione troppo presto in autunno. Se il diario mostra nascite a novembre con indice basso, il primo sospetto è la stagionalità.

### 10. Affidabilità delle previsioni

Per i giorni passati e per oggi l'affidabilità è 1. Per i giorni futuri:

```
affidabilità = clamp( 1 − 0,5 × quota_prevista − 0,04 × giorni_avanti , 0,2 , 1 )
```

dove `quota_prevista` è la frazione della pioggia nella finestra di latenza che cade in giorni futuri (cioè solo prevista). Nell'interfaccia: alta da 0,8, media da 0,55, bassa sotto.

**Etichetta: Euristica.** Il ragionamento dietro è corretto e importante: siccome per il porcino conta la pioggia di 7-21 giorni prima, l'indice di dopodomani dipende quasi tutto da pioggia già caduta. Per questo l'indice a 3-7 giorni è più stabile di una previsione meteo a 3-7 giorni.

Limite: l'affidabilità considera solo la pioggia della finestra di latenza. Anche la temperatura media a 20 giorni, l'umidità del suolo, il gelo e il caldo dei giorni futuri vengono dalle previsioni, ma non abbassano l'affidabilità.

## Il fattore umano

Questi fattori non entrano nell'indice di fruttificazione. Servono a correggere la classifica in base alle preferenze attive e a dare consigli pratici. **Sono tutti euristiche**, come dice esplicitamente il commento in testa a `js/human.js`: non esistono studi sull'affollamento dei boschi reatini.

### Orari di raccolta e alba

**Fatto (Dato ufficiale e norma)**: la raccolta nel Lazio è vietata da un'ora dopo il tramonto a un'ora prima dell'alba (L.R. 32/1998, art. 9, come riportato da AMER 2025). L'app calcola alba e tramonto per il centro della zona con le formule NOAA (errore di 1-2 minuti, rifrazione standard di 90,833°), e il test verifica per Rieti il 12 ottobre 2026 alba alle 07:16 e tramonto alle 18:33.

L'app non tiene conto dell'orizzonte reale: in una valle stretta il sole arriva più tardi, ma l'orario legale si riferisce all'alba astronomica.

### Giorno della settimana e festivi

Peso del giorno (`dayFactor`): domenica e festivi 1; sabato 0,95; venerdì 0,55; lunedì 0,45; giovedì 0,4; martedì e mercoledì 0,35. I festivi sono quelli nazionali più Pasquetta (calcolata) e Santa Barbara, patrona di Rieti, il 4 dicembre.

**Etichetta**: il calendario è un **fatto**; i pesi sono **euristica**.

### Affollamento

```
folla = notorietà × peso_giorno × (0,45 + 0,55 × passaparola) × (0,6 + 0,4 × comodità)
        × 0,7 se la buttata è appena partita
        × 0,6 se nel giorno sono previsti almeno 5 mm di pioggia
```

- `notorietà` (`popularity` in `zones.json`): da 0,4 (Rascino) a 1 (Vallonina). Euristica locale: Terminillo e Tancia più frequentati per vicinanza a Rieti e Roma.
- `passaparola`: quanti degli ultimi 7 giorni hanno avuto indice ≥ 45, diviso 4 (massimo 1). Più giorni buoni di fila, più la notizia gira.
- `buttata appena partita`: indice di oggi ≥ 45 e indice di due giorni prima < 30.
- Livelli: alto da 0,5, medio da 0,25, basso sotto.

Con la preferenza **Poca gente** (nelle versioni precedenti *Evita la folla*) l'indice mostrato viene moltiplicato per `1 − 0,45 × folla`, quindi perde fino al 45%.

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

- **minuti d'auto e km di strada bianca**: percorso Valhalla (router su dati OpenStreetMap) da Rieti al primo punto di sosta della zona (`data/access.json`). **Dato ufficiale** nel senso di dato OSM elaborato da un router; i tempi reali in montagna sono spesso più lunghi.
- **metri a piedi**: per ogni punto campione della Carta Forestale lo script ha chiesto a Valhalla la strada carrozzabile più vicina. L'app sceglie il punto di bosco adatto alla specie (affinità ≥ 0,6, quota compatibile ±50 m, possibilmente entro ±150 m dalla fascia) che minimizza `distanza + 300 × fondo`. La distanza è **in linea d'aria**, non lungo un sentiero, e non tiene conto del dislivello.
- **pesi e soglie**: **Euristica**.

Con la preferenza **Accesso comodo** (prima *Preferisci accessi comodi*) l'indice mostrato viene moltiplicato per `0,55 + 0,45 × comodità`. Con **Vicino a Rieti** (prima *Pesa la distanza da Rieti*) viene moltiplicato per `1 − 0,3 × min(1, minuti / 120)`.

L'interfaccia, nella sezione "Come funziona l'indice", etichetta la comodità come "dati OSM". I dati di ingresso lo sono, la formula no.

### Orario di arrivo consigliato

- folla alta: arrivare all'apertura legale (alba − 1 h);
- folla media: arrivare all'alba;
- folla bassa: alba + 2 h.

La partenza suggerita è l'arrivo meno i minuti d'auto meno 10 minuti. **Parere** codificato come euristica: chi arriva per primo trova i funghi nati nella notte.

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
| **Indice** | **51** | classe "Buono" |

L'indice resta a metà scala nonostante tutto sia favorevole: 40 mm sono una pioggia discreta, non abbondante, e la curva a saturazione del fattore pioggia arriva a 0,9 solo con circa 100 mm nella finestra. **Interpretazione**: il modello è tarato per dare valori sopra 75 solo in annate davvero piovose. Se nella pratica trovate porcini già con indice 35-40, le soglie delle classi o `eref` vanno abbassati.

## Limiti

Messi in ordine di importanza, secondo me.

1. **Nessuna validazione locale.** Nessun parametro è stato confrontato con raccolte reali nel Reatino. Gli unici numeri presi da uno studio sul porcino vengono da un preprint su una faggeta tedesca.
2. **Meteo da modello, non da stazione.** Open-Meteo fornisce dati di modelli meteorologici con correzione statistica per la quota (parametro `elevation`). In montagna i temporali estivi molto locali possono essere sbagliati di decine di millimetri, e il fattore pioggia ne risente subito.
3. **Un solo punto meteo per zona.** Le tre fasce usano la stessa coordinata (il centro della zona) con quote diverse. Un versante esposto alla pioggia e uno in ombra pluviometrica nello stesso cerchio ricevono gli stessi dati.
4. **Cosa il modello non vede.** Esposizione e pendenza, età e struttura del bosco, diradamenti, suolo reale, microclima di valle, singole fungaie, pressione di raccolta reale. Salerni et al. (2023) mostrano che la gestione forestale cambia la risposta al caldo: è un esempio concreto di variabile che manca.
5. **Specie diverse dal porcino.** Ottimi termici, latenze e affinità sono euristiche. Per ovolo, finferlo, chiodino e le specie di pineta il modello ha la forma giusta ma numeri non verificati.
6. **Stagionalità rigida.** I pesi mensili non si adattano agli anni anomali né alla tendenza documentata verso stagioni più lunghe.
7. **Indice relativo, non quantità.** 70 non vuol dire "il doppio dei funghi di 35". Vuol dire "condizioni più vicine all'ottimo".
8. **Affollamento e comodità non misurati.** Sono stime ragionevoli, non osservazioni.

## Come calibrarlo con il diario

Il diario esiste per questo. Al salvataggio di ogni uscita l'app memorizza, oltre a cosa avete trovato, l'indice che il modello prevedeva per ogni specie quel giorno in quella zona (alla quota indicata, oppure alla migliore delle tre se non la indicate). Poi confronta: se l'indice massimo previsto era almeno 30 (`FOUND_THRESHOLD` in `js/journal.js`) il modello "diceva di andare"; se avete trovato almeno una specie con quantità indicata, "c'erano funghi". Da qui le tre etichette: previsione giusta, ottimista, pessimista.

Il confronto automatico è grossolano per costruzione: usa il massimo su tutte le specie, quindi un'uscita in cui il modello prometteva porcini e avete trovato solo chiodini risulta "giusta". Per tarare davvero servono i dati per specie, che sono comunque salvati in ogni voce (`predicted` e `finds`).

Un procedimento che consiglio (**Parere**):

1. **Registrate anche le uscite a vuoto.** Senza i "niente funghi" non si distingue un modello buono da uno sempre ottimista.
2. **Indicate la quota quando la sapete.** La previsione salvata sarà quella della fascia, non la migliore della zona.
3. **Aspettate almeno 15-20 uscite** prima di cambiare parametri. Con meno, si rincorre il rumore.
4. **Guardate prima gli errori sistematici.**
   - Molte previsioni ottimiste in estate: il caldo pesa più di quanto il modello creda (abbassate `heatC` o la penalità) oppure l'ottimo termico della specie è troppo alto.
   - Molte pessimiste a fine stagione: allungate i pesi mensili di novembre o abbassate `topt` delle specie tardive.
   - Trovate funghi a indice 20-30 con regolarità: le soglie delle classi in `CLASSES` o `FOUND_THRESHOLD` sono troppo alte, oppure `eref` è troppo grande.
   - Sbagli concentrati in una zona: guardate la composizione forestale della fascia (scheda zona) e le affinità della specie.
5. **Cambiate un parametro alla volta** e annotate cosa avete cambiato. Il diario salva l'indice previsto con i parametri del momento, quindi il confronto delle uscite vecchie resta quello del vecchio modello.
6. **Esportate il diario** (JSON) prima di grosse modifiche: è il vostro dataset.

Nella versione Artifact il diario sta nel database privato della pagina e può essere letto da Claude per proporre una taratura sulla base delle uscite reali.

## Riferimenti

Studi peer-reviewed, verificati (ho controllato almeno titolo, autori, rivista e abstract):

- Boddy L., Büntgen U., Egli S., Gange A.C., Heegaard E., Kirk P.M., Mohammad A., Kauserud H. (2014). *Climate variation effects on fungal fruiting*. Fungal Ecology 10: 20-33. https://doi.org/10.1016/j.funeco.2013.10.006
- Büntgen U., Peter M., Kauserud H., Egli S. (2013). *Unraveling environmental drivers of a recent increase in Swiss fungi fruiting*. Global Change Biology 19(9): 2785-2794. https://boris.unibe.ch/49641
- Egli S., Peter M., Buser C., Stahel W., Ayer F. (2006). *Mushroom picking does not impair future harvests: results of a long-term study in Switzerland*. Biological Conservation 129: 271-276. (Verificati citazione e conclusione principale tramite fonti secondarie e il titolo; il testo integrale non era raggiungibile.)
- Kauserud H., Heegaard E., Büntgen U. et al. (2012). *Warming-induced shift in European mushroom fruiting phenology*. PNAS 109(36): 14488-14493. https://doi.org/10.1073/pnas.1200789109
- Salerni E., Laganà A., Perini C., Loppi S., De Dominicis V. (2002). *Effects of temperature and rainfall on fruiting of macrofungi in oak forests of the Mediterranean area*. Israel Journal of Plant Sciences 50(3): 189-198. https://doi.org/10.1092/GV8J-VPKL-UV98-WVU1 ; https://usiena-air.unisi.it/handle/11365/3048
- Salerni E., Paoli L., Perini C. (2023). *Combined impact of forest management and climate change on Boletus edulis productivity: may mycosilviculture mitigate the effects of climate extremes?* Italian Journal of Mycology 52(1): 76-88. https://doi.org/10.6092/issn.2531-7342/16464

Preprint (non revisionato):

- Brejon Lamartinière E., Hoffman J.I. (2025; v2 8 giugno 2026). *Predicting porcini: a decade of sporocarp monitoring reveals the meteorological triggers of Boletus edulis fruiting in central European beech forests*. bioRxiv, preprint non revisionato, CC BY-NC 4.0. https://doi.org/10.64898/2025.12.12.693895 — v2: https://www.biorxiv.org/content/10.64898/2025.12.12.693895v2.full (letta per sezioni il 12/10/2026, vedi `inbox/README.md`).

Dati e servizi:

- Regione Lazio. *Carta Forestale su base tipologica*, WFS/WMS `geonode:tipi_forestali2`. https://geoportale.regione.lazio.it ; https://dati.lazio.it/dataset/carta-forestale-su-base-tipologica-della-regione-lazio
- Open-Meteo. Forecast API (https://open-meteo.com/en/docs) ed Elevation API, basata su Copernicus DEM GLO-90 (https://open-meteo.com/en/docs/elevation-api). Dati CC BY 4.0.
- Valhalla su server FOSSGIS (`valhalla1.openstreetmap.de`), dati OpenStreetMap (ODbL).
- NOAA Global Monitoring Laboratory, *General Solar Position Calculations* (formule usate in `sunTimes`).

Norma:

- L.R. Lazio 5 agosto 1998, n. 32 e successive modifiche; sintesi in AMER (2025), *Raccolta funghi nel Lazio: le regole in vigore nel 2025*. https://www.ameronlus.it/blog/2025/01/14/raccolta-funghi-nel-lazio-le-regole-in-vigore/

Fonti che ho cercato ma non ho potuto verificare nei contenuti, e che quindi non uso a sostegno di nessun parametro:

- Martínez de Aragón J., Bonet J.A., Fischer C.R., Colinas C. (2007). *Productivity of ectomycorrhizal and selected edible saprotrophic fungi in pine forests of the pre-Pyrenees mountains, Spain*. Forest Ecology and Management 252: 239-256. Citazione confermata, abstract non letto.
- Martínez-Peña F., Ágreda T., Águeda B., Ortega-Martínez P., Fernández-Toirán L.M. (2012). *Edible sporocarp production by age class in a Scots pine stand in Northern Spain*. Mycorrhiza 22(3): 167-174. Studio su Pinar Grande (Soria); citazione confermata, risultati non letti.
