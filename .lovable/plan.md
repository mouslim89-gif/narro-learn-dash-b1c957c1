Quatre changements groupés.

## 1. `grammar-notes` edge function

- Retirer la troncature : `const excerpt = text.slice(0, 2000)` → envoyer `text` complet.
- Remplacer la consigne `Return 5-8 grammar points...` par : "Return every distinct grammar point that appears in the text — no fixed minimum or maximum. Deduplicate; include each pattern once. Order from easiest to hardest."
- Déployer la fonction.

## 2. Hana — générer les grammar notes (anchors confirmés)

```bash
npx tsx scripts/generate-grammar-for-hana.ts
```

Script déjà existant — il faut juste le mettre en forme "per-part" comme `generate-grammar-for-lemon.ts`. Je le réécris (4 parts × 3 difficultés = 12 appels).

## 3. Splitter sakura et matsu en 2 parts chacun

Même pipeline que hana :

**sakura (1779 chars original)** — 2 parts :

- P1 — *The Tree's Secret* : ouverture jusqu'au moment où il explique l'image (paragraphes intro + corps de l'argumentation sur les cadavres sous le cerisier).
- P2 — *The Mayfly Pool* : transition vers le ravin, scène des éphémères, conclusion sur la fête sous les cerisiers.
- Cut probable autour du "二三日前、俺は、ここの溪へ下りて..." (orig para 11).

**matsu (2072 chars original)** — 2 parts :

- L'original est un blob mono-paragraphe — je découperai sur une rupture narrative interne (`。`/`」` + ligne) sans toucher au texte. Naturel : couper après "...自信を失ってしまったのです。" (≈ ligne 22), qui sépare l'intro/contexte (pourquoi elle va à la gare) de la rumination introspective (qui/quoi elle attend, conclusion).
- Anchors proposés : *The Empty Bench* / *What She Awaits*.

Pour matsu, les versions `simplified` et `intermediate` ont déjà 4 paragraphes — j'aligne le cut sur leur paragraphe 2 (après "...急いで帰ります" / "...急いで帰っていくだけです" / etc.) pour garder le même beat narratif.

J'écris les fichiers, je registre dans `books.ts`, je te confirme les anchors **avant** la generation grammar (= 1 nouvelle pause).

## 4. Threshold du skill `split-book-into-parts` : 2500 → 2000

Édite `.workspace/skills/split-book-into-parts/SKILL.md` (via `.agents/skills/split-book-into-parts/SKILL.md` + `skills--apply_draft`) et le skill `add-book` (étape 6) pour passer le seuil de 2500 à 2000 chars. Mets aussi à jour la cible de taille de part (actuellement 1300-1700) → **1000-1500** pour rester cohérent avec un seuil plus bas.

## Ordre d'exécution

1. Patch + deploy `grammar-notes`.
2. Skill threshold update.
3. Split sakura, split matsu, register, **pause** pour confirmer anchors.
4. Une fois anchors validés : grammar pour hana + sakura + matsu, puis `npx tsx scripts/generate-tokens.ts`.

## Question

Pour matsu, l'`original` est un seul bloc dense sans rupture évidente au milieu (Dazai écrit tout d'une traite). Le cut le plus propre tombe vers les 2/3 (≈ 1400 / 700) plutôt qu'à 50/50. Ça te va, ou tu préfères que je force un split plus équilibré (1000/1000) même si la rupture narrative est moins nette ? 

ça me va