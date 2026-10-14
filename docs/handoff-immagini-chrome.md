# Handoff · Immagini con ChatGPT Work e Gemini via Chrome (14/10/2026)

**Per chi:** una sessione di Claude Code **sul computer di Matteo**, con l'estensione «Claude in Chrome» attiva. ChatGPT (Work, progetto Fungaroli, repo già collegato) e Gemini sono aperti in Chrome.

**Prima di tutto:** leggi `AGENTS.md` e `docs/handoff-2026-10-14.md` nel repo `zatteogit/fungaroli`.

## Obiettivo

Generare con GPT (o con Gemini, se GPT dà risultati peggiori) due gruppi di immagini e farle caricare sul ramo `gpt/immagini`, cartella `incoming/`, senza toccare codice o produzione. L'integrazione nell'app (ritaglio, conversione, dati, logica stagionale) la fa poi una sessione Claude sul repo.

## Decisioni già prese da Matteo (non richiederle)

### Illustrazioni dei caratteri dei funghi
- Disegni dedicati per **ogni** specie, generati da GPT e poi rivisti.
- Si chiedono **tavole di sprite**: più specie nella stessa generazione, per avere uno stile uniforme.
- Se dopo 2-3 prove i risultati non sono fedeli o uniformi, si passa a SVG disegnati a mano.

### Copertine dei luoghi
- La copertina segue la stagione del **giorno scelto** dall'utente (oggi, se non ne ha scelto uno).
- Ogni luogo ha **4 stagioni**. Il meteo (nebbia, pioggia, nuvole) si rende come velatura grafica sopra l'immagine, non come immagini in più.
- Se una **foto reale** rientra già nella stagione, si usa quella.
- Si vede **solo la copertina** di stagione, senza galleria.
- Le versioni AI si dichiarano **solo nei crediti**.
- Le foto senza data o stagione riconoscibile si usano come base per le varianti generate.

### Regole del progetto
- Niente immagini generate **al posto delle foto delle specie**.
- Ogni immagine deve avere fonte e licenza verificabili.
- Per le decisioni nuove chiedi sempre a Matteo con domande a scelta, con l'opzione consigliata per prima.

## Come procedere

1. Con Claude in Chrome apri ChatGPT Work nel progetto Fungaroli e verifica che il repo `zatteogit/fungaroli` sia collegato.
2. Incolla il **brief** qui sotto. Usa il modello immagini migliore disponibile, con il ragionamento più alto per la parte che legge i dati.
3. Prima di lasciarlo continuare, **controlla la tavola 1**:
   - le spugnole devono essere a nido d'ape e cave in un'unica camera;
   - il finferlo deve avere pliche basse e forcate, non lamelle;
   - gli idnacei devono avere aculei, non pori;
   - l'idnello deve avere le gocce rosse;
   - l'urnula deve essere una coppa nera.

   Se la tavola sbaglia, fai rigenerare con le correzioni. Mostra la tavola a Matteo prima di proseguire.
4. Se GPT non regge l'uniformità, prova la stessa tavola in Gemini e fai scegliere a Matteo.
5. Alla fine verifica che `gpt/immagini` contenga `incoming/manifest.json`, le tavole e le copertine. Avvisa Matteo: la sessione Claude sul repo farà l'integrazione.

## Stato del repo al momento del handoff

- **Produzione:** ramo `claude/brave-tesla-wu0a2b`, pubblicato su https://fungaroli.zatteo.workers.dev, `SHELL` v40.
- **PR aperta:** https://github.com/zatteogit/fungaroli/pull/66, dal ramo `claude/awesome-lamport-jcuzmo`. Contiene i Fiori (12 specie con tutela L.R. 61/1974) e il confronto sosia con caratteri atomizzati. CI verde; il check «Workers Builds» fallisce sempre per la configurazione delle anteprime su Cloudflare. Il merge va chiesto a Matteo.
- **Zone:** 7 su 15 hanno una foto reale (`data/media-zones.json`). Le 8 senza foto sono terminillo-ovest, terminillo-est, cittareale, pescorocchiano, malito, sangiovanni, leonessa e domo.
- **Wikimedia Commons:** dal cloud risponde 429 (troppe richieste). Dal computer di Matteo dovrebbe funzionare.

---

## Brief da incollare in ChatGPT Work

Lavori sul repository GitHub **zatteogit/fungaroli**: è una PWA in italiano su funghi, piante e uscite nei boschi della provincia di Rieti. Devi solo **generare immagini** e caricarle su un ramo nuovo. Non modificare nessun file esistente e non aprire pull request verso altri rami.

## Regole

