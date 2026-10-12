# Infografica: Ovolo buono (*Amanita caesarea*)

Brief per la tavola di riconoscimento. Dati verificati: `data/species-id.json` → `caesarea` (Wikidata [Q220662](https://www.wikidata.org/wiki/Q220662)); foto: `data/media.json`. Metodo, fonti sui modelli e checklist generale: [README](README.md).

## 1. Obiettivo e formato

**Obiettivo:** far riconoscere l'ovolo buono (lamelle, gambo e anello gialli, volva bianca a sacco) e soprattutto separarlo dalla tignosa verdognola (mortale), anche allo stadio di uovo.

**Formato di consegna:** verticale 4:5, 1080×1350 px, WebP (vedi README §5 per peso e versione 2x).

| Modello | Impostazione | Uscita | Poi |
|---|---|---|---|
| GPT Image 2.5 Sunburst (`gpt-image-2.5-sunburst`) | `size="1600x2000"`, `quality="high"`, `output_format="png"` | 1600×2000 (4:5 esatto) | riduci a 1080×1350 |
| Nano Banana Pro (`gemini-3-pro-image`) o 2.1 (`gemini-nano-banana-2.1`) | `aspect_ratio: "4:5"`, `image_size: "2K"` | 1856×2304 | riduci a 1080×1350 |
| Imagen 4 (dismesso il 30/06/2026; solo se ancora accessibile) | `aspectRatio: "3:4"`, 2K | 1792×2560 | ritaglia a 4:5 (togli circa 6% in altezza) |

**Spazi da lasciare liberi:** margine di circa 6% su tutti i lati; blocco in basso a destra (circa 38% della larghezza × 24% dell'altezza) per il riquadro habitat/stagione/taglia.

## 2. Contenuti scientifici da rappresentare

- **A. Vista intera di 3/4.** Cappello 6-20 cm, da giovane chiuso in un 'uovo' bianco, poi emisferico, infine piano; colore arancio vivo o rosso-arancio, più giallo verso il bordo; superficie liscia, lucida, a volte con un lembo bianco di volva; orlo striato. Gambo cilindrico, slanciato, giallo; liscio o con lievi fiocchi gialli.
- **B. Sezione longitudinale.** Carne bianca, gialla sotto la cuticola; al taglio: **immutabile**.
- **C. Imenoforo (lamelle).** Giallo oro; fitte, libere dal gambo.
- **D. Base del gambo.** Anello: sì: ampio, membranoso, giallo, pendente. Volva: sì: a sacco, bianca, ampia, membranosa e spessa, libera dal gambo.
- **Non illustrabili** (solo in etichetta o nota): odore tenue, gradevole; sapore dolce; sporata bianca o leggermente giallina.

**E. Riquadro "Non confonderlo con":** **Tignosa verdognola** (*Amanita phalloides*), MORTALE.  
Differenza in una riga: *L'uovo tagliato è bianco o verdastro dentro, mai arancio e giallo; da adulta ha lamelle e anello bianchi e volva bianca a sacco.*  
Testo completo dai dati: Allo stato di ovolo è il pericolo maggiore: tagliato in sezione mostra cappello e carne bianchi o verdastri, mai arancio e giallo. Da adulta ha cappello verde-oliva, lamelle e anello bianchi.

Altri sosia, solo testo in piccolo:
- Tignosa di primavera (*Amanita verna*, mortale): Interamente bianca: cappello, lamelle, gambo, anello e volva. Nessuna parte gialla o arancio.
- Tignosa bianca (*Amanita virosa*, mortale): Tutta bianca, cappello spesso conico, gambo fioccoso; volva a sacco bianca. Mai lamelle gialle.
- Ovolo malefico (*Amanita muscaria*, tossico): Cappello rosso con verruche bianche, che la pioggia può lavare via lasciandolo liscio e arancio; ma lamelle, gambo e anello sono BIANCHI e la volva è ridotta a cercini sul bulbo, non a sacco.
- Amanita crocea (*Amanita crocea*, tossico): Cappello arancio più pallido, gambo con squamette a zebratura e senza anello; lamelle bianco-crema. Tossica cruda.

**Riquadro habitat / stagione / taglia:**
- Habitat: castagneti, cerrete e querceti a roverella luminosi e asciutti, di solito sotto i 1000 m. Nel Reatino nella cintura collinare e pedemontana (es. Poggio Bustone, Cantalice, Antrodoco).
- Stagione: giugno-ottobre, soprattutto luglio-settembre dopo piogge calde.
- Taglia minima di raccolta: 4 cm di diametro del cappello (L.R. Lazio 32/1998).
- Riga fissa: "Fai sempre controllare i funghi all'Ispettorato micologico della ASL."

Avvertenze dai dati (per la nota sotto la tavola, non dentro l'illustrazione):
- Vietato raccogliere l'ovolo chiuso, con il velo non ancora lacerato (L.R. Lazio 32/1998, art. 3 c. 4).
- Molti lo mangiano crudo: è prudente farlo solo dopo il controllo ASL e su esemplari freschissimi.
- Mai fidarsi del solo colore del cappello: verifica lamelle e gambo gialli e la volva bianca a sacco.
- Raccogli l'esemplare intero, con la volva, per permettere il controllo.

## 3. Immagini di riferimento

| # | Tipo | Cosa mostra | Link | Autore | Licenza / stato | Allegare come |
|---|---|---|---|---|---|---|
| 1 | Foto (Commons, foto di riferimento dell'app) | esemplare intero | [link](https://commons.wikimedia.org/wiki/File:Oronges.jpg) | Yaqui | CC BY-SA 3.0 | Image 1 |
| 2 | Foto (iNaturalist, research grade) | esemplari in natura, Marche, IT (2025-09-19) | [link](https://www.inaturalist.org/observations/314994060) | Manuela Fiorini | CC BY | solo confronto |
| 3 | Foto (iNaturalist, research grade) | esemplari in natura, Provincia di Grosseto, Italia (2020-07-05) | [link](https://www.inaturalist.org/observations/52141009) | lucapassalacqua | CC BY-NC | solo confronto |
| 4 | Foto (iNaturalist, research grade) | esemplari in natura, 01010 Farnese VT, Italia (2025-09-26) | [link](https://www.inaturalist.org/observations/316707903) | Leonardo Ancillotto | CC BY | solo confronto |
| 5 | Foto | esemplare giovane allo stadio di 'uovo' | [link](https://commons.wikimedia.org/wiki/File:Amanita_caesarea.jpeg) | Julien Thurion | GFDL 1.2+ / CC BY-SA 3.0 | Image 2 |
| 6 | Tavola | tavola storica di *A. caesarea* (adulti, uovo, sezione) | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Amanita_caesarea.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. I, tav. 1, 1927; Commons: CC PDM 1.0) | Image 3 |
| 7 | Foto (sosia, iNaturalist, research grade) | Amanita phalloides in natura | [link](https://www.inaturalist.org/observations/159190531) | Luca Pilia | CC BY-NC | Image 4 |
| 8 | Foto (sosia) | A. phalloides (scheda Mushroom Observer, indica la volva a sacco) | [link](https://commons.wikimedia.org/wiki/File:2011-10-26_Amanita_phalloides_(Fr.)_Link_177883.jpg) | Justin Pierce (JPierce) | CC BY-SA 3.0 | solo confronto |
| 9 | Tavola (sosia) | tavola storica di *A. phalloides* | [link](https://commons.wikimedia.org/wiki/File:Bresadola_-_Amanita_phalloides.png) | Giacomo Bresadola (1847-1929) | Pubblico dominio (Iconographia Mycologica, vol. I, tav. 3, 1927; Commons: CC PDM 1.0) | Image 5 |

**Come usarle.**
- Scarica i file dalle pagine linkate e **ritaglia** ogni foto sul carattere che ti serve (intero, sezione, imenoforo, base). Le righe "solo confronto" servono per la verifica finale, non vanno allegate.
- Le foto CC BY-NC vanno usate solo come riferimento, mai come immagine base da modificare (README §5).
- **GPT Image:** nell'app ChatGPT allega le immagini in quest'ordine: Image 1 = riga 1, Image 2 = riga 5, Image 3 = riga 6, Image 4 = riga 7, Image 5 = riga 9. Via API usa `images.edit` con `image[]` nello stesso ordine (massimo 16). Non passare `input_fidelity`.
- **Nano Banana Pro:** stesso ordine. La tavola storica (riga 6) conta come riferimento di stile (massimo 3); le altre come oggetti (massimo 6). **Nano Banana 2.1** non dichiara riferimenti di stile: passa comunque la tavola, perché il prompt la descrive come "style reference only", e verifica che non ne copi la composizione.
- **Imagen 4** non accetta riferimenti: usa il prompt Google togliendo il paragrafo "Use the attached images".

## 4. Prompt per GPT Image

Impostazioni: `model="gpt-image-2.5-sunburst"`, `size="1600x2000"`, `quality="high"` (prova `xhigh` solo se mancano dettagli), `background="opaque"`, `output_format="png"`. Con riferimenti usa `images.edit`; senza, `images.generate` e togli il blocco REFERENCE IMAGES. Non esiste un parametro negative prompt: le esclusioni stanno in DO NOT INCLUDE.

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

**Correzioni (edit successivi, una alla volta).** Passa l'ultima uscita come Image 1 e scrivi, per esempio: `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`

## 5. Prompt per Google (Nano Banana; ex Imagen)

Impostazioni: `model="gemini-3-pro-image"` (consigliato perché accetta riferimenti di stile) oppure `"gemini-nano-banana-2.1"`, `response_format: {"type": "image", "aspect_ratio": "4:5", "image_size": "2K"}`, grounding con Google Search spento. Non esiste un negative prompt (né in Nano Banana né in Imagen 4): le esclusioni sono scritte in positivo nell'ultimo paragrafo. **Imagen 4**, se ancora disponibile: togli il paragrafo "Use the attached images…", scrivi "vertical 3:4" al posto di "vertical 4:5" e ritaglia.

```text
Create a scientific natural-history plate for a mushroom-identification infographic in a foraging-safety app for central Italy. It teaches amateur foragers to recognize Amanita caesarea (ovolo buono) and to tell it apart from the dangerous look-alike Amanita phalloides. The plate will be labeled later in a layout program, so it is a completely unlabeled illustration: the ivory paper around the drawings is blank.

Use the attached images this way: the first image is a photo of adult Amanita caesarea: authority for cap color, yellow gills, stem and ring; the second image is a photo of a young Amanita caesarea at the egg stage: authority for the white egg and the orange cap breaking out; the third image is a historical watercolor plate of Amanita caesarea by Bresadola: style reference, and a shape reference for the egg section; the fourth image is a photo of Amanita phalloides: authority for the look-alike's olive-green cap, white gills, white ring and white volva; the fifth image is a historical plate of Amanita phalloides by Bresadola: shape reference for the look-alike. The photographs decide shape, proportions and color; a historical plate marked as a style reference only sets the painting technique and paper feel, not the layout.

The style is transparent watercolor over precise graphite, like an early-20th-century mycological plate, with true-to-life matte colors and soft, even daylight from the upper left. It is a vertical 4:5 composition on warm ivory paper, with generous empty margins and an empty bottom-right corner reserved for a text box.

Build the plate step by step.
First, across the top half, paint an adult Amanita caesarea at three-quarter view on dry oak and chestnut leaf litter, with a half-open young specimen beside it just breaking out of its white egg. The adult cap is about 14 cm across, flat-convex, smooth and glossy, vivid orange-red becoming more yellow toward the finely striated margin. Gills crowded, free, golden yellow. Stem slender and cylindrical, yellow, with a large, pendulous, membranous yellow ring. At the base, a large, thick, white, sac-like membranous volva, free from the stem.
Then, in the middle row, paint on the left a longitudinal section of a closed egg: a thick white outer volva enclosing an orange cap layer, golden-yellow gills and a yellow stem inside, so the cut shows orange and yellow inside white, and on the right a close-up from below of the crowded, free, golden-yellow gills and the underside of the yellow ring.
Below them, add a small vignette of the stem base lifted from the soil: a white, thick, sac-like volva standing loose around the stem like a cup, with a little earth.
Finally, in the bottom-left quarter, slightly apart from the rest, paint an Amanita phalloides beside a cut egg of the same species. The adult has a smooth olive-green to yellowish-green cap with fine radial fibrils, white gills, a white stem with faint greenish zigzag bands, a white ring and a white sac-like volva; the cut egg is white inside with only a thin greenish cap skin.

Keep these facts exactly right: gills, stem and ring of Amanita caesarea golden yellow; the volva of A. caesarea white, large, thick and sac-like; the egg section of A. caesarea orange and yellow inside white; an orange cap with a striated margin; the look-alike with white gills, a white ring, a white volva and a white egg interior. Every vignette floats freely on the paper without frames, each specimen is whole and clean with the natural number of caps and stems, and the paper carries no writing, numbers, signatures or marks of any kind.
```

**Variante: sosia isolato** (se il riquadro E esce debole, generalo a parte e compositalo in impaginazione; vale per entrambi i modelli, allegando come prima immagine la tavola già generata e poi le immagini del sosia):

```text
Isolated scientific watercolor-and-graphite illustration of an Amanita phalloides beside a cut egg of the same species. The adult has a smooth olive-green to yellowish-green cap with fine radial fibrils, white gills, a white stem with faint greenish zigzag bands, a white ring and a white sac-like volva; the cut egg is white inside with only a thin greenish cap skin. Same style, light and ivory paper as the attached plate (the previous output). Square 1:1, centered, generous empty margins, completely unlabeled, no text, no frame.
```

## 6. Testi da aggiungere in impaginazione

Il testo non va generato: le etichette sono più lunghe del limite indicato per Imagen (25 caratteri) e devono stare su punti precisi, cosa che OpenAI segnala come non affidabile (README §2-3).

- **Titolo:** Ovolo buono  
  **Sottotitolo:** *Amanita caesarea* · ottimo
- **Etichette con linea di richiamo:**
  - "Lamelle, gambo e anello GIALLI" → A/C
  - "Volva a sacco BIANCA, grande e spessa" → D
  - "Cappello arancio, orlo striato" → A
  - "In sezione: arancio e giallo" → B
  - "Vietato raccogliere l'ovolo chiuso" → vicino a B, in rosso
- **Riquadro sosia:** titolo "Non confonderlo con" · "Tignosa verdognola" · *Amanita phalloides* · MORTALE  
  Riga: "L'uovo tagliato è bianco o verdastro dentro, mai arancio e giallo; da adulta ha lamelle e anello bianchi e volva bianca a sacco."
- **Riquadro in basso a destra:** "Habitat" / "Stagione" / "Taglia minima 4 cm" con i testi della §2, più la riga ASL.
- **Caratteri chiave (testo completo dai dati, per didascalia o versione accessibile):**
  - Lamelle, gambo e anello GIALLI
  - Volva a sacco BIANCA, grande e spessa
  - Cappello arancio vivo con orlo striato
  - In sezione l'ovolo mostra il cappello arancio e il giallo all'interno
  - Va raccolto solo aperto: l'ovolo chiuso è vietato

## 7. Checklist di verifica (specifica)

Prima la checklist generale del README §6, poi questi punti, confrontando con le foto della tabella:

- [ ] Lamelle, gambo e anello giallo oro: se uno di questi è bianco la tavola è sbagliata.
- [ ] Volva bianca, a sacco, spessa e staccata dal gambo; non cercini, non bulbo.
- [ ] Sezione dell'uovo: strato arancio del cappello e interno giallo dentro la volva bianca.
- [ ] Cappello arancio-rosso liscio con orlo striato; niente verruche bianche sparse.
- [ ] Falloide: cappello verde-oliva con fibrille, tutto il resto bianco, uovo bianco dentro.

**Errori tipici da scartare:** volva assente o ridotta, lamelle bianche, cappello con verruche (*A. muscaria*), gambo zebrato senza anello (*A. crocea*), falloide con parti gialle, uovo sezionato tutto bianco attribuito all'ovolo.
