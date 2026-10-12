# Infografica: Trombetta dei morti (*Craterellus cornucopioides*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `cornucopioides` (Wikidata [Q857903](https://www.wikidata.org/wiki/Q857903)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere la trombetta dei morti (tromba nera cava fino alla base, esterno grigio liscio). Non ha sosia tossici rilevanti: il riquadro mostra il simile più comune.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 2-8 cm, a tromba o imbuto profondo, cavo fino alla base, con orlo arricciato e ondulato; colore interno bruno-nerastro o nero; più grigio col secco; superficie interno squamuloso-fibrilloso, opaco. Gambo non distinto: è la parte bassa, stretta, della tromba; cavo, grigio-nerastro; liscia.
- **B. Sezione longitudinale.** Carne grigia o nerastra, sottile, elastica; al taglio: **immutabile**.
- **C. Imenoforo (pliche).** Grigio cenere o grigio-bluastro, come pruinoso; la faccia esterna è liscia o appena rugosa, senza lamelle né pliche marcate.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore gradevole, fruttato, intenso da secco; sapore gradevole, aromatico; sporata bianca.

**E. Riquadro "Non confonderlo con":** **Craterello cenerino** (*Craterellus cinereus (= Cantharellus cinereus)*), COMMESTIBILE.  
Differenza in una riga: *Simile e grigio-nerastro, ma con pliche venose e forcate ben evidenti sulla faccia esterna.*  
Testo completo dai dati: Simile, grigio-nerastro, ma con pliche venose e forcate ben evidenti sulla faccia esterna, che nella trombetta è quasi liscia.

> La specie non ha sosia tossici rilevanti (dati). Al posto di "Non confonderlo con" il riquadro può intitolarsi "Simile" o "Si distingue da", con l'etichetta "commestibile" in verde e non in rosso.

Altri sosia, solo testo in piccolo:
- Craterello sinuoso (*Pseudocraterellus undulatus*, commestibile): Più piccolo ed esile, grigio-bruno, molto ondulato e sinuoso, non a tromba profonda; faccia esterna quasi liscia.
- Urnula (*Urnula craterium*, non commestibile): Coppa nera e coriacea su rami interrati, a fine inverno e primavera; interno nero, esterno bruno feltrato.

