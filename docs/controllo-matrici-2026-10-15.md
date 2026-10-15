# Controllo delle matrici dei dati (15/10/2026)

Controllo fatto prima di nuove immagini, come chiede il principio in `AGENTS.md`: le immagini si disegnano dai dati, quindi i dati vanno prima verificati. Sono state controllate tre matrici:

- `data/species-traits.json`: 88 funghi;
- `data/recognize-trees.json`: 39 alberi;
- `data/recognize-plants.json`: 70 piante.

I controlli di struttura (valori dentro lo schema, fasi, indici delle immagini) ora sono automatici: `tests/asset-coherence.test.mjs` e `tests/stages.test.mjs`.

Legenda: **fatto** = verificato su fonte o con un controllo automatico; **interpretazione** = lettura di una fonte; **non verificato** = manca una fonte letta.

## 1. Funghi (`species-traits.json`)

### Struttura: nessun errore

- Ogni valore di ogni carattere è nel vocabolario (`vocabulary`). Nessun campo manca, nessun elenco è vuoto.
- Ogni taxon ha fonti. Le frequenze (`trait_freq`, 22 taxa) usano solo valori della specie.
- Alberi ospiti (`trees`): tutti nel vocabolario.

### Valori `null` (= «non documentato», non «assente»)

| Campo | Taxa con null | Note |
|---|---:|---|
| cap_veil | 25 | Velo fugace o gruppi misti. Scelta documentata nei `traits_notes`. |
| gill_attachment | 24 | Spesso ascomiceti o specie senza lamelle vere. |
| flesh_texture | 15 | |
| cap_surface | 13 | |
| stem_base | 11 | |
| growth | 11 | |
| flesh_change | 10 | |
| stem_ring | 6 | `suillus`, `terreum`, `lepiota-brunneoincarnata`, `lepiota-subincarnata`, `inocybe`, `agaricus-campestris`: già decisi il 15/10 (strutture fugaci o gruppi misti). |
| cap_shape | 1 | `fistulina-hepatica`: fungo a mensola, nessuna forma del vocabolario lo descrive. |
| stem_volva | 1 | `amanita-rubescens`: la volva si vede solo nei giovanissimi (First Nature). Già deciso. |
| smell | 1 | `gyromitra-esculenta` |

Nessuno di questi `null` è disegnato. Le icone base del gambo con anello o volva «variabili» restano come sono.

### Colori e forme: da dove vengono

- **Fatto:** ogni colore e forma del cappello sta nei caratteri della specie, e la specie ha fonti.
- **Limite:** la fonte è registrata per la scheda, non per il singolo valore. Solo 22 taxa hanno citazioni per valore (`trait_freq`). Altri 74 spiegano le scelte nei `traits_notes`.
- **Senza `traits_notes`** (14 taxa): `agaricus-campestris`, `agaricus-bisporus`, `agaricus-sylvicola`, `cyclocybe-aegerita`, `pleurotus-ostreatus`, `pleurotus-eryngii`, `pleurotus-cornucopiae`, `morchella-elata`, `marasmius-oreades`, `craterellus-lutescens`, `hygrophorus-marzuolus`, `hygrophorus-latitabundus`, `fistulina-hepatica`, `amanita-rubescens`. Per questi taxa non è scritto quale fonte dà quale colore o forma (**non verificato** per valore). Vedi la domanda D1.

### Correzioni fatte, con fonte

Lette sulle fonti già elencate nella scheda della specie, durante il lavoro sulle fasi. Ogni correzione aggiunge un valore descritto dalla fonte. È annotata in coda ai `traits_notes`. Sui taxa tossici e mortali la regola dei valori larghi le rende più prudenti, non meno.

| Specie | Campo | Aggiunto | Citazione |
|---|---|---|---|
| Tignosa bianca (`amanita-virosa`) | cap_shape | piano | «flattening» (Wikipedia en); «occasionally almost flat» (First Nature) |
| Lepiota bruno-incarnata (`lepiota-brunneoincarnata`) | cap_shape | emisferico | «Initially hemispherical» (First Nature) |
| Entoloma livido (`entoloma-sinuatum`) | cap_shape | conico | «conical then convex to plane» (First Nature) |
| Cortinario rubello (`cortinarius-rubellus`) | cap_shape | piano | «at first convex, flattening at maturity» (First Nature) |
| Porcino di fiele (`tylopilus-felleus`) | cap_shape | piano | «dapprima emisferico, poi spianato» (Wikipedia it) |
| Boleto satana (`rubroboletus-satanas`) | hymenophore_color | giallo | «yellowish in very young fruitbodies» (First Nature) |
| Cortinario rubello (`cortinarius-rubellus`) | hymenophore_color | giallo | «pale yellowish at first» (First Nature) |
| Cortinario orellano (`cortinarius-orellanus`) | hymenophore_color | giallo, rosso | «pale yellowish at first, becoming red» (First Nature) |

