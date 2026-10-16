# Ricerca micologica estesa e modello di previsione per i funghi in Italia
## Studio dello stato dell'arte, limiti del modello attuale e proposta architetturale "Fronda 3.0"

Documento redatto il 16 ottobre 2026. Raccoglie la rassegna della letteratura scientifica micologica italiana ed europea, analizza i limiti del modello matematico attuale (v2.0.0) e definisce le specifiche del nuovo modello a due stadi (*Hurdle Model*) per la stima della probabilità ecologica di fruttificazione e della trovabilità dei funghi negli ecosistemi italiani.

---

## 1. Come leggere le etichette di evidenza

Come stabilito in `docs/metodo-scientifico.md`, ogni affermazione, parametro o formula porta una classificazione esplicita del livello di evidenza:

| Etichetta | Significato |
|---|---|
| **Letteratura** | Sostenuto da almeno uno studio peer-reviewed pubblicato. Ne vengono indicati autori, anno, rivista, contesto geografico e limiti di trasferibilità. |
| **Dato ufficiale** | Prodotto da un ente cartografico o meteorologico con metodologia documentata (Regione Lazio, Open-Meteo, Copernicus, OpenStreetMap). Riguarda l'origine del dato, non la sua assenza di errore al suolo. |
| **Euristica** | Valore desunto da manualistica micologica, esperienza sul campo dei cercatori o ragionevolezza biologica. Parametro da calibrare, non verità dimostrata. |
| **Interpretazione** | Deduzione formale che collega una conclusione della letteratura a una scelta algoritmica del software. |
| **Parere** | Valutazione di opportunità progettuale o di design. |

---

## 2. Rassegna della letteratura micologica ed ecologica

### 2.1 Gli studi negli ecosistemi forestali italiani (Appennino e area mediterranea)

La ricerca micologica sul campo in Italia ha dimostrato che la fruttificazione dei macromiceti epigei è un fenomeno discontinuo, governato dall'interazione tra bilancio idrico del suolo, finestre termiche e tipo di copertura forestale.

#### Salerni, Laganà, Perini et al. (2002) — Querceti mediterranei in Toscana
- **Riferimento**: *Effects of temperature and rainfall on fruiting of macrofungi in oak forests of the Mediterranean area*, Israel Journal of Plant Sciences 50(3): 189–198.
- **Ambito**: Querceti a prevalenza di cerro (*Quercus cerris*) e leccio (*Quercus ilex*) nella Toscana centro-meridionale.
- **Risultato chiave**: Tra diverse finestre di precipitazione antecedente testate (5, 10, 15 e 30 giorni prima dei campionamenti), la **correlazione statistica più forte e costante** con la ricchezza di specie e il numero di carpofori si osserva sulla **finestra cumulativa di 30 giorni** (**Letteratura**).
- **Limite**: Lo studio considera la comunità fungina nel suo complesso, non i singoli individui o le singole specie di boleti.

#### Salerni, Paoli, Perini (2023) — Abetine e faggete appenniniche: impatto di clima e selvicoltura
- **Riferimento**: *Combined impact of forest management and climate change on Boletus edulis productivity: may mycosilviculture mitigate the effects of climate extremes?*, Italian Journal of Mycology 52(1): 76–88.
- **Ambito**: Popolamenti appenninici di *Abies alba* e faggete tosco-emiliane.
- **Risultato chiave**:
  1. I picchi termici estivi estremi (> 28–30 °C) deprimono la produzione di *Boletus edulis* nei boschi a copertura densa privi di gestione, mentre dove il bosco ha subito diradamenti mirati la produzione reagisce con un ritardo di circa 20 giorni (**Letteratura**).
  2. Lo strato di lettiera organica e la volta arborea agiscono da tampone microclimatico, rallentando l'evaporazione dell'acqua del suolo.
- **Interpretazione per il modello**: Una temperatura massima elevata dell'aria non agisce istantaneamente sul micelio profondo, ma sterilizza la lettiera superficiale (0–5 cm) dove si formano i primordi.

