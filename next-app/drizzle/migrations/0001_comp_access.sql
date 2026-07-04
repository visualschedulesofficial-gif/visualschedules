-- Adds the expiry column the subscription check already queries.
-- Without this, every subscription lookup errored silently and returned
-- "no subscription" for everyone. Also enables complimentary (comp) access
-- granted from the admin panel to therapists and influencers.
ALTER TABLE `subscriptions` ADD COLUMN `expires_at` text;
