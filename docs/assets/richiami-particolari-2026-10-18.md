# Richiami ai particolari nel confronto

Le righe Anello, Volva e Reticolo sul gambo riusavano la stessa illustrazione: mancava un riferimento visivo alla zona di cui parla il testo.

Si aggiunge un piccolo richiamo esterno fra il bordo della zona e il valore testuale. È un SVG separato nel DOM, senza filtri, maschere, ritagli, ricolorazione o modifiche del file raster. Le coordinate indicano dove osservare anche quando il carattere è assente: non affermano che lì sia presente un organo. La nota della vista esplicita questa lettura quando almeno una freccia è visibile.

Gli ancoraggi sono scelti manualmente sui singoli raster di base, in coordinate 128×128, con prima revisione dell'agente `illustration_corrections` e seconda ispezione delle cinque tavole da parte dell'integratore. La revisione ha corretto anche il primo punto dell'anello di Amanita caesarea, inizialmente troppo basso: non si riusano posizioni standard per tutta una famiglia. L'anello basso di Coprinus comatus richiede un punto specifico. In assenza di un gambo distinguibile, o di un dato documentato, il punto è nullo.

L'indice `data/trait-callouts.json` lega ogni serie al percorso e all'hash del raster revisionato. Il test confronta hash, campo documentato e coordinate valide: sostituire l'immagine richiede rivedere gli ancoraggi. I file di varianti non revisionate non ereditano le coordinate del disegno di base. Quando il selettore cambia il file, il vecchio richiamo sparisce; un errore di caricamento non fa puntare il richiamo a un altro raster.

Verifiche: disegni intatti e frecce indipendenti; testi di presenza e assenza conservati; due larghezze mobili (320/390 px) senza overflow; cambio del colore del cappello senza riuso degli ancoraggi su sagome non revisionate. Nessun nuovo dato anatomico e nessuna nuova immagine di specie sono stati prodotti per questa annotazione dell'interfaccia.

Consegna integrata: commit `6eedf9b` del ramo `images/plant-species-corrections-2026-10-18`, 88 raster di base ispezionati, 251 ancoraggi utilizzabili e 13 null (7 dati ignoti, 6 zone non rappresentate in Fistulina hepatica e Pleurotus ostreatus). Relazione indipendente e proposta completa con riferimenti ai dati nella cartella omonima. Tutte le cinque anteprime finali sono state riesaminate dall’integratore prima di importare le coordinate.
