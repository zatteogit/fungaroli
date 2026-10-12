# Infografica: Finferlo (*Cantharellus cibarius*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `cibarius`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q188749; sosia: Q1043730). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (pliche): dello stesso giallo del cappello.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Sotto il cappello pliche spesse e forcate, non lamelle"
2. "Tutto dello stesso giallo uovo"
3. "Cresce a terra, non sul legno"
4. "Carne bianca, soda, odore di albicocca"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Fungo dell'olivo** (*Omphalotus olearius*), TOSSICO.

Riga di testo: "Cresce a cespi su ceppaie o radici (olivo, quercia, castagno); vere lamelle fitte, sottili e decorrenti; carne arancione che macchia le dita. Più grande e arancio carico."

Altri sosia da citare in piccolo, solo testo:
- Falso gallinaccio (*Hygrophoropsis aurantiaca*, non commestibile): Vere lamelle sottili, fitte e ripetutamente forcate, arancio più carico del cappello; carne molle, non bianca; spesso su legno marcio o lettiera di conifere.
- Cortinario orellano (*Cortinarius orellanus*, mortale): Arancio-fulvo ma con vere lamelle staccate e sporata color ruggine; carne giallastra. Danni ai reni dopo giorni dal pasto: ogni fungo aranciato con lamelle va scartato.

## Riquadro habitat / stagione / taglia minima
- Habitat: a terra, mai sul legno, in faggete, castagneti, cerrete e boschi di conifere, su suoli acidi e muschiosi
- Stagione: giugno-ottobre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a group of Cantharellus cibarius (chanterelle) growing from moss on soil; caps 3-8 cm, egg-yolk yellow, funnel-shaped with wavy lobed margin; underside with thick, blunt, forked false gills (ridges) running down the stem, same yellow color; solid stem merging into the cap. Secondary panel: longitudinal cut showing solid white-to-pale-yellow fibrous flesh, ridges as folds of the cap flesh, not separate plates. Detail panel: close-up of blunt, shallow, forked, vein-like ridges, NOT thin blade-like gills. Detail panel: close-up of the stem base growing from moss and soil, not from wood. Small side-by-side comparison panel: Omphalotus olearius beside it: dense tufts on a stump or root, deep orange, TRUE thin crowded gills, orange flesh. Minimal habitat hint: mossy beech and chestnut forest floor. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
