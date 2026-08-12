CREATE TABLE public.saved_grammar (
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  book_id text,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_grammar TO authenticated;
GRANT ALL ON public.saved_grammar TO service_role;

ALTER TABLE public.saved_grammar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own saved grammar" ON public.saved_grammar FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved grammar" ON public.saved_grammar FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved grammar" ON public.saved_grammar FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved grammar" ON public.saved_grammar FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_grammar_updated_at
BEFORE UPDATE ON public.saved_grammar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();