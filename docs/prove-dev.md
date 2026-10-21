# Prove pubblicate

La cartella `dev/` è pubblicata dal normale deploy Cloudflare:
https://fungaroli.zatteo.workers.dev/dev/.

Contiene prototipi consultabili, distinti dalle funzioni disponibili nell’app.
L’indice è `dev/index.html`; la prima prova è `dev/preferiti.html`, con lo
studio in [ux-preferiti.md](ux-preferiti.md). La pubblicazione dello studio
non implementa persistenza o sincronizzazione dei Preferiti nell’app.

Per aggiungere una prova, inserire un HTML in `dev/` e collegarlo dall’indice,
indicando stato e limiti. Usare percorsi assoluti per CSS, moduli e immagini
condivisi. Non duplicare i file in `docs/`, che resta esclusa dalla pubblicazione.

Questo spazio è pubblico, senza autenticazione. Non inserire dati personali,
credenziali o copie di appunti reali. Le prove usano dati di esempio e non
scrivono nelle API personali. I riferimenti ai contenuti di catalogo mantengono
accessibili i crediti delle foto.

`_headers` richiede ai motori di non indicizzare `/dev` e `/dev/*` e disabilita
la cache HTTP delle prove. Il service worker lascia questi percorsi alla rete:
non li memorizza e non restituisce l’app come ripiego offline.

La cartella viene pubblicata insieme al ramo `claude/brave-tesla-wu0a2b`;
non richiede nuovi binding né modifiche manuali in Cloudflare.
