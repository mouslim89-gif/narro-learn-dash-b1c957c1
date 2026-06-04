import { create } from'zustand';
import { persist } from'zustand/middleware';

interface TokenEditState {
 enabled: boolean;
 setEnabled: (v: boolean) => void;
}

export const useTokenEditStore = create<TokenEditState>()(
 persist(
 (set) => ({
 enabled: false,
 setEnabled: (v) => set({ enabled: v }),
 }),
 { name:'token-edit-mode-v1'}
 )
);
