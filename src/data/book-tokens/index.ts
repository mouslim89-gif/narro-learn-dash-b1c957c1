import bakedRules from './baked-rules.json';

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

export { bakedRules };
