-- View tracking so the blog sidebar can show real "Popular" counts.
ALTER TABLE blog_posts ADD COLUMN view_count INTEGER DEFAULT 0;
