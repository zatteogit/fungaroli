---
name: kipi
description: Inizializza e mantiene la knowledge base dell'intero repository Fungaroli, con comandi init, scan, process, update e status. Usa per documentazione tecnica verificabile in knowledge/core_knowledge/.
---

# Kipi · Fungaroli

## Ambito e fonti
Lavora dalla radice del repository Fungaroli, identificata da `package.json` (name `fungaroli`), `js/`, `worker/` e `data/`. Il nome della cartella di checkout può essere diverso. Copri tutto il repository, inclusi modelli, interfaccia, dati, backend, test, strumenti e asset. Non richiedere `src/`, NuTree o BMAD: questa è l'installazione locale adattata a Fungaroli.

Leggi `AGENTS.md`, `docs/handoff-2026-10-14.md`, poi `knowledge/core_knowledge/index.md` e `knowledge/workflow-state.json` prima di scrivere. Usa le guide esistenti come riferimenti e controlla il codice effettivo per le affermazioni tecniche. Non prendere lo stato di questo checkout come prova dello stato in produzione o di altri rami.

## Regole
- Scrivi in italiano naturale con accenti corretti. Annuncia brevemente le modifiche prima di applicarle.
- Mantieni percorsi e riferimenti verificabili. Separa comportamento osservato, decisioni documentate e ipotesi; non inventare metriche o risultati di test.
- Conserva le regole di prodotto: funghi → giro → scoperte; indice sperimentale, non probabilità; nessuna certificazione di identificazione o commestibilità.
- Non modificare codice, contenuti pubblicati o asset per il solo aggiornamento della knowledge base. Non avviare generazioni o pubblicazioni con i comandi Kipi.
- I capitoli inizializzati restano `pending` finché non sono stati analizzati. La copertura dei capitoli è completi/totali, distinta dalla copertura dei file e dei test.
- Non leggere segreti né inserirli nella documentazione. Non usare `.git/`, dipendenze installate, bundle vendor o output generati come corpus del codice sorgente; documenta invece le pipeline e i manifest pertinenti.

## Comandi
### init
Inventaria la struttura reale senza assumere `src/`. Crea o riallinea indice, stato e capitoli coerenti con il codice. Conserva documentazione e stati esistenti; non segnare come completi i capitoli solo predisposti.

### scan [capitolo]
Senza capitolo, mostra quelli pendenti e suggerisci il prossimo. Con capitolo, leggi tutti i sorgenti pertinenti e i relativi test; i `source_paths` nello stato sono punti di partenza, non un limite alla scansione. Documenta scopo, file chiave, flusso dati, funzioni, configurazione, guard rail e bug/fix con evidenza. Scrivi `knowledge/core_knowledge/<capitolo>/README.md`; aggiorna indice e stato con i file realmente letti e gli eventuali limiti. Se restano lacune usa `partial`, non `complete`.

### process
Leggi l'inbox canonica `raw_data/`, con fallback `user-data/` e poi `knowledge/raw_data/`. Se sono assenti, segnalalo senza trattare automaticamente `incoming/` o `inbox/` dell'app come inbox Kipi. Classifica, estrai e integra nei capitoli; archivia gli originali in `raw_data/processed/` senza sovrascritture e gli intermedi in `ready-for-classify/` quando servono. Mantieni la provenienza.

### update
Controlla modifiche del codice rispetto alla baseline salvata e i file modificati/non tracciati pertinenti. Se manca la baseline, dichiaralo e usa un inventario. Aggiorna solo i capitoli impattati. Non assumere che Git diff vuoto provi la completezza della documentazione. Registra una nuova baseline soltanto per il perimetro effettivamente verificato.

### status
Leggi indice e stato; riporta capitoli completi, parziali e pendenti, copertura dei capitoli, ultimo capitolo lavorato e prossimo scan. Non trasformare contatori di capitoli in percentuale di codice documentato.

## Capitoli e stato
Lo stato contiene progetto, data, commit di inizializzazione, percorsi sorgente, capitoli con ID/titolo/stato/file documentati e baseline opzionale per capitolo. Mantieni indice e JSON coerenti. Nel README di ogni capitolo usa: Sommario; File chiave; Flusso dati; Funzioni principali; Costanti e configurazione; Guard rail e vincoli; Bug noti e fix. Aggiungi data, stato, percorsi realmente documentati e limiti di verifica.

Quando rilevi codice cambiato che può invalidare la knowledge base, segnala: «Le modifiche al codice potrebbero aver reso obsoleta la documentazione. Esegui kipi update.»
