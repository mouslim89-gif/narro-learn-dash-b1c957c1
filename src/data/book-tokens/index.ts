export interface BookToken {
 /** surface text */
 t: string;
 /** is Japanese content (not punctuation) */
 j: boolean;
 /** reading in hiragana */
 r?: string;
 /** base/dictionary form (only if different from surface) */
 b?: string;
 /** part of speech (e.g."動詞/自立") */
 p?: string;
}

export type BookTokenMap = Record<string, Record<string, BookToken[]>>;

const loaders = import.meta.glob<{ default: BookTokenMap }>('./books/*.ts');
const cache = new Map<string, Promise<BookTokenMap>>();

/** Lazy-load all tokens for a root book id (includes its chapters). */
export function loadBookTokens(rootBookId: string): Promise<BookTokenMap> {
 let entry = cache.get(rootBookId);
 if (!entry) {
 const loader = loaders[`./books/${rootBookId}.ts`];
 entry = loader ? loader().then((m) => m.default) : Promise.resolve({} as BookTokenMap);
 cache.set(rootBookId, entry);
 }
 return entry;
}

export { tokenWordCounts } from'./word-counts';
