// Generates timestamps mapping audio file → sentences of a book.
// Workflow: download MP3 from Storage → transcribe via ElevenLabs Scribe → fuzzy-align
// transcribed words with the canonical sentences provided by the client → store in DB.
// Cached: subsequent calls for the same (bookId, difficulty) return immediately from DB.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  bookId: string;
  difficulty: "simplified" | "intermediate" | "original";
  /** Canonical sentences (same order as displayed in Reader). Only the joined Japanese text. */
  sentences: string[];
}

interface SentenceTimestamp {
  idx: number;
  startSec: number;
  endSec: number;
}

interface ScribeWord {
  text: string;
  start: number;
  end: number;
  type?: string;
}

// Normalise a Japanese token for fuzzy comparison: strip punctuation/whitespace, katakana→hiragana.
function normalizeJp(s: string): string {
  return s
    .replace(/[\s。、！？「」『』,.!?\-—…・]/g, "")
    .replace(/[\u30A1-\u30F6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
    .toLowerCase();
}

// Align Scribe words to canonical sentences using a sliding cursor.
// For each sentence we accumulate transcribed words until the concatenated normalized
// length ≥ canonical normalized length OR we've consumed enough characters that
// we'd start eating into the next sentence.
function alignSentences(
  sentences: string[],
  words: ScribeWord[]
): SentenceTimestamp[] {
  const result: SentenceTimestamp[] = [];
  let wordCursor = 0;
  const totalWords = words.length;

  // Pre-compute normalized lengths of each canonical sentence
  const targets = sentences.map((s) => normalizeJp(s).length);
  const totalTargetLen = targets.reduce((a, b) => a + b, 0);
  const totalAudioLen = words.reduce(
    (a, w) => a + normalizeJp(w.text).length,
    0
  );
  // Scaling factor: transcription may have slightly different char count
  const scale = totalAudioLen > 0 ? totalAudioLen / totalTargetLen : 1;

  for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
    if (wordCursor >= totalWords) {
      // Out of words — fall back to interpolating from previous endSec
      const prev = result[result.length - 1];
      const t = prev?.endSec ?? 0;
      result.push({ idx: sIdx, startSec: t, endSec: t });
      continue;
    }

    const targetLen = Math.max(1, Math.round(targets[sIdx] * scale));
    const startSec = words[wordCursor].start;
    let accLen = 0;
    let endIdx = wordCursor;

    while (endIdx < totalWords && accLen < targetLen) {
      accLen += normalizeJp(words[endIdx].text).length;
      endIdx++;
    }

    // endIdx is now exclusive (one past last consumed word)
    const lastWordIdx = Math.min(endIdx - 1, totalWords - 1);
    const endSec = words[lastWordIdx].end;

    result.push({ idx: sIdx, startSec, endSec });
    wordCursor = endIdx;
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if ("error" in auth) return auth.error;

  // Admin-only: check is_admin
  {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _uid: auth.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = (await req.json()) as RequestBody;

    // Validation
    if (
      !body.bookId ||
      typeof body.bookId !== "string" ||
      body.bookId.length > 100
    ) {
      return new Response(JSON.stringify({ error: "Invalid bookId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["simplified", "intermediate", "original"].includes(body.difficulty)) {
      return new Response(JSON.stringify({ error: "Invalid difficulty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(body.sentences) || body.sentences.length === 0) {
      return new Response(
        JSON.stringify({ error: "sentences must be a non-empty array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Cache check
    const { data: cached } = await admin
      .from("book_audio_sync")
      .select("sentences, duration_sec")
      .eq("book_id", body.bookId)
      .eq("difficulty", body.difficulty)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({
          sentences: cached.sentences,
          durationSec: Number(cached.duration_sec),
          cached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Download MP3 from Storage
    const audioPath = `${body.bookId}/${body.difficulty}.mp3`;
    const { data: audioBlob, error: dlErr } = await admin.storage
      .from("book-audio")
      .download(audioPath);

    if (dlErr || !audioBlob) {
      return new Response(
        JSON.stringify({
          error: `Audio file not found at book-audio/${audioPath}`,
          details: dlErr?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Transcribe via ElevenLabs Scribe
    console.log(
      `[generate-audio-sync] Transcribing ${audioPath} (${audioBlob.size} bytes)...`
    );

    const apiForm = new FormData();
    apiForm.append("file", audioBlob, "audio.mp3");
    apiForm.append("model_id", "scribe_v1");
    apiForm.append("language_code", "jpn");
    apiForm.append("diarize", "false");
    apiForm.append("tag_audio_events", "false");
    apiForm.append("timestamps_granularity", "word");

    const sttRes = await fetch(
      "https://api.elevenlabs.io/v1/speech-to-text",
      {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
        body: apiForm,
      }
    );

    if (!sttRes.ok) {
      const errText = await sttRes.text();
      console.error("[generate-audio-sync] Scribe error", sttRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Transcription failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const sttData = await sttRes.json();
    const rawWords: ScribeWord[] = (sttData.words || []).filter(
      (w: ScribeWord) => w.type !== "spacing" && (w.text || "").trim().length > 0
    );

    if (rawWords.length === 0) {
      return new Response(
        JSON.stringify({ error: "No words detected in audio" }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Align
    const aligned = alignSentences(body.sentences, rawWords);
    const durationSec = rawWords[rawWords.length - 1]?.end ?? 0;

    console.log(
      `[generate-audio-sync] Aligned ${aligned.length} sentences from ${rawWords.length} words, duration=${durationSec}s`
    );

    // 5. Persist
    const { error: upErr } = await admin.from("book_audio_sync").insert({
      book_id: body.bookId,
      difficulty: body.difficulty,
      sentences: aligned,
      duration_sec: durationSec,
    });

    if (upErr) {
      console.error("[generate-audio-sync] Insert error", upErr);
      // Not fatal — we can still return the result
    }

    return new Response(
      JSON.stringify({
        sentences: aligned,
        durationSec,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("[generate-audio-sync] Internal error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
