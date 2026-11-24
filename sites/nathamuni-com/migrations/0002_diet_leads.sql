-- Diet download leads (name + phone). phone is unverified: no OTP.
CREATE TABLE IF NOT EXISTS diet_leads (id TEXT PRIMARY KEY, at TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, file TEXT, ip_hash TEXT, ua TEXT);
CREATE INDEX IF NOT EXISTS diet_leads_at ON diet_leads (at);
