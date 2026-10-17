# Fronda · prima integrazione delle pagine Figma

Riferimento: [schermate reali in Figma](https://www.figma.com/design/FCjz72xhVX39GdpJI5v0JN/Fronda?node-id=103-6279). Questa tranche porta nell'app le schede fungo, il confronto e i controlli della mappa; non completa tutte le tavole esplorative.

- Schede con foto originale, azione del taccuino sulla copertina, cinque gruppi di caratteri quando documentati e selettori da almeno 44 px. Foto, varianti, rischi, glossario, fonti e contenuti CMS conservano i renderer condivisi dalle pagine e dai pannelli contestuali.
- Confronto su una colonna di lettura, coppia di foto intere, valori condivisi in polline e valori distinti con contorno. Caratteri interamente comuni e fonti si aprono su richiesta. Le schede non attive sono escluse dal focus; frecce, Home ed End cambiano sosia. Il cambio di larghezza conserva la coppia selezionata.
- Mappa a tutta larghezza e altezza utile, interessi combinabili sulla prima riga, giorno e filtri pratici sotto. Calendario apribile anche su desktop. I controlli circolari seguono l'altezza effettiva del pannello; livelli, tracce, ranking e dati meteo restano quelli dell'app.
- Icone Tabler originali delle tavole in `assets/ui/`, modulo `js/ui-icons.js`, licenza MIT già in `assets/tabler-LICENSE.txt`. Fungo pieno dal modulo esistente. Nessuna URL temporanea Figma nel prodotto.

Stili circoscritti in `css/species-pages.css`, incluso nel controllo dei token. La shell e la meta versione passano insieme a v101; foglio di stile, modulo e icone entrano nel precache.

Code Connect: corrispondenze confermate dall'utente, ma Figma rifiuta il salvataggio con «Published component not found» per tutti e sei i componenti. Pubblicare le icone nella libreria prima di ripetere il collegamento; non sono collegamenti già attivi.

| Componente Figma | Esportazione nel codice |
|---|---|
| `42:50` · chevron-right | `chevronRightGlyph`, `js/ui-icons.js` |
| `42:96` · alert-triangle | `alertTriangleGlyph`, `js/ui-icons.js` |
| `42:101` · mushroom | `fungusGlyph`, `js/indicators.js` |
| `42:19` · map | `mapGlyph`, `js/ui-icons.js` |
| `42:15` · leaf | `leafGlyph`, `js/ui-icons.js` |
| `42:29` · notebook | `notebookGlyph`, `js/ui-icons.js` |

Verifiche: test unitari, guardia token e dry-run Worker; browser a 320/390/768/1440 px, light/dark, varianti illustrate, appunto privato, approfondimenti, cambio sosia, tastiera e ridimensionamento. Contrasto misurato sulle schede e sul confronto in stato normale, hover e focus. La cartografia e il meteo nei test usano risorse locali e risposte simulate: non attestano disponibilità dei servizi live. Nessun deploy in questa tranche.
