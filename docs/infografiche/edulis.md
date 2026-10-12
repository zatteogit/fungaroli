# Infografica: Porcino (*Boletus edulis*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `edulis` (Wikidata [Q19740](https://www.wikidata.org/wiki/Q19740)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere il porcino comune dai boleti a pori rossi o con carne che vira, in particolare dal boleto satana (tossico).

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 5-25 cm, emisferico da giovane, poi convesso e piano-convesso, carnoso; colore da nocciola chiaro a bruno castano, spesso con un orlo più chiaro, quasi bianco, al margine; superficie liscia o leggermente rugosa, asciutta; un po' viscida e lucida con l'umido. Gambo robusto, panciuto o a clava da giovane, poi cilindrico, biancastro o nocciola chiaro; con un reticolo fine, bianco o concolore, ben visibile soprattutto nella parte alta.
- **B. Sezione longitudinale.** Carne bianca; sotto la cuticola del cappello una sottile fascia bruno-vinosa; al taglio: **immutabile**.
- **C. Imenoforo (tubuli e pori).** Bianchi da giovane, poi giallo-crema, infine giallo-verdastri; pori piccoli e rotondi, non cambiano colore se toccati o schiacciati.
- **D. Base del gambo.** Anello: no. Volva: no.
- **Non illustrabili** (solo in etichetta o nota): odore gradevole, fungino; sapore dolce, di nocciola; sporata bruno-olivastra.

**E. Riquadro "Non confonderlo con":** **Boleto satana** (*Rubroboletus satanas*), TOSSICO.  
Differenza in una riga: *Cappello bianco-grigiastro, pori rossi, reticolo rosso sul gambo bulboso, carne che diventa blu al taglio.*  
Testo completo dai dati: Cappello bianco-grigiastro, pori rossi, gambo bulboso con reticolo rosso, carne che diventa blu al taglio; da adulto odore sgradevole.

Altri sosia, solo testo in piccolo:
- Porcino di fiele (*Tylopilus felleus*, non commestibile): Pori che passano dal bianco al rosa; reticolo grosso e bruno scuro sul gambo; carne amarissima (un solo esemplare rovina tutto il piatto).
- Boleto dal bel piede (*Caloboletus calopus*, non commestibile): Pori gialli che si macchiano di blu; gambo rosso con reticolo chiaro; carne che vira al blu e sapore amaro. Frequente anche in faggeta.
- Boleto radicante (*Caloboletus radicans*, non commestibile): Cappello biancastro come il porcino, ma pori gialli che bluastrano, gambo giallo e carne che vira al blu; amaro.

