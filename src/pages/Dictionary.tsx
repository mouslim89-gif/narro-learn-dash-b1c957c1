import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dictionary } from '@/data/dictionary';
import { useFlashcardStore } from '@/stores/flashcards';
import { Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DictionaryPage() {
  const [searchParams] = useSearchParams();
  const initial = searchParams.get('q') || '';
  const [query, setQuery] = useState(initial);
  const { addWord, hasWord } = useFlashcardStore();

  const results = useMemo(() => {
    if (!query.trim()) return dictionary;
    const q = query.toLowerCase();
    return dictionary.filter(
      (e) =>
        e.word.includes(q) ||
        e.reading.includes(q) ||
        e.romaji.includes(q) ||
        e.translation.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="pb-20 px-6 pt-8">
      <h1 className="text-2xl font-bold">Dictionary</h1>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in romaji, kana, or English..."
          className="pl-10"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {results.map((entry) => {
          const saved = hasWord(entry.id);
          return (
            <div key={entry.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-japanese text-xl font-bold">{entry.word}</p>
                  <p className="font-japanese text-sm text-muted-foreground">{entry.reading} ({entry.romaji})</p>
                  <p className="mt-1 text-sm font-semibold text-accent">{entry.translation}</p>
                </div>
                <button
                  onClick={() => addWord(entry)}
                  disabled={saved}
                  className={`rounded p-2 transition-colors ${
                    saved ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                  }`}
                >
                  <Star className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="mt-2 rounded bg-muted/50 p-2">
                <p className="font-japanese text-xs">{entry.example}</p>
                <p className="text-xs text-muted-foreground">{entry.exampleTranslation}</p>
              </div>
            </div>
          );
        })}
        {results.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">No results found.</p>
        )}
      </div>
    </div>
  );
}
