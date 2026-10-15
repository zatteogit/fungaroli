# Immagini mancanti — ordine di lavoro per l'agente immagini (15/10/2026)

**Per chi:** l'agente immagini (ChatGPT Work, progetto Fungaroli) che lavora sul ramo `gpt/immagini`. Solo file nuovi in `incoming/`, niente PR, niente file dell'app. L'integrazione la fa poi una sessione Claude sul repository.

**Regole:** quelle di `AGENTS.md` e dei brief citati sotto. Stile delle icone già approvate (`assets/traits/*.webp`, `assets/tree-traits/*.webp`): pochi colori piatti, contorno bruno scuro, fondo trasparente, nessun testo nell'immagine. Niente immagini generate al posto delle foto delle specie.

## Già consegnato (non rifare)

- 30 tavole delle icone dei funghi e 286 varianti di colore e forma (`incoming/icone/`): in produzione dalla v65.
- Gambo del coprino con l'anello (`incoming/icone/tavola-10-anello.png`): in produzione dalla v65.
- 7 tavole delle icone dei caratteri degli alberi (`incoming/icone-alberi/`): in produzione dalla v64.
- Copertine dei luoghi per stagione e meteo (`incoming/luoghi/`).

## Da fare, in quest'ordine

Le fasi di crescita dei funghi (con la sezione dell'uovo delle amanite) hanno un brief a parte: `docs/handoff-immagini-fasi.md`. Hanno la stessa priorità del punto 3, con le amanite per prime.

### 1. Un'icona degli alberi: foglia composta palmata

- **Cosa:** `leaf_type` = `composta_palmata` («Composta, foglioline a ventaglio»), il carattere dell'ippocastano.
- **Disegno:** una foglia con 5–7 foglioline allungate che partono tutte dallo stesso punto, in cima a un lungo picciolo; nello stile e alla stessa scala della tavola `incoming/icone-alberi/tavola-alberi-02.png` (la foglia composta pennata è il riferimento più vicino).
- **File:** `incoming/icone-alberi/tavola-alberi-08.png`, 1254×1254 px, griglia 3×3 con fondo trasparente, icona nella cella 0 e le altre celle vuote. Ogni disegno deve restare dentro la sua cella con margine: l'import rifiuta le tavole con disegni tagliati o a cavallo di due celle.
- **Manifest:** una riga in `incoming/manifest.json` con `tipo: "illustrazione"`, `soggetto: "alberi"`, `chiave: "leaf_type"`, `valore: "composta_palmata"`, `cella: 0`, `modello`, `prompt`.

### 2. Combinazioni colore + forma dell'amanita falloide

**Resta da fare** (decisione di Matteo, 15/10): la falloide ora ha anche le fasi di crescita, ma le sue varianti di forma sono già in produzione e le combinazioni si completano. L'elenco aggiornato è nella categoria `funghi-combinazioni` di `node tools/asset-report.mjs`.

Nell'app colore e forma del cappello ora si scelgono insieme. Per *Amanita phalloides* ci sono il disegno base (verde, convesso), 4 colori sul convesso e 2 forme sul verde. Mancano le altre combinazioni: finché non arrivano, l'app mostra la forma scelta nel colore base con la scritta «Colore non ancora disegnato per questa forma».

- **Da disegnare:** colori `giallo`, `bianco`, `grigio`, `bruno` × forme `emisferico`, `piano` = 8 combinazioni, ognuna con le tessere `cappello` e `gambo` (16 disegni).
- **Come:** partire dalle tavole approvate delle varianti della falloide (stessa scala, stesso tratto). Cambiare solo forma e colore del cappello; gambo, anello e volva restano uguali.
- **File:** due tavole 3×3 con fondo trasparente (`incoming/icone/combinazioni-01.png`, `-02.png`), un disegno per cella, con margine.
- **Manifest:** una riga per disegno con `soggetto: "amanita-phalloides"`, `tessera`, `cella` e `variante: "colore:<colore>+forma:<forma>"` (es. `"colore:giallo+forma:piano"`).

### 3. Forme del cappello (specie senza fasi di crescita)

Il brief delle varianti (`docs/handoff-immagini-varianti.md`, punto 3) chiedeva una variante per ogni forma del cappello descritta dalle fonti. Ne è arrivata una sola specie (la falloide).

**Dal 15/10** le specie in cui le fasi cambiano davvero l'aspetto hanno le fasi di crescita nei dati (`stages`). Per loro la forma segue la fase e si disegna con `docs/handoff-immagini-fasi.md`, non qui. Per questo l'elenco scende da 116 forme per 80 specie a **65 forme per 49 specie**, ognuna con le tessere `cappello` e `gambo` (130 disegni).

- **Come:** stesso colore del disegno base. Cambia la forma del cappello e, dove serve, le proporzioni del gambo coerenti con quell'età. Stile e scala delle tavole approvate.
- **File:** tavole 3×3 con fondo trasparente `incoming/icone/forme-NN.png`, un disegno per cella con margine. L'import rifiuta disegni tagliati o a cavallo di due celle.
- **Manifest:** una riga per disegno con `soggetto`, `tessera`, `cella` e `variante: "forma:<forma>"`.
- **Ordine:** prima le specie tossiche e mortali e i loro sosia, poi le altre.
- **Elenco sempre aggiornato:** `node tools/asset-report.mjs`, categoria `funghi-forma`. La stessa lista è in `data/asset-pending.json`.

| Specie | Forma del disegno base | Forme da disegnare |
|---|---|---|
| Chiodino senza anello (`armillaria-tabescens`) | convesso | piano |
| Boleto dal bel piede (`caloboletus-calopus`) | convesso | emisferico |
| Boleto radicante (`caloboletus-radicans`) | convesso | emisferico |
| Prugnolo (`calocybe-gambosa`) | convesso | emisferico, piano |
| Boleto pepato (`chalciporus-piperatus`) | convesso | piano |
| Mazza di tamburo velenosa (`chlorophyllum-venenatum`) | ombrellato | convesso |
| Clitocibe rivulosa (`clitocybe-rivulosa`) | imbuto | convesso, piano |
| Cortinario tragano (`cortinarius-traganus`) | convesso | emisferico |
| Cortinario violaceo (`cortinarius-violaceus`) | convesso | piano |
| Craterello cenerino (`craterellus-cinereus`) | trombetta | imbuto |
| Finferla (`craterellus-lutescens`) | imbuto | trombetta |
| Galerina marginata (`galerina-marginata`) | convesso | piano |
| Folliota spettabile (`gymnopilus-junonius`) | convesso | piano |
| Idnello di Peck (`hydnellum-peckii`) | piano | convesso, imbuto |
| Steccherino rossiccio (`hydnum-rufescens`) | convesso | imbuto, piano |
| Falso gallinaccio (`hygrophoropsis-aurantiaca`) | imbuto | convesso |
| Lardaiolo (`hygrophorus-latitabundus`) | convesso | ombrellato, piano |
| Marzuolo (`hygrophorus-marzuolus`) | convesso | piano |
| Boleto baio (`imleria-badia`) | convesso | piano |
| Inocibi (genere) (`inocybe`) | conico | convesso |
| Laccaria ametistina (`laccaria-amethystina`) | imbuto | convesso, piano |
| Sanguinello (`lactarius-deliciosus`) | imbuto | convesso |
| Lattario degli abeti (`lactarius-deterrimus`) | imbuto | convesso |
| Lepiota subincarnata (`lepiota-subincarnata`) | convesso | ombrellato, piano |
| Gambesecche (`marasmius-oreades`) | ombrellato | convesso |
| Spugnola gialla (`morchella-esculenta`) | conico | emisferico |
| Micena pura (`mycena-pura`) | conico | convesso |
| Boleto a piede rosso (`neoboletus-luridiformis`) | convesso | emisferico |
| Agarico violetto (`nuda`) | convesso | piano |
| Fungo dell'olivo (`omphalotus-olearius`) | imbuto | convesso |
| Folliota squarrosa (`pholiota-squarrosa`) | convesso | piano |
| Cornucopia (`pleurotus-cornucopiae`) | imbuto | convesso |
| Cardoncello (`pleurotus-eryngii`) | convesso | imbuto |
| Craterello sinuoso (`pseudocraterellus-undulatus`) | imbuto | trombetta |
| Steccherino dorato (`repandum`) | convesso | imbuto, piano |
| Russula verderame (`russula-aeruginea`) | convesso | imbuto, piano |
| Colombina dorata (`russula-aurea`) | convesso | emisferico, piano |
| Russula eterofilla (`russula-heterophylla`) | convesso | imbuto, piano |
| Russula olivacea (`russula-olivacea`) | convesso | imbuto, piano |
| Sarcodon imbricato (`sarcodon-imbricatus`) | convesso | imbuto |
| Sarcodon scabroso (`sarcodon-scabrosus`) | convesso | imbuto |
| Boleto bovino (`suillus-bovinus`) | convesso | piano |
| Pinarolo (`suillus`) | convesso | emisferico, piano |
| Tricoloma equestre (`tricholoma-equestre`) | convesso | conico, ombrellato, piano |
| Agarico tigrino (`tricholoma-pardinum`) | convesso | piano |
| Portentoso (`tricholoma-portentosum`) | ombrellato | convesso |
| Tricoloma sciodes (`tricholoma-sciodes`) | conico | convesso |
| Tricoloma vergato (`tricholoma-virgatum`) | conico | convesso |
| Colombina verde (`virescens`) | convesso | emisferico, imbuto |

### 4. Timbri delle sfide

Tutto in `docs/handoff-immagini-timbri.md`: 9 timbri circolari, uno per sfida di `data/challenges.json`, leggibili a 64, 84 e 112 px su carta chiara e nel tema scuro.

### 5. Glossario, guide e infografiche

Tutto in `docs/handoff-immagini-glossario-guide.md`, in ordine A → B → C:
- A. 21 schemi del glossario;
- B. 3 aperture delle guide;
- C. 15 infografiche per specie.

Per ogni parte: prima un esempio da mostrare a Matteo, poi il resto nella stessa sessione, per avere uno stile uniforme.

### 6. Copertine di stagione e meteo per due luoghi nuovi

Il 15/10 (decisione D7) sono state trovate su Wikimedia Commons foto reali per due degli otto luoghi che non ne avevano. Sono in `assets/zones/` e in `data/media-zones.json`, con autore, licenza e link alla licenza. Per gli altri sei non c'è una foto adatta: restano eccezioni con il motivo in `data/asset-pending.json`.

- **Cosa:** per ogni luogo le 17 combinazioni (4 stagioni × sereno, nuvoloso, nebbia, pioggia, più inverno con neve), meno quella della foto reale: **16 copertine per luogo, 32 in tutto**.
- **Come:** stesse regole della Parte B di `docs/handoff-immagini-chrome.md`. Stessa inquadratura e stessi crinali; cambiano solo vegetazione, luce e suolo. La neve solo se la quota più alta della zona arriva almeno a 1000 m. La foto di partenza si scarica dalla pagina Commons indicata.
- **File e manifest:** come le copertine già consegnate (`incoming/luoghi/`, `incoming/bozze/STATO.md`, `incoming/NOTE.md` con autore e licenza della foto di partenza). Import: `tools/import_zone_variants.py`.
- **Punti di ritaglio:** servono anche per le due foto reali (ramo `gpt/ritagli`).

| Luogo | Foto reale (pagina, autore, licenza) | Stagione e meteo della foto | Quota più alta | Copertine |
|---|---|---|---|---:|
| Pian de' Rosce / Terminillo ovest (`terminillo-ovest`) | [Monte Terminilletto (14936512892).jpg](https://commons.wikimedia.org/wiki/File%3AMonte_Terminilletto_%2814936512892%29.jpg) · Johan Haggi · CC BY-SA 2.0 | estate, sereno | 1390 m | 16 |
| Cittareale / Alto Velino (`cittareale`) | [Monte Pozzoni (Cittareale-Rieti).jpg](https://commons.wikimedia.org/wiki/File%3AMonte_Pozzoni_%28Cittareale-Rieti%29.jpg) · Skylimitless · CC BY-SA 4.0 | estate, sereno | 1340 m | 16 |

## Consegna

- Aggiorna `incoming/bozze/STATO.md` con una riga per file (stato, dubbi).
- Scrivi in `incoming/NOTE.md` cosa è stato semplificato o lasciato fuori e perché.
- Le decisioni nuove si chiedono a Matteo con domande a scelta, con l'opzione consigliata per prima.
