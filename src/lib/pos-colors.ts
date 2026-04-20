export type PosCategory = 'verb' | 'noun' | 'adjective' | 'particle' | 'adverb' | 'other';

const POS_MAP: [string, PosCategory][] = [
  ['動詞', 'verb'],
  ['助動詞', 'verb'], // group auxiliaries with verbs (consistent with token merging)
  ['形容詞', 'adjective'],
  ['形容動詞', 'adjective'],
  ['副詞', 'adverb'],
  ['名詞', 'noun'],
  ['助詞', 'particle'],
];

const COLOR_CLASSES: Record<PosCategory, string> = {
  verb: 'text-teal-600 dark:text-teal-400',
  noun: 'text-rose-500 dark:text-rose-400',
  adjective: 'text-violet-500 dark:text-violet-400',
  particle: 'text-slate-400 dark:text-slate-500',
  adverb: 'text-amber-600 dark:text-amber-400',
  other: '',
};

export const LEGEND: { label: string; category: PosCategory; color: string }[] = [
  { label: 'Verb', category: 'verb', color: 'bg-teal-500' },
  { label: 'Noun', category: 'noun', color: 'bg-rose-500' },
  { label: 'Adjective', category: 'adjective', color: 'bg-violet-500' },
  { label: 'Particle', category: 'particle', color: 'bg-slate-400' },
  { label: 'Adverb', category: 'adverb', color: 'bg-amber-500' },
];

export function getPosCategory(pos?: string): PosCategory {
  if (!pos) return 'other';
  const prefix = pos.split('/')[0];
  for (const [key, cat] of POS_MAP) {
    if (prefix === key) return cat;
  }
  return 'other';
}

export function getPosColorClass(pos?: string): string {
  return COLOR_CLASSES[getPosCategory(pos)];
}
