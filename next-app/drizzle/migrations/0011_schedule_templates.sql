-- Admin-curated default schedules — shown to every user under Templates on
-- mobile. A template is just a regular schedule (still owned by the admin
-- who made it) with this flag set; nothing else about the table changes.
ALTER TABLE schedules ADD COLUMN is_template INTEGER NOT NULL DEFAULT 0;
