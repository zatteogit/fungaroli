CREATE TABLE IF NOT EXISTS external_observations (
 id TEXT PRIMARY KEY,
 source_key TEXT NOT NULL UNIQUE,
 payload TEXT NOT NULL CHECK(json_valid(payload)),
 observed_on TEXT,
 zone_id TEXT,
 taxon_id TEXT,
 outcome TEXT NOT NULL,
 review_status TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL,
 write_nonce TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS external_observations_window ON external_observations(review_status,observed_on,zone_id,taxon_id);
CREATE TABLE IF NOT EXISTS external_observation_history (
 observation_id TEXT NOT NULL,
 version INTEGER NOT NULL,
 payload TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL,
 reason TEXT NOT NULL,
 PRIMARY KEY(observation_id,version)
);
CREATE TABLE IF NOT EXISTS external_observation_imports (
 id TEXT PRIMARY KEY,
 imported_at INTEGER NOT NULL,
 record_count INTEGER NOT NULL
);
