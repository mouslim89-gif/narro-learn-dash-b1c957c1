## Problème

Dans `src/pages/Reader.tsx` (`paragraphs` useMemo, lignes ~187-216), la logique actuelle :

1. **Ignore complètement les `\n`** présents dans le texte source. Les livres (ex. `urashima.ts`) utilisent pourtant ces sauts de ligne comme séparateurs de paragraphes naturels.
2. **Découpe à l'intérieur des guillemets** `「…」`. Une phrase qui s'ouvre par 「 et se termine par 。 sans 」 démarre un nouveau paragraphe ; la suite (jusqu'à 」) tombe dans un autre paragraphe → le guillemet est cassé en deux blocs visuels.
3. La règle `current.length >= 3` coupe arbitrairement au milieu d'un dialogue ouvert.

Exemple Urashima reproduit (simulation) :
```
… いじめているのです。
浦島は見かねて、
「まあ…ではない。  ← coupure ici
いい子だから」
と、とめましたが…
```
Le 「…」 est étendu sur 2 paragraphes visuels alors que la source a 3 lignes nettes séparées par `\n`.

## Solution proposée

Réécrire le `useMemo` `paragraphs` (et légèrement `sentences`) pour :

### 1. Faire des `\n` la source de vérité des paragraphes
- Lors du découpage en phrases, considérer un token contenant `\n` comme une frontière de paragraphe explicite (en plus de `。！？`).
- Stocker un flag `breakAfter: boolean` sur chaque phrase quand le token de fin contenait `\n`.

### 2. Garder les guillemets atomiques
- Tenir un compteur d'ouverture `「`/`』` − fermeture `」`/`』` pendant l'agrégation.
- **Ne jamais clore un paragraphe tant que le compteur > 0** (guillemet ouvert), même si on rencontre un `\n` ou la règle des 3 phrases.
- Cela force `「…」` à rester dans le même bloc visuel.

### 3. Simplifier les heuristiques
Remplacer les règles « startsDialogue / endsDialogue / current.length >= 3 » par :

```
pour chaque phrase:
  ajouter à current
  mettre à jour quoteDepth
  si quoteDepth == 0 ET (phrase.breakAfter OU current full-stops accumulés ≥ seuil):
     flush current → groups
```

### 4. Nettoyer les tokens `\n` orphelins
Les `\n` ne doivent plus être rendus comme texte (ils étaient affichés en blanc mais comptaient dans le layout). Les filtrer après usage comme marqueur de break.

## Fichier à modifier

- `src/pages/Reader.tsx` — uniquement les `useMemo` `sentences` et `paragraphs` (≈ lignes 171-216). Aucun autre fichier touché, pas de changement de données.

## Validation

- Tester sur Urashima (original) : le 「まあ…いい子だから」 doit tenir sur **une** ligne/un seul paragraphe.
- Vérifier Rashōmon, Kumo no Ito, Hashire Merosu (dialogues fréquents) — aucun guillemet ne doit être scindé.
- Vérifier que les paragraphes longs sans dialogue s'aèrent toujours grâce aux `\n` du source (et non plus à la règle arbitraire des 3 phrases).
