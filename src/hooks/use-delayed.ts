import { useEffect, useState } from'react';

/**
 * Returns`true`only after`delayMs`has elapsed since mount.
 * Useful to avoid flashing empty-state UI during page transitions
 * before the underlying store has rehydrated from cloud/localStorage.
 */
export function useDelayed(delayMs = 300): boolean {
 const [ready, setReady] = useState(false);
 useEffect(() => {
 const t = window.setTimeout(() => setReady(true), delayMs);
 return () => window.clearTimeout(t);
 }, [delayMs]);
 return ready;
}
