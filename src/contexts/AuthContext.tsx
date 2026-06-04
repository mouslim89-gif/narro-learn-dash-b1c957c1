import { createContext, useContext, useEffect, useState, ReactNode } from'react';
import type { Session, User } from'@supabase/supabase-js';
import { supabase } from'@/integrations/supabase/client';
import { useUserRulesStore } from'@/stores/user-rules';

interface AuthContextValue {
 user: User | null;
 session: Session | null;
 loading: boolean;
 signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const [session, setSession] = useState<Session | null>(null);
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let prevUserId: string | null = null;

 // 1. Setup listener FIRST
 const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
 const newUserId = newSession?.user?.id ?? null;
 // Reset per-user stores on logout or account switch
 if (event ==='SIGNED_OUT'|| (prevUserId && newUserId && prevUserId !== newUserId)) {
 useUserRulesStore.getState().resetForLogout();
 }
 prevUserId = newUserId;
 setSession(newSession);
 setUser(newSession?.user ?? null);
 setLoading(false);
 });

 // 2. THEN fetch existing session
 supabase.auth.getSession().then(({ data: { session: existing } }) => {
 prevUserId = existing?.user?.id ?? null;
 setSession(existing);
 setUser(existing?.user ?? null);
 setLoading(false);
 });

 return () => subscription.unsubscribe();
 }, []);

 const signOut = async () => {
 await supabase.auth.signOut();
 };

 return (
 <AuthContext.Provider value={{ user, session, loading, signOut }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error('useAuth must be used within AuthProvider');
 return ctx;
}