**Riquadro habitat / stagione / taglia:**
- Habitat: simbionte di faggio, castagno, querce e conifere (abete, pino). Nel Reatino soprattutto nelle faggete montane (circa 1000-1700 m, es. Terminillo, Monti della Laga) e nei castagneti e cerreti più freschi.
- Stagione: giugno-novembre, con picco tra fine agosto e ottobre.
- Taglia minima di raccolta: 4 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Scarta gli esemplari vecchi, molli o con larve: si alterano facilmente e sono la causa più comune di disturbi.
- Il consumo crudo è diffuso ma sconsigliato per i funghi spontanei; consumalo crudo solo se giovane, sodo e perfetto.
- Qualsiasi boleto con pori rosa, rossi o arancio, o con carne che vira, non è un porcino.
- Limite di raccolta nel Lazio: 3 kg al giorno a persona (L.R. 32/1998).

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:(Gemeine_Steinpilz)_Boletus_edulis.jpg) | Holger Krisp | CC BY 3.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Teramo, Italia (2022-09-11) | [link](https://www.inaturalist.org/observations/135049529) | Rino | CC BY-NC | solo confronto |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Chieti, Italia (2020-10-18) | [link](https://www.inaturalist.org/observations/62918419) | Rino | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, Norma (2020-10-13) | [link](https://www.inaturalist.org/observations/63767817) | danix | CC BY-NC | solo confronto |
| 5 | Foto | sezione longitudinale di un esemplare: carne bianca immutabile | [link](https://commons.wikimedia.org/wiki/File:Boletus_edulis_Bull._Section.jpg) | Kornowski | CC BY 4.0 | Image 2 |
| 6 | Tavola | tavola storica di B. edulis (esemplari interi e sezione) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_edulis.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 927 (da verificare, vedi README §8), 1931; Commons: CC PDM 1.0) | Image 3 |
| 7 | Foto (sosia, iNaturalist, research grade) | Rubroboletus satanas in natura | [link](https://www.inaturalist.org/observations/402259542) | Manuela Fiorini | CC BY | Image 4 |
| 8 | Foto (sosia) | R. satanas tagliato: carne che vira al blu | [link](https://commons.wikimedia.org/wiki/File:Rubroboletus_satanas_cut.jpg) | bjoerns | CC BY-SA 4.0 | Image 5 |
| 9 | Tavola (sosia) | tavola storica di R. satanas (come Boletus satanas) | [link](https://commons.wikimedia.org/wiki/File:Bresadola-Boletus_Satanas.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 927 secondo Commons (da verificare), 1931; Commons: CC PDM 1.0) | Image 6 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 5, Image 3 = riga 6, Image 4 = riga 7, Image 5 = riga 8, Image 6 = riga 9. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 6) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Boletus edulis (porcino) from the dangerous look-alike Rubroboletus satanas. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of an adult Boletus edulis, three-quarter view: authority for cap color and pale margin, stem shape and the fine white net.
Image 2: photo of a Boletus edulis cut lengthwise: authority for the white, unchanging flesh and the tube layer.
Image 3: historical watercolor plate of Boletus edulis by Bresadola: style reference only.
Image 4: photo of Rubroboletus satanas in situ: authority for the look-alike's whitish cap and squat bulbous stem.
Image 5: photo of a cut Rubroboletus satanas: authority for the look-alike's red pores, red net and bluing flesh.
Image 6: historical plate of Rubroboletus satanas by Bresadola: shape reference for the look-alike only.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Boletus edulis standing in a little beech leaf litter, seen at three-quarter view from slightly above, with one young button-stage specimen beside it. Mature cap about 15 cm across, convex, hazel-brown to chestnut, smooth with a faint greasy sheen, with a narrow whitish band at the very margin. Stem stout and swollen, club-shaped, whitish to pale hazel, about half as wide as the cap, covered in its upper half by a fine raised white net (reticulum). The young specimen has a barrel-shaped stem, a small darker cap and still-white pores.
B. Middle left: a longitudinal section through the mature specimen: firm pure white flesh that has not changed color at all, a thin wine-brown line just under the cap skin, and a white-cream to pale yellow tube layer that separates cleanly from the cap flesh.
C. Middle right: a close-up of the pore surface seen from below: tiny round pores, white on the young cap and cream-yellow to olive-yellow on the mature one, unbruised.
D. Below B and C, small: the stem base: whitish-hazel, the fine white net fading downward, a little soil and beech leaves, a plain base.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Rubroboletus satanas at the same scale: chalky whitish-grey cap, red to orange-red pore surface, squat bulbous stem with a red net over a yellow ground, and a cut half showing pale yellow flesh turning blue.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- pores of Boletus edulis white, cream or olive-yellow, never pink, red or orange
- the stem net of B. edulis fine and white, never dark or coarse
- the section of B. edulis pure white with no blue, red or yellow staining
- the paler band at the margin of the edulis cap
- the look-alike clearly different: red pores, red net, bluing flesh

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; pink, red or orange pores on the edulis; a dark brown coarse net on its stem; blue staining on the edulis; a ring or volva; gills; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Boletus edulis (porcino) and to tell it apart from the dangerous look-alike Rubroboletus satanas. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of an adult Boletus edulis, three-quarter view: authority for cap color and pale margin, stem shape and the fine white net; the second image is a photo of a Boletus edulis cut lengthwise: authority for the white, unchanging flesh and the tube layer; the third image is a historical watercolor plate of Boletus edulis by Bresadola: style reference only; the fourth image is a photo of Rubroboletus satanas in situ: authority for the look-alike's whitish cap and squat bulbous stem; the fifth image is a photo of a cut Rubroboletus satanas: authority for the look-alike's red pores, red net and bluing flesh; the sixth image is a historical plate of Rubroboletus satanas by Bresadola: shape reference for the look-alike only. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint a mature Boletus edulis standing in a little beech leaf litter, seen at three-quarter view from slightly above, with one young button-stage specimen beside it. Mature cap about 15 cm across, convex, hazel-brown to chestnut, smooth with a faint greasy sheen, with a narrow whitish band at the very margin. Stem stout and swollen, club-shaped, whitish to pale hazel, about half as wide as the cap, covered in its upper half by a fine raised white net (reticulum). The young specimen has a barrel-shaped stem, a small darker cap and still-white pores.
Then, in the middle row, paint on the left a longitudinal section through the mature specimen: firm pure white flesh that has not changed color at all, a thin wine-brown line just under the cap skin, and a white-cream to pale yellow tube layer that separates cleanly from the cap flesh, and on the right a close-up of the pore surface seen from below: tiny round pores, white on the young cap and cream-yellow to olive-yellow on the mature one, unbruised.
Below them, add a small vignette of the stem base: whitish-hazel, the fine white net fading downward, a little soil and beech leaves, a plain base.
Finally, in the bottom-left quarter, slightly apart from the rest, paint a Rubroboletus satanas at the same scale: chalky whitish-grey cap, red to orange-red pore surface, squat bulbous stem with a red net over a yellow ground, and a cut half showing pale yellow flesh turning blue.

Keep these facts exactly right: pores of Boletus edulis white, cream or olive-yellow, never pink, red or orange; the stem net of B. edulis fine and white, never dark or coarse; the section of B. edulis pure white with no blue, red or yellow staining; the paler band at the margin of the edulis cap; the look-alike clearly different: red pores, red net, bluing flesh. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of a Rubroboletus satanas at the same scale: chalky whitish-grey cap, red to orange-red pore surface, squat bulbous stem with a red net over a yellow ground, and a cut half showing pale yellow flesh turning blue. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Porcino  
  **Sottotitolo:** *Boletus edulis* · ottimo
- **Etichette con linea di richiamo:**
  - "Orlo del cappello più chiaro" → A, margine del cappello
  - "Reticolo fine e chiaro" → A, parte alta del gambo
  - "Pori bianchi, poi gialli e verdastri" → C
  - "Mai pori rosa, rossi o arancio" → C, sotto la precedente
  - "Carne bianca, non cambia colore" → B
- **Riquadro sosia:** titolo "Non confonderlo con" · "Boleto satana" · *Rubroboletus satanas* · TOSSICO  
  Riga: "Cappello bianco-grigiastro, pori rossi, reticolo rosso sul gambo bulboso, carne che diventa blu al taglio."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 4 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Pori bianchi, poi gialli e verdastri: mai rosa, rossi o arancio
  - Carne bianca che non cambia colore al taglio
  - Gambo panciuto con reticolo fine e chiaro, non scuro
  - Cappello nocciola-bruno, spesso con orlo chiaro
  - Sapore dolce, mai amaro

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Pori chiari (bianco, crema, giallo-oliva) su tutti gli esemplari di edulis, giovane compreso.
- [ ] Sezione bianca senza alcun viraggio; ammessa solo la sottile fascia vinosa sotto la cuticola.
- [ ] Reticolo bianco e fine nella parte alta del gambo, che sfuma verso il basso.
- [ ] Cappello nocciola-castano con orlo chiaro; gambo panciuto, non slanciato.
- [ ] Satana: cappello biancastro, pori rossi, reticolo rosso, carne che bluastra.

**Errori tipici da scartare:** reticolo bruno e grossolano (è *Tylopilus felleus*), pori rosati, gambo cilindrico e scaglioso tipo *Leccinum*, sezione con aloni blu, satana con pori gialli o cappello bruno.
