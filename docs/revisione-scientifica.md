# Revisione scientifica e modifiche del 13 ottobre 2026

La revisione ha esaminato il commit `c39718b135999d2e2e7bd3e97a00e7d8d46d304a`: modello, meteo, boschi, classifiche, cartografia, diario, riconoscimento, alberi, preparazione e bibliografia. La base ecologica è plausibile, ma mancavano dati per misurare la capacità di prevedere ritrovamenti nel Reatino. Nessuna modifica al software può sostituire una validazione sul campo.

## Interventi

| Ambito | Problema rilevato | Modifica e limite residuo |
|---|---|---|
| Comunicazione | Percentuali e classi suggerivano probabilità di ritrovamento | Indice sperimentale 0–10, con un decimale; condizioni di crescita, senza promessa di quantità o trovabilità |
| Aggregazione | Specie simili facevano aumentare automaticamente il punteggio | Massimo dei valori calcolabili; aggiungere taxa identici non aumenta il risultato |
| Incertezza | “Confidence” euristica, anche 100% con dati mancanti | Rimossa; completezza delle finestre, timestamp, previsioni e numero di campioni. Nessuna percentuale di accuratezza |
| Meteo | Null convertiti in zero; dati scaduti presentati come attuali | Dati mancanti conservati, finestre complete obbligatorie, acquisizione originale e scadenza; nessun indice per oggi/futuro da forecast scaduto |
| Stagione | Interpolazione su mesi artificialmente uguali | Continuità sulle vere date centrali dei mesi; pesi biologici ancora euristici |
| Habitat | Campioni assenti confusi con habitat inadatto; celle di dimensione errata | Distinzione tra assenza di campioni e zero reale, griglia coerente col raggio; campioni correlati e categorie ampie non identificano fungaie |
| Classifica | Preferenze mescolate all’indice biologico | Accesso, meteo, folla e comunità modificano l’ordine dei consigli; il numero ambientale rimane separato |
| Passeggiata | Meteo incompleto interpretato come favorevole; distanze ambigue | Stato non disponibile, cache limitata, distanza in linea d’aria esplicita. Il percorso richiede verifica locale |
| Diario | Qualunque specie trovata “confermava” la previsione; ricostruzioni retrospettive contate come previsioni | Specie cercate, zeri espliciti, sforzo facoltativo, piani immutabili con input e versione; confronti prospettici per specie. Orari e ritrovamenti restano dichiarati |
| Riconoscimento | Due risposte errate eliminavano taxa mortali | Mortali sempre conservati e richiamo indipendente dai filtri; eliminati assaggi suggeriti. Catalogo incompleto, nessuna identificazione certificata |
| Preparazione | Durata uguale per tutti, prudenza descritta come norma, istruzioni per conserve incomplete | Trattamenti per specie, distinzione delle indicazioni, rinvio ai protocolli ISS completi. Aggiornata la discussione su Tricholoma terreum; nessuna dose universale sicura |
| Fonti | Trasferibilità dello studio su edulis sovrastimata | Separazione tra letteratura, dato cartografico e coefficienti euristici; nessuna taratura inventata |
| Comunità | Nessun dato iniziale e rischio di conteggi ingannevoli | Stato iniziale esplicito, quantità ordinali dichiarate, deduplicazione, ritiro e soglie minime prima dell’influenza sulle priorità. Un account non prova l’indipendenza dell’osservatore |

## Verifiche

40 test Node verificano comportamenti e casi limite: null, forecast scaduti, scala, aggregazione, calendario, diario e riconoscimento. Sei scenari browser su Worker e D1 locali verificano passkey reali tramite autenticatore virtuale, isolamento fra profili, protezione dell’origine e contro riuso delle sfide, note private, duplicati, ritiro, cancellazione, immutabilità dei piani e flusso rapido su telefono e accessibilità dei contenuti senza meteo, migrazione del vecchio diario e visualizzazione sicura dei campi importati. Il bundle Worker è compilato con Wrangler in dry-run; le dipendenze di produzione non presentavano vulnerabilità note all’audit npm eseguito.

Queste verifiche provano il comportamento del software nei casi coperti, non l’accuratezza biologica o l’assenza di qualsiasi vulnerabilità. Per una validazione servono uscite prospettiche, controllo delle identificazioni, dati dello sforzo e un insieme indipendente per la verifica. Il piano è in [metodo-scientifico.md](metodo-scientifico.md); servizi e privacy in [community.md](community.md).

## Pubblicazione

Deploy Cloudflare riuscito il 13 ottobre 2026, PR [#2](https://github.com/zatteogit/fungaroli/pull/2), versione Worker `0b81af66-eb8c-4b4f-a524-0cdd7183a4f4`. D1 attivo: status `enabled:true`, summary iniziale senza segnalazioni, diario non autenticato 401, file server/config non pubblicati (404). Verificati sul dominio pubblico registrazione passkey, sessione, sincronizzazione di una voce privata, eliminazione del profilo tecnico e revoca della sessione. Nessuna osservazione dimostrativa condivisa.
