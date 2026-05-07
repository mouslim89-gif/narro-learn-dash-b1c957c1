import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rule } from '@/data/token-overrides';

interface TokenEditState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  buffers: Record<string, Rule[]>;
  addRule: (scope: string, rule: Rule) => void;
  removeRule: (scope: string, index: number) => void;
  undoLast: (scope: string) => Rule | null;
  clear: (scope: string) => void;
}

export const useTokenEditStore = create<TokenEditState>()(
  persist(
    (set, get) => ({
      enabled: false,
      setEnabled: (v) => set({ enabled: v }),
      buffers: {},
      addRule: (scope, rule) =>
        set((s) => ({
          buffers: { ...s.buffers, [scope]: [...(s.buffers[scope] ?? []), rule] },
        })),
      removeRule: (scope, index) =>
        set((s) => {
          const arr = [...(s.buffers[scope] ?? [])];
          arr.splice(index, 1);
          return { buffers: { ...s.buffers, [scope]: arr } };
        }),
      undoLast: (scope) => {
        const arr = [...(get().buffers[scope] ?? [])];
        if (arr.length === 0) return null;
        const popped = arr.pop()!;
        set((s) => ({ buffers: { ...s.buffers, [scope]: arr } }));
        return popped;
      },
      clear: (scope) =>
        set((s) => {
          const next = { ...s.buffers };
          delete next[scope];
          return { buffers: next };
        }),
    }),
    { name: 'token-edit-buffer-v1' }
  )
);
