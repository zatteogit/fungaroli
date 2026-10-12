# Infografica: Moretta (*Tricholoma terreum*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `terreum`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q27266; sosia: Q1928462). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (lamelle): bianche, poi grigio chiaro.
4. **Dettaglio della base del gambo**: anello no (solo una cortina fugace negli esemplari giovani); volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Cappello piccolo grigio topo, feltrato, con umbone"
2. "Lamelle bianco-grigie smarginate"
3. "Carne sottile, odore debole NON di farina"
4. "Sapore dolce, non amaro né piccante"
5. "Sotto pino, a fine autunno"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Agarico tigrino** (*Tricholoma pardinum*), TOSSICO.

Riga di testo: "Molto più grande e carnoso (fino a 15-20 cm), cappello coperto di squame grigio-brune su fondo chiaro, a motivo tigrato; gambo tozzo; odore di farina. Molto velenoso: gravi gastroenteriti."

Altri sosia da citare in piccolo, solo testo:
- Tricoloma vergato (*Tricholoma virgatum*, tossico): Cappello conico con umbone appuntito, grigio argento con fibre radiali scure, lucido; sapore amaro e piccante.
- Tricoloma sciodes (*Tricholoma sciodes*, non commestibile): Simile al vergato, filo delle lamelle annerito, sapore amaro-piccante; preferisce il faggio.
- Entoloma livido (*Entoloma sinuatum*, tossico): Grande, grigio-crema liscio, lamelle giallastre che diventano rosa, sporata rosa, odore di farina; sotto latifoglie.
- Inocibi (genere) (*Inocybe*, tossico): Cappelli piccoli conici e fibrosi, spesso screpolati radialmente; lamelle grigio-brune e sporata bruna, non bianca.

## Riquadro habitat / stagione / taglia minima
- Habitat: in gruppi o in file sotto i pini, soprattutto rimboschimenti di pino nero; più raramente con latifoglie. Nel Reatino segnalata nelle pinete dell'Altopiano di Rascino
- Stagione: ottobre-dicembre, resiste ai primi freddi
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a group of Tricholoma terreum (grey knight) in pine needle litter; caps 4-6 cm, mouse-grey, felty with fine darker scales, conical-convex with a small umbo; whitish to pale grey notched gills; slender white-greyish stem. Secondary panel: longitudinal cut showing thin white-grey unchanging flesh, notched gills. Detail panel: close-up of whitish-grey sinuate (notched) gills. Detail panel: close-up of the white fibrous stem base in pine needles. Small side-by-side comparison panel: Tricholoma pardinum beside it, drawn TO SCALE: much larger (12-15 cm) fleshy cap with grey-brown scales in a tiger-like pattern on a pale ground, thick stem. Minimal habitat hint: black pine plantation litter, late autumn. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
