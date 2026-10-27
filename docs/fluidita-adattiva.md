# Fluidità adattiva

La qualità decorativa parte completa e si adatta alle interazioni osservate,
senza classificare il telefono dal nome del sistema operativo o dai core.
La politica è in `src/js/adaptive-effects.ts`; l’output è compilato in `js/`.

Si campionano gli intervalli fra frame solo durante scroll, rotella, pressione
o tastiera e per 1,4 secondi dopo l’ultimo input. Non si leggono campi, contenuti
o identificatori hardware. Non ci sono invii, storage persistente o nuovi permessi.
La misura si ferma a riposo, in background e quando la pagina viene sospesa.
L’avvio ha 1,5 secondi di assestamento. Il ritorno da una scheda nascosta e il
ridimensionamento scartano le prove transitorie; la qualità scelta resta.

La cadenza viene stimata dai frame più rapidi osservati: 30 Hz stabili non
vengono confusi con un dispositivo lento. Le soglie sono euristiche di prodotto,
non un punteggio del dispositivo o una misura dei Core Web Vitals. In finestre
di almeno un secondo, con almeno otto intervalli validi, si considerano la
quota di frame lenti, il tempo eccedente il budget stimato e una mediana
costantemente sopra 38 ms. Servono due finestre
sfavorevoli consecutive per scendere di un livello. Il recupero richiede dodici
finestre pulite e almeno trenta secondi dall’ultimo cambiamento, un livello alla volta.

| Livello | Effetti |
| --- | --- |
| Completo | Resa attuale, aloni, vetro, video e transizioni della pagina |
| Ridotto | Alone con blur 28 px, vetro 6 px, still al posto dei video; niente snapshot della pagina o conteggi decorativi |
| Minimo | Alone rimosso anche dal DOM, superfici opache nei controlli su foto e nella dock; foto, contenuti e azioni restano |

Il centro della navigazione, i morph della dock, i gesti, lo zoom delle foto,
il focus e gli stati dei comandi non dipendono dal livello. Non si alterano
contenuti, punteggi, dati o posizione di lettura. Il loader rimane un feedback
di stato. Non c’è attualmente un parallasse legato allo scroll da ridurre:
non ne viene aggiunto uno per questa modifica.

«Riduci movimento», «Riduci trasparenza» e risparmio dati continuano a prevalere.
Gli aloni non decodificano nuove copie al livello minimo; una risposta di decode
in ritardo non può reinserirli. Il ritorno a un livello superiore ricostruisce
solo gli aloni visibili. I video rispettano anche la pausa esplicita dell’utente.

Riferimenti delle API: [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
La verifica locale con CPU rallentata e carico sintetico serve a controllare
la reazione della politica, non dimostra un guadagno percentuale su tutti i device.
