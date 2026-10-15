# Prompt operativo — declinazione Fronda nell’app Fungaroli

Lavora sul repository `zatteogit/fungaroli` per applicare all’app l’identità **Fronda** approvata da Matteo. L’obiettivo è portare il prodotto esistente nella nuova direzione visiva mantenendone contenuti, dati, funzioni e affidabilità. Implementa e verifica il lavoro: non fermarti a un piano.

## Parti da questi riferimenti

1. Leggi `AGENTS.md`, `docs/handoff-2026-10-14.md` e `docs/handoff-fronda-2026-10-15.md`.
2. Studia `docs/fronda/Fronda-Identita-Design-System.pdf` e apri `docs/fronda/index.html` e `docs/fronda/product.html` nel browser.
3. Usa come fonti di produzione `docs/fronda/tokens.json`, gli SVG in `docs/fronda/assets/`, i font locali e le licenze. Consulta `FONTI-PROGETTO.md` e `VERIFICA.md` per distinguere dati, esempi e limiti.
4. Se lo studio non è ancora unito in produzione, recuperalo dal ramo `codex/fronda-brand-identity` e crea da lì il ramo di implementazione, aggiornandolo con produzione. Non fare merge della PR dello studio senza mandato.
5. Aggiornati dal ramo di produzione `claude/brave-tesla-wu0a2b` e crea un ramo dedicato. Lavora sull’ultima versione dell’app, non sullo snapshot del prototipo.

## Direzione da rispettare

Il nome è **Fronda**. Il marchio scelto è **C / Lobata**: foglia, sentiero in negativo e pennino. Mantieni esattamente i master, senza ridisegnarli, senza aggiungere dentellature o bordi irregolari. Il risultato deve essere naturale, luminoso e leggibile.

Base bosco `#24513D` e avorio `#F7F4EA`, verde profondo `#163D2D` per i dettagli. Usa insieme gli accenti polline `#F5D21F`, calendula `#F5822A`, fiordaliso `#7AA5EF`, germoglio `#A7C957`: uno dominante per composizione, gli altri a supporto. Evita un’app tutta scura o spenta. Mantieni le varianti accessibili e i ruoli semantici dei token; non distribuire colori arbitrari nel CSS. Manrope per interfaccia, Fraunces per titoli editoriali.

## Implementazione richiesta

- Esamina l’app reale e mappa il sistema sulle sue superfici. Riutilizza i moduli esistenti e costruisci componenti condivisi, evitando una seconda app parallela.
- Applica prima le fondazioni e i componenti comuni, poi completa Uscite, zona e mappa; Scopri, cataloghi, confronti, schede, guide e glossario; Taccuino, dialoghi e profilo. Includi anche gli stati di errore, vuoto, caricamento, offline e dati mancanti.
- Porta marchio, icone e metadati visivi alla nuova identità. Conserva dominio, identificatori tecnici, manifest id, storage e dati dell’installazione salvo una migrazione motivata e verificata. Non cambiare infrastruttura o account per il solo cambio di nome.
- Mantieni la gerarchia **funghi → giro → scoperte** e i nomi **Uscite, Scopri, Taccuino**. La home conserva «Dove andare», «Altre buone uscite», «Nei boschi in questi giorni». Guide e glossario stanno in Scopri; la mappa resta nel contesto delle uscite.
- Usa dati, foto, ritagli e contenuti CMS attuali. Il prototipo mostra solo una selezione: non copiare `content.json` sui cataloghi del prodotto, non sostituire servizi reali con dati dimostrativi e non importare il suo taccuino locale.
- Preserva indice sperimentale, calcolo meteo, filtri, routing, passkey, ruoli e condivisione esplicita. Dato assente ≠ zero; zero solo per specie cercate. Il confronto non identifica o certifica commestibilità; mantieni sosia, avvisi, fonti e crediti.
- Le schede contestuali conservano percorso, zona, punto di lettura e focus; la pagina completa usa gli stessi contenuti. Taccuino privato, operazioni distruttive confermate e nessun uso di dati personali reali nei test.

## Verifica e consegna

Verifica nel browser ogni gruppo completato a 320, 390, 768 e almeno 1280 px, temi chiaro/scuro, tastiera, testi lunghi e rete lenta. Controlla contrasti, focus, overflow, dialoghi e persistenza del taccuino usando dati di prova isolati. Esegui i controlli del kit e quelli del repository prescritti da AGENTS; la guardia del kit non copre automaticamente il codice legacy: estendila al perimetro integrato con regole esplicite.

Quando cambi file pubblicati, aggiorna insieme SHELL, meta app-version e PRECACHE secondo AGENTS. Esegui test browser mirati durante il lavoro e la suite completa prima di qualsiasi rilascio, con un solo server su 8788.

Consegna una PR verso `claude/brave-tesla-wu0a2b`, con screenshot desktop/mobile nei due temi, verifiche eseguite, limiti residui e handoff aggiornato. Non fare merge o deploy senza un mandato esplicito: il merge attiva la pubblicazione. Per scelte ordinarie usa il sistema approvato; se emerge una decisione che cambia prodotto, dati o direzione visiva, presenta alternative concrete al proprietario senza riaprire quelle già approvate.
