## Problème

Cliquer / scrubber la barre de progression audio **ne ramène pas le texte** à la phrase correspondante, alors que la logique existe déjà (`handleAudioScrub` dans `src/pages/Reader.tsx:475` appelle `setAutoFollow(true)` + `queueSentenceScroll(idx)`).

### Cause racine

Dans `src/pages/Reader.tsx:416-424`, des listeners globaux `wheel` / `touchmove` appellent `disengageAutoScroll()` dès qu'un input de scroll utilisateur est détecté :

```ts
const onTouchMove = () => disengageAutoScroll();
window.addEventListener('touchmove', onTouchMove, { passive: true });
```

Quand on touche / glisse sur le `Slider` Radix de l'`AudioPlayer`, l'événement `touchmove` se propage jusqu'à `window` → `disengageAutoScroll()` annule l'animation déclenchée par `handleAudioScrub` juste avant. Résultat : le texte ne suit pas.

Sur desktop, le simple click sur la track fonctionne (pas de touchmove), mais sur mobile le drag tue l'auto-scroll, et même un tap rapide peut déclencher un touchmove parasite.

## Plan

**Objectif** : ignorer les événements `wheel` / `touchmove` qui originent de l'`AudioPlayer`, pour que le scrub puisse re-engager auto-follow sans être immédiatement annulé.

### Étapes

1. **`src/components/AudioPlayer.tsx`** — ajouter `data-audio-player` sur le conteneur fixed (ligne ~113) :
   ```tsx
   <div data-audio-player ... className="fixed left-0 right-0 ...">
   ```

2. **`src/pages/Reader.tsx`** (lignes 416-424) — filtrer les handlers globaux :
   ```ts
   const isFromAudioPlayer = (e: Event) =>
     (e.target as HTMLElement | null)?.closest?.('[data-audio-player]') != null;
   const onWheel = (e: Event) => { if (!isFromAudioPlayer(e)) disengageAutoScroll(); };
   const onTouchMove = (e: Event) => { if (!isFromAudioPlayer(e)) disengageAutoScroll(); };
   ```

3. **Vérification** : sur mobile, tap/drag sur la barre audio → texte glisse en douceur jusqu'à la phrase correspondante (via l'animation `animateScrollToTarget` déjà en place). Le scroll manuel sur le texte continue de désactiver l'auto-follow comme avant.

### Détails techniques

- `handleAudioScrub` reste tel quel : il sait déjà ré-engager auto-follow et appeler `queueSentenceScroll`.
- Le `Slider` Radix appelle bien `onValueChange` aussi bien sur click que sur drag → `onScrub` se déclenche dans les deux cas.
- Aucune autre logique modifiée (highlight de phrase, pill "Follow audio", etc.).

### Variantes envisagées

- **A. Filtrage par `data-audio-player`** (recommandé, ci-dessus) — minimal, ciblé, n'impacte pas le reste.
- **B. `e.stopPropagation()` sur le wrapper de l'AudioPlayer** — plus brutal, peut casser des handlers Radix internes (drag).
- **C. Flag `scrubbingRef` armé sur `pointerdown` du slider, désarmé sur `pointerup`** — plus de code, équivalent fonctionnellement.

Je pars sur **A** sauf objection.