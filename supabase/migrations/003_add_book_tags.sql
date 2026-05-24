-- Move tagging from cards to books — readers label whole books, not individual cards
ALTER TABLE books ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- GIN index for efficient tag filtering/searching on books
CREATE INDEX IF NOT EXISTS books_tags_idx ON books USING gin(tags);
