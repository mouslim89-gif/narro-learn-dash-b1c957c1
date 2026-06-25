ALTER TABLE public.example_sentences ADD COLUMN tokens jsonb;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_sentences TO authenticated;
GRANT ALL ON public.example_sentences TO service_role;
