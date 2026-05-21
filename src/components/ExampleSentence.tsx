import { useState, useEffect } from 'react';
import { fetchExample, type ExampleSentence as ExampleData } from '@/lib/tatoeba';
import { PlayWordButton } from '@/components/PlayWordButton';
import { Skeleton } from '@/components/ui/skeleton';

interface ExampleSentenceProps {
  word: string;
  className?: string;
}

export function ExampleSentence({ word, className = '' }: ExampleSentenceProps) {
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
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  if (!example) return null;

  const highlightWord = (text: string) => {
    const index = text.indexOf(word);
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <span className="text-accent font-bold">{word}</span>
        {text.slice(index + word.length)}
      </>
    );
  };

  return (
    <blockquote className={`rounded-xl bg-muted/40 ring-1 ring-border/40 p-4 ${className}`}>
      <div className="flex items-start gap-2">
        <span className="font-serif text-2xl text-foreground/30 leading-none shrink-0 -mt-1">&ldquo;</span>
        <p className="font-japanese text-[15px] leading-relaxed flex-1">
          {highlightWord(example.japanese)}
        </p>
        <PlayWordButton word={example.japanese} size={14} className="mt-0.5 shrink-0" />
      </div>
      {example.english && (
        <p className="mt-1 text-[12px] text-muted-foreground">
          {example.english}
        </p>
      )}
    </blockquote>
  );
}
