# Infografica: Chiodino (*Armillaria mellea*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `mellea` (Wikidata [Q473745](https://www.wikidata.org/wiki/Q473745)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere il chiodino (cespi su legno, anello, sporata bianca, squamette scure) e separarlo dalla Galerina marginata (mortale), che cresce sul legno nella stessa stagione.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 3-12 cm, convesso, poi piano, a volte un po' umbonato o depresso; colore giallo-miele, bruno-giallastro o bruno-rossiccio, più scuro al centro; superficie con piccole squame scure, fitte al centro, che spariscono negli adulti; margine sottile e striato. Gambo cilindrico, slanciato, curvo, saldato alla base con altri gambi a formare cespi, giallastro in alto, bruno-olivaceo o nerastro verso la base; fibrosa; alla base cordoni neri (rizomorfe).
- **B. Sezione longitudinale.** Carne bianca, tenera nel cappello, fibrosa e dura nel gambo; al taglio: **immutabile**.
- **C. Imenoforo (lamelle).** Bianche o crema, poi giallastre con macchie bruno-rosate; poco fitte, un po' decorrenti.
- **D. Base del gambo.** Anello: sì: membranoso, ampio, bianco sopra e giallastro-fioccoso sotto. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore fungino; sapore dolce-acidulo con retrogusto amarognolo; sporata bianca.

**E. Riquadro "Non confonderlo con":** **Galerina marginata** (*Galerina marginata*), MORTALE.  
Differenza in una riga: *Più piccola, cappello liscio bruno-ocra senza squamette, sporata bruno-ruggine; anche nella stagione dei chiodini.*  
Testo completo dai dati: Più piccola (cappello 1-5 cm), bruno-ocra liscia senza squamette; anello sottile spesso sporcato di ruggine; sporata bruno-ruggine, non bianca. Su legno, anche nella stagione dei chiodini.

Altri sosia, solo testo in piccolo:
- Falso chiodino (*Hypholoma fasciculare*, tossico): Giallo zolfo; lamelle giallo-verdastre poi nerastre; niente anello vero, solo una cortina; sporata bruno-violacea scura; sapore molto amaro.
- Cortinario rubello (*Cortinarius rubellus*, mortale): Fulvo-aranciato, cappello conico a punta, cortina e non anello, sporata ruggine; cresce a terra sotto conifere. Danni renali tardivi.
- Folliota spettabile (*Gymnopilus junonius*, tossico): Più grande, giallo-oro o arancio, carne amara; lamelle che diventano ruggine e sporata ruggine.
- Folliota squarrosa (*Pholiota squarrosa*, non commestibile): Cappello e gambo coperti di grosse squame rialzate e asciutte; sporata bruno-ruggine.
- Chiodino senza anello (*Armillaria tabescens (= Desarmillaria tabescens)*, commestibile): Simile ma senza anello; stesse cautele del chiodino (tossico crudo).

