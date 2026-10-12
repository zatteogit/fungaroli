# Istruzioni per GPT: produrre le infografiche di Fungaroli Rieti

Questo file è scritto per te, GPT, che lavori collegato al repository `zatteogit/fungaroli` (branch `claude/brave-tesla-wu0a2b`). Seguilo alla lettera. Chi ti guida è Matteo, il proprietario del progetto: se una regola qui sotto è in conflitto con una sua richiesta in chat, chiedi prima di procedere.

## Cosa stai facendo e perché conta

Fungaroli Rieti è un'app per chi va a funghi in provincia di Rieti. Ogni specie commestibile ha una scheda; manca un'**infografica di riconoscimento**: una tavola illustrata che mostra i caratteri che separano la specie dal suo sosia pericoloso.

È materiale di sicurezza. Un carattere sbagliato (pori rosa su un porcino, un anello che non c'è, una volva disegnata male) può far confondere una specie mortale con una commestibile. La regola è semplice: **meglio nessuna tavola che una tavola sbagliata.**

## Da leggere prima di iniziare (in quest'ordine)

1. `docs/infografiche/README.md`: modelli e parametri (§1-2), flusso di lavoro (§5), **checklist generale (§6)**, inserimento nell'app (§7), licenze (§8).
2. `docs/infografiche/<id>.md`: il brief della specie. Ti servono soprattutto §2 (contenuti scientifici), §3 (riferimenti), §6 (testi), §7 (checklist della specie).
3. `docs/infografiche/prompt-gpt.md`: i prompt pronti, con l'ordine delle immagini da allegare.
4. Per controllo: `data/species-id.json` (caratteri della specie) e `data/species-traits.json` (sosia e caratteri dei velenosi).

Non modificare questi file. Se trovi un errore in un brief, segnalalo a Matteo nel resoconto.

## Ordine di lavoro

Una specie alla volta, in quest'ordine: prima le specie con un sosia mortale.

1. `caesarea` (ovolo buono · sosia: tignose mortali, ovolo malefico)
2. `mellea` (chiodino · sosia: Galerina marginata, mortale)
3. `procera` (mazza di tamburo · sosia: lepiote piccole mortali)
4. `edulis` (porcino · sosia: boleto satana)
5. poi `pinophilus`, `aereus`, `aestivalis`, `cibarius`, `cornucopioides`, `repandum`, `virescens`, `suillus`, `terreum`, `nuda`

Finisci e consegna una specie prima di passare alla successiva.

## Procedura per ogni specie

### Fase 1 · Riferimenti
- Prendi le immagini elencate in `prompt-gpt.md` per quella specie (Image 1, Image 2, …), dalle pagine linkate. Se non riesci a scaricarle tu, chiedi a Matteo di allegarle, indicandogli l'elenco e l'ordine.
- Le righe del brief marcate "solo confronto" non si allegano: servono per la verifica.
- **Licenze.** Foto CC BY-NC: solo come riferimento, mai come immagine base da modificare, e l'output non deve riprenderne l'inquadratura. Le tavole di Bresadola sono di pubblico dominio: se ne imita lo stile, non la composizione.

### Fase 2 · Tavola senza testo
- Usa il prompt della specie **così com'è**, con le impostazioni indicate (formato verticale 4:5, `1600x2000`, qualità alta, sfondo opaco, PNG).
- Fai 3 varianti e tieni la migliore.
- L'immagine **non deve contenere testo**: nessuna lettera, numero, freccia, firma o filigrana. Le etichette le aggiungi tu nella fase 4, con il codice.

### Fase 3 · Verifica scientifica (obbligatoria)
- Spunta, voce per voce, la checklist generale (README §6) e quella della specie (brief §7). Confronta sempre con le **foto reali**, non con la tavola storica.
- Controlla anche gli "Errori tipici da scartare" del brief.
- Se una voce fallisce, correggi con un edit mirato, un difetto alla volta:
  `Change only <difetto> in vignette <lettera> to <correzione>. Keep everything else exactly the same: layout, specimens, colors, light, empty margins, no text.`
- **Se dopo 3 tentativi una voce fallisce ancora**, fermati: consegna la tavola come "non approvata" e spiega cosa non torna. Non forzare.

### Fase 4 · Impaginazione con il codice (Python, Pillow)
Non chiedere al modello di immagine di scrivere: aggiungi i testi del brief §6 con Python, così le parole sono esatte e gli accenti corretti.
- **Tela:** 1080×1350 px (riduci la tavola da 1600×2000 con un ricampionamento di qualità, es. LANCZOS).
- **Caratteri:** Public Sans per il testo e Literata per il titolo, se disponibili (OFL, li fornisce Matteo come file). Altrimenti usa DejaVu Sans e DejaVu Serif. Il testo non deve mai essere sotto i 28 px.
- **Colori dell'app:**
  - testo `#1B1915`, accento `#8F4A1F`;
  - linee di richiamo `#1B1915` al 70%, spessore 2 px, con un pallino di 6 px sul punto indicato;
  - badge TOSSICO con fondo `#FBF1DC` e testo `#674600`; badge MORTALE con fondo `#C4352C` e testo bianco.
- **Cosa scrivere, solo dal brief §6:**
  - titolo e sottotitolo (nome latino in corsivo);
  - le etichette, con linea di richiamo verso il punto anatomico indicato;
  - il riquadro "Non confonderlo con";
  - il riquadro habitat / stagione / taglia minima;
  - la riga ASL: "Prima di mangiarli, fai controllare tutti i funghi dall'Ispettorato micologico ASL. È gratuito."
- **Posizioni:** le etichette non coprono mai il carattere che descrivono. I riquadri vanno negli spazi lasciati vuoti dal prompt (margini e blocco in basso a destra). Guarda l'immagine e scegli le coordinate; se due etichette si sovrappongono, spostale.
- **Esporta:**
  - `assets/infografiche/<id>.webp`, 1080×1350, qualità circa 80, sotto i 400 KB;
  - la tavola senza testo come `assets/infografiche/src/<id>-tavola.png`, per poterla reimpaginare.

### Fase 5 · Consegna
Se puoi scrivere nel repository, lavora sul branch `infografiche/<id>` e apri una pull request verso `claude/brave-tesla-wu0a2b`. Se non puoi, consegna i file in chat con gli stessi nomi. In entrambi i casi includi:

1. **L'immagine finale** e la tavola senza testo.
2. **La voce per `data/infografiche.json`** (dentro `species`), come da README §7. Il credit deve stare sotto i 300 caratteri e dichiarare il modello usato e i riferimenti principali con autore e licenza.
   ```json
   "<id>": {
     "file": "assets/infografiche/<id>.webp",
     "credit": "Illustrazione generata con IA (GPT Image) e impaginata; riferimenti: G. Bresadola, Iconographia Mycologica (pubblico dominio); foto di <autori> (<licenze>). Verificata su foto reali, da rivedere con un micologo."
   }
   ```
3. **Un resoconto di verifica** in `docs/infografiche/verifica/<id>.md`:
   - la checklist con [x] o [ ] per ogni voce;
   - le immagini allegate (numero e link);
   - quante varianti e quanti edit hai fatto;
   - cosa resta dubbio;
   - lo stato finale: "approvata" o "non approvata".

## Regole che non si toccano

- Niente testo generato dal modello di immagine.
- Nessun carattere inventato. Se un dettaglio non è chiaro nei riferimenti, tienilo neutro e semplice e segnalalo nel resoconto.
- Non cambiare i contenuti scientifici dei brief e non aggiungere caratteri che non ci sono.
- Non usare foto CC BY-NC come immagine base da modificare.
- Ogni tavola resta "da rivedere con un micologo" finché Matteo non dice il contrario: scrivilo nel credit.
- Se qualcosa in questo file è ambiguo, chiedi a Matteo invece di indovinare.
