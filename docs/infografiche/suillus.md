# Infografica: Pinarolo (*Suillus luteus; Suillus granulatus; Suillus collinitus*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `suillus` (Wikidata [Q816730](https://www.wikidata.org/wiki/Q816730)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere i pinaroli (Suillus luteus, S. granulatus, S. collinitus: solo sotto pino, cappello vischioso, pori gialli che non virano) e separarli dal boleto pepato.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 4-12 cm, emisferico, poi convesso-appianato; colore S. luteus: bruno-cioccolato o bruno-porpora. S. granulatus: ruggine, bruno-giallastro. S. collinitus: castano con fibrille radiali più scure; superficie vischiosa e lucida con l'umido; cuticola che si stacca tutta. Gambo cilindrico, giallastro o bianco-giallo; con granulazioni nella parte alta; S. collinitus con feltro miceliare rosa alla base.
- **B. Sezione longitudinale.** Carne bianca o giallo-limone, tenera; al taglio: **immutabile**.
- **C. Imenoforo (tubuli e pori).** Gialli, poi giallo-olivastri; pori piccoli, non virano al blu. S. granulatus da giovane trasuda goccioline lattiginose; S. collinitus no.
- **D. Base del gambo.** Anello: S. luteus: sì, ampio, membranoso, bianco poi violaceo. S. granulatus e S. collinitus: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore gradevole, fruttato o leggermente fenolico; sapore dolce; sporata bruno-ocra o bruno-olivastra.

**E. Riquadro "Non confonderlo con":** **Boleto pepato** (*Chalciporus piperatus*), NON COMMESTIBILE.  
Differenza in una riga: *Piccolo, pori bruno-ramati, micelio giallo vivo alla base, sapore di pepe.*  
Testo completo dai dati: Piccolo, pori bruno-ramati o rossicci, base del gambo con micelio giallo vivo, sapore piccante come pepe.

> Nei dati non c'è un sosia tossico: il riquadro mostra il boleto pepato (non commestibile, si trova negli stessi boschi).

Altri sosia, solo testo in piccolo:
- Boleto bovino (*Suillus bovinus*, commestibile): Pori grandi e angolosi, divisi in pori più piccoli, gambo senza anello né granulazioni, carne gommosa. Mediocre.

