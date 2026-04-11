import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface ConjugationRow {
  label: string;
  labelJp: string;
  form: string;
}

// Detect verb type from Jisho parts_of_speech
function getVerbType(dictForm: string, partsOfSpeech: string[]): 'godan' | 'ichidan' | 'suru' | 'kuru' | null {
  const pos = partsOfSpeech.join(' ').toLowerCase();
  // Only show suru table for する itself, not compounds like 勉強する
  if (pos.includes('suru')) {
    if (dictForm === 'する') return 'suru';
    return null;
  }
  if (pos.includes('kuru') || dictForm === '来る') return 'kuru';
  if (pos.includes('ichidan')) return 'ichidan';
  if (pos.includes('godan')) return 'godan';
  return null;
}

// Get the godan verb stem ending map
const GODAN_MAP: Record<string, { i: string; a: string; e: string; o: string; te: string; ta: string }> = {
  'う': { i: 'い', a: 'わ', e: 'え', o: 'お', te: 'って', ta: 'った' },
  'く': { i: 'き', a: 'か', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
  'ぐ': { i: 'ぎ', a: 'が', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
  'す': { i: 'し', a: 'さ', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
  'つ': { i: 'ち', a: 'た', e: 'て', o: 'と', te: 'って', ta: 'った' },
  'ぬ': { i: 'に', a: 'な', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
  'ぶ': { i: 'び', a: 'ば', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
  'む': { i: 'み', a: 'ま', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
  'る': { i: 'り', a: 'ら', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
};

// Special case: 行く
function isIku(word: string): boolean {
  return word === '行く' || word === 'いく';
}

function conjugateGodan(stem: string, ending: string): ConjugationRow[] {
  const map = GODAN_MAP[ending];
  if (!map) return [];

  const te = isIku(stem + ending) ? stem + 'って' : stem + map.te;
  const ta = isIku(stem + ending) ? stem + 'った' : stem + map.ta;

  return [
    { label: 'Dictionary', labelJp: '辞書形', form: stem + ending },
    { label: 'Polite', labelJp: '丁寧形', form: stem + map.i + 'ます' },
    { label: 'Negative', labelJp: '否定形', form: stem + map.a + 'ない' },
    { label: 'Past', labelJp: '過去形', form: ta },
    { label: 'Polite past', labelJp: '丁寧過去', form: stem + map.i + 'ました' },
    { label: 'Te-form', labelJp: 'て形', form: te },
    { label: 'Potential', labelJp: '可能形', form: stem + map.e + 'る' },
    { label: 'Passive', labelJp: '受身形', form: stem + map.a + 'れる' },
    { label: 'Causative', labelJp: '使役形', form: stem + map.a + 'せる' },
    { label: 'Volitional', labelJp: '意志形', form: stem + map.o + 'う' },
    { label: 'Conditional', labelJp: '仮定形', form: stem + map.e + 'ば' },
  ];
}

function conjugateIchidan(stem: string): ConjugationRow[] {
  return [
    { label: 'Dictionary', labelJp: '辞書形', form: stem + 'る' },
    { label: 'Polite', labelJp: '丁寧形', form: stem + 'ます' },
    { label: 'Negative', labelJp: '否定形', form: stem + 'ない' },
    { label: 'Past', labelJp: '過去形', form: stem + 'た' },
    { label: 'Polite past', labelJp: '丁寧過去', form: stem + 'ました' },
    { label: 'Te-form', labelJp: 'て形', form: stem + 'て' },
    { label: 'Potential', labelJp: '可能形', form: stem + 'られる' },
    { label: 'Passive', labelJp: '受身形', form: stem + 'られる' },
    { label: 'Causative', labelJp: '使役形', form: stem + 'させる' },
    { label: 'Volitional', labelJp: '意志形', form: stem + 'よう' },
    { label: 'Conditional', labelJp: '仮定形', form: stem + 'れば' },
  ];
}

function conjugateSuru(stem: string): ConjugationRow[] {
  // stem = everything before する
  return [
    { label: 'Dictionary', labelJp: '辞書形', form: stem + 'する' },
    { label: 'Polite', labelJp: '丁寧形', form: stem + 'します' },
    { label: 'Negative', labelJp: '否定形', form: stem + 'しない' },
    { label: 'Past', labelJp: '過去形', form: stem + 'した' },
    { label: 'Polite past', labelJp: '丁寧過去', form: stem + 'しました' },
    { label: 'Te-form', labelJp: 'て形', form: stem + 'して' },
    { label: 'Potential', labelJp: '可能形', form: stem + 'できる' },
    { label: 'Passive', labelJp: '受身形', form: stem + 'される' },
    { label: 'Causative', labelJp: '使役形', form: stem + 'させる' },
    { label: 'Volitional', labelJp: '意志形', form: stem + 'しよう' },
    { label: 'Conditional', labelJp: '仮定形', form: stem + 'すれば' },
  ];
}

function conjugateKuru(): ConjugationRow[] {
  return [
    { label: 'Dictionary', labelJp: '辞書形', form: '来る' },
    { label: 'Polite', labelJp: '丁寧形', form: '来ます' },
    { label: 'Negative', labelJp: '否定形', form: '来ない' },
    { label: 'Past', labelJp: '過去形', form: '来た' },
    { label: 'Polite past', labelJp: '丁寧過去', form: '来ました' },
    { label: 'Te-form', labelJp: 'て形', form: '来て' },
    { label: 'Potential', labelJp: '可能形', form: '来られる' },
    { label: 'Passive', labelJp: '受身形', form: '来られる' },
    { label: 'Causative', labelJp: '使役形', form: '来させる' },
    { label: 'Volitional', labelJp: '意志形', form: '来よう' },
    { label: 'Conditional', labelJp: '仮定形', form: '来れば' },
  ];
}

export function getConjugations(dictForm: string, partsOfSpeech: string[]): ConjugationRow[] | null {
  const verbType = getVerbType(partsOfSpeech);
  if (!verbType) return null;

  if (verbType === 'kuru') return conjugateKuru();

  if (verbType === 'suru') {
    const stem = dictForm.replace(/する$/, '');
    return conjugateSuru(stem);
  }

  if (verbType === 'ichidan') {
    const stem = dictForm.slice(0, -1); // remove る
    return conjugateIchidan(stem);
  }

  if (verbType === 'godan') {
    const lastChar = dictForm.slice(-1);
    const stem = dictForm.slice(0, -1);
    return conjugateGodan(stem, lastChar);
  }

  return null;
}

interface ConjugationTableProps {
  dictForm: string;
  partsOfSpeech: string[];
}

export function ConjugationTable({ dictForm, partsOfSpeech }: ConjugationTableProps) {
  const [open, setOpen] = useState(false);
  const rows = getConjugations(dictForm, partsOfSpeech);

  if (!rows || rows.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm font-semibold text-foreground transition-colors active:bg-muted">
        <span>Conjugation table</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-lg border border-border overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                i % 2 === 0 ? 'bg-muted/30' : 'bg-background'
              } ${i === 0 ? 'bg-primary/10' : ''}`}
            >
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span className="text-[10px] text-muted-foreground/70">{row.labelJp}</span>
              </div>
              <span className={`font-japanese text-base ${i === 0 ? 'font-bold text-primary' : 'text-foreground'}`}>
                {row.form}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
