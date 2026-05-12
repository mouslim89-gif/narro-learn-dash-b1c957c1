I found the exact cause: the `is_admin` function exists and is `SECURITY DEFINER`, but it is only executable by internal roles. The logged-in admin account reaches the publish policy, then the database blocks the policy itself with: `permission denied for function is_admin`.

## Plan

1. **Fix function execution rights**
   - Add a small database migration that grants `authenticated` users permission to execute `public.is_admin(uuid)`.
   - Keep anonymous/public users from executing it directly.

2. **Keep the admin-only publish rule unchanged**
   - Publishing shared token rules will still only work when `public.is_admin(auth.uid())` returns true.
   - Non-admin accounts will still be blocked from creating, editing, or deleting shared rules.

3. **Verify after migration**
   - Re-check the function grants in the database.
   - You can then retry “publish for all accounts” from `mouslim89@gmail.com`.

## Technical SQL

```sql
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
```

This is smaller and more targeted than recreating all policies again, because the policies are already correct; only the function permission is missing.