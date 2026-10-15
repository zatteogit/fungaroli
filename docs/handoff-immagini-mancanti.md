# Immagini mancanti — ordine di lavoro per l'agente immagini (15/10/2026)

**Per chi:** l'agente immagini (ChatGPT Work, progetto Fungaroli) che lavora sul ramo `gpt/immagini`. Solo file nuovi in `incoming/`, niente PR, niente file dell'app. L'integrazione la fa poi una sessione Claude sul repository.

**Regole:** quelle di `AGENTS.md` e dei brief citati sotto. Stile delle icone già approvate (`assets/traits/*.webp`, `assets/tree-traits/*.webp`): pochi colori piatti, contorno bruno scuro, fondo trasparente, nessun testo nell'immagine. Niente immagini generate al posto delle foto delle specie.

## Già consegnato (non rifare)

- 30 tavole delle icone dei funghi e 286 varianti di colore e forma (`incoming/icone/`): in produzione dalla v65.
- Gambo del coprino con l'anello (`incoming/icone/tavola-10-anello.png`): in produzione dalla v65.
- 7 tavole delle icone dei caratteri degli alberi (`incoming/icone-alberi/`): in produzione dalla v64.
- Copertine dei luoghi per stagione e meteo (`incoming/luoghi/`).

## Da fare, in quest'ordine

### 1. Un'icona degli alberi: foglia composta palmata

- **Cosa:** `leaf_type` = `composta_palmata` («Composta, foglioline a ventaglio»), il carattere dell'ippocastano.
- **Disegno:** una foglia con 5–7 foglioline allungate che partono tutte dallo stesso punto, in cima a un lungo picciolo; nello stile e alla stessa scala della tavola `incoming/icone-alberi/tavola-alberi-02.png` (la foglia composta pennata è il riferimento più vicino).
- **File:** `incoming/icone-alberi/tavola-alberi-08.png`, 1254×1254 px, griglia 3×3 con fondo trasparente, icona nella cella 0 e le altre celle vuote. Ogni disegno deve restare dentro la sua cella con margine: l'import rifiuta le tavole con disegni tagliati o a cavallo di due celle.
- **Manifest:** una riga in `incoming/manifest.json` con `tipo: "illustrazione"`, `soggetto: "alberi"`, `chiave: "leaf_type"`, `valore: "composta_palmata"`, `cella: 0`, `modello`, `prompt`.

### 2. Combinazioni colore + forma dell'amanita falloide

Nell'app colore e forma del cappello ora si scelgono insieme. Per *Amanita phalloides* ci sono il disegno base (verde, convesso), 4 colori sul convesso e 2 forme sul verde. Mancano le altre combinazioni: finché non arrivano, l'app mostra la forma scelta nel colore base con la scritta «Colore non ancora disegnato per questa forma».

- **Da disegnare:** colori `giallo`, `bianco`, `grigio`, `bruno` × forme `emisferico`, `piano` = 8 combinazioni, ognuna con le tessere `cappello` e `gambo` (16 disegni).
- **Come:** partire dalle tavole approvate delle varianti della falloide (stessa scala, stesso tratto). Cambiare solo forma e colore del cappello; gambo, anello e volva restano uguali.
- **File:** due tavole 3×3 con fondo trasparente (`incoming/icone/combinazioni-01.png`, `-02.png`), un disegno per cella, con margine.
- **Manifest:** una riga per disegno con `soggetto: "amanita-phalloides"`, `tessera`, `cella` e `variante: "colore:<colore>+forma:<forma>"` (es. `"colore:giallo+forma:piano"`).

### 3. Stadi di crescita: le forme del cappello

Il brief delle varianti (`docs/handoff-immagini-varianti.md`, punto 3) chiedeva una variante per ogni forma del cappello descritta dalle fonti: di solito le forme seguono l'età (emisferico o conico = giovane; convesso = intermedio; piano, a imbuto o ombrellato = adulto). Ne è arrivata una sola specie (la falloide). Mancano **116 forme per 80 specie**, ognuna con le tessere `cappello` e `gambo` (232 disegni).

