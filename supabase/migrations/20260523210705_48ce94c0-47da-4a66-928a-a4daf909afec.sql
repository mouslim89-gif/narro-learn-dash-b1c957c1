CREATE TABLE public.kanji_details (
  character text PRIMARY KEY,
  meanings jsonb NOT NULL DEFAULT '[]'::jsonb,
  kun_readings jsonb NOT NULL DEFAULT '[]'::jsonb,
  on_readings jsonb NOT NULL DEFAULT '[]'::jsonb,
  jlpt integer NULL,
  grade integer NULL,
  stroke_count integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kanji_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read kanji details"
  ON public.kanji_details FOR SELECT
  USING (true);

ALTER TABLE public.example_sentences
  ADD COLUMN IF NOT EXISTS sentences jsonb NULL;