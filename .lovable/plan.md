## Reader header — long titles

Le titre est tronqué (`走れ…`) mais le bouton `flex-1` continue de pousser les chips à droite, donc visuellement les boutons frôlent le titre et il n'y a aucun moyen de voir le titre complet.

### Changes (Reader.tsx header only)

1. **Empêcher tout débordement visuel**
   - Sur le bouton du titre : garder `flex-1 min-w-0 truncate` mais réduire `px-2` → `px-1.5` et ajouter `mx-1` pour garantir un gap stable avec les chips de droite (au lieu de dépendre uniquement de `gap-2`).
   - La rangée garde `gap-2` et la hauteur reste fixe — aucun changement de taille de header.

2. **Voir le titre complet au tap**
   - Le tap sur le titre ouvre déjà le Popover "Reading level". Ajouter, en haut du `PopoverContent`, le **titre complet** sur plusieurs lignes :
     ```
     <p className="font-japanese text-sm font-bold text-center px-2 pt-1 max-w-[260px] break-words">
       {book.titleJp}
     </p>
     ```
   - Placé au-dessus du label "Reading level" existant, séparé par une fine `border-b border-border/40 pb-2` (uniquement quand le titre est tronqué ? non — on l'affiche tout le temps, c'est cohérent et règle aussi le cas où l'utilisateur veut juste confirmer le titre).

3. **Aucun autre changement** : pas de modif des chips, du sticky header, du padding du header, ni des autres pages.

### Files touched
- `src/pages/Reader.tsx` (header block lignes ~914-950 uniquement)

### Result
- Header hauteur fixe, gap stable, boutons ne sont plus collés au titre.
- Tap sur le titre (déjà l'action existante pour changer de niveau) → popover affiche maintenant le titre complet en entête, puis le sélecteur de niveau en dessous.