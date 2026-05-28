/**
 * Lazy-load Kuromoji in the browser using dict files served from /kuromoji-dict/.
 * The tokenizer is large (~17MB compressed dict) — only loaded on demand
 * (admin "recompute tokens" feature).
 */
import { mergeTokens, type KToken, type OutputToken } from './token-merger';
import { bookReadingOverrides } from '@/data/book-reading-overrides';

let tokenizerPromise: Promise<any> | null = null;

async function getTokenizer(): Promise<any> {
  if (tokenizerPromise) return tokenizerPromise;
  tokenizerPromise = (async () => {
    const mod: any = await import('kuromoji');
    const kuromoji = mod.default ?? mod;
    return await new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: '/kuromoji-dict' }).build((err: Error | null, t: any) => {
        if (err) reject(err);
        else resolve(t);
      });
    });
  })();
  return tokenizerPromise;
}

/** Returns a function the caller can invoke synchronously to tokenize text. */
export async function loadBrowserTokenizer(): Promise<(text: string) => KToken[]> {
  const t = await getTokenizer();
  return (text: string) => t.tokenize(text) as KToken[];
}

/** Convenience: tokenize + merge in one call. Uses the per-book reading overrides. */
export async function tokenizeForBook(bookId: string, text: string): Promise<OutputToken[]> {
  const tokenize = await loadBrowserTokenizer();
  const rootId = bookId.split('__')[0];
  const overrides = bookReadingOverrides[rootId] ?? {};
  const k = tokenize(text);
  return mergeTokens(k, overrides);
}
