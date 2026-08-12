import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GrammarNote } from '@/data/book-grammar';
import { applyReview, migrateCard, type SrsCard, type Quality } from '@/lib/srs';
import { useFlashcardStore } from '@/stores/flashcards';
import {
  pushSavedGrammar,
  deleteSavedGrammar,
  type CloudSavedGrammar,
} from '@/lib/sync/cloud-sync';

export interface SavedGrammar extends GrammarNote, SrsCard {
  id: string;
  bookId?: string;
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
        set((state) => ({
          savedItems: state.savedItems.filter((i) => i.id !== id),
        }));
        const uid = get().syncUserId;
        if (uid) deleteSavedGrammar(uid, id).catch(() => {});
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
