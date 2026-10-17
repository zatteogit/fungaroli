-- Contatori orari anonimi del servizio meteo: nessun dato personale, nessun indirizzo IP.
-- event: served:<hit|stale|miss|stale-fallback|legacy|error> per le risposte all'app,
-- upstream:<ok|429|error|timeout|network|aborted|invalid> per le chiamate a Open-Meteo.
CREATE TABLE IF NOT EXISTS weather_metrics (
  day TEXT NOT NULL, hour INTEGER NOT NULL, profile TEXT NOT NULL, event TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0, locations INTEGER NOT NULL DEFAULT 0, weighted REAL NOT NULL DEFAULT 0,
  timed INTEGER NOT NULL DEFAULT 0, total_ms INTEGER NOT NULL DEFAULT 0, max_ms INTEGER NOT NULL DEFAULT 0,
  under_1s INTEGER NOT NULL DEFAULT 0, under_3s INTEGER NOT NULL DEFAULT 0, under_10s INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, profile, event)
);
