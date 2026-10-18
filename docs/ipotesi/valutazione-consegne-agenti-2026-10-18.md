# Valutazione delle cinque consegne · 18 ottobre 2026

Decisione del proprietario: Matteo chiede «Gli agenti hanno lavorato… si può integrare il loro lavoro?». Si integra quanto verificabile nella PR #120; la richiesta non viene interpretata come approvazione di nuovi dati biologici, istruzioni sanitarie o pubblicazione automatica.

| Consegna fissata | Riscontro e decisione |
|---|---|
| Raster, `beefdb824d8cccd381adbfd0d216f2eee7b3800e` | 402 disegni finali confrontati per hash con HEAD `8ccf97b`: 226 identici, 170 mancanti e 6 da sostituire. Adottare soltanto il delta, con filtro `--stato`, revisione delle sette tavole a 72 px e delle correzioni. Sono 85 nuove combinazioni, quattro colori rosa/violetto senza mosaico improprio e due disegni Tylopilus crema/piano corretti. Le bozze scartate restano escluse. |
| Correzioni botaniche, `7a1b7700dc74d4fd83991112b29da98288512a3d` | Adottare ombrella composta gialla del finocchietto e cinorrodo intero della rosa canina. Controllati raster sorgente e foto già attribuite nel catalogo, caratteri e assenza di sezioni inventate. Sono esempi per specie, non immagini intercambiabili della categoria «falso frutto». Fragolina e ancoraggi erano già integrati. |
| Vettori, `7578a2df78f4a0e3007118cc73d9b6644dd0c915` | Adottare come prototipo tecnico due SVG Tylopilus da raster r03 revisionato, con sorgenti, verifiche, strumenti e inspector. Parti indipendenti, metadati e dettagli modificabili; nessuna sostituzione del catalogo raster. Il prototipo Amanita con copie ritagliate non entra nella selezione integrata. Colori modificati e livelli nascosti restano prove da revisionare, non nuovi caratteri. |
| Animali, `7e580d2` | Conservare lo [studio](animali-2026-10-18/README.md): 18 voci, fonti e proposta UX. È una base di lavoro, non un catalogo pubblico approvato. Rimangono da decidere struttura finale e dati per campo; le indicazioni discordanti sull’estrazione delle zecche richiedono validazione. Nessuna procedura sanitaria nuova nell’app. |
| Foto, `81a2446` | Adottare inventario, candidature e pipeline come strumenti di acquisizione. Dodici candidati non sono dodici fotografie disponibili: zero nuovi file acquisiti a causa del 403 della rete. Prima dell’uso servono download autorizzato, controllo visivo, attribuzione e ritagli. Nessuna fotografia o licenza viene dedotta dal nome del file. |

## Limiti

La revisione editoriale confronta disegni, dati e riferimenti; non certifica l’identificazione. Nessun dato scientifico, relazione fra sosia, peso dell’algoritmo o contenuto CMS viene modificato per adattarsi alle immagini. La produzione SVG in serie e l’acquisizione fotografica restano aperte.

Risultati dell’import e controlli nel [resoconto tecnico](../assets/integrazione-consegne-agenti-2026-10-18.md). I commit sorgente conservano prompt, scarti e revisioni completi; l’integrazione selettiva evita di importare rami o pacchetti grezzi.
