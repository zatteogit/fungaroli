# Icone dei caratteri delle piante — brief per l'agente immagini (15/10/2026)

Decisione di Matteo (D4, 15/10): anche le piante hanno un'icona per ogni valore delle domande di «Impara a riconoscere», come gli alberi. Stesso ramo `gpt/immagini`, solo file nuovi in `incoming/`, niente PR. L'import lo fa una sessione Claude con `python3 tools/import_tree_icons.py <incoming> --piante`.

## Perché

Il percorso guidato delle piante (`data/recognize-plants.json`) fa domande su portamento, foglie, fiori e frutti. Per gli alberi ogni risposta ha un'icona. Per le piante oggi c'è solo testo. Le icone aiutano a capire la domanda; non identificano la pianta.

## Cosa disegnare

**Un'icona per ogni valore** della tabella: **51 icone**, una per valore e non per specie. Si disegna il carattere in generale, non una pianta precisa. Niente fiori o foglie riconoscibili come una specie del catalogo, soprattutto se è pericolosa.

Non hanno icona: taglia, ambiente e «segni particolari» (`special`), che l'app mostra in una riga a parte, come per gli alberi.

## Regole

- **Stile:** quello delle icone degli alberi approvate (`assets/tree-traits/*.webp`, tavole `incoming/icone-alberi/`). Icona piatta, pochi colori, contorno bruno scuro, fondo trasparente vero, nessun testo nell'immagine.
- **Colori del fiore e del frutto:** il colore è il carattere. Disegna la stessa forma neutra (fiore a 5 petali, bacca tonda) nel colore del valore. Per `verdastro` e `bruno` scegli un tono che si legga su carta chiara e nel tema scuro.
- **Altezza:** la stessa pianta stilizzata accanto a un riferimento fisso (stivale o bastone), a tre altezze.
- **Disposizione delle foglie:** il rametto è uguale nelle quattro icone; cambia solo come escono le foglie.
- **Fedeltà allo schema:** l'etichetta di ogni valore (colonna «Cosa mostrare») è la definizione. Non aggiungere caratteri che la definizione non dà.

## Formato delle tavole e manifest

- PNG con alpha, griglia 3×3, 1254×1254 px: `incoming/icone-piante/tavola-piante-NN.png`. Un disegno per cella, con margine. L'import rifiuta disegni tagliati, a cavallo di due celle o in celle che il manifest non usa.
- Una riga in `incoming/manifest.json` per icona, con `tipo: "illustrazione"`, `soggetto: "piante"`, `chiave`, `valore`, `cella` (0–8), `modello`, `prompt`.

```json
{"file": "incoming/icone-piante/tavola-piante-01.png", "tipo": "illustrazione", "soggetto": "piante", "chiave": "leaf_arrangement", "valore": "opposte", "cella": 4, "modello": "image_gen (…)", "prompt": "…"}
```

L'import scrive `assets/plant-traits/<chiave>-<valore>.webp` e `data/plant-trait-icons.json`. Rifiuta chiavi e valori che non sono domande di `data/recognize-plants.json`. Quando le icone arrivano, si tolgono le voci da `data/asset-pending.json` (categoria `piante-valori`): lo chiede `tests/asset-completeness.test.mjs`. Mostrarle nell'app (come `loadTreeIcons` in `js/guided-key.js`) è un passo a parte.

## Valori

