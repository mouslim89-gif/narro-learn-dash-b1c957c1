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

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/jisho-lookup?keyword=${encodeURIComponent(keyword)}`;

  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Jisho lookup failed: ${response.status}`);
  }

  const data = await response.json();
  const results: JishoResult[] = data.results || [];
  cache.set(keyword, results);
  return results;
}

export async function searchJisho(query: string): Promise<JishoResult[]> {
  return lookupWord(query);
}
