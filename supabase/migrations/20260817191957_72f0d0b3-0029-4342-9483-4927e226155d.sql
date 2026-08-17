-- Normalize grammar_examples.pattern_slug to the canonical app slug format
-- (collapse repeated dashes, trim leading/trailing dashes).

WITH canon AS (
  SELECT id, created_at,
         regexp_replace(regexp_replace(pattern_slug, '-+', '-', 'g'), '^-|-$', '', 'g') AS c
  FROM public.grammar_examples
), dupes AS (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY c ORDER BY created_at DESC, id) AS rn
    FROM canon
  ) t WHERE rn > 1
)
DELETE FROM public.grammar_examples g USING dupes d WHERE g.id = d.id;

UPDATE public.grammar_examples
SET pattern_slug = regexp_replace(regexp_replace(pattern_slug, '-+', '-', 'g'), '^-|-$', '', 'g')
WHERE pattern_slug <> regexp_replace(regexp_replace(pattern_slug, '-+', '-', 'g'), '^-|-$', '', 'g');