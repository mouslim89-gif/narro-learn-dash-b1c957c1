import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dictionary } from '@/data/dictionary';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { searchJisho, type JishoResult } from '@/lib/jisho';
import { Search, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function DictionaryPage() {
  const [searchParams] = useSearchParams();
  const initial = searchParams.get('q') || '';
  const [query, setQuery] = useState(initial);
  const { addWord, hasWord } = useFlashcardStore();
  const [jishoResults, setJishoResults] = useState<JishoResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced Jisho search
  useEffect(() => {
    if (!query.trim()) {
      setJishoResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchJisho(query);
        setJishoResults(results);
      } catch {
        setJishoResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSave = (result: JishoResult) => {
    const entry: Omit<SavedWord, 'mastery'> = {
      id: result.japanese[0]?.word || result.slug,
      word: result.japanese[0]?.word || result.slug,
      reading: result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
    };
    addWord(entry);
  };

  return (
    <div className="pb-20 px-6 pt-8">
      <h1 className="text-2xl font-bold">Dictionary</h1>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in Japanese or English..."
          className="pl-10"
        />
      </div>

      {searching && (
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Searching…</span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {jishoResults.map((result, idx) => {
          const wordId = result.japanese[0]?.word || result.slug;
          const saved = hasWord(wordId);
          return (
            <div key={idx} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-japanese text-xl font-bold">
                    {result.japanese[0]?.word || result.slug}
                  </p>
                  <p className="font-japanese text-sm text-muted-foreground">
                    {result.japanese[0]?.reading}
                  </p>
                  {result.jlpt.length > 0 && (
                    <span className="mt-1 inline-block rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                      {result.jlpt[0]?.replace('jlpt-', 'JLPT ')}
                    </span>
                  )}
                  <div className="mt-1 space-y-0.5">
                    {result.senses.slice(0, 3).map((sense, i) => (
                      <p key={i} className="text-sm text-accent font-semibold">
                        {i + 1}. {sense.english_definitions.join('; ')}
                      </p>
                    ))}
                  </div>
                  {result.senses[0]?.parts_of_speech && (
                    <p className="mt-1 text-[10px] text-muted-foreground italic">
                      {result.senses[0].parts_of_speech.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleSave(result)}
                  disabled={saved}
                  className={`rounded p-2 transition-colors ${
                    saved ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                  }`}
                >
                  <Star className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          );
        })}
        {!searching && query.trim() && jishoResults.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground">No results found.</p>
        )}
        {!query.trim() && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Type a word in Japanese or English to search the dictionary.
          </p>
        )}
      </div>
    </div>
  );
}
