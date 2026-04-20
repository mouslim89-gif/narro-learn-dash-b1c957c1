-- Global dictionary table shared across all books
CREATE TABLE public.dictionary (
  word TEXT NOT NULL PRIMARY KEY,
  entry JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dictionary ENABLE ROW LEVEL SECURITY;

-- Public read (dictionary entries are not user-specific)
CREATE POLICY "Anyone can read dictionary entries"
  ON public.dictionary
  FOR SELECT
  USING (true);

-- No public insert/update/delete policies — writes happen via service role
-- (edge functions / migration scripts only)

CREATE INDEX dictionary_created_at_idx ON public.dictionary (created_at);