-- Every successful access-code entry, one row each — gives per-center
-- usage counts, uniques (by device hash), and a usage-over-time trail.
CREATE TABLE IF NOT EXISTS org_redemptions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  device_hash TEXT,
  redeemed_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_org_redemptions_org ON org_redemptions(org_id);
