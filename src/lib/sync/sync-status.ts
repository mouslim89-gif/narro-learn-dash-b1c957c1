import { create } from'zustand';

export type SyncStatus ='idle'|'syncing'|'error';

interface SyncStatusState {
 status: SyncStatus;
 pendingCount: number;
 setStatus: (s: SyncStatus) => void;
 startSync: () => void;
 endSync: (ok: boolean) => void;
}

export const useSyncStatus = create<SyncStatusState>((set, get) => ({
 status:'idle',
 pendingCount: 0,
 setStatus: (status) => set({ status }),
 startSync: () => {
 const next = get().pendingCount + 1;
 set({ pendingCount: next, status:'syncing'});
 },
 endSync: (ok) => {
 const next = Math.max(0, get().pendingCount - 1);
 set({
 pendingCount: next,
 status: ok ? (next > 0 ?'syncing':'idle') :'error',
 });
 if (!ok) {
 // auto-reset error after 4s
 setTimeout(() => {
 if (useSyncStatus.getState().status ==='error') {
 useSyncStatus.setState({ status:'idle'});
 }
 }, 4000);
 }
 },
}));
