# Infografica: Porcino rosso (*Boletus pinophilus*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `pinophilus` (Wikidata [Q1415435](https://www.wikidata.org/wiki/Q1415435)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere il porcino rosso (cappello rosso-bruno) e separarlo dai boleti a pori rossi, in particolare dal boleto a piede rosso.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 6-25 cm, emisferico, poi convesso, molto carnoso; colore bruno-rossastro, rosso-mattone o mogano, a volte con orlo più chiaro; superficie asciutta, opaca, spesso finemente granulosa o rugosa. Gambo tozzo, panciuto, molto robusto, biancastro con sfumature bruno-rossastre; con reticolo chiaro o bruno-rossiccio, più marcato in alto.
- **B. Sezione longitudinale.** Carne bianca, rosso-vinosa subito sotto la cuticola del cappello; al taglio: **immutabile**.
- **C. Imenoforo (tubuli e pori).** Bianchi, poi giallo-crema e giallo-olivastri; pori piccoli, non cambiano colore al tocco.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore gradevole, fungino; sapore dolce; sporata bruno-olivastra.

**E. Riquadro "Non confonderlo con":** **Boleto a piede rosso (B. erythropus auct.)** (*Neoboletus luridiformis*), TOSSICO.  
Differenza in una riga: *Pori rossi, gambo punteggiato di rosso senza reticolo, carne gialla che diventa subito blu.*  
Testo completo dai dati: Pori rossi e gambo punteggiato di rosso, senza reticolo; la carne gialla diventa subito blu intenso al taglio. Tossico crudo.

Altri sosia, solo testo in piccolo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): Pori rosati, reticolo bruno scuro e grossolano, carne amarissima. Comune sotto conifere.
- Boleto dal bel piede (*Caloboletus calopus*, non commestibile): Pori gialli che bluastrano, gambo rosso con reticolo chiaro, carne che vira al blu e amara.

**Riquadro habitat / stagione / taglia:**
- Habitat: con pini, abete e faggio, più raramente castagno, su suoli acidi. Nel Reatino soprattutto nelle faggete alte e nei boschi misti con conifere.
- Stagione: una prima buttata a fine primavera (maggio-giugno) e poi agosto-ottobre.
- Taglia minima di raccolta: 4 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Scarta esemplari vecchi o invasi da larve.
- Sconsigliato il consumo crudo dei funghi spontanei.
- Un boleto rosso con pori rossi o carne che vira non è un porcino rosso.
- Limite di raccolta nel Lazio: 3 kg al giorno a persona.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Boletus_pinophilus_14.jpg) | Jukka Vauras | CC BY-SA 4.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Parco Nazionale del Gran Sasso e Monti della Laga, Valle Castellana, Abruzzo, IT (2025-07-28) | [link](https://www.inaturalist.org/observations/302886287) | Dr. Fabio Mao Valletta | CC BY-NC | solo confronto |
| 3 | Tavola | tavola storica intitolata *Boletus aereus* (tav. 924); la descrizione di Commons la attribuisce con certezza a *B. pinophilus* ed è catalogata sotto *Boletus pinophilus* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_aereus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 924, 1931; Commons: CC PDM 1.0). Nome storico nel file errato: usala come *B. pinophilus*, controllando i colori sulle foto | Image 2 |
| 4 | Foto (sosia) | N. luridiformis in situ: pori rossi, gambo punteggiato | [link](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_2020_G1.jpg) | George Chernilevsky | Pubblico dominio (rilasciata dall'autore) | Image 3 |
| 5 | Foto (sosia) | N. luridiformis tagliato: carne gialla diventata blu | [link](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_cut_and_blue.jpg) | Stephan Kleinfelder | CC0 | Image 4 |
| 6 | Tavola (sosia) | tavola storica di *Boletus erythropus* (= *N. luridiformis*, catalogata così su Commons) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_Erythropus.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 930, 1931; Commons: CC PDM 1.0) | Image 5 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 3, Image 3 = riga 4, Image 4 = riga 5, Image 5 = riga 6. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 3) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Boletus pinophilus (porcino rosso) from the dangerous look-alike Neoboletus luridiformis. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of an adult Boletus pinophilus: authority for the matte, granular red-brown cap and the squat stem.
Image 2: historical watercolor plate by Bresadola (plate 924, B. pinophilus): style reference only.
Image 3: photo of Neoboletus luridiformis: authority for the look-alike's dark velvety cap, red pores and red-dotted stem.
Image 4: photo of a cut Neoboletus luridiformis: authority for the instantly bluing yellow flesh.
Image 5: historical plate of Neoboletus luridiformis by Bresadola: shape reference for the look-alike only.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Boletus pinophilus at three-quarter view on a mossy forest floor with a few pine needles and beech leaves. The very fleshy cap is about 14 cm across, convex, matte and finely granular-wrinkled, brick-red to mahogany red-brown, sometimes a little paler at the margin. The stem is squat and very swollen, whitish flushed with reddish-brown, with a pale to reddish-brown net mainly on its upper part.
B. Middle left: a longitudinal section: thick white flesh that does not change color, with a pinkish wine-red zone just under the cap skin, and a white-cream to yellowish tube layer.
C. Middle right: a close-up of the pore surface: small pores, white to cream-yellow and olive-yellow, unbruised.
D. Below B and C, small: the swollen stem base, whitish with a reddish-brown flush, the net fading downward, a plain base in moss.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- pores of Boletus pinophilus white to yellow, never red
- the cap of B. pinophilus matte and granular, red-brown
- the section of B. pinophilus white, pinkish only just under the cap skin, with no blue
- a net (not dots) on the B. pinophilus stem
- the look-alike with red pores, red dots instead of a net, and blue flesh

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; red pores or blue staining on the pinophilus; a shiny smooth cap; red dots on the pinophilus stem; a ring or volva; gills; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Boletus pinophilus (porcino rosso) and to tell it apart from the dangerous look-alike Neoboletus luridiformis. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of an adult Boletus pinophilus: authority for the matte, granular red-brown cap and the squat stem; the second image is a historical watercolor plate by Bresadola (plate 924, B. pinophilus): style reference only; the third image is a photo of Neoboletus luridiformis: authority for the look-alike's dark velvety cap, red pores and red-dotted stem; the fourth image is a photo of a cut Neoboletus luridiformis: authority for the instantly bluing yellow flesh; the fifth image is a historical plate of Neoboletus luridiformis by Bresadola: shape reference for the look-alike only. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a mature Boletus pinophilus at three-quarter view on a mossy forest floor with a few pine needles and beech leaves. The very fleshy cap is about 14 cm across, convex, matte and finely granular-wrinkled, brick-red to mahogany red-brown, sometimes a little paler at the margin. The stem is squat and very swollen, whitish flushed with reddish-brown, with a pale to reddish-brown net mainly on its upper part.
Then, in the middle row, paint on the left a longitudinal section: thick white flesh that does not change color, with a pinkish wine-red zone just under the cap skin, and a white-cream to yellowish tube layer, and on the right a close-up of the pore surface: small pores, white to cream-yellow and olive-yellow, unbruised.
Below them, add a small vignette of the swollen stem base, whitish with a reddish-brown flush, the net fading downward, a plain base in moss.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue.

