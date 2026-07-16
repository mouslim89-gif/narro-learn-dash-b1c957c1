## Remove the orange `section-bullet` bars

Ces petites barres verticales amber viennent de la classe `.section-bullet` (définie dans `src/index.css`). On la supprime partout et on interdit sa réutilisation.

### Changes

1. **`src/pages/Library.tsx`** — enlever le `<span className="section-bullet" />` devant chaque titre de rail (section Fiction, Folk Tales, etc.). Le layout du titre redevient un simple `<h3>` + count, plus propre.
2. **`src/components/library/ContinueHero.tsx`** — enlever le `<span className="section-bullet" />` devant le label "Continue Reading". Le petit label uppercase reste seul, ce qui est déjà suffisant visuellement.
3. **`src/index.css`** — supprimer la définition de `.section-bullet` (lignes ~501+) pour qu'elle ne puisse plus être réutilisée par erreur.
4. **`CLAUDE.md`** — retirer les mentions de `.section-bullet` de la doc (ligne 190 et l'exemple ligne 270) pour qu'aucune future itération ne la ressuscite.

### Memory

Ajouter une **constraint** dans `mem://constraints/no-section-bullet` + une ligne Core dans `mem://index.md` :
> Never use amber vertical accent bars (ex-`.section-bullet`) before section titles or labels. Rejected by user as visually poor. Section labels stand alone.

### Hors scope
Aucun autre changement visuel, aucune modif du header, des cards, ou de la logique.
