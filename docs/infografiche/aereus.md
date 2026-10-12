# Infografica: Porcino nero (*Boletus aereus*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `aereus` (Wikidata [Q757127](https://www.wikidata.org/wiki/Q757127)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere il porcino nero (cappello bruno scuro, carne durissima) e separarlo dai boleti a pori rossi con cappello scuro.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 6-24 cm, emisferico, poi convesso e spianato, molto sodo; colore bruno scuro quasi nero, bronzo; a volte con zone più chiare bruno-ocra. Esistono forme decolorate nocciola; superficie asciutta, vellutata o liscia, spesso irregolare, come ammaccata. Gambo massiccio, panciuto o a clava, poi cilindrico, beige-ocra o bruno chiaro; con reticolo fine, prima chiaro poi brunastro.
- **B. Sezione longitudinale.** Carne bianca, compatta, non colorata sotto la cuticola; al taglio: **immutabile**.
- **C. Imenoforo (tubuli e pori).** Bianchi, poi giallastri e giallo-verdastri; pori fini, non cambiano colore al tocco.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore intenso e gradevole; sapore dolce; sporata bruno-olivastra.

**E. Riquadro "Non confonderlo con":** **Boleto a piede rosso (B. erythropus auct.)** (*Neoboletus luridiformis*), TOSSICO.  
Differenza in una riga: *Cappello scuro simile, ma pori rossi, gambo punteggiato di rosso e carne gialla che diventa blu all'istante.*  
Testo completo dai dati: Cappello scuro simile, ma pori rossi, gambo punteggiato di rosso e carne gialla che diventa blu all'istante.

Altri sosia, solo testo in piccolo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): Pori rosa, reticolo scuro e grossolano, carne amarissima.
- Boleto baio (*Imleria badia*, commestibile): Cappello bruno simile ma gambo snello senza reticolo; pori gialli che si macchiano di blu se premuti.

