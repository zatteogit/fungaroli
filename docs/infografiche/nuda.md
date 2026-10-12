# Infografica: Agarico violetto (*Lepista nuda (= Collybia nuda)*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `nuda`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q29362; sosia: Q948871). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (lamelle): viola-lilla, poi lilla-rosate o brunastre.
4. **Dettaglio della base del gambo**: anello no (nessuna cortina o ragnatela); volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Tutto viola o lilla: cappello, lamelle e gambo"
2. "Nessuna cortina o ragnatela tra cappello e gambo"
3. "Sporata rosa pallido, mai ruggine"
4. "Odore aromatico e fruttato"
5. "Fungo tardivo, di fine autunno"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Cortinario tragano** (*Cortinarius traganus*), TOSSICO.

Riga di testo: "Lilla con cortina ragnatelosa, lamelle che diventano color ruggine, carne giallo-zafferano nel gambo, odore di acetilene o di caprone; sporata ruggine."

Altri sosia da citare in piccolo, solo testo:
- Cortinario violaceo (*Cortinarius violaceus*, non commestibile): Viola scurissimo, cappello squamuloso-vellutato, cortina, sporata ruggine. Tutti i cortinari violetti vanno scartati.
- Inocibe lilla (*Inocybe lilacina*, tossico): Piccolo (2-4 cm), cappello conico setoso lilla, lamelle grigio-brune, odore di terra; sporata bruna.
- Micena pura (*Mycena pura*, tossico): Piccola (2-5 cm), carne sottile, margine striato, gambo cavo e fragile, odore di rapa o ravanello.
- Laccaria ametistina (*Laccaria amethystina*, commestibile): Piccola, viola intenso, lamelle spesse e spaziate, gambo sottile e fibroso, sporata bianca.

## Riquadro habitat / stagione / taglia minima
- Habitat: sulla lettiera di boschi di conifere e latifoglie, anche margini, siepi e prati, spesso in cerchi. Nel Reatino segnalata nelle pinete dell'Altopiano di Rascino
- Stagione: ottobre-dicembre, a volte fino a gennaio
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a group of Lepista nuda (wood blewit) in leaf and needle litter; caps 8-10 cm, lilac-violet becoming brownish-violet at center, smooth, slightly greasy, margin inrolled; crowded violet-lilac gills; stout violet fibrillose stem with violet mycelium at the base. Secondary panel: longitudinal cut showing lilac-grey firm flesh, gills easily separating from the cap flesh. Detail panel: close-up of crowded lilac gills; a pale pinkish spore print on white paper. Detail panel: close-up of the slightly swollen stem base with violet mycelium, NO cobweb veil. Small side-by-side comparison panel: Cortinarius traganus beside it: lilac cap but cobweb veil remnants on the stem, rusty gills and a RUSTY-BROWN spore print. Minimal habitat hint: mixed pine and oak litter, late autumn. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
