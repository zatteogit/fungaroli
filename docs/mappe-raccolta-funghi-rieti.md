# **Cartografia Forestale, Ecologia Stazionale e Disciplina della Raccolta Micologica nel Comprensorio di Rieti**

> **Nota del 16 ottobre 2026.** Documento di ricerca preparato con uno strumento automatico, in gran parte su fonti secondarie (vedi la bibliografia). I numeri tra parentesi quadre rimandano alla bibliografia. La sezione sulle regole è stata riscritta sul testo vigente delle norme; per le regole fanno fede [legale.md](legale.md) e `data/legal.json`. Le altre parti (habitat, specie, stagioni, accessi) non sono state riverificate e vanno lette come indicazioni da fonti secondarie.

## **Cartografia delle Risorse Fungine, Database Forestali e Modelli Previsionali**

Nel contesto della raccolta dei funghi epigei spontanei, la disponibilità di mappe pubbliche o geodatabase non segue la logica del censimento catastale della singola fungaia [1]. L'accesso ai punti precisi di fruttificazione rimane tradizionalmente legato all'esperienza sul campo e alla consuetudine locale; tuttavia, la moderna pianificazione micologica si avvale dell'incrocio analitico tra cartografia forestale ufficiale, sistemi informativi geografici territoriali e piattaforme predittive microclimatiche [1].

L'individuazione delle stazioni micorriziche ottimali richiede la decodifica della composizione vegetazionale e delle fasce altimetriche di riferimento [5]. La Regione Lazio rende disponibile sul proprio Geoportale la *Carta Forestale su base tipologica*, un layer cartografico derivato dall'approfondimento al quarto e quinto livello Corine Land Cover delle formazioni naturali e seminaturali [4]. Attraverso i servizi WebGIS regionali e il sistema informativo SITAP, è possibile isolare con risoluzione sub-ettarica le unità fisionomico-strutturali a cui i funghi eduli sono strettamente associati: faggete d'alto fusto (*Fagus sylvatica*), castagneti cedui e da frutto (*Castanea sativa*), formazioni quercine a cerro (*Quercus cerris*) e roverella (*Quercus pubescens*), nonché rimboschimenti montani a conifere (*Pinus nigra*) [4].

Parallelamente ai database istituzionali, il settore micologico fa largo uso di strumenti applicativi mobili e portali previsionali basati su correlazioni termo-pluviometriche [1]. Piattaforme quali FcP Map integrano rilievi meteorologici orari per elaborare indici di probabilità di crescita fungina (*Pinus/Boletus Score*) combinati con cartografia escursionistica e mappe topografiche dell'Istituto Geografico Militare (IGM), consentendo il tracciamento GPS in assenza di copertura di rete radiomobile [1]. Servizi quali Geoticket offrono un monitoraggio temporale delle nascite basato sulle serie storiche delle precipitazioni cumulate e sulle variazioni termiche, mentre applicativi come FunghiTrack e MyBoletus permettono l'archiviazione di waypoint georeferenziati e il controllo altimetrico continuo [2].

| Strumento / Geodatabase | Tipologia di Cartografia | Funzionalità Analitiche per la Ricerca Micologica | Regime di Accesso |
| :---- | :---- | :---- | :---- |
| **Carta Forestale Regione Lazio** | Vettoriale tematica (Shapefile / WebGIS SITAP) [4] | Perimetrazione di precisione delle essenze arboree simbionti (faggete, castagneti, cerrete) [4] | Open Data istituzionale [4] |
| **FcP Map** | Raster topografico IGM e layer satellitare [1] | Calcolo della probabilità di buttata (*Pin Score*), tracciamento GPS offline, memorizzazione waypoint [1] | Gratuito con estensione Pro [1] |
| **Geoticket** | Cartografia catastale e tematica forestale [2] | Mappe delle crescite giornaliere, delimitazione dei confini comunali e delle riserve naturali [2] | Gratuito con moduli Geoticket+ [2] |
| **FunghiTrack** | Topografica 3D e curve di livello [9] | Registrazione di coordinate geografiche, quota barometrica e archivio fotografico di stazione [9] | Gratuito con abbonamento Pro [9] |
| **MyBoletus / Funghimagazine** | Modelli climatici e tabelle di crescita [3] | "Semaforo dei funghi" regionale, verifica di shock termici e cumulate di pioggia a 14 giorni [3] | Consultazione web gratuita [3] |
| **OpenStreetMap / OsmAnd** | Vettoriale escursionistica open-source [13] | Dettaglio della toponomastica minore, carrarecce forestali, impluvi, canaloni e sorgenti [13] | Gratuito / Open source [13] |

L'uso combinato di queste risorse permette di superare la ricerca casuale: incrociando i millimetri di precipitazione registrati da una stazione meteorologica locale con la cartografia forestale tipologica, il raccoglitore può circoscrivere l'indagine a specifiche fasce di quota ed esposizioni orografiche in cui si sviluppano le condizioni di imbibizione del suolo e di shock termico [3].

## **Ripartizione Territoriale delle Stazioni Micologiche nel Reatino**

Il comprensorio provinciale di Rieti è caratterizzato da una peculiare eterogeneità geomorfologica: la netta separazione tra i massicci montuosi calcarei (Terminillo e Monti Sabini) e le formazioni marnoso-arenacee impermeabili tipiche dei Monti della Laga determina risposte idrologiche e micorriziche profondamente differenziate [5]. La ricerca si struttura su distinti piani bioclimatici e associazioni forestali.