**Riquadro habitat / stagione / taglia:**
- Habitat: termofilo: castagneti, cerrete, querceti a roverella e leccete, spesso in radure soleggiate. Nel Reatino in collina e bassa montagna (circa 300-1000 m), es. castagneti dell'Alta Valle del Velino e del Cicolano.
- Stagione: giugno-ottobre, con buttate dopo i temporali estivi e in settembre.
- Taglia minima di raccolta: 4 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Le forme chiare si confondono con gli altri porcini (tutti commestibili): il problema sono i boleti a pori rossi.
- Sconsigliato il consumo crudo dei funghi spontanei.
- Limite di raccolta nel Lazio: 3 kg al giorno a persona.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Bronze_Roehrling.jpg) | Achim Bollmann | Copyrighted free use | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, 00060 Canale Monterano RM, Italia (2023-11-09) | [link](https://www.inaturalist.org/observations/190488055) | Marco Gasponi | CC BY-NC | Image 2 |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Grosseto, Italia (2025-09-01) | [link](https://www.inaturalist.org/observations/311013942) | lucapassalacqua | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Marche, IT (2025-09-07) | [link](https://www.inaturalist.org/observations/312250946) | Manuela Fiorini | CC BY | solo confronto |
| 5 | Tavola | tavola storica di *B. aereus*; la didascalia di Commons la indica come la 'seconda e corretta' raffigurazione (la tav. 924 è *B. pinophilus*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_aereus_tab._925.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 925, 1931; Commons: CC PDM 1.0) | Image 3 |
| 6 | Foto (sosia) | N. luridiformis in situ: pori rossi, gambo punteggiato | [link](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_2020_G1.jpg) | George Chernilevsky | Pubblico dominio (rilasciata dall'autore) | Image 4 |
| 7 | Foto (sosia) | N. luridiformis tagliato: carne gialla diventata blu | [link](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_cut_and_blue.jpg) | Stephan Kleinfelder | CC0 | Image 5 |
| 8 | Tavola (sosia) | tavola storica di *Boletus erythropus* (= *N. luridiformis*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_Erythropus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 930, 1931; Commons: CC PDM 1.0) | Image 6 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 5, Image 4 = riga 6, Image 5 = riga 7, Image 6 = riga 8. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Boletus aereus (porcino nero) from the dangerous look-alike Neoboletus luridiformis. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of an adult Boletus aereus: authority for the dark bronze velvety cap and the ochre-brown stem.
Image 2: photo of Boletus aereus from central Italy (Lazio): second authority for colors in the local population.
Image 3: historical watercolor plate of Boletus aereus by Bresadola (plate 925): style reference only.
Image 4: photo of Neoboletus luridiformis: authority for the look-alike's dark velvety cap, red pores and red-dotted stem.
Image 5: photo of a cut Neoboletus luridiformis: authority for the instantly bluing yellow flesh.
Image 6: historical plate of Neoboletus luridiformis by Bresadola: shape reference for the look-alike only.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Boletus aereus at three-quarter view on dry oak and chestnut leaf litter in a sunny clearing. The hard, compact cap is about 14 cm across, very dark brown to almost black with a bronze tone, velvety-matte, irregular and slightly dented, with a few paler ochre-brown patches. The stem is massive and swollen, beige-ochre to light brown, with a fine net that is pale above and brownish below.
B. Middle left: a longitudinal section: very compact pure white flesh that does not change color, with no colored band under the cap skin, and a white to yellowish tube layer.
C. Middle right: a close-up of the pore surface: fine pores, white to yellowish and greenish-yellow, unbruised.
D. Below B and C, small: the massive club-shaped stem base, ochre-brown with a fine brownish net, a plain base in dry leaves.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- the cap of Boletus aereus very dark brown, velvety, matte
- pores of B. aereus white to yellow, never red
- the section of B. aereus pure white with no band and no blue
- a fine net on the ochre-brown stem of B. aereus
- the look-alike with red pores, red-dotted stem and blue flesh

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; red pores or blue staining on the aereus; a slimy glossy cap; a coarse dark net; a ring or volva; gills; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Boletus aereus (porcino nero) and to tell it apart from the dangerous look-alike Neoboletus luridiformis. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of an adult Boletus aereus: authority for the dark bronze velvety cap and the ochre-brown stem; the second image is a photo of Boletus aereus from central Italy (Lazio): second authority for colors in the local population; the third image is a historical watercolor plate of Boletus aereus by Bresadola (plate 925): style reference only; the fourth image is a photo of Neoboletus luridiformis: authority for the look-alike's dark velvety cap, red pores and red-dotted stem; the fifth image is a photo of a cut Neoboletus luridiformis: authority for the instantly bluing yellow flesh; the sixth image is a historical plate of Neoboletus luridiformis by Bresadola: shape reference for the look-alike only. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a mature Boletus aereus at three-quarter view on dry oak and chestnut leaf litter in a sunny clearing. The hard, compact cap is about 14 cm across, very dark brown to almost black with a bronze tone, velvety-matte, irregular and slightly dented, with a few paler ochre-brown patches. The stem is massive and swollen, beige-ochre to light brown, with a fine net that is pale above and brownish below.
Then, in the middle row, paint on the left a longitudinal section: very compact pure white flesh that does not change color, with no colored band under the cap skin, and a white to yellowish tube layer, and on the right a close-up of the pore surface: fine pores, white to yellowish and greenish-yellow, unbruised.
Below them, add a small vignette of the massive club-shaped stem base, ochre-brown with a fine brownish net, a plain base in dry leaves.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue.

Keep these facts exactly right: the cap of Boletus aereus very dark brown, velvety, matte; pores of B. aereus white to yellow, never red; the section of B. aereus pure white with no band and no blue; a fine net on the ochre-brown stem of B. aereus; the look-alike with red pores, red-dotted stem and blue flesh. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Porcino nero  
  **Sottotitolo:** *Boletus aereus* · ottimo
- **Etichette con linea di richiamo:**
  - "Cappello bruno scuro, quasi nero, vellutato" → A
  - "Pori bianchi poi gialli, immutabili" → C
  - "Carne bianca, durissima, non vira" → B
  - "Gambo bruno-ocra con reticolo fine" → A/D
- **Riquadro sosia:** titolo "Non confonderlo con" · "Boleto a piede rosso" · *Neoboletus luridiformis* · TOSSICO (crudo)  
  Riga: "Cappello scuro simile, ma pori rossi, gambo punteggiato di rosso e carne gialla che diventa blu all'istante."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 4 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Cappello bruno scuro, quasi nero, vellutato
  - Pori bianchi poi gialli, che non cambiano colore
  - Carne bianca, durissima, che non vira
  - Gambo bruno-ocra con reticolo fine

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Cappello bruno-nerastro opaco, non viscido né lucido.
- [ ] Pori chiari; nessuna macchia blu o rossa.
- [ ] Sezione bianca uniforme, senza la fascia vinosa (che invece ha edulis).
- [ ] Reticolo fine, chiaro in alto e brunastro in basso.
- [ ] Piede rosso: pori rossi, puntinatura rossa, carne che vira al blu.

**Errori tipici da scartare:** pori rossi o arancio, carne bluastra, gambo con puntini invece del reticolo, cappello lucido e viscido, colori virati al rossastro (sembra un pinophilus).
