
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

interface Token {
  t: string; // text
  r?: string; // reading (hiragana)
}

interface Sentence {
  japanese: string;
  english: string;
  tokens?: Token[];
}

async function tokenizeWithAI(japanese: string): Promise<Token[]> {
  console.log(`Tokenizing: ${japanese}`);
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY!,
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
    console.error(`AI Gateway error for "${japanese}":`, errorText);
    return [{ t: japanese }];
  }

  const data = await response.json();
  try {
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    const tokens = Array.isArray(parsed) ? parsed : (parsed.tokens || [{ t: japanese }]);
    console.log(`Successfully tokenized "${japanese}"`);
    return tokens;
  } catch (err) {
    console.error("AI parsing error:", err);
    return [{ t: japanese }];
  }
}

async function runBackfill() {
  console.log("Starting backfill process...");
  const { data: rows, error: fetchError } = await supabase
    .from('example_sentences')
    .select('word, japanese, sentences')
    .is('tokens', null)
    .limit(50); // Smaller batch to be safe

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log("No rows to process.");
    return;
  }

  console.log(`Processing ${rows.length} rows...`);

  for (const row of rows) {
    console.log(`--- Word: ${row.word} ---`);
    
    // 1. Tokenize main sentence
    const mainTokens = await tokenizeWithAI(row.japanese);
    
    // 2. Tokenize nested sentences
    const sentences = (row.sentences || []) as Sentence[];
    for (const s of sentences) {
      if (!s.tokens && s.japanese) {
        s.tokens = await tokenizeWithAI(s.japanese);
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
      console.log(`Successfully updated ${row.word}`);
    }
  }
}

runBackfill();
