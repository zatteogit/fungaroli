# Varianti delle icone dei caratteri — brief per l'agente immagini

Seguito di `docs/handoff-immagini-chrome.md`. Le 264 icone base (30 tavole) sono approvate e pubblicate. Stesso ramo: `gpt/immagini`. Solo file nuovi in `incoming/`. Niente PR.

## Perché

Lo stesso fungo può avere cappelli di colori e forme diversi: età, luce, umidità, habitat. Ogni icona base ne mostra uno solo. Nella scheda, sotto la tessera Cappello, compariranno:
- pallini per i colori;
- etichette per le forme («emisferico», «convesso», «piano»…).

Toccandoli cambiano insieme le tessere **Cappello** e **Gambo** (il fungo intero). La tessera **Sotto** non cambia.

Il ricolore automatico è stato provato e scartato: sbaglia sul fungo intero e non può cambiare la forma.

## Cosa disegnare

Per ogni specie della tabella:

1. **Dichiara la base.** Guarda l'icona base già approvata e scrivi quale colore e quale forma mostra. Usa solo valori della tabella; se il disegno non corrisponde a nessun valore, segnalalo in `NOTE.md`.
2. **Una variante per ogni altro colore.** Stessa forma della base. Cambia solo il colore del cappello e delle parti che nelle fonti hanno lo stesso colore (es. il finferlo è tutto dello stesso colore).
3. **Una variante per ogni altra forma.** Stesso colore della base. Le forme seguono di solito l'età:
   - emisferico o conico = giovane;
   - convesso = intermedio;
   - piano, imbuto o ombrellato = adulto.

   Gambo e proporzioni restano coerenti con la stessa specie a quell'età.
4. **Colore e forma non si combinano.** Niente «rosso + piano».

Ogni variante = **2 icone**: cappello visto di lato (come la tessera «cappello» base) e fungo intero (come la tessera «gambo» base).

## Regole

- **Stile e segno:** identici alle tavole base. Icona piatta, pochi colori, contorno bruno scuro, sfondo trasparente vero, nessun testo.
- **Fedeltà alla base:** stessa scala e stesso centro. Ogni variante si confronta in sovrapposizione con la base della stessa specie.
- **Caratteri invariati:** anello, volva, reticolo, base del gambo, verruche e squame restano quelli della base. Non si aggiunge un carattere che le fonti non danno.
- **Colori:** usa i toni dei campioni di Riconosci (`js/identify.js`, `COLORS`, colore medio): bianco #ece7da, crema #e3cfa3, giallo #d9b13c, arancio #d9732a, rosa #d99aa2, rosso #bb3226, verde (oliva) #9a9a5c, grigio #9d968a, bruno #8e5f36, violetto (lilla) #8e6aa8, nero (bruno-nero) #3a3330. Nello stile piatto si può stare tra il tono chiaro e il medio, purché il colore resti riconoscibile accanto al pallino.
- **Taxa aggregati** (`virescens`, `suillus`, `inocybe`, `morchella-*`, `tricholoma-equestre`): ogni variante resta una forma descritta per il gruppo.

## Formato delle tavole

- PNG con alpha, griglia 3×3, stessa misura delle tavole base: file `incoming/icone/varianti-NN.png`.
- Una riga per variante:
  - colonna 1 = cappello;
  - colonna 2 = fungo intero;
  - colonna 3 vuota.

  Tre varianti per tavola, anche di specie diverse.

## Manifest

Aggiungi a `incoming/manifest.json` due righe per variante (`tessera` «cappello» e «gambo»), con gli stessi campi delle righe base più:
- `"cella"`: 0–8, la posizione nella tavola (sinistra→destra, alto→basso);
- `"variante"`: `"colore:<valore>"` oppure `"forma:<valore>"`, con il valore scritto come nella tabella;
- `"base": {"colore": "<valore>", "forma": "<valore>"}` su almeno una riga per specie.

Esempio:

```json
{"file": "incoming/icone/varianti-01.png", "tipo": "illustrazione", "soggetto": "caesarea", "tessera": "cappello", "cella": 0, "variante": "colore:rosso", "base": {"colore": "arancio", "forma": "convesso"}, "modello": "image_gen (…)", "prompt": "…"}
```

Lo stato di ogni tavola va in `incoming/bozze/STATO.md` come per le base. Le varianti segnate «ok» vengono importate da `tools/import_trait_icons.py`, che rifiuta valori non presenti nelle fonti.

## Specie e varianti

