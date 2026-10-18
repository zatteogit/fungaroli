# Copertine stagionali dei luoghi · 18 ottobre 2026

Valutazione della richiesta «aggiungi quanto più materiale possibile per ogni categoria». Il piano iniziale registrava 32 combinazioni mancanti: 16 per Cittareale e 16 per Terminillo ovest. Il censimento delle worktree non ha trovato precedenti elaborazioni di questi due luoghi: erano disponibili soltanto le due fotografie reali e le loro risoluzioni.

**Consegna:** 32 copertine distinte approvate internamente, 64 WebP pubblici (32 normali + 32 HD), 32 master PNG e due miniature migliorate. Tutte le 32 combinazioni del piano sono coperte senza duplicati. La revisione indipendente è registrata separatamente.

## Materiale e natura delle immagini

Le nuove copertine sono **illustrazioni stagionali e meteorologiche derivate dalle fotografie già attribuite**, non nuove fotografie documentarie. Non attestano lo stato del luogo nel giorno selezionato, la presenza di neve, l'accessibilità dei percorsi o altre condizioni attuali. Le due immagini estive serene originali restano fotografie reali e non ricevono `generated:true`.

Le derivate ricevono tutte `generated:true`, autore, licenza, URL della licenza e pagina della foto originale. L'app mostra già la natura AI nei crediti attraverso `creditLine()`. Non si aggiungono autori fotografici né si sostituisce con AI una foto di specie animale o vegetale.

| Zona | Fonte originale locale | Attribuzione | Licenza derivati |
| --- | --- | --- | --- |
| Terminillo ovest | `assets/zones/terminillo-ovest-hd.webp` | Johan Haggi, Monte Terminilletto | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| Cittareale | `assets/zones/cittareale-hd.webp` | Skylimitless, Monte Pozzoni | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

Fonti individuali: [Monte Terminilletto](https://commons.wikimedia.org/wiki/File%3AMonte_Terminilletto_%2814936512892%29.jpg), [Monte Pozzoni](https://commons.wikimedia.org/wiki/File%3AMonte_Pozzoni_%28Cittareale-Rieti%29.jpg). I crediti sono quelli verificati e registrati nel repository, non una nuova verifica online non effettuata.

## Metodo e revisione

Brief autorizzato in `docs/handoff-immagini-mancanti.md`, punto 6. Prima le sei stagioni serene mancanti; poi nuvoloso, nebbia e pioggia nelle quattro stagioni e neve in inverno. I meteo vengono dalla variante stagionale corrispondente; soltanto l'estate usa direttamente la fotografia reale. Nessun nuovo edificio, albero, strada o rilievo ammesso. Sul Terminilletto si controllano soprattutto il piccolo edificio sommitale, la strada bianca e le tracce del versante; a Cittareale i due risalti rocciosi, i ghiaioni e il bosco basso.

La neve è rada sui pendii alti, con vegetazione e rocce ancora leggibili; il fondovalle di Cittareale resta in gran parte scoperto. La nebbia deve lasciare riconoscibili i rilievi e non fungere da copertura per errori geografici. Le piogge sono moderate e non rappresentano eventi estremi. I colori stagionali sono una resa illustrativa plausibile, non una fenologia osservata della data.

Master PNG, prompt, ricevuta con SHA256 e tavole sono in `incoming/luoghi-stagioni-2026-10-18/`. La revisione indipendente viene registrata a parte dall'agente botanica. Il rapporto distingue raster prodotti, approvazione e integrazione; non basta la correttezza del nome file.

Due formati pubblici per ogni copertina: WebP normale a lato lungo 640 px e HD a 1536 px, senza ingrandire la sorgente generata; compressione 70/72 come nell'importer esistente. Nuovi ancoraggi di ritaglio per i due originali e per tutte le varianti nei sei formati UI; miniature 160 px ricentrate sui crinali. Il master mantiene la risoluzione originale della generazione.

## Foto e animali: blocco reale

La skill cloud runtime e la configurazione sono state lette. La policy del 18 ottobre è `restricted`, `enforced`, con osservazioni correnti: Commons, il relativo host di immagini e le sorgenti iNaturalist non sono autorizzati. Non sono stati ritentati a oltranza i precedenti errori CONNECT 403 e non sono stati usati proxy alternativi, route dirette o host camuffati. Le otto candidature fotografiche animali restano candidature: byte non acquisiti, nessuna revisione del file o del ritaglio, zero nuove fotografie.

La ricerca locale non ha trovato fotografie animali riutilizzabili con provenienza completa. I simboli botanici con nome «farfalla» rappresentano un tipo di fiore e non vengono riusati per gli animali. Il dettaglio è in `photo-network-audit.json`. Nessuna presenza locale o relazione biologica è stata dedotta dai disegni.

Nessuna suite automatica eseguita, come richiesto dall'utente. Solo preparazione/importazione degli asset, controllo di hash, dimensioni, provenienza e revisione visiva dei file.
