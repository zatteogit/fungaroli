-- Consenso alla ricerca (D4, decisioni di Matteo del 16 e del 24/10/2026): separato dalla condivisione, per profilo,
-- spento all'inizio e revocabile. Ogni scelta è una riga: lo stato attuale è l'ultima. Vale solo per le osservazioni
-- condivise (segnalazioni e appunti), mai per gli appunti privati.
CREATE TABLE IF NOT EXISTS research_consents (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 version TEXT NOT NULL,
 granted INTEGER NOT NULL CHECK(granted IN (0,1)),
 recorded_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS research_consents_account ON research_consents(account_id,id);
-- Le osservazioni condivise prima del 24/10 portavano researchConsent:true nella fotografia. Decisione di Matteo:
-- non contano per lo studio finché il profilo non dà il consenso nuovo. Idempotente.
UPDATE shared_observations SET payload=json_remove(payload,'$.researchConsent') WHERE json_valid(payload) AND json_type(payload,'$.researchConsent') IS NOT NULL;
