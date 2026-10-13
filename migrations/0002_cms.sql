CREATE TABLE IF NOT EXISTS cms_documents (
  id TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0,
  draft TEXT NOT NULL CHECK(json_valid(draft)), published TEXT NOT NULL CHECK(json_valid(published)),
  published_version INTEGER NOT NULL DEFAULT 0, write_nonce TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_revisions (
  document_id TEXT NOT NULL REFERENCES cms_documents(id), version INTEGER NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload)), created_at INTEGER NOT NULL, actor TEXT NOT NULL,
  PRIMARY KEY(document_id,version)
);
CREATE TABLE IF NOT EXISTS cms_releases (
  id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, actor TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '', snapshot TEXT NOT NULL CHECK(json_valid(snapshot))
);
CREATE TABLE IF NOT EXISTS cms_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO cms_meta(key,value) VALUES('release','0') ON CONFLICT(key) DO NOTHING;
CREATE TABLE IF NOT EXISTS cms_agent_tokens (
  id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  scopes TEXT NOT NULL CHECK(json_valid(scopes)), resources TEXT NOT NULL CHECK(json_valid(resources)),
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER, created_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL,
  document_id TEXT, version INTEGER, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
