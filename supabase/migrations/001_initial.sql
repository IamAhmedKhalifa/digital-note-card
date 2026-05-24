-- Digital Note Card — Initial Schema
-- Run this in your Supabase SQL editor or via Supabase CLI.

-- ─── Card type enum ─────────────────────────────────────────────────────────
CREATE TYPE card_type AS ENUM (
  'chapter_tracker',
  'quote_tracker',
  'character_tracker',
  'vocabulary_tracker',
  'reading_notes',
  'general'
);

-- ─── Books ───────────────────────────────────────────────────────────────────
CREATE TABLE books (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  author           TEXT,
  cover_image_url  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own books"
  ON books FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX books_user_id_idx ON books(user_id);
CREATE INDEX books_updated_at_idx ON books(updated_at DESC);

-- ─── Cards ───────────────────────────────────────────────────────────────────
CREATE TABLE cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id          UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  card_type        card_type NOT NULL DEFAULT 'general',
  front_image_url  TEXT,
  back_image_url   TEXT,
  content          JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_ocr_text     TEXT,
  is_edited        BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cards"
  ON cards FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Full-text search index
ALTER TABLE cards ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(raw_ocr_text, '') || ' ' ||
      COALESCE(content::text, '')
    )
  ) STORED;

CREATE INDEX cards_search_vector_idx ON cards USING GIN(search_vector);
CREATE INDEX cards_user_id_idx        ON cards(user_id);
CREATE INDEX cards_book_id_idx        ON cards(book_id);
CREATE INDEX cards_content_idx        ON cards USING GIN(content);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Storage buckets ─────────────────────────────────────────────────────────
-- Run these via Supabase Dashboard > Storage, or uncomment if using CLI:
--
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('book-covers', 'book-covers', true)
--   ON CONFLICT DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('card-images', 'card-images', true)
--   ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "Auth users can upload book covers"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Public read book covers"
--   ON storage.objects FOR SELECT TO public
--   USING (bucket_id = 'book-covers');
--
-- CREATE POLICY "Auth users can upload card images"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Auth users can read their card images"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Auth users can delete their card images"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'card-images' AND auth.uid()::text = (storage.foldername(name))[1]);