- Lavora sul ramo nuovo **`gpt/immagini`**, creato dal ramo `claude/brave-tesla-wu0a2b`.
- Scrivi solo dentro `incoming/` (cartella nuova).
- Per ogni immagine aggiungi una riga a `incoming/manifest.json`. Ogni riga ha questi campi: `file`, `tipo` (`illustrazione` o `luogo`), `soggetto`, `stagione`, `foto_di_partenza`, `autore_foto`, `licenza_foto`, `pagina_foto`, `modello`, `prompt`.
- **Niente testo, scritte, loghi o filigrane** nelle immagini.
- Se non riesci a rispettare una regola, scrivilo in `incoming/NOTE.md` invece di aggirarla.

## Parte A · Illustrazioni dei funghi (tavole di sprite)

Fonte dei dati: `data/species-traits.json`, campo `taxa`. Per ogni fungo usa `name`, `latin`, `traits` e `check_before_picking` (o `key_features`).

1. Raggruppa gli 83 funghi in tavole da 9, per forma simile:
   - morchelle, finferli, trombette, idnacei, coppe;
   - amanite;
   - boleti;
   - lepiote e mazze di tamburo;
   - prataioli;
   - russule e lattari;
   - funghi su legno;
   - e così via.
2. Per ogni tavola genera **una sola immagine**: griglia 3×3 su tela quadrata, celle uguali e fondo trasparente (o bianco puro #FFFFFF). Fungo centrato, alto circa il 70% della cella. Vista di tre quarti leggermente dal basso, così si vede la parte sotto il cappello (lamelle, pliche, pori, aculei o superficie liscia).
3. **Stile identico in tutte le tavole:**
   - illustrazione da guida da campo, pulita e naturalistica;
   - aspetto vettoriale con sfumature morbide;
   - palette calda e terrosa;
   - contorno sottile e scuro, a bassa opacità;
   - luce morbida da in alto a sinistra.
4. **La precisione conta più della bellezza.** Disegna solo i caratteri descritti nei dati e non inventarne altri. Errori da evitare:
   - spugnole a cervello: sono a nido d'ape;
   - lamelle vere al posto delle pliche nei finferli;
   - pori al posto degli aculei;
   - anello o volva dove i dati dicono `false`.
5. Le **spugnole** vanno disegnate tagliate a metà per il lungo: testa e gambo cavi in un'unica camera.
6. Salva in `incoming/illustrazioni/tavola-NN.png`. Nel manifest scrivi una riga per cella, nell'ordine della griglia (da sinistra a destra, dall'alto in basso), con la chiave del fungo come `soggetto`.
7. **Inizia dalla tavola 1:** morchella-esculenta, morchella-elata, cibarius, cornucopioides, craterellus-lutescens, repandum, sarcodon-imbricatus, hydnellum-peckii, urnula-craterium. Se la tavola 1 non è uniforme, rigenerala prima di passare alle altre.

## Parte B · Copertine di stagione dei luoghi

Fonte dei dati:
- `data/zones.json`: zone, nomi e fasce di quota in `bands`, in metri;
- `data/media-zones.json`: foto reali già presenti, con autore e licenza.

Per le 7 zone che hanno già una foto reale (`assets/zones/<id>-hd.webp`):

1. Parti dalla foto reale. Genera **4 varianti: inverno, primavera, estate, autunno**.
2. Tieni **identici** inquadratura, profilo dei monti, crinali, alberi, edifici, strade e proporzioni. Cambia solo vegetazione, luce e suolo della stagione:
   - **Inverno:** neve al suolo e sulle cime **solo se la quota più alta della zona (l'ultimo valore di `bands`) è almeno 1000 m**. Sotto i 1000 m: alberi spogli, brina, cielo invernale, niente manto nevoso.
   - **Primavera:** faggi e latifoglie verde chiaro appena aperti, prati verdi.
   - **Estate:** verde pieno e scuro, luce alta.
   - **Autunno:** faggi giallo-arancio-ruggine, conifere verdi.
3. Le foto restano realistiche: niente persone, animali, testo o elementi nuovi.
4. Se la stagione della foto originale è già evidente (per esempio neve, o faggi gialli), **non generare quella stagione**: scrivi nel manifest che per quella stagione vale la foto reale.
5. Salva in `incoming/luoghi/<id>-<stagione>.webp`, al lato lungo di 1600 px.
6. Nel manifest riporta autore, licenza e pagina della **foto di partenza**, presi da `data/media-zones.json`. Le licenze sono CC BY-SA: l'immagine derivata resta CC BY-SA, con attribuzione all'autore originale.

Per le 8 zone **senza foto** (terminillo-ovest, terminillo-est, cittareale, pescorocchiano, malito, sangiovanni, leonessa, domo): **non generare nulla da zero**. Per ciascuna elenca in `incoming/NOTE.md` 2-3 foto reali candidate da Wikimedia Commons. Per ogni foto riporta link, autore, licenza e data di scatto se c'è, e stagione visibile.

## Alla fine

- Fai commit e push su `gpt/immagini`.
- Rispondi con l'elenco di quello che hai prodotto e di cosa non sei riuscito a fare.
