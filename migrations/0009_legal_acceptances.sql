CREATE TABLE IF NOT EXISTS legal_acceptances (
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 version TEXT NOT NULL,
 notice_hash TEXT NOT NULL,
 accepted_at TEXT,
 recorded_at INTEGER NOT NULL,
 source TEXT NOT NULL CHECK(source IN ('explicit','legacy')),
 platform TEXT NOT NULL CHECK(platform IN ('browser','standalone')),
 PRIMARY KEY(account_id,version,notice_hash)
);
