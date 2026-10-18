# Forme nel confronto — recupero del 18 ottobre 2026

Il confronto offre i valori di `cap_shape` anche alle specie con fasi di crescita.
La precedente scelta del 15/10 archiviava invece le relative varianti di forma:
le icone esistevano ma non erano distribuite né indicizzate. Il fallback del
confronto mescolava quindi WebP approvate e simboli SVG storici.

Sono state recuperate 51 varianti, 102 file (cappello e gambo), da
`archive/forme-con-fasi/`. Copie identiche agli originali, con provenienza,
prompt e licenza nel suo `index.json`. Prima della copia sono stati verificati
specie, forma e colore base contro i dati attuali. Non sono state generate immagini,
modificati caratteri scientifici o sostituite le fasi di crescita.

L’indice e l’importatore mantengono ora entrambe le rappresentazioni. Il rapporto
degli asset controlla anche le forme delle specie con fasi; le nuove pendenze sono
in `data/asset-pending.json`. Le combinazioni colore–forma mancanti rimangono
esplicite: si usa la forma nel colore base, senza trasformare o ricolorare l’immagine.

Nel confronto una sola anteprima sopra i selettori evita di ripetere le miniature
sui valori sottostanti. Se l’indice arriva dopo il primo render, le anteprime
provvisorie vengono aggiornate senza perdere le scelte già compiute dall’utente.

## Forme ancora da produrre

| Specie | Forma |
|---|---|
| Tignosa bianca (`amanita-virosa`) | piano |
| Cortinario rubello (`cortinarius-rubellus`) | piano |
| Entoloma livido (`entoloma-sinuatum`) | conico |
| Lepiota bruno-incarnata (`lepiota-brunneoincarnata`) | emisferico |
| Spugnola gialla (`morchella-esculenta`) | emisferico |
| Porcino di fiele (`tylopilus-felleus`) | piano |

## Verifica

Rapporto asset: nessuna incoerenza o mancanza non elencata; 6 forme e 191
combinazioni colore–forma ancora mancanti. I cinque controlli mirati di coerenza e
completezza sono superati. Verifica browser mobile su tutte le forme di Porcino
e Prataiolo maggiore: WebP caricate, nessun vecchio simbolo duplicato visibile,
nessun errore JavaScript o overflow.
