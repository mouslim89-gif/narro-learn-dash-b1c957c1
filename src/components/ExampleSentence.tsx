import { useState, useEffect } from'react';
import { fetchExample, type ExampleSentence as ExampleData } from'@/lib/tatoeba';
import { PlayWordButton } from'@/components/PlayWordButton';
import { Skeleton } from'@/components/ui/skeleton';

interface ExampleSentenceProps {
 word: string;
 className?: string;
}

export function ExampleSentence({ word, className =''}: ExampleSentenceProps) {
 const [example, setExample] = useState<ExampleData | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);
 fetchExample(word).then((result) => {
 if (!cancelled) {
 setExample(result);
 setLoading(false);
 }
 });
 return () => { cancelled = true; };
 }, [word]);

 if (loading) {
 return (
 <div className={`mt-2 space-y-1 ${className}`}>
 <Skeleton className="h-4 w-3/4"/>
 <Skeleton className="h-3 w-1/2"/>
 </div>
 );
 }

 if (!example) return null;

  const highlightWord = (text: string) => {
    const isKanji = (ch: string) => !!ch && /[\u4e00-\u9fff]/.test(ch);
    const isAllKanji = /^[\u4e00-\u9fff]+$/.test(word);
    
    let foundIdx = -1;
    if (isAllKanji) {
      let idx = -1;
      while ((idx = text.indexOf(word, idx + 1)) !== -1) {
        const charBefore = text[idx - 1];
        const charAfter = text[idx + word.length];
        if (!isKanji(charBefore) && !isKanji(charAfter)) {
          foundIdx = idx;
          break;
        }
      }
    } else {
      foundIdx = text.indexOf(word);
    }

    if (foundIdx === -1) {
      const fallbackIdx = text.indexOf(word);
      if (fallbackIdx === -1) return text;
      foundIdx = fallbackIdx;
    }
    
    return (
      <>
        {text.slice(0, foundIdx)}
        <span className="text-accent font-bold">{word}</span>
        {text.slice(foundIdx + word.length)}
      </>
    );
  };

 return (
 <div className={`mt-2 rounded-md bg-muted/50 p-2.5 ${className}`}>
 <div className="flex items-start gap-1">
 <p className="font-japanese text-sm font-semibold leading-relaxed flex-1">
 {highlightWord(example.japanese)}
 </p>
 <PlayWordButton word={example.japanese} size={14} className="mt-0.5 shrink-0"/>
 </div>
 {example.english && (
 <p className="mt-0.5 text-xs text-muted-foreground italic">
 {example.english}
 </p>
 )}
 </div>
 );
}
