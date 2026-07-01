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

-- ── Card translations (English + Hindi) ───────────────────────────────────
-- INSERT OR IGNORE means safe to re-run even if translations already exist.

INSERT OR IGNORE INTO `card_translations` (`card_id`, `lang`, `label`) VALUES
-- Daily EN
('wake','en','Wake Up'),
('potty','en','Potty Time'),
('teeth','en','Brush Teeth'),
('bath','en','Bath Time'),
('dress','en','Get Dressed'),
('bfast','en','Breakfast'),
('bag','en','Pack Bag'),
('lunch','en','Lunch'),
('dinner','en','Dinner'),
('play','en','Outdoor Play'),
('quiet','en','Quiet Time'),
('sleep','en','Sleep'),
('story','en','Bedtime Story'),
-- Daily HI
('wake','hi','उठना'),
('potty','hi','शौचालय'),
('teeth','hi','दाँत साफ करो'),
('bath','hi','नहाना'),
('dress','hi','कपड़े पहनो'),
('bfast','hi','नाश्ता'),
('bag','hi','बैग तैयार करो'),
('lunch','hi','दोपहर का खाना'),
('dinner','hi','रात का खाना'),
('play','hi','बाहर खेलो'),
('quiet','hi','शांत समय'),
('sleep','hi','सोना'),
('story','hi','सोने की कहानी'),
-- School EN
('sbus','en','School Bus'),
('assm','en','Assembly'),
('class','en','Class Work'),
('pt','en','PT and Break'),
('lib','en','Library'),
('hw','en','Homework'),
-- School HI
('sbus','hi','स्कूल बस'),
('assm','hi','प्रार्थना'),
('class','hi','कक्षा कार्य'),
('pt','hi','खेल और छुट्टी'),
('lib','hi','पुस्तकालय'),
('hw','hi','गृहकार्य'),
-- Therapy EN
('ot','en','OT Session'),
('speech','en','Speech Therapy'),
('calm','en','Calm Down'),
('sbreak','en','Sensory Break'),
-- Therapy HI
('ot','hi','OT सत्र'),
('speech','hi','स्पीच थेरेपी'),
('calm','hi','शांत हो जाओ'),
('sbreak','hi','संवेदी विराम'),
-- Meals EN
('snack','en','Snack Time'),
('water','en','Drink Water'),
('cook','en','Help Cook'),
('table','en','Lay the Table'),
-- Meals HI
('snack','hi','नाश्ते का समय'),
('water','hi','पानी पीना'),
('cook','hi','खाना बनाने में मदद'),
('table','hi','मेज लगाना'),
-- Social EN
('share','en','Share and Take Turns'),
('feelings','en','Name My Feelings'),
('greet','en','Say Hello'),
('wait','en','Wait My Turn'),
-- Social HI
('share','hi','बारी-बारी लो'),
('feelings','hi','अपनी भावनाएँ बताओ'),
('greet','hi','नमस्ते कहो'),
('wait','hi','बारी का इंतज़ार'),
-- Art EN
('draw','en','Drawing'),
('music','en','Music Time'),
('dance','en','Dance and Move'),
('craft','en','Craft Time'),
-- Art HI
('draw','hi','चित्रकारी'),
('music','hi','संगीत समय'),
('dance','hi','नृत्य और हलचल'),
('craft','hi','हस्तकला'),
-- Home EN
('tidy','en','Tidy Up'),
('garden','en','Gardening'),
('pet','en','Feed Pet'),
('laundry','en','Put Away Clothes'),
-- Home HI
('tidy','hi','सफाई करो'),
('garden','hi','बागवानी'),
('pet','hi','पालतू को खाना दो'),
('laundry','hi','कपड़े रखो');
