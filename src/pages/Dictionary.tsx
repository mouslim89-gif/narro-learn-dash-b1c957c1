import { useState, useEffect, useRef } from 'react';
import { ConjugationTable } from '@/components/ConjugationTable';
import { useSearchParams } from 'react-router-dom';
import { dictionary } from '@/data/dictionary';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { searchJisho, getDisplayWord, type JishoResult } from '@/lib/jisho';
import { Search, Star, Loader2, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayWordButton } from '@/components/PlayWordButton';
import { toRomaji } from 'wanakana';
import { ExampleSentence } from '@/components/ExampleSentence';
import { Input } from '@/components/ui/input';

export default function DictionaryPage() {
  const [searchParams] = useSearchParams();
  const initial = searchParams.get('q') || '';
  const [query, setQuery] = useState(initial);
  const { addWord, hasWord } = useFlashcardStore();
  const [jishoResults, setJishoResults] = useState<JishoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="pb-20 px-6 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dictionary</h1>
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in Japanese or English..."
          className="pl-10 pr-9"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searching && (
        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Searching…</span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {jishoResults.map((result, idx) => {
          const word = result.japanese[0]?.word || result.slug;
          const reading = result.japanese[0]?.reading;
          const saved = hasWord(word);
          const isCommon = (result as any).is_common;

          return (
            <div
              key={idx}
              className={`relative rounded-lg border bg-card p-5 ${isCommon ? 'border-l-4 border-l-primary' : ''}`}
            >
              {/* Save button */}
              <button
                onClick={() => handleSave(result)}
                disabled={saved}
                className={`absolute top-4 right-4 rounded p-1.5 transition-colors ${
                  saved ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                }`}
              >
                <Star className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
              </button>

              {/* Word + reading inline */}
              <div className="flex items-center gap-1.5 pr-8">
                <p className="font-japanese text-xl font-bold">{word}</p>
                {reading && reading !== word && (
                  <span className="font-japanese text-sm text-muted-foreground">{reading}</span>
                )}
                {reading && (
                  <span className="text-xs text-muted-foreground/70 italic">{toRomaji(reading)}</span>
                )}
                <PlayWordButton word={word} reading={reading} size={16} />
              </div>

              {/* Tags row */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {isCommon && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary/80 border border-primary/15">
                    ✦ Common
                  </span>
                )}
                {result.jlpt.length > 0 && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">
                    {result.jlpt[0]?.replace('jlpt-', 'JLPT ')}
                  </span>
                )}
                {result.senses[0]?.parts_of_speech?.map((pos, i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {pos}
                  </span>
                ))}
              </div>

              {/* Meanings */}
              <div className="mt-3 space-y-1">
                {result.senses.slice(0, 3).map((sense, i) => (
                  <p key={i} className="text-sm leading-relaxed">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    <span className="font-medium text-foreground">{sense.english_definitions.join('; ')}</span>
                  </p>
                ))}
              </div>

              <ExampleSentence word={word} />
              <ConjugationTable
                dictForm={word}
                partsOfSpeech={result.senses.flatMap(s => s.parts_of_speech)}
              />
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
