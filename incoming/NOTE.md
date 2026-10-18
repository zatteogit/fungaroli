# Icone dei caratteri delle piante · produzione 18 ottobre 2026

**51 icone generiche pronte da integrare, in 6 tavole selezionate.** Un’icona per valore, non per specie. Solo nuovi file in `incoming/`; nessuna modifica all’app, ai dati scientifici o alle foto delle specie. Non sono ancora pubblicate.

| Parte | Icone |
|---|---:|
| Disposizione delle foglie | 4 |
| Tipo di foglia | 5 |
| Margine fogliare | 3 |
| Colore del fiore | 6 |
| Forma del fiore o infiorescenza | 14 |
| Tipo di frutto | 7 |
| Colore del frutto | 6 |
| Portamento | 3 |
| Altezza | 3 |
| **Totale** | **51** |

## Autorità dei valori e differenze dal vecchio brief

Fonte: `data/recognize-plants.json`, snapshot e SHA-256 registrati in `produzione-piante-2026-10-18/coda.json`. Inclusi tutti i valori delle domande `ask:true`, esclusi `special` e `habitat` (quest’ultimo non compare attualmente nello schema). Nessun valore aggiunto o modificato.

Il brief `docs/handoff-immagini-piante.md` indica 51 icone ma dice prima «Non hanno icona: taglia…» e poi elenca tre altezze e ne descrive la produzione. Lo schema corrente ha `height_class.ask:true` e l’importatore esclude `size`, non `height_class`. Le tre altezze sono pertanto incluse. Il diagramma di altezza è **relativo e schematico**: bastone di riferimento uguale, pianta molto più bassa, più bassa e più alta del bastone. Non è uno strumento per misurare centimetri. Le soglie esatte restano nelle label del catalogo. Gli esempi con stivale sono conservati come bozze superate.

Anche la vecchia destinazione `gpt/immagini` del brief è superata dall’incarico corrente: ramo dedicato `images/plant-traits-2026-10-18`, creato dalla produzione aggiornata. L’integrazione è un passaggio successivo, non automatico.

## Metodo

- Riferimenti approvati visionati in `assets/tree-traits/`: contorni bruni, palette naturale, pochi colori, sfondo trasparente. Tavole nuove già revisionate usate come ulteriori riferimenti per continuità.
- Prima generazione raster con `image_gen`, tavole quadrate RGBA 1254×1254, griglia 3×3, un valore per cella. Niente testo, simboli di commestibilità o ritratti riconoscibili di specie.
- Disposizione fogliare: una foglia per nodo nelle alterne, due nelle opposte, almeno tre nei verticilli, unico centro basale nella rosetta.
- Fiori a cinque/quattro/sei petali contati; ombrella distinta dal capolino, strutture bilabiata/papilionacea/labello separate. Frutti generici, non segnali di riconoscimento o consumo.
- Colori dei fiori e frutti: sagoma neutra coerente fra valori. Nessuna ricolorazione automatica dei raster: ogni tavola proviene dalla generazione e le correzioni da `image_gen`.
- Revisione visiva per tavola prima dello stato «pronta da integrare», poi verifica componenti con `tools/sheet_cells.py` e 51 ritagli centrati a 128px. Il crop è per componenti, non taglio rigido a terzi. Piccoli sconfinamenti oltre il terzo sono ammessi dal metodo purché il gruppo sia attribuito correttamente e non tocchi altri disegni o il bordo.

## Revisioni conservate

1. Tavola03 → r01: ombrella con fiorellini sullo stesso piano e pedicelli da un punto comune, correggendo l’arco iniziale.
2. Tavola04 → r01: petali realmente ripiegati all’indietro, eliminando l’ampio petalo inferiore che rendeva ambiguo il carattere.
3. Tavola06 → r01/r02/r03: proporzioni altezza chiarite passando dallo stivale al bastone, poi ingombro ridotto affinché la piantina bassa separata non venisse assegnata alle celle inferiori. La versione pronta è **r03**.

Le tavole originali e le revisioni intermedie non sono nel manifest importabile e sono marcate «da rivedere». Gli hash di tutti i file sono in `storico-generazioni.json`.

## File utili

- `manifest.json`: 51 righe, chiave/valore/cella, prompt effettivi, riferimenti, modello e licenza.
- `bozze/STATO.md`: 6 tavole selezionate e bozze superate.
- `produzione-piante-2026-10-18/coda.json`: inventario completo e stato di tutti i valori.
- `produzione-piante-2026-10-18/controlli.json`: hash delle tavole selezionate, bounding box delle celle e note di revisione.
- `produzione-piante-2026-10-18/prompt-*.txt`: istruzioni originali e revisioni.
- `produzione-piante-2026-10-18/ritagli/*.png`: 51 esempi a128px pronti per l’ispezione.
- `produzione-piante-2026-10-18/anteprima.html`: griglia con label e sfondo chiaro/scuro per revisione.
- `produzione-piante-2026-10-18/registra.py`: controllo tecnico e registrazione dopo revisione visiva esplicita; non riconosce né approva l’anatomia automaticamente.

Licenza: **CC BY-SA4.0**, Fronda/Fungaroli, come le icone approvate. Modello: `image_gen` integrato, identificatore specifico non esposto. Il vettoriale delle piante non è avviato: questa consegna contiene raster revisionati.

## Integrazione successiva

```bash
python3 tools/import_tree_icons.py /percorso/di/questo/incoming --piante --stato
```

L’import aggiorna asset e indice nell’app: **non è stato eseguito sul repository di produzione**. È stato provato in una copia minima temporanea dei soli script e schema, verificando51icone/6tavole. Dopo l’integrazione reale andranno aggiornati le voci `piante-valori` in `data/asset-pending.json` e il rapporto degli asset, seguendo il workflow dell’app.
