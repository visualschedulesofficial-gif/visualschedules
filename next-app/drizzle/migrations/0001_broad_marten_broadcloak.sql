CREATE TABLE `otp_codes` (
	`email` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`expires_at` text NOT NULL
);
