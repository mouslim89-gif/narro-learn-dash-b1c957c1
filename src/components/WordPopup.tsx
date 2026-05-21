import { useState, useEffect } from 'react';
import { Star, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toRomaji } from 'wanakana';
import { PlayWordButton } from '@/components/PlayWordButton';
import { ExampleSentence } from '@/components/ExampleSentence';
import { useFlashcardStore, type SavedWord } from '@/stores/flashcards';
import { getCached, lookupWord, pickBestResult, getDisplayWord, type JishoResult, type CacheEntry } from '@/lib/jisho';
import { ConjugationTable, getWordType } from '@/components/ConjugationTable';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface WordPopupProps {
  word: string;
  /** Dictionary form from Kuromoji (e.g. 行く for 行きました) */
  baseForm?: string;
  /** Override reading (kana) from token, takes priority over dictionary reading */
  reading?: string;
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

// Map godan stem (う-row) → あ-row for passive/causative detection
const GODAN_A_ROW: Record<string, string> = {
  'う': 'わ', 'く': 'か', 'ぐ': 'が', 'す': 'さ', 'つ': 'た',
  'ぬ': 'な', 'ぶ': 'ば', 'む': 'ま', 'る': 'ら',
};

// Try to peel a polite/auxiliary suffix; return [stripped, label] or null
const POLITE_STRIP: [string, string][] = [
  ['ませんでした', 'polite past negative'],
  ['ましょう', 'polite volitional'],
  ['ました', 'polite past'],
  ['ません', 'polite negative'],
  ['ます', 'polite'],
];

function stripPolite(s: string): { stripped: string; suffix: string } | null {
  for (const [suf, label] of POLITE_STRIP) {
    if (s.endsWith(suf)) {
      // Polite ます-stem replaces final い-row → う-row of base.
      // We need to reconstruct an う-row form: drop suffix, append る (heuristic for ichidan-like) — but here we just return stripped + 'る' is wrong.
      // Instead: caller will combine with detectGodanDerived using stripped + 'る' for ichidan-shaped passives like 包まれ + ます → 包まれる
      return { stripped: s.slice(0, -suf.length) + 'る', suffix: label };
    }
  }
  return null;
}

function detectGodanDerived(original: string, baseForm: string): string | null {
  const lastBase = baseForm.slice(-1);
  const stem = baseForm.slice(0, -1);
  const aRow = GODAN_A_ROW[lastBase];
  if (!aRow) return null;
  const aStem = stem + aRow;
  if (original === aStem + 'れる') return 'Passive (受身形)';
  if (original === aStem + 'れた') return 'Passive past (受身過去形)';
  if (original === aStem + 'せる') return 'Causative (使役形)';
  if (original === aStem + 'せた') return 'Causative past (使役過去形)';
  if (original === aStem + 'される') return 'Causative-passive (使役受身形)';
  if (original === aStem + 'ない') return 'Negative (否定形)';
  if (original === aStem + 'なかった') return 'Negative past (否定過去形)';
  return null;
}

function getConjugationLabel(original: string, deinflected: string | null | undefined, dictWord?: string): string | null {
  const baseForm = deinflected || dictWord;
  if (!baseForm || baseForm === original) return null;

  // 1. Direct godan-derived (passive/causative) match
  const direct = detectGodanDerived(original, baseForm);
  if (direct) return direct;

  // 2. Strip polite suffix, then check godan-derived (e.g. 包まれます → 包まれる → passive)
  const polite = stripPolite(original);
  if (polite) {
    const inner = detectGodanDerived(polite.stripped, baseForm);
    if (inner) return `${inner} + ${polite.suffix}`;
  }

  // 3. Generic suffix patterns
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

export function WordPopup({ word, baseForm: kuromojiBase, reading: overrideReading, pos: kuromojiPos, contextSentence, onClose }: WordPopupProps) {
  const { addWord, hasWord, removeWord } = useFlashcardStore();
  const navigate = useNavigate();

  // Try looking up the base form first (more likely to have dictionary entries)
  const lookupKey = kuromojiBase || word;
  const surfaceForMatch = kuromojiBase || word;
  const cached = (kuromojiBase && kuromojiBase !== word ? getCached(kuromojiBase) : undefined) ?? getCached(word);
  const [loading, setLoading] = useState(!cached);
  const [result, setResult] = useState<JishoResult | null>(pickBestResult(cached?.results, kuromojiPos, surfaceForMatch));
  const [deinflected, setDeinflected] = useState<string | null>(cached?.deinflected ?? kuromojiBase ?? null);
  const [error, setError] = useState(false);

  const wordId = word;
  const saved = hasWord(wordId);

  useEffect(() => {
    if (cached) {
      const best = pickBestResult(cached.results, kuromojiPos, surfaceForMatch);
      if (best) {
        setResult(best);
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
          const best = pickBestResult(entry.results, kuromojiPos, kuromojiBase);
          if (best) {
            if (!cancelled) {
              setResult(best);
              setDeinflected(kuromojiBase);
            }
            return;
          }
        }
        entry = await lookupWord(word);
        const best = pickBestResult(entry.results, kuromojiPos, surfaceForMatch);
        if (!cancelled && best) {
          setResult(best);
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
  }, [word, kuromojiBase, kuromojiPos, cached]);

  const conjugationLabel = getConjugationLabel(word, deinflected, result?.japanese[0]?.word);

  const dictForm = result?.japanese[0]?.word || deinflected || word;
  // Use Kuromoji POS if available, otherwise fall back to Jisho POS
  const allPartsOfSpeech = result?.senses?.flatMap(s => s.parts_of_speech) || 
    (kuromojiPos ? kuromojiPosToJisho(kuromojiPos) : []);
  const wordType = getWordType(allPartsOfSpeech);

  const handleSave = () => {
    if (saved) {
      removeWord(wordId);
      return;
    }
    if (!result) return;
    const disp = getDisplayWord(result, surfaceForMatch);
    const entry: SavedWord = {
      id: wordId,
      word: disp.word || word,
      reading: disp.reading || result.japanese[0]?.reading || '',
      meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
      jlpt: result.jlpt,
      partsOfSpeech: result.senses[0]?.parts_of_speech,
      contextSentence,
      mastery: 0,
    };
    addWord(entry);
  };

  const disp = result ? getDisplayWord(result, surfaceForMatch) : { word, reading: undefined as string | undefined };
  const displayWord = disp.word || word;
  const displayReading = overrideReading || disp.reading;
  const isCommon = (result as any)?.is_common;

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-2 sr-only">
          <DrawerTitle>{displayWord}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-3 overflow-y-auto">
          {loading && <LoadingSkeleton />}

          {error && !loading && (
            <p className="text-sm text-muted-foreground py-4">No definition found.</p>
          )}

          {result && !loading && (
            <>

              {/* Word + reading + romaji + audio */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-japanese text-2xl font-bold">{displayWord}</p>
                {displayReading && displayReading !== displayWord && (
                  <span className="font-japanese text-base text-muted-foreground">{displayReading}</span>
                )}
                {displayReading && (
                  <span className="text-xs text-muted-foreground/70 italic">{toRomaji(displayReading)}</span>
                )}
                <PlayWordButton word={displayWord} reading={displayReading} size={18} />
              </div>

              {/* Tags */}
              {(isCommon || (result.senses[0]?.parts_of_speech?.length ?? 0) > 0) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {isCommon && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary/80 border border-primary/15">
                      ✦ Common
                    </span>
                  )}
                  {result.senses[0]?.parts_of_speech?.map((pos, i) => (
                    <span key={i} className="font-serif italic text-[11px] text-muted-foreground">
                      {pos}{i < (result.senses[0]?.parts_of_speech?.length ?? 0) - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Meanings */}
              <section className="mt-4">
                <p className="font-serif text-[13px] font-semibold text-foreground/80">Meanings</p>
                <span className="mt-1 mb-2 block h-px w-6 bg-foreground/30" />
                <ol className="space-y-1.5">
                  {result.senses.slice(0, 3).map((sense, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
                      <span className="font-serif text-foreground/40 tabular-nums">{i + 1}.</span>
                      <span className="flex-1 font-medium text-foreground">{sense.english_definitions.join('; ')}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-5">
                <p className="font-serif text-[13px] font-semibold text-foreground/80">Examples</p>
                <span className="mt-1 mb-2 block h-px w-6 bg-foreground/30" />
                <ExampleSentence word={displayWord} />
              </section>

              {wordType && (
                <section className="mt-5">
                  <p className="font-serif text-[13px] font-semibold text-foreground/80">Conjugations</p>
                  <span className="mt-1 mb-2 block h-px w-6 bg-foreground/30" />
                  <ConjugationTable dictForm={dictForm} partsOfSpeech={allPartsOfSpeech} />
                </section>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={handleSave}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.97] ${
                    saved
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  <Star className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Remove from Flashcards' : 'Add to Flashcards'}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/dictionary?q=${encodeURIComponent(dictForm)}`);
                  }}
                  className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-primary/10 text-primary transition-all active:scale-[0.97] hover:bg-primary/20"
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