| Piano Altitudinale | Quota Indicativa | Vegetazione Prevalente | Miceti Guida e Caratterizzanti | Comprensori Reatini di Riferimento |
| :---- | :---- | :---- | :---- | :---- |
| **Collinare / Basale** | 400 – 750 m [5] | Querceti xerofili (cerro, roverella), orno-ostrieti, leccio [5] | *Boletus aereus*, *Amanita caesarea*, *Craterellus cornucopioides* [5, 8] | Monti Sabini, versanti bassi della Valle del Turano [5] |
| **Submontano** | 600 – 1.000 m [5] | Castagneti cedui e da frutto, formazioni miste a cerro [5] | *Boletus aestivalis*, *Boletus edulis*, *Cantharellus cibarius* [5, 21, 22] | Antrodoco, Poggio Bustone, Cantalice, Cicolano [19] |
| **Montano Inferiore** | 1.000 – 1.300 m [5] | Faggete di transizione, rimboschimenti di pino nero [5] | *Boletus edulis*, *Suillus* spp., *Tricholoma terreum*, *Lepista nuda* [5, 8, 22] | Altopiano di Rascino, bassa Vallonina, Laga amatriciana [5] |
| **Montano Superiore** | 1.300 – 1.750 m [5] | Faggete pure d'alto fusto [5] | *Boletus edulis*, *Boletus pinophilus*, *Russula cyanoxantha* [5, 27] | Vallonina alta, pendici del Terminillo, Monti della Laga [5] |

### **Comprensorio del Terminillo e della Vallonina**

Il settore settentrionale del Monte Terminillo, esteso lungo l'impluvio glaciale ed erotivo della Vallonina in direzione del comune di Leonessa, rappresenta uno dei biotopi a dominanza di faggio più vocati di tutto l'Appennino centrale [25]. I boschi d'alto fusto si sviluppano in continuità tra i 1.100 e i 1.750 metri di altitudine, beneficiando di un microclima umido e fresco, alimentato da frequenti nebbie di condensazione e da precipitazioni orografiche anche nei mesi estivi [5].

In questo habitat la fruttificazione fungina esordisce tipicamente a partire da luglio nelle quote intermedie, per poi culminare tra la fine di agosto e la prima metà di ottobre [5]. La specie simbolo è il porcino di faggeta (*Boletus edulis*), accompagnato frequentemente dal porcino rosso (*Boletus pinophilus*), da colonie diffuse di finferli (*Cantharellus cibarius*) e da un ampio spettro di *Russula* commestibili (*Russula virescens*, *Russula cyanoxantha*) [5].

L'accesso principale avviene percorrendo da Rieti la SS 4 bis del Terminillo superando Pian de' Valli, per poi imboccare la Strada Provinciale della Vallonina (SP 10\) in direzione della Sella di Leonessa [28]. Le aree di parcheggio sono disposte lungo gli slarghi sterrati della SP 10, in corrispondenza del bivio per il Rifugio Angelo Sebastiani a quota 1.820–1.845 metri e nel fondovalle in prossimità del Rifugio Maiolica [28]. Da queste piazzole si dirama una fitta rete sentieristica: il sentiero CAI 404, che conduce verso la Selletta di Pratorecchia e lo Iaccio Crudele, e il sentiero CAI 439 verso la sella del Buco del Merlo e il Monte Porcini (1.982 m), toponimo montano storicamente legato alla prolifica presenza di boleti nei canaloni boscati sottostanti la cresta [28].

### **Cintura Pedemontana e Alta Valle del Velino: Poggio Bustone, Cantalice e Antrodoco**

La fascia pedemontana che si sviluppa ai piedi dei contrafforti occidentali del Terminillo e si prolunga verso la media e alta Valle del Velino ospita un ecosistema termofilo caratterizzato da una secolare antropizzazione agricola e forestale [15]. L'elemento cardine del paesaggio vegetale è il castagneto, gestito sia a ceduo sia come castagneto da frutto secolare, che ha valso all'area di Antrodoco la denominazione del rinomato Marrone Antrodocano [19].

A quote comprese tra 500 e 950 metri, il castagno si mescola gradualmente con il cerro (*Quercus cerris*) e il carpino nero (*Ostrya carpinifolia*), creando l'ambiente di elezione per i porcini estivi (*Boletus aestivalis*, sin. *reticulatus*) e per il porcino nero (*Boletus aereus*) [5]. Le prime buttate prendono avvio precocemente, tra fine maggio e giugno, per poi arrestarsi con l'aridità estiva e riprendere vigorosamente in settembre [5].

Nelle radure e lungo i margini boschivi caldi e soleggiati è comune la presenza dell'ovolo buono (*Amanita caesarea*), della mazza di tamburo (*Macrolepiota procera*) e dei galletti [5]. Con il sopraggiungere dei primi freddi autunnali, le ceppaie di latifoglia producono ampie colonie di chiodini (*Armillaria mellea*) [5].

Sotto il profilo logistico, la direttrice principale è costituita dalla SS 4 Salaria per Antrodoco, Borgo Velino e Micigliano, oppure dalla SP 2 che risale da Rieti verso Cantalice e Poggio Bustone [19]. I veicoli possono essere lasciati nei pressi dei santuari francescani, lungo la viabilità per il Colle di Micigliano o sugli accessi alle piste tagliafuoco comunali, da cui si diramano sentieri rurali e mulattiere che collegano i fondivalle alle pendici superiori [15].

### **Bacino del Cicolano, Valli del Salto e del Turano e Altopiano di Rascino**

Il settore sud-orientale della provincia di Rieti comprende il comprensorio montano e submontano del Cicolano e i bacini artificiali del Salto e del Turano, un territorio noto per le sagre micologiche e per la consistenza delle produzioni autunnali [23]. A quote collinari (600–900 m), attorno ai borghi di Marcetelli, Ascrea, Collalto Sabino e Paganico Sabino, predominano cerrete e querceti misti intercalati da castagneti [17]. Qui si sviluppano abbondanti nascite di *Boletus edulis*, *Boletus aereus*, *Cantharellus cibarius* e dell'apprezzato *Hydnum repandum* (spennelletto o gallinaccio spinoso) [5].

Salendo verso l'Altopiano carsico di Rascino (quota 1.150–1.250 m), nel territorio di Fiamignano e Petrella Salto, l'ambiente assume tratti peculiari dovuti alla compresenza di residui di faggeta e imponenti rimboschimenti montani a pino nero (*Pinus nigra*) [8]. Il terreno acido e la lettiera di aghi favoriscono la crescita micorrizica esclusiva di funghi del genere *Suillus* (*Suillus luteus*, *Suillus granulatus*, *Suillus collinitus*), di *Tricholoma terreum* (morette), di *Lepista nuda* (ordinale violetto) e di *Chroogomphus rutilus* [8].

