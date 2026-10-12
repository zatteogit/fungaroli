# Infografica: Porcino nero (*Boletus aereus*)

Bozza di brief per l'AI che genera le illustrazioni. Fonte dei testi: `data/species-id.json` (id `aereus`).

## Formato
Verticale 4:5, 1080×1350 px. Lasciare margini liberi di almeno 60 px per l'impaginazione.

## Stile
- Illustrazione naturalistica da guida da campo, acquerello e matita precisi, colori realistici.
- **Fedele a foto reali di riferimento**: forme, colori e proporzioni vanno copiati da fotografie verificate su Wikimedia Commons (Wikidata Q757127; sosia: Q26203718). Niente invenzioni: se un dettaglio non è chiaro nelle foto, va lasciato neutro, non immaginato.
- Sfondo neutro chiaro (carta avorio o grigio caldo molto chiaro), luce morbida e uniforme.
- **Nessun testo generato dall'AI**: niente scritte, numeri o frecce con parole. Le etichette si aggiungono dopo, in impaginazione.

## Composizione
1. **Vista intera di 3/4** (circa metà superiore): esemplare tipico adulto, eventualmente affiancato da uno giovane.
2. **Sezione longitudinale**: carne, colore e viraggio (immutabile).
3. **Dettaglio dell'imenoforo** (tubuli e pori): bianchi, poi giallastri e giallo-verdastri.
4. **Dettaglio della base del gambo**: anello no; volva no.
5. **Riquadro "Non confonderlo con"** in basso a sinistra.
6. **Riquadro habitat / stagione / taglia minima** in basso a destra.

## Etichette da apporre (testo esatto)
1. "Cappello bruno scuro, quasi nero, vellutato"
2. "Pori bianchi poi gialli, che non cambiano colore"
3. "Carne bianca, durissima, che non vira"
4. "Gambo bruno-ocra con reticolo fine"

## Riquadro "Non confonderlo con"
Illustrazione affiancata, alla stessa scala, di **Boleto a piede rosso (B. erythropus auct.)** (*Neoboletus luridiformis*), TOSSICO.

Riga di testo: "Cappello scuro simile, ma pori rossi, gambo punteggiato di rosso e carne gialla che diventa blu all'istante."

Altri sosia da citare in piccolo, solo testo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): Pori rosa, reticolo scuro e grossolano, carne amarissima.
- Boleto baio (*Imleria badia*, commestibile): Cappello bruno simile ma gambo snello senza reticolo; pori gialli che si macchiano di blu se premuti.

## Riquadro habitat / stagione / taglia minima
- Habitat: termofilo: castagneti, cerrete, querceti a roverella e leccete, spesso in radure soleggiate. Nel Reatino in collina e bassa montagna (circa 300-1000 m), es. castagneti dell'Alta Valle del Velino e del Cicolano
- Stagione: giugno-ottobre, con buttate dopo i temporali estivi e in settembre
- Taglia minima di raccolta (L.R. Lazio 32/1998): 4 cm di diametro del cappello
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

## Prompt (inglese)
```
Naturalistic field-guide scientific illustration, watercolor and fine pencil, faithful to real reference photographs, realistic colors and proportions, light neutral ivory background, soft even lighting, vertical 4:5 layout with clear empty margins. Main view, three-quarter angle: a mature Boletus aereus (bronze bolete) with a massive stem; cap 14 cm, very dark brown to almost black-bronze with some irregular paler ochre-brown patches, dry velvety surface, slightly uneven as if dented; pores white to pale yellow; stem stout, ochre-beige to light brown with a fine brownish net. Secondary panel: longitudinal cut showing very firm pure white flesh, no color under the cap skin, unchanging, pale yellow tubes. Detail panel: close-up of fine pale yellowish pores, unbruised. Detail panel: close-up of the bulbous stem base in dry chestnut and oak litter, no ring, no volva. Small side-by-side comparison panel: Neoboletus luridiformis beside it: similar dark cap but RED pores and yellow flesh turning BLUE instantly. Minimal habitat hint: chestnut burrs and oak leaves. Clean separated panels, no text, no labels.
```

## Negative prompt
```
text, letters, labels, numbers, watermark, logo, signature, caption, arrows with words, cartoon, anime, 3D render, plastic look, glossy CGI, fantasy colors, glowing, extra stems, fused or duplicated caps, wrong gill or pore color, wrong proportions, distorted anatomy, insects, hands with extra fingers, busy background, dark background, heavy shadows, blur, low resolution
```
