CREATE TABLE IF NOT EXISTS external_sources (
 id TEXT PRIMARY KEY,
 source_key TEXT NOT NULL UNIQUE,
 payload TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL,
 nonce TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS external_source_history (
 source_id TEXT NOT NULL,
 version INTEGER NOT NULL,
 payload TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL,
 reason TEXT NOT NULL,
 PRIMARY KEY(source_id,version)
);
