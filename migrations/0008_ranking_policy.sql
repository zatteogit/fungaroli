CREATE TABLE IF NOT EXISTS ranking_policy (
 id INTEGER PRIMARY KEY CHECK(id=1), max_percent INTEGER NOT NULL CHECK(max_percent BETWEEN 0 AND 10),
 version INTEGER NOT NULL, updated_at INTEGER, updated_by TEXT, reason TEXT NOT NULL, nonce TEXT NOT NULL
);
INSERT INTO ranking_policy VALUES(1,10,0,NULL,NULL,'Limite iniziale del modello','') ON CONFLICT(id) DO NOTHING;
CREATE TABLE IF NOT EXISTS ranking_policy_history (
 version INTEGER PRIMARY KEY, max_percent INTEGER NOT NULL, previous_percent INTEGER NOT NULL,
 updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL, reason TEXT NOT NULL
);
