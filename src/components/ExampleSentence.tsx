import { useState, useEffect } from'react';
import { fetchExample, type ExampleSentence as ExampleData } from '@/lib/tatoeba';
import { highlightJapaneseWord } from '@/lib/utils';
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

  const renderJapanese = (text: string) => {
    const foundIdx = highlightJapaneseWord(text, word);
    if (foundIdx === -1) return text;
    
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
 {renderJapanese(example.japanese)}
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
