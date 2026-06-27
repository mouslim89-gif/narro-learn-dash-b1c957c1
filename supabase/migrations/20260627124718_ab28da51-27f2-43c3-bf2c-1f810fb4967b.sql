CREATE TABLE public.grammar_examples (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_slug text NOT NULL UNIQUE,
    examples jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grammar_examples TO authenticated;
GRANT ALL ON public.grammar_examples TO service_role;

ALTER TABLE public.grammar_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read grammar examples"
ON public.grammar_examples FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert grammar examples"
ON public.grammar_examples FOR INSERT
TO authenticated
WITH CHECK (true);