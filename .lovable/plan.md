

## Ajouter la lecture audio TTS pour les mots japonais

### Approche

Créer une edge function `tts-japanese` qui appelle l'API Google Cloud Text-to-Speech, et un composant `PlayWordButton` réutilisable affiché dans la WordPopup, la page Dictionnaire et les Flashcards.

### Prérequis

Une clé API Google Cloud avec l'API Text-to-Speech activée. Tu devras la fournir via l'interface Lovable.

### Plan technique

**1. Secret API (`GOOGLE_TTS_API_KEY`)**
- Demander la clé via l'outil `add_secret` avant de coder

**2. Edge function `supabase/functions/tts-japanese/index.ts`**
- Accepte `{ text: string }` en POST (le mot ou sa lecture en kana)
- Appelle `https://texttospeech.googleapis.com/v1/text:synthesize` avec voix `ja-JP-Neural2-B` (femme naturelle)
- Retourne l'audio en base64 (`audioContent`) avec CORS
- Validation Zod du body, limite text à 100 caractères max
- Cache-Control header pour éviter les appels répétés côté navigateur

**3. Composant `src/components/PlayWordButton.tsx`**
- Bouton icône `Volume2` compact (24x24)
- Au tap : appelle l'edge function, décode le base64, joue via `Audio()` API
- États : idle → loading (spinner) → playing (icône animée)
- Cache en mémoire (Map) pour ne pas re-fetcher un mot déjà joué

**4. Intégration dans `src/components/WordPopup.tsx`**
- Ajouter `PlayWordButton` à côté du titre du mot (reading en kana)

**5. Intégration dans `src/pages/Dictionary.tsx`**
- Ajouter `PlayWordButton` sur chaque résultat, à côté du mot

**6. Intégration dans `src/pages/Flashcards.tsx`**
- Liste : `PlayWordButton` à côté de chaque mot sauvegardé
- Mode review : `PlayWordButton` sur la face avant de la carte

### Fichiers à créer/modifier
1. `supabase/functions/tts-japanese/index.ts` — Nouvelle edge function
2. `src/components/PlayWordButton.tsx` — Nouveau composant réutilisable
3. `src/components/WordPopup.tsx` — Ajout du bouton play
4. `src/pages/Dictionary.tsx` — Ajout du bouton play par résultat
5. `src/pages/Flashcards.tsx` — Ajout du bouton play dans liste et review