Valori da `data/species-traits.json` (`cap_color`, `cap_shape`). Una specie con un solo valore non ha varianti per quel carattere. Priorità: prima le specie mortali e tossiche e i loro sosia commestibili (amanite, lepiote, cortinari, galerina, entoloma, boleti a pori rossi), poi le altre.

| Specie (chiave) | Tavola | Colori del cappello | Forme del cappello | Varianti |
|---|---|---|---|---:|
| Spugnola gialla (`morchella-esculenta`) | tavola-01 | crema, giallo, bruno | conico, emisferico | 3 |
| Finferlo (`cibarius`) | tavola-01 | giallo, arancio | convesso, imbuto | 2 |
| Idnello di Peck (`hydnellum-peckii`) | tavola-01 | bianco, rosa, bruno | convesso, piano, imbuto | 4 |
| Spugnola nera (`morchella-elata`) | tavola-02 | bruno, grigio, nero | conico | 2 |
| Falsa spugnola (`gyromitra-esculenta`) | tavola-02 | bruno, rosso, nero, giallo | emisferico | 3 |
| Urnula (`urnula-craterium`) | tavola-02 | nero, bruno | trombetta | 1 |
| Trombetta dei morti (`cornucopioides`) | tavola-03 | nero, bruno, grigio | trombetta | 2 |
| Craterello cenerino (`craterellus-cinereus`) | tavola-03 | nero, grigio, bruno | trombetta, imbuto | 3 |
| Craterello sinuoso (`pseudocraterellus-undulatus`) | tavola-03 | grigio, bruno | trombetta, imbuto | 2 |
| Steccherino dorato (`repandum`) | tavola-04 | crema, giallo, arancio | convesso, piano, imbuto | 4 |
| Steccherino rossiccio (`hydnum-rufescens`) | tavola-04 | arancio, bruno | convesso, piano, imbuto | 3 |
| Finferla (`craterellus-lutescens`) | tavola-04 | bruno, giallo | imbuto, trombetta | 2 |
| Sarcodon imbricato (`sarcodon-imbricatus`) | tavola-05 | bruno | convesso, imbuto | 1 |
| Sarcodon scabroso (`sarcodon-scabrosus`) | tavola-05 | bruno | convesso, imbuto | 1 |
| Boleto pepato (`chalciporus-piperatus`) | tavola-05 | bruno, arancio | convesso, piano | 2 |
| Ovolo buono (`caesarea`) | tavola-06 | arancio, rosso, giallo | emisferico, convesso, piano | 4 |
| Ovolo malefico (`amanita-muscaria`) | tavola-06 | rosso, arancio, giallo | emisferico, convesso, piano | 4 |
| Amanita crocea (`amanita-crocea`) | tavola-06 | arancio, giallo | emisferico, convesso, piano | 3 |
| Tignosa verdognola (`amanita-phalloides`) | tavola-07 | verde, giallo, bianco, grigio, bruno | emisferico, convesso, piano | 6 |
| Tignosa di primavera (`amanita-verna`) | tavola-07 | bianco, crema | emisferico, convesso, piano | 3 |
| Tignosa bianca (`amanita-virosa`) | tavola-07 | bianco | conico, emisferico, convesso | 2 |
| Amanita arrossante (`amanita-rubescens`) | tavola-08 | bruno, rosa | emisferico, convesso, piano | 3 |
| Tignosa panterina (`amanita-pantherina`) | tavola-08 | bruno, grigio, crema | conico, emisferico, convesso, piano | 5 |
| Mazza di tamburo arrossante (`chlorophyllum-rhacodes`) | tavola-08 | bruno, crema | ombrellato, emisferico, convesso | 3 |
| Mazza di tamburo (`procera`) | tavola-09 | bruno, crema | ombrellato, emisferico | 2 |
| Lepiota bruno-incarnata (`lepiota-brunneoincarnata`) | tavola-09 | bruno, rosa, rosso, crema | convesso, piano, ombrellato | 5 |
| Lepiota subincarnata (`lepiota-subincarnata`) | tavola-09 | rosa, bruno, crema | convesso, piano, ombrellato | 4 |
| Lepiota crestata (`lepiota-cristata`) | tavola-10 | bianco, bruno | convesso, piano, ombrellato | 3 |
| Coprinus comatus (`coprinus-comatus`) | tavola-10 | bianco, bruno, nero | conico | 2 |
| Mazza di tamburo velenosa (`chlorophyllum-venenatum`) | tavola-10 | bruno, crema | ombrellato, convesso | 2 |
| Porcino (`edulis`) | tavola-11 | bruno, crema | emisferico, convesso | 2 |
| Porcino rosso (`pinophilus`) | tavola-11 | rosso, bruno | emisferico, convesso | 2 |
| Porcino nero (`aereus`) | tavola-11 | bruno, nero | emisferico, convesso, piano | 3 |
| Porcino estivo (`aestivalis`) | tavola-12 | bruno, crema | emisferico, convesso | 2 |
| Porcino di fiele (`tylopilus-felleus`) | tavola-12 | bruno, crema | emisferico, convesso | 2 |
| Boleto dal bel piede (`caloboletus-calopus`) | tavola-12 | bianco, grigio, crema, bruno | emisferico, convesso | 4 |
| Boleto satana (`rubroboletus-satanas`) | tavola-13 | bianco, grigio, crema | emisferico, convesso | 3 |
| Boleto radicante (`caloboletus-radicans`) | tavola-13 | bianco, grigio, crema | emisferico, convesso | 3 |
| Boleto a piede rosso (`neoboletus-luridiformis`) | tavola-13 | bruno, nero, rosso | emisferico, convesso | 3 |
| Pinarolo (`suillus`) | tavola-14 | bruno, giallo, arancio, violetto | emisferico, convesso, piano | 5 |
| Boleto bovino (`suillus-bovinus`) | tavola-14 | arancio, bruno | convesso, piano | 2 |
| Boleto baio (`imleria-badia`) | tavola-14 | bruno | convesso, piano | 1 |
| Colombina verde (`virescens`) | tavola-15 | verde, violetto, grigio, rosa | emisferico, convesso, imbuto | 5 |
| Russula eterofilla (`russula-heterophylla`) | tavola-15 | verde, bruno, grigio | convesso, piano, imbuto | 4 |
| Russula verderame (`russula-aeruginea`) | tavola-15 | verde | convesso, piano, imbuto | 2 |
| Russula olivacea (`russula-olivacea`) | tavola-16 | verde, bruno, rosso, violetto | convesso, piano, imbuto | 5 |
| Colombina dorata (`russula-aurea`) | tavola-16 | giallo, arancio, rosso | emisferico, convesso, piano | 4 |
| Agarico violetto (`nuda`) | tavola-16 | violetto, bruno, rosa | convesso, piano | 3 |
| Sanguinello (`lactarius-deliciosus`) | tavola-17 | arancio, verde | convesso, imbuto | 2 |
| Lattario degli abeti (`lactarius-deterrimus`) | tavola-17 | arancio, giallo, verde | convesso, imbuto | 3 |
| Laccaria ametistina (`laccaria-amethystina`) | tavola-17 | violetto | convesso, imbuto, piano | 2 |
| Moretta (`terreum`) | tavola-18 | grigio, bruno | conico, convesso, piano | 3 |
| Agarico tigrino (`tricholoma-pardinum`) | tavola-18 | grigio, bruno, bianco | convesso, piano | 3 |
| Portentoso (`tricholoma-portentosum`) | tavola-18 | grigio, bruno, giallo | convesso, ombrellato | 3 |
| Tricoloma vergato (`tricholoma-virgatum`) | tavola-19 | grigio | conico, convesso | 1 |
| Tricoloma sciodes (`tricholoma-sciodes`) | tavola-19 | grigio, violetto | conico, convesso | 2 |
| Inocibe lilla (`inocybe-lilacina`) | tavola-19 | violetto | conico | 0 |
| Cortinario orellano (`cortinarius-orellanus`) | tavola-20 | arancio, bruno, rosso | convesso, piano, conico | 4 |
| Cortinario rubello (`cortinarius-rubellus`) | tavola-20 | arancio, bruno, rosso | conico, convesso | 3 |
| Cortinario tragano (`cortinarius-traganus`) | tavola-20 | violetto | convesso, emisferico | 1 |
| Cortinario violaceo (`cortinarius-violaceus`) | tavola-21 | violetto, nero | convesso, piano | 2 |
| Micena pura (`mycena-pura`) | tavola-21 | violetto, rosa, grigio, bianco | conico, convesso | 4 |
| Inocibi (genere) (`inocybe`) | tavola-21 | bruno, crema, bianco, giallo, grigio, violetto, rosa | conico, convesso | 7 |
| Prataiolo (`agaricus-campestris`) | tavola-22 | bianco, crema, bruno | emisferico, convesso, piano | 4 |
| Prataiolo maggiore (`agaricus-arvensis`) | tavola-22 | bianco, crema, giallo | emisferico, convesso, piano | 4 |
| Champignon (`agaricus-bisporus`) | tavola-22 | bruno, bianco | emisferico, convesso, piano | 3 |
| Gambesecche (`marasmius-oreades`) | tavola-23 | crema, bruno | convesso, ombrellato | 2 |
| Prugnolo (`calocybe-gambosa`) | tavola-23 | bianco, crema | emisferico, convesso, piano | 3 |
| Clitocibe rivulosa (`clitocybe-rivulosa`) | tavola-23 | bianco, crema, bruno | convesso, piano, imbuto | 4 |
| Lardaiolo (`hygrophorus-latitabundus`) | tavola-24 | bruno, grigio, nero | convesso, piano, ombrellato | 4 |
| Marzuolo (`hygrophorus-marzuolus`) | tavola-24 | bianco, grigio, nero | convesso, piano | 3 |
| Tricoloma equestre (`tricholoma-equestre`) | tavola-24 | giallo, verde, bruno | conico, convesso, piano, ombrellato | 5 |
| Chiodino (`mellea`) | tavola-25 | giallo, bruno | convesso, piano | 2 |
| Chiodino senza anello (`armillaria-tabescens`) | tavola-25 | giallo, bruno | convesso, piano | 2 |
| Galerina marginata (`galerina-marginata`) | tavola-25 | bruno, giallo, arancio | convesso, piano | 3 |
| Folliota squarrosa (`pholiota-squarrosa`) | tavola-26 | giallo, bruno | convesso, piano | 2 |
| Pioppino (`cyclocybe-aegerita`) | tavola-26 | crema, bruno | emisferico, convesso, piano | 3 |
| Folliota spettabile (`gymnopilus-junonius`) | tavola-26 | giallo, arancio | convesso, piano | 2 |
| Falso chiodino (`hypholoma-fasciculare`) | tavola-27 | giallo, arancio | convesso, piano | 2 |
| Fungo dell'olivo (`omphalotus-olearius`) | tavola-27 | arancio, giallo, bruno | convesso, imbuto | 3 |
| Falso gallinaccio (`hygrophoropsis-aurantiaca`) | tavola-27 | arancio, bruno, giallo | convesso, imbuto | 3 |
| Prataiolo dei boschi (`agaricus-sylvicola`) | tavola-28 | bianco, crema, giallo | emisferico, convesso, piano | 4 |
| Prataiolo ingiallente (`agaricus-xanthodermus`) | tavola-28 | bianco, crema, grigio, bruno, giallo | emisferico, convesso, piano | 6 |
| Entoloma livido (`entoloma-sinuatum`) | tavola-28 | grigio, crema, bianco | convesso, piano | 3 |
| Gelone (`pleurotus-ostreatus`) | tavola-29 | bianco, crema, bruno, grigio | convesso, imbuto | 4 |
| Cardoncello (`pleurotus-eryngii`) | tavola-29 | bianco, crema, bruno, grigio | convesso, imbuto | 4 |
| Cornucopia (`pleurotus-cornucopiae`) | tavola-29 | crema | convesso, imbuto | 1 |
| Lingua di bue (`fistulina-hepatica`) | tavola-30 | rosso, rosa, bruno | — | 2 |

Totale varianti: **259** (ognuna = 2 icone: cappello e fungo intero).

## Icone da ridisegnare (dati corretti dopo l'import)

Dopo il controllo dei campi `null` di anello e volva (15/10), questi valori sono cambiati con fonte verificabile. L'icona del gambo non mostra ancora il carattere: va ridisegnata nello stesso stile, nella stessa cella della tavola.

| Specie | Campo | Prima → dopo | Cosa deve mostrare il gambo | Fonti |
|---|---|---|---|---|
| Coprinus comatus (`coprinus-comatus`) | `stem_ring` | null → true | anello sottile e mobile, basso sul gambo, spesso scivolato verso la base | en.wikipedia, it.wikipedia, first-nature (in `traits_notes`) |

Restano `null`, perché le fonti descrivono strutture fugaci o gruppi misti: `agaricus-campestris`, `suillus`, `lepiota-brunneoincarnata`, `lepiota-subincarnata`, `inocybe` (anello) e `amanita-rubescens` (volva). Per `terreum` le fonti dicono che l'anello manca, ma c'è una cortina grigia nei giovani: decisione in sospeso.
