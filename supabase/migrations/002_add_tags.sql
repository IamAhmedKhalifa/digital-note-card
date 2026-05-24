-- Add tags array to cards so readers can label notes with themes
ALTER TABLE cards ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- GIN index lets Supabase filter by individual tag values efficiently
CREATE INDEX IF NOT EXISTS cards_tags_idx ON cards USING gin(tags);
