# Infografica: Trombetta dei morti (*Craterellus cornucopioides*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `cornucopioides`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q857903; sosia: Q12236668). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (pliche): grigio cenere o grigio-bluastro, come pruinoso.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Tromba nera, cava fino alla base"
2. "Faccia esterna grigia e liscia, senza lamelle"
3. "Carne sottile ed elastica, non fragile"
4. "Cresce a gruppi tra le foglie, in autunno"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Craterello cenerino** (*Craterellus cinereus (= Cantharellus cinereus)*), COMMESTIBILE.

Riga di testo: "Simile, grigio-nerastro, ma con pliche venose e forcate ben evidenti sulla faccia esterna, che nella trombetta è quasi liscia."

Altri sosia da citare in piccolo, solo testo:
- Craterello sinuoso (*Pseudocraterellus undulatus*, commestibile): Più piccolo ed esile, grigio-bruno, molto ondulato e sinuoso, non a tromba profonda; faccia esterna quasi liscia.
- Urnula (*Urnula craterium*, non commestibile): Coppa nera e coriacea su rami interrati, a fine inverno e primavera; interno nero, esterno bruno feltrato.

## Riquadro habitat / stagione / taglia minima
- Habitat: a gruppi numerosi tra le foglie di faggete, cerrete, castagneti e boschi misti umidi, spesso su suolo calcareo e lungo i fossi
- Stagione: settembre-novembre, a volte fino a dicembre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a cluster of Craterellus cornucopioides (horn of plenty) among fallen leaves; deep trumpet shapes 6-10 cm tall, 3-6 cm wide at the mouth, hollow down to the base, inner surface blackish-brown and finely scaly, rim wavy and rolled outward; outer surface ash-grey, smooth to slightly wrinkled, with a faint bloom. Secondary panel: longitudinal cut of one trumpet showing it is hollow to the base and has very thin grey-black elastic flesh. Detail panel: close-up of the smooth ash-grey outer surface, no gills. Detail panel: close-up of the narrow base emerging from beech leaves. Small side-by-side comparison panel: Craterellus cinereus beside it: similar grey-black funnel but with clearly raised forked ridges on the outer surface. Minimal habitat hint: dark beech leaf litter, autumn. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
