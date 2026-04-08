import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const keyword = url.searchParams.get("keyword");

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Missing keyword parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(jishoUrl);
    
    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: "Jisho API error", status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Clean and simplify the response
    const results = (data.data || []).slice(0, 5).map((item: any) => ({
      slug: item.slug,
      is_common: item.is_common,
      jlpt: item.jlpt || [],
      tags: item.tags || [],
      japanese: (item.japanese || []).slice(0, 3).map((j: any) => ({
        word: j.word || "",
        reading: j.reading || "",
      })),
      senses: (item.senses || []).slice(0, 3).map((s: any) => ({
        english_definitions: s.english_definitions || [],
        parts_of_speech: s.parts_of_speech || [],
      })),
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
