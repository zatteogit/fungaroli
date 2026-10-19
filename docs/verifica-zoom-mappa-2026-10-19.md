# Selezione delle zone sulla mappa · 19 ottobre 2026

## Problema osservato
Sul sito v241, selezionare Faete e Monte Cavo a zoom 14 imponeva zoom 12,5. Ogni selezione eseguiva fitBounds sull’intera zona, con lo stesso limite anche dopo uno zoom manuale.

## Comportamento aggiornato
- Dalla vista generale la selezione avvicina la zona, fino a zoom 14.
- La selezione non riduce mai uno zoom già scelto dall’utente.
- Al dettaglio sposta soltanto quanto serve per lasciare il punto toccato visibile. Un click sull’etichetta mantiene leggibile anche il nome.
- Misura scheda e controlli dopo l’aggiornamento del layout; considera la barra superiore e la scheda inferiore o laterale.
- L’inquadratura generale rimane un’azione distinta nell’elenco dei risultati.

## Verifiche manuali
Browser reale, dati GET del sito, senza suite di test. Controllati 390×844, 768×844/1000 e 1440×1000. Zoom 14 conservato alle tre larghezze; zoom 16 conservato; selezione ripetuta senza ulteriore movimento. Dalla vista generale a zoom 9 la zona viene avvicinata. Esaminate schermate prima/dopo; corretto anche il margine dell’etichetta rispetto ai controlli.

Schermate locali ignorate da Git: output/playwright/map-zoom-before.png e map-zoom-{390,768,1440}-final.png.
Controlli di sintassi JavaScript e spazi del diff completati. Nessun contenuto botanico o immagine candidata incluso in questo rilascio.