**Riquadro habitat / stagione / taglia:**
- Habitat: a gruppi numerosi tra le foglie di faggete, cerrete, castagneti e boschi misti umidi, spesso su suolo calcareo e lungo i fossi.
- Stagione: settembre-novembre, a volte fino a dicembre.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Non ha sosia tossici rilevanti, ma raccogli solo esemplari freschi: quelli vecchi e molli si alterano.
- Pulisci bene l'interno della tromba da terra e insetti; va consumata cotta.
- Si essicca molto bene.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Craterellus_cornucopioides_JPG1.jpg) | Jean-Pol GRANDMONT | CC BY 3.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Marche, IT (2023-11-25) | [link](https://www.inaturalist.org/observations/194010261) | Manuela Fiorini | CC BY | solo confronto |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, 64010 Rocca Santa Maria, Province of Teramo, Italy (2020-10-27) | [link](https://www.inaturalist.org/observations/63689919) | Alessandro Ariosti | CC BY-SA | Image 2 |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, 52100 Arezzo AR, Italia (2024-10-27) | [link](https://www.inaturalist.org/observations/249367365) | gretezzz | CC BY-NC | solo confronto |
| 5 | Tavola | tavola storica di *C. cornucopioides* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Craterellus_cornucopioides.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. X, tav. 485, 1929; Commons: CC PDM 1.0) | Image 3 |
| 6 | Foto (sosia, iNaturalist, research grade) | Craterellus cinereus in natura | [link](https://www.inaturalist.org/observations/243675622) | Manuela Fiorini | CC BY | Image 4 |
| 7 | Tavola (sosia) | tavola storica di *Cantharellus cinereus* (= *Craterellus cinereus*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Cantharellus_cinereus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. X, tav. 480, 1929; Commons: CC PDM 1.0) | solo confronto |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 3, Image 3 = riga 5, Image 4 = riga 6. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Craterellus cornucopioides (trombetta dei morti) from the dangerous look-alike Craterellus cinereus (= Cantharellus cinereus). Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Craterellus cornucopioides: authority for the black trumpet shape and the grey smooth outer surface.
Image 2: photo of Craterellus cornucopioides from central Italy: second authority for color and the smooth outer surface.
Image 3: historical watercolor plate of Craterellus cornucopioides by Bresadola: style reference only.
Image 4: photo of Craterellus cinereus: authority for the look-alike's raised forked ridges on the outer surface.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a cluster of Craterellus cornucopioides among beech leaf litter at three-quarter view: deep trumpets 4 to 10 cm tall, hollow all the way down, with a sooty brown-black, finely scaly inner surface and a wavy rim rolled outward; the outer surface ash-grey to bluish-grey, smooth or barely wrinkled, slightly powdery.
B. Middle left: a longitudinal cut through one trumpet: a hollow funnel continuous to the very base, with thin, grey-black, elastic flesh like a thin rubbery membrane.
C. Middle right: a close-up of the outer surface: smooth to faintly wrinkled, ash-grey, with no gills and no distinct ridges.
D. Below B and C, small: the narrow hollow base among the leaves, with no ring and no volva.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a small group of Craterellus cinereus at the same scale: smaller grey-black funnels with clearly raised, forked, vein-like ridges on the grey outer surface, running down the stem.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- trumpets hollow down to the base
- a smooth grey outer surface on Craterellus cornucopioides, without gills or ridges
- thin elastic flesh
- growth in groups among leaf litter
- the look-alike with obvious forked ridges on its outer surface

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; gills or ridges on the cornucopioides; brown or yellow tones; a solid stem; growth on wood; a cup-shaped black fungus on twigs; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Craterellus cornucopioides (trombetta dei morti) and to tell it apart from the dangerous look-alike Craterellus cinereus (= Cantharellus cinereus). The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Craterellus cornucopioides: authority for the black trumpet shape and the grey smooth outer surface; the second image is a photo of Craterellus cornucopioides from central Italy: second authority for color and the smooth outer surface; the third image is a historical watercolor plate of Craterellus cornucopioides by Bresadola: style reference only; the fourth image is a photo of Craterellus cinereus: authority for the look-alike's raised forked ridges on the outer surface. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a cluster of Craterellus cornucopioides among beech leaf litter at three-quarter view: deep trumpets 4 to 10 cm tall, hollow all the way down, with a sooty brown-black, finely scaly inner surface and a wavy rim rolled outward; the outer surface ash-grey to bluish-grey, smooth or barely wrinkled, slightly powdery.
Then, in the middle row, paint on the left a longitudinal cut through one trumpet: a hollow funnel continuous to the very base, with thin, grey-black, elastic flesh like a thin rubbery membrane, and on the right a close-up of the outer surface: smooth to faintly wrinkled, ash-grey, with no gills and no distinct ridges.
Below them, add a small vignette of the narrow hollow base among the leaves, with no ring and no volva.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a small group of Craterellus cinereus at the same scale: smaller grey-black funnels with clearly raised, forked, vein-like ridges on the grey outer surface, running down the stem.

Keep these facts exactly right: trumpets hollow down to the base; a smooth grey outer surface on Craterellus cornucopioides, without gills or ridges; thin elastic flesh; growth in groups among leaf litter; the look-alike with obvious forked ridges on its outer surface. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a small group of Craterellus cinereus at the same scale: smaller grey-black funnels with clearly raised, forked, vein-like ridges on the grey outer surface, running down the stem. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Trombetta dei morti  
  **Sottotitolo:** *Craterellus cornucopioides* · ottimo
- **Etichette con linea di richiamo:**
  - "Tromba nera, cava fino alla base" → A/B
  - "Esterno grigio e liscio, senza lamelle" → C
  - "Carne sottile ed elastica" → B
  - "A gruppi tra le foglie, in autunno" → A
- **Riquadro sosia:** titolo "Non confonderlo con" · "Craterello cenerino" · *Craterellus cinereus (= Cantharellus cinereus)* · commestibile  
  Riga: "Simile e grigio-nerastro, ma con pliche venose e forcate ben evidenti sulla faccia esterna."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Tromba nera, cava fino alla base
  - Faccia esterna grigia e liscia, senza lamelle
  - Carne sottile ed elastica, non fragile
  - Cresce a gruppi tra le foglie, in autunno

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Sezione cava continua fino alla base.
- [ ] Faccia esterna liscia o appena rugosa; nessuna lamella né plica marcata.
- [ ] Interno nero-bruno squamuloso, esterno grigio cenere.
- [ ] Crescita a gruppi tra le foglie, non su legno.
- [ ] Cenerino: pliche forcate ben visibili all'esterno.

**Errori tipici da scartare:** lamelle o pliche sulla trombetta, gambo pieno, colori bruni o violacei, coppa nera su rametti (*Urnula*), trombette lucide come plastica.
