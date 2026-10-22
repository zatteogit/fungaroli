# Mappa su mobile: sentieri e riquadri (22 ottobre 2026)

Revisione nata da una segnalazione di Matteo: a 390 px non si vedevano i sentieri né il dettaglio delle microzone. Catture fatte sull’app locale con il tocco (390 × 844), senza tessere topografiche: sentieri e riquadri sono vettoriali e si vedono comunque.

## Cause trovate nel codice

| Problema | Causa |
| --- | --- |
| Con Funghi i sentieri comparivano solo con la zona scelta | Disegnati solo per la zona selezionata con una specie migliore; la X della scheda azzerava la selezione e li toglieva. Con Sentieri invece comparivano da zoom 11,5 per tutte le zone. |
| Sentieri poco leggibili anche con la zona scelta | Erano nel livello sotto i riquadri; i non consigliati grigi tratteggiati al 50% sopra un mosaico verde. |
| Cartografia nascosta | Riquadri con opacità 0,5–0,9 e base desaturata (`saturate(.4)`): il segnavia della carta spariva. |
| Dettaglio delle microzone poco scopribile | Al tocco serve scegliere la zona e poi il riquadro; nessun suggerimento, legenda dei colori solo in Livelli. |
| Imbocchi in Sentieri | Stile del parcheggio con ↗, nessun raggruppamento: decine di segni sovrapposti. |

## Decisione di Matteo (22/10)

Pacchetto «Buono». Con Funghi i sentieri compaiono da zoom 11,5 come con Sentieri; con una zona scelta quelli adatti alla specie restano in evidenza.

## Cosa cambia

- Sentieri in un livello proprio, sopra i riquadri e sotto i segni, con un bordo chiaro. Il consigliato resta in evidenza; gli altri a tinta piena. Con una zona scelta i tratti delle zone vicine si attenuano.
- Toccare un sentiero di una zona non scelta seleziona la zona; con la zona scelta apre la scheda del tratto, come prima.
- Riquadri con opacità 0,28–0,48 e base meno desaturata (chiaro `saturate(.7)`, scuro `saturate(.55) brightness(.75)`).
- In Livelli, «Sulla carta»: interruttori «Riquadri dell’habitat» e «Sentieri», ricordati nel browser (`fungaroli:map-layers:v1`). Selezione con il bordo giallo delle selezioni.
- Quando i riquadri sono in vista, sotto i filtri compaiono la scala dei colori e la frase «Habitat potenziale, non presenza · tocca una zona, poi un riquadro» (con la zona scelta: «tocca un riquadro»).
- In Sentieri gli imbocchi usano il segnavia della mappa dei funghi e la stessa regola dei 26 px con il conteggio («409 +1»). Toccare un gruppo avvicina la carta; un imbocco singolo apre ancora il giro.

Indice, soglie, dati e testi delle schede non cambiano.

## Pacchetto «Ideale» (decisione di Matteo, 22/10)

Approvato dopo il pacchetto «Buono».

**Scheda a tre altezze (fino a 760 px).** Zona, punto, sentiero e riquadro usano la stessa scheda dal basso:

| Altezza | Contenuto | Come ci si arriva |
| --- | --- | --- |
| Striscia (circa 84 px) | Giorno e nome, oppure navigazione e titolo del punto | Trascinare la carta, o la maniglia verso il basso |
| Metà (fino al 48% dello schermo) | Scheda completa come prima | Apertura di un contenuto nuovo; tocco sulla maniglia dalla striscia |
| Intera | Fino sotto la barra dei filtri | Maniglia verso l’alto o secondo tocco |

- La zona resta scelta in striscia: sentieri, imbocchi e riquadri restano sulla carta. Solo la X chiude e deseleziona.
- Lo stesso contenuto ridisegnato (meteo, livelli) conserva l’altezza scelta; un contenuto nuovo si apre a metà.
- Sopra i 760 px resta il pannello laterale di prima, senza maniglia.

**Riquadro nella scheda (fino a 760 px).** Toccando un riquadro della zona scelta il dettaglio entra nella scheda, con «‹ zona» per tornare indietro. Non c’è più un pannello sopra la carta, e il riquadro resta evidenziato. Un tocco fuori dai riquadri riporta alla scheda della zona. Sopra i 760 px resta il pannello sulla carta.

**Etichette raggruppate.** Le etichette si dispongono in ordine: prima la zona scelta, poi le condizioni migliori.
- Ognuna prova prima con il nome, poi con il solo indice.
- Se non trova posto, entra nel gruppo dell’etichetta che la copre («8,5  4 zone»: valore migliore del gruppo e numero di zone).
- Toccare il gruppo avvicina la carta almeno di un livello.
- Le etichette restano dentro lo schermo e si ridisegnano tutte insieme a ogni aggiornamento, anche quando il meteo arriva per parti.
- Vale anche per Piante e Sentieri, con il solo conteggio.

## Restano aperti

- In Sentieri toccare un imbocco cambia pagina, con Funghi apre una scheda sulla carta. Comportamento lasciato com’era.

## Verifiche

- `npm test`: 497 superati.
- Spec browser `map-experience`, `map-layers`, `map-popover`: 27 superati, 5 falliti. Gli stessi test (più uno a 390 px) falliscono anche sul ramo di partenza, in una copia separata: `.tab-search` assente, `[data-more]` assente su `#/mappa/tancia`, anteprima del riquadro al passaggio del mouse, fuoco dopo la chiusura del glossario. Non sono regressioni di questa modifica.
