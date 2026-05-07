import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rule } from '@/data/token-overrides';

/**
 * Buffer of token-override rules being authored via the in-Reader edit UI.
 * Keyed by `${bookId}` (rules apply to whole book; mode also exposes a
 * "global" target which is keyed as "*").
 */
interface TokenEditState {
  /** Whether the Reader is currently in token-edit mode. */
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  /** Per-scope buffer. Scope is bookId or "*" for global. */
  buffers: Record<string, Rule[]>;
  addRule: (scope: string, rule: Rule) => void;
  removeRule: (scope: string, index: number) => void;
  clear: (scope: string) => void;
}

export const useTokenEditStore = create<TokenEditState>()(
  persist(
    (set) => ({
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
