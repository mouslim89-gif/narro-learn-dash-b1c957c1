import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFlashcardStore } from '@/stores/flashcards';
import { useReadingProgressStore, currentPrefs } from '@/stores/reading-progress';
import {
  pullFlashcards,
  pullProgress,
  pullPreferences,
  pushPreferences,
  subscribeRealtime,
} from '@/lib/sync/cloud-sync';

/**
 * Hydrates the local Zustand stores from the cloud whenever the user changes,
 * and subscribes to realtime updates for multi-device sync.
 */
export function useCloudSync() {
  const { user } = useAuth();
  const hydrateWords = useFlashcardStore(s => s.hydrateWords);
  const clearWords = useFlashcardStore(s => s.clearWords);
  const hydrateProgress = useReadingProgressStore(s => s.hydrateProgress);
  const clearProgress = useReadingProgressStore(s => s.clearProgress);
  const hydratePreferences = useReadingProgressStore(s => s.hydratePreferences);
  const clearPreferences = useReadingProgressStore(s => s.clearPreferences);

  useEffect(() => {
    if (!user) {
      clearWords();
      clearProgress();
      clearPreferences();
      return;
    }

    const userId = user.id;
    let cancelled = false;

    const hydrate = async () => {
      try {
        const [words, progress, prefs] = await Promise.all([
          pullFlashcards(userId),
          pullProgress(userId),
          pullPreferences(userId),
        ]);
        if (cancelled) return;
        hydrateWords(words, userId);
        hydrateProgress(progress, userId);

        if (prefs) {
          hydratePreferences(prefs, userId);
        } else {
          // First login on this account: seed the server with whatever was in
          // localStorage so existing users don't get reset to defaults.
          const seed = currentPrefs(useReadingProgressStore.getState());
          hydratePreferences(seed, userId);
          pushPreferences(userId, seed).catch(() => {});
        }
      } catch (e) {
        console.error('Cloud hydrate failed', e);
      }
    };

    hydrate();

    const unsubscribe = subscribeRealtime(userId, {
      onFlashcardChange: () => {
        // Re-pull on any remote change (debounced naturally by realtime batching)
        pullFlashcards(userId).then(words => {
          if (!cancelled) hydrateWords(words, userId);
        }).catch(() => {});
      },
      onProgressChange: () => {
        pullProgress(userId).then(progress => {
          if (!cancelled) hydrateProgress(progress, userId);
        }).catch(() => {});
      },
      onPreferencesChange: () => {
        pullPreferences(userId).then(prefs => {
          if (!cancelled && prefs) hydratePreferences(prefs, userId);
        }).catch(() => {});
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.id]);
}