#### Network per lo studio della diversità micologica (NdM) e ISPRA (2021–2026)
- **Riferimento**: Sistema Informativo Funghi (SIF), ISPRA / Società Botanica Italiana.
- **Contenuto**: Linee guida nazionali per il monitoraggio della biodiversità fungina basate sull'incrocio tra tipi forestali (classificazione EUNIS e carte forestali regionali) e quote altimetriche (**Dato ufficiale**).
- **Evidenza**: La presenza del simbionte micorrizico è vincolata in modo deterministico alla presenza delle piante ospiti (Fagaceae, Pinaceae, Betulaceae, Salicaceae). Nessun modello meteorologico può compensare l'assenza dell'albero partner.

---

### 2.2 I modelli quantitativi europei: l'approccio Hurdle Model a due stadi

Negli ultimi vent'anni, i gruppi di ricerca di biometria forestale e micologia in Spagna e Svizzera (CTFC - Centro di Scienza e Tecnologia Forestale della Catalogna, Università di Lleida, WSL svizzero) hanno rivoluzionato la modellistica della produzione fungina:

#### Martínez-Peña, de-Miguel, Bonet, Martínez de Aragón, Pukkala (2012, 2014)
- **Riferimenti**:
  - *Yield models for ectomycorrhizal mushrooms in Pinus sylvestris forests with special focus on Boletus edulis and Lactarius group deliciosus*, Forest Ecology and Management 282: 63–69 (2012).
  - *Predicting mushroom yields in forest stands using two-stage models*, Annals of Forest Science (2014).
- **Innovazione metodologica**:
  I dataset di raccolta funghi sul campo presentano una quantità enorme di valori nulli (*excess of zeros*): giorni o parcelle in cui non cresce alcun fungo. La regressione lineare tradizionale o moltiplicativa produce forti distorsioni.
  La soluzione adottata è il **modello a ostacolo a due stadi (Two-Stage Hurdle Model)**:
  1. **Stadio 1 — Probabilità di occorrenza ($P_{\text{occurrence}}$)**: Modello di regressione logistica binaria ($\text{logit}(p) = \beta X$) che stima la probabilità (0–1 o 0–100%) che vi sia fruttificazione in un dato giorno e appezzamento (**Letteratura**).
  2. **Stadio 2 — Resa o densità condizionata ($Y | P > 0$)**: Modello log-lineare che quantifica la densità o biomassa prodotta, dato che l'evento di fruttificazione si è innescato (**Letteratura**).
  3. **Resa attesa**: $E[Y] = P_{\text{occurrence}} \times \text{Resa\_condizionata}$.

#### Karavani, de-Miguel, De Cáceres, Martínez de Aragón, Bonet (2018)
- **Riferimento**: *Predicting mushroom productivity from soil water balance*, Agricultural and Forest Meteorology 259: 236–244.
- **Risultato chiave**: Sostituire la semplice pioggia cumulata in millimetri con un modello di **bilancio idrico del suolo** (che calcola l'acqua disponibile sottraendo l'evapotraspirazione cumulata e il drenaggio) aumenta notevolmente la capacità predittiva per i funghi micorrizici (**Letteratura**).
- **Interpretazione per il modello**: 30 mm di pioggia caduti ad agosto con 32 °C ed elevata evaporazione scompaiono dal suolo in 48–72 ore. Gli stessi 30 mm a ottobre con 14 °C mantengono il suolo umido per due settimane. La pioggia grezza, da sola, non basta.

---

### 2.3 Dinamica di *Boletus edulis*: la stazione decennale di Bielefeld

#### Brejon Lamartinière & Hoffman (2025; v2 giugno 2026, in stampa su *Fungal Ecology*)
- **Riferimento**: *Predicting porcini: a decade of sporocarp monitoring reveals the meteorological triggers of Boletus edulis fruiting in central European beech forests*, bioRxiv v2.
- **Dataset**: Dieci anni (2015–2024) di conteggi giornalieri di sporocarpi di *Boletus edulis* in faggeta su parcelle permanenti.
- **Risultati quantitativi verificati**:
  1. **Optimum termico**: Picco di fruttificazione centrato su una temperatura media di circa **13,0–13,7 °C** calcolata sui 20 giorni precedenti ($T_{20}$) (**Letteratura**).
  2. **Finestra di pioggia primaria**: Risposta lineare positiva con la pioggia cumulata su una finestra di circa **26 giorni** (tra 26 e 32 giorni a seconda del sito) (**Letteratura**).
  3. **Fruttificazioni massime**: Concentrate in finestre con $T_{20}$ tra 10 e 15 °C e precipitazione media di 2–4 mm al giorno.
  4. **Limiti**: Lo studio non ha misurato l'umidità del suolo e non ha inserito lo shock termico nelle variabili del modello statistico finale. L'applicazione all'Appennino richiede prudenza per via del regime pluviometrico e termico mediterraneo.

