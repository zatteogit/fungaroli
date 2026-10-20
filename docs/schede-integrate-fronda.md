# Schede nell’ecosistema Fronda

20 ottobre 2026. Funghi (schede con modello, commestibili e taxon), piante, alberi e animali condividono il blocco «Nel tuo Fronda», nelle pagine e nelle schede contestuali.

- **Personale:** note legate alla specie e uscite fungine con ritrovamento dichiarato o ricerca esplicitamente a vuoto. I piani non diventano osservazioni. Data, collegamento alla pagina del Taccuino e zona, se indicata. I diversi indirizzi storici della stessa specie sono riconciliati attraverso ID documentati, senza modificare l’archivio privato.
- **Community:** solo i record realmente restituiti al profilo con accesso abilitato. Uscite condivise e osservazioni del Taccuino restano serie separate; non sono sommate perché possono descrivere lo stesso giro. Stesse soglie: tre contributori, due giorni diversi, finestra di sette giorni, zone ampie, revoca dal Taccuino. Nessuna nuova API o modifica alle soglie.
- **Collegamenti:** mappa, glossario, catalogo e confronto o percorso per caratteri pertinente. Funghi/alberi mostrano anche le associazioni esplicite già documentate nel catalogo degli alberi. Non sono segnalazioni di presenza nelle zone.
- **Stati vuoti:** distinguono assenza di note personali, accesso ai dati condivisi e assenza di aggregati pubblicabili. Nessuna assenza di segnalazioni viene descritta come assenza della specie.
- **Aggiornamento:** il blocco segue salvataggio delle note, cambio del profilo, aggiornamento della community e ripristino delle schede contestuali. La creazione di note conserva le categorie strutturate del Taccuino.

`js/fronda-connections.js` centralizza identità, selezione delle osservazioni e presentazione. `tests/fronda-connections.test.mjs` verifica alias, esclusione dei piani e degli zeri non cercati, isolamento per categoria/accesso e serie non sommate.

Nello stesso rilascio: distanza «in linea d’aria» per esteso e simbolo di posizione quando manca il percorso auto; rimozione della didascalia decorativa dei video; controllo Pausa da 44 px; titolo dell’indice contenuto nei badge; collegamento «Apri Fronda» dalla Redazione.
