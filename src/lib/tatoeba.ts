import { supabase } from '@/integrations/supabase/client';

export interface ExampleSentence {
  japanese: string;
  english: string;
}

const cache = new Map<string, ExampleSentence | null>();

export async function fetchExample(word: string): Promise<ExampleSentence | null> {
  if (cache.has(word)) return cache.get(word)!;

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
