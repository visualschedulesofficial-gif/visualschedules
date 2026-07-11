-- Downloads gain structured filters: which character variant the file shows
-- (neutral / boy / girl / brown) and which language it is in. Bundles act as
-- Category, items as Subcategory.
ALTER TABLE `download_files` ADD COLUMN `character` text;
ALTER TABLE `download_files` ADD COLUMN `language` text;
