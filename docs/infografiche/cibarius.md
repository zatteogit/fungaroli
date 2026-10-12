# Infografica: Finferlo (*Cantharellus cibarius*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `cibarius` (Wikidata [Q188749](https://www.wikidata.org/wiki/Q188749)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere il finferlo (pliche e non lamelle, cresce a terra) e separarlo dal fungo dell'olivo, causa frequente di intossicazioni.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 2-12 cm, convesso, poi a imbuto, con margine sottile, ondulato e lobato; colore giallo uovo o giallo-arancio, uniforme; superficie liscia, asciutta. Gambo pieno, sodo, che si allarga senza stacco nel cappello, giallo, uguale o un po' più chiaro del cappello; liscia.
- **B. Sezione longitudinale.** Carne bianca o giallina, soda, fibrosa; al taglio: **immutabile**.
- **C. Imenoforo (pliche).** Dello stesso giallo del cappello; pieghe spesse, basse, forcate, che scendono lungo il gambo; non sono vere lamelle e non si staccano.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore fruttato, di albicocca; sapore dolce o leggermente piccante; sporata crema o giallo-rosata.

**E. Riquadro "Non confonderlo con":** **Fungo dell'olivo** (*Omphalotus olearius*), TOSSICO.  
Differenza in una riga: *Cresce a cespi su ceppaie o radici; vere lamelle fitte e sottili; carne arancione.*  
Testo completo dai dati: Cresce a cespi su ceppaie o radici (olivo, quercia, castagno); vere lamelle fitte, sottili e decorrenti; carne arancione che macchia le dita. Più grande e arancio carico.

> Nel riquadro scelgo *Omphalotus olearius* perché è il sosia con cui avvengono davvero le intossicazioni. *Cortinarius orellanus* (mortale) è più pericoloso ma meno simile: citarlo in una riga di testo. Per una sua miniatura c'è la tavola Bresadola tav. 649 (riga in tabella).

Altri sosia, solo testo in piccolo:
- Falso gallinaccio (*Hygrophoropsis aurantiaca*, non commestibile): Vere lamelle sottili, fitte e ripetutamente forcate, arancio più carico del cappello; carne molle, non bianca; spesso su legno marcio o lettiera di conifere.
- Cortinario orellano (*Cortinarius orellanus*, mortale): Arancio-fulvo ma con vere lamelle staccate e sporata color ruggine; carne giallastra. Danni ai reni dopo giorni dal pasto: ogni fungo aranciato con lamelle va scartato.

