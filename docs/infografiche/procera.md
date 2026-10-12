# Infografica: Mazza di tamburo (*Macrolepiota procera*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `procera` (Wikidata [Q243381](https://www.wikidata.org/wiki/Q243381)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere la mazza di tamburo (grande, gambo zigrinato, anello doppio scorrevole) e separarla dalle piccole Lepiota mortali.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 10-30 cm, da giovane ovale chiuso 'a mazza di tamburo', poi aperto a ombrello con umbone centrale; colore fondo crema-nocciola con umbone bruno liscio e squame brune disposte in cerchi; superficie fibrosa, asciutta, con squame che si diradano verso il margine sfrangiato. Gambo molto alto e sottile, cavo, con bulbo alla base, fondo chiaro decorato da bande brune; con zigrinature brune trasversali, come pelle di serpente, sotto l'anello.
- **B. Sezione longitudinale.** Carne bianca, morbida nel cappello, fibrosa e dura nel gambo; al taglio: **immutabile o appena rosata; mai un arrossamento forte e rapido**.
- **C. Imenoforo (lamelle).** Bianche o crema, poi un po' rosate; fitte, morbide, libere: staccate dal gambo da un collarino.
- **D. Base del gambo.** Anello: sì: doppio, spesso, scorrevole lungo il gambo. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore gradevole, di nocciola; sapore dolce, di nocciola; sporata bianca o crema.

**E. Riquadro "Non confonderlo con":** **Lepiota bruno-incarnata** (*Lepiota brunneoincarnata*), MORTALE.  
Differenza in una riga: *Piccola (cappello 2-5 cm), squame bruno-rosate, gambo corto senza anello scorrevole: scarta ogni 'mazzetta' sotto i 10 cm.*  
Testo completo dai dati: Piccola: cappello 2-5 cm con squame bruno-rosate; gambo corto con fasce rosate e senza anello scorrevole. Contiene le stesse tossine della falloide.

Altri sosia, solo testo in piccolo:
- Lepiota subincarnata (*Lepiota subincarnata*, mortale): Piccola, cappello sotto i 5 cm con squame rosate; gambo con fiocchi rosati. Ogni 'mazzetta' sotto i 10 cm va scartata.
- Lepiota crestata (*Lepiota cristata*, tossico): Cappello 2-5 cm bianco con squamette brune concentriche; anello fragile non scorrevole; odore sgradevole, di gomma.
- Mazza di tamburo arrossante (*Chlorophyllum rhacodes*, tossico): Gambo liscio senza zigrinature; bulbo marcato; la carne tagliata diventa subito rosso-arancio e poi bruna. Cappello più piccolo, a squame grosse. Causa disturbi in molte persone.
- Mazza di tamburo velenosa (*Chlorophyllum venenatum*, tossico): Tozza, gambo liscio con bulbo grosso e squadrato, anello semplice, carne arrossante. Tipica di orti, giardini e cumuli di compost.

