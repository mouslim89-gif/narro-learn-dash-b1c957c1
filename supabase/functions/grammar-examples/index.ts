import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { pattern, meaning, jlpt, count = 3 } = await req.json();
    const slug = pattern.toLowerCase().trim().replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf0-9a-z]/g, '-');

    // Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cached } = await supabase
      .from('grammar_examples')
      .select('examples')
      .eq('pattern_slug', slug)
      .single();

    if (cached) {
      return new Response(JSON.stringify({ examples: cached.examples }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate with AI
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-2.0-flash-001"),
      output: Output.object({
        schema: z.object({
          examples: z.array(z.object({
            japanese: z.string(),
            english: z.string(),
            tokens: z.array(z.object({
              t: z.string(),
              r: z.string().optional()
            }))
          }))
        })
      }),
      system: `You are a Japanese grammar expert. Generate ${count} natural example sentences for the grammar pattern: "${pattern}" (${meaning}). 
      Target JLPT level: ${jlpt}.
      Each example must include Japanese text, English translation, and furigana tokens.
      The tokens should split the sentence into parts, with 'r' property for kanji reading (furigana) in hiragana.`,
      prompt: `Pattern: ${pattern}\nMeaning: ${meaning}`,
    });

    // Save to cache
    await supabase.from('grammar_examples').insert({
      pattern_slug: slug,
      examples: output.examples
    });

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
