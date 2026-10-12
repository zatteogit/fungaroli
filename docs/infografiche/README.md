# Infografiche di riconoscimento: metodo, prompt e verifica

Questa cartella contiene un brief per ogni specie (`<id>.md`). Ogni brief ha i contenuti scientifici da rappresentare (presi da `data/species-id.json`), le immagini di riferimento con licenza, un prompt per GPT Image, un prompt per Google, le etichette in italiano e una checklist di verifica.

Ricerca fatta il 2026-10-12. I modelli di immagine cambiano spesso: prima di una sessione di produzione ricontrolla le pagine elencate in fondo.

---

## 1. Cosa è cambiato sui modelli (leggere prima)

- **OpenAI.** I modelli attuali sono `gpt-image-2.5-sunburst` (modello base, qualità massima, consigliato per le tavole) e `gpt-image-2.5-flare` (modello piccolo, più veloce, qualità simile a GPT Image 2). `gpt-image-2` resta disponibile. `gpt-image-1` chiude il 23 ottobre 2026 e `gpt-image-1.5` il 1° dicembre 2026: non usarli.
- **Google: Imagen non c'è più.** La pagina Imagen della Gemini API dice testualmente "Imagen models are shut down. Use Nano Banana for image generation" (aggiornata il 2026-09-17). Su Vertex AI, la scheda di Imagen 4 (`imagen-4.0-generate-001`, `-fast-`, `-ultra-`) indica come data di dismissione il **30 giugno 2026** e come sostituto `gemini-2.5-flash-image`. Anche i modelli di personalizzazione e di editing di Imagen 3 (`imagen-3.0-capability-001/002`, quelli con riferimenti di stile e di soggetto) sono nella lista delle dismissioni. Oggi l'equivalente Google sono i modelli Gemini "Nano Banana":
  - `gemini-nano-banana-2.1` (Nano Banana 2.1): il modello principale consigliato, con 1K/2K/4K;
  - `gemini-3-pro-image` (Nano Banana Pro): il più accurato per i lavori complessi, ed è **l'unico che accetta riferimenti di stile** (fino a 3);
  - `gemini-3.1-flash-image` (Nano Banana 2) e `gemini-3.1-flash-lite-image` (solo 1K, non ottimizzato per più riferimenti).
  
  Per questo nei brief la sezione "Prompt per Imagen" contiene un prompt per Nano Banana (Pro o 2.1). Se hai ancora accesso a Imagen 4 da qualche parte (contratto legacy, strumenti di terze parti), lo stesso testo funziona come prompt solo testuale, con i limiti indicati in §3.

---

## 2. GPT Image (OpenAI)

### Struttura del prompt
Cosa dice la documentazione ufficiale (Image prompting, Image generation, Cookbook):
- **Dichiara il risultato e l'uso.** Prima il tipo di immagine e lo scopo ("infographic", "diagram", "scientific illustration"), poi la composizione, il formato e i vincoli di posizione. Per richieste complesse usa l'ordine **scena/sfondo → soggetto → dettagli → vincoli**, in sezioni con un'etichetta ciascuna.
- **Il formato è libero.** Paragrafi, elenchi o strutture tipo JSON funzionano allo stesso modo. Conta che il prompt sia facile da leggere e da modificare; non esiste una sintassi speciale.
- **Lunghezza.** Il prompt arriva al massimo a 32.000 caratteri (riferimento API). I prompt lunghi funzionano, ma è più facile correggerli partendo da un prompt base pulito e cambiando una cosa alla volta.
- **Visuali scientifiche.** Vanno scritte "come un brief di progettazione didattica": pubblico, obiettivo, formato visivo, etichette richieste, vincoli scientifici. Elenca in modo esplicito le componenti obbligatorie e **dì cosa non deve comparire**. Usa `quality="high"` (o superiore) per tavole dense.
- **Vincoli ed esclusioni.** Le esclusioni si scrivono in chiaro ("no watermark, no extra text, no logos"). **Non esiste un parametro negative prompt**: le esclusioni vanno nel testo.
- **Iterazione.** Passa l'output come input della modifica successiva e chiedi una sola modifica alla volta ("change only X"). Ripeti ogni volta l'elenco di ciò che deve restare uguale, perché con edit ripetuti i dettagli tendono a cambiare.