- **Come:** stesso colore del disegno base; cambia la forma del cappello e, dove serve, le proporzioni del gambo coerenti con quell'età. Stile e scala delle tavole approvate.
- **File:** tavole 3×3 con fondo trasparente `incoming/icone/forme-NN.png`, un disegno per cella con margine (l'import rifiuta disegni tagliati o a cavallo di due celle).
- **Manifest:** una riga per disegno con `soggetto`, `tessera`, `cella` e `variante: "forma:<forma>"`.
- **Ordine:** prima le specie commestibili e i loro sosia mortali (amanite, lepiote, boleti), poi le altre.

| Specie | Forma del disegno base | Forme da disegnare |
|---|---|---|
| Agarico tigrino (`tricholoma-pardinum`) | convesso | piano |
| Agarico violetto (`nuda`) | convesso | piano |
| Amanita arrossante (`amanita-rubescens`) | convesso | emisferico, piano |
| Amanita crocea (`amanita-crocea`) | convesso | emisferico, piano |
| Boleto a piede rosso (`neoboletus-luridiformis`) | convesso | emisferico |
| Boleto baio (`imleria-badia`) | convesso | piano |
| Boleto bovino (`suillus-bovinus`) | convesso | piano |
| Boleto dal bel piede (`caloboletus-calopus`) | convesso | emisferico |
| Boleto pepato (`chalciporus-piperatus`) | convesso | piano |
| Boleto radicante (`caloboletus-radicans`) | convesso | emisferico |
| Boleto satana (`rubroboletus-satanas`) | convesso | emisferico |
| Cardoncello (`pleurotus-eryngii`) | convesso | imbuto |
| Champignon (`agaricus-bisporus`) | convesso | emisferico, piano |
| Chiodino (`mellea`) | convesso | piano |
| Chiodino senza anello (`armillaria-tabescens`) | convesso | piano |
| Clitocibe rivulosa (`clitocybe-rivulosa`) | imbuto | convesso, piano |
| Colombina dorata (`russula-aurea`) | convesso | emisferico, piano |
| Colombina verde (`virescens`) | convesso | emisferico, imbuto |
| Cornucopia (`pleurotus-cornucopiae`) | imbuto | convesso |
| Cortinario orellano (`cortinarius-orellanus`) | convesso | piano, conico |
| Cortinario rubello (`cortinarius-rubellus`) | conico | convesso |
| Cortinario tragano (`cortinarius-traganus`) | convesso | emisferico |
| Cortinario violaceo (`cortinarius-violaceus`) | convesso | piano |
| Craterello cenerino (`craterellus-cinereus`) | trombetta | imbuto |
| Craterello sinuoso (`pseudocraterellus-undulatus`) | imbuto | trombetta |
| Entoloma livido (`entoloma-sinuatum`) | convesso | piano |
| Falso chiodino (`hypholoma-fasciculare`) | convesso | piano |
| Falso gallinaccio (`hygrophoropsis-aurantiaca`) | imbuto | convesso |
| Finferla (`craterellus-lutescens`) | imbuto | trombetta |
| Finferlo (`cibarius`) | imbuto | convesso |
| Folliota spettabile (`gymnopilus-junonius`) | convesso | piano |
| Folliota squarrosa (`pholiota-squarrosa`) | convesso | piano |
| Fungo dell'olivo (`omphalotus-olearius`) | imbuto | convesso |
| Galerina marginata (`galerina-marginata`) | convesso | piano |
| Gambesecche (`marasmius-oreades`) | ombrellato | convesso |
| Gelone (`pleurotus-ostreatus`) | convesso | imbuto |
| Idnello di Peck (`hydnellum-peckii`) | piano | convesso, imbuto |
| Inocibi (genere) (`inocybe`) | conico | convesso |
| Laccaria ametistina (`laccaria-amethystina`) | imbuto | convesso, piano |
| Lardaiolo (`hygrophorus-latitabundus`) | convesso | piano, ombrellato |
| Lattario degli abeti (`lactarius-deterrimus`) | imbuto | convesso |
| Lepiota bruno-incarnata (`lepiota-brunneoincarnata`) | convesso | piano, ombrellato |
| Lepiota crestata (`lepiota-cristata`) | ombrellato | convesso, piano |
| Lepiota subincarnata (`lepiota-subincarnata`) | convesso | piano, ombrellato |
| Marzuolo (`hygrophorus-marzuolus`) | convesso | piano |
| Mazza di tamburo (`procera`) | ombrellato | emisferico |
| Mazza di tamburo arrossante (`chlorophyllum-rhacodes`) | ombrellato | emisferico, convesso |
| Mazza di tamburo velenosa (`chlorophyllum-venenatum`) | ombrellato | convesso |
| Micena pura (`mycena-pura`) | conico | convesso |
| Moretta (`terreum`) | conico | convesso, piano |
| Ovolo buono (`caesarea`) | convesso | emisferico, piano |
| Ovolo malefico (`amanita-muscaria`) | convesso | emisferico, piano |
| Pinarolo (`suillus`) | convesso | emisferico, piano |
| Pioppino (`cyclocybe-aegerita`) | convesso | emisferico, piano |
| Porcino (`edulis`) | convesso | emisferico |
| Porcino di fiele (`tylopilus-felleus`) | convesso | emisferico |
| Porcino estivo (`aestivalis`) | convesso | emisferico |
| Porcino nero (`aereus`) | convesso | emisferico, piano |
| Porcino rosso (`pinophilus`) | convesso | emisferico |
| Portentoso (`tricholoma-portentosum`) | ombrellato | convesso |
| Prataiolo (`agaricus-campestris`) | convesso | emisferico, piano |
| Prataiolo dei boschi (`agaricus-sylvicola`) | convesso | emisferico, piano |
| Prataiolo ingiallente (`agaricus-xanthodermus`) | convesso | emisferico, piano |
| Prataiolo maggiore (`agaricus-arvensis`) | convesso | emisferico, piano |
| Prugnolo (`calocybe-gambosa`) | convesso | emisferico, piano |
| Russula eterofilla (`russula-heterophylla`) | convesso | piano, imbuto |
| Russula olivacea (`russula-olivacea`) | convesso | piano, imbuto |
| Russula verderame (`russula-aeruginea`) | convesso | piano, imbuto |
| Sanguinello (`lactarius-deliciosus`) | imbuto | convesso |
| Sarcodon imbricato (`sarcodon-imbricatus`) | convesso | imbuto |
| Sarcodon scabroso (`sarcodon-scabrosus`) | convesso | imbuto |
| Spugnola gialla (`morchella-esculenta`) | conico | emisferico |
| Steccherino dorato (`repandum`) | convesso | piano, imbuto |
| Steccherino rossiccio (`hydnum-rufescens`) | convesso | piano, imbuto |
| Tignosa bianca (`amanita-virosa`) | conico | emisferico, convesso |
| Tignosa di primavera (`amanita-verna`) | convesso | emisferico, piano |
| Tignosa panterina (`amanita-pantherina`) | convesso | conico, emisferico, piano |
| Tricoloma equestre (`tricholoma-equestre`) | convesso | conico, piano, ombrellato |
| Tricoloma sciodes (`tricholoma-sciodes`) | conico | convesso |
| Tricoloma vergato (`tricholoma-virgatum`) | conico | convesso |

### 4. Timbri delle sfide

Tutto in `docs/handoff-immagini-timbri.md`: 9 timbri circolari, uno per sfida di `data/challenges.json`, leggibili a 64, 84 e 112 px su carta chiara e nel tema scuro.

### 5. Glossario, guide e infografiche

Tutto in `docs/handoff-immagini-glossario-guide.md`, in ordine A → B → C:
- A. 21 schemi del glossario;
- B. 3 aperture delle guide;
- C. 15 infografiche per specie.

Per ogni parte: prima un esempio da mostrare a Matteo, poi il resto nella stessa sessione, per avere uno stile uniforme.

## Consegna

- Aggiorna `incoming/bozze/STATO.md` con una riga per file (stato, dubbi).
- Scrivi in `incoming/NOTE.md` cosa è stato semplificato o lasciato fuori e perché.
- Le decisioni nuove si chiedono a Matteo con domande a scelta, con l'opzione consigliata per prima.
