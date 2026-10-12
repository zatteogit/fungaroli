# Infografica: Porcino rosso (*Boletus pinophilus*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `pinophilus`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q1415435; sosia: Q26203718). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (tubuli e pori): bianchi, poi giallo-crema e giallo-olivastri.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Cappello rosso-bruno, granuloso, opaco"
2. "Pori bianchi poi gialli, mai rosa o rossi"
3. "Carne bianca che non vira, rosata solo sotto la cuticola"
4. "Gambo tozzo con reticolo chiaro o rossiccio"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Boleto a piede rosso (B. erythropus auct.)** (*Neoboletus luridiformis*), TOSSICO.

Riga di testo: "Pori rossi e gambo punteggiato di rosso, senza reticolo; la carne gialla diventa subito blu intenso al taglio. Tossico crudo."

Altri sosia da citare in piccolo, solo testo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): Pori rosati, reticolo bruno scuro e grossolano, carne amarissima. Comune sotto conifere.
- Boleto dal bel piede (*Caloboletus calopus*, non commestibile): Pori gialli che bluastrano, gambo rosso con reticolo chiaro, carne che vira al blu e amara.

## Riquadro habitat / stagione / taglia minima
- Habitat: con pini, abete e faggio, più raramente castagno, su suoli acidi. Nel Reatino soprattutto nelle faggete alte e nei boschi misti con conifere
- Stagione: una prima buttata a fine primavera (maggio-giugno) e poi agosto-ottobre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 4 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a mature Boletus pinophilus (pine bolete) with a very stout barrel-shaped stem; cap 14 cm, convex, deep reddish-brown to mahogany, matte and finely granular-wrinkled; pores white turning cream-yellow; stem whitish flushed reddish-brown with a fine pale-to-reddish net in the upper part. Secondary panel: longitudinal cut showing white unchanging flesh with a wine-red band directly under the cap skin, cream-yellow tubes. Detail panel: close-up of tiny cream-yellow pores, no blue staining. Detail panel: close-up of the thick stem base among pine needles and beech leaves, no ring, no volva. Small side-by-side comparison panel: Neoboletus luridiformis beside it: dark brown cap but RED pores, red-dotted stem without net, yellow flesh turning deep BLUE when cut. Minimal habitat hint: mixed beech and pine litter. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
