CREATE TABLE public.user_token_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  rule JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_token_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own token rules" ON public.user_token_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own token rules" ON public.user_token_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own token rules" ON public.user_token_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own token rules" ON public.user_token_rules FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_token_rules_user_book ON public.user_token_rules (user_id, book_id, position);
CREATE UNIQUE INDEX idx_user_token_rules_unique ON public.user_token_rules (user_id, book_id, md5(rule::text));

CREATE TRIGGER update_user_token_rules_updated_at
BEFORE UPDATE ON public.user_token_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();