import { useState, useEffect } from 'react';
import { Star, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlayWordButton } from '@/components/PlayWordButton';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { getCached, lookupWord, type JishoResult, type CacheEntry } from '@/lib/jisho';
import { ConjugationTable, getWordType } from '@/components/ConjugationTable';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

interface WordPopupProps {
  word: string;
  /** Dictionary form from Kuromoji (e.g. 行く for 行きました) */
  baseForm?: string;
  /** Part of speech from Kuromoji (e.g. "動詞/自立") */
  pos?: string;
  /** Sentence from the story where the word was encountered */
  contextSentence?: string;
  onClose: () => void;
}

// Ordered longest-first to avoid short suffixes matching prematurely
const CONJUGATION_PATTERNS: [string, string][] = [
  ['ませんでした', 'Polite past negative (丁寧過去否定)'],
  ['ておりました', 'Continuous polite past (ておりました)'],
  ['ていました', 'Continuous past polite (ていました)'],
  ['ています', 'Continuous polite (ています)'],
  ['ましょう', 'Polite volitional (ましょう)'],
  ['ました', 'Polite past (丁寧過去形)'],
  ['ません', 'Polite negative (丁寧否定形)'],
  ['ている', 'Continuous (ている形)'],
  ['ていた', 'Continuous past (ていた)'],
  ['ておる', 'Continuous (ておる)'],
  ['ており', 'Continuous (ており)'],
  ['られる', 'Passive / Potential (受身/可能形)'],
  ['られた', 'Passive past (受身過去形)'],
  ['させる', 'Causative (使役形)'],
  ['させた', 'Causative past (使役過去形)'],
  ['くなかった', 'Neg. past adj. (い形否定過去)'],
  ['かった', 'Past adjective (い形過去)'],
  ['くない', 'Negative adjective (い形否定)'],
  ['くて', 'Te-form adjective (い形て)'],
  ['ます', 'Polite (丁寧形)'],
  ['ない', 'Negative (否定形)'],
  ['たい', 'Want to~ (たい形)'],
  ['った', 'Past tense (過去形)'],
  ['んだ', 'Past tense (過去形)'],
  ['いた', 'Past tense (過去形)'],
  ['いだ', 'Past tense (過去形)'],
  ['した', 'Past tense (過去形)'],
  ['って', 'Te-form (て形)'],
  ['んで', 'Te-form (て形)'],
  ['いて', 'Te-form (て形)'],
  ['いで', 'Te-form (て形)'],
  ['して', 'Te-form (て形)'],
  ['れば', 'Conditional (仮定形)'],
  ['たら', 'Conditional (たら形)'],
  ['よう', 'Volitional (意志形)'],
  ['ろ', 'Imperative (命令形)'],
  ['て', 'Te-form (て形)'],
  ['た', 'Past tense (過去形)'],
];

function getConjugationLabel(original: string, deinflected: string | null | undefined, dictWord?: string): string | null {
  const baseForm = deinflected || dictWord;
  if (!baseForm || baseForm === original) return null;

  for (const [suffix, label] of CONJUGATION_PATTERNS) {
    if (original.endsWith(suffix)) return label;
  }

  return `Dictionary form: ${baseForm}`;
}

