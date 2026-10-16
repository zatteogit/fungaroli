# Confronto delle 31 fonti inviate per Fronda

16 ottobre 2026. Le omissioni più importanti dalla selezione iniziale sono
**Ambrosio et al. 2024, voce 1**, e **Qi et al. 2025, voce 15**. Entrambi sono
stati identificati e letti nel testo completo. Sono aggiunti al registro degli
accessi e alla bibliografia. Le voci 12 e 31 aggiungono supporto idrologico utile.

Olano 2020 e Karavani 2018 erano già nei 19 studi iniziali. Li 2025, voce 7,
era già entrato nell'approfondimento in corso, ma non nella prima selezione.
Il [confronto strutturato](confronto-fonti-utente.json) conserva riferimento esatto,
accesso effettivo e correzioni per ogni numero dell'elenco originale.

## Le aggiunte che cambiano il modello proposto

**Ambrosio, Pietras e Feest 2024**, [testo completo Dendrobiology](https://www.idpan.poznan.pl/images/stories/dendrobiology/vol91/denbio091002.pdf),
DOI 10.12657/denbio.091.002. Sessanta plot in tre boschi liguri, 2012–2014,
con analisi di comunità/biomassa e un separato MaxEnt europeo per i porcini.
È evidenza italiana direttamente pertinente: motiva substrato, suolo e struttura
forestale nel livello habitat. Le correlazioni locali non dimostrano che il suolo
batta sempre il meteo; il clima locale e l'analisi distributiva europea hanno
supporti diversi. Il contributo relativo di BIO14 in MaxEnt non è varianza
spiegata o probabilità giornaliera di ritrovamento. Non si trasferiscono pesi.

**Qi et al. 2025**, [testo completo Ecology and Evolution](https://onlinelibrary.wiley.com/doi/full/10.1002/ece3.72743),
DOI 10.1002/ece3.72743. Unisce ospiti, suolo e clima in modelli europei per
funghi ectomicorrizici: 66 specie iniziali, 60 nei modelli finali. Il
[deposito Dryad](https://datadryad.org/dataset/doi:10.5061/dryad.bcc2fqzpp)
documenta dati e script; manifest/README letti, archivi non scaricati e codice
non eseguito. È utile per la presenza potenziale, non per fruttificazione
giornaliera. I cinque ospiti non includono castagno, leccio o sughera: occorre
ampliare gli ospiti per Fronda Italia. Le presenze grezze degli alberi sono
escluse dal deposito e vanno reperite alla fonte.

**Winzeler et al. 2022**, [Land, DOI 10.3390/land11112018](https://www.mdpi.com/2073-445X/11/11/2018),
voce 12, aggiunge un riferimento preciso per valutare TWI, risoluzione del DEM
e algoritmo di flusso. È un proxy di umidità dipendente dal contesto; non va
convertito in misura attuale dell'acqua nel sottobosco. Dati/codice sono indicati
nel deposito USDA, non scaricati nella verifica.

**Lin et al. 2006**, [Geoderma, DOI 10.1016/j.geoderma.2005.03.013](https://doi.org/10.1016/j.geoderma.2005.03.013),
voce 31, sostiene la modellazione congiunta di topografia, tipo e profondità
del suolo e dinamica dell'acqua. È supporto idropedologico da un bacino forestale
della Pennsylvania, non una calibrazione micologica italiana. Metadati e abstract
sono stati verificati; non viene dichiarata lettura integrale.

## Correzioni alle sintesi fornite

- In **Li 2025**, l'11% è la componente indipendente del suolo nella varianza
  dell'indice di idoneità modellato. Non significa +11 punti di accuratezza
  o di probabilità di trovare funghi. I 25 m riguardano mappe svizzere e non
  dimostrano quella precisione per una previsione italiana.
- La struttura predisposizione–innesco di **Olano 2020** è un'ipotesi interpretativa,
  non una dimostrazione sperimentale del meccanismo del carbonio nel micelio.
- La voce **4** offre contesto genomico; la voce **5** è un libro collettaneo,
  non un singolo studio. La **20** è un capitolo del libro **21**: non sono due
  conferme indipendenti.
- **10–11** sono tutorial. **9**, **16** e **18** studiano rispettivamente alberi,
  insetti e frane. Possono offrire metodo, senza sostenere soglie micologiche.
- **28 e 30** sono blog commerciali identificati, non studi scientifici.
  Temperature, rese o trend non accompagnati da fonti puntuali non entrano nel modello.
- **6, 23, 25, 26 e 29** non sono identificabili bibliograficamente dal materiale
  fornito; **27** ha almeno due versioni reali possibili. Non sono stati assegnati
  arbitrariamente autori o DOI. Una mancata identificazione non dimostra inesistenza.

## Tutte le voci

«Nuovo» indica assenza nei registri precedenti; non implica che sia una prova
diretta per i funghi italiani. Lo stato di lettura completo è nel JSON.

| N. | Riferimento | Esito del confronto | Uso per Fronda |
|---:|---|---|---|
| 1 | [Ambrosio et al. 2024 · boschi liguri e porcini](https://www.idpan.poznan.pl/images/stories/dendrobiology/vol91/denbio091002.pdf) | Nuovo, prioritario | Suolo e habitat italiani |
| 2 | [Olano et al. 2020 · produttività e clima](https://interlace-hub.com/sites/default/files/NDVIFungiInpress1-s2.0-S0168192320301179-main.pdf) | Già nei 19 iniziali | NDVI e memoria ecologica |
| 3 | [Karavani et al. 2018 · acqua e produttività](https://doi.org/10.1016/j.agrformet.2017.10.024) | Già nei 19 iniziali | Bilancio idrico |
| 4 | [Tremble et al. 2023 · genomica di B. edulis](https://nph.onlinelibrary.wiley.com/doi/10.1111/nph.18521) | Nuovo, contesto | Genetica e tassonomia |
| 5 | [Edible Ectomycorrhizal Mushrooms](https://link.springer.com/book/10.1007/978-3-642-33823-6) | Libro di riferimento | Contesto; accesso parziale |
| 6 | Modelli predittivi avanzati e dinamiche ecofisiologiche | Sintesi non identificata | Richiede fonte originale |
| 7 | [Li et al. 2025 · suolo e SDM](https://onlinelibrary.wiley.com/doi/full/10.1111/jbi.15124) | Già nell’approfondimento | Suolo e idoneità statica |
| 8 | [Funghi commestibili del Messico centrale](https://www.mdpi.com/2071-1050/18/7/3571) | Nuovo, SDM messicano | Metodo, non soglie italiane |
| 9 | [Nove algoritmi per distribuzioni arboree](https://iforest.sisef.org/contents/?id=ifor4084-015) | Studio su alberi | Confronto algoritmi |
| 10 | [Presence-Only Prediction 101](https://www.esri.com/arcgis-blog/products/arcgis-pro/analytics/presence-only-prediction-maxent-101-using-gis-to-model-species-distribution) | Tutorial Esri | Implementazione GIS |
| 11 | [Learn ArcGIS · SDM](https://learn.arcgis.com/en/projects/perform-species-distribution-modeling/) | Tutorial Esri | Implementazione GIS |
| 12 | [Winzeler et al. 2022 · TWI](https://www.mdpi.com/2073-445X/11/11/2018) | Nuovo, supporto idrologico | TWI candidato, non misura |
| 13 | [MaxEnt e Chinese Caterpillar Fungus](https://www.mdpi.com/2077-0472/15/11/1144) | SDM fungo diverso | Metodo periferico |
| 14 | [MaxEnt e Sanghuang](https://www.sciencedirect.com/science/article/abs/pii/S1754504815000793) | SDM funghi medicinali | Metodo periferico |
| 15 | [Qi et al. 2025 · distribuzioni ectomicorriziche](https://onlinelibrary.wiley.com/doi/full/10.1002/ece3.72743) | Nuovo, prioritario | Ospiti, suolo e clima |
| 16 | [Psilochalcis · distribuzione di vespe](https://www.mdpi.com/1424-2818/16/6/348) | Studio su insetti | Solo analogia metodologica |
| 17 | [Cistus ladanifer e clima](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2023.1136224/full) | Studio su Cistus | Contesto degli ospiti |
| 18 | [Terreno ed ensemble per frane](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024JH000460) | Studio su frane | Solo analogia metodologica |
| 19 | [Tuber magnatum · stagionalità del suolo](https://www.sciencedirect.com/science/article/pii/S0929139315300111) | Studio sui tartufi | Futuro modulo separato |
| 20 | [Soil Characteristics for Tuber magnatum](https://link.springer.com/chapter/10.1007/978-3-319-31436-5_12) | Capitolo del libro 21 | Non prova indipendente |
| 21 | [True Truffle in the World](https://link.springer.com/book/10.1007/978-3-319-31436-5) | Libro sui tartufi | Contesto specialistico |
| 22 | [Conservazione dell’aroma del tartufo nero](https://www.sciencedirect.com/science/article/pii/S0023643817300981) | Conservazione aroma | Fuori dal forecasting |
| 23 | Morchella esculenta | Titolo non identificato | Serve URL o autore |
| 24 | [Grifola frondosa · coltivazione](https://bibliotecadigital.exactas.uba.ar/collection/paper/document/paper_09593993_v24_n8_p1361_Barreto) | Coltivazione maitake | Non taratura dei selvatici |
| 25 | How to Grow Artist’s Conk | Guida non identificata | Serve fonte originale |
| 26 | Shiitake Cultivation | Titolo non identificato | Coltivazione, fonte incerta |
| 27 | [Mushrooms and Mushroom Cultivation](https://onlinelibrary.wiley.com/doi/abs/10.1038/npg.els.0000370) | Due versioni possibili | Identità non risolta |
| 28 | [Optimal temperatures for each stage](https://www.naturnext.eu/en/optimal-temperatures-for-each-stage-of-mushroom-growth) | Blog commerciale | Non fonte di soglie |
| 29 | Hysteresis and mushrooms | Titolo non identificato | Nessun parametro importato |
| 30 | [Seasons and mushrooms](https://www.naturnext.eu/fr/saisons-et-champignons-suivez-le-calendrier-naturel) | Blog commerciale | Non evidenza fenologica |
| 31 | [Lin et al. 2006 · bacino forestale](https://www.sciencedirect.com/science/article/pii/S0016706105000868) | Nuovo, supporto idrologico | Suolo–topografia–acqua |

## Applicazione alla ricerca Fronda

Il livello statico deve rappresentare ospiti, suolo e substrato, topografia e
clima di fondo, con incertezza delle mappe. Il livello dinamico usa meteo recente,
stato idrico e stagione. L'esito dell'uscita aggiunge sforzo e rilevamento.
Queste aggiunte rafforzano la stima in luoghi nuovi attraverso analoghi ambientali:
non richiedono uno storico abbondante per ogni punto.

La documentazione e il registro sono aggiornati; non sono state aggiunte soglie,
temperature ottimali o pesi numerici copiati da sistemi biologici differenti.
Il prototipo addestrabile resta la baseline sperimentale descritta nella
[ricerca](ricerca.md), senza una calibrazione italiana già dimostrata.
