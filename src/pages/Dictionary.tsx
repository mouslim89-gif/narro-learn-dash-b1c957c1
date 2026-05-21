import { useState, useEffect, useRef } from 'react';
import { ConjugationTable } from '@/components/ConjugationTable';
import { useSearchParams } from 'react-router-dom';
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
    const disp = getDisplayWord(result);
    const entry: Omit<SavedWord, 'mastery'> = {
      id: disp.word || result.slug,
      word: disp.word || result.slug,
      reading: disp.reading || result.japanese[0]?.reading || '',
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
    <div className="pb-24">
      {/* Masthead */}
      <header className="relative px-6 pt-10 pb-2 flex items-start justify-between">
        <h1 className="font-serif text-[34px] font-bold leading-none tracking-tight">Dictionary</h1>
        <Link to="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-background/70 backdrop-blur-md ring-1 ring-border/40"
          >
            <Settings className="h-[18px] w-[18px]" />
          </Button>
        </Link>
      </header>

      {/* Search pill */}
      <div className="mt-5 px-6 relative">
        <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in Japanese or English..."
          className="h-11 rounded-full bg-muted/60 border-transparent pl-11 pr-11"
        />
        {query && (
          <button
            onClick={clearQuery}
            aria-label="Clear search"
            className="absolute right-9 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background/70 ring-1 ring-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.94] transition-transform"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {searching && (
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3.5 py-1.5 ring-1 ring-border/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Searching…</span>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 px-6">
        {jishoResults.map((result, idx) => {
          const disp = getDisplayWord(result);
          const word = disp.word || result.slug;
          const reading = disp.reading;
          const saved = hasWord(word);
          const isCommon = (result as any).is_common;

          return (
            <div
              key={idx}
              className="relative rounded-2xl p-5 ring-1 ring-border/40 card-lift overflow-hidden"
              style={
                isCommon
                  ? { backgroundImage: 'linear-gradient(135deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--card)) 55%)' }
                  : undefined
              }
            >
              {!isCommon && <div className="absolute inset-0 bg-card -z-10" aria-hidden />}

              {/* Save button */}
              <button
                onClick={() => handleSave(result)}
                disabled={saved}
                aria-label={saved ? 'Saved' : 'Save word'}
                className={`absolute top-4 right-4 h-9 w-9 rounded-full ring-1 ring-border/40 bg-background/70 backdrop-blur-md flex items-center justify-center transition-colors ${
                  saved ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                }`}
              >
                <Star className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
              </button>

              {/* Word + reading inline */}
              <div className="flex items-center gap-1.5 pr-12">
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
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {isCommon && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
                    ✦ Common
                  </span>
                )}
                {result.jlpt.length > 0 && (
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-accent ring-1 ring-accent/20">
                    {result.jlpt[0]?.replace('jlpt-', 'JLPT ')}
                  </span>
                )}
                {result.senses[0]?.parts_of_speech?.map((pos, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/40"
                  >
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
          <p className="mt-8 text-center text-sm text-muted-foreground">No results found.</p>
        )}
        {!query.trim() && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Search className="h-9 w-9 text-primary" />
            </div>
            <p className="mt-5 font-serif text-lg font-semibold">Search the dictionary</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Type a word in Japanese or English to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
