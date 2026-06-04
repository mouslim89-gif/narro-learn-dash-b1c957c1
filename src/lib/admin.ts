import { useEffect, useState } from'react';
import { useAuth } from'@/contexts/AuthContext';
import { supabase } from'@/integrations/supabase/client';

// Module-level cache so the RPC runs once per session per user.
const cache = new Map<string, boolean>();

export function useIsAdmin(): boolean {
 const { user } = useAuth();
 const [isAdmin, setIsAdmin] = useState<boolean>(() =>
 user?.id ? cache.get(user.id) ?? false : false,
 );

 useEffect(() => {
 if (!user?.id) {
 setIsAdmin(false);
 return;
 }
 const cached = cache.get(user.id);
 if (cached !== undefined) {
 setIsAdmin(cached);
 return;
 }
 let cancelled = false;
 supabase.rpc('get_is_admin').then(({ data, error }) => {
 if (cancelled) return;
 const value = !error && data === true;
 cache.set(user.id, value);
 setIsAdmin(value);
 });
 return () => {
 cancelled = true;
 };
 }, [user?.id]);

 return isAdmin;
}
