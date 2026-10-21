CREATE TABLE IF NOT EXISTS shared_observations (
 account_id TEXT NOT NULL, entry_id TEXT NOT NULL, day TEXT NOT NULL, zone_id TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('fungo','botanica','albero')), taxon_id TEXT NOT NULL,
 payload TEXT NOT NULL CHECK(json_valid(payload)), consent_version TEXT NOT NULL, consented_at INTEGER NOT NULL,
 PRIMARY KEY(account_id,entry_id),
 FOREIGN KEY(account_id,entry_id) REFERENCES diary_entries(account_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS shared_observations_recent ON shared_observations(day,zone_id,category,taxon_id);