---

### 2.4 Fenologia e cambiamenti climatici in Europa

#### Büntgen, Kauserud, Boddy, Egli et al. (2012, 2013, 2014)
- **Riferimenti**:
  - *Warming-induced shift in European mushroom fruiting phenology*, PNAS 109(36): 14488–14493 (2012).
  - *Unraveling environmental drivers of a recent increase in Swiss fungi fruiting*, Global Change Biology 19(9): 2785–2794 (2013).
  - *Climate variation effects on fungal fruiting*, Fungal Ecology 10: 20–33 (2014).
- **Risultato chiave**: Su oltre 746.000 record storici europei, la stagione autunnale di fruttificazione ha mostrato un ritardo medio di 12–20 giorni verso i mesi invernali (**Letteratura**).
- **Interpretazione per il modello**: I calendari rigidi con pesi mensili fissi (es. "novembre = 0,4", "dicembre = 0") chiudono artificialmente la stagione anche quando l'autunno caldo e piovoso mantiene condizioni ideali. La stagionalità biologica deve essere guidata da **sommatorie termiche** e temperature medie anziché dal giorno di calendario.

---

### 2.5 Fisiologia della crescita dello sporoforo: induzione, cinetica e inibizione

La letteratura micologica sperimentale e le osservazioni sul campo descrivono il ciclo di vita del corpo fruttifero attraverso tre stadi fisiologici precisi:

```
┌─────────────────────────┐
│  Micelio nel suolo      │
│  (fase vegetativa)      │
└────────────┬────────────┘
             │  Innesco (Trigger):
             │  • Reidratazione del suolo (pioggia cumulata > soglia)
             │  • Shock termico / aerazione della lettiera
             ▼
┌─────────────────────────┐
│  Primordio (Pinhead)    │ 2 – 5 giorni sotto le foglie
│  (fase di differenziaz.)│
└────────────┬────────────┘
             │  Crescita esponenziale:
             │  • Terreno costantemente umido (0,14 – 0,28 m³/m³)
             │  • Temperatura nell'intervallo di specie
             ▼
┌─────────────────────────┐
│  Sporoforo visibile     │ Crescita: 1 – 2 cm / giorno
│  (fase di accrescimento)│ Durata della buttata: 7 – 12 giorni
└────────────┬────────────┘
             │
             ├──────────────────────────────────┐
             ▼                                  ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│  Maturazione & Spore    │        │  Arresto / Mortalità    │
│  (condizioni stabili)   │        │  • Vento secco (VPD alto│
│                         │        │  • Gelo (< -1 °C)       │
│                         │        │  • Caldo torrido (>30°C)│
└─────────────────────────┘        └─────────────────────────┘
```

1. **Induzione primordiale (Pinheading)**:
   - Dalla reidratazione dell'orizzonte umico alla differenziazione del nodo ifale primordiale passano 2–5 giorni.
   - Nelle colture e in natura, un calo repentino di temperatura (thermal drop o cold shock di 3–5 °C) stimola il passaggio da accrescimento vegetativo a riproduttivo (**Letteratura** in micologia applicata; **Euristica** diffusa per i funghi silvestri).
2. **Accrescimento cellulare e latenza (*Lag phase*)**:
   - Dalla formazione del primordio alla comparsa del fungo sopra la lettiera passano dai 5 ai 7 giorni per i boleti estivi, 7–12 giorni per *Boletus edulis*, 10–15 giorni a quote elevate o con temperature fresche.
   - La crescita lineare è nell'ordine di **1–2 cm al giorno** di allungamento e allargamento del cappello in condizioni favorevoli.
3. **Fattori inibitori e disseccamento rapido**:
   - **Vento secco settentrionale (Tramontana, Grecale)**: genera un forte Deficit di Pressione di Vapore (VPD), seccando lo strato di lettiera (0–5 cm) in 24–48 ore. L'aria secca disidrata la cuticola, provoca spaccature e aborto dei primordi, anche con acqua ancora presente in profondità (**Euristica** da esperienza micologica consolidata).
   - **Gelo (< -1 °C)**: l'acqua libera nei tessuti (che costituisce oltre il 90% del peso fresco) congela, distruggendo le membrane cellulari. I carpofori si scuriscono, diventano spugnosi e marciscono al disgelo.
   - **Caldo estremo (> 30 °C)**: innesca autolisi e favorisce lo sviluppo fulmineo di larve di ditteri micetofilidi (funghi "bacati" prima di raggiungere la taglia minima).

