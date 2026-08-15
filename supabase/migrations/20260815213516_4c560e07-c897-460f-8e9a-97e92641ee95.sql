CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'none',
  plan text,
  platform text,
  original_transaction_id text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('none','active','grace','expired')),
  CONSTRAINT subscriptions_plan_check CHECK (plan IS NULL OR plan IN ('monthly','yearly','lifetime')),
  CONSTRAINT subscriptions_platform_check CHECK (platform IS NULL OR platform IN ('ios','android','admin'))
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_premium(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _uid
      AND s.status IN ('active','grace')
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$$;

CREATE INDEX subscriptions_original_transaction_id_idx
ON public.subscriptions (original_transaction_id);