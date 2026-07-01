-- Visual Schedules — one-time database setup.
-- Paste ALL of this into the Cloudflare D1 "Console" and click Execute.
-- "IF NOT EXISTS" means it is safe to run even if some tables already exist.

CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `name` text,
  `role` text DEFAULT 'user' NOT NULL,
  `created_at` text DEFAULT '(datetime(''now''))' NOT NULL,
  `updated_at` text DEFAULT '(datetime(''now''))' NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);

CREATE TABLE IF NOT EXISTS `cards` (
  `id` text PRIMARY KEY NOT NULL,
  `icon` text DEFAULT 's-star' NOT NULL,
  `category_id` text NOT NULL,
  `status` text DEFAULT 'live' NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` text DEFAULT '(datetime(''now''))' NOT NULL
);

CREATE TABLE IF NOT EXISTS `card_translations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `card_id` text NOT NULL,
  `lang` text NOT NULL,
  `label` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `card_images` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `card_id` text NOT NULL,
  `variant` text NOT NULL,
  `r2_key` text NOT NULL,
  `url` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `categories` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `is_free` integer DEFAULT 0 NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `title` text DEFAULT 'My Schedule' NOT NULL,
  `schedule_type` text DEFAULT 'daily' NOT NULL,
  `language` text DEFAULT 'en' NOT NULL,
  `gender` text DEFAULT 'neutral' NOT NULL,
  `grid_cols` integer DEFAULT 3,
  `custom_col_names` text,
  `week_mode` text DEFAULT 'week',
  `card_style` text DEFAULT 'white',
  `data` text DEFAULT '{}' NOT NULL,
  `created_at` text DEFAULT '(datetime(''now''))' NOT NULL,
  `updated_at` text DEFAULT '(datetime(''now''))' NOT NULL
);

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `type` text NOT NULL,
  `category_id` text,
  `gumroad_license_key` text,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` text DEFAULT '(datetime(''now''))' NOT NULL
);

CREATE TABLE IF NOT EXISTS `app_settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL
);

-- Starter categories so the app isn't empty (you can rename/remove these later in the admin)
INSERT OR IGNORE INTO `categories` (`id`,`name`,`is_free`,`enabled`,`sort_order`) VALUES
 ('daily','Daily',1,1,0),
 ('school','School',0,1,1),
 ('therapy','Therapy',0,1,2),
 ('meals','Meals',0,1,3),
 ('social','Social',0,1,4),
 ('art','Art',0,1,5),
 ('home','Home',0,1,6);
