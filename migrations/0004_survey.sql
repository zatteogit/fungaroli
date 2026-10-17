-- Questionario per i cercatori esperti (worker/survey.js), nel database COMMUNITY_DB.
-- Migrazione idempotente applicata al primo accesso all'API, come 0001 e 0003.
-- Nessun IP: survey_rate conserva solo un hash giornaliero, cancellato entro il terzo giorno.
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY, survey TEXT NOT NULL, version INTEGER NOT NULL, receipt TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL, duration_s INTEGER,
  name TEXT, contact TEXT,
  consent_recontact INTEGER NOT NULL DEFAULT 0 CHECK(consent_recontact IN (0,1)),
  consent_diary INTEGER NOT NULL DEFAULT 0 CHECK(consent_diary IN (0,1)),
  answers TEXT NOT NULL CHECK(json_valid(answers))
);
CREATE INDEX IF NOT EXISTS survey_responses_recent ON survey_responses(survey, created_at);
CREATE TABLE IF NOT EXISTS survey_rate (key TEXT PRIMARY KEY, day TEXT NOT NULL, count INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS survey_rate_day ON survey_rate(day);
-- Stessa definizione di 0001: qui sta il sale privato dell'hash giornaliero (chiave survey_ip_salt).
CREATE TABLE IF NOT EXISTS community_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
