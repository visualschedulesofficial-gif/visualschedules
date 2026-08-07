-- Paid white-label plan for therapy centers. A paid, unexpired org gets
-- PURE white-label footers (their logo/name only) — no Visual Schedules
-- attribution text and no QR code. Unpaid orgs keep the current hybrid
-- footer (their branding + "Made with visualschedule.app" + QR).
ALTER TABLE orgs ADD COLUMN plan TEXT DEFAULT 'free';        -- 'free' | 'paid'
ALTER TABLE orgs ADD COLUMN plan_expires_at TEXT;             -- null = no active paid plan
