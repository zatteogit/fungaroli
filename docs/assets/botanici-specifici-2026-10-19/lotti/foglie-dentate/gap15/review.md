# Gap 15 specie — consegna al coordinatore

Stato: **candidati revisionati dal worker, in attesa di revisione indipendente**. Nessun nuovo file di questo lotto è stato messo nel percorso canonico. I 9 mapping già approvati non sono stati rigenerati. Le 59 combinazioni inventariate sono rendicontate: 9 preesistenti, 43 mapping candidati da 42 raster, 7 bloccati con motivazione specifica.

Il registro propone il percorso finale `src`, ma il file da esaminare è in `candidatePath`. La tavola `contact-sheet-final.png` mostra i 42 raster distinti; i due valori dentato/lobato della margherita condividono lo stesso dettaglio della foglia caulina. Tutti i prompt sono in `prompts.json`, `prompts-more.json`, `prompts-final.json`; le impronte dei master in `masters-manifest.json`, quelle degli export nel registro. Strumento: image_gen integrato, sfondo alpha. Esportazione neutra: crop dell'organo, ridimensionamento, centratura su 512 px, WebP lossless con `exact=True`.

## Fonti e limiti anatomici

Per le descrizioni sono state lette le schede InfoFlora/Flora Helvetica, NC State University per Primula vulgaris, Università di Trieste per Achillea ligustica e la pubblicazione di Parchi Lazio per Cyclamen repandum. `source-photo-audit.json` associa ogni mapping alla descrizione, alla fotografia reale usata e ai crediti estratti dalla pagina universitaria. Le fotografie universitarie sono riferimenti, non nuove fotografie distribuite nel catalogo. Le fotografie già locali conservano l'attribuzione del catalogo esistente.

Foglie intere e dettagli seguono il bordo della stessa specie. Il particolare della cicuta mostra un segmento fogliare, non una foglia semplice; quello del sambuco una fogliolina, non l'intera foglia composta. Le immagini di sambuco ed ebbio mostrano corimbi ramificati, pur essendo il valore storico del catalogo denominato `ombrella`. I frutti del sambuco sono penduli, quelli dell'ebbio portati verso l'alto. La cicuta ha coste ondulate nel frutto immaturo rappresentato. Il finocchio ha divisioni fogliari filiformi e frutto maturo costato.

Iperico: puntinature traslucide sulla lamina e ghiandole scure al margine; stami del fiore semplificati, la loro precisa separazione in tre fasci non è rappresentata e non va dichiarata come carattere illustrato. Silene: vista laterale, petali bifidi parzialmente sovrapposti, calice rigonfio reticolato; capsula aperta a sei denti. Viola: fiore bilaterale a cinque petali disuguali, foglia cordata-reniforme e capsula chiusa pubescente pendula. Primula: cinque lobi smarginati di una corolla saldata alla base, non cinque petali liberi. Margherita: capolino con ligule bianche e disco di fiori tubulosi; la foglia è caulina, con parte distale dentata e parte basale più incisa.

Per i ciclamini la marezzatura è una possibilità documentata, non un carattere invariabile. Il fiore del ciclamino autunnale ha lobi più larghi e auricole presso la bocca; quello primaverile ha lobi più stretti/torti e bocca priva di auricole. Le viste laterali sovrappongono parti della corolla: usare le caption del registro.

**Revisione coordinatore successiva: capsule di iperico, silene e viola SOSPESE, status `pending_visual_revision`.** Il crema accanto al calice verde può sembrare il colore naturale del frutto quando `fruit_color` è null. La caption non basta: questi tre file non sono approvati e richiedono revisione indipendente. I file restano nei candidati, senza essere spostati o integrati. Tutti gli altri valori null restano esclusi. Le caption di fase/parte nel registro devono accompagnare le figure in integrazione.

## Scarti e correzioni raster

- `m02-finocchio-cicuta-v1-rejected-layout.png`: sovrapposizione dei quadranti, sostituito dal v2 prima degli export.
- `m04-cicuta-achillea-v1-partial.png`: ombrella della cicuta con troppo pochi raggi e foglia di achillea troppo semplice. Esportati solo il frutto della cicuta e il capolino di achillea; i due organi errati rifatti nel v2, verificato contro la macro TSB53900.
- `m08-viola-v1-partial.png`: residuo stilare della capsula troppo lungo e uncinato. Esportati soltanto foglia, margine e fiore; capsula rifatta nel master m11.
- `m09-primula-margherita-v1-partial.png`: foglia caulina della margherita con apice troppo acuto rispetto alla foto TSB22410. Foglia intera scartata e rifatta nel master m11; conservati fiore di primula, capolino e dettaglio del margine della margherita.
- `m10-ciclamini-foglie.png`: nel crop della foglia autunnale escluso un frammento separato del disegno adiacente, senza modificare l'anatomia del raster.

## Non prodotti

`blocked.json` contiene sette mapping e il motivo distinto per ciascuno: forma finemente divisa dell'achillea non confermata come variante distinta; macro dei frutti di achillea, margherita, raponzolo, primula e dei due ciclamini insufficienti nelle gallerie universitarie esaminate. Per raponzolo sono state esaminate tutte le 59 foto, per achillea 34, margherita 24, primula 31, ciclamino autunnale 24, primaverile 31. Nessun frutto generico sostitutivo, nessuna capsula ricavata da un tubero o dal solo ovario sotto un fiore.

Nessuna suite, test, dry-run, commit o pubblicazione eseguiti.