La viabilità primaria è servita dalla SR 578 Salto-Cicolano con uscite dedicate per la diga del Salto, Marcetelli e Pescorocchiano [23]. L'altopiano di Rascino si raggiunge risalendo da Fiamignano per una strada comunale panoramica, con possibilità di sosta presso i pianori sterrati adiacenti al lago stagionale [8].

### **Dorsale dei Monti Sabini e Valico del Tancia**

La catena dei Monti Sabini, che separa la conca reatina dalla Valle del Tevere, è una dorsale preappenninica calcarea dominata da condizioni microclimatiche submediterranee [16]. Il sottobosco è composto principalmente da querce caducifoglie (*Quercus cerris*, *Quercus pubescens*), carpino e leccio (*Quercus ilex*), con la presenza di modesti nuclei di faggete relitte esclusivamente al di sopra dei 1.100 metri, attorno alla cima del Monte Tancia (1.282 m) [5].

Questi boschi rispondono con straordinaria rapidità alle piogge di fine estate e inizio autunno (settembre-ottobre), purché seguite da giornate miti e non ventose [5]. Le specie di maggior pregio comprendono il porcino nero (*Boletus aereus*), l'ovolo buono (*Amanita caesarea*) e le trombette dei morti (*Craterellus cornucopioides*), abbondanti negli impluvi muschiosi e nei canaloni ombrosi del versante settentrionale [5].

Il punto nevralgico per l'accesso e la sosta è il Passo del Tancia (circa 800 m s.l.m.), raggiungibile da Rieti attraverso la SP 46 [43]. Dal valico, nei pressi dello storico edificio dell'Osteria del Tancia, si dipartono sentieri escursionistici verso il Monte Tancia, il Monte Ode e le forre carsiche delle Pozze del Diavolo, percorsi che consentono di perlustrare estese particelle boschive [42]. Che siano pubbliche o gravate da uso civico non è verificato.

### **Settore Montano della Laga Reatina: Comprensorio di Amatrice e Accumoli**

L'estremità nord-orientale della provincia di Rieti converge nel settore laziale dei Monti della Laga, un complesso montuoso che si differenzia dal resto dell'Appennino centrale per la litologia: l'arenaria e le marne creano suoli a reazione spiccatamente acida, caratterizzati da elevatissima ritenzione idrica e corsi d'acqua perenni [5].

In questa fascia, tra 1.000 e 1.700 metri, si sviluppano faggete ad alto fusto tra le più continue della regione [5]. La combinazione di acidità pedologica e costante umidità atmosferica rende la Laga amatriciana un biotopo ideale per *Boletus edulis* e *Boletus pinophilus*, capaci di fruttificazioni imponenti già a partire da metà estate [5]. Nei tratti di fondovalle solcati dai fossi sorgentizi abbondano specie acidofile del genere *Lactarius*, *Cantharellus cibarius* e *Cantharellus lutescens* (finferla) [5]. L'accesso avviene tramite la SS 4 Salaria fino ad Amatrice, proseguendo poi lungo la viabilità montana verso le frazioni a monte e gli accessi alle valli torrentizie [5].

| Bacino Territoriale | Quota Prevalente | Associazione Forestale Dominante | Specie Micologiche Target | Vie di Accesso e Aree di Sosta |
| :---- | :---- | :---- | :---- | :---- |
| **Vallonina / Terminillo** | 1.100 – 1.750 m [5] | Faggeta pura d'alto fusto [5] | *B. edulis*, *B. pinophilus*, *C. cibarius*, *Russula* spp. [5] | SP 10 della Vallonina; Rifugio Sebastiani; Rifugio Maiolica [28] |
| **Cintura di Poggio Bustone e Cantalice** | 500 – 950 m [5] | Castagneto da frutto e ceduo, cerreta [19] | *B. aestivalis*, *B. aereus*, *A. caesarea*, *M. procera* [5, 21, 34] | SP 2; Santuario di Poggio Bustone; strade comunali alte [19] |
| **Antrodoco / Media Valle del Velino** | 500 – 1.000 m [5] | Castagneti secolari e misto a carpino nero [19] | *B. aestivalis*, *B. aereus*, *A. caesarea*, *A. mellea* [5, 20, 21, 22] | SS 4 Salaria; diramazione per Micigliano e colle [15] |
| **Cicolano (Marcetelli, Ascrea, Collalto)** | 600 – 900 m [5] | Cerrete pure e bosco misto collinare [5] | *B. edulis*, *B. aereus*, *C. cibarius*, *H. repandum* [5, 8, 23] | SR 578 Salto-Cicolano; accessi comunali Marcetelli [23] |
| **Altopiano di Rascino** | 1.150 – 1.300 m [8] | Conifere artificiali (*P. nigra*) e faggete [8] | *Suillus* spp., *T. terreum*, *Lepista nuda*, *C. rutilus* [8, 22] | Strada comunale Fiamignano-Rascino; piana lago [8] |
| **Passo del Tancia (Monti Sabini)** | 500 – 900 m [5] | Querceto termofilo, lecceta, carpino [5] | *B. aereus*, *A. caesarea*, *C. cornucopioides* [5, 8] | SP 46 del Tancia; valico Osteria del Tancia [43] |
| **Monti della Laga (Amatrice)** | 1.000 – 1.700 m [5] | Faggete montane su suolo acido-arenaceo [5] | *B. edulis*, *B. pinophilus*, *Cantharellus* spp. [5] | SS 4 Salaria; rete viaria frazioni montane di Amatrice [5] |

## **Disciplina Amministrativa e Regime Giuridico della Raccolta nel Lazio**

> Sezione riscritta il 16 ottobre 2026 sul testo vigente della L.R. 32/1998 ([testo coordinato del Consiglio regionale](https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=8275&sv=vigente), letto il 16/10/2026), della [legge 352/1993](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1993-08-23;352) e delle leggi delle aree protette. Le versioni precedenti si basavano su fonti secondarie e contenevano errori. Fa fede il testo pubblicato sul Bollettino ufficiale; la sintesi completa, con tutte le fonti, è in [legale.md](legale.md).

