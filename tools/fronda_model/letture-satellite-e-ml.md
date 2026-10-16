# Accesso agli studi avanzati applicabili a Fronda — parte B

Verificato il **16 ottobre 2026**, fuso Europe/Rome. Manifest macchina: [access-manifest.json](access-manifest.json). Nessun acquisto, contatto con autori o superamento di paywall. Nessun file del repository applicativo modificato. “Pubblico dichiarato”, “metadati letti”, “file acquisito” e “studio riprodotto” restano stati diversi.

## Risultato operativo

Il miglior avanzamento immediato è un **prior statico dell'habitat** che include suolo, ospiti e struttura del bosco, seguito da un **modello dinamico** di disponibilità dei carpofori e dall'esito di una ricerca con sforzo dichiarato. La letteratura recente sostiene nuove covariate; non consegna una probabilità nazionale pronta e calibrata.

Ordine di applicazione proposto:

1. **Li et al. 2025, suolo + SDM**: costruire il prior ecologico e un confronto con/senza suolo. È il candidato recente più diretto per aree prive di storico locale.
2. **Sentinel-1 2024 e modelli con più sorgenti 2024**: sperimentare covariate dinamiche/strutturali con un test di incremento rispetto a meteo+habitat; nessuna soglia numerica copiata.
3. **Pannello di eventi con zeri 2014–2024, versione 2026**: verificare la pipeline dei campionamenti ripetuti e il target contato. Il suo clima boreale lo rende un benchmark metodologico, non la taratura italiana.
4. **DATA1293**: usare esclusivamente come tabella di trait/biomassa; non contiene serie di visite.
5. **ANN2024**: confronto di metodo, con dati non pubblici e validazione debole per il trasferimento. **Andrew2025** resta da leggere integralmente prima di importare optima.

## Fonti effettivamente lette e accesso reale

### ANN2024: pertinente al target, insufficiente per trasferire le percentuali

