# Infografica: Moretta (*Tricholoma terreum*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `terreum` (Wikidata [Q27266](https://www.wikidata.org/wiki/Q27266)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere la moretta (piccola, grigio topo, feltrata, sotto pino) e separarla dall'agarico tigrino, tossico e molto più grande.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 3-8 cm, conico-campanulato da giovane, poi convesso e piano con un piccolo umbone; colore grigio topo o grigio-bruno, uniforme; superficie asciutta, feltrata, coperta di fini squamette e fibrille grigio scure; carne sottile. Gambo cilindrico, slanciato, presto cavo, bianco o grigiastro; fibrillosa; nei giovani tracce di una cortina grigia fugace in alto.
- **B. Sezione longitudinale.** Carne bianca o grigio chiaro, sottile, fragile; al taglio: **immutabile**.
- **C. Imenoforo (lamelle).** Bianche, poi grigio chiaro; poco fitte, smarginate (con una tacca vicino al gambo).
- **D. Base del gambo.** Anello: no (solo una cortina fugace negli esemplari giovani). Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore debole, non farinoso; sapore dolce, delicato; sporata bianca.

**E. Riquadro "Non confonderlo con":** **Agarico tigrino** (*Tricholoma pardinum*), TOSSICO.  
Differenza in una riga: *Molto più grande e carnoso, squame grigio-brune 'tigrate' su fondo chiaro, gambo tozzo, odore di farina.*  
Testo completo dai dati: Molto più grande e carnoso (fino a 15-20 cm), cappello coperto di squame grigio-brune su fondo chiaro, a motivo tigrato; gambo tozzo; odore di farina. Molto velenoso: gravi gastroenteriti.

Altri sosia, solo testo in piccolo:
- Tricoloma vergato (*Tricholoma virgatum*, tossico): Cappello conico con umbone appuntito, grigio argento con fibre radiali scure, lucido; sapore amaro e piccante.
- Tricoloma sciodes (*Tricholoma sciodes*, non commestibile): Simile al vergato, filo delle lamelle annerito, sapore amaro-piccante; preferisce il faggio.
- Entoloma livido (*Entoloma sinuatum*, tossico): Grande, grigio-crema liscio, lamelle giallastre che diventano rosa, sporata rosa, odore di farina; sotto latifoglie.
- Inocibi (genere) (*Inocybe*, tossico): Cappelli piccoli conici e fibrosi, spesso screpolati radialmente; lamelle grigio-brune e sporata bruna, non bianca.

