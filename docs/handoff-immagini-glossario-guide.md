# Glossario, guide e infografiche — brief per l'agente immagini

Seguito di `docs/handoff-immagini-chrome.md`, `docs/handoff-immagini-varianti.md` e `docs/handoff-immagini-timbri.md`. Stesso ramo: `gpt/immagini`. Solo file nuovi in `incoming/`. Niente PR.

Obiettivo: un unico linguaggio visivo in tutta l'app, quello delle icone dei caratteri già approvate (`assets/traits/*.webp`). Pochi colori piatti, contorno bruno scuro, nessun realismo fotografico, nessun testo nell'immagine. Le etichette, quando servono, le aggiunge l'app.

**Restano foto e non si toccano:** le 5 foto del glossario (lamelle, pori, pliche, aculei, reticolo) e tutte le foto delle specie. Regola del progetto: niente immagini generate al posto delle foto di una specie.

Ordine di lavoro: A, poi B, poi C. Per ogni parte, prima un esempio da mostrare a Matteo, poi il resto nella stessa sessione, per avere uno stile uniforme.

## A. Glossario: 21 schemi

Uno schema per termine. È **didattico**: mostra solo il concetto, senza specie riconoscibile, salvo dove serve un esempio generico (fungo «tipo», foglia «tipo»).

| `id` | Cosa mostrare |
|---|---|
| `cappello` | fungo generico di profilo, cappello evidenziato (colore pieno), resto in tono spento |
| `gambo` | lo stesso fungo, gambo evidenziato |
| `umbone` | cappello di profilo con rilievo centrale netto |
| `imenoforo` | fungo visto da sotto, in sezione: lo strato sotto il cappello evidenziato (lamelle generiche) |
| `anello` | gambo con anello a gonnellina sotto il cappello (rifà lo schema Commons attuale, da separare dalla volva) |
| `volva` | base del gambo dentro una volva a sacco, con il bordo libero, mezza interrata |
| `micelio` | fungo sopra il terreno, sotto il terreno una rete di filamenti bianchi |
| `ifa` | ingrandimento: pochi filamenti ramificati, segmentati, in un cerchio «lente» |
| `spora` | ingrandimento: poche spore ovali, in un cerchio «lente» |
| `sporata` | cappello appoggiato su un foglio metà bianco e metà nero, con il deposito a raggiera |
| `micorriza` | radice d'albero avvolta da filamenti del fungo, il fungo in superficie |
| `cespitoso` | gruppo fitto di funghi con i gambi uniti alla base |
| `lobi` | foglia lobata generica (tipo quercia), lobi evidenziati |
| `seghettato` | margine di foglia ingrandito: dentatura semplice sopra, doppia sotto |
| `gemme` | rametto invernale con gemme alterne, una gemma ingrandita |
| `aghi` | rametto di conifera: aghi singoli da un lato, fascetto di due aghi dall'altro |
| `ceppaia` | ceppo tagliato con radici in superficie e qualche getto nuovo |
| `pollone` | ceppaia con un pollone giovane evidenziato |
| `segnavia` | segnavia CAI bianco-rosso dipinto su una pietra o un tronco, senza numero |
| `dislivello` | profilo di un sentiero con salite e discese, le salite evidenziate |
| `esposizione` | collina con versante nord in ombra e versante sud al sole, con una piccola rosa dei venti senza lettere |

- **Formato:** PNG con alpha, 1024×1024, soggetto centrato con margine uniforme.
- **Salvataggio:** `incoming/glossario/<id>.png`.
- **Correttezza:** le definizioni sono in `data/glossary.json` (`definition`, `observe`). Il disegno non deve contraddirle.

## B. Guide: 3 aperture

Un'illustrazione orizzontale per guida, più ricca degli schemi ma nello stesso segno e con gli stessi toni.

| `id` | Titolo | Cosa mostrare |
|---|---|---|
| `leggere-il-bosco` | Prima i tronchi, poi il sottobosco | sottobosco di faggeta: tronchi grigi, lettiera, qualche fungo piccolo, luce laterale |
| `pioggia-e-crescita` | La pioggia lascia una storia nel terreno | sezione del terreno sotto il bosco: pioggia in alto, strato umido, micelio, funghi che spuntano |
| `preparare-la-passeggiata` | Scegliere il giro, prima di partire | zaino aperto con mappa piegata, bussola, borraccia, cesto di vimini |

- **Formato:** PNG 1600×900 (16:9), sfondo pieno chiaro carta (non trasparente), niente testo.
- **Salvataggio:** `incoming/guide/<id>.png`.

## C. Le 15 infografiche per specie

I brief esistono già: `docs/infografiche/ISTRUZIONI-GPT.md`, `README.md`, `prompt-gpt.md` e un `<id>.md` per specie. Valgono così come sono, con **un solo cambiamento: lo stile.**

- **Niente stile Bresadola o tavola naturalistica:** si usa il linguaggio visivo delle icone dei caratteri, più dettagliato, perché la tavola è grande. Restano: pochi colori piatti, contorno bruno scuro, sfondo carta chiaro.
- **Riferimento di stile:** allega come riferimento le icone della specie (`assets/traits/<id>-cappello.webp`, `-sotto.webp`, `-gambo.webp`) e, se c'è, quella del sosia. Mantieni coerenti colori e forme con quelle icone. Se un carattere del brief contraddice l'icona, vale il brief: segnalalo in `NOTE.md`.
- **Resto invariato:** ordine delle specie (prima quelle con sosia mortale), contenuti scientifici, checklist, nessun testo generato (le etichette le impagina l'app) e formato 1600×2000.
- **Salvataggio:** `incoming/infografiche/<id>.png`.

## Manifest e stato

- Una riga per immagine in `incoming/manifest.json`, con `"tipo"` uguale a `"glossario"`, `"guida"` o `"infografica"`, `"soggetto"` uguale all'`id`, più `modello` e `prompt`, come per le altre.
- Stato in `incoming/bozze/STATO.md`.
