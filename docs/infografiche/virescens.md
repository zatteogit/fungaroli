# Infografica: Colombina verde (*Russula virescens; Russula cyanoxantha*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `virescens` (Wikidata [Q677341](https://www.wikidata.org/wiki/Q677341)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere la colombina verde (cappello screpolato a placche, gambo gessoso, nessun anello né volva) e separarla dalla tignosa verdognola (mortale).

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 5-15 cm, emisferico, poi convesso e depresso al centro; sodo; colore R. virescens: verde, verde-grigio o verde-oliva su fondo bianco. R. cyanoxantha: miscuglio di viola, lilla, blu-ardesia, rosa e verde (esiste una forma tutta verde); superficie R. virescens: opaca e vellutata, poi screpolata in piccole placche verdi che lasciano vedere il bianco. R. cyanoxantha: liscia, un po' untuosa con l'umido, con fibrille radiali. Gambo cilindrico, sodo, con la base senza bulbo, bianco (in R. cyanoxantha a volte sfumato di viola); in R. virescens spesso macchiato di bruno-ruggine in basso; liscia; si rompe di netto come un gesso.
- **B. Sezione longitudinale.** Carne bianca, soda, granulosa; al taglio: **immutabile**.
- **C. Imenoforo (lamelle).** Bianche o crema chiaro; R. virescens: lamelle fragili, si spezzano. R. cyanoxantha: lamelle flessibili e lardacee, si piegano senza rompersi se strofinate.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore debole; sapore dolce, di nocciola; mai piccante; sporata bianca o bianco-crema.

**E. Riquadro "Non confonderlo con":** **Tignosa verdognola** (*Amanita phalloides*), MORTALE.  
Differenza in una riga: *Ha anello bianco e volva bianca a sacco, spesso interrata: scava sempre la base. Cappello liscio con fibrille radiali.*  
Testo completo dai dati: Ha anello bianco sul gambo e una volva bianca a sacco alla base, spesso interrata: scava sempre la base. Cappello liscio con fibrille radiali, non screpolato a placche; gambo fibroso, non gessoso.

Altri sosia, solo testo in piccolo:
- Russula eterofilla (*Russula heterophylla*, commestibile): Cappello verde-oliva o bruno liscio, lamelle fitte e forcate vicino al gambo, fragili (non lardacee).
- Russula olivacea (*Russula olivacea*, tossico): Cappello verde-oliva o bruno-porpora liscio, lamelle e sporata gialle (non bianche), gambo spesso soffuso di rosa in alto. Causa gastroenteriti se mangiata cruda o poco cotta.
- Russula verderame (*Russula aeruginea*, commestibile): Cappello verde erba liscio e un po' viscido, lamelle crema-giallastre, spesso sotto betulle.

