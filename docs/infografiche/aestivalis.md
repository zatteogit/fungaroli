# Infografica: Porcino estivo (*Boletus reticulatus (= B. aestivalis)*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `aestivalis` (Wikidata [Q26203726](https://www.wikidata.org/wiki/Q26203726)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere il porcino estivo (reticolo fino alla base, cappello vellutato e screpolato) e separarlo dal boleto satana, che cresce negli stessi boschi caldi.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 4-20 cm, emisferico, poi convesso, raramente del tutto disteso; colore nocciola-brunastro uniforme, senza orlo chiaro; superficie asciutta, opaca, vellutata; si screpola facilmente col caldo. Gambo robusto, cilindrico o un po' ingrossato alla base, nocciola chiaro, quasi concolore al cappello; ricoperto fino alla base da un reticolo bruno in rilievo.
- **B. Sezione longitudinale.** Carne bianca, piuttosto morbida; al taglio: **immutabile**.
- **C. Imenoforo (tubuli e pori).** Bianchi, poi giallini e giallo-verdastri; pori piccoli, immutabili al tocco.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore fungino, gradevole; sapore dolce; sporata bruno-olivastra.

**E. Riquadro "Non confonderlo con":** **Boleto satana** (*Rubroboletus satanas*), TOSSICO.  
Differenza in una riga: *Stessi boschi caldi su calcare, ma cappello bianco-grigio, pori rossi, reticolo rosso e carne che vira al blu.*  
Testo completo dai dati: Stessa stagione e stessi boschi caldi su calcare, ma cappello bianco-grigio, pori rossi, reticolo rosso e carne che vira al blu.

Altri sosia, solo testo in piccolo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): È il sosia classico del porcino estivo: pori che diventano rosa, reticolo bruno scuro e a maglie larghe, carne amarissima.
- Boleto radicante (*Caloboletus radicans*, non commestibile): Cappello chiaro, pori gialli che bluastrano, gambo giallo, carne che vira al blu e amara.