Keep these facts exactly right: pores of Boletus pinophilus white to yellow, never red; the cap of B. pinophilus matte and granular, red-brown; the section of B. pinophilus white, pinkish only just under the cap skin, with no blue; a net (not dots) on the B. pinophilus stem; the look-alike with red pores, red dots instead of a net, and blue flesh. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Porcino rosso  
  **Sottotitolo:** *Boletus pinophilus* · ottimo
- **Etichette con linea di richiamo:**
  - "Cappello rosso-bruno, opaco, granuloso" → A
  - "Pori bianchi poi gialli, mai rossi" → C
  - "Carne bianca, rosata sotto la cuticola" → B
  - "Gambo tozzo con reticolo" → A/D
- **Riquadro sosia:** titolo "Non confonderlo con" · "Boleto a piede rosso" · *Neoboletus luridiformis* · TOSSICO (crudo)  
  Riga: "Pori rossi, gambo punteggiato di rosso senza reticolo, carne gialla che diventa subito blu."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 4 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Cappello rosso-bruno, granuloso, opaco
  - Pori bianchi poi gialli, mai rosa o rossi
  - Carne bianca che non vira, rosata solo sotto la cuticola
  - Gambo tozzo con reticolo chiaro o rossiccio

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Pori di pinophilus chiari, nessuna traccia di rosso o arancio.
- [ ] Sezione bianca con sola fascia rosata sotto la cuticola; nessun blu.
- [ ] Gambo con reticolo (maglie), non con puntini.
- [ ] Cappello opaco e granuloso, non lucido o viscido.
- [ ] Piede rosso: pori rossi, gambo giallo punteggiato di rosso senza reticolo, carne gialla che diventa blu.

**Errori tipici da scartare:** porcino rosso con pori arancio o con carne che vira; gambo punteggiato; cappello rosso vivo lucido (sembra un *Rubroboletus*); sosia disegnato con reticolo.
