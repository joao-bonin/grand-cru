CREATE TABLE `login_attempts` (
	`key` varchar(64) NOT NULL,
	`attempts` int NOT NULL DEFAULT 1,
	`window_started_at` datetime(3) NOT NULL,
	CONSTRAINT `login_attempts_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`login` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`role` varchar(10) NOT NULL DEFAULT 'user',
	`token_version` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`last_access_at` datetime(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_login_unique` UNIQUE(`login`)
);