---

## 3. Diagnosi critica del modello attuale (Fungaroli v2.0.0 / Fronda Studio)

L'attuale motore di calcolo in [`js/model.js`](file:///Users/matteo/dev/fungaroli/js/model.js) presenta pregi metodologici unici, ma anche vincoli matematici e biologici che ne limitano la precisione.

### 3.1 Punti di forza da conservare
- **Campionamento dell'habitat per fasce di quota**: Utilizzo della Carta Forestale tipologica della Regione Lazio su griglia regolare di punti georeferenziati con quote Copernicus DEM GLO-90. Questo approccio è oggettivo e aderente al territorio (**Dato ufficiale**).
- **Integrità dei dati mancanti**: Se una finestra meteorologica è incompleta, l'indice è "non calcolabile" anziché sostituire i dati assenti con zeri fittizi (**Scelta rigorosa approvata**).
- **Separazione tra indice biologico e preferenze pratiche**: L'indice di crescita resta puro; comodità di accesso, distanza stradale, folla e meteo dell'uscita influenzano solo l'ordinamento delle proposte, non il punteggio biologico.

### 3.2 Limiti matematici ed ecologici

```
Modello Attuale v2.0.0 (Catena moltiplicativa pura):
Indice = 10 × stagione × habitat × quota × pioggia × temperatura × suolo × gelo × caldo × shock
```

1. **La "falesia moltiplicativa"**:
   Moltiplicare 8 o 9 fattori continui compresi tra 0 e 1 genera una curva di decadimento troppo ripida. Se 7 fattori su 8 sono favorevoli al valore 0,80:
   $$0,80^7 \approx 0,209 \implies \text{Indice} = 2,1 / 10$$
   Un giorno con condizioni eccellenti su quasi tutti i fronti viene classificato come "scadente" o "scarso" solo perché nessuno dei fattori raggiunge il massimo teorico assoluto.
2. **Pioggia grezza vs bilancio idrico**:
   Il modello considera la somma dei millimetri caduti. Non tiene conto dell'evaporazione causata dal calore o dal vento nei giorni successivi alla pioggia.
3. **Assenza della variabile vento / umidità dell'aria**:
   Se dopo una pioggia ottimale soffia vento forte e secco da nord per 3 giorni, la lettiera si secca e la buttata si interrompe. Il modello attuale continua a calcolare un indice alto perché "ha piovuto 10 giorni fa".
4. **Stagionalità rigida a 12 pesi mensili**:
   Interpolare i mesi sul giorno 15 chiude anticipatamente la stagione in annate con autunni miti e prolungati.
5. **Confusione tra "Probabilità" e "Indice"**:
   L'app ha finora evitato il termine "probabilità" per non illudere il cercatore. Tuttavia, nella scienza ecologica la probabilità di fruttificazione ha una definizione matematica precisa ($P \in [0, 1]$ tramite regressione logistica). Questa grandezza va distinta dalla densità o facilità di ritrovamento sul terreno.

---

## 4. Architettura del nuovo modello "Fronda 3.0"

