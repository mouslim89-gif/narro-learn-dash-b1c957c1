import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { hydrateDictionaryForBook, getManifest } from '@/lib/dictionary-db';
import { books } from '@/data/books';
import { loadBookTokens } from '@/data/book-tokens';
import { preloadGrammarForBook } from '@/lib/grammar-preload';

/**
 * Background preloader that warms up the dictionary cache and book tokens.
 */
export function DictionaryPreloader() {
  const location = useLocation();

  useEffect(() => {
    // 1. Load manifest immediately
    getManifest().then(async (shards) => {
      if (!shards) return;

      const shardKeys = Object.keys(shards);
      
      // 2. Identify priority books (the ones currently viewed or recently read)
      // For now, let's just prioritize all books in our library since it's small.
      for (const book of books) {
        // Hydrate dictionary shards (public/dict/*.json)
        hydrateDictionaryForBook(book.id).catch(() => {});
        // Preload token chunks (src/data/book-tokens/*.ts)
        loadBookTokens(book.id).catch(() => {});
      }


      // 3. Optional: Background fetch for everything else in the manifest
      // (in case there are shards for books not in the main 'books' array)
      for (const key of shardKeys) {
        if (!books.find(b => b.id === key)) {
          // Lower priority for unknown shards
          setTimeout(() => {
            hydrateDictionaryForBook(key).catch(() => {});
          }, 2000);
        }
      }
    });
  }, []);

  // Also watch for navigation to book details to double-down on hydration
  useEffect(() => {
    const match = location.pathname.match(/\/book\/([^/]+)/) || location.pathname.match(/\/reader\/([^/]+)/);
    if (match && match[1]) {
      const bookId = match[1].split('__')[0];
      hydrateDictionaryForBook(bookId).catch(() => {});
      loadBookTokens(bookId).catch(() => {});
      // Grammar is only warmed for the book actually being opened.
      preloadGrammarForBook(bookId).catch(() => {});
    }

  }, [location.pathname]);

  return null;
}
