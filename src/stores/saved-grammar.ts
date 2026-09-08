import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { GrammarNote } from '@/data/book-grammar';
import { applyReview, migrateCard, type SrsCard, type Quality } from '@/lib/srs';
import { useFlashcardStore } from '@/stores/flashcards';
import {
  pushSavedGrammar,
  deleteSavedGrammar,
  type CloudSavedGrammar,
} from '@/lib/sync/cloud-sync';

// Removed items awaiting their cloud delete — undoable for a few seconds.
const UNDO_WINDOW_MS = 5000;
const pendingDeletes = new Map<string, { item: SavedGrammar; index: number; timer: number }>();

function cancelPendingDelete(id: string) {
  const pd = pendingDeletes.get(id);
  if (!pd) return;
  clearTimeout(pd.timer);
  pendingDeletes.delete(id);
}

export interface SavedGrammar extends GrammarNote, SrsCard {
  id: string;
  bookId?: string;
  /** Difficulty variant the extract came from — used to resolve furigana locally. */
  difficulty?: string;
  savedAt: string;
  mastery: number;
}

const QUALITY_MAP: Record<'again' | 'hard' | 'good' | 'easy', Quality> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

interface SavedGrammarStore {
  savedItems: SavedGrammar[];
  syncUserId: string | null;
  saveGrammar: (item: Omit<SavedGrammar, 'savedAt' | 'mastery'>) => void;
  removeGrammar: (id: string) => void;
  isSaved: (id: string) => boolean;
  adjustMastery: (id: string, quality: 'again' | 'hard' | 'good' | 'easy') => void;
  getDueItems: () => SavedGrammar[];
  /** Merge cloud rows with local ones (union by id), then push anything cloud is missing. */
  mergeFromCloud: (items: CloudSavedGrammar[], userId: string) => void;
  clearGrammar: () => void;
}

/** Ensure SRS fields exist on items saved before grammar became reviewable. */
function withSrs(item: SavedGrammar): SavedGrammar {
  const base = migrateCard({ ...item, mastery: item.mastery ?? 0 });
  return { ...base, nextReviewAt: base.nextReviewAt ?? new Date().toISOString() };
}

function toCloud(item: SavedGrammar): CloudSavedGrammar {
  return {
    id: item.id,
    bookId: item.bookId,
    savedAt: item.savedAt,
    pattern: item.pattern,
    meaning: item.meaning,
    example: item.example,
    jlpt: item.jlpt,
    tip: item.tip,
    mastery: item.mastery,
    easeFactor: item.easeFactor,
    interval: item.interval,
    reps: item.reps,
    lapses: item.lapses,
    lastReviewedAt: item.lastReviewedAt,
    nextReviewAt: item.nextReviewAt,
  };
}

export const useSavedGrammarStore = create<SavedGrammarStore>()(
  persist(
    (set, get) => ({
      savedItems: [],
      syncUserId: null,
      saveGrammar: (item) => {
        // Re-saving an item that was just removed cancels its pending cloud delete.
        cancelPendingDelete(item.id);
        if (get().isSaved(item.id)) return;
        const entry: SavedGrammar = {
          ...item,
          savedAt: new Date().toISOString(),
          mastery: 0,
          easeFactor: 2.5,
          interval: 0,
          reps: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
        };
        set((state) => ({ savedItems: [...state.savedItems, entry] }));
        const uid = get().syncUserId;
        if (uid) pushSavedGrammar(uid, toCloud(entry)).catch(() => {});
      },
      removeGrammar: (id) => {
        const items = get().savedItems;
        const index = items.findIndex((i) => i.id === id);
        if (index < 0) return;
        const item = items[index];
        set((state) => ({
          savedItems: state.savedItems.filter((i) => i.id !== id),
        }));
        cancelPendingDelete(id);
        const timer = window.setTimeout(() => {
          pendingDeletes.delete(id);
          const uid = get().syncUserId;
          if (uid) deleteSavedGrammar(uid, id).catch(() => {});
        }, UNDO_WINDOW_MS);
        pendingDeletes.set(id, { item, index, timer });
        toast('Grammar point removed', {
          duration: UNDO_WINDOW_MS,
          action: {
            label: 'Undo',
            onClick: () => {
              const pd = pendingDeletes.get(id);
              if (!pd) return;
              cancelPendingDelete(id);
              const current = get().savedItems;
              if (current.some((i) => i.id === id)) return;
              const next = [...current];
              next.splice(Math.min(pd.index, next.length), 0, pd.item);
              set({ savedItems: next });
            },
          },
        });
      },
      isSaved: (id) => get().savedItems.some((i) => i.id === id),
      adjustMastery: (id, quality) => {
        let isFirstReview = false;
        const updated = get().savedItems.map((item) => {
          if (item.id !== id) return item;
          const migrated = withSrs(item);
          if ((migrated.reps ?? 0) === 0 && quality !== 'again') isFirstReview = true;
          const result = applyReview(migrated, QUALITY_MAP[quality]);
          return { ...migrated, ...result };
        });
        set({ savedItems: updated });
        // Daily goals / streak are shared with word reviews.
        useFlashcardStore.getState().recordReview(isFirstReview);

        const uid = get().syncUserId;
        const item = updated.find((i) => i.id === id);
        if (uid && item) pushSavedGrammar(uid, toCloud(item)).catch(() => {});
      },
      getDueItems: () => {
        const now = new Date().toISOString();
        return get().savedItems.filter((i) => !i.nextReviewAt || i.nextReviewAt <= now);
      },
      mergeFromCloud: (items, userId) => {
        const local = get().savedItems;
        const byId = new Map<string, SavedGrammar>();
        for (const c of items) {
          byId.set(
            c.id,
            withSrs({
              id: c.id,
              bookId: c.bookId,
              savedAt: c.savedAt,
              pattern: c.pattern,
              meaning: c.meaning,
              example: c.example,
              jlpt: c.jlpt,
              tip: c.tip,
              mastery: c.mastery ?? 0,
              easeFactor: c.easeFactor,
              interval: c.interval,
              reps: c.reps,
              lapses: c.lapses,
              lastReviewedAt: c.lastReviewedAt,
              nextReviewAt: c.nextReviewAt,
            }),
          );
        }
        const missingOnCloud: SavedGrammar[] = [];
        for (const l of local) {
          if (!byId.has(l.id)) {
            const migrated = withSrs(l);
            byId.set(l.id, migrated);
            missingOnCloud.push(migrated);
          }
        }
        const merged = [...byId.values()].sort(
          (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
        );
        set({ savedItems: merged, syncUserId: userId });
        for (const m of missingOnCloud) {
          pushSavedGrammar(userId, toCloud(m)).catch(() => {});
        }
      },
      clearGrammar: () => set({ savedItems: [], syncUserId: null }),
    }),
    {
      name: 'tsundoku-saved-grammar',
      partialize: (state) => ({ savedItems: state.savedItems }),
      onRehydrateStorage: () => (state) => {
        if (state) state.savedItems = state.savedItems.map(withSrs);
      },
    }
  )
);