**Riquadro habitat / stagione / taglia:**
- Habitat: parassita a cespi su ceppaie, radici e tronchi di latifoglie (querce, castagno, faggio, carpino, pioppi e salici) e più raramente conifere.
- Stagione: settembre-novembre, a ondate dopo le prime piogge fresche.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Tossico crudo o poco cotto: prebollilo, butta l'acqua e poi cuocilo di nuovo a lungo. Le indicazioni sui tempi variano (ASL Biella: 5 minuti di prebollitura e 15-20 di cottura; altre fonti chiedono 15-20 minuti già di prebollitura): segui la versione più lunga.
- Non congelarlo crudo e scarta i chiodini colpiti dal gelo: sono stati descritti disturbi anche dopo cottura.
- Usa solo i cappelli e la parte alta del gambo; il resto è fibroso e indigesto.
- È tra le prime cause di intossicazione in Italia: mangiane poco, evita pasti ripetuti ravvicinati; alcune persone sono intolleranti.
- Con 'chiodino' si raccolgono più specie di Armillaria (A. mellea, A. gallica, A. ostoyae): valgono per tutte le stesse cautele. Ogni cespo va verificato fungo per fungo: le Galerina crescono anche mescolate.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Armillaria_mellea_(1).jpg) | tomasz przechlewski from Sopot, Poland | CC BY 2.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Grosseto, Italia (2020-11-07) | [link](https://www.inaturalist.org/observations/64431559) | lucapassalacqua | CC BY-NC | Image 2 |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Viterbo, Italia (2024-10-20) | [link](https://www.inaturalist.org/observations/277155542) | Alessandra Florea e Andrea Boiani | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Crocco- Olivi, 00148 Roma RM, Italia (2021-11-15) | [link](https://www.inaturalist.org/observations/101284231) | diegoreggianti | CC BY-NC | solo confronto |
| 5 | Tavola | tavola storica di *A. mellea* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Armillaria_mellea.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. II, tav. 52, 1927; Commons: CC PDM 1.0) | Image 3 |
| 6 | Foto (sosia, iNaturalist, research grade) | Galerina marginata in natura | [link](https://www.inaturalist.org/observations/332323711) | Manuela Fiorini | CC BY | Image 4 |
| 7 | Tavola (sosia) | tavola storica di *Pholiota marginata* (= *Galerina marginata*) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Pholiota_marginata.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XV, tav. 704, 1930; Commons: CC PDM 1.0) | Image 5 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 5, Image 4 = riga 6, Image 5 = riga 7. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Armillaria mellea (chiodino) from the dangerous look-alike Galerina marginata. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of an Armillaria mellea clump: authority for cap color, central scales, ring and clustered growth.
Image 2: photo of Armillaria mellea from central Italy: second authority for colors and stems.
Image 3: historical watercolor plate of Armillaria mellea by Bresadola: style reference only.
Image 4: photo of Galerina marginata: authority for the look-alike's small smooth brown caps on wood.
Image 5: historical plate of Galerina marginata (as Pholiota marginata) by Bresadola: shape reference for the look-alike.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a dense clump of Armillaria mellea growing from an oak stump at three-quarter view: 8 to 12 caps 3 to 10 cm across, convex to flat, honey-yellow to yellow-brown and darker at the center, with small dark hair-like scales concentrated at the center and a thin striate margin. Slender, curved stems fused together at the base, yellowish at the top and olive-brown to blackish toward the base, each with a membranous ring that is white above and yellowish-woolly beneath. The lower caps are dusted with white spore powder.
B. Middle left: a longitudinal section of one cap and stem: white flesh, tender in the cap and fibrous in the stem, that does not change color.
C. Middle right: a close-up of the gills: white to cream, moderately spaced, slightly decurrent, with a few pinkish-brown spots, and white spore dust on the cap below.
D. Below B and C, small: the fused stem bases on the wood, with black bootlace-like cords (rhizomorphs) running under lifted bark.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a small group of Galerina marginata on rotten wood at its true relative scale (caps 1 to 5 cm): small, smooth, ochre-brown caps without scales, a thin brown ring often dusted rusty with spores, and rusty-brown spore dust.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- Armillaria mellea in a clump on wood
- white spore dust, not rusty
- a membranous ring on each stem
- dark scales at the cap center
- black rhizomorphs at the base
- the look-alike smaller, smooth, with rusty spore dust

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; sulphur-yellow caps with greenish gills (that is Hypholoma fasciculare); rusty spore dust on the mellea; stems without rings; single mushrooms on soil; a volva; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Armillaria mellea (chiodino) and to tell it apart from the dangerous look-alike Galerina marginata. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of an Armillaria mellea clump: authority for cap color, central scales, ring and clustered growth; the second image is a photo of Armillaria mellea from central Italy: second authority for colors and stems; the third image is a historical watercolor plate of Armillaria mellea by Bresadola: style reference only; the fourth image is a photo of Galerina marginata: authority for the look-alike's small smooth brown caps on wood; the fifth image is a historical plate of Galerina marginata (as Pholiota marginata) by Bresadola: shape reference for the look-alike. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a dense clump of Armillaria mellea growing from an oak stump at three-quarter view: 8 to 12 caps 3 to 10 cm across, convex to flat, honey-yellow to yellow-brown and darker at the center, with small dark hair-like scales concentrated at the center and a thin striate margin. Slender, curved stems fused together at the base, yellowish at the top and olive-brown to blackish toward the base, each with a membranous ring that is white above and yellowish-woolly beneath. The lower caps are dusted with white spore powder.
Then, in the middle row, paint on the left a longitudinal section of one cap and stem: white flesh, tender in the cap and fibrous in the stem, that does not change color, and on the right a close-up of the gills: white to cream, moderately spaced, slightly decurrent, with a few pinkish-brown spots, and white spore dust on the cap below.
Below them, add a small vignette of the fused stem bases on the wood, with black bootlace-like cords (rhizomorphs) running under lifted bark.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a small group of Galerina marginata on rotten wood at its true relative scale (caps 1 to 5 cm): small, smooth, ochre-brown caps without scales, a thin brown ring often dusted rusty with spores, and rusty-brown spore dust.

Keep these facts exactly right: Armillaria mellea in a clump on wood; white spore dust, not rusty; a membranous ring on each stem; dark scales at the cap center; black rhizomorphs at the base; the look-alike smaller, smooth, with rusty spore dust. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a small group of Galerina marginata on rotten wood at its true relative scale (caps 1 to 5 cm): small, smooth, ochre-brown caps without scales, a thin brown ring often dusted rusty with spores, and rusty-brown spore dust. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Chiodino  
  **Sottotitolo:** *Armillaria mellea* · commestibile con cautela
- **Etichette con linea di richiamo:**
  - "Cespi fitti su legno o radici" → A
  - "Sporata BIANCA" → A, cappelli sottostanti
  - "Anello membranoso bianco-giallastro" → A
  - "Squamette scure al centro" → A
  - "Cordoni neri alla base" → D
- **Riquadro sosia:** titolo "Non confonderlo con" · "Galerina marginata" · *Galerina marginata* · MORTALE  
  Riga: "Più piccola, cappello liscio bruno-ocra senza squamette, sporata bruno-ruggine; anche nella stagione dei chiodini."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Cespi fitti su legno o radici
  - Sporata BIANCA: i gambi sottostanti si coprono di polvere bianca
  - Anello membranoso bianco-giallastro
  - Squamette scure al centro del cappello
  - Cordoni neri alla base dei gambi

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Cespo saldato alla base su ceppaia o radici.
- [ ] Polvere di spore bianca sui cappelli sottostanti.
- [ ] Anello membranoso su ogni gambo; squamette scure concentrate al centro.
- [ ] Rizomorfe nere visibili alla base o sotto la corteccia.
- [ ] Galerina: piccola, liscia, bruno-ocra, sporata ruggine, scala corretta.

**Errori tipici da scartare:** cappelli giallo zolfo con lamelle verdastre (*Hypholoma*), sporata ruggine sul chiodino, assenza di anello (accettabile solo per *A. tabescens*, non per questa tavola), Galerina grande quanto il chiodino.
