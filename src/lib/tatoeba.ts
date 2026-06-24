import { supabase } from'@/integrations/supabase/client';

export interface ExampleSentence {
 japanese: string;
 english: string;
}

const cache = new Map<string, ExampleSentence | null>();

// Tatoeba's full-text search is unreliable for very short / particle queries
// (searching"に"returns"なに?"). Provide curated examples instead.
const CURATED: Record<string, ExampleSentence> = {'は': { japanese:'私は学生です。', english:'I am a student.'},'が': { japanese:'猫が好きです。', english:'I like cats.'},'を': { japanese:'本を読みます。', english:'I read a book.'},'に': { japanese:'七時に起きます。', english:'I get up at seven.'},'へ': { japanese:'東京へ行きます。', english:'I am going to Tokyo.'},'で': { japanese:'電車で行きます。', english:'I go by train.'},'と': { japanese:'友達と話します。', english:'I talk with my friend.'},'も': { japanese:'私も行きます。', english:'I will go too.'},'の': { japanese:'私の本です。', english:'It is my book.'},'か': { japanese:'元気ですか。', english:'How are you?'},'よ': { japanese:'おいしいよ。', english:"It's tasty, you know."},'ね': { japanese:'いい天気ですね。', english:'Nice weather, isn\'t it?'},'な': { japanese:'静かな部屋。', english:'A quiet room.'},'だ': { japanese:'これは本だ。', english:'This is a book.'},'から': { japanese:'寒いから帰る。', english:"I'm going home because it's cold."},'まで': { japanese:'駅まで歩く。', english:'I walk to the station.'},'より': { japanese:'私より背が高い。', english:'Taller than me.'},'など': { japanese:'本やノートなど。', english:'Books, notebooks, etc.'},'って': { japanese:'田中さんって誰？', english:'Who is Tanaka?'},'けど': { japanese:'安いけど良い。', english:"It's cheap but good."},'ので': { japanese:'雨なので家にいる。', english:'I stay home because it rains.'},'のに': { japanese:'勉強したのに失敗した。', english:'I studied but failed.'},'でも': { japanese:'高い。でも買う。', english:"It's expensive. But I'll buy it."},'しか': { japanese:'千円しかない。', english:'I only have 1000 yen.'},'だけ': { japanese:'一つだけください。', english:'Just one, please.'},
};

export async function fetchExample(word: string): Promise<ExampleSentence | null> {
  const examples = await fetchExamples(word, 1);
  return examples.length > 0 ? examples[0] : null;
}

const multiCache = new Map<string, ExampleSentence[]>();

import { isKanji } from './utils';

function isWordStandalone(text: string, word: string): boolean {
  const isTargetAllKanji = /^[\u4e00-\u9fff々]+$/.test(word);
  if (!isTargetAllKanji) return true;

  let idx = -1;
  while ((idx = text.indexOf(word, idx + 1)) !== -1) {
    const charBefore = text[idx - 1];
    const charAfter = text[idx + word.length];
    if (!isKanji(charBefore) && !isKanji(charAfter)) {
      return true;
    }
  }
  return false;
}


export async function fetchExamples(word: string, limit = 3, altWord?: string): Promise<ExampleSentence[]> {
  const key = `${word}::${altWord ?? ''}::${limit}`;
  if (multiCache.has(key)) return multiCache.get(key)!;

  if (CURATED[word]) {
    const arr = [CURATED[word]];
    multiCache.set(key, arr);
    return arr;
  }

  try {
    // Fetch more than requested to allow for filtering of compounds
    const fetchLimit = limit * 4;
    const { data, error } = await supabase.functions.invoke('tatoeba-example', {
      body: { word, limit: fetchLimit, altWord },
    });

    if (error) {
      multiCache.set(key, []);
      return [];
    }

    let sentences: ExampleSentence[] = Array.isArray(data?.sentences) && data.sentences.length
      ? data.sentences
      : data?.japanese
      ? [{ japanese: data.japanese, english: data.english || '' }]
      : [];

    // Filter out sentences where the kanji is part of a larger compound
    // (e.g. if searching for 林, don't show sentences where it's only found in 林檎)
    if (word.length > 0 && isKanji(word[0])) {
      sentences = sentences.filter(s => 
        isWordStandalone(s.japanese, word) || 
        (altWord && isWordStandalone(s.japanese, altWord))
      );
    }


    const finalResults = sentences.slice(0, limit);
    multiCache.set(key, finalResults);
    return finalResults;
  } catch {
    multiCache.set(key, []);
    return [];
  }
}

