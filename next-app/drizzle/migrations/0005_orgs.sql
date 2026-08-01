-- Therapy centers (white-label orgs): branding + a shareable access code.
-- Members: emails whose accounts get the org's branding + unlocked access.
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  access_code TEXT UNIQUE,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS org_members (
  email TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
