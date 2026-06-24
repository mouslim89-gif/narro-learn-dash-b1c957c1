import { create } from'zustand';
import type { Rule } from'@/data/token-overrides';
import { supabase } from'@/integrations/supabase/client';

export interface SharedRule {
 id: string;
 rule: Rule;
 position: number;
}

interface SharedRulesState {
 saved: Record<string, SharedRule[]>; // bookId or '*'
 loading: boolean;
 loaded: boolean;

 loadShared: () => Promise<void>;
 addShared: (scope: string, rule: Rule, createdBy: string) => Promise<void>;
 deleteShared: (id: string, scope: string) => Promise<void>;
}

export const useSharedRulesStore = create<SharedRulesState>((set, get) => ({
 saved: {},
 loading: false,
 loaded: false,

 loadShared: async () => {
 set({ loading: true });
 const { data, error } = await supabase
 .from('shared_token_rules')
 .select('id, book_id, rule, position')
 .order('position', { ascending: true });
 if (error) {
 console.error('[shared-rules] load error', error);
 set({ loading: false });
 return;
 }
 const next: Record<string, SharedRule[]> = {};
 for (const row of data ?? []) {
 const arr = next[row.book_id as string] ?? (next[row.book_id as string] = []);
 arr.push({ id: row.id as string, rule: row.rule as Rule, position: row.position as number });
 }
 set({ saved: next, loading: false, loaded: true });
 },

 addShared: async (scope, rule, createdBy) => {
 const startPos = (get().saved[scope]?.reduce((m, r) => Math.max(m, r.position), 0) ?? 0) + 1;
 const { data: userData } = await supabase.auth.getUser();
 // Removed debug log
 const { data, error } = await supabase
 .from('shared_token_rules')
 .insert({ book_id: scope, rule: rule as never, position: startPos, created_by: createdBy } as never)
 .select('id, book_id, rule, position')
 .single();
 if (error) {
 if ((error as { code?: string }).code ==='23505') {
 await get().loadShared();
 return;
 }
 console.error('[shared-rules] insert error', { message: error.message, details: (error as { details?: string }).details, hint: (error as { hint?: string }).hint, code: (error as { code?: string }).code });
 throw error;
 }
 const next = { ...get().saved };
 const arr = next[scope] ? [...next[scope]] : [];
 arr.push({ id: data.id as string, rule: data.rule as Rule, position: data.position as number });
 arr.sort((a, b) => a.position - b.position);
 next[scope] = arr;
 set({ saved: next });
 },

 deleteShared: async (id, scope) => {
 const prev = get().saved[scope] ?? [];
 set((s) => ({ saved: { ...s.saved, [scope]: prev.filter((r) => r.id !== id) } }));
 const { error } = await supabase.from('shared_token_rules').delete().eq('id', id);
 if (error) {
 console.error('[shared-rules] delete error', error);
 set((s) => ({ saved: { ...s.saved, [scope]: prev } }));
 throw error;
 }
 },
}));
