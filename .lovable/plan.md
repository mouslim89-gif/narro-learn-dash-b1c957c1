

## Ajout du livre 「ア、秋」 de 太宰治

Court essai/notes contemplatives sur l'automne. Texte original très littéraire (vocabulaire rare, style classique). Sera ajouté avec 3 versions selon tes choix.

### 1. Trois versions du texte

**Original** (proche du texte de Dazai, légèrement nettoyé des marqueurs ruby `《》` qui seront gérés par le tokenizer/dictionnaire) :
- Garde la structure en notes décousues : "トンボ、スキトオル", "秋ハ夏ノ焼ケ残リサ", "コスモス、無残", etc.
- Conserve les passages narratifs entre les notes (souvenir du tremblement de terre, plage abandonnée…)
- Vocabulaire/grammaire du texte original préservés (蜻蛉, 燈籠, 炯眼, 跋渉…)
- ~900-1100 caractères

**Intermédiaire** = notes simplifiées :
- Garde le format mémo/notes du poète, l'esprit du texte
- Simplifie le vocabulaire rare (蜻蛉→とんぼ, 炯眼→鋭い目, 跋渉→歩く…)
- Remplace katakana stylistique par hiragana/kanji standard quand utile
- Grammaire intermédiaire (N3/N2), garde des constructions comme ～ようだ, ～らしい
- ~800-1000 caractères

**Simplifié** = récit linéaire :
- Réécrit en un petit essai cohérent : "Un poète note ses idées sur l'automne. Il dit que les libellules en automne semblent transparentes. Il dit que l'automne se cache déjà dans l'été…"
- Phrases courtes (SOV simples), grammaire N5/N4
- Garde les images fortes (libellule transparente, plage abandonnée, papillon laid sur la terre noire)
- ~700-900 caractères

### 2. Métadonnées du livre

```ts
{
  id: 'a-aki',
  titleJp: 'ア、秋',
  titleEn: 'A, Autumn',
  author: 'Dazai Osamu',
  genre: 'fiction',
  jlptLevel: 'N1',
  coverColor: '#B85C2A',  // rouille / orange automne
  readingTimeMin: 12,
  synopsis: "A poet flips through his notebook of autumn impressions — a transparent dragonfly, an abandoned beach, a stubborn butterfly crawling on black earth. Dazai's brief, melancholic meditation on a season that 'hides inside summer'.",
  hasAudio: true,
  content: { simplified, intermediate, original },
}
```

### 3. Préchargement (selon project-knowledge)

Après ajout dans `src/data/books.ts`, exécuter dans l'ordre :
1. `npx tsx scripts/generate-tokens.ts` → génère les tokens Kuromoji pour les 3 versions dans `book-tokens.ts`
2. `npx tsx scripts/fetch-missing-dictionary.ts` → récupère via Jisho toutes les définitions des mots nouveaux et les stocke dans `book-dictionary.ts`
3. `npx tsx scripts/expand-dictionary.ts` → ajoute les alias surface/baseForm pour maximiser les cache hits
4. Invoquer la fonction edge `grammar-notes` (ou un petit script équivalent) pour pré-générer les notes de grammaire des 3 versions et les ajouter à `src/data/book-grammar.ts`

### 4. Fichiers modifiés

- `src/data/books.ts` — ajout du livre + 3 constantes de contenu
- `src/data/book-tokens.ts` — auto-régénéré
- `src/data/book-dictionary.ts` — auto-enrichi
- `src/data/book-grammar.ts` — notes de grammaire pour les 3 versions

### 5. Notes techniques

- Le texte original utilise des marqueurs ruby `《とんぼ》` après certains kanji. Je les retirerai (Kuromoji + nos furigana s'en chargent), mais je vérifierai les lectures non standard (蜻蛉, 桔梗, 炯眼, 提灯, 蚕…) et ajouterai des `READING_OVERRIDES` dans `generate-tokens.ts` si Kuromoji se trompe.
- Les segments en katakana stylistique du type "秋ハ夏ノ焼ケ残リサ" risquent de mal se tokenizer → je vérifierai après génération et ajouterai des compounds dans `postMergeCompounds` si nécessaire.
- Vu la longueur et le N1, le préchargement du dico fera probablement 200-400 mots nouveaux (quelques minutes via le script avec rate-limit).

