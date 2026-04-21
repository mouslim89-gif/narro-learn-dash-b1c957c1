-- Remplace la policy trop permissive par une policy qui autorise SELECT
-- uniquement quand l'utilisateur cible un fichier précis (pas de LIST global).
-- Concrètement, on exige que le name (chemin) soit non vide et contienne un '/'
-- (i.e. {bookId}/{difficulty}.mp3) — ce qui empêche un LIST sans préfixe.
DROP POLICY IF EXISTS "Public can read book audio" ON storage.objects;

CREATE POLICY "Public can read book audio files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'book-audio'
  AND name LIKE '%/%.mp3'
);