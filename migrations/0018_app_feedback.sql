CREATE TABLE IF NOT EXISTS app_feedback (
 id TEXT PRIMARY KEY,
 type TEXT NOT NULL CHECK(type IN ('commento','problema','idea')),
 message TEXT NOT NULL,
 context TEXT,
 submission_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read'))
);
CREATE INDEX IF NOT EXISTS app_feedback_created ON app_feedback(created_at DESC,id);
CREATE TABLE IF NOT EXISTS feedback_rate (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS feedback_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL);
