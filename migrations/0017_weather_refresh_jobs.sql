-- Atomic claims for server-owned weather refreshes, no personal data.
CREATE TABLE IF NOT EXISTS weather_refresh_jobs (
  cache_key TEXT PRIMARY KEY,
  last_slot INTEGER NOT NULL,
  lease_until INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  retry_at INTEGER NOT NULL DEFAULT 0
);

-- Compact per-zone records, retaining the original acquisition time.
CREATE TABLE IF NOT EXISTS weather_live_cache (
  cache_key TEXT PRIMARY KEY,
  acquired_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  payload TEXT NOT NULL
);
