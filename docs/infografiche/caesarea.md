# Infografica: Ovolo buono (*Amanita caesarea*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `caesarea`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q220662; sosia: Q188643). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (lamelle): giallo oro.
4. **Dettaglio della base del gambo**: anello sì: ampio, membranoso, giallo, pendente; volva sì: a sacco, bianca, ampia, membranosa e spessa, libera dal gambo.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Lamelle, gambo e anello GIALLI"
2. "Volva a sacco BIANCA, grande e spessa"
3. "Cappello arancio vivo con orlo striato"
4. "In sezione l'ovolo mostra il cappello arancio e il giallo all'interno"
5. "Va raccolto solo aperto: l'ovolo chiuso è vietato"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Tignosa verdognola** (*Amanita phalloides*), MORTALE.

Riga di testo: "Allo stato di ovolo è il pericolo maggiore: tagliato in sezione mostra cappello e carne bianchi o verdastri, mai arancio e giallo. Da adulta ha cappello verde-oliva, lamelle e anello bianchi."

Altri sosia da citare in piccolo, solo testo:
- Tignosa di primavera (*Amanita verna*, mortale): Interamente bianca: cappello, lamelle, gambo, anello e volva. Nessuna parte gialla o arancio.
- Tignosa bianca (*Amanita virosa*, mortale): Tutta bianca, cappello spesso conico, gambo fioccoso; volva a sacco bianca. Mai lamelle gialle.
- Ovolo malefico (*Amanita muscaria*, tossico): Cappello rosso con verruche bianche, che la pioggia può lavare via lasciandolo liscio e arancio; ma lamelle, gambo e anello sono BIANCHI e la volva è ridotta a cercini sul bulbo, non a sacco.
- Amanita crocea (*Amanita crocea*, tossico): Cappello arancio più pallido, gambo con squamette a zebratura e senza anello; lamelle bianco-crema. Tossica cruda.

## Riquadro habitat / stagione / taglia minima
- Habitat: castagneti, cerrete e querceti a roverella luminosi e asciutti, di solito sotto i 1000 m. Nel Reatino nella cintura collinare e pedemontana (es. Poggio Bustone, Cantalice, Antrodoco)
- Stagione: giugno-ottobre, soprattutto luglio-settembre dopo piogge calde
- Taglia minima di raccolta (L.R. Lazio 32/1998): 4 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: Amanita caesarea (Caesar's mushroom) shown as two stages: an opening specimen just breaking out of a thick white egg-shaped sac, and a mature specimen with a flat bright orange-red cap 15 cm wide, smooth and glossy, with radially striate margin; GOLDEN-YELLOW gills; yellow cylindrical stem with a large hanging YELLOW membranous ring; at the base a large, thick, white, sac-like (saccate) volva. Secondary panel: longitudinal cut of the young egg: thick white outer volva, inside an orange cap layer, yellow gills and yellow stem tissue; and a cut of the mature stem showing white flesh, yellow under the cap skin. Detail panel: close-up of crowded free golden-yellow gills. Detail panel: close-up of the stem base dug out of soil showing the large white saccate volva. Small side-by-side comparison panel: Amanita phalloides beside it: greenish-olive cap, WHITE gills, WHITE ring, white sac volva; its egg cut in half is all white/greenish inside. Minimal habitat hint: sunny chestnut and oak clearing. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
