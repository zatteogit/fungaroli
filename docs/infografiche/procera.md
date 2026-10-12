# Infografica: Mazza di tamburo (*Macrolepiota procera*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `procera`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q243381; sosia: Q2375450). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile o appena rosata; mai un arrossamento forte e rapido).
3. **Dettaglio dell'imenoforo** (lamelle): bianche o crema, poi un po' rosate.
4. **Dettaglio della base del gambo**: anello sì: doppio, spesso, scorrevole lungo il gambo; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Gambo alto con zigrinature brune 'a pelle di serpente'"
2. "Anello doppio che scorre lungo il gambo"
3. "Cappello grande (oltre 10 cm) con umbone bruno e squame"
4. "Carne bianca che non arrossa al taglio"
5. "Lamelle bianche, staccate dal gambo"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Lepiota bruno-incarnata** (*Lepiota brunneoincarnata*), MORTALE.

Riga di testo: "Piccola: cappello 2-5 cm con squame bruno-rosate; gambo corto con fasce rosate e senza anello scorrevole. Contiene le stesse tossine della falloide."

Altri sosia da citare in piccolo, solo testo:
- Lepiota subincarnata (*Lepiota subincarnata*, mortale): Piccola, cappello sotto i 5 cm con squame rosate; gambo con fiocchi rosati. Ogni 'mazzetta' sotto i 10 cm va scartata.
- Lepiota crestata (*Lepiota cristata*, tossico): Cappello 2-5 cm bianco con squamette brune concentriche; anello fragile non scorrevole; odore sgradevole, di gomma.
- Mazza di tamburo arrossante (*Chlorophyllum rhacodes*, tossico): Gambo liscio senza zigrinature; bulbo marcato; la carne tagliata diventa subito rosso-arancio e poi bruna. Cappello più piccolo, a squame grosse. Causa disturbi in molte persone.
- Mazza di tamburo velenosa (*Chlorophyllum venenatum*, tossico): Tozza, gambo liscio con bulbo grosso e squadrato, anello semplice, carne arrossante. Tipica di orti, giardini e cumuli di compost.

## Riquadro habitat / stagione / taglia minima
- Habitat: prati, pascoli, radure, margini di bosco e strade, in boschi di latifoglie e conifere; anche in pineta
- Stagione: luglio-novembre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 5 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: Macrolepiota procera (parasol mushroom) shown as a closed young 'drumstick' specimen and a fully open mature one; mature cap 22 cm, flat with a central smooth brown umbo and concentric brown scales on a cream fibrous background, shaggy margin; free white gills; very tall slender hollow stem 25-30 cm with a small basal bulb, decorated with brown snakeskin-like transverse bands; a thick double ring loose on the stem. Secondary panel: longitudinal cut showing white soft flesh in the cap, hollow fibrous stem, flesh NOT reddening. Detail panel: close-up of free white gills separated from the stem by a collar. Detail panel: close-up of the stem with snakeskin pattern and a hand sliding the double ring along it, bulbous base in grass. Small side-by-side comparison panel: small Lepiota brunneoincarnata beside it, drawn TO SCALE: cap only 3-4 cm with pinkish-brown scales, short stem with pinkish bands, no sliding ring. Minimal habitat hint: meadow edge with grass. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