### Immagini di riferimento
- **Endpoint.** Si usa `images.edit` (Image API) oppure lo strumento image generation della Responses API. Si possono passare **fino a 16 immagini** come file, URL o file ID. Nell'app ChatGPT basta allegarle al messaggio.
- **Ruoli espliciti.** Ogni immagine va indicata col suo numero e il suo scopo, per esempio "Image 1: … (subject reference). Image 3: … (style reference only)", e va spiegato come si combinano. Le guide mostrano sia il riferimento di stile ("use the same style from the input image…") sia la composizione di più riferimenti.
- **Fedeltà.** Con `gpt-image-2` e successivi `input_fidelity` non va passato: gli input sono sempre trattati ad alta fedeltà, il che costa più token in input. Il Cookbook ha un'incoerenza (passa `input_fidelity="high"` negli esempi con gpt-image-2); vale la guida API: ometterlo.
- **Maschera.** È "interamente basata sul prompt": il modello la usa come guida e non ne rispetta il contorno al pixel. Con più immagini in input, la maschera si applica alla prima. Immagine e maschera devono avere lo stesso formato e la stessa dimensione (sotto i 50 MB), e la maschera deve avere il canale alfa. Se una zona deve restare identica al pixel, compositala tu in impaginazione.

### Testo nell'immagine
- Il testo esatto va **tra virgolette**, con posizione, corpo e stile indicati. Le parole insolite vanno sillabate lettera per lettera; poi si chiede "no extra text" e si controlla l'ortografia. Per testo piccolo o fitto serve qualità medium o high.
- La guida elenca però tra i limiti: "can still struggle with precise text placement and clarity" e "may have difficulty placing elements precisely in structured or layout-sensitive compositions".
- Conclusione per noi: le etichette sono 4-5 per tavola, in italiano, con accenti, e devono stare su punti anatomici precisi. **Non le facciamo generare.** Le aggiungiamo in impaginazione.

### Parametri
| Parametro | Valori (GPT Image 2.5) |
|---|---|
| `model` | `gpt-image-2.5-sunburst` (qualità) / `gpt-image-2.5-flare` (velocità) |
| `quality` | `low`, `medium`, `high`, `xhigh`, `max`, `auto` (`gpt-image-2`: fino a `high`) |
| `size` | `auto`, preset (`1024x1536` verticale) o personalizzata `WxH`: lati multipli di 16, lato massimo 3840, rapporto tra i lati entro 3:1, area tra 655.360 e 8.294.400 px; sopra 3.686.400 px (2560×1440) è sperimentale |
| `background` | `auto`, `opaque`, `transparent` (solo PNG/WebP) |
| `output_format` | `png`, `jpeg`, `webp` (+ `output_compression` per JPEG/WebP) |

**Formato 4:5.** 1080×1350 non è valido perché 1080 non è multiplo di 16. Usa **`size="1600x2000"`**: 4:5 esatto, 3,2 MP, sotto la soglia sperimentale. Poi riduci a 1080×1350. Un'alternativa più leggera è `1088x1360`.

---

## 3. Google: Nano Banana (al posto di Imagen)

### Struttura del prompt
- **Imagen (guida "Prompt and image attribute", aggiornata il 2026-10-09).** Pensa in termini di **soggetto, contesto/sfondo, stile**, poi raffina. Gli stili di illustrazione si introducono con "A painting of… / A sketch of…" e la guida cita "technical pencil drawing" e "color pencil drawing". I modificatori di qualità per l'arte sono "by a professional, detailed".
- **Nano Banana (guida Gemini API).**
  - "Describe the scene, don't just list keywords": paragrafi descrittivi invece di elenchi di parole chiave.
  - Sii iper-specifico e dichiara **scopo e contesto**.
  - Per le scene complesse dai **istruzioni passo-passo** ("First… Then… Finally…").
  - Controlla l'inquadratura col lessico fotografico ("macro shot", "wide-angle shot").
  - Itera in conversazione con piccole modifiche ("Keep everything the same, but…").
- **Lingua.** Nano Banana dà le prestazioni migliori in EN e in un elenco di lingue che include it-IT. Imagen 4 accettava l'inglese in GA e altre lingue in preview, ma non l'italiano. I prompt dei brief sono in inglese.

### Negative prompt
- **Nano Banana: non esiste un parametro.** La guida chiede "semantic negative prompts": invece di "no cars", descrivi la scena voluta in positivo ("an empty, deserted street"). Nei prompt Google scriviamo quindi "a completely unlabeled plate; the paper around the drawings is blank".
- **Imagen 4: "Negative prompting" compare tra le funzioni NON supportate** (scheda modello Vertex). Era supportato solo da alcuni Imagen precedenti, ora dismessi. La guida Imagen sconsiglia comunque di scrivere "no" o "don't" nel negative prompt.
- Nei brief quindi **non c'è un negative prompt separato**: le esclusioni stanno nel testo, formulate in positivo per Google e in modo esplicito per OpenAI.

