-- Admin users table + helper
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid)
$$;

CREATE POLICY "Anyone can read admin list" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Only admins manage admin list" ON public.admin_users FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Seed admin
INSERT INTO public.admin_users (user_id) VALUES ('d8928234-6cc9-4d31-9dd3-06c16afbefde') ON CONFLICT DO NOTHING;

-- Shared token rules (visible to everyone, writable by admins only)
CREATE TABLE public.shared_token_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  rule JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_token_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared token rules" ON public.shared_token_rules FOR SELECT USING (true);
CREATE POLICY "Admins insert shared token rules" ON public.shared_token_rules FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update shared token rules" ON public.shared_token_rules FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete shared token rules" ON public.shared_token_rules FOR DELETE USING (public.is_admin(auth.uid()));

CREATE INDEX idx_shared_token_rules_book ON public.shared_token_rules (book_id, position);
CREATE UNIQUE INDEX idx_shared_token_rules_unique ON public.shared_token_rules (book_id, md5(rule::text));

CREATE TRIGGER update_shared_token_rules_updated_at
BEFORE UPDATE ON public.shared_token_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing admin global rules into shared
INSERT INTO public.shared_token_rules (book_id, rule, position, created_by)
SELECT book_id, rule, position, user_id
FROM public.user_token_rules
WHERE user_id = 'd8928234-6cc9-4d31-9dd3-06c16afbefde'
ON CONFLICT DO NOTHING;

-- Remove the migrated rules from per-user table to avoid duplication
DELETE FROM public.user_token_rules
WHERE user_id = 'd8928234-6cc9-4d31-9dd3-06c16afbefde';