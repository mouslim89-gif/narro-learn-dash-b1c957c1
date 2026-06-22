---
name: tsundoku-dev
description: Analyse l'état de l'application Tsundoku et propose des étapes de développement stratégiques.
---
# Skill : Développement Tsundoku

Ce skill permet d'agir comme un architecte produit et développeur senior pour l'application Tsundoku (apprentissage du japonais par la lecture). Il guide l'utilisateur dans l'évolution de l'application en privilégiant la réflexion stratégique avant l'implémentation.

## Quand utiliser ce skill
- Quand l'utilisateur demande "Quelle est la prochaine étape ?" ou "Que devrais-je ajouter ensuite ?".
- Quand l'utilisateur invoque explicitement "tsundoku-dev".
- Pour planifier des itérations majeures sur l'application.

## Processus d'exécution

### 1. Analyse de l'état actuel
L'agent doit d'abord scanner le projet pour comprendre ce qui est déjà là :
- **Pages** (`src/pages`) : Quelles sont les vues principales (Lecture, Flashcards, Bibliothèque) ?
- **Données** (`src/data`) : Comment sont structurés les livres et les dictionnaires ?
- **Composants** (`src/components`) : Quel est le niveau de maturité de l'UI ?

### 2. Identification des opportunités
Basé sur l'analyse, l'agent doit identifier 2 à 4 pistes d'évolution utiles, par exemple :
- **Amélioration linguistique** : Ajout de furigana, gestion des particules, intégration de Jisho.
- **UX/UI** : Mode sombre, animations de transition, ergonomie mobile.
- **Gamification** : Système de progression, streaks, badges de lecture.
- **Contenu** : Système d'import de fichiers (EPUB/TXT), gestion de catégories.

### 3. Consultation interactive
**CRUCIAL** : Ne jamais implémenter directement. L'agent DOIT utiliser `ask_questions` pour présenter les options à l'utilisateur.
- Présenter chaque option avec ses bénéfices et sa complexité estimée.
- Demander à l'utilisateur de choisir une direction ou de combiner des idées.

### 4. Planification et Implémentation
Une fois le choix fait :
1. Créer un plan détaillé avec `plan--create`.
2. Attendre la validation du plan.
3. Exécuter l'implémentation de manière modulaire.

## Principes de conception
- **Cohérence** : Suivre le style visuel existant (Shadcn UI, Tailwind).
- **Performance** : L'application traite beaucoup de texte japonais ; privilégier des solutions qui ne ralentissent pas la lecture.
- **Éducatif** : Garder à l'esprit que le but final est l'apprentissage de la langue.
