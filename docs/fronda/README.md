# Fronda — identità e design system 1.1

Direzione C / Lobata scelta il 15 ottobre 2026. Revisione 1.1: bosco più luminoso, base avorio e accenti polline, calendula, fiordaliso e germoglio. Il contorno mantiene pochi lobi ampi e morbidi, senza piccole dentellature. La lettura foglia / sentiero / pennino è il concetto guida.

Apri `index.html` nel browser: guida completa, componenti interattivi, tema chiaro e scuro. I font sono locali. Nella guida le azioni sono dimostrative e non conservano note. Il prototipo separato `product.html` conserva invece le pagine del taccuino solo su questo browser. La preferenza del tema può essere salvata nel browser.

## Payoff ufficiale — decisione del 20 ottobre 2026

**Chi cerca, si ritrova.**

Il payoff unisce il piacere della ricerca nel bosco alla possibilità di ritrovare tempo per sé, attenzione e contatto con la natura. La virgola sostiene il doppio significato. È un invito alla scoperta, senza promettere raccolti, ritrovamenti o identificazioni certe.

- **Scrittura:** mantenere esattamente «Chi cerca, si ritrova.», con maiuscola iniziale, virgola e punto finale. Non usare le alternative esplorate come payoff del brand.
- **Firma:** Fronda + payoff, su righe distinte. Il logotipo resta il master vettoriale; il payoff è testo separato in Manrope, più piccolo del nome e fuori dall’area di rispetto del marchio.
- **Impaginazione:** preferire una sola riga; se serve, andare a capo dopo la virgola. Non comprimere o deformare il testo per farlo entrare.
- **Colore:** usare i ruoli di testo del sistema, con contrasto adeguato al fondo. Nessun colore esclusivo aggiuntivo per il payoff.
- **Dove usarlo:** copertine, presentazioni, materiali di comunicazione e aperture editoriali. La firma completa è facoltativa: nelle intestazioni compatte, nelle icone e quando la leggibilità è insufficiente si usa il marchio da solo.
- **Tono:** il gioco di parole appartiene alla comunicazione di brand; nei dati, nelle indicazioni pratiche e negli avvisi prevalgono chiarezza e precisione.

