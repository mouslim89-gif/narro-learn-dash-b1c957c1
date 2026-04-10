import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { getCached, lookupWord, type JishoResult, type CacheEntry } from '@/lib/jisho';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

interface WordPopupProps {
  word: string;
  onClose: () => void;
}

function getConjugationLabel(original: string, deinflected: string | null | undefined): string | null {
  if (!deinflected || deinflected === original) return null;

  if (original.endsWith('ました') || original.endsWith('ます')) return 'Polite form (丁寧形)';
  if (original.endsWith('ている') || original.endsWith('ていた') || original.endsWith('ておる') || original.endsWith('ており') || original.endsWith('ておりました')) return 'Continuous (ている形)';
  if (original.endsWith('ない') || original.endsWith('ません')) return 'Negative (否定形)';
  if (original.endsWith('た') || original.endsWith('だ')) return 'Past tense (過去形)';
  if (original.endsWith('て') || original.endsWith('で')) return 'Te-form (て形)';
  if (original.endsWith('たい')) return 'Want to~ (たい形)';
  if (original.endsWith('られる') || original.endsWith('られた')) return 'Passive (受身形)';
  if (original.endsWith('させる') || original.endsWith('させた')) return 'Causative (使役形)';
  if (original.endsWith('かった')) return 'Past adjective';
  if (original.endsWith('くない')) return 'Negative adjective';
  if (original.endsWith('くて')) return 'Te-form adjective';

  return `Dictionary form: ${deinflected}`;
}

export function WordPopup({ word, onClose }: WordPopupProps) {
  const { addWord, hasWord } = useFlashcardStore();

  const cached = getCached(word);
  const [loading, setLoading] = useState(!cached);
  const [result, setResult] = useState<JishoResult | null>(cached?.results?.[0] ?? null);
  const [deinflected, setDeinflected] = useState<string | null>(cached?.deinflected ?? null);
  const [error, setError] = useState(false);

  const wordId = word;
  const saved = hasWord(wordId);

  useEffect(() => {
    if (cached) {
      if (cached.results.length > 0) {
        setResult(cached.results[0]);
        setDeinflected(cached.deinflected ?? null);
      } else {
        setError(true);
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    lookupWord(word)
      .then((entry: CacheEntry) => {
        if (!cancelled && entry.results.length > 0) {
          setResult(entry.results[0]);
          setDeinflected(entry.deinflected ?? null);
        } else if (!cancelled) {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [word, cached]);

  const conjugationLabel = getConjugationLabel(word, deinflected);

  const handleSave = () => {
    if (!result) return;
    const entry: SavedWord = {
      id: wordId,
      word: result.japanese[0]?.word || word,
      reading: result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
      mastery: 0,
    };
    addWord(entry);
  };

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="font-japanese text-3xl font-bold">
            {result ? (result.japanese[0]?.word || word) : word}
          </DrawerTitle>
          <DrawerDescription className="font-japanese text-base">
            {result?.japanese[0]?.reading || ''}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Looking up…</span>
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-muted-foreground py-4">No definition found.</p>
          )}

          {result && !loading && (
            <>
              {conjugationLabel && (
                <div className="rounded-lg bg-primary/10 px-3 py-2">
                  <p className="text-xs font-semibold text-primary">{conjugationLabel}</p>
                  {deinflected && deinflected !== word && (
                    <p className="font-japanese text-xs text-muted-foreground mt-0.5">
                      Original text: {word}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                {result.jlpt.length > 0 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold uppercase text-accent">
                    {result.jlpt[0]?.replace('jlpt-', 'JLPT ')}
                  </span>
                )}
                {result.senses[0]?.parts_of_speech && (
                  <span className="text-[11px] text-muted-foreground italic">
                    {result.senses[0].parts_of_speech.join(', ')}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {result.senses.slice(0, 4).map((sense, i) => (
                  <p key={i} className="text-sm font-semibold text-accent">
                    {i + 1}. {sense.english_definitions.join('; ')}
                  </p>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={saved}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                  saved
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                <Star className="h-4 w-4" /> {saved ? 'Saved to Flashcards' : 'Save to Flashcards'}
              </button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
