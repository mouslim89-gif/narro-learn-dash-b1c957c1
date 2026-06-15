import { useState, useEffect, useLayoutEffect, useRef } from'react';
import { Star, ChevronRight, Loader2, Languages } from'lucide-react';
import { PlayWordButton } from'@/components/PlayWordButton';
import { useFlashcardStore, type SavedWord } from'@/stores/flashcards';
import { getCached, lookupWord, pickBestResult, getDisplayWord, type JishoResult, type CacheEntry } from'@/lib/jisho';
import { useBodyScrollLock } from'@/hooks/use-body-scroll-lock';

interface WordMiniPopupProps {
 word: string;
 baseForm?: string;
 reading?: string;
 pos?: string;
 contextSentence?: string;
 contextTokens?: { t: string; r?: string }[];
 sentenceRect: { top: number; bottom: number; left: number; right: number };
 onClose: () => void;
 onShowMore: () => void;
 onTranslateSentence?: () => void;
}

export function WordMiniPopup({
 word,
 baseForm,
 reading: overrideReading,
 pos,
 contextSentence,
 contextTokens,
 sentenceRect,
 onClose,
 onShowMore,
 onTranslateSentence,
}: WordMiniPopupProps) {
 const { addWord, hasWord, removeWord } = useFlashcardStore();
 const popupRef = useRef<HTMLDivElement>(null);

 const surfaceForMatch = baseForm || word;
 const cached = (baseForm && baseForm !== word ? getCached(baseForm) : undefined) ?? getCached(word);
 const [loading, setLoading] = useState(!cached);
 const [result, setResult] = useState<JishoResult | null>(pickBestResult(cached?.results, pos, surfaceForMatch));
 const [error, setError] = useState(false);

 const wordId = word;
 const saved = hasWord(wordId);

 const [position, setPosition] = useState<{ top: number; left: number; placement:'above'|'below'} | null>(null);

 useEffect(() => {
 if (cached) {
 const best = pickBestResult(cached.results, pos, surfaceForMatch);
 if (best) setResult(best);
 else setError(true);
 setLoading(false);
 return;
 }

 let cancelled = false;
 setLoading(true);
 setError(false);

 const tryLookup = async () => {
 try {
 let entry: CacheEntry | null = null;
 if (baseForm && baseForm !== word) {
 entry = await lookupWord(baseForm);
 const best = pickBestResult(entry.results, pos, baseForm);
 if (best) {
 if (!cancelled) setResult(best);
 return;
 }
 }
 entry = await lookupWord(word);
 const best = pickBestResult(entry.results, pos, surfaceForMatch);
 if (!cancelled && best) setResult(best);
 else if (!cancelled) setError(true);
 } catch {
 if (!cancelled) setError(true);
 } finally {
 if (!cancelled) setLoading(false);
 }
 };
 tryLookup();
 return () => { cancelled = true; };
 }, [word, baseForm, pos, cached]);

 // Position based on sentence rect
 useBodyScrollLock();
 useLayoutEffect(() => {
 if (!popupRef.current) return;
 const popup = popupRef.current;
 const rect = popup.getBoundingClientRect();
 const vw = window.innerWidth;
 const vh = window.innerHeight;
 const PADDING = 8;
 const GAP = 6;
 const BOTTOM_RESERVE = 88;

 // Center horizontally on sentence, clamp to viewport
 const sentenceCenter = (sentenceRect.left + sentenceRect.right) / 2;
 let left = sentenceCenter - rect.width / 2;
 left = Math.max(PADDING, Math.min(left, vw - rect.width - PADDING));

 // Prefer above the sentence
 let placement:'above'|'below'='above';
 let top = sentenceRect.top - rect.height - GAP;
 if (top < PADDING + 56) {
 // Not enough room above, place below
 placement ='below';
 top = sentenceRect.bottom + GAP;
 }
 const bottomLimit = vh - BOTTOM_RESERVE;
 if (top + rect.height > bottomLimit) {
 if (placement ==='below') {
 const above = sentenceRect.top - rect.height - GAP;
 if (above >= PADDING + 56) {
 placement ='above';
 top = above;
 } else {
 top = Math.max(PADDING + 56, bottomLimit - rect.height);
 }
 } else {
 top = Math.max(PADDING + 56, bottomLimit - rect.height);
 }
 }

 setPosition({ top, left, placement });
 }, [sentenceRect, loading, result]);

 // Close on click outside
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
 onClose();
 }
 };
 const timer = setTimeout(() => {
 document.addEventListener('mousedown', handler);
 document.addEventListener('touchstart', handler as any);
 }, 50);
 return () => {
 clearTimeout(timer);
 document.removeEventListener('mousedown', handler);
 document.removeEventListener('touchstart', handler as any);
 };
 }, [onClose]);

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
 reading: disp.reading || result.japanese[0]?.reading ||'',
 meanings: result.senses.flatMap(s => s.english_definitions).slice(0, 5),
 jlpt: result.jlpt,
 partsOfSpeech: result.senses[0]?.parts_of_speech,
 contextSentence,
 contextTokens,
 mastery: 0,
 };
 addWord(entry);
 };

 const disp = result ? getDisplayWord(result, surfaceForMatch) : { word, reading: undefined as string | undefined };
 const headerWord = disp.word || word;
 const isShowingSurface = headerWord === word;
 const headerReading = (isShowingSurface ? overrideReading : undefined) || disp.reading;

 return (
 <div
 ref={popupRef}
 className={`fixed z-[60] w-[min(300px,calc(100vw-16px))] rounded-2xl bg-card ring-1 ring-border/50 shadow-xl ${
 position
 ? position.placement ==='above'?'animate-mini-slide-up':'animate-mini-slide-down':''}`}
 style={{
 top: position?.top ?? -9999,
 left: position?.left ?? -9999,
 opacity: position ? 1 : 0,
 }}
 >

 {/* Header: word + actions inline */}
 <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-0.5">
 <span className="font-japanese text-base font-bold truncate min-w-0">
 {headerWord}
 </span>
 <PlayWordButton
 word={headerWord}
 reading={headerReading}
 size={16}
 />
 {result && !loading && (
 <button
 onClick={handleSave}
              className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors ring-1 ${
                saved
                  ? 'bg-accent/15 text-accent ring-accent/30' : 'bg-muted/60 text-muted-foreground ring-transparent'}`}
 title={saved ?'Remove from flashcards':'Add to flashcards'}
 >
 <Star className="h-3.5 w-3.5"fill={saved ?'currentColor':'none'} />
 </button>
 )}
 <div className="flex-1"/>
      {(result as any)?.is_common && (
        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary ring-1 ring-primary/20">
          ✦ Common
        </span>
      )}
 {result && !loading && onTranslateSentence && contextSentence && (
 <button
 onClick={onTranslateSentence}
 className="flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground transition-colors"
 title="Translate sentence"
 >
 <Languages className="h-3 w-3"/>
 </button>
 )}
 {result && !loading && (
 <button
 onClick={onShowMore}
 className="flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors"
 >
 More <ChevronRight className="h-3 w-3"/>
 </button>
 )}
 </div>

 {/* Reading */}
 {headerReading && headerReading !== headerWord && (
 <p className="font-japanese text-[11px] text-muted-foreground px-2.5 -mt-0.5">
 {headerReading}
 </p>
 )}

 {/* Content */}
 <div className="px-2.5 pt-1 pb-2">
 {loading && (
 <div className="flex items-center gap-2 py-2 text-muted-foreground">
 <Loader2 className="h-3.5 w-3.5 animate-spin"/>
 <span className="text-[11px]">Looking up…</span>
 </div>
 )}

 {error && !loading && (
 <p className="text-[11px] text-muted-foreground py-1">No definition found.</p>
 )}

 {result && !loading && (
 <>
 <div className="space-y-0.5">
 {result.senses.slice(0, 2).map((sense, i) => (
 <p key={i} className="text-[13px] font-semibold text-accent">
 {i + 1}. {sense.english_definitions.join('; ')}
 </p>
 ))}
 </div>
 {result.senses[0]?.parts_of_speech && (
 <p className="font-serif italic text-[11px] text-muted-foreground mt-1">
 {result.senses[0].parts_of_speech.join(',')}
 </p>
 )}
 </>
 )}
 </div>
 </div>
 );
}