**Riquadro habitat / stagione / taglia:**
- Habitat: in gruppi o in file sotto i pini, soprattutto rimboschimenti di pino nero; più raramente con latifoglie. Nel Reatino segnalata nelle pinete dell'Altopiano di Rascino.
- Stagione: ottobre-dicembre, resiste ai primi freddi.
- Taglia minima di raccolta: 3 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Fai controllare ogni raccolta: tra le morette grigie si mescolano facilmente specie tossiche.
- Scarta gli esemplari con odore di farina, sapore amaro o piccante, o lamelle e sporata non bianche.
- Uno studio del 2014 aveva ipotizzato tossine muscolari nella moretta; un lavoro del 2024 non le ha ritrovate e non risultano casi in Europa: per prudenza consumala in quantità moderate.
- Va consumata cotta.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Tricholoma_terreum_20061105wa.jpg) | User:Strobilomyces | CC BY-SA 3.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Chieti, Italia (2020-11-10) | [link](https://www.inaturalist.org/observations/64606524) | Rino | CC BY-NC | Image 2 |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Frosinone, Italia (2022-12-17) | [link](https://www.inaturalist.org/observations/146211484) | Dr. Fabio Mao Valletta | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, 60044 Fabriano AN, Italia (2024-12-03) | [link](https://www.inaturalist.org/observations/253982533) | Giorgio | CC BY-NC | solo confronto |
| 5 | Tavola | tavola storica di *T. terreum* (versione ripulita) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Tricholoma_terreum.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. II, tav. 75, 1927; Commons: CC PDM 1.0) | Image 3 |
| 6 | Tavola | stessa tav. 75 con la descrizione latina di Bresadola (scansione dal MUSE di Trento) | [link](https://commons.wikimedia.org/wiki/File:Tricholoma_terreum-Icon-Mycol.-Tab-75.jpg) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Commons: CC PDM 1.0) | solo confronto |
| 7 | Foto (sosia, iNaturalist, research grade) | Tricholoma pardinum in natura | [link](https://www.inaturalist.org/observations/317281798) | Luca Pilia | CC BY-NC | Image 4 |
| 8 | Tavola (sosia) | tavola storica di *Tricholoma tigrinum* (= *T. pardinum*, catalogata così su Commons) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Tricholoma_tigrinum.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. II, tav. 90, 1927; Commons: CC PDM 1.0) | Image 5 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 2, Image 3 = riga 5, Image 4 = riga 7, Image 5 = riga 8. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 5) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Tricholoma terreum (moretta) from the dangerous look-alike Tricholoma pardinum. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Tricholoma terreum: authority for the mouse-grey felted cap and the white-grey gills.
Image 2: photo of Tricholoma terreum from central Italy: second authority for color and habit.
Image 3: historical watercolor plate of Tricholoma terreum by Bresadola: style reference only.
Image 4: photo of Tricholoma pardinum: authority for the look-alike's scaly tiger-patterned cap and size.
Image 5: historical plate of Tricholoma pardinum (as T. tigrinum) by Bresadola: shape reference for the look-alike.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a small group of Tricholoma terreum in a row under black pine on pine needles, at three-quarter view: caps 3 to 7 cm, conical-bell-shaped when young and then convex-flat with a small umbo, mouse-grey to grey-brown, dry and felted with fine dark-grey fibrils and tiny scales; slender white to greyish stems.
B. Middle left: a longitudinal section: thin white to pale grey brittle flesh that does not change color, and a stem that is becoming hollow.
C. Middle right: a close-up of the white to pale grey, moderately spaced gills with a notch where they meet the stem.
D. Below B and C, small: the white fibrillose stem base on pine needles, with no ring and no volva; on the youngest specimen, only a faint trace of a grey cobweb veil at the stem apex.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Tricholoma pardinum at its true relative scale, about twice as large (cap 10 to 15 cm): a very fleshy, pale cap covered in grey-brown scales arranged in a concentric, tiger-like pattern, and a squat, thick stem.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- small, mouse-grey, felted caps with a little umbo
- white to grey gills with a notch near the stem
- pine needles under the group
- thin flesh
- the look-alike clearly larger and fleshier, with a tiger pattern

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; a shiny silver cap with radial streaks and a pointed umbo (that is Tricholoma virgatum); yellowish or pink gills; brown gills; large fleshy caps on the terreum; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Tricholoma terreum (moretta) and to tell it apart from the dangerous look-alike Tricholoma pardinum. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of Tricholoma terreum: authority for the mouse-grey felted cap and the white-grey gills; the second image is a photo of Tricholoma terreum from central Italy: second authority for color and habit; the third image is a historical watercolor plate of Tricholoma terreum by Bresadola: style reference only; the fourth image is a photo of Tricholoma pardinum: authority for the look-alike's scaly tiger-patterned cap and size; the fifth image is a historical plate of Tricholoma pardinum (as T. tigrinum) by Bresadola: shape reference for the look-alike. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a small group of Tricholoma terreum in a row under black pine on pine needles, at three-quarter view: caps 3 to 7 cm, conical-bell-shaped when young and then convex-flat with a small umbo, mouse-grey to grey-brown, dry and felted with fine dark-grey fibrils and tiny scales; slender white to greyish stems.
Then, in the middle row, paint on the left a longitudinal section: thin white to pale grey brittle flesh that does not change color, and a stem that is becoming hollow, and on the right a close-up of the white to pale grey, moderately spaced gills with a notch where they meet the stem.
Below them, add a small vignette of the white fibrillose stem base on pine needles, with no ring and no volva; on the youngest specimen, only a faint trace of a grey cobweb veil at the stem apex.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Tricholoma pardinum at its true relative scale, about twice as large (cap 10 to 15 cm): a very fleshy, pale cap covered in grey-brown scales arranged in a concentric, tiger-like pattern, and a squat, thick stem.

Keep these facts exactly right: small, mouse-grey, felted caps with a little umbo; white to grey gills with a notch near the stem; pine needles under the group; thin flesh; the look-alike clearly larger and fleshier, with a tiger pattern. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Tricholoma pardinum at its true relative scale, about twice as large (cap 10 to 15 cm): a very fleshy, pale cap covered in grey-brown scales arranged in a concentric, tiger-like pattern, and a squat, thick stem. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Moretta  
  **Sottotitolo:** *Tricholoma terreum* · buono
- **Etichette con linea di richiamo:**
  - "Cappello grigio topo, feltrato, con umbone" → A
  - "Lamelle bianco-grigie smarginate" → C
  - "Carne sottile, odore NON di farina" → B
  - "Sotto pino, a fine autunno" → A
- **Riquadro sosia:** titolo "Non confonderlo con" · "Agarico tigrino" · *Tricholoma pardinum* · TOSSICO  
  Riga: "Molto più grande e carnoso, squame grigio-brune 'tigrate' su fondo chiaro, gambo tozzo, odore di farina."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 3 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Cappello piccolo grigio topo, feltrato, con umbone
  - Lamelle bianco-grigie smarginate
  - Carne sottile, odore debole NON di farina
  - Sapore dolce, non amaro né piccante
  - Sotto pino, a fine autunno

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Cappello piccolo, grigio, feltrato-squamuloso, opaco, con umbone.
- [ ] Lamelle bianche o grigio chiaro, smarginate; nessuna sfumatura rosa o bruna.
- [ ] Gambo bianco-grigiastro senza anello.
- [ ] Contesto di pineta.
- [ ] Tigrino: grande, carnoso, squame tigrate, gambo tozzo; scala circa 2:1.

**Errori tipici da scartare:** cappello lucido argenteo e appuntito (*T. virgatum*), lamelle che virano al rosa (*Entoloma*), lamelle bruno-grigie e cappello fibroso conico (*Inocybe*), moretta grande quanto il tigrino.
