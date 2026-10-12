# Zone candidate per la raccolta funghi – provincia di Rieti e dintorni

Ricerca del 12/10/2026. Legenda: **[FATTO]** = letto sulla fonte citata · **[INTERPRETAZIONE]** = mia lettura (quote, bosco, specie probabili) · **[NON VERIFICATO]** = non trovato o non leggibile.

## Come ho lavorato e limiti

- **Fonti lette per intero:** l'archivio completo delle API WordPress di *RietInVetrina* (142 articoli con "funghi", 36 con "porcini"), *La Provincia di Rieti*, *Format Rieti*, *Sabina Magazine* e *Frontiera Rieti*. Ho letto anche alcuni articoli del *Messaggero Rieti* via curl e diverse pagine di sagre, CAI, riserve ed escursionismo.
- **Fonti non raggiungibili:**
  - *RietiLife* è dietro Cloudflare: ho solo i titoli e gli snippet dei motori di ricerca.
  - Il forum funghiitaliani.it/AMINT, cercato per Terminillo, Leonessa e Antrodoco, non ha dato quasi nulla di utile. L'unico riferimento è un'uscita del GMR "zona Terminillo" del 2006.
  - Overpass non era raggiungibile.
- **Il tipo di fonte che ha reso di più:** le notizie di cronaca su cercatori soccorsi o dispersi e sui controlli dei Carabinieri Forestali. Sono quasi l'unica fonte che nomina località precise. Va tenuto presente cosa dicono: dimostrano che **lì la gente va a cercare funghi**, non quanto il posto renda.
- **Coordinate e dati di contorno:**
  - Coordinate: Nominatim (con lo UA richiesto, 1 richiesta/s) e Photon.
  - Quote: DEM EU-DEM 25 m (opentopodata), campionando una griglia 7×7 attorno al centro.
  - Tipo di bosco: Carta Forestale su base tipologica della Regione Lazio (WFS `geonode:tipi_forestali2`, lo stesso layer usato da `tools/build_habitat.py`), in un cerchio di 1,5–3 km. Le percentuali sono sulla superficie totale del cerchio.
- **Specie:** quasi nessuna fonte giornalistica le nomina. Le specie del JSON sono quindi in gran parte **[INTERPRETAZIONE]** dal tipo di bosco e dalla quota, salvo dove scritto [FATTO].
- **Popolarità:** stima soggettiva (0 = deserto, 1 = affollatissimo), basata su quante segnalazioni indipendenti ho trovato e sulla vicinanza a Rieti.

### Regole generali emerse dalle fonti (valide ovunque in provincia)

- [FATTO] Servono l'attestato di formazione micologica e il tesserino regionale (L.R. Lazio 32/1998), con la ricevuta della tassa annuale. Il limite è di **3 kg a persona**. Sono vietati la raccolta notturna, i contenitori di plastica, rastrelli e uncini, e la raccolta dell'ovolo chiuso. È vietata la raccolta nelle aree private. Fonti: RietInVetrina 12/09/2019 e 04/08/2014; Format Rieti ottobre 2024.
- [FATTO] Giorni consentiti: *"la raccolta è possibile nei giorni di martedì, venerdì, sabato e domenica"*. Lo riportano i Forestali di Cittareale (2019) e di Borgorose (2014). **[NON VERIFICATO]** che il calendario sia ancora quello nel 2026. Nel 2024 i Carabinieri parlano ancora di *"giornate di riposo del bosco"* e di sanzioni per *"raccolta in giornate non consentite"*.
  - https://www.rietinvetrina.it/forestali-sequestrano-10-chili-di-funghi-raccolti-illecitamente-sanzionate-cinque-persone/
  - https://laprovinciarieti.it/2024/10/26/raccolta-funghi-si-intensificano-i-controlli-dei-carabinieri-forestale/
- [FATTO] Nell'autunno 2024 il Gruppo Carabinieri Forestale di Rieti ha fatto *"oltre 200 controlli"*, con 25 verbali e circa 60 kg di funghi sequestrati. Le località non sono nominate. Fonte: https://www.archivio.formatrieti.it/raccolta-funghi-intensificati-i-controlli-dei-carabinieri-forestale

---

## A. Il "Collerinaldo" segnalato dall'utente

**Collerinaldo = Colle Rinaldo, unica frazione del comune di Borgo Velino (RI).**
- [FATTO] Velino.it: *"L'unica frazione del comune è Colle Rinaldo"*. Fonte: https://velino.it/la-nostra-terra/i-comuni/borgo-velino
- [FATTO] Il Messaggero lo descrive come centro storico di *"otto residenti"*. Fonte: https://www.ilmessaggero.it/rieti/rieti_colle_rinaldo_borgo_velino_associazione-7448859.html
- [FATTO] Nominatim lo colloca a **42.402, 13.059** (hamlet), a circa 585 m.
- [FATTO] Qui ci sono castagneti da frutto. Un incendio del 2026 ha colpito *"un castagneto da frutto per un'estensione di circa 2 ettari"* in *"località Pingue, frazione Colle Rinaldo"*.
  - https://www.ilmessaggero.it/rieti/rieti_incendio_bosco_carabinieri_denunce-9621585.html
  - https://www.rietilife.com/2026/06/29/bruciavano-sterpaglie-e-castagneto-scoppiano-due-incendi-nel-reatino-denunciati-due-uomini/ (solo snippet)
- [FATTO] La Cooperativa Velinia (Marrone Antrodocano) è nata da produttori di *"Antrodoco, Borgo velino, Castel Sant'Angelo e Micigliano"*, con sede a Borgo Velino. Fonte: https://www.coopvelinia.it/
- [FATTO] Carta Forestale, cerchio di 2 km: bosco 72%, di cui **castagneto 35%**, roverella 15%, cerreta 12%, ostrieto 9%. Quote DEM tra 450 e 1000 m.
- **[NON VERIFICATO]** Nessuna fonte scritta parla di funghi a Colle Rinaldo: c'è solo la segnalazione dell'utente.
- [INTERPRETAZIONE] È il castagneto della Media Valle del Velino, a circa 3,5 km dal centro della zona "Antrodoco" già nell'app, quindi al suo margine e dentro il raggio di 4 km. Potrebbe diventare un sottopunto della zona Antrodoco più che una zona nuova. Specie attese in castagneto: *B. aereus*, *B. aestivalis*, *B. edulis*, *A. caesarea*, chiodini, colombine.

## B. "Terminillo, Pian de' Rosce" (segnalato dall'utente): confermato

