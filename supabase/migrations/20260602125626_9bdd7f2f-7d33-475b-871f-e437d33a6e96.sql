
-- 1. profiles: restrict public read; only the owner can view their profile
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. admin_users: restrict listing to admins only
DROP POLICY IF EXISTS "Anyone can read admin list" ON public.admin_users;
CREATE POLICY "Admins can read admin list"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. SECURITY DEFINER function executability
-- is_admin: only signed-in users need to call it (used in RLS)
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- handle_new_user / update_updated_at_column are trigger-only; revoke direct execute
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 4. Realtime channel authorization: ensure only authenticated users can subscribe,
-- and only to their own user-scoped channel topic. Underlying table RLS still gates
-- postgres_changes payloads, but this also locks down Broadcast/Presence topics.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users own channel only" ON realtime.messages;
CREATE POLICY "Authenticated users own channel only"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'user-sync-' || auth.uid()::text
  );