| Chiave | Domanda | Valore | Cosa mostrare |
|---|---|---|---|
| `growth_form` | Portamento | `erba` | erba, fusti non legnosi |
| `growth_form` | Portamento | `arbusto` | arbusto, fusti legnosi |
| `growth_form` | Portamento | `rampicante` | liana o rampicante |
| `height_class` | Altezza | `bassa` | sotto i 30 cm |
| `height_class` | Altezza | `media` | da 30 cm a 1,5 m |
| `height_class` | Altezza | `alta` | oltre 1,5 m |
| `leaf_arrangement` | Disposizione delle foglie | `alterne` | una per nodo, a zig-zag |
| `leaf_arrangement` | Disposizione delle foglie | `opposte` | due per nodo, una di fronte all’altra |
| `leaf_arrangement` | Disposizione delle foglie | `verticillate` | tre o più per nodo, a raggiera |
| `leaf_arrangement` | Disposizione delle foglie | `rosetta_basale` | tutte o quasi a terra, a rosetta |
| `leaf_type` | Tipo di foglia | `semplice` | una lamina intera, anche lobata |
| `leaf_type` | Tipo di foglia | `composta` | divisa in foglioline separate |
| `leaf_type` | Tipo di foglia | `molto_divisa_fine` | divisa in fili sottili, come capelli |
| `leaf_type` | Tipo di foglia | `molto_divisa_larga` | molto frastagliata, a segmenti larghi o dentati, tipo felce o prezzemolo |
| `leaf_type` | Tipo di foglia | `aghiforme` | ago o squama stretta |
| `leaf_margin` | Margine fogliare | `intero` | liscio |
| `leaf_margin` | Margine fogliare | `dentato` | con dentini o seghettato |
| `leaf_margin` | Margine fogliare | `lobato` | con lobi profondi |
| `flower_color` | Colore del fiore | `bianco` | bianco o crema |
| `flower_color` | Colore del fiore | `giallo` | giallo |
| `flower_color` | Colore del fiore | `arancio_rosso` | arancio o rosso |
| `flower_color` | Colore del fiore | `rosa` | rosa |
| `flower_color` | Colore del fiore | `viola_blu` | viola, lilla o azzurro |
| `flower_color` | Colore del fiore | `verdastro` | verdastro o brunastro, poco vistoso |
| `flower_shape` | Fiore o infiorescenza | `cinque_petali` | 5 petali (o lobi) aperti |
| `flower_shape` | Fiore o infiorescenza | `quattro_petali` | 4 petali a croce |
| `flower_shape` | Fiore o infiorescenza | `sei_tepali` | 6 petali uguali, a stella |
| `flower_shape` | Fiore o infiorescenza | `molti_petali` | molti petali stretti a raggiera |
| `flower_shape` | Fiore o infiorescenza | `ombrella` | tanti fiorellini su un piano, a ombrella o corimbo |
| `flower_shape` | Fiore o infiorescenza | `capolino` | un “fiore” fatto di tanti fiorellini, tipo margherita |
| `flower_shape` | Fiore o infiorescenza | `campanula` | a campana, imbuto o urna |
| `flower_shape` | Fiore o infiorescenza | `tubo_labbra` | a tubo, spesso con labbra |
| `flower_shape` | Fiore o infiorescenza | `farfalla` | a farfalla, come il pisello |
| `flower_shape` | Fiore o infiorescenza | `labello` | con un labbro grande in basso, tipo orchidea |
| `flower_shape` | Fiore o infiorescenza | `petali_rovesciati` | petali ripiegati all’indietro |
| `flower_shape` | Fiore o infiorescenza | `spata` | una foglia a cappuccio che avvolge una clava |
| `flower_shape` | Fiore o infiorescenza | `fiori_minuti` | fiorellini piccoli e fitti, in spiga, grappolo o testa |
| `flower_shape` | Fiore o infiorescenza | `nessun_fiore_vistoso` | nessun fiore vistoso |
| `fruit_type` | Frutto | `carnoso` | piccolo frutto carnoso, tondo (bacca o drupa) |
| `fruit_type` | Frutto | `mora` | tante palline unite, come la mora |
| `fruit_type` | Frutto | `falso_frutto` | frutto carnoso con semini o peli dentro o fuori (fragola, cinorrodo) |
| `fruit_type` | Frutto | `capsula` | capsula secca che si apre |
| `fruit_type` | Frutto | `baccello` | baccello allungato |
| `fruit_type` | Frutto | `secco_piccolo` | semini secchi, piccoli |
| `fruit_type` | Frutto | `secco_piumoso` | semi con piume o pennacchi (soffione) |
| `fruit_color` | Colore del frutto | `rosso` | rosso |
| `fruit_color` | Colore del frutto | `arancio` | arancio |
| `fruit_color` | Colore del frutto | `rosa` | rosa |
| `fruit_color` | Colore del frutto | `nero` | nero o blu-nero |
| `fruit_color` | Colore del frutto | `blu_metallico` | blu metallico |
| `fruit_color` | Colore del frutto | `bruno` | bruno, secco |

Ordine suggerito: prima foglie (disposizione, tipo, margine), poi fiori, poi frutti e pianta intera. Per ogni parte, prima un esempio da mostrare a Matteo, poi il resto nella stessa sessione, per avere uno stile uniforme.

Stato delle tavole in `incoming/bozze/STATO.md`, semplificazioni in `incoming/NOTE.md`. Le decisioni nuove si chiedono a Matteo con domande a scelta, con l'opzione consigliata per prima.
