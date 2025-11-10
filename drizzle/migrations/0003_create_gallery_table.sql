CREATE TABLE IF NOT EXISTS `gallery` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL,
  `url` text NOT NULL,
  `key` text NOT NULL,
  `content_type` text,
  `size` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_gallery_v2_slug` ON `gallery` (`slug`);
