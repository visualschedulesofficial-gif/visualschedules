-- Seed admin user for Visual Schedules
-- Run: make db-seed-admin
-- Password: admin123$ (hashed via better-auth at first login)
-- For now, insert directly — better-auth will manage the session

INSERT OR IGNORE INTO users (id, email, name, role, created_at, updated_at)
VALUES ('admin-001', 'admin@dataorc.in', 'Admin', 'admin', datetime('now'), datetime('now'));