Il modello proposto si fonda sull'approccio **Hurdle Model a due stadi** mutuato dalla letteratura scientifica (de-Miguel et al., Karavani et al.), integrando il bilancio idrico e i fattori inibitori della lettiera.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MODELLO FRONDA 3.0 (HURDLE DUAL-STAGE)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│ STADIO 1: RISPOSTA DEL MICELIO      │   │ STADIO 2: AMBIENTE E BOSCO          │
│ Probabilità di Fruttificazione      │   │ Idoneità dell'Habitat alla Quota    │
│ P_fruiting ∈ [0, 1] (0 – 100%)      │   │ H_habitat ∈ [0, 1] (0 – 100%)       │
├─────────────────────────────────────┤   ├─────────────────────────────────────┤
│ • Bilancio Idrico Cumulato (Netto)  │   │ • Carta Forestale Regione Lazio     │
│ • Umidità del Suolo (3–9 cm)        │   │ • Frazione bosco idoneo per specie  │
│ • Risposta Termica Non-Lineare (T20)│   │ • Attinenza altitudinale continua   │
│ • Shock Termico (Innesco Primordi)  │   │                                     │
│ • Inibitori: Vento Secco, Gelo,     │   │                                     │
│   Caldo Torrido                     │   │                                     │
└──────────────────┬──────────────────┘   └──────────────────┬──────────────────┘
                   │                                         │
                   └────────────────────┬────────────────────┘
                                        │
                                        ▼
                   ┌────────────────────────────────────────┐
                   │    TROVABILITÀ / PROBABILITÀ INCONTRO  │
                   │    P_trova = P_fruiting × H_habitat     │
                   │    (Stima 0 – 100% di trovare funghi)  │
                   └────────────────────┬───────────────────┘
                                        │
                                        ▼
                   ┌────────────────────────────────────────┐
                   │    INDICE SINTETICO FRONDA             │
                   │    Scala pubblica 0,0 – 10,0           │
                   │    I = 10 × (P^0,6 × H^0,4) × Stagione │
                   └────────────────────────────────────────┘
