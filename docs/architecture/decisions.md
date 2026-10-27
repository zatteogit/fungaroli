# Registro delle decisioni architetturali

Data: 27 ottobre 2026. Perimetro autorizzato: preparare fondazione, rami, ambienti e sistema di
esperienza/design/linguaggio; documentare. Non include rilascio online o attivazione commerciale.

## A01 · Un prodotto modulare nello stesso repository

Scelta: nucleo e componenti comuni, offerte come composizioni. I branch servono per sviluppare,
non per mantenere copie divergenti. Scartati fork permanenti per cliente e una riscrittura totale.
Conseguenza: una correzione comune raggiunge tutte le offerte; le estensioni hanno confini espliciti.
I profili iniziali sono proposte tecniche, non un listino o un catalogo di funzionalità contrattuale.

## A02 · Estrazione incrementale con compatibilità

Scelta: iniziare dalle regole delle osservazioni, mantenendo ingressi e protocolli. Nessun nuovo
framework. La compilazione del nucleo usa solo ES2022; import e output sono verificati.
Conseguenza: una fetta reale è riutilizzabile e verificabile ora. Non promette un’app nativa completa.
Il controllo degli import usa lo scanner TypeScript 7 fissato: un aggiornamento richiede test delle
sonde negative. Non si sostituisce il compilatore con una serie di espressioni regolari.

## A03 · Configurazioni separate e nessuna eredità delle risorse

Scelta: generazione per elenco ammesso, nomi distinti, risorse simulate e cron disabilitati.
Il file produttivo resta invariato. Scartati riuso dei DB reali e deploy di branch collegati a questi.
Conseguenza: prove locali ripetibili, attivazione remota esplicita con risorse e accessi verificati.

## A04 · Una demo della fondazione indipendente

Scelta: Worker e asset minimi dedicati, dati sintetici, letture soltanto, nessun backend dell’app.
Scartato travestire la produzione da demo con un flag nel browser.
Conseguenza: una dimostrazione verificabile dell’architettura; la demo completa dei flussi commerciali
è un lavoro successivo e non va dichiarata disponibile adesso.

## A05 · Design e linguaggio come contratti condivisi

Scelta: mantenere `css/tokens.css` come fonte corrente dei colori, rendere esplicito che il kit storico
non sovrascrive le revisioni successive; esportare i valori e aggiungere scale e contratti separati.
Le nuove superfici consumano i token. Il legacy mantiene il guard a debito decrescente già presente.
Conseguenza: nessuna regressione stilistica imposta all’app; le offerte estendono accenti editoriali,
contenuti e percorsi senza cambiare significati di azione, selezione, rischio e privacy.

## A06 · Non attivare il modello economico nel refactoring

Scelta: profili e roadmap senza prezzi, checkout, paywall o cambi ai diritti degli utenti esistenti.
Sicurezza essenziale sempre parte della composizione. MycoTrace rimane distinto.
Conseguenza: si può lavorare sulle offerte senza trasformare un’ipotesi economica in comportamento
pubblicato o presumere disponibilità di partner, diritti commerciali e contenuti revisionati.