Effetto sulle immagini: nessun disegno da rifare. I valori aggiunti non tolgono nulla di ciò che le icone mostrano (lo conferma `node tools/asset-report.mjs`: «da rifare: nessuna»). Le forme aggiunte riguardano specie con fasi: non diventano nuove varianti di forma.

## 2. Alberi (`recognize-trees.json`)

- **Fatto:** ogni valore è nello schema. Ogni albero ha fonti e una scheda in `trees.json`. Le icone (`tree-trait-icons.json`) corrispondono ai valori. Resta da disegnare solo `leaf_type` = `composta_palmata`.
- **Fatto:** i `null` sugli aghi (31 latifoglie) e sulla base della foglia (36) seguono `applies_if` o mancano nelle fonti.
- **Non verificato:** `leaf_arrangement` (foglie opposte o alterne) è `null` per 6 alberi a foglia larga: farnetto, leccio, betulla, nocciolo, sorbo domestico, acero opalo. Ho riletto le pagine Wikipedia it/en e Acta Plantarum elencate nelle loro fonti: nessuna lo scrive in modo esplicito. Per l'acero opalo Wikipedia it dice solo che le gemme laterali sono opposte. Non ho corretto nulla. Vedi la domanda D2.
- `leaf_shape` è `null` per 5 alberi a foglia composta (orniello, sorbo domestico, noce, robinia, frassino maggiore). È coerente: la forma vale per una foglia semplice.
- `size` o `habitat` sono `null` in 6 casi. Questi campi non si chiedono e non hanno icone.
- **Struttura da sistemare:** il ciliegio ha una voce in `confusables` con `id: null` e nome «(nessun sosia in scheda)». È una nota messa nel posto di un sosia. Vedi la domanda D3.

## 3. Piante (`recognize-plants.json`)

- **Fatto:** 70 schede, una per ogni pianta di `plants.json`. Ogni valore è nello schema e ogni scheda ha fonti. I confronti (`confusables`) puntano a schede esistenti.
- I `null` più frequenti: colore del frutto (48), margine della foglia (20), segni particolari (18), disposizione delle foglie (12). Non sono disegnati: le piante non hanno icone dei caratteri. Vedi la domanda D4.

## Decisioni da chiedere a Matteo

Domande a scelta. L'opzione consigliata è la prima.

**D1. Fonte per valore dei colori e delle forme del cappello**
1. *(consigliata)* Aggiungere `trait_freq` o una citazione per colore e forma, per ora solo nei 14 taxa senza `traits_notes`, partendo da quelli con fasi (prataioli, pioppino, gelone, amanita arrossante). Un test poi chiede una citazione per ogni valore disegnato.
2. Estendere la citazione per valore a tutti gli 88 taxa.
3. Lasciare la fonte per scheda, come oggi.

**D2. Foglie opposte o alterne per 6 alberi (`leaf_arrangement` null)**
1. *(consigliata)* Cercare una flora con il carattere scritto (Acta Plantarum, scheda del forum da Pignatti; Portale della Flora d'Italia) e compilare solo dove la fonte lo dice.
2. Lasciare `null`: la domanda non esclude quegli alberi.

**D3. Voce senza sosia nel ciliegio**
1. *(consigliata)* Spostare il testo («ghiandole rossastre sul picciolo») in una nota della scheda e togliere la voce da `confusables`.
2. Lasciarla: oggi l'app la mostra come un confronto senza scheda.

**D4. Icone dei caratteri delle piante**
1. *(consigliata)* Per ora no. Le piante restano con le foto. Il test di completezza non le chiede.
2. Sì: un brief come quello degli alberi, un'icona per valore delle domande (circa 80 valori).

**D5. Combinazioni colore + forma dell'amanita falloide (`docs/handoff-immagini-mancanti.md`, punto 2)**

Ora la falloide ha le fasi, e le fasi sostituiscono le forme.
1. *(consigliata)* Sospendere le 16 combinazioni. Il colore resta una variante; la forma viene dalla fase. Come combinare colore e fase si decide con l'app (PR successiva).
2. Disegnarle lo stesso.

**D6. Mazza di tamburo velenosa (`chlorophyllum-venenatum`)**

L'unica fonte con le fasi (Wikipedia it) dice «semiovale, poi campanulato». Nessuno dei due valori è tra le sue forme (ombrellato, convesso).
1. *(consigliata)* Cercare una seconda fonte (First Nature o una scheda ASL) prima di aggiungere fasi o forme.
2. Aggiungere `emisferico` e `conico` alle forme su questa sola fonte (taxon tossico, valori larghi).
3. Lasciarla senza fasi.

**D7. Luoghi senza foto reale (8 su 15)**
1. *(consigliata)* Lasciarli come eccezione dichiarata (`data/asset-pending.json`): la scheda mostra la foto del fungo.
2. Cercare foto Commons con licenza per quei luoghi, poi fare le copertine di stagione e meteo.
