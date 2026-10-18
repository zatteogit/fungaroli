# Griglia dei caratteri: benchmark e composizione

18 ottobre 2026. Revisione richiesta da Matteo: conservare larghezze differenti
ed incastri. La prima rifinitura, cappello a tutta larghezza e quattro card uguali,
aveva perso proprio questo carattere. Questa revisione la sostituisce.

## Riferimenti consultati

Consultati i sorgenti ufficiali accessibili, non screenshot di raccolte promozionali.
I siti Apple HIG, Material 3 e Fluent Design non erano raggiungibili dall’ambiente
(403 del proxy): non vengono presentati come pagine ispezionate. Non è stato
eseguito un test di usabilità comparativo dei prodotti.

| Sistema | Evidenza nei sorgenti | Applicazione a Fronda |
| --- | --- | --- |
| [GitHub Primer Brand: Bento](https://github.com/primer/brand/tree/main/packages/react/src/Bento) | CSS Grid a 12 colonne, span e flussi configurabili, minimi di riga con max-content; padding, gap e raggi condivisi. | Larghezze e altezze diverse su un modulo comune; illustrazione principale distinta dai dettagli. Adattare i contenuti, senza copiare le grandi card promozionali. |
| [IBM Carbon: 2× Grid](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/elements/2x-grid/overview.mdx) | Unità minima di 8 px, dimensioni fluide, keyline di righe e colonne, ritmo costante; la mini-unità si adatta al contenuto. | Allineare i bordi degli incastri e mantenere gap e padding coerenti. Il rapporto scelto per Fronda è una decisione locale, non una prescrizione Carbon. |
| [Microsoft Fluent UI: Card appearance](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-card/stories/src/Card/CardAppearance.stories.tsx) | Esempi con altezza fit-content, header semibold, descrizione secondaria, superfici Filled/Alternative/Outline. | Evitare card tutte alte come il controllo più lungo; titolo e valore distinguibili, superfici discrete e bordi leggeri. |

## Scelta

Sette unità, divise 4:3: a sinistra Cappello, a destra Sotto il cappello e Gambo
impilati. Il cappello occupa due righe; Al taglio e Sporata chiudono rispettivamente
su quattro e tre unità. La struttura segue l’ordine dei cinque elementi nel DOM:
non usa colonne masonry che riordinano la lettura né `grid-auto-flow:dense`.

Il rapporto precedente 2:1 lasciava poco spazio al testo nella colonna stretta.
La divisione 4:3 mantiene la differenza di larghezza, con più spazio ai dettagli.
La card del cappello mantiene tutto il testo documentato e i selettori: non si
nascondono dati per ottenere una silhouette ideale. Le selezioni più numerose
possono aumentare l’altezza e allungare le card a destra. Non si introducono altezze
fisse, ellissi o scrollbar dentro le tessere.

Titolo prima del disegno, illustrazione principale più grande, corpo 16 px,
note 13 px e gruppi Colore/Forma espliciti. Gambo con tre righe leggibili dei
booleani documentati; nessun colore semantico attribuito alla loro presenza.
Sotto 360 px diminuiscono padding, gap e dimensioni dei disegni secondari,
conservando corpo e bersagli dei controlli di 44 px.

## Rifinitura editoriale

Titoli delle parti in carattere da lettura serif, più grande sul Cappello; corpo
sans serif regolare, didascalie subordinate. Il disegno del cappello assorbe lo
spazio verticale disponibile così che i selettori non lascino un vuoto in fondo.
I selettori usano anello attorno al campione di colore e sottolineatura della
forma: niente grandi pillole gialle in competizione con le illustrazioni. Ogni
scelta conserva bersaglio di 44 px e focus visibile.

Quando il selettore rappresenta tutti i valori documentati, evita di ripetere la
stessa lista in prosa: la frequenza, se presente nelle fonti, appare sotto il nome
del colore. Se manca un valore nel selettore, la descrizione completa rimane.
Il diametro resta esplicito. Nessun valore né frequenza viene dedotto dal disegno.

## Verifiche

Quattro schede con densità diverse (Porcino, Amanita muscaria, Amanita phalloides,
Lepiota brunneoincarnata), 320 e 390 px, temi chiaro/scuro: larghezze differenti,
bordo inferiore del cappello allineato al gambo, assenza di overflow e tagli,
bersagli di almeno 44 px, selezione delle varianti e conservazione dei colori
documentati. Controllo aggiuntivo della composizione a 768 e 1280 px. Le citazioni
lunghe ora vanno a capo anche a 320 px. Non è una validazione botanica delle
illustrazioni né una suite completa dell’app.