La [guida HTML, sezione Linguaggio](index.html#linguaggio) e la pagina 10 del manuale PDF riportano il payoff e le regole essenziali.

## Frase del giorno

La home può ospitare una piccola pausa editoriale dopo le proposte di uscita: un solo testo breve, con firma discreta, senza immagini o caroselli. Alternare curiosità, poesia e umorismo gentile; distinguere testi originali e citazioni attribuite. Il payoff rimane la firma permanente del brand. Archivio e regole in [Frasi del giorno](../frasi-del-giorno.md).

## Contenuto

- `assets/fronda-symbol-*.svg`: simbolo master, verde / avorio / nero.
- `assets/fronda-wordmark-*.svg`: logotipo in tracciati.
- `assets/fronda-logo-horizontal-*.svg` e `fronda-logo-stacked-*.svg`: composizioni coordinate.
- `assets/fronda-app-icon.svg`, `fronda-app-maskable.svg`: icone e PNG corrispondenti quando presenti.
- `assets/icon-*.svg`: 24 icone funzionali, tratto 1,8 su griglia 24.
- Template SVG: carta intestata A4, biglietto fronte/retro, taccuino A5, social quadrato, story, adesivo, stampa per tote.
- `fonts/`: Manrope e Fraunces, con licenze SIL OFL incluse. I template pronti sono in tracciati per non dipendere dai font installati.
- `tokens.json`: fonte dei token, con alias semantici/componenti e override scuri. Formato JSON del progetto, non un file Figma importabile automaticamente.
- `styles/tokens.css`: CSS generato dalla fonte; `styles/components.css`: componenti riutilizzabili; `styles/guide.css`: presentazione della guida.
- `app.js`: interazioni dimostrative, navigazione, tema, dialogo e validazione.
- `RICERCA.md` / `benchmark.json`: approfondimento funzionale, conservato come appendice alla ricerca visiva.
- `VERIFICA.md`: esiti e limiti delle verifiche effettuate.

## Aggiornare i token

Modificare `tokens.json`, poi eseguire dalla cartella del kit:

```sh
node scripts/build-tokens.mjs --write
node scripts/check.mjs
node scripts/guard-test.mjs
```

I componenti consumano token semantici o di componente. I valori primitivi restano privati nel CSS dei token. La verifica controlla riferimenti mancanti, cicli, primitivi orfani, accessi diretti ai primitivi, colori letterali fuori dalla fonte e contrasti dichiarati, nei due temi. Non è una certificazione completa di accessibilità.

## Master e tavole

Gli SVG, la guida e i token sono i riferimenti di produzione. Le tavole generate con imagegen illustrano atmosfera e applicazioni; non sostituiscono geometrie, testi o valori colore esatti. Il master deriva dal concept scelto, ricostruito in curve vettoriali e poi reso più fluido per la piccola dimensione.

I template di stampa hanno dimensioni nominali, senza abbondanze o profilo CMYK. Lo stampatore deve impostare profilo e abbondanze e verificare una prova fisica. I file non attestano la registrabilità del nome o del simbolo. L’app Fungaroli pubblicata non è stata modificata.


## Palette 1.1

La base è bosco/avorio. I quattro accenti possono convivere: uno domina la singola composizione e gli altri sostengono il ritmo. Sui colori accesi il testo usa inchiostro scuro; sui fondi chiari le etichette usano varianti “ink”. Gli stati di sistema conservano ruoli separati. I pulsanti principali sono verdi in light e bianchi in dark. Calendula, fiordaliso e germoglio restano accenti editoriali e informativi, senza cambiare il ruolo delle azioni. Il marchio mantiene la stessa geometria.


## Studio completo e prototipo

- `Fronda-Identita-Design-System.pdf`: manuale di 26 pagine, A4 orizzontale.
- `product.html`: prototipo navigabile desktop/mobile, con Uscite, Scopri e Taccuino; include una selezione reale di 12 schede, 15 zone, 3 guide e 47 voci del glossario.
- `content.json`: selezione dei contenuti del repository, incorporata anche nel prototipo per evitare chiamate di rete ai dati.
- `FONTI-PROGETTO.md`, `content-source.json`: ramo, commit, inventario, hash delle fonti e attribuzioni delle fotografie.
- `assets/content/`: fotografie originali e base topografica provenienti dal repository, con attribuzioni e licenze.
- `product.js`, `styles/product.css`: interazioni e impaginazione del prototipo; usano gli stessi token e componenti della guida.

Aprire `index.html` o `product.html` dopo aver estratto l’intera cartella. Per una prova uniforme del salvataggio locale è preferibile servirla da un server statico e aprirla nel browser. Il prototipo non richiede account, non modifica il taccuino di Fungaroli e non si collega al meteo o alla comunità. Le pagine salvate sono solo su quel browser, nella chiave `fronda:studio:v11:notes`; l’esportazione JSON permette di conservarne una copia. Non è un servizio di backup o sincronizzazione.

Il contenuto deriva dal commit `44f1420e5bc08474428e1049cc9ce550799e9bf0` del 15 ottobre 2026. La nuova navigazione segue l’handoff UX del progetto; le differenze rispetto alla shell esistente sono descritte nelle fonti e nel manuale. Gli stati non collegati a servizi reali sono dichiarati esplicitamente. L’app pubblicata e il repository originale non sono stati modificati.


### Avvisi editoriali con fotografia · 20 ottobre 2026

Usare una campitura di brand con testo scuro e una fotografia pertinente a lato, riprendendo il componente `story-invite` / `story-photo`. La foto resta separata dal testo: niente scritte sovrapposte o segni decorativi aggiunti. Su telefono il ritaglio diventa una fascia laterale; verificare che il soggetto rimanga leggibile e che l’immagine non imponga la sua altezza naturale all’avviso. Riutilizzare foto del catalogo con provenienza e licenza, collegandole alla scheda con crediti. Prima applicazione: avviso del catalogo Animali, ape da miele sul meliloto (Ivar Leidus, CC BY-SA 4.0).


## Gerarchia dei controlli — revisione di Matteo, 21 ottobre 2026

Questa direzione sostituisce la prima prova del 20 ottobre, che assegnava giallo all’azione e verde alla selezione.

- **CTA:** verde bosco in light, mantenendo le geometrie precedenti dei diversi controlli. In dark il verde dell’azione diventa bianco, con testo bosco notte. Icona pertinente e testo stanno nello stesso controllo, senza freccia decorativa aggiuntiva.
- **Selezione:** giallo polline con le forme e i bordi precedenti dei diversi gruppi, in entrambi i temi. Spunta nei filtri quando prevista, stato corrente nel gruppo di navigazione. I chip conservano la forma a capsula.
- **Secondarie e approfondimenti:** contorno o link nella famiglia del verde (bianco in dark), con la stessa geometria della famiglia di azioni. Il rilievo segue il contesto.
- **Accenti editoriali:** giallo, ciclamino e corallo. Il corallo riprende il tono mostrato da Matteo nel badge «Mortale»; la somiglianza cromatica non unifica i ruoli. Token di rischio, testo esplicito e simboli restano dedicati agli avvisi.

Le azioni principali mantengono un bersaglio comodo, di almeno 44 px; non si impone una nuova geometria unica alle selezioni. Annota globale resta circolare su mobile ed è un comando, non una destinazione selezionata. Confronta e Impara a riconoscere sono accessi equivalenti nel catalogo.

La prima applicazione riguarda barra globale, strumenti del catalogo, selezioni condivise di filtri e navigazione, richiami editoriali e compositore rapido. I materiali PDF precedenti sono documentazione storica; questa sezione aggiorna le regole interattive.


### Forme e bordi — correzione successiva del 21 ottobre

Matteo preferisce le geometrie e i bordi precedenti alla prova: mantenere i nuovi colori di ruolo, senza uniformare selezioni e destinazioni della barra a una nuova forma rettangolare. Ripristinati i chip a capsula e i raggi originali dei diversi gruppi; gli strumenti del catalogo mantengono il raggio precedente. Rimossi il rinforzo globale dei bordi delle azioni secondarie e il contorno bianco delle selezioni gialle in dark. Questa correzione supera la prescrizione geometrica del paragrafo precedente.

La frase del giorno conserva cornice e fondo discreti: testo in carattere editoriale, firma sotto e piccola etichetta separata; nessuna nuova illustrazione, cornice o azione aggiuntiva.


### Verde e bordi dei selettori — ulteriore affinamento del 21 ottobre

Il verde delle CTA in light riprende l’inchiostro bosco originale di Annota (#18382C), senza schiarirlo. In dark le azioni restano bianche. La scelta Funghi nella home usa lo stesso bordo singolo degli altri selettori gialli: nessun secondo filetto aggiunto da un’ombra interna.
