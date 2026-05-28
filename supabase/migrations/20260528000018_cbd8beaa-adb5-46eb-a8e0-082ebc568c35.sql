
CREATE TABLE public.book_content_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('simplified','intermediate','original')),
  part_index integer,
  text text NOT NULL,
  tokens jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX book_content_overrides_unique
  ON public.book_content_overrides (book_id, difficulty, COALESCE(part_index, -1));

GRANT SELECT ON public.book_content_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_content_overrides TO authenticated;
GRANT ALL ON public.book_content_overrides TO service_role;

ALTER TABLE public.book_content_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content overrides"
  ON public.book_content_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins insert content overrides"
  ON public.book_content_overrides FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update content overrides"
  ON public.book_content_overrides FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete content overrides"
  ON public.book_content_overrides FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER book_content_overrides_updated_at
  BEFORE UPDATE ON public.book_content_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