### Immagini di riferimento
- **Nano Banana 2.1 / 3.1 Flash.** Fino a 10 immagini di oggetti "ad alta fedeltà" e 4 di personaggi.
- **Nano Banana Pro.** 6 immagini di oggetti e 5 di personaggi, più **3 riferimenti di stile**. Il totale arriva a 14.
- I riferimenti si passano in input insieme al prompt (API `interactions.create` o app Gemini). Nel testo vanno descritti nell'ordine ("the first image…, the second image…").
- **Imagen 4** accettava solo testo in input: niente riferimenti, niente editing (scheda Vertex). I riferimenti di stile e di soggetto erano funzioni di `imagen-3.0-capability-*`, ora dismesso.

### Testo nell'immagine
- **Imagen.** "Limit text to 25 characters or less", al massimo 2-3 frasi; il font va indicato solo come stile generale e la posizione è variabile.
- **Nano Banana.** Rende testo leggibile per infografiche, ma la guida consiglia di generare prima il testo e poi l'immagine.
- Le nostre etichette superano i 25 caratteri: **anche qui il testo va in impaginazione.**

### Parametri
- **Nano Banana 2.1 / Pro.** `response_format: { "type": "image", "aspect_ratio": "4:5", "image_size": "2K" }` (la K deve essere maiuscola) → **1856×2304**. A 1K si ottiene 928×1152, poco sotto 1080×1350: meglio 2K e poi ridurre.
- **Imagen 4 (legacy).** Non ha il 4:5. I rapporti sono 1:1, 3:4, 4:3, 9:16, 16:9 e il più vicino è **3:4** (896×1280 a 1K, 1792×2560 a 2K). Va poi ritagliato a 4:5 togliendo circa il 6% in altezza: lascia margini generosi.
- **Filigrana.** Tutte le immagini Google contengono una filigrana SynthID invisibile. In Gemini 3 il "thinking" è sempre attivo e può generare immagini intermedie non fatturate.
- **Grounding con Google Image Search.** Disponibile su 2.1 e 3.1 Flash. **Tienilo spento**: le immagini trovate non arrivano al modello e non controlli quali foto usa. I riferimenti li scegli tu.

---

## 4. Differenze che contano per noi

| | GPT Image 2.5 Sunburst | Nano Banana Pro / 2.1 | Imagen 4 (dismesso) |
|---|---|---|---|
| 4:5 nativo | sì, dimensione personalizzata 1600×2000 | sì, `4:5` (1856×2304 a 2K) | no, 3:4 + ritaglio |
| Riferimenti | fino a 16, ruoli indicati per numero | Pro: 6 oggetti + 3 stile; 2.1: 10 oggetti | no |
| Riferimento di stile | sì, tramite prompt | Pro sì (dichiarato), 2.1 non esplicitamente | no |
| Negative prompt | nessun parametro; esclusioni esplicite nel testo | nessun parametro; "semantic negative" | non supportato |
| Testo | buono ma non affidabile per posizioni precise | buono; generare prima il testo | ≤25 caratteri |
| Edit mirati | sì (edit con o senza maschera, multi-turno) | sì (conversazionale, inpainting a parole) | no |

---

## 5. Flusso di lavoro consigliato

1. **Prepara i riferimenti.** Apri i link del brief, scarica tu i file e **ritaglia** ogni foto sul carattere che deve mostrare (sezione, imenoforo, base). Un ritaglio pulito vale più di un'immagine intera. Allega 3-5 immagini, non di più: 2 foto della specie, 1 tavola di Bresadola come riferimento di stile, 1-2 del sosia.
   - **Licenze dei riferimenti.** Le foto CC BY-NC vanno bene per il confronto visivo e come riferimento morfologico. Non usarle come immagine base da modificare ("edit" diretto), e controlla che l'output non ne riproduca l'inquadratura. Le tavole storiche sono di pubblico dominio; il loro stile si può imitare liberamente.
2. **Genera la tavola senza testo.**
   - GPT Image 2.5 Sunburst: `size=1600x2000`, `quality=high` (prova `xhigh` solo se mancano dettagli).
   - Nano Banana Pro: `4:5`, `2K`.
   
   Fai 3-4 varianti e tieni la migliore.
