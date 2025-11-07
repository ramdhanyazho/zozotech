CREATE TABLE IF NOT EXISTS `products` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `is_published` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `products_slug_unique` ON `products` (`slug`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_products_slug` ON `products` (`slug`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `gallery_media` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `product_id` integer NOT NULL,
  `slug` text NOT NULL,
  `title` text,
  `caption` text,
  `alt` text,
  `image_url` text NOT NULL,
  `thumb_url` text NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `is_cover` integer DEFAULT 0 NOT NULL,
  `is_published` integer DEFAULT 1 NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_gallery_slug` ON `gallery_media` (`slug`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_gallery_product` ON `gallery_media` (`product_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_gallery_order` ON `gallery_media` (`sort_order`);