Vedi la zona 1 qui sotto. Pian de' Rosce sta nel comune di Rieti (Lisciano/Vazia), a 42.461, 12.938 (Nominatim). È diverso dalla Vallonina: è sul versante sud-ovest, verso Rieti, non sul versante di Leonessa.

## C. "Castagneti di Antrodoco": già coperti dalla zona Antrodoco

- [FATTO] Il 20/09/2026 c'è stato un intervento ad Antrodoco *"per un cercatore di funghi rimasto in difficoltà"*. Fonte: https://www.ilmessaggero.it/rieti/rieti_ricerche_soccorso_vigili-9776571.html
- [FATTO] Il Marrone Antrodocano copre Antrodoco, Borgo Velino, Castel Sant'Angelo e Micigliano (Coop Velinia, sopra). Gli eventi d'autunno ad Antrodoco includono *"Le Vie del Marrone"* e *"Alta via del Marrone – Escursione CAI"*. Fonte: https://www.eventiesagre.it/Eventi_Sagre/2957_Festa+d+Autunno+Di+Antrodoco.html

---

## Zone candidate, ordinate per affidabilità

### 1. Terminillo sud-ovest: Pian de' Rosce, Monte Cardito, Campoforogna — confidenza ALTA

- **Comune e coordinate:** Rieti (Lisciano/Vazia). Centro 42.462, 12.955 [INTERPRETAZIONE, tra Pian de' Rosce 42.461/12.938 e Monte Cardito 42.466/12.968].
- **Quote:** DEM 980–1560 m (p10–p90). [FATTO] Pian de' Rosce è *"a circa 1.100 m"* (training.camp).
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2 km: faggeta 78%, rimboschimenti di conifere 3%, roverella 2%. [FATTO] VisitRieti parla di *"l'ombra dei faggi"* e del *"rettilineo di Lisciano"*.
- **Fonti:**
  - [FATTO] Luglio 2010: cinque cercatori di funghi ultrasettantenni, tutti di Rieti, *"bloccati sul monte Terminillo in una località compresa tra 'Pian De Rosce' e 'Cardito'"*. Il bottino fu *"magro"*.
    - https://www.rietinvetrina.it/ritrovati-i-cinque-cercatori-di-funghi-dispersi-in-mattinata/
  - [FATTO] Settembre 2026: *"un cercatore di funghi sul monte Terminillo era precipitato in un dirupo sottostante il residence Rialto"*. Il Rialto è a 42.460, 12.993, tra Pian de' Rosce e Pian de' Valli.
    - https://www.ilmessaggero.it/rieti/rieti_ricerche_soccorso_vigili-9776571.html
  - [FATTO] Fonte generica: *"meritano attenzione anche i boschi del Terminillo… i porcini possono comparire già tra fine estate e inizio autunno"*.
    - https://www.kraboo.it/magazine/ottobre-2026/i-funghi-porcini
  - [FATTO] Fonte debole: nel 2013 a Pian de' Rosce i Forestali hanno distribuito *"un poster riguardante le principali specie di funghi presenti sul territorio"*.
    - https://www.frontierarieti.com/settimana-verde-studenti-e-forestale-liberano-una-poiana/
  - [FATTO] Settembre 2026: per la prima volta c'è stata al Terminillo una mostra micologica (Micologia Centro Italia APS), con *"funghi raccolti nel territorio reatino"*.
    - https://www.formatrieti.it/2026/09/09/prima-volta-a-terminillo-arriva-la-mostra-micologica-di-micologia-centro-italia/
- **Specie e mesi:** [INTERPRETAZIONE] faggeta a 1000–1600 m, quindi *B. edulis* (agosto–ottobre), *B. aestivalis* (giugno–agosto, alle quote basse), finferli, steccherini, chiodini a fine stagione. Nessuna fonte nomina le specie.
- **Popolarità:** [INTERPRETAZIONE] **molto affollata**. È a circa 20 minuti da Rieti sulla SS 4 bis del Terminillo, ha parcheggi e un bar a Pian de' Rosce ed è la zona turistica più vicina alla città.
- **Accesso:** SS 4 bis del Terminillo da Vazia e Lisciano. Pian de' Rosce è subito prima di Pian de' Valli.
- **Vincoli:** nessuna area protetta trovata **[NON VERIFICATO]**. Valgono le regole provinciali.

### 2. Terminillo sud-est: Cinque Confini, Fonte Porcini, Monte Bove, Colle delle Scangive — confidenza ALTA

- **Comuni e coordinate:** al confine tra Rieti, Borgo Velino, Micigliano e Castel Sant'Angelo. Centro 42.443, 13.012 [INTERPRETAZIONE].
  - [FATTO, Nominatim] Fonte Porcini 42.442/13.010, Monte Bove 42.444/13.027, Cinque Confini 42.446/12.991, Colle delle Scangive 42.446/13.007, Colle del Termine 42.434/13.014.
- **Quote:** DEM 1180–1630 m. [FATTO, Ardito] Cinque Confini 1550 m, Fonte Porcini 1483 m, Monte Bove 1450 m, Colle delle Scangive 1690 m.
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2 km: faggeta 75%, ostrieto 2%. [FATTO] Ardito parla di un percorso *"a piena immersione nella faggeta"*, con un *"crinale… rivestito da una bella faggeta"*.
  - https://www.stefanoardito.it/2025/10/30/dai-cinque-confini-al-monte-bove-e-al-colle-delle-scangive-monti-reatini-lazio/
- **Fonti:**
  - [FATTO] 29/08/2026: soccorso a *"un fungaiolo, colto da malore, nei pressi del bosco che dalla località Cinque Confini conduce alle pendici di Monte Bove e Colle del Termine"*, *"ad una quota di 1350 mt circa"*. La pattuglia era *"coadiuvata nella localizzazione da alcuni fungaioli in loco"* e il recupero è avvenuto *"fino alla zona di Fonte Porcini"*. La stessa notizia è uscita su tre testate:
    - https://www.rietinvetrina.it/accusa-un-malore-alle-pendici-del-monte-bove-nel-comune-di-borgo-velino/
    - https://laprovinciarieti.it/2026/08/31/malore-nei-boschi-di-borgo-velino-fungaiolo-soccorso-a-1-350-metri-e-trasportato-al-gemelli/
    - https://www.formatrieti.it/2026/08/31/paura-sul-monte-bove-soccorsa-e-salvata-una-persona-colta-da-malore/
  - [FATTO] Luglio 2010: due cercatori di funghi dispersi *"sul monte Terminillo"* sono stati ritrovati *"in località Monte Bove"*.
    - https://www.rietinvetrina.it/ritrovati-sul-terminillo-due-cercatori-di-funghi/
  - [FATTO, debole] 05/09/2026: un cercatore di funghi è precipitato *"nei fossi sotto Campo Fiorito, nel territorio del comune di Micigliano"*. Campo Fiorito non è geocodificabile: **[NON VERIFICATO]** che sia in questa stessa zona, ma Micigliano sta proprio sotto Monte Bove.
    - https://www.rietinvetrina.it/due-interventi-in-due-giorni-nel-reatino-per-il-soccorso-alpino-impegnato-in-operazioni-in-zone-impervie/
- **Specie e mesi:** [INTERPRETAZIONE] faggeta d'alta quota, con le stesse specie della zona 1. [FATTO] Le uscite documentate sono di fine agosto e luglio. Il toponimo "Fonte Porcini" in sé non prova nulla.
- **Popolarità:** [INTERPRETAZIONE] **media**: ci sono *"alcuni fungaioli in loco"* in un giorno feriale (sabato 29/08), ma la zona è più fuori mano della zona 1.
- **Accesso:** da Pian de' Valli e Campoforogna fino al piazzale dei Cinque Confini, poi a piedi sul sentiero CAI 407. [FATTO, Ardito] Nella parte centrale manca la segnaletica e il pendio è *"particolarmente impervio ed esposto alla caduta di pietre"*.
- **Vincoli:** nessuno trovato **[NON VERIFICATO]**.
- **Nota:** è a circa 4,5 km dal centro della Vallonina, quindi solo in parte sovrapposta. È il versante del Terminillo sopra Micigliano e Antrodoco.

### 3. Alto Velino: boschi di Cittareale (Fonte Corno, Fosso Builli, Vezzano) — confidenza ALTA per l'area, BASSA per i singoli punti

- **Comune e coordinate:** Cittareale. Centro amministrativo 42.618, 13.160 (Nominatim). [NON VERIFICATO] Fonte Corno, Fosso Builli e Vezzano non sono presenti su OSM o Photon: le coordinate esatte non sono verificate.
- **Quote:** DEM 890–1500 m (cerchio di 2,5 km).
- **Bosco:** [FATTO] Carta Forestale, cerchio di 3 km: bosco 61%, di cui faggeta 32%, cerreta 16%, conifere di rimboschimento 4%.
- **Fonti:**
  - [FATTO] 11/09/2019: i Carabinieri Forestali di Cittareale fanno controlli *"nelle località Fonte Corno e Fosso Builli in agro di Cittareale"*. Sanzionano *"cinque raccoglitori in trasferta provenienti dalle province di Roma e di Perugia"* e sequestrano *"funghi (genere Boletus)"*. *"Anche nei giorni precedenti erano state sanzionate altre persone"*.
    - https://www.rietinvetrina.it/forestali-sequestrano-10-chili-di-funghi-raccolti-illecitamente-sanzionate-cinque-persone/
  - [FATTO] 17/09/2022: un cercatore di funghi ferito *"in località Vezzano, territorio in agro nel Comune di Cittareale"*, *"tratto boscato particolarmente ripido"*.
    - https://www.rietinvetrina.it/pompieri-soccorrono-cercatore-di-funghi-rimasto-ferito-a-cittareale/
  - [FATTO] 17/06/2023: un cercatore di 83 anni di Spoleto muore *"nella zona di Cittareale"*. Vengono ritrovati *"il cellulare e il cestino di funghi"*.
    - https://www.rietinvetrina.it/muore-a-cittareale-mentre-cerca-funghi/
    - https://www.ilmessaggero.it/rieti/rieti_morto-7468320.html
  - [FATTO, generico] *"anche l'Alta Valle del Velino, in provincia di Rieti, merita una menzione speciale"*.
    - https://siviaggia.it/idee-di-viaggio/raccolta-funghi-italia-luoghi/485337/
- **Specie e mesi:** [FATTO] *Boletus* a settembre. [INTERPRETAZIONE] Il caso di giugno fa pensare ad *aestivalis* nella cerreta; *edulis* nella faggeta da agosto a ottobre; finferli e steccherini.
- **Popolarità:** [INTERPRETAZIONE] **medio-alta**: attira raccoglitori da Roma e da Perugia/Spoleto, perché la zona confina con l'Umbria (Norcia, Cascia).
- **Accesso:** SS 4 Salaria fino a Posta, poi SP per Cittareale. [INTERPRETAZIONE] Circa 50–60 minuti da Rieti.
- **Vincoli:** nessuna area protetta trovata **[NON VERIFICATO]**. La stazione Forestale di Cittareale controlla attivamente i giorni di raccolta.

### 4. Cicolano orientale: Pescorocchiano (Pace, Colle di Pace, Baccarecce, Colle Castagnola, Leofreni, Santa Lucia) — confidenza MEDIA

- **Comune e coordinate:** Pescorocchiano. Centro 42.210, 13.112 [INTERPRETAZIONE].
  - [FATTO, Nominatim] Pace 42.229/13.118, Colle di Pace 42.217/13.106, Baccarecce 42.221/13.125, Leofreni 42.197/13.125, Santa Lucia 42.194/13.094.
- **Quote:** DEM 590–890 m attorno a Pace; 710–980 m attorno a Leofreni e Santa Lucia.
- **Bosco:** [FATTO] Carta Forestale: attorno a Pace (2 km) castagneto 37% e cerreta 27%; attorno a Leofreni e Santa Lucia (1,5 km) **castagneto 63%** e cerreta 14%.
- **Fonti** (quattro episodi indipendenti):
  - [FATTO] 16/08/2018: un anziano *"cercava dei funghi nella zona di Colle di Pace"*, in località Baccarecce.
    - https://www.rietinvetrina.it/anziano-in-cerca-di-funghi-cade-in-un-dirupo/
  - [FATTO] 27/09/2019: una persona *"uscita in cerca di funghi"* in *"località 'Pace di Pescorocchiano'"*.
    - https://www.rietinvetrina.it/si-perde-cercando-funghi-salvato-dai-vigili-del-fuoco/
  - [FATTO] 13/06/2020: due uomini *"residenti a Pomezia"* si perdono *"nell'intento di trovare dei funghi"* in *"località 'Colle Castagnola'"*. Località non geocodificata.
    - https://www.rietinvetrina.it/si-perdono-nel-bosco-mentre-cercano-funghi-recuperati-dai-vvf/
  - [FATTO] Settembre 2025: un uomo si smarrisce *"presumibilmente mentre era alla ricerca di funghi tra Leofreni e Santa Lucia di Pescorocchiano"*. Viene ritrovato *"da un cercatore di funghi"*.
    - https://www.rietinvetrina.it/smarrito-in-zona-leofreni-cercatore-di-funghi-ricerche-in-corso/
    - https://laprovinciarieti.it/2025/09/06/pescorocchiano-ritrovato-l84enne-scomparso-tra-i-boschi-mercoledi-scorso/
  - [FATTO, generico] Ottobre 2024: un porcino da 2,440 kg trovato *"nei boschi del Cicolano"*, senza località precisa.
    - https://www.rietinvetrina.it/nel-cicolano-trovato-fungo-da-2440-chili/
- **Specie e mesi:** [INTERPRETAZIONE] castagneto e cerreta a 600–1000 m: *B. aereus* e *aestivalis* (giugno–settembre), *edulis*, ovolo (luglio–settembre), mazze di tamburo, colombine, chiodini a ottobre. [FATTO] Le uscite documentate sono di giugno, agosto e settembre.
- **Popolarità:** [INTERPRETAZIONE] **media**. Ci vanno anche persone da fuori provincia (Pomezia).
- **Accesso:** da Rieti per la SR 578 Salto-Cicolano fino a Pescorocchiano, poi strade per le frazioni. Circa 50 minuti.
- **Vincoli:** nessuno trovato.
- **Nota:** è a circa 7 km dal centro della zona "Cicolano" già nell'app (raggio 5 km), quindi appena fuori. [FATTO] Altre fonti sul Cicolano: Marcetelli fa la sagra della *"Castagna Rossa"* da 46 edizioni (laprovinciarieti 13/10/2025); il 01/08/2023 un uomo si è infortunato *"mentre cercava funghi"* a Marcetelli (RietInVetrina).

### 5. Borgorose: Valle di Malito (Corvaro) — confidenza MEDIA

- **Comune e coordinate:** Borgorose, frazione Corvaro. [FATTO, Nominatim] La chiesa della Madonna di Malito è a 42.219, 13.255. Centro zona 42.212, 13.256 [INTERPRETAZIONE]. **[NON VERIFICATO]** che la "Valle di Malito" coincida esattamente con l'intorno della chiesa.
- **Quote:** DEM 830–1250 m.
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2 km: cerreta 22%, roverella 13%, ostrieto 13%, castagneto 12%, faggeta 6%.
- **Fonti:**
  - [FATTO] 04/08/2014: il Comando Stazione Forestale di Borgorose fa *"una serie di controlli in località 'Valle di Malito'"*. *"Molti sono stati i raccoglitori perfettamente in regola"*. *"I funghi sequestrati appartengono alle specie 'boletus', 'cantharellus' e 'craterellus', che in questi giorni stanno crescendo nei boschi del territorio del Comune di Borgorose"*. È l'unica fonte locale che nomina specie, ma la notizia è del 2014.
    - https://www.rietinvetrina.it/in-cerca-di-funghi-senza-tesserino.-sanzioni-e-sequestri/
    - https://www.frontierarieti.com/funghi-forestale-multa-non-si-attiene-alle-regole/
  - [FATTO] La stazione Carabinieri di Borgorose controlla *"la raccolta dei prodotti del sottobosco (funghi e tartufi)"*.
    - https://www.frontierarieti.com/carabinieri-la-storia-della-stazione-di-borgorose/
- **Specie e mesi:** [FATTO] porcini, finferli/gallinacci e trombette dei morti ad agosto. [INTERPRETAZIONE] Ovolo nel castagneto e nella cerreta.
- **Popolarità:** [INTERPRETAZIONE] **media**: "molti raccoglitori" e controlli mirati.
- **Accesso:** [INTERPRETAZIONE] da Rieti per la SR 578 o per la Salaria e la A24, uscita Valle del Salto, poi Corvaro. Circa 1 ora–1 ora e 10.
- **Vincoli:** la Riserva Naturale Regionale Montagne della Duchessa è *"interamente compresa nel territorio del comune di Borgorose"*. [FATTO] Ha *"faggete e querceti misti, con prevalenza di cerro e roverella"*.
  - https://it.wikipedia.org/wiki/Riserva_regionale_Montagne_della_Duchessa
  - http://www.riservadelladuchessa.it/montagne/areenaturali/areenaturalilazio/areenaturalilazio.php?areanaturale=RiservaRegionaleMontagnedellaDuchessa
  - **[NON VERIFICATO]** Non ho trovato regole specifiche della riserva sui funghi: il sito e il Piano non le mostrano in chiaro. [INTERPRETAZIONE] Malito sembra fuori dal perimetro, che riguarda i rilievi a est di Corvaro e Cartore (Murolungo, Morrone), ma va controllato sulla cartografia del Piano (BURL n. 93 del 30/09/2021).

### 6. Monti Sabini centrali: Monte San Giovanni in Sabina (Cerchiara, Piediserre, San Giovanni Reatino) — confidenza MEDIA

- **Comune e coordinate:** Monte San Giovanni in Sabina e Rieti (San Giovanni Reatino). [FATTO, Photon] Cerchiara è a 42.360, 12.779. Centro 42.355, 12.780 [INTERPRETAZIONE].
- **Quote:** DEM 440–710 m.
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2 km: cerreta 38%, ostrieto 13%, roverella 4%.
- **Fonti:**
  - [FATTO] 10/11/2019: un cercatore di funghi ternano *"nel comprensorio montano di Monte San Giovanni in Sabina"*, *"con partenza dalla zona Piediserre-Cerchiara"*.
    - https://www.ilmessaggero.it/rieti/rieti_soccorso_vigili_del_fuoco-4853464.html
  - [FATTO] 03/11/2023: un 80enne *"si era smarrito mentre stava cercando funghi nei monti Sabini, tra San Giovanni Reatino e Monte San Giovanni"*.
    - https://laprovinciarieti.it/2023/11/03/80enne-si-perde-nei-boschi-sabini-soccorso-dal-cnsas-lazio-e-dai-vigili-del-fuoco-sta-bene/
- **Specie e mesi:** [INTERPRETAZIONE] cerreta collinare: *B. aestivalis* e *aereus*, ovolo, mazza di tamburo, chiodini e agarico violetto in autunno. [FATTO] Le uscite documentate sono di novembre.
- **Popolarità:** [INTERPRETAZIONE] **media-bassa**. Ci vanno anche da Terni.
- **Accesso:** da Rieti, strada per San Giovanni Reatino o SP Tancia.
- **Vincoli:** nessuno trovato.
- **Nota:** è il versante nord e nord-est della dorsale del Tancia, a circa 5 km dal centro della zona "Monte Tancia". Può essere un'estensione di quella zona più che una zona nuova.

### 7. Media Valle del Velino: Colle Rinaldo (Borgo Velino) — confidenza MEDIA (solo per la segnalazione dell'utente e il tipo di bosco)

- Dettagli nella sezione A. Coordinate 42.402, 13.059. Quote 450–1000 m. Castagneto da frutto [FATTO]. Funghi **[NON VERIFICATO]** da fonti scritte.
- **Popolarità:** [INTERPRETAZIONE] **tranquilla o media**: è un borgo quasi disabitato con castagneti privati da frutto. [FATTO] La raccolta è *"sempre vietata nelle aree private"*: attenzione ai castagneti recintati o coltivati.

### 8. Sabina centrale: Torricella in Sabina e Casaprota — confidenza BASSA

- **Coordinate:** Torricella 42.263, 12.870; Casaprota 42.251, 12.804. Centro 42.258, 12.840 [INTERPRETAZIONE].
- **Quote:** DEM 430–630 m.
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2,5 km attorno a Torricella: roverella 26%, cerreta 23%, ostrieto 6%, lecceta 4%.
- **Fonti:**
  - [FATTO] 15/09/2025: una coppia va *"nei boschi di Torricella in Sabina in cerca di funghi"* e trova *"un fungo Porcino del peso di 800gr"*.
    - https://www.rietinvetrina.it/ivan-e-stella-trovano-fungo-porcino-da-800gr/
  - [FATTO] Casaprota: la *Sagra delle Fettuccine ai funghi porcini* (agosto, 50ª edizione del Ferragosto Casaprotano nel 2025) usa *"funghi raccolti nei boschi dei Monti Sabini"*. Già nel 2011 si parlava del porcino *"'scovato' e raccolto proprio nel vasto territorio dei Monti Sabini"*. [INTERPRETAZIONE] È una dichiarazione promozionale: non prova che i funghi siano raccolti proprio a Casaprota (nel 2018 i Forestali hanno trovato porcini venduti come "locali" che venivano dalla Calabria).
    - https://www.formatrieti.it/2026/08/13/ferragosto-casaprotano-e-sagra-delle-fettuccine-ai-fughi-porcini-il-programma/
    - https://www.frontierarieti.com/i-sapori-del-bosco-in-tavola-a-casaprota/
    - https://www.rietinvetrina.it/i-carabinieri-forestali-sequestrano-30-chili-di-funghi/
  - [FATTO, debole] 04/10/2013: un cercatore cade in un dirupo nella *"frazione Scrocco del comune di Poggio San Lorenzo"*. Nominatim mette Scrocco a 42.273/12.830, nel comune di Montenero Sabino.
    - https://www.rietinvetrina.it/cade-in-un-dirupo-salvato-dai-vigili-del-fuoco/
- **Specie:** [FATTO] porcino a settembre. [INTERPRETAZIONE] Querceti caldi: *B. aereus* e *aestivalis*, ovolo, mazza di tamburo.
- **Popolarità:** [INTERPRETAZIONE] **tranquilla o media**.

### 9. Sabina nord-occidentale: Rocchette, Monte Mandrione (Torri in Sabina) e Vacone — confidenza BASSA

- **Coordinate:** [FATTO, Nominatim] Rocchette 42.375, 12.626; Vacone 42.385, 12.645. Centro 42.380, 12.640 [INTERPRETAZIONE]. Monte Mandrione non è geocodificato **[NON VERIFICATO]**.
- **Quote:** DEM 260–630 m (massimo 914).
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2,5 km: **lecceta 50%**, cerreta 5%, ostrieto 4%, pineta termofila 3%.
- **Fonte:** un solo episodio, riportato da due testate.
  - [FATTO] 18/09/2022: un 80enne *"aveva raggiunto, da solo a piedi, i boschi di monte Mandrione in cerca di funghi"*, *"nei boschi di Rocchette"*. Il Messaggero lo colloca *"nei boschi tra Rocchette e Vacone"*.
    - https://www.rietinvetrina.it/vigili-del-fuoco-soccorrono-80enne-smarritosi-nei-boschi-di-rocchette-di-torri-in-sabina/
    - https://www.ilmessaggero.it/rieti/rieti_disperso_funghi_sabina-6935649.html
- **Specie:** [INTERPRETAZIONE] lecceta e cerreta: *B. aereus*, ovolo, colombine. Fruttifica tardi, fino a novembre.
- **Popolarità:** [INTERPRETAZIONE] **tranquilla**: è un cercatore del posto. Non ho trovato altre fonti.

### 10. Monti Sabini settentrionali: Fonte Cerro – Piano Spara (Cottanello) — confidenza BASSA

- **Coordinate:** [FATTO, Nominatim] la pista "Fonte Cerro – Piano Spara" (Cottanello) è a 42.411, 12.722. Centro 42.410, 12.720.
- **Quote:** DEM 690–980 m.
- **Bosco:** [FATTO] Carta Forestale, cerchio di 2 km: ostrieto 75%, faggeta 9%, cerreta 6%.
- **Fonte:**
  - [FATTO] 23/09/2022: *"a Fonte Cerro colpo grosso per due cercatori di funghi. Tra il tanto pellegrinare è stato scovato un fungo di 1,5 chili"*. **[NON VERIFICATO]** La specie non è indicata (probabilmente un porcino) e non è certo che "Fonte Cerro" sia quella di Cottanello: è l'unica con questo nome trovata in OSM nella zona.
    - https://www.rietinvetrina.it/colpo-grosso-a-fonte-cerro-trovato-fungo-da-1-chilo-e-mezzo/
- **Popolarità:** [INTERPRETAZIONE] **tranquilla**.

### 11. Pedemontana dei Sabini vicino a Rieti: Macelletto (Fonte Colombo, via Selva Piana) — confidenza BASSA

- **Coordinate:** [FATTO, Nominatim] Macelletto 42.389, 12.833 (Rieti, Case San Benedetto); Via Selva Piana 42.388, 12.834.
- **Quote:** DEM 380–550 m (massimo 645).
- **Bosco:** [FATTO] Carta Forestale, cerchio di 1,5 km: bosco solo 39%, di cui ostrieto 28%, cerreta 3%, castagneto 2%.
- **Fonte:**
  - [FATTO] 20/10/2022: *"soccorso di un cercatore di funghi nei boschi in località 'Macelletto'… a partire da via Selva Piana"*.
    - https://www.rietinvetrina.it/pompieri-e-polizia-soccorrono-cercatore-di-funghi-disperso-nei-boschi-del-macelletto/
- **Popolarità:** [INTERPRETAZIONE] **tranquilla**. È a 15 minuti da Rieti ma è un bosco povero.

---

## Zone già nell'app: cosa aggiungono le fonti

- **Vallonina e Fontenova (Leonessa):**
  - [FATTO] *"faggete secolari (il noto bosco della Vallonina, un bene protetto dalla Comunità Europea)"*.
    - https://www.rietinvetrina.it/domenica-19-settembre-escursione-sul-terminillo-e-versante-leonessano/
  - [FATTO] Il Comune la definisce *"sito di importanza comunitaria (SIC)"*, con accesso libero dalla SP 10.
    - https://www.comune.leonessa.ri.it/it/vivere/area-naturale-della-vallonina
  - Non ho trovato cronache di cercatori proprio in Vallonina. Il "Monte i Porcini" vicino alla Sella di Leonessa è solo un toponimo.
- **Cicolano (Marcetelli, Ascrea, Collalto) e versante del Turano (Collegiove, Paganico):**
  - [FATTO] Ascrea: il porcino *"cresce abbondante e di ottima qualità"*. La sagra *"iniziò quasi per gioco… per la grande disponibilità di funghi porcini"* (5 agosto).
    - https://www.sabinamagazine.it/ad-ascrea-la-sagra-dei-funghi-porcini-il-5-agosto/
  - [FATTO] Collegiove: sagra il 19/07/2026, con il *"fungo porcino, prodotto tipico del nostro paesello!"*.
    - https://www.eventiesagre.it/Eventi_Sagre/21171616_Sagra+Dei+Funghi+Porcini+A+Collegiove.html
  - [FATTO] Ardito: *"castagneti intorno al paese"* (Collegiove, 989 m).
    - https://www.montagna.tv/228210/sul-navegna-la-montagna-tra-i-due-laghi/amp/
  - [FATTO] Paganico Sabino: sagne strasciate *"condite con i prelibati funghi porcini raccolti nei boschi della zona"* (fine luglio).
    - https://www.sabinamagazine.it/a-paganico-sabino-la-sagra-delle-sagne-strasciate/
  - [FATTO] Mostra micologica 2010 a Marcetelli, all'*"Ostello della Riserva Monti Navegna e Cervia"*.
    - https://www.rietinvetrina.it/mostra-micologica-a-marcetelli/
  - [FATTO] Carta Forestale, Collegiove (2 km): castagneto 37%, cerreta 16%, lecceta 10%, faggeta 7%.
  - [INTERPRETAZIONE] Le sagre di luglio e agosto indicano porcini estivi (*aestivalis* e *aereus*). Collegiove e Paganico rientrano già nel raggio della zona Cicolano (centro 42.195/13.03).
  - Vincolo: Riserva Monte Navegna e Monte Cervia. [FATTO] Comuni: *"Ascrea, Castel di Tora, Collalto Sabino, Collegiove, Marcetelli, Nespolo, Paganico Sabino, Rocca Sinibalda e Varco Sabino"* (Wikipedia). **[NON VERIFICATO]** Non ho trovato regole sui funghi della riserva.
  - [FATTO, debole] Nespolo, 12/10/2024: una donna di 75 anni *"stava cercando funghi con il nipote in un'area boschiva nel territorio del Comune di Nespolo"*.
    - https://laprovinciarieti.it/2024/10/12/nespolo-nonna-e-nipote-si-perdono-nel-bosco-mentre-cercano-funghi-soccorsi-dai-vigili-del-fuoco/
- **Antrodoco:** vedi la sezione C.
- **Monti della Laga (Amatrice):**
  - [FATTO] 23/09/2018: due cercatori *"in cerca di funghi nell'amatriciano"* si sono persi.
    - https://www.ilmessaggero.it/rieti/rieti_dispersi_soccorsi_vigili_del_fuoco-3992177.html
  - Vincolo: Parco Nazionale Gran Sasso e Monti della Laga. [FATTO] Nel 2020 una bozza di regolamento conteneva *"vincoli e divieti… tra cui il divieto della cerca dei tartufi e la raccolta di funghi"*: lo denunciava un'associazione di tartufai. **[NON VERIFICATO]** Non so quale testo sia in vigore oggi.
    - https://abruzzoweb.it/parco-gran-sasso-raccolta-funghi-e-tartufi-con-nuovo-regolamento-indietro-di-30-anni/
- **Monte Tancia:** vedi la zona 6, che è contigua.
- **Rascino:** nessuna fonte nuova trovata.

## Segnalazioni isolate (non le propongo come zone)

- [FATTO] **Cittaducale**, 29/09/2024: un cercatore di 84 anni è stato trovato morto *"in un'area boschivo-montana a Cittaducale"*. Località non precisata.
  - https://www.ilmessaggero.it/rieti/rieti_morto_cittaducale_anziano-8384116.html
- [FATTO] **Montenero Sabino**, 10/06/2012: un uomo uscito *"alla ricerca di funghi in agro di Montenero"*.
  - https://www.rietinvetrina.it/proseguono-le-ricerche-del-69enne-scomparso/
- [FATTO] **Orvinio**: Sagra delle fettuccine all'aglione o ai funghi porcini (agosto 2023, 5ª edizione). La scheda non dice che i funghi siano locali.
  - https://www.eventiesagre.it/Eventi_Sagre/21171957_Sagra+Delle+Fettuccine+All+aglione+O+Funghi+Porcini+A+Orvinio.html
  - Orvinio è nel Parco dei Monti Lucretili. [FATTO] *"Per andare a raccogliere funghi nella nostra regione (Lazio) bisogna essere in possesso del tesserino regionale"* (parks.it). **[NON VERIFICATO]** Il parco potrebbe avere regole proprie.
- [FATTO] **Castel di Tora**: il Comune scrive *"Molto estese sono le faggete… Il bosco offre anche i suoi frutti dai funghi, ai tartufi…"* e cita *"castagneti con la loro pregiata produzione di marroni"*. È un testo generico. [FATTO] Carta Forestale attorno al paese (2 km): ostrieto 30%, faggeta solo 1%; le faggete stanno più in alto, verso il Navegna.
  - https://www.comune.castelditora.ri.it/it/page/flora-e-fauna-8081f9c3-0df0-4d98-bce0-3e68f926b831

## Luoghi suggeriti nel brief ma NON confermati da fonti sui funghi

Non ho trovato nessuna fonte che li indichi come zone di raccolta. Li riporto solo con il tipo di bosco della Carta Forestale, come spunto **[INTERPRETAZIONE]**:

| Luogo | Carta Forestale (cerchio 2–2,5 km) | Quota al centro | Nota |
|---|---|---|---|
| Monte Fausola (Rivodutri), 42.544/12.879 | faggeta 50%, ostrieto 27% | ~1190 m | [FATTO] c'è il "Faggio di San Francesco" a Rivodutri; nessuna fonte sui funghi |
| Posta, 42.52/13.09 | faggeta 19%, conifere 14% | ~880 m | nessuna fonte |
| Borbona, 42.505/13.14 | castagneto 14%, faggeta 10%, conifere 8% | ~760 m | nessuna fonte |
| Accumoli, 42.694/13.248 | cerreta 38%, castagneto 30% | ~840 m | nessuna fonte, salvo la Laga già coperta |
| Monte Giano (Antrodoco), 42.43/13.10 | faggeta 27%, lecceta 27% | ~1565 m | [FATTO] *"antiche faggete"* (komoot); nessuna fonte sui funghi |
| Versante nord del Navegna, 42.235/13.025 | castagneto 34%, ostrieto 25%, faggeta 11% | ~860 m | [FATTO] Ardito: *"fitti boschi di querce, faggi e castagni"* verso il Salto |
| Petrella Salto, 42.295/13.068 | castagneto 31%, ostrieto 19%, faggeta 14% | ~780 m | nessuna fonte (c'è solo una sagra del tartufo) |
| Micigliano paese, 42.451/13.055 | ostrieto 25%, faggeta 23%, castagneto 16% | ~900 m | vedi il caso di Campo Fiorito nella zona 2 |
| Monte Pellecchia (Scandriglia, Lucretili), 42.104/12.867 | ostrieto 47%, faggeta 23% | ~1350 m | Parco Lucretili; nessuna fonte |
| Colle di Tora e "pinete del Turano" | cerreta 12%, roverella 9%; **pinete assenti** nella Carta Forestale | ~560 m | [INTERPRETAZIONE] l'idea delle pinete non regge |
| Pozzaglia Sabina | roverella 25%, rimboschimenti di conifere 8% | — | [FATTO] *"la magnifica pineta che avvolge il paese"* (Cammino Naturale dei Parchi); pinaroli e morette plausibili ma **[NON VERIFICATO]** |
| Leonessa: Monte Tilia, gola del Rio Fuggio | — | — | [FATTO] *"faggeta"* (escursionismo.it, CAI Ascoli); nessuna fonte sui funghi |
| Sella di Leonessa (1890 m) | sopra il limite del bosco | — | non è una zona da funghi |
| Lisciano, Fonte Nova, Pian de' Valli | — | — | rientrano nelle zone 1 e 2 e nella Vallonina |
| Labro, Morro, Contigliano, Greccio, Varco Sabino, Fiamignano | — | — | nessuna fonte trovata |

## Incertezze principali

1. **Quanto rende davvero un posto.** Le fonti dicono dove vanno i cercatori, non dove trovano. Per la qualità le uniche prove sono il sequestro di *Boletus* a Cittareale, quello di porcini, finferli e trombette a Malito, e i singoli porcini grandi di Torricella e del Cicolano.
2. **Coordinate di Fonte Corno, Fosso Builli e Vezzano (Cittareale), Colle Castagnola (Pescorocchiano), Campo Fiorito (Micigliano) e Monte Mandrione (Torri):** non sono su OSM. Per ora i centri delle zone sono approssimativi.
3. **Giorni di raccolta (martedì, venerdì, sabato, domenica):** li ho trovati solo in fonti del 2014 e del 2019. Vanno riverificati sul regolamento provinciale vigente.
4. **Regole delle riserve (Navegna-Cervia, Duchessa, Lucretili) e del Parco Gran Sasso-Laga:** non le ho trovate.
5. **RietiLife:** è il sito con più cronache, ma è bloccato da Cloudflare. Ho usato solo gli snippet di due articoli: porcino da 2,44 kg nel 2024 e porcino da 1,4 kg nel 2022 in un bosco *"segreto"*. Una sintesi di un motore di ricerca colloca quello del 2022 nell'*"alta Valle del Velino"*: **[NON VERIFICATO]**.

---

## Blocco JSON

```json
[
  {"name":"Terminillo sud-ovest – Pian de' Rosce / Monte Cardito / Campoforogna","municipality":"Rieti","lat":42.462,"lon":12.955,"elev":[1000,1600],"forest":["faggeta"],"species":["edulis","aestivalis","cibarius","repandum","mellea"],"popularity":0.9,"confidence":"alta","sources":["https://www.rietinvetrina.it/ritrovati-i-cinque-cercatori-di-funghi-dispersi-in-mattinata/","https://www.ilmessaggero.it/rieti/rieti_ricerche_soccorso_vigili-9776571.html","https://www.visitrieti.com/2019/09/20/pian-di-rosce-terminillo/","https://www.kraboo.it/magazine/ottobre-2026/i-funghi-porcini","https://www.frontierarieti.com/settimana-verde-studenti-e-forestale-liberano-una-poiana/"]},
  {"name":"Terminillo sud-est – Cinque Confini / Fonte Porcini / Monte Bove","municipality":"Borgo Velino / Micigliano / Rieti / Castel Sant'Angelo","lat":42.443,"lon":13.012,"elev":[1250,1650],"forest":["faggeta"],"species":["edulis","aestivalis","cibarius","repandum","mellea"],"popularity":0.6,"confidence":"alta","sources":["https://www.rietinvetrina.it/accusa-un-malore-alle-pendici-del-monte-bove-nel-comune-di-borgo-velino/","https://laprovinciarieti.it/2026/08/31/malore-nei-boschi-di-borgo-velino-fungaiolo-soccorso-a-1-350-metri-e-trasportato-al-gemelli/","https://www.formatrieti.it/2026/08/31/paura-sul-monte-bove-soccorsa-e-salvata-una-persona-colta-da-malore/","https://www.rietinvetrina.it/ritrovati-sul-terminillo-due-cercatori-di-funghi/","https://www.stefanoardito.it/2025/10/30/dai-cinque-confini-al-monte-bove-e-al-colle-delle-scangive-monti-reatini-lazio/"]},
  {"name":"Alto Velino – boschi di Cittareale (Fonte Corno, Fosso Builli, Vezzano)","municipality":"Cittareale","lat":42.618,"lon":13.16,"elev":[900,1500],"forest":["faggeta","cerreta"],"species":["edulis","aestivalis","cibarius","repandum","procera","mellea"],"popularity":0.7,"confidence":"alta","sources":["https://www.rietinvetrina.it/forestali-sequestrano-10-chili-di-funghi-raccolti-illecitamente-sanzionate-cinque-persone/","https://www.rietinvetrina.it/pompieri-soccorrono-cercatore-di-funghi-rimasto-ferito-a-cittareale/","https://www.rietinvetrina.it/muore-a-cittareale-mentre-cerca-funghi/","https://www.ilmessaggero.it/rieti/rieti_morto-7468320.html","https://siviaggia.it/idee-di-viaggio/raccolta-funghi-italia-luoghi/485337/"]},
  {"name":"Cicolano orientale – Pescorocchiano (Pace, Colle di Pace, Leofreni, Santa Lucia)","municipality":"Pescorocchiano","lat":42.21,"lon":13.112,"elev":[600,1000],"forest":["castagneto","cerreta"],"species":["aereus","aestivalis","edulis","caesarea","procera","virescens","mellea"],"popularity":0.55,"confidence":"media","sources":["https://www.rietinvetrina.it/anziano-in-cerca-di-funghi-cade-in-un-dirupo/","https://www.rietinvetrina.it/si-perde-cercando-funghi-salvato-dai-vigili-del-fuoco/","https://www.rietinvetrina.it/si-perdono-nel-bosco-mentre-cercano-funghi-recuperati-dai-vvf/","https://www.rietinvetrina.it/smarrito-in-zona-leofreni-cercatore-di-funghi-ricerche-in-corso/","https://laprovinciarieti.it/2025/09/06/pescorocchiano-ritrovato-l84enne-scomparso-tra-i-boschi-mercoledi-scorso/","https://www.rietinvetrina.it/nel-cicolano-trovato-fungo-da-2440-chili/"]},
  {"name":"Borgorose – Valle di Malito (Corvaro)","municipality":"Borgorose","lat":42.212,"lon":13.256,"elev":[850,1250],"forest":["cerreta","querceto a roverella","ostrieto","castagneto","faggeta"],"species":["edulis","aestivalis","cibarius","cornucopioides","caesarea"],"popularity":0.6,"confidence":"media","sources":["https://www.rietinvetrina.it/in-cerca-di-funghi-senza-tesserino.-sanzioni-e-sequestri/","https://www.frontierarieti.com/funghi-forestale-multa-non-si-attiene-alle-regole/","https://www.frontierarieti.com/carabinieri-la-storia-della-stazione-di-borgorose/","https://it.wikipedia.org/wiki/Riserva_regionale_Montagne_della_Duchessa"]},
  {"name":"Monti Sabini centrali – Monte San Giovanni in Sabina (Cerchiara, Piediserre, San Giovanni Reatino)","municipality":"Monte San Giovanni in Sabina / Rieti","lat":42.355,"lon":12.78,"elev":[440,770],"forest":["cerreta","ostrieto"],"species":["aestivalis","aereus","caesarea","procera","mellea","nuda"],"popularity":0.45,"confidence":"media","sources":["https://www.ilmessaggero.it/rieti/rieti_soccorso_vigili_del_fuoco-4853464.html","https://laprovinciarieti.it/2023/11/03/80enne-si-perde-nei-boschi-sabini-soccorso-dal-cnsas-lazio-e-dai-vigili-del-fuoco-sta-bene/"]},
  {"name":"Media Valle del Velino – Colle Rinaldo (castagneti)","municipality":"Borgo Velino","lat":42.402,"lon":13.059,"elev":[450,1000],"forest":["castagneto","querceto a roverella","cerreta","ostrieto"],"species":["aereus","aestivalis","edulis","caesarea","mellea","virescens","procera"],"popularity":0.35,"confidence":"media","sources":["https://velino.it/la-nostra-terra/i-comuni/borgo-velino","https://www.ilmessaggero.it/rieti/rieti_incendio_bosco_carabinieri_denunce-9621585.html","https://www.coopvelinia.it/"]},
  {"name":"Sabina centrale – Torricella in Sabina / Casaprota","municipality":"Torricella in Sabina / Casaprota","lat":42.258,"lon":12.84,"elev":[400,670],"forest":["querceto a roverella","cerreta"],"species":["aestivalis","aereus","caesarea","procera"],"popularity":0.35,"confidence":"bassa","sources":["https://www.rietinvetrina.it/ivan-e-stella-trovano-fungo-porcino-da-800gr/","https://www.formatrieti.it/2026/08/13/ferragosto-casaprotano-e-sagra-delle-fettuccine-ai-fughi-porcini-il-programma/","https://www.frontierarieti.com/i-sapori-del-bosco-in-tavola-a-casaprota/"]},
  {"name":"Sabina nord-occidentale – Rocchette / Monte Mandrione / Vacone","municipality":"Torri in Sabina / Vacone","lat":42.38,"lon":12.64,"elev":[260,900],"forest":["lecceta","cerreta"],"species":["aereus","caesarea","virescens"],"popularity":0.25,"confidence":"bassa","sources":["https://www.rietinvetrina.it/vigili-del-fuoco-soccorrono-80enne-smarritosi-nei-boschi-di-rocchette-di-torri-in-sabina/","https://www.ilmessaggero.it/rieti/rieti_disperso_funghi_sabina-6935649.html"]},
  {"name":"Monti Sabini settentrionali – Fonte Cerro / Piano Spara","municipality":"Cottanello","lat":42.41,"lon":12.72,"elev":[650,1040],"forest":["ostrieto","faggeta","cerreta"],"species":["aestivalis","edulis","procera"],"popularity":0.25,"confidence":"bassa","sources":["https://www.rietinvetrina.it/colpo-grosso-a-fonte-cerro-trovato-fungo-da-1-chilo-e-mezzo/"]},
  {"name":"Pedemontana sabina – Macelletto / Fonte Colombo","municipality":"Rieti","lat":42.389,"lon":12.833,"elev":[380,650],"forest":["ostrieto"],"species":["aestivalis","procera","mellea"],"popularity":0.25,"confidence":"bassa","sources":["https://www.rietinvetrina.it/pompieri-e-polizia-soccorrono-cercatore-di-funghi-disperso-nei-boschi-del-macelletto/"]}
]
```

Nota sul JSON: `species` è quasi tutto **[INTERPRETAZIONE]** dal tipo di bosco. Le specie davvero citate dalle fonti sono solo queste:
- "Boletus" a Cittareale (2019);
- "boletus, cantharellus, craterellus" a Malito (2014);
- "porcino" a Torricella (2025), nel Cicolano (2024) e ad Ascrea, Collegiove e Paganico (sagre).
