import { useEffect, useState } from'react';
import { useParams } from'react-router-dom';
import { DelayedLink as Link } from'@/components/DelayedLink';
import { useDelayedNav } from '@/hooks/use-delayed-nav';
import { ArrowLeft, Star, Loader2 } from'lucide-react';
import { searchJisho, getDisplayWord, type JishoResult } from'@/lib/jisho';
import { useFlashcardStore, type SavedWord } from'@/stores/flashcards';
import { PlayWordButton } from'@/components/PlayWordButton';
import { ConjugationTable, getConjugations } from'@/components/ConjugationTable';
import { Button } from'@/components/ui/button';
import { Skeleton } from'@/components/ui/skeleton';
import { toRomaji } from'wanakana';
import { fetchExamples, type ExampleSentence as ExampleData } from'@/lib/tatoeba';
import { extractKanji, fetchKanji, type KanjiDetails } from'@/lib/kanji';
import { cn } from '@/lib/utils';
import { ExampleSentence } from '@/components/ExampleSentence';

export default function WordDetail() {
 const { word: rawWord } = useParams<{ word: string }>();
 const goTo = useDelayedNav();
 const word = rawWord ? decodeURIComponent(rawWord) :'';
 const { addWord, removeWord, hasWord } = useFlashcardStore();

 const [result, setResult] = useState<JishoResult | null>(null);
 const [loading, setLoading] = useState(true);
 const [examples, setExamples] = useState<ExampleData[] | null>(null);
 const [kanjiList, setKanjiList] = useState<KanjiDetails[] | null>(null);
 const [saved, setSaved] = useState(false);

 useEffect(() => {
  setSaved(hasWord(word));
 }, [word, hasWord]);

 useEffect(() => {
  setLoading(true);
  searchJisho(word).then(res => {
   if (res && res.length > 0) {
    const firstResult = res[0];
    setResult(firstResult);
    fetchExamples(firstResult.japanese[0]?.word || word).then(setExamples);
    const kanjiChars = extractKanji(firstResult.japanese[0]?.word || word);
    Promise.all(kanjiChars.map(fetchKanji)).then(details => setKanjiList(details.filter((d): d is KanjiDetails => d !== null)));
   }
   setLoading(false);
  });
 }, [word]);

 const display = result ? getDisplayWord(result).word : word;
 const displayReading = result ? (result.japanese[0]?.reading || '') : '';

 const handleBack = (e: React.MouseEvent) => {
  if (window.history.length > 1) goTo(-1, e);
  else goTo('/dictionary', e);
 };

 const toggleSave = () => {
  if (!result) return;
  if (saved) {
   removeWord(display);
   setSaved(false);
  } else {
   const entry: Omit<SavedWord,'mastery'> = {
    id: crypto.randomUUID(),
    word: display,
    reading: displayReading,
    meanings: result.senses.flatMap(s => s.english_definitions.slice(0, 2)),
    jlpt: result.jlpt || [],
    partsOfSpeech: result.senses[0]?.parts_of_speech || [],
   };
   addWord(entry);
   setSaved(true);
  }
 };

 return (
  <div className="min-h-screen bg-background pb-20">
   <header className="sticky top-0 z-30 flex items-center gap-4 bg-background/80 px-6 py-4 backdrop-blur-md">
    <button onClick={handleBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 header-chip">
     <ArrowLeft className="h-5 w-5"/>
    </button>
    <h1 className="font-serif text-xl font-bold">{word}</h1>
    <div className="ml-auto">
     <Button variant="ghost" size="icon" onClick={toggleSave} className={cn("rounded-full", saved && "text-amber-500")}>
      <Star className={cn("h-5 w-5", saved && "fill-current")}/>
     </Button>
    </div>
   </header>

   <div className="px-6 mt-6">
    {loading ? (
     <div className="space-y-4">
      <Skeleton className="h-8 w-48"/>
      <Skeleton className="h-24 w-full"/>
     </div>
    ) : result ? (
     <div className="space-y-8 animate-fade-in-soft">
      <div>
       <h2 className="font-japanese text-5xl font-bold mb-2">{result.japanese[0]?.word}</h2>
       <p className="text-xl text-muted-foreground">{result.japanese[0]?.reading}</p>
      </div>

      <div className="space-y-6">
       {result.senses.map((sense, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5 ring-1 ring-border/30">
         <div className="text-sm font-semibold text-primary mb-2">
          {sense.parts_of_speech.join(', ')}
         </div>
         <ul className="list-decimal list-inside space-y-1.5">
          {sense.english_definitions.map((def, j) => (
           <li key={j} className="text-foreground leading-relaxed">{def}</li>
          ))}
         </ul>
        </div>
       ))}
      </div>

      {examples && examples.length > 0 && (
       <section>
        <h3 className="font-serif text-lg font-semibold mb-4">Examples</h3>
        <div className="space-y-3">
         {examples.slice(0, 3).map((ex, i) => (
          <ExampleSentence key={i} word={ex.japanese} />
         ))}
        </div>
       </section>
      )}
     </div>
    ) : (
     <div className="text-center text-muted-foreground">Word not found.</div>
    )}
   </div>
  </div>
 );
}
