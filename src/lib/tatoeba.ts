import { supabase } from '@/integrations/supabase/client';

export interface ExampleSentence {
  japanese: string;
  english: string;
}

const cache = new Map<string, ExampleSentence | null>();

// Tatoeba's full-text search is unreliable for very short / particle queries
// (searching "に" returns "なに?"). Provide curated examples instead.
const CURATED: Record<string, ExampleSentence> = {
  'は': { japanese: '私は学生です。', english: 'I am a student.' },
  'が': { japanese: '猫が好きです。', english: 'I like cats.' },
  'を': { japanese: '本を読みます。', english: 'I read a book.' },
  'に': { japanese: '七時に起きます。', english: 'I get up at seven.' },
  'へ': { japanese: '東京へ行きます。', english: 'I am going to Tokyo.' },
  'で': { japanese: '電車で行きます。', english: 'I go by train.' },
  'と': { japanese: '友達と話します。', english: 'I talk with my friend.' },
  'も': { japanese: '私も行きます。', english: 'I will go too.' },
  'の': { japanese: '私の本です。', english: 'It is my book.' },
  'か': { japanese: '元気ですか。', english: 'How are you?' },
  'よ': { japanese: 'おいしいよ。', english: "It's tasty, you know." },
  'ね': { japanese: 'いい天気ですね。', english: 'Nice weather, isn\'t it?' },
  'な': { japanese: '静かな部屋。', english: 'A quiet room.' },
  'だ': { japanese: 'これは本だ。', english: 'This is a book.' },
  'から': { japanese: '寒いから帰る。', english: "I'm going home because it's cold." },
  'まで': { japanese: '駅まで歩く。', english: 'I walk to the station.' },
  'より': { japanese: '私より背が高い。', english: 'Taller than me.' },
  'など': { japanese: '本やノートなど。', english: 'Books, notebooks, etc.' },
  'って': { japanese: '田中さんって誰？', english: 'Who is Tanaka?' },
  'けど': { japanese: '安いけど良い。', english: "It's cheap but good." },
  'ので': { japanese: '雨なので家にいる。', english: 'I stay home because it rains.' },
  'のに': { japanese: '勉強したのに失敗した。', english: 'I studied but failed.' },
  'でも': { japanese: '高い。でも買う。', english: "It's expensive. But I'll buy it." },
  'しか': { japanese: '千円しかない。', english: 'I only have 1000 yen.' },
  'だけ': { japanese: '一つだけください。', english: 'Just one, please.' },
};

export async function fetchExample(word: string): Promise<ExampleSentence | null> {
  if (cache.has(word)) return cache.get(word)!;

  if (CURATED[word]) {
    cache.set(word, CURATED[word]);
    return CURATED[word];
  }

  try {
    const { data, error } = await supabase.functions.invoke('tatoeba-example', {
      body: { word },
    });

    if (error || !data?.japanese) {
      cache.set(word, null);
      return null;
    }

    const result: ExampleSentence = {
      japanese: data.japanese,
      english: data.english || '',
    };
    cache.set(word, result);
    return result;
  } catch {
    cache.set(word, null);
    return null;
  }
}

