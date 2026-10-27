# Gerarchia della scheda uscita

Revisione del 27 ottobre 2026, shell v376.

La scheda segue il percorso di lettura: luogo → scelte → giorno e condizioni →
piano dell’uscita → preparazione → osservazioni condivise e approfondimenti.

## Prima della partenza

- La copertina identifica luogo e data.
- «Alla ricerca di…» riassume interessi, specie e vincoli pratici; «Modifica» apre
  gli stessi filtri della home. La spiegazione del fungo che guida l’indice è
  espandibile nello stesso punto. Le specie scelte senza indice restano segnalate
  anche a spiegazione chiusa.
- Il calendario precede gli indicatori: cambia il giorno dei dati mostrati subito
  sotto. Restano distinti condizioni generali, meteo e potenziale delle specie.
- Nel percorso con indice disponibile, «Il piano in breve» introduce sentiero,
  cosa osservare, quando e come arrivare. La documentazione mancante e le cautele
  restano leggibili; nessun riordino cambia dati, filtri, calcoli o raccomandazioni.
- I percorsi Piante / Sentieri e il ripiego senza indice conservano gli stessi
  controlli iniziali e mostrano le informazioni effettivamente disponibili.

## Strumenti senza ingombrare il piano

«Per il bosco» viene dopo il piano e prima del taccuino condiviso. Mostra subito
«Salva offline»; «Altri strumenti» contiene archivio, schermo acceso e avvisi meteo.
Il testo sui limiti degli avvisi precede il comando di attivazione. Nessun permesso
è richiesto aprendo la sezione. Uno stato attivo rimane leggibile nel riepilogo
anche dopo averla richiusa.

Durante il salvataggio il progresso rimane visibile. A copia pronta compare il
collegamento diretto e il comando diventa «Aggiorna copia». I contenuti e le regole
originali del pacchetto offline restano gli stessi; il profilo non è necessario.

## Stabilità della pagina

Il foglio del contenuto non si sovrappone più alla testata dell’uscita: la vecchia
sovrapposizione di 24 px era adatta alla foto ma copriva il riepilogo quando gli
indicatori non c’erano. Gli indicatori riservano spazio alle proprie didascalie.

Gli approfondimenti secondari marcati `data-weather-preserve-open` mantengono la
scelta di apertura durante gli aggiornamenti dei dati. Gli strumenti sono legati
alla coppia zona/giorno: cambiando contesto si ricostruiscono chiusi. Gli accordion
principali conservano esclusività, animazione e mantenimento del punto di lettura.

## Verifica

`tests/browser/outing-layout.spec.mjs` copre cinque combinazioni di interessi e
meteo, larghezze 320/390/768/1280 e temi chiaro/scuro. Controlla che filtri, giorni,
indicatori e didascalie non si coprano, che il pannello compatto non debordi e che
filtri, giorno, disclosure e salvataggio restino utilizzabili.

Wake lock e prontezza del service worker usano fixture esplicite nel test degli
strumenti; archivio IndexedDB e Cache API sono reali. Nessun invio di notifiche o
richiesta di permesso a utenti reali viene eseguito da queste verifiche.
