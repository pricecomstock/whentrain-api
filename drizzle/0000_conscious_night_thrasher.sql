CREATE TABLE `apiKeys` (
	`id` integer PRIMARY KEY NOT NULL,
	`short_token` text NOT NULL,
	`long_token_hash` text NOT NULL,
	`role` text DEFAULT 'free' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apiKeys_short_token_unique` ON `apiKeys` (`short_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `short_token_index` ON `apiKeys` (`short_token`);