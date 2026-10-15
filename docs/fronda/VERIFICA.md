# Verifiche — Fronda 1.1

Completate il 15 ottobre 2026 sul kit locale. Studio e prototipo sono separati dall’app pubblicata. Nessuna modifica o pubblicazione del repository Fungaroli.

## Fonti e contenuti

- Consultato il ramo di produzione `claude/brave-tesla-wu0a2b`, commit `44f1420e5bc08474428e1049cc9ce550799e9bf0`. Checkout delle fonti pulito dopo la consultazione.
- Inventario: 15 zone, 70 piante, 39 alberi, 88 record tassonomici fungini, 14 specie con modello, 46 voci del selettore, 47 termini e 3 guide. Le categorie non sono intercambiabili; i contenuti CMS possono differire dallo snapshot Git.
- Prototipo: selezione di 12 schede, tutte le 15 zone, 3 guide e 47 voci del glossario ricercabili. Per leggibilità, il glossario mostra fino a 12 corrispondenze per ricerca.
- Dati incorporati nel prototipo corrispondenti a `content.json`; provenienza, hash e attribuzioni nei file delle fonti.
- Fotografie delle specie e delle zone copiate dal repository senza ritocco, con crediti. Base cartografica e coordinate dal repository. Nessuna foto diagnostica generata.
- Meteo e indice non collegati: valore assente rappresentato da «—». L’esempio 7,2 nella guida è esplicitamente fittizio e tipografico.

## Marchio e materiali

- Master C / Lobata: pochi lobi ampi, senza dentellature aggiunte. La forma vettoriale conserva la lettura foglia / sentiero / pennino.
- Composizioni orizzontali, verticali e icone app usano il master comune; testi dei template SVG in tracciati.
- Manrope e Fraunces locali, con licenze SIL OFL.
- Riferimenti Another Escape / Extract Studio, Kew / Pentagram e Lowe Alpine / Edna documentati: sono materiali di analisi, non asset di produzione Fronda.
- Tavole imagegen usate per atmosfera; geometrie e colori esatti sono definiti da SVG e token.

## Controlli automatici

- Token JSON e CSS generato allineati.
- 92 primitivi consumati, 122 token pubblici; nessun riferimento mancante, ciclo o primitivo orfano.
- Guard applicato a 7 file HTML/CSS/JS del kit: nessun colore letterale o accesso diretto a primitivi fuori dalla fonte consentita.
- 22 coppie di contrasto nei due temi, 44 verifiche con soglia 4,5:1. Non è una certificazione completa WCAG.
- 8 prove del guard: caso valido, colore letterale, bypass privato, token mancante, ciclo, contrasto insufficiente, regressione del contrasto acceso, primitivo orfano. Esiti attesi ottenuti.
- Risorse locali, ancore e ID univoci della guida e del prototipo verificati.

## Prototipo nel browser

- Ricerca «porcino»: una scheda corrispondente. Cataloghi funghi, piante e alberi raggiungibili.
- Scheda contestuale dalla zona: mantiene l’indirizzo della zona; Esc chiude e restituisce il focus al collegamento d’origine.
- Mappa: 15 punti collegati alle rispettive zone; proiezione delle coordinate sui limiti geografici della base.
- Tre guide navigabili; ricerca nel glossario verificata con «micorriza».
- Appunto: titolo obbligatorio, salvataggio locale, permanenza dopo ricaricamento, esportazione JSON.
- Cancellazione: annullamento con Esc mantiene la pagina; conferma la elimina dalla sola anteprima.
- Uscita: sei passaggi, obbligo di indicare le specie effettivamente cercate, distinzione memorizzata tra «zero» e «non annotato».
- Verificati 10 percorsi a 390, 768 e 1440 px, nei temi chiaro e scuro: nessuno scorrimento orizzontale del documento. Le strisce di categorie scorrono intenzionalmente al loro interno.
- Nessun errore JavaScript o risposta HTTP fallita durante i flussi verificati.
- Dati di prova rimossi; eventuali dati preesistenti nella chiave del prototipo ripristinati.
- Guida verificata a 390, 1024 e 1440 px senza scorrimento orizzontale del documento.
- Controllo visivo di copertina, palette, componenti, schermate mobile, scheda scura e mappa.

## PDF

26 pagine A4 orizzontali, esportate con font locali e fondi di stampa. Tutte le pagine renderizzate e controllate in due tavole d’insieme; pagina delle schermate mobile ricontrollata dopo la cattura finale. Nessuna pagina di continuazione orfana. Sezioni tra 459 e 688 px nell’area di stampa disponibile di circa 703 px.

## Limiti dello studio

- Sono definiti identità, fondazioni, componenti dimostrativi e contratti dei pattern. I servizi reali di meteo, account, offline, sincronizzazione e condivisione richiedono integrazione e verifica nell’app.
- Le note del prototipo restano su questo browser, in una chiave separata da Fungaroli; non sono un backup. Nella guida i moduli sono solo dimostrativi.
- La nuova navigazione riconcilia il recente handoff del progetto con la shell esistente: è una proposta documentata, non uno stato già rilasciato.
- Ricerca visiva documentale; nessun test comparativo di app installate e nessuna ricerca con utenti. Pubblico e personalità sono ipotesi di progetto dichiarate.
- Nessuna verifica legale della disponibilità del nome o del marchio; template di stampa nominali, senza abbondanze o profilo CMYK. Richiesta prova sul supporto effettivo prima di produzione.
