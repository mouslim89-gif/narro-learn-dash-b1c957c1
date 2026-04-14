
CREATE TABLE public.example_sentences (
  word TEXT PRIMARY KEY,
  japanese TEXT NOT NULL,
  english TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.example_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read example sentences"
ON public.example_sentences
FOR SELECT
USING (true);
