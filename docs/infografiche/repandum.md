# Infografica: Steccherino dorato (*Hydnum repandum*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `repandum` (Wikidata [Q13684](https://www.wikidata.org/wiki/Q13684)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere lo steccherino dorato (aculei sotto il cappello, colori chiari, carne fragile) e separarlo dagli idnoidi bruni e sugherosi.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 3-15 cm, convesso o un po' depresso, irregolare e lobato, orlo spesso ondulato; colore crema, ocra chiaro o giallo-arancio pallido; superficie asciutta, opaca, come feltrata. Gambo corto, tozzo, spesso eccentrico, bianco o crema; liscia o finemente feltrata.
- **B. Sezione longitudinale.** Carne bianca, soda ma fragile; al taglio: **ingiallisce o si macchia di arancio dove viene toccata o tagliata**.
- **C. Imenoforo (aculei).** Biancastri, crema o color salmone; aculei fitti, corti e fragili, che si staccano facilmente e scendono un po' sul gambo.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore gradevole, fungino; sapore dolce, amarognolo negli esemplari vecchi; sporata bianca.

**E. Riquadro "Non confonderlo con":** **Sarcodon imbricato** (*Sarcodon imbricatus*), NON COMMESTIBILE.  
Differenza in una riga: *Cappello bruno coperto di grosse squame sollevate a tegola; aculei bruno-grigi; sotto conifere.*  
Testo completo dai dati: Cappello bruno coperto di grosse squame sollevate a tegola; aculei bruno-grigi; sporata bruna. Sotto conifere.

> Nessun sosia tossico tra quelli dei dati: il riquadro mostra il più comune tra quelli non commestibili.

Altri sosia, solo testo in piccolo:
- Steccherino rossiccio (*Hydnum rufescens*, commestibile): Più piccolo e arancio-rossiccio, con aculei che non scendono sul gambo. Commestibile ben cotto.
- Sarcodon scabroso (*Sarcodon scabrosus*, non commestibile): Cappello bruno squamuloso, base del gambo verde-bluastra, carne amarissima.
- Idnello di Peck (*Hydnellum peckii*, non commestibile): Consistenza dura e sugherosa, cappello biancastro-rosato che trasuda gocce rosse; sapore piccante. Gli Hydnellum inglobano spesso aghi e rametti.

