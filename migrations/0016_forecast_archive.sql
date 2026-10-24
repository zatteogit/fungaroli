-- Archivio quotidiano delle previsioni (D1, decisione di Matteo del 16/10/2026): una riga per zona, fascia di quota e
-- giorno di emissione. Valori giornalieri dal giorno prima (D−1) a D+7 del profilo di crescita, nulli conservati come
-- nulli. Solo dati meteo di Open-Meteo (CC BY 4.0): nessun dato personale. La decisione chiamava la migrazione 0005;
-- il numero cambia perché nel frattempo sono arrivate le altre.
CREATE TABLE IF NOT EXISTS forecast_archive (
 zone_id TEXT NOT NULL,
 band INTEGER NOT NULL,
 issued_on TEXT NOT NULL,
 fetched_at INTEGER NOT NULL,
 provider TEXT NOT NULL,
 model TEXT NOT NULL,
 profile TEXT NOT NULL,
 cell_lat REAL,
 cell_lon REAL,
 cell_elevation REAL,
 payload TEXT NOT NULL,
 PRIMARY KEY(zone_id,band,issued_on)
);
CREATE INDEX IF NOT EXISTS forecast_archive_issued ON forecast_archive(issued_on);
