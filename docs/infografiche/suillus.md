# Infografica: Pinarolo (*Suillus luteus; Suillus granulatus; Suillus collinitus*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `suillus`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q816730, Q1142857 (Suillus granulatus), Q1855565 (Suillus collinitus); sosia: Q674065). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (tubuli e pori): gialli, poi giallo-olivastri.
4. **Dettaglio della base del gambo**: anello S. luteus: sì, ampio, membranoso, bianco poi violaceo. S. granulatus e S. collinitus: no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Cresce solo sotto i pini"
2. "Cappello vischioso con cuticola che si stacca"
3. "Pori gialli che non virano al blu"
4. "Anello violaceo (luteus), gocce di lattice sui pori (granulatus), base rosa (collinitus)"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Boleto pepato** (*Chalciporus piperatus*), NON COMMESTIBILE.

Riga di testo: "Piccolo, pori bruno-ramati o rossicci, base del gambo con micelio giallo vivo, sapore piccante come pepe."

Altri sosia da citare in piccolo, solo testo:
- Boleto bovino (*Suillus bovinus*, commestibile): Pori grandi e angolosi, divisi in pori più piccoli, gambo senza anello né granulazioni, carne gommosa. Mediocre.

## Riquadro habitat / stagione / taglia minima
- Habitat: solo sotto pini: rimboschimenti di pino nero e silvestre in montagna, pinete termofile in collina (S. collinitus). Nel Reatino es. pinete dell'Altopiano di Rascino
- Stagione: S. granulatus da maggio a novembre; S. luteus e S. collinitus soprattutto settembre-novembre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: three slippery jacks side by side under pines: Suillus luteus with a 9 cm chocolate-brown glossy slimy cap and a large membranous ring that is whitish above and violet below; Suillus granulatus with a rusty-brown slimy cap and milky droplets on young yellow pores, no ring; Suillus collinitus with a chestnut cap with darker radial fibers, no ring, and pink mycelium at the stem base. Secondary panel: longitudinal cut showing soft white to lemon-yellow flesh that does NOT turn blue, yellow tubes. Detail panel: close-up of small yellow pores with milky droplets (S. granulatus). Detail panel: close-up of three stem bases: violet ring (luteus), granular dots (granulatus), pink mycelium (collinitus). Small side-by-side comparison panel: Chalciporus piperatus beside it: small, copper-red-brown pores, bright yellow mycelium at the base. Minimal habitat hint: black pine needle litter. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
