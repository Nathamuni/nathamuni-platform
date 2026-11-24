-- Comment-to-DM notes moved off KV (free KV allows only 1,000 writes/day; D1 allows 100,000).
CREATE TABLE IF NOT EXISTS ig_seen (comment_id TEXT PRIMARY KEY, at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS dm_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, entry TEXT NOT NULL);
