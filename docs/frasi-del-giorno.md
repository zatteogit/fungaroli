# Citazione del giorno · aggiornamento del 25 ottobre 2026

Sostituiti tutti i precedenti testi con **10 citazioni documentate**: 3 sui funghi,
4 sulle piante presenti nel catalogo e 3 sulla montagna. Ogni voce contiene autore,
opera, posizione del passo, URL e verifica del 25/10/2026. I tag botanici indicano
un tema letterario: non trasformano un nome poetico in un’identificazione tassonomica.

La home mostra soltanto l’autore con link alla fonte. Per Dickinson e Muir la
traduzione italiana è stata preparata dall’originale, conservato in `source.originalText`,
senza copiare traduzioni moderne. Il credito resta in `source.translationCredit`. I passi originali
sono in pubblico dominio; per Muir si usa la raccolta pubblicata nel 1924, non le
immagini di manoscritti soggette alle condizioni dell’archivio.

Nessun testo editoriale privo di fonte rimane nella rotazione. Gli estratti sono brevi
(massimo 160 caratteri), mantengono nell’archivio la punteggiatura del passo e non aggiungono promesse
di raccolta, istruzioni alimentari o probabilità di trovare funghi.
Nella card si omette soltanto la virgola finale dell’estratto; restano le virgole
interne, gli altri segni di punteggiatura e il testo originale nell’archivio.

## Fonti

- **Giovanni Pascoli** — [Myricae, Il bosco, vv. 1–2](https://it.wikisource.org/wiki/Myricae/Ricordi/Il_bosco).
- **Giovanni Pascoli** — [Myricae, Il bacio del morto, vv. 1–3](https://it.wikisource.org/wiki/Myricae/Il_bacio_del_morto).
- **Emily Dickinson** — [The Complete Poems of Emily Dickinson, The mushroom is the elf of plants, v. 1](https://en.wikisource.org/wiki/The_Complete_Poems_of_Emily_Dickinson/The_mushroom_is_the_elf_of_plants) · traduzione italiana Fronda, originale conservato nel database.
- **Giovanni Pascoli** — [Odi e inni, Al corbezzolo, vv. 9–10](https://it.wikisource.org/wiki/Odi_e_inni/Odi/Al_corbezzolo).
- **Giacomo Leopardi** — [Canti, La ginestra, vv. 5–7 (edizione Ginzburg, 1938)](https://it.wikisource.org/wiki/Canti_(Leopardi_-_Ginzburg)/La_ginestra).
- **Gabriele D’Annunzio** — [Alcyone, La pioggia nel pineto, vv. 16–19](https://it.wikisource.org/wiki/Alcyone/La_pioggia_nel_pineto).
- **Giovanni Pascoli** — [Myricae, Novembre, vv. 3–4](https://it.wikisource.org/wiki/Myricae/In_campagna/Novembre).
- **Giosue Carducci** — [Rime e ritmi, Mezzogiorno alpino, vv. 3–4 (Poesie, 1904)](https://site.unibo.it/carduccionline/it/su-mezzogiorno-alpino).
- **Dante Alighieri** — [Divina Commedia, Purgatorio IV, vv. 52–54](https://it.wikisource.org/wiki/Divina_Commedia/Purgatorio/Canto_IV).
- **John Muir** — [The Life and Letters of John Muir (1924), vol. I, cap. X, lettera del 3 settembre 1873 (estratto)](https://www.yosemite.ca.us/john_muir_writings/the_life_and_letters_of_john_muir/the_life_and_letters_of_john_muir.pdf) · traduzione italiana Fronda, originale conservato nel database.

## Archivio e funzionamento

`data/daily-thoughts.json`, schema 1. Campi obbligatori e validazione CMS restano invariati;
`source.originalText` e `source.translationCredit` documentano le traduzioni. Tutte le
citazioni sono disponibili durante l’intero anno: i tag non attestano una stagione biologica.
La rotazione è deterministica sul giorno di Roma e rimane stabile durante la lettura;
si aggiorna a mezzanotte o al ritorno dalla sospensione. Il payoff resta separato.

Il documento CMS è `daily-thoughts`, tra le risorse aggiornate dal repository finché
nessun autore le ha modificate. Il seed non sovrascrive una bozza o pubblicazione
redazionale indipendente. L’implementazione locale non costituisce un aggiornamento
del CMS di produzione. Se la fonte dati non risponde o non offre frasi valide, la
card resta nascosta senza bloccare la home.

Il recupero `findThoughts` supporta contesto, tono, tipo, tag, momento e stagione;
le citazioni rimangono disponibili anche per Taccuino e Uscita. Lo schema generale
continua a consentire i tipi storici, ma questo catalogo contiene soltanto citazioni.

## Verifica del 20 ottobre 2026

- 5 controlli mirati: archivio/validazione CMS, fuso e cambio ora, rotazione, recupero per tag, seed/snapshot D1 e conservazione della bozza autore.
- 3 controlli browser: 320/390/768/1280 px, chiaro/scuro, contrasto e assenza di overflow, posizione dopo le alternative e nessuno spostamento dell’hero, stabilità al reload, archivio non disponibile e priorità dello snapshot CMS sul seed.
- Il controllo visivo della card e della pagina 10 del PDF del brand è stato completato. Nel PDF le altre 25 pagine sono conservate.
- Suite unitaria completa: **364/364 passano**. Risolti i 12 errori precedenti, conservando i controlli su accesso con contributo, cataloghi, fonti, dati sconosciuti e serie di illustrazioni incomplete. Guardia del design system e verifica del kit passano.
- Ripristinata l’esportazione dalla dashboard della Redazione e conservate le modifiche non salvate quando si torna al pannello di policy.
- Caricamento dei dati incluso nella release limitato a 7 secondi per richiesta: un file facoltativo bloccato non trattiene indefinitamente l’avvio.
- Test browser aggiornati ai cataloghi pubblicati, alla conferma delle condizioni e alle preferenze attive nella home; verifica di leggibilità e ingombri su telefono e desktop.

Il dry-run del Worker è riuscito e ha prodotto il bundle. Il runtime locale Wrangler sul Mac presenta `spawn EBADF`: la suite completa usa quindi il Worker reale su runner Linux isolati, tramite il workflow manuale CI. I controlli locali di interfaccia usano invece il server statico con risposte meteo controllate.

Rilascio seguito nella [PR #162](https://github.com/zatteogit/fungaroli/pull/162). La suite browser completa è stata interrotta su indicazione esplicita dell’utente, che ha richiesto di procedere alla pubblicazione. La pubblicazione viene confermata dopo la verifica diretta della home e dello snapshot pubblico.
