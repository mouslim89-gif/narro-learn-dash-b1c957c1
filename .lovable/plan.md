

## Améliorations Reader

### 1. Furigana — vérification & robustesse
**Problème potentiel** : la fonction `segmentsFromReading` (dans `FuriganaWord.tsx`) utilise `lastIndexOf` pour aligner kanji/kana, ce qui peut mal aligner les mots avec kana répétés (ex: 食べている où い apparaît plusieurs fois).

**Fix** :
- Utiliser `indexOf` (premier match) au lieu de `lastIndexOf` — c'est sémantiquement plus correct car on cherche la fin de la lecture du kanji **immédiatement** après lui.
- Ajouter un fallback : si l'alignement basé sur la lecture Kuromoji échoue, retomber proprement sur `getFuriganaSegments` (cache Jisho) au lieu de retourner `null` silencieusement.
- Gérer le cas où `reading` est en katakana mais le texte attend hiragana (déjà fait via `normalizeKana`, OK).
- Ajouter un test unitaire dans `furigana.test.ts` couvrant : 食べている, 大きな, 持っていく, 行きました.

### 2. Suppression du mode tategaki (vertical)
- Retirer le bloc "Writing Direction" du panneau Settings dans `Reader.tsx`.
- Retirer `writingMode` / `setWritingMode` de l'usage dans `Reader.tsx` (className conditionnel `writing-vertical`, `h-full`).
- Retirer les styles `.writing-vertical` de `src/index.css`.
- Retirer `writingMode` / `setWritingMode` / type `WritingMode` du store `reading-progress.ts`.
- Retirer l'import `AlignVerticalSpaceAround` de lucide-react.

### 3. Mode couleur grammaticale — légende en anglais + amélioration
- Dans `src/lib/pos-colors.ts`, traduire `LEGEND` :
  - 動詞 → **Verb**
  - 名詞 → **Noun**
  - 形容詞 → **Adjective**
  - 助詞 → **Particle**
  - 副詞 → **Adverb**
- Améliorer la lisibilité de la barre de légende :
  - Layout plus aéré (gap-4), centré, avec un petit titre `Color guide`.
  - Pastilles de couleur légèrement plus grandes (h-3 w-3) + texte en `text-foreground` (pas muted) pour meilleur contraste.
  - Coller la légende juste en dessous du header, position sticky sous la barre de progression pour rester visible pendant le scroll.
- Améliorer le mapping POS pour être plus précis :
  - Distinguer `助動詞` (auxiliary) d'une vraie particule — lui donner une couleur dédiée (ex: ambre clair) ou le grouper avec verb selon préférence (à choisir ci-dessous).
  - S'assurer que les tokens fusionnés (verbe + auxiliaire poli です/ます) reçoivent la couleur du **head verb** (déjà géré par `mergeConjugatedTokens` qui préserve le POS de la tête, à confirmer).

### 4. Fix lecteur audio — vide en bas
**Problème** : `AudioPlayer` est `fixed bottom-[60px]` (au-dessus de la BottomNav). Le Reader ajoute `pb-36` pour réserver l'espace, mais :
- Le Reader **n'affiche pas la BottomNav** (route reader plein écran), donc le `bottom-[60px]` crée un vide visible où le texte continue de défiler derrière.
- Le `pb-36` est trop grand pour cette config.

**Fix** :
- Détecter dans `AudioPlayer` si on est sur la route Reader (ou passer une prop `floating` / `bottom`) → coller le player tout en bas (`bottom-0`) quand pas de BottomNav.
- Solution propre : passer une prop `bottomOffset` à `AudioPlayer` depuis Reader = `0`, et garder `60px` ailleurs si réutilisé. Ou simplement : dans Reader, rendre le player avec `bottom-0` (le Reader masque déjà la BottomNav).
- Ajuster le `pb-36` du conteneur Reader → `pb-20` (juste assez pour la hauteur du player ~56px) quand `book.hasAudio`, sinon `pb-8`.

### Questions techniques

- **助動詞 (auxiliaires)** : couleur dédiée ou groupé avec verbe ? → je propose **groupé avec verbe** (cohérent avec la fusion des tokens conjugués).
- **Légende grammaire sticky** : sticky sous le header, ou juste affichée en haut une fois ? → sticky pour rester utile pendant la lecture.

### Fichiers modifiés
- `src/components/FuriganaWord.tsx` (alignement furigana + fallback)
- `src/test/furigana.test.ts` (nouveaux cas de test)
- `src/pages/Reader.tsx` (suppression tategaki, légende améliorée, padding audio)
- `src/components/AudioPlayer.tsx` (positionnement bottom-0 dans Reader)
- `src/stores/reading-progress.ts` (suppression `writingMode`)
- `src/lib/pos-colors.ts` (légende anglaise, mapping affiné)
- `src/index.css` (suppression styles `.writing-vertical`)

