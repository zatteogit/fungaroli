# SVG descritti e modificabili · checkpoint del 18 ottobre 2026

**Disponibili: due disegni vettoriali revisionati di Porcino di fiele (`Tylopilus felleus`), variante crema + piano + pori rosa.** Un cappello isolato e un fungo intero. Restano fuori dall’app; non equivalgono alla conversione completa del catalogo.

Aprire `inspector-v2.html` tramite server HTTP per confrontare raster e SVG, isolare i livelli, provare colori documentati e scaricare una copia modificata. Il primo prototipo di Amanita rimane consultabile come storico, con clip e senza la successiva revisione indipendente per specie: non va contato come nuovo SVG pronto per produzione.

## Raster prima del vettore

Il vecchio raster etichettato «crema + piano» mostrava un cappello ocra convesso. È stato respinto per incongruenza semantica, senza promuoverne i ricalchi. `raster-rejections.json` registra hash e celle da bloccare.

La nuova tavola `revisioni-raster/tylopilus-crema-piano-r03.png` è stata generata con il metodo raster classico, dai caratteri e dalle fonti della specie. Si conservano i prompt delle tre iterazioni, ma soltanto il PNG selezionato: r01 aveva formato errato, r02 una forma ancora troppo convessa. `review.json` registra la revisione indipendente del raster **prima** della conversione: cappello crema spianato coerente fra i due disegni, pori rosa puntiformi, gambo clavato con reticolo bruno grossolano, assenza di lamelle, anello e volva. Anche la miniatura a 64 px è stata esaminata.

Le note preliminari nel registro sono storiche: lo stato finale è `independent_review.status`. Schema illustrativo di una variante documentata, non ritratto diagnostico o identificazione. La revisione dei valori generici e quella della specie restano distinte.

## Geometria realmente disponibile

| Campione | Parti | Geometria visibile |
|---|---|---|
| `campione-tylopilus-felleus` | cappello, pori, gambo, reticolo | 11 path + 18 ellissi |
| `campione-tylopilus-cappello` | cappello, pori | 6 path + 21 ellissi |

Nessun bitmap incorporato, clip, maschera o copia completa nascosta del fungo. Ogni gruppo è un livello Inkscape, con ID stabile, nome italiano e riferimenti ai campi del catalogo. Le regioni anatomiche sono annotate manualmente sul raster specifico; le intersezioni booleane producono i contorni reali delle singole parti.

Il reticolo è estratto dai pixel del raster entro la regione del gambo annotata, poi controllato isolatamente. **Non è riconoscimento automatico dell’anatomia.** Le ellissi dei pori sono adattamenti geometrici confrontati uno a uno con i segni della sorgente. I loro conteggi descrivono il disegno, non la densità biologica dei pori.

Sotto il reticolo c’è una campitura crema ricostruita dalla tinta visibile del gambo, esplicitamente marcata nei metadati: il raster non mostra il tessuto coperto. Nascondere la rete serve all’ispezione e non produce una variante scientifica senza reticolo.

Le campiture uniformi e la riduzione delle sfumature sono una semplificazione grafica dichiarata. Il cappello isolato usa il ricalco poligonale: evita una diagonale estranea prodotta dalla spline, ma mostra piccoli gradini a forte ingrandimento. Non è un modello morfologico parametrico: per cambiare forma serve un altro raster corretto e revisionato. Colori alternativi e visibilità sono prove tecniche, non nuovi asset approvati.

## Revisioni e verifiche

Ogni cartella conserva `source.png`, ricalco, regioni, piano di campiture, SVG, metadati, `svg-review.json` e `verification.json`. La seconda revisione indipendente ha confrontato direttamente l’SVG a 64 px con il raster r03: pori, reticolo e forma conservati, nessun carattere estraneo introdotto. La revisione è legata all’hash del crop e all’impronta della geometria e delle campiture: una modifica la rende non più applicabile.

I controlli automatici verificano hash, valori documentati, parti non vuote, assenza di bitmap/clip e modifiche confinate alla parte. Il colore del cappello non passa nei pori o nel gambo; il cambio del colore dei pori raggiunge anche tutte le ellissi. Nascondere il reticolo non lascia nuovi buchi trasparenti. Colori o parti non ammessi vengono respinti.

| Disegno | IoU sagoma a 64 / 128 / 804 px | Errore RGB medio a 64 / 128 / 804 px, scala 255 |
|---|---|---|
| Intero | 0,9651 / 0,9815 / 0,9838 | 10,81 / 9,28 / 8,70 |
| Cappello | 0,9628 / 0,9905 / 0,9959 | 7,26 / 6,96 / 7,66 |

Le metriche misurano fedeltà grafica e contenimento delle modifiche, non correttezza anatomica: quest’ultima richiede la revisione registrata. Le soglie tollerano antialiasing e semplificazione, non nuovi tratti biologici.

## Riprodurre il checkpoint

Dalla radice del worktree, con Python 3.12 e Inkscape 1.4 nel PATH:

