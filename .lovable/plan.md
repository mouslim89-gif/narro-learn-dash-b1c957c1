# Replace gray tap feedback with warm amber accent

Le feedback au clic/maintien (`active:bg-*`) utilise actuellement du gris (`bg-accent/10`, `bg-foreground/10`, etc.), ce qui rend l'app monotone. On le remplace par un overlay **ambré** basé sur `--accent` à **~17% d'opacité** (`/17` arrondi à `/15` côté Tailwind pour rester sur des paliers standards, ou `/[0.17]` pour exact).

## Changements

### 1. `src/components/ui/button.tsx`
Mettre à jour les `active:` de chaque variante :
- `default` : `active:bg-primary/85` → garde primary (déjà coloré, OK) **ou** `active:bg-[hsl(var(--accent)/0.85)]` si on veut uniformiser. **Décision : garder primary** (déjà coloré, pas concerné par "monotone").
- `destructive` : garder rouge (déjà coloré).
- `outline` : `active:bg-accent/10` → `active:bg-[hsl(var(--accent)/0.17)]`
- `secondary` : `active:bg-secondary/70` → `active:bg-[hsl(var(--accent)/0.17)]`
- `ghost` : `active:bg-foreground/10` → `active:bg-[hsl(var(--accent)/0.17)]`
- `link` : inchangé (opacity)

### 2. `src/index.css` — utilitaires globaux
- `.tap-scale-sm:active` : `background-color: hsl(var(--foreground) / 0.08)` → `hsl(var(--accent) / 0.17)`
- `.press-flash::after` : radial gradient `hsl(var(--foreground) / 0.08)` → `hsl(var(--accent) / 0.20)`

### 3. Mode sombre
`--accent` en dark = `36 76% 50%` (un peu plus saturé) — l'overlay à 17% reste lisible sans surcharge. Pas de surcharge `.dark` nécessaire.

## Hors scope
- Les boutons `primary`/`destructive` qui ont déjà une couleur active distincte restent inchangés.
- Les hovers (desktop) ne sont pas modifiés — l'app est mobile-first, seul `active:` compte.
- Pas de changement sur les Sheets, Dialogs, ou inputs.

## Vérification
Tester sur Reader (boutons chrome), BottomNav, Settings (rows ghost), Flashcards (SrsButtons outline) — le tap doit flasher en ambré chaud, plus en gris.