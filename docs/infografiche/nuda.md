# Infografica: Agarico violetto (*Lepista nuda (= Collybia nuda)*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `nuda` (Wikidata [Q29362](https://www.wikidata.org/wiki/Q29362)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere l'agarico violetto (tutto viola, nessuna cortina, sporata rosa pallido) e separarlo dai cortinari violetti, che hanno cortina e sporata ruggine.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 5-15 cm, convesso, poi piano o un po' depresso, carnoso, margine arrotolato; colore viola-lilla, poi bruno-violaceo; schiarisce col secco fino a rosa-lilla o nocciola; superficie liscia, nuda, un po' untuosa con l'umido. Gambo robusto, cilindrico, un po' ingrossato alla base, viola, concolore alle lamelle; fibrillosa, con feltro miceliare violaceo alla base.
- **B. Sezione longitudinale.** Carne lilla-grigiastra, soda; al taglio: **immutabile**.
- **C. Imenoforo (lamelle).** Viola-lilla, poi lilla-rosate o brunastre; fitte, smarginate; si staccano facilmente dalla carne del cappello.
- **D. Base del gambo.** Anello: no (nessuna cortina o ragnatela). Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore aromatico, fruttato; sapore dolciastro; sporata rosa pallido o crema-rosata.

**E. Riquadro "Non confonderlo con":** **Cortinario tragano** (*Cortinarius traganus*), TOSSICO.  
Differenza in una riga: *Cortina ragnatelosa, lamelle che diventano color ruggine, carne giallo-zafferano nel gambo, odore di acetilene o di caprone.*  
Testo completo dai dati: Lilla con cortina ragnatelosa, lamelle che diventano color ruggine, carne giallo-zafferano nel gambo, odore di acetilene o di caprone; sporata ruggine.

Altri sosia, solo testo in piccolo:
- Cortinario violaceo (*Cortinarius violaceus*, non commestibile): Viola scurissimo, cappello squamuloso-vellutato, cortina, sporata ruggine. Tutti i cortinari violetti vanno scartati.
- Inocibe lilla (*Inocybe lilacina*, tossico): Piccolo (2-4 cm), cappello conico setoso lilla, lamelle grigio-brune, odore di terra; sporata bruna.
- Micena pura (*Mycena pura*, tossico): Piccola (2-5 cm), carne sottile, margine striato, gambo cavo e fragile, odore di rapa o ravanello.
- Laccaria ametistina (*Laccaria amethystina*, commestibile): Piccola, viola intenso, lamelle spesse e spaziate, gambo sottile e fibroso, sporata bianca.

