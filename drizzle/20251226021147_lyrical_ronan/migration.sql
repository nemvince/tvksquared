CREATE TABLE `article_file` (
	`article_id` text NOT NULL,
	`file_id` text NOT NULL,
	CONSTRAINT `fk_article_file_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_article_file_file_id_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `file`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` text PRIMARY KEY,
	`mime_type` text NOT NULL,
	`name` text NOT NULL,
	`extension` text,
	`size` integer NOT NULL,
	`uploaded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `articleFile_articleId_idx` ON `article_file` (`article_id`);--> statement-breakpoint
CREATE INDEX `articleFile_fileId_idx` ON `article_file` (`file_id`);--> statement-breakpoint
CREATE INDEX `articleFile_unique_idx` ON `article_file` (`article_id`,`file_id`);