```bash
python -m venv /tmp/fronda-svg-venv
/tmp/fronda-svg-venv/bin/pip install -r incoming/vettoriali/requirements.txt
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/build_reviewed_scene.py incoming/vettoriali/campione-tylopilus-felleus
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_reviewed_scene.py incoming/vettoriali/campione-tylopilus-felleus --output incoming/vettoriali/campione-tylopilus-felleus/verification.json
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/build_reviewed_scene.py incoming/vettoriali/campione-tylopilus-cappello
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/verify_reviewed_scene.py incoming/vettoriali/campione-tylopilus-cappello --output incoming/vettoriali/campione-tylopilus-cappello/verification.json
python -m http.server 8796 --directory incoming/vettoriali
```

Aprire `http://127.0.0.1:8796/inspector-v2.html`. Dipendenze fissate: VTracer 0.6.15, Pillow 13.0.0, NumPy 2.5.4, skia-pathops 0.9.2, fontTools 4.60.1. Le versioni disponibili sono registrate in `requirements.txt`; il commento interno di VTracer può riportare 0.6.12.

```bash
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/edit_semantic_svg.py incoming/vettoriali/campione-tylopilus-felleus/tylopilus-felleus-semantic.svg /tmp/tylopilus-prova.svg --cap-color bruno --hymenophore-color bianco --hide reticulum
```

Questa copia dimostrativa richiede nuova revisione visiva. Lo SVG conserva variante, tratti, fonte, hash, annotazioni e provenienza; il catalogo biologico non viene modificato.

## Coda e prosecuzione

`coda.json` è un inventario riproducibile di **fonti candidate**, non un conteggio di SVG finiti. Pubblicazioni e nuove tavole possono rappresentare varianti sovrapposte. Snapshot: 880 derivati fungini, 49 alberi, 402 disegni nelle nuove tavole fungine, 51 caratteri generici di piante, 2 disegni nel master locale revisionato: **1.384 voci di fonte**. Le quantità dei worktree in produzione cambiano; rigenerare l’inventario prima di pianificare un lotto.

Solo i due nuovi SVG sono qui legati a una revisione indipendente raster e vettoriale. I 929 derivati richiedono il master ad alta risoluzione; 451 nuove fonti richiedono la revisione indipendente per questa pipeline; 2 fonti note sono respinte e sostituite da r03. Lo stato «pronto» della produzione raster non costituisce da solo una revisione anatomica per SVG. Ricalchi esplorativi non revisionati non sono inclusi nella consegna.

```bash
/tmp/fronda-svg-venv/bin/python incoming/vettoriali/tools/prepare_queue.py --raster-root /workspace/fronda-image-production --plant-root /workspace/fronda-plant-production
```

Per ogni nuovo disegno: raster corretto → revisione severa del valore e della specie → ritaglio con hash → ricalco → annotazione delle parti e dei dettagli → controllo isolato e a 64 px → revisione indipendente SVG → verifica delle modifiche. `trace_queue.py` rifiuta fonti senza revisione esplicita legata all’hash; la coda non promuove automaticamente nessuna tavola. Non propagare le regioni fra raster con sagome diverse. Reticoli, lamelle, squame e strutture alveolate richiedono annotazioni specifiche. Le piante vanno prima revisionate come raster, senza trasferire un simbolo generico a una specie incompatibile.

La consegna termina a questo checkpoint. Nessuna integrazione automatica nell’app e nessuna conversione in serie dichiarata completata. Il raster Tylopilus corretto è disponibile per un import separato; questa branch non modifica gli asset pubblicati.

## Produzione autorizzata successiva · otto candidati SVG

Dopo il checkpoint di Tylopilus sono stati prodotti altri **8 SVG da raster già revisionati**, conservando separata l’approvazione del nuovo vettore:

- [Primo lotto botanico](botanici-lotto-01/README.md): fragolina foglia/frutto, finocchietto ombrella, rosa cinorrodo. Quattro master specifici, livelli anatomici annotati, manifest/hash e inspector.
- [Secondo lotto russule](virescens-lotto-02/README.md): cappello e intero rosa/violetto lisci della tavola r03 corretta; nessun mosaico trasferito alle alternative cyanoxantha.

Tutti gli otto hanno geometrie reali senza bitmap o clip, render a 64/128/656 px e prove di tinta confinata/parti isolate. **Stato: `svg-awaiting-coordinator-review`**, non automaticamente aggiunti ai due SVG revisionati precedenti. La revisione indipendente degli otto nuovi vettori resta del coordinatore. Nessuna sostituzione runtime o integrazione nell’app effettuata da questa produzione.

Verificati anche la rigenerazione esatta degli otto crop dai rispettivi master e due ricalchi rappresentativi riprodotti con hash identico (foglia a 16 colori e fungo intero da RGB diretto). Gli inspector dei due lotti hanno superato selezione di tutti i campioni, livelli, tinta tecnica, reset e temi chiaro/scuro senza errori JavaScript.

## Alleggerimento del prototipo Fragolina

La proposta in [ottimizzazione-fragolina-frutto](ottimizzazione-fragolina-frutto/README.md) riduce lo SVG del frutto da 1.452.053 a 576.986 byte (−60,3%), con ricalco riprodotto identico dal medesimo raster approvato. Restano gli stessi 885 path, colori, ID e parti: cambia soltanto la precisione di serializzazione, con scarto massimo di 0,05 px sorgente per componente. Confronti mirati a lato maggiore 64/128/656 px, originale e due ricalchi cromaticamente peggiori conservati. Stato ancora **proposta in attesa del coordinatore**; non è una nuova specie/variante SVG e non modifica il conteggio dei candidati o il runtime.
