CREATE TABLE `watches` (
	`id` text PRIMARY KEY NOT NULL,
	`episode` text NOT NULL,
	`started_at` integer NOT NULL,
	`progress` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `watches_started_at_idx` ON `watches` (`started_at`);