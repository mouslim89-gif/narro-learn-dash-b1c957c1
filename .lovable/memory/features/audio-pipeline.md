---
name: audio-pipeline
description: Audio par livre — Storage bucket, sync sentence-by-sentence via ElevenLabs Scribe, highlight + auto-scroll dans le Reader
type: feature
---

# Audio des livres

## Architecture
- **Storage**: bucket public `book-audio`, fichiers en `{bookId}/{difficulty}.mp3` (MP3 192kbps recommandé)
- **DB**: table `book_audio_sync` (`book_id`, `difficulty`, `sentences: jsonb [{idx, startSec, endSec}]`, `duration_sec`). Lecture publique, écriture service-role uniquement.
- **Edge function** `generate-audio-sync`: télécharge le MP3 depuis Storage, transcrit via ElevenLabs Scribe (`scribe_v1`, `language_code: jpn`, `timestamps_granularity: word`), aligne les mots transcrits sur les phrases canoniques fournies par le client (sliding-cursor + normalisation kana + scaling), écrit le résultat en DB. Cache: si déjà en DB → retour immédiat.
- **Connector**: ElevenLabs (secret `ELEVENLABS_API_KEY`)
- **Client cache**: 3 niveaux dans `src/lib/audio-sync.ts` — Map en mémoire → IndexedDB (`idb-keyval`) → DB → edge function.

## Schéma `Book.audio`
```ts
audio?: { simplified?: { durationSec: number }; intermediate?: ...; original?: ... }
```
Helper `hasAnyAudio(book)` pour l'icône Headphones dans BookCard / BookDetail / Library.

## Composant `AudioPlayer`
Vrai `<audio>` element. Props: `src`, `onTimeUpdate`, `onLoadedMetadata`, `seekRequestRef` (pour seek impératif depuis le parent), `bottomOffset` (0 dans Reader fullscreen).

## Reader — comportement
- Au mount: si `book.audio[difficulty]` existe → `loadAudioSync(...)` (3 niveaux de cache)
- Pendant la lecture: `onTimeUpdate` → `findSentenceAt` (binary search) → `audioCurrentSentence`
- Highlight: `bg-primary/10 px-0.5` sur la phrase active
- Auto-scroll: `scrollIntoView({behavior:'smooth',block:'center'})` UNIQUEMENT si `Date.now() - userScrolledAtRef.current > 2500ms` (l'user reprend la main 2.5s s'il scroll manuellement)
- Click sur le background d'une phrase = seek audio à `startSec` (les clicks sur tokens gardent leur logique mini-popup)

## Workflow ajout d'audio (pour le owner)
1. Convertir audio: `ffmpeg -i input.wav -b:a 192k -ac 1 output.mp3`
2. Upload via Cloud Storage UI: `book-audio/{bookId}/{difficulty}.mp3`
3. Ajouter `audio: { [difficulty]: { durationSec: <approx> } }` dans `books.ts`
4. Premier play déclenche la transcription Scribe (~30s, ~0.10$ pour 15 min). Tous les suivants = instantané.

## Coût
- Scribe: ~0.40$/h audio, payé une seule fois par livre+difficulté (cache DB partagé)
- Storage: ~5 MB/15 min audio, négligeable
- Sync DB: <50 KB JSON par livre
