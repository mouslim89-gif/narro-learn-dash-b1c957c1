/**
 * SM-2 spaced repetition algorithm (Anki-style).
 *
 * Quality scale used here:
 * - 0 = Again (lapse — reset)
 * - 3 = Hard
 * - 4 = Good
 * - 5 = Easy
 */

export type Quality = 0 | 3 | 4 | 5;

export interface SrsCard {
 mastery: number;
 easeFactor?: number;
 interval?: number;
 reps?: number;
 lapses?: number;
 lastReviewedAt?: string;
 nextReviewAt?: string;
}

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

const LEGACY_INTERVALS = [0, 1, 3, 7, 30];

/** Backfill SRS fields for cards created before SM-2 was introduced. */
export function migrateCard<T extends SrsCard>(card: T): T {
 if (
 card.easeFactor !== undefined &&
 card.interval !== undefined &&
 card.reps !== undefined &&
 card.lapses !== undefined
 ) {
 return card;
 }
 const reps = card.mastery ?? 0;
 const interval = LEGACY_INTERVALS[Math.min(reps, LEGACY_INTERVALS.length - 1)];
 return {
 ...card,
 easeFactor: card.easeFactor ?? DEFAULT_EASE,
 interval: card.interval ?? interval,
 reps: card.reps ?? reps,
 lapses: card.lapses ?? 0,
 };
}

function intervalFactor(quality: Quality, ease: number): number {
 if (quality === 3) return ease * 0.6; // Hard
 if (quality === 4) return ease; // Good
 return ease * 1.3; // Easy (5)
}

/** Compute the next interval (in days) without mutating the card. */
export function previewIntervalDays(card: SrsCard, quality: Quality): number {
 const c = migrateCard(card);
 const reps = c.reps ?? 0;
 const ease = c.easeFactor ?? DEFAULT_EASE;
 const prev = c.interval ?? 0;

 if (quality === 0) return 0; // same-day re-review
 if (reps === 0) return 1;
 if (reps === 1) return quality === 3 ? 3 : quality === 4 ? 4 : 6;
 return Math.max(1, Math.round(prev * intervalFactor(quality, ease)));
}

export interface ReviewResult {
 mastery: number;
 easeFactor: number;
 interval: number;
 reps: number;
 lapses: number;
 lastReviewedAt: string;
 nextReviewAt: string;
}

/** Apply a review and return the updated SRS state. */
export function applyReview(card: SrsCard, quality: Quality): ReviewResult {
 const c = migrateCard(card);
 const now = new Date();
 const nowIso = now.toISOString();

 let ease = c.easeFactor ?? DEFAULT_EASE;
 let reps = c.reps ?? 0;
 let lapses = c.lapses ?? 0;
 let interval: number;

 if (quality === 0) {
 reps = 0;
 interval = 0;
 lapses += 1;
 ease = Math.max(MIN_EASE, ease - 0.2);
 } else {
 if (reps === 0) interval = 1;
 else if (reps === 1) interval = quality === 3 ? 3 : quality === 4 ? 4 : 6;
 else interval = Math.max(1, Math.round((c.interval ?? 1) * intervalFactor(quality, ease)));
 reps += 1;
 // SM-2 ease adjustment
 const q = quality;
 ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
 }

 const next = new Date(now);
 if (interval === 0) {
 // Re-show in ~10 minutes for lapses
 next.setMinutes(next.getMinutes() + 10);
 } else {
 next.setDate(next.getDate() + interval);
 }

 return {
 mastery: reps, // retro-compat for highlight system
 easeFactor: ease,
 interval,
 reps,
 lapses,
 lastReviewedAt: nowIso,
 nextReviewAt: next.toISOString(),
 };
}

/** Short human label like "10m", "1d", "3d", "2w". */
export function formatInterval(days: number): string {
 if (days <= 0) return'10m';
 if (days < 7) return`${days}d`;
 if (days < 30) return`${Math.round(days / 7)}w`;
 if (days < 365) return`${Math.round(days / 30)}mo`;
 return`${Math.round(days / 365)}y`;
}
