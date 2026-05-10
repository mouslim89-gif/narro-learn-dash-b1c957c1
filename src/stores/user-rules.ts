import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rule } from '@/data/token-overrides';
import { supabase } from '@/integrations/supabase/client';

export interface SavedRule {
  id: string;
  rule: Rule;
  position: number;
}

interface UserRulesState {
  saved: Record<string, SavedRule[]>; // bookId or '*' → rules
  pending: Record<string, Rule[]>;
  loading: boolean;
  loadedFor: string | null; // userId we last loaded for

  loadFromCloud: (userId: string, bookId: string) => Promise<void>;
  addPending: (scope: string, rule: Rule) => void;
  undoPending: (scope: string) => Rule | null;
  clearPending: (scope: string) => void;
  applyPending: (userId: string) => Promise<{ inserted: number }>;
  deleteSaved: (id: string, scope: string) => Promise<void>;
  resetForLogout: () => void;
}

export const useUserRulesStore = create<UserRulesState>()(
  persist(
    (set, get) => ({
      saved: {},
      pending: {},
      loading: false,
      loadedFor: null,

      loadFromCloud: async (userId, bookId) => {
        set({ loading: true });
        const { data, error } = await supabase
          .from('user_token_rules')
          .select('id, book_id, rule, position')
          .eq('user_id', userId)
          .in('book_id', [bookId, '*'])
          .order('position', { ascending: true });
        if (error) {
          console.error('[user-rules] load error', error);
          set({ loading: false });
          return;
        }
        const next: Record<string, SavedRule[]> = { ...get().saved };
        next[bookId] = [];
        next['*'] = [];
        for (const row of data ?? []) {
          const arr = next[row.book_id] ?? (next[row.book_id] = []);
          arr.push({ id: row.id as string, rule: row.rule as Rule, position: row.position as number });
        }
        set({ saved: next, loading: false, loadedFor: userId });
      },

      addPending: (scope, rule) =>
        set((s) => ({ pending: { ...s.pending, [scope]: [...(s.pending[scope] ?? []), rule] } })),

      undoPending: (scope) => {
        const arr = [...(get().pending[scope] ?? [])];
        if (arr.length === 0) return null;
        const popped = arr.pop()!;
        set((s) => ({ pending: { ...s.pending, [scope]: arr } }));
        return popped;
      },

      clearPending: (scope) =>
        set((s) => {
          const next = { ...s.pending };
          delete next[scope];
          return { pending: next };
        }),

      applyPending: async (userId) => {
        const { pending, saved } = get();
        const rows: { user_id: string; book_id: string; rule: Rule; position: number }[] = [];
        for (const [scope, rules] of Object.entries(pending)) {
          if (!rules || rules.length === 0) continue;
          const startPos = (saved[scope]?.reduce((m, r) => Math.max(m, r.position), 0) ?? 0) + 1;
          rules.forEach((rule, idx) => {
            rows.push({ user_id: userId, book_id: scope, rule, position: startPos + idx });
          });
        }
        if (rows.length === 0) return { inserted: 0 };

        // Insert with onConflict do nothing (unique on user_id, book_id, md5(rule))
        const { data, error } = await supabase
          .from('user_token_rules')
          .upsert(rows as never, { onConflict: 'user_id,book_id', ignoreDuplicates: true })
          .select('id, book_id, rule, position');
        if (error) {
          // Fallback: plain insert (some schemas reject upsert with ignoreDuplicates without index match)
          const ins = await supabase.from('user_token_rules').insert(rows as never).select('id, book_id, rule, position');
          if (ins.error) {
            console.error('[user-rules] applyPending insert error', ins.error);
            throw ins.error;
          }
          mergeInsertedIntoSaved(set, get, ins.data ?? []);
        } else {
          mergeInsertedIntoSaved(set, get, data ?? []);
        }
        // Clear pending
        set({ pending: {} });
        return { inserted: rows.length };
      },

      deleteSaved: async (id, scope) => {
        const prev = get().saved[scope] ?? [];
        // optimistic
        set((s) => ({ saved: { ...s.saved, [scope]: prev.filter((r) => r.id !== id) } }));
        const { error } = await supabase.from('user_token_rules').delete().eq('id', id);
        if (error) {
          console.error('[user-rules] delete error', error);
          set((s) => ({ saved: { ...s.saved, [scope]: prev } }));
          throw error;
        }
      },

      resetForLogout: () => set({ saved: {}, pending: {}, loadedFor: null }),
    }),
    {
      name: 'user-token-rules-v1',
      partialize: (s) => ({ pending: s.pending, saved: s.saved }),
    }
  )
);

function mergeInsertedIntoSaved(
  set: (fn: (s: UserRulesState) => Partial<UserRulesState>) => void,
  get: () => UserRulesState,
  rows: { id: string; book_id: string; rule: Rule; position: number }[]
) {
  const next = { ...get().saved };
  for (const r of rows) {
    const arr = next[r.book_id] ? [...next[r.book_id]] : [];
    arr.push({ id: r.id, rule: r.rule, position: r.position });
    arr.sort((a, b) => a.position - b.position);
    next[r.book_id] = arr;
  }
  set(() => ({ saved: next }));
}