**Riquadro habitat / stagione / taglia:**
- Habitat: sulla lettiera di boschi di conifere e latifoglie, anche margini, siepi e prati, spesso in cerchi. Nel Reatino segnalata nelle pinete dell'Altopiano di Rascino.
- Stagione: ottobre-dicembre, a volte fino a gennaio.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Tossica cruda o poco cotta: cuocila a lungo.
- Fai sempre la sporata o farla fare all'ASL: rosa pallido è giusta, ruggine indica un Cortinarius (alcuni sono mortali per i reni).
- Scarta esemplari con resti di ragnatela sul gambo o lamelle color ruggine.
- Scarta gli esemplari vecchi o fradici.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Lepista_nuda.jpg) | Archenzo, Italy | CC BY-SA 3.0 | Image 1 |
| 2 | Tavola | tavola storica di *Tricholoma nudum* (= *Lepista nuda*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Tricholoma_nudum.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. III, tav. 112, 1928; Commons: CC PDM 1.0) | Image 2 |
| 3 | Foto (sosia, iNaturalist, research grade) | Cortinarius traganus in natura | [link](https://www.inaturalist.org/observations/312654631) | Nicolas Schwab | CC BY-NC | Image 3 |
| 4 | Tavola (sosia) | tavola storica di *C. traganus* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_Cortinarius_traganus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIII, tav. 638, 1930; Commons: CC PDM 1.0) | Image 4 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 3, Image 4 = riga 4. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 2) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Lepista nuda (agarico violetto) from the dangerous look-alike Cortinarius traganus. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Lepista nuda: authority for the violet-lilac colors and the robust shape.
Image 2: historical watercolor plate of Lepista nuda (as Tricholoma nudum) by Bresadola: style reference, and a second reference for colors and shape.
Image 3: photo of Cortinarius traganus: authority for the look-alike's lilac cap and cobweb veil remnants.
Image 4: historical plate of Cortinarius traganus by Bresadola: shape reference for the look-alike, including the yellow flesh.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: two Lepista nuda in pine and mixed-wood litter at three-quarter view, one young and one mature: caps 6 to 12 cm, convex then flat or slightly depressed, fleshy, with an inrolled margin and a smooth, bare, slightly greasy surface, violet-lilac becoming brownish-violet at the center. The stem is robust and slightly swollen at the base, violet like the gills, fibrillose, with violet mycelial felt at the base.
B. Middle left: a longitudinal section: firm, lilac-greyish flesh that does not change color.
C. Middle right: a close-up of crowded, notched, violet-lilac gills, clean, with nothing like a cobweb between the cap edge and the stem.
D. Below B and C, small: the stem base with violet mycelium and bits of litter attached, with no ring, no veil remnants and no volva; next to it a small pale pinkish spore print on a black card.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Cortinarius traganus at the same scale: a lilac cap with remains of a cobweb-like veil on the stem, gills turning rusty brown, a cut stem showing saffron-yellow flesh, and rusty-brown spore dust.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- Lepista nuda violet-lilac in cap, gills and stem
- no cobweb veil on Lepista nuda
- a pale pinkish spore print
- a robust, fleshy habit
- the look-alike with a cobweb veil, rusty gills and yellow flesh in the stem

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; a cobweb veil or rusty gills on the nuda; yellow flesh; small, slender, conical caps; a ring; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Lepista nuda (agarico violetto) and to tell it apart from the dangerous look-alike Cortinarius traganus. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Lepista nuda: authority for the violet-lilac colors and the robust shape; the second image is a historical watercolor plate of Lepista nuda (as Tricholoma nudum) by Bresadola: style reference, and a second reference for colors and shape; the third image is a photo of Cortinarius traganus: authority for the look-alike's lilac cap and cobweb veil remnants; the fourth image is a historical plate of Cortinarius traganus by Bresadola: shape reference for the look-alike, including the yellow flesh. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint two Lepista nuda in pine and mixed-wood litter at three-quarter view, one young and one mature: caps 6 to 12 cm, convex then flat or slightly depressed, fleshy, with an inrolled margin and a smooth, bare, slightly greasy surface, violet-lilac becoming brownish-violet at the center. The stem is robust and slightly swollen at the base, violet like the gills, fibrillose, with violet mycelial felt at the base.
Then, in the middle row, paint on the left a longitudinal section: firm, lilac-greyish flesh that does not change color, and on the right a close-up of crowded, notched, violet-lilac gills, clean, with nothing like a cobweb between the cap edge and the stem.
Below them, add a small vignette of the stem base with violet mycelium and bits of litter attached, with no ring, no veil remnants and no volva; next to it a small pale pinkish spore print on a black card.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Cortinarius traganus at the same scale: a lilac cap with remains of a cobweb-like veil on the stem, gills turning rusty brown, a cut stem showing saffron-yellow flesh, and rusty-brown spore dust.

Keep these facts exactly right: Lepista nuda violet-lilac in cap, gills and stem; no cobweb veil on Lepista nuda; a pale pinkish spore print; a robust, fleshy habit; the look-alike with a cobweb veil, rusty gills and yellow flesh in the stem. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Cortinarius traganus at the same scale: a lilac cap with remains of a cobweb-like veil on the stem, gills turning rusty brown, a cut stem showing saffron-yellow flesh, and rusty-brown spore dust. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Agarico violetto  
  **Sottotitolo:** *Lepista nuda (= Collybia nuda)* · commestibile con cautela
- **Etichette con linea di richiamo:**
  - "Tutto viola-lilla: cappello, lamelle, gambo" → A
  - "Nessuna cortina o ragnatela" → C
  - "Sporata rosa pallido, mai ruggine" → D
  - "Carne lilla, non gialla" → B
  - "Fungo tardivo, di fine autunno" → A
- **Riquadro sosia:** titolo "Non confonderlo con" · "Cortinario tragano" · *Cortinarius traganus* · TOSSICO  
  Riga: "Cortina ragnatelosa, lamelle che diventano color ruggine, carne giallo-zafferano nel gambo, odore di acetilene o di caprone."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Tutto viola o lilla: cappello, lamelle e gambo
  - Nessuna cortina o ragnatela tra cappello e gambo
  - Sporata rosa pallido, mai ruggine
  - Odore aromatico e fruttato
  - Fungo tardivo, di fine autunno

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Cappello, lamelle e gambo viola-lilla (schiarito al centro negli adulti).
- [ ] Nessuna traccia di cortina tra cappello e gambo.
- [ ] Sporata rosa pallido; nessuna polvere ruggine.
- [ ] Carne lilla-grigia in sezione, non gialla.
- [ ] Tragano: cortina, lamelle ruggine, carne gialla nel gambo.

**Errori tipici da scartare:** cortina o fibrille ragnatelose sul gambo del violetto, lamelle brune o ruggine, carne gialla, cappello piccolo e conico (*Inocybe lilacina*), cappello striato e fragile (*Mycena pura*).