La raccolta dei funghi epigei spontanei nel Lazio è regolata dalla **Legge Regionale 5 agosto 1998, n. 32** (*"Disciplina della raccolta e della commercializzazione dei funghi epigei spontanei e di altri prodotti del sottobosco"*), nel quadro della legge 23 agosto 1993, n. 352.

L'art. 9 della **Legge Regionale 27 febbraio 2020, n. 1** ha riscritto l'art. 4: al posto del tesserino serve l'**attestato** di un corso di formazione micologica di almeno 14 ore. I corsi sono svolti da ASL, enti locali, associazioni micologiche di rilevanza nazionale o regionale ed enti pubblici o privati, sullo schema di programma approvato dalla Regione. Il corso non serve ai laureati in scienze naturali, agrarie e forestali, in biologia e ai micologi. Chi ha il vecchio tesserino rilasciato dalla Regione può esibirlo al posto dell'attestato (art. 4, c. 4).

Durante la raccolta bisogna avere con sé (art. 4, c. 1):

> * l'attestato del corso, o il vecchio tesserino regionale;
> * la ricevuta del contributo annuale: 25 € per i residenti nel Lazio, 40 € per i non residenti, valida un anno dalla data del versamento. Modi di pagamento e causale sono sulla [pagina *Funghi* della Regione Lazio](https://www.regione.lazio.it/cittadini/agricoltura/Funghi);
> * un documento di riconoscimento valido.

Sono esenti dal contributo i residenti nel Lazio che hanno compiuto 65 anni: attestato e documento restano obbligatori. I minori di 14 anni raccolgono solo se accompagnati da chi ha i titoli (art. 4, c. 2). I residenti senza attestato possono chiedere fino a cinque autorizzazioni straordinarie giornaliere l'anno, valide solo se accompagnati (c. 3). La vigilanza spetta, tra gli altri, ai Carabinieri forestali (già Corpo forestale dello Stato), alle guardie venatorie, alla polizia locale, al personale delle ASL e alle guardie giurate; nelle aree protette si svolge con il coordinamento degli enti di gestione (art. 15).

L'art. 21 della **Legge Regionale 10 dicembre 2024, n. 20** ha abrogato il comma 5 dell'art. 4. Quel comma affidava alla Regione la scelta dei quattro giorni settimanali di raccolta: le ultime determinazioni (2019 e 2024) indicavano martedì, venerdì, sabato e domenica. Dal 13 dicembre 2024 **si raccoglie tutti i giorni**. La Giunta regionale può però fissare i giorni per motivi di salvaguardia dell'ecosistema (art. 11, c. 2 bis) e disporre divieti per periodi o zone (art. 11, cc. 1-2): al 16 ottobre 2026 non risultano atti di questo tipo.

| Regola | Cosa dice la legge | Articolo |
| :---- | :---- | :---- |
| **Quantità** | 3 kg di funghi commestibili a persona al giorno, salvo un unico esemplare o un solo cespo di funghi concresciuti | L.R. 32/1998, art. 3, c. 1; L. 352/1993, art. 4 |
| **Funghi non commestibili** | Si raccolgono solo per studio o didattica, con l'autorizzazione speciale permanente riservata ai micologi, fino a cinque esemplari per specie al giorno | art. 3, c. 5; art. 8 bis |
| **Altri prodotti del sottobosco** | A persona e al giorno: asparagi selvatici, fragole, lamponi e mirtilli 1 kg ciascuno; bacche di ginepro e bacche di mirto 0,2 kg ciascuno; corbezzoli 2 kg | art. 3, c. 6 |
| **Giorni** | Tutti i giorni, salvo diverse decisioni della Giunta regionale | art. 11, c. 2 bis; L.R. 20/2024, art. 21 |
| **Orari** | Vietato da un'ora dopo il tramonto a un'ora prima della levata del sole | art. 9, c. 1 |
| **Pulizia e trasporto** | Funghi puliti sommariamente sul posto e trasportati in contenitori rigidi e aerati, che lascino disperdere le spore. Vietati in ogni caso i contenitori di plastica, anche rigidi o forati | art. 9, c. 4; L. 352/1993, art. 5, c. 4 |
| **Integrità** | I funghi raccolti devono conservare tutte le caratteristiche che servono a riconoscere la specie con sicurezza | art. 9, c. 4 |
| **Attrezzi** | Vietati rastrelli, uncini e altri mezzi che danneggiano lo strato umifero del terreno, il micelio o le radici | art. 9, c. 2 |
| **Rispetto dei funghi** | Vietato calpestare, danneggiare e distruggere i funghi, anche quelli non commestibili | art. 9, c. 3 |
| **Ovolo buono chiuso** | Vietato raccogliere l'ovolo buono (*Amanita caesarea*) allo stato di ovolo chiuso, cioè con il velo universale non ancora lacerato. È una regola distinta dalla taglia minima | art. 3, c. 4 |
| **Cappello di almeno 4 cm** | Ovolo buono (*Amanita caesarea*), porcino (*Boletus edulis* e relativo gruppo), agarico geotropo (*Clitocybe geotropa*), prataiolo (*Agaricus campestris*), verdone (*Russula virescens*) | art. 3, c. 2 |
| **Cappello di almeno 5 cm** | Mazza di tamburo (*Macrolepiota procera* e simili) | art. 3, c. 2 |
| **Cappello di almeno 3 cm** | Tutte le altre specie, salvo quelle della riga seguente | art. 3, c. 2 |
| **Nessuna taglia minima** | Pioppino (*Cyclocybe cylindracea*), chiodino (*Armillaria mellea*), tutte le specie di *Cantharellus* (finferli, gallinacci), trombetta dei morti (*Craterellus cornucopioides*), steccherini (*Hydnum repandum*, *H. rufescens*), gambesecca (*Marasmius oreades*), *Armillaria tabescens* | art. 3, c. 2 bis (dal 2017) |
| **Cespo unico** | Un solo cespo di funghi concresciuti può superare i limiti di taglia | art. 3, c. 3 |

Secondo la legge le taglie minime servono a «impedire la raccolta di esemplari fungini immaturi o troppo piccoli» (art. 3, c. 2); il divieto dell'ovolo chiuso ha «ragioni di ordine ecologico e sanitario» (c. 4). Le altre motivazioni ecologiche e sanitarie che comparivano qui non sono nella legge e sono state tolte.

La raccolta è vietata (art. 10):

> * nelle riserve naturali integrali regionali;
> * nei parchi e nelle riserve regionali, nelle aree indicate dagli enti di gestione;
> * nei parchi nazionali e nelle riserve statali, salvo diverse disposizioni degli enti di gestione: qui il divieto è la regola;
> * nelle aree vietate dalla Giunta regionale;
> * nei giardini e nei parchi privati, e nei terreni di pertinenza delle abitazioni per un raggio di almeno 100 metri, salvo che ai proprietari;
> * nel verde pubblico urbano, in una fascia di 10 metri dal margine delle strade pubbliche, nelle aree recuperate da ex discariche e nelle zone industriali.

Le sanzioni vanno da 50 a 600 € secondo la violazione, più la confisca del raccolto (art. 16).

Aree protette del Reatino che toccano le zone dell'app (stato al 16 ottobre 2026: prima di uscire chiedi sempre all'ente gestore):

