## Améliorations de l'application Yomimasu

Voici un ensemble d'améliorations UX et fonctionnelles cohérentes pour rendre l'app plus agréable et utile.

---

### 1. Recherche de mots depuis le Reader

Quand l'utilisateur tape un mot dans le Reader (WordPopup), ajouter un bouton "Search in Dictionary" qui navigue vers `/dictionary?q=mot`. Ça connecte mieux les deux features.

**Fichier** : modifier `src/components/WordPopup.tsx` — ajouter un lien vers le dictionnaire.

---

### 2. Statistiques de lecture améliorées (My Books)

Remplacer les stats basiques par des stats plus motivantes :
- **Mots lus estimés** (basé sur le nombre de tokens × progression)
- **Streak visuel** avec un calendrier de points (style GitHub contributions)
- Animations des chiffres au chargement

---

### 3. Conjugation Table dans le Dictionary ✅

Ajout du composant `ConjugationTable` dans les résultats du dictionnaire pour afficher les conjugaisons des verbes et adjectifs.

---

### 4. Dark Mode global ✅

Toggle dark/light dans la Library, état persisté dans le store, classe `dark` appliquée sur `<html>`.
