# Gerarchia della scheda uscita

Revisione del 27 ottobre 2026, shell v378. I paragrafi sulle v377 conservano lo storico della prima rifinitura.

La scheda segue il percorso di lettura: luogo → scelte → giorno e condizioni →
piano dell’uscita → preparazione → osservazioni condivise e approfondimenti.

## Prima della partenza

- La copertina identifica luogo e data.
- Il riepilogo chiuso mostra interessi e vincoli in una riga. «Modifica» apre
  gli stessi filtri della home. L’icona info apre selezione completa, significato
  del numero, fungo guida e conteggi delle specie senza indice. Un conteggio
  diagnostico non occupa più un paragrafo prima del piano.
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

## Rifinitura v377

Calendario e corpo della scheda condividono un bordo continuo, senza due angoli
arrotondati a contatto. «Dati per partire» è un breve passaggio documentale prima
del piano: valori in due colonne quando c’è spazio, righe etichettate sul telefono,
nessuna seconda card in evidenza. I dati mancanti e il limite sull’apertura degli
accessi restano visibili integralmente. Il link sul fungo guida usa l’icona info.

Il taccuino condiviso usa una superficie verde tenue e un accento discreto. Prima
stato o riepiloghi effettivamente disponibili, poi azioni e una cautela visibile:
le osservazioni sono dichiarate, non confermano la presenza attuale e i punti GPS
restano privati. «Dati e privacy» raccoglie senza eliminarli periodo, indipendenza
dai filtri dell’uscita, soglie, separazione dei conteggi e spiegazione completa.
Accesso, campi degli aggregati, soglie e calcoli restano invariati.

## Revisione v378 · priorità del contenuto

La pipeline è in [content-review/README.md](content-review/README.md). Il primo
lotto riduce il preambolo: foto di contesto più breve, riepilogo in 61 px nel caso
Allumiere, calendario compatto, meteo e condizioni affiancati. «Percorso e accessi»
mostra subito lo stato della documentazione e apre i dettagli nello stesso punto.
L’incertezza sulla raccolta ha un richiamo breve; divieti e limitazioni esplicite
rimangono completi. I testi di fonte, le selezioni e gli avvisi non sono eliminati.

Il conteggio diagnostico delle specie senza indice è ora sotto info: questa
scelta supera la precedente esposizione in chiaro del conteggio. L’indice assente
non diventa zero e gli avvisi sull’impossibilità di calcolare restano distinti.