**Riquadro habitat / stagione / taglia:**
- Habitat: a gruppi o in cerchi in cerrete, faggete, castagneti e boschi di conifere. Nel Reatino citato per i querceti del Cicolano.
- Stagione: agosto-novembre, fino a dicembre negli autunni miti.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Gli esemplari vecchi diventano amari: preferisci quelli giovani; si possono togliere gli aculei.
- Va consumato cotto.
- Ogni idnoide bruno, scuro, duro o sugheroso non è uno steccherino dorato.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Hedgehog_fungi2.jpg) | D J Kelly | Public domain | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Province of Viterbo, Italy (2025-10-25) | [link](https://www.inaturalist.org/observations/325588243) | symcyto | CC BY-NC | solo confronto |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, San Severino Marche, Marche, IT (2026-01-30) | [link](https://www.inaturalist.org/observations/336730257) | Manuela Fiorini | CC BY | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Chieti, Italia (2020-11-10) | [link](https://www.inaturalist.org/observations/64606585) | Rino | CC BY-NC | solo confronto |
| 5 | Foto | dettaglio degli aculei | [link](https://commons.wikimedia.org/wiki/File:Hydnum_repandum._The_Hedgehog_Fungus_spore_bearing_spines.jpg) | Rosser1954 | CC BY-SA 4.0 | Image 2 |
| 6 | Tavola | tavola storica di *H. repandum* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Hydnum_repandum.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XXI, tav. 1044, 1932; Commons: CC PDM 1.0) | Image 3 |
| 7 | Foto (sosia, iNaturalist, research grade) | Sarcodon imbricatus in natura | [link](https://www.inaturalist.org/observations/56915670) | Gergely Nigg | CC BY | Image 4 |
| 8 | Tavola (sosia) | tavola storica di *Hydnum imbricatum* (= *Sarcodon imbricatus*), collegata alla categoria Commons di *S. imbricatus* | [link](https://commons.wikimedia.org/wiki/File:Coloured_Figures_of_English_Fungi_or_Mushrooms_-_t._73.jpg) | James Sowerby (1757-1822) | Pubblico dominio (Coloured Figures of English Fungi or Mushrooms, t. 73, 1797-1815) | solo confronto |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 5, Image 3 = riga 6, Image 4 = riga 7. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 6) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Hydnum repandum (steccherino dorato) from the dangerous look-alike Sarcodon imbricatus. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Hydnum repandum: authority for the cream-ochre cap and overall shape.
Image 2: close-up photo of the Hydnum repandum spines: authority for the spine shape and color.
Image 3: historical watercolor plate of Hydnum repandum by Bresadola: style reference only.
Image 4: photo of Sarcodon imbricatus: authority for the look-alike's coarse tiled brown scales.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: two Hydnum repandum on oak leaf litter at three-quarter view: caps 6 to 10 cm, irregular and lobed with a wavy margin, cream to pale ochre-apricot, dry, matte and felt-like; short, stout, often off-center whitish stems.
B. Middle left: a longitudinal section: white, firm but brittle flesh, with small yellow-orange stains on the cut edge and where it has been touched.
C. Middle right: a close-up of the underside: dense, short, brittle, cream to pale salmon spines (teeth) instead of gills or pores, running slightly down the stem, with a few loose spines fallen on the leaves.
D. Below B and C, small: the short whitish stem base, with no ring and no volva.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Sarcodon imbricatus at the same scale under pine needles: a larger brown cap covered in coarse, raised, dark-brown scales overlapping like roof tiles, with brown-grey spines underneath.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- spines (teeth) under the Hydnum repandum cap, not gills or pores
- light cream, ochre and salmon colors
- white brittle flesh with orange stains
- the look-alike brown with coarse tiled scales

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; gills or pores; a brown scaly cap on the repandum; corky, hard texture; red droplets on the cap; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Hydnum repandum (steccherino dorato) and to tell it apart from the dangerous look-alike Sarcodon imbricatus. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Hydnum repandum: authority for the cream-ochre cap and overall shape; the second image is a close-up photo of the Hydnum repandum spines: authority for the spine shape and color; the third image is a historical watercolor plate of Hydnum repandum by Bresadola: style reference only; the fourth image is a photo of Sarcodon imbricatus: authority for the look-alike's coarse tiled brown scales. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint two Hydnum repandum on oak leaf litter at three-quarter view: caps 6 to 10 cm, irregular and lobed with a wavy margin, cream to pale ochre-apricot, dry, matte and felt-like; short, stout, often off-center whitish stems.
Then, in the middle row, paint on the left a longitudinal section: white, firm but brittle flesh, with small yellow-orange stains on the cut edge and where it has been touched, and on the right a close-up of the underside: dense, short, brittle, cream to pale salmon spines (teeth) instead of gills or pores, running slightly down the stem, with a few loose spines fallen on the leaves.
Below them, add a small vignette of the short whitish stem base, with no ring and no volva.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Sarcodon imbricatus at the same scale under pine needles: a larger brown cap covered in coarse, raised, dark-brown scales overlapping like roof tiles, with brown-grey spines underneath.

Keep these facts exactly right: spines (teeth) under the Hydnum repandum cap, not gills or pores; light cream, ochre and salmon colors; white brittle flesh with orange stains; the look-alike brown with coarse tiled scales. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Sarcodon imbricatus at the same scale under pine needles: a larger brown cap covered in coarse, raised, dark-brown scales overlapping like roof tiles, with brown-grey spines underneath. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Steccherino dorato  
  **Sottotitolo:** *Hydnum repandum* · buono
- **Etichette con linea di richiamo:**
  - "Aculei fragili sotto il cappello" → C
  - "Colori chiari: crema, ocra, salmone" → A
  - "Carne bianca e fragile" → B
  - "Si macchia di arancio al tocco" → B
- **Riquadro sosia:** titolo "Non confonderlo con" · "Sarcodon imbricato" · *Sarcodon imbricatus* · non commestibile  
  Riga: "Cappello bruno coperto di grosse squame sollevate a tegola; aculei bruno-grigi; sotto conifere."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Sotto il cappello aculei fragili invece di lamelle o pori
  - Colori chiari: crema, ocra, salmone
  - Carne bianca e fragile, non sugherosa
  - Si macchia di arancio al tocco

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Aculei fitti e corti sotto il cappello, che scendono un po' sul gambo.
- [ ] Cappello crema-ocra feltrato, irregolare; gambo corto spesso eccentrico.
- [ ] Carne bianca con macchie arancio dove è tagliata.
- [ ] Sarcodon: cappello bruno a squame grosse e sollevate.
- [ ] Nessuna gocciolina rossa (sarebbe *Hydnellum peckii*).

**Errori tipici da scartare:** pori o lamelle al posto degli aculei, aculei lunghi come una barba (*Hericium*), cappello bruno, consistenza legnosa, gambo centrale lungo e sottile.
