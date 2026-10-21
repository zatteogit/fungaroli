# Celle della mappa e tavole di confronto · 19 ottobre 2026

## Campioni «non bosco»
`tools/build_habitat.py` assegna categoria -1 ai punti esterni ai poligoni della Carta Forestale regionale. Non misura l’uso del suolo non forestale: lago, abitato e prato risultano indistinti. Nei dati ci sono 3.398 punti senza categoria su 11.392; a Nemi 124 su 317. Non sono tutti punti che prima venivano mostrati: il rendering applica anche filtri di specie, quota e indice.

Per localizzare le celle ora occorrono categoria forestale documentata e coordinate/quota valide. Categoria assente o sconosciuta: nessuna cella né relativo indice/tooltip. Resta la compatibilità per specie, incluse le cautele esistenti sui pini non verificati. Al dettaglio il cerchio è solo un perimetro; il suo riempimento uniforme non colora più acqua o abitato.

Questo non significa che i funghi crescano solo nel bosco. La scheda istituzionale della Provincia di Cuneo documenta prati e radure per Macrolepiota procera: https://natura.provincia.cuneo.it/funghi/commestibili/macrolepiota-procera/
Per ammettere in futuro una cella aperta serve una copertura terrestre verificata come prato/radura, esclusione esplicita di acque/superfici artificiali e habitat documentato della specie. L’assenza di un poligono forestale non può sostituire questi requisiti.

Limiti: reticolo campionato, non cartografia di confine; i bordi delle celle rettangolari possono oltrepassare il margine di un bosco. Non viene dichiarata una maschera idrografica precisa che i dati attuali non possiedono. Questa correzione riguarda la localizzazione delle celle; non ricalibra i pesi né l’indice aggregato delle zone.

## Tavole senza etichette
Le 13 voci del registro sono tavole di confronto; i brief richiedevano di aggiungere successivamente testi e richiami. Per esempio cibarius.md identifica la vignetta inferiore come Omphalotus olearius. Il renderer mostrava invece il raster senza quella impaginazione, sotto il nome della sola specie principale.

Sospese tutte le 13 tavole grezze, conservando file, fonti e crediti. Il renderer ammette ora soltanto tavole con publication.status=approved e visibleLabels=true. Per approvarle servono verifica anatomica severa, nomi comuni/scientifici sui soggetti, separazione dei sosia, loro rischi documentati e stessa chiarezza nella vista ingrandita. Un avviso generico o l’alt dell’immagine non bastano. Le sezioni fotografiche, caratteri e confronto strutturato restano disponibili.

## Verifica
Controlli di sintassi e diff; navigazione manuale delle 13 schede e ispezione dei livelli Leaflet con dati reali. Nel frame osservato: 7.009 celle totali, nessuna con centro privo di categoria forestale; 188 a Nemi. Questi conteggi dipendono da giorno e filtri, non sono un indicatore di presenza.

Nessuna suite lanciata localmente. Durante il rilascio v242 GitHub ha avviato automaticamente due esecuzioni CI non escluse dal trailer: annullate. Per v243 corretto il trailer con due righe vuote prima di skip-checks.