**Riquadro habitat / stagione / taglia:**
- Habitat: boschi caldi di latifoglie: castagno, cerro, roverella, anche faggio a quote basse. Nel Reatino in castagneti e cerrete tra circa 400 e 1100 m.
- Stagione: maggio-settembre, con ripresa a inizio autunno.
- Taglia minima di raccolta: 4 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- È il porcino più attaccato dalle larve: controlla la sezione e scarta gli esemplari bacati o molli.
- Sconsigliato il consumo crudo dei funghi spontanei.
- Limite di raccolta nel Lazio: 3 kg al giorno a persona.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:2006-10-07_Boletus_aestivalis_cropped.jpg) | BoletusAestivalis.JPG: Archenzo derivative work: Ak ccm (talk) | CC BY-SA 3.0 | Image 1 |
| 2 | Foto | esemplari adulti con cappello vellutato e reticolo (nome del file *B. aestivalis*, catalogata come *B. reticulatus*: sono sinonimi) | [link](https://commons.wikimedia.org/wiki/File:BOLETUS_AESTIVALIS_(Paulet)_Fr._(6090026927).jpg) | Gljivarsko društvo Niš (Flickr) | CC BY 2.0 | Image 2 |
| 3 | Foto (sosia, iNaturalist, research grade) | Rubroboletus satanas in natura | [link](https://www.inaturalist.org/observations/402259542) | Manuela Fiorini | CC BY | Image 3 |
| 4 | Foto (sosia) | R. satanas tagliato: carne che vira al blu | [link](https://commons.wikimedia.org/wiki/File:Rubroboletus_satanas_cut.jpg) | bjoerns | CC BY-SA 4.0 | Image 4 |
| 5 | Tavola (sosia, e stile) | tavola storica di R. satanas; per la specie principale usala SOLO come riferimento di stile | [link](https://commons.wikimedia.org/wiki/File:Bresadola-Boletus_Satanas.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, 1931; Commons: CC PDM 1.0) | Image 5 |

> Nessuna tavola di pubblico dominio trovata per *B. reticulatus* / *B. aestivalis* (né su Commons né nelle ricerche fatte). Per lo stile si usa la tavola di Bresadola del sosia, dichiarandola nel prompt come riferimento solo di stile per la specie principale.

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 3, Image 4 = riga 4, Image 5 = riga 5. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Boletus reticulatus (syn. B. aestivalis) (porcino estivo) from the dangerous look-alike Rubroboletus satanas. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Boletus reticulatus (B. aestivalis): authority for the uniform hazel, velvety cap and the net down to the stem base.
Image 2: photo of adult Boletus reticulatus: second authority for the uniform hazel cap and the brown net.
Image 3: photo of Rubroboletus satanas in situ: authority for the look-alike's whitish cap and squat bulbous stem.
Image 4: photo of a cut Rubroboletus satanas: authority for the look-alike's red pores, red net and bluing flesh.
Image 5: historical watercolor plate of Rubroboletus satanas by Bresadola: style reference for the whole plate, and a shape reference for the look-alike only.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Boletus reticulatus (summer cep) at three-quarter view on dry oak and chestnut leaf litter in warm summer light. The cap is about 12 cm across, convex, a uniform hazel-brown with no pale band at the margin, dry, matte and velvety, finely cracked into small polygonal patches as happens in hot weather. The stem is robust, cylindrical or slightly swollen at the base, pale hazel almost the same tone as the cap, and covered from top to bottom by a raised brown net.
B. Middle left: a longitudinal section: white, rather soft flesh that does not change color, and a white to yellowish tube layer.
C. Middle right: a close-up of the pore surface: small pores, white to pale yellow and greenish-yellow, unbruised.
D. Below B and C, small: the lower stem and base, showing the brown net reaching all the way down to the base, a plain base in dry leaves.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Rubroboletus satanas at the same scale: chalky whitish-grey cap, red to orange-red pore surface, squat bulbous stem with a red net over a yellow ground, and a cut half showing pale yellow flesh turning blue.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- the brown net covering the whole stem of Boletus reticulatus down to the base
- a uniform hazel cap, velvety and finely cracked, with no pale margin band
- pores of B. reticulatus white to yellow, never pink or red
- the section of B. reticulatus white with no blue
- the look-alike with red pores, red net and bluing flesh

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; a pale margin band on the cap; a net limited to the stem apex; pink, red or orange pores; blue staining; a ring or volva; gills; larvae; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Boletus reticulatus (syn. B. aestivalis) (porcino estivo) and to tell it apart from the dangerous look-alike Rubroboletus satanas. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Boletus reticulatus (B. aestivalis): authority for the uniform hazel, velvety cap and the net down to the stem base; the second image is a photo of adult Boletus reticulatus: second authority for the uniform hazel cap and the brown net; the third image is a photo of Rubroboletus satanas in situ: authority for the look-alike's whitish cap and squat bulbous stem; the fourth image is a photo of a cut Rubroboletus satanas: authority for the look-alike's red pores, red net and bluing flesh; the fifth image is a historical watercolor plate of Rubroboletus satanas by Bresadola: style reference for the whole plate, and a shape reference for the look-alike only. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a mature Boletus reticulatus (summer cep) at three-quarter view on dry oak and chestnut leaf litter in warm summer light. The cap is about 12 cm across, convex, a uniform hazel-brown with no pale band at the margin, dry, matte and velvety, finely cracked into small polygonal patches as happens in hot weather. The stem is robust, cylindrical or slightly swollen at the base, pale hazel almost the same tone as the cap, and covered from top to bottom by a raised brown net.
Then, in the middle row, paint on the left a longitudinal section: white, rather soft flesh that does not change color, and a white to yellowish tube layer, and on the right a close-up of the pore surface: small pores, white to pale yellow and greenish-yellow, unbruised.
Below them, add a small vignette of the lower stem and base, showing the brown net reaching all the way down to the base, a plain base in dry leaves.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Rubroboletus satanas at the same scale: chalky whitish-grey cap, red to orange-red pore surface, squat bulbous stem with a red net over a yellow ground, and a cut half showing pale yellow flesh turning blue.

Keep these facts exactly right: the brown net covering the whole stem of Boletus reticulatus down to the base; a uniform hazel cap, velvety and finely cracked, with no pale margin band; pores of B. reticulatus white to yellow, never pink or red; the section of B. reticulatus white with no blue; the look-alike with red pores, red net and bluing flesh. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Rubroboletus satanas at the same scale: chalky whitish-grey cap, red to orange-red pore surface, squat bulbous stem with a red net over a yellow ground, and a cut half showing pale yellow flesh turning blue. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Porcino estivo  
  **Sottotitolo:** *Boletus reticulatus (= B. aestivalis)* · ottimo
- **Etichette con linea di richiamo:**
  - "Cappello nocciola uniforme, vellutato, screpolato" → A
  - "Reticolo bruno fino alla base del gambo" → D
  - "Pori bianchi poi gialli, mai rosa o rossi" → C
  - "Carne bianca immutabile" → B
- **Riquadro sosia:** titolo "Non confonderlo con" · "Boleto satana" · *Rubroboletus satanas* · TOSSICO  
  Riga: "Stessi boschi caldi su calcare, ma cappello bianco-grigio, pori rossi, reticolo rosso e carne che vira al blu."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 4 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Cappello nocciola uniforme, vellutato, spesso screpolato
  - Reticolo bruno su tutto il gambo, fino alla base
  - Pori bianchi poi gialli, mai rosa o rossi
  - Carne bianca immutabile
  - Nasce presto, con il caldo

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Reticolo bruno che arriva fino alla base: è il carattere distintivo rispetto a edulis.
- [ ] Cappello nocciola uniforme, opaco, con screpolature fini; niente orlo chiaro.
- [ ] Pori chiari; nessun rosa (che indicherebbe *Tylopilus felleus*).
- [ ] Sezione bianca, senza viraggio.
- [ ] Satana: cappello biancastro, pori rossi, reticolo rosso, carne che bluastra.

**Errori tipici da scartare:** reticolo solo in alto (è un edulis), reticolo bruno scuro a maglie larghe con pori rosa (è il porcino di fiele), orlo bianco del cappello, cappello lucido.
