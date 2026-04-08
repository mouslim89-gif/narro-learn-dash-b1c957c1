import { supabase } from "@/integrations/supabase/client";

export interface JishoResult {
  slug: string;
  is_common: boolean;
  jlpt: string[];
  tags: string[];
  japanese: { word: string; reading: string }[];
  senses: { english_definitions: string[]; parts_of_speech: string[] }[];
}

// In-memory cache
const cache = new Map<string, JishoResult[]>();

export async function lookupWord(keyword: string): Promise<JishoResult[]> {
  if (cache.has(keyword)) {
    return cache.get(keyword)!;
  }

  const { data, error } = await supabase.functions.invoke('jisho-lookup', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: undefined,
  });

  // supabase.functions.invoke doesn't support query params well for GET,
  // so let's use fetch directly with the URL from the client
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jisho-lookup?keyword=${encodeURIComponent(keyword)}`;

  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Jisho lookup failed: ${response.status}`);
  }

  const responseData = await response.json();
  const results: JishoResult[] = responseData.results || [];
  cache.set(keyword, results);
  return results;
}

export async function searchJisho(query: string): Promise<JishoResult[]> {
  return lookupWord(query);
}
