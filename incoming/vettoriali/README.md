# Studio SVG a livelli · 18 ottobre 2026

**Pronto come prototipo tecnico, fuori dall’app.** Un solo soggetto: Tignosa di primavera (`amanita-verna`), variante crema + emisferico. Nessuna integrazione negli asset pubblicati e nessuna conversione in serie ancora approvata.

## Cosa contiene

| File | Contenuto |
|---|---|
| `prototipo-amanita-verna/source.png` | Ritaglio del raster generato e revisionato con il metodo delle tavole 3×3 |
| `trace-input.png` | Raster normalizzato per il ricalco: alfa ≥220 e tavolozza di 16 colori |
| `trace-clean.svg` | Ricalco VTracer: 23 tracciati, nessuna immagine incorporata |
| `regions.json` | Regioni anatomiche annotate manualmente, variante e provenienza con hash della tavola |
| `amanita-verna-semantic.svg` | 5 gruppi SVG modificabili: cappello, lamelle, gambo, anello, volva |
| `semantic.json` | Metadati presenti anche nel tag `<metadata>` dell’SVG |
| `verification.json` | Risultati delle verifiche riproducibili |
| `inspector.html` | Confronto raster/SVG, livelli attivabili, prova di colore e download |

Il raster completo di origine resta nel ramo `images/missing-comparison-2026-10-18`, percorso e hash sono registrati in `regions.json`. Licenza dichiarata nella produzione raster: CC BY-SA 4.0, Fronda/Fungaroli. La fonte dei caratteri resta `data/species-traits.json`: l’SVG ne conserva l’hash e i valori documentati; non riscrive i dati biologici.

## Aprire e riprodurre

Dalla radice del repository:

```bash
python -m venv /tmp/fronda-svg-venv
/tmp/fronda-svg-venv/bin/pip install -r incoming/vettoriali/requirements.txt
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/build_semantic_svg.py incoming/vettoriali/prototipo-amanita-verna
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_semantic_svg.py incoming/vettoriali/prototipo-amanita-verna --output incoming/vettoriali/prototipo-amanita-verna/verification.json
python -m http.server 8796 --directory incoming/vettoriali
```

Aprire `http://127.0.0.1:8796/inspector.html`. Il verificatore richiede anche Inkscape nel PATH (verificato con Inkscape 1.4 (e7c3feb100)). Le dipendenze Python sono fissate in `requirements.txt`. VTracer è il pacchetto 0.6.15; il commento generato dalla libreria riporta internamente 0.6.12.

Esempio di modifica senza browser:

```bash
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/edit_semantic_svg.py incoming/vettoriali/prototipo-amanita-verna/amanita-verna-semantic.svg /tmp/amanita-bianca.svg --cap-color bianco --hide volva
```

Il comando modifica solo una copia dimostrativa. I colori devono appartenere ai valori documentati della specie **e** alla tavolozza attualmente implementata (`bianco`, `crema`). Per gli altri colori il comando fallisce: nessuna approssimazione silenziosa. Il bianco ottenuto programmaticamente non è una nuova tavola raster approvata. La modifica e la richiesta di revisione sono registrate nei metadati. Nascondere la volva serve a ispezionare un livello, non a creare una variante scientifica senza volva.

## Come sono fatti i livelli

Ogni gruppo ha ID stabile (`cap`, `hymenophore`, `stem`, `ring`, `volva`), nome italiano, riferimenti ai campi dei caratteri, titolo e descrizione. I tracciati distinguono materiale e contorno; l’editor conserva i contorni scuri quando modifica il colore. Gli ID e i metadati sono consultabili via XML/DOM. Inkscape riconosce i gruppi come livelli.

**È una partizione del ricalco, non una ricostruzione anatomica.** I 23 tracciati completi sono copiati nei 5 gruppi e ritagliati con regioni vettoriali annotate: 115 tracciati in totale. Modificare una parte significa agire sul gruppo e sulla sua clip, mantenendoli insieme. Spostare il gruppo sposta anche la regione; cambiare la geometria di una forma può richiedere di aggiornare la clip. Alcuni tracciati sottostanti contengono geometria di tutto il fungo, resa invisibile dal ritaglio. Non sono ancora sagome anatomiche indipendenti, né un modello morfologico parametrico.

SVG basta per livelli, descrizioni e manipolazione DOM. Un PDF può essere un’esportazione di stampa, ma non risolve la separazione anatomica e non sostituisce il master SVG.

## Fedeltà e limiti verificati

- Tutti e cinque i gruppi producono una regione visibile se isolati.
- Nessun `<image>` incorporato; solo tracciati e clip. ID unici, hash raster verificato, variante ammessa dai dati.
- Cambio crema → bianco: i tracciati di lamelle, gambo, anello e volva restano identici. Nel render nessun pixel fuori dalla regione del cappello cambia.
- Sovrapposizione della sagoma raster/SVG (IoU con alfa ≥128): **0,99406 a 128 px**, **0,99549 a 560 px**.
- Le regioni separate introducono differenze di antialiasing sulle giunzioni: rispetto al ricalco unico, differenze superiori a 12/255 su almeno un canale nel **1,818% dei pixel a 128 px** e **0,357% a 560 px**. Non promettiamo equivalenza pixel per pixel. Questi numeri misurano il render, non validano da soli l’anatomia.
- Il ricalco a 16 colori semplifica gradienti e piccoli riflessi del raster. La sorgente resta conservata per controllarli.
- L’annotazione è manuale e il risultato resta da approvare visivamente prima dell’uso nell’app.
- Il prototipo non prova ancora reticoli, squame, pori, forme a imbuto o strutture alveolate. Non li trattiamo come già risolti.

## Metodo prima della produzione in serie

1. Generare il raster con riferimenti approvati, dati documentati e prompt della produzione esistente. Revisionare anatomia, colore, trasparenza e celle; conservare prompt, revisioni e manifest.
2. Estrarre il singolo disegno mantenendo coordinate, cella e hash di sorgente. Non partire da una forma vettoriale inventata indipendentemente.
3. Ricalcare e confrontare con il raster alle dimensioni reali di uso. Conservare il ricalco unico come riferimento.
4. Annotare le parti sul disegno specifico. Solo i caratteri documentati diventano parametri; `null` rimane sconosciuto. Distinguere disegno visibile, dati documentati e parametri realmente modificabili.
5. Verificare ogni livello isolato e le giunzioni, sia insieme sia dopo le modifiche. I colori non devono attraversare lamelle, pori o gambo.
6. Prima di estendere ai 6 casi di forma e alle 191 combinazioni della coda raster, provare almeno un fungo con reticolo/pori e uno con struttura diversa (per esempio morchella). Per ogni disegno segnare separatamente: raster pronto, ricalco pronto, regioni annotate, revisione visiva, controlli automatici, approvazione.
7. Automatizzare ricalco, hash, metadati e verifiche. Riutilizzare regioni soltanto quando la geometria del raster è realmente uguale e verificata. La generazione di tavole diverse non garantisce coordinate anatomiche identiche.

La coda raster rimane la fonte dei candidati in produzione (`incoming/produzione-2026-10-18/coda-combinazioni.json` sul ramo raster). Nessun candidato è dichiarato SVG pronto per il solo fatto che il suo raster esista. Il risultato disponibile qui è **un prototipo a cinque parti**, non 197 illustrazioni convertite.
