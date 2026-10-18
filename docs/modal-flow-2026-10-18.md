# Un solo pannello modale

La scheda contestuale poteva restare aperta dietro al compositore del taccuino, al glossario o al visore. Due intestazioni e due backdrop facevano sembrare l’azione un altro strato da gestire, soprattutto con la tastiera aperta.

Tutte le aperture pubbliche e del CMS passano ora da `openModal()` in `js/modal-flow.js`. Il pannello precedente viene chiuso e conservato nel DOM, il nuovo diventa l’unico dialog modale aperto. Non si nasconde semplicemente un altro dialog ancora modale: l’elemento precedente è realmente chiuso. Il coordinatore consuma il solo evento nativo di questa sospensione, affinché i listener di chiusura, inclusi quelli `once`, non distruggano il contenuto né risolvano in anticipo i passaggi asincroni.

La freccia nell’intestazione e Escape tornano al passaggio precedente. Tornare ripristina lo stesso DOM, i valori dei moduli, lo scroll e il controllo di origine. La X esce dall’intero percorso ed esegue i cleanup conservati; un cambio di rotta elimina i passaggi senza farli ricomparire. Salvare una nota completa l’azione e riporta alla scheda. Le precedenti pile di frame interne alla scheda rimangono: quando il suo Indietro interno è disponibile, non si mostra una seconda freccia del coordinatore.

I singleton riaperti da un passaggio discendente non creano cicli: ad esempio la scheda richiamata dal glossario torna attiva, conservando la propria navigazione interna. Il visore eventualmente annidato nel DOM del glossario viene temporaneamente separato dal contenitore che sta per chiudersi, poi ricollocato. Altrimenti il browser nasconderebbe anche il visore aperto come discendente di un dialog chiuso.

Durante sospensione e ritorno non rimangono visibili vecchi pannelli o backdrop per le transizioni discrete di `display`/`overlay`. Il blocco dello scroll resta attivo durante il cambio di passo; la gestione del visual viewport della tastiera continua ad agire sul solo pannello attivo. I popover non modali rimangono spiegazioni ancorate nel loro contesto.

Verifiche mirate:

- Percorso reale scheda → taccuino a 320/390 px: un solo dialog modale, ritorno allo stesso nodo DOM, scroll e focus; salvataggio e uscita con X.
- Tre passaggi: bozze conservate, listener `once` non consumati alla sospensione, Escape, riapertura di un singleton e pulizia al cambio di rotta.
- Tastiera simulata sia nel taccuino sia partendo da una scheda: riduzione/spostamento del visual viewport, campo e lista contenuti, nessuna seconda modale aperta.
- Percorsi esistenti di schede, glossario, foto e taccuino su mobile e desktop; prova visiva con animazioni attive.
- Accesso con passkey e nota condivisa verificati su server di test con `APP_ORIGIN` locale esplicito. Il server usato per le anteprime manteneva l’origine di produzione, quindi quel controllo inizialmente veniva respinto per origine non autorizzata, senza relazione con il coordinatore.

La verifica della tastiera nativa Safari richiede un iPhone fisico; la simulazione automatica copre geometria e gestione del visual viewport.
