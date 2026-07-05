-- Downloads library: bundles (e.g. "Morning Schedule") contain items
-- (e.g. "Brushing Teeth"), each with downloadable variant files
-- (girl / boy / mini / english ...). Plus blog posts with SEO fields.

CREATE TABLE IF NOT EXISTS `download_bundles` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `sort_order` integer DEFAULT 0,
  `enabled` integer DEFAULT 1,
  `created_at` text DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `download_items` (
  `id` text PRIMARY KEY NOT NULL,
  `bundle_id` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `sort_order` integer DEFAULT 0,
  `enabled` integer DEFAULT 1,
  `created_at` text DEFAULT (datetime('now')),
  FOREIGN KEY (`bundle_id`) REFERENCES `download_bundles`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `download_files` (
  `id` text PRIMARY KEY NOT NULL,
  `item_id` text NOT NULL,
  `variant` text NOT NULL,
  `label` text,
  `file_url` text NOT NULL,
  `preview_url` text,
  `sort_order` integer DEFAULT 0,
  `created_at` text DEFAULT (datetime('now')),
  FOREIGN KEY (`item_id`) REFERENCES `download_items`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  `meta_description` text,
  `keywords` text,
  `cover_url` text,
  `content` text NOT NULL DEFAULT '',
  `status` text NOT NULL DEFAULT 'draft',
  `published_at` text,
  `created_at` text DEFAULT (datetime('now')),
  `updated_at` text DEFAULT (datetime('now'))
);