> * **Parco Nazionale del Gran Sasso e Monti della Laga** (Amatrice): per la legge regionale la raccolta è vietata, salvo diverse disposizioni dell'Ente Parco (art. 10, c. 1, lett. d). Il Piano del Parco esclude il prelievo di risorse naturali nelle zone «a» (riserva integrale) e «b» (riserva generale orientata), salvi gli usi civici ([Normativa di attuazione](https://www.gransassolagapark.it/pdf/Piano-Parco/Normativa-Attuazione.pdf), artt. 7 e 8, c. 7). Il regolamento del Parco è ancora una bozza (2019). Non risultano atti in vigore che riservino la raccolta ai residenti o fissino limiti diversi dai 3 kg.
> * **Riserva Naturale Regionale Monte Navegna e Monte Cervia** (Salto-Turano): la legge istitutiva consente «esclusivamente la raccolta dei funghi secondo le normative vigenti» finché la riserva non ha un regolamento ([L.R. 56/1988](https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=8895&sv=vigente), art. 11, c. 1, lett. i). Non risultano un piano approvato né un divieto specifico per i funghi; le zone A e B della legge istitutiva hanno solo norme edilizie.
> * **Riserva Naturale Regionale Montagne della Duchessa** (Borgorose): il Piano (DCR 16/2021) non risulta contenere regole sui funghi e il regolamento non è approvato. Valgono le norme di salvaguardia della legge istitutiva ([L.R. 70/1990](https://www.consiglio.regione.lazio.it/consiglio-regionale/?vw=leggiregionalidettaglio&id=7047&sv=vigente), art. 12, lett. m): la raccolta di specie vegetali spontanee è vietata, salvo autorizzazione dell'ente gestore (Comune di Borgorose).

Zone di riserva dei parchi del pilota Lazio (decisione di Matteo del 21 ottobre 2026, dopo la lettura dei testi primari; dettagli, fonti e domande agli enti in [legale.md, §2.5](legale.md)). Le zone vengono dalle zonazioni del Geoportale della Regione, indicative: fa fede la cartografia dell'ente.

> * **Escluse come la Laga** (l'app non propone lì punti per la raccolta; restano nell'indice biologico): **Parco Nazionale d'Abruzzo, Lazio e Molise**, versante laziale, zone A e B ([Norme del Piano](https://static.parcoabruzzo.it/pdf/NORME-TECNICHE-ATTUAZIONE-PIANOPARCO.pdf), art. 8, c. 2, lett. b e d; art. 9, c. 2, lett. f e h; certezza alta per A, medio-alta per B); **Monti Simbruini**, zone R1, R2 e R4 ([Piano di assetto](https://www.parcomontisimbruini.it/pdf/Piano.Assetto.pdf), artt. 27–32, interpretazione a contrario; certezza medio-alta per R1 e R2, media per R4); **Monti Lucretili**, zone A e A1 ([Norme del Piano](https://parcolucretili.it/wp-content/uploads/2025/05/NORME-TECNICHE-ATTUAZIONE-BURL-2022.pdf), art. 46, c. 5 e art. 47, c. 4: divieto di raccolta della «flora»; certezza media).
> * **Solo avviso** («Zona di riserva del Parco: verifica il regolamento dell'ente prima di raccogliere»): **Monti Lucretili**, zone B e B1 (L.R. 41/1989, art. 11, lett. h: raccolta di specie vegetali spontanee vietata salvo regolamento, non trovato); **Veio**, zone B1 e B2 (Norme del Piano, art. 22, c. 12: attività «unicamente» secondo un Regolamento non approvato; raccolta esplicita solo in zona C, art. 25, c. 5, lett. c).
> * **Dubbio comune:** se i funghi siano «flora» o «specie vegetali». La L.R. 29/1997, art. 8, c. 3, lett. a fa salvi «la raccolta di funghi, tartufi ed altri prodotti del bosco»: indizio che il legislatore li distingua. Interpretazione non verificata in giurisprudenza. Salvi sempre usi civici e diritti reali, che l'app non conosce.

## **Rilevamento Ispettivo, Prevenzione Tossicologica e Considerazioni Operative**

La raccolta responsabile si completa necessariamente con la valutazione tossicologica del raccolto [26]. L'impiego diffuso di applicazioni digitali basate su riconoscimento ottico o reti neurali rappresenta un supporto morfologico preliminare, ma non possiede alcun valore diagnostico ufficiale in tema di commestibilità [1]. Errori interpretativi di caratteri micro-morfologici o la mancata osservazione di dettagli quali volva seminterrata, residui dell'anello o viraggio della carne possono condurre a scambi gravissimi con specie contenenti amatossine (*Amanita phalloides*, *Amanita verna*) o orellanina (*Cortinarius orellanus*) [34].

La verifica sanitaria ufficiale sul territorio provinciale è demandata all'**Ispettorato Micologico dell'Azienda Sanitaria Locale (ASL) di Rieti**, inquadrato nel Servizio Igiene degli Alimenti e della Nutrizione (S.I.A.N.) del Dipartimento di Prevenzione [34]. Per i privati il controllo è gratuito (Ministero della Salute, *Funghi, consumiamoli in sicurezza*). Secondo la fonte [34], non riverificata su un atto dell'ASL, i micologi rilasciano la certificazione di commestibilità accertando che:

> * I funghi siano presentati integri, non tagliati o spezzettati, con tutte le componenti anatomiche intatte (cappello, imenoforo, gambo e base provvista di eventuale volva) [34];
> * Gli esemplari si presentino freschi, non bagnati, privi di muffe, parassiti interni o processi putrefattivi in atto [34];
> * I campioni provengano da zone ecologicamente idonee, escludendo particelle prossime a coltivi trattati con fitofarmaci o discariche [34].

La programmazione delle uscite nella provincia di Rieti richiede l'armonizzazione della conoscenza floristica, della mobilità logistica e dell'andamento meteorologico stagionale [5]:

Le uscite di fine primavera e inizio estate (giugno-luglio) vanno indirizzate verso le formazioni di collina e media montagna (500–850 m) esposte a meridione nei distretti dei Monti Sabini (Tancia), della conca di Cantalice e dei querceti bassi del Cicolano, dove i primi caldi sbloccano la fruttificazione di *Boletus aestivalis* e *Amanita caesarea* [5].

Nel pieno della stagione estiva (agosto e prima metà di settembre), la ricerca deve necessariamente salire di quota verso le faggete fresche della Vallonina sul Terminillo (1.200–1.700 m) e sui Monti della Laga, habitat che conservano umidità costante anche in periodi caldi e ventosi e assicurano stabili produzioni di *Boletus edulis*, *Boletus pinophilus* e *Cantharellus cibarius* [5].

Con l'arrivo dell'autunno pieno (ottobre-novembre), il focus operativo riscende verso i castagneti secolari di Antrodoco, i cedui misti attorno ai laghi del Salto e del Turano e le pinete di quota dell'Altopiano di Rascino, ambienti in cui proliferano le nascite tardive di boleti, trombette dei morti, chiodini e tricomi commestibili [8].

Per raccogliere servono attestato, ricevuta del contributo e documento, entro 3 kg di funghi commestibili a persona al giorno (vedi la sezione sulle regole). Il controllo all'Ispettorato Micologico ASL non è uno dei titoli per raccogliere: è la raccomandazione del Ministero della Salute da seguire prima di mangiare qualunque fungo, ed è gratuito per i privati. Restano da verificare, uscita per uscita, le regole delle aree protette, i cartelli e i divieti locali.

#### **Bibliografia**

> 1. FcP Map: la Migliore App per Andare a Funghi in Italia, [https\://funghichepassione.shop/blog/fcp-map-la-migliore-app-per-andare-a-funghi-in-italia/](https://funghichepassione.shop/blog/fcp-map-la-migliore-app-per-andare-a-funghi-in-italia/)
> 2. L'applicazione che cambia il modo di andare a funghi \- Geoticket, [https\://geoticket.it/blog/applicazione-andare-a-funghi](https://geoticket.it/blog/applicazione-andare-a-funghi)
> 3. Lazio Semaforo dei Funghi \- Funghi Magazine, [https\://funghimagazine.it/lazio-semaforo-dei-funghi/](https://funghimagazine.it/lazio-semaforo-dei-funghi/)
> 4. Carta Forestale su base tipologica della Regione Lazio, [https\://dati.lazio.it/dataset/91a9cd67-1a41-4584-b611-960c65d82724/resource/5d8c5060-1242-4422-9e3a-52703cad54ce/download/metadaticartaforestalesubasetipologica.pdf](https://dati.lazio.it/dataset/91a9cd67-1a41-4584-b611-960c65d82724/resource/5d8c5060-1242-4422-9e3a-52703cad54ce/download/metadaticartaforestalesubasetipologica.pdf)
> 5. Funghi nel Lazio: Simbruini, Castelli Romani e permessi \- MyBoletus, [https\://myboletus.com/it/regioni/lazio/](https://myboletus.com/it/regioni/lazio/)
> 6. Carta forestale su base tipologica \- Geoportale Regione Lazio, [https\://geoportale.regione.lazio.it/catalogue/csw\_to\_extra\_format/r\_lazio:9daed54e-3738-11ec-9b2e-0242/carta-forestale-su-base-tipologica.html](https://geoportale.regione.lazio.it/catalogue/csw_to_extra_format/r_lazio:9daed54e-3738-11ec-9b2e-0242/carta-forestale-su-base-tipologica.html)
> 7. Carta forestale su base tipologica della Regione Lazio \- Dataset, [https\://dati.lazio.it/dataset/carta-forestale-su-base-tipologica-della-regione-lazio](https://dati.lazio.it/dataset/carta-forestale-su-base-tipologica-della-regione-lazio)
> 8. Report uscita micologica Altopiano di Rascino, [https\://www\.ameronlus.it/blog/2018/11/10/report-uscita-micologica-altopiano-di-rascino/](https://www.ameronlus.it/blog/2018/11/10/report-uscita-micologica-altopiano-di-rascino/)
> 9. FunghiTrack \- App su Google Play, [https\://play.google.com/store/apps/details?id=it.funghitrack.app\&hl=it](https://play.google.com/store/apps/details?id=it.funghitrack.app&hl=it)
> 10. MyBoletus | Dove nasceranno i funghi, [https\://myboletus.com/it/](https://myboletus.com/it/)
> 11. Raccolta funghi Lazio 2026 — tesserino, limiti e giorni \- Geoticket, [https\://geoticket.it/regolamenti/lazio](https://geoticket.it/regolamenti/lazio)
> 12. Funghi Track — Assistente AI per Cercatori di Funghi, [https\://funghitrack.it/](https://funghitrack.it/)
> 13. App per non perdersi nei boschi \- Salvatore Aranzulla, [https\://www\.aranzulla.it/app-per-non-perdersi-nei-boschi-1252811.html](https://www.aranzulla.it/app-per-non-perdersi-nei-boschi-1252811.html)
> 14. Le migliori App per orientarsi nei boschi \- Funghi Magazine, [https\://funghimagazine.it/le-migliori-app-per-orientarsi/](https://funghimagazine.it/le-migliori-app-per-orientarsi/)
> 15. "il magnifico Borgo" di, [https\://www\.cnarieti.com/newpage](https://www.cnarieti.com/newpage)
> 16. Cytisus hirsutus L. \- Un Fiore alla volta di Giorgio Venturini \- AMINT, [https\://www\.funghiitaliani.it/topic/81964-cytisus-hirsutus-l/](https://www.funghiitaliani.it/topic/81964-cytisus-hirsutus-l/)
> 17. Dove Vedere il Foliage nel Lazio: Guida ai Boschi più Belli, [https\://www\.lazionascosto.it/foliage-nel-lazio/](https://www.lazionascosto.it/foliage-nel-lazio/)
> 18. Dove raccogliere i funghi porcini in Italia? I 6 luoghi ideali \- Idealista, [https\://www\.idealista.it/news/vacanze/mete-turistiche/2026/09/29/464993-dove-raccogliere-i-funghi-porcini-in-italia-i-6-luoghi-ideali](https://www.idealista.it/news/vacanze/mete-turistiche/2026/09/29/464993-dove-raccogliere-i-funghi-porcini-in-italia-i-6-luoghi-ideali)
> 19. LA CASTAGNA ROSSA, REGINA DELL'AUTUNNO \- FORMAT RIETI, [https\://archivio.formatrieti.it/la-castagna-rossa-regina-dellrsquoautunno](https://archivio.formatrieti.it/la-castagna-rossa-regina-dellrsquoautunno)
> 20. Ambiente \- Comunità Montana del Velino, [https\://velino.it/la-nostra-terra/territorio/ambiente](https://velino.it/la-nostra-terra/territorio/ambiente)
> 21. La selvicoltura dei castagneti da frutto abbandonati della Toscana, [https\://www\.researchgate.net/publication/259369158\_La\_selvicoltura\_dei\_castagneti\_da\_frutto\_abbandonati\_della\_Toscana](https://www.researchgate.net/publication/259369158_La_selvicoltura_dei_castagneti_da_frutto_abbandonati_della_Toscana)
> 22. Andar per funghi \- Alta Valle del Velino, [https\://www\.altavalledelvelino.com/natura-e-ambiente/bosco-e-dintorni/252-andar-per-funghi.html](https://www.altavalledelvelino.com/natura-e-ambiente/bosco-e-dintorni/252-andar-per-funghi.html)
> 23. Funghi nel Reatino \- Tutto Rieti, [https\://www\.tuttorieti.com/funghi/](https://www.tuttorieti.com/funghi/)
> 24. Lazio. I borghi più belli \- ViVi GREEN, [https\://www\.vivigreen.eu/blog/i-20-borghi-tra-i-piu-belli-del-lazio/](https://www.vivigreen.eu/blog/i-20-borghi-tra-i-piu-belli-del-lazio/)
> 25. Piatti tipici del Reatino: cosa e dove mangiare intorno al Terminillo, [https\://www\.cookist.it/piatti-tipici-del-reatino-cosa-e-dove-mangiare-intorno-al-terminillo/](https://www.cookist.it/piatti-tipici-del-reatino-cosa-e-dove-mangiare-intorno-al-terminillo/)
> 26. Sentieri di Montagna \- V Comunità Montana \- Piedelpoggio, [https\://piedelpoggio.org/info/montagna-sentieri](https://piedelpoggio.org/info/montagna-sentieri)
> 27. Sarnari \- 2007 \- Monografia Illustrata Del Genere Russula in Europa, [https\://it.scribd.com/document/700332050/Sarnari-2007-Monografia-Illustrata-Del-Genere-Russula-in-Europa](https://it.scribd.com/document/700332050/Sarnari-2007-Monografia-Illustrata-Del-Genere-Russula-in-Europa)
> 28. Monte I Porcini dal Rifugio Sebastiani \- Monti Reatini \- Rieti \- YouTube, [https\://www\.youtube.com/watch?v=E7E5Hg5chBo](https://www.youtube.com/watch?v=E7E5Hg5chBo)
> 29. Rassegna Stampa di leonessa.org, [https\://www\.leonessa.org/Rassegna\_Stampa/stampa2020.htm](https://www.leonessa.org/Rassegna_Stampa/stampa2020.htm)
> 30. lazio patrimonio \- agroalimentare \- Arsial, [https\://www\.arsial.it/wp-content/uploads/2025/06/Guida\_Arsial\_completo.pdf](https://www.arsial.it/wp-content/uploads/2025/06/Guida_Arsial_completo.pdf)
> 31. Monte i Porcini \- Le Mie Passeggiate, [https\://www\.lemiepasseggiate.it/percorsi-vari-sp-5570/50-gruppo-del-terminillo/295-monte-i-porcini](https://www.lemiepasseggiate.it/percorsi-vari-sp-5570/50-gruppo-del-terminillo/295-monte-i-porcini)
> 32. Giro dei quattro rifugi del Terminillo \- Monti Reatini \- Rieti \- Lazio, [https\://www\.youtube.com/watch?v=H6IBvTImRgw](https://www.youtube.com/watch?v=H6IBvTImRgw)
> 33. Escursione al Monte Porcini e Valle Scura. Il Terminillo più wild, [https\://www\.42gradinord.it/shop/attivita/monte-porcini-e-valle-scura/](https://www.42gradinord.it/shop/attivita/monte-porcini-e-valle-scura/)
> 34. Raccolta funghi nel Lazio: le regole in vigore nel 2025, [https\://www\.ameronlus.it/blog/2025/01/14/raccolta-funghi-nel-lazio-le-regole-in-vigore/](https://www.ameronlus.it/blog/2025/01/14/raccolta-funghi-nel-lazio-le-regole-in-vigore/)
> 35. Il Topo Selvatico: L'Opportunista delle Foreste \- Derattizzazioni org, [https\://derattizzazioni.org/il-topo-selvatico/](https://derattizzazioni.org/il-topo-selvatico/)
> 36. Sagra del Fungo Porcino \- Parchilazio, [https\://www\.parchilazio.it/cammino\_naturale\_dei\_parchi-schede-476-sagra\_del\_fungo\_porcino](https://www.parchilazio.it/cammino_naturale_dei_parchi-schede-476-sagra_del_fungo_porcino)
> 37. Meteo Funghi Collalto sabino \- Mico Previsioni, [https\://www\.3bmeteo.com/meteo-funghi/collalto+sabino](https://www.3bmeteo.com/meteo-funghi/collalto+sabino)
> 38. Gusto \- Discover Places, [https\://www\.discoverplaces.travel/it/esperienze/gusto?start=344](https://www.discoverplaces.travel/it/esperienze/gusto?start=344)
> 39. programma di sviluppo rurale 2014/2020 del lazio \- Gal Salto Cicolano, [https\://www\.galsaltocicolano.it/wp-content/uploads/2019/04/AGC\_DD\_G07762\_18\_06\_2018\_Allegato1\_piano\_di\_sviluppo\_locale.pdf](https://www.galsaltocicolano.it/wp-content/uploads/2019/04/AGC_DD_G07762_18_06_2018_Allegato1_piano_di_sviluppo_locale.pdf)
> 40. PIANO DI GESTIONE ED ASSESTAMENTO FORESTALE, [https\://www\.regione.lazio.it/sites/default/files/amministrazione-trasparente/tbl\_contenuti/PGAF\_Leofreni\_con\_integraz.pdf](https://www.regione.lazio.it/sites/default/files/amministrazione-trasparente/tbl_contenuti/PGAF_Leofreni_con_integraz.pdf)
> 41. Orobanche ebuli Huter & Rigo \- Succiamele dell'ebbio \- Forum Acta, [https\://www\.actaplantarum.org/forum/viewtopic.php?t=1717](https://www.actaplantarum.org/forum/viewtopic.php?t=1717)
> 42. Lazio » NoiTrek, [https\://noitrek.it/regione-evento/lazio/](https://noitrek.it/regione-evento/lazio/)
> 43. Dalle Pozze del Diavolo alla cima del Monte Ode con polenta alla, [https\://www\.escursionismo.it/escursioni/dalle-pozze-del-diavolo-alla-cima-del-monte-ode-con-polenta-alla-brace-al-casale-fatucchio/](https://www.escursionismo.it/escursioni/dalle-pozze-del-diavolo-alla-cima-del-monte-ode-con-polenta-alla-brace-al-casale-fatucchio/)
> 44. Un hotspot di biodiversità nell'Appennino Centrale, [https\://www\.pro-natura.it/lettore-news/hotspot-biodiversita-appennino-centrale.html](https://www.pro-natura.it/lettore-news/hotspot-biodiversita-appennino-centrale.html)
> 45. Il Monte Gorzano da Macchiatornella \- Sviaggi, [https\://skoriabob.blogspot.com/2014/07/il-monte-gorzano-da-macchiatornella.html](https://skoriabob.blogspot.com/2014/07/il-monte-gorzano-da-macchiatornella.html)
> 46. Gita sulla neve, Monte Terminillo \- 2night, [https\://2night.it/4f0e97-/gita-sulla-neve-monte-terminillo.html](https://2night.it/4f0e97-/gita-sulla-neve-monte-terminillo.html)
> 47. Paesi meno abitati del Lazio: 3 Borghi da Scoprire \- Viaggiando Italia, [https\://www\.viaggiando-italia.it/paesi-meno-abitati-del-lazio-3-borghi-da-scoprire/](https://www.viaggiando-italia.it/paesi-meno-abitati-del-lazio-3-borghi-da-scoprire/)
> 48. La Regione Lazio abolisce il tesserino per la raccolta dei funghi, [https\://www\.navegnacervia.it/leggi\_news.asp?cid=458](https://www.navegnacervia.it/leggi_news.asp?cid=458)
> 49. NUOVE DISPOSIZIONE DELLA REGIONE LAZIO PER RACCOLTA, [https\://comunitamontanasabina.it/notizie/252519/nuove-disposizione-regione-lazio-raccolta-funghi](https://comunitamontanasabina.it/notizie/252519/nuove-disposizione-regione-lazio-raccolta-funghi)
> 50. Leggi regionali, [https\://www\.ameronlus.it/leggi-regionali/](https://www.ameronlus.it/leggi-regionali/)
> 51. Raccolta funghi Lazio \- Cacciatoridifunghi, [https\://www\.cacciatoridifunghi.it/blog/raccolta-funghi/raccolta-funghi-lazio/](https://www.cacciatoridifunghi.it/blog/raccolta-funghi/raccolta-funghi-lazio/)
> 52. Raccolta funghi: regole di base \- Parchilazio, [https\://www\.parchilazio.it/campo\_catino-schede-29808-raccolta\_funghi\_regole\_di\_base](https://www.parchilazio.it/campo_catino-schede-29808-raccolta_funghi_regole_di_base)
> 53. Consiglio Regionale del Lazio \- legge num. 56 del 9 settembre 1988, [https\://www\.consiglio.regione.lazio.it/?vw=leggiregionalidettaglio\&id=8895\&sv=vigente](https://www.consiglio.regione.lazio.it/?vw=leggiregionalidettaglio&id=8895&sv=vigente)
> 54. 18/11/2015 Consiglio Regionale del Lazio Leggi e regolamenti http, [https\://www\.parchilazio.it/documenti/schede/l\_r\_06\_ottobre\_1997\_n\_29.pdf](https://www.parchilazio.it/documenti/schede/l_r_06_ottobre_1997_n_29.pdf)
> 55. Regione Lazio, [https\://www\.consiglio.regione.lazio.it/binary/consiglio\_regionale/tbl\_trasparenzaContenuti/DC\_2021\_16.pdf](https://www.consiglio.regione.lazio.it/binary/consiglio_regionale/tbl_trasparenzaContenuti/DC_2021_16.pdf)
> 56. Elenco degli Ispettorati micologici in Italia \- FISCOeTASSE.com, [https\://www\.fiscoetasse.com/files/18620/registro-ispettorati-micologici.pdf](https://www.fiscoetasse.com/files/18620/registro-ispettorati-micologici.pdf)