**Riquadro habitat / stagione / taglia:**
- Habitat: a terra, mai sul legno, in faggete, castagneti, cerrete e boschi di conifere, su suoli acidi e muschiosi.
- Stagione: giugno-ottobre.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Va consumato ben cotto; è di digestione lenta, mangiane quantità moderate.
- Controlla sempre che le 'lamelle' siano pliche e che il fungo nasca a terra: i casi di intossicazione da Omphalotus sono frequenti.
- Non affidarti alle app di riconoscimento: diversi intossicati da Omphalotus le avevano usate.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Chanterelle_Cantharellus_cibarius.jpg) | autore su Commons | CC BY-SA 3.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, 58037 Santa Fiora GR, Italia (2024-10-20) | [link](https://www.inaturalist.org/observations/248471568) | Andrea Benocci | CC BY-NC | Image 2 |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Isernia, Italia (2009-07-02) | [link](https://www.inaturalist.org/observations/41530979) | Rino | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Busso, Molise, IT (2023-06-06) | [link](https://www.inaturalist.org/observations/184823584) | Marco Panik | CC BY-NC | solo confronto |
| 5 | Tavola | tavola storica di *C. cibarius* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Cantharellus_cibarius.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. X, tav. 471, 1929; Commons: CC PDM 1.0) | Image 3 |
| 6 | Foto (sosia, iNaturalist, research grade) | Omphalotus olearius in natura | [link](https://www.inaturalist.org/observations/100143017) | Edoardo Gesuelli | CC BY-NC | solo confronto |
| 7 | Foto (sosia) | cespo di *O. olearius*, lamelle arancio | [link](https://commons.wikimedia.org/wiki/File:Zavodnica_5.jpg) | Aleksandar Đukić | CC BY-SA 4.0 | Image 4 |
| 8 | Tavola (sosia) | tavola storica di *Pleurotus olearius* (= *Omphalotus olearius*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Pleurotus_olearius.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. V, tav. 285, 1928; Commons: CC PDM 1.0) | Image 5 |
| 9 | Tavola (sosia) | tavola storica di *C. orellanus* (sosia mortale da citare nel testo) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_Cortinarius_orellanus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIII, tav. 649, 1930; Commons: CC PDM 1.0) | solo confronto |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 5, Image 4 = riga 7, Image 5 = riga 8. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Cantharellus cibarius (finferlo) from the dangerous look-alike Omphalotus olearius. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Cantharellus cibarius: authority for the yolk-yellow color, the funnel shape and the blunt forked ridges.
Image 2: photo of Cantharellus cibarius from central Italy: second authority for color and ridges.
Image 3: historical watercolor plate of Cantharellus cibarius by Bresadola: style reference only.
Image 4: photo of an Omphalotus olearius clump: authority for the look-alike's true gills, deep orange color and growth on wood.
Image 5: historical plate of Omphalotus olearius by Bresadola: shape reference for the look-alike only.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a small group of Cantharellus cibarius growing out of mossy soil, not from wood, under beech and chestnut, at three-quarter view. Caps 3 to 8 cm across, convex becoming funnel-shaped, with a thin, wavy, lobed margin, a uniform egg-yolk yellow. Stems solid and tapering, merging into the cap without any clear break, the same yellow.
B. Middle left: a longitudinal section of one chanterelle: firm, white to pale yellowish, fibrous flesh that does not change color, under a thin yellow surface.
C. Middle right: a close-up of the underside: blunt, thick, low, forked and cross-veined ridges (false gills) running down the stem, the same yolk yellow as the cap, clearly not thin blade-like gills.
D. Below B and C, small: the stem base emerging from soil and moss, with no ring, no volva and no wood.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a dense clump of Omphalotus olearius growing from the base of an oak stump: larger, deep pumpkin-orange caps with true thin, crowded, sharp-edged gills running down the stems, stems fused together at the base on the wood, and one cut stem showing orange flesh.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- blunt forked ridges under the chanterelle, not true gills
- Cantharellus cibarius growing from soil and moss, not from wood
- a uniform yolk-yellow color for cap, ridges and stem
- white flesh in the chanterelle section
- the look-alike in a fused clump on wood, with true crowded gills and orange flesh

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; thin crowded blade-like gills on the chanterelle; chanterelles on wood or fused in a clump; orange flesh in the chanterelle; a ring or volva; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Cantharellus cibarius (finferlo) and to tell it apart from the dangerous look-alike Omphalotus olearius. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Cantharellus cibarius: authority for the yolk-yellow color, the funnel shape and the blunt forked ridges; the second image is a photo of Cantharellus cibarius from central Italy: second authority for color and ridges; the third image is a historical watercolor plate of Cantharellus cibarius by Bresadola: style reference only; the fourth image is a photo of an Omphalotus olearius clump: authority for the look-alike's true gills, deep orange color and growth on wood; the fifth image is a historical plate of Omphalotus olearius by Bresadola: shape reference for the look-alike only. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a small group of Cantharellus cibarius growing out of mossy soil, not from wood, under beech and chestnut, at three-quarter view. Caps 3 to 8 cm across, convex becoming funnel-shaped, with a thin, wavy, lobed margin, a uniform egg-yolk yellow. Stems solid and tapering, merging into the cap without any clear break, the same yellow.
Then, in the middle row, paint on the left a longitudinal section of one chanterelle: firm, white to pale yellowish, fibrous flesh that does not change color, under a thin yellow surface, and on the right a close-up of the underside: blunt, thick, low, forked and cross-veined ridges (false gills) running down the stem, the same yolk yellow as the cap, clearly not thin blade-like gills.
Below them, add a small vignette of the stem base emerging from soil and moss, with no ring, no volva and no wood.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a dense clump of Omphalotus olearius growing from the base of an oak stump: larger, deep pumpkin-orange caps with true thin, crowded, sharp-edged gills running down the stems, stems fused together at the base on the wood, and one cut stem showing orange flesh.

Keep these facts exactly right: blunt forked ridges under the chanterelle, not true gills; Cantharellus cibarius growing from soil and moss, not from wood; a uniform yolk-yellow color for cap, ridges and stem; white flesh in the chanterelle section; the look-alike in a fused clump on wood, with true crowded gills and orange flesh. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a dense clump of Omphalotus olearius growing from the base of an oak stump: larger, deep pumpkin-orange caps with true thin, crowded, sharp-edged gills running down the stems, stems fused together at the base on the wood, and one cut stem showing orange flesh. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Finferlo  
  **Sottotitolo:** *Cantharellus cibarius* · ottimo
- **Etichette con linea di richiamo:**
  - "Pliche spesse e forcate, non lamelle" → C
  - "Tutto giallo uovo" → A
  - "Cresce a terra, mai sul legno" → D
  - "Carne bianca, odore di albicocca" → B
- **Riquadro sosia:** titolo "Non confonderlo con" · "Fungo dell'olivo" · *Omphalotus olearius* · TOSSICO  
  Riga: "Cresce a cespi su ceppaie o radici; vere lamelle fitte e sottili; carne arancione."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Sotto il cappello pliche spesse e forcate, non lamelle
  - Tutto dello stesso giallo uovo
  - Cresce a terra, non sul legno
  - Carne bianca, soda, odore di albicocca

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Sotto il cappello pliche basse, ottuse, forcate e anastomizzate, che scendono sul gambo.
- [ ] Finferli singoli o a gruppi su terra o muschio; nessun legno a contatto.
- [ ] Colore uniforme giallo uovo; carne bianca in sezione.
- [ ] Omphalotus: cespo saldato su legno, lamelle vere fitte e taglienti, arancio carico.
- [ ] Proporzioni: il finferlo non supera i 12 cm; Omphalotus più grande.

**Errori tipici da scartare:** lamelle vere sul finferlo (sembra *Hygrophoropsis* o *Omphalotus*), finferli che escono da un ceppo, colore arancio carico uniforme, Omphalotus con pliche.
