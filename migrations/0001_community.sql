PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS community_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY, handle TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL, counter INTEGER NOT NULL DEFAULT 0, transports TEXT NOT NULL DEFAULT '[]',
  backed_up INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS passkeys_account ON passkeys(account_id);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id);
CREATE TABLE IF NOT EXISTS challenges (
  token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, challenge TEXT NOT NULL,
  account_id TEXT, handle TEXT, origin TEXT NOT NULL, rp_id TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS diary_entries (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, id TEXT NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload)), saved_at INTEGER NOT NULL,
  PRIMARY KEY(account_id, id)
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL, day TEXT NOT NULL, zone_id TEXT NOT NULL, species_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount BETWEEN 0 AND 3), searched INTEGER NOT NULL CHECK(searched IN (0,1)),
  identification_checked INTEGER NOT NULL DEFAULT 0 CHECK(identification_checked IN (0,1)),
  validation_context TEXT CHECK(validation_context IS NULL OR json_valid(validation_context)),
  created_at INTEGER NOT NULL,
  UNIQUE(account_id, day, zone_id, species_id),
  FOREIGN KEY(account_id, entry_id) REFERENCES diary_entries(account_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS reports_recent ON reports(day, zone_id, species_id);
CREATE INDEX IF NOT EXISTS reports_account ON reports(account_id, created_at);
INSERT INTO community_meta(key, value) VALUES('schema_version', '1') ON CONFLICT(key) DO NOTHING;