**Riquadro habitat / stagione / taglia:**
- Habitat: prati, pascoli, radure, margini di bosco e strade, in boschi di latifoglie e conifere; anche in pineta.
- Stagione: luglio-novembre.
- Taglia minima di raccolta: 5 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Tossica cruda o poco cotta: cuocila a lungo; evita piastra e griglia se l'interno resta crudo.
- Si consuma solo il cappello: il gambo è fibroso e va scartato.
- Raccogli solo esemplari grandi con tutti i caratteri: le piccole Lepiota sono mortali. Taglia minima di legge 5 cm, ma è prudente scartare tutto sotto i 10 cm.
- Accumula metalli pesanti: evita prati a bordo strada e aree inquinate.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Macrolepiota-procera.jpg) | Chrumps | CC BY-SA 4.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Subiaco RM (2016-09-13) | [link](https://www.inaturalist.org/observations/4111137) | Davide | CC BY-NC | solo confronto |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, 60044 Fabriano AN, Italia (2022-10-15) | [link](https://www.inaturalist.org/observations/138820295) | Giorgio | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Manziana, Lazio, IT (2023-11-04) | [link](https://www.inaturalist.org/observations/206244861) | giorgio_fabrizi | CC BY-NC | solo confronto |
| 5 | Foto | dettaglio del gambo con l'anello doppio | [link](https://commons.wikimedia.org/wiki/File:Parasol-Macrolepiota-procera-stem-ring-crop.jpg) | Holger Krisp | CC BY 3.0 | Image 2 |
| 6 | Tavola | tavola storica di *Lepiota procera* (= *Macrolepiota procera*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Lepiota_procera.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. I, tav. 20, 1927; Commons: CC PDM 1.0) | Image 3 |
| 7 | Foto (sosia, iNaturalist, research grade) | Lepiota brunneoincarnata in natura | [link](https://www.inaturalist.org/observations/398639607) | Javier Marcos Martínez | CC BY-NC | Image 4 |
| 8 | Tavola (sosia) | tavola di *L. brunneoincarnata* | [link](https://commons.wikimedia.org/wiki/File:Lange_-_Lepiota_brunneoincarnata.png) | Jakob Emanuel Lange (1864-1941) | Pubblico dominio (Flora Agaricina Danica, vol. 1, 1935, tav. 13; Commons: PD-old-80) | Image 5 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 5, Image 3 = riga 6, Image 4 = riga 7, Image 5 = riga 8. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 6) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Macrolepiota procera (mazza di tamburo) from the dangerous look-alike Lepiota brunneoincarnata. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of adult Macrolepiota procera: authority for the cap pattern, size and the tall stem.
Image 2: close-up photo of the Macrolepiota procera stem with its double ring: authority for the ring and the snakeskin banding.
Image 3: historical watercolor plate of Macrolepiota procera by Bresadola: style reference only.
Image 4: photo of Lepiota brunneoincarnata: authority for the look-alike's small size and pinkish-brown scales.
Image 5: historical plate of Lepiota brunneoincarnata by J. E. Lange: shape and color reference for the look-alike.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Macrolepiota procera in a grassy woodland clearing at three-quarter view, with a young closed 'drumstick' specimen beside it. The open cap is about 22 cm across, umbrella-like, with a smooth dark-brown central umbo and a cream-hazel ground covered by brown scales in concentric rings, thinning toward the fringed margin. The stem is very tall (about 25 cm), slender and hollow, with a bulb at the base, and below the ring it is decorated with transverse brown snakeskin bands. A thick double ring sits loose on the stem.
B. Middle left: a longitudinal section: soft white flesh in the cap, a fibrous hollow stem, flesh white or barely pinkish (no strong reddening), and gills free from the stem, separated from it by a collar.
C. Middle right: a close-up of the crowded, soft, white-cream free gills ending at a collar around the stem apex.
D. Below B and C, small: the bulbous stem base with the snakeskin banding above it and no volva, and the double ring shown slid partway down the stem.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Lepiota brunneoincarnata at its true relative scale, about one fifth the size of the parasol (cap 2 to 5 cm): a small cap with pinkish-brown scales on a whitish ground, and a short stem with pinkish-brown bands and no movable ring.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- snakeskin banding on the Macrolepiota procera stem
- a thick double ring that is free on the stem
- a large cap over 10 cm with a brown umbo and concentric scales
- white flesh that does not redden
- the look-alike clearly tiny compared to the parasol

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; a smooth stem; a thin fixed ring; flesh turning red or orange; a volva; the lepiota drawn as large as the parasol; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Macrolepiota procera (mazza di tamburo) and to tell it apart from the dangerous look-alike Lepiota brunneoincarnata. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of adult Macrolepiota procera: authority for the cap pattern, size and the tall stem; the second image is a close-up photo of the Macrolepiota procera stem with its double ring: authority for the ring and the snakeskin banding; the third image is a historical watercolor plate of Macrolepiota procera by Bresadola: style reference only; the fourth image is a photo of Lepiota brunneoincarnata: authority for the look-alike's small size and pinkish-brown scales; the fifth image is a historical plate of Lepiota brunneoincarnata by J. E. Lange: shape and color reference for the look-alike. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a mature Macrolepiota procera in a grassy woodland clearing at three-quarter view, with a young closed 'drumstick' specimen beside it. The open cap is about 22 cm across, umbrella-like, with a smooth dark-brown central umbo and a cream-hazel ground covered by brown scales in concentric rings, thinning toward the fringed margin. The stem is very tall (about 25 cm), slender and hollow, with a bulb at the base, and below the ring it is decorated with transverse brown snakeskin bands. A thick double ring sits loose on the stem.
Then, in the middle row, paint on the left a longitudinal section: soft white flesh in the cap, a fibrous hollow stem, flesh white or barely pinkish (no strong reddening), and gills free from the stem, separated from it by a collar, and on the right a close-up of the crowded, soft, white-cream free gills ending at a collar around the stem apex.
Below them, add a small vignette of the bulbous stem base with the snakeskin banding above it and no volva, and the double ring shown slid partway down the stem.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Lepiota brunneoincarnata at its true relative scale, about one fifth the size of the parasol (cap 2 to 5 cm): a small cap with pinkish-brown scales on a whitish ground, and a short stem with pinkish-brown bands and no movable ring.

Keep these facts exactly right: snakeskin banding on the Macrolepiota procera stem; a thick double ring that is free on the stem; a large cap over 10 cm with a brown umbo and concentric scales; white flesh that does not redden; the look-alike clearly tiny compared to the parasol. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Lepiota brunneoincarnata at its true relative scale, about one fifth the size of the parasol (cap 2 to 5 cm): a small cap with pinkish-brown scales on a whitish ground, and a short stem with pinkish-brown bands and no movable ring. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Mazza di tamburo  
  **Sottotitolo:** *Macrolepiota procera* · buono
- **Etichette con linea di richiamo:**
  - "Gambo zigrinato 'a pelle di serpente'" → A/D
  - "Anello doppio, scorrevole" → D
  - "Cappello oltre 10 cm, umbone bruno" → A
  - "Carne bianca, non arrossa" → B
  - "Lamelle bianche, libere" → C
- **Riquadro sosia:** titolo "Non confonderlo con" · "Lepiota bruno-incarnata" · *Lepiota brunneoincarnata* · MORTALE  
  Riga: "Piccola (cappello 2-5 cm), squame bruno-rosate, gambo corto senza anello scorrevole: scarta ogni 'mazzetta' sotto i 10 cm."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 5 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Gambo alto con zigrinature brune 'a pelle di serpente'
  - Anello doppio che scorre lungo il gambo
  - Cappello grande (oltre 10 cm) con umbone bruno e squame
  - Carne bianca che non arrossa al taglio
  - Lamelle bianche, staccate dal gambo

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Zigrinature brune trasversali sul gambo sotto l'anello.
- [ ] Anello spesso, doppio, staccato dal gambo.
- [ ] Cappello grande, squame concentriche, umbone liscio bruno.
- [ ] Sezione bianca, senza arrossamento (altrimenti è *Chlorophyllum rhacodes*).
- [ ] Lepiota: piccola davvero (rapporto circa 1:5), gambo corto e senza anello scorrevole.

**Errori tipici da scartare:** gambo liscio, anello semplice e fisso, carne che arrossa, bulbo grosso e squadrato (*C. venenatum*), lepiota disegnata grande come la mazza, presenza di volva.
