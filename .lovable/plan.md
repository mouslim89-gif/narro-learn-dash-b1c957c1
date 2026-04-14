## Améliorations de l'application Yomimasu

Voici un ensemble d'améliorations UX et fonctionnelles cohérentes pour rendre l'app plus agréable et utile.

---

### 1. Recherche de mots depuis le Reader

Quand l'utilisateur tape un mot dans le Reader (WordPopup), ajouter un bouton "Search in Dictionary" qui navigue vers `/dictionary?q=mot`. Ça connecte mieux les deux features.

**Fichier** : modifier `src/components/WordPopup.tsx` — ajouter un lien vers le dictionnaire.

---

### 2. Statistiques de lecture améliorées (My Books)

Remplacer les stats basiques