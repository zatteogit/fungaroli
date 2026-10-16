# Studi accessibili e applicabili a Fronda

Verifica al **16 ottobre 2026**. Ho aperto e letto i metodi e i risultati di cinque articoli peer-reviewed, più un precursore metodologico distinto. Il [registro degli accessi](access-manifest.json) registra URL, versione, sezioni, dati/codice, licenze e accessi non riusciti. Nessuna richiesta agli autori, pagamento o aggiramento di paywall.

## Priorità 1 — Predire in ambienti nuovi

[Morera et al. 2021 — testo integrale HTML](https://link.springer.com/article/10.1186/s40663-021-00297-w), DOI 10.1186/s40663-021-00297-w, versione finale del 15 marzo 2021. Letti metodi, risultati, discussione, disponibilità e diritti. Confronta GLMM, GWR, Random Forest, XGBoost, SVM e ANN su biomassa annua di 98 parcelle catalane. Usa dieci fold casuali, spaziali e ambientali, anche nel tuning. La somiglianza climatica fra dati e territorio aiuta a interpretare l'errore nei nuovi luoghi. Per Fronda è la priorità metodologica: confrontare modelli e misurare trasferibilità, mantenendo pochi predittori ben motivati. **Non richiede uno storico in ogni punto**.

Il paper è CC BY 4.0; i dati sono dichiarati non pubblici per vincoli istituzionali. Il [supplemento diretto DOCX](https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs40663-021-00297-w/MediaObjects/40663_2021_297_MOESM1_ESM.docx) è stato risolto ma il lettore non supporta il formato: non dichiaro letti i suoi coefficienti. Il target resta produzione annua in pinete, non successo di un'uscita italiana.

## Priorità 2 — Integrare satellite e memoria ecologica

[Olano et al. 2020 — PDF completo, 8 pagine](https://interlace-hub.com/sites/default/files/NDVIFungiInpress1-s2.0-S0168192320301179-main.pdf), DOI 10.1016/j.agrformet.2020.108015. PDF editoriale in press accettato il 22 aprile 2020; letti §§2–5. Combina meteo, umidità ESA CCI e NDVI Landsat su serie annue di 22/24 anni. Seleziona predittori con correlazioni, lag NDVI di 0/1/2 anni e BIC; confronta modelli climatici, satellitari e combinati. Non è descritto un holdout indipendente: il miglior R² non equivale a capacità su nuove località. Per Fronda: verificare NDVI pregresso e bilancio idrico nella validazione, senza tradurre un satellite grossolano in precisione di sentiero. Script e dati fungini scaricabili non individuati; il PDF reca copyright Elsevier, nessuna licenza di redistribuzione accertata. Supplementi menzionati ma non aperti.

## Priorità 3 — Separare presenza e quantità

[Sánchez-González et al. 2019 — testo integrale HTML](https://link.springer.com/article/10.1186/s40663-019-0211-1), DOI 10.1186/s40663-019-0211-1, versione finale del 16 dicembre 2019. Letti metodi, risultati, discussione e disponibilità. Modelli hurdle: parte logistica per presenza annuale e Gamma per biomassa positiva, con meteo, bosco ed effetti di anno. Il bootstrap descrive l'incertezza; gli autori ammettono che AUC valutata sugli stessi dati del fit può essere sovrastimata. È una buona architettura da confrontare, non un livello di accuratezza da importare. Dati non pubblici, su richiesta; codice pubblico non individuato. Paper CC BY 4.0. Il [supplemento meteo DOCX](https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs40663-019-0211-1/MediaObjects/40663_2019_211_MOESM1_ESM.docx) risulta raggiungibile ma non interpretabile dal lettore.

## Priorità 4 — Evidenza italiana su estremi e porcini

[Salerni et al. 2023 — PDF completo, 13 pagine](https://italianmycology.unibo.it/article/download/16464/15846), DOI 10.6092/issn.2531-7342/16464. Letti metodi, risultati, tabelle 1–2 e discussione. **I dati sono del 2000–2002**, non del 2023: conteggi giornalieri di B. edulis in 36 parcelle ravvicinate di abetina sul Monte Amiata. Analizza correlazioni dopo eventi estremi, per trattamento e lettiera. R20=20 mm definisce l'evento estremo studiato, non l'innesco universale del porcino. Nessuno split previsionale; le molte correlazioni richiedono prudenza. Utile per rifiutare un bonus termico indistinto e motivare interazioni ambiente–temperatura. Paper CC BY 4.0; dati grezzi e codice non individuati.

## Priorità 5 — Aggiornamento 2026 sulla struttura del bosco

[Ponce et al. 2026 — testo integrale HTML](https://link.springer.com/article/10.1007/s10342-025-01840-y), DOI 10.1007/s10342-025-01840-y, versione finale del 20 gennaio 2026. Letti metodi, risultati, discussione, disponibilità e descrizioni dell'appendice. Sperimentazione appaiata su 18 parcelle di P. uncinata, 2015–2024, con interventi dal 2020. GAMM distinguono biomassa secca, numero di specie e gestione, con effetti sito/anno e differenze controllo–trattato. Mostra perché ricchezza e produzione non sono intercambiabili; non fornisce un nowcast per specie. Dati e codice sono solo su richiesta, quindi non ottenuti. Paper CC BY 4.0.

## Fonte complementare: Karavani, versione 2016

[Karavani 2016 — PDF ufficiale MEDFOR, 24 pagine](https://www.medfor.eu/sites/default/files/editor/karavani_et_al_final.pdf). Precursore datato 21 luglio 2016, **distinto dal paper finale 2018** DOI 10.1016/j.agrformet.2017.10.024. Letti metodi e risultati, tabelle 3–4. Collega umidità misurata e simulata con `medfate` a modelli a due parti e resa logaritmica. Documenta profondità dei sensori e umidità relativa alla capacità di campo: grandezze diverse dalle attuali soglie volumetriche Fronda. Coefficienti effettivamente visibili, ma non trasferibili a un modello giornaliero nazionale. Nessuna validazione indipendente descritta nel metodo letto; dati e script non individuati. Licenza di riuso non accertata.

## Accessi ancora non ottenuti

Morera 2024, DOI 10.1016/j.ecoinf.2024.102557: abstract verificato, ma rivista/PDF e copie UdL/TDX restituiscono errori o access denied. Non presento sezioni indicizzate come full text letto. Per Karavani 2018 ho individuato l'accepted manuscript UdL, senza riuscire ad aprirlo. Il registro conserva gli URL. Gli ulteriori accessi sono nel registro e nelle letture su satellite e machine learning.

## Applicazione proposta

Le cinque letture suggeriscono un benchmark concreto: modello semplice climatico, modello gerarchico a due parti e Random Forest/boosting, confrontati su siti e condizioni climatiche esclusi dall'apprendimento. Per ogni cella nuova Fronda può produrre una stima iniziale da covariate e luoghi analoghi; pooling e osservazioni locali la aggiornano. La somiglianza ambientale e la calibrazione indicano quanto fidarsi della percentuale. La validazione non rende impossibile il cold-start: permette di quantificare e migliorare l'affidabilità.