```

---

### 4.1 Stadio 1: Probabilità ecologica di fruttificazione ($P_{\text{fruiting}}$)

Rappresenta la probabilità che il micelio nel terreno abbia sviluppato primordi e li stia portando a maturazione. Viene calcolata tramite funzione logistica:

$$P_{\text{fruiting}} = \frac{1}{1 + e^{-Z}}$$

Il logit $Z$ è la combinazione dei fattori fisiologici ed ecologici:

$$Z = \beta_0 + \beta_W \cdot W_{\text{eff}} + \beta_S \cdot S_{\text{index}} + \beta_T \cdot T_{\text{fit}} + \text{Shock} - \text{Penalità}$$

#### A. Bilancio idrico efficace ($W_{\text{eff}}$)
Invece della sola pioggia grezza, si calcola la precipitazione netta sottraendo una quota stimata di evaporazione:
- **Pioggia nella finestra di latenza** ($d - lag_{\max}$ a $d - lag_{\min}$):
  $$R_{\text{lag}} = \sum_{k = d - lag_{\max}}^{d - lag_{\min}} \max(0, P_k - \text{Evap}_k)$$
- **Pioggia cumulativa a 30 giorni** ($d - 30$ a $d - 1$):
  $$R_{30} = \sum_{k = d - 30}^{d - 1} \max(0, P_k - \text{Evap}_k)$$
- **Evento di innesco (*Trigger*)**:
  Una pioggia singola $\ge 10\text{ mm}$ concentra l'acqua in profondità in modo più efficace di piogge deboli e disperse:
  $$\text{Trigger} = \min\left(1, \frac{\max(P_{\text{giornaliera}})}{10}\right)$$
- **Indice idrico normalizzato**:
  $$W_{\text{eff}} = 0,65 \cdot \left(1 - e^{-R_{\text{lag}} / E_{\text{ref}}}\right) \cdot (0,4 + 0,6 \cdot \text{Trigger}) + 0,35 \cdot \left(1 - e^{-R_{30} / (2 \cdot E_{\text{ref}})}\right)$$
  *(Etichetta: Letteratura per finestre 30 gg e latenza; Euristica per pesi ed $E_{\text{ref}}$)*.

#### B. Umidità del suolo a 3–9 cm ($S_{\text{index}}$)
Misura l'ambiente in cui risiedono i nodi ifali primordiali:
- Sotto $0,10\text{ m}^3/\text{m}^3$: terreno secco, arresto della nutrizione osmotica.
- Tra $0,14$ e $0,28\text{ m}^3/\text{m}^3$: intervallo ideale per lo sviluppo.
- Sopra $0,38\text{ m}^3/\text{m}^3$: asfissia idrica e ristagno (penalità lieve per mancanza di ossigeno).
  *(Etichetta: Dato ufficiale per la variabile Open-Meteo; Euristica per le soglie)*.

#### C. Risposta termica non-lineare asimmetrica ($T_{\text{fit}}$)
Sulla base dei dati di Brejon Lamartinière & Hoffman (2025/2026), la risposta termica alla media dei 20 giorni precedenti ($T_{20}$) è descritta da una curva a campana con penalizzazione differenziata per eccesso di caldo:
$$T_{\text{fit}} = \exp\left( - \frac{(T_{20} - T_{\text{opt}})^2}{2 \cdot \sigma_T^2} \right)$$
*(Etichetta: Letteratura per $T_{\text{opt}} \approx 13\text{ }^\circ\text{C}$ di B. edulis; Euristica per le altre specie)*.

#### D. Shock termico di innesco ($\text{Shock}$)
Un calo rapido della temperatura media giornaliera di almeno $3,5\text{--}4,5\text{ }^\circ\text{C}$ nell'arco di 48–72 ore, avvenuto tra 4 e 14 giorni prima del giorno considerato, agisce da segnale di differenziazione dei primordi:
- Specie con risposta alta (*Armillaria mellea*, *Boletus edulis*): bonus $+0,5\text{--}+0,8$ su $Z$.
- Specie xerotermiche estive (*Amanita caesarea*): nessun bonus da calo termico (richiede stabilità calda).
  *(Etichetta: Euristica da pratica micologica)*.

#### E. Fattori inibitori della lettiera (Vento, Gelo, Caldo)
- **Vento secco (Tramontana / Grecale)**:
  Se nei 3 giorni precedenti la velocità media o le raffiche superano i $35\text{ km/h}$ con umidità relativa pomeridiana $< 45\%$:
  $$\text{Penalità}_{\text{vento}} = \text{clamp}\left(\frac{V_{\text{vento}} - 30}{35}, 0, 0,4\right)$$
  *(Etichetta: Euristica da osservazione sul campo)*.
- **Gelo recente**:
  Se la temperatura minima degli ultimi 4 giorni scende sotto $-1\text{ }^\circ\text{C}$:
  $$\text{Penalità}_{\text{gelo}} = \begin{cases} 0,5 \cdot \text{clamp}\left(\frac{-T_{\min}}{4}, 0, 1\right) & \text{specie sensibili} \\ 0,15 \cdot \text{clamp}\left(\frac{-T_{\min}}{4}, 0, 1\right) & \text{specie resistenti (Moretta, Agarico violetto)} \end{cases}$$
  *(Etichetta: Euristica)*.
- **Caldo torrido**:
  Se la massima degli ultimi 3 giorni supera i $30\text{ }^\circ\text{C}$:
  $$\text{Penalità}_{\text{caldo}} = 0,35 \cdot \text{clamp}\left(\frac{T_{\max} - 29}{5}, 0, 1\right)$$
  *(Etichetta: Letteratura Salerni et al. 2023 per l'effetto; Euristica per la soglia numerica)*.

---

### 4.2 Stadio 2: Idoneità dell'habitat e della quota ($H_{\text{habitat}}$)

Rappresenta la capacità portante del territorio alla quota considerata, basata sui dati reali della Carta Forestale tipologica:

1. **Idoneità forestale ponderata**:
   $$H_{\text{bosco}} = \sum_{c \in \text{tipi forestali}} \text{frazione}_c \cdot \text{affinità}_{\text{specie}}[c]$$
   Con saturazione piena al 40% di copertura idonea:
   $$H_{\text{cap}} = \min(1, H_{\text{bosco}} / 0,40)$$
   *(Etichetta: Dato ufficiale per la mappa regionale; Euristica per le affinità 0–1)*.
2. **Attinenza altitudinale a spalla morbida**:
   Anziché spezzare bruscamente ai confini altimetrici, si usa una transizione graduale gaussiana:
   $$H_{\text{quota}} = \begin{cases} 1 & \text{se } E_{\min} \le \text{band} \le E_{\max} \\ \exp\left(-\frac{(\text{band} - E_{\min})^2}{2 \cdot 150^2}\right) & \text{se } \text{band} < E_{\min} \\ \exp\left(-\frac{(\text{band} - E_{\max})^2}{2 \cdot 150^2}\right) & \text{se } \text{band} > E_{\max} \end{cases}$$
3. **Idoneità complessiva**:
   $$H_{\text{habitat}} = H_{\text{cap}} \cdot H_{\text{quota}}$$

---

### 4.3 Stadio 3: Sintesi della "Probabilità di Ritrovamento" e Indice Fronda

Per rispondere all'esigenza pratica del cercatore mantenendo il rigore scientifico di `AGENTS.md`:

#### 1. Probabilità ecologica di buttata ($P_{\text{fruiting}} \in [0, 100\%]$)
Dice se le condizioni meteorologiche e del suolo hanno stimolato la nascita dei funghi in quella specifica fascia climatica.

#### 2. Probabilità di ritrovamento / "Trovabilità" ($P_{\text{trova}} \in [0, 100\%]$)
Definita secondo la formulazione a due stadi di Karavani e de-Miguel:
$$P_{\text{trova}} = P_{\text{fruiting}} \times H_{\text{habitat}}$$
Rappresenta la probabilità congiunta che vi siano funghi nati E che il cercatore si trovi in un bosco capace di ospitarli.
- In una pineta pura a 1200 m, la trovabilità di *Amanita caesarea* è $0\%$, anche se il meteo è ideale per gli ovoli.
- In una faggeta perfetta a 1300 m in piena siccità estiva, la trovabilità di *Boletus edulis* è $0\%$.

#### 3. Indice sintetico Fronda (Scala pubblica 0,0 – 10,0)
Per evitare la falesia moltiplicativa conservando la sensibilità della scala:
$$\text{Indice Fronda} = 10 \times \left( P_{\text{fruiting}}^{0,6} \times H_{\text{habitat}}^{0,4} \right) \times \text{Stagione}$$
- Preserva la scala 0–10 con decimale italiano.
- Non si azzera se uno solo dei parametri secondari cala dell'10%.
- Si azzera se non c'è habitat o se le condizioni ambientali sono del tutto avverse.

---

## 5. Matrice dei parametri per gruppo ecologico

| Specie / Gruppo | Ruolo Trofico | $T_{\text{opt}}$ (°C) | Tolleranza $\sigma_T$ (°C) | Latenza pioggia (gg) | Pioggia rif. $E_{\text{ref}}$ (mm) | Quota ottimale (m) | Risposta a Shock Termico | Tolleranza al Gelo |
|---|---|---|---|---|---|---|---|---|
| **Boletus edulis** (Porcino comune) | Ectomicorrizico mesofilo | 13,5 | 3,2 | 7 – 18 | 28 | 700 – 1800 | Alta (+0,60) | Bassa |
| **Boletus pinophilus** (Porcino rosso) | Ectomicorrizico montano | 13,0 | 3,2 | 7 – 20 | 30 | 900 – 1900 | Media (+0,45) | Media |
| **Boletus aereus** (Porcino nero) | Ectomicorrizico termofilo | 18,5 | 3,5 | 6 – 16 | 25 | 300 – 1100 | Bassa (+0,20) | Nulla |
| **Boletus aestivalis** (Porcino estivo) | Ectomicorrizico sub-termofilo | 17,5 | 3,5 | 6 – 15 | 25 | 400 – 1300 | Bassa (+0,25) | Nulla |
| **Amanita caesarea** (Ovolo buono) | Ectomicorrizico xerotermico | 19,5 | 3,0 | 6 – 15 | 24 | 300 – 1000 | Nulla (richiede stabilità) | Nulla |
| **Cantharellus cibarius** (Finferlo) | Ectomicorrizico igrofilo | 15,0 | 4,0 | 7 – 24 | 32 | 400 – 1700 | Lieve (+0,15) | Media |
| **Craterellus cornucopioides** (Trombetta) | Ectomicorrizico umicolo | 12,0 | 3,8 | 7 – 20 | 28 | 400 – 1500 | Media (+0,45) | Media |
| **Armillaria mellea** (Chiodino) | Parassita / saprotrofo lignicolo | 11,0 | 3,0 | 5 – 14 | 22 | 200 – 1500 | Massima (+0,80) | Media |
| **Macrolepiota procera** (Mazza di tamburo) | Saprotrofo praticolo | 15,5 | 4,2 | 4 – 12 | 22 | 200 – 1500 | Lieve (+0,15) | Bassa |
| **Tricholoma terreum** (Moretta) | Ectomicorrizico tardivo | 9,0 | 3,0 | 7 – 18 | 24 | 300 – 1600 | Lieve (+0,20) | Alta (tollerante) |
| **Lepista nuda** (Agarico violetto) | Saprotrofo della lettiera | 8,5 | 3,0 | 7 – 18 | 24 | 200 – 1600 | Lieve (+0,20) | Alta (tollerante) |
| **Hydnum repandum** (Steccherino) | Ectomicorrizico tardivo | 11,5 | 3,8 | 7 – 20 | 28 | 400 – 1600 | Media (+0,35) | Buona |

---

## 6. Confronto tra versioni: Fungaroli v2.0 vs Fronda 3.0

| Caratteristica | Fungaroli v2.0.0 (Attuale) | Proposta Fronda 3.0 (Hurdle Model) |
|---|---|---|
| **Struttura di calcolo** | Catena moltiplicativa pura ($9\text{ fattori}$) | Due stadi separati: Probabilità fisiologica $\times$ Idoneità dell'habitat |
| **Effetto accumulo penalità** | Falesia: fattori parziali decimano il punteggio | Graduazione bilanciata logistica e geometrico-armonica |
| **Gestione della pioggia** | Solo mm cumulati lordi | Pioggia netta depurata da stima di evapotraspirazione |
| **Aria e vento secco** | Assenti | Penalità esplicita per vento forte e bassa umidità (Tramontana) |
| **Stagionalità** | 12 pesi fissi mensili centrate al giorno 15 | Sommatorie termiche e temperatura media con pesi flessibili |
| **Chiarezza dell'output** | Unico numero 0–10 | Triplice lettura: Probabilità di buttata (%), Trovabilità (%), Indice Fronda (0–10) |
| **Validazione e trasparenza** | Tutte le euristiche dichiarate | Mantenuta e rafforzata con etichette chiare per ogni equazione |

---

## 7. Bibliografia scientifica consultata e citata

1. **Boddy L., Büntgen U., Egli S., Gange A.C., Heegaard E., Kirk P.M., Mohammad A., Kauserud H. (2014)**. *Climate variation effects on fungal fruiting*. Fungal Ecology 10: 20–33. https://doi.org/10.1016/j.funeco.2013.10.006
2. **Brejon Lamartinière E., Hoffman J.I. (2025; v2 8 giugno 2026)**. *Predicting porcini: a decade of sporocarp monitoring reveals the meteorological triggers of Boletus edulis fruiting in central European beech forests*. bioRxiv v2. https://doi.org/10.64898/2025.12.12.693895 (in stampa su *Fungal Ecology*).
3. **Büntgen U., Peter M., Kauserud H., Egli S. (2013)**. *Unraveling environmental drivers of a recent increase in Swiss fungi fruiting*. Global Change Biology 19(9): 2785–2794.
4. **de-Miguel S., Bonet J.A., Pukkala T., Martínez de Aragón J. (2014)**. *Predicting mushroom yields in forest stands using two-stage models*. Annals of Forest Science.
5. **Egli S., Peter M., Buser C., Stahel W., Ayer F. (2006)**. *Mushroom picking does not impair future harvests: results of a long-term study in Switzerland*. Biological Conservation 129: 271–276.
6. **Karavani A., de-Miguel S., De Cáceres M., Martínez de Aragón J., Bonet J.A. (2018)**. *Predicting mushroom productivity from soil water balance*. Agricultural and Forest Meteorology 259: 236–244. https://doi.org/10.1016/j.agrformet.2018.05.005
7. **Kauserud H., Heegaard E., Büntgen U. et al. (2012)**. *Warming-induced shift in European mushroom fruiting phenology*. PNAS 109(36): 14488–14493. https://doi.org/10.1073/pnas.1200789109
8. **Martínez-Peña F., de-Miguel S., Pukkala T., Bonet J.A., Ortega-Martínez P., Aldea J., Martínez de Aragón J. (2012)**. *Yield models for ectomycorrhizal mushrooms in Pinus sylvestris forests with special focus on Boletus edulis and Lactarius group deliciosus*. Forest Ecology and Management 282: 63–69. https://doi.org/10.1016/j.foreco.2012.06.034
9. **Salerni E., Laganà A., Perini C., Loppi S., De Dominicis V. (2002)**. *Effects of temperature and rainfall on fruiting of macrofungi in oak forests of the Mediterranean area*. Israel Journal of Plant Sciences 50(3): 189–198. https://doi.org/10.1092/GV8J-VPKL-UV98-WVU1
10. **Salerni E., Paoli L., Perini C. (2023)**. *Combined impact of forest management and climate change on Boletus edulis productivity: may mycosilviculture mitigate the effects of climate extremes?*. Italian Journal of Mycology 52(1): 76–88. https://doi.org/10.6092/issn.2531-7342/16464
