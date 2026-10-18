# Revisione delle illustrazioni botaniche · 18 ottobre 2026

Problema verificato: le illustrazioni dei valori della chiave guidata erano state riusate nelle schede come rappresentazioni delle specie. Il cinorrodo sezionato non rappresenta la fragolina; la foglia composta pennata non ne rappresenta le tre foglioline dentate. Non è un errore dei dati botanici.

## Correzioni integrate

- Fragolina: raster nuovo del falso frutto intero con acheni esterni e raster nuovo della foglia trifogliata dentata. Originali `source.png` e `leaf-source.png`, prompt esatti nei due file di testo di questa cartella. Generazione `image_gen`, poi revisione indipendente dell'agente `illustration_corrections`, normalizzazione meccanica e verifica finale dell'integratore anche a 64 px.
- Il fiore generico a cinque petali bianco-crema è stato valutato pertinente come dettaglio della fragolina e registrato esplicitamente per questa specie.
- Nelle schede i colori del fiore e del frutto sono campioni cromatici accompagnati dal testo, senza una forma generica di bacca o fiore.
- Forme dei fiori, tipi dei frutti e foglie composte richiedono ora una scelta revisionata per specie nell'indice `plant-trait-icons.json`. In assenza di revisione resta il testo completo. Le icone di categoria della chiave guidata rimangono esempi schematici.

Il controllo indipendente ha respinto anche il cinorrodo come raffigurazione della rosa canina e l'ombrella a fiori bianchi come raffigurazione del finocchietto. Altri riusi problematici: capolino vs anemone, legume vs siliqua, soffione vs achenio con resta, capsule generiche vs frutti spinosi o lobati. La presenza di un asset non ne dimostra la correttezza per ogni specie: il rapporto automatico di completezza verifica l'esistenza, non l'anatomia. L'agente prosegue le correzioni raster nel proprio ramo; nessuna approvazione estesa alle immagini non ancora revisionate.

## Fonti e licenza

Fragaria vesca L. subsp. vesca, dati già presenti in `data/plants.json`: tre foglioline dentate, cinque petali bianchi, falsi frutti rossi con acheni superficiali. Fonte: [Università di Trieste, Flora di Roma](https://dryades.units.it/Roma/index.php?id=2073&procedure=taxon_page).

Riferimento fotografico del frutto: `assets/plants/fragolina-1.webp`, Andrea Moro / Dipartimento di Scienze della Vita, Università di Trieste, CC BY-SA 4.0; [originale](https://dryades.units.it/dryades/plants/foto/IMG1452JPG1593600975.jpg). L'agente ha confrontato entrambi i candidati con le tre foto della specie già in catalogo. Per la foglia la generazione usa la descrizione documentata e l'icona generica soltanto come riferimento di stile. Licenza delle nuove illustrazioni: CC BY-SA 4.0, autore Fronda, generate con AI e revisionate dal progetto.

Limiti: sono dettagli schematici, non fotografie né uno strumento di identificazione. Portamento, altezza e rosetta restano diagrammi della categoria, senza approvazione della silhouette integrale della specie.

Per tutti gli agenti: raster → revisione severa/correzione raster → vettore. Questi due raster non sono ancora stati convertiti in SVG.
