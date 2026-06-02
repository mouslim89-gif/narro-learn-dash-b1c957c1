import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CJK = /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u30ff]/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

  try {
    const { kanji } = await req.json();
    if (!kanji || typeof kanji !== 'string' || [...kanji].length !== 1) {
      return new Response(JSON.stringify({ error: 'kanji must be a single character' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CJK ideograph only
    if (!/[\u3400-\u9FFF\uF900-\uFAFF]/.test(kanji)) {
      return new Response(JSON.stringify({ error: 'not a kanji' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: cached } = await supabase
      .from('kanji_details')
      .select('character, meanings, kun_readings, on_readings, jlpt, grade, stroke_count')
      .eq('character', kanji)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await res.json();

    const payload = {
      character: kanji,
      meanings: data.meanings ?? [],
      kun_readings: data.kun_readings ?? [],
      on_readings: data.on_readings ?? [],
      jlpt: data.jlpt ?? null,
      grade: data.grade ?? null,
      stroke_count: data.stroke_count ?? null,
    };

    await supabase.from('kanji_details').upsert(payload);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (err) {
    console.error('kanji-lookup error', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
