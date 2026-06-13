## Scope

Deux changements visuels distincts, ciblés.

### 1. Relief `.relief-raised` sur les toggles segmentés des settings

Les "toggles" ici = boutons-pills des segmented rows (pas les `Switch` Radix qui ont déjà leur propre relief interne).

**Cibles concrètes :**
- `src/pages/Settings.tsx` — pills S/M/L de la rangée *Font size* (lignes 131–141) : le pill **actif** reçoit `.relief-raised`, les inactifs restent plats (cohérent avec le pattern actuel actif=relevé).
- `src/pages/Reader.tsx` — composant `SegmentedRow` (lignes 156–184) utilisé pour Difficulty, Font size, Japanese font, etc. dans le panneau de settings du Reader. Le bouton **sélectionné** reçoit `.relief-raised`. On garde le `linear-gradient` actuel + le ring primary. Les non-sélectionnés restent plats.

Pas de changement sur les `Switch` Radix (déjà ok, leur thumb a déjà une ombre).
Pas de changement sur les autres CTA / cards, hors scope.

### 2. Reader header chips — "incolores" + plus flous que le header

État actuel (`HeaderChip` ligne 118 de `Reader.tsx`) :
```
glass-chip-subtle header-chip + ring-1 ring-border/40
glass-chip-subtle = bg hsl(--background)/0.32, blur(5px)
header = glass-subtle = bg hsl(--background)/0.42, blur(6px)
```
Donc actuellement les chips sont **plus transparents** que le header → ils se découpent visuellement.

**Changement :** créer une nouvelle classe `.glass-chip-header` (dans `src/index.css`) qui :
- supprime toute teinte propre : background `transparent` (ou `hsl(--background)/0.10` très léger pour la lisibilité de l'icône)
- pousse le `backdrop-filter: blur(14px) saturate(180%)` (vs 6px du header)

Le chip apparaît alors comme une zone du header un peu plus floue/laiteuse, sans coloration propre. On **conserve** `.header-chip` (le relief = standard de l'app) et le `ring-1 ring-border/40`.

Remplacer `glass-chip-subtle` → `glass-chip-header` uniquement dans `HeaderChip` (Reader.tsx ligne 122). L'autre usage de `glass-chip-subtle` (BookDetail back/favorite) n'est **pas** touché — c'est un contexte différent (overlay sur cover, pas sur header).

État actif (chip avec `active=true`) : on **enlève** le tint `!bg-primary/15` et on garde uniquement `text-primary` + `ring-primary/25` → reste incolore comme demandé, l'état actif se lit par la couleur de l'icône + le ring.

### Hors scope (sécurité "si je dis n'importe quoi")
- Pas de touche au `nav-dock`, aux cards, aux CTA primaires.
- Pas de touche aux chips header des autres pages (Library/MyBooks/Dictionary) — ceux-là ont déjà le bon style sur fond opaque.
- Pas de touche au back-button de BookDetail / favorite (contexte overlay).

### Risques
- Le blur 14px peut être lourd sur mobile bas de gamme. Mitigation : `will-change: backdrop-filter` est déjà actif via `.glass-*`. Si test perçu lourd, on redescend à 10px.
- État actif sans tint : risque de moindre lisibilité. Mitigation : on garde `text-primary` + `ring-primary/25` qui suffisent à signaler.

Confirme et je passe en build.