3. **Fai la verifica scientifica** con la checklist (§6 e quella della specie), sempre con le foto reali aperte accanto.
4. **Correggi con edit mirati**, un difetto per volta: "Change only the pore surface of the main specimen to …; keep everything else exactly the same". Se il riquadro del sosia esce male, generalo da solo (prompt "variante" nel brief) e compositalo in impaginazione.
5. **Impagina.** Titolo, etichette con linee di richiamo, riquadro "Non confonderlo con", riquadro habitat/stagione/taglia, riga ASL. Usa un sans leggibile da telefono e corpo minimo 28 px sull'immagine a 1080 px di larghezza.
6. **Fai una revisione esterna.** Se possibile, fai vedere la tavola finita a un micologo (Ispettorato ASL, gruppo micologico locale) prima di pubblicarla.
7. **Esporta.** WebP, 1080×1350 (oppure 2160×2700 se vuoi più dettaglio nello zoom del visore), qualità circa 80, peso possibilmente sotto i 400 KB.

### Perché tavola illustrata e non fotorealistica
- Un'illustrazione permette di mostrare insieme vista intera, sezione, imenoforo e base con luce uniforme, e di semplificare il rumore di fondo.
- Il fotorealismo generato rischia di sembrare una foto vera: una foto inventata di un fungo è esattamente ciò che una guida di sicurezza non deve pubblicare.
- Lo stile ad acquerello e grafite di Bresadola (pubblico dominio) dà un linguaggio coerente a tutte e 14 le tavole.

---

## 6. Checklist generale di verifica scientifica

Scarta o correggi la tavola se anche una sola voce fallisce.