**Riquadro habitat / stagione / taglia:**
- Habitat: solo sotto pini: rimboschimenti di pino nero e silvestre in montagna, pinete termofile in collina (S. collinitus). Nel Reatino es. pinete dell'Altopiano di Rascino.
- Stagione: S. granulatus da maggio a novembre; S. luteus e S. collinitus soprattutto settembre-novembre.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Togli sempre la cuticola vischiosa: è lassativa e alcune intossicazioni sono legate al consumo del fungo non pelato.
- In alcune persone causa disturbi intestinali o reazioni allergiche: mangiane poco la prima volta.
- Scarta gli esemplari vecchi e molli; va consumato cotto.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Ruhland,_Grenzstra%C3%9Fe_bei_Hausnr._1,_Butterpilz_am_Parkplatzrand,_Entwicklungsreihe,_Herbst,_02.jpg) | Wilhelm Zimmerling PAR | CC BY-SA 4.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Gračišče, Gračišče, Koper, SI (2025-10-31) | [link](https://www.inaturalist.org/observations/324158342) | Oliver Stöhr | CC BY-NC | solo confronto |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Maderlina, Cembra-Lisignago, IT-TN, Italy (2022-10-10) | [link](https://www.inaturalist.org/observations/138249938) | Marco Floriani | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Őrségi Nemzeti Park, Apátistvánfalva, VA, HU (2023-11-07) | [link](https://www.inaturalist.org/observations/190290693) | krezga | CC BY-NC | solo confronto |
| 5 | Tavola | tavola storica di *Boletus luteus* (= *S. luteus*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_luteus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 901, 1931; Commons: CC PDM 1.0) | Image 2 |
| 6 | Tavola | tavola storica di *Boletus granulatus* (= *S. granulatus*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_granulatus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 907, 1931; Commons: CC PDM 1.0) | Image 3 |
| 7 | Tavola | tavola storica di *Boletus collinitus* (= *S. collinitus*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_collinitus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 906, 1931; Commons: CC PDM 1.0) | Image 4 |
| 8 | Foto (sosia, iNaturalist, research grade) | Chalciporus piperatus in natura | [link](https://www.inaturalist.org/observations/315216879) | Nicolas Schwab | CC BY-NC | Image 5 |
| 9 | Tavola (sosia) | tavola storica di *Boletus piperatus* (= *Chalciporus piperatus*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_piperatus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 911, 1931; Commons: CC PDM 1.0) | solo confronto |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 5, Image 3 = riga 6, Image 4 = riga 7, Image 5 = riga 8. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Suillus luteus, S. granulatus and S. collinitus (pinarolo) from the dangerous look-alike Chalciporus piperatus. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo series of Suillus luteus at different ages: authority for cap color, slimy surface and the ring.
Image 2: historical watercolor plate of Suillus luteus by Bresadola: style reference only.
Image 3: historical plate of Suillus granulatus by Bresadola: shape reference for the ringless stem and the pore droplets of vignette C.
Image 4: historical plate of Suillus collinitus by Bresadola: shape reference for the stem base of vignette D.
Image 5: photo of Chalciporus piperatus: authority for the look-alike's copper-brown pores and small size.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a group of Suillus luteus under pine on a carpet of pine needles at three-quarter view: caps about 8 cm across, convex to flattening, chocolate to purple-brown, slimy and glossy, one cap with its skin partly peeled back at the edge to show that it comes away entirely. Yellowish stems with a large membranous ring, white turning violet-brown, and small brown dots above the ring.
B. Middle left: a longitudinal section: soft white to lemon-yellow flesh that does not change color, and a yellow tube layer.
C. Middle right: a close-up of a Suillus granulatus pore surface: small yellow to olive-yellow pores beaded with tiny milky white droplets.
D. Below B and C, small: a Suillus collinitus stem base wrapped in pinkish mycelial felt, beside the ringless granulated apex of a S. granulatus stem.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Chalciporus piperatus at its true relative scale (cap 3 to 6 cm): a small cinnamon-brown cap, copper-brown to rusty-red pores, and a slender stem with bright yellow mycelium at the base.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- pine needles and pine context only
- slimy, glossy caps with peelable skin
- yellow pores with no blue staining
- the violet-tinged ring of S. luteus, the milky droplets of S. granulatus and the pink base of S. collinitus
- the look-alike small, with copper-red pores and a yellow base

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; blue staining; red pores on the suillus; dry matte caps; broadleaf litter; a volva; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Suillus luteus, S. granulatus and S. collinitus (pinarolo) and to tell it apart from the dangerous look-alike Chalciporus piperatus. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo series of Suillus luteus at different ages: authority for cap color, slimy surface and the ring; the second image is a historical watercolor plate of Suillus luteus by Bresadola: style reference only; the third image is a historical plate of Suillus granulatus by Bresadola: shape reference for the ringless stem and the pore droplets of vignette C; the fourth image is a historical plate of Suillus collinitus by Bresadola: shape reference for the stem base of vignette D; the fifth image is a photo of Chalciporus piperatus: authority for the look-alike's copper-brown pores and small size. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a group of Suillus luteus under pine on a carpet of pine needles at three-quarter view: caps about 8 cm across, convex to flattening, chocolate to purple-brown, slimy and glossy, one cap with its skin partly peeled back at the edge to show that it comes away entirely. Yellowish stems with a large membranous ring, white turning violet-brown, and small brown dots above the ring.
Then, in the middle row, paint on the left a longitudinal section: soft white to lemon-yellow flesh that does not change color, and a yellow tube layer, and on the right a close-up of a Suillus granulatus pore surface: small yellow to olive-yellow pores beaded with tiny milky white droplets.
Below them, add a small vignette of a Suillus collinitus stem base wrapped in pinkish mycelial felt, beside the ringless granulated apex of a S. granulatus stem.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Chalciporus piperatus at its true relative scale (cap 3 to 6 cm): a small cinnamon-brown cap, copper-brown to rusty-red pores, and a slender stem with bright yellow mycelium at the base.

Keep these facts exactly right: pine needles and pine context only; slimy, glossy caps with peelable skin; yellow pores with no blue staining; the violet-tinged ring of S. luteus, the milky droplets of S. granulatus and the pink base of S. collinitus; the look-alike small, with copper-red pores and a yellow base. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Chalciporus piperatus at its true relative scale (cap 3 to 6 cm): a small cinnamon-brown cap, copper-brown to rusty-red pores, and a slender stem with bright yellow mycelium at the base. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Pinarolo  
  **Sottotitolo:** *Suillus luteus; Suillus granulatus; Suillus collinitus* · commestibile con cautela
- **Etichette con linea di richiamo:**
  - "Solo sotto i pini" → A
  - "Cappello vischioso, cuticola che si stacca" → A
  - "Pori gialli, non virano al blu" → C
  - "luteus: anello violaceo" → A
  - "granulatus: gocce di lattice sui pori" → C
  - "collinitus: base rosa" → D
- **Riquadro sosia:** titolo "Non confonderlo con" · "Boleto pepato" · *Chalciporus piperatus* · non commestibile  
  Riga: "Piccolo, pori bruno-ramati, micelio giallo vivo alla base, sapore di pepe."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Cresce solo sotto i pini
  - Cappello vischioso con cuticola che si stacca
  - Pori gialli che non virano al blu
  - Anello violaceo (luteus), gocce di lattice sui pori (granulatus), base rosa (collinitus)

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Contesto di pineta (aghi, pigne), niente foglie di latifoglie.
- [ ] Cappelli vischiosi e lucidi; cuticola che si solleva.
- [ ] Pori gialli senza blu; goccioline lattiginose solo nel dettaglio granulatus.
- [ ] Anello membranoso violaceo su luteus; feltro rosa alla base di collinitus.
- [ ] Pepato: piccolo, pori ramati, micelio giallo vivo alla base.

**Errori tipici da scartare:** pori che bluastrano, pori grandi e angolosi (*S. bovinus*), anello sul granulatus, cappelli asciutti e vellutati, pepato grande quanto il pinarolo.