[Somfalvi-Tóth et al., Scientific Reports 14:278](https://www.nature.com/articles/s41598-023-50638-8), versione del 2 gennaio 2024, **CC BY 4.0**. Fulltext letto, inclusi metodi e disponibilità dei dati.

Target: rilevamento binario di carpofori per 13 specie di Amanita/Russula, su 28 giornate in due aree ungheresi. Non conta la biomassa o la crescita. I predittori vengono selezionati per correlazione prima dello split descritto come casuale 70/30; manca test su area o stagione futura. Questo espone a ottimismo da selezione e dipendenza dei campioni. R/neuralnet e pesi/architetture sono illustrati; nessun repository eseguibile individuato. **I dati sono proprietari e disponibili solo su richiesta**. I sei DOCX supplementari sono collegati; il primo ha restituito byte ZIP non decodificati, quindi non viene dichiarato letto. Non trasferire a Fronda l'accuratezza indicata nell'articolo.

### Andrew2025: licenza verificata, testo completo non ottenuto

[Not always optimal: Fungal fruiting triggers indicate climate sensitivity in cooler regions](https://www.sciencedirect.com/science/article/pii/S1754504825000066), Fungal Ecology 75:101416, giugno 2025. L'[API primaria Elsevier](https://api.elsevier.com/content/article/pii/S1754504825000066?httpAccept=text/xml) conferma **CC BY-NC 4.0** e stato open access. Sono stati letti abstract e metadati, **non il fulltext**: HTML/PDF hanno restituito 403; richiesta API FULL 429. Nessuna restrizione è stata aggirata.

L'abstract riguarda optima climatici/meteo associati a occorrenze di 127 taxa europei. Schema dei dati, coefficienti, codice, split e supplementi non sono verificati. Priorità: ottenere il testo pubblico completo da editore/repository prima di impiegare numeri. Non è lecito trasformare l'associazione descritta nell'abstract in una probabilità giornaliera di incontro.

### Sustainability2024: meteo + Landsat + struttura, target annuale

[Martínez-Rodrigo et al., 16:5656](https://www.mdpi.com/2071-1050/16/13/5656), versione del 2 luglio 2024, **CC BY 4.0**. Fulltext realmente letto in [XML ufficiale](https://mdpi-res.com/d_attachment/sustainability/sustainability-16-05656/article_deploy/sustainability-16-05656.xml) e [PDF ufficiale](https://mdpi-res.com/d_attachment/sustainability/sustainability-16-05656/article_deploy/sustainability-16-05656.pdf).

Il target è presenza annuale e resa positiva in grammi di Lactarius deliciosus: 17 parcelle recintate di 150 m², 1997–2021. Confronta classificazione/regressione e 104 covariate iniziali, selezionandone 40. Split casuale 70/30; nessuna validazione per anno/sito tenuto fuori documentata. Le variabili meteo includono tutti i mesi dell'anno: per previsioni emesse prima della stagione bisogna rimuovere i mesi futuri o usare forecast archiviati. **I dati micologici non sono pubblici e gli autori dichiarano di non poterli condividere**. Nessun archivio di script/pesi individuato. Utile per scegliere covariate e modello a due stadi, non come modello giornaliero pronto.

### Sentinel-1 2024: candidato interessante, incremento predittivo non dimostrato

[Martínez-Rodrigo et al., DOI 10.1007/s41651-024-00199-9](https://link.springer.com/article/10.1007/s41651-024-00199-9), versione dell'8 novembre 2024, **CC BY 4.0**. Fulltext letto.

Diciassette parcelle di 150 m², raccolte settimanali 2018–2021; analisi per micorrizici/saprotrofi. Usa intensità VV/VH e coerenza interferometrica VV a 40 m, con STL, FFT, correlazioni e ritardi. **Non presenta un modello predittivo con test indipendente**. L'intensità è rumorosa e dipende dalla pioggia; la coerenza offre un candidato più interessante. Interpolazione polinomiale e decomposizione dell'intera serie devono diventare causali prima di una valutazione forecast. Non introdurre un universale “quattro settimane dopo il picco”. Sentinel-1 è pubblico; nessun archivio delle etichette micologiche, serie derivate o codice è stato individuato nel testo. Passo utile: confronto meteo+habitat contro meteo+habitat+SAR su identici blocchi temporali/geografici.

### DATA1293: dati acquisiti, ma sono aggregati per taxon

[Morera et al., dataset v1.0](https://dataverse.csuc.cat/dataset.xhtml?persistentId=doi:10.34810/DATA1293), pubblicato il 25 aprile 2024, **CC BY 4.0** verificata nel repository e nel README. Acquisiti e letti [README pubblico](https://dataverse.csuc.cat/api/access/datafile/95652) e [TAB pubblico](https://dataverse.csuc.cat/api/access/datafile/95651).

Il file ha **837 righe, 836 nomi di taxon distinti e 23 colonne**. Contiene tassonomia, biomassa fresca/secca media, deviazione, numerosità, rapporto e guild. Nessun campo di sito/data/visita e nessuna tabella di zeri. Le 132 parcelle e il periodo 1995–2023 descrivono la provenienza delle misure, non un pannello di eventi pubblicato. Rilevata una duplicazione di `Clitocybe phyllophila`, da riconciliare prima dei join. Priorità come trait o conversione con incertezza; non addestra una previsione di fruttificazione o successo dell'uscita. Nessun software predittivo associato.

### Pannello Filippova: zeri interpretabili e aggiornamento 2026

[Dataset GBIF, DOI 10.15468/e9g5ri](https://www.gbif.org/dataset/acd76923-54da-4799-b4b0-cfe585c2c0b8), versione **1.45** del 4 febbraio 2026. Letti [metadati API](https://api.gbif.org/v1/dataset/acd76923-54da-4799-b4b0-cfe585c2c0b8), EML e [descrittore fulltext 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6684528/). Licenza corrente **CC BY 4.0**, diversa dal CC0 riportato per la versione del 2019.

Copertura 2014–2024, 263 microparcelle di 5 m², 110 tornate dichiarate, circa 30.000 eventi e 9.852 occorrenze nel registro corrente. Event e Occurrence si collegano con `eventID`; l'evento senza occorrenze è uno zero nel campo del protocollo. Sono disponibili conteggi per taxon e revisione molecolare. I carpofori contati vengono rimossi, salvo taxa protetti: il target non coincide con la disponibilità durante una passeggiata. **Archivio grezzo Event/Occurrence non ancora acquisito**, quindi conteggi e schema fisico vanno ricontrollati. Utile per addestrare/verificare pipeline e validazione su plot/anni nuovi; ambiente di torbiera boreale, senza dimostrazione di trasferimento all'Italia.

### Li2025: migliore candidato per il prior dell'habitat

[Li et al., Journal of Biogeography, DOI 10.1111/jbi.15124](https://onlinelibrary.wiley.com/doi/full/10.1111/jbi.15124), pubblicato il 24 marzo 2025, **CC BY 4.0**. Fulltext e [PDF ufficiale WSL/DORA](https://www.dora.lib4ri.ch/wsl/islandora/object/wsl%3A39510/datastream/PDF/Li-2025-Integrating_soil_properties_into_species-%28published_version%29.pdf) letti dall'agente delegato; dettaglio verifiche in [dettaglio verifiche](soil-sdm.json).

Modella la distribuzione di 162 macrofunghi terricoli in Svizzera con suolo, clima e topografia: è idoneità statica presence-background, non fruttificazione giornaliera. Metodi: 5 fold ripetuti 20 volte, senza blocking geografico/temporale dichiarato. I 189 plot Red List verificano un'interpretazione sul bias di pendenza, non il TSS predittivo esterno. [Dryad](https://datadryad.org/dataset/doi:10.5061/dryad.9p8cz8wrv) dichiara 162 CSV senza coordinate e script R, **CC0**; manifest/README letti ma byte dei file 403/401, codice non letto. Le carte [EnviDat](https://www.envidat.ch/metadata/soil-property-maps-for-the-swiss-forest), **CC BY-SA 4.0**, coprono solo boschi svizzeri. Trasferire struttura e test delle covariate a layer italiani; non coefficienti o percentuali come già validati.

## Cosa possiamo rendere concreto adesso

- Aggiungere al registro delle fonti i link/versioni e gli stati del manifest, evitando di chiamare “acquisiti” dati solo descritti.
- Usare suolo e habitat per una stima iniziale anche senza storico nel singolo punto; misurare il trasferimento con siti italiani tenuti fuori. Non serve uno storico in ogni cella per calcolare il modello, ma serve evidenza rappresentativa per calibrare percentuali.
- Introdurre SAR soltanto come ramo sperimentale confrontato con baseline, rispettando tempi di disponibilità delle immagini ed evitando filtri che usano il futuro.
- Conservare separati dati aggregati di trait, presenze opportunistiche e campionamenti ripetuti con zeri. La loro unione richiede likelihood/processi di osservazione diversi.
- Prima di una probabilità pubblica: test temporale, spaziale e prospettico, sforzo previsto e osservato, identificazioni controllate e calibrazione sul dominio italiano dichiarato.

Gli studi su immagini, coltivazioni controllate o sole spore non sono stati promossi a prove di previsione dei carpofori selvatici. La ricerca non ha trovato un modello nazionale trasferibile pronto: ha individuato componenti utilizzabili e chiarito quali accessi ai dati restano realmente mancanti.
