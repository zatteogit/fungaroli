# Conferma sul 2026 dell'indice 2.2.0 (preregistrazione)

Scritta il 24 ottobre 2026, **prima di cambiare il modello e prima di scaricare qualunque dato del 2026**. Documenti
di partenza: `preregistrazione.md` (Lazio), `preregistrazione-italia.md` (Italia) e `deviazioni.md` (D1–D22), qui
«protocollo 2023–2025».

**Decisioni di Matteo del 24/10/2026**, prese dopo aver letto i risultati della prova 2023–2025 (README):
1. Dal modello si toglie **solo** il bonus dello shock termico del suolo (porcino e porcino rosso): Q4 lo ha dato
   nullo, entro ±0,01. L'umidità del suolo resta: da sola non distingue i giorni di ritrovamento, ma nel prodotto con
   pioggia e temperatura non è dimostrato che sia inutile.
2. L'app presenta l'indice come guida di stagione: dice bene il periodo, sul giorno preciso il meteo aiuta poco e non
   è ancora dimostrato.
3. Il modello nuovo si giudica su dati che nessuno ha ancora visto: il 2026, con questo documento scritto prima.

**Regola.** Vale il protocollo 2023–2025, salvo quanto questo file cambia in modo esplicito. Dopo il commit questo
file non si modifica: ogni cambiamento va in `deviazioni.md`, con data e motivo, prima di scaricare i dati del 2026.

Legenda: **Fatto verificato**, **Interpretazione**, **Ipotesi**.

## 1. Che cosa è già stato guardato

Tutto il 2015–2025: la prova 2023–2025 è completa (README, `esiti-riepilogo.json`), e la priorità 5 (quote
2015–2025) è in corso. **Nessun dato del 2026** (osservazioni o meteo) è stato scaricato per la prova. L'app ha
mostrato indici del 2026 agli utenti, ma nessuno li ha confrontati con ritrovamenti.

Le modifiche di questo documento vengono dai risultati 2023–2025: per questo la loro verifica si fa solo sul 2026.

## 2. Modello in prova: 2.2.0

- **2.2.0 = 2.1.0 senza shock termico.** L'unica modifica: `soilShock` tolto da *Boletus edulis* e *B. pinophilus*
  in `js/species.js`, `MODEL_VERSION` portato a `2.2.0` in `js/model.js`. Nessun altro parametro cambia.
- Gli SHA-256 di `js/model.js` e `js/species.js` della versione 2.2.0 si registrano in `deviazioni.md` (D23)
  subito dopo l'unione nel ramo di produzione, prima di scaricare dati del 2026. `fattori.mjs` della conferma
  importerà quei file e il controllo 1 li confronterà.
- La prova 2023–2025 resta sul 2.1.0: `valuta.py` usa la copia congelata in `modello-2.1.0/`, con gli stessi SHA-256
  preregistrati (D23).

## 3. Dati e periodo

- **Periodo dei casi e dei controlli:** 01/01/2026–31/12/2026, Italia, stesse 14 specie, filtri, deduplica, celle,
  macro-aree e fasce di quota del protocollo 2023–2025.
- **Scaricamento delle osservazioni:** non prima del **31/03/2027**, per lasciare tempo alle identificazioni
  *research grade* di consolidarsi (2.3 del documento del Lazio).
- **Meteo:** Historical Forecast API di Open-Meteo, `icon_seamless`, stessa richiesta e stessi controlli di
  completezza e disponibilità. Ritmo dello scaricamento come D16 e D22.
- **Climatologia (2):** costruita sui ritrovamenti 2015–2025, cioè su tutti gli anni prima del 2026.

## 4. Domande e verdetti

Stesse metriche (AUC abbinata), stessi tre bootstrap per cluster (cella, osservatore, regione × anno), stessa regola
di verdetto (D4: tutti e tre gli intervalli dalla stessa parte dello zero) e stessi δ.

| Domanda | Che cosa | Ruolo |
|---|---|---|
| Q1 | AUC(1) − 0,5, tutte le specie | **principale** |
| Q2 | AUC(1) − AUC(0): il meteo aggiunge qualcosa alla sola stagione? | preregistrata |
| Q3 | AUC(1) − AUC(2): meglio della climatologia 2015–2025? | preregistrata |
| Q1 porcino, Q1 chiodino | le due specie con verdetto positivo nel 2023–2025 | preregistrate, Holm su 2 |

- **Q4 non si ripete:** lo shock non è più nel modello.
- **Le altre specie:** Q1, Q2 e Q3 per specie sono descrittive, senza verdetto.
- **Secondarie preregistrate:**
  - le stesse del protocollo 2023–2025;
  - **in più**, l'analisi «stesso osservatore / altri osservatori» (D21, punto 15), che nel 2023–2025 era
    esplorativa: qui diventa secondaria, con gli stessi intervalli.
- **Componenti (S-COMP):** si ripetono, umidità del suolo compresa, per decidere poi se tenerla.

## 5. Che cosa faremo con gli esiti (scritto prima)

Interpretazione, non vincolo: ogni modifica dell'app resta una decisione di Matteo.

- **Q1 positiva:** l'indice 2.2.0 ordina i giorni meglio del caso anche su un anno nuovo. Il testo dell'app resta
  «guida di stagione».
- **Q1 non distinguibile:** con meno casi è possibile anche se l'effetto c'è (sezione 6). Non si toglie l'indice per
  questo solo esito; si riferisce l'esito com'è.
- **Q2 positiva:** è la prima prova che il meteo aggiunge qualcosa alla stagione. Solo allora l'app potrà dire che
  l'indice aiuta a scegliere il giorno.
- **Q2 di nuovo non distinguibile:** il testo resta com'è.
- **Umidità del suolo:** se in S-COMP resta vicina a zero anche nel 2026, si propone di toglierla nel modello
  successivo, con una nuova preregistrazione.

## 6. Limiti dichiarati prima

- **Un anno solo.** Interpretazione: se il 2026 avrà circa un terzo dei casi del 2023–2025 (circa 330), gli
  intervalli di Q1 saranno larghi circa ±0,04 invece di ±0,025. Un effetto come quello del 2023–2025 (+0,066)
  resterebbe distinguibile; uno più piccolo potrebbe non esserlo. Q1 per specie avrà poca potenza.
- **Stesse debolezze del 2023–2025:** solo presenze, osservatori di iNaturalist e GBIF non tipici, prevalenza del
  Nord, effetto di chi esce e quando.
- **Le uscite a vuoto del Taccuino** (campi «La tua ricerca» e consenso alla ricerca) non entrano in questa conferma: sono poche e
  hanno un'altra struttura. Si analizzano a parte, con un documento loro.
