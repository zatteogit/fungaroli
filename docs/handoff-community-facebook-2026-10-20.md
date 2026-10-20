# Handoff per raccolta Facebook e dati comunitari

La prossima sessione deve riprendere soprattutto la raccolta delle segnalazioni nei gruppi Facebook di funghi di Rieti e Lazio, usando il browser dell’utente. La revisione applicativa è già integrata: non va rifatta né riapplicata.

## Stato GitHub

- Repository: https://github.com/zatteogit/fungaroli
- Produzione: `claude/brave-tesla-wu0a2b`, non `main`.
- PR integrata: https://github.com/zatteogit/fungaroli/pull/154
- Commit di merge applicativo: `8286723e4d9731499b1677d3bb1119562aa11959`.
- Versione shell: `fungaroli-shell-v244`. Avviso legale minimo: versione 6.
- App: https://fungaroli.zatteo.workers.dev. Il merge su produzione avvia la pubblicazione automatica; il risultato del deploy non è stato verificato in questa sessione.
- Leggere `AGENTS.md` e aggiornarsi dal ramo di produzione prima di modificare file. Il documento di dettaglio è `docs/community-ritrovamenti-2026-10-20.md`.

## Richiesta e decisioni di Matteo

Un amico esperto fungarolo ha osservato che l’indice non corrisponde necessariamente alla situazione reale. Matteo vuole distribuire il prototipo a persone che contribuiscano con osservazioni e ritrovamenti effettivi, compresi gli esiti negativi. La reciprocità richiesta è: condivido i miei dati e posso consultare quelli collettivi.

La posizione della fungaia non deve essere rivelata agli altri utenti: solo statistiche su zone più ampie. La condivisione deve restare esplicita, facoltativa e revocabile. L’indice va mantenuto ma declassato, rendendo evidente che non è validato e può non descrivere ciò che si troverà davvero.

Matteo ha anche chiesto espressamente di aprire il suo browser su Facebook, consultare vari gruppi di ritrovamento funghi del Reatino e del Lazio e raccogliere sia dove vengono trovati sia dove vengono cercati senza successo. Ha poi chiesto questo handoff per far proseguire un’altra sessione.

## Revisione già integrata

- Sezione compatta «Dati dal bosco» prima della proposta principale, con conteggi dichiarati e spiegazione della reciprocità.
- API `/api/community/summary` accessibile solo con sessione e almeno una condivisione ancora attiva. Anche una ricerca a vuoto dà accesso; una condivisione non deve necessariamente essere recente. Ritirandole tutte si perde l’accesso alle letture successive. Il resto dell’app resta utilizzabile senza contribuire.
- Aggregati per zona del catalogo e specie su 7 giorni, pubblicati con almeno 3 contributori distinti e 2 giorni diversi. La soglia riprende la guardia esistente in `js/community-signal.js`: è minimizzazione del prototipo, non validazione scientifica o garanzia assoluta di anonimato.
- Nessuna proiezione collettiva di GPS, sentiero, autore, note, identificativi privati o giorno preciso. Le zone del catalogo hanno raggio di riferimento 1,5–5 km. I dati originali restano associati al profilo sul server per gestione e revoca.
- Nessun totale storico o conteggio di gruppi soppressi. Ritrovamenti e ricerche a vuoto sono entrambi visibili. Nessun dato non significa assenza. Le note strutturate restano una serie distinta dai report delle uscite, perché potrebbero descrivere lo stesso evento.
- Logout e cambio account svuotano lo stato client; risposte obsolete non ripristinano dati di un altro account. API escluse dalla cache del service worker.
- Calendario senza punteggio; card e scheda luogo con piccola stima non validata, senza i grandi anelli. Rimossa la duplicazione numerica accanto alla specie principale. Popover più esplicito sui limiti.
- Formula biologica e ordinamento preesistenti restano invariati: è stata declassata la presentazione, non ritarato o validato il modello.
- Informativa aggiornata anche quando arriva uno snapshot CMS precedente. Unica approvazione iniziale di condizioni/privacy/cookie; condivisione distinta e facoltativa.