/** Map Kuromoji POS string to Jisho-style parts_of_speech for conjugation table */
function kuromojiPosToJisho(pos: string): string[] {
  if (pos.startsWith('動詞')) return ['Verb'];
  if (pos.startsWith('形容詞')) return ['I-adjective'];
  if (pos.startsWith('形容動詞')) return ['Na-adjective'];
  return [];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-2">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function WordPopup({ word, baseForm: kuromojiBase, pos: kuromojiPos, contextSentence, onClose }: WordPopupProps) {
  const { addWord, hasWord } = useFlashcardStore();
  const navigate = useNavigate();

  // Try looking up the base form first (more likely to have dictionary entries)
  const lookupKey = kuromojiBase || word;
  const cached = getCached(word) || (kuromojiBase ? getCached(kuromojiBase) : undefined);
  const [loading, setLoading] = useState(!cached);
  const [result, setResult] = useState<JishoResult | null>(cached?.results?.[0] ?? null);
  const [deinflected, setDeinflected] = useState<string | null>(cached?.deinflected ?? kuromojiBase ?? null);
  const [error, setError] = useState(false);

  const wordId = word;
  const saved = hasWord(wordId);

  useEffect(() => {
    if (cached) {
      if (cached.results.length > 0) {
        setResult(cached.results[0]);
        setDeinflected(cached.deinflected ?? kuromojiBase ?? null);
      } else {
        setError(true);
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    // Try base form first, then surface form
    const tryLookup = async () => {
      try {
        let entry: CacheEntry | null = null;
        if (kuromojiBase && kuromojiBase !== word) {
          entry = await lookupWord(kuromojiBase);
          if (entry.results.length > 0) {
            if (!cancelled) {
              setResult(entry.results[0]);
              setDeinflected(kuromojiBase);
            }
            return;
          }
        }
        entry = await lookupWord(word);
        if (!cancelled && entry.results.length > 0) {
          setResult(entry.results[0]);
          setDeinflected(entry.deinflected ?? kuromojiBase ?? null);
        } else if (!cancelled) {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    tryLookup();

    return () => { cancelled = true; };
  }, [word, kuromojiBase, cached]);

  const conjugationLabel = getConjugationLabel(word, deinflected, result?.japanese[0]?.word);

  const dictForm = result?.japanese[0]?.word || deinflected || word;
  // Use Kuromoji POS if available, otherwise fall back to Jisho POS
  const allPartsOfSpeech = result?.senses?.flatMap(s => s.parts_of_speech) || 
    (kuromojiPos ? kuromojiPosToJisho(kuromojiPos) : []);
  const wordType = getWordType(allPartsOfSpeech);

  const handleSave = () => {
    if (!result) return;
    const entry: SavedWord = {
      id: wordId,
      word: result.japanese[0]?.word || word,
      reading: result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
      contextSentence,
      mastery: 0,
    };
    addWord(entry);
  };

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-2">
          <div className="flex items-center gap-2">
            <DrawerTitle className="font-japanese text-3xl font-bold">
              {result ? (result.japanese[0]?.word || word) : word}
            </DrawerTitle>
            <PlayWordButton
              word={result?.japanese[0]?.word || word}
              reading={result?.japanese[0]?.reading}
              size={22}
            />
          </div>
          <DrawerDescription className="font-japanese text-base">
            {result?.japanese[0]?.reading || ''}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-3 overflow-y-auto">
          {loading && <LoadingSkeleton />}

          {error && !loading && (
            <p className="text-sm text-muted-foreground py-4">No definition found.</p>
          )}

          {result && !loading && (
            <>
              {conjugationLabel && (
                <div className="rounded-lg bg-primary/10 px-3 py-2">
                  <p className="text-xs font-semibold text-primary">{conjugationLabel}</p>
                  {(deinflected || result?.japanese[0]?.word) && (deinflected || result?.japanese[0]?.word) !== word && (
                    <p className="font-japanese text-xs text-muted-foreground mt-0.5">
                      {word} → {deinflected || result?.japanese[0]?.word}
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

              {wordType && (
                <ConjugationTable dictForm={dictForm} partsOfSpeech={allPartsOfSpeech} />
              )}

              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                    saved
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  <Star className="h-4 w-4" /> {saved ? 'Added to Flashcards' : 'Add to Flashcards'}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/dictionary?q=${encodeURIComponent(dictForm)}`);
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-semibold bg-primary/10 text-primary transition-all active:scale-[0.97] hover:bg-primary/20"
                >
                  <BookOpen className="h-4 w-4" /> Dictionary
                </button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
