# Infografica: Chiodino (*Armillaria mellea*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `mellea`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q473745; sosia: Q248829). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (lamelle): bianche o crema, poi giallastre con macchie bruno-rosate.
4. **Dettaglio della base del gambo**: anello sì: membranoso, ampio, bianco sopra e giallastro-fioccoso sotto; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Cespi fitti su legno o radici"
2. "Sporata BIANCA: i gambi sottostanti si coprono di polvere bianca"
3. "Anello membranoso bianco-giallastro"
4. "Squamette scure al centro del cappello"
5. "Cordoni neri alla base dei gambi"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Galerina marginata** (*Galerina marginata*), MORTALE.

Riga di testo: "Più piccola (cappello 1-5 cm), bruno-ocra liscia senza squamette; anello sottile spesso sporcato di ruggine; sporata bruno-ruggine, non bianca. Su legno, anche nella stagione dei chiodini."

Altri sosia da citare in piccolo, solo testo:
- Falso chiodino (*Hypholoma fasciculare*, tossico): Giallo zolfo; lamelle giallo-verdastre poi nerastre; niente anello vero, solo una cortina; sporata bruno-violacea scura; sapore molto amaro.
- Cortinario rubello (*Cortinarius rubellus*, mortale): Fulvo-aranciato, cappello conico a punta, cortina e non anello, sporata ruggine; cresce a terra sotto conifere. Danni renali tardivi.
- Folliota spettabile (*Gymnopilus junonius*, tossico): Più grande, giallo-oro o arancio, carne amara; lamelle che diventano ruggine e sporata ruggine.
- Folliota squarrosa (*Pholiota squarrosa*, non commestibile): Cappello e gambo coperti di grosse squame rialzate e asciutte; sporata bruno-ruggine.
- Chiodino senza anello (*Armillaria tabescens (= Desarmillaria tabescens)*, commestibile): Simile ma senza anello; stesse cautele del chiodino (tossico crudo).

## Riquadro habitat / stagione / taglia minima
- Habitat: parassita a cespi su ceppaie, radici e tronchi di latifoglie (querce, castagno, faggio, carpino, pioppi e salici) e più raramente conifere
- Stagione: settembre-novembre, a ondate dopo le prime piogge fresche
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a dense clump of Armillaria mellea (honey fungus) growing from an oak stump; caps 4-8 cm, honey-yellow to tawny-brown with small dark hairy scales concentrated at the center, slightly striate margin; whitish to cream gills; curved stems fused at the base, yellowish above, dark olive-brown below, each with a white-yellowish membranous ring; white spore dust deposited on lower caps. Secondary panel: longitudinal cut of one specimen showing white flesh, fibrous stem, ring position. Detail panel: close-up of whitish slightly decurrent gills. Detail panel: close-up of fused stem bases with black bootlace rhizomorphs on the wood. Small side-by-side comparison panel: Galerina marginata beside it, drawn TO SCALE: small smooth ochre-brown caps 2-4 cm, thin brownish ring, rusty-brown spore dust. Minimal habitat hint: old oak stump in autumn woodland. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
