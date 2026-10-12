# Infografica: Porcino (*Boletus edulis*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `edulis`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q19740; sosia: Q26203731). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (tubuli e pori): bianchi da giovane, poi giallo-crema, infine giallo-verdastri.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Pori bianchi, poi gialli e verdastri: mai rosa, rossi o arancio"
2. "Carne bianca che non cambia colore al taglio"
3. "Gambo panciuto con reticolo fine e chiaro, non scuro"
4. "Cappello nocciola-bruno, spesso con orlo chiaro"
5. "Sapore dolce, mai amaro"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Boleto satana** (*Rubroboletus satanas*), TOSSICO.

Riga di testo: "Cappello bianco-grigiastro, pori rossi, gambo bulboso con reticolo rosso, carne che diventa blu al taglio; da adulto odore sgradevole."

Altri sosia da citare in piccolo, solo testo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): Pori che passano dal bianco al rosa; reticolo grosso e bruno scuro sul gambo; carne amarissima (un solo esemplare rovina tutto il piatto).
- Boleto dal bel piede (*Caloboletus calopus*, non commestibile): Pori gialli che si macchiano di blu; gambo rosso con reticolo chiaro; carne che vira al blu e sapore amaro. Frequente anche in faggeta.
- Boleto radicante (*Caloboletus radicans*, non commestibile): Cappello biancastro come il porcino, ma pori gialli che bluastrano, gambo giallo e carne che vira al blu; amaro.

## Riquadro habitat / stagione / taglia minima
- Habitat: simbionte di faggio, castagno, querce e conifere (abete, pino). Nel Reatino soprattutto nelle faggete montane (circa 1000-1700 m, es. Terminillo, Monti della Laga) e nei castagneti e cerreti più freschi
- Stagione: giugno-novembre, con picco tra fine agosto e ottobre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 4 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a mature Boletus edulis (king bolete) with a stout, swollen club-shaped stem; cap 15 cm across, convex, hazel-brown to chestnut with a narrow paler whitish band at the margin, smooth slightly greasy surface; underside of fine white-to-cream pores; stem pale hazel-white, about as wide as half the cap, covered in the upper half by a fine raised white net (reticulum). Secondary panel: longitudinal cut through cap and stem showing firm pure white flesh that does NOT change color, a thin wine-brown line just under the cap skin, tubes white-cream and easily separable. Detail panel: close-up of round, tiny white-cream pores, unbruised. Detail panel: close-up of the swollen stem base with fine white reticulum fading downward, soil and beech leaves, no ring, no volva. Small side-by-side comparison panel: Rubroboletus satanas beside it: chalky whitish-grey cap, RED pores, bulbous stem with a RED net, flesh turning BLUE when cut. Minimal habitat hint: beech forest floor with leaf litter as subtle background element. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
