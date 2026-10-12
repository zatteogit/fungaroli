# Prompt per GPT Image: tutte le infografiche

Raccolta dei prompt dai brief di questa cartella, pronti da copiare. Per metodo, licenze e verifica vedi `README.md`; per i dettagli di ogni specie il suo brief `<id>.md`.

**Come si usa in ChatGPT.** Allega le immagini nell'ordine indicato (Image 1, Image 2, …), poi incolla il prompt. Le foto vanno scaricate dalle pagine linkate e ritagliate sul carattere che servono. L'immagine non deve contenere testo: le etichette in italiano si aggiungono dopo, in impaginazione (sezione 6 di ogni brief).

**Correzioni.** Una alla volta, passando l'ultima uscita come Image 1: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`
## Specie

- [Porcino (*Boletus edulis*)](#edulis)
- [Porcino rosso (*Boletus pinophilus*)](#pinophilus)
- [Porcino nero (*Boletus aereus*)](#aereus)
- [Porcino estivo (*Boletus reticulatus (= B. aestivalis)*)](#aestivalis)
- [Ovolo buono (*Amanita caesarea*)](#caesarea)
- [Finferlo (*Cantharellus cibarius*)](#cibarius)
- [Trombetta dei morti (*Craterellus cornucopioides*)](#cornucopioides)
- [Steccherino dorato (*Hydnum repandum*)](#repandum)
- [Mazza di tamburo (*Macrolepiota procera*)](#procera)
- [Chiodino (*Armillaria mellea*)](#mellea)
- [Colombina verde (*Russula virescens; Russula cyanoxantha*)](#virescens)
- [Pinarolo (*Suillus luteus; Suillus granulatus; Suillus collinitus*)](#suillus)
- [Moretta (*Tricholoma terreum*)](#terreum)
- [Agarico violetto (*Lepista nuda (= Collybia nuda)*)](#nuda)

<a id="edulis"></a>
## Porcino (*Boletus edulis*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:%28Gemeine_Steinpilz%29_Boletus_edulis.jpg)) · Holger Krisp, CC BY 3.0
- **Image 2**: sezione longitudinale di un esemplare: carne bianca immutabile ([pagina](https://commons.wikimedia.org/wiki/File:Boletus_edulis_Bull._Section.jpg)) · Kornowski, CC BY 4.0
- **Image 3**: tavola storica di B. edulis (esemplari interi e sezione) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_edulis.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 927 (da verificare, vedi README §8), 1931; Commons: CC PDM 1.0)
- **Image 4**: Rubroboletus satanas in natura ([pagina](https://www.inaturalist.org/observations/402259542)) · Manuela Fiorini, CC BY
- **Image 5**: R. satanas tagliato: carne che vira al blu ([pagina](https://commons.wikimedia.org/wiki/File:Rubroboletus_satanas_cut.jpg)) · bjoerns, CC BY-SA 4.0
- **Image 6**: tavola storica di R. satanas (come Boletus satanas) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola-Boletus_Satanas.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 927 secondo Commons (da verificare), 1931; Commons: CC PDM 1.0)

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

<a id="pinophilus"></a>
## Porcino rosso (*Boletus pinophilus*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Boletus_pinophilus_14.jpg)) · Jukka Vauras, CC BY-SA 4.0
- **Image 2**: tavola storica intitolata *Boletus aereus* (tav. 924); la descrizione di Commons la attribuisce con certezza a *B. pinophilus* ed è catalogata sotto *Boletus pinophilus* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_aereus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 924, 1931; Commons: CC PDM 1.0). Nome storico nel file errato: usala come *B. pinophilus*, controllando i colori sulle foto
- **Image 3**: N. luridiformis in situ: pori rossi, gambo punteggiato ([pagina](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_2020_G1.jpg)) · George Chernilevsky, Pubblico dominio (rilasciata dall'autore)
- **Image 4**: N. luridiformis tagliato: carne gialla diventata blu ([pagina](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_cut_and_blue.jpg)) · Stephan Kleinfelder, CC0
- **Image 5**: tavola storica di *Boletus erythropus* (= *N. luridiformis*, catalogata così su Commons) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_Erythropus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 930, 1931; Commons: CC PDM 1.0)

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

<a id="aereus"></a>
## Porcino nero (*Boletus aereus*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Bronze_Roehrling.jpg)) · Achim Bollmann, Copyrighted free use
- **Image 2**: esemplari in natura, 00060 Canale Monterano RM, Italia (2023-11-09) ([pagina](https://www.inaturalist.org/observations/190488055)) · Marco Gasponi, CC BY-NC
- **Image 3**: tavola storica di *B. aereus*; la didascalia di Commons la indica come la 'seconda e corretta' raffigurazione (la tav. 924 è *B. pinophilus*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_aereus_tab._925.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 925, 1931; Commons: CC PDM 1.0)
- **Image 4**: N. luridiformis in situ: pori rossi, gambo punteggiato ([pagina](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_2020_G1.jpg)) · George Chernilevsky, Pubblico dominio (rilasciata dall'autore)
- **Image 5**: N. luridiformis tagliato: carne gialla diventata blu ([pagina](https://commons.wikimedia.org/wiki/File:Neoboletus_luridiformis_cut_and_blue.jpg)) · Stephan Kleinfelder, CC0
- **Image 6**: tavola storica di *Boletus erythropus* (= *N. luridiformis*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_Erythropus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 930, 1931; Commons: CC PDM 1.0)

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Boletus aereus (porcino nero) from the dangerous look-alike Neoboletus luridiformis. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of an adult Boletus aereus: authority for the dark bronze velvety cap and the ochre-brown stem.
Image 2: photo of Boletus aereus from central Italy (Lazio): second authority for colors in the local population.
Image 3: historical watercolor plate of Boletus aereus by Bresadola (plate 925): style reference only.
Image 4: photo of Neoboletus luridiformis: authority for the look-alike's dark velvety cap, red pores and red-dotted stem.
Image 5: photo of a cut Neoboletus luridiformis: authority for the instantly bluing yellow flesh.
Image 6: historical plate of Neoboletus luridiformis by Bresadola: shape reference for the look-alike only.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Boletus aereus at three-quarter view on dry oak and chestnut leaf litter in a sunny clearing. The hard, compact cap is about 14 cm across, very dark brown to almost black with a bronze tone, velvety-matte, irregular and slightly dented, with a few paler ochre-brown patches. The stem is massive and swollen, beige-ochre to light brown, with a fine net that is pale above and brownish below.
B. Middle left: a longitudinal section: very compact pure white flesh that does not change color, with no colored band under the cap skin, and a white to yellowish tube layer.
C. Middle right: a close-up of the pore surface: fine pores, white to yellowish and greenish-yellow, unbruised.
D. Below B and C, small: the massive club-shaped stem base, ochre-brown with a fine brownish net, a plain base in dry leaves.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Neoboletus luridiformis at the same scale: dark brown velvety cap, orange-red to blood-red pores, yellow stem densely dotted with red granules and without any net, and a cut half whose yellow flesh is turning deep blue.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- the cap of Boletus aereus very dark brown, velvety, matte
- pores of B. aereus white to yellow, never red
- the section of B. aereus pure white with no band and no blue
- a fine net on the ochre-brown stem of B. aereus
- the look-alike with red pores, red-dotted stem and blue flesh

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; red pores or blue staining on the aereus; a slimy glossy cap; a coarse dark net; a ring or volva; gills; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

<a id="aestivalis"></a>
## Porcino estivo (*Boletus reticulatus (= B. aestivalis)*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:2006-10-07_Boletus_aestivalis_cropped.jpg)) · BoletusAestivalis.JPG: Archenzo derivative work: Ak ccm (talk), CC BY-SA 3.0
- **Image 2**: esemplari adulti con cappello vellutato e reticolo (nome del file *B. aestivalis*, catalogata come *B. reticulatus*: sono sinonimi) ([pagina](https://commons.wikimedia.org/wiki/File:BOLETUS_AESTIVALIS_%28Paulet%29_Fr._%286090026927%29.jpg)) · Gljivarsko društvo Niš (Flickr), CC BY 2.0
- **Image 3**: Rubroboletus satanas in natura ([pagina](https://www.inaturalist.org/observations/402259542)) · Manuela Fiorini, CC BY
- **Image 4**: R. satanas tagliato: carne che vira al blu ([pagina](https://commons.wikimedia.org/wiki/File:Rubroboletus_satanas_cut.jpg)) · bjoerns, CC BY-SA 4.0
- **Image 5**: tavola storica di R. satanas; per la specie principale usala SOLO come riferimento di stile ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola-Boletus_Satanas.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, 1931; Commons: CC PDM 1.0)

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

<a id="caesarea"></a>
## Ovolo buono (*Amanita caesarea*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Oronges.jpg)) · Yaqui, CC BY-SA 3.0
- **Image 2**: esemplare giovane allo stadio di 'uovo' ([pagina](https://commons.wikimedia.org/wiki/File:Amanita_caesarea.jpeg)) · Julien Thurion, GFDL 1.2+ / CC BY-SA 3.0
- **Image 3**: tavola storica di *A. caesarea* (adulti, uovo, sezione) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Amanita_caesarea.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. I, tav. 1, 1927; Commons: CC PDM 1.0)
- **Image 4**: Amanita phalloides in natura ([pagina](https://www.inaturalist.org/observations/159190531)) · Luca Pilia, CC BY-NC
- **Image 5**: tavola storica di *A. phalloides* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Amanita_phalloides.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. I, tav. 3, 1927; Commons: CC PDM 1.0)

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Amanita caesarea (ovolo buono) from the dangerous look-alike Amanita phalloides. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of adult Amanita caesarea: authority for cap color, yellow gills, stem and ring.
Image 2: photo of a young Amanita caesarea at the egg stage: authority for the white egg and the orange cap breaking out.
Image 3: historical watercolor plate of Amanita caesarea by Bresadola: style reference, and a shape reference for the egg section.
Image 4: photo of Amanita phalloides: authority for the look-alike's olive-green cap, white gills, white ring and white volva.
Image 5: historical plate of Amanita phalloides by Bresadola: shape reference for the look-alike.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: an adult Amanita caesarea at three-quarter view on dry oak and chestnut leaf litter, with a half-open young specimen beside it just breaking out of its white egg. The adult cap is about 14 cm across, flat-convex, smooth and glossy, vivid orange-red becoming more yellow toward the finely striated margin. Gills crowded, free, golden yellow. Stem slender and cylindrical, yellow, with a large, pendulous, membranous yellow ring. At the base, a large, thick, white, sac-like membranous volva, free from the stem.
B. Middle left: a longitudinal section of a closed egg: a thick white outer volva enclosing an orange cap layer, golden-yellow gills and a yellow stem inside, so the cut shows orange and yellow inside white.
C. Middle right: a close-up from below of the crowded, free, golden-yellow gills and the underside of the yellow ring.
D. Below B and C, small: the stem base lifted from the soil: a white, thick, sac-like volva standing loose around the stem like a cup, with a little earth.
E. Bottom left, about one quarter of the area, slightly apart from the rest: an Amanita phalloides beside a cut egg of the same species. The adult has a smooth olive-green to yellowish-green cap with fine radial fibrils, white gills, a white stem with faint greenish zigzag bands, a white ring and a white sac-like volva; the cut egg is white inside with only a thin greenish cap skin.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- gills, stem and ring of Amanita caesarea golden yellow
- the volva of A. caesarea white, large, thick and sac-like
- the egg section of A. caesarea orange and yellow inside white
- an orange cap with a striated margin
- the look-alike with white gills, a white ring, a white volva and a white egg interior

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; white gills or a white stem on the caesarea; white warts on a red cap (that is Amanita muscaria); a volva reduced to rings or missing; a yellow volva; yellow gills on the phalloides; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

<a id="cibarius"></a>
## Finferlo (*Cantharellus cibarius*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Chanterelle_Cantharellus_cibarius.jpg)) · autore su Commons, CC BY-SA 3.0
- **Image 2**: esemplari in natura, 58037 Santa Fiora GR, Italia (2024-10-20) ([pagina](https://www.inaturalist.org/observations/248471568)) · Andrea Benocci, CC BY-NC
- **Image 3**: tavola storica di *C. cibarius* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Cantharellus_cibarius.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. X, tav. 471, 1929; Commons: CC PDM 1.0)
- **Image 4**: cespo di *O. olearius*, lamelle arancio ([pagina](https://commons.wikimedia.org/wiki/File:Zavodnica_5.jpg)) · Aleksandar Đukić, CC BY-SA 4.0
- **Image 5**: tavola storica di *Pleurotus olearius* (= *Omphalotus olearius*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Pleurotus_olearius.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. V, tav. 285, 1928; Commons: CC PDM 1.0)

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

<a id="cornucopioides"></a>
## Trombetta dei morti (*Craterellus cornucopioides*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Craterellus_cornucopioides_JPG1.jpg)) · Jean-Pol GRANDMONT, CC BY 3.0
- **Image 2**: esemplari in natura, 64010 Rocca Santa Maria, Province of Teramo, Italy (2020-10-27) ([pagina](https://www.inaturalist.org/observations/63689919)) · Alessandro Ariosti, CC BY-SA
- **Image 3**: tavola storica di *C. cornucopioides* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Craterellus_cornucopioides.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. X, tav. 485, 1929; Commons: CC PDM 1.0)
- **Image 4**: Craterellus cinereus in natura ([pagina](https://www.inaturalist.org/observations/243675622)) · Manuela Fiorini, CC BY

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Craterellus cornucopioides (trombetta dei morti) from the dangerous look-alike Craterellus cinereus (= Cantharellus cinereus). Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of Craterellus cornucopioides: authority for the black trumpet shape and the grey smooth outer surface.
Image 2: photo of Craterellus cornucopioides from central Italy: second authority for color and the smooth outer surface.
Image 3: historical watercolor plate of Craterellus cornucopioides by Bresadola: style reference only.
Image 4: photo of Craterellus cinereus: authority for the look-alike's raised forked ridges on the outer surface.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a cluster of Craterellus cornucopioides among beech leaf litter at three-quarter view: deep trumpets 4 to 10 cm tall, hollow all the way down, with a sooty brown-black, finely scaly inner surface and a wavy rim rolled outward; the outer surface ash-grey to bluish-grey, smooth or barely wrinkled, slightly powdery.
B. Middle left: a longitudinal cut through one trumpet: a hollow funnel continuous to the very base, with thin, grey-black, elastic flesh like a thin rubbery membrane.
C. Middle right: a close-up of the outer surface: smooth to faintly wrinkled, ash-grey, with no gills and no distinct ridges.
D. Below B and C, small: the narrow hollow base among the leaves, with no ring and no volva.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a small group of Craterellus cinereus at the same scale: smaller grey-black funnels with clearly raised, forked, vein-like ridges on the grey outer surface, running down the stem.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- trumpets hollow down to the base
- a smooth grey outer surface on Craterellus cornucopioides, without gills or ridges
- thin elastic flesh
- growth in groups among leaf litter
- the look-alike with obvious forked ridges on its outer surface

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; gills or ridges on the cornucopioides; brown or yellow tones; a solid stem; growth on wood; a cup-shaped black fungus on twigs; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

<a id="repandum"></a>
## Steccherino dorato (*Hydnum repandum*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Hedgehog_fungi2.jpg)) · D J Kelly, Public domain
- **Image 2**: dettaglio degli aculei ([pagina](https://commons.wikimedia.org/wiki/File:Hydnum_repandum._The_Hedgehog_Fungus_spore_bearing_spines.jpg)) · Rosser1954, CC BY-SA 4.0
- **Image 3**: tavola storica di *H. repandum* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Hydnum_repandum.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XXI, tav. 1044, 1932; Commons: CC PDM 1.0)
- **Image 4**: Sarcodon imbricatus in natura ([pagina](https://www.inaturalist.org/observations/56915670)) · Gergely Nigg, CC BY

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

<a id="procera"></a>
## Mazza di tamburo (*Macrolepiota procera*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Macrolepiota-procera.jpg)) · Chrumps, CC BY-SA 4.0
- **Image 2**: dettaglio del gambo con l'anello doppio ([pagina](https://commons.wikimedia.org/wiki/File:Parasol-Macrolepiota-procera-stem-ring-crop.jpg)) · Holger Krisp, CC BY 3.0
- **Image 3**: tavola storica di *Lepiota procera* (= *Macrolepiota procera*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Lepiota_procera.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. I, tav. 20, 1927; Commons: CC PDM 1.0)
- **Image 4**: Lepiota brunneoincarnata in natura ([pagina](https://www.inaturalist.org/observations/398639607)) · Javier Marcos Martínez, CC BY-NC
- **Image 5**: tavola di *L. brunneoincarnata* ([pagina](https://commons.wikimedia.org/wiki/File:Lange_-_Lepiota_brunneoincarnata.png)) · Jakob Emanuel Lange (1864-1941), Pubblico dominio (Flora Agaricina Danica, vol. 1, 1935, tav. 13; Commons: PD-old-80)

```text
USE: One illustrated plate for a mushroom-identification infographic in a foraging-safety app for central Italy (province of Rieti). Audience: amateur foragers viewing it on a phone. Goal: show the features that separate Macrolepiota procera (mazza di tamburo) from the dangerous look-alike Lepiota brunneoincarnata. Labels, arrows and all text will be added later in a layout program, so the image itself must contain no text.

REFERENCE IMAGES (attached, in this order):
Image 1: photo of adult Macrolepiota procera: authority for the cap pattern, size and the tall stem.
Image 2: close-up photo of the Macrolepiota procera stem with its double ring: authority for the ring and the snakeskin banding.
Image 3: historical watercolor plate of Macrolepiota procera by Bresadola: style reference only.
Image 4: photo of Lepiota brunneoincarnata: authority for the look-alike's small size and pinkish-brown scales.
Image 5: historical plate of Lepiota brunneoincarnata by J. E. Lange: shape and color reference for the look-alike.
The photographs are the authority for shape, proportions and color. A historical plate used as a style reference sets only the medium, line quality and paper feel: do not copy its layout, its specimens or its lettering. If a detail is unclear in the references, keep it simple and neutral instead of inventing it.

CANVAS: Vertical 4:5. Warm ivory paper background, uniform and slightly textured. Soft, even daylight from the upper left, faint contact shadows only. Keep an empty margin of about 6% on every side, and leave the bottom-right block (about 38% of the width x 24% of the height) completely empty for a text box.

LAYOUT (separate vignettes floating on the paper, no frames, no divider lines):
A. Top, about half of the height: a mature Macrolepiota procera in a grassy woodland clearing at three-quarter view, with a young closed 'drumstick' specimen beside it. The open cap is about 22 cm across, umbrella-like, with a smooth dark-brown central umbo and a cream-hazel ground covered by brown scales in concentric rings, thinning toward the fringed margin. The stem is very tall (about 25 cm), slender and hollow, with a bulb at the base, and below the ring it is decorated with transverse brown snakeskin bands. A thick double ring sits loose on the stem.
B. Middle left: a longitudinal section: soft white flesh in the cap, a fibrous hollow stem, flesh white or barely pinkish (no strong reddening), and gills free from the stem, separated from it by a collar.
C. Middle right: a close-up of the crowded, soft, white-cream free gills ending at a collar around the stem apex.
D. Below B and C, small: the bulbous stem base with the snakeskin banding above it and no volva, and the double ring shown slid partway down the stem.
E. Bottom left, about one quarter of the area, slightly apart from the rest: a Lepiota brunneoincarnata at its true relative scale, about one fifth the size of the parasol (cap 2 to 5 cm): a small cap with pinkish-brown scales on a whitish ground, and a short stem with pinkish-brown bands and no movable ring.

STYLE: Scientific natural-history illustration, transparent watercolor over precise graphite, in the manner of early-20th-century mycological plates, with true-to-life colors matched to the photographs. Matte, botanically accurate, crisp edges, subtle paper texture, the same light in every vignette.

MUST BE CLEARLY VISIBLE:
- snakeskin banding on the Macrolepiota procera stem
- a thick double ring that is free on the stem
- a large cap over 10 cm with a brown umbo and concentric scales
- white flesh that does not redden
- the look-alike clearly tiny compared to the parasol

DO NOT INCLUDE: any text, letters, numbers, labels, arrows, leader lines, scale bars, signature or watermark; frames or panel borders; a smooth stem; a thin fixed ring; flesh turning red or orange; a volva; the lepiota drawn as large as the parasol; extra, fused or duplicated stems or caps; insects, larvae, hands or tools; fantasy colors, glossy CGI or 3D-render look.
```

<a id="mellea"></a>
## Chiodino (*Armillaria mellea*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Armillaria_mellea_%281%29.jpg)) · tomasz przechlewski from Sopot, Poland, CC BY 2.0
- **Image 2**: esemplari in natura, Provincia di Grosseto, Italia (2020-11-07) ([pagina](https://www.inaturalist.org/observations/64431559)) · lucapassalacqua, CC BY-NC
- **Image 3**: tavola storica di *A. mellea* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Armillaria_mellea.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. II, tav. 52, 1927; Commons: CC PDM 1.0)
- **Image 4**: Galerina marginata in natura ([pagina](https://www.inaturalist.org/observations/332323711)) · Manuela Fiorini, CC BY
- **Image 5**: tavola storica di *Pholiota marginata* (= *Galerina marginata*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Pholiota_marginata.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XV, tav. 704, 1930; Commons: CC PDM 1.0)

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

<a id="virescens"></a>
## Colombina verde (*Russula virescens; Russula cyanoxantha*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Russula_virescens3.JPG)) · Paffka, CC BY-SA 3.0
- **Image 2**: esemplari in natura, 00066 Manziana, Metropolitan City of Rome Capital, Italy (2024-06-08) ([pagina](https://www.inaturalist.org/observations/221331641)) · Luca Pilia, CC BY-NC
- **Image 3**: tavola storica di *R. virescens* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Russula_virescens.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. IX, tav. 412, 1929; Commons: CC PDM 1.0)
- **Image 4**: Amanita phalloides in natura ([pagina](https://www.inaturalist.org/observations/159190531)) · Luca Pilia, CC BY-NC
- **Image 5**: tavola storica di *A. phalloides* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Amanita_phalloides.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. I, tav. 3, 1927; Commons: CC PDM 1.0)

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

<a id="suillus"></a>
## Pinarolo (*Suillus luteus; Suillus granulatus; Suillus collinitus*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Ruhland,_Grenzstra%C3%9Fe_bei_Hausnr._1,_Butterpilz_am_Parkplatzrand,_Entwicklungsreihe,_Herbst,_02.jpg)) · Wilhelm Zimmerling PAR, CC BY-SA 4.0
- **Image 2**: tavola storica di *Boletus luteus* (= *S. luteus*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_luteus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 901, 1931; Commons: CC PDM 1.0)
- **Image 3**: tavola storica di *Boletus granulatus* (= *S. granulatus*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_granulatus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 907, 1931; Commons: CC PDM 1.0)
- **Image 4**: tavola storica di *Boletus collinitus* (= *S. collinitus*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Boletus_collinitus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIX, tav. 906, 1931; Commons: CC PDM 1.0)
- **Image 5**: Chalciporus piperatus in natura ([pagina](https://www.inaturalist.org/observations/315216879)) · Nicolas Schwab, CC BY-NC

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

<a id="terreum"></a>
## Moretta (*Tricholoma terreum*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Tricholoma_terreum_20061105wa.jpg)) · User:Strobilomyces, CC BY-SA 3.0
- **Image 2**: esemplari in natura, Provincia di Chieti, Italia (2020-11-10) ([pagina](https://www.inaturalist.org/observations/64606524)) · Rino, CC BY-NC
- **Image 3**: tavola storica di *T. terreum* (versione ripulita) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Tricholoma_terreum.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. II, tav. 75, 1927; Commons: CC PDM 1.0)
- **Image 4**: Tricholoma pardinum in natura ([pagina](https://www.inaturalist.org/observations/317281798)) · Luca Pilia, CC BY-NC
- **Image 5**: tavola storica di *Tricholoma tigrinum* (= *T. pardinum*, catalogata così su Commons) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Tricholoma_tigrinum.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. II, tav. 90, 1927; Commons: CC PDM 1.0)

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

<a id="nuda"></a>
## Agarico violetto (*Lepista nuda (= Collybia nuda)*)

**Impostazioni (API):** `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

**Allega, in quest'ordine:**
- **Image 1**: esemplare intero ([pagina](https://commons.wikimedia.org/wiki/File:Lepista_nuda.jpg)) · Archenzo, Italy, CC BY-SA 3.0
- **Image 2**: tavola storica di *Tricholoma nudum* (= *Lepista nuda*) ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_-_Tricholoma_nudum.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. III, tav. 112, 1928; Commons: CC PDM 1.0)
- **Image 3**: Cortinarius traganus in natura ([pagina](https://www.inaturalist.org/observations/312654631)) · Nicolas Schwab, CC BY-NC
- **Image 4**: tavola storica di *C. traganus* ([pagina](https://commons.wikimedia.org/wiki/File:Bresadola_Cortinarius_traganus.png)) · Giacomo Bresadola (1847-1929), Pubblico dominio (Iconographia Mycologica, vol. XIII, tav. 638, 1930; Commons: CC PDM 1.0)

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