- [ ] **Confronto con le foto.** Sagoma del cappello, proporzioni cappello/gambo, colori e superficie coincidono con le foto di riferimento, non solo con la tavola storica (i colori delle stampe d'epoca possono essere spostati).
- [ ] **Imenoforo del tipo giusto.** Pori, lamelle, pliche o aculei, col colore giusto per l'età mostrata. Lamelle disegnate al posto delle pliche (finferlo, trombetta) o pori al posto delle lamelle sono errori gravi.
- [ ] **Anello e volva.** Ci sono solo dove devono esserci e hanno la forma giusta (volva a sacco, anello doppio scorrevole, cortina). Nessun anello "decorativo".
- [ ] **Sezione.** Colore della carne e viraggio sono quelli dei dati. Se la carne è immutabile, la sezione non ha sfumature blu, rosse o gialle aggiunte.
- [ ] **Sosia.** È riconoscibile e mostra la differenza indicata nel brief. Non è una copia ricolorata della specie principale.
- [ ] **Nessuna invenzione.** Niente gambi in più, cappelli fusi, insetti o larve, elementi fantastici, piante non pertinenti all'habitat.
- [ ] **Scala plausibile.** La specie e il sosia hanno dimensioni coerenti con i range dei dati. Se il sosia è molto più piccolo (Lepiota, Galerina), deve sembrarlo.
- [ ] **Niente testo spurio.** Nessuna lettera, numero, firma o filigrana generata (anche "pseudo-scritte" nei margini).
- [ ] **Spazi liberi.** I margini e il blocco in basso a destra sono liberi per l'impaginazione.

---

## 7. Inserire l'infografica nell'app

1. Salva il file finale in **`assets/infografiche/<id>.webp`**, dove `<id>` è la chiave della specie in `data/species-id.json` (es. `edulis`).
2. Aggiungi la voce in **`data/infografiche.json`** dentro `species`:

```json
{
  "species": {
    "edulis": {
      "file": "assets/infografiche/edulis.webp",
      "credit": "Illustrazione generata con IA (GPT Image 2.5) e impaginata da <nome>; riferimenti: G. Bresadola, Iconographia Mycologica (pubblico dominio); foto di H. Krisp (CC BY 3.0) e utenti iNaturalist. Verificata su foto reali."
    }
  }
}
```

3. La scheda specie mostra l'infografica in automatico (sezione "Infografica", apribile a schermo intero) e usa `credit` come didascalia nel visore.

**Il credit.**
- Dichiara il modello usato (è un'immagine generata) e i riferimenti principali con autore e licenza. Per le foto CC BY e CC BY-SA l'attribuzione è obbligatoria. Per le tavole PD non lo è, ma è corretto citarle.
- Tienilo sotto i 300 caratteri.
- Se usi Google, ricordati che l'immagine contiene SynthID.

---

## 8. Tavole storiche: note su autori e pubblico dominio

| Autore | Opera | Morte | Stato |
|---|---|---|---|
| Giacomo Bresadola | *Iconographia Mycologica*, voll. I-XXVI, Milano, Società Botanica Italiana, 1927-1933 | 1929 | Pubblico dominio (più di 70/80 anni dalla morte; Commons: CC PDM 1.0). I volumi usciti dopo il 1929 sono postumi ma sempre opera sua. |
| Jakob Emanuel Lange | *Flora Agaricina Danica*, Copenaghen, 1935-1940 | 27/12/1941 | Pubblico dominio nell'UE dal 2012 (Commons: PD-old-80). |
| James Sowerby | *Coloured Figures of English Fungi or Mushrooms*, 1797-1815 | 1822 | Pubblico dominio. |

**Nomenclatura storica.** Bresadola usa nomi del suo tempo, segnalati in ogni brief:
- *Pleurotus olearius* = *Omphalotus olearius*
- *Pholiota marginata* = *Galerina marginata*
- *Tricholoma tigrinum* = *T. pardinum*
- *Tricholoma nudum* = *Lepista nuda*
- *Boletus erythropus* = *Neoboletus luridiformis*
- *Cantharellus cinereus* = *Craterellus cinereus*
- *Lepiota procera* = *Macrolepiota procera*

Il file Commons intitolato "Bresadola - Boletus aereus.png" (tav. 924) secondo la descrizione di Commons raffigura in realtà *B. pinophilus*: la tav. corretta di *B. aereus* è la 925.

**Discrepanza da verificare.** Commons attribuisce la stessa "tab. 927, vol. XIX" sia a *Boletus edulis* sia a *Boletus satanas*: almeno uno dei due numeri è sbagliato. Prima di citare il numero di tavola nel credit, controllalo sull'archivio digitale del MUSE di Trento (il file `Tricholoma terreum-Icon-Mycol.-Tab-75.jpg` viene da `www2.muse.it/bresadola/`).

**Nessuna tavola di pubblico dominio trovata** per il porcino estivo (*Boletus reticulatus* / *B. aestivalis*) né su Commons né nelle ricerche fatte. Nel brief si usa una tavola di Bresadola di un altro boleto solo come riferimento di stile.

---

## 9. Fonti (consultate il 2026-10-12)

**OpenAI**
- *Image prompting* (guida GPT Image 2.5: modelli, parametri, fondamenti, visuali scientifiche, riferimenti, controllo del risultato). https://developers.openai.com/api/docs/guides/image-prompting (pagina non datata)
- *Image generation* (endpoint, edit con riferimenti e maschere, dimensioni, qualità, limiti). https://developers.openai.com/api/docs/guides/image-generation (non datata)
- *API reference: Images* (fino a 16 immagini in input per gli edit; prompt fino a 32.000 caratteri). https://developers.openai.com/api/reference/resources/images
- *GPT Image Generation Models Prompting Guide* (Cookbook, riepilogo "as of April 21, 2026", segnato come archiviato). https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide

**Google**
- *Prompt and image attribute guide* (Imagen; aggiornata il 2026-10-09). https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide
- *Imagen 4* (scheda modello: capacità, "Negative prompting" non supportato, rapporti d'aspetto, dismissione 30/06/2026; aggiornata il 2026-10-09). https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate
- *Generate images using text prompts with Imagen* (tabella degli endpoint dismessi; 2026-10-09). https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images
- *Style customization* (Imagen 3 capability, riferimenti di stile `[1]`; modello ora dismesso). https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/style-customization
- *Imagen* su Gemini API ("Imagen models are shut down"; 2026-09-17). https://ai.google.dev/gemini-api/docs/imagen
- *Nano Banana image generation* (modelli, limiti sui riferimenti, best practice, semantic negative prompts, lingue, tabelle dei rapporti d'aspetto). https://ai.google.dev/gemini-api/docs/image-generation

**Tavole e biografie**
- Categoria Commons *Iconographia Mycologica, vol. I-XXVI* (502 file). https://commons.wikimedia.org/wiki/Category:Iconographia_Mycologica,_vol._I-XXVI
- Jakob Emanuel Lange (1864-1941). https://en.wikipedia.org/wiki/Jakob_Emanuel_Lange

**Non verificato**
- Quale modello usino di default le app ChatGPT e Gemini (può differire dall'API).
- L'affidabilità specifica del testo italiano con accenti: nessuna fonte ufficiale la quantifica.
- I nomi esatti dei modelli Nano Banana su Vertex AI: ho verificato solo la Gemini API.
- Il Cookbook OpenAI è segnato come archiviato: dove contraddice la guida API (p. es. `input_fidelity`) vale la guida API.
