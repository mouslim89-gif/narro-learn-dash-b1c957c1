import { describe, expect, it } from 'vitest';
import { getFuriganaSegments } from '@/components/FuriganaWord';
import type { CacheEntry } from '@/lib/jisho';

function createCache(word: string, reading: string, deinflected?: string): CacheEntry {
  return {
    deinflected: deinflected ?? null,
    results: [
      {
        slug: word,
        is_common: true,
        jlpt: [],
        tags: [],
        japanese: [{ word, reading }],
        senses: [{ english_definitions: ['test'], parts_of_speech: ['verb'] }],
      },
    ],
  };
}

describe('getFuriganaSegments', () => {
  it('aligns mixed kanji words correctly', () => {
    expect(getFuriganaSegments('食べる', createCache('食べる', 'たべる'))).toEqual([
      { text: '食', reading: 'た' },
      { text: 'べる' },
    ]);
  });

  it('projects dictionary-form readings onto polite inflections', () => {
    expect(getFuriganaSegments('行きました', createCache('行く', 'いく', '行く'))).toEqual([
      { text: '行', reading: 'い' },
      { text: 'きました' },
    ]);
  });

  it('keeps multiple kanji chunks when inflected', () => {
    expect(getFuriganaSegments('申し込んだ', createCache('申し込む', 'もうしこむ', '申し込む'))).toEqual([
      { text: '申', reading: 'もう' },
      { text: 'し' },
      { text: '込', reading: 'こ' },
      { text: 'んだ' },
    ]);
  });
});