import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface Token {
  t: string; // text
  r?: string; // reading (hiragana)
}

interface Sentence {
  japanese: string;
  english: string;
  tokens?: Token[];
}

async function tokenizeWithAI(japanese: string, apiKey: string): Promise<Token[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a Japanese linguistics expert. Tokenize the given Japanese sentence and provide readings for words containing Kanji. Format the output as a JSON array of tokens where each token is {t: 'surface', r: 'reading'}. Only include 'r' for tokens containing Kanji. Reading should be in Hiragana. Return ONLY the JSON array." },
        { role: "user", content: japanese }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", errorText);
    return [{ t: japanese }];
  }

  const data = await response.json();
  try {
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    // Handle both cases: direct array or object with 'tokens' property
    return Array.isArray(parsed) ? parsed : (parsed.tokens || [{ t: japanese }]);
  } catch (err) {
    console.error("AI parsing error:", err);
    return [{ t: japanese }];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

  // Admin check
  if (auth.user.email !== 'mouslim89@gmail.com') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders });
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: corsHeaders });
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty
    }
    const batchSize = Math.max(1, Math.min(50, Number((body as any).batchSize ?? 20)));

    // Find rows that need backfilling
    const { data: rows, error: fetchError } = await supabase
      .from('example_sentences')
      .select('word, japanese, english, sentences, tokens')
      .is('tokens', null)
      .limit(batchSize);

    if (fetchError) throw fetchError;
    
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ message: 'All rows are already backfilled', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Processing batch of ${rows.length} rows...`);
    let processedCount = 0;
    
    for (const row of rows) {
      console.log(`Processing word: ${row.word}`);
      
      // 1. Tokenize main sentence
      const mainTokens = await tokenizeWithAI(row.japanese, key);
      
      // 2. Tokenize nested sentences
      const sentences = (row.sentences || []) as Sentence[];
      for (const s of sentences) {
        if (!s.tokens && s.japanese) {
          s.tokens = await tokenizeWithAI(s.japanese, key);
        }
      }

      // 3. Update DB
      const { error: updateError } = await supabase
        .from('example_sentences')
        .update({
          tokens: mainTokens,
          sentences: sentences
        })
        .eq('word', row.word);
      
      if (updateError) {
        console.error(`Failed to update ${row.word}:`, updateError);
      } else {
        processedCount++;
      }
    }

    return new Response(JSON.stringify({ 
      message: `Successfully processed ${processedCount} rows`,
      processed: processedCount,
      remaining_estimate: 'Run again to check' 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Backfill error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: err.message }), { status: 500, headers: corsHeaders });
  }
});
