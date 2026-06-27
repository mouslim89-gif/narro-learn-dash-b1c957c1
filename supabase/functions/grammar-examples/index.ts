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
      // Handle legacy cache (array) vs new cache (object)
      const examples = Array.isArray(cached.examples) ? cached.examples : cached.examples.items;
      const formations = Array.isArray(cached.examples) 
        ? null 
        : (cached.examples.formations || (cached.examples.structure ? [{ parts: [cached.examples.structure] }] : null));
      
      return new Response(JSON.stringify({ examples, formations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate with AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: `You are a Japanese grammar expert. Generate ${count} natural, simple example sentences for the grammar pattern: "${pattern}" (${meaning}). 
            Target JLPT level: ${jlpt}.
            Ensure the pattern "${pattern}" is used clearly in each sentence.
            Provide the response as a JSON object with fields:
            - examples: array of objects. Each object has:
              - japanese: string (the sentence)
              - english: string (translation)
              - tokens: array of {t: string, r?: string} where 't' is the word/part and 'r' is hiragana furigana for kanji. Keep tokens relatively granular so the pattern can be matched.
            - formations: array of objects. Each object has:
              - parts: array of strings representing the formation components (e.g., ["Verb masu stem", "ながら"], ["Noun", "ながら"]). Use clear labels for parts.`
          },
          { role: "user", content: `Pattern: ${pattern}\nMeaning: ${meaning}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    const output = JSON.parse(content);

    // Save to cache
    await supabase.from('grammar_examples').insert({
      pattern_slug: slug,
      examples: {
        items: output.examples,
        formations: output.formations
      }
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
