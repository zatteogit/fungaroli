# Infografica: Porcino estivo (*Boletus reticulatus (= B. aestivalis)*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `aestivalis`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q26203726; sosia: Q26203731). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (tubuli e pori): bianchi, poi giallini e giallo-verdastri.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Cappello nocciola uniforme, vellutato, spesso screpolato"
2. "Reticolo bruno su tutto il gambo, fino alla base"
3. "Pori bianchi poi gialli, mai rosa o rossi"
4. "Carne bianca immutabile"
5. "Nasce presto, con il caldo"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Boleto satana** (*Rubroboletus satanas*), TOSSICO.

Riga di testo: "Stessa stagione e stessi boschi caldi su calcare, ma cappello bianco-grigio, pori rossi, reticolo rosso e carne che vira al blu."

Altri sosia da citare in piccolo, solo testo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): È il sosia classico del porcino estivo: pori che diventano rosa, reticolo bruno scuro e a maglie larghe, carne amarissima.
- Boleto radicante (*Caloboletus radicans*, non commestibile): Cappello chiaro, pori gialli che bluastrano, gambo giallo, carne che vira al blu e amara.

## Riquadro habitat / stagione / taglia minima
- Habitat: boschi caldi di latifoglie: castagno, cerro, roverella, anche faggio a quote basse. Nel Reatino in castagneti e cerrete tra circa 400 e 1100 m
- Stagione: maggio-settembre, con ripresa a inizio autunno
- Taglia minima di raccolta (L.R. Lazio 32/1998): 4 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a mature Boletus reticulatus (summer bolete) with a cylindrical sturdy stem; cap 13 cm, uniform hazel-brown, dry, matte, velvety, with fine cracks in the cuticle showing paler flesh; pores white to pale yellow-green; stem hazel-beige covered from top to base by a raised brown net. Secondary panel: longitudinal cut showing white, rather soft unchanging flesh, yellowish tubes, a few small larva tunnels optional. Detail panel: close-up of small pale yellowish pores. Detail panel: close-up of the stem with the brown reticulum reaching the very base, chestnut litter, no ring, no volva. Small side-by-side comparison panel: Rubroboletus satanas beside it: chalky whitish-grey cap, RED pores, bulbous stem with a RED net, flesh turning BLUE when cut. Minimal habitat hint: warm chestnut and oak woodland litter. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
