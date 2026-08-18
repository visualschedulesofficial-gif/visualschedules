-- Read-only. Changes nothing. Prints what's actually in the database so we can
-- see why a completed payment didn't unlock the paid cards.

-- 1. Every subscription recorded (is the payment there at all?)
SELECT 'SUBSCRIPTIONS' AS section;
SELECT id, user_id, type, status, created_at, expires_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 20;

-- 2. Recent accounts (which user id is yours?)
SELECT 'USERS' AS section;
SELECT id, email, role, created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- 3. Does each subscription actually match a real account?
--    If email comes back empty, the payment was recorded against a different
--    identity than the one being signed in with.
SELECT 'SUBSCRIPTIONS JOINED TO USERS' AS section;
SELECT s.id, s.user_id, s.status, s.expires_at, u.email
FROM subscriptions s
LEFT JOIN users u ON u.id = s.user_id
ORDER BY s.created_at DESC
LIMIT 20;
