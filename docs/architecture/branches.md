# Branch e flussi di lavoro

| Branch | Responsabilità |
|---|---|
| `codex/fronda-foundation` | Base comune, contratti, ambienti e primo refactoring |
| `codex/fronda-consumer` | Free/Plus: apprendimento individuale, progressi e valore del prodotto |
| `codex/fronda-academy` | Gruppi, percorsi assegnati e revisione dei contenuti |
| `codex/fronda-territory` | Pacchetti territoriali, contenuti locali e personalizzazione degli enti |
| `codex/fronda-partners` | Attribuzione dei contributi, contenuti sponsorizzati dichiarati |

I quattro rami delle offerte nascono dalla stessa fondazione verificata. Sono punti di partenza,
non quattro fork permanenti né quattro offerte già sviluppate. Non si crea un branch per ogni
combinazione prodotto × piattaforma × ambiente. Correzioni comuni e nuovi componenti vanno nella
base; il lavoro di un’offerta contiene soltanto il modulo o la composizione specifica.

La produzione resta `claude/brave-tesla-wu0a2b`. Durante questa fase si possono proporre PR delle
singole offerte verso `codex/fronda-foundation`; la consegna della base viene proposta verso il
ramo storico. Dopo l’integrazione della fondazione, riallineare i rami di lavoro alla produzione
prima di sviluppare. Non usare la base come un secondo ramo di produzione permanente.

## Per aprire una fetta

1. Aggiornare il riferimento autorevole e controllare modifiche locali, PR e registro ipotesi.
2. Creare un ramo breve dal punto condiviso più recente. Dichiarare il modulo e il criterio di uscita.
3. Verificare che una funzione o un componente comune non esistano già.
4. Implementare codice, stati e testi nello stesso cambiamento. Estendere la base quando serve.
5. Eseguire verifiche proporzionate, aggiornare documentazione e mostrare la PR.
6. Integrare soltanto dopo la valutazione prevista da AGENTS e la decisione del proprietario.

I prezzi e i limiti degli abbonamenti non sono inseriti nelle condizioni della UI. I profili di
composizione non autorizzano un utente e non sostituiscono controlli server. Gli accessi per gruppi
e territori richiedono isolamento verificato; uno `organizationId` dal browser non prova appartenenza.

## Design nelle offerte

Ogni ramo usa i contratti in `design-system/`. Nessuna copia di token, CSS comuni o componenti.
Una variante deve dichiarare scopo, differenza necessaria, stati, compatibilità e test. Una funzione
utile a più offerte torna nella base. Richieste di cambiare CTA, rischio, privacy o navigazione
primaria si risolvono come decisioni comuni, non con override locali nascosti.
