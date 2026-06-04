import { useEffect, useState } from'react';
import { useNavigate, useParams, Link } from'react-router-dom';
import { ArrowLeft, Star, Loader2 } from'lucide-react';
import { searchJisho, getDisplayWord, type JishoResult } from'@/lib/jisho';
import { useFlashcardStore, type SavedWord } from'@/stores/flashcards';
import { PlayWordButton } from'@/components/PlayWordButton';
import { ConjugationTable, getConjugations } from'@/components/ConjugationTable';
import { Button } from'@/components/ui/button';
import { Skeleton } from'@/components/ui/skeleton';
import { toRomaji } from'wanakana';
import { fetchExamples, type ExampleSentence } from'@/lib/tatoeba';
import { extractKanji, fetchKanji, type KanjiDetails } from'@/lib/kanji';

export default function WordDetail() {
 const { word: rawWord } = useParams<{ word: string }>();
 const navigate = useNavigate();
 const word = rawWord ? decodeURIComponent(rawWord) :'';
 const { addWord, removeWord, hasWord } = useFlashcardStore();

 const [result, setResult] = useState<JishoResult | null>(null);
 const [loading, setLoading] = useState(true);
 const [examples, setExamples] = useState<ExampleSentence[] | null>(null);
 const [kanjiList, setKanjiList] = useState<(KanjiDetails | null)[] | null>(null);

 useEffect(() => {
 if (!word) return;
 let cancelled = false;
 setLoading(true);
 searchJisho(word).then((results) => {
 if (cancelled) return;
 // Prefer exact match on word or reading
 const match =
 results.find((r) => r.japanese.some((j) => j.word === word || j.reading === word)) ||
 results[0] ||
 null;
 setResult(match);
 setLoading(false);
 }).catch(() => { if (!cancelled) setLoading(false); });
 return () => { cancelled = true; };
 }, [word]);

 useEffect(() => {
 if (!word) return;
 let cancelled = false;
 fetchExamples(word, 3).then((s) => { if (!cancelled) setExamples(s); });
 const chars = extractKanji(word);
 if (chars.length === 0) { setKanjiList([]); return; }
 Promise.all(chars.map((c) => fetchKanji(c))).then((data) => {
 if (!cancelled) setKanjiList(data);
 });
 return () => { cancelled = true; };
 }, [word]);

 const disp = result ? getDisplayWord(result) : null;
 const display = disp?.word || word;
 const reading = disp?.reading ||'';
 const saved = hasWord(display);

 const handleBack = () => {
 try {
 const stored = sessionStorage.getItem('reopen-word-popup');
 if (stored) {
 const data = JSON.parse(stored);
 if (data?.returnPath) {
 navigate(data.returnPath);
 return;
 }
 }
 } catch {}
 if (window.history.length > 1) navigate(-1);
 else navigate('/dictionary');
 };

 const toggleSave = () => {
 if (!result) return;
 if (saved) {
 removeWord(display);
 return;
 }
 const entry: Omit<SavedWord,'mastery'> = {
 id: display,
 word: display,
 reading: reading || result.japanese[0]?.reading ||'',
 meanings: result.senses.flatMap((s) => s.english_definitions).slice(0, 5),
 jlpt: result.jlpt,
 partsOfSpeech: result.senses[0]?.parts_of_speech,
 };
 addWord(entry);
 };

 const highlightWord = (text: string, target: string) => {
 const idx = text.indexOf(target);
 if (idx === -1) return text;
 return (
 <>
 {text.slice(0, idx)}
 <span className="text-accent font-bold">{target}</span>
 {text.slice(idx + target.length)}
 </>
 );
 };

 return (
 <div className="pb-24">
 {/* Top bar */}
 <header className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-4 pb-3 bg-background/80 backdrop-blur-md">
 <Button
 variant="ghost"
 size="icon"
 onClick={handleBack}
 className="h-9 w-9 rounded-full bg-muted/60 ring-1 ring-border/40 shrink-0"
 aria-label="Back"
 >
 <ArrowLeft className="h-[18px] w-[18px]"/>
 </Button>
 <div className="flex-1 min-w-0">
 <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Dictionary</p>
 <p className="font-japanese text-base font-bold truncate mt-0.5">{display || word}</p>
 </div>
 {result && (
 <button
 onClick={toggleSave}
 aria-label={saved ?'Remove from flashcards':'Save word'}
 className={`h-9 w-9 rounded-full ring-1 ring-border/40 bg-muted/60 flex items-center justify-center shrink-0 transition-colors ${
 saved ?'text-accent':'text-muted-foreground'}`}
 >
 <Star className="h-4 w-4"fill={saved ?'currentColor':'none'} />
 </button>
 )}
 </header>

 {loading && (
 <div className="mt-10 flex justify-center">
 <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
 </div>
 )}

 {!loading && !result && (
 <div className="mt-16 text-center px-6">
 <p className="font-japanese text-3xl font-bold">{word}</p>
 <p className="mt-3 text-sm text-muted-foreground">No dictionary entry found.</p>
 <Link to="/dictionary"className="mt-6 inline-block text-sm text-primary underline">
 Back to dictionary
 </Link>
 </div>
 )}

 {!loading && result && (
 <div className="stagger-children px-6 mt-2 space-y-5">
 {/* Header card */}
 <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40">
 <div className="flex items-start gap-2">
 <div className="flex-1 min-w-0">
 <p className="font-japanese text-3xl font-bold leading-tight break-words">{display}</p>
 {reading && reading !== display && (
 <p className="font-japanese text-base text-muted-foreground mt-1">{reading}</p>
 )}
 {reading && (
 <p className="text-xs text-muted-foreground/70 italic mt-0.5">{toRomaji(reading)}</p>
 )}
 </div>
 <PlayWordButton word={display} reading={reading} size={20} />
 </div>

 {/* Tags */}
 <div className="mt-3 flex flex-wrap items-center gap-1.5">
 {(result as any).is_common && (
 <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
 ✦ Common
 </span>
 )}
 {result.jlpt.length > 0 && (
 <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-accent ring-1 ring-accent/20">
 {result.jlpt[0]?.replace('jlpt-','JLPT')}
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

 {/* Add to flashcards CTA */}
 <Button
 onClick={toggleSave}
 className={`mt-4 w-full rounded-full h-11 font-semibold ${
 saved
 ?'bg-accent/15 text-accent ring-1 ring-accent/30':'bg-accent text-accent-foreground'}`}
 variant="ghost"
 >
 {saved ? (
 <>
 <Star className="h-4 w-4 mr-1.5"fill="currentColor"/> Saved to flashcards
 </>
 ) : (
 <>
 <Star className="h-4 w-4 mr-1.5"/> Add to flashcards
 </>
 )}
 </Button>
 </section>

 {/* Kanji breakdown */}
 {kanjiList && kanjiList.length > 0 && (
 <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40">
 <h2 className="font-serif text-lg font-bold mb-3">Kanji</h2>
 <div className="space-y-3">
 {kanjiList.map((k, i) => {
 const ch = extractKanji(display)[i];
 if (!k) {
 return (
 <div key={i} className="flex items-center gap-4 rounded-xl bg-muted/40 p-3">
 <span className="font-japanese text-3xl font-bold">{ch}</span>
 <span className="text-xs text-muted-foreground">No data available</span>
 </div>
 );
 }
 return (
 <div key={i} className="rounded-xl bg-muted/40 p-4">
 <div className="flex items-start gap-4">
 <span className="font-japanese text-4xl font-bold leading-none">{k.character}</span>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold">{k.meanings.slice(0, 4).join(',')}</p>
 <div className="mt-1.5 flex flex-wrap gap-1.5">
 {k.jlpt != null && (
 <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent ring-1 ring-accent/20">
 JLPT N{k.jlpt}
 </span>
 )}
 {k.grade != null && (
 <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
 Grade {k.grade}
 </span>
 )}
 {k.stroke_count != null && (
 <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border/40">
 {k.stroke_count} strokes
 </span>
 )}
 </div>
 </div>
 </div>
 <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
 <div>
 <p className="text-[10px] uppercase tracking-wider text-muted-foreground">On'yomi</p>
 <p className="font-japanese mt-0.5">
 {k.on_readings.length ? k.on_readings.join('、') :'—'}
 </p>
 </div>
 <div>
 <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kun'yomi</p>
 <p className="font-japanese mt-0.5">
 {k.kun_readings.length ? k.kun_readings.join('、') :'—'}
 </p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </section>
 )}

 {/* All meanings */}
 <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40">
 <h2 className="font-serif text-lg font-bold mb-3">Meanings</h2>
 <ol className="space-y-3">
 {result.senses.map((sense, i) => (
 <li key={i} className="text-sm">
 <div className="flex gap-2">
 <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
 <div className="flex-1">
 <p className="font-medium text-foreground leading-relaxed">
 {sense.english_definitions.join(';')}
 </p>
 {sense.parts_of_speech.length > 0 && (
 <div className="mt-1 flex flex-wrap gap-1">
 {sense.parts_of_speech.map((pos, j) => (
 <span
 key={j}
 className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
 >
 {pos}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>
 </li>
 ))}
 </ol>
 </section>

 {/* Examples */}
 <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40">
 <h2 className="font-serif text-lg font-bold mb-3">Examples</h2>
 {!examples && (
 <div className="space-y-2">
 <Skeleton className="h-4 w-3/4"/>
 <Skeleton className="h-3 w-1/2"/>
 </div>
 )}
 {examples && examples.length === 0 && (
 <p className="text-sm text-muted-foreground">No example sentences found.</p>
 )}
 {examples && examples.length > 0 && (
 <ul className="space-y-3">
 {examples.map((ex, i) => (
 <li key={i} className="rounded-md bg-muted/50 p-3">
 <div className="flex items-start gap-2">
 <p className="font-japanese text-sm font-semibold leading-relaxed flex-1">
 {highlightWord(ex.japanese, display)}
 </p>
 <PlayWordButton word={ex.japanese} size={14} className="mt-0.5 shrink-0"/>
 </div>
 {ex.english && (
 <p className="mt-1 text-xs text-muted-foreground italic">{ex.english}</p>
 )}
 </li>
 ))}
 </ul>
 )}
 </section>

 {/* Conjugation — wrapped card */}
 {getConjugations(display, result.senses.flatMap((s) => s.parts_of_speech)) && (
 <section className="rounded-2xl bg-card p-5 ring-1 ring-border/40">
 <h2 className="font-serif text-lg font-bold mb-3">Conjugation</h2>
 <ConjugationTable
 dictForm={display}
 partsOfSpeech={result.senses.flatMap((s) => s.parts_of_speech)}
 alwaysOpen
 hideLabel
 />
 </section>
 )}

 </div>
 )}
 </div>
 );
}
