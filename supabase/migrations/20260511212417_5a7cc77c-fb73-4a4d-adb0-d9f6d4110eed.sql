-- Recreate is_admin to be safe and bypass RLS via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid)
$$;

-- Recreate shared_token_rules policies with explicit role targeting
DROP POLICY IF EXISTS "Anyone can read shared token rules" ON public.shared_token_rules;
DROP POLICY IF EXISTS "Admins insert shared token rules" ON public.shared_token_rules;
DROP POLICY IF EXISTS "Admins update shared token rules" ON public.shared_token_rules;
DROP POLICY IF EXISTS "Admins delete shared token rules" ON public.shared_token_rules;

CREATE POLICY "Anyone can read shared token rules"
ON public.shared_token_rules
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins insert shared token rules"
ON public.shared_token_rules
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update shared token rules"
ON public.shared_token_rules
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete shared token rules"
ON public.shared_token_rules
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));