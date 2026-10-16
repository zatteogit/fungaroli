# Studi micologici accessibili per il modello Fronda

Verifica del 16 ottobre 2026. Sono stati aperti testi integrali pubblici, versioni
autoriali, supplementi e cataloghi di dati. Il [registro degli accessi](access-manifest.json)
riporta per ogni risorsa versione, URL effettivo, sezioni lette e disponibilità di
dati/codice. L'accesso al paper è distinto dalla licenza e dalla disponibilità dei
dati necessari a riprodurlo.

## Le letture da usare per prime

| Priorità per Fronda | Testo accessibile | Che cosa possiamo applicare |
|---|---|---|
| Trasferire la previsione a boschi nuovi | [Morera et al. 2021, testo integrale](https://link.springer.com/article/10.1186/s40663-021-00297-w) | Confronto GLMM, RF, boosting, SVM e ANN; validazione con blocchi geografici e ambientali. Non occorre uno storico in ogni cella. Il target del paper è produzione annua. |
| Modellare la presenza potenziale con il suolo | [Li et al. 2025, testo integrale](https://onlinelibrary.wiley.com/doi/full/10.1111/jbi.15124) | Suolo insieme a clima e topografia per 162 macrofunghi svizzeri. Utile per il prior dell'habitat; non misura fruttificazione giornaliera o probabilità per uscita. |
| Acqua, satellite e risorse degli ospiti | [Olano et al. 2020, PDF completo](https://interlace-hub.com/sites/default/files/NDVIFungiInpress1-s2.0-S0168192320301179-main.pdf) | Verificare l'apporto di umidità e NDVI pregresso, oltre a pioggia e temperatura; il fit pubblicato non è un test su nuovi boschi. |
| Separare presenza di produzione e quantità | [Sánchez-González et al. 2019, testo integrale](https://link.springer.com/article/10.1186/s40663-019-0211-1) | Struttura a due parti, logistica e Gamma. La probabilità annuale di produzione non è probabilità di successo di una passeggiata. |
| Porcini e condizioni italiane | [Salerni et al. 2023, PDF completo](https://italianmycology.unibo.it/article/download/16464/15846) | Interazioni fra meteo, lettiera e bosco sul Monte Amiata. I rilievi sono del 2000–2002; non si importa una soglia universale da correlazioni locali. |
| Relazione giornaliera meteo–porcini | [Brejon Lamartinière e Hoffman, copia autoriale v2 2026](https://www.researchgate.net/publication/398679307_Predicting_porcini_a_decade_of_sporocarp_monitoring_reveals_the_meteorological_triggers_of_Boletus_edulis_fruiting_in_central_European_beech_forests) | Testo e Table S1 letti, CSV/R ispezionati. Modello NB1 con link log; occorre adattare finestre e significato degli zeri prima di un forecast operativo. |
| Telerilevamento del sottobosco come ipotesi | [Martínez-Rodrigo et al. 2024, Sentinel-1, testo integrale](https://link.springer.com/article/10.1007/s41651-024-00199-9) | Coerenza radar come variabile candidata. Studio esplorativo, senza test previsionale indipendente: nessun aumento di accuratezza già dimostrato. |
| Verificare l'utilità delle reti neurali | [Somfalvi-Tóth et al. 2024, testo integrale](https://www.nature.com/articles/s41598-023-50638-8) | Confronto per specie. Campione piccolo e split casuale non dimostrano trasferibilità nazionale; non importare le percentuali pubblicate come affidabilità di Fronda. |

Le schede con metodi, versioni e limiti sono in [letture-avanzate.md](letture-avanzate.md)
e [letture-satellite-e-ml.md](letture-satellite-e-ml.md). Il primo dossier include
anche un articolo del 2026 sulla struttura del bosco e un precursore Karavani del
2016, esplicitamente distinto dal lavoro finale del 2018.

## Che cosa cambia nella progettazione

Il contributo più diretto alla domanda «si può prevedere senza storico del punto?»
è Morera 2021: la verifica esclude ambienti interi e valuta la capacità di previsione
in condizioni nuove. Per Fronda questo significa apprendere dai boschi già studiati,
calcolare le covariate di un luogo nuovo e dichiarare quanto esso è rappresentato
nel campione. I dati locali possono aggiornare la stima successivamente.

Il benchmark da costruire confronta una baseline climatica semplice, un modello
gerarchico a due parti e Random Forest/boosting. La selezione delle covariate e
degli iperparametri deve rispettare gli stessi blocchi del test: più variabili e
un algoritmo più complesso non sono una garanzia. Il codice consegnato implementa
la baseline per esiti di uscite; la gerarchia, il radar e gli ensemble sono proposte
da verificare, non funzioni già attivate nell'app.

Per la fruttificazione si possono utilizzare dati e relazioni di ambienti analoghi;
per il ritrovamento durante un'uscita entrano anche lo sforzo e il rilevamento. Le
percentuali preliminari restano stime, correggibili con dati indipendenti. Nessun
paper annuale di biomassa viene convertito direttamente in «probabilità per 60 minuti».

## Il controllo che corregge la lettura del lavoro sui porcini

L'[audit riproducibile](audit-porcini.md) ha verificato separatamente testo,
supplemento e file degli autori:

- Il deposito aggiornato è [Zenodo V1.2 del giugno 2026](https://zenodo.org/records/20591123),
  collegato al [repository](https://github.com/ebrejonl/Boletus_fruiting_triggers).
  I primi record del dicembre 2025 non rappresentano la versione estesa.
- L'aggregato `All` include i sottositi: non sono tre repliche indipendenti.
- La pioggia è una **media nella finestra**, e il termine è lineare nel predittore
  logaritmico. Non è una regressione lineare dei conteggi sulla pioggia cumulata.
- Le medie mobili originali includono il giorno contato. Per una previsione emessa
  prima di quel giorno occorrono ritardi causali o il meteo previsto disponibile allora.
- Gli zeri sono prodotti dal calendario dei record; senza registro visite non
  equivalgono automaticamente a ricerche concluse senza ritrovamento.

Il preprint è consultabile e ha una licenza dichiarata; la licenza specifica di
CSV e codice non è ancora verificata. Non sono stati inclusi nella distribuzione
Fronda né usati per dichiarare una calibrazione italiana.

## Dati aperti e studi non ancora aperti integralmente

Il [dataset mediterraneo DATA1293](https://dataverse.csuc.cat/dataset.xhtml?persistentId=doi:10.34810/DATA1293)
è stato ispezionato: contiene tratti e biomasse aggregati per taxon, con licenza
CC BY 4.0. Non contiene il pannello di date/siti/visite necessario per addestrare
una probabilità giornaliera. Un corpus boreale a visite ripetute è documentato
nel registro come candidato per verificare la pipeline, con un dominio diverso
dai boschi italiani: il suo archivio eventi non è stato scaricato.

Per Morera 2024, Karavani 2018 finale e *Not always optimal* 2025 sono stati
verificati abstract e metadati, ma non è stata ottenuta una lettura integrale
affidabile nella sessione. Questi accessi restano distinti dai testi effettivamente
aperti. Per diverse letture complete, i dati grezzi sono disponibili soltanto su
richiesta agli autori; non risultano già acquisiti.

La rassegna iniziale e il registro [studies.json](studies.json) conservano 19 studi
ecologici di base; questo approfondimento aggiunge letture mirate e aggiorna gli
accessi. La [traccia di ricerca](traccia-ricerca.md) documenta query e criteri.
La [bibliografia importabile](bibliografia.bib) permette di conservare i riferimenti.
