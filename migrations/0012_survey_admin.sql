CREATE TABLE IF NOT EXISTS survey_admin_meta (
 response_id TEXT PRIMARY KEY,
 revision INTEGER NOT NULL DEFAULT 0,
 mode TEXT NOT NULL DEFAULT 'public',
 collected_on TEXT,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL,
 reason TEXT NOT NULL,
 nonce TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS survey_response_history (
 response_id TEXT NOT NULL,
 revision INTEGER NOT NULL,
 answers TEXT NOT NULL,
 mode TEXT NOT NULL,
 collected_on TEXT,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL,
 reason TEXT NOT NULL,
 PRIMARY KEY(response_id,revision)
);
CREATE TRIGGER IF NOT EXISTS survey_admin_after_delete AFTER DELETE ON survey_responses BEGIN
 DELETE FROM survey_response_history WHERE response_id=OLD.id;
 DELETE FROM survey_admin_meta WHERE response_id=OLD.id;
END;
