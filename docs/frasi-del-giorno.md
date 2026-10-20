# La frase del giorno — Fronda

Decisione di Matteo, 20 ottobre 2026: una card discreta nella home e un archivio di citazioni, aforismi e umorismo, taggato per recuperare il testo adatto al contesto.

## Collocazione e comportamento

La card viene dopo **Altre buone uscite**, prima delle zone del Lazio. Non precede la proposta principale, i filtri o le alternative. Fondo neutro, testi piccoli ma leggibili, nessuna immagine, carosello o pulsante aggiuntivo. Il testo resta integrale; l’autore delle citazioni è un link alla fonte.

Una frase per giorno civile di **Europe/Rome**, stabile al ricaricamento e senza dati personali. Il selettore esclude bozze, testi archiviati e stagioni incompatibili. Scorre l’elenco compatibile con una rotazione deterministica senza ripetizioni nello stesso ciclo, finché il catalogo resta invariato. Le stagioni sono editoriali: marzo–maggio, giugno–agosto, settembre–novembre, dicembre–febbraio. Il cambio giorno viene controllato anche al ritorno dalla sospensione. Nessuna rotazione durante la lettura nello stesso giorno.

Se l’archivio non risponde, è vuoto o non offre contenuti compatibili, la card rimane nascosta. Non interrompe il caricamento delle uscite e non mostra errori tecnici all’utente.

## Archivio e manutenzione

- Seed versionato: `data/daily-thoughts.json`, schema 1, **28 testi**: 16 aforismi, 6 battute, 4 barzellette originali Fronda e 2 citazioni letterarie.
- Database: documento `daily-thoughts` nel CMS D1 esistente, inizializzato dal seed. Compare in **Redazione → Frasi del giorno**, con bozze, pubblicazione e cronologia. Il deploy aggiorna il seed solo finché nessun autore lo ha modificato. La home legge lo snapshot pubblicato; il JSON è il ripiego quando la risorsa non è disponibile.
- Stati delle singole voci: `draft`, `published`, `archived`. Pubblicare il documento non rende visibili le voci ancora in bozza.
- `type`: `citazione`, `aforisma`, `battuta`, `barzelletta`.
- `tags`: argomenti liberi ma coerenti, per esempio `cammino`, `bosco`, `curiosita`, `taccuino`.
- `tones`: `curioso`, `riflessivo`, `caldo`, `leggero`, `ironico`, `poetico`.
- `contexts`: `home`, `taccuino`, `uscita`.
- `moments`: `pausa`, `prima-di-uscire`, `rientro`, `mattina`, `sera`.
- `seasons`: `tutte`, oppure una o più fra `primavera`, `estate`, `autunno`, `inverno`.
- Ogni voce mantiene anche ID stabile, lingua, autore, diritti e fonte. Limite di 160 caratteri, ID e testi unici. Per le citazioni: opera e posizione, URL HTTPS, data e conferma della verifica. Gli originali sono dichiarati Fronda, senza attribuzioni a persone esterne.

Il recupero `findThoughts(database, filters)` accetta tipo, tag, toni, contesti, momenti e stagioni: OR entro ciascun filtro, AND fra filtri. In questa prima applicazione la home usa **giorno, stagione e contesto home**. I tag di momento e tono sono già disponibili per altri inserimenti; non si deducono umore, meteo o attività dell’utente.

Il payoff permanente **«Chi cerca, si ritrova.»** rimane distinto dalla frase del giorno. I testi umoristici non danno consigli sulla commestibilità, sulla sicurezza o sulla raccolta. Le citazioni si controllano nel testo originale, mantenendo parole e punteggiatura; non si aggiungono aforismi di attribuzione incerta.

## Fonti delle citazioni iniziali

- [Dante Alighieri, Inferno XXXIV, verso 139](https://it.wikisource.org/wiki/Divina_Commedia/Inferno/Canto_XXXIV): «E quindi uscimmo a riveder le stelle.»
- [Giovanni Pascoli, L’aquilone, verso 1](https://it.wikisource.org/wiki/Primi_poemetti/L%27aquilone): «C’è qualcosa di nuovo oggi nel sole,» (estratto, virgola originale). Selezione editoriale per la primavera.

Sono estratti di opere originali in pubblico dominio, verificati il 20/10/2026. Wikisource è la fonte di consultazione; nessuna traduzione moderna è stata riutilizzata.

## Verifica del 20 ottobre 2026

- 5 controlli mirati: archivio/validazione CMS, fuso e cambio ora, rotazione, recupero per tag, seed/snapshot D1 e conservazione della bozza autore.
- 3 controlli browser: 320/390/768/1280 px, chiaro/scuro, contrasto e assenza di overflow, posizione dopo le alternative e nessuno spostamento dell’hero, stabilità al reload, archivio non disponibile e priorità dello snapshot CMS sul seed.
- Il controllo visivo della card e della pagina 10 del PDF del brand è stato completato. Nel PDF le altre 25 pagine sono conservate.
- Suite unitaria completa: **364/364 passano**. Risolti i 12 errori precedenti, conservando i controlli su accesso con contributo, cataloghi, fonti, dati sconosciuti e serie di illustrazioni incomplete. Guardia del design system e verifica del kit passano.
- Ripristinata l’esportazione dalla dashboard della Redazione e conservate le modifiche non salvate quando si torna al pannello di policy.
- Caricamento dei dati incluso nella release limitato a 7 secondi per richiesta: un file facoltativo bloccato non trattiene indefinitamente l’avvio.
- Test browser aggiornati ai cataloghi pubblicati, alla conferma delle condizioni e alle preferenze attive nella home; verifica di leggibilità e ingombri su telefono e desktop.

Il dry-run del Worker è riuscito e ha prodotto il bundle. Il runtime locale Wrangler sul Mac presenta `spawn EBADF`: la suite completa usa quindi il Worker reale su runner Linux isolati, tramite il workflow manuale CI. I controlli locali di interfaccia usano invece il server statico con risposte meteo controllate.

Rilascio seguito nella [PR #162](https://github.com/zatteogit/fungaroli/pull/162). La pubblicazione viene confermata solo dopo la suite completa verde e la verifica diretta della home e dello snapshot pubblico.
