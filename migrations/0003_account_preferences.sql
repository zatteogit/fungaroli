CREATE TABLE IF NOT EXISTS account_preferences (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  base TEXT NOT NULL, updated_at INTEGER NOT NULL
);
