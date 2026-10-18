# Modali e tastiera mobile

Il compositore del taccuino è un dialog `.wiz`: riduceva già l’altezza con `--vvh`, ma rimaneva centrato nel layout viewport. Safari può ridurre e spostare soltanto il visual viewport quando compare la tastiera: il risultato era un dialog tagliato e suggerimenti sotto l’header.

`modal-scroll.js` aggiorna altezza e offset dell’area visibile su resize e scroll del visual viewport. Quando questa differisce dal layout viewport, i dialog di testo (`.wiz`, `.sheet-dlg`, `.community-dialog`, `.cmp-chooser`, `.cms-dialog`) si collocano al suo interno con margini di 12 px e scroll interno. Il campo attivo viene mantenuto fra l’intestazione e il bordo inferiore, scorrendo soltanto un contenitore del dialog. Il body conserva il proprio posizionamento: nessun `position:fixed` e nessun nuovo scroll del documento sottostante.

I suggerimenti di `search-select.js` intersecano i limiti del chiamante con il visual viewport; l’altezza non ha più un minimo forzato che possa oltrepassare lo spazio disponibile. Il compositore esclude anche l’header sticky dall’area dei suggerimenti. Resize, pan del visual viewport e scroll interno ricalcolano l’elenco. Le frecce da tastiera fanno scorrere soltanto la lista, senza `scrollIntoView` che possa spostare anche dialog o documento.

Verifiche mirate: quattro test esistenti di ricerca/selezione/salvataggio a 320/1280 px nei due temi; nuovo scenario con layout viewport invariato (844 px), visual viewport a 390 px, poi 330 px con offset 80 px, poi 440 px. Controllati limiti di modale, chiusura, campo attivo e suggerimenti, selezione da tastiera, documento fermo e ripristino alla chiusura della tastiera e del dialog.

Lo scenario del visual viewport è simulato in Chromium: non sostituisce una verifica della tastiera nativa su un iPhone fisico.

## Accesso con passkey

Il dialog di accesso ha ora un’intestazione sticky con X e autofocus sulla chiusura (nessuna apertura automatica della tastiera sul nome facoltativo). Il contenuto scorre sotto l’header; l’input rimane a 16 px, i due pulsanti sono a tutta larghezza e alti almeno 44 px, privacy e recupero conservano il testo completo. Il limite del campo attivo considera anche `.account-header`. Test mirati a 320/390 px con visual viewport a 390 px e poi 330 px con offset70, scroll fino al fondo e X ancora visibile; status/session isolati come fixture nei test di layout. Registrazione/passkey e pubblicazione di una nota verificate separatamente sul server con origine locale esplicita.
