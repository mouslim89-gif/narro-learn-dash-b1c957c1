const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.length > 200) {
      return new Response(
        JSON.stringify({ error: "text is required (max 100 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_TTS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "TTS API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "ja-JP",
            name: "ja-JP-Neural2-B",
            ssmlGender: "FEMALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.9,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.text();
      console.error("Google TTS error:", err);
      return new Response(
        JSON.stringify({ error: "TTS synthesis failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await ttsResponse.json();

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (err) {
    console.error("TTS function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
