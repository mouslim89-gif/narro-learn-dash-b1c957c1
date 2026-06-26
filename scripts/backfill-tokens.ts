
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
    return [{ t: japanese }];
  }

  const data = await response.json();
  try {
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.tokens || [{ t: japanese }]);
  } catch (err) {
    return [{ t: japanese }];
  }
}

async function runBackfill() {
  const { data: rows, error: fetchError } = await supabase
    .from('example_sentences')
    .select('word, japanese, sentences')
    .is('tokens', null)
    .limit(40);

  if (fetchError || !rows) return;

  console.log(`Processing ${rows.length} rows...`);

  await Promise.all(rows.map(async (row) => {
    // 1. Tokenize main sentence
    const mainTokensPromise = tokenizeWithAI(row.japanese);
    
    // 2. Tokenize nested sentences
    const sentences = (row.sentences || []) as Sentence[];
    const sentencePromises = sentences.map(async (s) => {
      if (!s.tokens && s.japanese) {
        s.tokens = await tokenizeWithAI(s.japanese);
      }
    });

    const [mainTokens] = await Promise.all([mainTokensPromise, ...sentencePromises]);

    // 3. Update DB
    await supabase
      .from('example_sentences')
      .update({
        tokens: mainTokens,
        sentences: sentences
      })
      .eq('word', row.word);
    
    console.log(`Updated ${row.word}`);
  }));
}

runBackfill();
