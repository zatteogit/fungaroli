# Infografica: Steccherino dorato (*Hydnum repandum*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `repandum`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q13684; sosia: Q262105). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (ingiallisce o si macchia di arancio dove viene toccata o tagliata).
3. **Dettaglio dell'imenoforo** (aculei): biancastri, crema o color salmone.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Sotto il cappello aculei fragili invece di lamelle o pori"
2. "Colori chiari: crema, ocra, salmone"
3. "Carne bianca e fragile, non sugherosa"
4. "Si macchia di arancio al tocco"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Sarcodon imbricato** (*Sarcodon imbricatus*), NON COMMESTIBILE.

Riga di testo: "Cappello bruno coperto di grosse squame sollevate a tegola; aculei bruno-grigi; sporata bruna. Sotto conifere."

Altri sosia da citare in piccolo, solo testo:
- Steccherino rossiccio (*Hydnum rufescens*, commestibile): Più piccolo e arancio-rossiccio, con aculei che non scendono sul gambo. Commestibile ben cotto.
- Sarcodon scabroso (*Sarcodon scabrosus*, non commestibile): Cappello bruno squamuloso, base del gambo verde-bluastra, carne amarissima.
- Idnello di Peck (*Hydnellum peckii*, non commestibile): Consistenza dura e sugherosa, cappello biancastro-rosato che trasuda gocce rosse; sapore piccante. Gli Hydnellum inglobano spesso aghi e rametti.

## Riquadro habitat / stagione / taglia minima
- Habitat: a gruppi o in cerchi in cerrete, faggete, castagneti e boschi di conifere. Nel Reatino citato per i querceti del Cicolano
- Stagione: agosto-novembre, fino a dicembre negli autunni miti
- Taglia minima di raccolta (L.R. Lazio 32/1998): 3 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a group of Hydnum repandum (hedgehog mushroom); irregular lobed caps 6-10 cm, cream to pale orange-ochre, dry and felty; underside covered with dense short fragile pale cream-salmon spines; short thick often off-center white stem. Secondary panel: longitudinal cut showing white brittle flesh with a yellow-orange bruise where cut or handled, spines running slightly down the stem. Detail panel: close-up of crowded cream-salmon spines (teeth). Detail panel: close-up of the short white stem in oak and beech leaf litter. Small side-by-side comparison panel: Sarcodon imbricatus beside it: brown cap with coarse raised overlapping scales and brownish-grey spines. Minimal habitat hint: oak and beech woodland litter. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
