-- Lets the admin mark which categories contain character cards
-- (boy/girl/neutral/brown variants). Categories without characters
-- lock the Character picker to Neutral in the builder.
ALTER TABLE `categories` ADD COLUMN `has_characters` integer DEFAULT 0;
