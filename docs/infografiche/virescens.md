# Infografica: Colombina verde (*Russula virescens; Russula cyanoxantha*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `virescens`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q677341, Q246696 (Russula cyanoxantha); sosia: Q188643). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (lamelle): bianche o crema chiaro.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Né anello né volva: base del gambo pulita, senza sacco"
2. "Gambo bianco che si spezza di netto come un gesso"
3. "Verdone: cappello verde screpolato a piccole placche"
4. "R. cyanoxantha: lamelle flessibili e 'unte' al tatto"
5. "Sapore dolce (assaggio di un frammento da sputare)"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Tignosa verdognola** (*Amanita phalloides*), MORTALE.

Riga di testo: "Ha anello bianco sul gambo e una volva bianca a sacco alla base, spesso interrata: scava sempre la base. Cappello liscio con fibrille radiali, non screpolato a placche; gambo fibroso, non gessoso."

Altri sosia da citare in piccolo, solo testo:
- Russula eterofilla (*Russula heterophylla*, commestibile): Cappello verde-oliva o bruno liscio, lamelle fitte e forcate vicino al gambo, fragili (non lardacee).
- Russula olivacea (*Russula olivacea*, tossico): Cappello verde-oliva o bruno-porpora liscio, lamelle e sporata gialle (non bianche), gambo spesso soffuso di rosa in alto. Causa gastroenteriti se mangiata cruda o poco cotta.
- Russula verderame (*Russula aeruginea*, commestibile): Cappello verde erba liscio e un po' viscido, lamelle crema-giallastre, spesso sotto betulle.

## Riquadro habitat / stagione / taglia minima
- Habitat: boschi di latifoglie: castagno, querce (cerro, roverella) e faggio, anche boschi misti. Nel Reatino dai castagneti collinari alle faggete del Terminillo
- Stagione: giugno-ottobre, abbondante nelle estati piovose
- Taglia minima di raccolta (L.R. Lazio 32/1998): 4 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: two russulas side by side: Russula virescens with a 10 cm green to grey-green cap whose surface is cracked into small velvety green patches revealing white beneath, white brittle gills; and Russula cyanoxantha with a 10 cm smooth cap mixing violet, lilac, slate-blue and green, white flexible gills; both with a short thick pure white stem, no ring, no volva. Secondary panel: longitudinal cut showing firm white granular flesh that does not change color; a piece of stem snapping cleanly like chalk. Detail panel: close-up of white gills; a finger bending the gills of R. cyanoxantha without breaking them. Detail panel: close-up of the clean white stem base dug from soil, no sac, no ring. Small side-by-side comparison panel: Amanita phalloides beside it: smooth olive-green cap, WHITE RING on the stem and a WHITE SAC VOLVA at the base. Minimal habitat hint: chestnut and beech litter. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
