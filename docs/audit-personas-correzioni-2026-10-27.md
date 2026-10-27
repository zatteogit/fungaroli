# Correzioni dell’audit per personas · 27 ottobre 2026

Riferimento: rapporto «Fronda-test-personas-approfondito» del 26 ottobre, verificato sulla versione v354. Matteo ha approvato F2, F1, F4, F6, collisioni della mappa e chiarimento della ricerca F5. Versione applicativa: v355.

## Comportamento

| Rilievo | Correzione |
| --- | --- |
| F2 · Confronto botanico | Le note dei gruppi con tre specie hanno coppie esplicite. Aglio orsino/colchico mostra solo le note relative a questa coppia, compresa la cautela sull’odore. Croco e gli altri confronti hanno collegamenti nominativi separati. Le note del gruppo restano nel percorso botanico di gruppo. |
| F1 · Dati per partire | Copertina, card e elenco della mappa indicano i dati pratici mancanti. La scheda distingue tratti mappati, arrivo in auto e informazioni da completare: raccordo, ritorno e tempo totale a piedi. Canneto dichiara subito che non ha sentiero e arrivo in auto documentati. |
| F4 · Modifica appunti | Ogni appunto si riapre nel modulo rapido, con o senza fotografia. I dettagli strutturati e la condivisione sono facoltativi e raggiungibili nello stesso dialog. Il passaggio fra moduli conserva la bozza, fotografia, osservazione e scelta di condivisione. Cambiare specie rimuove le fasi botaniche della precedente specie. I riferimenti delle note storiche restano selezionati anche se usano una rotta diversa dal catalogo attuale. |
| F6 · Domande | Il numero include le risposte «non lo so», come il riepilogo. Quattro risposte portano a Domanda 5; togliendone una, a Domanda 4. |
| F3 · Mappa | Dimensioni reali delle etichette, priorità alla zona scelta, limiti del viewport e ingombri dei controlli. Nelle aree dense alcuni nomi diventano badge compatti; se non c’è spazio il segnaposto cede spazio senza forzare sovrapposizioni. Cerchi e zone nell’elenco restano disponibili. Ricalcolo dopo spostamento, zoom, ridimensionamento e cambio dei controlli. Stessa regola per la mappa SVG. Letture e scritture del layout sono raggruppate. |
| F5 · Ricerca | Testi espliciti nella ricerca globale, nel percorso fungino e nel selettore del confronto: le parole possono corrispondere a caratteri diversi. «Volva assente» non seleziona il filtro Volva = assente. Il motore `matchSpecies` e il suo ordinamento rimangono invariati. |

L’indice, il modello, l’ordinamento delle uscite e le soglie scientifiche non cambiano. La disponibilità documentale non è un nuovo punteggio. Nessun parcheggio, collegamento, durata o ritorno è stato inventato; un punto di arrivo non certifica sosta o transito. Le informazioni botaniche sono riorganizzate a partire dai testi e dalle fonti esistenti, senza aggiungere caratteri scientifici.

`recognize-plants.json` è il dataset statico della chiave: i nuovi metadati `pairs` non sono una risorsa redazionale CMS. Schema dei caratteri, catalogo CMS e fonti delle schede sono conservati. Nuovi moduli inclusi nella precache; versione del service worker e metadato HTML sincronizzati.

## Verifiche

- `npm test`: 584 test superati, compresi tre nuovi controlli su coppie botaniche, disponibilità pratica e disposizione delle etichette.
- 11 casi della suite browser su mappa, note con/senza foto e modifica strutturata, con temi chiaro/scuro e larghezze 320/390/1280.
- Controlli browser delle sei correzioni a 320/390/768/1280: coppia botanica e relativi link, Canneto, collisioni e limiti delle etichette, spostamento e selezione, elenco delle zone, modalità senza indice e fallback SVG, risposte incerte e rimozione, ricerca testuale, conservazione della bozza e dei dati dopo salvataggio e ricaricamento.
- 9 controlli equivalenti in WebKit a 390 px, compresi mappa SVG e conservazione delle note con/senza foto.
- Verifica della scelta di condivisione fra moduli e dei collegamenti storici, con salvataggi simulati senza scritture API.
- Verifica visiva di confronto, dati pratici e mappa; schermate e risultati locali in `output/playwright/personas-fixes-20261027/`.
- `wrangler deploy --dry-run` e `git diff --check` superati. Rapporto asset: nessuna incoerenza fra dati e immagini, nessun disegno da rifare; le lacune preesistenti restano registrate.

I controlli locali usano previsioni simulate e profili ospite. Non sono una validazione botanica, micologica o sul terreno, né un nuovo test di pubblicazione delle osservazioni su un account reale.
