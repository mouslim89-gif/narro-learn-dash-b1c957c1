// Single source of truth for what a free account can access.
import type { Book, Difficulty } from '@/data/books';

export type PremiumFeature =
  | 'chapters'
  | 'review'
  | 'grammar-notes'
  | 'translations'
  | 'audio';

export const FEATURE_LABELS: Record<PremiumFeature, string> = {
  chapters: 'Full books',
  review: 'Review mode',
  'grammar-notes': 'Grammar explanations',
  translations: 'Translations',
  audio: 'Book audio',
};

/** Ordered list of chapter ids for a book, matching the reader route param. */
export function chapterIdsFor(book: Book, difficulty: Difficulty): string[] {
  if (book.chapters?.length) return book.chapters.map((c) => c.id);
  const parts = book.parts?.[difficulty];
  if (parts?.length) return parts.map((_, i) => `part-${i + 1}`);
  return ['main'];
}

/**
 * Free tier: the first chapter (or first part) of every book.
 * Books that are a single unsplit text stay fully free (short starter reads).
 */
export function isChapterFree(book: Book, difficulty: Difficulty, chapterId?: string): boolean {
  const ids = chapterIdsFor(book, difficulty);
  if (ids.length <= 1) return true;
  const id = chapterId ?? ids[0];
  return id === ids[0];
}

export function hasLockedChapters(book: Book, difficulty: Difficulty): boolean {
  return chapterIdsFor(book, difficulty).length > 1;
}
