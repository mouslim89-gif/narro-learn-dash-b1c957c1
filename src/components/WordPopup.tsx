import { useState, useMemo, useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import {
 Drawer,
 DrawerContent,
 DrawerHeader,
 DrawerTitle,
} from'@/components/ui/drawer';
import { useFlashcardStore, type SavedWord } from'@/stores/flashcards';
import { PlayWordButton } from'./PlayWordButton';
import { Button } from'@/components/ui/button';
import { Star, BookOpen } from'lucide-react';
import { lookupWord, pickBestResult, type JishoResult, type CacheEntry } from'@/lib/jisho';
import { cn } from '@/lib/utils';

interface WordPopupProps {
 word: string;
 baseForm?: string;
 reading?: string;
 pos?: string[];
 contextSentence?: string;
 contextTokens?: any[];
 onClose?: () => void;
}

export function WordPopup({ word, baseForm: kuromojiBase, reading: overrideReading, pos: kuromojiPos, contextSentence, contextTokens, onClose }: WordPopupProps) {
 const { addWord, hasWord, removeWord } = useFlashcardStore();
 const goTo = useDelayedNav();

 const [loading, setLoading] = useState(true);
 const [result, setResult] = useState<JishoResult | null>(null);

 useEffect(() => {
  lookupWord(kuromojiBase || word).then((res: CacheEntry) => {
    setResult(pickBestResult(res.results, kuromojiPos, kuromojiBase || word));
    setLoading(false);
  });
 }, [word, kuromojiBase, kuromojiPos]);

 const isSaved = hasWord(word);
 const dictForm = result?.japanese[0]?.word || kuromojiBase || word;

 return (
  <Drawer open={true} onOpenChange={(o) => !o && onClose?.()}>
   <DrawerContent>
    <DrawerHeader className="text-left">
     <DrawerTitle className="font-japanese text-3xl font-bold">{word}</DrawerTitle>
     {result && <p className="text-muted-foreground">{result.japanese[0]?.reading}</p>}
    </DrawerHeader>

    <div className="p-6 pt-2 space-y-6">
     {loading ? (
       <div className="space-y-2">
         <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
         <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
       </div>
     ) : result ? (
      <>
       <div className="space-y-4">
        {result.senses.slice(0, 2).map((s, i) => (
         <div key={i} className="text-sm">
          <p className="font-semibold text-primary mb-1">{s.parts_of_speech.join(', ')}</p>
          <p className="text-muted-foreground">{s.english_definitions.join(', ')}</p>
         </div>
        ))}
       </div>

       <div className="flex gap-2">
        <Button 
          variant={isSaved ? "secondary" : "default"}
          className="flex-1 h-12 rounded-xl text-[15px] font-semibold relief-raised"
          onClick={() => {
            if (isSaved) removeWord(word);
            else {
              const entry: Omit<SavedWord, 'mastery'> = { 
                id: crypto.randomUUID(),
                word, 
                reading: overrideReading || result.japanese[0]?.reading || '', 
                meanings: result.senses.flatMap(s => s.english_definitions.slice(0, 1)), 
                jlpt: result.jlpt || [], 
                partsOfSpeech: result.senses[0]?.parts_of_speech || []
              };
              addWord(entry);
            }
          }}
        >
          <Star className={cn("mr-2 h-4 w-4", isSaved && "fill-current")} /> {isSaved ? "Saved" : "Save"}
        </Button>
        <button 
          className="tap-scale-sm flex items-center justify-center gap-2 rounded-full py-3 px-4 text-sm font-semibold bg-muted/40 text-foreground ring-1 ring-border/40 smooth-colors"
          onClick={(e) => {
            onClose?.();
            goTo(`/dictionary/${encodeURIComponent(dictForm)}`, e);
          }}
        >
          <BookOpen className="h-4 w-4"/> Dictionary
        </button>
       </div>
      </>
     ) : (
      <p className="text-muted-foreground">Definition not found</p>
     )}
    </div>
   </DrawerContent>
  </Drawer>
 );
}
