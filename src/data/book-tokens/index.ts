// baked-rules.json is now an empty object as rules are baked into book files.
import bakedRules from './baked-rules.json';
import { tokenWordCounts } from './word-counts';

export interface BookToken {
  t: string;
  r?: string;
  b?: string;
  p?: string;
  j?: boolean;
}

export type BookTokenMap = Record<string, Record<string, BookToken[]>>;

export async function loadBookTokens(bookId: string): Promise<BookTokenMap> {
  try {
    const module = await import(`./books/${bookId}.ts`);
    return module.default;
  } catch (err) {
    console.error(`Failed to load tokens for book: ${bookId}`, err);
    return {};
  }
}

export { bakedRules, tokenWordCounts };
