-- Bucket public pour les audios de livres
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-audio', 'book-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique du bucket book-audio
CREATE POLICY "Public can read book audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'book-audio');

-- Table de sync audio ↔ texte
CREATE TABLE public.book_audio_sync (
  book_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  sentences JSONB NOT NULL,
  duration_sec NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, difficulty)
);

ALTER TABLE public.book_audio_sync ENABLE ROW LEVEL SECURITY;

-- Lecture publique (timestamps partagés entre tous les utilisateurs)
CREATE POLICY "Anyone can read book audio sync"
ON public.book_audio_sync
FOR SELECT
TO public
USING (true);

-- Pas de politique INSERT/UPDATE/DELETE → seul le service role (edge function) peut écrire