File principali: `worker/community.js`, `js/community.js`, `js/app.js`, `js/index-tip.js`, `js/legal-notice.js`, `data/legal.json`, `js/notebook-composer.js`, `js/journal.js`, `css/fronda.css`, `index.html`, `sw.js`.

## Facebook da riprendere

**Nessun gruppo o post Facebook è stato consultato. Nessun dato Facebook è stato raccolto o inserito.**

La skill `browser:control-browser` era disponibile, ma mancavano gli strumenti per controllare il browser locale dell’utente. È stata richiesta la connessione tramite domanda asincrona, senza ricevere una risposta prima dell’handoff. Non confondere questa mancanza con un problema di login o permessi dei gruppi: non è stato possibile nemmeno ispezionare le schede.

Nella nuova sessione:

1. Rileggere la skill browser e cercare nuovamente gli strumenti disponibili: la disponibilità può essere diversa. Usare il browser dell’utente, come richiesto; non dichiararlo collegato senza riscontro e non sostituire silenziosamente la sessione con un browser remoto.
2. Se disponibili, inizializzare il runtime e leggere la documentazione come prescritto dalla skill. Consultare Facebook e individuare i gruppi pertinenti a Rieti e Lazio. La richiesta autorizza la lettura e la raccolta, non pubblicazioni, messaggi o richieste di iscrizione.
3. Registrare per ciascuna segnalazione fonte/link, data del post, data dell’osservazione se dichiarata, zona ampia, specie dichiarata, esito positivo o ricerca esplicita a vuoto, eventuale sforzo dichiarato e incertezze. Se la data dell’uscita manca, lasciarla sconosciuta; non sostituirla automaticamente con quella del post.
4. Escludere nomi, coordinate, dettagli che rivelino una fungaia e screenshot identificativi. Riassumere a livello di zona ampia. Non ripubblicare contenuti di gruppi privati come se fossero dati aperti.
5. Deduplicare repost e distinguere osservazione diretta, sentito dire e domande. Un post che non cita funghi non è una ricerca negativa; il silenzio di un gruppo non è assenza. Annotare copertura temporale e limiti del campione.
6. Tenere il campione Facebook separato dai contributi volontari Fronda. Non inserirlo automaticamente negli aggregati reciproci e non usarlo per ritarare coefficienti o trasformare frequenze di post in probabilità.
7. Restituire un primo quadro con segnalazioni positive e negative, fonti, copertura e dati mancanti. Eventuali modifiche alla formula richiedono un metodo esplicito; la raccolta di post, da sola, non la valida.

Se manca ancora lo strumento browser, comunicarlo e chiedere il collegamento senza inventare risultati. Il resto della revisione applicativa è già su GitHub.

## Verifiche e preferenze operative

Matteo ha chiesto di evitare lunghe batterie di test: «Basta con tutti sti test, mergia». In questa revisione sono stati fatti soltanto controlli mirati di sintassi JS, `git diff --check` e compilazione delle tre query su schema SQLite locale. Nessuna suite unitaria/browser, nessun dry-run, nessun accesso alla D1 di produzione e nessuna verifica sul dispositivo iOS.

Non avviare nuove suite o audit lunghi senza una nuova indicazione. Per commit e merge seguire la convenzione recente: trailer `skip-checks: true` separato dal corpo da una riga vuota, così la CI non parte automaticamente. Non cambiare binding Cloudflare dalla dashboard e non esporre segreti.

Conservare le correzioni del 19 ottobre: celle habitat senza categoria forestale verificata escluse, niente cerchio di zona pieno nel dettaglio, infografiche ambigue sospese finché non approvate con etichette visibili. Non riprendere vecchi worktree di agenti immagini come se contenessero lavoro ancora da integrare: la produzione successiva contiene già il materiale confluito.
