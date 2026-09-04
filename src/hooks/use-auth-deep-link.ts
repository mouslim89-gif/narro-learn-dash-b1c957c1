import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles OAuth / magic-link deep links on native builds.
 *
 * When the OS returns to the app with a URL containing Supabase auth tokens,
 * we forward them to the Supabase client so the session becomes active.
 */
export function useAuthDeepLink() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;

    const handleUrl = async ({ url }: { url: string }) => {
      try {
        const parsed = new URL(url);
        const hashParams = parseHash(parsed.hash);
        const queryParams = Object.fromEntries(parsed.searchParams.entries());

        const accessToken = hashParams.access_token ?? queryParams.access_token;
        const refreshToken = hashParams.refresh_token ?? queryParams.refresh_token;

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
      } catch (e) {
        // Deep link was not an auth callback; ignore silently.
      }
    };

    App.addListener('appUrlOpen', handleUrl).then((l) => {
      listener = l;
    });

    return () => {
      listener?.remove();
    };
  }, []);
}

function parseHash(hash: string) {
  if (!hash || hash.length < 2) return {};
  return Object.fromEntries(new URLSearchParams(hash.slice(1)).entries());
}
