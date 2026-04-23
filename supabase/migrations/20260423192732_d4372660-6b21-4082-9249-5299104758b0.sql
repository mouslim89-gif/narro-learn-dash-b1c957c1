-- Add chapter_id column with default 'main' for backward compatibility
ALTER TABLE public.reading_progress
  ADD COLUMN IF NOT EXISTS chapter_id text NOT NULL DEFAULT 'main';

-- Drop existing unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.reading_progress'::regclass
      AND contype = 'u'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.reading_progress DROP CONSTRAINT ' || quote_ident(conname)
      FROM pg_constraint
      WHERE conrelid = 'public.reading_progress'::regclass
        AND contype = 'u'
      LIMIT 1
    );
  END IF;
END $$;

-- Drop existing primary key if it's composite (and not a synthetic id)
DO $$
DECLARE
  pk_name text;
BEGIN
  SELECT conname INTO pk_name
  FROM pg_constraint
  WHERE conrelid = 'public.reading_progress'::regclass
    AND contype = 'p';
  IF pk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.reading_progress DROP CONSTRAINT ' || quote_ident(pk_name);
  END IF;
END $$;

-- Recreate primary key including chapter_id
ALTER TABLE public.reading_progress
  ADD CONSTRAINT reading_progress_pkey
  PRIMARY KEY (user_id, book_id, difficulty, chapter_id);