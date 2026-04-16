

## Mini Popup — Positionnement, surlignage & compactage

### Problèmes actuels
1. **Positionnement** basé sur `e.clientX/clientY` (le point de tap) — le popup flotte au mauvais endroit au lieu de s'ancrer au bord de la phrase
2. **Pas de surlignage** du mot tappé
3. **Popup trop grand** — bouton Save prend toute la largeur, padding excessif

### Ce qu'on va faire

#### 1. Positionnement ancré à la phrase (Reader.tsx)
- Au lieu de passer `{ x: e.clientX, y: e.clientY }`, on récupère le **boundingRect du `<span>` de la phrase** (le `<span key={sIdx}>`)
- On passe `sentenceRect: { top, bottom, left, right }` au mini popup
- Le popup se positionne :
  - **Au-dessus** de `sentenceRect.top` si assez de place
  - **En-dessous** de `sentenceRect.bottom` sinon
  - Centré horizontalement sur la phrase

#### 2. Surlignage du mot actif (Reader.tsx)
- Ajouter une condition : si `miniPopup` est ouvert et que le token courant correspond au mot actif, appliquer `bg-accent/20 rounded-sm` (surlignage léger)
- Comparer `token.t === miniPopup.text` + même `sentenceIdx`

#### 3. Compacter le popup (WordMiniPopup.tsx)
- **Bouton Save** → remplacé par une petite icône `Star` cliquable (16px), positionnée dans le header à côté du mot, pas un gros bouton
- **Bouton More** → texte plus petit, inline dans le header aussi
- Réduire les paddings : `px-3 pt-3 pb-1` → `px-2.5 pt-2 pb-1.5`
- Reading + définitions plus compacts
- Layout actions : une ligne horizontale avec ⭐ | 🔊 | More → alignés dans le header

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `src/pages/Reader.tsx` | Passer `sentenceRect` au lieu de `anchorPos` click, ajouter ref sur le span phrase, surligner le mot actif |
| `src/components/WordMiniPopup.tsx` | Nouveau positionnement basé sur sentenceRect, UI compactée, Star en icône inline |

### Résultat visuel attendu

```text
┌──────────────────────────┐
│ 猫  ♪  ⭐  N5   More ▸  │  ← header compact, tout sur une ligne
│ ねこ                      │  ← reading
│ 1. cat  2. old cloth     │  ← définitions
│ Noun                     │  ← POS
└──────────────────────────┘
     ▼ (phrase en dessous)
 ...彼の[猫]は可愛いです...   ← 猫 surligné
```