**Riquadro habitat / stagione / taglia:**
- Habitat: boschi di latifoglie: castagno, querce (cerro, roverella) e faggio, anche boschi misti. Nel Reatino dai castagneti collinari alle faggete del Terminillo.
- Stagione: giugno-ottobre, abbondante nelle estati piovose.
- Taglia minima di raccolta: 4 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Ogni fungo verde con lamelle bianche va estratto intero e controllato alla base: la falloide è stata confusa con il verdone in casi recenti di intossicazione.
- Le russule a sapore piccante vanno scartate.
- È prudente consumarle cotte: chi mangia il verdone crudo rischia di più se lo confonde con Russula olivacea.
- La L.R. Lazio 32/98 fissa per Russula virescens una taglia minima di 4 cm; per R. cyanoxantha vale la regola generale di 3 cm (qui si usa il valore più prudente).

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Russula_virescens3.JPG) | Paffka | CC BY-SA 3.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, 00066 Manziana, Metropolitan City of Rome Capital, Italy (2024-06-08) | [link](https://www.inaturalist.org/observations/221331641) | Luca Pilia | CC BY-NC | Image 2 |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Vetralla, Lazio, IT (2025-06-25) | [link](https://www.inaturalist.org/observations/292664884) | adcam | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Province of Viterbo, Italy (2025-09-27) | [link](https://www.inaturalist.org/observations/377464728) | Anonimous Pug | CC BY-NC | solo confronto |
| 5 | Tavola | tavola storica di *R. virescens* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Russula_virescens.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. IX, tav. 412, 1929; Commons: CC PDM 1.0) | Image 3 |
| 6 | Tavola | tavola storica di *R. cyanoxantha* (per la miniatura opzionale) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Russula_cyanoxantha.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. IX, tav. 423, 1929; Commons: CC PDM 1.0) | solo confronto |
| 7 | Foto (sosia, iNaturalist, research grade) | Amanita phalloides in natura | [link](https://www.inaturalist.org/observations/159190531) | Luca Pilia | CC BY-NC | Image 4 |
| 8 | Tavola (sosia) | tavola storica di *A. phalloides* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Amanita_phalloides.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. I, tav. 3, 1927; Commons: CC PDM 1.0) | Image 5 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 5, Image 4 = riga 7, Image 5 = riga 8. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Russula virescens (colombina verde) from the dangerous look-alike Amanita phalloides. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Russula virescens: authority for the cracked green cap, white gills and white stem.
Image 2: photo of Russula virescens from Lazio: second authority for the areolate cap.
Image 3: historical watercolor plate of Russula virescens by Bresadola: style reference only.
Image 4: photo of Amanita phalloides: authority for the look-alike's smooth olive cap, white ring and volva.
Image 5: historical plate of Amanita phalloides by Bresadola: shape reference for the look-alike, including the volva.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: an adult Russula virescens at three-quarter view on oak and chestnut litter, with a younger one beside it. The cap is about 10 cm across, convex with a depressed center, firm, green to grey-green on a white ground, with a matte, velvety surface cracked into small green patches like a mosaic, showing white between them. The stem is white, cylindrical and firm, without a bulb, with a few rusty-brown spots low down.
B. Middle left: a longitudinal section: white, firm, granular flesh that does not change color, and next to it a snapped piece of stem with a clean, crumbly break like chalk.
C. Middle right: a close-up of the white to pale cream gills, brittle, a few of them broken.
D. Below B and C, small: the stem base lifted whole out of the soil with a little earth: a clean cylindrical base with no ring, no volva and no sac.
E. Bottom left, about one quarter of the area, slightly apart from the rest: an Amanita phalloides lifted whole from the soil: a smooth olive-green cap with fine radial fibrils (not cracked), white gills, a white ring on the stem and a white sac-like volva at the base.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- no ring and no volva on Russula virescens, the base clean
- the cap of R. virescens cracked into small green patches
- a white, chalky stem with a clean break
- white gills
- the look-alike with a white ring and a white sac-like volva

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; a ring, a volva or a bulb on the russula; a smooth shiny cap with radial fibrils on the russula; yellow gills; a pink-flushed stem; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Russula virescens (colombina verde) and to tell it apart from the dangerous look-alike Amanita phalloides. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Russula virescens: authority for the cracked green cap, white gills and white stem; the second image is a photo of Russula virescens from Lazio: second authority for the areolate cap; the third image is a historical watercolor plate of Russula virescens by Bresadola: style reference only; the fourth image is a photo of Amanita phalloides: authority for the look-alike's smooth olive cap, white ring and volva; the fifth image is a historical plate of Amanita phalloides by Bresadola: shape reference for the look-alike, including the volva. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint an adult Russula virescens at three-quarter view on oak and chestnut litter, with a younger one beside it. The cap is about 10 cm across, convex with a depressed center, firm, green to grey-green on a white ground, with a matte, velvety surface cracked into small green patches like a mosaic, showing white between them. The stem is white, cylindrical and firm, without a bulb, with a few rusty-brown spots low down.
Then, in the middle row, paint on the left a longitudinal section: white, firm, granular flesh that does not change color, and next to it a snapped piece of stem with a clean, crumbly break like chalk, and on the right a close-up of the white to pale cream gills, brittle, a few of them broken.
Below them, add a small vignette of the stem base lifted whole out of the soil with a little earth: a clean cylindrical base with no ring, no volva and no sac.
Finally, in the bottom-left quarter, slightly apart from the rest, paint an Amanita phalloides lifted whole from the soil: a smooth olive-green cap with fine radial fibrils (not cracked), white gills, a white ring on the stem and a white sac-like volva at the base.

Keep these facts exactly right: no ring and no volva on Russula virescens, the base clean; the cap of R. virescens cracked into small green patches; a white, chalky stem with a clean break; white gills; the look-alike with a white ring and a white sac-like volva. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of an Amanita phalloides lifted whole from the soil: a smooth olive-green cap with fine radial fibrils (not cracked), white gills, a white ring on the stem and a white sac-like volva at the base. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Colombina verde  
  **Sottotitolo:** *Russula virescens; Russula cyanoxantha* · ottimo
- **Etichette con linea di richiamo:**
  - "Né anello né volva: base pulita" → D
  - "Gambo bianco, si spezza come gesso" → B
  - "Cappello verde screpolato a placche" → A
  - "Lamelle bianche, fragili" → C
  - Facoltativa, se si aggiunge una miniatura di *R. cyanoxantha* (tavola Bresadola 423): "R. cyanoxantha: lamelle flessibili, 'unte'".
- **Riquadro sosia:** titolo "Non confonderlo con" · "Tignosa verdognola" · *Amanita phalloides* · MORTALE  
  Riga: "Ha anello bianco e volva bianca a sacco, spesso interrata: scava sempre la base. Cappello liscio con fibrille radiali."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 4 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Né anello né volva: base del gambo pulita, senza sacco
  - Gambo bianco che si spezza di netto come un gesso
  - Verdone: cappello verde screpolato a piccole placche
  - R. cyanoxantha: lamelle flessibili e 'unte' al tatto
  - Sapore dolce (assaggio di un frammento da sputare)

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Base del gambo senza anello, volva o bulbo, estratta intera.
- [ ] Cappello screpolato in piccole placche verdi su fondo bianco, opaco.
- [ ] Gambo bianco con frattura netta e granulosa.
- [ ] Lamelle bianche o crema chiaro, non gialle (*R. olivacea*).
- [ ] Falloide: cappello liscio con fibrille radiali, anello e volva bianchi ben visibili.

**Errori tipici da scartare:** anello o volva sulla russula, cappello liscio e lucido, lamelle giallastre, gambo rosato in alto (*R. olivacea*), falloide senza volva o con la volva nascosta.
